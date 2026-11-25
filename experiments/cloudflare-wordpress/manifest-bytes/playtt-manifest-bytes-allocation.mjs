// Six fresh local workerd instances decode an independently verified private manifest.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdtemp,access} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {createHash} from 'node:crypto';
import {once} from 'node:events';
import {build} from 'esbuild';
import {compile,sourceHashes,api} from './playtt-manifest-bytes-common.mjs';
import {openSnapshotBundle} from './playtt-snapshot-bundle.mjs';
import {Miniflare,Log,LogLevel,convertV4MiniflareOptions} from 'miniflare';
import WebSocket from 'ws';
assert.ok(process.argv.includes('--local')&&!process.argv.includes('--remote'));
const sha=b=>createHash('sha256').update(b).digest('hex'),load=async p=>JSON.parse(await readFile(p,'utf8'));
const attempt=process.argv.find(x=>x.startsWith('--attempt='))?.slice(10)||'1';assert.match(attempt,/^[1-9][0-9]?$/);
const prefix=`artifacts/playtt-manifest-bytes-allocation-${attempt}-`,ownerPath=prefix+'owned-private.json';
await access(ownerPath).then(()=>{throw Error('Existing attempt: inspect without replay');},e=>{if(e.code!=='ENOENT')throw e;});
const prior=await load('artifacts/playtt-owned-paths-native-v2-owned-private.json');
assert.equal(prior.phase,'verified');assert.equal(prior.localProcessesDisposed,true);
const verified=await openSnapshotBundle(join(prior.directory,'independent'),prior.finalAnchor);
const wire=verified.graph.objects.find(x=>x.key===prior.finalAnchor.manifestKey).bytes;
assert.equal(sha(wire),prior.finalAnchor.manifestSha256);
const codec=await api('baseline'),expected=await codec.decodeCanonicalManifestBytes(wire,'sites/default');
assert.ok(codec.isManifestEnvelope(JSON.parse(new TextDecoder().decode(wire))));
const iterations=20,payload=JSON.stringify({wire:new TextDecoder().decode(wire),iterations});
const resultExpected={iterations,logicalBytes:Buffer.byteLength(JSON.stringify(expected)),logicalSha256:sha(JSON.stringify(expected))};
const directory=await mkdtemp(resolve('artifacts/manifest-bytes-allocation-')),owner={phase:'starting',directory,disposed:false};
await writeFile(ownerPath,JSON.stringify(owner,null,2),{flag:'wx'});
const runs=[];let mf,ws,outboundAttempts=0;
try{
 for(const [index,variant]of ['baseline','candidate','candidate','baseline','baseline','candidate'].entries()){
  const fixture=`import {decodeCanonicalManifestBytes} from 'manifest-byte-module';let bytes,iterations;const hash=async b=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',b)),v=>v.toString(16).padStart(2,'0')).join('');export default {async fetch(request){const path=new URL(request.url).pathname;if(path==='/load'&&request.method==='POST'){const data=await request.json();bytes=new TextEncoder().encode(data.wire);iterations=data.iterations;return new Response(null,{status:204});}if(path==='/validate'&&request.method==='POST'){let decoded;for(let i=0;i<iterations;i++)decoded=await decodeCanonicalManifestBytes(bytes,'sites/default');const logical=new TextEncoder().encode(JSON.stringify(decoded));return Response.json({iterations,logicalBytes:logical.length,logicalSha256:await hash(logical)});}return new Response(null,{status:404});}};`;
  const compiled=await compile(variant,fixture);
  mf=new Miniflare(convertV4MiniflareOptions({name:'playtt-manifest-bytes-allocation',modules:true,script:compiled.outputFiles[0].text,host:'127.0.0.1',port:9525,inspectorHost:'127.0.0.1',inspectorPort:9526,compatibilityDate:'2026-07-18',cf:false,log:new Log(LogLevel.ERROR),telemetry:{enabled:false},outboundService:()=>{outboundAttempts++;throw Error('External network forbidden');}}));await mf.ready;
  assert.equal((await mf.dispatchFetch('http://127.0.0.1:9525/load',{method:'POST',body:payload})).status,204);
  const targets=await(await fetch('http://127.0.0.1:9526/json/list',{signal:AbortSignal.timeout(10000)})).json();
  const target=targets.find(t=>String(t.title||'').includes('playtt-manifest-bytes-allocation')||String(t.id||'').includes('playtt-manifest-bytes-allocation'));assert.ok(target);
  const endpoint=new URL(target.webSocketDebuggerUrl);assert.equal(endpoint.protocol,'ws:');assert.equal(endpoint.host,'127.0.0.1:9526');
  ws=new WebSocket(endpoint,{origin:'http://127.0.0.1:9526'});await once(ws,'open');let id=0;const pending=new Map();
  const send=(method,params={})=>new Promise((resolve,reject)=>{const key=++id,timer=setTimeout(()=>{pending.delete(key);reject(Error('Inspector timeout'));},20000);pending.set(key,{resolve,reject,timer});ws.send(JSON.stringify({id:key,method,params}));});
  ws.on('message',raw=>{const msg=JSON.parse(raw);const p=pending.get(msg.id);if(!p)return;pending.delete(msg.id);clearTimeout(p.timer);msg.error?p.reject(Error('Inspector rejected command')):p.resolve(msg.result);});
  const before=await send('Runtime.getHeapUsage'),options={samplingInterval:32768,includeObjectsCollectedByMajorGC:true,includeObjectsCollectedByMinorGC:true};
  await send('HeapProfiler.startSampling',options);const start=performance.now();
  const response=await mf.dispatchFetch('http://127.0.0.1:9525/validate',{method:'POST'});assert.equal(response.status,200);
  const actual=await response.json(),wallMs=performance.now()-start;
  assert.deepEqual(actual,resultExpected);
  const after=await send('Runtime.getHeapUsage'),{profile}=await send('HeapProfiler.stopSampling');
  const raw=Buffer.from(JSON.stringify(profile));assert.ok(raw.length<=8*1024*1024);await writeFile(join(directory,`${index}-${variant}-profile-private.json`),raw,{flag:'wx'});
  const stack=[profile.head],functions={};let nodes=0,selfBytes=0;while(stack.length){const n=stack.pop();nodes++;selfBytes+=n.selfSize;const name=n.callFrame.functionName||'(anonymous)';functions[name]=(functions[name]||0)+n.selfSize;stack.push(...n.children);}
  runs.push({index,variant,profileBytes:raw.length,profileSha256:sha(raw),options,nodes,samples:profile.samples.length,selfBytes,sampleSizeSum:profile.samples.reduce((s,x)=>s+x.size,0),stringIteratorSelfBytes:functions.next||0,topFunctions:Object.entries(functions).sort((a,b)=>b[1]-a[1]).slice(0,15).map(([functionName,attributedSelfBytes])=>({functionName,attributedSelfBytes})),before,after,wallMs,result:actual});
  ws.terminate();ws=undefined;await mf.dispose();mf=undefined;
 }
 assert.equal(outboundAttempts,0);owner.phase='verified';
 const result={schema:'playtt/manifest-bytes-allocation/v1',result:'pass',sourceHashes,wireSha256:sha(wire),wireBytes:wire.length,logicalBytes:resultExpected.logicalBytes,iterations,payloadSha256:sha(payload),runs,cloudRequests:0,outboundAttempts,centralSourceChanged:false,productionChanged:false,scope:'Six fresh local workerd instances decode the exact saved native manifest twenty times each; all validations and decompression included. No PHP or writes.',limitations:['Cumulative sampled JS allocations including collected objects; not live peak, billed CPU, RSS or provider admission.','Twenty repetitions amplify the target and are not native save call counts.','HeapUsage before/after can cross GC and is not a peak measurement.','The next function total includes all iterator calls, not only conversion.']};
 await writeFile(prefix+'summary.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({result:'pass',wireBytes:wire.length,runs:runs.map(({index,variant,selfBytes,stringIteratorSelfBytes,wallMs})=>({index,variant,selfBytes,stringIteratorSelfBytes,wallMs}))}));

}catch(e){owner.phase='failed';await writeFile(join(directory,'failure-private.json'),JSON.stringify({name:e.name,message:e.message,stack:e.stack}));throw e;}
finally{ws?.terminate();if(mf)await mf.dispose();owner.disposed=true;await writeFile(ownerPath,JSON.stringify(owner,null,2));}
