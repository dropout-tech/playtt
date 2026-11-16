import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const origin = process.argv.find(arg => /^https?:/.test(arg)) || 'http://127.0.0.1:9428';
assert.ok(['http://127.0.0.1:9428','http://127.0.0.1:9429','https://playtt-wp-free-cms-probe.muzhi-garden-platform.workers.dev'].includes(origin));
const remote=origin.startsWith('https:'), mode=process.argv.includes('--verify-restart')?'after-restart':'create';
const credentials=remote?JSON.parse(await readFile('../../../playtt-cms-secrets.json','utf8')):{WORDPRESS_ADMIN_PASSWORD:'playtt-cms-local-only-password'};
const prefix='artifacts/playtt-cms-'+(remote?'remote':origin.endsWith(':9429')?'local-fresh':'local');
const cookies=new Map(), checks=[];
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
async function probeFetch(url, options = {}) {
  assert.equal(new URL(url).origin, origin);
  const headers = new Headers(options.headers);
  if (remote) headers.set('X-Playtt-Probe', credentials.WORDPRESS_OPERATOR_TOKEN);
  return fetch(url, { ...options, headers, signal: options.signal || AbortSignal.timeout(180000) });
}
async function request(route,options={}) {
  const url=new URL(route,origin); assert.equal(url.origin,origin);
  const headers=new Headers(options.headers);
  headers.set('cookie',[...cookies.values()].filter(c=>url.pathname.startsWith(c.path)).map(c=>c.value).join('; '));
  const started=performance.now();
  const response=await probeFetch(url,{...options,headers,redirect:'manual'});
  for(const raw of response.headers.getSetCookie()) {
    const pair=raw.split(';')[0],name=pair.split('=')[0],path=raw.match(/;\s*path=([^;]+)/i)?.[1]||'/';
    cookies.set(name+path,{value:pair,path});
  }
  checks.push({method:options.method||'GET',path:url.pathname,status:response.status,wallMs:Math.round(performance.now()-started)});
  return response;
}
let state;
try {
  const loginPage = await request('/wp-login.php');
  assert.equal(loginPage.status, 200, 'Login page must load before any credential is submitted');
  const login=await request('/wp-login.php',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({log:'admin',pwd:credentials.WORDPRESS_ADMIN_PASSWORD,redirect_to:origin+'/wp-admin/',testcookie:'1','wp-submit':'Log In'})});
  assert.equal(login.status,302);
  const dashboard=await request('/wp-admin/'); assert.equal(dashboard.status,200);
  const html=await dashboard.text(); assert.ok(html.includes('Dashboard'));
  const nonce=html.match(/"nonce":"([^"]+)"/)?.[1]; assert.ok(nonce);
  if(mode==='after-restart') state=JSON.parse(await readFile(prefix+'-state.json','utf8'));
  else {
    const title='PLAYTT DO 保存測試 '+Date.now();
    const created=await request('/wp-json/wp/v2/posts',{method:'POST',headers:{'content-type':'application/json','x-wp-nonce':nonce},body:JSON.stringify({title,content:'<!-- wp:paragraph --><p>隔離DO執行與資料保存驗證。</p><!-- /wp:paragraph -->',status:'publish'})});
    assert.equal(created.status,201,await created.clone().text()); const post=await created.json();
    const draftRes=await request('/wp-json/wp/v2/posts',{method:'POST',headers:{'content-type':'application/json','x-wp-nonce':nonce},body:JSON.stringify({title:'PLAYTT_PRIVATE_DO_DRAFT',content:'PLAYTT_PRIVATE_DO_DRAFT',status:'draft'})});
    assert.equal(draftRes.status,201,await draftRes.clone().text()); const draft=await draftRes.json();
    const bytes=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=','base64');
    const mediaResponse=await request('/wp-json/wp/v2/media',{method:'POST',headers:{'content-type':'image/png','content-disposition':'attachment; filename="playtt-do-probe.png"','x-wp-nonce':nonce},body:bytes});
    assert.equal(mediaResponse.status,201,await mediaResponse.clone().text()); const media=await mediaResponse.json();
    state={post:{id:post.id,title,link:post.link},draftId:draft.id,media:{id:media.id,url:media.source_url,sha256:sha(bytes)}};
    await writeFile(prefix+'-state.json',JSON.stringify(state,null,2));
  }
  const postRes=await request('/wp-json/wp/v2/posts/'+state.post.id); assert.equal(postRes.status,200); assert.equal((await postRes.json()).title.rendered,state.post.title);
  const publicPost=await probeFetch(state.post.link,{redirect:'manual'}); assert.equal(publicPost.status,200); assert.ok((await publicPost.text()).includes(state.post.title));
  const mediaRes=await probeFetch(state.media.url); assert.equal(mediaRes.status,200); assert.equal(sha(Buffer.from(await mediaRes.arrayBuffer())),state.media.sha256);
  const anonymousDraft=await probeFetch(origin+'/?p='+state.draftId,{redirect:'manual'}); assert.equal(anonymousDraft.status,404); assert.ok(!(await anonymousDraft.text()).includes('PLAYTT_PRIVATE_DO_DRAFT'));
  const anonymousAdmin=await probeFetch(origin+'/wp-admin/',{redirect:'manual'}); assert.equal(anonymousAdmin.status,302); assert.ok(anonymousAdmin.headers.get('location').includes('wp-login.php'));
  const report={at:new Date().toISOString(),origin,mode,scope:remote?'Remote isolated DO/R2 CMS probe':'Local DO execution / simulated R2; not remote acceptance',result:'pass',assertions:['WordPress login','authenticated post read','published post visible','media SHA256 exact','anonymous draft denied','anonymous admin redirected'],state,requests:checks};
  await writeFile(prefix+'-'+mode+'.json',JSON.stringify(report,null,2)); console.log(JSON.stringify(report));
} catch(error) { await writeFile(prefix+'-failure.json',JSON.stringify({at:new Date().toISOString(),origin,mode,error:String(error),requests:checks},null,2)); throw error; }
