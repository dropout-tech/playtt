import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {parse as yaml} from 'yaml';
import {openSnapshotBundle} from './playtt-snapshot-bundle.mjs';
import {registerBackupPin} from './playtt-backup-pin-client.mjs';
assert.ok(process.argv.includes('--remote'));
const prefix='artifacts/playtt-editor-lock-backup-',origin='https://playtt-wp-free-session-audit.muzhi-garden-platform.workers.dev';
const load=async p=>JSON.parse(await readFile(p,'utf8')),save=(p,v)=>writeFile(p,JSON.stringify(v,null,2)+'\n'),sha=b=>createHash('sha256').update(b).digest('hex');
const owner=await load(prefix+'owned-private.json'),ui=await load('artifacts/playtt-editor-lock-ui-owned-private.json');assert.equal(owner.phase,'independent-copy-verified-awaiting-diff');assert.equal(ui.phase,'closed-sealed');
const old=await openSnapshotBundle(owner.baselineDirectory,owner.baseline),next=await openSnapshotBundle(owner.directory+'/independent',owner.anchor),a=old.graph.contents,z=next.graph.contents;
for(const k of ['uploads','wpContent','wpContentDeleted'])assert.deepEqual(z[k],a[k]);
const x=new Map(a.markdown.map(f=>[f.path,f.bytes])),y=new Map(z.markdown.map(f=>[f.path,f.bytes]));assert.deepEqual([...x.keys()].sort(),[...y.keys()].sort());
const pagePath='page/'+ui.expectedBefore.slug+'.md';
const changed=[...y].filter(([p,b])=>sha(b)!==sha(x.get(p))).map(([p])=>p);assert.deepEqual(changed.sort(),['_runtime/playtt-auto-increment.json','_tables/postmeta.json','_tables/posts.json','_tables/usermeta.json',pagePath].sort());
function page(bytes){const raw=new TextDecoder('utf-8',{fatal:true}).decode(bytes),end=raw.indexOf('\n---\n',4);assert.ok(raw.startsWith('---\n')&&end>4);const meta=yaml(raw.slice(4,end)),marker=/^v1:(\d+):([a-f0-9]{64})$/.exec(meta.__playtt_content);assert.ok(marker);const length=Number(marker[1]);assert.ok(length<bytes.length-1&&bytes.at(-1)===10);const body=bytes.subarray(bytes.length-1-length,bytes.length-1);assert.equal(sha(body),marker[2]);return{meta,body:new TextDecoder('utf-8',{fatal:true}).decode(body)};}
const oldPage=page(x.get(pagePath)),newPage=page(y.get(pagePath));assert.equal(oldPage.body,ui.expectedBefore.content);assert.equal(newPage.body,ui.expectedAfter.content);
assert.deepEqual({...newPage.meta,__playtt_content:oldPage.meta.__playtt_content,wordpress:{...newPage.meta.wordpress,date:oldPage.meta.wordpress.date,modified:oldPage.meta.wordpress.modified,modified_gmt:oldPage.meta.wordpress.modified_gmt}},oldPage.meta);
assert.equal(newPage.meta.wordpress.id,193);assert.equal(newPage.meta.wordpress.status,'draft');
for(const key of ['date','modified','modified_gmt']){assert.match(newPage.meta.wordpress[key],/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);assert.ok(newPage.meta.wordpress[key]>=oldPage.meta.wordpress[key]);}
const table=(files,p)=>JSON.parse(new TextDecoder().decode(files.get(p))),beforePosts=table(x,'_tables/posts.json'),afterPosts=table(y,'_tables/posts.json');assert.equal(afterPosts.length,beforePosts.length+1);
for(const row of beforePosts)assert.deepEqual(afterPosts.find(r=>r.ID===row.ID),row);
const date=newPage.meta.wordpress.modified;
assert.deepEqual(afterPosts.find(r=>r.ID==='200'),{ID:'200',post_author:'2',post_date:date,post_date_gmt:date,post_content:ui.expectedAfter.content,post_title:ui.expectedBefore.title,post_excerpt:'',post_status:'inherit',comment_status:'closed',ping_status:'closed',post_password:'',post_name:'193-revision-v1',to_ping:'',pinged:'',post_modified:date,post_modified_gmt:date,post_content_filtered:'',post_parent:'193',guid:origin+'/?p=200',menu_order:'0',post_type:'revision',post_mime_type:'',comment_count:'0'});
for(const [path,id]of [['_tables/postmeta.json','meta_id'],['_tables/usermeta.json','umeta_id']]){
 const before=table(x,path),after=table(y,path);assert.equal(before.length,after.length);
 for(const row of before){const now=after.find(r=>r[id]===row[id]);assert.ok(now);
  if(path==='_tables/postmeta.json'&&row.meta_id==='72'){
   assert.equal(row.post_id,'193');assert.equal(row.meta_key,'_edit_lock');assert.deepEqual({...now,meta_value:row.meta_value},row);assert.match(now.meta_value,/^\d+:[12]$/);
  }else if(path==='_tables/usermeta.json'&&row.umeta_id==='38'){
   assert.equal(row.user_id,'2');assert.equal(row.meta_key,'wp_persisted_preferences');assert.deepEqual({...now,meta_value:row.meta_value},row);
   const stamp=/s:9:"_modified";s:24:"(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z)";/.exec(now.meta_value)?.[1];assert.ok(stamp);
   assert.equal(row.meta_value,'a:3:{s:4:"core";a:1:{s:26:"isComplementaryAreaVisible";b:1;}s:14:"core/edit-post";a:1:{s:12:"welcomeGuide";b:0;}s:9:"_modified";s:24:"2026-11-20T19:14:31.623Z";}');
   assert.equal(now.meta_value,'a:4:{s:4:"core";a:2:{s:26:"isComplementaryAreaVisible";b:1;s:10:"editorMode";s:6:"visual";}s:14:"core/edit-post";a:1:{s:12:"welcomeGuide";b:0;}s:9:"_modified";s:24:"'+stamp+'";s:13:"core/commands";a:1:{s:12:"recentlyUsed";a:1:{i:0;s:23:"core/toggle-code-editor";}}}');
   assert.ok(stamp>='2026-11-20T19:14:31.623Z');
  }else assert.deepEqual(now,row);
 }
}
const beforeSeq=table(x,'_runtime/playtt-auto-increment.json'),afterSeq=table(y,'_runtime/playtt-auto-increment.json');assert.deepEqual(Object.keys(beforeSeq).sort(),Object.keys(afterSeq).sort());assert.deepEqual(Object.keys(beforeSeq.sequences).sort(),Object.keys(afterSeq.sequences).sort());for(const[key,value]of Object.entries(beforeSeq.sequences))assert.ok(BigInt(afterSeq.sequences[key])>=BigInt(value));
const secrets=await load('../../../playtt-cms-secrets.json');async function request(path,options={}){assert.ok(path.startsWith('/')&&!path.startsWith('//'));return fetch(origin+path,{...options,headers:{authorization:'Bearer '+secrets.WORDPRESS_OPERATOR_TOKEN,'X-Playtt-Probe':secrets.WORDPRESS_OPERATOR_TOKEN,'content-type':'application/json',...options.headers},signal:AbortSignal.timeout(45000),redirect:'error'});}
async function json(path,body){const r=await request(path,{method:body?'POST':'GET',body:body?JSON.stringify(body):undefined});assert.equal(r.status,200);return r.json();}
const op=(phase,body)=>json('/?phase=operator-'+phase,body),state=await op('fence-status'),budget=await json('/__playtt-capacity'),pins=await json('/__playtt-backup-pins');assert.equal(state.state.version,94);assert.equal(state.state.pointer.revision,owner.anchor.revision);assert.equal(state.fence.active,false);assert.equal(state.coherent,true);assert.equal(budget.writeTracking.pending,0);assert.equal(budget.writeTracking.sealed,true);assert.equal(budget.writeTracking.window.closed,true);assert.equal(pins.generation,6);assert.equal((await json('/__playtt-publishing')).state,'paused');
const report={at:new Date().toISOString(),result:'pending',canonicalVersion:94,anchor:owner.anchor,files:298,objects:next.graph.objects.length,unchangedFiles:293,changedFiles:changed,ownedDraft193ExactExpectedContent:true,addedRevision200Exact:true,priorRevisionsAndAutosavesUnchanged:true,onlyEditor2CommandPreferencesChanged:true,sessionsAndAccountsExact:true,otherPostsMediaAndThemeExact:true,nativeTakeoverSaveReloadAccepted:true,visualCanvasAccepted:false,independentCopyVerified:true};
try{const fence=await op('fence-acquire',{ttlSeconds:600});owner.fenceToken=fence.token;owner.fenceReleased=false;owner.phase='pinning';await save(prefix+'owned-private.json',owner);
 const receipt=await registerBackupPin(request,secrets.WORDPRESS_OPERATOR_TOKEN,fence.token,owner.anchor);assert.equal(receipt.generation,7);await save(owner.directory+'/export/retention-pin.json',receipt);
 assert.deepEqual((await op('fence-status')).state,state.state);const afterBudget=await json('/__playtt-capacity');assert.equal(afterBudget.chargedBytes,budget.chargedBytes);assert.equal(afterBudget.chargedPuts,budget.chargedPuts);assert.equal(afterBudget.writeTracking.pending,0);const afterPins=await json('/__playtt-backup-pins');assert.equal(afterPins.generation,7);for(const p of pins.pins)assert.deepEqual(afterPins.pins.find(n=>n.revision===p.revision),p);report.finalPins=7;report.canonicalAndAccountingUnchanged=true;report.result='pass';owner.phase='verified';
}catch(e){report.result='fail';report.errorName=e.name;process.exitCode=1;}
finally{if(owner.fenceReleased===false){await op('fence-release',{token:owner.fenceToken});owner.fenceReleased=true;}await save(prefix+'owned-private.json',owner);report.fenceReleased=owner.fenceReleased;await save(prefix+'result.json',report);console.log(JSON.stringify(report));}
