// Read-only inputs; no network or fixture replay. --check never writes the report.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {openSnapshotBundle} from './playtt-snapshot-bundle.mjs';
assert.ok(process.argv.includes('--local')&&!process.argv.includes('--remote'));
const check=process.argv.includes('--check'),load=async p=>JSON.parse(await readFile(p,'utf8')),sha=b=>createHash('sha256').update(b).digest('hex');
const prefix='artifacts/playtt-manifest-bytes-native-',owner=await load(prefix+'owned-private.json'),run=await load(prefix+'summary.json'),ui=await load(prefix+'ui-private.json');
const buildPrefix='artifacts/playtt-manifest-bytes-build-';
const build=await load(buildPrefix+'proof.json'),plan=await load(buildPrefix+'private.json');
assert.equal(owner.phase,'verified');assert.equal(owner.localProcessesDisposed,true);assert.equal(owner.sealed,true);
assert.equal(run.result,'pass');assert.ok(run.finalVersion>=181);assert.equal(owner.finalVersion,run.finalVersion);assert.equal(run.cloudRequests,0);assert.equal(run.outboundAttempts,0);
assert.equal(build.result,'pass');assert.equal(build.typecheck,'pass');assert.equal(build.exactScopedCompiledChanges,true);assert.equal(build.sourceCount,83);assert.equal(build.sourceInputs,206);assert.equal(run.bundleSha256,plan.productionBundleSha256);assert.notEqual(run.bundleSha256,plan.diagnosticBundleSha256);
assert.equal(build.bundleSha256,run.bundleSha256);assert.equal(build.centralRuntimeChanged,false);assert.equal(build.deployed,false);
for(const m of plan.productionModules){const b=await readFile(m.path);assert.equal(b.length,m.bytes);assert.equal(sha(b),m.sha256);}
const source=await load('artifacts/playtt-recovery-provider-source-plan.json');assert.equal(source.sources.length,82);
for(const e of source.sources)assert.equal(sha((await readFile(e.path,'utf8')).replaceAll('\r\n','\n')),e.sha256,e.path);
for(const item of [ui.saved,ui.cold]){assert.equal(item.nativeSavedButton,true);assert.equal(item.editedParagraphPresent,true);assert.equal(item.paragraphs,10);}
assert.equal(ui.saved.nativeSavedNotice,true);assert.equal(ui.cold.newBrowserTab,true);assert.equal(ui.cold.draft,true);assert.equal(ui.cold.revisions11,true);assert.equal(ui.logout.nativeLoggedOutMessage,true);
assert.equal(owner.restartProofs.length,1);assert.deepEqual(owner.restartProofs,run.fullWorkerdRestart);
for(const [key,value]of Object.entries(owner.restartProofs[0]))if(!['version','chargedBytes'].includes(key))assert.equal(value,true,key);
const cloud=await load('artifacts/playtt-old-provider-owned-private.json');
const baseline=(await openSnapshotBundle(cloud.directory+'/independent',cloud.anchor)).graph;
const independent=(await openSnapshotBundle(owner.directory+'/independent',owner.finalAnchor)).graph;
const bytes=(g,p)=>Buffer.from(g.contents.markdown.find(x=>x.path===p).bytes),table=(g,p)=>JSON.parse(bytes(g,p));
const materialized=await load(owner.directory+'/materialized/bundle.json'),provenance=await load(owner.directory+'/materialized/materialization-provenance.json');
assert.deepEqual(provenance.source,owner.finalAnchor);assert.deepEqual(provenance.materialized,materialized.anchor);
const full=(await openSnapshotBundle(owner.directory+'/materialized',materialized.anchor)).graph;
assert.equal(full.format,'full-pack');
const ordered=c=>Object.fromEntries(['markdown','uploads','wpContent'].map(g=>[g,[...c[g]].sort((a,b)=>a.path.localeCompare(b.path))]));
assert.deepEqual(ordered(full.contents),ordered(independent.contents));assert.deepEqual(full.contents.wpContentDeleted,independent.contents.wpContentDeleted);
assert.equal(run.fullMaterializedExact,true);assert.equal(run.independentBackupExact,true);
const originalPaths=baseline.contents.markdown.map(x=>x.path).sort();assert.deepEqual(independent.contents.markdown.map(x=>x.path).sort(),originalPaths);
const changed=originalPaths.filter(p=>!bytes(baseline,p).equals(bytes(independent,p)));
assert.deepEqual(changed,['_runtime/playtt-auto-increment.json','_tables/postmeta.json','_tables/posts.json',owner.draftPath].sort());assert.deepEqual(changed,run.changedFiles);
const raw=bytes(independent,owner.draftPath).toString(),m=raw.match(/^---\n(.+?)\n---\n\n?(.*)$/s);assert.ok(m);assert.ok(m[2].endsWith('\n'));const content=m[2].slice(0,-1);
assert.equal(content,owner.expectedContent);assert.equal(sha(content),owner.expectedSha);assert.equal(run.expectedContentSha256,owner.expectedSha);
const marker=m[1].match(/^__playtt_content: "v1:(\d+):([a-f0-9]{64})"$/m);assert.ok(marker);assert.equal(Number(marker[1]),Buffer.byteLength(content));assert.equal(marker[2],owner.expectedSha);
const oldPosts=table(baseline,'_tables/posts.json'),newPosts=table(independent,'_tables/posts.json');
for(const row of oldPosts)assert.deepEqual(newPosts.find(x=>x.ID===row.ID),row);
const added=newPosts.filter(x=>!oldPosts.some(y=>y.ID===x.ID));assert.equal(added.length,1);
assert.equal(added[0].ID,'209');assert.equal(added[0].post_parent,'193');assert.equal(added[0].post_author,'2');assert.equal(added[0].post_type,'revision');assert.equal(added[0].post_status,'inherit');assert.equal(added[0].post_content,content);
assert.deepEqual(table(independent,'_tables/usermeta.json'),table(baseline,'_tables/usermeta.json'));
for(const g of ['uploads','wpContent','wpContentDeleted'])assert.deepEqual(independent.contents[g],baseline.contents[g]);
const budget=run.finalBudget;assert.equal(budget.chargedBytes,run.chargedBytes);assert.ok(budget.chargedBytes>0&&budget.chargedBytes<=run.limits.maxBytes);assert.ok(budget.chargedPuts>0&&budget.chargedPuts<=run.limits.maxOperations);assert.equal(budget.writeTracking.pending,0);assert.equal(budget.writeTracking.sealed,true);assert.equal(budget.writeTracking.window.closed,true);
const phases=[];let events=[];
for(const name of ['before-restart','after-restart']){
 const o=await load(owner.directory+'/'+name+'/exception-allocation-observation.json');assert.equal(o.stopped,true);assert.deepEqual(o.errors,[]);assert.ok(Array.isArray(o.allocations));assert.equal(o.allocations.length,name==='before-restart'?2:0);const observedExceptions=o.events.filter(e=>e.kind==='exception');assert.equal(observedExceptions.length,name==='after-restart'?1:0);
 if(observedExceptions.length){const details=await load(owner.directory+'/'+name+'/exceptions-private.json');assert.equal(details.length,1);assert.equal(details[0].text,'Uncaught Error: Network connection lost.');assert.deepEqual(details[0].frames,[]);assert.equal(details[0].at,observedExceptions[0].at);}

 events.push(...o.events);
 const transitions=o.events.filter(e=>['generation','php','retirement'].includes(e.kind)).sort((a,b)=>a.at-b.at);let index=0,heap=null,generation=null;
 const sums=[];let skipped=0;
 for(const s of o.samples){
  while(index<transitions.length&&transitions[index].at<=s.at){const e=transitions[index++];if(e.kind==='generation'){generation=e.generation;heap=null;}else if(e.kind==='retirement'){generation=null;heap=null;}else if(generation!==null)heap=e.heapBytes;}
  if(heap===null||!Number.isFinite(s.backingStorageSize)){skipped++;continue;}
  sums.push({label:s.label,usedSize:s.usedSize,backingStorageSize:s.backingStorageSize,lastObservedPhpHeapBytes:heap,observedComponentSum:s.usedSize+s.backingStorageSize+heap});
 }
 assert.ok(sums.length>0);
 const max=sums.reduce((a,b)=>a.observedComponentSum>b.observedComponentSum?a:b);
 phases.push({phase:name,samples:o.samples.length,matchedSamples:sums.length,skippedSamples:skipped,exceptions:observedExceptions.length,observerErrors:0,maxObservedComponents:max,maxObservedPhpHeapBytes:Math.max(...o.events.filter(e=>e.kind==='php').map(e=>e.heapBytes))});
}
const receipts=events.filter(e=>e.kind==='native-save');assert.equal(receipts.length,1);const receipt=receipts[0];assert.equal(receipt.status,200);assert.equal(receipt.contentExact,true);assert.equal(receipt.contentSha256,owner.expectedSha);
const requests=events.filter(e=>e.kind==='request'),errors=requests.filter(e=>e.status>=400);
const forbidden=errors.filter(e=>e.status===403&&e.category==='rest'&&e.method==='GET'&&e.restRoute==='/wp-json/wp/v2/global-styles/42'&&e.restErrorCode==='rest_forbidden_context');
assert.equal(ui.access.initialLoginWithoutGateDenied,true);assert.equal(ui.access.observedText,'Not found');assert.equal(ui.access.gateFormThenNativeLogin,true);
const gateSource=await readFile('src/playtt-probe-access.ts','utf8');
assert.ok(gateSource.includes("if(!authorized)return new Response('Not found',{status:404,headers});"));
const gateDenied=errors.filter(e=>e.status===404&&e.category==='login'&&e.method==='GET');assert.equal(gateDenied.length,1);
assert.equal(gateDenied[0],requests.find(e=>e.category==='login'));
assert.ok(requests.some(e=>e.category==='login'&&e.status===200&&e.at>gateDenied[0].at));
const unclassified=errors.filter(e=>!forbidden.includes(e)&&!gateDenied.includes(e));

