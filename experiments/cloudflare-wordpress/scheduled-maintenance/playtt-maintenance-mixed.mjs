import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {randomUUID,createHash} from 'node:crypto';
const remote=process.argv.includes('--remote');assert.notEqual(remote,process.argv.includes('--local'));
const mode=process.argv.find(a=>a.startsWith('--mode='))?.slice(7);assert.ok(['prepare','verify'].includes(mode));
const label=remote?'remote':'local',origin=remote?'https://playtt-wp-free-restore-audit.muzhi-garden-platform.workers.dev':'http://127.0.0.1:9429';
const secrets=remote?JSON.parse(await readFile('../../../playtt-cms-secrets.json','utf8')):{WORDPRESS_OPERATOR_TOKEN:'playtt-cms-local-only-operator',WORDPRESS_ADMIN_PASSWORD:'playtt-cms-local-only-password'};
const cookies=new Map(),checks=[],file='artifacts/playtt-maintenance-mixed-'+label+'-owned-private.json';let nonce,saved;
const record=p=>({id:p.id,status:p.status,title:p.title.raw,content:p.content.raw,date:p.date});
const save=()=>writeFile(file,JSON.stringify(saved));
async function req(path,options={}){
 const headers=new Headers(options.headers);headers.set('x-playtt-probe',secrets.WORDPRESS_OPERATOR_TOKEN);headers.set('cookie',[...cookies.values()].join('; '));
 const started=Date.now(),r=await fetch(origin+path,{...options,headers,redirect:'manual',signal:AbortSignal.timeout(120000)});
 if(remote)assert.equal(r.headers.get('x-playtt-probe-state'),'restore-v1');
 for(const raw of r.headers.getSetCookie()){const v=raw.split(';')[0];cookies.set(v.split('=')[0],v);}
 checks.push({path,method:options.method||'GET',status:r.status,wallMs:Date.now()-started});return r;
}
async function rawApi(path,body,method=body?'POST':'GET'){
 const r=await req('/wp-json/wp/v2/'+path,{method,headers:{'x-wp-nonce':nonce,'content-type':'application/json'},body:body?JSON.stringify(body):undefined});
 return {status:r.status,version:Number(r.headers.get('x-wp-codebox-canonical-version')),body:await r.json()};
}
async function api(path,body,method=body?'POST':'GET'){const r=await rawApi(path,body,method);assert.equal(r.status,method==='POST'&&path==='pages'?201:200);return r.body;}
async function maintenance(action){const r=await req('/?phase=operator-auto-draft-maintenance',{method:'POST',headers:{authorization:'Bearer '+secrets.WORDPRESS_OPERATOR_TOKEN,'content-type':'application/json'},body:JSON.stringify({action})});assert.equal(r.status,200);return {version:Number(r.headers.get('x-wp-codebox-canonical-version')),body:await r.json()};}
async function paused(){const r=await req('/__playtt-publishing',{headers:{authorization:'Bearer '+secrets.WORDPRESS_OPERATOR_TOKEN}});assert.equal(r.status,200);assert.equal((await r.json()).state,'paused');}
async function get(item){assert.deepEqual(record(await api('pages/'+item.id+'?context=edit')),item);}
async function gone(id){const r=await rawApi('pages/'+id+'?context=edit');assert.equal(r.status,404);}
async function publishedHash(){return createHash('sha256').update(JSON.stringify((await api('pages?context=edit&status=publish&per_page=100')).map(record).sort((a,b)=>a.id-b.id))).digest('hex');}
await paused();await req('/wp-login.php');assert.equal((await req('/wp-login.php',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({log:'admin',pwd:secrets.WORDPRESS_ADMIN_PASSWORD,testcookie:'1',redirect_to:origin+'/wp-admin/'})})).status,302);
nonce=(await(await req('/wp-admin/')).text()).match(/"nonce":"([^"]+)"/)?.[1];assert.ok(nonce);
try{saved=JSON.parse(await readFile(file,'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}
if(mode==='prepare'){
 assert.ok(!saved||saved.cleanupComplete,'Resolve existing owned fixtures before another prepare');
 assert.equal((await maintenance('preview')).body.eligibleBefore,0,'Refuse unrelated expired auto-drafts');
 saved={marker:'PLAYTT_MIXED_'+randomUUID(),beforeHash:await publishedHash(),owned:[],removed:[],rounds:[]};await save();
 async function own(p){const item=record(p);saved.owned.push(item);await save();return item;}
 async function oldAuto(suffix){
  const path='pages?context=edit&status=auto-draft&per_page=100',before=new Set((await api(path)).map(p=>p.id));
  const r=await req('/wp-admin/post-new.php?post_type=page');assert.equal(r.status,200);await r.arrayBuffer();
  const added=(await api(path)).filter(p=>!before.has(p.id));assert.equal(added.length,1);await own(added[0]);
  const updated=record(await api('pages/'+added[0].id,{title:saved.marker+'_'+suffix,date:new Date(Date.now()-9*86400000).toISOString().slice(0,19)}));assert.equal(updated.status,'auto-draft');
  saved.owned[saved.owned.length-1]=updated;await save();return updated;
 }
 const draft=await own(await api('pages',{title:saved.marker+'_saved_draft',content:'<!-- wp:paragraph --><p>'+saved.marker+'_v1</p><!-- /wp:paragraph -->',status:'draft'}));
 const first=await oldAuto('unrelated_old_auto');
 const editBody={content:'<!-- wp:paragraph --><p>'+saved.marker+'_v2</p><!-- /wp:paragraph -->'};saved.intent={id:draft.id,body:editBody};await save();
 const [edit,cleanup]=await Promise.all([rawApi('pages/'+draft.id,editBody),maintenance('run')]);
 assert.equal(edit.status,200);saved.owned[0]=record(edit.body);saved.removed.push(...cleanup.body.deletedIds);await save();
 assert.equal(edit.body.content.raw,editBody.content);assert.deepEqual(cleanup.body.deletedIds,[first.id]);assert.notEqual(edit.version,cleanup.version);
 await get(saved.owned[0]);await gone(first.id);
 saved.rounds.push({kind:'independent-draft-edit-and-cleanup',editVersion:edit.version,maintenanceVersion:cleanup.version,editedId:draft.id,deletedIds:cleanup.body.deletedIds});await save();
 for(const order of ['edit-dispatched-first','cleanup-dispatched-first']){
  const old=await oldAuto(order),body={status:'draft',content:'<!-- wp:paragraph --><p>'+saved.marker+'_'+order+'</p><!-- /wp:paragraph -->'};
  saved.intent={id:old.id,body};await save();
  let editPromise,cleanupPromise;
  if(order==='edit-dispatched-first'){editPromise=rawApi('pages/'+old.id,body);cleanupPromise=maintenance('run');}
  else{cleanupPromise=maintenance('run');editPromise=rawApi('pages/'+old.id,body);}
  const [e,c]=await Promise.all([editPromise,cleanupPromise]);
  let outcome;
  if(e.status===200){
   assert.equal(e.body.status,'draft');assert.equal(e.body.content.raw,body.content);assert.deepEqual(c.body.deletedIds,[]);
   const item=record(e.body);saved.owned[saved.owned.findIndex(p=>p.id===old.id)]=item;await save();await get(item);outcome='promotion-committed-first-and-retained';
  }else{
   assert.equal(e.status,404);assert.deepEqual(c.body.deletedIds,[old.id]);saved.removed.push(old.id);await save();await gone(old.id);outcome='cleanup-committed-first-and-edit-rejected';
  }
  assert.notEqual(e.version,c.version);await get(saved.owned[0]);
  saved.rounds.push({kind:'same-expired-auto-draft',dispatchOrder:order,id:old.id,outcome,editStatus:e.status,editVersion:e.version,maintenanceVersion:c.version,deletedIds:c.body.deletedIds});await save();
 }
 assert.equal((await maintenance('preview')).body.eligibleBefore,0);await paused();saved.prepared=true;delete saved.intent;await save();
 const report={at:new Date().toISOString(),result:'prepared',label,scope:'Concurrent HTTP edit and maintenance on owned real WordPress fixtures; dispatch order is not a promise of commit order. Restart/redeploy before verify.',rounds:saved.rounds,retainedIds:saved.owned.filter(p=>!saved.removed.includes(p.id)).map(p=>p.id),removedIds:saved.removed,checks};
 await writeFile('artifacts/playtt-maintenance-mixed-'+label+'-prepare.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({...report,checks:checks.length}));
}else{
 assert.ok(saved?.prepared&&!saved.cleanupComplete);assert.match(saved.marker,/^PLAYTT_MIXED_[a-f0-9-]{36}$/);
 for(const p of saved.owned)if(saved.removed.includes(p.id))await gone(p.id);else await get(p);
 const p=record(await api('pages',{title:saved.marker+'_after_rebuild',content:'',status:'draft'}));saved.after=p;await save();assert.ok(p.id>Math.max(...saved.owned.map(p=>p.id)));
 const stale=await rawApi('pages/'+Math.max(...saved.removed),{content:'stale-owned-mixed-test'});assert.equal(stale.status,404);await get(p);
 for(const item of [...saved.owned.filter(p=>!saved.removed.includes(p.id)),p]){await get(item);assert.equal((await api('pages/'+item.id+'?force=true',undefined,'DELETE')).deleted,true);}
 assert.equal(await publishedHash(),saved.beforeHash);await paused();saved.cleanupComplete=true;await save();
 const report={at:new Date().toISOString(),result:'pass',label,scope:'Cold reconstruction of concurrent edit/cleanup outcomes, monotonic ID, stale-ID rejection and identity-checked cleanup',rounds:saved.rounds,newId:p.id,highestPreviouslyOwned:Math.max(...saved.owned.map(p=>p.id)),retainedRecordsMatch:true,removedRecords404:true,staleIdWrite404:true,originalPublishedPagesUnchanged:true,ownedDataRemoved:true,publisherPaused:true,checks};
 await writeFile('artifacts/playtt-maintenance-mixed-'+label+'-verify.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({...report,checks:checks.length}));
}
