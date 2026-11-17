import {spawn} from 'node:child_process';
import {appendFile} from 'node:fs/promises';
const label=process.argv.find(arg=>arg.startsWith('--label='))?.slice(8);
if(label&&!/^[a-z0-9-]+$/.test(label))throw Error('Invalid diagnostic label');
const output='artifacts/playtt-'+(label||'publication')+'-memory-observation.jsonl';
const child=spawn(process.execPath,['node_modules/wrangler/bin/wrangler.js','tail','--config','wrangler.playtt-cms-publish-restore.jsonc','--format','json'],{stdio:['ignore','pipe','pipe']});
let buffer='',depth=0,quoted=false,escaped=false,start=-1,index=0;
child.stdout.on('data',chunk=>{
 buffer+=chunk.toString();
 for(;index<buffer.length;index++){
  const c=buffer[index];
  if(start<0){if(c==='{'){start=index;depth=1;}continue;}
  if(quoted){if(escaped)escaped=false;else if(c==='\\')escaped=true;else if(c==='"')quoted=false;continue;}
  if(c==='"')quoted=true;else if(c==='{')depth++;else if(c==='}')depth--;
  if(depth===0){
   try {const raw=JSON.parse(buffer.slice(start,index+1));const safe={at:new Date(raw.eventTimestamp||Date.now()).toISOString(),outcome:raw.outcome,cpuTime:raw.cpuTime,wallTime:raw.wallTime,executionModel:raw.executionModel,entrypoint:raw.entrypoint,version:raw.scriptVersion?.id,exceptions:(raw.exceptions||[]).map(e=>({name:e.name,message:e.message}))};
    const memory=[];const generations=[];for(const log of raw.logs||[])for(const message of log.message||[]){try{const m=typeof message==='string'?JSON.parse(message):message;if(m?.schema==='playtt-runtime-generation/v1'&&Number.isInteger(m.generation))generations.push(m.generation);if(m?.schema==='playtt-runtime-memory/v1')memory.push({stage:m.stage,heapBytes:m.heapBytes,fileBytes:m.fileBytes,files:m.files,heapAliasedFileBytes:m.heapAliasedFileBytes,categories:m.categories?Object.fromEntries(Object.entries(m.categories).filter(([k,v])=>['temporary','runtime','wordpress-core','plugins-and-theme','canonical','languages','uploads'].includes(k)&&Number.isFinite(v))):undefined,phpMemory:m.phpMemory?Object.fromEntries(Object.entries(m.phpMemory).filter(([k,v])=>['used','allocated','peakUsed','peakAllocated'].includes(k)&&Number.isFinite(v))):undefined});}catch{}}if(generations.length)safe.generations=generations;if(memory.length){safe.memory=memory;console.log(JSON.stringify({at:safe.at,memory}));}
    appendFile(output,JSON.stringify(safe)+'\n').catch(()=>{});if(raw.outcome!=='ok')console.log(JSON.stringify(safe));
   }catch{console.log('Unparsed tail event omitted');}
   buffer=buffer.slice(index+1);index=-1;start=-1;
  }
 }
 if(start<0){buffer='';index=0;}
});
child.stderr.on('data',()=>{});
process.on('SIGINT',()=>{child.kill();process.exit(0);});
child.on('exit',code=>{console.log(JSON.stringify({tailEnded:code}));process.exitCode=code||0;});
console.log('Collecting sanitized playtt runtime outcomes; request headers and logs are omitted.');