const result={schema:'playtt/native-allocation-data-audit/v1',at:run.at,result:'native-save-full-restart-and-data-pass; network-loss-cause-and-provider-memory-acceptance-open',sourceBuild:build.bundleSha256,sourceCount:83,fullSourceBuild:true,centralCandidateAdopted:false,deployed:false,localOnly:true,cloudRequests:0,productionChanged:false,baselineLocalCopyOfCloudVersion:181,finalLocalVersion:run.finalVersion,nativeSave:{status:200,id:193,draft:true,contentBytes:receipt.contentBytes,contentSha256:receipt.contentSha256,exact:true,receiptVersion:receipt.version},browser:ui,restart:run.fullWorkerdRestart[0],revision:{originalRowsExact:true,addedCount:1,addedId:209},changedFiles:changed.map(p=>p===owner.draftPath?'page/<owned-draft>.md':p),allOtherContentExact:true,allOriginalUsermetaExactNewSessionRemoved:true,mediaAndThemeExact:true,independentBackupExact:true,fullMaterializedExact:true,independentObjects:independent.objects.length,independentFiles:run.independentFiles,chargedBytes:budget.chargedBytes,chargedPuts:budget.chargedPuts,closed:true,sealed:true,pending:0,localProcessesDisposed:true,exceptions:1,unclassifiedRuntimeExceptions:[{phase:"after-restart",message:"Uncaught Error: Network connection lost.",capturedFrames:0,causeProven:false}],observerErrors:0,requests:requests.length,statusCounts:requests.reduce((a,e)=>(a[e.status]=(a[e.status]||0)+1,a),{}),httpErrors:errors.map(({at,version,...e})=>e),unclassifiedHttpErrors:unclassified.map(({at,version,...e})=>e),allHttpErrorsExplained:unclassified.length===0,initialGateDenial:{count:1,status:404,source:'src/playtt-probe-access.ts',nativeLoginAfterGatePassed:true},globalStyle403:forbidden.length?{route:forbidden[0].restRoute,code:forbidden[0].restErrorCode,pinnedCore:'wordpress/wp-includes/rest-api/endpoints/class-wp-rest-global-styles-controller.php:172',interpretation:'Matches the edit-context update-permission rejection in the pinned core. No permission relaxation; this run still saved the draft.',previousUnclassified403Attributed:false}:null,memory:{method:'Runtime.getHeapUsage usedSize + backingStorageSize + last observed HEAPU8 within the same generation; no embedder double-counting; observer overhead and asynchronous boundary remain',phases,thresholdBytes:134217728,observedSumAboveThreshold:phases.some(p=>p.maxObservedComponents.observedComponentSum>134217728),providerAcceptance:false},limitations:['Single local workflow; contenteditable fill/click is not physical IME/mobile acceptance.','Local workerd does not enforce the Cloudflare limit. These sampled, partially asynchronous component sums are not provider peak, billed CPU, RSS or an admission test.','One post-restart Network connection lost exception has no captured frames. Native logout and data checks passed, but its cause and functional impact are not proven; timing is not attribution.','Initial 404 is the observed unauthenticated gate rejection; global-style 403 is classified only with exact route/code. Other errors remain explicitly unclassified.','Independent import/materialization was checked by the runner; no separate end-user restoration of that output in this run.','Malformed ZIP/I/O and boot-failure cases passed in the preceding stage; this native run is a native save/restart data workflow, not sustained free-use acceptance.']};
const output=prefix+'audit.json',serialized=JSON.stringify(result,null,2)+'\n';
if(check)assert.equal(await readFile(output,'utf8'),serialized);else await writeFile(output,serialized,{flag:'wx'});
console.log(JSON.stringify({result:result.result,requests:result.requests,exceptions:result.exceptions,classified403:forbidden.length,unclassifiedHttpErrors:unclassified.length,finalLocalVersion:run.finalVersion,chargedBytes:budget.chargedBytes,maxObservedSums:phases.map(p=>p.maxObservedComponents.observedComponentSum),readOnlyCheck:check,cloudRequests:0}));
