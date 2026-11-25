// Isolated candidate: real pinned PHP/WASM and core ZIP; no central runtime edit/cloud.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdtemp,access} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {PHP,loadPHPRuntime} from '@php-wasm/universal';
import {compactPlayttCoreFiles} from '../src/playtt-core-memory.ts';
assert.ok(process.argv.includes('--local')&&!process.argv.includes('--remote'));
const sha=b=>createHash('sha256').update(b).digest('hex'),load=async p=>JSON.parse(await readFile(p,'utf8'));
const ownerPath='artifacts/playtt-preallocated-corpus-v2-owned-private.json';
await access(ownerPath).then(()=>{throw Error('Existing attempt; inspect without replay');},e=>{if(e.code!=='ENOENT')throw e;});
const sourcePath='src/wordpress-runtime-artifact.ts',source=(await readFile(sourcePath,'utf8')).replaceAll('\r\n','\n');
const pinned=(await load('artifacts/playtt-recovery-provider-source-plan.json')).sources.find(e=>e.path===sourcePath);assert.equal(sha(source),pinned.sha256);
const before=`        if (!$zip->extractTo('/', array_keys($expected))) {
            throw new RuntimeException('WordPress runtime artifact ZIP extraction failed.');
        }`;
const replacement=`        foreach ($expected as $name => $size) {
            $destination = '/' . $name;
            $directory = dirname($destination);
            if (!is_dir($directory) && !mkdir($directory, 0777, true) && !is_dir($directory)) {
                throw new RuntimeException('WordPress runtime artifact directory creation failed.');
            }
            $input = $zip->getStream($name);
            if (!is_resource($input)) {
                throw new RuntimeException('WordPress runtime artifact entry stream failed.');
            }
            try {
                $output = fopen($destination, 'wb');
                if (!is_resource($output)) {
                    throw new RuntimeException('WordPress runtime artifact destination open failed.');
                }
                try {
                    if (!ftruncate($output, $size) || ftell($output) !== 0) {
                        throw new RuntimeException('WordPress runtime artifact preallocation failed.');
                    }
                    $copied = stream_copy_to_stream($input, $output, $size + 1);
                    if ($copied !== $size || !fflush($output) || fstat($output)['size'] !== $size) {
                        throw new RuntimeException('WordPress runtime artifact extracted size mismatch.');
                    }
                } finally {
                    fclose($output);
                }
            } finally {
                fclose($input);
            }
        }`;
