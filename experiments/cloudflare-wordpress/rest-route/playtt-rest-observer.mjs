// Local workerd console only; never a browser inspector or cloud connection.
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import WebSocket from 'ws';
export async function startRestObserver({inspectorUrl,directory,workerName}){
 const base=new URL(inspectorUrl);assert.equal(base.hostname,'127.0.0.1');assert.equal(base.port,'9486');assert.ok(['http:','ws:'].includes(base.protocol));base.protocol='http:';
 const r=await fetch(new URL('/json/list',base),{signal:AbortSignal.timeout(10000)});assert.equal(r.status,200);const targets=await r.json(),target=targets.find(t=>String(t.title||'').includes(workerName)||String(t.id||'').includes(workerName));assert.ok(target,'Owned workerd target unavailable');
 const url=new URL(target.webSocketDebuggerUrl);assert.equal(url.protocol,'ws:');assert.equal(url.hostname,'127.0.0.1');assert.equal(url.port,'9486');
 const ws=new WebSocket(url,{origin:base.origin});await new Promise((resolve,reject)=>{ws.once('open',resolve);ws.once('error',reject);});let id=0,label='bootstrap',stopped=false;const pending=new Map(),events=[],exceptions=[];
 const send=(method,params={})=>new Promise((resolve,reject)=>{const key=++id,timer=setTimeout(()=>{pending.delete(key);reject(Error('Inspector command timeout'));},10000);pending.set(key,{resolve,reject,timer});ws.send(JSON.stringify({id:key,method,params}));});
 ws.on('message',raw=>{const m=JSON.parse(raw.toString());if(m.id){const p=pending.get(m.id);if(!p)return;pending.delete(m.id);clearTimeout(p.timer);m.error?p.reject(Error('Inspector command rejected')):p.resolve(m.result);return;}
  if(m.method==='Runtime.exceptionThrown'){exceptions.push({at:Date.now(),label,observed:true});return;}
  if(m.method!=='Runtime.consoleAPICalled')return;for(const arg of m.params?.args||[]){if(typeof arg.value!=='string')continue;let p;try{p=JSON.parse(arg.value);}catch{continue;}if(p.schema!=='playtt/rest-route-observation/v1')continue;
   assert.ok(['login','profile','post-editor','site-editor','ajax','rest','asset','other'].includes(p.category));assert.ok(['GET','HEAD','OPTIONS','POST','PUT','PATCH','DELETE'].includes(p.method));assert.ok(Number.isInteger(p.status)&&p.status>=100&&p.status<=599);assert.ok(Number.isFinite(p.wallMs)&&p.wallMs>=0);
   const item={at:Date.now(),label,category:p.category,method:p.method,status:p.status,wallMs:p.wallMs};if(Number.isSafeInteger(p.version)&&p.version>0)item.version=p.version;
   if(p.category==='rest'){assert.match(p.route,/^\/(?:wp-json\/[a-z0-9_/-]+(?:\/:id|\/:slug)*|redacted)$/);assert.ok(p.route.length<=200);item.route=p.route;item.context=['edit','view','embed'].includes(p.context)?p.context:undefined;if(p.errorCode){assert.match(p.errorCode,/^[a-z0-9_]{1,80}$/);item.errorCode=p.errorCode;}if(p.errorRead)item.errorRead=['parsed','too-large','not-json','missing-code'].includes(p.errorRead)?p.errorRead:'other';}
   events.push(item);
  }
 });
 await send('Runtime.enable');
 const status=()=>({label,events:events.length,exceptions:exceptions.length,errors:events.filter(x=>x.status>=400).slice(-20),stopped});
 return {mark:async next=>{assert.ok(['gate','login','dashboard','commands','post-cold','post-warm','profile','logout','closing'].includes(next));label=next;return status();},status,stop:async()=>{assert.equal(stopped,false);await send('Runtime.disable');stopped=true;await writeFile(directory+'/rest-observation.json',JSON.stringify({schema:'playtt/local-rest-route-observer/v1',at:new Date().toISOString(),scope:'Local workerd console; no heap or CPU profiler; no request bodies, query values or cookies retained',events,exceptions,stopped},null,2)+'\n');ws.terminate();return status();}};
}
