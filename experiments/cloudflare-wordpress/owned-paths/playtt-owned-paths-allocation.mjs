// Six fresh local workerd instances exercise identical pinned wp-content inventories.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdtemp,access} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {createHash} from 'node:crypto';
import {once} from 'node:events';
import {build} from 'esbuild';
import {runtimeArchiveComponentOwnedWpContentPaths} from '@automattic/wp-codebox-core/runtime-archive-component';
import {Miniflare,Log,LogLevel,convertV4MiniflareOptions} from 'miniflare';
import WebSocket from 'ws';
assert.ok(process.argv.includes('--local')&&!process.argv.includes('--remote'));
const sha=b=>createHash('sha256').update(b).digest('hex'),load=async p=>JSON.parse(await readFile(p,'utf8'));
const prefix='artifacts/playtt-owned-paths-allocation-v2-',ownerPath=prefix+'owned-private.json';
await access(ownerPath).then(()=>{throw Error('Existing attempt: inspect without replay');},e=>{if(e.code!=='ENOENT')throw e;});
const sources={baseline:'src/wp-content-persistence.ts',candidate:'scripts/playtt-owned-paths-candidate.ts'};
const sourceTexts=Object.fromEntries(await Promise.all(Object.entries(sources).map(async([k,p])=>[k,(await readFile(p,'utf8')).replaceAll('\r\n','\n')])));
const sourceHashes=Object.fromEntries(Object.entries(sourceTexts).map(([k,v])=>[k,sha(v)]));
assert.equal(sourceHashes.baseline,'0f67fe2b2e198b9665c0d9d1858d7557ab552d877b5165b89c47c9e719546a5d');assert.equal(sourceHashes.candidate,'b95446e9faeb1813fb25083421923f553fa45b83772733bce083f92b1c066198');
const sourcePlan=await load('artifacts/playtt-old-source-rollback-plan.json');
const runtime=await load('assets/wordpress-runtime-artifact.json'),statics=await load('assets/wordpress-static-artifact.json'),importer=await load('assets/website-importer-artifact.json');
const owned=runtimeArchiveComponentOwnedWpContentPaths(importer.component);
const rawPaths=[...new Set([...runtime.files,...statics.files].filter(f=>f.path.startsWith('wordpress/wp-content/')).map(f=>f.path.slice('wordpress/wp-content/'.length)))];
const baselineBuilt=await build({stdin:{contents:sourceTexts.baseline,loader:'ts',sourcefile:'wp-content-persistence.ts',resolveDir:resolve('src')},bundle:true,write:false,format:'esm',target:'es2022'});
const baseline=await import('data:text/javascript;base64,'+Buffer.from(baselineBuilt.outputFiles[0].text).toString('base64'));
const files=[...new Map([...runtime.files,...statics.files].filter(f=>f.path.startsWith('wordpress/wp-content/')).map(f=>[f.path,f])).values()];
const inventory=files.map(f=>({path:f.path.slice('wordpress/wp-content/'.length),size:f.size,sha256:f.sha256,objectKey:`sites/default/wp-content/objects/${f.sha256}`})).filter(f=>baseline.isCanonicalWpContentPath(f.path,owned));
assert.ok(inventory.length>20&&inventory.length<5000);baseline.validateWpContentManifestFiles(inventory,undefined,owned);
const deleted=inventory.slice(0,5).map(f=>f.path).sort(),iterations=20;
const payload=JSON.stringify({owned,inventory,rawPaths,deleted,iterations});
const directory=await mkdtemp(resolve('artifacts/owned-paths-allocation-')),owner={phase:'starting',directory,disposed:false};
await writeFile(ownerPath,JSON.stringify(owner,null,2),{flag:'wx'});
const runs=[];let mf,ws,outboundAttempts=0;
try{
 for(const [index,variant]of ['baseline','candidate','candidate','baseline','baseline','candidate'].entries()){
  const fixture=`import * as api from 'owned-paths-module';let data,owned;export default {async fetch(request){const path=new URL(request.url).pathname;if(path==='/load'&&request.method==='POST'){data=await request.json();owned=${variant==='candidate'?'api.prepareRuntimeOwnedWpContentPaths(data.owned)':'data.owned'};return new Response(null,{status:204});}if(path==='/validate'&&request.method==='POST'){let included=0;for(let i=0;i<data.iterations;i++){api.validateWpContentMetadata(data.inventory,owned);api.validateWpContentManifestFiles(data.inventory,undefined,owned);api.validateWpContentDeletedPaths(data.deleted,owned);for(const p of data.rawPaths)if(api.isCanonicalWpContentPath(p,owned))included++;}return Response.json({included,iterations:data.iterations,files:data.inventory.length});}return new Response(null,{status:404});}};`;
  const compiled=await build({stdin:{contents:fixture,loader:'ts',sourcefile:'owned-paths-fixture.ts',resolveDir:process.cwd()},bundle:true,write:false,format:'esm',target:'es2022',keepNames:true,plugins:[{name:'pinned-owned-paths',setup(b){b.onResolve({filter:/^owned-paths-module$/},()=>({path:'owned-paths',namespace:'owned-paths'}));b.onLoad({filter:/.*/,namespace:'owned-paths'},()=>({contents:sourceTexts[variant],loader:'ts',resolveDir:resolve('src')}));}}]});
  mf=new Miniflare(convertV4MiniflareOptions({name:'playtt-owned-paths-allocation',modules:true,script:compiled.outputFiles[0].text,host:'127.0.0.1',port:9521,inspectorHost:'127.0.0.1',inspectorPort:9522,compatibilityDate:'2026-07-18',cf:false,log:new Log(LogLevel.ERROR),telemetry:{enabled:false},outboundService:()=>{outboundAttempts++;throw Error('External network forbidden');}}));await mf.ready;
  assert.equal((await mf.dispatchFetch('http://127.0.0.1:9521/load',{method:'POST',body:payload})).status,204);
  const targets=await(await fetch('http://127.0.0.1:9522/json/list',{signal:AbortSignal.timeout(10000)})).json();
  const target=targets.find(t=>String(t.title||'').includes('playtt-owned-paths-allocation')||String(t.id||'').includes('playtt-owned-paths-allocation'));assert.ok(target);
  const endpoint=new URL(target.webSocketDebuggerUrl);assert.equal(endpoint.protocol,'ws:');assert.equal(endpoint.host,'127.0.0.1:9522');
  ws=new WebSocket(endpoint,{origin:'http://127.0.0.1:9522'});await once(ws,'open');let id=0;const pending=new Map();
  const send=(method,params={})=>new Promise((resolve,reject)=>{const key=++id,timer=setTimeout(()=>{pending.delete(key);reject(Error('Inspector timeout'));},20000);pending.set(key,{resolve,reject,timer});ws.send(JSON.stringify({id:key,method,params}));});
  ws.on('message',raw=>{const msg=JSON.parse(raw);const p=pending.get(msg.id);if(!p)return;pending.delete(msg.id);clearTimeout(p.timer);msg.error?p.reject(Error('Inspector rejected command')):p.resolve(msg.result);});
  const before=await send('Runtime.getHeapUsage'),options={samplingInterval:32768,includeObjectsCollectedByMajorGC:true,includeObjectsCollectedByMinorGC:true};
  await send('HeapProfiler.startSampling',options);const start=performance.now();
  const response=await mf.dispatchFetch('http://127.0.0.1:9521/validate',{method:'POST'});assert.equal(response.status,200);
  const actual=await response.json(),wallMs=performance.now()-start;
  assert.deepEqual(actual,{included:rawPaths.filter(p=>baseline.isCanonicalWpContentPath(p,owned)).length*iterations,iterations,files:inventory.length});
  const after=await send('Runtime.getHeapUsage'),{profile}=await send('HeapProfiler.stopSampling');
  const raw=Buffer.from(JSON.stringify(profile));assert.ok(raw.length<=8*1024*1024);await writeFile(join(directory,`${index}-${variant}-profile-private.json`),raw,{flag:'wx'});
  const stack=[profile.head],functions={};let nodes=0,selfBytes=0;while(stack.length){const n=stack.pop();nodes++;selfBytes+=n.selfSize;const name=n.callFrame.functionName||'(anonymous)';functions[name]=(functions[name]||0)+n.selfSize;stack.push(...n.children);}
  runs.push({index,variant,profileBytes:raw.length,profileSha256:sha(raw),options,nodes,samples:profile.samples.length,selfBytes,sampleSizeSum:profile.samples.reduce((s,x)=>s+x.size,0),ownershipSelfBytes:functions.runtimeOwnedWpContentPaths||0,topFunctions:Object.entries(functions).sort((a,b)=>b[1]-a[1]).slice(0,15).map(([functionName,attributedSelfBytes])=>({functionName,attributedSelfBytes})),before,after,wallMs,result:actual});
  ws.terminate();ws=undefined;await mf.dispose();mf=undefined;
 }
 assert.equal(outboundAttempts,0);owner.phase='verified';
 const result={schema:'playtt/owned-paths-allocation/v1',at:new Date().toISOString(),result:'pass',sourceHashes,inventoryFiles:inventory.length,pathsChecked:rawPaths.length,ownedInputPaths:owned.length,iterations,payloadSha256:sha(payload),runs,cloudRequests:0,outboundAttempts,centralSourceChanged:false,productionChanged:false,scope:'Six fresh local workerd controls. Twenty repetitions of identical validators and path decisions over pinned core inventories; no PHP or website state.',limitations:['Cumulative sampled JS allocations including collected objects; not live peak, billed CPU, RSS or provider admission.','Prepared snapshot created before sampling once, matching module startup; baseline list remains validated per call.','Twenty repetitions amplify the target for measurement and do not represent the number of native-save calls.','HeapUsage before/after can cross GC and is not a peak measurement.']};
 await writeFile(prefix+'summary.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({result:'pass',inventoryFiles:inventory.length,pathsChecked:rawPaths.length,runs:runs.map(({index,variant,selfBytes,ownershipSelfBytes,wallMs})=>({index,variant,selfBytes,ownershipSelfBytes,wallMs}))}));
}catch(e){owner.phase='failed';await writeFile(join(directory,'failure-private.json'),JSON.stringify({name:e.name,message:e.message,stack:e.stack}));throw e;}
finally{ws?.terminate();if(mf)await mf.dispose();owner.disposed=true;await writeFile(ownerPath,JSON.stringify(owner,null,2));}
