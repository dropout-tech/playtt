// Make a diagnostic copy of the already tested candidate. Never replace it or deploy.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdtemp,copyFile,access} from 'node:fs/promises';
import {resolve,join,basename} from 'node:path';
import {createHash} from 'node:crypto';
assert.ok(process.argv.includes('--local')&&!process.argv.includes('--remote'));
const sha=b=>createHash('sha256').update(b).digest('hex'),load=async p=>JSON.parse(await readFile(p,'utf8'));
const planPath='artifacts/playtt-cold-boot-build-v2-private.json';
await access(planPath).then(()=>{throw Error('Existing build; inspect without replay');},e=>{if(e.code!=='ENOENT')throw e;});
const source=await load('artifacts/playtt-recovery-provider-source-plan.json');assert.equal(source.sources.length,82);
for(const e of source.sources)assert.equal(sha((await readFile(e.path,'utf8')).replaceAll('\r\n','\n')),e.sha256);
const target=(await load('artifacts/playtt-path-join-deploy-plan.json')).targets.candidate;
for(const m of target.modules)assert.equal(sha(await readFile(m.path)),m.sha256);
const entry=target.modules.find(m=>m.path.endsWith('.js'));assert.equal(entry.sha256,'824e974b27bf37302cc6607a840985f56b89fedc19e899e3e6140d8ac66cb2fa');
let code=await readFile(entry.path,'utf8');const edits=[];
function replace(label,before,after){assert.equal(code.split(before).length-1,1,label);code=code.replace(before,after);edits.push({label,before,after});}
replace('before-archive','async function materializeWordPressRuntimeArtifact(php, bucket, manifest) {','async function materializeWordPressRuntimeArtifact(php, bucket, manifest) {\n  await __playttColdObserve("before-archive",php);');
replace('archive-read','  const archiveBytes = new Uint8Array(await object2.arrayBuffer());','  const archiveBytes = new Uint8Array(await object2.arrayBuffer());\n  await __playttColdObserve("archive-read",php,{archiveBytes:archiveBytes.byteLength});');
replace('archive-verified','  php.writeFile(WORDPRESS_RUNTIME_ARCHIVE_TEMP_PATH, archiveBytes);','  await __playttColdObserve("archive-verified",php,{archiveBytes:archiveBytes.byteLength});\n  php.writeFile(WORDPRESS_RUNTIME_ARCHIVE_TEMP_PATH, archiveBytes);\n  await __playttColdObserve("archive-written",php,{archiveBytes:archiveBytes.byteLength});');
replace('archive-extracted','  const output = (await php.run({ code: zipMaterializationCode(manifest) })).text.trim();','  const output = (await php.run({ code: zipMaterializationCode(manifest) })).text.trim();\n  await __playttColdObserve("archive-extracted",php,{archiveBytes:archiveBytes.byteLength});');
replace('compaction-boundaries','  const compacted = compactPlayttCoreFiles(php);','  await __playttColdObserve("before-compaction",php);\n  const compacted = compactPlayttCoreFiles(php);\n  await __playttColdObserve("after-compaction",php,compacted);');
replace('copy-byte-validation','        node.contents = bytes.slice(0, node.usedBytes);','        node.contents = bytes.slice(0, node.usedBytes);\n        for(let i=0;i<node.usedBytes;i++)if(node.contents[i]!==bytes[i])throw Error("Compaction changed file bytes");\n        result.copiedUsedBytes=(result.copiedUsedBytes||0)+node.usedBytes;\n        result.replacedCapacityBytes=(result.replacedCapacityBytes||0)+bytes.byteLength;\n        result.copiedBytesExact=true;');
const instrumentation=`
// LOCAL diagnostic barriers: numeric inventory only, no forced GC or retained old buffers.
let __playttColdSequence=0;
function __playttColdInventory(php){
 const key=Object.getOwnPropertySymbols(php).find(s=>s.description==='__private__dont__use'),m=key?php[key]:undefined;
 if(!m?.FS?.root||!m?.HEAPU8)throw Error('No pinned PHP memory');
 const totals={wasmBytes:m.HEAPU8.byteLength,files:0,usedFileBytes:0,capacityFileBytes:0,distinctNonWasmBuffers:0,distinctNonWasmBufferBytes:0,heapAliasedViews:0,unknownFileBuffers:0};
 const seen=new Set(),buffers=new Set(),categories={};
 function visit(node,path){if(!node||seen.has(node))return;seen.add(node);const mode=node.mode&0xf000;
  if(mode===0x4000){for(const[name,child]of Object.entries(node.contents||{}))visit(child,path+'/'+name);return;}if(mode!==0x8000)return;
  totals.files++;const b=node.contents,category=path.startsWith('/wordpress/wp-content/')?'wp-content':path.startsWith('/wordpress/')?'wordpress-core':path.startsWith('/tmp/')?'temporary':'runtime';
  const c=categories[category]??={files:0,usedBytes:0,capacityBytes:0};c.files++;
  if(!ArrayBuffer.isView(b)){if(b==null&&node.usedBytes===0)return;totals.unknownFileBuffers++;return;}
  if(!Number.isSafeInteger(node.usedBytes)||node.usedBytes<0||node.usedBytes>b.byteLength)throw Error('Unexpected file bounds');
  totals.usedFileBytes+=node.usedBytes;totals.capacityFileBytes+=b.byteLength;c.usedBytes+=node.usedBytes;c.capacityBytes+=b.byteLength;
  if(b.buffer===m.HEAPU8.buffer)totals.heapAliasedViews++;
  else if(!buffers.has(b.buffer)){buffers.add(b.buffer);totals.distinctNonWasmBuffers++;totals.distinctNonWasmBufferBytes+=b.buffer.byteLength;}
 }
 visit(m.FS.root,'');return{...totals,categories};
}
async function __playttColdObserve(stage,php,extra={}){
 const id=++__playttColdSequence;if(id>7)throw Error('Too many diagnostic stages');
 const inventory=__playttColdInventory(php);
 if(!globalThis.__playttColdService)throw Error('Local diagnostic service missing');
 const response=await globalThis.__playttColdService.fetch('https://cold-observer.invalid/',{method:'POST',body:JSON.stringify({schema:'playtt/cold-boot-stage/v1',id,stage,inventory,extra})});
 if(!response.ok)throw Error('Local diagnostic service failed');
 const reply=await response.json();if(reply.id!==id||reply.ok!==true)throw Error('Wrong diagnostic acknowledgement');
}
`;
assert.ok(!code.includes('function __playttColdInventory'));
code+='\n'+instrumentation;
const directory=await mkdtemp(resolve('artifacts/cold-boot-build-')),modules=[];
for(const m of target.modules){const path=join(directory,basename(m.path));if(m===entry)await writeFile(path,code,{flag:'wx'});else await copyFile(m.path,path);const b=await readFile(path);modules.push({path,bytes:b.length,sha256:sha(b)});}
const plan={schema:'playtt/local-cold-boot-build/v1',at:new Date().toISOString(),directory,entry:join(directory,basename(entry.path)),modules,sourceCount:82,baselineBundleSha256:entry.sha256,edits,instrumentation,baselineModules:target.modules,localOnly:true,centralRuntimeChanged:false,deployed:false};
await writeFile(planPath,JSON.stringify(plan,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({result:'pass',sourceCount:82,modules:modules.length,edits:edits.length,barriers:7,localOnly:true,deployed:false}));
