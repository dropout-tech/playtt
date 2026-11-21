import assert from 'node:assert/strict';
import test from 'node:test';
import {PlayttStorageBudget, withPlayttStorageCapacity, PlayttCapacityError, type PlayttCapacityEnv} from '../src/playtt-storage-capacity.js';
import {WordPressStateCoordinator, DurableObjectRevisionCoordinator} from '../src/state-coordinator.js';

function storage(values = new Map<string, unknown>()) {
  const api = {
    async get<T>(key: string) { return structuredClone(values.get(key)) as T | undefined; },
    async put(key: string, value: unknown) { values.set(key, structuredClone(value)); },
    async delete(key: string) { return values.delete(key); },
    async transaction<T>(fn: (tx: typeof api) => Promise<T>) {
      const before = structuredClone(values);
      try { return await fn(api); } catch (e) { values.clear(); for (const [k, v] of before) values.set(k, v); throw e; }
    },
  };
  return {values, api: api as unknown as DurableObjectStorage};
}

function fixture(limit = 100) {
  const data = new Map<string, string>(), st = storage(), writes: string[] = [];
  let failPut = false, loseReservationResponse = false;
  const raw = {
    async list() { return { objects: [...data].map(([key, value]) => ({key, size: new TextEncoder().encode(value).length, storageClass: 'Standard'})), truncated: false }; },
    async get(key: string) { const v = data.get(key); return v === undefined ? null : {json: async () => JSON.parse(v), text: async () => v}; },
    async head(key: string) { return data.has(key) ? {size: data.get(key)!.length} : null; },
    async delete(key: string) { data.delete(key); },
    async put(key: string, value: string, opts?: R2PutOptions) {
      writes.push(key);
      if (opts?.onlyIf && data.has(key)) return null;
      data.set(key, typeof value === 'string' ? value : 'bytes');
      if (failPut) throw new Error('Simulated connection loss after write');
      return {key};
    },
  } as unknown as R2Bucket;
  const env = {WORDPRESS_STATE_BUCKET: raw, PLAYTT_R2_CAPACITY_SCOPE: 'playtt-wordpress-rebuild-audit', PLAYTT_R2_CAPACITY_LIMIT_BYTES: String(limit)} as PlayttCapacityEnv;
  let actor: PlayttStorageBudget;
  const stub = {async fetch(url: string | Request, init?: RequestInit) {
    const r = await actor.fetch(url instanceof Request ? url : new Request(url, init));
    if (loseReservationResponse && String(url).endsWith('/reserve')) throw new Error('Simulated lost budget response');
    return r;
  }} as unknown as DurableObjectStub;
  env.PLAYTT_STORAGE_BUDGET = {getByName: () => stub} as unknown as DurableObjectNamespace;
  const restart = () => { actor = new PlayttStorageBudget({storage: st.api} as DurableObjectState, env); };
  restart();
  const call = (path: string, body?: unknown) => stub.fetch('https://playtt-capacity.invalid/' + path, body === undefined ? undefined : {method: 'POST', body: JSON.stringify(body)});
  const initialize = () => call('initialize', {});
  const status = async () => (await call('status')).json() as Promise<{initialized: boolean; baselineBytes: number; chargedBytes: number; chargedPuts: number; remainingBytes: number}>;
  return {data, st, raw, env, writes, restart, call, initialize, status, bucket: withPlayttStorageCapacity(env).WORDPRESS_STATE_BUCKET,
    failPut() {failPut = true;}, loseResponse() {loseReservationResponse = true;}};
}

test('uninitialized or corrupt ledger rejects writes before touching R2', async () => {
  const f = fixture();
  await assert.rejects(f.bucket.put('sites/default/a', 'abc'), PlayttCapacityError);
  assert.equal(f.writes.length, 0);
  await f.initialize();
  const [key, value] = [...f.st.values][0]; f.st.values.set(key, {...value as object, chargedBytes: -1});
  await assert.rejects(f.bucket.put('sites/default/a', 'abc'), PlayttCapacityError);
  assert.equal(f.writes.length, 0);
});

test('concurrent writers share a durable bound and UTF-8 bytes, not characters', async () => {
  const f = fixture(10); f.data.set('runtime/base', '1234'); await f.initialize();
  const results = await Promise.allSettled([f.bucket.put('sites/default/a', '繁中'), f.bucket.put('sites/default/b', 'x')]);
  assert.equal(results.filter(r => r.status === 'fulfilled').length, 1);
  assert.equal(f.writes.length, 1);
  assert.deepEqual(await f.status(), {...await f.status(), baselineBytes: 4, chargedBytes: 6, chargedPuts: 1, remainingBytes: 0});
  f.restart(); assert.equal((await f.status()).chargedBytes, 6);
  assert.equal((await f.call('reserve', {bytes: 1, limitBytes: 10})).status, 507);
});

test('ambiguous R2 failure, overwritten bytes, conditional miss and delete never refund', async () => {
  const f = fixture(100); await f.initialize();
  await f.bucket.put('sites/default/a', '1234');
  assert.equal(await f.bucket.put('sites/default/a', 'abc', {onlyIf: {etagDoesNotMatch: '*'}}), null);
  await f.bucket.put('sites/default/a', 'xy');
  await f.bucket.delete('sites/default/a');
  f.failPut(); await assert.rejects(f.bucket.put('sites/default/b', '12345'));
  f.restart(); const s = await f.status(); assert.equal(s.chargedBytes, 14); assert.equal(s.chargedPuts, 4);
  assert.equal(f.data.get('sites/default/b'), '12345');
});

test('lost reservation response leaves charge but never starts the R2 write', async () => {
  const f = fixture(); await f.initialize(); f.loseResponse();
  await assert.rejects(f.bucket.put('sites/default/a', '123'));
  f.restart(); assert.equal((await f.status()).chargedBytes, 3); assert.equal(f.writes.length, 0);
});

