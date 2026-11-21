// Offline, private-data assertions use booleans to avoid dumping credentials.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {isDeepStrictEqual as same} from 'node:util';
import {createHash} from 'node:crypto';
import {parse as yaml} from 'yaml';
import {openSnapshotBundle} from './playtt-snapshot-bundle.mjs';
assert.deepEqual(process.argv.slice(2),['--offline']);
const load=async p=>JSON.parse(await readFile(p,'utf8')),sha=b=>createHash('sha256').update(b).digest('hex');
const backup=await load('artifacts/playtt-markdown-provider-cold-backup-owned-private.json');assert.equal(backup.phase,'verified');
const original=(await openSnapshotBundle(backup.directory+'/independent',backup.anchor)).graph;
assert.equal(backup.anchor.revision,'3021e7bd-a125-439d-9027-11005ea71316');
const baseline=await load('artifacts/playtt-background-write-history.json'),candidate=await load('artifacts/playtt-heartbeat-rate-history.json');
const owner=await load('artifacts/playtt-heartbeat-scope-ui-owned-private.json'),server=await load('artifacts/playtt-heartbeat-scope-ui-server-private.json'),proof=await load('artifacts/playtt-heartbeat-scope-browser.json');
assert.equal(owner.phase,'finished');assert.equal(owner.restarts,1);assert.equal(owner.localProcessesDisposed,true);assert.equal(owner.outboundAttempts,0);
assert.equal(server.heartbeatSettings.minimalInterval,'30');assert.equal(server.heartbeatSettings.suspension,'disable');assert.equal(server.heartbeatSettings.hasNonce,true);
assert.equal(proof.saveClicks,1);for(const k of ['beforeExact','savedUi','coldContentExact','secondUserBlocked','oldEditorTakeoverNotice','bothLoggedOut'])assert.equal(proof[k],true);
const final=await load(owner.directory+'/final-private.json'),saved=await load(owner.directory+'/saved-private.json');
assert.equal(final.state.version,187);assert.equal(saved.state.version,168);
const unpack=g=>Object.fromEntries(['markdown','uploads','wpContent'].map(k=>[k,g[k].map(f=>({path:f.path,bytes:Buffer.from(f.bytes,'base64')}))]));
const end=unpack(final.contents),committed=unpack(saved.contents);
const identity=files=>files.map(f=>({path:f.path,sha256:sha(f.bytes)})).sort((a,b)=>a.path.localeCompare(b.path));
for(const key of ['uploads','wpContent'])assert.ok(same(identity(end[key]),identity(original.contents[key])),'Unrelated file group changed');
assert.ok(same(final.wpContentDeleted,original.contents.wpContentDeleted),'Tombstones changed');
const a=new Map(original.contents.markdown.map(f=>[f.path,Buffer.from(f.bytes)])),b=new Map(end.markdown.map(f=>[f.path,f.bytes])),c=new Map(committed.markdown.map(f=>[f.path,f.bytes]));
assert.ok(same([...a.keys()].sort(),[...b.keys()].sort()),'Canonical paths changed');
const changed=[...b].filter(([p,bytes])=>!bytes.equals(a.get(p))).map(([p])=>p).sort(),pagePath='page/'+owner.expectedBefore.slug+'.md';
assert.ok(same(changed,['_runtime/playtt-auto-increment.json','_tables/postmeta.json','_tables/posts.json','_tables/usermeta.json',pagePath].sort()),'Unexpected changed canonical file');
const page=bytes=>{const match=bytes.toString('utf8').match(/^---\n(.+?)\n---\n\n?(.*)/s);assert.ok(match);const meta=yaml(match[1]),framed=match[2];assert.ok(framed.endsWith('\n'));const body=framed.slice(0,-1);assert.equal(meta.__playtt_content,'v1:'+Buffer.byteLength(body)+':'+sha(body),'Canonical content frame differs');return {meta,body};};
const x=page(a.get(pagePath)),y=page(b.get(pagePath)),s=page(c.get(pagePath));
assert.ok(y.body===owner.expectedContent,'Canonical content differs');assert.ok(y.body===s.body,'Saved content differs');assert.ok(b.get(pagePath).equals(c.get(pagePath)),'Content changed after manual save');
assert.equal(y.meta.wordpress.id,193);assert.equal(y.meta.wordpress.status,'draft');
for(const k of ['date','modified','modified_gmt'])y.meta.wordpress[k]=x.meta.wordpress[k];y.meta.__playtt_content=x.meta.__playtt_content;assert.ok(same(x.meta,y.meta),'Unrelated page metadata changed');
const table=(files,p)=>JSON.parse(files.get(p).toString('utf8'));
const oldPosts=table(a,'_tables/posts.json'),newPosts=table(b,'_tables/posts.json'),added=newPosts.filter(r=>!oldPosts.some(o=>o.ID===r.ID));
assert.ok(same(newPosts.filter(r=>!['206','207'].includes(r.ID)),oldPosts),'Existing posts/revisions changed');
assert.ok(same(added.map(r=>r.ID).sort(),['206','207']),'Unexpected new revisions');
for(const row of added){assert.equal(row.post_parent,'193');assert.equal(row.post_type,'revision');assert.equal(row.post_content,owner.expectedContent);assert.equal(row.post_name,row.ID==='206'?'193-revision-v1':'193-autosave-v1');}
const oldMeta=table(a,'_tables/postmeta.json'),newMeta=table(b,'_tables/postmeta.json');
assert.equal(newMeta.length,oldMeta.length+1);assert.ok(same(newMeta.find(r=>r.meta_id==='76'),{meta_id:'76',post_id:'207',meta_key:'footnotes',meta_value:''}));
for(const row of oldMeta){const now=newMeta.find(r=>r.meta_id===row.meta_id);assert.ok(now);assert.ok(same(row.meta_id==='72'?{...now,meta_value:row.meta_value}:now,row),'Unrelated post metadata changed');}
// Strict parser for the primitive PHP serialization used by WP session arrays.
function serialized(raw){const bytes=Buffer.from(raw);let p=0;const need=v=>{assert.equal(bytes.subarray(p,p+v.length).toString(),v,'Invalid serialization');p+=v.length;};
 const number=delimiter=>{const end=bytes.indexOf(delimiter,p);assert.ok(end>p);const raw=bytes.subarray(p,end).toString();assert.match(raw,/^-?\d+$/);p=end+1;const n=Number(raw);assert.ok(Number.isSafeInteger(n));return n;};
 const value=depth=>{assert.ok(depth<12);const t=String.fromCharCode(bytes[p++]);if(t==='N'){need(';');return null;}need(':');if(t==='i')return number(';');if(t==='b')return number(';')===1;if(t==='s'){const n=number(':');assert.ok(n>=0);need('"');const v=bytes.subarray(p,p+n).toString('utf8');p+=n;need('";');return v;}assert.equal(t,'a');const n=number(':');assert.ok(n>=0&&n<1000);need('{');const v=new Map();for(let i=0;i<n;i++){const key=value(depth+1);assert.ok(!v.has(key));v.set(key,value(depth+1));}need('}');return v;};
 const result=value(0);assert.equal(p,bytes.length);return result;}
