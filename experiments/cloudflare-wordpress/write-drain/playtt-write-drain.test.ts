import assert from 'node:assert/strict';
import test from 'node:test';
import { PlayttStorageBudget, withPlayttStorageCapacity, PlayttCapacityError, type PlayttCapacityEnv } from '../src/playtt-storage-capacity.js';
import { WRITE_PROOF_SCHEMA, WRITE_SETTLED_SCHEMA, MAX_PENDING_WRITES } from '../src/playtt-write-drain.js';
import { WordPressStateCoordinator, DurableObjectRevisionCoordinator } from '../src/state-coordinator.js';

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>(done => { resolve = done; });
  return { promise, resolve };
}
function storage() {
  const values = new Map<string, unknown>();
  const api = {
    async get<T>(key: string) { return structuredClone(values.get(key)) as T | undefined; },
    async put(key: string, value: unknown) { values.set(key, structuredClone(value)); },
    async delete(key: string) { return values.delete(key); },
    async transaction<T>(fn: (tx: typeof api) => Promise<T>) {
      const before = structuredClone(values);
      try { return await fn(api); } catch (error) { values.clear(); for (const [k, v] of before) values.set(k, v); throw error; }
    },
  };
  return { values, api: api as unknown as DurableObjectStorage };
}
function fixture(tracking = true) {
  const st = storage(), data = new Map<string, string>(), events: string[] = [];
  let paused = false, failPut = false, loseReserve = false, loseSettle = false, dropSettle = false;
  const entered = deferred(), completed = deferred();
  const raw = {
    async list() { return { objects: [], truncated: false }; },
    async head() { return null; },
    async get(key: string) { return data.has(key) ? { json: async () => JSON.parse(data.get(key)!) } : null; },
    async put(key: string, value: string) {
      events.push('put-enter'); entered.resolve();
      if (paused) await completed.promise;
      data.set(key, value); events.push('put-settled');
      if (failPut) throw new Error('Ambiguous R2 reply after write');
      return { key };
    },
    async delete(keys: string | string[]) {
      events.push('delete-enter'); entered.resolve();
      if (paused) await completed.promise;
      for (const key of typeof keys === 'string' ? [keys] : keys) data.delete(key);
      events.push('delete-settled');
    },
  } as unknown as R2Bucket;
  const env: PlayttCapacityEnv = { WORDPRESS_STATE_BUCKET: raw, PLAYTT_R2_CAPACITY_SCOPE: 'playtt-wordpress-pin-restore-audit', PLAYTT_R2_CAPACITY_LIMIT_BYTES: '1000000', ...(tracking ? { PLAYTT_R2_WRITE_TRACKING: 'v1' } : {}) };
  let budget: PlayttStorageBudget;
  env.PLAYTT_STORAGE_BUDGET = { getByName: () => ({ fetch: async (url: string, options?: RequestInit) => {
    if (dropSettle && url.endsWith('/tracking/settle')) throw new Error('Request lost before settlement');
    const response = await budget.fetch(new Request(url, options));
    if ((loseReserve && url.endsWith('/reserve')) || (loseSettle && url.endsWith('/tracking/settle'))) throw new Error('Lost response');
    return response;
  } }) } as unknown as DurableObjectNamespace;
  const restart = () => { budget = new PlayttStorageBudget({ storage: st.api } as DurableObjectState, env); };
  restart();
  const call = (path: string, body: unknown = {}) => budget.fetch(new Request('https://budget.invalid' + path, { method: 'POST', body: JSON.stringify(body) }));
  const status = async () => (await budget.fetch(new Request('https://budget.invalid/status'))).json() as Promise<any>;
  return { st, data, env, raw, events, call, status, restart, entered, completed,
    bucket: withPlayttStorageCapacity(env).WORDPRESS_STATE_BUCKET,
    pause: () => { paused = true; }, fail: () => { failPut = true; }, loseReserve: () => { loseReserve = true; }, loseSettle: () => { loseSettle = true; }, dropSettle: () => { dropSettle = true; },
    async initialize() { assert.equal((await call('/initialize')).status, 200); if (tracking) assert.equal((await call('/tracking/initialize')).status, 200); },
  };
}
const reserve = (f: ReturnType<typeof fixture>, bytes = 1, kind: 'put' | 'delete' = 'put') => f.call('/reserve', { schema: WRITE_PROOF_SCHEMA, kind, bytes, limitBytes: 1000000 });

