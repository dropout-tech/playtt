import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {randomUUID,createHash} from 'node:crypto';
assert.ok(process.argv.includes('--local'));assert.ok(!process.argv.includes('--remote'));
const mode=process.argv.find(a=>a.startsWith('--mode='))?.slice(7);assert.ok(['prepare','verify','cleanup'].includes(mode));
const origin='http://127.0.0.1:9429',operator='playtt-cms-local-only-operator',cookies=new Map(),checks=[];let nonce;
const file='artifacts/playtt-maintenance-owned-private.json';
const endpoint='/?phase=operator-auto-draft-maintenance';
async function req(path,options={}){const h=new Headers(options.headers);h.set('cookie',[...cookies.values()].join('; '));const start=Date.now(),r=await fetch(origin+path,{...options,headers:h,redirect:'manual',signal:AbortSignal.timeout(90000)});for(const raw of r.headers.getSetCookie()){const v=raw.split(';')[0];cookies.set(v.split('=')[0],v);}checks.push({path,method:options.method||'GET',status:r.status,wallMs:Date.now()-start});return r;}
async function api(path,body,method=body?'POST':'GET'){const r=await req('/wp-json/wp/v2/'+path,{method,headers:{'x-wp-nonce':nonce,'content-type':'application/json'},body:body?JSON.stringify(body):undefined});assert.equal(r.status,method==='POST'&&path==='pages'?201:200,'REST '+path);return r.json();}
async function maintenance(action){const r=await req(endpoint,{method:'POST',headers:{authorization:'Bearer '+operator,'content-type':'application/json'},body:JSON.stringify({action})});assert.equal(r.status,200,'Maintenance '+action);assert.equal(r.headers.get('cache-control'),'no-store');return r.json();}
async function paused(){const r=await req('/__playtt-publishing',{headers:{authorization:'Bearer '+operator}});assert.equal(r.status,200);assert.equal((await r.json()).state,'paused');}
async function state(){const r=await req('/?phase=operator-fence-status',{headers:{authorization:'Bearer '+operator}});assert.equal(r.status,200);return(await r.json()).state;}
const record=p=>({id:p.id,status:p.status,title:p.title.raw,content:p.content.raw,date:p.date});
async function get(owned){const p=record(await api('pages/'+owned.id+'?context=edit'));assert.deepEqual(p,owned);return p;}
async function remove(owned){await get(owned);assert.equal((await api('pages/'+owned.id+'?force=true',undefined,'DELETE')).deleted,true);}
async function publishedHash(){return createHash('sha256').update(JSON.stringify((await api('pages?context=edit&status=publish&per_page=100')).map(record).sort((a,b)=>a.id-b.id))).digest('hex');}
await paused();await req('/wp-login.php');assert.equal((await req('/wp-login.php',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({log:'admin',pwd:'playtt-cms-local-only-password',testcookie:'1',redirect_to:origin+'/wp-admin/'})})).status,302);
nonce=(await(await req('/wp-admin/')).text()).match(/"nonce":"([^"]+)"/)?.[1];assert.ok(nonce);
let saved;try{saved=JSON.parse(await readFile(file,'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}
if(mode==='prepare'){
 assert.ok(!saved||saved.cleanupComplete,'Existing owned fixture must be resolved first');
 const before=await state();
 const denied=[{method:'GET',headers:{authorization:'Bearer '+operator},expected:405},{method:'POST',headers:{'content-type':'application/json'},body:'{"action":"run"}',expected:401},{method:'POST',headers:{authorization:'Bearer '+operator,'content-type':'application/json'},body:'{"action":"run","ids":[1]}',expected:400},{method:'POST',headers:{authorization:'Bearer '+operator,'content-type':'application/json'},body:'x'.repeat(257),expected:400}];
 for(const input of denied){const r=await req(endpoint,input);assert.equal(r.status,input.expected);assert.equal(r.headers.get('cache-control'),'no-store');await r.arrayBuffer();}
 assert.deepEqual(await state(),before,'Rejected inputs must not change canonical pointer');await paused();
 const preview=await maintenance('preview');assert.equal(preview.eligibleBefore,0,'Do not clean unrelated existing expired auto-drafts');
 saved={marker:'PLAYTT_MAINTENANCE_'+randomUUID(),beforeHash:await publishedHash(),owned:[],initialPreview:preview};await writeFile(file,JSON.stringify(saved));
 const daysAgo=n=>new Date(Date.now()-n*86400000).toISOString().slice(0,19);
 async function own(p,label){const item={...record(p),label};saved.owned.push(item);await writeFile(file,JSON.stringify(saved));return item;}
 async function native(label,days){const path='pages?context=edit&status=auto-draft&per_page=100',prior=new Set((await api(path)).map(p=>p.id));const r=await req('/wp-admin/post-new.php?post_type=page');assert.equal(r.status,200);await r.arrayBuffer();const added=(await api(path)).filter(p=>!prior.has(p.id));assert.equal(added.length,1);await own(added[0],label);const p=await api('pages/'+added[0].id,{title:saved.marker+'_'+label,date:daysAgo(days)});assert.equal(p.status,'auto-draft','Date-only fixture update must retain native status');saved.owned[saved.owned.length-1]={...record(p),label};await writeFile(file,JSON.stringify(saved));}
 await native('recent_auto',1);
 for(const [label,status]of [['old_draft','draft'],['old_published','publish']])await own(await api('pages',{title:saved.marker+'_'+label,content:'<!-- wp:paragraph --><p>'+saved.marker+'</p><!-- /wp:paragraph -->',status,date:daysAgo(9)}),label);
 await native('old_auto',9);
 const old=saved.owned.find(p=>p.label==='old_auto');
 const plan=await maintenance('preview');assert.deepEqual(plan.selectedIds,[old.id]);assert.deepEqual(plan.deletedIds,[]);for(const {label,...p}of saved.owned)await get(p);
 const run=await maintenance('run');assert.deepEqual(run.deletedIds,[old.id]);assert.equal(run.remainingEligible,0);assert.deepEqual(run.skippedIds,[]);
 const removed=await req('/wp-json/wp/v2/pages/'+old.id+'?context=edit',{headers:{'x-wp-nonce':nonce}});assert.equal(removed.status,404);
 for(const {label,...p}of saved.owned.filter(p=>p!==old))await get(p);
 const again=await maintenance('run');assert.equal(again.eligibleBefore,0);assert.deepEqual(again.deletedIds,[]);await paused();
 saved.removedId=old.id;saved.prepared=true;await writeFile(file,JSON.stringify(saved));
 const report={at:new Date().toISOString(),result:'prepared',scope:'Local real WordPress native auto-draft cleanup only; all old/fresh/draft/published fixtures are owned. Restart server before verify.',rejectedInputs:denied.length,plan,run,secondRun:again,protectedIds:saved.owned.filter(p=>p!==old).map(p=>p.id),checks};await writeFile('artifacts/playtt-maintenance-local-prepare.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({result:'prepared',removedId:old.id,protectedIds:report.protectedIds}));
}else{
 assert.ok(saved&&!saved.cleanupComplete);assert.match(saved.marker,/^PLAYTT_MAINTENANCE_[a-f0-9-]{36}$/);
 if(mode==='verify'){
  assert.ok(saved.prepared);for(const {label,...p}of saved.owned.filter(p=>p.id!==saved.removedId))await get(p);
  const p=await api('pages',{title:saved.marker+'_after_restart',content:'',status:'draft'});saved.after=record(p);await writeFile(file,JSON.stringify(saved));assert.ok(p.id>saved.removedId);
  const stale=await req('/wp-json/wp/v2/pages/'+saved.removedId,{method:'POST',headers:{'content-type':'application/json','x-wp-nonce':nonce},body:JSON.stringify({content:'stale-owned-test'})});assert.equal(stale.status,404);await get(saved.after);await paused();
 }
 if(saved.after)await remove(saved.after);
 for(const {label,...p}of saved.owned){if(p.id===saved.removedId)continue;await remove(p);}
 assert.equal(await publishedHash(),saved.beforeHash);await paused();saved.cleanupComplete=true;await writeFile(file,JSON.stringify(saved));
 const report={at:new Date().toISOString(),result:'pass',mode,scope:mode==='verify'?'Local real WordPress cold readback of protected fixtures, monotonic ID, stale-ID 404 and identity-checked owned cleanup':'Identity-checked owned cleanup only; no cold readback/ID-continuity claim',removedId:saved.removedId,newId:saved.after?.id,protectedRecordsRetained:mode==='verify',ownedDataRemoved:true,originalPublishedPagesUnchanged:true,publisherPaused:true,checks};await writeFile('artifacts/playtt-maintenance-local-'+mode+'.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({...report,checks:checks.length}));
}
