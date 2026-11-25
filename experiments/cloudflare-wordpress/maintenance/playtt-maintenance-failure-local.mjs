import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {randomUUID,createHash} from 'node:crypto';
assert.ok(process.argv.includes('--local'));assert.ok(!process.argv.includes('--remote'));
const mode=process.argv.find(a=>a.startsWith('--mode='))?.slice(7);assert.ok(['prepare','fail','verify'].includes(mode));
const origin='http://127.0.0.1:9429',operator='playtt-cms-local-only-operator',cookies=new Map(),checks=[];
const file='artifacts/playtt-maintenance-failure-owned-private.json';let nonce,saved;
async function req(path,options={}){const h=new Headers(options.headers);h.set('cookie',[...cookies.values()].join('; '));const start=Date.now(),r=await fetch(origin+path,{...options,headers:h,redirect:'manual',signal:AbortSignal.timeout(90000)});for(const raw of r.headers.getSetCookie()){const v=raw.split(';')[0];cookies.set(v.split('=')[0],v);}checks.push({path,method:options.method||'GET',status:r.status,wallMs:Date.now()-start});return r;}
async function api(path,body){const r=await req('/wp-json/wp/v2/'+path,{method:body?'POST':'GET',headers:{'x-wp-nonce':nonce,'content-type':'application/json'},body:body?JSON.stringify(body):undefined});assert.equal(r.status,200,'REST '+path);return r.json();}
const op=(phase,body)=>req('/?phase='+phase,{method:body?'POST':'GET',headers:{authorization:'Bearer '+operator,'content-type':'application/json'},body:body?JSON.stringify(body):undefined});
async function maintenance(action){const r=await op('operator-auto-draft-maintenance',{action});assert.equal(r.status,200);return r.json();}
async function state(){const r=await op('operator-fence-status');assert.equal(r.status,200);return(await r.json()).state;}
async function paused(){const r=await req('/__playtt-publishing',{headers:{authorization:'Bearer '+operator}});assert.equal(r.status,200);assert.equal((await r.json()).state,'paused');}
const record=p=>({id:p.id,status:p.status,title:p.title.raw,content:p.content.raw,date:p.date});
async function publishedHash(){return createHash('sha256').update(JSON.stringify((await api('pages?context=edit&status=publish&per_page=100')).map(record).sort((a,b)=>a.id-b.id))).digest('hex');}
const save=()=>writeFile(file,JSON.stringify(saved));
try{saved=JSON.parse(await readFile(file,'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}
await paused();
if(mode==='fail'){
 assert.ok(saved?.prepared&&!saved.cleanupComplete&&!saved.failed);const before=await state();assert.deepEqual(before,saved.state);
 const r=await op('operator-auto-draft-maintenance',{action:'run'}),body=await r.text();assert.equal(r.status,500);
 assert.match(body,/PLAYTT_LOCAL_MAINTENANCE_MANIFEST_FAILURE/,'Response must identify the injected write failure');
 assert.deepEqual(await state(),before);await paused();saved.failed=true;await save();
 const report={at:new Date().toISOString(),result:'pass',scope:'Local emulator injected canonical manifest put failure; does not model every storage or network failure',status:r.status,injectedFailureObserved:true,canonicalPointerUnchanged:true,publisherPaused:true,checks};
 await writeFile('artifacts/playtt-maintenance-failure-local.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({...report,checks:checks.length}));
}else{
 await req('/wp-login.php');assert.equal((await req('/wp-login.php',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({log:'admin',pwd:'playtt-cms-local-only-password',testcookie:'1',redirect_to:origin+'/wp-admin/'})})).status,302);
 nonce=(await(await req('/wp-admin/')).text()).match(/"nonce":"([^"]+)"/)?.[1];assert.ok(nonce);
 if(mode==='prepare'){
  assert.ok(!saved||saved.cleanupComplete);assert.equal((await maintenance('preview')).eligibleBefore,0);
  saved={marker:'PLAYTT_MAINTENANCE_FAILURE_'+randomUUID(),beforeHash:await publishedHash()};await save();
  const path='pages?context=edit&status=auto-draft&per_page=100',prior=new Set((await api(path)).map(p=>p.id));
  const r=await req('/wp-admin/post-new.php?post_type=page');assert.equal(r.status,200);await r.arrayBuffer();const added=(await api(path)).filter(p=>!prior.has(p.id));assert.equal(added.length,1);
  saved.owned=record(added[0]);await save();saved.owned=record(await api('pages/'+added[0].id,{title:saved.marker,date:new Date(Date.now()-9*86400000).toISOString().slice(0,19)}));assert.equal(saved.owned.status,'auto-draft');await save();
  const preview=await maintenance('preview');assert.deepEqual(preview.selectedIds,[saved.owned.id]);saved.state=await state();saved.prepared=true;await save();console.log(JSON.stringify({result:'prepared',id:saved.owned.id}));
 }else{
  assert.ok(saved?.failed&&!saved.cleanupComplete);assert.deepEqual(record(await api('pages/'+saved.owned.id+'?context=edit')),saved.owned);
  const run=await maintenance('run');assert.deepEqual(run.deletedIds,[saved.owned.id]);assert.equal(run.remainingEligible,0);
  const r=await req('/wp-json/wp/v2/pages/'+saved.owned.id+'?context=edit',{headers:{'x-wp-nonce':nonce}});assert.equal(r.status,404);await r.arrayBuffer();
  assert.equal(await publishedHash(),saved.beforeHash);await paused();saved.cleanupComplete=true;await save();
  const report={at:new Date().toISOString(),result:'pass',scope:'Local cold reconstruction after injected manifest failure; owned auto-draft identity preserved, normal retry commits deletion',id:saved.owned.id,failedDeletionRolledBack:true,retry:run,allOwnedIds404:true,originalPublishedPagesUnchanged:true,publisherPaused:true,checks};
  await writeFile('artifacts/playtt-maintenance-failure-recovery-local.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({...report,checks:checks.length}));
 }
}
