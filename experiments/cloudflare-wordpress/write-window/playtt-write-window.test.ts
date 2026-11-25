import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { validateWriteTracking as oldValidator, newWriteTracking as oldTracking } from './fixtures/playtt-write-drain-v1.js';
import { PlayttStorageBudget, PlayttCapacityError, withPlayttStorageCapacity, playttWriteWindowAdmission, type PlayttCapacityEnv } from '../src/playtt-storage-capacity.js';
import { WRITE_PROOF_SCHEMA, validateWriteTracking } from '../src/playtt-write-drain.js';
import { WINDOW_PROOF_SCHEMA, WINDOW_TRACKING_SCHEMA, MAX_WINDOW_BYTES, MAX_WINDOW_OPERATIONS } from '../src/playtt-write-window.js';

const KEY = 'playtt-r2-capacity-ledger-v1';
function deferred() { let resolve!: () => void; const promise = new Promise<void>(r => resolve = r); return { promise, resolve }; }
function fixture() {
  const values = new Map<string, any>(), data = new Map<string, string>(), calls: string[] = [];
  const storage = {
    async get(key: string) { return structuredClone(values.get(key)); },
    async put(key: string, value: unknown) { values.set(key, structuredClone(value)); },
    async transaction<T>(fn: (tx: typeof storage) => Promise<T>) {
      const before = structuredClone(values);
      try { return await fn(storage); } catch (e) { values.clear(); for (const [k,v] of before) values.set(k,v); throw e; }
    },
  };
  let now = Date.now(), paused = false, ambiguous = false, dropSettle = false;
  let intercept: ((path: string, response: Response) => Promise<Response>) | undefined;
  const entered = deferred(), done = deferred();
  const raw = {
    async list() { return { objects: [], truncated: false }; }, async head() { return null; }, async get() { return null; },
    async put(key: string, value: string) { calls.push('put'); entered.resolve(); if (paused) await done.promise; data.set(key,value); if (ambiguous) throw Error('R2 outcome unknown'); return {key}; },
    async delete(key: string | string[]) { calls.push('delete'); entered.resolve(); if (paused) await done.promise; for (const k of typeof key === 'string' ? [key] : key) data.delete(k); if (ambiguous) throw Error('R2 outcome unknown'); },
  } as unknown as R2Bucket;
  const env: PlayttCapacityEnv = { WORDPRESS_STATE_BUCKET: raw, PLAYTT_R2_CAPACITY_SCOPE:'playtt-wordpress-pin-restore-audit', PLAYTT_R2_CAPACITY_LIMIT_BYTES:'1000000', PLAYTT_R2_WRITE_TRACKING:'v1', PLAYTT_R2_WRITE_WINDOW:'v1' };
  let budget: PlayttStorageBudget;
  env.PLAYTT_STORAGE_BUDGET = { getByName: () => ({ fetch: async (url: string, init?: RequestInit) => {
    const path = new URL(url).pathname;
    if (dropSettle && path === '/tracking/settle') throw Error('Settlement request lost');
    const response = await budget.fetch(new Request(url,init)); return intercept ? intercept(path,response) : response;
  } }) } as unknown as DurableObjectNamespace;
  const restart = () => { budget = new PlayttStorageBudget({storage} as unknown as DurableObjectState, env, () => now); }; restart();
  const call = (path: string, body?: unknown) => budget.fetch(new Request('https://local.invalid'+path, body === undefined ? {} : {method:'POST',body:JSON.stringify(body)}));
  const status = async () => (await call('/status')).json() as Promise<any>;
  const owner = crypto.randomUUID(), drain = crypto.randomUUID();
  const input = { token:owner, previousToken:null, durationSeconds:60, maxBytes:100, maxOperations:10, drainToken:drain };
  const reserve = (bytes = 1, kind = 'put', schema = WINDOW_PROOF_SCHEMA, limitBytes = 1000000) => call('/reserve',{bytes,kind,schema,limitBytes});
  return {env,values,data,calls,entered,done,owner,drain,input,call,status,restart,reserve,
    bucket:withPlayttStorageCapacity(env).WORDPRESS_STATE_BUCKET,
    clock:(value: number)=>{now=value;}, advance:(value: number)=>{now+=value;}, pause:()=>{paused=true;}, ambiguous:()=>{ambiguous=true;}, dropSettle:()=>{dropSettle=true;}, intercept:(fn:typeof intercept)=>{intercept=fn;},
    async initialize() { assert.equal((await call('/initialize',{})).status,200); assert.equal((await call('/tracking/initialize',{})).status,200); },
    async arm(overrides = {}) { assert.equal((await call('/tracking/acquire',{token:drain})).status,200); assert.equal((await call('/window/arm',{...input,...overrides})).status,200); },
    async release() { assert.equal((await call('/tracking/release',{token:drain})).status,200); },
    async start(overrides = {}) { await this.initialize(); await this.arm(overrides); await this.release(); },
  };
}
const windowError = (e: unknown) => e instanceof PlayttCapacityError && e.status === 503 && e.reason === 'window';

