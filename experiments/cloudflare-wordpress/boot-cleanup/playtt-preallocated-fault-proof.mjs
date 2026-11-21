// Actual pinned PHP/WASM; immutable candidate, synthetic owned ZIPs and scoped MEMFS faults.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdtemp,access} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {PHP,loadPHPRuntime} from '@php-wasm/universal';
assert.ok(process.argv.includes('--local')&&!process.argv.includes('--remote'));
const prefix='artifacts/playtt-preallocated-fault-v3-',ownerPath=prefix+'owned-private.json';
await access(ownerPath).then(()=>{throw Error('Existing attempt; inspect without replay');},e=>{if(e.code!=='ENOENT')throw e;});
const sha=b=>createHash('sha256').update(b).digest('hex'),load=async p=>JSON.parse(await readFile(p,'utf8'));
const source=(await readFile('src/wordpress-runtime-artifact.ts','utf8')).replaceAll('\r\n','\n');
const candidate=(await readFile('../../../playtt/experiments/cloudflare-wordpress/cold-boot-preallocation/wordpress-runtime-artifact.candidate.ts','utf8')).replaceAll('\r\n','\n');
assert.equal(sha(source),'2a3345501b3c258d5087639d00fd5720a8539dda0953cf1fef025f0933e16efc');
assert.equal(sha(candidate),'fd63abb044984c9b8f43799f9682e4ea65d232fa858be90ce4cab70a986e424f');
const directory=await mkdtemp(resolve('artifacts/preallocated-fault-')),modules={};
for(const[label,text]of[['baseline',source],['candidate',candidate]]){
 const code=text.replace('"./wordpress-runtime-corpus.js"',JSON.stringify(pathToFileURL(resolve('src/wordpress-runtime-corpus.ts')).href));
 const file=join(directory,label+'.ts');await writeFile(file,code,{flag:'wx'});modules[label]=await import(pathToFileURL(file));
}
const loader=(await readFile('src/playtt-php-loader.mjs','utf8')).replaceAll('\r\n','\n');assert.equal(sha(loader),'382310127a494ab04b7324823230f3e119e6928330575a3089cd84566da6150f');
const loaderPath=join(directory,'php-node.mjs');await writeFile(loaderPath,"import {createRequire} from 'node:module';const require=createRequire(import.meta.url);\n"+loader.replace(/^import dependencyFilename from '[^']+php_8_3\.wasm';/,"const dependencyFilename='php_8_3.wasm';"),{flag:'wx'});
const {init,dependenciesTotalSize}=await import(pathToFileURL(loaderPath));
const wasmBytes=await readFile('node_modules/@php-wasm/web-8-3/asyncify/8_3_36/php_8_3.wasm');assert.equal(sha(wasmBytes),'5b1787681568c62c37cf44f3a73d979540b5439c0c79d960cbbaf5d22a467854');const wasm=await WebAssembly.compile(wasmBytes);
const createPhp=async()=>new PHP(await loadPHPRuntime({dependencyFilename:'php_8_3.wasm',dependenciesTotalSize,phpWasmAsyncMode:'asyncify',init},{ENV:{USE_ZEND_ALLOC:'0',USE_TRACKED_ALLOC:'1'},instantiateWasm:(imports,receive)=>receive(new WebAssembly.Instance(wasm,imports),wasm)}));
const owner={phase:'starting',directory,sourceSha256:sha(source),candidateSha256:sha(candidate),allPhpInstancesExited:false,completed:[]};await writeFile(ownerPath,JSON.stringify(owner,null,2),{flag:'wx'});
const temp='/tmp/wp-codebox-wordpress-runtime.zip',target='/wordpress/edge.php';
function crc32(bytes){let c=0xffffffff;for(const b of bytes){c^=b;for(let n=0;n<8;n++)c=(c>>>1)^((c&1)?0xedb88320:0);}return(c^0xffffffff)>>>0;}
function zip(files){
 let offset=0;const local=[],central=[],entries=[];
 for(const f of files){const name=Buffer.from(f.path),b=Buffer.from(f.bytes),crc=crc32(b),l=Buffer.alloc(30),c=Buffer.alloc(46);l.writeUInt32LE(0x04034b50);l.writeUInt16LE(20,4);l.writeUInt16LE(0x800,6);l.writeUInt32LE(crc,14);l.writeUInt32LE(b.length,18);l.writeUInt32LE(b.length,22);l.writeUInt16LE(name.length,26);c.writeUInt32LE(0x02014b50);c.writeUInt16LE(20,4);c.writeUInt16LE(20,6);c.writeUInt16LE(0x800,8);c.writeUInt32LE(crc,16);c.writeUInt32LE(b.length,20);c.writeUInt32LE(b.length,24);c.writeUInt16LE(name.length,28);c.writeUInt32LE(offset,42);entries.push({path:f.path,localOffset:offset,dataOffset:offset+30+name.length,centralRelative:central.reduce((n,x)=>n+x.length,0)});local.push(l,name,b);central.push(c,name);offset+=l.length+name.length+b.length;}
 const cbytes=Buffer.concat(central),e=Buffer.alloc(22);e.writeUInt32LE(0x06054b50);e.writeUInt16LE(files.length,8);e.writeUInt16LE(files.length,10);e.writeUInt32LE(cbytes.length,12);e.writeUInt32LE(offset,16);return{bytes:Buffer.concat([...local,cbytes,e]),entries:entries.map(x=>({...x,centralOffset:offset+x.centralRelative}))};
}
const files=[{path:'wordpress/index.php',bytes:Buffer.from('<?php // index')},{path:'wordpress/wp-load.php',bytes:Buffer.from('<?php // load')},{path:'wordpress/wp-includes/version.php',bytes:Buffer.from('<?php // version')},{path:'wordpress/wp-settings.php',bytes:Buffer.from('<?php // settings')},{path:target.slice(1),bytes:Buffer.from('abc'.repeat(21846)+'x')}];
const valid=zip(files),manifestFor=(archive,items=files)=>({schema:'wp-codebox/wordpress-runtime-artifact/v1',key:'runtime/wordpress/'+sha(archive)+'.zip',archive:{sha256:sha(archive),size:archive.length},source:{url:'https://fixture.invalid/local-only'},files:items.map(f=>({path:f.path,size:f.bytes.length,sha256:sha(f.bytes)}))});
const altered=mutate=>{const bytes=Buffer.from(valid.bytes);mutate(bytes);return bytes;};
const edge=valid.entries.at(-1);
const archiveCases=[
 {name:'valid-stored-zip',archive:valid.bytes,pass:true},
 {name:'not-a-zip',archive:Buffer.from('not a zip file'),message:'could not be opened'},
 {name:'truncated-directory',archive:valid.bytes.subarray(0,valid.bytes.length-13),message:'could not be opened'},
 {name:'extra-entry',archive:zip([...files,{path:'wordpress/extra.php',bytes:Buffer.from('extra')}]).bytes,message:'file count'},
 {name:'directory-size-mismatch',archive:altered(b=>b.writeUInt32LE(files.at(-1).bytes.length+1,edge.centralOffset+24)),message:'entries do not match'},
 {name:'archive-traversal-name',archive:zip(files.map((f,i)=>i===4?{...f,path:'wordpress/../escape.php'}:f)).bytes,message:'entries do not match'},
 {name:'missing-required-file',archive:zip(files.filter(f=>f.path!=='wordpress/wp-settings.php')).bytes,items:files.filter(f=>f.path!=='wordpress/wp-settings.php'),message:'missing required file'},
 {name:'unsupported-compression',archive:altered(b=>{b.writeUInt16LE(999,edge.localOffset+8);b.writeUInt16LE(999,edge.centralOffset+10);}),message:'entry stream failed|ZIP extraction failed|could not be opened'},
 {name:'crc-corruption',archive:altered(b=>{b[edge.dataOffset+500]^=0xff;}),observeIntegrity:true},
];
const results=[];let php;
async function runCase(label,spec){
 php=await createPhp();const m=php[Object.getOwnPropertySymbols(php).find(s=>s.description==='__private__dont__use')],fs=m.FS;let gets=0,writes=0,runs=0,lastResult,error,returned,faultHits=0,shortBytes=0;
 const restore=[],closed=[],opened=[];const pathOf=s=>s?.node?fs.getPath(s.node):typeof s==='string'?s:s?fs.getPath(s):'';
 function wrap(key,fn){const original=fs[key];assert.equal(typeof original,'function');fs[key]=fn(original);restore.push(()=>{fs[key]=original;});}
 wrap('open',base=>(...args)=>{const s=base(...args);opened.push(pathOf(s));return s;});
 wrap('close',base=>s=>{const path=pathOf(s);const result=base(s);closed.push(path);return result;});
 if(spec.fault==='directory'){php.mkdir('/wordpress');php.writeFile('/wordpress/wp-includes','sentinel');}
 if(spec.fault==='destination'){php.mkdir(target);}
 if(spec.fault==='truncate')wrap('doTruncate',base=>(stream,node,len)=>{if(pathOf(node)===target&&len>0){faultHits++;throw new fs.ErrnoError(29);}return base(stream,node,len);});
 if(spec.fault==='short-write')wrap('write',base=>(stream,buffer,offset,length,position,...rest)=>{if(pathOf(stream)===target){faultHits++;if(shortBytes>0)throw new fs.ErrnoError(29);const result=base(stream,buffer,offset,Math.min(7,length),position,...rest);shortBytes+=result;return result;}return base(stream,buffer,offset,length,position,...rest);});
 if(spec.fault==='read-error'){
  let active=false;wrap('doTruncate',base=>(stream,node,len)=>{const r=base(stream,node,len);if(pathOf(node)===target&&len>0)active=true;return r;});
  wrap('read',base=>(stream,buffer,offset,length,position,...rest)=>{if(active&&pathOf(stream)===temp){faultHits++;throw new fs.ErrnoError(29);}return base(stream,buffer,offset,length,position,...rest);});
 }
 const archive=spec.archive??valid.bytes,manifest=spec.manifest??manifestFor(archive,spec.items??files);
 const facade={writeFile:(path,b)=>{writes++;return php.writeFile(path,b);},run:async options=>{runs++;lastResult=await php.run(options);return lastResult;}};
 const bucket={get:async key=>{gets++;assert.equal(key,manifest.key);return spec.missing?null:{size:spec.objectSize??archive.length,arrayBuffer:async()=>archive.buffer.slice(archive.byteOffset,archive.byteOffset+archive.byteLength)};}};
 try{returned=await modules[label].materializeWordPressRuntimeArtifact(facade,bucket,manifest);}catch(e){error=e;}
 for(const undo of restore.reverse())undo();
 const combined=[error?.message,lastResult?.text,lastResult?.errors].filter(Boolean).join('\n');
 await writeFile(join(directory,label+'-'+spec.name+'-private.json'),JSON.stringify({returned,error:error?{name:error.name,message:error.message}:null,phpExitCode:lastResult?.exitCode,phpErrors:lastResult?.errors,phpText:lastResult?.text,gets,writes,runs,faultHits,shortBytes,opened,closed},null,2),{flag:'wx'});
 if(!spec.observeIntegrity)assert.equal(Boolean(error),!spec.pass,label+': '+spec.name+' accepted/rejected unexpectedly');
 if(spec.observeIntegrity&&!error){const expected=Buffer.from(files.at(-1).bytes);expected[500]^=0xff;assert.deepEqual(Buffer.from(php.readFileAsBuffer(target)),expected);assert.notEqual(sha(expected),manifest.files.at(-1).sha256);}
 if(spec.message)assert.match(combined,new RegExp(spec.message),label+': '+spec.name+' wrong failure');
 if(spec.beforePhp){assert.equal(writes,0);assert.equal(runs,0);}
 if(spec.noBucket)assert.equal(gets,0);
 if(['truncate','short-write','read-error'].includes(spec.fault))assert.ok(faultHits>0,spec.name+' was not triggered');
 assert.equal(php.fileExists(temp),false,'Temporary archive retained');
 assert.equal(php.fileExists('/escape.php'),false);
 assert.equal(fs.streams.filter(s=>s&&[temp,target].includes(pathOf(s))).length,0,'Archive/destination descriptor leaked');
 if(spec.pass){for(const f of files)assert.equal(sha(php.readFileAsBuffer('/'+f.path)),sha(f.bytes));}
 if(spec.fault==='directory')assert.equal(php.readFileAsText('/wordpress/wp-includes'),'sentinel');
 const partial=php.fileExists(target)&&!php.isDir(target)?php.readFileAsBuffer(target):null;
 if(spec.fault==='short-write'){assert.equal(shortBytes,7);assert.equal(partial.length,files.at(-1).bytes.length);assert.notEqual(sha(partial),sha(files.at(-1).bytes));}
 const live=await php.run({code:'<?php echo "still-alive";'});assert.equal(live.text,'still-alive');assert.equal(live.exitCode,0);
 php.exit();php=undefined;
 results.push({label,name:spec.name,result:spec.observeIntegrity?(error?'corrupt-entry-rejected':'trusted-archive-accepted-with-entry-hash-mismatch'):spec.pass?'valid-corpus-exact':'rejected',bucketGets:gets,archiveWrites:writes,phpRuns:runs,phpExitCode:lastResult?.exitCode??null,temporaryRemoved:true,noEscapeFile:true,noArchiveOrDestinationDescriptor:true,phpStillUsable:true,phpExited:true,faultHits,shortBytes,partialDestinationBytes:partial?.length??null,partialDestinationNotClaimedAsSuccess:!spec.pass&&!spec.observeIntegrity});
 owner.completed.push(label+':'+spec.name);await writeFile(ownerPath,JSON.stringify(owner,null,2));
}
let report;
try{
 for(const spec of archiveCases)for(const label of ['baseline','candidate'])await runCase(label,spec);
 for(const spec of [{name:'directory-is-file',fault:'directory',message:'directory creation failed|ZIP extraction failed'},{name:'destination-is-directory',fault:'destination',message:'destination open failed|ZIP extraction failed'},{name:'preallocation-io-failure',fault:'truncate',message:'preallocation failed'},{name:'partial-stream-write',fault:'short-write',message:'extracted size mismatch'},{name:'stream-read-io-failure',fault:'read-error',message:'extracted size mismatch'}])await runCase('candidate',spec);
 const good=manifestFor(valid.bytes);
 const invalids=[{name:'bucket-missing',missing:true,message:'unavailable'},{name:'object-size-mismatch',objectSize:valid.bytes.length+1,message:'size does not match'},{name:'archive-sha-mismatch',archive:altered(b=>{b[edge.dataOffset]^=1;}),manifest:good,message:'hash does not match'},{name:'manifest-traversal',manifest:{...good,files:good.files.map((f,i)=>i===4?{...f,path:'wordpress/../escape.php'}:f)},noBucket:true,message:'invalid file path'},{name:'manifest-duplicate',manifest:{...good,files:[...good.files,good.files[0]]},noBucket:true,message:'file budget'},{name:'manifest-file-over-budget',manifest:{...good,files:good.files.map((f,i)=>i===4?{...f,size:8*1024*1024+1}:f)},noBucket:true,message:'invalid metadata'}];
 for(const spec of invalids)for(const label of ['baseline','candidate'])await runCase(label,{...spec,beforePhp:true});
 assert.equal(sha((await readFile('src/wordpress-runtime-artifact.ts','utf8')).replaceAll('\r\n','\n')),sha(source));
 owner.phase='verified';report={schema:'playtt/preallocated-fault-proof/v1',at:new Date().toISOString(),result:'pass',actualPhp:'8.3.36',baselineSourceSha256:sha(source),candidateSourceSha256:sha(candidate),loaderSha256:sha(loader),wasmSha256:sha(wasmBytes),cases:results.length,results,centralRuntimeChanged:false,cloudRequests:0,deployed:false,limitations:['Owned small stored ZIP fixtures under Node/PHP-WASM, not Cloudflare resource enforcement.','Scoped MEMFS faults simulate I/O failure; not a provider filesystem failure or process kill.','Partial extracted files may remain in the failed PHP instance. Rejection, descriptor/temp cleanup and no success evidence are tested; caller runtime disposal requires separate integration proof.','A CRC-corrupted entry with recomputed trusted archive SHA is observed separately; it is not an ordinary untrusted archive-tampering test. No per-entry SHA checking is added; original trusted archive digest remains the binding.']};
}catch(e){owner.phase='failed';await writeFile(join(directory,'failure-private.json'),JSON.stringify({name:e.name,message:e.message,stack:e.stack,results},null,2));throw e;}
finally{if(php)php.exit();owner.allPhpInstancesExited=true;await writeFile(ownerPath,JSON.stringify(owner,null,2));}
await writeFile(prefix+'proof.json',JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({result:report.result,cases:report.cases,sourceUnchanged:true,cloudRequests:0}));
