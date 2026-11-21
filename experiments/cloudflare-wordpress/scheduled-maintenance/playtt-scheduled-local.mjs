import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {randomUUID,createHash} from 'node:crypto';
assert.ok(process.argv.includes('--local'));assert.ok(!process.argv.includes('--remote'));
const mode=process.argv.find(a=>a.startsWith('--mode='))?.slice(7);assert.ok(['prepare','fire','verify'].includes(mode));
const origin='http://127.0.0.1:9429',operator='playtt-cms-local-only-operator',cookies=new Map(),checks=[];
const file='artifacts/playtt-scheduled-local-owned-private.json',cron='0 0 * * *';let nonce,saved;
async function req(path,options={}){const headers=new Headers(options.headers);headers.set('cookie',[...cookies.values()].join('; '));const start=Date.now(),r=await fetch(origin+path,{...options,headers,redirect:'manual',signal:AbortSignal.timeout(90000)});for(const raw of r.headers.getSetCookie()){const v=raw.split(';')[0];cookies.set(v.split('=')[0],v);}checks.push({path,method:options.method||'GET',status:r.status,wallMs:Date.now()-start});return r;}
async function rawApi(path,body,method=body?'POST':'GET'){const r=await req('/wp-json/wp/v2/'+path,{method,headers:{'x-wp-nonce':nonce,'content-type':'application/json'},body:body?JSON.stringify(body):undefined});return {status:r.status,body:await r.json()};}
async function api(path,body,method=body?'POST':'GET'){const r=await rawApi(path,body,method);assert.equal(r.status,method==='POST'&&path==='pages'?201:200);return r.body;}
const op=(phase,body)=>req('/?phase='+phase,{method:body?'POST':'GET',headers:{authorization:'Bearer '+operator,'content-type':'application/json'},body:body?JSON.stringify(body):undefined});
async function state(){const r=await op('operator-fence-status');assert.equal(r.status,200);return(await r.json()).state;}
async function paused(){const r=await req('/__playtt-publishing',{headers:{authorization:'Bearer '+operator}});assert.equal(r.status,200);assert.equal((await r.json()).state,'paused');}
async function preview(){const r=await op('operator-auto-draft-maintenance',{action:'preview'});assert.equal(r.status,200);return r.json();}
async function scheduled(expression,expected=200){const r=await req('/cdn-cgi/local/scheduled?format=json&cron='+encodeURIComponent(expression));assert.equal(r.status,expected);const result=await r.json();if(expected===200)assert.equal(result.outcome,'ok');else assert.notEqual(result.outcome,'ok');return result;}
const record=p=>({id:p.id,status:p.status,title:p.title.raw,content:p.content.raw,date:p.date});
async function publishedHash(){return createHash('sha256').update(JSON.stringify((await api('pages?context=edit&status=publish&per_page=100')).map(record).sort((a,b)=>a.id-b.id))).digest('hex');}
const save=()=>writeFile(file,JSON.stringify(saved));
try{saved=JSON.parse(await readFile(file,'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}
await paused();
if(mode==='fire'){
 assert.ok(saved?.prepared&&!saved.cleanupComplete&&!saved.fired);const before=await state();assert.deepEqual(before,saved.state);
 const ignored=await scheduled('1 0 * * *');assert.deepEqual(await state(),before);
 const fr=await op('operator-fence-acquire',{ttlSeconds:120});assert.equal(fr.status,200);const fence=await fr.json();let fenced;
 try{fenced=await scheduled(cron,500);assert.deepEqual(await state(),before);}
 finally{const release=await op('operator-fence-release',{token:fence.token});assert.equal(release.status,200);await release.arrayBuffer();}
 const success=await scheduled(cron),after=await state();assert.ok(after.version>before.version);const plan=await preview();assert.equal(plan.eligibleBefore,0);
 const empty=await scheduled(cron);await paused();saved.fired=true;await save();
 const report={at:new Date().toISOString(),result:'pass',scope:'Real local scheduled handler to execution DO; obsolete cron ignored, fence fails without commit, one owned expired auto-draft cleaned, empty rerun',ignored,fenced,success,empty,id:saved.owned.id,publisherPaused:true,checks};
 await writeFile('artifacts/playtt-scheduled-local-fire.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({...report,checks:checks.length}));
}else{
 await req('/wp-login.php');assert.equal((await req('/wp-login.php',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({log:'admin',pwd:'playtt-cms-local-only-password',testcookie:'1',redirect_to:origin+'/wp-admin/'})})).status,302);
 nonce=(await(await req('/wp-admin/')).text()).match(/"nonce":"([^"]+)"/)?.[1];assert.ok(nonce);
 if(mode==='prepare'){
  assert.ok(!saved||saved.cleanupComplete);assert.equal((await preview()).eligibleBefore,0);
  saved={marker:'PLAYTT_SCHEDULED_'+randomUUID(),beforeHash:await publishedHash()};await save();
  const path='pages?context=edit&status=auto-draft&per_page=100',prior=new Set((await api(path)).map(p=>p.id));
  const r=await req('/wp-admin/post-new.php?post_type=page');assert.equal(r.status,200);await r.arrayBuffer();const added=(await api(path)).filter(p=>!prior.has(p.id));assert.equal(added.length,1);
  saved.owned=record(added[0]);await save();saved.owned=record(await api('pages/'+added[0].id,{title:saved.marker,date:new Date(Date.now()-9*86400000).toISOString().slice(0,19)}));assert.equal(saved.owned.status,'auto-draft');await save();
  assert.deepEqual((await preview()).selectedIds,[saved.owned.id]);saved.state=await state();
  const disabled=await scheduled(cron);assert.deepEqual(await state(),saved.state);assert.deepEqual(record(await api('pages/'+saved.owned.id+'?context=edit')),saved.owned);
  saved.prepared=true;await save();const report={at:new Date().toISOString(),result:'prepared',scope:'Real local scheduled entry disabled without config; no canonical change and owned expired auto-draft retained',id:saved.owned.id,disabled,checks};
  await writeFile('artifacts/playtt-scheduled-local-prepare.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({...report,checks:checks.length}));
 }else{
  assert.ok(saved?.fired&&!saved.cleanupComplete);assert.equal((await rawApi('pages/'+saved.owned.id+'?context=edit')).status,404);
  const p=record(await api('pages',{title:saved.marker+'_after_restart',content:'',status:'draft'}));saved.after=p;await save();assert.ok(p.id>saved.owned.id);
  assert.equal((await rawApi('pages/'+saved.owned.id,{content:'stale-owned-test'})).status,404);assert.deepEqual(record(await api('pages/'+p.id+'?context=edit')),p);
  assert.equal((await api('pages/'+p.id+'?force=true',undefined,'DELETE')).deleted,true);assert.equal(await publishedHash(),saved.beforeHash);await paused();saved.cleanupComplete=true;await save();
  const report={at:new Date().toISOString(),result:'pass',scope:'Local cold reconstruction after actual scheduled entry cleanup; no ID reuse and owned cleanup',removedId:saved.owned.id,newId:p.id,staleIdWrite404:true,ownedDataRemoved:true,originalPublishedPagesUnchanged:true,publisherPaused:true,checks};
  await writeFile('artifacts/playtt-scheduled-local-verify.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({...report,checks:checks.length}));
 }
}
