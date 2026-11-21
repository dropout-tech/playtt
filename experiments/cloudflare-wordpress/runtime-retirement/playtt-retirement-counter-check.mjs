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

const {trackPlayttRuntimeLifetime,playttRuntimeRetirement}=await import('../src/playtt-runtime-lifetime.ts');
const php=new PHP(await loadPHPRuntime({dependencyFilename:'php_8_3.wasm',dependenciesTotalSize,phpWasmAsyncMode:'asyncify',init},{ENV:{USE_ZEND_ALLOC:'0',USE_TRACKED_ALLOC:'1'},instantiateWasm:(imports,receive)=>receive(new WebAssembly.Instance(wasm,imports),wasm)}));
try{
 trackPlayttRuntimeLifetime(php);trackPlayttRuntimeLifetime(php);
 const samples=[];
 for(let i=1;i<=96;i++){
  assert.equal((await php.run({code:'<?php echo "completed";'})).text,'completed');
  const state=playttRuntimeRetirement(php);assert.equal(state.requests,i);assert.equal(state.due,i===96);
  if(i===1||i===95||i===96)samples.push(state);
 }
 const report={at:new Date().toISOString(),result:'pass',scope:'Pinned PHP web WASM request.end counts actual completed requests once; retirement becomes due at 96 without changing upstream rotation',samples};
 await writeFile('artifacts/playtt-retirement-counter-local.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}finally{php.exit();}
