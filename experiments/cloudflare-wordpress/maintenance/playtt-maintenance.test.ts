import test from 'node:test';
import assert from 'node:assert/strict';
import {preparePlayttMaintenanceRequest,readPlayttMaintenanceAction,playttAutoDraftMaintenanceCode,validatePlayttMaintenanceResult} from '../src/playtt-maintenance.js';
import {routeWorkerRequest} from '../src/request-routing.js';
const request=(body:string)=>new Request('https://test.invalid/?phase=operator-auto-draft-maintenance',{method:'POST',headers:{'content-type':'application/json'},body});

test('outer worker rejects before DO dispatch and forwards a consumed, bounded input',async()=>{
 const noAuth=await preparePlayttMaintenanceRequest(request('{"action":"run"}'),async()=>false);
 assert.ok(noAuth instanceof Response);assert.equal(noAuth.status,401);
 const invalid=await preparePlayttMaintenanceRequest(request('{"action":"run","ids":[1]}'),async()=>true);
 assert.ok(invalid instanceof Response);assert.equal(invalid.status,400);
 const input=request(' { "action": "preview" } ');input.headers.set('content-length','25');
 const forwarded=await preparePlayttMaintenanceRequest(input,async()=>true);
 assert.ok(forwarded instanceof Request);assert.equal(input.bodyUsed,true);
 assert.equal(forwarded.headers.has('content-length'),false);
 assert.equal(await readPlayttMaintenanceAction(forwarded),'preview');
});
test('only fixed preview/run actions are accepted',async()=>{
 for(const action of ['preview','run'])assert.equal(await readPlayttMaintenanceAction(request(JSON.stringify({action}))),action);
 for(const value of [null,[],{},'run',{action:'run',ids:[1]},{action:'run',age:0},{action:'all-cron'},{action:{toString:'run'}}])await assert.rejects(readPlayttMaintenanceAction(request(JSON.stringify(value))));
 assert.throws(()=>playttAutoDraftMaintenanceCode('run; malicious' as never));
});
test('wrong method, content type, malformed JSON and invalid UTF8 are rejected',async()=>{
 await assert.rejects(readPlayttMaintenanceAction(new Request('https://test.invalid/')));
 await assert.rejects(readPlayttMaintenanceAction(new Request('https://test.invalid/',{method:'POST',body:'{"action":"run"}'})));
 await assert.rejects(readPlayttMaintenanceAction(request('{')));
 await assert.rejects(readPlayttMaintenanceAction(new Request('https://test.invalid/',{method:'POST',headers:{'content-type':'application/json'},body:new Uint8Array([255])})));
});
test('oversized streamed body is canceled before buffering unbounded data',async()=>{
 let canceled=false;
 const body=new ReadableStream({start(c){c.enqueue(new Uint8Array(257));},cancel(){canceled=true;}});
 const r=new Request('https://test.invalid/',{method:'POST',headers:{'content-type':'application/json'},body,duplex:'half'} as RequestInit);
 await assert.rejects(readPlayttMaintenanceAction(r),/oversized/);assert.equal(canceled,true);
});
test('incomplete stream cannot become a maintenance action',async()=>{
 const body=new ReadableStream({start(c){c.enqueue(new TextEncoder().encode('{"action":"run"}'));c.error(Error('transport failed'));}});
 const r=new Request('https://test.invalid/',{method:'POST',headers:{'content-type':'application/json'},body,duplex:'half'} as RequestInit);
 await assert.rejects(readPlayttMaintenanceAction(r));
});
const result={schema:'playtt/auto-draft-maintenance/v1',action:'run',batchLimit:20,eligibleBefore:2,selectedIds:[9,10],deletedIds:[9],remainingEligible:1,skippedIds:[10]};
test('deletion results must stay within selected unique bounded IDs',()=>{
 validatePlayttMaintenanceResult(result,'run');
 for(const change of [{deletedIds:[11]},{deletedIds:[9,9]},{skippedIds:[9,10]},{selectedIds:[...Array(21)].map((_,i)=>i+1)},{eligibleBefore:-1},{eligibleBefore:1},{remainingEligible:NaN},{selectedIds:[9.5,10]},{action:'preview'}])assert.throws(()=>validatePlayttMaintenanceResult({...result,...change},'run'));
});
test('preview cannot claim any deletion or changed eligibility count',()=>{
 const preview={...result,action:'preview',deletedIds:[],skippedIds:[],remainingEligible:2};validatePlayttMaintenanceResult(preview,'preview');
 assert.throws(()=>validatePlayttMaintenanceResult({...preview,deletedIds:[9]},'preview'));
 assert.throws(()=>validatePlayttMaintenanceResult({...preview,remainingEligible:1},'preview'));
});
test('maintenance routing is explicit and never a normal WordPress request',()=>{
 assert.equal(routeWorkerRequest(request('{"action":"preview"}')).kind,'operator-auto-draft-maintenance');
 assert.equal(routeWorkerRequest(new Request('https://test.invalid/')).kind,'wordpress');
});