const oldUsers=table(a,'_tables/usermeta.json'),newUsers=table(b,'_tables/usermeta.json');assert.equal(newUsers.length,oldUsers.length);
const logins=candidate.requests.filter(r=>r.path==='/wp-login.php'&&r.method==='POST');assert.equal(logins.length,2);
const sessions=[];
for(const row of oldUsers){const now=newUsers.find(r=>r.umeta_id===row.umeta_id);assert.ok(now);
 if(['16','36'].includes(row.umeta_id)){
  assert.equal(row.meta_key,'session_tokens');assert.ok(same({...now,meta_value:row.meta_value},row));
  const initial=serialized(row.meta_value),after=serialized(now.meta_value),time=Math.floor(Date.parse(logins[row.user_id==='2'?0:1].at)/1000),expired=[...initial].filter(([,v])=>v.get('expiration')<time),valid=new Map([...initial].filter(([,v])=>v.get('expiration')>=time));
  assert.ok(same(after,valid),'Native session cleanup did not preserve all unexpired prior sessions');sessions.push({userId:Number(row.user_id),before:initial.size,expiredRemoved:expired.length,after:after.size,unexpiredPreservedExact:true,runSessionRemoved:true});
 }else if(row.umeta_id==='38'){assert.equal(row.meta_key,'wp_persisted_preferences');assert.ok(same({...now,meta_value:row.meta_value},row));}
 else assert.ok(same(now,row),'Unrelated user metadata changed');
}
const seqA=table(a,'_runtime/playtt-auto-increment.json').sequences,seqB=table(b,'_runtime/playtt-auto-increment.json').sequences;assert.ok(same(Object.keys(seqA),Object.keys(seqB)));for(const k of Object.keys(seqA))assert.ok(BigInt(seqB[k])>=BigInt(seqA[k]));
for(const h of [baseline,candidate])assert.ok(same(h.transitions.map(t=>t.version),Array.from({length:h.transitions.length},(_,i)=>162+i)),'History contains a version gap');
const intervals=(h,versions)=>versions.slice(1).map((v,i)=>Date.parse(h.transitions.find(t=>t.version===v).requests.find(r=>r.action==='heartbeat').at)-Date.parse(h.transitions.find(t=>t.version===versions[i]).requests.find(r=>r.action==='heartbeat').at));
const initialIntervals=intervals(baseline,[166,167,168,169,170]);
const candidateIntervals=[...intervals(candidate,[166,170]),...intervals(candidate,[172,177,178,179]),...intervals(candidate,[183,184])];
assert.ok(initialIntervals.every(n=>n>=9900&&n<=10100));assert.ok(candidateIntervals.every(n=>n>=29900&&n<=30100));
const onlyLock=t=>t.changed.length===1&&t.changed[0].path==='_tables/postmeta.json'&&t.tables['_tables/postmeta.json'].changed.every(r=>r.metaKey==='_edit_lock')&&t.tables['_tables/postmeta.json'].added.length===0&&t.removed.length===0;
const baselineLocks=baseline.transitions.filter(t=>onlyLock(t)&&t.requests.some(r=>r.action==='heartbeat'));
assert.equal(baselineLocks.length,5);assert.ok(baselineLocks.every(t=>t.changedLogicalBytes===14775&&t.manifestBytes===73740));
const report={schema:'playtt/local-background-write-final/v1',at:new Date().toISOString(),result:'local-pass-provider-not-tested',runtimeSourceCommit:'67dd30840e093cc83097af4273938cbf46b15351',runtimeSourceSha256:sha(await readFile('src/worker.ts','utf8')),policySha256:sha(await readFile('scripts/playtt-editor-heartbeat-policy.php','utf8')),
 baseline:{versionBefore:161,versionAfter:171,commits:10,lockHeartbeatCommits:5,lockTableBytes:14775,manifestBytes:73740,steadyHeartbeatIntervalsMs:initialIntervals,counterOnlyCommits:[163,164],counterOnlyBytes:196,counterTable:'wp_options'},
 candidate:{localOnly:true,minimalIntervalSeconds:30,nativeSettingsSerializedAsString:true,nativeSuspensionUnchanged:true,steadyLockHeartbeatIntervalsMs:candidateIntervals,intervalGrouping:'Separate uninterrupted ownership periods; excludes initialization ticks, full restart and overlapping no-change heartbeats from the other browser.',versionBefore:161,savedVersion:168,finalVersion:187,commits:26,manualSaveClicks:1,fullProcessRestarts:1,coldContentExact:true,coldParagraphs:9,secondUserBlocked:true,nativeTakeoverNotice:true,revisionId:206,takeoverAutosaveId:207,autosaveContentExact:true,allOldRevisionsExact:true,allUnrelatedCanonicalFilesExact:true,mediaAndThemeExact:true,postmetaOnlyExpectedChanges:true,monotonicSequences:true,sessions},
 failedAttempt:{name:'heartbeat-rate-ui',reason:'Test compared localized string "30" with number 30; the setting was present. Stopped before editing; local process interrupted and former listener confirmed closed.',providerRequests:0},
 limitations:['Local native Chrome and in-app browser only; no provider deployment or cloud write/read this turn.','30-second floor delays background lock/nonce signaling relative to 10 seconds. It does not change native lock expiry, callbacks or manual save paths.','Interval samples are not a controlled whole-workflow storage, latency, CPU or memory benchmark. Two login flows and durations differ.','Historical provider one-object events were not individually decoded; local file identities cannot be assigned to every past provider event.','Two counter-only commits were identified, but their exact SQL source remains untraced. No counters were suppressed.','Autosave after native takeover is preserved, not deduplicated. Long-term Free capacity and whole-isolate memory remain open.'],
 cloud:{requestsThisTurn:0,productionChanged:false,paidChange:false,lastVerifiedVersion:161,lastVerifiedPins:13,lastVerifiedRemainingBytes:1881041,lastVerifiedAt:'2026-11-21T06:28:14.277Z',stateNotRefreshedThisTurn:true},goalStatus:'active'};
await writeFile('artifacts/playtt-background-write-final.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({result:report.result,baselineIntervalsMs:initialIntervals,candidateIntervalsMs:candidateIntervals,sessions,finalLocalVersion:187}));
