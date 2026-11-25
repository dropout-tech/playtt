import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {writeFile} from 'node:fs/promises';
import WebSocket from 'ws';
const label=process.argv.find(a=>a.startsWith('--label='))?.slice(8)||'baseline';assert.match(label,/^[a-z0-9-]+$/);
const targets=await (await fetch('http://127.0.0.1:9444/json/list')).json();
const target=targets.find(t=>t.description==='workers');assert.equal(target.webSocketDebuggerUrl,'ws://127.0.0.1:9444/ws');
const ws=new WebSocket(target.webSocketDebuggerUrl,{origin:'http://localhost:9444',headers:{'User-Agent':'playtt-local-memory-profiler'}});await new Promise((resolve,reject)=>{ws.once('open',resolve);ws.once('error',reject);});
let nextId=0,phase='start',sampling=false,busy=false;const pending=new Map(),samples=[],phases=[];
function send(method,params={}){return new Promise((resolve,reject)=>{const id=++nextId;const timeout=setTimeout(()=>{pending.delete(id);reject(Error('Inspector command timed out: '+method));},30000);pending.set(id,{resolve,reject,timeout});ws.send(JSON.stringify({id,method,params}));});}
ws.addEventListener('message',event=>{
 const message=JSON.parse(event.data);
 if(message.id){const task=pending.get(message.id);if(!task)return;pending.delete(message.id);clearTimeout(task.timeout);message.error?task.reject(Error(message.error.message)):task.resolve(message.result);return;}
 if(message.method==='Runtime.consoleAPICalled')for(const arg of message.params.args||[]){
  if(typeof arg.value!=='string')continue;
  try{const p=JSON.parse(arg.value);if(p.probe==='playtt'&&typeof p.phase==='string'){phase=p.phase+':'+p.event;phases.push({at:Date.now(),phase});}else if(p.schema==='wp-codebox/cloudflare-mutation-phase/v1'){phase='mutation:'+p.phase;phases.push({at:Date.now(),phase,retainedBytes:p.retainedBytes,peakRetainedBytes:p.peakRetainedBytes});}}catch{}
 }
});
await send('Runtime.enable');
if(process.argv.includes('--allocations'))try{await send('HeapProfiler.startSampling',{samplingInterval:65536,includeObjectsCollectedByMajorGC:true,includeObjectsCollectedByMinorGC:true});sampling=true;}catch(error){console.log('Allocation sampling unavailable: '+error.message);}
async function sample(){if(busy)return;busy=true;try{const usage=await send('Runtime.getHeapUsage');samples.push({at:Date.now(),phase,...usage});}finally{busy=false;}}
await sample();const timer=setInterval(()=>sample().catch(()=>{}),100);
const child=spawn(process.execPath,['scripts/playtt-publication-batch-local-check.mjs'],{stdio:['ignore','pipe','pipe']});let childOutput='';
child.stdout.on('data',chunk=>{childOutput+=chunk;process.stdout.write(chunk);});child.stderr.on('data',chunk=>process.stderr.write(chunk));
const exitCode=await new Promise((resolve,reject)=>{child.on('error',reject);child.on('exit',resolve);});clearInterval(timer);await sample();
const finalUsage=await send('Runtime.getHeapUsage');
// Save numeric evidence before optional profiler commands; workerd may not
// answer every CDP HeapProfiler method. Do not force GC during this comparison.
await writeFile('artifacts/playtt-inspector-memory-'+label+'.json',JSON.stringify({at:new Date().toISOString(),label,exitCode,samples,phases,finalUsage},null,2));
let allocationSummary;
if(sampling)try{const {profile}=await send('HeapProfiler.stopSampling');const rows=[];function visit(n){if(n.selfSize)rows.push({functionName:n.callFrame.functionName,url:n.callFrame.url,lineNumber:n.callFrame.lineNumber,bytes:n.selfSize});for(const c of n.children||[])visit(c);}visit(profile.head);allocationSummary=rows.sort((a,b)=>b.bytes-a.bytes).slice(0,30);}catch(error){console.log('Optional allocation summary unavailable: '+error.message);}
const keys=['usedSize','totalSize','embedderHeapUsedSize','backingStorageSize'];
const maxima=Object.fromEntries(keys.map(k=>[k,Math.max(...samples.map(s=>s[k]||0))]));
const report={at:new Date().toISOString(),label,scope:'Local V8 inspector: numeric heap/backing-storage sampling without forced GC; inspector overhead and local GC differ from production',exitCode,samples,phases,maxima,finalUsage,allocationSummary};
await writeFile('artifacts/playtt-inspector-memory-'+label+'.json',JSON.stringify(report,null,2));
console.log(JSON.stringify({exitCode,maxima,finalUsage,topAllocations:allocationSummary?.slice(0,8)}));ws.terminate();process.exitCode=exitCode||0;
