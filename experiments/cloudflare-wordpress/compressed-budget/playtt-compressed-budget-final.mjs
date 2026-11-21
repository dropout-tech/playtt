// OFFLINE ONLY. Inspect the finished native browser run and detached backup.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {gzipSync,gunzipSync} from 'node:zlib';
import {parse as yaml} from 'yaml';
import {isDeepStrictEqual as same} from 'node:util';
import {openSnapshotBundle} from './playtt-snapshot-bundle.mjs';
assert.deepEqual(process.argv.slice(2),['--offline']);
const load=async p=>JSON.parse(await readFile(p,'utf8')),sha=b=>createHash('sha256').update(b).digest('hex');
const owner=await load('artifacts/playtt-compressed-budget-ui-owned-private.json'),server=await load('artifacts/playtt-compressed-budget-ui-server-private.json'),browser=await load('artifacts/playtt-compressed-budget-browser.json'),backup=await load('artifacts/playtt-markdown-provider-cold-backup-owned-private.json');
assert.equal(owner.phase,'finished');assert.equal(owner.localProcessesDisposed,true);assert.equal(server.contained,true);assert.equal(server.outboundAttempts,0);assert.equal(server.restarts,1);assert.equal(server.matchingRetry,null);assert.equal(server.localProcessesDisposed,true);
assert.equal(backup.phase,'verified');assert.equal(backup.anchor.revision,'3021e7bd-a125-439d-9027-11005ea71316');
assert.equal(browser.saveClicks,1);assert.equal(browser.beforeExact,true);assert.equal(browser.savedUi,true);assert.equal(browser.coldParagraphsExact,true);assert.equal(browser.coldParagraphCount,9);assert.equal(browser.logoutFailure503,true);assert.equal(browser.logoutSucceeded,false);assert.equal(browser.ownedBrowserTabClosed,true);
const original=(await openSnapshotBundle(backup.directory+'/independent',backup.anchor)).graph;
const final=await load(owner.directory+'/final-private.json'),saved=await load(owner.directory+'/saved-private.json');assert.equal(final.state.version,179);assert.equal(saved.state.version,176);
const independent=await openSnapshotBundle(owner.directory+'/independent',final.anchor),fullIndex=await load(owner.directory+'/materialized/bundle.json'),full=await openSnapshotBundle(owner.directory+'/materialized',fullIndex.anchor);
assert.equal(independent.graph.format,'compressed-content');assert.equal(full.graph.format,'full-pack');assert.equal(independent.graph.objects.length,304);
const map=g=>new Map(g.map(f=>[f.path,Buffer.from(f.bytes,'base64')])),a=new Map(original.contents.markdown.map(f=>[f.path,Buffer.from(f.bytes)])),b=map(final.contents.markdown),s=map(saved.contents.markdown);
assert.ok(same([...a.keys()].sort(),[...b.keys()].sort()));
for(const g of ['markdown','uploads','wpContent']){const end=map(final.contents[g]);for(const verified of [independent.graph.contents[g],full.graph.contents[g]]){assert.equal(verified.length,end.size);for(const f of verified)assert.ok(Buffer.from(f.bytes).equals(end.get(f.path)));}}
for(const g of ['uploads','wpContent']){const base=new Map(original.contents[g].map(f=>[f.path,Buffer.from(f.bytes)])),end=map(final.contents[g]);assert.ok(same([...base.keys()].sort(),[...end.keys()].sort()));for(const [p,bytes]of base)assert.ok(bytes.equals(end.get(p)));}
assert.ok(same(final.wpContentDeleted,original.contents.wpContentDeleted));assert.ok(same(full.graph.contents.wpContentDeleted,final.wpContentDeleted));
const pagePath='page/'+owner.expectedBefore.slug+'.md',changed=[...b].filter(([p,v])=>!v.equals(a.get(p))).map(([p])=>p).sort();
assert.ok(same(changed,['_runtime/playtt-auto-increment.json','_tables/postmeta.json','_tables/posts.json','_tables/usermeta.json',pagePath].sort()));
const page=bytes=>{const text=bytes.toString('utf8'),end=text.indexOf('\n---\n',4);assert.ok(end>4);return {meta:yaml(text.slice(4,end)),body:text.slice(end+5)};};
const beforePage=page(a.get(pagePath)),finalPage=page(b.get(pagePath));assert.equal(beforePage.body,'\n'+owner.expectedBefore.content+'\n');assert.equal(finalPage.body,'\n'+owner.expectedContent+'\n');assert.ok(s.get(pagePath).equals(b.get(pagePath)));
assert.equal(finalPage.meta.__playtt_content,'v1:'+Buffer.byteLength(owner.expectedContent)+':'+sha(owner.expectedContent));
const dateFields=Object.keys(finalPage.meta.wordpress).filter(k=>!same(beforePage.meta.wordpress[k],finalPage.meta.wordpress[k]));assert.ok(same(dateFields.sort(),['date','modified','modified_gmt'].sort()));for(const k of dateFields)finalPage.meta.wordpress[k]=beforePage.meta.wordpress[k];finalPage.meta.__playtt_content=beforePage.meta.__playtt_content;assert.ok(same(finalPage.meta,beforePage.meta));
const table=(files,p)=>JSON.parse(files.get(p).toString('utf8'));
const oldPosts=table(a,'_tables/posts.json'),posts=table(b,'_tables/posts.json'),savedPosts=table(s,'_tables/posts.json');
assert.ok(same(posts.filter(p=>p.ID!=='207'),oldPosts));assert.equal(posts.length,oldPosts.length+1);
const revision=posts.find(p=>p.ID==='207');assert.equal(revision.post_parent,'193');assert.equal(revision.post_type,'revision');assert.equal(revision.post_content,owner.expectedContent);
const autosave=savedPosts.find(p=>p.ID==='206');assert.equal(autosave.post_name,'193-autosave-v1');assert.equal(autosave.post_parent,'193');assert.equal(autosave.post_content,owner.expectedContent);assert.ok(same(savedPosts.filter(p=>!['206','207'].includes(p.ID)),oldPosts));assert.ok(same(savedPosts.find(p=>p.ID==='207'),revision));
const oldMeta=table(a,'_tables/postmeta.json'),meta=table(b,'_tables/postmeta.json');assert.equal(meta.length,oldMeta.length);
for(const row of oldMeta){const after=meta.find(r=>r.meta_id===row.meta_id);assert.ok(after);assert.ok(same(row.meta_id==='72'?{...after,meta_value:row.meta_value}:after,row));}
assert.equal(meta.some(r=>r.meta_id==='76'),false);
function serialized(raw){const bytes=Buffer.from(raw);let p=0;const need=v=>{assert.equal(bytes.subarray(p,p+v.length).toString(),v,'Invalid serialization');p+=v.length;};
 const number=delimiter=>{const end=bytes.indexOf(delimiter,p);assert.ok(end>p);const raw=bytes.subarray(p,end).toString();assert.match(raw,/^-?\d+$/);p=end+1;const n=Number(raw);assert.ok(Number.isSafeInteger(n));return n;};
 const value=depth=>{assert.ok(depth<12);const t=String.fromCharCode(bytes[p++]);if(t==='N'){need(';');return null;}need(':');if(t==='i')return number(';');if(t==='b')return number(';')===1;if(t==='s'){const n=number(':');assert.ok(n>=0);need('"');const v=bytes.subarray(p,p+n).toString('utf8');p+=n;need('";');return v;}assert.equal(t,'a');const n=number(':');assert.ok(n>=0&&n<1000);need('{');const v=new Map();for(let i=0;i<n;i++){const key=value(depth+1);assert.ok(!v.has(key));v.set(key,value(depth+1));}need('}');return v;};
 const result=value(0);assert.equal(p,bytes.length);return result;}


