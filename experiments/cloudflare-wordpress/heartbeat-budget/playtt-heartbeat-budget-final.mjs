// Offline only. Inspect the stopped local run, never contact WordPress or R2.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {gzipSync,gunzipSync} from 'node:zlib';
import {isDeepStrictEqual as same} from 'node:util';
import {openSnapshotBundle} from './playtt-snapshot-bundle.mjs';
assert.deepEqual(process.argv.slice(2),['--offline']);
const load=async p=>JSON.parse(await readFile(p,'utf8'));
const sha=b=>createHash('sha256').update(b).digest('hex');
const owner=await load('artifacts/playtt-heartbeat-budget-ui-owned-private.json');
const server=await load('artifacts/playtt-heartbeat-budget-ui-server-private.json');
const browser=await load('artifacts/playtt-heartbeat-budget-browser.json');
const backup=await load('artifacts/playtt-markdown-provider-cold-backup-owned-private.json');
assert.equal(owner.phase,'finished');assert.equal(owner.localProcessesDisposed,true);
assert.equal(server.contained,true);assert.equal(server.localProcessesDisposed,true);assert.equal(server.outboundAttempts,0);
assert.equal(backup.phase,'verified');assert.equal(backup.anchor.revision,'3021e7bd-a125-439d-9027-11005ea71316');
const original=(await openSnapshotBundle(backup.directory+'/independent',backup.anchor)).graph;
const final=await load(owner.directory+'/final-private.json');
assert.equal(final.state.version,175);assert.equal(server.matchingRetry,null);
assert.equal(browser.saveClicks,1);assert.equal(browser.beforeExact,true);assert.equal(browser.savedUi,false);
assert.equal(browser.saveFailureVisible,true);assert.equal(browser.unsavedContentStillVisible,true);
assert.equal(browser.coldReloadAttempted,false);assert.equal(browser.logoutAttempted,false);
const map=g=>new Map(g.map(f=>[f.path,Buffer.from(f.bytes,'base64')]));
const a=new Map(original.contents.markdown.map(f=>[f.path,Buffer.from(f.bytes)])),b=map(final.contents.markdown);
assert.ok(same([...a.keys()].sort(),[...b.keys()].sort()));
const changed=[...b].filter(([p,v])=>!v.equals(a.get(p))).map(([p])=>p).sort();
assert.ok(same(changed,['_runtime/playtt-auto-increment.json','_tables/postmeta.json','_tables/posts.json','_tables/usermeta.json'].sort()),'Unexpected canonical changes');
const pagePath='page/'+owner.expectedBefore.slug+'.md';
assert.ok(a.get(pagePath).equals(b.get(pagePath)),'Failed manual save must not be reported as committed');
for(const group of ['uploads','wpContent']){
 const base=new Map(original.contents[group].map(f=>[f.path,Buffer.from(f.bytes)])),end=map(final.contents[group]);
 assert.ok(same([...base.keys()].sort(),[...end.keys()].sort()));
 for(const [p,bytes]of base)assert.ok(bytes.equals(end.get(p)),'Unrelated media/theme changed');
}
assert.ok(same(final.wpContentDeleted,original.contents.wpContentDeleted));
const table=(files,p)=>JSON.parse(files.get(p).toString('utf8'));
const oldPosts=table(a,'_tables/posts.json'),posts=table(b,'_tables/posts.json');
const added=posts.filter(r=>!oldPosts.some(o=>o.ID===r.ID));
assert.equal(added.length,1);assert.ok(same(posts.filter(r=>r.ID!=='206'),oldPosts));
const autosave=added[0];assert.equal(autosave.ID,'206');assert.equal(autosave.post_parent,'193');
assert.equal(autosave.post_type,'revision');assert.equal(autosave.post_name,'193-autosave-v1');
assert.equal(autosave.post_content,owner.expectedContent);assert.equal(posts.some(r=>r.ID==='207'),false);
const oldMeta=table(a,'_tables/postmeta.json'),meta=table(b,'_tables/postmeta.json');
assert.equal(meta.length,oldMeta.length+1);
assert.ok(same(meta.find(r=>r.meta_id==='76'),{meta_id:'76',post_id:'206',meta_key:'footnotes',meta_value:''}));
for(const row of oldMeta){const after=meta.find(r=>r.meta_id===row.meta_id);assert.ok(after);assert.ok(same(row.meta_id==='72'?{...after,meta_value:row.meta_value}:after,row));}
function serialized(raw){const bytes=Buffer.from(raw);let p=0;const need=v=>{assert.equal(bytes.subarray(p,p+v.length).toString(),v,'Invalid serialization');p+=v.length;};
 const number=delimiter=>{const end=bytes.indexOf(delimiter,p);assert.ok(end>p);const raw=bytes.subarray(p,end).toString();assert.match(raw,/^-?\d+$/);p=end+1;const n=Number(raw);assert.ok(Number.isSafeInteger(n));return n;};
 const value=depth=>{assert.ok(depth<12);const t=String.fromCharCode(bytes[p++]);if(t==='N'){need(';');return null;}need(':');if(t==='i')return number(';');if(t==='b')return number(';')===1;if(t==='s'){const n=number(':');assert.ok(n>=0);need('"');const v=bytes.subarray(p,p+n).toString('utf8');p+=n;need('";');return v;}assert.equal(t,'a');const n=number(':');assert.ok(n>=0&&n<1000);need('{');const v=new Map();for(let i=0;i<n;i++){const key=value(depth+1);assert.ok(!v.has(key));v.set(key,value(depth+1));}need('}');return v;};
 const result=value(0);assert.equal(p,bytes.length);return result;}

