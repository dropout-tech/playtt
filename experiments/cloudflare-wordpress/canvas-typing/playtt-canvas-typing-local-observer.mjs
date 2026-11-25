// Owned local workerd only. Raw exception/profile details never leave private files.
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {once} from 'node:events';
import {createHash} from 'node:crypto';
import WebSocket from 'ws';
export async function startExceptionAllocationObserver({inspectorUrl,directory,workerName}){
 const byteLabels=new Set(["arraybuffer:canonical-restore-pack/createCanonicalRestorePack", "arraybuffer:canonical-restore-pack/decodeCanonicalRestorePack", "arraybuffer:canonical-restore-pack/readCanonicalRestorePack", "arraybuffer:content-overlay/readContentBytes", "arraybuffer:manifest-envelope/readCanonicalManifestObject", "arraybuffer:runtime-archive-artifact/readRuntimeArchiveArtifact", "arraybuffer:wordpress-runtime-artifact/materializeWordPressRuntimeArtifact", "arraybuffer:worker/materializeMarkdownDatabaseIntegration", "arraybuffer:worker/materializeRuntimeArchiveComponent", "arraybuffer:worker/packagedCanonicalMarkdownSeed", "arraybuffer:worker/putImmutableBytes", "arraybuffer:worker/readCanonicalRevision", "arraybuffer:worker/readManifestFiles", "arraybuffer:worker/readWordPressRuntimeArtifact", "arraybuffer:worker/serveWordPressStaticAsset", "arraybuffer:worker/serveWordPressUpload", "arraybuffer:worker/serveWordPressWpContent", "bounded-content-read:content-overlay/readContentBytes", "digest-input:canonical-restore-pack/sha256Hex", "digest-input:compressed-content/module", "digest-input:compressed-persistence/module", "digest-input:manifest-envelope/module", "digest-input:markdown-persistence/persistPlayttMarkdownObjects", "digest-input:runtime-archive-artifact/sha256Hex", "digest-input:wordpress-runtime-artifact/sha256Hex", "digest-input:worker/secretsMatch", "digest-input:worker/sha256Hex", "exact-stream-output:compressed-content/readExactCompressedStream", "gzip-input:compressed-content/createCompressedContent", "gzip-input:manifest-envelope/serializeManifestEnvelope", "gzip-output:compressed-content/compress", "php-read:worker/collectRuntimeFiles", "php-read:worker/logPlayttRuntimeMemory", "php-read:worker/patchCanonicalRuntimePoliciesAtInit", "php-read:worker/patchCanonicalThemeJsonCustomCss", "php-read:worker/persistRuntime", "php-read:worker/persistRuntimeObjects", "php-read:worker/readCanonicalChanges", "php-read:worker/readPublicationChanges", "zip-input:canonical-restore-pack/decodeCanonicalRestorePack", "zip-input:worker/materializeMarkdownDatabaseIntegration", "zip-input:worker/packagedCanonicalMarkdownSeed"]);
 const base=new URL(inspectorUrl);assert.equal(base.hostname,'127.0.0.1');assert.equal(base.port,'9581');assert.ok(['ws:','http:'].includes(base.protocol));base.protocol='http:';
 const r=await fetch(new URL('/json/list',base),{signal:AbortSignal.timeout(10000)});assert.equal(r.status,200);
 const targets=await r.json();assert.ok(Array.isArray(targets)&&targets.length<=20);
 const target=targets.find(t=>String(t.title||'').includes(workerName)||String(t.id||'').includes(workerName));assert.ok(target);
 const endpoint=new URL(target.webSocketDebuggerUrl);assert.equal(endpoint.protocol,'ws:');assert.equal(endpoint.host,'127.0.0.1:9581');
 const ws=new WebSocket(endpoint,{origin:base.origin});await once(ws,'open');
 let id=0,label='bootstrap',busy=false,stopped=false,allocationActive=false,allocation;
 let privateWrites=Promise.resolve();const pending=new Map(),samples=[],events=[],errors=[],privateExceptions=[],privateLifecycleErrors=[],allocations=[];
 const send=(method,params={})=>new Promise((resolve,reject)=>{
  const key=++id,timer=setTimeout(()=>{pending.delete(key);reject(Error('Inspector timeout: '+method));},20000);
  pending.set(key,{resolve,reject,timer});ws.send(JSON.stringify({id:key,method,params}));
 });
 const bounded=(v,max=4000)=>typeof v==='string'?v.slice(0,max):undefined;
 const number=v=>Number.isFinite(v)&&v>=0?v:undefined;
 ws.on('message',raw=>{
  const m=JSON.parse(raw.toString());
  if(m.id){const p=pending.get(m.id);if(!p)return;pending.delete(m.id);clearTimeout(p.timer);m.error?p.reject(Error('Inspector command rejected')):p.resolve(m.result);return;}
  if(m.method==='Runtime.exceptionThrown'){
   const at=Date.now(),index=events.filter(e=>e.kind==='exception').length;
   events.push({at,label,kind:'exception',index,detailsCaptured:index<8});
   if(index<8){
    const d=m.params?.exceptionDetails||{},x=d.exception||{};
    privateExceptions.push({at,label,index,exceptionId:d.exceptionId,text:bounded(d.text),lineNumber:d.lineNumber,columnNumber:d.columnNumber,url:bounded(d.url),className:bounded(x.className,120),description:bounded(x.description,8000),frames:(d.stackTrace?.callFrames||[]).slice(0,20).map(f=>({functionName:bounded(f.functionName,240),url:bounded(f.url,1000),lineNumber:f.lineNumber,columnNumber:f.columnNumber}))});
    privateWrites=privateWrites.then(()=>writeFile(directory+'/exceptions-private.json',JSON.stringify(privateExceptions,null,2)+'\n')).catch(()=>{errors.push({at:Date.now(),kind:'private-exception-write'});});
   }
   return;
  }
  if(m.method!=='Runtime.consoleAPICalled')return;
  for(const arg of m.params?.args||[]){
   if(typeof arg.value!=='string')continue;let p;try{p=JSON.parse(arg.value);}catch{continue;}const e={at:Date.now(),label};
   if(p.schema==='playtt/local-lifecycle-error-private/v1'){
    if(privateLifecycleErrors.length<16){privateLifecycleErrors.push({...e,id:number(p.id),layer:p.layer,stage:p.stage,message:bounded(p.message,2000),stack:bounded(p.stack,6000)});privateWrites=privateWrites.then(()=>writeFile(directory+'/lifecycle-errors-private.json',JSON.stringify(privateLifecycleErrors,null,2)+'\n')).catch(()=>errors.push({at:Date.now(),kind:'private-lifecycle-write'}));}
   }
   if(p.schema==='playtt/local-lifecycle/v1'){
    const record={...e,kind:'lifecycle',id:number(p.id),layer:['outer','execution'].includes(p.layer)?p.layer:undefined,category:['login','profile','post-editor','ajax','rest','asset','operator-status','other'].includes(p.category)?p.category:undefined,method:['GET','POST','PUT','DELETE','HEAD','OPTIONS','other'].includes(p.method)?p.method:undefined,stage:['start','abort','headers','ajax-fields','unwrapped','body-end','body-error','body-cancel','cancel-complete','cancel-error','fetch-error','ajax-fields-error','truncated'].includes(p.stage)?p.stage:'unknown'};
    for(const k of ['elapsedMs','status','bytes','chunks','formBytes'])if(number(p[k])!==undefined)record[k]=p[k];
    for(const k of ['logout','aborted','bodyPresent','connectionLost','hasPostId','hasActiveLock'])if(typeof p[k]==='boolean')record[k]=p[k];
    if(['heartbeat','wp-remove-post-lock','autosave','missing','duplicate','invalid-action-type','other','unsupported-content-type','over-bound','parse-failed'].includes(p.action))record.action=p.action;
    if(['urlencoded','multipart','unsupported'].includes(p.encoding))record.encoding=p.encoding;
    if(['Error','TypeError','RangeError','AbortError','InvalidStateError','other'].includes(p.errorName))record.errorName=p.errorName;
    if(['control-before','cancel-inflight','control-after'].includes(p.clientCase))record.clientCase=p.clientCase;
    events.push(record);
   }
   if(p.schema==='playtt-runtime-memory/v1')events.push({...e,kind:'php',stage:['before-request','after-request','after-persist'].includes(p.stage)?p.stage:'other',heapBytes:number(p.heapBytes),fileBytes:number(p.fileBytes),fileScanPerformed:p.fileScanPerformed===true,compressedCoreFiles:number(p.compressedCoreFiles),compressedCoreBytes:number(p.compressedCoreBytes),compressedCoreLogicalBytes:number(p.compressedCoreLogicalBytes),decodedCoreCacheBytes:number(p.decodedCoreCacheBytes),decodedCoreCacheLimit:number(p.decodedCoreCacheLimit),unknownFileBuffers:number(p.unknownFileBuffers),coreCategoryBytes:number(p.categories?.['wordpress-core'])});
   if(p.schema==='playtt-runtime-memory/v1'&&p.byteVolume){
    const v=p.byteVolume;events.push({...e,kind:'byte-volume',context:number(m.params?.executionContextId),stage:['before-request','after-request','after-persist'].includes(p.stage)?p.stage:'other',complete:v.complete===true,rejected:number(v.rejected),rows:(v.rows||[]).slice(0,96).filter(r=>byteLabels.has(r.label)).map(r=>({label:r.label,calls:number(r.calls),bytes:number(r.bytes),maxBytes:number(r.maxBytes)}))});
   }
   if(p.schema==='playtt-core-compression/v1')events.push({...e,kind:'core-compression',inspectedFiles:number(p.inspectedFiles),compressedFiles:number(p.compressedFiles),originalBytes:number(p.originalBytes),compressedBytes:number(p.compressedBytes),retainedCapacitySavings:number(p.retainedCapacitySavings),skippedOpenFiles:number(p.skippedOpenFiles),decodedCacheLimit:number(p.decodedCacheLimit),wallMs:number(p.wallMs)});
   if(p.schema==='playtt-runtime-generation/v1')events.push({...e,kind:'generation',generation:number(p.generation)});
   if(p.schema==='playtt-runtime-retired/v1')events.push({...e,kind:'retirement',requests:number(p.requests),heapBytes:number(p.heapBytes)});
   if(p.schema==='playtt/native-save-receipt/v1')events.push({...e,kind:'native-save',status:number(p.status),id:number(p.id),draft:p.draft===true,contentExact:p.contentExact===true,contentSha256:typeof p.contentSha256==='string'&&/^[a-f0-9]{64}$/.test(p.contentSha256)?p.contentSha256:undefined,contentBytes:number(p.contentBytes),version:number(p.version)});
   if(p.schema==='playtt/editor-profile-request/v1')events.push({...e,kind:'request',restRoute:typeof p.restRoute==='string'&&/^\/wp-json\/[a-zA-Z0-9_\/.-]{1,160}$/.test(p.restRoute)?p.restRoute:undefined,restErrorCode:typeof p.restErrorCode==='string'&&/^[a-zA-Z0-9_-]{1,100}$/.test(p.restErrorCode)?p.restErrorCode:undefined,category:['login','profile','post-editor','site-editor','ajax','rest','asset','operator-status','other'].includes(p.category)?p.category:'other',method:['GET','POST','PUT','DELETE'].includes(p.method)?p.method:'other',status:number(p.status),wallMs:number(p.wallMs),version:number(p.version)});
   if(p.schema==='wp-codebox/cloudflare-runtime-phase-trace/v1')events.push({...e,kind:'trace',operation:['read','mutation'].includes(p.operation)?p.operation:'other',runtime:['cold','warm','invalidated'].includes(p.runtime)?p.runtime:'other',completed:p.completed===true,totalMs:number(p.totalMs),phases:(p.phases||[]).filter(x=>/^[a-z.-]{1,80}$/.test(x.name)).map(x=>({name:x.name,durationMs:number(x.durationMs)}))});
  }
 });
 await send('Runtime.enable');
 async function sample(){if(busy||stopped)return;busy=true;try{const u=await send('Runtime.getHeapUsage');samples.push({at:Date.now(),label,...Object.fromEntries(['usedSize','totalSize','embedderHeapUsedSize','backingStorageSize'].map(k=>[k,number(u[k])]).filter(([,v])=>v!==undefined))});}catch{errors.push({at:Date.now(),kind:'sample-failure'});}finally{busy=false;}}
 await sample();const timer=setInterval(()=>{void sample();},1000);
 const status=()=>({label,samples:samples.length,events:events.length,exceptions:events.filter(x=>x.kind==='exception').length,privateExceptions:privateExceptions.length,lifecycleEvents:events.filter(e=>e.kind==='lifecycle').length,privateLifecycleErrors:privateLifecycleErrors.length,allocationActive,completedAllocations:allocations.map(a=>({name:a.name,bytes:a.bytes,samples:a.samples})),allocation:allocation?{startedAt:allocation.startedAt,finishedAt:allocation.finishedAt,bytes:allocation.bytes}:undefined,busy,stopped});
 async function stopAllocation(){
  if(!allocationActive)return;const {profile}=await send('HeapProfiler.stopSampling');allocationActive=false;
  const bytes=Buffer.from(JSON.stringify(profile));assert.ok(bytes.length<=8*1024*1024,'Private allocation profile exceeds bound');
  await writeFile(directory+'/'+allocation.name+'-allocation-private.json',bytes,{flag:'wx'});
  allocations.push({...allocation,finishedAt:Date.now(),bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex'),samples:profile.samples?.length||0});allocation=undefined;
 }
 return {status,events:()=>structuredClone(events),mark:async next=>{
  assert.ok(['gate','login','dashboard','post-first','post-repeat','allocation-render-start','allocation-render-stop','allocation-save-start','allocation-save-stop','profile','saving','restarted','logout','closing'].includes(next));label=next;
  const matched=next.match(/^allocation-(render|save)-(start|stop)$/);
  if(matched?.[2]==='start'){
   assert.ok(!allocationActive&&!allocation&&!allocations.some(a=>a.name===matched[1]));const options={samplingInterval:32768,includeObjectsCollectedByMajorGC:true,includeObjectsCollectedByMinorGC:true};
   await send('HeapProfiler.startSampling',options);allocationActive=true;allocation={name:matched[1],startedAt:Date.now(),options};
  }else if(matched?.[2]==='stop'){assert.equal(allocation?.name,matched[1]);await stopAllocation();}
  await sample();return status();
 },stop:async()=>{
  clearInterval(timer);const deadline=Date.now()+22000;while(busy&&Date.now()<deadline)await new Promise(r=>setTimeout(r,20));
  await stopAllocation();await sample();await send('Runtime.disable');stopped=true;await privateWrites;
  const report={schema:'playtt/local-exception-allocation/v1',at:new Date().toISOString(),scope:'Local workerd; private bounded exception details and sampled JS allocation including collected objects; not provider peak, PHP allocations or billed CPU',samples,events,errors,allocations,stopped};
  await writeFile(directory+'/exception-allocation-observation.json',JSON.stringify(report,null,2)+'\n');
  ws.terminate();return status();
 }};
}
