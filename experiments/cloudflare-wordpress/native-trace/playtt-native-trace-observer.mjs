// Wait for native internal PHP completion; an outer HTTP event alone is insufficient.
// Existing observation remains immutable; this is a new helper with separate evidence.
// Exact audit worker/config only; requests and logs use closed vocabularies.
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {appendFile,writeFile,access} from 'node:fs/promises';
import {setTimeout as delay} from 'node:timers/promises';
export async function startPlayttProviderObserver({expectedVersion,prefix,durationSeconds=660,spawnProcess=spawn,now=Date.now,sleep=delay}) {
 assert.match(expectedVersion,/^[a-f0-9-]{36}$/);assert.match(prefix,/^artifacts\/playtt-[a-z0-9-]+$/);
 assert.equal(durationSeconds,660);
 const readyPath=prefix+'-ready.json',output=prefix+'-observation.jsonl';
 for(const p of [readyPath,output]){try{await access(p);throw Error('Existing observer output; do not replay');}catch(e){if(e.code!=='ENOENT')throw e;}}
 const startedAt=now(),expiresAt=startedAt+durationSeconds*1000;
 const observedVersions=new Set(),records=[];let sequence=0;
 let ready=false,unparsed=0,ended=false,endCode,childError;
 const child=spawnProcess(process.execPath,['node_modules/wrangler/bin/wrangler.js','tail','--config','wrangler.playtt-session-audit.jsonc','--format','json'],{stdio:['ignore','pipe','pipe']});
let buffer='',depth=0,quoted=false,escaped=false,start=-1,index=0;
const number=v=>Number.isFinite(v)&&v>=0?v:undefined;
const name=v=>typeof v==='string'&&/^[a-z0-9_.-]{1,64}$/i.test(v)?v:undefined;
// Classify only against a closed vocabulary; never retain a URL, query, header,
// arbitrary route segment or request body from the platform envelope.
function requestClass(request){
 if(!request||typeof request.url!=='string')return undefined;
 let url;try{url=new URL(request.url);}catch{return {category:'invalid-url'};}
 const path=url.pathname;
 const exact={'/wp-login.php':'wp-login','/wp-cron.php':'wp-cron','/wp-admin/admin-ajax.php':'admin-ajax','/wp-admin/async-upload.php':'media-upload','/wp-admin/post.php':'post-editor','/wp-admin/post-new.php':'new-editor','/wp-admin/site-editor.php':'site-editor','/__playtt-probe-access':'probe-login','/__playtt-publishing':'publisher','/':'front-page'};
 let category=exact[path];
 if(url.searchParams.has('phase'))category='operator';
 if(!category&&path.startsWith('/wp-json/')){const endpoint=/^\/wp-json\/wp\/v2\/(pages|posts|media|users|navigation|template-parts|templates|global-styles|themes|settings|blocks)(?:\/|$)/.exec(path)?.[1];category=endpoint?'rest-'+endpoint:'rest-other';}
 if(!category)category=path.startsWith('/wp-admin/')?'admin-other':path.startsWith('/wp-includes/')?'core-asset':path.startsWith('/wp-content/')?'site-asset':'other';
 const kind=category==='wp-login'?(url.searchParams.get('action')==='logout'?'logout':'login'):category==='rest-pages'?(path==='/wp-json/wp/v2/pages/193/autosaves'?'owned-autosave':path==='/wp-json/wp/v2/pages/193'?'owned-page':'other-page'):undefined;
 return {category,...(kind?{kind}:{}),method:['GET','POST','PUT','PATCH','DELETE','HEAD','OPTIONS'].includes(request.method)?request.method:'other'};
}
let writes=Promise.resolve();
child.stdout.on('data',chunk=>{
 buffer+=chunk.toString();
 for(;index<buffer.length;index++){
  const c=buffer[index];if(start<0){if(c==='{'){start=index;depth=1;}continue;}
  if(quoted){if(escaped)escaped=false;else if(c==='\\')escaped=true;else if(c==='"')quoted=false;continue;}
  if(c==='"')quoted=true;else if(c==='{')depth++;else if(c==='}')depth--;
  if(depth===0){
   try{
    const raw=JSON.parse(buffer.slice(start,index+1));
    const safe={sequence:++sequence,receivedAt:now(),rawLogCount:Array.isArray(raw.logs)?raw.logs.length:0,truncated:raw.truncated===true,executionModel:['durableObject','stateless'].includes(raw.executionModel)?raw.executionModel:undefined,at:new Date(raw.eventTimestamp||Date.now()).toISOString(),outcome:name(raw.outcome),version:raw.scriptVersion?.id,entrypoint:['PlayttWordPressExecution','WordPressStateCoordinator','PlayttStorageBudget'].includes(raw.entrypoint)?raw.entrypoint:undefined,traces:[],phaseEnds:[],snapshotPhases:[],memory:[],mutation:[],exceptions:(raw.exceptions||[]).map(e=>({name:name(e.name),category:/memory/i.test(e.message)?'memory':/cpu|time limit/i.test(e.message)?'cpu-or-time':'other'}))};
    const request=requestClass(raw.event?.request);if(request)safe.request=request;
    const status=raw.event?.response?.status;if(Number.isInteger(status)&&status>=100&&status<=599)safe.status=status;
    if(!/^[a-f0-9-]{36}$/.test(safe.version||''))delete safe.version;
    if(safe.version&&safe.outcome==='ok'&&request?.category==='operator')observedVersions.add(safe.version);
    if(typeof raw.event?.cron==='string'&&/^[0-9 *]{1,32}$/.test(raw.event.cron))safe.scheduledEvent={cron:raw.event.cron,scheduledTime:number(raw.event.scheduledTime)};
    for(const log of raw.logs||[])for(const message of log.message||[]){try{
     const m=typeof message==='string'?JSON.parse(message):message;
     if(m?.schema==='wp-codebox/cloudflare-runtime-phase-trace/v1')safe.traces.push({operation:name(m.operation),runtime:name(m.runtime),completed:m.completed===true,totalMs:number(m.totalMs),phases:(m.phases||[]).slice(0,64).filter(p=>name(p.name)).map(p=>({name:p.name,durationMs:number(p.durationMs),aggregateGap:p.aggregateGap===true}))});
     if(m?.probe==='playtt'&&m.event==='end'&&name(m.phase))safe.phaseEnds.push({name:m.phase,durationMs:number(m.durationMs)});
     if(m?.schema==='wp-codebox/cloudflare-mutation-phase/v1')safe.mutation.push({phase:name(m.phase),elapsedMs:number(m.elapsedMs),retainedBytes:number(m.retainedBytes),peakRetainedBytes:number(m.peakRetainedBytes),files:number(m.files),bytes:number(m.bytes),puts:number(m.puts),peakActive:number(m.peakActive),peakBytes:number(m.peakBytes)});
     if(m?.schema==='playtt-runtime-retired/v1')safe.retirement={requests:number(m.requests),heapBytes:number(m.heapBytes)};
     if(m?.schema==='playtt-runtime-memory/v1')safe.memory.push({stage:name(m.stage),heapBytes:number(m.heapBytes),fileBytes:number(m.fileBytes),fileScanPerformed:typeof m.fileScanPerformed==='boolean'?m.fileScanPerformed:undefined,files:number(m.files),unknownFileBuffers:number(m.unknownFileBuffers)});
     if(m?.schema==='playtt-snapshot-phase/v1')safe.snapshotPhases.push({stage:name(m.stage),durationMs:number(m.durationMs),files:number(m.files),bytes:number(m.bytes),reusedFiles:number(m.reusedFiles),objectReads:number(m.objectReads),runtimeSourceUsed:typeof m.runtimeSourceUsed==='boolean'?m.runtimeSourceUsed:undefined});
     if(m?.schema==='playtt/scheduled-auto-draft-maintenance/v1'){safe.maintenanceSchedules??=[];safe.maintenanceSchedules.push({outcome:name(m.outcome),cron:typeof m.cron==='string'&&/^[0-9 *]{1,32}$/.test(m.cron)?m.cron:undefined,scheduledTime:number(m.scheduledTime),eligibleBefore:number(m.eligibleBefore),deleted:number(m.deleted),remainingEligible:number(m.remainingEligible),skipped:number(m.skipped),revision:typeof m.revision==='string'&&/^[a-f0-9-]{36}$/.test(m.revision)?m.revision:undefined,version:number(m.version)});}
     if(m?.schema==='playtt-request-failure/v1'){safe.requestFailures??=[];const b=m.bodyRead;safe.requestFailures.push({category:name(m.category),endpoint:name(m.endpoint),method:name(m.method),operation:name(m.operation),runtime:name(m.runtime),phase:name(m.phase),signalAborted:m.signalAborted===true,bodyUsed:m.bodyUsed===true,cleanupFailed:m.cleanupFailed===true,...(b&&['already-used','locked','aborted','disconnected','context-mismatch','type','other'].includes(b.reason)?{bodyRead:{reason:b.reason,usedBefore:b.usedBefore===true,lockedBefore:b.lockedBefore===true,abortedBefore:b.abortedBefore===true,abortedAfter:b.abortedAfter===true}}:{})});}
    }catch{}}
    records.push(safe);
    writes=writes.then(()=>appendFile(output,JSON.stringify(safe)+'\n'));
    if(!ready && safe.version===expectedVersion && safe.outcome==='ok' && safe.request?.category==='operator'){ready=true;writes=writes.then(()=>writeFile(readyPath,JSON.stringify({at:safe.at,version:safe.version,operatorEventObserved:true})+'\n',{flag:'wx'}));}

   }catch{unparsed++;}
   buffer=buffer.slice(index+1);index=-1;start=-1;
  }
 }
 if(start<0){buffer='';index=0;}
});
child.stderr.on('data',()=>{});

 const terminal=new Promise(resolve=>{child.once('error',e=>{childError=e.name;ended=true;resolve();});child.once('close',code=>{ended=true;endCode=code;resolve();});});
 const deadline=setTimeout(()=>child.kill(),durationSeconds*1000);
 function assertLive(minimumRemainingMs=0,requireReady=true){
  assert.ok(!ended&&!child.killed&&child.exitCode===null&&child.signalCode===null&&!childError,'Observer process is not live');
  assert.ok(now()+minimumRemainingMs<expiresAt,'Observer deadline is too close');
  if(requireReady)assert.ok(ready,'Matching version operator event not observed');
  return {ready,startedAt,expiresAt,remainingMs:expiresAt-now(),live:true};
 }
 async function stop(){clearTimeout(deadline);if(!ended&&!child.killed)child.kill();await terminal;await writes;return {ready,startedAt,expiresAt,ended,endedAt:now(),endCode,childError,unparsed};}
 function markNativeStart(){assertLive(60000);return sequence;}
 function nativeEvidence(afterSequence){
  assert.ok(Number.isSafeInteger(afterSequence)&&afterSequence>=0&&afterSequence<=sequence);
  const matched=records.filter(e=>e.sequence>afterSequence&&e.version===expectedVersion&&e.request?.category==='wp-login'&&e.request.kind==='login'&&e.request.method==='GET');
  const outer=matched.filter(e=>e.status===200&&e.executionModel!=='durableObject'&&e.entrypoint!=='PlayttWordPressExecution'&&e.traces.length===0),internal=matched.filter(e=>e.outcome==='ok'&&e.traces.some(t=>t.operation==='read'&&t.completed&&t.phases.some(p=>p.name==='request.php')));
  return{outerEvents:outer.length,internalEvents:internal.length,coldInternalEvents:internal.filter(e=>e.traces.some(t=>t.runtime==='cold'&&t.completed)).length,nativeExceptions:matched.flatMap(e=>e.exceptions).length,
   nativeFailureEvents:matched.filter(e=>e.outcome!=='ok'||e.status>=400||e.exceptions.length>0).length,truncatedNativeEvents:matched.filter(e=>e.truncated).length,
   lastMatchedReceivedAt:matched.length?Math.max(...matched.map(e=>e.receivedAt)):null,matchingSequences:matched.map(e=>e.sequence)};
 }
 async function waitForNativeTrace({afterSequence,timeoutMs=45000,settleMs=5000,pollMs=250}={}){
  assert.ok(Number.isSafeInteger(timeoutMs)&&timeoutMs>0&&timeoutMs<=60000);assert.ok(Number.isSafeInteger(settleMs)&&settleMs>=0&&settleMs<timeoutMs);assert.ok(Number.isSafeInteger(pollMs)&&pollMs>0&&pollMs<=1000);
  assertLive(timeoutMs+1000);const began=now(),until=began+timeoutMs;let evidence;
  while(true){assertLive(0);await writes;evidence=nativeEvidence(afterSequence);const complete=evidence.outerEvents>0&&evidence.internalEvents>0;
   if((complete||evidence.nativeFailureEvents>0)&&now()-evidence.lastMatchedReceivedAt>=settleMs)return{status:evidence.nativeFailureEvents?'native-failure':evidence.truncatedNativeEvents?'truncated':'complete',...evidence,waitedMs:now()-began,settleMs};
   if(now()>=until)return{status:evidence.nativeFailureEvents?'native-failure':evidence.truncatedNativeEvents?'truncated':evidence.outerEvents?'internal-trace-missing':'outer-event-missing',...evidence,waitedMs:now()-began,settleMs};
   await sleep(Math.min(pollMs,until-now()));
  }
 }
 return {assertLive,stop,markNativeStart,waitForNativeTrace,async observedVersion(version){assert.match(version,/^[a-f0-9-]{36}$/);assertLive(0,false);await writes;return observedVersions.has(version);},async ready(){assertLive(0,false);await writes;return ready;},terminal};
}
