import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {randomUUID,createHash} from 'node:crypto';
const remote=process.argv.includes('--remote');assert.notEqual(remote,process.argv.includes('--local'),'Choose exactly one explicit environment');
const native=process.argv.includes('--native-last');
const mode=process.argv.find(x=>x.startsWith('--mode='))?.slice(7);assert.ok(['prepare','check'].includes(mode));
const label=(remote?'remote':'local')+(native?'-native':'-rest');
const origin=remote?'https://playtt-wp-free-restore-audit.muzhi-garden-platform.workers.dev':'http://127.0.0.1:9429';
const secrets=remote?JSON.parse(await readFile('../../../playtt-cms-secrets.json','utf8')):{WORDPRESS_OPERATOR_TOKEN:'playtt-cms-local-only-operator',WORDPRESS_ADMIN_PASSWORD:'playtt-cms-local-only-password'};
const cookies=new Map(),checks=[];let nonce;
async function req(path,options={}){
 const headers=new Headers(options.headers);headers.set('x-playtt-probe',secrets.WORDPRESS_OPERATOR_TOKEN);headers.set('cookie',[...cookies.values()].join('; '));
 const start=Date.now(),r=await fetch(origin+path,{...options,headers,redirect:'manual',signal:AbortSignal.timeout(90000)});
 if(remote)assert.equal(r.headers.get('x-playtt-probe-state'),'restore-v1');
 for(const raw of r.headers.getSetCookie()){const value=raw.split(';')[0];cookies.set(value.split('=')[0],value);}
 checks.push({path,method:options.method||'GET',status:r.status,wallMs:Date.now()-start});return r;
}
async function api(path,body,method=body?'POST':'GET'){
 const r=await req('/wp-json/wp/v2/'+path,{method,headers:{'x-wp-nonce':nonce,'content-type':'application/json'},body:body?JSON.stringify(body):undefined});assert.equal(r.status,method==='POST'&&path==='pages'?201:200);return r.json();
}
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
async function pagesHash(){return hash((await api('pages?context=edit&per_page=100')).map(p=>({id:p.id,status:p.status,title:p.title.raw,content:p.content.raw})).sort((a,b)=>a.id-b.id));}
async function paused(){const r=await req('/__playtt-publishing',{headers:{authorization:'Bearer '+secrets.WORDPRESS_OPERATOR_TOKEN}});assert.equal(r.status,200);assert.equal((await r.json()).state,'paused');}
await paused();assert.equal((await req('/wp-login.php')).status,200);
assert.equal((await req('/wp-login.php',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({log:'admin',pwd:secrets.WORDPRESS_ADMIN_PASSWORD,testcookie:'1',redirect_to:origin+'/wp-admin/'})})).status,302);
nonce=(await(await req('/wp-admin/')).text()).match(/"nonce":"([^"]+)"/)?.[1];assert.ok(nonce);
const pointer='artifacts/playtt-id-sequence-'+label+'-owned-private.json';
const item=p=>({id:p.id,status:p.status,title:p.title.raw,content:p.content.raw});
async function ownedGet(owned){const p=await api('pages/'+owned.id+'?context=edit');assert.deepEqual(item(p),owned);assert.ok(['draft','auto-draft'].includes(p.status));return p;}
async function remove(owned){await ownedGet(owned);assert.equal((await api('pages/'+owned.id+'?force=true',undefined,'DELETE')).deleted,true);}
async function create(marker,suffix){const title=marker+'_'+suffix;return item(await api('pages',{title,content:'<!-- wp:paragraph --><p>'+title+'</p><!-- /wp:paragraph -->',status:'draft'}));}
if(mode==='prepare'){
 let prior;try{prior=JSON.parse(await readFile(pointer,'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}assert.ok(!prior||prior.cleanupComplete,'Unfinished owned test data must be resolved before preparing another run');
 const marker='PLAYTT_ID_SEQUENCE_'+randomUUID(),beforeHash=await pagesHash(),owned=[];
 owned.push(await create(marker,'A'));await writeFile(pointer,JSON.stringify({marker,beforeHash,owned}));
 if(native){
  const endpoint='pages?context=edit&status=auto-draft&per_page=100',before=new Set((await api(endpoint)).map(p=>p.id));
  const r=await req('/wp-admin/post-new.php?post_type=page');assert.equal(r.status,200);await r.arrayBuffer();
  const added=(await api(endpoint)).filter(p=>!before.has(p.id));assert.equal(added.length,1);assert.equal(added[0].status,'auto-draft');assert.equal(added[0].content.raw,'');owned.push(item(added[0]));
 }else owned.push(await create(marker,'B'));
 await writeFile(pointer,JSON.stringify({marker,beforeHash,owned}));assert.ok(owned[1].id>owned[0].id);await remove(owned[1]);
 await writeFile(pointer,JSON.stringify({marker,beforeHash,owned,removedHighest:owned[1].id}));await paused();
 const report={at:new Date().toISOString(),mode,label,result:'prepared',scope:'Owned private drafts only; restart local server or redeploy identical private audit code before check',retainedId:owned[0].id,removedHighestId:owned[1].id,removedStatus:owned[1].status,checks};await writeFile('artifacts/playtt-id-sequence-'+label+'-prepare.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({...report,checks:checks.length}));
}else{
 const saved=JSON.parse(await readFile(pointer,'utf8'));assert.match(saved.marker,/^PLAYTT_ID_SEQUENCE_[a-f0-9-]{36}$/);assert.equal(saved.removedHighest,saved.owned[1].id);assert.ok(!saved.cleanupComplete);await ownedGet(saved.owned[0]);
 let created,error;const evidence={deletedBeforeRestart:saved.removedHighest,removedStatus:saved.owned[1].status};
 try{
  created=await create(saved.marker,'C');await writeFile(pointer,JSON.stringify({...saved,created}));evidence.createdAfterRestart=created.id;evidence.monotonic=created.id>saved.removedHighest;assert.ok(evidence.monotonic,'Deleted highest ID was reused');
  const stale=await req('/wp-json/wp/v2/pages/'+saved.removedHighest,{method:'POST',headers:{'x-wp-nonce':nonce,'content-type':'application/json'},body:JSON.stringify({content:saved.owned[1].content})});
  evidence.staleIdWriteStatus=stale.status;assert.equal(stale.status,404);assert.equal((await stale.json()).code,'rest_post_invalid_id');await ownedGet(created);evidence.newDraftUnchanged=true;
 }catch(e){error=String(e);}
 finally{try{if(created)await remove(created);await remove(saved.owned[0]);assert.equal(await pagesHash(),saved.beforeHash);await paused();evidence.ownedDraftsRemoved=true;evidence.originalPagesUnchanged=true;evidence.publisherPaused=true;await writeFile(pointer,JSON.stringify({...saved,created,cleanupComplete:true}));}catch(e){error=(error||'')+'; cleanup: '+String(e);}}
 const report={at:new Date().toISOString(),mode,label,result:error?'fail':'pass',scope:'Owned draft ID must advance after deletion and runtime restart; former ID write must be 404 and new draft unchanged. Controlled REST stale-ID test, not an old browser tab.',evidence,checks,...(error?{error}:{})};await writeFile('artifacts/playtt-id-sequence-'+label+'-check.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({...report,checks:checks.length}));if(error)process.exitCode=1;
}
