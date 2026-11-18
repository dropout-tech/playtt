import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {loadPHPRuntime} from '@php-wasm/universal';
import {decodeZip} from '@php-wasm/stream-compression';
import {bootWordPressAndRequestHandler} from '@wp-playground/wordpress';
import {installPlayttOpaqueIds} from '../src/playtt-php-compat.ts';
import {compactPlayttCoreFiles} from '../src/playtt-core-memory.ts';
assert.ok(process.argv.includes('--local'));
const label=process.argv.find(x=>x.startsWith('--mode='))?.slice(7);assert.ok(['off','file-cache'].includes(label));
const sha=x=>createHash('sha256').update(x).digest('hex');
const loader=await readFile('src/playtt-php-loader.mjs','utf8');assert.match(loader,/^import dependencyFilename from '[^']+php_8_3\.wasm';/);
await writeFile('artifacts/playtt-latency-opcache-loader.mjs',"import { createRequire } from 'node:module'; const require=createRequire(import.meta.url);\n"+loader.replace(/^import dependencyFilename from '[^']+php_8_3\.wasm';/,"const dependencyFilename='php_8_3.wasm';"));
const {init,dependenciesTotalSize}=await import(pathToFileURL(resolve('artifacts/playtt-latency-opcache-loader.mjs')));
const wasm=await WebAssembly.compile(await readFile('node_modules/@php-wasm/web-8-3/asyncify/8_3_36/php_8_3.wasm'));
async function artifact(name,file){const m=JSON.parse(await readFile('assets/'+name+'.json','utf8')),bytes=await readFile('artifacts/'+file);assert.equal(sha(bytes),m.archive.sha256);assert.equal(bytes.length,m.archive.size);return bytes;}
const core=await artifact('wordpress-runtime-artifact','cloudflare-wordpress-runtime-corpus.zip'),sqlite=await artifact('sqlite-database-integration-artifact','cloudflare-sqlite-database-integration.zip'),seed=await readFile('assets/wordpress-install-seed.sqlite');
const entries=[];for await(const e of decodeZip(new Blob([core]).stream()))if(!e.name.endsWith('/'))entries.push({path:'/'+e.name,bytes:new Uint8Array(await e.arrayBuffer())});
const enabled=label==='file-cache';const started=performance.now();
const handler=await bootWordPressAndRequestHandler({createPhpRuntime:()=>loadPHPRuntime({dependencyFilename:'php_8_3.wasm',dependenciesTotalSize,phpWasmAsyncMode:'asyncify',init},{ENV:{USE_ZEND_ALLOC:'0',USE_TRACKED_ALLOC:'1'},instantiateWasm:(imports,receive)=>receive(new WebAssembly.Instance(wasm,imports),wasm)}),phpIniEntries:{'opcache.enable':enabled?'1':'0','opcache.enable_cli':enabled?'1':'0',...(enabled?{'opcache.file_cache_only':'1','opcache.file_update_protection':'0','opcache.validate_timestamps':'1','opcache.revalidate_freq':'0'}:{})},constants:{AUTOMATIC_UPDATER_DISABLED:true,DISABLE_WP_CRON:true,WP_HTTP_BLOCK_EXTERNAL:true,FS_METHOD:'direct'},dataSqlPath:'/wordpress/wp-content/database/.ht.sqlite',cookieStore:false,maxPhpInstances:1,phpVersion:'8.3',siteUrl:'https://playtt-local-latency.invalid',wordpressInstallMode:'do-not-attempt-installing',sqliteIntegrationPluginZip:new File([sqlite],'sqlite.zip'),hooks:{beforeWordPressFiles:php=>{for(const e of entries){php.mkdir(e.path.slice(0,e.path.lastIndexOf('/')));php.writeFile(e.path,e.bytes);}installPlayttOpaqueIds(php);},beforeDatabaseSetup:php=>{php.mkdir('/wordpress/wp-content/database');php.writeFile('/wordpress/wp-content/database/.ht.sqlite',seed);}}});
const php=await handler.getPrimaryPhp();const module=php[Object.getOwnPropertySymbols(php).find(s=>s.description==='__private__dont__use')];
function memory(){let files=0,bytes=0,capacity=0;function walk(path){if(!php.fileExists(path)&&!php.isDir(path))return;for(const name of php.listFiles(path)){const p=path+'/'+name;if(php.isDir(p))walk(p);else{const node=module.FS.lookupPath(p).node;files++;bytes+=node.usedBytes||0;capacity+=node.contents?.byteLength||0;}}}walk('/internal/shared/opcache');return {wasmHeapBytes:module.HEAPU8.byteLength,opcodeFiles:files,opcodeUsedBytes:bytes,opcodeAllocatedBytes:capacity};}
try{
 compactPlayttCoreFiles(php);const bootMs=performance.now()-started,initialMemory=memory(),requests=[];
 for(let i=0;i<8;i++){const at=performance.now();const r=await handler.request({url:'https://playtt-local-latency.invalid/wp-login.php',method:'GET'});assert.equal(r.httpStatusCode,200);assert.ok(r.text.includes('wp-submit'));requests.push({index:i,wallMs:Math.round((performance.now()-at)*1000)/1000,responseBytes:r.bytes.length,...memory()});}
 const ini=await php.run({code:'<?php echo json_encode(["enabled"=>ini_get("opcache.enable"),"fileCacheOnly"=>ini_get("opcache.file_cache_only"),"fileUpdateProtection"=>ini_get("opcache.file_update_protection"),"fileCache"=>ini_get("opcache.file_cache"),"sapi"=>PHP_SAPI,"status"=>opcache_get_status(false)],JSON_THROW_ON_ERROR);'});assert.equal(ini.exitCode,0);
 const sorted=requests.slice(2).map(x=>x.wallMs).sort((a,b)=>a-b);const report={at:new Date().toISOString(),result:'pass',mode:label,scope:'Local pinned PHP-WASM native WordPress login reads on disposable SQLite seed; excludes MDI, real content, network, remote CPU limits and total isolate memory.',bootMs:Math.round(bootMs),ini:JSON.parse(ini.text),initialMemory,requests,warmMedianMs:(sorted[2]+sorted[3])/2,maxWasmHeapBytes:Math.max(...requests.map(x=>x.wasmHeapBytes)),maxOpcodeAllocatedBytes:Math.max(...requests.map(x=>x.opcodeAllocatedBytes))};
 await writeFile('artifacts/playtt-latency-opcache-'+label+'.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}finally{php.exit();}
