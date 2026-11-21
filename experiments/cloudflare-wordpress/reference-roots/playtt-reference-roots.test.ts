import assert from 'node:assert/strict';
import test from 'node:test';
import { readCoordinatorReferenceRoots, MAX_REFERENCE_RECEIPTS } from '../src/playtt-reference-roots.js';
import { WordPressStateCoordinator, DurableObjectRevisionCoordinator } from '../src/state-coordinator.js';

const recordKey = 'wordpress-state-coordinator', prefix = 'wordpress-state-commit/';
const point = (n: number) => ({ revision: `12345678-1234-4234-8234-${String(n).padStart(12, '0')}`, manifestKey: `sites/default/markdown/revisions/12345678-1234-4234-8234-${String(n).padStart(12, '0')}.json`, persistedAt: '2026-11-20T00:00:00Z' });
function fixture(count = 3) {
  const values = new Map<string, any>([[recordKey, { initialized: true, siteId: 'default', pointer: count ? point(count) : null, version: count }]]);
  for (let n = 1; n <= count; n++) values.set(prefix + n, point(n));
  let writes = 0, lists = 0;
  const api = {
    async get(key: string) { return structuredClone(values.get(key)); },
    async list(options: { prefix: string; limit: number; startAfter?: string }) {
      lists++;
      return new Map([...values].filter(([key]) => key.startsWith(options.prefix) && (!options.startAfter || key > options.startAfter)).sort(([a], [b]) => a < b ? -1 : 1).slice(0, options.limit).map(([k,v]) => [k, structuredClone(v)]));
    },
    async put(key: string, value: unknown) { writes++; values.set(key, structuredClone(value)); },
  } as unknown as DurableObjectStorage;
  return { values, api, counts: () => ({ writes, lists }) };
}

test('all commit receipts are exported across lexicographic pages and numerically ordered without writes', async () => {
  const f = fixture(260), before = structuredClone(f.values);
  const roots = await readCoordinatorReferenceRoots(f.api, 'default');
  assert.equal(roots.commitReceipts.length, 260); assert.equal(roots.completeCommitListing, true);
  assert.deepEqual(roots.commitReceipts.map(r => r.version), Array.from({length: 260}, (_, i) => i + 1));
  assert.deepEqual(roots.pointer, point(260)); assert.equal(roots.safeToApply, false);
  assert.deepEqual(f.counts(), { writes: 0, lists: 3 }); assert.deepEqual(f.values, before);
});

test('expired lease roots are preserved while tokens and unrelated private storage fields are omitted', async () => {
  const f = fixture(), token = crypto.randomUUID(), fenceToken = crypto.randomUUID();
  const raw = f.values.get(recordKey); raw.lease = { token, base: point(1), version: 1, expiresAt: 1 };
  raw.fence = { token: fenceToken, expiresAt: 1 }; raw.secret = 'must-not-leak';
  f.values.get(prefix + 1).privateContent = 'must-not-leak';
  const before = structuredClone(f.values), roots = await readCoordinatorReferenceRoots(f.api, 'default', 2);
  assert.equal(roots.lease?.active, false); assert.deepEqual(roots.lease?.base, point(1));
  assert.equal(roots.fence?.active, false);
  for (const value of [token, fenceToken, 'must-not-leak']) assert.equal(JSON.stringify(roots).includes(value), false);
  assert.deepEqual(f.values, before); assert.equal(f.counts().writes, 0);
});

test('uninitialized storage is not lazily created and another site is rejected', async () => {
  const f = fixture(0); f.values.clear();
  await assert.rejects(readCoordinatorReferenceRoots(f.api, 'default'));
  await assert.rejects(readCoordinatorReferenceRoots(f.api, 'other'));
  assert.deepEqual(f.counts(), { writes: 0, lists: 0 });
});

