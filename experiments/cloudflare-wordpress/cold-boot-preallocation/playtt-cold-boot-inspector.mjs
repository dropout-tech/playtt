// Owned loopback workerd inspector, not browser CDP. No heap snapshots/forced GC.
import assert from 'node:assert/strict';
import {once} from 'node:events';
import {writeFile} from 'node:fs/promises';
import WebSocket from 'ws';
export async function connectColdBootInspector({url,directory}){
 const base=new URL(url);assert.equal(base.hostname,'127.0.0.1');assert.equal(base.port,'9502');base.protocol='http:';
 const r=await fetch(new URL('/json/list',base),{signal:AbortSignal.timeout(10000)});assert.equal(r.status,200);
 const targets=await r.json(),target=targets.find(t=>String(t.title||t.id).includes('playtt-cold-boot-local'));assert.ok(target);
 const endpoint=new URL(target.webSocketDebuggerUrl);assert.equal(endpoint.host,'127.0.0.1:9502');assert.equal(endpoint.protocol,'ws:');
 const ws=new WebSocket(endpoint,{origin:base.origin});await once(ws,'open');
 let id=0;const pending=new Map(),stages=[],events=[],errors=[],exceptions=[];
 const expected=['before-archive','archive-read','archive-verified','archive-written','archive-extracted','before-compaction','after-compaction'];
 const checkpoint=()=>writeFile(directory+'/inspector-progress-private.json',JSON.stringify({stages,events,errors,exceptions},null,2));
 const send=(method,params={})=>new Promise((resolve,reject)=>{const n=++id,timer=setTimeout(()=>{pending.delete(n);reject(Error('Inspector timeout: '+method));},15000);pending.set(n,{resolve,reject,timer,method});ws.send(JSON.stringify({id:n,method,params}));});
 const usage=async()=>{const u=await send('Runtime.getHeapUsage');for(const key of ['usedSize','totalSize','embedderHeapUsedSize','backingStorageSize'])assert.ok(Number.isFinite(u[key])&&u[key]>=0);return u;};
 ws.on('message',raw=>{const value=JSON.parse(raw.toString());if(value.id){const p=pending.get(value.id);if(p){clearTimeout(p.timer);pending.delete(value.id);value.error?p.reject(Error(p.method+': '+String(value.error.message).slice(0,300))):p.resolve(value.result);}return;}
  if(value.method==='Runtime.exceptionThrown'){const d=value.params?.exceptionDetails||{};exceptions.push({at:Date.now(),text:String(d.text||'').slice(0,200),description:String(d.exception?.description||'').slice(0,1000)});return;}
  if(value.method!=='Runtime.consoleAPICalled')return;
  for(const arg of value.params?.args||[]){if(typeof arg.value!=='string')continue;let e;try{e=JSON.parse(arg.value);}catch{continue;}
   if(e.schema==='playtt-runtime-generation/v1')events.push({kind:'generation',generation:e.generation});
   else if(e.schema==='playtt-runtime-memory/v1')events.push({kind:'php',stage:e.stage,heapBytes:e.heapBytes,fileBytes:e.fileBytes,fileScanPerformed:e.fileScanPerformed});
  }
 });
 await send('Runtime.enable');
 return{usage,stages,events,errors,exceptions,async observe(e){try{assert.equal(e.schema,'playtt/cold-boot-stage/v1');assert.equal(e.stage,expected[stages.length]);assert.equal(e.id,stages.length+1);const heap=await usage();stages.push({receivedAt:Date.now(),...e,heap,observedComponentSumBytes:heap.usedSize+heap.backingStorageSize+e.inventory.wasmBytes});await checkpoint();return{ok:true,id:e.id};}catch(error){errors.push({message:error.message});await checkpoint();throw error;}},async finish(){await send('Runtime.disable');ws.terminate();const report={schema:'playtt/local-cold-boot-observation/v1',stages,events,errors,exceptionCount:exceptions.length,forcedGc:false};await writeFile(directory+'/observation.json',JSON.stringify(report,null,2)+'\n',{flag:'wx'});if(exceptions.length)await writeFile(directory+'/exceptions-private.json',JSON.stringify(exceptions,null,2)+'\n',{flag:'wx'});return report;},terminate(){ws.terminate();}};
}