const usersA=table(a,'_tables/usermeta.json'),usersB=table(b,'_tables/usermeta.json');
assert.equal(usersA.length,usersB.length);
for(const row of usersA){const after=usersB.find(r=>r.umeta_id===row.umeta_id);assert.ok(after);
 if(row.umeta_id==='38'){
  assert.equal(row.meta_key,'wp_persisted_preferences');assert.ok(same({...after,meta_value:row.meta_value},row));
  const oldValue=serialized(row.meta_value),newValue=serialized(after.meta_value);
  assert.ok(Date.parse(newValue.get('_modified'))>Date.parse(oldValue.get('_modified')));newValue.set('_modified',oldValue.get('_modified'));
  assert.ok(same(oldValue,newValue),'Unexpected preference change');
 }else assert.ok(same(row.umeta_id==='36'?{...after,meta_value:row.meta_value}:after,row),'Unrelated user row changed');
}
// Verify prior session hashes and their values without exposing them.
const sessionRawBefore=usersA.find(r=>r.umeta_id==='36').meta_value;
const sessionRawAfter=usersB.find(r=>r.umeta_id==='36').meta_value;
const sessionEntries=raw=>{
 const prefix=raw.match(/^a:(\d+):\{/);assert.ok(prefix);const tokens=[...raw.matchAll(/s:64:"([a-f0-9]{64})";a:4:\{(.*?)\}/gs)];
 assert.equal(tokens.length,Number(prefix[1]));return new Map(tokens.map(m=>[m[1],m[2]]));
};
const previousSessions=sessionEntries(sessionRawBefore),currentSessions=sessionEntries(sessionRawAfter);
assert.equal(currentSessions.size,previousSessions.size+1);
for(const [k,v]of previousSessions)assert.equal(currentSessions.get(k),v);
const seqA=table(a,'_runtime/playtt-auto-increment.json').sequences,seqB=table(b,'_runtime/playtt-auto-increment.json').sequences;
assert.ok(same(Object.keys(seqA),Object.keys(seqB)));for(const k of Object.keys(seqA))assert.ok(BigInt(seqB[k])>=BigInt(seqA[k]));
const history=server.history;
assert.ok(same(history.transitions.map(t=>t.version),Array.from({length:14},(_,i)=>162+i)));
const repeated=history.transitions.find(t=>t.version===173);
assert.ok(same(repeated.changed,[{path:'_tables/posts.json',bytes:322462}]));
assert.ok(same(repeated.tables['_tables/posts.json'].changed,[{id:'206',fields:['post_date','post_date_gmt','post_modified','post_modified_gmt']}]));
const heartbeats=history.requests.filter(r=>r.action==='heartbeat'&&r.status===200);
const intervals=heartbeats.slice(1).map((r,i)=>Date.parse(r.at)-Date.parse(heartbeats[i].at));
assert.equal(intervals.length,5);assert.ok(intervals.every(ms=>ms>=29900&&ms<30200));
const failures=history.requests.filter(r=>r.status>=400);
assert.equal(failures.length,2);assert.ok(failures.every(r=>r.status===503));
assert.ok(same(failures.map(r=>r.path),['/wp-json/wp/v2/pages/193','/wp-json/wp/v2/pages/193/autosaves']));
const budget=server.finalBudget;
assert.equal(budget.chargedBytes,1860844);assert.equal(budget.chargedPuts,49);
assert.equal(budget.writeTracking.pending,0);assert.equal(budget.writeTracking.sealed,true);assert.equal(budget.writeTracking.window.closed,true);
assert.equal(budget.writeTracking.window.remainingBytes,20197);
// Lossless size experiment only, not a new persisted format or a total-cost estimate.
const compression=[];
for(const path of ['_tables/posts.json','_tables/postmeta.json','_tables/usermeta.json','_runtime/playtt-auto-increment.json']){
 const raw=b.get(path),packed=gzipSync(raw,{level:6});assert.ok(gunzipSync(packed).equals(raw));
 compression.push({path,rawBytes:raw.length,gzipBytes:packed.length,rawSha256:sha(raw),roundTripExact:true});
}
const report={schema:'playtt/local-heartbeat-budget-proof/v1',at:new Date().toISOString(),result:'verified-capacity-failure',
 sourceCommit:'d754dacd8d2c48e22658752588886427f3078608',sourceUnchanged:true,runtimePolicyEnabled:true,policyInjected:false,
 localOnly:true,outerWorkerGateAndBudget:true,privateGateLogin:true,
 fixture:{miniflareStorageClassObserved:'',defaultedTo:'Standard',unknownValuesRejected:true,productionValidatorUnchanged:true,baselineObjects:307,baselineBytes:101079607,diagnosticObjectWritesExcluded:true},
 limits:server.limits,elapsedWindowMs:server.elapsedWindowMs,
 native:{...browser,manualSaveResponse503:true,autosavesSucceeded:2,laterAutosaveResponse503:true,restarts:0},
 canonical:{versionBefore:161,versionAfter:175,originalPageUnchanged:true,autosaveId:206,autosaveContentExact:true,failedManualRevision207Absent:true,priorPostsAndRevisionsExact:true,allUnrelatedCanonicalFilesExact:true,mediaAndThemeExact:true,postmetaOnlyExpectedChanges:true,preferenceOnlyModifiedTimestampChanged:true,monotonicSequences:true,priorSessionsPreserved:previousSessions.size,newLocalSessionRetained:1,logoutNotClaimed:true},
 accounting:{chargedBytes:budget.chargedBytes,chargedPuts:budget.chargedPuts,remainingWindowBytes:budget.writeTracking.window.remainingBytes,pending:0,sealed:true,closed:true,capIncreased:false,refundOrHistoryDeletion:false},
 cadence:{nativeMinimalInterval:server.heartbeatSettings.minimalInterval,intervalsMs:intervals,strictRateLimit:false},
 repeatedAutosave:{version:173,changedFields:repeated.tables['_tables/posts.json'].changed[0].fields,unchangedContent:true,tableBytes:322462,manifestBytes:73740,logicalTablePlusManifestBytes:396202},
 offlineCompression:{algorithm:'Node gzip level6',samples:compression,roundTripOnly:true,runtimeImplemented:false,totalWorkflowSavingsMeasured:false,workerCpuOrMemoryMeasured:false},
 localProcessesDisposed:true,ownedBrowserTabClosed:true,outboundAttempts:0,
 initialHelperFailures:['Sandbox denied loopback before an owner was created','Capacity initialization rejected Miniflare empty storageClass; Standard-only validator retained, fixture corrected','Controller read a partially written reply; recovered that same command without replay, parser now retries incomplete JSON'],
 limitations:['This local workflow cannot fit in the last verified provider remaining allowance; do not repeat it remotely.','Manual save failed; an autosave preserves exact new text, but native recovery after cold reopen and logout were not tested.','Physical WordPress/PHP/SQLite/R2 work executes locally; provider CPU, memory and latency are not measured.','The local window mirrors the last provider remaining bytes, but its global ledger has a different baseline.','Compression results cover four offline files, not a compatible runtime format, complete attempted-write accounting or an end-to-end improvement.'],
 next:'Prototype bounded lossless storage for repeated table writes, preserving exact timestamps, revisions, sessions, counters and rollback compatibility. Verify full native workflow locally before any provider spend.',
 cloud:{requestsThisTurn:0,deployed:false,productionChanged:false,paidChange:false,lastVerifiedAt:'2026-11-21T06:28:14.277Z',lastVerifiedVersion:161,lastVerifiedPins:13,lastVerifiedRemainingBytes:1881041,refreshed:false},goalStatus:'active'};
await writeFile('artifacts/playtt-heartbeat-budget-summary.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({result:report.result,canonical:report.canonical,accounting:report.accounting,cadence:report.cadence,compression}));
