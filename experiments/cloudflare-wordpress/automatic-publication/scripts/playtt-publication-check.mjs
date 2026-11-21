import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
const origin='http://127.0.0.1:9429', operator='playtt-cms-local-only-operator', cookies=new Map(), checks=[];
let nonce;
const routes=['/','/about/','/class/','/coaches/','/locations/','/partner/'];
async function request(path,options={}) {
  const headers=new Headers(options.headers);
  if(!options.anonymous)headers.set('cookie',[...cookies.values()].join('; '));
  const start=Date.now(),r=await fetch(origin+path,{...options,headers,redirect:'manual',signal:AbortSignal.timeout(90000)});
  if(!options.anonymous)for(const raw of r.headers.getSetCookie()){const value=raw.split(';')[0];cookies.set(value.split('=')[0],value);}
  checks.push({path,method:options.method||'GET',status:r.status,wallMs:Date.now()-start});
  return r;
}
async function api(path,body){const r=await request('/wp-json/wp/v2/'+path,{method:body?'POST':'GET',headers:{'content-type':'application/json','x-wp-nonce':nonce},body:body?JSON.stringify(body):undefined});assert.ok(r.ok,'REST '+path+' '+r.status);return r.json();}
async function status(){const r=await request('/__playtt-publishing',{headers:{authorization:'Bearer '+operator},anonymous:true});assert.equal(r.status,200);return r.json();}
async function published(path){return request('/__playtt-published'+path,{anonymous:true});}
async function idle(){const start=Date.now();while(Date.now()-start<120000){const s=await status();assert.notEqual(s.state,'blocked',JSON.stringify(s));if(s.state==='idle')return s;await new Promise(resolve=>setTimeout(resolve,1000));}throw Error('Publication did not finish within 120 seconds');}
try {
  assert.equal((await request('/wp-login.php')).status,200);
  assert.equal((await request('/wp-login.php',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({log:'admin',pwd:'playtt-cms-local-only-password',testcookie:'1','wp-submit':'Log In',redirect_to:origin+'/wp-admin/'})})).status,302);
  const admin=await request('/wp-admin/');nonce=(await admin.text()).match(/"nonce":"([^"]+)"/)?.[1];assert.ok(nonce);
  const pages=await api('pages?context=edit&per_page=100'),about=pages.find(p=>p.slug==='about');assert.ok(about);
  await writeFile('artifacts/playtt-publication-original.json',JSON.stringify({about},null,2));
  let initial; const existing=await published('/about/');
  if(existing.status===200) initial={revision:existing.headers.get('x-wp-codebox-publication-revision')};
  else {
    for(const route of routes)assert.equal((await request(route,{anonymous:true})).status,200);
    const bootstrap=await request('/?phase=operator-publish',{anonymous:true,method:'POST',headers:{authorization:'Bearer '+operator,'content-type':'application/json'},body:JSON.stringify({routes})});assert.equal(bootstrap.status,200,await bootstrap.clone().text());
    initial=await bootstrap.json();
  }
  await idle();
  const before=await published('/about/');assert.equal(before.status,200);assert.equal(before.headers.get('x-wp-codebox-publication-revision'),initial.revision);
  const marker='PLAYTT_AUTOMATIC_PUBLICATION_'+Date.now();
  await api('pages/'+about.id,{content:about.content.raw+'\n<!-- wp:paragraph --><p>'+marker+'</p><!-- /wp:paragraph -->'});
  await idle();const updated=await published('/about/');assert.equal(updated.status,200);assert.ok((await updated.text()).includes(marker));assert.notEqual(updated.headers.get('x-wp-codebox-publication-revision'),initial.revision);
  await api('pages/'+about.id,{status:'draft'});await idle();assert.equal((await published('/about/')).status,404,'Unpublished page must be removed from the public snapshot');
  assert.equal((await published('/wp-admin/')).status,404);assert.equal((await published('/?phase=r2-state')).status,404);
  const unauthorized=await request('/__playtt-publishing',{anonymous:true});assert.equal(unauthorized.status,401);
  await api('pages/'+about.id,{status:'publish',content:about.content.raw});await idle();const restored=await published('/about/');assert.equal(restored.status,200);assert.ok(!(await restored.text()).includes(marker));
  const parts=await api('template-parts?context=edit&per_page=100'),footer=parts.find(p=>p.slug==='footer');assert.ok(footer);
  const footerMarker='PLAYTT_SHARED_FOOTER_'+Date.now();
  await api('template-parts/'+encodeURIComponent(footer.id),{content:footer.content.raw+'\n<!-- wp:paragraph --><p>'+footerMarker+'</p><!-- /wp:paragraph -->'});await idle();
  const revisions=new Set();for(const route of routes){const r=await published(route);assert.equal(r.status,200);assert.ok((await r.text()).includes(footerMarker),'Footer update missing on '+route);revisions.add(r.headers.get('x-wp-codebox-publication-revision'));}assert.equal(revisions.size,1,'All pages must use the same complete publication');
  await api('template-parts/'+encodeURIComponent(footer.id),{content:footer.content.raw});await idle();
  const report={at:new Date().toISOString(),result:'pass',scope:'Local alarm-driven publication, page edit, unpublish, republish, shared template-part propagation and bounded public reader',checks};await writeFile('artifacts/playtt-publication-local.json',JSON.stringify(report,null,2));console.log(JSON.stringify({result:report.result,requests:checks.length,assertions:report.scope}));
}catch(error){await writeFile('artifacts/playtt-publication-failure.json',JSON.stringify({at:new Date().toISOString(),error:String(error),checks},null,2));console.error(error);process.exitCode=1;}
