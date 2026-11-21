import { spawn } from 'node:child_process';
import { appendFile } from 'node:fs/promises';
const child=spawn(process.execPath,['node_modules/wrangler/bin/wrangler.js','tail','playtt-wp-free-cms-probe','--format','json'],{stdio:['ignore','pipe','pipe']});
let buffer='',depth=0,quoted=false,escaped=false,start=-1;
child.stdout.on('data',chunk=>{
  for(const c of chunk.toString()){
    buffer+=c;
    if(start<0){if(c==='{'){start=buffer.length-1;depth=1;}continue;}
    if(quoted){if(escaped)escaped=false;else if(c==='\\')escaped=true;else if(c==='"')quoted=false;continue;}
    if(c==='"')quoted=true;else if(c==='{')depth++;else if(c==='}')depth--;
    if(depth===0){
      let event;try{event=JSON.parse(buffer.slice(start));}catch{buffer='';start=-1;continue;}
      const phases=[];
      for(const log of event.logs||[])for(const message of log.message||[]){
        let item;try{item=JSON.parse(message);}catch{continue;}
        if(['playtt','playtt-php'].includes(item.probe)&&/^[a-z0-9_.-]{1,64}$/i.test(item.phase||''))phases.push({phase:item.phase,event:item.event,phpBytes:item.phpBytes,phpPeakBytes:item.phpPeakBytes});
      }
      const report={at:new Date(event.eventTimestamp||Date.now()).toISOString(),outcome:event.outcome,phases,
        exceptions:(event.exceptions||[]).map(e=>({name:e.name,category:/memory/i.test(e.message)?'memory':/cpu|time limit/i.test(e.message)?'cpu':String(e.message).slice(0,180)}))};
      console.log(JSON.stringify(report));void appendFile('artifacts/playtt-cms-safe-tail.jsonl',JSON.stringify(report)+'\n');
      buffer='';start=-1;
    }
  }
});
child.stderr.on('data',()=>{});
process.on('SIGINT',()=>{child.kill();process.exit(0);});
setTimeout(()=>{child.kill();process.exit(0);},180000);
