import assert from 'node:assert/strict';
import test from 'node:test';
import { createHash } from 'node:crypto';
import { PlayttBackupPins, backupPinInput } from '../src/playtt-backup-pins.js';
import { WordPressStateCoordinator, DurableObjectRevisionCoordinator } from '../src/state-coordinator.js';

const hash = (v: string | Uint8Array) => createHash('sha256').update(v).digest('hex');
function fixture() {
  const data = new Map<string, Uint8Array>(), values = new Map<string, unknown>(), gets: string[] = [];
  let failAfterPut = false, onGet = async () => {};
  const storage = {
    get: async (k: string) => structuredClone(values.get(k)),
    put: async (k: string, v: unknown) => { values.set(k, structuredClone(v)); if (failAfterPut) { failAfterPut = false; throw new Error('Lost acknowledgement'); } },
    delete: async (k: string) => values.delete(k),
  } as unknown as DurableObjectStorage;
  const bucket = {
    get: async (k: string) => {
      gets.push(k); await onGet(); const bytes = data.get(k);
      return !bytes ? null : { size: bytes.length, body: new Blob([bytes as Uint8Array<ArrayBuffer>]).stream() };
    },
    put: () => { throw new Error('Registration must not write R2'); },
    delete: () => { throw new Error('Registration must not delete R2'); },
    list: () => { throw new Error('No full-bucket listing for a pin'); },
    head: () => { throw new Error('Content hashes must not rely on metadata alone'); },
  } as unknown as R2Bucket;
  const add = (n = 1) => {
    const revision = `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
    const pack = new TextEncoder().encode('pack bytes ' + n), packSha256 = hash(pack), packKey = `sites/default/restore-packs/${packSha256}.zip`;
    const manifestKey = `sites/default/markdown/revisions/${revision}.json`, persistedAt = '2026-11-20T03:00:00.000Z';
    const manifest = new TextEncoder().encode(JSON.stringify({ revision, manifestKey, persistedAt,
      restorePack: { schema: 'wp-codebox/cloudflare-canonical-restore-pack/v1', objectKey: packKey, sha256: packSha256, size: pack.length } }));
    data.set(manifestKey, manifest); data.set(packKey, pack);
    return { revision, manifestKey, persistedAt, manifestSha256: hash(manifest), packKey, packSha256, packBytes: pack.length };
  };
  const pins = () => new PlayttBackupPins(storage, bucket);
  return { data, values, gets, storage, bucket, add, pins, loseAck: () => { failAfterPut = true; }, onGet: (f: () => Promise<void>) => { onGet = f; } };
}
const fence = () => {};

test('verified immutable pin survives restart; exact retry after lost acknowledgement is idempotent', async () => {
  const f = fixture(), input = f.add(); f.loseAck();
  await assert.rejects(f.pins().register(input, fence));
  assert.equal((await f.pins().list()).generation, 1);
  const retry = await f.pins().register(input, fence);
  assert.equal(retry.created, false); assert.equal(retry.generation, 1); assert.equal(f.gets.length, 2);
  await assert.rejects(f.pins().register({ ...input, manifestSha256: 'a'.repeat(64) }, fence));
  assert.equal((await f.pins().list()).generation, 1);
});

test('remote manifest and complete archive hashes are checked before protection is recorded', async () => {
  for (const which of ['manifest', 'pack', 'missing']) {
    const f = fixture(), input = f.add();
    if (which === 'missing') f.data.delete(input.packKey);
    else f.data.set(which === 'manifest' ? input.manifestKey : input.packKey, new TextEncoder().encode('corruption'));
    await assert.rejects(f.pins().register(input, fence)); assert.equal((await f.pins().list()).pins.length, 0);
  }
});

test('invalid namespace, time, identity and oversized input cannot trigger R2 reads', async () => {
  const f = fixture(), input = f.add();
  for (const bad of [null, { ...input, revision: '../x' }, { ...input, packKey: input.packKey.replace('default', 'other') },
    { ...input, persistedAt: '2026-11-20' }, { ...input, packBytes: 8 * 1024 * 1024 + 1 }, { ...input, packBytes: -1 }]) {
    await assert.rejects(f.pins().register(bad, fence));
  }
  assert.equal(f.gets.length, 0);
});

test('expired or lost fence before or during I/O cannot register a pin', async () => {
  const f = fixture(), input = f.add(); let valid = false;
  const requireFence = () => { assert.ok(valid, 'fence expired'); };
  await assert.rejects(f.pins().register(input, requireFence)); assert.equal(f.gets.length, 0);
  valid = true; f.onGet(async () => { valid = false; });
  await assert.rejects(f.pins().register(input, requireFence)); assert.equal((await f.pins().list()).pins.length, 0);
});

test('corrupt registry is never silently replaced with an empty list', async () => {
  for (const corrupt of [null, {}, { schema: 'playtt/backup-pins/v1', generation: 1, pins: [] }]) {
    const f = fixture(); f.values.set('playtt-backup-pins-v1', corrupt);
    await assert.rejects(f.pins().list()); await assert.rejects(f.pins().register(f.add(), fence)); assert.equal(f.gets.length, 0);
  }
});

test('declared object size is enforced while streaming, not after an unlimited buffer', async () => {
  const f = fixture(), input = f.add();
  f.bucket.get = (async () => ({ size: 1, body: new Blob(['larger']).stream() })) as R2Bucket['get'];
  await assert.rejects(f.pins().register(input, fence)); assert.equal((await f.pins().list()).pins.length, 0);
});

test('a matching manifest hash cannot bind a different pack or revision', async () => {
  const f = fixture(), input = f.add(), manifest = JSON.parse(new TextDecoder().decode(f.data.get(input.manifestKey)));
  manifest.restorePack.objectKey = 'sites/other/restore-packs/invalid.zip';
  const changed = new TextEncoder().encode(JSON.stringify(manifest)); f.data.set(input.manifestKey, changed);
  await assert.rejects(f.pins().register({ ...input, manifestSha256: hash(changed) }, fence));
  assert.equal((await f.pins().list()).pins.length, 0);
});

test('coordinator serializes registration and fence release; wrong-token writes and other sites are rejected', async () => {
  const f = fixture(), input = f.add(), input2 = f.add(2);
  const env = { WORDPRESS_STATE_BUCKET: f.bucket, PLAYTT_R2_CAPACITY_SCOPE: 'playtt-wordpress-rebuild-audit',
    PLAYTT_R2_CAPACITY_LIMIT_BYTES: '1000000000', PLAYTT_STORAGE_BUDGET: {} as DurableObjectNamespace };
  let actor = new WordPressStateCoordinator({ storage: f.storage } as DurableObjectState, env);
  const stub = { fetch: (r: Request) => actor.fetch(r) } as DurableObjectStub;
  const c = new DurableObjectRevisionCoordinator(stub, 'default');
  const before = await c.state(), owned = await c.acquireFence(600000);
  await assert.rejects(c.pinBackup(input, 'wrong-token')); assert.equal((await c.backupPins()).generation, 0);
  let entered!: () => void, unblock!: () => void;
  const seen = new Promise<void>(r => { entered = r; }), blocked = new Promise<void>(r => { unblock = r; });
  f.onGet(async () => { entered(); await blocked; });
  const registering = c.pinBackup(input, owned.token); await seen;
  let released = false;
  const releasing = c.releaseFence(owned.token).then(() => { released = true; });
  await Promise.resolve(); assert.equal(released, false); unblock();
  await registering; await releasing; f.onGet(async () => {});
  await assert.rejects(c.pinBackup(input2, owned.token));
  assert.deepEqual(await c.state(), before);
  actor = new WordPressStateCoordinator({ storage: f.storage } as DurableObjectState, env);
  assert.equal((await c.backupPins()).generation, 1);
  await assert.rejects(new DurableObjectRevisionCoordinator(stub, 'other').backupPins());
});

test('concurrent pins under the same fence retain both entries without advancing canonical state', async () => {
  const f = fixture(), env = { WORDPRESS_STATE_BUCKET: f.bucket, PLAYTT_R2_CAPACITY_SCOPE: 'playtt-wordpress-rebuild-audit',
    PLAYTT_R2_CAPACITY_LIMIT_BYTES: '1000000000', PLAYTT_STORAGE_BUDGET: {} as DurableObjectNamespace };
  const actor = new WordPressStateCoordinator({ storage: f.storage } as DurableObjectState, env);
  const c = new DurableObjectRevisionCoordinator({ fetch: (r: Request) => actor.fetch(r) } as DurableObjectStub, 'default');
  const owned = await c.acquireFence(600000);
  await Promise.all([c.pinBackup(f.add(), owned.token), c.pinBackup(f.add(2), owned.token)]);
  assert.equal((await c.backupPins()).generation, 2); assert.equal((await c.state()).version, 0);
  await c.releaseFence(owned.token);
});

test('input normalization retains only immutable identity fields', () => {
  const f = fixture(), input = f.add();
  assert.deepEqual(backupPinInput({ ...input, localPath: 'private', cookies: 'private' }), input);
});
