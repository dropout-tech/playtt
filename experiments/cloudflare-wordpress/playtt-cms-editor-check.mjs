import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const origin='https://playtt-wp-free-cms-probe.muzhi-garden-platform.workers.dev',cookies=new Map(),checks=[];
const secrets=JSON.parse(await readFile('../../../playtt-cms-secrets.json','utf8'));
const theme=JSON.parse(await readFile('artifacts/playtt-cms-theme-remote-state.json','utf8'));
const marker='【遠端視覺編輯驗收】',sha=b=>createHash('sha256').update(b).digest('hex');
async function request(path,options={}){
  const url=new URL(path,origin);assert.equal(url.origin,origin);const headers=new Headers(options.headers);
  headers.set('X-Playtt-Probe',secrets.WORDPRESS_OPERATOR_TOKEN);headers.set('cookie',[...cookies.values()].filter(c=>url.pathname.startsWith(c.path)).map(c=>c.value).join('; '));
  const started=Date.now(),r=await fetch(url,{...options,headers,redirect:'manual',signal:AbortSignal.timeout(180000)});
  assert.equal(r.headers.get('x-playtt-probe-state'),'primary','Editor suite only operates original probe partition');
  for(const raw of r.headers.getSetCookie()){const value=raw.split(';')[0],path=raw.match(/;\s*path=([^;]+)/i)?.[1]||'/';cookies.set(value.split('=')[0]+path,{value,path});}
  checks.push({method:options.method||'GET',path:url.pathname,status:r.status,wallMs:Date.now()-started});console.log(JSON.stringify(checks.at(-1)));return r;
}
let nonce;
async function api(path,body){const r=await request('/wp-json/wp/v2/'+path,{method:body?'POST':'GET',headers:{'content-type':'application/json','x-wp-nonce':nonce},body:body?JSON.stringify(body):undefined});assert.ok(r.ok,'API failed '+path+' '+r.status);return r.json();}
try{
  assert.equal((await request('/wp-login.php')).status,200);
  assert.equal((await request('/wp-login.php',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({log:'admin',pwd:secrets.WORDPRESS_ADMIN_PASSWORD,redirect_to:origin+'/wp-admin/',testcookie:'1','wp-submit':'Log In'})})).status,302);
  const admin=await request('/wp-admin/');assert.equal(admin.status,200);nonce=(await admin.text()).match(/"nonce":"([^"]+)"/)?.[1];assert.ok(nonce);
  const about=await api('pages/'+theme.pages.about+'?context=edit');assert.ok(about.content.raw.includes(marker),'Native visual edit must have persisted');
  const revisions=await api('pages/'+theme.pages.about+'/revisions?context=edit&per_page=100');assert.ok(revisions.length>=2);assert.ok(revisions.some(x=>x.content.raw.includes(marker)));assert.ok(revisions.some(x=>!x.content.raw.includes(marker)));
  let state;
  if(process.argv.includes('--verify-restart'))state=JSON.parse(await readFile('artifacts/playtt-cms-editor-state.json','utf8'));
  else{
    const suffix=Date.now(),titles=['PLAYTT concurrent A '+suffix,'PLAYTT concurrent B '+suffix];
    const writes=await Promise.allSettled(titles.map(title=>api('posts',{title,content:'Private independent concurrent-write fixture',status:'draft'})));
    assert.ok(writes.every(x=>x.status==='fulfilled'));const posts=writes.map(x=>({id:x.value.id,title:x.value.title.raw||x.value.title.rendered}));assert.notEqual(posts[0].id,posts[1].id);
    const bytes=await readFile('../../../playtt/wordpress/lets-play/assets/images/children.webp');
    const uploaded=await request('/wp-json/wp/v2/media',{method:'POST',headers:{'content-type':'image/webp','content-disposition':'attachment; filename="playtt-normal-media.webp"','x-wp-nonce':nonce},body:bytes});assert.equal(uploaded.status,201);const media=await uploaded.json();
    const sizes=Object.values(media.media_details.sizes||{});assert.ok(sizes.length>0,'Unmarked ordinary image must retain native thumbnails');
    const thumb=await request(sizes[0].source_url);assert.equal(thumb.status,200);const thumbBytes=Buffer.from(await thumb.arrayBuffer());
    state={posts,aboutId:theme.pages.about,marker,revisionIds:revisions.map(r=>r.id),media:{id:media.id,url:media.source_url,sha256:sha(bytes),thumbnailUrl:sizes[0].source_url,thumbnailSha256:sha(thumbBytes),thumbnailSizes:Object.keys(media.media_details.sizes)}};
    await writeFile('artifacts/playtt-cms-editor-state.json',JSON.stringify(state,null,2));
  }
  for(const post of state.posts){const persisted=await api('posts/'+post.id+'?context=edit');assert.equal(persisted.title.raw,post.title);assert.equal(persisted.status,'draft');}
  for(const [url,hash]of [[state.media.url,state.media.sha256],[state.media.thumbnailUrl,state.media.thumbnailSha256]]){const r=await request(url);assert.equal(r.status,200);assert.equal(sha(Buffer.from(await r.arrayBuffer())),hash);}
  for(const id of state.revisionIds)assert.ok(revisions.some(r=>r.id===id),'Revision lost: '+id);
  const report={at:new Date().toISOString(),result:'pass',mode:process.argv.includes('--verify-restart')?'after-redeploy':'create',scope:'Remote visual edit persistence, revision records, independent concurrent draft writes and ordinary image thumbnails; no same-page merge or native revision-restore claim',state,checks};
  await writeFile('artifacts/playtt-cms-editor-'+report.mode+'.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}catch(error){await writeFile('artifacts/playtt-cms-editor-failure.json',JSON.stringify({at:new Date().toISOString(),error:String(error),checks},null,2));throw error;}
