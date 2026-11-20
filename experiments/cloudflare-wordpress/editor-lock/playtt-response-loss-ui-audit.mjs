// Offline inspection of bounded native-browser local tests. No browser/API calls.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {parse as yaml} from 'yaml';
const hash=b=>createHash('sha256').update(b).digest('hex'),load=async p=>JSON.parse(await readFile(p,'utf8'));
const reports=[];
for(const prefix of ['playtt-response-loss-ui','playtt-response-loss-ui-retry']){
 const owner=await load('artifacts/'+prefix+'-owned-private.json'),server=await load('artifacts/'+prefix+'-server-private.json'),browser=await load('artifacts/'+prefix+'-browser-private.json');
 assert.equal(owner.phase,'finished');assert.equal(server.localProcessesDisposed,true);assert.equal(server.outboundAttempts,0);
 const contents={};for(const item of server.observations){contents[item.label]=await load(owner.directory+'/'+item.label+'-private.json');}
 const files=s=>new Map(s.contents.markdown.map(f=>[f.path,Buffer.from(f.bytes,'base64')]));
 const table=(f,p)=>JSON.parse(f.get('_tables/'+p+'.json').toString());
 const page=f=>{const s=f.get('page/'+owner.expectedBefore.slug+'.md').toString(),end=s.indexOf('\n---\n',4);return{meta:yaml(s.slice(4,end)),content:s.slice(end+5)};};
 const compare=(from,to)=>{
  const a=files(contents[from]),b=files(contents[to]);assert.deepEqual([...a.keys()].sort(),[...b.keys()].sort());
  for(const group of ['uploads','wpContent'])assert.deepEqual(contents[from].contents[group],contents[to].contents[group]);assert.deepEqual(contents[from].wpContentDeleted,contents[to].wpContentDeleted);
  const changed=[...b].filter(([p,v])=>hash(v)!==hash(a.get(p))).map(([p])=>p),tables={};
  for(const [name,key]of [['posts','ID'],['postmeta','meta_id'],['usermeta','umeta_id'],['users','ID']]){
   const x=table(a,name),y=table(b,name);
   tables[name]={added:y.filter(n=>!x.some(o=>o[key]===n[key])).map(n=>({id:n[key],parent:n.post_parent,type:n.post_type,postId:n.post_id,userId:n.user_id,metaKey:n.meta_key,ownedContent:n.post_content===owner.expectedContent,baselineContent:n.post_content===owner.expectedBefore.content})),removed:x.filter(o=>!y.some(n=>n[key]===o[key])).map(o=>({id:o[key],parent:o.post_parent,type:o.post_type,postId:o.post_id,metaKey:o.meta_key})),changed:y.flatMap(n=>{const o=x.find(o=>o[key]===n[key]);if(!o||JSON.stringify(o)===JSON.stringify(n))return[];return[{id:n[key],parent:n.post_parent,type:n.post_type,postId:n.post_id,userId:n.user_id,metaKey:n.meta_key,fields:Object.keys(n).filter(k=>n[k]!==o[k]),contentUnchanged:n.post_content===o.post_content}];})};
  }
  const pa=page(a),pb=page(b),revisions=f=>table(f,'posts').filter(x=>x.post_type==='revision'&&x.post_parent==='193').map(x=>x.ID).sort();
  const allowed=['_runtime/playtt-auto-increment.json','_tables/postmeta.json','_tables/usermeta.json','page/'+owner.expectedBefore.slug+'.md',...(from==='before'?['_tables/posts.json']:[])];
  assert.ok(changed.every(p=>allowed.includes(p)));assert.deepEqual(table(a,'users'),table(b,'users'));
  for(const [name,key,id,metaKey,entity,entityId]of [['postmeta','meta_id','72','_edit_lock','post_id','193'],['usermeta','umeta_id','21','wp_persisted_preferences','user_id','1']]){
   const x=table(a,name),y=table(b,name);assert.equal(x.length,y.length);
   for(const old of x){const now=y.find(n=>n[key]===old[key]);assert.ok(now);if(old[key]===id){assert.equal(old.meta_key,metaKey);assert.equal(old[entity],entityId);assert.deepEqual({...now,meta_value:old.meta_value},old);if(name==='postmeta')assert.match(now.meta_value,/^\d+:1$/);}else assert.deepEqual(now,old);}
  }
  const oldPosts=table(a,'posts'),newPosts=table(b,'posts');
  if(from==='before'){
   const additions=newPosts.filter(p=>!oldPosts.some(o=>o.ID===p.ID));assert.equal(additions.length,1);const revision=additions[0];assert.equal(revision.ID,'201');assert.equal(revision.post_type,'revision');assert.equal(revision.post_status,'inherit');assert.equal(revision.post_parent,'193');assert.equal(revision.post_author,'1');assert.equal(revision.post_content,owner.expectedContent);
   assert.deepEqual(newPosts.filter(p=>p.ID!=='201'),oldPosts);
  }else{assert.deepEqual(newPosts,oldPosts);assert.equal(pa.content,pb.content);}
  for(const f of [a,b]){const p=page(f);assert.equal(p.meta.wordpress.id,193);assert.equal(p.meta.wordpress.status,'draft');}
  const changedMeta=Object.keys(pb.meta.wordpress).filter(k=>JSON.stringify(pa.meta.wordpress[k])!==JSON.stringify(pb.meta.wordpress[k]));assert.ok(changedMeta.every(k=>['date','modified','modified_gmt'].includes(k)));
  for(const [p,expected]of [[pa,from==='before'?owner.expectedBefore.content:owner.expectedContent],[pb,owner.expectedContent]]){const n=Buffer.byteLength(expected);assert.equal(p.meta.__playtt_content,'v1:'+n+':'+hash(expected));assert.equal(p.content,'\n'+expected+'\n');}
  if(from==='before')pb.meta.__playtt_content=pa.meta.__playtt_content;
  for(const k of changedMeta)pb.meta.wordpress[k]=pa.meta.wordpress[k];assert.deepEqual(pb.meta,pa.meta);
  const counters=f=>JSON.parse(f.get('_runtime/playtt-auto-increment.json').toString());const ca=counters(a),cb=counters(b);assert.deepEqual(Object.keys(ca).sort(),Object.keys(cb).sort());assert.deepEqual(Object.keys(ca.sequences).sort(),Object.keys(cb.sequences).sort());
  for(const k of Object.keys(ca.sequences))assert.ok(BigInt(cb.sequences[k])>=BigInt(ca.sequences[k]));
  return{from,to,fromVersion:contents[from].state.version,toVersion:contents[to].state.version,changed,tables,pageBodyExact:pa.content===pb.content,pageMetadataFields:changedMeta,revisionIdsBefore:revisions(a),revisionIdsAfter:revisions(b),mediaAndThemeExact:true,exactUnrelatedCanonicalRowsAndFiles:true,monotonicCounters:true};
 };
 const pairs=[['before','fault'],...(contents.retry?[['fault','retry'],['retry','final']]:[['fault','final']])];
 const log=await readFile('artifacts/'+prefix+'-run-private.log','utf8'),lines=log.split(/\r?\n/).filter(s=>s.startsWith('{')).flatMap(s=>{try{return[JSON.parse(s)];}catch{return[];}});
 const traces=lines.filter(x=>x.schema==='wp-codebox/cloudflare-runtime-phase-trace/v1'),packs=lines.filter(x=>x.schema==='playtt-snapshot-phase/v1'&&x.stage==='encode-and-upload');
 if(contents.retry){for(const key of ['manualRetryClicked','savedNoticeObserved','errorNoticeCleared','errorNoticeObserved','contentRetained','firstTabClosed','coldVisualContentRetained','coldSameSession','coldContentBytesExact','coldTabClosed'])assert.equal(browser[key],true,key);assert.equal(server.restarts,1);}
 else{assert.equal(browser.manualRetryClicked,false);assert.equal(browser.saveDisabledLaterWithErrorStillVisible,true);assert.equal(browser.tabClosed,true);}
 const firstEvent=browser.events[0];if(prefix.endsWith('-retry')){firstEvent.type='first-save-click-attempt-no-match';firstEvent.result='Button already saved; fresh DOM and null fault receipt checked, no duplicate click';browser.harnessObservationError='A missing temporary DOM variable interrupted observation after the injected save. Fresh DOM verified failure; the subsequent single retry click succeeded.';}
 reports.push({attempt:prefix,marker:owner.marker,server:{localProcessesDisposed:server.localProcessesDisposed,outboundAttempts:server.outboundAttempts,restarts:server.restarts,stopReason:server.stopReason,versions:server.observations.map(x=>({label:x.label,version:x.state.version}))},browser,comparisons:pairs.map(([a,b])=>compare(a,b)),telemetry:{traces:traces.length,completedTraces:traces.filter(x=>x.completed).length,fullPacks:packs.length,fullPackBytes:packs.reduce((n,x)=>n+x.bytes,0),requestFailures:lines.filter(x=>x.schema==='playtt-request-failure/v1').length}});
}
const result={at:new Date().toISOString(),result:'pass',scope:'Offline exact comparison of local native UI snapshots; no remote calls',staleErrorWithSavedButtonRemainsOpen:true,remoteProviderFaultTested:false,attempts:reports};
await writeFile('artifacts/playtt-response-loss-ui-inspection.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result));