test('legacy capacity reservation and expired canonical lease do not prove R2 writes drained', async () => {
  const f = fixture(false); await f.initialize(); f.pause();
  const cs = storage(), coordinator = new WordPressStateCoordinator({ storage: cs.api } as DurableObjectState, f.env);
  const client = new DurableObjectRevisionCoordinator({ fetch: (request: Request) => coordinator.fetch(request) } as DurableObjectStub, 'default');
  const lease = await client.acquire();
  const pending = f.bucket.put('sites/default/late.zip', 'late'); await f.entered.promise;
  const record = cs.values.get('wordpress-state-coordinator') as any;
  record.lease.expiresAt = Date.now() - 1; // Deterministic expiry, not a wall-clock sleep.
  const fence = await client.acquireFence(30000);
  assert.equal((await client.fenceStatus()).active, true);
  assert.equal(f.data.has('sites/default/late.zip'), false);
  f.completed.resolve(); await pending;
  assert.equal(f.data.get('sites/default/late.zip'), 'late');
  await assert.rejects(client.commit(lease, { revision: 'late', manifestKey: 'sites/default/markdown/revisions/late.json', persistedAt: new Date().toISOString() }));
  assert.equal((await client.state()).version, 0);
  await client.releaseFence(fence.token);
});

test('pending put survives a budget restart; seal waits for actual R2 completion', async () => {
  const f = fixture(); await f.initialize(); f.pause();
  const pending = f.bucket.put('sites/default/a', 'abc'); await f.entered.promise;
  f.restart(); assert.equal((await f.status()).writeTracking.pending, 1);
  const token = crypto.randomUUID(); assert.equal((await f.call('/tracking/acquire', { token })).status, 409);
  f.completed.resolve(); await pending;
  assert.equal((await f.status()).writeTracking.pending, 0);
  assert.equal((await f.call('/tracking/acquire', { token })).status, 200);
  await assert.rejects(f.bucket.put('sites/default/b', 'blocked'), PlayttCapacityError);
  assert.equal(f.data.has('sites/default/b'), false);
});

test('a delayed delete is tracked without charging bytes or put count; a seal blocks deletion', async () => {
  const f = fixture(); await f.initialize(); f.data.set('sites/default/a', 'a'); f.pause();
  const deleting = f.bucket.delete('sites/default/a'); await f.entered.promise;
  assert.equal((await f.status()).writeTracking.pending, 1);
  assert.equal((await f.call('/tracking/acquire', { token: crypto.randomUUID() })).status, 409);
  f.completed.resolve(); await deleting;
  const s = await f.status(); assert.equal(s.chargedBytes, 0); assert.equal(s.chargedPuts, 0);
  const token = crypto.randomUUID(); await f.call('/tracking/acquire', { token });
  f.data.set('sites/default/b', 'preserve'); await assert.rejects(f.bucket.delete('sites/default/b'), PlayttCapacityError);
  assert.equal(f.data.get('sites/default/b'), 'preserve');
});

test('failed R2 response retains its ticket even if the provider applied the write', async () => {
  const f = fixture(); await f.initialize(); f.fail();
  await assert.rejects(f.bucket.put('sites/default/a', 'saved'), /Ambiguous/);
  assert.equal(f.data.get('sites/default/a'), 'saved'); f.restart();
  assert.equal((await f.status()).writeTracking.pending, 1);
  assert.equal((await f.call('/tracking/acquire', { token: crypto.randomUUID() })).status, 409);
});

