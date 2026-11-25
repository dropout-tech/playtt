// Local workerd inspector only; this never connects to a browser or provider.
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import WebSocket from 'ws';
export async function startEditorProfiler({inspectorUrl,directory,workerName}){
 const base=new URL(inspectorUrl);assert.equal(base.hostname,'127.0.0.1');assert.equal(base.port,'9484');assert.ok(['http:','ws:'].includes(base.protocol));base.protocol='http:';
 const r=await fetch(new URL('/json/list',base),{signal:AbortSignal.timeout(10000)});assert.equal(r.status,200);const targets=await r.json();assert.ok(Array.isArray(targets)&&targets.length<=20);
 const target=targets.find(t=>String(t.title||'').includes(workerName)||String(t.id||'').includes(workerName))||targets.find(t=>t.description==='workers');assert.ok(target,'Owned workerd target unavailable');
 const url=new URL(target.webSocketDebuggerUrl);assert.equal(url.protocol,'ws:');assert.equal(url.hostname,'127.0.0.1');assert.equal(url.port,'9484');
 const ws=new WebSocket(url,{origin:base.origin});await new Promise((resolve,reject)=>{ws.once('open',resolve);ws.once('error',reject);});
 let id=0,label='bootstrap',phase='idle',busy=false,stopped=false,cpu=false;const pending=new Map(),samples=[],events=[],sampleErrors=[];
 const send=(method,params={})=>new Promise((resolve,reject)=>{const key=++id,timer=setTimeout(()=>{pending.delete(key);reject(Error('Inspector timeout: '+method));},20000);pending.set(key,{resolve,reject,timer});ws.send(JSON.stringify({id:key,method,params}));});
 const numeric=v=>typeof v==='number'&&Number.isFinite(v)&&v>=0?v:undefined;
 ws.on('message',raw=>{const m=JSON.parse(raw.toString());if(m.id){const p=pending.get(m.id);if(!p)return;pending.delete(m.id);clearTimeout(p.timer);m.error?p.reject(Error(m.error.message)):p.resolve(m.result);return;}
  if(m.method!=='Runtime.consoleAPICalled')return;
  for(const arg of m.params?.args||[]){if(typeof arg.value!=='string')continue;let p;try{p=JSON.parse(arg.value);}catch{continue;}
   const at=Date.now();
   if(p.probe==='playtt'&&typeof p.phase==='string'&&/^[a-z.-]{1,80}$/.test(p.phase)&&['start','end'].includes(p.event)){phase=p.phase+':'+p.event;events.push({at,label,kind:'phase',phase,durationMs:numeric(p.durationMs)});}
   if(p.schema==='playtt-runtime-memory/v1'){const memory=Object.fromEntries(['heapBytes','fileBytes','files','heapAliasedFileBytes','unknownFileBuffers'].map(k=>[k,numeric(p[k])]).filter(([,v])=>v!==undefined));events.push({at,label,kind:'php-memory',stage:['before-request','after-request','after-persist'].includes(p.stage)?p.stage:'other',...memory,categories:p.categories?Object.fromEntries(Object.entries(p.categories).filter(([k,v])=>['temporary','runtime','wordpress-core','plugins-and-theme','canonical','languages','uploads'].includes(k)&&numeric(v)!==undefined)):undefined});}
   if(p.schema==='wp-codebox/cloudflare-runtime-phase-trace/v1')events.push({at,label,kind:'trace',operation:['read','mutation'].includes(p.operation)?p.operation:'other',runtime:['cold','warm','invalidated'].includes(p.runtime)?p.runtime:'other',completed:p.completed===true,totalMs:numeric(p.totalMs),phases:(p.phases||[]).filter(x=>/^[a-z.-]{1,80}$/.test(x.name)).map(x=>({name:x.name,durationMs:numeric(x.durationMs)}))});
   if(p.schema==='playtt/editor-profile-request/v1')events.push({at,label,kind:'request',category:['login','profile','post-editor','site-editor','ajax','rest','asset','other'].includes(p.category)?p.category:'other',method:['GET','POST','PUT','DELETE'].includes(p.method)?p.method:'other',status:numeric(p.status),wallMs:numeric(p.wallMs),version:numeric(p.version)});
  }
 });
 await send('Runtime.enable');
 try{await send('Profiler.enable');await send('Profiler.start');cpu=true;}catch(e){sampleErrors.push({kind:'cpu-unavailable',message:e.message});}
 async function sample(){if(busy||stopped)return;busy=true;try{const usage=await send('Runtime.getHeapUsage');samples.push({at:Date.now(),label,phase,...Object.fromEntries(['usedSize','totalSize','embedderHeapUsedSize','backingStorageSize'].map(k=>[k,numeric(usage[k])]).filter(([,v])=>v!==undefined))});}catch(e){sampleErrors.push({kind:'heap-sample',message:e.message});}finally{busy=false;}}
 await sample();const timer=setInterval(()=>{void sample();},100);
 async function mark(next){assert.ok(['gate','login','post-cold','post-warm','site-editor','profile','logout','closing'].includes(next));label=next;await sample();return {label,samples:samples.length,latest:samples.at(-1)};}
 async function stop(){clearInterval(timer);const deadline=Date.now()+22000;while(busy&&Date.now()<deadline)await new Promise(r=>setTimeout(r,20));await sample();stopped=true;let cpuSummary;
  try{if(cpu){const {profile}=await send('Profiler.stop');await writeFile(directory+'/cpu-private.json',JSON.stringify(profile));const totals=new Map(),byId=new Map(profile.nodes.map(n=>[n.id,n]));
   for(let i=0;i<(profile.samples||[]).length;i++){const n=byId.get(profile.samples[i]);if(!n)continue;const raw=n.callFrame.functionName||'(anonymous)',name=/^[A-Za-z0-9_$().:<>\[\] -]{1,140}$/.test(raw)?raw:'other';totals.set(name,(totals.get(name)||0)+(profile.timeDeltas?.[i]||0));}
   cpuSummary={sampledMicroseconds:[...totals.values()].reduce((a,b)=>a+b,0),functions:[...totals].map(([functionName,microseconds])=>({functionName,microseconds})).sort((a,b)=>b.microseconds-a.microseconds).slice(0,35),rawProfilePrivate:true};
  }}catch(e){sampleErrors.push({kind:'cpu-stop',message:e.message});}
  const report={schema:'playtt/local-editor-profiler/v1',at:new Date().toISOString(),scope:'Owned local workerd CDP; numeric heap/backing storage and sampled CPU, not Cloudflare whole-isolate/RSS or billed CPU',samplingIntervalMs:100,forcedGc:false,samples,events,sampleErrors,cpuSummary,stopped:true};await writeFile(directory+'/profile.json',JSON.stringify(report,null,2)+'\n');ws.terminate();for(const p of pending.values()){clearTimeout(p.timer);p.reject(Error('Profiler stopped'));}pending.clear();return {samples:samples.length,events:events.length,sampleErrors:sampleErrors.length,cpuAvailable:!!cpuSummary,stopped:true};
 }
 return {mark,stop,status:()=>({label,samples:samples.length,events:events.length,busy,stopped})};
}
