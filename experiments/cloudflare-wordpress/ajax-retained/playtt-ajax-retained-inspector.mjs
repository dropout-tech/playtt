// Private LOCAL workerd snapshots. Never connect to Chrome or a cloud inspector.
import assert from 'node:assert/strict';
import {createWriteStream} from 'node:fs';
import {writeFile} from 'node:fs/promises';
import {once} from 'node:events';
import {createHash} from 'node:crypto';
import WebSocket from 'ws';
export async function startRetainedInspector({inspectorUrl,directory,workerName}){
 const base=new URL(inspectorUrl);assert.equal(base.hostname,'127.0.0.1');assert.equal(base.port,'9510');assert.ok(['ws:','http:'].includes(base.protocol));base.protocol='http:';
 const targets=await(await fetch(new URL('/json/list',base),{signal:AbortSignal.timeout(10000)})).json(),target=targets.find(t=>String(t.title||'').includes(workerName)||String(t.id||'').includes(workerName));assert.ok(target);const endpoint=new URL(target.webSocketDebuggerUrl);assert.equal(endpoint.protocol,'ws:');assert.equal(endpoint.host,'127.0.0.1:9510');
 const ws=new WebSocket(endpoint,{origin:base.origin});await once(ws,'open');let id=0,label='bootstrap',busy=false,stopped=false,sink;const pending=new Map(),samples=[],events=[],snapshots=[],errors=[];
 const send=(method,params={},timeout=15000)=>new Promise((resolve,reject)=>{const key=++id,timer=setTimeout(()=>{pending.delete(key);reject(Error('Inspector timeout: '+method));},timeout);pending.set(key,{resolve,reject,timer});ws.send(JSON.stringify({id:key,method,params}));});
 ws.on('message',raw=>{const m=JSON.parse(raw.toString());if(m.id){const p=pending.get(m.id);if(!p)return;pending.delete(m.id);clearTimeout(p.timer);m.error?p.reject(Error('Inspector command rejected')):p.resolve(m.result);return;}if(m.method==='HeapProfiler.addHeapSnapshotChunk'&&sink){const chunk=m.params.chunk;sink.bytes+=Buffer.byteLength(chunk);sink.chunks++;if(sink.bytes>128*1024*1024){sink.overflow=true;return;}sink.hash.update(chunk);sink.stream.write(chunk);return;}
  if(m.method==='Runtime.exceptionThrown'){events.push({at:Date.now(),label,kind:'exception'});return;}if(m.method!=='Runtime.consoleAPICalled')return;for(const arg of m.params?.args||[]){if(typeof arg.value!=='string')continue;let p;try{p=JSON.parse(arg.value);}catch{continue;}const e={at:Date.now(),label};
   if(p.schema==='playtt-runtime-memory/v1')events.push({...e,kind:'php',stage:p.stage,heapBytes:p.heapBytes,fileBytes:p.fileBytes,fileScanPerformed:p.fileScanPerformed});
   if(p.schema==='playtt-runtime-generation/v1')events.push({...e,kind:'generation',generation:p.generation});
   if(p.schema==='playtt-runtime-retired/v1')events.push({...e,kind:'retirement',requests:p.requests,heapBytes:p.heapBytes});
   if(p.schema==='playtt/editor-profile-request/v1')events.push({...e,kind:'request',id:p.id,category:p.category,loginAction:p.loginAction,method:p.method,status:p.status,wallMs:p.wallMs,version:p.version});
   if(p.schema==='playtt/ajax-diagnostic/v1'){assert.ok(['begin','end'].includes(p.stage));assert.ok(['heartbeat','wp-remove-post-lock','autosave','unsupported-content-type','over-bound','missing','duplicate','parse-failed','invalid-action-type','other'].includes(p.action));events.push({...e,kind:'ajax',stage:p.stage,id:p.id,action:p.action,encoding:p.encoding,formBytes:p.formBytes,hasPostId:p.hasPostId,hasActiveLock:p.hasActiveLock,status:p.status,result:p.result,version:p.version});}
  }
 });
 await send('Runtime.enable');async function sample(){if(busy||stopped||sink)return;busy=true;try{const usage=await send('Runtime.getHeapUsage');samples.push({at:Date.now(),label,...usage});}catch{errors.push({at:Date.now(),kind:'sample-failure'});}finally{busy=false;}}
 await sample();const timer=setInterval(()=>{void sample();},100);
 const status=()=>({label,samples:samples.length,events:events.length,snapshots:snapshots.length,exceptions:events.filter(x=>x.kind==='exception').length,busy,stopped});
 async function capture(name){assert.ok(['snapshot-first','snapshot-repeat'].includes(name));assert.ok(!snapshots.some(x=>x.label===name));const deadline=Date.now()+16000;while(busy&&Date.now()<deadline)await new Promise(r=>setTimeout(r,20));assert.equal(busy,false);label=name;const before=await send('Runtime.getHeapUsage'),file=directory+'/'+name+'-private.heapsnapshot',stream=createWriteStream(file,{flags:'wx'});await once(stream,'open');sink={stream,bytes:0,chunks:0,hash:createHash('sha256'),overflow:false};const start=Date.now(),eventStart=events.length;
  try{await send('HeapProfiler.takeHeapSnapshot',{reportProgress:false},45000);const captured=sink;stream.end();await once(stream,'finish');assert.equal(captured.overflow,false);const after=await send('Runtime.getHeapUsage');const record={label:name,startedAt:start,finishedAt:Date.now(),bytes:captured.bytes,chunks:captured.chunks,sha256:captured.hash.digest('hex'),before,after,eventsDuring:events.slice(eventStart),explicitGcCommand:false,snapshotMayCollect:true};snapshots.push(record);await writeFile(directory+'/snapshots.json',JSON.stringify(snapshots,null,2)+'\n');return record;}finally{stream.end();sink=undefined;}
 }
 return {status,mark:async next=>{if(next.startsWith('snapshot-'))return capture(next);assert.ok(['gate','login','post-cold','post-warm','profile','logout','closing'].includes(next));label=next;await sample();return status();},stop:async()=>{clearInterval(timer);const deadline=Date.now()+16000;while(busy&&Date.now()<deadline)await new Promise(r=>setTimeout(r,20));await sample();stopped=true;await send('Runtime.disable');ws.terminate();await writeFile(directory+'/retained-observation.json',JSON.stringify({schema:'playtt/local-retained-observation/v1',at:new Date().toISOString(),samples,events,snapshots,errors,stopped,scope:'Local workerd; raw snapshots private; snapshot GC/observer overhead; not provider peak or RSS'},null,2)+'\n');return status();}};
}