assert.equal(source.split(before).length,2);
const hashBefore='crypto.subtle.digest("SHA-256", Uint8Array.from(bytes).buffer)',hashAfter='crypto.subtle.digest("SHA-256", bytes as Uint8Array<ArrayBuffer>)';assert.equal(source.split(hashBefore).length,2);
const candidate=source.replace(before,replacement).replace(hashBefore,hashAfter);
const directory=await mkdtemp(resolve('artifacts/preallocated-corpus-'));
await writeFile(join(directory,'candidate-source.ts'),candidate,{flag:'wx'});
const modules={};
for(const[label,text]of[['baseline',source],['candidate',candidate]]){
 const spec=pathToFileURL(resolve('src/wordpress-runtime-corpus.ts')).href;
 const code=text.replace('"./wordpress-runtime-corpus.js"',JSON.stringify(spec))+'\nexport { sha256Hex };\n';
 const file=join(directory,label+'-module.ts');await writeFile(file,code,{flag:'wx'});modules[label]=await import(pathToFileURL(file));
}
const loader=(await readFile('src/playtt-php-loader.mjs','utf8')).replaceAll('\r\n','\n');assert.equal(sha(loader),'382310127a494ab04b7324823230f3e119e6928330575a3089cd84566da6150f');
assert.match(loader,/^import dependencyFilename from '[^']+php_8_3\.wasm';/);
const nodeLoader="import {createRequire} from 'node:module';const require=createRequire(import.meta.url);\n"+loader.replace(/^import dependencyFilename from '[^']+php_8_3\.wasm';/,"const dependencyFilename='php_8_3.wasm';");
const loaderPath=join(directory,'php-node.mjs');await writeFile(loaderPath,nodeLoader,{flag:'wx'});
const {init,dependenciesTotalSize}=await import(pathToFileURL(loaderPath));
const wasmBytes=await readFile('node_modules/@php-wasm/web-8-3/asyncify/8_3_36/php_8_3.wasm'),wasm=await WebAssembly.compile(wasmBytes);
async function createPhp(){return new PHP(await loadPHPRuntime({dependencyFilename:'php_8_3.wasm',dependenciesTotalSize,phpWasmAsyncMode:'asyncify',init},{ENV:{USE_ZEND_ALLOC:'0',USE_TRACKED_ALLOC:'1'},instantiateWasm:(imports,receive)=>receive(new WebAssembly.Instance(wasm,imports),wasm)}));}
const owner={phase:'starting',directory,baselineSha256:sha(source),candidateSha256:sha(candidate),allPhpInstancesExited:false};await writeFile(ownerPath,JSON.stringify(owner,null,2),{flag:'wx'});
let php,report;const results=[];
try{
 // Validate that digesting a view respects offset/length and does not mutate input.
 const digestCases=[new Uint8Array(),new Uint8Array([0,255,1]),new Uint8Array([11,22,33,44,55]).subarray(1,4),new Uint8Array([1,2,3,4]).subarray(2,2)];
 for(const bytes of digestCases){const copy=Uint8Array.from(bytes);for(const mod of Object.values(modules))assert.equal(await mod.sha256Hex(bytes),sha(bytes));assert.deepEqual(bytes,copy);}
 // Make one actual PHP ZIP with zero, uneven, large and Unicode files, then use fresh runtimes.
 php=await createPhp();
 const fixture=JSON.parse((await php.run({code:`<?php
$files = array('wordpress/index.php'=>'<?php // index', 'wordpress/wp-load.php'=>'<?php // load', 'wordpress/wp-includes/version.php'=>'<?php // version', 'wordpress/wp-settings.php'=>'<?php // settings', 'wordpress/empty.json'=>'', 'wordpress/odd.php'=>str_repeat('abc',21846).'x', 'wordpress/繁體/檔案.php'=>'繁體中文檔案內容', 'wordpress/large.json'=>str_repeat('0123456789',104858).'xyz');
$z=new ZipArchive(); if($z->open('/tmp/fixture.zip',ZipArchive::CREATE|ZipArchive::OVERWRITE)!==true)throw new Exception('fixture open');
$manifest=array();foreach($files as $path=>$bytes){if(!$z->addFromString($path,$bytes))throw new Exception('fixture entry');$manifest[]=array('path'=>$path,'size'=>strlen($bytes),'sha256'=>hash('sha256',$bytes));}if(!$z->close())throw new Exception('fixture close');echo json_encode($manifest);` })).text);
 const fixtureBytes=Buffer.from(php.readFileAsBuffer('/tmp/fixture.zip'));php.exit();php=undefined;
 const realManifest=await load('assets/wordpress-runtime-artifact.json'),realBytes=await readFile('artifacts/cloudflare-wordpress-runtime-corpus.zip');assert.equal(sha(realBytes),realManifest.archive.sha256);
 const fixtureManifest={schema:'wp-codebox/wordpress-runtime-artifact/v1',key:'runtime/wordpress/'+sha(fixtureBytes)+'.zip',archive:{size:fixtureBytes.length,sha256:sha(fixtureBytes)},source:{url:'https://fixture.invalid/only-local'},files:fixture};
 const comparisons=[];
 for(const[fixtureName,manifest,archive]of[['core',realManifest,realBytes],['edge-cases',fixtureManifest,fixtureBytes]]){
  const pair=[];
  for(const label of ['baseline','candidate']){
   php=await createPhp();let gets=0;
   const bucket={get:async key=>{gets++;assert.equal(key,manifest.key);return{size:archive.length,arrayBuffer:async()=>archive.buffer.slice(archive.byteOffset,archive.byteOffset+archive.byteLength)};}};
   const evidence=await modules[label].materializeWordPressRuntimeArtifact(php,bucket,manifest);assert.equal(gets,1);assert.equal(evidence.materializedFiles,manifest.files.length);
   const m=php[Object.getOwnPropertySymbols(php).find(s=>s.description==='__private__dont__use')];let capacity=0,used=0,oversized=0;const rows=[];
   for(const f of manifest.files){const n=m.FS.lookupPath('/'+f.path,{follow:true}).node;assert.equal(n.usedBytes,f.size);if(n.contents==null)assert.equal(n.usedBytes,0);const bytes=n.contents??new Uint8Array();assert.equal(sha(bytes.subarray(0,n.usedBytes)),f.sha256);capacity+=bytes.byteLength;used+=n.usedBytes;if(bytes.byteLength>n.usedBytes)oversized++;rows.push({path:f.path,size:n.usedBytes,sha256:sha(bytes.subarray(0,n.usedBytes)),mode:n.mode});}
   assert.equal(php.fileExists('/tmp/wp-codebox-wordpress-runtime.zip'),false);
   const compaction=compactPlayttCoreFiles(php);
   // Recheck every copied/untouched content byte through the independent manifest digest.
   for(const f of manifest.files)assert.equal(sha(php.readFileAsBuffer('/'+f.path)),f.sha256);
   pair.push(rows);results.push({fixture:fixtureName,label,files:rows.length,usedBytes:used,capacityBytes:capacity,unusedCapacityBytes:capacity-used,oversizedFiles:oversized,compaction,allFileHashesExact:true,archiveTemporaryFileRemoved:true,inventorySha256:sha(JSON.stringify(rows))});
   php.exit();php=undefined;
  }
  assert.deepEqual(pair[1],pair[0]);comparisons.push({fixture:fixtureName,allFileBytesSizeAndModesEqual:true,files:pair[0].length});
 }
 assert.equal(sha((await readFile(sourcePath,'utf8')).replaceAll('\r\n','\n')),pinned.sha256);
 owner.phase='verified';report={schema:'playtt/preallocated-corpus-proof/v1',at:new Date().toISOString(),result:'pass',localOnly:true,cloudRequests:0,baselineSourceSha256:sha(source),candidateSourceSha256:sha(candidate),loaderSha256:sha(loader),wasmSha256:sha(wasmBytes),digestViewCases:4,digestInputsUnchanged:true,results,comparisons,centralRuntimeChanged:false,deployed:false,limitations:['Actual PHP8.3.36 filesystem semantics under Node, not Cloudflare resource enforcement.','No browser/editor/site publication flow and no production candidate adoption.','Allocation/CPU peak not measured by this semantic proof.']};
}catch(e){owner.phase='failed';await writeFile(join(directory,'failure-private.json'),JSON.stringify({name:e.name,message:e.message,stack:e.stack,results},null,2));throw e;}
finally{if(php)php.exit();owner.allPhpInstancesExited=true;await writeFile(ownerPath,JSON.stringify(owner,null,2));}
await writeFile('artifacts/playtt-preallocated-corpus-v2-proof.json',JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(report));