test('unknown streams, multipart and cross-site paths cannot bypass allocation', async () => {
  const f = fixture(); await f.initialize();
  await assert.rejects(f.bucket.put('sites/default/a', new ReadableStream()), PlayttCapacityError);
  await assert.rejects(f.bucket.createMultipartUpload('sites/default/a'), PlayttCapacityError);
  assert.throws(() => f.bucket.resumeMultipartUpload('sites/default/a', 'upload'), PlayttCapacityError);
  await assert.rejects(f.bucket.put('sites/other/a', 'x'), PlayttCapacityError);
  assert.equal(f.writes.length, 0); assert.equal((await f.status()).chargedPuts, 0);
});

test('initialization paginates even short pages and never overwrites an existing ledger', async () => {
  const f = fixture(); let calls = 0;
  f.raw.list = (async () => ++calls === 1 ? {objects: [{key: 'a', size: 20, storageClass: 'Standard'}], truncated: true, cursor: 'next'} : {objects: [{key: 'b', size: 30, storageClass: 'Standard'}], truncated: false}) as R2Bucket['list'];
  assert.equal((await f.initialize()).status, 200); assert.equal((await f.status()).baselineBytes, 50);
  await f.bucket.put('sites/default/a', 'x'); await f.initialize(); assert.equal(calls, 2); assert.equal((await f.status()).chargedBytes, 1);
});

test('failed or looping inventory never enables writes; malformed configuration fails closed', async () => {
  for (const mode of ['failed', 'loop', 'infrequent']) {
    const f = fixture();
    f.raw.list = (async () => {
      if (mode === 'failed') throw Error('list failed');
      return {objects: mode === 'infrequent' ? [{key:'a',size:1,storageClass:'InfrequentAccess'}] : [], truncated: mode === 'loop', cursor:'same'};
    }) as R2Bucket['list'];
    assert.equal((await f.initialize()).status, 503); assert.equal((await f.status()).initialized, false);
  }
  const f = fixture(); assert.throws(() => withPlayttStorageCapacity({...f.env, PLAYTT_R2_CAPACITY_LIMIT_BYTES: 'NaN'}), PlayttCapacityError);
  assert.throws(() => withPlayttStorageCapacity({...f.env, PLAYTT_R2_CAPACITY_SCOPE: 'other-bucket'}), PlayttCapacityError);
});

test('coordinator capacity refusal preserves current pointer, version and receipt; subsequent release works', async () => {
  const f = fixture(1000);
  const old = {revision:'old',manifestKey:'sites/default/markdown/revisions/old.json',persistedAt:'2026-11-20T00:00:00Z'};
  f.data.set('sites/default/markdown/current.json', JSON.stringify(old)); await f.initialize();
  const coordinator = new WordPressStateCoordinator({storage: storage().api} as DurableObjectState, f.env);
  const stub = {fetch: (request: Request) => coordinator.fetch(request)} as DurableObjectStub;
  const c = new DurableObjectRevisionCoordinator(stub, 'default');
  const before = await c.state(), lease = await c.acquire();
  f.env.PLAYTT_R2_CAPACITY_LIMIT_BYTES = '1';
  await assert.rejects(c.commit(lease, {...old, revision:'new'}), (e: unknown) => e instanceof PlayttCapacityError && e.status === 507);
  assert.deepEqual(await c.state(), before); assert.equal(await c.committed(1), null);
  assert.equal(f.data.get('sites/default/markdown/current.json'), JSON.stringify(old));
  await c.abort(lease); const next = await c.acquire(); await c.release(next);
});

test('disabled deployments keep their original bucket and repeated wrapping cannot double-charge', async () => {
  const f = fixture();
  assert.equal(withPlayttStorageCapacity({WORDPRESS_STATE_BUCKET:f.raw}).WORDPRESS_STATE_BUCKET, f.raw);
  await f.initialize(); const once = withPlayttStorageCapacity(f.env), twice = withPlayttStorageCapacity(once);
  assert.equal(once, twice); await twice.WORDPRESS_STATE_BUCKET.put('sites/default/a', '123');
  assert.equal((await f.status()).chargedBytes, 3); assert.equal((await f.status()).chargedPuts, 1);
});

test('mixed deployment limits use the smaller value; old clients cannot omit their bound', async () => {
  const f = fixture(100); await f.initialize();
  assert.equal((await f.call('reserve', {bytes: 1})).status, 503);
  assert.equal((await f.call('reserve', {bytes: 20, limitBytes: 10})).status, 507);
  assert.equal((await f.call('reserve', {bytes: 101, limitBytes: 1000})).status, 507);
  const r=await f.call('reserve', {bytes: 9, limitBytes: 10});assert.equal(r.status,200);
  assert.equal((await r.json() as {limitBytes:number}).limitBytes,10);
  assert.equal((await f.status()).chargedBytes,9);
});

test('legacy, wrong-byte and overly permissive reservation replies never reach R2', async () => {
  for (const proof of [{reserved:true,bytes:3}, {schema:'playtt/r2-capacity-reservation/v1',reserved:true,bytes:4,limitBytes:100}, {schema:'playtt/r2-capacity-reservation/v1',reserved:true,bytes:3,limitBytes:101}]) {
    const f=fixture(100);
    f.env.PLAYTT_STORAGE_BUDGET={getByName:()=>({fetch:async()=>Response.json(proof)})} as unknown as DurableObjectNamespace;
    await assert.rejects(withPlayttStorageCapacity(f.env).WORDPRESS_STATE_BUCKET.put('sites/default/a','123'),PlayttCapacityError);
    assert.equal(f.writes.length,0);
  }
});
