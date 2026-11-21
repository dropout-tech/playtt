// Local-only paired measurement of the pinned editor asset patch, without PHP.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdtemp,open,access} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {createHash} from 'node:crypto';
import {once} from 'node:events';
import {build} from 'esbuild';
import {Miniflare,Log,LogLevel,convertV4MiniflareOptions} from 'miniflare';
import WebSocket from 'ws';
assert.ok(process.argv.includes('--local') && !process.argv.includes('--remote'));
const prefix='artifacts/playtt-editor-byte-allocation-', ownerPath=prefix+'owned-private.json';
await access(ownerPath).then(()=>{throw Error('Existing attempt: inspect without replay');},e=>{if(e.code!=='ENOENT')throw e;});
const sha=b=>createHash('sha256').update(b).digest('hex');
const manifest=JSON.parse(await readFile('assets/wordpress-static-artifact.json','utf8'));
const file=manifest.files.find(x=>x.path==='wordpress/wp-includes/js/dist/editor.min.js');
assert.equal(file.size,1574731);assert.equal(file.sha256,'638befed63bb6937fe54b6f1ec79174c4ec20bef7b5de6ab0948acc9aad2130c');
const original=new Uint8Array(file.size),handle=await open('artifacts/cloudflare-wordpress-static-corpus.bin','r');
try{assert.equal((await handle.read(original,0,file.size,file.offset)).bytesRead,file.size);}finally{await handle.close();}
assert.equal(sha(original),file.sha256);
const directory=await mkdtemp(resolve('artifacts/editor-byte-allocation-'));
const owner={phase:'starting',directory,localOnly:true,disposed:false};
await writeFile(ownerPath,JSON.stringify(owner,null,2),{flag:'wx'});
const sources={baseline:'src/playtt-editor-lock.ts',candidate:'scripts/playtt-editor-lock-byte-candidate.ts'};
const sourceHashes=Object.fromEntries(await Promise.all(Object.entries(sources).map(async([key,path])=>[key,sha((await readFile(path,'utf8')).replaceAll('\r\n','\n'))])));
assert.equal(sourceHashes.baseline,'c61e547c55400355fa19088869215480e8dd4f6b07c01f7ae086f08b4adacb82');
assert.equal(sourceHashes.candidate,'bd22569a66cc2aa22536d33cedaedc51ccfce94c282eadc3a1001f46b0034928');
const runs=[];let outboundAttempts=0,mf,ws;
try{
 for(const [index,variant] of ['baseline','candidate','candidate','baseline','baseline','candidate'].entries()){
  const contents=`import {patchPlayttEditorLock} from './${sources[variant]}';let input,output;export default {async fetch(request){const path=new URL(request.url).pathname;if(path==='/load'&&request.method==='POST'){input=new Uint8Array(await request.arrayBuffer());return new Response(null,{status:204});}if(path==='/patch'&&request.method==='POST'){output=await patchPlayttEditorLock(input);return new Response(null,{status:204});}if(path==='/result'&&request.method==='GET')return new Response(output);return new Response(null,{status:404});}};`;
  const compiled=await build({stdin:{contents,sourcefile:'editor-byte-fixture.ts',resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,format:'esm',target:'es2022',keepNames:true});
  mf=new Miniflare(convertV4MiniflareOptions({name:'playtt-editor-byte-allocation',modules:true,script:compiled.outputFiles[0].text,host:'127.0.0.1',port:9513,inspectorHost:'127.0.0.1',inspectorPort:9514,compatibilityDate:'2026-07-18',cf:false,log:new Log(LogLevel.ERROR),telemetry:{enabled:false},outboundService:()=>{outboundAttempts++;throw Error('External network forbidden');}}));
  await mf.ready;
  const r=await mf.dispatchFetch('http://127.0.0.1:9513/load',{method:'POST',body:original});assert.equal(r.status,204);
  const targets=await (await fetch('http://127.0.0.1:9514/json/list',{signal:AbortSignal.timeout(10000)})).json();
  const target=targets.find(t=>String(t.title||'').includes('playtt-editor-byte-allocation')||String(t.id||'').includes('playtt-editor-byte-allocation'));assert.ok(target);
  const url=new URL(target.webSocketDebuggerUrl);assert.equal(url.host,'127.0.0.1:9514');assert.equal(url.protocol,'ws:');
  ws=new WebSocket(url,{origin:'http://127.0.0.1:9514'});await once(ws,'open');
  let next=0;const pending=new Map();
  ws.on('message',raw=>{const msg=JSON.parse(raw);if(!msg.id)return;const p=pending.get(msg.id);if(!p)return;pending.delete(msg.id);clearTimeout(p.timer);msg.error?p.reject(Error('Inspector command rejected')):p.resolve(msg.result);});
  const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++next,timer=setTimeout(()=>{pending.delete(id);reject(Error('Inspector timeout'));},20000);pending.set(id,{resolve,reject,timer});ws.send(JSON.stringify({id,method,params}));});
  const before=await send('Runtime.getHeapUsage');
  const options={samplingInterval:32768,includeObjectsCollectedByMajorGC:true,includeObjectsCollectedByMinorGC:true};
  await send('HeapProfiler.startSampling',options);
  const start=performance.now();assert.equal((await mf.dispatchFetch('http://127.0.0.1:9513/patch',{method:'POST'})).status,204);
  const wallMs=performance.now()-start,after=await send('Runtime.getHeapUsage');
  const {profile}=await send('HeapProfiler.stopSampling');
  const raw=Buffer.from(JSON.stringify(profile));assert.ok(raw.length<=8*1024*1024);
  await writeFile(join(directory,`${index}-${variant}-profile-private.json`),raw,{flag:'wx'});
  const actual=new Uint8Array(await (await mf.dispatchFetch('http://127.0.0.1:9513/result')).arrayBuffer());
  assert.equal(actual.length,1574744);assert.equal(sha(actual),'ec1e9dc9cdc33309b2b6843bd26a3bec6dffe5e7fc1db0f05f49024e56b9012e');
  const stack=[profile.head];let nodes=0,selfBytes=0,patchSelfBytes=0;
  while(stack.length){const n=stack.pop();nodes++;selfBytes+=n.selfSize;if(n.callFrame.functionName==='patchPlayttEditorLock')patchSelfBytes+=n.selfSize;stack.push(...n.children);}
  runs.push({index,variant,profileBytes:raw.length,profileSha256:sha(raw),options,nodes,samples:profile.samples.length,selfBytes,patchSelfBytes,sampleSizeSum:profile.samples.reduce((s,x)=>s+x.size,0),before,after,wallMs,outputBytes:actual.length,outputSha256:sha(actual)});
  ws.terminate();ws=undefined;await mf.dispose();mf=undefined;
 }
 assert.equal(outboundAttempts,0);owner.phase='verified';
 const result={schema:'playtt/editor-byte-allocation/v1',result:'pass',at:new Date().toISOString(),sourceHashes,runs,cloudRequests:0,outboundAttempts,productionChanged:false,centralSourceChanged:false,scope:'Six fresh local workerd instances; one asset patch each, with original bytes loaded before sampling. No PHP or website state.',limitations:['Cumulative sampled JS allocations including collected objects; not live peak, provider limit, RSS, billed CPU or end-to-end editor latency.','Input/output buffers and native digest allocations are not fully represented by function selfSize.','HeapUsage before/after are snapshots and may cross a GC boundary; do not infer peak from their difference.','Alternating order controls some warm-up effects but six local runs do not establish sustained behavior.']};
 await writeFile(prefix+'summary.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});
 console.log(JSON.stringify({result:result.result,runs:runs.map(({index,variant,selfBytes,patchSelfBytes,outputSha256})=>({index,variant,selfBytes,patchSelfBytes,outputSha256})),cloudRequests:0}));
}catch(e){owner.phase='failed';await writeFile(join(directory,'failure-private.json'),JSON.stringify({name:e.name,message:e.message,stack:e.stack}));throw e;}
finally{ws?.terminate();if(mf)await mf.dispose();owner.disposed=true;await writeFile(ownerPath,JSON.stringify(owner,null,2));}
