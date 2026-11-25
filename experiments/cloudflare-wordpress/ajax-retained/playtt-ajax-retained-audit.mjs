import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { openSnapshotBundle } from './playtt-snapshot-bundle.mjs';
assert.ok(process.argv.includes('--local')&&!process.argv.includes('--remote'));
const load=async p=>JSON.parse(await readFile(p,'utf8')),sha=b=>createHash('sha256').update(b).digest('hex');
const cloud=await load('artifacts/playtt-old-provider-owned-private.json'),baseline=(await openSnapshotBundle(cloud.directory+'/independent',cloud.anchor)).graph;
const plan=await load('artifacts/playtt-boot-cleanup-build-private.json');
for(const m of plan.productionModules)assert.equal(sha(await readFile(m.path)),m.sha256);
const table=(g,p)=>JSON.parse(Buffer.from(g.contents.markdown.find(x=>x.path===p).bytes));
const runs=[];
for(const prefix of ['playtt-ajax-retained','playtt-ajax-retained-v2','playtt-ajax-boundary']){
 const owner=await load('artifacts/'+prefix+'-owned-private.json'),run=await load('artifacts/'+prefix+'-summary.json'),obs=await load(owner.directory+'/retained-observation.json');
 assert.equal(owner.phase,'verified');assert.ok(owner.sealed&&owner.localProcessesDisposed&&run.localProcessesDisposed);assert.equal(run.result,'pass');assert.equal(run.bundleSha256,plan.productionBundleSha256);
 const graph=(await openSnapshotBundle(owner.directory+'/independent',owner.finalAnchor)).graph;
 assert.deepEqual(graph.contents.wpContentDeleted,baseline.contents.wpContentDeleted);
 const original=new Map(baseline.contents.markdown.map(e=>[e.path,Buffer.from(e.bytes)]));assert.deepEqual(graph.contents.markdown.map(e=>e.path).sort(),[...original.keys()].sort());
 const changed=graph.contents.markdown.filter(e=>!Buffer.from(e.bytes).equals(original.get(e.path))).map(e=>e.path).sort();assert.deepEqual(changed,run.changedFiles);
 assert.ok(changed.every(p=>['_tables/postmeta.json','_runtime/playtt-auto-increment.json'].includes(p)));
 for(const group of ['uploads','wpContent'])assert.deepEqual(graph.contents[group],baseline.contents[group]);
 assert.deepEqual(table(graph,'_tables/posts.json'),table(baseline,'_tables/posts.json'));assert.deepEqual(table(graph,'_tables/usermeta.json'),table(baseline,'_tables/usermeta.json'));
 const oldMeta=table(baseline,'_tables/postmeta.json'),meta=table(graph,'_tables/postmeta.json');assert.equal(meta.length,oldMeta.length);
 for(const row of oldMeta){const now=meta.find(e=>e.meta_id===row.meta_id);if(row.meta_id==='72'){assert.equal(row.post_id,'193');assert.equal(row.meta_key,'_edit_lock');assert.deepEqual({...now,meta_value:row.meta_value},row);}else assert.deepEqual(now,row);}
 const oldSeq=table(baseline,'_runtime/playtt-auto-increment.json'),seq=table(graph,'_runtime/playtt-auto-increment.json');assert.ok(Number(seq.sequences.wp_options)>=Number(oldSeq.sequences.wp_options));assert.deepEqual({...seq,sequences:{...seq.sequences,wp_options:oldSeq.sequences.wp_options}},oldSeq);
 const b=run.finalBudget;assert.ok(b.writeTracking.sealed&&b.writeTracking.window.closed);assert.equal(b.writeTracking.pending,0);assert.ok(b.chargedBytes<=run.limits.maxBytes&&b.chargedPuts<=run.limits.maxOperations);assert.equal(run.outboundAttempts,0);assert.deepEqual(obs.errors,[]);assert.equal(obs.events.filter(e=>e.kind==='exception').length,0);
 const ajax=obs.events.filter(e=>e.kind==='ajax');const requests=obs.events.filter(e=>e.kind==='request');
 if(prefix==='playtt-ajax-retained'){
  assert.equal(obs.snapshots.length,2);assert.ok(obs.snapshots.every(s=>s.eventsDuring.length===0));
  const fail=ajax.filter(e=>e.stage==='end'&&e.status===400);assert.equal(fail.length,1);assert.equal(fail[0].action,'unsupported-content-type');assert.equal(fail[0].result,'0');
 }else if(prefix==='playtt-ajax-retained-v2'){
  assert.equal(obs.snapshots.length,0);const begin=ajax.filter(e=>e.stage==='begin'&&e.action==='wp-remove-post-lock');assert.equal(begin.length,1);assert.equal(begin[0].encoding,'multipart');assert.ok(begin[0].hasPostId&&begin[0].hasActiveLock);assert.ok(begin[0].formBytes<=8192);
  const end=ajax.find(e=>e.id===begin[0].id&&e.stage==='end');assert.equal(end.status,200);assert.equal(end.result,'1');
  const logout=requests.find(e=>e.loginAction==='logout');assert.ok(logout&&logout.status===302&&logout.version>end.version&&logout.at>=end.at);assert.equal(requests.filter(e=>e.status>=400).length,0);
 }else{
  assert.deepEqual(run.boundaryCases,[{action:'wp-remove-post-lock',authenticated:false,cookieSent:false,authorizationSent:false,status:400,result:'0'},{action:'heartbeat',authenticated:false,cookieSent:false,authorizationSent:false,status:200,result:'wp-auth-check-false'}]);
  assert.equal(obs.snapshots.length,0);
 }
 if(prefix!=='playtt-ajax-boundary'){const ui=await load('artifacts/'+prefix+'-ui-private.json');assert.ok(ui.editor.saved&&ui.editor.revisions10&&ui.logout.nativeLoggedOutMessage);assert.equal(ui.editor.paragraphs,10);assert.equal(ui.edited,false);}
 runs.push({run:prefix,finalLocalVersion:run.finalVersion,chargedBytes:b.chargedBytes,chargedPuts:b.chargedPuts,changedFiles:changed,allContentAndOriginalSessionsExact:true,onlyOwnedLockAndOptionSequenceMayChange:true,independentObjects:graph.objects.length,closed:true,sealed:true,pending:0,disposed:true,exceptions:0,ajax:ajax.map(({at,id,version,...e})=>e),httpErrorCount:requests.filter(e=>e.status>=400).length,heapSnapshots:obs.snapshots.length});
}
const snapshots=await load('artifacts/playtt-ajax-snapshot-audit.json'),classifier=await load('artifacts/playtt-ajax-classifier-check.json'),source=await load('artifacts/playtt-ajax-source-audit.json');
assert.equal(classifier.cases,11);assert.equal(classifier.sourceSha256,sha((await readFile('scripts/playtt-ajax-classifier.mjs','utf8')).replaceAll('\r\n','\n')));assert.equal(source.result,'pass');
assert.equal(snapshots.snapshots.length,2);for(const s of snapshots.snapshots){assert.equal(s.bootArraysRetainedBytes,0);assert.equal(s.loaderWasmMemoryInstances,1);assert.equal(s.filesystemBackings.wasmAliasedBytes,0);assert.ok(s.filesystemBackings.bytes>0);}
const report={schema:'playtt/ajax-retained-audit/v1',at:snapshots.at,result:'local request-boundary and heap-ownership evidence; provider-memory-open',bundleSha256:plan.productionBundleSha256,runs,classifierCases:11,requestBodyBound:8192,sensitiveRequestValuesRecorded:false,actualMultipartUnlockBeforeLogout:{status:200,result:'1',loggedOutAfter:true},anonymousControls:{unlockStatus:400,unlockResult:'0',heartbeatStatus:200,heartbeatAuthenticationFalse:true},oldAjax400ActionKnown:false,oldAjax400CauseProven:false,permissionRelaxed:false,heapSnapshots:snapshots.snapshots.map(s=>({label:s.label,selfBytes:s.snapshotSelfBytes,wasmBytes:s.loaderWasmBackingBytes,filesystem:s.filesystemBackings,bootArraysRetainedBytes:s.bootArraysRetainedBytes,before:s.cdpBefore,after:s.cdpAfter,mayCollect:true})),cloudRequests:0,deployed:false,centralRuntimeChanged:false,productionChanged:false,providerMemoryAccepted:false,limitations:['Old failed native request still lacks action/auth evidence; these controls establish behavior, not retrospective attribution.','Snapshot capture may collect and changed GC timing; totals are not provider peaks or normal full-edit acceptance.','No edits or revision creation in these focused runs; prior combined-candidate native save/restart proof remains separate.','Next investigate transient editor allocations; retained boot arrays are zero in these two samples, not a universal absence-of-leaks claim.']};
const output='artifacts/playtt-ajax-retained-audit.json',text=JSON.stringify(report,null,2)+'\n';
if(process.argv.includes('--check'))assert.equal(await readFile(output,'utf8'),text);else await writeFile(output,text,{flag:'wx'});
console.log(JSON.stringify({result:report.result,runs:runs.map(r=>({version:r.finalLocalVersion,bytes:r.chargedBytes,puts:r.chargedPuts})),old400StillUnattributed:true,heapFiles:2,cloudRequests:0,readOnlyCheck:process.argv.includes('--check')}));
