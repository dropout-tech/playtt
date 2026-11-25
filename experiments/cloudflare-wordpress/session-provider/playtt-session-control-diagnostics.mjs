// Limited startup diagnostics on the empty, private session-audit Worker.
import {spawn} from 'node:child_process';
import {readFile,writeFile,appendFile} from 'node:fs/promises';
const secrets=JSON.parse(await readFile('../../../playtt-cms-secrets.json','utf8'));
const values=Object.values(secrets).filter(x=>typeof x==='string'&&x.length>=8);
const child=spawn(process.execPath,['node_modules/wrangler/bin/wrangler.js','tail','--config','wrangler.playtt-session-audit.jsonc','--format','json'],{stdio:['ignore','pipe','pipe']});
let buffer='',depth=0,quoted=false,escaped=false,start=-1,index=0,writes=Promise.resolve();
child.stdout.on('data',chunk=>{buffer+=chunk.toString();for(;index<buffer.length;index++){
 const c=buffer[index];if(start<0){if(c==='{'){start=index;depth=1;}continue;}
 if(quoted){if(escaped)escaped=false;else if(c==='\\')escaped=true;else if(c==='"')quoted=false;continue;}
 if(c==='"')quoted=true;else if(c==='{')depth++;else if(c==='}')depth--;
 if(depth===0){try{const raw=JSON.parse(buffer.slice(start,index+1));const safe={at:new Date(raw.eventTimestamp||Date.now()).toISOString(),outcome:raw.outcome,entrypoint:raw.entrypoint,version:raw.scriptVersion?.id,exceptions:(raw.exceptions||[]).map(e=>({name:e.name,message:typeof e.message==='string'&&e.message.length<2048&&!values.some(v=>e.message.includes(v))?e.message:'omitted'}))};writes=writes.then(()=>appendFile('artifacts/playtt-session-provider-control-observation-private.jsonl',JSON.stringify(safe)+'\n'));console.log(JSON.stringify(safe));}catch{}buffer=buffer.slice(index+1);index=-1;start=-1;}
}if(start<0){buffer='';index=0;}});
child.stderr.on('data',()=>{});const timeout=setTimeout(()=>child.kill(),45000);
child.on('exit',async code=>{clearTimeout(timeout);await writes;console.log(JSON.stringify({tailEnded:code}));});
const trigger=setTimeout(async()=>{
 const checks=[];for(const path of ['/__playtt-capacity','/?phase=operator-fence-status']){const r=await fetch('https://playtt-wp-free-session-audit.muzhi-garden-platform.workers.dev'+path,{headers:{authorization:'Bearer '+secrets.WORDPRESS_OPERATOR_TOKEN,'X-Playtt-Probe':secrets.WORDPRESS_OPERATOR_TOKEN},signal:AbortSignal.timeout(20000),redirect:'error'});checks.push({path,status:r.status});await r.body?.cancel();}
 await writeFile('artifacts/playtt-session-provider-control-check.json',JSON.stringify({at:new Date().toISOString(),checks},null,2)+'\n');console.log(JSON.stringify({checks}));
},5000);child.on('exit',()=>clearTimeout(trigger));
