import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const origin='http://127.0.0.1:9426';
const cookies=new Map(), checks=[];
const sha=b=>createHash('sha256').update(b).digest('hex');
async function request(route,options={}) {
  const url=new URL(route,origin);assert.equal(url.origin,origin);
  const headers=new Headers(options.headers);
  headers.set('cookie',[...cookies.values()].filter(c=>url.pathname.startsWith(c.path)).map(c=>c.value).join('; '));
  const started=performance.now();
  const r=await fetch(url,{...options,headers,redirect:'manual',signal:AbortSignal.timeout(60000)});
  for(const raw of r.headers.getSetCookie()) {
    const pair=raw.split(';')[0], name=pair.split('=')[0],path=raw.match(/;\s*path=([^;]+)/i)?.[1]||'/';
    cookies.set(name+path,{value:pair,path});
  }
  checks.push({method:options.method||'GET',route:url.pathname,status:r.status,wallMs:Math.round(performance.now()-started)});
  return r;
}
await request('/wp-login.php');
const login=await request('/wp-login.php',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({log:'admin',pwd:'playtt-local-probe-only-password',redirect_to:origin+'/wp-admin/',testcookie:'1','wp-submit':'Log In'})});
assert.equal(login.status,302);
const dashboard=await request('/wp-admin/');assert.equal(dashboard.status,200);
const admin=await dashboard.text();assert.ok(admin.includes('Dashboard'));
const nonce=admin.match(/"nonce":"([^"]+)"/)?.[1];assert.ok(nonce);
let state;
if(process.argv.includes('--verify-restart')){
  state=JSON.parse(await readFile('artifacts/playtt-test-state.json','utf8'));
}else{
  const title='PLAYTT Worker 保存測試 '+Date.now();
  const created=await request('/wp-json/wp/v2/posts',{method:'POST',headers:{'content-type':'application/json','x-wp-nonce':nonce},body:JSON.stringify({title,content:'<!-- wp:paragraph --><p>重啟後應保存的區塊內容。</p><!-- /wp:paragraph -->',status:'publish'})});
  assert.equal(created.status,201,await created.clone().text());
  const post=await created.json();
  const draftRes=await request('/wp-json/wp/v2/posts',{method:'POST',headers:{'content-type':'application/json','x-wp-nonce':nonce},body:JSON.stringify({title:'PLAYTT_PRIVATE_WORKER_DRAFT',content:'PLAYTT_PRIVATE_WORKER_DRAFT',status:'draft'})});assert.equal(draftRes.status,201);const draft=await draftRes.json();
  const bytes=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=','base64');
  const mediaResponse=await request('/wp-json/wp/v2/media',{method:'POST',headers:{'content-type':'image/png','content-disposition':'attachment; filename="playtt-probe.png"','x-wp-nonce':nonce},body:bytes});assert.equal(mediaResponse.status,201,await mediaResponse.clone().text());const media=await mediaResponse.json();
  state={post:{id:post.id,title,link:post.link},draftId:draft.id,media:{id:media.id,url:media.source_url,sha256:sha(bytes)}};
  await writeFile('artifacts/playtt-test-state.json',JSON.stringify(state,null,2));
}
const postRes=await request('/wp-json/wp/v2/posts/'+state.post.id);assert.equal(postRes.status,200);const post=await postRes.json();assert.equal(post.title.rendered,state.post.title);
const publicPost=await fetch(state.post.link,{redirect:'manual'});assert.equal(publicPost.status,200);assert.ok((await publicPost.text()).includes(state.post.title));
const mediaRes=await fetch(state.media.url);assert.equal(mediaRes.status,200);assert.equal(mediaRes.headers.get('x-wp-codebox-static'),'r2-upload');assert.equal(sha(Buffer.from(await mediaRes.arrayBuffer())),state.media.sha256);
const anonymousDraft=await fetch(origin+'/?p='+state.draftId,{redirect:'manual'});assert.equal(anonymousDraft.status,404);assert.ok(!(await anonymousDraft.text()).includes('PLAYTT_PRIVATE_WORKER_DRAFT'));
const anonymousAdmin=await fetch(origin+'/wp-admin/',{redirect:'manual'});assert.equal(anonymousAdmin.status,302);assert.ok(anonymousAdmin.headers.get('location').includes('wp-login.php'));
const result={scope:'Local workerd / simulated R2 and SQLite Durable Object only. CPU limit is NOT remotely validated.',at:new Date().toISOString(),mode:process.argv.includes('--verify-restart')?'after-restart':'create',result:'pass',assertions:['WordPress login','authenticated post read','published post visible','R2 media SHA256 exact','anonymous draft denied','anonymous admin redirected'],state,requests:checks};
await writeFile('artifacts/playtt-'+result.mode+'.json',JSON.stringify(result,null,2));
console.log(JSON.stringify(result));
