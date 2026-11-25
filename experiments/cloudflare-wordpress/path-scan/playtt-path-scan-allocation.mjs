// Six fresh local workerd instances; actual PHP MEMFS, unchanged pinned WASM.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdtemp,access,copyFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {once} from 'node:events';
import {build} from 'esbuild';
import {Miniflare,Log,LogLevel,convertV4MiniflareOptions} from 'miniflare';
import WebSocket from 'ws';
import {makeCandidate,sha,baselineSha256} from './playtt-path-scan-candidate.mjs';
assert.ok(process.argv.includes('--local')&&!process.argv.includes('--remote'));
const prefix='artifacts/playtt-path-scan-allocation-v3-',ownerPath=prefix+'owned-private.json';
await access(ownerPath).then(()=>{throw Error('Existing attempt: inspect without replay');},e=>{if(e.code!=='ENOENT')throw e;});
const original=(await readFile('src/playtt-php-loader.mjs','utf8')).replaceAll('\r\n','\n'),patch=makeCandidate(original);
const semantic=JSON.parse(await readFile('artifacts/playtt-path-scan-semantic-v2-proof.json','utf8'));assert.equal(semantic.result,'pass');assert.equal(semantic.candidateSha256,patch.candidateSha256);
const wasmPath=resolve('node_modules/@php-wasm/web-8-3/asyncify/8_3_36/php_8_3.wasm');assert.equal(sha(await readFile(wasmPath)),semantic.wasmSha256);
const directory=await mkdtemp(resolve('artifacts/path-scan-allocation-')),owner={phase:'starting',directory,disposed:false};await writeFile(ownerPath,JSON.stringify(owner,null,2),{flag:'wx'});
const fixture=`import {PHP,loadPHPRuntime} from '@php-wasm/universal';import {init,dependenciesTotalSize} from 'playtt-loader';import wasm from './php.wasm';let php,fs;
const paths=['/wordpress/wp-includes/js/dist/editor.min.js','/wordpress/wp-content/themes/letsplay/style.css','/wordpress/wp-content/uploads/繁中/照片.jpg','/wordpress/wp-includes/js/./dist/../dist/editor.min.js','//wordpress///wp-content//themes//letsplay/style.css','/wordpress/theme/style.css','/wordpress/theme/../letsplay/style.css','/wordpress/wp-content/themes/letsplay/missing.css','/wordpress/wp-includes/js/dist','/wordpress','/wordpress/theme','/wordpress/wp-content/themes/letsplay/../../uploads/繁中/照片.jpg'];
const options=[{}, {follow:true}, {parent:true}, {noent_okay:true}, {follow_mount:false}];
export default {async fetch(request){const path=new URL(request.url).pathname;
if(path==='/load'){php=new PHP(await loadPHPRuntime({dependencyFilename:'php.wasm',dependenciesTotalSize,phpWasmAsyncMode:'asyncify',init},{ENV:{USE_ZEND_ALLOC:'0',USE_TRACKED_ALLOC:'1'},instantiateWasm:(imports,receive)=>receive(new WebAssembly.Instance(wasm,imports),wasm)}));fs=php[Object.getOwnPropertySymbols(php).find(s=>s.description==='__private__dont__use')].FS;
for(const p of ['/wordpress/wp-includes/js/dist','/wordpress/wp-content/themes/letsplay','/wordpress/wp-content/uploads/繁中'])php.mkdir(p);
for(const p of [paths[0],paths[1],paths[2]])php.writeFile(p,'owned');fs.symlink('/wordpress/wp-content/themes/letsplay','/wordpress/theme');
const r=await php.run({code:"<?php echo file_get_contents('/wordpress/wp-content/uploads/繁中/照片.jpg');"});if(r.exitCode!==0||r.text!=='owned')throw Error('PHP setup mismatch');return new Response(null,{status:204});}
if(path==='/measure'){let checksum=0,errors=0,count=0;for(let i=0;i<500;i++)for(const p of paths)for(const opts of options){count++;try{const r=fs.lookupPath(p,opts);checksum+=r.path.length+(r.node?r.node.mode:0);}catch(e){errors++;checksum+=e.errno;}}return Response.json({count,checksum,errors});}
if(path==='/exit'){php.exit();return new Response(null,{status:204});}return new Response(null,{status:404});}};`;
await writeFile(join(directory,'fixture.mjs'),fixture,{flag:'wx'});await copyFile(wasmPath,join(directory,'php.wasm'));
const runs=[];let mf,ws,outboundAttempts=0,expected;
try{
 for(const [index,variant]of ['baseline','candidate','candidate','baseline','baseline','candidate'].entries()){
  const source=variant==='baseline'?original:patch.candidate;
  const compiled=await build({stdin:{contents:fixture,sourcefile:'path-scan-fixture.mjs',resolveDir:process.cwd(),loader:'js'},bundle:true,write:false,format:'esm',platform:'browser',target:'es2022',external:['node:*'],logLevel:'error',plugins:[{name:'pinned-loader',setup(b){b.onResolve({filter:/^playtt-loader$/},()=>({path:'loader',namespace:'pinned'}));b.onLoad({filter:/.*/,namespace:'pinned'},()=>({contents:source,loader:'js'}));b.onResolve({filter:/\.wasm$/},()=>({path:'./php.wasm',external:true}));b.onResolve({filter:/^(events|worker_threads)$/},args=>args.kind==='require-call'?{path:args.path,namespace:'builtin'}:{path:'node:'+args.path,external:true});b.onLoad({filter:/.*/,namespace:'builtin'},args=>({contents:`import lib from 'node:${args.path}';module.exports=lib;`,loader:'js'}));}}]});
  const scriptPath=join(directory,variant+'.mjs');if(index<2)await writeFile(scriptPath,compiled.outputFiles[0].text,{flag:'wx'});else assert.equal(await readFile(scriptPath,'utf8'),compiled.outputFiles[0].text);
  mf=new Miniflare(convertV4MiniflareOptions({name:'playtt-path-scan-allocation',modules:[{type:'ESModule',path:scriptPath},{type:'CompiledWasm',path:join(directory,'php.wasm')}],modulesRoot:directory,host:'127.0.0.1',port:9535,inspectorHost:'127.0.0.1',inspectorPort:9536,compatibilityDate:'2026-07-18',compatibilityFlags:['nodejs_compat'],cf:false,log:new Log(LogLevel.ERROR),telemetry:{enabled:false},outboundService:()=>{outboundAttempts++;throw Error('External network forbidden');}}));await mf.ready;
  assert.equal((await mf.dispatchFetch('http://127.0.0.1:9535/load')).status,204);
  const targets=await(await fetch('http://127.0.0.1:9536/json/list',{signal:AbortSignal.timeout(10000)})).json(),target=targets.find(t=>String(t.title||'').includes('playtt-path-scan-allocation')||String(t.id||'').includes('playtt-path-scan-allocation'));assert.ok(target);
  const endpoint=new URL(target.webSocketDebuggerUrl);assert.equal(endpoint.protocol,'ws:');assert.equal(endpoint.host,'127.0.0.1:9536');
  ws=new WebSocket(endpoint,{origin:'http://127.0.0.1:9536'});await once(ws,'open');let id=0;const pending=new Map();
  const send=(method,params={})=>new Promise((resolve,reject)=>{const key=++id,timer=setTimeout(()=>{pending.delete(key);reject(Error('Inspector timeout'));},20000);pending.set(key,{resolve,reject,timer});ws.send(JSON.stringify({id:key,method,params}));});
  ws.on('message',raw=>{const msg=JSON.parse(raw),p=pending.get(msg.id);if(!p)return;pending.delete(msg.id);clearTimeout(p.timer);msg.error?p.reject(Error('Inspector rejected command')):p.resolve(msg.result);});
  const before=await send('Runtime.getHeapUsage'),sampling={samplingInterval:32768,includeObjectsCollectedByMajorGC:true,includeObjectsCollectedByMinorGC:true};await send('HeapProfiler.startSampling',sampling);
  const start=performance.now(),response=await mf.dispatchFetch('http://127.0.0.1:9535/measure');assert.equal(response.status,200);const actual=await response.json(),wallMs=performance.now()-start;
  if(expected)assert.deepEqual(actual,expected);else expected=actual;assert.equal(actual.count,30000);
  const after=await send('Runtime.getHeapUsage'),{profile}=await send('HeapProfiler.stopSampling'),raw=Buffer.from(JSON.stringify(profile));await writeFile(join(directory,index+'-'+variant+'-profile-private.json'),raw,{flag:'wx'});
  const stack=[profile.head],functions={};let nodes=0,selfBytes=0;while(stack.length){const n=stack.pop();nodes++;selfBytes+=n.selfSize;const name=n.callFrame.functionName||'(anonymous)';functions[name]=(functions[name]||0)+n.selfSize;stack.push(...n.children);}
  runs.push({index,variant,sourceSha256:sha(source),bundleSha256:sha(compiled.outputFiles[0].text),profileSha256:sha(raw),nodes,samples:profile.samples.length,selfBytes,sampleSizeSum:profile.samples.reduce((s,x)=>s+x.size,0),lookupPathSelfBytes:functions.lookupPath||0,splitSelfBytes:functions.split||0,filterSelfBytes:functions.filter||0,topFunctions:Object.entries(functions).sort((a,b)=>b[1]-a[1]).slice(0,15).map(([functionName,attributedSelfBytes])=>({functionName,attributedSelfBytes})),sampling,before,after,wallMs,result:actual});
  assert.equal((await mf.dispatchFetch('http://127.0.0.1:9535/exit')).status,204);ws.terminate();ws=undefined;await mf.dispose();mf=undefined;
 }
 assert.equal(outboundAttempts,0);owner.phase='verified';
 const result={schema:'playtt/path-scan-allocation/v1',result:'pass',baselineSha256,candidateSha256:patch.candidateSha256,wasmSha256:semantic.wasmSha256,fixtureSha256:sha(fixture),runs,cloudRequests:0,outboundAttempts,centralLoaderChanged:false,productionChanged:false,scope:'Six fresh local workerd instances run 30000 mixed actual PHP MEMFS path lookups each. PHP boot/file read verified before sampling. Not a native WordPress workload.',limitations:['Cumulative sampled JS allocation including collected objects, not live peak, RSS, billed CPU or provider admission.','Repeated target fixture amplifies allocation and does not represent native WordPress path frequencies.','Before/after heap usage can cross GC; wall time includes profiling and local host load.']};await writeFile(prefix+'summary.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({result:'pass',runs:runs.map(({index,variant,selfBytes,lookupPathSelfBytes,splitSelfBytes,filterSelfBytes,wallMs})=>({index,variant,selfBytes,lookupPathSelfBytes,splitSelfBytes,filterSelfBytes,wallMs}))}));
}catch(e){owner.phase='failed';await writeFile(join(directory,'failure-private.json'),JSON.stringify({name:e.name,message:e.message,stack:e.stack}));throw e;}finally{ws?.terminate();if(mf)await mf.dispose();owner.disposed=true;await writeFile(ownerPath,JSON.stringify(owner,null,2));}
