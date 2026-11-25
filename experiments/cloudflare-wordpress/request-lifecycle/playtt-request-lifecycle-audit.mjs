// Read-only inputs; no network or fixture replay. --check never writes the report.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {openSnapshotBundle} from './playtt-snapshot-bundle.mjs';
assert.ok(process.argv.includes('--local')&&!process.argv.includes('--remote'));
const check=process.argv.includes('--check'),load=async p=>JSON.parse(await readFile(p,'utf8')),sha=b=>createHash('sha256').update(b).digest('hex');
const variant=Number(process.argv.find(x=>x.startsWith('--variant='))?.slice(10));assert.ok([2,3].includes(variant));
const prefix=`artifacts/playtt-request-lifecycle-native-v${variant}-`,owner=await load(prefix+'owned-private.json'),run=await load(prefix+'summary.json'),ui=await load(prefix+'ui-private.json');
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
const diagnosticDirectory=owner.directory+'/executed-inputs/';
const inputs=await load(diagnosticDirectory+'hashes.json');
for(const [name,digest]of Object.entries(inputs))assert.equal(sha(await readFile(diagnosticDirectory+name)),digest,name);
const helperSource=await readFile(diagnosticDirectory+'playtt-request-lifecycle.mjs','utf8');
const executedNative=await readFile(diagnosticDirectory+'playtt-request-lifecycle-native.mjs','utf8');
const wrapper=await readFile(owner.wrapper,'utf8');
assert.ok(wrapper.includes("fetch(request){return lifecycle(request,req=>super.fetch(req),'execution');}"));
assert.ok(wrapper.includes('forwarded.headers.set(TRACE_HEADER,String(++traceId))'));
assert.equal(wrapper.includes('streamBodies:false,classifyBeforeForward:false'),variant===3);
assert.ok(executedNative.includes('fbc6506c323feed4199b8273ea9a595171092910eb1161289be6f1c6c28ef877'));
const phases=[],events=[];
for(const name of ['before-restart','after-restart']){
 const o=await load(owner.directory+'/'+name+'/exception-allocation-observation.json');assert.equal(o.stopped,true);assert.deepEqual(o.errors,[]);assert.deepEqual(o.allocations,[]);
 const lifecycle=o.events.filter(e=>e.kind==='lifecycle');assert.ok(lifecycle.length>0);assert.ok(!lifecycle.some(e=>['unknown','truncated'].includes(e.stage)));
 const runtimeExceptions=o.events.filter(e=>e.kind==='exception');assert.equal(runtimeExceptions.length,0);
 const classifiedErrors=lifecycle.filter(e=>['fetch-error','body-error','cancel-error','ajax-fields-error'].includes(e.stage));assert.deepEqual(classifiedErrors,[]);
 events.push(...o.events);phases.push({phase:name,requests:o.events.filter(e=>e.kind==='request').length,lifecycleEvents:lifecycle.length,exceptions:0,abortEvents:lifecycle.filter(e=>e.stage==='abort').length,bodyCancellations:lifecycle.filter(e=>e.stage==='body-cancel').length});
}
const after=await load(owner.directory+'/after-restart/exception-allocation-observation.json'),life=after.events.filter(e=>e.kind==='lifecycle');
const unlockFields=life.filter(e=>e.stage==='ajax-fields'&&e.action==='wp-remove-post-lock');assert.equal(unlockFields.length,1);const unlockId=unlockFields[0].id;
assert.equal(unlockFields[0].encoding,'multipart');assert.equal(unlockFields[0].hasPostId,true);assert.equal(unlockFields[0].hasActiveLock,true);
const logout=life.filter(e=>e.layer==='outer'&&e.stage==='headers'&&e.logout);assert.equal(logout.length,1);assert.equal(logout[0].status,302);
const unlock=life.filter(e=>e.id===unlockId),headers=unlock.filter(e=>e.stage==='headers');assert.equal(headers.length,2);assert.deepEqual(headers.map(e=>e.layer).sort(),['execution','outer']);
assert.ok(headers.every(e=>e.status===(variant===2?400:200)&&e.aborted===false));
if(variant===2){const ends=unlock.filter(e=>e.stage==='body-end');assert.equal(ends.length,2);assert.ok(ends.every(e=>e.bytes===1&&e.chunks===1&&!e.aborted));assert.ok(logout[0].at<headers.find(e=>e.layer==='outer').at);}
else{assert.ok(!life.some(e=>e.stage.startsWith('body-')));assert.ok(headers.find(e=>e.layer==='outer').at<logout[0].at);}
const receipts=events.filter(e=>e.kind==='native-save');assert.equal(receipts.length,1);assert.equal(receipts[0].contentSha256,owner.expectedSha);assert.equal(receipts[0].contentExact,true);assert.equal(receipts[0].status,200);
const requests=events.filter(e=>e.kind==='request'),httpErrors=requests.filter(e=>e.status>=400);assert.equal(httpErrors.length,variant===2?1:0);
if(variant===2){assert.equal(httpErrors[0].category,'ajax');assert.equal(httpErrors[0].status,400);}
const timeline=[...unlock, ...life.filter(e=>e.id===logout[0].id)].sort((a,b)=>a.at-b.at),first=timeline[0].at;
const result={schema:'playtt/request-lifecycle-native-audit/v1',result:'native-data-pass; prior-network-loss-not-reproduced-and-not-attributed',variant,at:run.at,sourceBundle:run.bundleSha256,helperSourceSha256:sha(helperSource),nativeHarnessSha256:sha(executedNative),wrapperSha256:sha(wrapper),executedInputHashes:inputs,diagnosticMode:variant===2?'classified-before-forward-and-wrapped-login-ajax-bodies':'concurrent-classification-original-response-object-and-stream',sourceBundleUnchanged:true,centralCandidateAdopted:false,productionChanged:false,cloudRequests:0,localOnly:true,
 finalLocalVersion:run.finalVersion,chargedBytes:budget.chargedBytes,chargedPuts:budget.chargedPuts,closed:true,sealed:true,pending:0,localProcessesDisposed:true,
 nativeSave:{exact:true,bytes:receipts[0].contentBytes,sha256:owner.expectedSha,singleReceipt:true},browser:ui,restart:run.fullWorkerdRestart[0],revision:{originalRowsExact:true,addedCount:1,addedId:209},changedFiles:changed.map(p=>p===owner.draftPath?'page/<owned-draft>.md':p),allOtherContentExact:true,allOriginalUsermetaExact:true,mediaAndThemeExact:true,independentObjects:independent.objects.length,independentFiles:run.independentFiles,independentBackupExact:true,fullMaterializedExact:true,
 phases,requests:requests.length,runtimeExceptions:0,unclassifiedHttpErrors:httpErrors.map(({at,version,...e})=>e),unlock:{id:unlockId,action:'wp-remove-post-lock',encoding:'multipart',status:headers[0].status,bodyBytes:variant===2?1:null,bodyValueCaptured:false,logoutHeadersBeforeUnlockHeaders:variant===2,aborted:false},timeline:timeline.map(({at,...e})=>({offsetMs:at-first,...e})),priorExceptionsRemainUnattributed:true,providerMemoryAcceptance:false,
 limitations:['No exception occurred in either diagnostic variant; this does not establish a fix or the cause of previous exceptions.','Request ordering, diagnostic overhead and browser asset cache differ. The two runs are not a controlled causal timing comparison.','Variant2 wraps login/Ajax bodies and awaits form analysis before forwarding; variant3 preserves the response object/stream and begins forwarding before analysis finishes. Both add headers/logs and request cloning.','Variant2 observed one unclassified Ajax400. Its action and one-byte body length are known, but the body value and authenticated user were not captured; post-logout timing alone does not prove the rejection cause.','No memory/performance/provider CPU conclusion; original whole-memory acceptance remains open.','Independent materialization/data checks do not replace physical IME/mobile or a separate end-user restore acceptance.']};
const output=prefix+'audit.json',serialized=JSON.stringify(result,null,2)+'\n';if(check)assert.equal(await readFile(output,'utf8'),serialized);else await writeFile(output,serialized,{flag:'wx'});
console.log(JSON.stringify({result:result.result,variant,version:run.finalVersion,chargedBytes:budget.chargedBytes,requests:requests.length,exceptions:0,unlockStatus:headers[0].status,priorCauseProven:false}));
