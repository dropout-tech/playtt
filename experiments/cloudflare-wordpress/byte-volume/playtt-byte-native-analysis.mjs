// Offline measurement-scope analysis. Does not run the Worker or replay a browser.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
assert.ok(process.argv.includes('--local')&&!process.argv.includes('--remote'));
const check=process.argv.includes('--check'),sha=b=>createHash('sha256').update(b).digest('hex'),load=async p=>JSON.parse(await readFile(p,'utf8'));
const owner=await load('artifacts/playtt-byte-native-editor-owned-private.json'),audit=await load('artifacts/playtt-byte-native-editor-audit.json');
assert.equal(owner.phase,'verified');assert.ok(owner.sealed&&owner.localProcessesDisposed&&audit.controlAttribution.isolatedMeasurement);
const raw=await readFile(join(owner.directory,'before-restart/exception-allocation-observation.json')),o=JSON.parse(raw);
const controls=o.events.filter(e=>e.kind==='request'&&e.category==='operator-status');assert.ok(controls.length>=2);
const firstControlStartApprox=Math.min(...controls.map(e=>e.at-e.wallMs)),boundaryMarginMs=10;
const transitions=o.events.filter(e=>['generation','php','retirement'].includes(e.kind)).sort((a,b)=>a.at-b.at);
let i=0,heap=null,heapAt=null,generation=null;const samples=[];
for(const s of o.samples){
 while(i<transitions.length&&transitions[i].at<=s.at){const e=transitions[i++];if(e.kind==='generation'){generation=e.generation;heap=null;}else if(e.kind==='retirement'){generation=null;heap=null;}else if(generation!==null){heap=e.heapBytes;heapAt=e.at;}}
 if(heap!==null&&Number.isFinite(s.backingStorageSize)&&s.at<firstControlStartApprox-boundaryMarginMs)samples.push({at:s.at,label:s.label,generation,jsBytes:s.usedSize,backingBytes:s.backingStorageSize,phpBytes:heap,phpObservationAgeMs:s.at-heapAt,total:s.usedSize+s.backingStorageSize+heap});
}
assert.ok(samples.length>20);
const summarize=ss=>({samples:ss.length,maximumObserved:ss.reduce((a,b)=>b.total>a.total?b:a)});
const windows=o.allocations.map(a=>{assert.ok(a.finishedAt<firstControlStartApprox-boundaryMarginMs);const ss=samples.filter(s=>s.at>=a.startedAt&&s.at<=a.finishedAt);assert.ok(ss.length>=2);return{name:a.name,...summarize(ss)};});
assert.deepEqual(windows.map(x=>x.name),['render','save']);
const volumes=audit.volumes.find(v=>v.phase==='before-restart').windows;
for(const w of volumes){assert.equal(w.operatorStatusRequests,0);assert.equal(w.rows.find(r=>r.label==='zip-input:canonical-restore-pack/decodeCanonicalRestorePack').calls,0);assert.equal(w.rows.find(r=>r.label==='php-read:worker/persistRuntimeObjects').calls,0);}
const report={schema:'playtt/byte-native-measurement-scope/v1',result:'operator-integrity-allocation-separated; native-data-pass; provider-acceptance-open',observationSha256:sha(raw),bundleSha256:audit.bundleSha256,firstControlStartApprox,boundaryMarginMs,prefix:summarize(samples),windows,byteVolumes:volumes,wholeRunComponentSums:audit.memory.phases.map(p=>({phase:p.phase,maximumObserved:p.maxObservedComponentSum})),native:audit.native,cloudRequests:0,productionChanged:false,providerMemoryAccepted:false,limitations:[
 'The prefix ends before the first explicitly classified full-integrity request. The ten-millisecond margin avoids assigning boundary samples using asynchronous event-receipt time.',
 'Counters track byte volume, not allocation or retention. Read/digest/codec outputs can refer to the same payload and must not be added together.',
 'Maxima combine asynchronous Inspector JS/backing observations with the latest PHP heap in the same generation. These are observed component sums, not provider memory peaks, RSS, limit enforcement or billed CPU.',
 'Sampling can miss cold-boot/transient peaks. A local sum below 128 MiB is not evidence that Cloudflare Free accepts the runtime, and observed margin is small.',
 'The after-restart phase was preceded by full-integrity validation and is deliberately excluded from the native-only prefix. Full-run maxima still include validation allocations.',
 'No controlled performance comparison or runtime optimization is claimed. The isolated run uses the same compiled runtime as the diagnostic run.',
 'Full backup, restart, original rows, sessions, media and theme checks remain mandatory and passed separately. No integrity check was weakened.',
 'Physical IME/mobile, first Chinese initialization, sustained usage and full A01-A20 acceptance remain open.'
]};
const output='artifacts/playtt-byte-native-analysis.json',serialized=JSON.stringify(report,null,2)+'\n';if(check)assert.equal(await readFile(output,'utf8'),serialized);else await writeFile(output,serialized,{flag:'wx'});
console.log(JSON.stringify({result:report.result,prefix:report.prefix,windows:report.windows,check}));
