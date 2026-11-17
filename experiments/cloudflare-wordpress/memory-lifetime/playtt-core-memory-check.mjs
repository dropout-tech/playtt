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
const php=new PHP(await loadPHPRuntime({dependencyFilename:'php_8_3.wasm',dependenciesTotalSize,phpWasmAsyncMode:'asyncify',init},{ENV:{USE_ZEND_ALLOC:'0',USE_TRACKED_ALLOC:'1'},instantiateWasm:(imports,receive)=>receive(new WebAssembly.Instance(wasm,imports),wasm)}));
const module=php[Object.getOwnPropertySymbols(php).find(s=>s.description==='__private__dont__use')];
try {
 php.mkdir('/wordpress/wp-includes');php.mkdir('/wordpress/wp-content');
 await php.run({code: "<?php foreach(['/wordpress/wp-includes/test.php','/wordpress/wp-content/test.dat','/tmp/test.dat'] as $path){$h=fopen($path,'wb');for($i=0;$i<13;$i++)fwrite($h,str_repeat('abcdef0123456789',512));fclose($h);}"});
 const paths=['/wordpress/wp-includes/test.php','/wordpress/wp-content/test.dat','/tmp/test.dat'];
 const before=paths.map(path=>({path,hash:createHash('sha256').update(php.readFileAsBuffer(path)).digest('hex'),node:module.FS.lookupPath(path).node,buffer:module.FS.lookupPath(path).node.contents}));
 const result=compactPlayttCoreFiles(php);assert.ok(result.releasedCapacityBytes>0);assert.equal(result.files,1);
 for(const item of before)assert.equal(createHash('sha256').update(php.readFileAsBuffer(item.path)).digest('hex'),item.hash);
 assert.equal(before[0].node.contents.length,before[0].node.usedBytes);
 assert.equal(before[1].node.contents,before[1].buffer);assert.equal(before[2].node.contents,before[2].buffer);
 const phpHashes=JSON.parse((await php.run({code:"<?php echo json_encode(array_map(static fn($p)=>hash_file('sha256',$p), ['/wordpress/wp-includes/test.php','/wordpress/wp-content/test.dat','/tmp/test.dat']));"})).text);assert.deepEqual(phpHashes,before.map(x=>x.hash));
 const appended=await php.run({code:"<?php file_put_contents('/wordpress/wp-includes/test.php','next',FILE_APPEND);echo substr(file_get_contents('/wordpress/wp-includes/test.php'),-4);"});assert.equal(appended.text,'next');
 const report={at:new Date().toISOString(),result:'pass',scope:'Pinned PHP web WASM: exact byte/hash preservation, PHP reads, future append growth, unchanged wp-content and temp buffers',...result};
 await writeFile('artifacts/playtt-core-memory-local.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}finally{php.exit();}
