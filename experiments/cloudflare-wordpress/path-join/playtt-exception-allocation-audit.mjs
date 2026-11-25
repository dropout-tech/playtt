// Offline exact data audit; no network, WordPress requests, or raw heap output.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {openSnapshotBundle} from './playtt-snapshot-bundle.mjs';
const load=async p=>JSON.parse(await readFile(p,'utf8'));
const cloud=await load('artifacts/playtt-old-provider-owned-private.json');
const owner=await load('artifacts/playtt-exception-allocation-owned-private.json');
const summary=await load('artifacts/playtt-exception-allocation-summary.json');
assert.equal(owner.phase,'verified');assert.equal(owner.sealed,true);
assert.equal(owner.localProcessesDisposed,true);assert.equal(summary.finalVersion,190);
const a=(await openSnapshotBundle(cloud.directory+'/independent',cloud.anchor)).graph;
const b=(await openSnapshotBundle(owner.directory+'/independent',owner.finalAnchor)).graph;
const observation=await load(join(owner.directory,'exception-allocation-observation.json'));
const browser=await load(join(owner.directory,'browser-observations.json'));
const bytes=(g,p)=>Buffer.from(g.contents.markdown.find(x=>x.path===p).bytes);
const json=(g,p)=>JSON.parse(bytes(g,p));
const before=json(a,'_tables/postmeta.json'),after=json(b,'_tables/postmeta.json');
assert.deepEqual(before.map(x=>x.meta_id),after.map(x=>x.meta_id));
let locks=0;
for(const row of before){
 const now=after.find(x=>x.meta_id===row.meta_id);
 if(row.meta_id==='72'){
  assert.equal(row.post_id,'193');assert.equal(row.meta_key,'_edit_lock');
  assert.deepEqual({...now,meta_value:row.meta_value},row);
  assert.match(now.meta_value,/^\d+:2$/);
  const time=Number(now.meta_value.split(':')[0])*1000;
  // Core can backdate a released lock by 150 - 5 seconds. This is not a
  // creation timestamp; do not reject a valid release as a foreign write.
  assert.ok(time>=observation.events[0].at-150000&&time<=observation.events.at(-1).at);
  locks++;
 }else assert.deepEqual(now,row);
}
assert.equal(locks,1);
const seqBefore=json(a,'_runtime/playtt-auto-increment.json');
const seqAfter=json(b,'_runtime/playtt-auto-increment.json');
assert.equal(seqBefore.sequences.wp_options,'784');
assert.ok(Number(seqAfter.sequences.wp_options)>Number(seqBefore.sequences.wp_options));
assert.deepEqual({...seqAfter,sequences:{...seqAfter.sequences,wp_options:'784'}},seqBefore);
assert.deepEqual(a.contents.markdown.map(x=>x.path).sort(),b.contents.markdown.map(x=>x.path).sort());
const changed=a.contents.markdown.filter(x=>!bytes(a,x.path).equals(bytes(b,x.path))).map(x=>x.path).sort();
assert.deepEqual(changed,['_runtime/playtt-auto-increment.json','_tables/postmeta.json']);
for(const group of ['uploads','wpContent','wpContentDeleted'])assert.deepEqual(a.contents[group],b.contents[group]);
const budget=summary.finalBudget,tracking=budget.writeTracking;
assert.equal(tracking.pending,0);assert.equal(tracking.sealed,true);assert.equal(tracking.window.closed,true);
assert.equal(budget.chargedBytes,449660);assert.equal(budget.chargedPuts,27);
assert.equal(summary.outboundAttempts,0);
assert.equal(observation.stopped,true);assert.equal(observation.errors.length,0);
const requests=observation.events.filter(e=>e.kind==='request');
const exceptions=observation.events.filter(e=>e.kind==='exception');
assert.equal(exceptions.length,0);
assert.equal(browser.loggedOut,true);assert.equal(browser.contentEdited,false);assert.equal(browser.visits.length,3);assert.ok(browser.visits.every(x=>x.canvas&&x.paragraphs===10&&x.saved));
const httpErrors=requests.filter(e=>e.status>=400);assert.equal(httpErrors.length,1);assert.equal(httpErrors[0].status,404);assert.equal(httpErrors[0].label,'bootstrap');assert.equal(httpErrors[0].method,'GET');
const report={
 schema:'playtt/exception-allocation-data-audit/v1',at:new Date().toISOString(),
 result:'data-integrity-pass; earlier exception not reproduced or resolved',localOnly:true,
 baselineLocalCopyOfCloudVersion:181,finalLocalVersion:190,cloudRequests:0,
 changedFiles:changed,editLock:{postId:193,metaId:72,userId:2},
 optionSequence:{before:seqBefore.sequences.wp_options,after:seqAfter.sequences.wp_options},
 allOtherFilesExact:true,allOriginalSessionsExactNewSessionRemoved:true,
 independentObjects:b.objects.length,
 independentFiles:['markdown','uploads','wpContent'].reduce((n,g)=>n+b.contents[g].length,0),
 chargedBytes:budget.chargedBytes,chargedPuts:budget.chargedPuts,closed:true,sealed:true,pending:0,
 localProcessesDisposed:owner.localProcessesDisposed,samples:observation.samples.length,
 events:observation.events.length,requests:requests.length,
 statusCounts:requests.reduce((o,e)=>(o[e.status]=(o[e.status]||0)+1,o),{}),
 capturedExceptions:exceptions,httpErrors,
 exceptionLimitation:'No exception captured in this run. Prior retained-native exception lacked details and remains unclassified; non-reproduction is not a fix. New bounded detail capture was not exercised by a real exception this run.',
 browser,contentSaveOrImeTested:false,productionChanged:false,
};
await writeFile('artifacts/playtt-exception-allocation-audit.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report));
