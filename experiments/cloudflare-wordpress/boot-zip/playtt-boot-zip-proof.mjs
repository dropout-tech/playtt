// Exact original/candidate outputs and partial PHP filesystem effects, local only.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdtemp,access} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {spawnSync} from 'node:child_process';
import {PHP,loadPHPRuntime} from '@php-wasm/universal';
import {encodeZip} from '@php-wasm/stream-compression';
import {sources,api,sha,previous} from './playtt-boot-zip-common.mjs';
assert.ok(process.argv.includes('--local')&&!process.argv.includes('--remote'));
const prefix='artifacts/playtt-boot-zip-proof-',ownerPath=prefix+'owned-private.json';
await access(ownerPath).then(()=>{throw Error('Existing attempt: inspect without replay');},e=>{if(e.code!=='ENOENT')throw e;});
const input=await sources(),directory=await mkdtemp(resolve('artifacts/boot-zip-proof-')),owner={phase:'starting',directory,phpInstancesExited:[]};
await writeFile(ownerPath,JSON.stringify(owner,null,2),{flag:'wx'});
let php;
try{
 const seed=input.assets['markdown-database-integration-canonical-seed.zip'],mdi=input.assets['markdown-database-integration-runtime.zip'],manifest=JSON.parse(input.assets['markdown-database-integration-canonical-seed.json']);
 const inventoryCode="import sys,zipfile,hashlib,json;out=[]\nfor p in sys.argv[1:]:\n with zipfile.ZipFile(p) as z: out.append([{'path':i.filename,'bytes':i.file_size,'sha256':hashlib.sha256(z.read(i)).hexdigest()} for i in z.infolist()])\nprint(json.dumps(out))";
 const independent=spawnSync('python',['-c',inventoryCode,join(previous,'assets/markdown-database-integration-canonical-seed.zip'),join(previous,'assets/markdown-database-integration-runtime.zip')],{encoding:'utf8',maxBuffer:4*1024*1024});assert.equal(independent.status,0);const inventories=JSON.parse(independent.stdout);await writeFile(join(directory,'independent-inventories-private.json'),JSON.stringify(inventories),{flag:'wx'});
 const files=[new File(['<?php // fixture'],'db.php',{lastModified:0}),new File(['繁體中文🙂'],'src/繁中.php',{lastModified:0}),new File([new Uint8Array(0)],'empty.txt',{lastModified:0}),new File([Uint8Array.from({length:70003},(_,i)=>i%256)],'src/large.bin',{lastModified:0})];
 const fixture=new Uint8Array(await new Response(encodeZip(files)).arrayBuffer()),empty=new Uint8Array(await new Response(encodeZip([])).arrayBuffer());
 const fixtureManifest={...manifest,archiveSha256:sha(fixture),files:await Promise.all(files.map(async f=>({path:f.name,size:f.size,sha256:sha(new Uint8Array(await f.arrayBuffer()))})))};
 const cases=[{label:'actual-seed',kind:'seed',bytes:seed,manifest},{label:'generated-seed',kind:'seed',bytes:fixture,manifest:fixtureManifest},{label:'empty-seed',kind:'seed',bytes:empty,manifest:{...fixtureManifest,archiveSha256:sha(empty),files:[]}}];
 for(const label of ['schema','revision','archive-hash','file-hash','file-size','missing-inventory','extra-inventory']){const m=structuredClone(manifest);if(label==='schema')m.schema='bad';if(label==='revision')m.markdownDatabaseIntegrationRevision='bad';if(label==='archive-hash')m.archiveSha256='0'.repeat(64);if(label==='file-hash')m.files[0].sha256='0'.repeat(64);if(label==='file-size')m.files[0].size++;if(label==='missing-inventory')m.files.pop();if(label==='extra-inventory')m.files.push({path:'missing.md',size:0,sha256:sha('')});cases.push({label:'seed-'+label,kind:'seed',bytes:seed,manifest:m,mustReject:true});}
 for(const n of [0,3,29,seed.length-1]){const bytes=seed.subarray(0,n);cases.push({label:'seed-truncated-'+n,kind:'seed',bytes,manifest:{...manifest,archiveSha256:sha(bytes)}});}
 cases.push({label:'actual-mdi',kind:'mdi',bytes:mdi},{label:'generated-mdi',kind:'mdi',bytes:fixture},{label:'empty-mdi',kind:'mdi',bytes:empty},{label:'mdi-snapshot-owned',kind:'mdi',bytes:fixture,mutateInput:true});
 for(const n of [0,3,29,mdi.length-1])cases.push({label:'mdi-truncated-'+n,kind:'mdi',bytes:mdi.subarray(0,n)});
 for(const method of ['mkdir','writeFile'])for(const position of [1,4])cases.push({label:'mdi-'+method+'-fails-'+position,kind:'mdi',bytes:fixture,fault:{method,position},mustReject:true});
 const loader=(await readFile(join(previous,'src/playtt-php-loader.mjs'),'utf8')).replaceAll('\r\n','\n');assert.equal(sha(loader),'280d74443122ff048049d12fb033cb28cd85e84ca4ae3ee1d390b1df5189de81');
 const nodeLoader="import {createRequire} from 'node:module';const require=createRequire(import.meta.url);\n"+loader.replace(/^import dependencyFilename from '[^']+php_8_3\.wasm';/,"const dependencyFilename='php_8_3.wasm';");assert.notEqual(nodeLoader,loader);const loaderPath=join(directory,'php-node.mjs');await writeFile(loaderPath,nodeLoader,{flag:'wx'});
 const wasmBytes=await readFile('node_modules/@php-wasm/web-8-3/asyncify/8_3_36/php_8_3.wasm');assert.equal(sha(wasmBytes),'5b1787681568c62c37cf44f3a73d979540b5439c0c79d960cbbaf5d22a467854');const wasm=await WebAssembly.compile(wasmBytes),{init,dependenciesTotalSize}=await import(pathToFileURL(loaderPath));
 const outputs=[];
 for(const variant of ['baseline','candidate']){
  const mod=await api(variant);php=new PHP(await loadPHPRuntime({dependencyFilename:'php_8_3.wasm',dependenciesTotalSize,phpWasmAsyncMode:'asyncify',init},{ENV:{USE_ZEND_ALLOC:'0',USE_TRACKED_ALLOC:'1'},instantiateWasm:(imports,receive)=>receive(new WebAssembly.Instance(wasm,imports),wasm)}));
  const fs=php[Object.getOwnPropertySymbols(php).find(s=>s.description==='__private__dont__use')].FS;
  function clear(path){let stat;try{stat=fs.lstat(path);}catch(e){if(e.errno===44)return;throw e;}if(fs.isDir(stat.mode)){for(const name of fs.readdir(path))if(name!=='.'&&name!=='..')clear(path+'/'+name);fs.rmdir(path);}else fs.unlink(path);}
  function inventory(path){const out=[];function walk(p){for(const name of fs.readdir(p).filter(n=>n!=='.'&&n!=='..').sort()){const q=p+'/'+name,stat=fs.lstat(q);if(fs.isDir(stat.mode))walk(q);else{const bytes=php.readFileAsBuffer(q);out.push({path:q,bytes:bytes.length,sha256:sha(bytes),mode:stat.mode});}}}walk(path);return out;}
  const rows=[];
  for(const c of cases){clear('/wordpress');php.mkdir('/wordpress/wp-content');const calls=[],counts={mkdir:0,writeFile:0},adapter={};for(const method of ['mkdir','writeFile'])adapter[method]=(path,bytes)=>{const count=++counts[method];calls.push({method,path,...(bytes?{bytes:bytes.length,sha256:sha(bytes)}:{})});if(c.fault?.method===method&&c.fault.position===count)throw new Error('Owned '+method+' fault');return php[method](path,bytes);};
   const bytes=Uint8Array.from(c.bytes),array=bytes.buffer;let result;try{if(c.kind==='seed'){const files=await mod.seed(array,c.manifest);result={ok:true,files:files.map(f=>({path:f.path,bytes:f.bytes.length,sha256:sha(f.bytes)}))};}else{const promise=mod.mdi(adapter,array);if(c.mutateInput)bytes.fill(0);await promise;result={ok:true};}}catch(e){result={ok:false,name:e.name,message:e.message};}
   if(c.mustReject)assert.equal(result.ok,false,c.label);const row={label:c.label,result,calls,files:inventory('/wordpress')};rows.push(row);
   if(c.label==='actual-seed')assert.deepEqual(result.files,inventories[0].sort((a,b)=>a.path.localeCompare(b.path)));
   if(c.label==='actual-mdi'){
    assert.equal(result.ok,true);const expected=inventories[1].map(f=>({...f,path:'/wordpress/wp-content/plugins/markdown-database-integration/'+f.path}));const db=inventories[1].find(f=>f.path==='db.php');assert.ok(db);expected.push({...db,path:'/wordpress/wp-content/db.php'});const normalized=row.files.map(({mode,...f})=>f).sort((a,b)=>a.path.localeCompare(b.path));assert.deepEqual(normalized,expected.sort((a,b)=>a.path.localeCompare(b.path)));
   }
  }
  const raw=JSON.stringify(rows);await writeFile(join(directory,variant+'-observations-private.json'),raw,{flag:'wx'});outputs.push(rows);php.exit();php=undefined;owner.phpInstancesExited.push(variant);
 }
 assert.deepEqual(outputs[1],outputs[0]);const snapshots=outputs[1].filter(r=>['generated-mdi','mdi-snapshot-owned'].includes(r.label));assert.deepEqual(snapshots[0].files,snapshots[1].files);
 const observations=outputs[0].map(row=>({label:row.label,ok:row.result.ok,files:row.files.length,returnedFiles:row.result.files?.length??0,calls:row.calls.length,observationSha256:sha(JSON.stringify(row))}));
 const summary={schema:'playtt/boot-zip-proof/v1',at:new Date().toISOString(),result:'pass',originalSha256:input.originalSha256,candidateSha256:input.candidateSha256,moduleSha256:input.moduleSha256,wasmSha256:sha(wasmBytes),loaderSha256:sha(loader),cases:observations.length,valid:observations.filter(r=>r.ok).length,rejected:observations.filter(r=>!r.ok).length,observations,assets:Object.entries(input.assets).map(([name,bytes])=>({name,bytes:bytes.length,sha256:sha(bytes)})),independentPythonZipInventoryExact:true,seedFiles:inventories[0].length,mdiFiles:inventories[1].length,mdiDbPhpDuplicateExact:true,partialWritesAndModesExact:true,mdiSynchronousSnapshotOwnership:true,allResultsAndErrorsExact:true,cloudRequests:0,centralRuntimeChanged:false,limitations:['Actual PHP/WASM filesystem checks under Node, not full WordPress boot/editor or provider limits.','Remote component importer unchanged because its actual pinned ZIP is not available locally.','Seed hash await and snapshot timing preserved; input mutation during that await is not newly validated.','Original ZIP parser and existing validation gaps retained; not a security rewrite.']};
 await writeFile(prefix+'summary.json',JSON.stringify(summary,null,2)+'\n',{flag:'wx'});owner.phase='verified';console.log(JSON.stringify({result:summary.result,cases:summary.cases,valid:summary.valid,rejected:summary.rejected,seedFiles:summary.seedFiles,mdiFiles:summary.mdiFiles,independentPythonZipInventoryExact:true,partialWritesAndModesExact:true}));
}catch(e){owner.phase='failed';await writeFile(join(directory,'failure-private.json'),JSON.stringify({name:e.name,message:e.message,stack:e.stack}));throw e;}finally{if(php){php.exit();owner.phpInstancesExited.push('failed-active');}owner.allPhpInstancesExited=true;await writeFile(ownerPath,JSON.stringify(owner,null,2));}
