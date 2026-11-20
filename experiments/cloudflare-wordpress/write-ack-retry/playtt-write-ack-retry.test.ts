import assert from 'node:assert/strict';
import test from 'node:test';
import { PlayttStorageBudget, withPlayttStorageCapacity, PlayttCapacityError, type PlayttCapacityEnv } from '../src/playtt-storage-capacity.js';
import { WordPressStateCoordinator, DurableObjectRevisionCoordinator } from '../src/state-coordinator.js';
import { WRITE_SETTLED_SCHEMA } from '../src/playtt-write-drain.js';

function storage() {
  const values=new Map<string,any>();
  const api={get:async(key:string)=>structuredClone(values.get(key)),put:async(key:string,value:any)=>{values.set(key,structuredClone(value));},
    async transaction<T>(fn:(tx:typeof api)=>Promise<T>){const before=structuredClone(values);try{return await fn(api);}catch(e){values.clear();for(const [k,v]of before)values.set(k,v);throw e;}}};
  return {values,api:api as unknown as DurableObjectStorage};
}
type Fault='request-lost'|'response-lost'|'http-503'|'bad-json'|'wrong-ticket'|'restart-request-lost';
function fixture(faults:Fault[]=[],ambiguous?:'put'|'delete'|'reserve',conditional=false){
  const st=storage(),data=new Map<string,string>(),tickets:string[]=[],calls={reserve:0,put:0,delete:0,settle:0};let budget:PlayttStorageBudget;
  const raw={list:async()=>({objects:[],truncated:false}),head:async()=>null,get:async(key:string)=>data.has(key)?{json:async()=>JSON.parse(data.get(key)!)}:null,
    async put(key:string,value:string){calls.put++;if(!conditional)data.set(key,value);if(ambiguous==='put')throw new Error('Unknown provider result');return conditional?null:{key};},
    async delete(key:string){calls.delete++;data.delete(key);if(ambiguous==='delete')throw new Error('Unknown provider result');}} as unknown as R2Bucket;
  const env:PlayttCapacityEnv={WORDPRESS_STATE_BUCKET:raw,PLAYTT_R2_CAPACITY_SCOPE:'playtt-wordpress-pin-restore-audit',PLAYTT_R2_CAPACITY_LIMIT_BYTES:'1000000',PLAYTT_R2_WRITE_TRACKING:'v1'};
  const restart=()=>{budget=new PlayttStorageBudget({storage:st.api} as DurableObjectState,env);};
  env.PLAYTT_STORAGE_BUDGET={getByName:()=>({fetch:async(url:string,options?:RequestInit)=>{
    if(url.endsWith('/reserve'))calls.reserve++;
    let fault:Fault|undefined;
    if(url.endsWith('/tracking/settle')){
      calls.settle++;tickets.push(JSON.parse(String(options?.body)).ticket);fault=faults.shift();
      if(fault==='restart-request-lost'){restart();throw new Error('Lost request around restart');}
      if(fault==='request-lost')throw new Error('Lost request before DO');
      if(fault==='http-503')return new Response('Unavailable',{status:503});
      if(fault==='wrong-ticket')return Response.json({schema:WRITE_SETTLED_SCHEMA,settled:true,ticket:crypto.randomUUID()});
    }
    const response=await budget.fetch(new Request(url,options));
    if((url.endsWith('/reserve')&&ambiguous==='reserve')||fault==='response-lost')throw new Error('Lost response after durable application');
    if(fault==='bad-json')return new Response('{broken');
    return response;
  }})} as unknown as DurableObjectNamespace;
  restart();
  const call=(path:string,body:any={})=>budget.fetch(new Request('https://internal'+path,{method:'POST',body:JSON.stringify(body)}));
  const status=async()=>(await budget.fetch(new Request('https://internal/status'))).json() as Promise<any>;
  return {data,calls,tickets,env,call,status,restart,bucket:withPlayttStorageCapacity(env).WORDPRESS_STATE_BUCKET,
    async initialize(){assert.equal((await call('/initialize')).status,200);assert.equal((await call('/tracking/initialize')).status,200);}};
}

test('healthy confirmation takes one call and never reserves or writes twice',async()=>{
  const f=fixture();await f.initialize();await f.bucket.put('sites/default/owned','saved');
  assert.deepEqual(f.calls,{reserve:1,put:1,delete:0,settle:1});assert.equal((await f.status()).writeTracking.pending,0);
});

test('one or two lost settlement requests recover the exact ticket without repeating the R2 mutation',async()=>{
  for(const faults of [['request-lost'],['request-lost','request-lost']] as Fault[][]){
    const expected=faults.length+1,f=fixture(faults);await f.initialize();await f.bucket.put('sites/default/owned','saved');
    assert.equal(f.calls.settle,expected);assert.equal(new Set(f.tickets).size,1);assert.equal(f.calls.reserve,1);assert.equal(f.calls.put,1);
    const s=await f.status();assert.equal(s.writeTracking.pending,0);assert.equal(s.chargedPuts,1);assert.equal(s.chargedBytes,5);
    assert.equal((await f.call('/tracking/acquire',{token:crypto.randomUUID()})).status,200);
  }
});

test('lost responses and malformed acknowledgement bodies retry idempotently after the server already settled',async()=>{
  for(const fault of ['response-lost','bad-json'] as Fault[]){
    const f=fixture([fault]);await f.initialize();await f.bucket.put('sites/default/owned','saved');
    assert.equal(f.calls.settle,2);assert.equal(new Set(f.tickets).size,1);assert.equal((await f.status()).writeTracking.pending,0);assert.equal(f.calls.put,1);
  }
});

