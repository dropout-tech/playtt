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
const php=new PHP(await loadPHPRuntime({dependencyFilename:'php_8_3.wasm',dependenciesTotalSize,phpWasmAsyncMode:'asyncify',init},{ENV:{USE_ZEND_ALLOC:'0',USE_TRACKED_ALLOC:'1'},instantiateWasm:(imports,receive)=>receive(new WebAssembly.Instance(wasm,imports),wasm)}));
const module=php[Object.getOwnPropertySymbols(php).find(s=>s.description==='__private__dont__use')];
const heaps=[],used=[];
try{
 const version=JSON.parse((await php.run({code:"<?php echo json_encode(['version'=>PHP_VERSION,'usage'=>memory_get_usage(),'tracked'=>getenv('USE_TRACKED_ALLOC')]);"})).text);
 assert.equal(version.version,'8.3.36');assert.equal(version.tracked,'1');assert.ok(version.usage>0);
 for(let n=0;n<60;n++){
  // Cyclic graphs deliberately survive PHP refcounts; request shutdown must free them.
  const result=JSON.parse((await php.run({code:"<?php ini_set('memory_limit','24M'); $a=[]; for($i=0;$i<8;$i++){ $o=new stdClass();$o->payload=str_repeat('x',524288);$o->self=$o;$a[]=$o; } echo json_encode(['usage'=>memory_get_usage(),'ok'=>count($a)===8]);"})).text);
  assert.equal(result.ok,true);used.push(result.usage);heaps.push(module.HEAPU8.byteLength);
 }
 assert.equal(heaps.at(-1),heaps[5],'WASM heap must plateau after warmup');
 let failed;
 try { failed=await php.run({code:"<?php ini_set('memory_limit','16M'); $data=str_repeat('x',32*1024*1024); echo 'UNEXPECTED_SUCCESS';"}); }
 catch(error){if(!error.response)throw error;failed=error.response;}
 assert.ok(/Allowed memory size.*exhausted/.test(failed.errors+failed.text),'PHP memory_limit must reject allocation');
 assert.ok(!failed.text.includes('UNEXPECTED_SUCCESS'));
 const recovered=await php.run({code:"<?php ini_set('memory_limit','16M'); echo strlen(str_repeat('y',1024*1024));"});assert.equal(recovered.text,'1048576');
 const report={at:new Date().toISOString(),result:'pass',scope:'Pinned PHP web WASM under Node; not remote acceptance',php:version.version,wasmSha256:createHash('sha256').update(wasmBytes).digest('hex'),iterations:60,maxHeapBytes:Math.max(...heaps),warmHeapBytes:heaps[5],lastHeapBytes:heaps.at(-1),usageMin:Math.min(...used),usageMax:Math.max(...used),memoryLimitRejected:true,nextRequestRecovered:true};
 await writeFile('artifacts/playtt-tracked-allocator-local.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}finally{php.exit();}
