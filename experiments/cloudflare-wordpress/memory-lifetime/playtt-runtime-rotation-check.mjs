import {compactPlayttCoreFiles} from '../src/playtt-core-memory.ts';
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import {PHP,loadPHPRuntime} from '@php-wasm/universal';
// Same pinned web binary and loader as the Worker. Node supplies only the
// precompiled module instead of Wrangler's CompiledWasm import.
const source=await readFile('src/playtt-php-loader.mjs','utf8');
assert.match(source,/^import dependencyFilename from '[^']+php_8_3\.wasm';/);
await writeFile('artifacts/playtt-allocator-loader.mjs',"import { createRequire } from 'node:module'; const require=createRequire(import.meta.url);\n"+source.replace(/^import dependencyFilename from '[^']+php_8_3\.wasm';/,"const dependencyFilename='php_8_3.wasm';"));
const {init,dependenciesTotalSize}=await import(pathToFileURL(resolve('artifacts/playtt-allocator-loader.mjs')));
const wasmBytes=await readFile('node_modules/@php-wasm/web-8-3/asyncify/8_3_36/php_8_3.wasm');
const wasm=await WebAssembly.compile(wasmBytes);

const createRuntime=()=>loadPHPRuntime({dependencyFilename:'php_8_3.wasm',dependenciesTotalSize,phpWasmAsyncMode:'asyncify',init},{ENV:{USE_ZEND_ALLOC:'0',USE_TRACKED_ALLOC:'1'},instantiateWasm:(imports,receive)=>receive(new WebAssembly.Instance(wasm,imports),wasm)});
const {CloudflarePhaseTrace}=await import('../src/phase-trace.ts');
const {createPlayttRuntimeFactory}=await import('../src/playtt-runtime-factory.ts');
const results=[];
for(const fixed of [false,true]){
 let created=0,completed=0,error;
 const trace=new CloudflarePhaseTrace();
 const counted=async()=>{created++;return createRuntime();};
 const factory=fixed?createPlayttRuntimeFactory(counted,trace):()=>trace.measure('php.runtime.create',counted);
 const php=new PHP(await factory());
 php.writeFile('/tmp/rotation-proof.txt','0');
 php.enableRuntimeRotation({recreateRuntime:factory,maxRequests:400});
 trace.complete('read','cold','bypass');
 try{
  for(let i=1;i<=805;i++){
   const r=await php.run({code:"<?php $p='/tmp/rotation-proof.txt';$n=(int)file_get_contents($p)+1;file_put_contents($p,(string)$n);echo $n.'|'.getenv('USE_TRACKED_ALLOC');"});
   assert.equal(r.text,i+'|1');completed++;
  }
 }catch(e){error=String(e);}finally{php.exit();}
 results.push({candidate:fixed?'initial-trace-only':'previous-trace-reused',created,completed,...(error?{error}:{})});
 if(fixed){assert.equal(error,undefined);assert.equal(created,3);assert.equal(completed,805);}
 else{assert.match(error,/phase trace is already complete/);assert.equal(completed,400);assert.equal(created,1);}
}
const report={at:new Date().toISOString(),result:'pass',scope:'Same fixed PHP web WASM; reproduce previous failure at request 401, then cross two real automatic 400-request rotations with file and allocator environment preserved',results};
await writeFile('artifacts/playtt-runtime-rotation-local.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