test('configured but unarmed backend refuses PHP admission, put and delete without charge',async()=>{
  const f=fixture(); await f.initialize();
  await assert.rejects(playttWriteWindowAdmission(f.env),windowError);
  await assert.rejects(f.bucket.put('sites/default/a','abc'),windowError);
  await assert.rejects(f.bucket.delete('sites/default/a'),windowError);
  assert.deepEqual(f.calls,[]); assert.equal((await f.status()).chargedBytes,0); assert.equal((await f.status()).writeTracking.pending,0);
});
test('arm requires the exact owned seal and stays sealed until separately released',async()=>{
  const f=fixture(); await f.initialize();
  assert.equal((await f.call('/window/arm',f.input)).status,409);
  await f.call('/tracking/acquire',{token:f.drain});
  assert.equal((await f.call('/window/arm',{...f.input,drainToken:crypto.randomUUID()})).status,409);
  await f.arm(); assert.equal((await f.status()).writeTracking.sealed,true);
  await assert.rejects(playttWriteWindowAdmission(f.env),windowError);
  await assert.rejects(f.bucket.put('sites/default/a','abc'),PlayttCapacityError);
  await f.release(); await playttWriteWindowAdmission(f.env); await f.bucket.put('sites/default/a','abc');
  assert.equal((await f.status()).chargedBytes,3);
});
test('exact arm retry never extends deadline, resets charge or reopens closed window',async()=>{
  const f=fixture(); await f.start(); await f.bucket.put('sites/default/a','abc');
  await f.call('/window/close',{token:f.owner}); await f.call('/tracking/acquire',{token:f.drain});
  const before=(await f.status()).writeTracking.window; f.advance(120000);
  assert.equal((await f.call('/window/arm',f.input)).status,200);
  const after=(await f.status()).writeTracking.window;
  assert.equal(after.expiresAt,before.expiresAt); assert.equal(after.usedBytes,3); assert.equal(after.operations,1); assert.equal(after.closed,true);
  assert.equal((await f.call('/window/arm',{...f.input,maxBytes:99})).status,409);
});
test('window has hard duration, byte, operation and overall capacity bounds',async()=>{
  for (const invalid of [{durationSeconds:901},{durationSeconds:0},{durationSeconds:1.5},{maxBytes:MAX_WINDOW_BYTES+1},{maxBytes:1000001},{maxOperations:MAX_WINDOW_OPERATIONS+1},{maxOperations:0},{token:'bad'},{previousToken:undefined}]) {
    const f=fixture(); await f.initialize(); await f.call('/tracking/acquire',{token:f.drain});
    assert.equal((await f.call('/window/arm',{...f.input,...invalid})).status,503);
    assert.equal((await f.status()).writeTracking.window,undefined);
  }
});
test('at the exact deadline new admissions and mutations are denied without changing ledger',async()=>{
  const f=fixture(); await f.start(); await f.bucket.put('sites/default/a','abc');
  const before=structuredClone(f.values.get(KEY)); f.clock(before.writeTracking.window.expiresAt);
  await assert.rejects(playttWriteWindowAdmission(f.env),windowError);
  await assert.rejects(f.bucket.put('sites/default/b','x'),windowError); await assert.rejects(f.bucket.delete('sites/default/a'),windowError);
  assert.deepEqual(f.values.get(KEY),before); assert.equal(f.data.get('sites/default/a'),'abc');
  const s=await f.status(); assert.equal(s.writeTracking.window.expired,true); assert.equal(s.writeTracking.sealed,false);
});
test('a clock before the stored opening time fails closed',async()=>{
  const f=fixture(); await f.start(); f.clock(f.values.get(KEY).writeTracking.window.openedAt-1);
  assert.equal((await f.reserve()).status,503); assert.equal((await f.call('/window/admission')).status,503);
});
test('byte allowance includes failed writes and cannot be bypassed with zero-byte deletion',async()=>{
  const f=fixture(); await f.start({maxBytes:3}); f.ambiguous(); await assert.rejects(f.bucket.put('sites/default/a','abc'));
  await assert.rejects(f.bucket.delete('sites/default/a'),windowError);
  assert.equal((await f.status()).chargedBytes,3); assert.equal((await f.status()).writeTracking.pending,1);
});
test('operation allowance counts deletes and zero-byte puts; concurrent reservations are serialized',async()=>{
  const f=fixture(); await f.start({maxOperations:2});
  const responses=await Promise.all([f.reserve(0,'delete'),f.reserve(0),f.reserve(0,'delete')]);
  assert.deepEqual(responses.map(r=>r.status),[200,200,503]);
  const s=await f.status(); assert.equal(s.chargedBytes,0); assert.equal(s.writeTracking.window.operations,2); assert.equal(s.writeTracking.pending,2);
});
test('global or window capacity denial rolls back operation ticket and allowance atomically',async()=>{
  const f=fixture(); await f.start(); const before=structuredClone(f.values.get(KEY));
  assert.equal((await f.reserve(101)).status,503); assert.deepEqual(f.values.get(KEY),before);
  assert.equal((await f.reserve(11,'put',WINDOW_PROOF_SCHEMA,10)).status,507); assert.deepEqual(f.values.get(KEY),before);
});
test('window v2 persists over restart and configuration removal; old caller cannot bypass it',async()=>{
  const f=fixture(); await f.start(); f.advance(60000); delete f.env.PLAYTT_R2_WRITE_WINDOW; f.restart();
  assert.equal((await f.reserve(1,'put',WRITE_PROOF_SCHEMA)).status,503);
  assert.equal((await f.reserve()).status,503); assert.equal(f.values.get(KEY).writeTracking.schema,WINDOW_TRACKING_SCHEMA);
  const oldClient=withPlayttStorageCapacity({...f.env}).WORDPRESS_STATE_BUCKET;
  await assert.rejects(oldClient.put('sites/default/a','a'),PlayttCapacityError); assert.deepEqual(f.calls,[]);
});
test('expired window does not settle or erase an already dispatched R2 operation',async()=>{
  const f=fixture(); await f.start(); f.pause(); const writing=f.bucket.put('sites/default/a','abc'); await f.entered.promise;
  f.advance(60000); f.restart(); assert.equal((await f.status()).writeTracking.pending,1);
  assert.equal((await f.call('/tracking/acquire',{token:f.drain})).status,409);
  await f.call('/window/close',{token:f.owner}); assert.equal((await f.status()).writeTracking.pending,1);
  f.done.resolve(); await writing;
  assert.equal((await f.status()).writeTracking.pending,0); assert.equal((await f.status()).chargedBytes,3); assert.equal(f.data.get('sites/default/a'),'abc');
});
test('ambiguous R2 failure stays pending across expiry, close and restart; rearming forbidden',async()=>{
  const f=fixture(); await f.start(); f.ambiguous(); await assert.rejects(f.bucket.put('sites/default/a','abc'));
  f.advance(60000); await f.call('/window/close',{token:f.owner}); f.restart();
  assert.equal((await f.status()).writeTracking.pending,1); assert.equal((await f.call('/tracking/acquire',{token:f.drain})).status,409);
  assert.equal((await f.call('/window/arm',{...f.input,token:crypto.randomUUID(),previousToken:f.owner})).status,409);
});
for(const kind of ['put','delete'] as const) test(`expired valid ${kind} reservation is acknowledged only because R2 was never dispatched`,async()=>{
  const f=fixture(); f.clock(Date.now()-10000); await f.start({durationSeconds:5});
  await assert.rejects(kind==='put'?f.bucket.put('sites/default/a','abc'):f.bucket.delete('sites/default/a'),windowError);
  assert.deepEqual(f.calls,[]); const s=await f.status(); assert.equal(s.writeTracking.pending,0); assert.equal(s.writeTracking.window.operations,1); assert.equal(s.chargedBytes,kind==='put'?3:0);
});
test('lost no-dispatch acknowledgement retains pending ticket without any R2 call or refund',async()=>{
  const f=fixture(); f.clock(Date.now()-10000); await f.start({durationSeconds:5}); f.dropSettle();
  await assert.rejects(f.bucket.put('sites/default/a','abc'),windowError); assert.deepEqual(f.calls,[]);
  assert.equal((await f.status()).writeTracking.pending,1); assert.equal((await f.status()).chargedBytes,3);
});
test('lost reservation response never authorizes R2 or settlement',async()=>{
  const f=fixture(); await f.start(); f.intercept(async(path,r)=>{if(path==='/reserve')throw Error('reply lost');return r;});
  await assert.rejects(f.bucket.put('sites/default/a','abc'),PlayttCapacityError);
  assert.deepEqual(f.calls,[]); assert.equal((await f.status()).writeTracking.pending,1);
});
test('malformed or older reservation proofs fail closed and leave durable ticket untouched',async()=>{
  for(const change of [{schema:WRITE_PROOF_SCHEMA},{windowId:'bad'},{openedAt:0},{expiresAt:Date.now()+10000000},{kind:'delete'},{ticket:'bad'}]) {
    const f=fixture(); await f.start(); f.intercept(async(path,r)=>path==='/reserve'?Response.json({...await r.json() as any,...change}):r);
    await assert.rejects(f.bucket.put('sites/default/a','abc'),PlayttCapacityError); assert.deepEqual(f.calls,[]); assert.equal((await f.status()).writeTracking.pending,1);
  }
});
test('admission refuses malformed, stale, future or lost proof; absent flag has no admission calls',async()=>{
  for(const change of [{schema:'old'},{allowed:false},{windowId:'bad'},{openedAt:Date.now()-20000,expiresAt:Date.now()-10000},{openedAt:Date.now()+10000,expiresAt:Date.now()+20000}]) {
    const f=fixture(); await f.start(); f.intercept(async(path,r)=>path==='/window/admission'?Response.json({...await r.json() as any,...change}):r);
    await assert.rejects(playttWriteWindowAdmission(f.env),PlayttCapacityError);
  }
  const f=fixture(); await f.start(); f.intercept(async()=>{throw Error('lost');}); await assert.rejects(playttWriteWindowAdmission(f.env),PlayttCapacityError);
  delete f.env.PLAYTT_R2_WRITE_WINDOW; await playttWriteWindowAdmission(f.env);
});
test('new window requires previous identity and fresh owned seal; old owner cannot close it',async()=>{
  const f=fixture(); await f.start(); await f.bucket.put('sites/default/a','abc');
  const next={...f.input,token:crypto.randomUUID(),previousToken:f.owner};
  assert.equal((await f.call('/window/arm',next)).status,409); await f.call('/tracking/acquire',{token:f.drain});
  assert.equal((await f.call('/window/arm',{...next,previousToken:null})).status,409);
  assert.equal((await f.call('/window/arm',next)).status,200);
  let s=await f.status(); assert.equal(s.chargedBytes,3); assert.equal(s.writeTracking.window.usedBytes,0); assert.equal(s.writeTracking.window.operations,0);
  assert.equal((await f.call('/window/close',{token:f.owner})).status,409);
  await f.release(); await f.bucket.put('sites/default/b','d'); s=await f.status(); assert.equal(s.chargedBytes,4); assert.equal(s.writeTracking.window.usedBytes,1);
});
test('status never exposes window owner, drain owner or pending ticket identities',async()=>{
  const f=fixture(); await f.start(); const p=await (await f.reserve()).json() as any;
  const text=JSON.stringify(await f.status()); for(const value of [f.owner,f.drain,p.ticket]) assert.equal(text.includes(value),false);
  assert.equal((await f.status()).writeTracking.window.pendingOperationsExpire,false);
});
test('corrupted v2 window or a window hidden under v1 cannot be used',async()=>{
  const f=fixture(); await f.start(); const tracking=f.values.get(KEY).writeTracking;
  for(const changed of [{...tracking,window:undefined},{...tracking,schema:'playtt/r2-write-tracking/v1'},{...tracking,window:{...tracking.window,operations:999}}]) assert.throws(()=>validateWriteTracking(changed));
});
test('the exact previously deployed v1 validator refuses v2 instead of silently ignoring the window',async()=>{
  const baseline=readFileSync(new URL('./fixtures/playtt-write-drain-v1.ts',import.meta.url));
  assert.equal(createHash('sha256').update(baseline).digest('hex'),'973f5ce6cc749ad7e5bc377a16b0331179dff60ec4e9074c07844318e799f49f');
  oldValidator(oldTracking());
  const f=fixture();await f.start();const v2=f.values.get(KEY).writeTracking;
  validateWriteTracking(v2);assert.throws(()=>oldValidator(v2),/unavailable/);
});