test('lost reservation reply leaves an unsettled ticket and sends no R2 request', async () => {
  const f = fixture(); await f.initialize(); f.loseReserve();
  await assert.rejects(f.bucket.put('sites/default/a', 'value'), PlayttCapacityError);
  assert.deepEqual(f.events, []); assert.equal((await f.status()).writeTracking.pending, 1);
  assert.equal((await f.call('/tracking/acquire', { token: crypto.randomUUID() })).status, 409);
});

test('lost settlement reply preserves confirmed R2 success and an already closed ticket does not obstruct the seal', async () => {
  const f = fixture(); await f.initialize(); f.loseSettle();
  await f.bucket.put('sites/default/a', 'saved');
  assert.equal(f.data.get('sites/default/a'), 'saved'); assert.equal((await f.status()).writeTracking.pending, 0);
  assert.equal((await f.call('/tracking/acquire', { token: crypto.randomUUID() })).status, 200);
});

test('tracking must be initialized and cannot be disabled by dropping the environment flag', async () => {
  const f = fixture(); await f.call('/initialize');
  await assert.rejects(f.bucket.put('sites/default/a', 'a'), PlayttCapacityError);
  await f.call('/tracking/initialize');
  delete f.env.PLAYTT_R2_WRITE_TRACKING; f.restart();
  const legacy = withPlayttStorageCapacity(f.env).WORDPRESS_STATE_BUCKET;
  await assert.rejects(legacy.put('sites/default/a', 'a'), PlayttCapacityError);
  await assert.rejects(legacy.delete('sites/default/a'), PlayttCapacityError);
  assert.deepEqual(f.events, []);
});

test('persistent seals do not expire; exact acquisition retries and owner release are safe', async () => {
  const f = fixture(); await f.initialize(); const token = crypto.randomUUID();
  assert.equal((await f.call('/tracking/acquire', { token })).status, 200);
  const ledger = [...f.st.values.values()][0] as any; ledger.writeTracking.drain.acquiredAt = '2000-01-01T00:00:00Z'; f.restart();
  assert.equal((await f.call('/tracking/acquire', { token })).status, 200);
  assert.equal((await f.call('/tracking/release', { token: crypto.randomUUID() })).status, 409);
  await assert.rejects(f.bucket.put('sites/default/a', 'a'), PlayttCapacityError);
  const publicStatus = JSON.stringify(await f.status()); assert.equal(publicStatus.includes(token), false);
  assert.equal((await f.call('/tracking/release', { token })).status, 200);
  await f.bucket.put('sites/default/a', 'a'); assert.equal((await f.status()).writeTracking.pending, 0);
});

test('settlement is ticket-specific and idempotent; an unrelated UUID cannot clear another operation', async () => {
  const f = fixture(); await f.initialize(); const proof = await (await reserve(f)).json() as any;
  assert.equal(proof.schema, WRITE_PROOF_SCHEMA);
  await f.call('/tracking/settle', { ticket: crypto.randomUUID() }); assert.equal((await f.status()).writeTracking.pending, 1);
  for (let i = 0; i < 2; i++) {
    const reply = await (await f.call('/tracking/settle', { ticket: proof.ticket })).json() as any;
    assert.equal(reply.schema, WRITE_SETTLED_SCHEMA); assert.equal(reply.ticket, proof.ticket);
  }
  assert.equal((await f.status()).writeTracking.pending, 0);
});

test('pending operations are bounded and never expire merely because their timestamps are old', async () => {
  const f = fixture(); await f.initialize();
  for (let i = 0; i < MAX_PENDING_WRITES; i++) assert.equal((await reserve(f)).status, 200);
  const ledger = [...f.st.values.values()][0] as any; for (const item of ledger.writeTracking.pending) item.startedAt = '2000-01-01T00:00:00Z';
  f.restart(); assert.equal((await reserve(f)).status, 503);
  assert.equal((await f.status()).chargedPuts, MAX_PENDING_WRITES);
  assert.equal((await f.call('/tracking/acquire', { token: crypto.randomUUID() })).status, 409);
});

