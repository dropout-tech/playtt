// Actual pinned library and PHP/WASM; no cloud, production edit or artificial success fallback.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdtemp,access} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {loadPHPRuntime} from '@php-wasm/universal';
import {bootWordPressAndRequestHandler} from '@wp-playground/wordpress';
import {bootPlayttWordPressRuntime} from './playtt-boot-cleanup-candidate.ts';
assert.ok(process.argv.includes('--local')&&!process.argv.includes('--remote'));
const prefix='artifacts/playtt-boot-cleanup-v4-',ownerPath=prefix+'owned-private.json',sha=b=>createHash('sha256').update(b).digest('hex'),load=async p=>JSON.parse(await readFile(p,'utf8'));
await access(ownerPath).then(()=>{throw Error('Existing attempt; inspect without replay');},e=>{if(e.code!=='ENOENT')throw e;});
const fault=await load('artifacts/playtt-preallocated-fault-v3-owned-private.json');assert.equal(fault.phase,'verified');assert.equal(fault.allPhpInstancesExited,true);
const source=(await readFile(fault.directory+'/candidate.ts','utf8')).replaceAll('\r\n','\n'),modulePath=resolve(fault.directory+'/candidate.ts');
const materializer=await import(pathToFileURL(modulePath));
const directory=await mkdtemp(resolve('artifacts/boot-cleanup-'));
const {init,dependenciesTotalSize}=await import(pathToFileURL(resolve(fault.directory+'/php-node.mjs')));
const wasmBytes=await readFile('node_modules/@php-wasm/web-8-3/asyncify/8_3_36/php_8_3.wasm');assert.equal(sha(wasmBytes),'5b1787681568c62c37cf44f3a73d979540b5439c0c79d960cbbaf5d22a467854');const wasm=await WebAssembly.compile(wasmBytes);
const createRuntime=()=>loadPHPRuntime({dependencyFilename:'php_8_3.wasm',dependenciesTotalSize,phpWasmAsyncMode:'asyncify',init},{ENV:{USE_ZEND_ALLOC:'0',USE_TRACKED_ALLOC:'1'},instantiateWasm:(imports,receive)=>receive(new WebAssembly.Instance(wasm,imports),wasm)});
const manifest=await load('assets/wordpress-runtime-artifact.json'),archive=await readFile('artifacts/cloudflare-wordpress-runtime-corpus.zip');assert.equal(sha(archive),manifest.archive.sha256);
const bad=Buffer.from('not-a-zip'),badManifest={...manifest,archive:{sha256:sha(bad),size:bad.length},key:'runtime/wordpress/'+sha(bad)+'.zip'};
const owner={phase:'starting',directory,completed:[],allPhpInstancesExited:false};await writeFile(ownerPath,JSON.stringify(owner,null,2),{flag:'wx'});
const results=[],live=new Set();let report;
try{
 for(const spec of [
  {name:'upstream-bad-zip',baseline:true,badZip:true},
  {name:'candidate-bad-zip',badZip:true},
  {name:'candidate-post-boot-validation-failure',finishFailure:true},
  {name:'candidate-success-and-normal-disposal',success:true},
  {name:'candidate-cleanup-error-retains-both-errors',badZip:true,cleanupFailure:true},
  {name:'candidate-factory-rejects-before-php',factoryFailure:true},
 ]){
  let php,exitEvents=0,hookError,observedError,result,finishCalled=false,created=0;
  const validationError=new Error('Owned post-boot validation failure'),cleanupError=new Error('Owned disposer failure after actual disposal'),factoryError=new Error('Owned factory rejection before allocation');
  const bytes=spec.badZip?bad:archive,m=spec.badZip?badManifest:manifest;
  const options={createPhpRuntime:spec.factoryFailure?async()=>{throw factoryError;}:createRuntime,maxPhpInstances:1,phpVersion:'8.3',siteUrl:'http://127.0.0.1:9511',cookieStore:false,wordpressInstallMode:'do-not-attempt-installing',phpIniEntries:{'opcache.enable':'0','opcache.enable_cli':'0'},onPHPInstanceCreated:instance=>{created++;php=instance;live.add(php);php.addEventListener('runtime.beforeExit',()=>{exitEvents++;live.delete(php);});},hooks:{beforeWordPressFiles:async instance=>{
   if(spec.cleanupFailure){const h=instance.requestHandler;assert.ok(h);const original=h[Symbol.asyncDispose];h[Symbol.asyncDispose]=async()=>{await original.call(h);throw cleanupError;};}
   try{await materializer.materializeWordPressRuntimeArtifact(instance,{get:async key=>{assert.equal(key,m.key);return{size:bytes.length,arrayBuffer:async()=>bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength)};}},m);}catch(e){hookError=e;throw e;}
  }}};
  const finish=async handler=>{finishCalled=true;const p=await handler.getPrimaryPhp();assert.equal(p,php);if(spec.finishFailure)throw validationError;const r=await p.run({code:"<?php require '/wordpress/wp-includes/version.php'; echo $wp_version;"});assert.equal(r.exitCode,0);assert.equal(r.text,'7.1.4');return{handler,wordpressVersion:r.text};};
  try{result=spec.baseline?await bootWordPressAndRequestHandler(options):await bootPlayttWordPressRuntime(options,finish);}catch(e){observedError=e;}
  await writeFile(join(directory,spec.name+'-private.json'),JSON.stringify({created,exitEvents,finishCalled,error:observedError?{name:observedError.name,message:observedError.message,cause:observedError.cause?.message,errors:observedError.errors?.map(e=>e.message)}:null},null,2),{flag:'wx'});
  let aliveAfterFailure=false;
  if(spec.baseline){assert.equal(observedError,hookError);assert.ok(observedError);assert.equal(exitEvents,0);const key=Object.getOwnPropertySymbols(php).find(s=>s.description==='__private__dont__use');assert.ok(php[key]?.HEAPU8?.byteLength>=64*1024*1024);assert.equal(php.fileExists('/internal/.boot-files-written'),true);aliveAfterFailure=true;await php.requestHandler[Symbol.asyncDispose]();assert.equal(exitEvents,1);}
  else if(spec.success){assert.equal(observedError,undefined);assert.equal(result.wordpressVersion,'7.1.4');assert.equal(exitEvents,0);await result.handler[Symbol.asyncDispose]();assert.equal(exitEvents,1);}
  else if(spec.factoryFailure){assert.equal(observedError,factoryError);assert.equal(created,0);assert.equal(finishCalled,false);assert.equal(exitEvents,0);}
  else {assert.ok(observedError);assert.equal(exitEvents,1);const key=Object.getOwnPropertySymbols(php).find(s=>s.description==='__private__dont__use');assert.equal(key?php[key]:undefined,undefined);if(spec.cleanupFailure){assert.ok(observedError instanceof AggregateError);assert.deepEqual(observedError.errors,[hookError,cleanupError]);assert.equal(observedError.cause,hookError);}else assert.equal(observedError,spec.finishFailure?validationError:hookError);}
  assert.equal(live.size,0);
  results.push({name:spec.name,created,finishCalled,baselineStillAliveAfterRejectedBoot:aliveAfterFailure,disposedOnFailure:!spec.baseline&&!spec.success&&!spec.factoryFailure,cleanupErrorNotHidden:spec.cleanupFailure===true,successfulHandlerOwnedByCaller:spec.success===true,exitEvents,allInstancesExited:true});owner.completed.push(spec.name);await writeFile(ownerPath,JSON.stringify(owner,null,2));
 }
 owner.phase='verified';report={schema:'playtt/boot-cleanup-proof/v1',at:new Date().toISOString(),result:'pass',actualPhp:'8.3.36',actualWordPress:'7.1.4',candidateHelperSha256:sha((await readFile('scripts/playtt-boot-cleanup-candidate.ts','utf8')).replaceAll('\r\n','\n')),wordpressPackageSha256:sha(await readFile('node_modules/@wp-playground/wordpress/index.js')),phpPackageSha256:sha(await readFile('node_modules/@php-wasm/universal/index.js')),cases:results.length,results,centralRuntimeChanged:false,cloudRequests:0,deployed:false,limitations:['Real package boot and PHP instance lifetime under Node; not Cloudflare memory or whole-isolate retention measurement.','This ownership helper starts after bootRequestHandler returns. Mid-construction failures inside that dependency before a handler is returned are outside the cleanup contract.','The tested candidate helper is not yet wired into the full worker; integration/typecheck/source build remain next.']};
}catch(e){owner.phase='failed';await writeFile(join(directory,'failure-private.json'),JSON.stringify({name:e.name,message:e.message,stack:e.stack,results},null,2));throw e;}
finally{for(const php of [...live])php.exit();owner.allPhpInstancesExited=live.size===0;await writeFile(ownerPath,JSON.stringify(owner,null,2));}
await writeFile(prefix+'proof.json',JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({result:report.result,cases:report.cases,baselineBootFailureRetainsPhp:true,candidateFailureCleanupVerified:true,centralRuntimeChanged:false,cloudRequests:0}));
