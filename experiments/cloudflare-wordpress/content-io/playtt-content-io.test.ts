import assert from 'node:assert/strict';
import test from 'node:test';
import { createHash, randomUUID } from 'node:crypto';
import { setImmediate as turn } from 'node:timers/promises';
import { createCanonicalRestorePack, type RestorePackContents } from '../src/canonical-restore-pack.js';
import { createContentOverlay, readContentOverlay, MAX_CONTENT_DELTA_BYTES, type OverlayManifest } from '../src/playtt-content-overlay.js';

const root = 'sites/default', groups = ['markdown', 'uploads', 'wpContent'] as const;
const prefix = { markdown: 'markdown', uploads: 'uploads', wpContent: 'wp-content' };
const sha = (b: Uint8Array) => createHash('sha256').update(b).digest('hex');
const enc = (s: string) => new TextEncoder().encode(s);
const deferred = () => { let resolve!: () => void; const promise = new Promise<void>(r => { resolve = r; }); return { promise, resolve }; };
const until = async (predicate: () => boolean) => { for (let i = 0; i < 500 && !predicate(); i++) await turn(); assert.ok(predicate(), 'Work did not reach the expected boundary'); };

async function fixture(count = 12, size?: number) {
  const data = new Map<string, Uint8Array>();
  const baseline: RestorePackContents = { markdown: [], uploads: [], wpContent: [], wpContentDeleted: [] };
  const current = structuredClone(baseline);
  for (let i = 0; i < count; i++) {
    const g = groups[i % 3], path = (g === 'wpContent' ? 'themes/test/' : '') + i + '.txt';
    baseline[g].push({ path, bytes: enc('before-' + i) });
    const bytes = size === undefined ? enc('繁中🙂\tchanged-' + i) : new Uint8Array(size).fill(i);
    current[g].push({ path, bytes });
  }
  const manifest = (c: RestorePackContents): OverlayManifest => {
    const revision = randomUUID();
    const files = (g: typeof groups[number]) => c[g].map(f => {
      const hash = sha(f.bytes), objectKey = `${root}/${prefix[g]}/objects/${hash}`;
      data.set(objectKey, f.bytes);
      return { path: f.path, sha256: hash, size: f.bytes.length, objectKey };
    });
    return { revision, manifestKey: `${root}/markdown/revisions/${revision}.json`, persistedAt: new Date().toISOString(), files: files('markdown'), uploads: files('uploads'), wpContent: files('wpContent'), wpContentDeleted: [] };
  };
  const base = manifest(baseline), next = manifest(current), pack = await createCanonicalRestorePack(root, baseline);
  base.restorePack = pack.metadata; data.set(pack.metadata.objectKey, pack.bytes); data.set(base.manifestKey, enc(JSON.stringify(base)));
  const bucket = { async get(key: string) { const bytes = data.get(key); return bytes === undefined ? null : { size: bytes.length, arrayBuffer: async () => Uint8Array.from(bytes).buffer }; } };
  next.restorePack = (await createContentOverlay(bucket, root, next, base))!;
  const changedKeys = new Set([...next.files, ...next.uploads!, ...next.wpContent!].map(f => f.objectKey));
  return { data, base, next, current, bucket, changedKeys };
}

function controlled(f: Awaited<ReturnType<typeof fixture>>) {
  const started: string[] = [], finished: string[] = [], gates = new Map<string, ReturnType<typeof deferred>>();
  let active = 0, peak = 0, corrupt: string | undefined, rejectGet: string | undefined, rejectBody: string | undefined;
  const bucket = { async get(key: string) {
    if (!f.changedKeys.has(key)) return f.bucket.get(key);
    started.push(key); active++; peak = Math.max(peak, active);
    const gate = deferred(); gates.set(key, gate); const bytes = f.data.get(key)!;
    // Keep the get alive for one turn to cover both asynchronous bucket errors
    // and bodies that remain open after a successful get.
    await turn();
    if (rejectGet === key) { active--; finished.push(key); throw Error('Synthetic get failure'); }
    return { size: bytes.length, arrayBuffer: async () => {
      try {
        await gate.promise;
        if (rejectBody === key) throw Error('Synthetic body failure');
        return (corrupt === key ? Uint8Array.from(bytes, b => b ^ 1) : Uint8Array.from(bytes)).buffer;
      } finally { active--; finished.push(key); }
    } };
  } };
  return { bucket, started, finished, gates, get active() { return active; }, get peak() { return peak; },
    corrupt: (key: string) => { corrupt = key; }, rejectGet: (key: string) => { rejectGet = key; }, rejectBody: (key: string) => { rejectBody = key; } };
}

