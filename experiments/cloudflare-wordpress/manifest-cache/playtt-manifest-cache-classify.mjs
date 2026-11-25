import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
const mode=process.argv.find(v=>['--baseline','--candidate'].includes(v))?.slice(2);assert.ok(mode);
const prefix='artifacts/playtt-manifest-cache-';
const report=JSON.parse(await readFile(prefix+mode+'.json','utf8'));assert.equal(report.result,'pass');
const events=(await readFile('artifacts/playtt-rebuild-manifest-cache-observation.jsonl','utf8')).trim().split('\n').map(line=>JSON.parse(line));
const samples=report.samples.map(sample=>{
 const start=Date.parse(sample.at),end=start+sample.wallMs+1000,category=sample.kind==='content'?'rest-pages':'admin-ajax';
 // Platform and local clocks differ by roughly one second in the baseline.
 // Allow a bounded skew, but reject rather than choose among multiple matches.
 const matches=events.filter(e=>Date.parse(e.at)>=start-2000&&Date.parse(e.at)<=end&&e.request?.category===category&&e.traces.some(t=>t.operation==='mutation'));
 assert.equal(matches.length,1,'Exactly one traced native request must match a sequential sample');
 const event=matches[0],traces=event.traces.filter(t=>t.operation==='mutation');assert.equal(traces.length,1);assert.equal(event.outcome,'ok');assert.equal(traces[0].completed,true);
 const trace=traces[0],read=trace.phases.find(p=>p.name==='canonical.manifest.current.read'),reuse=trace.phases.find(p=>p.name==='canonical.manifest.current.reuse');
 assert.equal(Boolean(read),mode==='baseline');assert.equal(Boolean(reuse),mode==='candidate');
 return {...sample,eventAt:event.at,eventOffsetMs:Date.parse(event.at)-start,runtime:trace.runtime,workerVersion:event.version,traceMs:trace.totalMs,manifestReadMs:read?.durationMs,manifestReused:!!reuse,phases:trace.phases};
});
const median=values=>{const sorted=[...values].sort((a,b)=>a-b),mid=Math.floor(sorted.length/2);return sorted.length%2?sorted[mid]:(sorted[mid-1]+sorted[mid])/2;};
const grouped=[];
for(const kind of ['empty','post-lock','content'])for(const runtime of ['warm','cold','invalidated']){
 const subset=samples.filter(s=>s.kind===kind&&s.runtime===runtime);if(subset.length)grouped.push({kind,runtime,count:subset.length,medianWallMs:median(subset.map(s=>s.wallMs)),wallMs:subset.map(s=>s.wallMs)});
}
const result={at:new Date().toISOString(),result:'pass',mode,samples,grouped,limits:['Small sequential samples; no randomized order or statistical speedup claim.','Remote phase clocks advance on I/O; phase durations are not isolated CPU/operation cost.','Timing includes complete native response and, for content mutations, a small local ownership-guard file write.']};
await writeFile(prefix+mode+'-classified.json',JSON.stringify(result,null,2));console.log(JSON.stringify({result:'pass',mode,grouped,samples:samples.map(({kind,runtime,manifestReused,manifestReadMs,workerVersion})=>({kind,runtime,manifestReused,manifestReadMs,workerVersion}))}));