test('missing or mismatched current receipt cannot masquerade as a complete inventory', async () => {
  for (const mode of ['missing', 'mismatch', 'unreceipted-current']) {
    const f = fixture();
    if (mode === 'missing') f.values.delete(prefix + 3);
    if (mode === 'mismatch') f.values.set(prefix + 3, point(2));
    if (mode === 'unreceipted-current') f.values.get(recordKey).version = 0;
    await assert.rejects(readCoordinatorReferenceRoots(f.api, 'default'));
  }
});

test('malformed receipt paths, versions and cross-site pointers fail closed', async () => {
  for (const mode of ['leading-zero', 'non-numeric', 'cross-site', 'bad-date', 'unsafe-version']) {
    const f = fixture();
    if (mode === 'leading-zero') f.values.set(prefix + '01', point(1));
    if (mode === 'non-numeric') f.values.set(prefix + 'extra', point(1));
    if (mode === 'cross-site') f.values.get(prefix + 1).manifestKey = point(1).manifestKey.replace('default', 'another');
    if (mode === 'bad-date') f.values.get(prefix + 1).persistedAt = 'not-a-date';
    if (mode === 'unsafe-version') f.values.set(prefix + '9007199254740992', point(1));
    await assert.rejects(readCoordinatorReferenceRoots(f.api, 'default'));
  }
});

test('history limit or a non-progressing storage page refuses partial success', async () => {
  const large = fixture(MAX_REFERENCE_RECEIPTS + 1);
  await assert.rejects(readCoordinatorReferenceRoots(large.api, 'default'));
  const f = fixture(128), first = await f.api.list({ prefix, limit: 128 });
  f.api.list = async () => first;
  await assert.rejects(readCoordinatorReferenceRoots(f.api, 'default'));
});

test('empty initialized coordinator is inspectable and historical forward receipts remain visible', async () => {
  const f = fixture(0); f.values.set(prefix + 99, point(99));
  const roots = await readCoordinatorReferenceRoots(f.api, 'default');
  assert.equal(roots.pointer, null); assert.deepEqual(roots.commitReceipts, [{ version: 99, pointer: point(99) }]);
});

test('internal endpoint enforces method/scope and the existing queue prevents a concurrent lease mutation', async () => {
  const f = fixture(); let release!: () => void, entered!: () => void;
  const blocked = new Promise<void>(r => { release = r; }), started = new Promise<void>(r => { entered = r; });
  const list = f.api.list.bind(f.api); f.api.list = async options => { entered(); await blocked; return list(options); };
  const unexpected = async () => { throw new Error('Reference inventory must not access R2'); };
  const env = { WORDPRESS_STATE_BUCKET: { head: unexpected, get: unexpected, list: unexpected } as unknown as R2Bucket, PLAYTT_R2_CAPACITY_SCOPE: 'playtt-wordpress-pin-restore-audit', PLAYTT_R2_CAPACITY_LIMIT_BYTES: '300000000', PLAYTT_STORAGE_BUDGET: {} as DurableObjectNamespace };
  const coordinator = new WordPressStateCoordinator({ storage: f.api } as DurableObjectState, env);
  const client = new DurableObjectRevisionCoordinator({ fetch: (r: Request) => coordinator.fetch(r) } as DurableObjectStub, 'default');
  const auditing = client.referenceRoots(); await started;
  let acquired = false; const acquiring = client.acquire().then(r => { acquired = true; return r; });
  await Promise.resolve(); assert.equal(acquired, false); assert.equal(f.counts().writes, 0);
  release(); const roots = await auditing; assert.equal(roots.lease, null);
  await acquiring; assert.equal(f.counts().writes, 1);
  assert.equal((await coordinator.fetch(new Request('https://internal/?__wp_codebox_coordinator=reference-roots', { method: 'POST' }))).status, 405);
  assert.equal((await coordinator.fetch(new Request('https://internal/?__wp_codebox_coordinator=reference-roots&siteId=other'))).status, 404);
});
