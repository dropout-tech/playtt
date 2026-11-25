// Inspector for the owned loopback workerd only, never browser CDP.
import assert from 'node:assert/strict';
import {once} from 'node:events';
import WebSocket from 'ws';
export async function connectLimitMetrics(inspectorUrl){
 const base=new URL(inspectorUrl);assert.equal(base.hostname,'127.0.0.1');assert.equal(base.port,'9500');base.protocol='http:';
 const response=await fetch(new URL('/json/list',base),{signal:AbortSignal.timeout(10000)});assert.equal(response.status,200);const targets=await response.json();
 const target=targets.find(x=>String(x.title||x.id).includes('playtt-limit-proof'));assert.ok(target);const endpoint=new URL(target.webSocketDebuggerUrl);assert.equal(endpoint.host,'127.0.0.1:9500');assert.equal(endpoint.protocol,'ws:');
 const ws=new WebSocket(endpoint,{origin:base.origin});await once(ws,'open');let id=0;const pending=new Map(),exceptions=[];
 ws.on('message',raw=>{const value=JSON.parse(raw.toString());if(value.id){const p=pending.get(value.id);if(p){clearTimeout(p.timer);pending.delete(value.id);value.error?p.reject(Error('Inspector command rejected')):p.resolve(value.result);}}else if(value.method==='Runtime.exceptionThrown')exceptions.push({text:String(value.params?.exceptionDetails?.text||'').slice(0,200)});});
 const send=method=>new Promise((resolve,reject)=>{const n=++id,timer=setTimeout(()=>{pending.delete(n);reject(Error('Inspector timeout: '+method));},15000);pending.set(n,{timer,resolve,reject});ws.send(JSON.stringify({id:n,method}));});
 await send('Runtime.enable');
 return{async retained(){const usage=await send('Runtime.getHeapUsage');assert.ok(['usedSize','totalSize','embedderHeapUsedSize','backingStorageSize'].every(k=>Number.isFinite(usage[k])&&usage[k]>=0));return usage;},exceptions,close:async()=>{try{await send('Runtime.disable');}finally{ws.terminate();}}};
}
