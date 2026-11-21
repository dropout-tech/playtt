// Offline exact inspection of two local native-browser negative exercises.
// Reads private evidence; outputs only bounded, non-secret assertions/differences.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {parse as yaml} from 'yaml';
const load=async p=>JSON.parse(await readFile(p,'utf8'));
const hash=b=>createHash('sha256').update(b).digest('hex');
const reports=[];
for(const prefix of ['playtt-readback-uncommitted-ui','playtt-readback-multitab-guard-ui']){
 const multi=prefix.includes('multitab'),owner=await load('artifacts/'+prefix+'-owned-private.json');
 const server=await load('artifacts/'+prefix+'-server-private.json'),browser=await load('artifacts/'+prefix+'-browser-private.json');
 assert.equal(owner.phase,'finished');assert.equal(server.localProcessesDisposed,true);assert.equal(server.outboundAttempts,0);assert.equal(server.restarts,1);
 for(const [path,expected]of Object.entries(server.testedSourceHashes))assert.equal(hash(await readFile(path)),expected);
 for(const [key,value]of Object.entries(browser))if(key!=='at')assert.equal(value,true,key);
 const snapshots={},maps={};
 for(const o of server.observations){const s=await load(owner.directory+'/'+o.label+'-private.json');snapshots[o.label]=s;maps[o.label]=new Map(s.contents.markdown.map(f=>[f.path,Buffer.from(f.bytes,'base64')]));}
 const table=(m,n)=>JSON.parse(m.get('_tables/'+n+'.json').toString());
 const page=(m,path)=>{const raw=m.get(path).toString(),end=raw.indexOf('\n---\n',4);assert.ok(end>4);return{meta:yaml(raw.slice(4,end)),body:raw.slice(end+5)};};
 const ownedPath='page/'+owner.expectedBefore.slug+'.md';
 const expectedFor=label=>!multi&&['before','fault','readback'].includes(label)||label==='before'?owner.expectedBefore.content:owner.expectedContent;
 const checkBody=(p,content,id)=>{assert.equal(p.meta.wordpress.id,id);assert.equal(p.meta.wordpress.status,'draft');assert.equal(p.body,'\n'+content+'\n');assert.equal(p.meta.__playtt_content,'v1:'+Buffer.byteLength(content)+':'+hash(content));};
 const baseline=maps.before,basePage=page(baseline,ownedPath),basePosts=table(baseline,'posts');
 const comparisons=[];
 for(const label of Object.keys(maps)){
  const m=maps[label],p=page(m,ownedPath);checkBody(p,expectedFor(label),193);
  const normalized=structuredClone(p.meta);normalized.__playtt_content=basePage.meta.__playtt_content;
  for(const key of ['date','modified','modified_gmt'])normalized.wordpress[key]=basePage.meta.wordpress[key];
  assert.deepEqual(normalized,basePage.meta);
  const secondSaved=multi&&['second','final'].includes(label),firstSaved=expectedFor(label)===owner.expectedContent;
  const expectedKeys=[...baseline.keys(),...(secondSaved?['page/202.md']:[])].sort();assert.deepEqual([...m.keys()].sort(),expectedKeys);
  const allowed=new Set([ownedPath,'_tables/posts.json','_tables/postmeta.json','_tables/usermeta.json','_runtime/playtt-auto-increment.json',...(secondSaved?['page/202.md']:[])]);
  for(const [path,bytes]of baseline)if(!allowed.has(path))assert.deepEqual(m.get(path),bytes,path);
  for(const kind of ['uploads','wpContent'])assert.deepEqual(snapshots[label].contents[kind],snapshots.before.contents[kind]);
  assert.deepEqual(snapshots[label].wpContentDeleted,snapshots.before.wpContentDeleted);
  const posts=table(m,'posts'),added=posts.filter(p=>!basePosts.some(b=>p.ID===b.ID));
  assert.deepEqual(posts.filter(p=>basePosts.some(b=>p.ID===b.ID)),basePosts);
  assert.deepEqual(added.map(p=>p.ID).sort(),[...(firstSaved?['201']:[]),...(secondSaved?['203']:[])]);
  for(const p of added){const second=p.ID==='203';assert.equal(p.post_type,'revision');assert.equal(p.post_parent,second?'202':'193');assert.equal(p.post_author,'1');assert.equal(p.post_status,'inherit');assert.equal(p.post_content,second?owner.secondContent:owner.expectedContent);}
  for(const [name,key]of [['postmeta','meta_id'],['usermeta','umeta_id']]){
   const a=table(baseline,name),b=table(m,name),allowedIds=name==='postmeta'?['72']:['21'];
   for(const old of a){const now=b.find(x=>x[key]===old[key]);assert.ok(now);if(!allowedIds.includes(old[key]))assert.deepEqual(now,old);else{assert.deepEqual({...now,meta_value:old.meta_value},old);if(name==='postmeta')assert.match(now.meta_value,/^\d+:1$/);}}
   const additions=b.filter(x=>!a.some(y=>y[key]===x[key]));
   assert.equal(additions.length,secondSaved&&name==='postmeta'?1:0);
   if(additions.length){const row=additions[0];assert.deepEqual({...row,meta_value:''},{meta_id:'75',post_id:'202',meta_key:'_edit_lock',meta_value:''});assert.match(row.meta_value,/^\d+:1$/);}
  }
  const counters=JSON.parse(m.get('_runtime/playtt-auto-increment.json')),oldCounters=JSON.parse(baseline.get('_runtime/playtt-auto-increment.json'));
  assert.deepEqual(Object.keys(counters).sort(),Object.keys(oldCounters).sort());assert.deepEqual(Object.keys(counters.sequences).sort(),Object.keys(oldCounters.sequences).sort());
  for(const k of Object.keys(oldCounters.sequences))assert.ok(BigInt(counters.sequences[k])>=BigInt(oldCounters.sequences[k]));
  if(secondSaved){const second=page(m,'page/202.md');checkBody(second,owner.secondContent,202);assert.equal(second.meta.title,owner.secondTitle);}
  const previous=Object.keys(maps)[Object.keys(maps).indexOf(label)-1];
  if(previous){const old=maps[previous];comparisons.push({from:previous,to:label,fromVersion:snapshots[previous].state.version,toVersion:snapshots[label].state.version,changed:[...m].filter(([p,b])=>!old.has(p)||hash(b)!==hash(old.get(p))).map(([p])=>p)});}
 }
 assert.deepEqual(snapshots.fault.contents,snapshots.readback.contents);assert.deepEqual(snapshots.fault.state,snapshots.readback.state);
 assert.equal(server.readback.count,1);
 if(multi){
  assert.equal(server.matchingRetry,null);assert.equal(server.readback.status,409);assert.equal(server.readback.code,'playtt_readback_unsettled');assert.equal(server.readback.canonicalMarker,null);
  assert.equal(server.newTab.id,202);assert.equal(server.newTab.version,server.readback.version);assert.equal(server.newTab.revision,server.readback.revision);
  assert.equal(maps.readback.has('page/202.md'),false);assert.equal(table(maps.readback,'posts').some(x=>x.ID==='202'),false);
  assert.equal(server.second.id,server.newTab.id);assert.equal(server.second.contentSha256,hash(owner.secondContent));assert.equal(server.second.titleExact,true);
  assert.deepEqual(maps.second.get('page/202.md'),maps.final.get('page/202.md'));
 }else{
  const fault=server.observations.find(o=>o.label==='fault').receipt;assert.equal(fault.wordpressInvoked,false);
  assert.equal(server.readback.status,200);assert.equal(server.readback.contentSha256,hash(owner.expectedBefore.content));assert.notEqual(server.readback.contentSha256,fault.contentSha256);
  assert.equal(server.matchingRetry.contentSha256,hash(owner.expectedContent));assert.equal(server.matchingRetry.id,193);
 }
 const lines=(await readFile('artifacts/'+prefix+'-run-private.log','utf8')).split(/\r?\n/).filter(s=>s.startsWith('{')).flatMap(s=>{try{return[JSON.parse(s)]}catch{return[]}});
 const traces=lines.filter(x=>x.schema==='wp-codebox/cloudflare-runtime-phase-trace/v1'),packs=lines.filter(x=>x.schema==='playtt-snapshot-phase/v1'&&x.stage==='encode-and-upload');
 const reads=traces.filter(x=>multi?x.operation==='read'&&x.runtime==='not-used':x.phases.some(p=>p.name==='readback.cold-dispose'));
 assert.equal(reads.length,1);const read=reads[0],names=read.phases.map(p=>p.name);assert.equal(read.completed,true);assert.ok(names.includes('lease.release'));
 assert.equal(names.some(n=>/coordinator.commit|runtime.retirement.persist|canonical.persist|canonical.changes.collect/.test(n)),false);
 if(multi){assert.deepEqual(names,['request.translate','lease.acquire','published.page-cache.lookup','lease.release']);}else{assert.equal(read.runtime,'cold');for(const n of ['canonical.manifest.read','request.php','readback.dispose'])assert.ok(names.includes(n));}
 assert.equal(traces.filter(x=>x.completed).length,traces.length);assert.equal(lines.filter(x=>x.schema==='playtt-request-failure/v1').length,0);
 reports.push({attempt:prefix,marker:owner.marker,testedSourceHashes:server.testedSourceHashes,browser,versions:server.observations.map(x=>({label:x.label,version:x.state.version})),comparisons,exactUnrelatedRowsFilesMediaAndTheme:true,originalRevisionsPreserved:true,readbackSnapshotUnchanged:true,uncommittedDraftIdentityPreserved:multi?202:null,readback:{count:1,status:server.readback.status,code:server.readback.code,contentMismatchPreservedAsError:!multi,runtimeUsed:!multi,commitPhase:false,traceMs:read.totalMs,localGateMs:server.readback.heldMs??0},telemetry:{traces:traces.length,completedTraces:traces.length,fullPacks:packs.length,fullPackBytes:packs.reduce((n,x)=>n+x.bytes,0),requestFailures:0,blockedBackgroundMutations:server.blockedNativeRequests},localProcessesDisposed:true,outboundAttempts:0});
}
const result={at:new Date().toISOString(),result:'pass',scope:'Local native-browser negative flows and exact offline canonical comparisons; no provider execution',attempts:reports,remoteFeatureEnabled:false,providerTested:false,failedHarnessAttempt:{prefix:'playtt-readback-multitab-ui',cause:'Assumed legacy post_ID HTML field absent from pinned block editor; corrected to actual initializeEditor page ID',countedAsPass:false}};
await writeFile('artifacts/playtt-readback-negative-inspection.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result));
