// Owned local workerd only. Lifecycle events and bounded exceptions, no browser/CDP state or memory snapshots.
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {once} from 'node:events';
import WebSocket from 'ws';
export async function connectBootCleanupInspector({url,directory}){
 const base=new URL(url);assert.equal(base.hostname,'127.0.0.1');assert.equal(base.port,'9506');base.protocol='http:';
 const r=await fetch(new URL('/json/list',base));assert.equal(r.status,200);const targets=await r.json(),target=targets.find(t=>String(t.title||t.id).includes('playtt-boot-cleanup-local'));assert.ok(target);
 const endpoint=new URL(target.webSocketDebuggerUrl);assert.equal(endpoint.protocol,'ws:');assert.equal(endpoint.host,'127.0.0.1:9506');
 const ws=new WebSocket(endpoint,{origin:base.origin});await once(ws,'open');let id=0;const pending=new Map(),ownership=[],faults=[],exceptions=[];
 const send=method=>new Promise((resolve,reject)=>{const key=++id,timer=setTimeout(()=>{pending.delete(key);reject(Error('Inspector timeout: '+method));},15000);pending.set(key,{resolve,reject,timer});ws.send(JSON.stringify({id:key,method}));});
 ws.on('message',raw=>{const m=JSON.parse(raw.toString());if(m.id){const p=pending.get(m.id);if(p){pending.delete(m.id);clearTimeout(p.timer);m.error?p.reject(Error('Inspector protocol error')):p.resolve(m.result);}return;}
  if(m.method==='Runtime.exceptionThrown'){const d=m.params?.exceptionDetails;exceptions.push({text:String(d?.text||'').slice(0,300),description:String(d?.exception?.description||'').slice(0,3000)});return;}
  if(m.method!=='Runtime.consoleAPICalled')return;
  for(const arg of m.params?.args||[]){if(typeof arg.value!=='string')continue;let e;try{e=JSON.parse(arg.value);}catch{continue;}
   if(e.schema==='playtt/boot-ownership/v1'){assert.ok(['created','exited'].includes(e.stage));assert.ok(Number.isInteger(e.id)&&Number.isInteger(e.live));ownership.push({stage:e.stage,id:e.id,live:e.live});}
   if(e.schema==='playtt/boot-fault/v1'){assert.ok(['corrupted-read','valid-read','execution-container-created'].includes(e.stage));assert.match(e.instanceId,/^[a-f0-9-]{36}$/);faults.push({stage:e.stage,instanceId:e.instanceId,bytes:e.bytes,coreReads:e.coreReads});}
  }
 });
 await send('Runtime.enable');
 return{async finish(){await send('Runtime.disable');ws.terminate();await writeFile(directory+'/exceptions-private.json',JSON.stringify(exceptions,null,2)+'\n',{flag:'wx'});const expected=exceptions.filter(e=>(e.text+'\n'+e.description).includes('WordPress runtime artifact archive hash does not match its manifest'));const ids=[...new Set(faults.map(e=>e.instanceId))],reads=faults.filter(e=>e.stage==='corrupted-read'||e.stage==='valid-read');const report={schema:'playtt/boot-cleanup-observation/v1',ownership,faults:faults.map(({instanceId,...e})=>({...e,container:ids.indexOf(instanceId)+1})),sameReadContainer:reads.length===2&&reads[0].instanceId===reads[1].instanceId&&reads[0].coreReads===1&&reads[1].coreReads===2,validReads:reads.filter(e=>e.stage==='valid-read').length,corruptedReads:faults.filter(e=>e.stage==='corrupted-read').length,executionContainers:faults.filter(e=>e.stage==='execution-container-created').length,expectedHashFailureCount:expected.length,otherExceptionCount:exceptions.length-expected.length};await writeFile(directory+'/observation.json',JSON.stringify(report,null,2)+'\n',{flag:'wx'});return report;},terminate(){ws.terminate();}};
}
