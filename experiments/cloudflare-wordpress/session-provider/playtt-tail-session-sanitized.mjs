import {spawn} from 'node:child_process';
import {appendFile} from 'node:fs/promises';
const label=process.argv.find(a=>a.startsWith('--label='))?.slice(8);
if(!label||!/^[a-z0-9-]{1,40}$/.test(label))throw Error('Explicit bounded diagnostic label required');
const child=spawn(process.execPath,['node_modules/wrangler/bin/wrangler.js','tail','--config','wrangler.playtt-session-audit.jsonc','--format','json'],{stdio:['ignore','pipe','pipe']});
const output='artifacts/playtt-session-provider-'+label+'-observation.jsonl';
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
 return {category,method:['GET','POST','PUT','PATCH','DELETE','HEAD','OPTIONS'].includes(request.method)?request.method:'other'};
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
    const safe={at:new Date(raw.eventTimestamp||Date.now()).toISOString(),outcome:name(raw.outcome),version:raw.scriptVersion?.id,entrypoint:name(raw.entrypoint),traces:[],phaseEnds:[],snapshotPhases:[],memory:[],exceptions:(raw.exceptions||[]).map(e=>({name:name(e.name),category:/memory/i.test(e.message)?'memory':/cpu|time limit/i.test(e.message)?'cpu-or-time':'other'}))};
    const request=requestClass(raw.event?.request);if(request)safe.request=request;
    if(typeof raw.event?.cron==='string'&&/^[0-9 *]{1,32}$/.test(raw.event.cron))safe.scheduledEvent={cron:raw.event.cron,scheduledTime:number(raw.event.scheduledTime)};
    for(const log of raw.logs||[])for(const message of log.message||[]){try{
     const m=typeof message==='string'?JSON.parse(message):message;
     if(m?.schema==='wp-codebox/cloudflare-runtime-phase-trace/v1')safe.traces.push({operation:name(m.operation),runtime:name(m.runtime),completed:m.completed===true,totalMs:number(m.totalMs),phases:(m.phases||[]).slice(0,64).filter(p=>name(p.name)).map(p=>({name:p.name,durationMs:number(p.durationMs),aggregateGap:p.aggregateGap===true}))});
     if(m?.probe==='playtt'&&m.event==='end'&&name(m.phase))safe.phaseEnds.push({name:m.phase,durationMs:number(m.durationMs)});
     if(m?.schema==='playtt-runtime-retired/v1')safe.retirement={requests:number(m.requests),heapBytes:number(m.heapBytes)};
     if(m?.schema==='playtt-runtime-memory/v1')safe.memory.push({stage:name(m.stage),heapBytes:number(m.heapBytes),fileBytes:number(m.fileBytes),fileScanPerformed:typeof m.fileScanPerformed==='boolean'?m.fileScanPerformed:undefined,files:number(m.files),unknownFileBuffers:number(m.unknownFileBuffers)});
     if(m?.schema==='playtt-snapshot-phase/v1')safe.snapshotPhases.push({stage:name(m.stage),durationMs:number(m.durationMs),files:number(m.files),bytes:number(m.bytes),reusedFiles:number(m.reusedFiles),objectReads:number(m.objectReads),runtimeSourceUsed:typeof m.runtimeSourceUsed==='boolean'?m.runtimeSourceUsed:undefined});
     if(m?.schema==='playtt/scheduled-auto-draft-maintenance/v1'){safe.maintenanceSchedules??=[];safe.maintenanceSchedules.push({outcome:name(m.outcome),cron:typeof m.cron==='string'&&/^[0-9 *]{1,32}$/.test(m.cron)?m.cron:undefined,scheduledTime:number(m.scheduledTime),eligibleBefore:number(m.eligibleBefore),deleted:number(m.deleted),remainingEligible:number(m.remainingEligible),skipped:number(m.skipped),revision:typeof m.revision==='string'&&/^[a-f0-9-]{36}$/.test(m.revision)?m.revision:undefined,version:number(m.version)});}
     if(m?.schema==='playtt-request-failure/v1'){safe.requestFailures??=[];const b=m.bodyRead;safe.requestFailures.push({category:name(m.category),endpoint:name(m.endpoint),method:name(m.method),operation:name(m.operation),runtime:name(m.runtime),phase:name(m.phase),signalAborted:m.signalAborted===true,bodyUsed:m.bodyUsed===true,cleanupFailed:m.cleanupFailed===true,...(b&&['already-used','locked','aborted','disconnected','context-mismatch','type','other'].includes(b.reason)?{bodyRead:{reason:b.reason,usedBefore:b.usedBefore===true,lockedBefore:b.lockedBefore===true,abortedBefore:b.abortedBefore===true,abortedAfter:b.abortedAfter===true}}:{})});}
    }catch{}}
    writes=writes.then(()=>appendFile(output,JSON.stringify(safe)+'\n'));
    if(safe.traces.length)console.log(JSON.stringify({at:safe.at,outcome:safe.outcome,traces:safe.traces}));
   }catch{console.log('Unparsed event omitted');}
   buffer=buffer.slice(index+1);index=-1;start=-1;
  }
 }
 if(start<0){buffer='';index=0;}
});
child.stderr.on('data',()=>{});
process.on('SIGINT',async()=>{child.kill();await writes;process.exit(0);});
const deadline=setTimeout(()=>child.kill(),315000);
child.on('exit',async code=>{clearTimeout(deadline);await writes;console.log(JSON.stringify({tailEnded:code}));process.exitCode=code||0;});
console.log('Collecting numeric phases and allowlisted request categories for the private audit.');