const usersA=table(a,'_tables/usermeta.json'),usersB=table(b,'_tables/usermeta.json');assert.equal(usersA.length,usersB.length);
for(const row of usersA){const after=usersB.find(r=>r.umeta_id===row.umeta_id);assert.ok(after);
 if(row.umeta_id==='38'){const x=serialized(row.meta_value),y=serialized(after.meta_value);assert.ok(Date.parse(y.get('_modified'))>Date.parse(x.get('_modified')));y.set('_modified',x.get('_modified'));assert.ok(same(x,y));assert.ok(same({...after,meta_value:row.meta_value},row));}
 else assert.ok(same(row.umeta_id==='36'?{...after,meta_value:row.meta_value}:after,row));
}
const sessionEntries=raw=>{const prefix=raw.match(/^a:(\d+):\{/);assert.ok(prefix);const tokens=[...raw.matchAll(/s:64:"([a-f0-9]{64})";a:4:\{(.*?)\}/gs)];assert.equal(tokens.length,Number(prefix[1]));return new Map(tokens.map(m=>[m[1],m[2]]));};
const previousSessions=sessionEntries(usersA.find(r=>r.umeta_id==='36').meta_value),currentSessions=sessionEntries(usersB.find(r=>r.umeta_id==='36').meta_value);assert.equal(currentSessions.size,previousSessions.size+1);for(const [k,v]of previousSessions)assert.equal(currentSessions.get(k),v);
const seqA=table(a,'_runtime/playtt-auto-increment.json').sequences,seqB=table(b,'_runtime/playtt-auto-increment.json').sequences;assert.ok(same(Object.keys(seqA),Object.keys(seqB)));for(const k of Object.keys(seqA))assert.ok(BigInt(seqB[k])>=BigInt(seqA[k]));
const history=server.history;assert.ok(same(history.transitions.map(t=>t.version),Array.from({length:18},(_,i)=>162+i)));assert.ok(history.transitions.every(t=>t.format==='compressed-content'));
const auto=history.requests.filter(r=>r.path.endsWith('/autosaves'));assert.equal(auto.length,2);assert.ok(auto.every(r=>r.status===200));const manual=history.requests.filter(r=>r.path==='/wp-json/wp/v2/pages/193');assert.equal(manual.length,1);assert.equal(manual[0].status,200);assert.equal(manual[0].version,176);
const cold=history.transitions.find(t=>t.version===178);assert.ok(same(cold.tables['_tables/posts.json'].removed,[{id:'206'}]));assert.ok(same(cold.tables['_tables/postmeta.json'].removed,[{id:'76',metaKey:'footnotes'}]));
const failed=history.requests.filter(r=>r.status>=400);assert.equal(failed.length,2);assert.ok(same(failed.map(r=>({path:r.path,status:r.status})),[{path:'/wp-admin/admin-ajax.php',status:503},{path:'/wp-login.php',status:503}]));
const budget=server.finalBudget;assert.equal(budget.chargedBytes,1858811);assert.equal(budget.chargedPuts,56);assert.equal(budget.writeTracking.pending,0);assert.equal(budget.writeTracking.sealed,true);assert.equal(budget.writeTracking.window.closed,true);assert.equal(budget.writeTracking.window.remainingBytes,22230);
const committedManifestBytes=history.transitions.reduce((n,t)=>n+t.manifestBytes,0),committedDeltaBytes=history.transitions.reduce((n,t)=>n+t.compressedDeltaBytes,0);assert.equal(committedManifestBytes,18*74029);
const raw=independent.graph.objects.find(o=>o.key===final.anchor.manifestKey).bytes,gzip=gzipSync(raw,{level:6});assert.ok(gunzipSync(gzip).equals(Buffer.from(raw)));
const heartbeat=history.requests.filter(r=>r.action==='heartbeat'&&r.status===200);const first=heartbeat.filter(r=>r.version<176),intervals=first.slice(1).map((r,i)=>Date.parse(r.at)-Date.parse(first[i].at));assert.equal(server.heartbeatSettings.minimalInterval,'30');assert.equal(intervals.length,5);
const report={schema:'playtt/compressed-native-budget-proof/v1',at:new Date().toISOString(),result:'save-cold-reopen-pass-logout-capacity-failure',sourceCommit:server.sourceCommit,localOnly:true,outerWorkerGateAndBudget:true,compressedWriterEnabled:true,policyInjected:false,
 limits:server.limits,elapsedWindowMs:server.elapsedWindowMs,native:browser,
 canonical:{versionBefore:161,versionAfter:179,manualSaveVersion:176,autosavesSucceeded:2,manualSavesSucceeded:1,restarts:1,coldParagraphCount:9,canonicalBodyAndContentHashExact:true,savedBodySurvivesColdRestart:true,manualRevision207Exact:true,coldCoreRemovedAutosave206AndFootnotes76:true,priorPostsAndRevisionsExact:true,allUnrelatedCanonicalFilesExact:true,mediaAndThemeExact:true,preferenceOnlyModifiedTimestampChanged:true,monotonicSequences:true,priorSessionsPreserved:previousSessions.size,newLocalSessionRetained:1,logoutNotCompleted:true},
 accounting:{chargedBytes:budget.chargedBytes,chargedPuts:budget.chargedPuts,remainingWindowBytes:budget.writeTracking.window.remainingBytes,pending:0,sealed:true,closed:true,committedSnapshots:18,committedManifestBytes,committedDeltaBytes,manifestShareOfAllChargedBytes:committedManifestBytes/budget.chargedBytes,capIncreased:false,refundOrHistoryDeletion:false},
 cadence:{minimalInterval:server.heartbeatSettings.minimalInterval,firstSessionIntervalsMs:intervals,strictRateLimit:false},backup:{...server.backup,independentOpenedAgain:true,materializedOpenedAgain:true,rawReplicasVerified:true,files:independent.graph.contents.markdown.length+independent.graph.contents.uploads.length+independent.graph.contents.wpContent.length},
 offlineManifestCompression:{algorithm:'Node gzip level6',rawBytes:raw.length,gzipBytes:gzip.length,base64Bytes:Buffer.byteLength(gzip.toString('base64')),rawSha256:sha(raw),roundTripExact:true,runtimeImplemented:false,completeWorkflowSavingsMeasured:false},
 initialObservation:'Owner file was not ready while the confirmed live server initialized; same process was polled without restart.',
 fixture:{storageClassObserved:'',defaultedTo:'Standard',unknownValuesRejected:true,productionValidatorUnchanged:true,baselineObjects:307,baselineBytes:101079607,diagnosticObjectWritesExcluded:true},
 localProcessesDisposed:true,ownedBrowserTabClosed:true,outboundAttempts:0,
 limitations:['Whole browser workflow still fails under the unchanged allowance; no provider rerun is warranted.','Manual save and full restart/readback passed, but two503 responses occurred and logout did not commit; one new local session remains.','This run took458824ms and includes agent interaction delays. It demonstrates this observed workflow, not a minimum possible traffic bound or a universal failure for faster users.','The manifest gzip sample is offline only. A new format needs bounded decoding, physical/logical identity rules, cache compatibility, full backups/pins and rollback before any writer activation.','Local gate/budget scope differs from the real account baseline; no provider CPU, latency or whole-isolate memory measurement.'],
 next:'Reduce the repeated complete-manifest representation without discarding raw inventory or canonical changes. Prototype bounded self-describing metadata encoding, validate all readers/backups/pins, then rerun the entire native workflow with completion headroom.',
 cloud:{requestsThisTurn:0,deployed:false,productionChanged:false,paidChange:false,lastVerifiedAt:'2026-11-21T06:28:14.277Z',lastVerifiedVersion:161,lastVerifiedPins:13,lastVerifiedRemainingBytes:1881041,refreshed:false},goalStatus:'active'};
await writeFile('artifacts/playtt-compressed-budget-summary.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({result:report.result,canonical:report.canonical,accounting:report.accounting,backup:report.backup,manifestCompression:report.offlineManifestCompression}));