test('reservation capacity failure rolls back both charge and tentative ticket', async () => {
  const f = fixture(); await f.initialize(); const before = await f.status();
  assert.equal((await reserve(f, 1000001)).status, 507);
  assert.deepEqual(await f.status(), before);
});

test('an early parallel-write failure cannot hide a still-running sibling from a drain', async () => {
  const f = fixture(); await f.initialize(); f.pause();
  const pending = f.bucket.put('sites/default/delayed', 'payload'); await f.entered.promise;
  await assert.rejects(Promise.all([pending, Promise.reject(new Error('Sibling failed'))]), /Sibling failed/);
  assert.equal((await f.call('/tracking/acquire', { token: crypto.randomUUID() })).status, 409);
  f.completed.resolve(); await pending;
  assert.equal((await f.call('/tracking/acquire', { token: crypto.randomUUID() })).status, 200);
});

test('corrupt tracking cannot be reinitialized or bypassed with legacy requests', async () => {
  const f = fixture(); await f.initialize(); const ledger = [...f.st.values.values()][0] as any; ledger.writeTracking = null;
  f.restart(); assert.equal((await f.call('/tracking/initialize')).status, 503);
  assert.equal((await f.call('/reserve', { bytes: 1, limitBytes: 1000000 })).status, 503);
  assert.equal((await f.status()).code, 'playtt_write_drain');
});


test('lost settlement request cannot strand an already written canonical pointer outside its DO commit', async () => {
  const f = fixture(); await f.initialize(); f.dropSettle();
  const cs = storage(), coordinator = new WordPressStateCoordinator({ storage: cs.api } as DurableObjectState, f.env);
  const client = new DurableObjectRevisionCoordinator({ fetch: (request: Request) => coordinator.fetch(request) } as DurableObjectStub, 'default');
  const lease = await client.acquire();
  const pointer = { revision: crypto.randomUUID(), manifestKey: 'sites/default/markdown/revisions/proof.json', persistedAt: new Date().toISOString() };
  const committed = await client.commit(lease, pointer);
  assert.equal(committed.version, 1); assert.deepEqual((await client.state()).pointer, pointer);
  assert.deepEqual(JSON.parse(f.data.get('sites/default/markdown/current.json')!), pointer);
  f.restart(); assert.equal((await f.status()).writeTracking.pending, 1);
  assert.equal((await f.call('/tracking/acquire', { token: crypto.randomUUID() })).status, 409);
});

test('a confirmed conditional put miss settles its ticket while retaining the conservative charge', async () => {
  const f = fixture(); await f.initialize();
  f.raw.put = (async () => null) as R2Bucket['put'];
  assert.equal(await f.bucket.put('sites/default/existing', 'abc', { onlyIf: { etagDoesNotMatch: '*' } }), null);
  const s = await f.status(); assert.equal(s.writeTracking.pending, 0); assert.equal(s.chargedBytes, 3); assert.equal(s.chargedPuts, 1);
  assert.equal((await f.call('/tracking/acquire', { token: crypto.randomUUID() })).status, 200);
});

test('tracked callers reject old, missing-ticket and wrong-operation proofs before R2', async () => {
  for (const proof of [
    { schema: 'playtt/r2-capacity-reservation/v1', reserved: true, bytes: 3, limitBytes: 1000000 },
    { schema: WRITE_PROOF_SCHEMA, reserved: true, bytes: 3, limitBytes: 1000000, kind: 'put' },
    { schema: WRITE_PROOF_SCHEMA, reserved: true, bytes: 3, limitBytes: 1000000, kind: 'delete', ticket: crypto.randomUUID() },
  ]) {
    const f = fixture(); await f.initialize();
    f.env.PLAYTT_STORAGE_BUDGET = { getByName: () => ({ fetch: async () => Response.json(proof) }) } as unknown as DurableObjectNamespace;
    await assert.rejects(f.bucket.put('sites/default/a', 'abc'), PlayttCapacityError);
    assert.deepEqual(f.events, []);
  }
});
