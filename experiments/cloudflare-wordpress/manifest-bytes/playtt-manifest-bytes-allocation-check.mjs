import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {sourceHashes,sources,sha,api} from './playtt-manifest-bytes-common.mjs';
import {openSnapshotBundle} from './playtt-snapshot-bundle.mjs';
assert.ok(process.argv.includes('--local')&&!process.argv.includes('--remote'));
const load=async p=>JSON.parse(await readFile(p,'utf8')),prefix='artifacts/playtt-manifest-bytes-allocation-2-';
const owner=await load(prefix+'owned-private.json'),summary=await load(prefix+'summary.json');assert.equal(owner.phase,'verified');assert.equal(owner.disposed,true);
await sources();assert.deepEqual(summary.sourceHashes,sourceHashes);assert.equal(summary.outboundAttempts,0);assert.equal(summary.runs.length,6);
const prior=await load('artifacts/playtt-owned-paths-native-v2-owned-private.json');assert.equal(prior.phase,'verified');assert.equal(prior.localProcessesDisposed,true);
const bundle=await openSnapshotBundle(join(prior.directory,'independent'),prior.finalAnchor),wire=bundle.graph.objects.find(o=>o.key===prior.finalAnchor.manifestKey).bytes;
assert.equal(sha(wire),summary.wireSha256);assert.equal(wire.length,summary.wireBytes);assert.equal(summary.iterations,20);
assert.equal(sha(JSON.stringify({wire:new TextDecoder().decode(wire),iterations:20})),summary.payloadSha256);
const codec=await api('baseline'),expected=await codec.decodeCanonicalManifestBytes(wire,'sites/default'),logical=JSON.stringify(expected);
for(const [i,variant]of ['baseline','candidate','candidate','baseline','baseline','candidate'].entries()){
 const r=summary.runs[i];assert.equal(r.index,i);assert.equal(r.variant,variant);
 const raw=await readFile(join(owner.directory,`${i}-${variant}-profile-private.json`));assert.equal(sha(raw),r.profileSha256);assert.equal(raw.length,r.profileBytes);
 const profile=JSON.parse(raw),nodes=[profile.head],functions={};let count=0,self=0;
 while(nodes.length){const n=nodes.pop();count++;self+=n.selfSize;const name=n.callFrame.functionName||'(anonymous)';functions[name]=(functions[name]||0)+n.selfSize;nodes.push(...n.children);}
 assert.equal(count,r.nodes);assert.equal(self,r.selfBytes);assert.equal(functions.next||0,r.stringIteratorSelfBytes);assert.equal(profile.samples.length,r.samples);assert.equal(profile.samples.reduce((s,x)=>s+x.size,0),r.sampleSizeSum);
 assert.deepEqual(r.options,{samplingInterval:32768,includeObjectsCollectedByMajorGC:true,includeObjectsCollectedByMinorGC:true});
 assert.deepEqual(r.result,{iterations:20,logicalBytes:Buffer.byteLength(logical),logicalSha256:sha(logical)});
}
const failed=await load('artifacts/playtt-manifest-bytes-allocation-owned-private.json');assert.equal(failed.phase,'failed');assert.equal(failed.disposed,true);const failure=await load(join(failed.directory,'failure-private.json'));assert.equal(failure.message,'fetch failed');
const report={schema:'playtt/manifest-bytes-allocation-check/v1',result:'pass',sourceHashes,profilesChecked:6,wireBytes:wire.length,wireSha256:sha(wire),independentBundleObjects:bundle.graph.objects.length,logicalBytes:Buffer.byteLength(logical),iterations:20,baselineSelf:summary.runs.filter(r=>r.variant==='baseline').map(r=>r.selfBytes),candidateSelf:summary.runs.filter(r=>r.variant==='candidate').map(r=>r.selfBytes),initialSandboxFailurePreserved:true,completedDisposed:true,cloudRequests:0,providerMemoryAcceptance:false};
const path='artifacts/playtt-manifest-bytes-allocation-check.json';if(process.argv.includes('--check'))assert.deepEqual(await load(path),report);else await writeFile(path,JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(report));
