import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {openSnapshotBundle} from './playtt-snapshot-bundle.mjs';
import {registerBackupPin} from './playtt-backup-pin-client.mjs';
assert.ok(process.argv.includes('--remote'));
const prefix='artifacts/playtt-session-lock-backup-',origin='https://playtt-wp-free-session-audit.muzhi-garden-platform.workers.dev';
const load=async p=>JSON.parse(await readFile(p,'utf8')),save=(p,v)=>writeFile(p,JSON.stringify(v,null,2)+'\n'),sha=b=>createHash('sha256').update(b).digest('hex');
const owner=await load(prefix+'owned-private.json');assert.equal(owner.phase,'independent-copy-verified-awaiting-diff');
const old=await openSnapshotBundle(owner.baselineDirectory,owner.baseline),next=await openSnapshotBundle(owner.directory+'/independent',owner.anchor),a=old.graph.contents,z=next.graph.contents;
for(const k of ['uploads','wpContent','wpContentDeleted'])assert.deepEqual(z[k],a[k]);
const x=new Map(a.markdown.map(f=>[f.path,f.bytes])),y=new Map(z.markdown.map(f=>[f.path,f.bytes]));assert.deepEqual([...x.keys()].sort(),[...y.keys()].sort());
const changed=[...y].filter(([p,b])=>sha(b)!==sha(x.get(p))).map(([p])=>p);assert.deepEqual(changed.sort(),['_runtime/playtt-auto-increment.json','_tables/postmeta.json','_tables/posts.json','_tables/usermeta.json'].sort());
const table=(files,p)=>JSON.parse(new TextDecoder().decode(files.get(p))),beforePosts=table(x,'_tables/posts.json'),afterPosts=table(y,'_tables/posts.json');assert.equal(beforePosts.length,afterPosts.length);
const dateKeys=['post_date','post_date_gmt','post_modified','post_modified_gmt'];
for(const before of beforePosts){const after=afterPosts.find(r=>r.ID===before.ID);assert.ok(after);if(before.ID==='198'){assert.equal(before.post_parent,'193');assert.equal(before.post_type,'revision');assert.equal(before.post_author,'2');assert.equal(before.post_name,'193-autosave-v1');for(const k of dateKeys){assert.match(after[k],/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);assert.ok(after[k]>=before[k]);}assert.deepEqual({...after,...Object.fromEntries(dateKeys.map(k=>[k,before[k]]))},before);}else assert.deepEqual(after,before);}
for(const [path,id]of [['_tables/postmeta.json','meta_id'],['_tables/usermeta.json','umeta_id']]){
 const b=table(x,path),c=table(y,path);assert.equal(b.length,c.length);
 for(const row of b){const now=c.find(r=>r[id]===row[id]);assert.ok(now);
  const allowed=path==='_tables/postmeta.json'?row.post_id==='193'&&row.meta_key==='_edit_lock':['1','2'].includes(row.user_id)&&row.meta_key==='session_tokens';
  if(allowed){assert.deepEqual({...now,meta_value:row.meta_value},row);if(path==='_tables/postmeta.json')assert.match(now.meta_value,/^\d+:[12]$/);}else assert.deepEqual(now,row);
 }
}
const beforeSeq=table(x,'_runtime/playtt-auto-increment.json'),afterSeq=table(y,'_runtime/playtt-auto-increment.json');assert.deepEqual(Object.keys(beforeSeq).sort(),Object.keys(afterSeq).sort());assert.deepEqual(Object.keys(beforeSeq.sequences).sort(),Object.keys(afterSeq.sequences).sort());for(const [key,value]of Object.entries(beforeSeq.sequences))assert.ok(BigInt(afterSeq.sequences[key])>=BigInt(value));
const secrets=await load('../../../playtt-cms-secrets.json');async function request(path,options={}){assert.ok(path.startsWith('/')&&!path.startsWith('//'));return fetch(origin+path,{...options,headers:{authorization:'Bearer '+secrets.WORDPRESS_OPERATOR_TOKEN,'X-Playtt-Probe':secrets.WORDPRESS_OPERATOR_TOKEN,'content-type':'application/json',...options.headers},signal:AbortSignal.timeout(45000),redirect:'error'});}
async function json(path,body){const r=await request(path,{method:body?'POST':'GET',body:body?JSON.stringify(body):undefined});assert.equal(r.status,200);return r.json();}
const op=(phase,body)=>json('/?phase=operator-'+phase,body),state=await op('fence-status'),budget=await json('/__playtt-capacity'),pins=await json('/__playtt-backup-pins');assert.equal(state.state.version,43);assert.equal(state.state.pointer.revision,owner.anchor.revision);assert.equal(state.fence.active,false);assert.equal(state.coherent,true);assert.equal(budget.writeTracking.pending,0);assert.equal(budget.writeTracking.sealed,true);assert.equal(budget.writeTracking.window.closed,true);assert.equal(pins.generation,5);assert.equal((await json('/__playtt-publishing')).state,'paused');
const report={at:new Date().toISOString(),result:'pending',canonicalVersion:43,anchor:owner.anchor,files:298,objects:next.graph.objects.length,unchangedFiles:294,changedFiles:changed,originalDraftAndAccountsExact:true,autosave198OnlyFourDatesChanged:true,existingSessionValuesOnly:true,mediaAndThemeExact:true,newContentTyped:false,nativeTakeoverAccepted:false,independentCopyVerified:true};
try{const fence=await op('fence-acquire',{ttlSeconds:600});owner.fenceToken=fence.token;owner.fenceReleased=false;owner.phase='pinning';await save(prefix+'owned-private.json',owner);
 const receipt=await registerBackupPin(request,secrets.WORDPRESS_OPERATOR_TOKEN,fence.token,owner.anchor);assert.equal(receipt.generation,6);await save(owner.directory+'/export/retention-pin.json',receipt);
 assert.deepEqual((await op('fence-status')).state,state.state);const afterBudget=await json('/__playtt-capacity');assert.equal(afterBudget.chargedBytes,budget.chargedBytes);assert.equal(afterBudget.chargedPuts,budget.chargedPuts);assert.equal(afterBudget.writeTracking.pending,0);const afterPins=await json('/__playtt-backup-pins');assert.equal(afterPins.generation,6);for(const p of pins.pins)assert.deepEqual(afterPins.pins.find(n=>n.revision===p.revision),p);report.finalPins=6;report.canonicalAndAccountingUnchanged=true;report.result='pass';owner.phase='verified';
}catch(e){report.result='fail';report.errorName=e.name;process.exitCode=1;}
finally{if(owner.fenceReleased===false){await op('fence-release',{token:owner.fenceToken});owner.fenceReleased=true;}await save(prefix+'owned-private.json',owner);report.fenceReleased=owner.fenceReleased;await save(prefix+'result.json',report);console.log(JSON.stringify(report));}