for (const phase of ['write', 'read'] as const) {
  const invoke = (f: Awaited<ReturnType<typeof fixture>>, bucket = f.bucket) => phase === 'write'
    ? createContentOverlay(bucket, root, f.next, f.base) : readContentOverlay(bucket, root, f.next);

  test(`${phase}: four active reads include body consumption; reverse completion retains exact ordered content`, async () => {
    const f = await fixture(), c = controlled(f); let settled = false;
    const pending = invoke(f, c.bucket).finally(() => { settled = true; });
    for (let batch = 0; batch < 3; batch++) {
      await until(() => c.started.length === (batch + 1) * 4);
      assert.equal(c.active, 4); assert.equal(settled, false);
      const current = c.started.slice(batch * 4, (batch + 1) * 4).reverse();
      for (const key of current) c.gates.get(key)!.resolve();
    }
    const result = await pending;
    assert.equal(c.active, 0); assert.equal(c.peak, 4); assert.equal(c.started.length, 12);
    assert.equal(new Set(c.started).size, 12); assert.equal(c.finished.length, 12);
    if (phase === 'read') assert.deepEqual((result as Awaited<ReturnType<typeof readContentOverlay>>).contents, f.current);
    else assert.deepEqual(result, f.next.restorePack);
  });

  for (const fault of ['hash', 'get', 'body'] as const) test(`${phase}: ${fault} failure stops new work and drains started reads before rejection`, async () => {
    const f = await fixture(), c = controlled(f); let settled = false;
    const pending = invoke(f, c.bucket).then(value => ({ value, error: undefined }), error => ({ error })).finally(() => { settled = true; });
    await until(() => c.started.length === 4);
    const failedKey = c.started[0];
    if (fault === 'hash') c.corrupt(failedKey);
    if (fault === 'get') c.rejectGet(failedKey);
    if (fault === 'body') c.rejectBody(failedKey);
    c.gates.get(failedKey)!.resolve();
    await until(() => c.finished.includes(failedKey));
    // Hashing can finish in a later crypto task; leave ample event-loop turns.
    for (let i = 0; i < 20; i++) await turn();
    assert.equal(settled, false); assert.equal(c.started.length, 4); assert.equal(c.active, 3);
    for (const key of c.started.slice(1)) c.gates.get(key)!.resolve();
    const outcome = await pending; assert.ok(outcome.error);
    assert.match(outcome.error.message, fault === 'hash' ? /hash mismatch/ : /Synthetic/);
    assert.equal(c.active, 0); assert.equal(c.finished.length, 4); assert.equal(c.started.length, 4);
    for (let i = 0; i < 5; i++) await turn();
    assert.equal(c.started.length, 4, 'Detached work started after rejection');
  });
}

test('64 replacements at exactly 1 MiB preserve the byte bound and inventory across every group', async () => {
  const f = await fixture(64, MAX_CONTENT_DELTA_BYTES / 64);
  let calls = 0, bytes = 0;
  const bucket = { async get(key: string) { if (f.changedKeys.has(key)) { calls++; bytes += f.data.get(key)!.length; } return f.bucket.get(key); } };
  assert.deepEqual(await createContentOverlay(bucket, root, f.next, f.base), f.next.restorePack);
  assert.equal(calls, 64); assert.equal(bytes, MAX_CONTENT_DELTA_BYTES);
  calls = 0; bytes = 0;
  assert.deepEqual((await readContentOverlay(bucket, root, f.next)).contents, f.current);
  assert.equal(calls, 64); assert.equal(bytes, MAX_CONTENT_DELTA_BYTES);
});

test('empty replacement set neither schedules reads nor changes tombstones or zero-file semantics', async () => {
  const f = await fixture(0); assert.equal(f.changedKeys.size, 0);
  assert.deepEqual(await createContentOverlay(f.bucket, root, f.next, f.base), f.next.restorePack);
  assert.deepEqual((await readContentOverlay(f.bucket, root, f.next)).contents, f.current);
});
