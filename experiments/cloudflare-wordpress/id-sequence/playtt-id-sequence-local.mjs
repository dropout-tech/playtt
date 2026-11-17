import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {randomUUID,createHash} from 'node:crypto';
assert.ok(process.argv.includes('--local'));assert.ok(!process.argv.includes('--remote'));
const mode=process.argv.find(x=>x.startsWith('--mode='))?.slice(7);assert.ok(['prepare','check'].includes(mode));
const origin='http://127.0.0.1:9429',cookies=new Map();let nonce;
async function req(path,options={}){const headers=new Headers(options.headers);headers.set('cookie',[...cookies.values()].join('; '));const r=await fetch(origin+path,{...options,headers,redirect:'manual',signal:AbortSignal.timeout(90000)});for(const raw of r.headers.getSetCookie()){const value=raw.split(';')[0];cookies.set(value.split('=')[0],value);}return r;}
async function api(path,body,method=body?'POST':'GET'){const r=await req('/wp-json/wp/v2/'+path,{method,headers:{'x-wp-nonce':nonce,'content-type':'application/json'},body:body?JSON.stringify(body):undefined});assert.equal(r.status,method==='POST'&&path==='pages'?201:200);return r.json();}
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
async function pagesHash(){return hash((await api('pages?context=edit&per_page=100')).map(p=>({id:p.id,status:p.status,title:p.title.raw,content:p.content.raw})).sort((a,b)=>a.id-b.id));}
const s=await req('/__playtt-publishing',{headers:{authorization:'Bearer playtt-cms-local-only-operator'}});assert.equal((await s.json()).state,'paused');
await req('/wp-login.php');assert.equal((await req('/wp-login.php',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({log:'admin',pwd:'playtt-cms-local-only-password',testcookie:'1',redirect_to:origin+'/wp-admin/'})})).status,302);
nonce=(await(await req('/wp-admin/')).text()).match(/"nonce":"([^"]+)"/)?.[1];assert.ok(nonce);
const pointer='artifacts/playtt-id-sequence-owned-private.json';
async function ownedGet(item){const p=await api('pages/'+item.id+'?context=edit');assert.equal(p.status,'draft');assert.equal(p.title.raw,item.title);assert.equal(p.content.raw,item.content);return p;}
async function remove(item){await ownedGet(item);assert.equal((await api('pages/'+item.id+'?force=true',undefined,'DELETE')).deleted,true);}
if(mode==='prepare'){
 const marker='PLAYTT_ID_SEQUENCE_'+randomUUID(),beforeHash=await pagesHash(),owned=[];
 for(const suffix of ['A','B']){const title=marker+'_'+suffix,content='<!-- wp:paragraph --><p>'+title+'</p><!-- /wp:paragraph -->';const p=await api('pages',{title,content,status:'draft'});owned.push({id:p.id,title,content});await writeFile(pointer,JSON.stringify({marker,beforeHash,owned}));}
 assert.ok(owned[1].id>owned[0].id);await remove(owned[1]);
 await writeFile(pointer,JSON.stringify({marker,beforeHash,owned,removedHighest:owned[1].id}));
 const report={at:new Date().toISOString(),mode,result:'prepared',scope:'Local-only two owned drafts created, highest removed; stop and restart local runtime before check',retainedId:owned[0].id,removedHighestId:owned[1].id};await writeFile('artifacts/playtt-id-sequence-prepare.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}else{
 const saved=JSON.parse(await readFile(pointer,'utf8'));assert.match(saved.marker,/^PLAYTT_ID_SEQUENCE_[a-f0-9-]{36}$/);assert.equal(saved.removedHighest,saved.owned[1].id);await ownedGet(saved.owned[0]);
 let created,error;const evidence={deletedBeforeRestart:saved.removedHighest};
 try{
  const title=saved.marker+'_C',content='<!-- wp:paragraph --><p>'+title+'</p><!-- /wp:paragraph -->';const p=await api('pages',{title,content,status:'draft'});created={id:p.id,title,content};await writeFile(pointer,JSON.stringify({...saved,created}));evidence.createdAfterRestart=p.id;evidence.monotonic=p.id>saved.removedHighest;
  if(p.id===saved.removedHighest){await ownedGet(created);await api('pages/'+saved.removedHighest,{content:saved.owned[1].content});const changed=await api('pages/'+created.id+'?context=edit');evidence.staleIdChangedNewDraft=changed.title.raw===title&&changed.content.raw===saved.owned[1].content;await api('pages/'+created.id,{content});await ownedGet(created);}
 }catch(e){error=String(e);}
 finally{try{if(created)await remove(created);await remove(saved.owned[0]);assert.equal(await pagesHash(),saved.beforeHash);evidence.ownedDraftsRemoved=true;evidence.originalPagesUnchanged=true;}catch(e){error=(error||'')+'; cleanup: '+String(e);}}
 const report={at:new Date().toISOString(),mode,result:error?'error':evidence.monotonic?'pass':'fail',scope:'Local owned drafts only; identity-checked REST write to former deleted ID demonstrates whether it targets a newly created draft. Not a browser stale-tab test.',evidence,...(error?{error}:{})};await writeFile('artifacts/playtt-id-sequence-check.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));if(report.result!=='pass')process.exitCode=1;
}
