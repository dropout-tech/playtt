// Isolated full-source integration. Never deploys or mutates the central runtime.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,access,readdir} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {createHash} from 'node:crypto';
assert.ok(process.argv.includes('--local')&&!process.argv.includes('--remote'));
const sha=b=>createHash('sha256').update(b).digest('hex'),load=async p=>JSON.parse(await readFile(p,'utf8'));
const previous=resolve('../../../playtt-base64-native-build'),target=resolve('../../../playtt-core-integrated-build');
const prior=await load(join(previous,'build-inputs.json')),files=new Map();assert.equal(prior.files.length,208);
for(const f of prior.files){assert.ok(!f.path.includes('..'));const b=await readFile(join(previous,f.path));assert.equal(sha(b),f.sha256,f.path);files.set(f.path,b);}
const module=await readFile('scripts/playtt-compressed-core-module.mjs');assert.equal(sha(module),'3a72305b1edfa3e222644084777d018e3727b2d7f5730acd930182400b24a93a');
files.set('src/playtt-compressed-core-module.mjs',module);
files.set('src/playtt-compressed-core-module.d.mts',Buffer.from(`import type { PHP } from '@php-wasm/universal';
export function compressedCoreNodeMemory(node: object): { logicalBytes: number; compressedBytes: number } | undefined;
export function compressedCoreCacheMemory(php: PHP): { bytes: number; limit: number };
export function compressCoreFiles(php: PHP, options?: { cacheBytes?: number; minBytes?: number; minSaving?: number }): {
  stats: { inspectedFiles: number; compressedFiles: number; originalBytes: number; compressedBytes: number; retainedCapacitySavings: number; skippedOpenFiles: number; decodedCacheLimit: number };
  cacheMemory(): { bytes: number; limit: number };
  clearCache(): void;
};
`));
function replace(path,from,to){const text=files.get(path).toString();assert.equal(text.split(from).length,2,path+' unique integration point');files.set(path,Buffer.from(text.replace(from,to)));}
replace('src/worker.ts',"import { compactPlayttCoreFiles } from './playtt-core-memory.js';","import { compactPlayttCoreFiles } from './playtt-core-memory.js';\nimport { compressCoreFiles } from './playtt-compressed-core-module.mjs';");
replace('src/worker.ts',"    console.log(JSON.stringify({ schema: 'playtt-core-compaction/v1', ...compacted }))","    console.log(JSON.stringify({ schema: 'playtt-core-compaction/v1', ...compacted }))\n    const compressionStarted = performance.now()\n    const compressedCore = compressCoreFiles(php)\n    console.log(JSON.stringify({ schema: 'playtt-core-compression/v1', ...compressedCore.stats, wallMs: performance.now() - compressionStarted }))");
replace('src/playtt-memory-diagnostics.ts',"import type { PHP } from '@php-wasm/universal';","import type { PHP } from '@php-wasm/universal';\nimport { compressedCoreNodeMemory, compressedCoreCacheMemory } from './playtt-compressed-core-module.mjs';");
replace('src/playtt-memory-diagnostics.ts',"const result = { fileBytes: 0, files: 0, heapAliasedFileBytes: 0, unknownFileBuffers: 0, categories:","const result = { fileBytes: 0, files: 0, heapAliasedFileBytes: 0, unknownFileBuffers: 0, compressedCoreFiles: 0, compressedCoreBytes: 0, compressedCoreLogicalBytes: 0, categories:");
replace('src/playtt-memory-diagnostics.ts',"    const bytes = node.contents;\n    let size: number;\n    if (ArrayBuffer.isView(bytes)) size = bytes.byteLength;","    // Peek before contents: its accessor restores a writable uncompressed file.\n    const compressed = compressedCoreNodeMemory(node);\n    const bytes = compressed ? undefined : node.contents;\n    let size: number;\n    if (compressed) {\n      size = compressed.compressedBytes;\n      result.compressedCoreFiles++;\n      result.compressedCoreBytes += size;\n      result.compressedCoreLogicalBytes += compressed.logicalBytes;\n    } else if (ArrayBuffer.isView(bytes)) size = bytes.byteLength;");
replace('src/playtt-memory-diagnostics.ts',"  return { heapBytes: module?.HEAPU8?.byteLength || 0, fileScanPerformed, ...files };","  const cache = compressedCoreCacheMemory(php);\n  // Cache is separate from fileBytes. Inspector backing already includes both.\n  return { heapBytes: module?.HEAPU8?.byteLength || 0, decodedCoreCacheBytes: cache.bytes, decodedCoreCacheLimit: cache.limit, fileScanPerformed, ...files };");
const changed=['src/worker.ts','src/playtt-memory-diagnostics.ts'],added=['src/playtt-compressed-core-module.mjs','src/playtt-compressed-core-module.d.mts'];
const inputs={schema:'playtt/core-integrated-inputs/v1',files:[...files].map(([path,b])=>({path,sha256:sha(b)})),changedInputs:changed,addedInputs:added,prototypeSha256:sha(module),centralRuntimeChanged:false,cloudRequests:0};
assert.equal(files.size,210);for(const f of prior.files)if(!changed.includes(f.path))assert.equal(sha(files.get(f.path)),f.sha256);
if(!process.argv.includes('--check')){
 await access(target).then(()=>{throw Error('Target exists; inspect without overwriting');},e=>{if(e.code!=='ENOENT')throw e;});
 for(const [name,b]of files){const p=join(target,name);await mkdir(resolve(p,'..'),{recursive:true});await writeFile(p,b,{flag:'wx'});}
 await writeFile(join(target,'build-inputs.json'),JSON.stringify(inputs,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({prepared:true,inputs:files.size,changed,added}));
}else{
 assert.deepEqual(await load(join(target,'build-inputs.json')),inputs);for(const f of inputs.files)assert.equal(sha(await readFile(join(target,f.path))),f.sha256,f.path);
 assert.equal((await readFile(join(target,'typecheck-private.log'))).length,0);assert.ok((await readFile(join(target,'dry-run-private.log'),'utf8')).includes('--dry-run: exiting now.'));
 const old=await load('artifacts/playtt-base64-native-build-private.json');assert.equal(old.productionBundleSha256,'0f9d3340e3e66f7cc6242bf31cc26d4d76ad9c78dfa7f87a17adca214206b025');
 const modules=[];for(const name of await readdir(join(target,'dry-run'))){if(!/\.(js|wasm|sqlite|zip)$/.test(name))continue;const path=join(target,'dry-run',name),b=await readFile(path);modules.push({path,bytes:b.length,sha256:sha(b)});}assert.equal(modules.length,6);
 assert.deepEqual(modules.filter(m=>!m.path.endsWith('.js')).map(m=>m.sha256).sort(),old.productionModules.filter(m=>!m.path.endsWith('.js')).map(m=>m.sha256).sort());
 const entry=modules.find(m=>m.path.endsWith('.js')),compiled=await readFile(entry.path,'utf8');assert.notEqual(entry.sha256,old.productionBundleSha256);assert.ok(compiled.includes('playtt-core-compression/v1')&&compiled.includes('decodedCoreCacheBytes'));
 const meta=await load(join(target,'dry-run/bundle-meta.json')),expected=new Map(inputs.files.map(f=>[f.path,f.sha256]));let loaded=0;
 for(const name of Object.keys(meta.inputs)){if(name.startsWith('src/')){assert.equal(sha(await readFile(join(target,name))),expected.get(name),name);loaded++;}else assert.ok(!resolve(target,name).startsWith(resolve('src')));}
 assert.ok(meta.inputs['src/playtt-compressed-core-module.mjs']);
 const central=await load('artifacts/playtt-recovery-provider-source-plan.json');assert.equal(central.sources.length,82);for(const f of central.sources)assert.equal(sha((await readFile(f.path,'utf8')).replaceAll('\r\n','\n')),f.sha256);
 const plan={schema:'playtt/core-integrated-build/v1',productionModules:modules,productionBundleSha256:entry.sha256,entry:entry.path};
 const proof={schema:'playtt/core-integrated-build-proof/v1',result:'pass',inputs:210,changedInputs:changed,addedInputs:added,unchangedPriorInputs:206,loadedSources:loaded,prototypeSha256:sha(module),baselineBundleSha256:old.productionBundleSha256,bundleSha256:entry.sha256,typecheck:'pass',wranglerDryRun:'pass',unchangedBinaryModules:5,compressionAfterBootPatchesAndCompaction:true,diagnosticPeekBeforeContents:true,decodedCacheReportedSeparately:true,centralRuntimeChanged:false,cloudRequests:0,deployed:false};
 for(const [name,obj]of [['private',plan],['proof',proof]]){const p='artifacts/playtt-core-integrated-build-'+name+'.json';try{assert.deepEqual(await load(p),obj);}catch(e){if(e.code!=='ENOENT')throw e;await writeFile(p,JSON.stringify(obj,null,2)+'\n',{flag:'wx'});}}
 console.log(JSON.stringify(proof));
}
