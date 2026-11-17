import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
const origin='https://playtt-wp-free-cms-probe.muzhi-garden-platform.workers.dev';
const secrets=JSON.parse(await readFile('../../../playtt-cms-secrets.json','utf8'));
const original=JSON.parse(await readFile('artifacts/playtt-batch-remote-original-private.json','utf8'));
const cookies=new Map(),checks=[];let nonce;
async function request(path,options={}){
 const headers=new Headers(options.headers);headers.set('X-Playtt-Probe',secrets.WORDPRESS_OPERATOR_TOKEN);headers.set('cookie',[...cookies.values()].join('; '));
 const r=await fetch(origin+path,{...options,headers,redirect:'manual',signal:AbortSignal.timeout(90000)});
 checks.push({path,method:options.method||'GET',status:r.status});
 assert.equal(r.headers.get('x-playtt-probe-state'),'restore-v1');
 for(const raw of r.headers.getSetCookie()){const v=raw.split(';')[0];cookies.set(v.split('=')[0],v);}
 return r;
}
async function api(path,body){const r=await request('/wp-json/wp/v2/'+path,{method:body?'POST':'GET',headers:{'content-type':'application/json','x-wp-nonce':nonce},body:body?JSON.stringify(body):undefined});assert.ok(r.ok,'REST '+path+' '+r.status);return r.json();}
async function pause(){const r=await request('/__playtt-publishing',{method:'POST',headers:{authorization:'Bearer '+secrets.WORDPRESS_OPERATOR_TOKEN,'content-type':'application/json'},body:JSON.stringify({action:'pause'})});assert.equal(r.status,200);assert.equal((await r.json()).state,'paused');}
try{
 await pause();
 assert.equal((await request('/wp-login.php')).status,200);
 assert.equal((await request('/wp-login.php',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({log:'admin',pwd:secrets.WORDPRESS_ADMIN_PASSWORD,testcookie:'1','wp-submit':'Log In',redirect_to:origin+'/wp-admin/'})})).status,302);
 nonce=(await (await request('/wp-admin/')).text()).match(/"nonce":"([^"]+)"/)?.[1];assert.ok(nonce);
 const pages=await api('pages?context=edit&per_page=100');
 const changes=[];
 for(const page of [original.about,original.course]){
  const current=pages.find(p=>p.id===page.id);assert.ok(current);
  if(current.content.raw!==page.content.raw||current.status!==page.status){await api('pages/'+page.id,{content:page.content.raw,status:page.status});changes.push({id:page.id,action:'restore'});}
  const verified=await api('pages/'+page.id+'?context=edit');assert.equal(verified.content.raw,page.content.raw);assert.equal(verified.status,page.status);
 }
 const parts=await api('template-parts?context=edit&per_page=100');const footer=parts.find(p=>p.id===original.footer.id);assert.ok(footer);assert.equal(footer.content.raw,original.footer.content.raw);
 for(const p of pages.filter(p=>/^playtt-batch-[0-9]+$/.test(p.slug))){
  assert.equal(p.title.raw,'Private disposable publication batch test');assert.ok(p.content.raw.includes('PLAYTT_BATCH_FIRST_'));
  const r=await request('/wp-json/wp/v2/pages/'+p.id+'?force=true',{method:'DELETE',headers:{'x-wp-nonce':nonce}});assert.equal(r.status,200);changes.push({id:p.id,action:'remove-owned-test-page'});
 }
 for(const path of ['/','/about/','/class/','/coaches/','/locations/','/partner/']){
  const r=await request('/__playtt-published'+path);assert.equal(r.status,200);assert.ok(!(await r.text()).includes('PLAYTT_BATCH_'),'Test content leaked into preview');
 }
 const report={at:new Date().toISOString(),result:'pass',scope:'Restore only test-modified pages from exact pre-test content; remove only owned disposable test pages; verify unchanged footer and six marker-free published snapshots; publisher remains paused',changes,checks};
 await writeFile('artifacts/playtt-publication-batch-recovery-remote.json',JSON.stringify(report,null,2));console.log(JSON.stringify({result:'pass',changes}));
}catch(error){process.exitCode=1;console.error(error);await writeFile('artifacts/playtt-publication-batch-recovery-remote-failure.json',JSON.stringify({at:new Date().toISOString(),error:String(error),checks},null,2));}
finally{await pause();}
