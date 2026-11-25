import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {PHP,loadPHPRuntime} from '@php-wasm/universal';
import {playttRuntimeMemoryEvidence} from '../src/playtt-memory-diagnostics.ts';
const {init,dependenciesTotalSize}=await import(pathToFileURL(resolve('artifacts/playtt-latency-opcache-loader.mjs')));
const wasm=await WebAssembly.compile(await readFile('node_modules/@php-wasm/web-8-3/asyncify/8_3_36/php_8_3.wasm'));
const php=new PHP(await loadPHPRuntime({dependencyFilename:'php_8_3.wasm',dependenciesTotalSize,phpWasmAsyncMode:'asyncify',init},{ENV:{USE_ZEND_ALLOC:'0',USE_TRACKED_ALLOC:'1'},instantiateWasm:(imports,receive)=>receive(new WebAssembly.Instance(wasm,imports),wasm)}));
try{
 php.mkdir('/wordpress/wp-content/markdown');php.writeFile('/wordpress/wp-content/markdown/check.md','Body\n');
 const before=playttRuntimeMemoryEvidence(php,'before-request');assert.equal(before.fileScanPerformed,true);assert.equal(before.unknownFileBuffers,0);assert.equal(before.categories?.canonical,5);assert.ok(before.files>0);
 const warm=playttRuntimeMemoryEvidence(php,'after-request');assert.equal(warm.fileScanPerformed,false);assert.equal(warm.fileBytes,undefined);assert.ok(warm.heapBytes>0);
 const result=await php.run({code:'<?php file_put_contents("/wordpress/wp-content/markdown/check.md", "Body changed\n");echo "written";'});assert.equal(result.exitCode,0);assert.equal(result.text,'written');
 const after=playttRuntimeMemoryEvidence(php,'after-persist');assert.equal(after.fileScanPerformed,true);assert.equal(after.unknownFileBuffers,0);assert.ok(after.categories.canonical>=13);assert.equal(new TextDecoder().decode(php.readFileAsBuffer('/wordpress/wp-content/markdown/check.md')),'Body changed\n');
 const report={at:new Date().toISOString(),result:'pass',scope:'Actual pinned PHP-WASM MEMFS: cold inventory, warm heap-only diagnostics, PHP-written file rescan and unchanged file bytes; local only, no whole-isolate memory claim.',before,warm,after};await writeFile('artifacts/playtt-memory-diagnostics-php.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}finally{php.exit();}
