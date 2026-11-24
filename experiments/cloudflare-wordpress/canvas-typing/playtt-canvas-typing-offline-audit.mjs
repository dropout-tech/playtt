// Offline only: checks both retained local attempts against the trusted cloud201 backup.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {openSnapshotBundle} from './playtt-snapshot-bundle.mjs';
assert.ok(process.argv.includes('--local')&&!process.argv.includes('--remote'));
const load=async p=>JSON.parse(await readFile(p,'utf8')),sha=b=>createHash('sha256').update(b).digest('hex');
const cloud=await load('artifacts/playtt-native-approved-backup-owned-private.json');
const before=(await openSnapshotBundle(join(cloud.directory,'independent'),cloud.anchor)).graph;
const table=(g,p)=>JSON.parse(Buffer.from(g.contents.markdown.find(x=>x.path===p).bytes));
const framed=(g,p)=>{const raw=Buffer.from(g.contents.markdown.find(x=>x.path===p).bytes).toString(),m=raw.match(/^---\n(.+?)\n---\n\n?(.*)$/s);assert.ok(m);const marker=m[1].match(/^__playtt_content: "v1:(\d+):([a-f0-9]{64})"$/m);assert.ok(marker);assert.ok(m[2].endsWith('\n'));const content=m[2].slice(0,-1);assert.equal(Buffer.byteLength(content),Number(marker[1]));assert.equal(sha(content),marker[2]);return{frontmatter:m[1],content};};
const fixture=await load('artifacts/playtt-canvas-recheck-fixture.json');
for(const [kind,pass]of [['ordinary',true],['srcdoc',true],['blob',false]]){
 const c=fixture.chrome.find(x=>x.kind===kind),i=fixture.iab.find(x=>x.kind===kind);
 assert.equal(c.loadEvents,1);assert.equal(c.parentAppend,true);assert.equal(i.loadEvents,pass?1:0);assert.equal(i.parentAppend,pass);
}
const attempts=[];
for(const kind of ['native','typing']){
 const owner=await load(`artifacts/playtt-canvas-${kind}-local-owned-private.json`);assert.equal(owner.sealed,true);assert.equal(owner.localProcessesDisposed,true);
 const success=kind==='typing';assert.equal(owner.phase,success?'verified':'failed');
 const anchor=success?owner.finalAnchor:(await load(join(owner.directory,'post-failure/audit.json'))).anchor;
 const after=(await openSnapshotBundle(join(owner.directory,success?'independent':'post-failure/independent'),anchor)).graph;
 if(success){const provenance=await load(join(owner.directory,'materialized/materialization-provenance.json'));assert.deepEqual(provenance.source,anchor);const full=(await openSnapshotBundle(join(owner.directory,'materialized'),provenance.materialized)).graph;for(const g of ['markdown','uploads','wpContent'])assert.deepEqual([...full.contents[g]].sort((a,b)=>a.path.localeCompare(b.path)),[...after.contents[g]].sort((a,b)=>a.path.localeCompare(b.path)));assert.deepEqual(full.contents.wpContentDeleted,after.contents.wpContentDeleted);}
 for(const g of ['uploads','wpContent','wpContentDeleted'])assert.deepEqual(after.contents[g],before.contents[g]);
 const oldMap=new Map(before.contents.markdown.map(x=>[x.path,x.bytes])),newMap=new Map(after.contents.markdown.map(x=>[x.path,x.bytes]));
 assert.deepEqual([...oldMap.keys()].sort(),[...newMap.keys()].sort());
 const changed=[...newMap].filter(([p,b])=>!Buffer.from(b).equals(Buffer.from(oldMap.get(p)))).map(([p])=>p).sort();
 const allowed=['_runtime/playtt-auto-increment.json','_tables/postmeta.json','_tables/posts.json','_tables/usermeta.json',...(success?[owner.draftPath]:[])].sort();assert.deepEqual(changed,allowed);
 const oldDraft=framed(before,owner.draftPath),newDraft=framed(after,owner.draftPath);
 assert.equal(newDraft.content,success?owner.expectedContent:oldDraft.content);
 const strip=f=>f.split('\n').filter(x=>!/^(__playtt_content:|  date:|  modified:|  modified_gmt:)/.test(x)).join('\n');assert.equal(strip(oldDraft.frontmatter),strip(newDraft.frontmatter));
 const oldPosts=table(before,'_tables/posts.json'),newPosts=table(after,'_tables/posts.json');
 for(const old of oldPosts)assert.deepEqual(newPosts.find(x=>x.ID===old.ID),old);
 const added=newPosts.filter(x=>!oldPosts.some(y=>y.ID===x.ID));assert.equal(added.length,1);const r=added[0];
 const expectedRevision={...oldPosts.find(x=>x.ID==='209'),ID:'210',post_name:success?'193-revision-v1':'193-autosave-v1',guid:'http://127.0.0.1:9580/?p=210',post_content:success?owner.expectedContent:owner.expectedContent.replace('<p>'+owner.editedText+'</p>','<p>'+owner.editedText+'x</p>')};
 for(const k of ['post_date','post_date_gmt','post_modified','post_modified_gmt']){const t=Date.parse(r[k].replace(' ','T')+'Z');assert.ok(t>=owner.expiresAt-601000&&t<=owner.expiresAt);expectedRevision[k]=r[k];}assert.deepEqual(r,expectedRevision);
 const oldMeta=table(before,'_tables/postmeta.json'),newMeta=table(after,'_tables/postmeta.json');assert.equal(newMeta.length,oldMeta.length+(success?0:1));
 for(const old of oldMeta){const now=newMeta.find(x=>x.meta_id===old.meta_id);if(old.meta_id==='72'){assert.equal(old.post_id,'193');assert.equal(old.meta_key,'_edit_lock');assert.match(now.meta_value,/^\d+:2$/);assert.deepEqual({...now,meta_value:old.meta_value},old);}else assert.deepEqual(now,old);}
 if(!success)assert.deepEqual(newMeta.find(x=>x.meta_id==='77'),{meta_id:'77',post_id:'210',meta_key:'footnotes',meta_value:''});
 const oldUsers=table(before,'_tables/usermeta.json'),newUsers=table(after,'_tables/usermeta.json');assert.equal(newUsers.length,oldUsers.length+(success?0:1));
 for(const old of oldUsers){const now=newUsers.find(x=>x.umeta_id===old.umeta_id);if(old.umeta_id==='38'){assert.equal(old.user_id,'2');assert.equal(old.meta_key,'wp_persisted_preferences');assert.deepEqual({...now,meta_value:old.meta_value},old);const normalized=now.meta_value.replace('s:10:"editorMode";s:6:"visual"','s:10:"editorMode";s:4:"text"').replace(/s:9:"_modified";s:24:"[^"]+"/,old.meta_value.match(/s:9:"_modified";s:24:"[^"]+"/)[0]);assert.equal(normalized,old.meta_value);}else assert.deepEqual(now,old);}
 if(!success){const row=newUsers.find(x=>x.umeta_id==='39');assert.equal(row.user_id,'2');assert.equal(row.meta_key,'session_tokens');assert.match(row.meta_value,/^a:1:\{/);}
 const oldSeq=table(before,'_runtime/playtt-auto-increment.json'),newSeq=table(after,'_runtime/playtt-auto-increment.json');assert.equal(newSeq.sequences.wp_posts,'210');assert.equal(newSeq.sequences.wp_usermeta,'39');assert.equal(newSeq.sequences.wp_postmeta,success?'76':'77');assert.ok(Number(newSeq.sequences.wp_options)>=Number(oldSeq.sequences.wp_options));assert.deepEqual({...newSeq,sequences:{...newSeq.sequences,wp_posts:oldSeq.sequences.wp_posts,wp_usermeta:oldSeq.sequences.wp_usermeta,wp_postmeta:oldSeq.sequences.wp_postmeta,wp_options:oldSeq.sequences.wp_options}},oldSeq);
 for(const file of owner.executedInputs)assert.equal(sha(await readFile(join(owner.directory,'executed-inputs',file.name))),file.sha256);
 const observations=[];for(const dir of ['before-restart',...(success?['after-restart']:[])])observations.push(await load(join(owner.directory,dir,'exception-allocation-observation.json')));
 const events=observations.flatMap(x=>x.events),saves=events.filter(x=>x.kind==='native-save');assert.equal(saves.length,success?1:0);assert.ok(observations.every(x=>x.stopped&&x.errors.length===0));assert.equal(events.filter(x=>x.kind==='exception').length,0);
 if(success){assert.equal(saves[0].contentExact,true);assert.equal(saves[0].contentSha256,owner.expectedSha);assert.equal(saves[0].status,200);}
 attempts.push({kind,result:success?'native-visual-save-restart-readback-logout-pass':'incomplete-input-flow-retained',canonicalVersion:success?owner.finalVersion:Math.max(...events.filter(x=>x.kind==='request').map(x=>x.version||0)),independentObjects:after.objects.length,files:after.contents.markdown.length+after.contents.uploads.length+after.contents.wpContent.length,changedFiles:changed,allOriginalRevisionsExact:true,addedRevision:210,addedRevisionKind:success?'revision':'autosave',mainContent:success?'exact visual edit':'original exact',allOtherDataChecked:true,localSession:success?'removed by native logout':'retained in sealed disposed local fixture',serverExceptions:0,nativeSaves:saves.length,autosavePosts:events.filter(x=>x.kind==='request'&&x.method==='POST'&&x.restRoute==='/wp-json/wp/v2/pages/193/autosaves').length,sealed:true,disposed:true});
}
const run=await load('artifacts/playtt-canvas-typing-local-summary.json'),ui=await load('artifacts/playtt-canvas-typing-browser.json');
assert.equal(run.result,'pass');assert.equal(run.outboundAttempts,0);assert.equal(run.chargedBytes,648188);assert.equal(run.finalBudget.writeTracking.pending,0);assert.equal(run.finalBudget.writeTracking.sealed,true);assert.equal(run.finalBudget.writeTracking.window.closed,true);assert.equal(run.fullWorkerdRestart.length,1);for(const key of ['fullWorkerdDisposed','bothPortsClosed','newInstance','stateExact','allDataExact','budgetExact','sameWindow','noReseedOrRearm'])assert.equal(run.fullWorkerdRestart[0][key],true);
for(const key of ['visualCanvasRendered','saveClicked','savedUi','coldVisualTextExact','coldNativeCodeContentExact','logoutUiConfirmed'])assert.equal(ui[key],true);
const source=await load('artifacts/playtt-recovery-provider-source-plan.json');for(const e of source.sources)assert.equal(sha((await readFile(e.path,'utf8')).replaceAll('\r\n','\n')),e.sha256);
const build=await load('artifacts/playtt-lazy-core-build-private.json');for(const e of build.productionModules){const b=await readFile(e.path);assert.equal(sha(b),e.sha256);assert.equal(b.length,e.bytes);}
const report={schema:'playtt/canvas-typing-offline-audit/v1',at:new Date().toISOString(),result:'pass',scope:'Two isolated local trials plus synthetic iframe comparison; no cloud requests or remote write authorization consumed',baselineCloudVersion:201,remoteCloudVersionLastVerified:201,remoteStateReadThisRun:false,attempts,successfulTrial:{limits:run.limits,chargedBytes:run.chargedBytes,chargedPuts:run.finalBudget.writeTracking.window.operations,fullRestart:run.fullWorkerdRestart[0],originalSessionsExactNewSessionRemoved:true,fullIndependentAndMaterializedBackup:true,browserNativeFullContentExact:true,logoutConfirmed:true},browserConsole:{warnings:ui.console.filter(x=>x.level==='warn').map(x=>x.message),errors:ui.console.filter(x=>x.level==='error').map(x=>x.message)},frozenModuleCount:build.productionModules.length,frozenBundleSha256:build.productionBundleSha256,centralSourcesUnchanged:source.sources.length,productionChanged:false,newRemoteWriteWindows:0,paidUpgrade:false,fullBackendAccepted:false,limitations:['First fill/paste-based attempt retained with autosave-only outcome; exact cause not proven.','Fresh click/keyboard input passed; no WordPress runtime patch was needed.','In-app browser still fails synthetic blob iframe; Chrome rendered all frames.','Physical keyboard/IME, mobile, cloud visual editing, peak memory, billed CPU and long-term free operation remain unverified.','Local workerd counters are not cloud usage. Raw inherited harness labels about build/adoption/cloud flags are not evidence; verified frozen module hashes above are authoritative.']};
await writeFile('artifacts/playtt-canvas-typing-offline-audit.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
