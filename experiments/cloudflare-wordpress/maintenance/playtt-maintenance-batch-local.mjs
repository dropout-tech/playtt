import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {randomUUID,createHash} from 'node:crypto';
assert.ok(process.argv.includes('--local'));assert.ok(!process.argv.includes('--remote'));
const origin='http://127.0.0.1:9429',operator='playtt-cms-local-only-operator',cookies=new Map(),checks=[];
const file='artifacts/playtt-maintenance-batch-owned-private.json',endpoint='/?phase=operator-auto-draft-maintenance';let nonce,saved;
async function req(path,options={}){const h=new Headers(options.headers);h.set('cookie',[...cookies.values()].join('; '));const start=Date.now(),r=await fetch(origin+path,{...options,headers:h,redirect:'manual',signal:AbortSignal.timeout(90000)});for(const raw of r.headers.getSetCookie()){const v=raw.split(';')[0];cookies.set(v.split('=')[0],v);}checks.push({path,method:options.method||'GET',status:r.status,wallMs:Date.now()-start});return r;}
async function api(path,body){const r=await req('/wp-json/wp/v2/'+path,{method:body?'POST':'GET',headers:{'x-wp-nonce':nonce,'content-type':'application/json'},body:body?JSON.stringify(body):undefined});assert.equal(r.status,200,'REST '+path);return r.json();}
const operatorRequest=(phase,body)=>req('/?phase='+phase,{method:body?'POST':'GET',headers:{authorization:'Bearer '+operator,'content-type':'application/json'},body:body?JSON.stringify(body):undefined});
async function maintenance(action){const r=await operatorRequest('operator-auto-draft-maintenance',{action});assert.equal(r.status,200,'Maintenance '+action);return {version:Number(r.headers.get('x-wp-codebox-canonical-version')),result:await r.json()};}
async function state(){const r=await operatorRequest('operator-fence-status');assert.equal(r.status,200);return(await r.json()).state;}
async function paused(){const r=await req('/__playtt-publishing',{headers:{authorization:'Bearer '+operator}});assert.equal(r.status,200);assert.equal((await r.json()).state,'paused');}
const record=p=>({id:p.id,status:p.status,title:p.title.raw,content:p.content.raw,date:p.date});
async function publishedHash(){return createHash('sha256').update(JSON.stringify((await api('pages?context=edit&status=publish&per_page=100')).map(record).sort((a,b)=>a.id-b.id))).digest('hex');}
const save=()=>writeFile(file,JSON.stringify(saved));
try{saved=JSON.parse(await readFile(file,'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}
assert.ok(!saved||saved.cleanupComplete,'Unresolved owned fixtures: inspect identity and state before recovery');
await paused();await req('/wp-login.php');assert.equal((await req('/wp-login.php',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({log:'admin',pwd:'playtt-cms-local-only-password',testcookie:'1',redirect_to:origin+'/wp-admin/'})})).status,302);
nonce=(await(await req('/wp-admin/')).text()).match(/"nonce":"([^"]+)"/)?.[1];assert.ok(nonce);
assert.equal((await maintenance('preview')).result.eligibleBefore,0,'Do not delete unrelated expired auto-drafts');
saved={marker:'PLAYTT_MAINTENANCE_BATCH_'+randomUUID(),beforeHash:await publishedHash(),owned:[]};await save();
const path='pages?context=edit&status=auto-draft&per_page=100';let prior=new Set((await api(path)).map(p=>p.id));
for(let i=0;i<21;i++){
 const r=await req('/wp-admin/post-new.php?post_type=page');assert.equal(r.status,200);await r.arrayBuffer();
 const current=await api(path),added=current.filter(p=>!prior.has(p.id));assert.equal(added.length,1);prior=new Set(current.map(p=>p.id));
 saved.owned.push(record(added[0]));await save();
 const p=await api('pages/'+added[0].id,{title:saved.marker+'_'+i,date:new Date(Date.now()-9*86400000).toISOString().slice(0,19)});
 assert.equal(p.status,'auto-draft');saved.owned[saved.owned.length-1]=record(p);await save();
 console.log(JSON.stringify({createdOwned:i+1,id:p.id}));
}
const ids=saved.owned.map(p=>p.id).sort((a,b)=>a-b),preview=(await maintenance('preview')).result;
assert.equal(preview.eligibleBefore,21);assert.deepEqual(preview.selectedIds,ids.slice(0,20));assert.deepEqual(preview.deletedIds,[]);
// A backup/cutover fence must stop maintenance before it touches WordPress.
const before=await state(),fr=await operatorRequest('operator-fence-acquire',{ttlSeconds:120});assert.equal(fr.status,200);const fence=await fr.json();
let fencedStatus;
try{const denied=await operatorRequest('operator-auto-draft-maintenance',{action:'run'});fencedStatus=denied.status;await denied.arrayBuffer();assert.equal(fencedStatus,409);assert.deepEqual(await state(),before);}
finally{const release=await operatorRequest('operator-fence-release',{token:fence.token});assert.equal(release.status,200);await release.arrayBuffer();}
const rounds=await Promise.all([maintenance('run'),maintenance('run')]);saved.rounds=rounds;await save();
const ordered=rounds.toSorted((a,b)=>a.version-b.version);assert.ok(ordered[1].version>ordered[0].version);
assert.deepEqual(ordered.map(r=>r.result.deletedIds.length),[20,1]);
assert.deepEqual(ordered.map(r=>r.result.remainingEligible),[1,0]);
const deleted=rounds.flatMap(r=>r.result.deletedIds).sort((a,b)=>a-b);assert.deepEqual(deleted,ids);assert.equal(new Set(deleted).size,21);
for(const r of rounds){assert.ok(r.result.selectedIds.length<=20);assert.deepEqual(r.result.skippedIds,[]);}
for(const id of ids){const r=await req('/wp-json/wp/v2/pages/'+id+'?context=edit',{headers:{'x-wp-nonce':nonce}});assert.equal(r.status,404);await r.arrayBuffer();}
const empty=(await maintenance('run')).result;assert.equal(empty.eligibleBefore,0);assert.deepEqual(empty.deletedIds,[]);
assert.equal(await publishedHash(),saved.beforeHash);await paused();saved.cleanupComplete=true;await save();
const report={at:new Date().toISOString(),result:'pass',scope:'Local real WordPress only: 21 owned native auto-drafts, 20-item cap, concurrent requests serialized, fence rejects, no unrelated expired records at start',fixtureCount:21,preview,rounds:ordered,fencedStatus,canonicalUnchangedWhileFenced:true,allOwnedIds404:true,emptyRun:empty,originalPublishedPagesUnchanged:true,publisherPaused:true,checks};
await writeFile('artifacts/playtt-maintenance-batch-local.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({...report,checks:checks.length}));
