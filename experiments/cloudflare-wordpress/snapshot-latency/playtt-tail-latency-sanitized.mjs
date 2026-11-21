import {spawn} from 'node:child_process';
import {appendFile} from 'node:fs/promises';
const label=process.argv.find(a=>a.startsWith('--label='))?.slice(8);
if(!label||!/^[a-z0-9-]{1,40}$/.test(label))throw Error('Explicit bounded diagnostic label required');
const child=spawn(process.execPath,['node_modules/wrangler/bin/wrangler.js','tail','--config','wrangler.playtt-retirement-restore-audit.jsonc','--format','json'],{stdio:['ignore','pipe','pipe']});
const output='artifacts/playtt-latency-'+label+'-observation.jsonl';
let buffer='',depth=0,quoted=false,escaped=false,start=-1,index=0;
const number=v=>Number.isFinite(v)&&v>=0?v:undefined;
const name=v=>typeof v==='string'&&/^[a-z0-9_.-]{1,64}$/i.test(v)?v:undefined;
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
    for(const log of raw.logs||[])for(const message of log.message||[]){try{
     const m=typeof message==='string'?JSON.parse(message):message;
     if(m?.schema==='wp-codebox/cloudflare-runtime-phase-trace/v1')safe.traces.push({operation:name(m.operation),runtime:name(m.runtime),completed:m.completed===true,totalMs:number(m.totalMs),phases:(m.phases||[]).slice(0,64).filter(p=>name(p.name)).map(p=>({name:p.name,durationMs:number(p.durationMs),aggregateGap:p.aggregateGap===true}))});
     if(m?.probe==='playtt'&&m.event==='end'&&name(m.phase))safe.phaseEnds.push({name:m.phase,durationMs:number(m.durationMs)});
     if(m?.schema==='playtt-runtime-retired/v1')safe.retirement={requests:number(m.requests),heapBytes:number(m.heapBytes)};
     if(m?.schema==='playtt-runtime-memory/v1')safe.memory.push({stage:name(m.stage),heapBytes:number(m.heapBytes),fileBytes:number(m.fileBytes)});
     if(m?.schema==='playtt-snapshot-phase/v1')safe.snapshotPhases.push({stage:name(m.stage),durationMs:number(m.durationMs),files:number(m.files),bytes:number(m.bytes),reusedFiles:number(m.reusedFiles),objectReads:number(m.objectReads),runtimeSourceUsed:typeof m.runtimeSourceUsed==='boolean'?m.runtimeSourceUsed:undefined});
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
child.on('exit',async code=>{await writes;console.log(JSON.stringify({tailEnded:code}));process.exitCode=code||0;});
console.log('Collecting numeric request phases only for the private restore audit.');
