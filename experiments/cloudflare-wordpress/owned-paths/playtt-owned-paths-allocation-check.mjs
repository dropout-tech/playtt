// Rebuild the measured fixture identity and recompute private profiles without workerd.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {createHash} from 'node:crypto';
import {build} from 'esbuild';
import {runtimeArchiveComponentOwnedWpContentPaths} from '@automattic/wp-codebox-core/runtime-archive-component';
assert.ok(process.argv.includes('--local')&&!process.argv.includes('--remote'));
const check=process.argv.includes('--check'),sha=b=>createHash('sha256').update(b).digest('hex'),load=async p=>JSON.parse(await readFile(p,'utf8'));
const owner=await load('artifacts/playtt-owned-paths-allocation-v2-owned-private.json'),result=await load('artifacts/playtt-owned-paths-allocation-v2-summary.json');
assert.equal(owner.phase,'verified');assert.equal(owner.disposed,true);assert.equal(result.result,'pass');assert.equal(result.cloudRequests,0);assert.equal(result.outboundAttempts,0);
const inputs=await load('../../../playtt-owned-paths-build-v2/build-inputs.json');
const pinned=async path=>{const bytes=(await readFile(path,'utf8')).replaceAll('\r\n','\n');const entry=inputs.files.find(e=>e.path===path);assert.ok(entry,path);assert.equal(sha(bytes),entry.sha256,path);return JSON.parse(bytes);};
const runtime=await pinned('assets/wordpress-runtime-artifact.json'),statics=await pinned('assets/wordpress-static-artifact.json'),importer=await pinned('assets/website-importer-artifact.json');
for(const e of inputs.files.filter(e=>e.path.startsWith('vendor/'))){assert.equal(sha(await readFile(e.path)),e.sha256,e.path);}
const source=(await readFile('src/wp-content-persistence.ts','utf8')).replaceAll('\r\n','\n');assert.equal(sha(source),result.sourceHashes.baseline);
assert.equal(sha((await readFile('scripts/playtt-owned-paths-candidate.ts','utf8')).replaceAll('\r\n','\n')),result.sourceHashes.candidate);
const compiled=await build({stdin:{contents:source,loader:'ts',sourcefile:'wp-content-persistence.ts',resolveDir:resolve('src')},bundle:true,write:false,format:'esm',target:'es2022'});
const baseline=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const owned=runtimeArchiveComponentOwnedWpContentPaths(importer.component);
const rawPaths=[...new Set([...runtime.files,...statics.files].filter(f=>f.path.startsWith('wordpress/wp-content/')).map(f=>f.path.slice('wordpress/wp-content/'.length)))];
const files=[...new Map([...runtime.files,...statics.files].filter(f=>f.path.startsWith('wordpress/wp-content/')).map(f=>[f.path,f])).values()];
const inventory=files.map(f=>({path:f.path.slice('wordpress/wp-content/'.length),size:f.size,sha256:f.sha256,objectKey:`sites/default/wp-content/objects/${f.sha256}`})).filter(f=>baseline.isCanonicalWpContentPath(f.path,owned));
const deleted=inventory.slice(0,5).map(f=>f.path).sort(),iterations=20;
assert.equal(sha(JSON.stringify({owned,inventory,rawPaths,deleted,iterations})),result.payloadSha256);
assert.equal(inventory.length,result.inventoryFiles);assert.equal(rawPaths.length,result.pathsChecked);
assert.deepEqual(result.runs.map(r=>r.variant),['baseline','candidate','candidate','baseline','baseline','candidate']);
for(const run of result.runs){
 const raw=await readFile(join(owner.directory,`${run.index}-${run.variant}-profile-private.json`));assert.equal(raw.length,run.profileBytes);assert.equal(sha(raw),run.profileSha256);
 const profile=JSON.parse(raw),stack=[profile.head];let nodes=0,total=0,ownership=0;
 while(stack.length){const n=stack.pop();nodes++;total+=n.selfSize;if(n.callFrame.functionName==='runtimeOwnedWpContentPaths')ownership+=n.selfSize;stack.push(...n.children);}
 assert.equal(nodes,run.nodes);assert.equal(total,run.selfBytes);assert.equal(ownership,run.ownershipSelfBytes);assert.equal(profile.samples.length,run.samples);assert.equal(profile.samples.reduce((s,x)=>s+x.size,0),run.sampleSizeSum);
 assert.deepEqual(run.result,{included:rawPaths.filter(p=>baseline.isCanonicalWpContentPath(p,owned)).length*iterations,iterations,files:inventory.length});
 assert.deepEqual(run.options,{samplingInterval:32768,includeObjectsCollectedByMajorGC:true,includeObjectsCollectedByMinorGC:true});
}
const report={schema:'playtt/owned-paths-allocation-check/v1',at:result.at,result:'pass',fixtureReconstructedExact:true,pinnedAssets:3,pinnedVendorFiles:inputs.files.filter(e=>e.path.startsWith('vendor/')).length,profileHashesRecomputed:6,inventoryFiles:inventory.length,pathsChecked:rawPaths.length,iterations,baselineSelfBytes:result.runs.filter(r=>r.variant==='baseline').map(r=>r.selfBytes),candidateSelfBytes:result.runs.filter(r=>r.variant==='candidate').map(r=>r.selfBytes),readOnlyInputs:true,cloudRequests:0};
const output='artifacts/playtt-owned-paths-allocation-v2-check.json',serialized=JSON.stringify(report,null,2)+'\n';
if(check)assert.equal(await readFile(output,'utf8'),serialized);else await writeFile(output,serialized,{flag:'wx'});
console.log(JSON.stringify(report));