test('transient503 and a restarted budget recover while a wrong-ticket proof is never accepted',async()=>{
  for(const fault of ['http-503','restart-request-lost','wrong-ticket'] as Fault[]){
    const f=fixture([fault]);await f.initialize();await f.bucket.put('sites/default/owned','saved');
    assert.equal(f.calls.settle,2);assert.equal((await f.status()).writeTracking.pending,0);assert.equal(f.calls.put,1);
  }
});

test('retry exhaustion preserves confirmed success and leaves unknown acknowledgement state closed to maintenance',async t=>{
  const diagnostics:string[]=[];t.mock.method(console,'warn',(value:string)=>diagnostics.push(value));
  const f=fixture(['request-lost','request-lost','request-lost','request-lost']);await f.initialize();
  await f.bucket.put('sites/default/private-key','private-content');
  assert.equal(f.data.get('sites/default/private-key'),'private-content');assert.equal(f.calls.settle,3);assert.equal(f.calls.put,1);assert.equal(f.calls.reserve,1);
  assert.equal((await f.status()).writeTracking.pending,1);assert.equal((await f.call('/tracking/acquire',{token:crypto.randomUUID()})).status,409);
  assert.equal(diagnostics.length,1);const warning=JSON.parse(diagnostics[0]);assert.equal(warning.attempts,3);assert.equal(warning.knownR2Completion,true);
  for(const value of ['private-key','private-content',...f.tickets])assert.equal(diagnostics[0].includes(value),false);
});

test('permanently wrong-ticket proofs cannot settle another pending ticket',async()=>{
  const f=fixture(['wrong-ticket','wrong-ticket','wrong-ticket']);await f.initialize();await f.bucket.put('sites/default/owned','saved');
  assert.equal(f.calls.settle,3);assert.equal((await f.status()).writeTracking.pending,1);assert.equal((await f.call('/tracking/acquire',{token:crypto.randomUUID()})).status,409);
});

test('confirmed deletes and conditional misses retry only acknowledgement, preserving conservative charges',async()=>{
  const del=fixture(['request-lost']);await del.initialize();del.data.set('sites/default/owned','saved');await del.bucket.delete('sites/default/owned');
  assert.deepEqual(del.calls,{reserve:1,put:0,delete:1,settle:2});assert.equal(del.data.size,0);
  const ds=await del.status();assert.equal(ds.chargedPuts,0);assert.equal(ds.chargedBytes,0);assert.equal(ds.writeTracking.pending,0);
  const miss=fixture(['response-lost'],undefined,true);await miss.initialize();assert.equal(await miss.bucket.put('sites/default/existing','abc',{onlyIf:{etagDoesNotMatch:'*'}}),null);
  assert.deepEqual(miss.calls,{reserve:1,put:1,delete:0,settle:2});const ms=await miss.status();assert.equal(ms.chargedPuts,1);assert.equal(ms.chargedBytes,3);assert.equal(ms.writeTracking.pending,0);
});

test('ambiguous R2 put/delete and lost reservation response are never acknowledged or replayed',async()=>{
  for(const kind of ['put','delete','reserve'] as const){
    const f=fixture([],kind);await f.initialize();
    await assert.rejects(kind==='delete'?f.bucket.delete('sites/default/owned'):f.bucket.put('sites/default/owned','saved'));
    assert.equal(f.calls.settle,0);assert.equal(f.calls.reserve,1);assert.equal(f.calls.put,kind==='put'?1:0);assert.equal(f.calls.delete,kind==='delete'?1:0);
    assert.equal((await f.status()).writeTracking.pending,1);assert.equal((await f.call('/tracking/acquire',{token:crypto.randomUUID()})).status,409);
  }
});

test('recovering an acknowledgement cannot clear an unrelated ambiguous R2 write',async()=>{
  const f=fixture(['request-lost']);await f.initialize();
  const reserve=await f.call('/reserve',{schema:'playtt/r2-write-reservation/v1',kind:'put',bytes:7,limitBytes:1000000});assert.equal(reserve.status,200);
  const other=await reserve.json() as any;await f.bucket.put('sites/default/owned','saved');
  assert.equal(f.calls.settle,2);assert.ok(!f.tickets.includes(other.ticket));assert.equal((await f.status()).writeTracking.pending,1);
  assert.equal((await f.call('/tracking/acquire',{token:crypto.randomUUID()})).status,409);
});

test('confirmed current.json and coordinator commit stay coherent after retries recover or exhaust',async()=>{
  for(const faults of [['request-lost'],['request-lost','request-lost','request-lost']] as Fault[][]){
    const exhausted=faults.length===3,f=fixture(faults);await f.initialize();const st=storage();
    const coordinator=new WordPressStateCoordinator({storage:st.api} as DurableObjectState,f.env);
    const c=new DurableObjectRevisionCoordinator({fetch:(r:Request)=>coordinator.fetch(r)} as DurableObjectStub,'default');
    const lease=await c.acquire(),revision=crypto.randomUUID(),p={revision,manifestKey:'sites/default/markdown/revisions/'+revision+'.json',persistedAt:new Date().toISOString()};
    assert.equal((await c.commit(lease,p)).version,1);assert.deepEqual((await c.state()).pointer,p);assert.deepEqual(JSON.parse(f.data.get('sites/default/markdown/current.json')!),p);
    assert.equal(f.calls.settle,exhausted?3:2);assert.equal((await f.status()).writeTracking.pending,exhausted?1:0);
  }
});
