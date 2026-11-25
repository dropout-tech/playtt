// LOCAL ONLY: exact candidate bundle, verified immutable core asset, no PHP or
// WordPress data. Discriminates intentional client disconnects from a failed save.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdtemp,access} from 'node:fs/promises';
import {resolve,dirname,join} from 'node:path';
import {createHash,randomUUID} from 'node:crypto';
import http from 'node:http';
import {Miniflare,Log,LogLevel,convertV4MiniflareOptions} from 'miniflare';
import {startExceptionAllocationObserver} from './playtt-static-disconnect-observer.mjs';
assert.ok(process.argv.includes('--local')&&!process.argv.includes('--remote'));
const load=async p=>JSON.parse(await readFile(p,'utf8')),sha=b=>createHash('sha256').update(b).digest('hex'),prefix='artifacts/playtt-static-disconnect-v2-';
await access(prefix+'owned-private.json').then(()=>{throw Error('Existing attempt: inspect without replay');},e=>{if(e.code!=='ENOENT')throw e;});
const target=(await load('artifacts/playtt-path-join-deploy-plan.json')).targets.candidate;
for(const m of target.modules){const b=await readFile(m.path);assert.equal(b.length,m.bytes);assert.equal(sha(b),m.sha256);}
const manifest=await load('assets/wordpress-static-artifact.json'),blob=await readFile('artifacts/cloudflare-wordpress-static-corpus.bin');assert.equal(blob.length,manifest.blob.size);assert.equal(sha(blob),manifest.blob.sha256);
const asset=manifest.files.find(x=>x.path==='wordpress/wp-includes/js/dist/components.js');assert.ok(asset);const pathname=asset.path.slice('wordpress'.length);assert.equal(sha(blob.subarray(asset.offset,asset.offset+asset.size)),asset.sha256);
const directory=await mkdtemp(resolve('artifacts/static-disconnect-')),compiled=resolve(dirname(target.entry)),wrapper=join(compiled,'local-static-disconnect-'+randomUUID()+'.mjs'),origin='http://127.0.0.1:9497',workerName='playtt-static-disconnect-local';
await writeFile(wrapper,`import worker,{PlayttStorageBudget} from './worker-playtt-do.js';export{PlayttStorageBudget};
export default{async fetch(request,env){const u=new URL(request.url);if(u.hostname!=='127.0.0.1'||u.pathname!==${JSON.stringify(pathname)}||request.method!=='GET')return new Response('Outside immutable fixture',{status:403});
const label=u.searchParams.get('case');if(!['control-before','cancel-headers','cancel-inflight','control-after'].includes(label))return new Response('Unknown case',{status:400});
const start=Date.now(),event=(stage,extra={})=>console.log(JSON.stringify({schema:'playtt/local-request-lifecycle/v1',id:label==='control-before'?1:label==='cancel-headers'?2:label==='cancel-inflight'?3:4,category:'asset',method:'GET',stage,elapsedMs:Date.now()-start,...extra}));
event('start',{aborted:request.signal.aborted});request.signal.addEventListener('abort',()=>event('abort',{aborted:true}),{once:true});
const source=env.WORDPRESS_STATE_BUCKET,bucket=new Proxy(source,{get(t,k){if(['put','delete','createMultipartUpload','resumeMultipartUpload'].includes(k))return()=>{throw Error('Immutable fixture forbids writes');};const v=Reflect.get(t,k,t);return typeof v==='function'?v.bind(t):v;}});
try{const response=await worker.fetch(request,{...env,WORDPRESS_STATE_BUCKET:bucket});event('headers',{status:response.status,aborted:request.signal.aborted});return response;}catch(e){event('throw',{aborted:request.signal.aborted,errorName:e?.name,connectionLost:String(e?.message).includes('Network connection lost')});throw e;}}};`,{flag:'wx'});
const owner={phase:'starting',directory,wrapper,asset:pathname,assetSha256:asset.sha256,assetBytes:asset.size,localProcessesDisposed:false};await writeFile(prefix+'owned-private.json',JSON.stringify(owner,null,2),{flag:'wx'});
let mf,observer,outboundAttempts=0,report;const results=[];
const pause=ms=>new Promise(r=>setTimeout(r,ms));
async function nativeRequest(label,cancel){
 const id={'control-before':1,'cancel-headers':2,'cancel-inflight':3,'control-after':4}[label];await observer.mark(label);const chunks=[];let req,canceled=false;
 const completed=new Promise((resolveRequest,reject)=>{
  req=http.get(origin+pathname+'?case='+label,{headers:{'X-Playtt-Probe':'local-static-disconnect-only'},agent:false},res=>{
   const status=res.statusCode;if(status!==200){res.resume();reject(Error('Unexpected static status '+status));return;}
   if(cancel==='headers'){canceled=true;req.destroy();res.destroy();resolveRequest({label,status,canceled:true,cancelAt:'response-headers',receivedBodyBytes:0});return;}
   res.on('data',b=>chunks.push(b));res.on('end',()=>resolveRequest({label,status,canceled,bytes:Buffer.concat(chunks).length,sha256:sha(Buffer.concat(chunks))}));res.on('error',e=>{if(canceled)resolveRequest({label,canceled:true,cancelAt:cancel,clientError:e.code});else reject(e);});
  });req.setTimeout(15000,()=>{req.destroy();reject(Error('Local static request timeout'));});req.on('error',e=>{if(canceled)resolveRequest({label,canceled:true,cancelAt:cancel,clientError:e.code});else reject(e);});
 });
 if(cancel==='inflight'){
  const deadline=Date.now()+10000;while(!observer.events().some(e=>e.kind==='request-lifecycle'&&e.id===id&&e.stage==='start')&&Date.now()<deadline)await pause(5);
  assert.ok(observer.events().some(e=>e.kind==='request-lifecycle'&&e.id===id&&e.stage==='start'),'No observed request start');
  const headersAlreadyObserved=observer.events().some(e=>e.kind==='request-lifecycle'&&e.id===id&&e.stage==='headers');canceled=true;req.destroy();results.push({label,headersAlreadyObservedAtCancel:headersAlreadyObserved});
 }
 const result=await completed;if(!cancel){assert.equal(result.bytes,asset.size);assert.equal(result.sha256,asset.sha256);}results.push(result);
 // Bound observation of asynchronous transport notifications; no service restart.
 await pause(500);results.push({label,observer:observer.status()});
}
try{
 const bindings={WORDPRESS_ADMIN_PASSWORD:'local-static-unused-admin',WORDPRESS_AUTH_SECRET:'local-static-auth',WORDPRESS_ADMIN_CLAIM_SECRET:'local-static-claim',WORDPRESS_OPERATOR_TOKEN:'local-static-disconnect-only',WORDPRESS_SITE_CONTEXTS:JSON.stringify([{id:'default',hostname:'127.0.0.1',origin}]),PLAYTT_PROBE_GATE:'true',PLAYTT_STATE_PARTITION:'static-read-only',PLAYTT_R2_CAPACITY_SCOPE:'playtt-wordpress-session-audit',PLAYTT_R2_CAPACITY_LIMIT_BYTES:'150000000',PLAYTT_R2_WRITE_TRACKING:'v1',PLAYTT_R2_WRITE_WINDOW:'v1'};
 const modules=[{type:'ESModule',path:wrapper},...target.modules.map(e=>({type:e.path.endsWith('.js')?'ESModule':e.path.endsWith('.wasm')?'CompiledWasm':'Data',path:resolve(e.path)}))];
 mf=new Miniflare(convertV4MiniflareOptions({name:workerName,modules,modulesRoot:compiled,host:'127.0.0.1',port:9497,inspectorHost:'127.0.0.1',inspectorPort:9498,compatibilityDate:'2026-07-18',compatibilityFlags:['nodejs_compat','enable_request_signal'],cf:false,log:new Log(LogLevel.ERROR),r2Buckets:['WORDPRESS_STATE_BUCKET'],durableObjects:{PLAYTT_STORAGE_BUDGET:{className:'PlayttStorageBudget',useSQLite:true}},telemetry:{enabled:false},bindings,outboundService:()=>{outboundAttempts++;throw Error('External network forbidden');}}));assert.equal(new URL(String(await mf.ready)).origin,origin);
 const bucket=await mf.getR2Bucket('WORDPRESS_STATE_BUCKET');assert.equal((await bucket.list()).objects.length,0);await bucket.put(manifest.key,blob);const before=await bucket.list();assert.equal(before.objects.length,1);
 observer=await startExceptionAllocationObserver({inspectorUrl:await mf.getInspectorURL(),directory,workerName});owner.phase='running';await writeFile(prefix+'owned-private.json',JSON.stringify(owner,null,2));
 await nativeRequest('control-before');await nativeRequest('cancel-headers','headers');await nativeRequest('cancel-inflight','inflight');await nativeRequest('control-after');
 const observation=await observer.stop();observer=undefined;const after=await bucket.list();assert.deepEqual(after.objects.map(x=>({key:x.key,size:x.size,etag:x.etag})),before.objects.map(x=>({key:x.key,size:x.size,etag:x.etag})));assert.equal(outboundAttempts,0);
 report={schema:'playtt/local-static-disconnect/v1',at:new Date().toISOString(),result:'completed',localOnly:true,cloudRequests:0,candidateBundleSha256:target.modules.find(x=>x.path.endsWith('.js')).sha256,asset:{path:pathname,bytes:asset.size,sha256:asset.sha256},results,observation,wordPressDataSeeded:false,phpInvoked:false,localR2ObjectsBefore:1,localR2ObjectsAfter:1,localR2Unchanged:true,mutableRequestsAllowed:false,outboundAttempts,limitations:['Only intentional local HTTP client cancellation against an immutable asset.','Same text alone cannot retroactively prove the cause of earlier browser exceptions.','No Cloudflare memory/CPU or backend acceptance claim.']};owner.phase='verified';
}catch(e){owner.phase='failed';await writeFile(join(directory,'failure-private.json'),JSON.stringify({name:e.name,message:e.message,results}));throw e;}
finally{if(observer)await observer.stop().catch(()=>{});if(mf)await mf.dispose();owner.localProcessesDisposed=true;await writeFile(prefix+'owned-private.json',JSON.stringify(owner,null,2));}
report.localProcessesDisposed=true;await writeFile(prefix+'summary.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
