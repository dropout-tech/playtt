import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const origin='http://127.0.0.1:9426', cookies=new Map(), checks=[];
const sha=b=>createHash('sha256').update(b).digest('hex');
const restart=process.argv.includes('--verify-restart');
async function request(route,options={}) {
  const url=new URL(route,origin);assert.equal(url.origin,origin);
  const headers=new Headers(options.headers);
  headers.set('cookie',[...cookies.values()].filter(c=>url.pathname.startsWith(c.path)).map(c=>c.value).join('; '));
  const started=performance.now();
  const r=await fetch(url,{...options,headers,redirect:'manual',signal:AbortSignal.timeout(90000)});
  for(const raw of r.headers.getSetCookie()) {
    const pair=raw.split(';')[0],name=pair.split('=')[0],path=raw.match(/;\s*path=([^;]+)/i)?.[1]||'/';
    cookies.set(name+path,{value:pair,path});
  }
  checks.push({method:options.method||'GET',path:url.pathname,status:r.status,wallMs:Math.round(performance.now()-started)});
  return r;
}
const nonceFrom=html=>html.match(/name=["']_wpnonce["'][^>]*value=["']([^"']+)["']/i)?.[1];
let nonce;
async function api(route,body){const r=await request('/wp-json/wp/v2/'+route,{method:body?'POST':'GET',headers:{'content-type':'application/json','x-wp-nonce':nonce},...(body?{body:JSON.stringify(body)}:{})});const t=await r.text();assert.ok(r.ok,route+': '+t.slice(0,600));return JSON.parse(t);}
async function importer(){const r=await request('/wp-admin/tools.php?page=lets-play-starter');assert.equal(r.status,200);const n=nonceFrom(await r.text());assert.ok(n);const imported=await request('/wp-admin/admin-post.php',{method:'POST',body:new URLSearchParams({_wpnonce:n,action:'lets_play_import',_wp_http_referer:'/wp-admin/tools.php?page=lets-play-starter'})});assert.equal(imported.status,302,await imported.clone().text());assert.ok(imported.headers.get('location').includes('imported=1'));}
let state;
try{
  await request('/wp-login.php');
  const login=await request('/wp-login.php',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({log:'admin',pwd:'playtt-local-probe-only-password',redirect_to:origin+'/wp-admin/',testcookie:'1','wp-submit':'Log In'})});assert.equal(login.status,302);
  const admin=await request('/wp-admin/');assert.equal(admin.status,200);nonce=(await admin.text()).match(/"nonce":"([^"]+)"/)?.[1];assert.ok(nonce);
  if(restart){state=JSON.parse(await readFile('artifacts/playtt-theme-state.json','utf8'));}
  else{
    const zip=await readFile(process.env.PLAYTT_THEME_ZIP || '../../../../outputs/lets-play-theme-0.2.1.zip');assert.equal(sha(zip),'7aa5671c6fc1ee3e78e0f753158ca4b0db90ffe6f5cfc275695bd07f648d27af','This reproducible probe requires the archived 0.2.1 ZIP; set PLAYTT_THEME_ZIP.');
    const uploadPage=await request('/wp-admin/theme-install.php?tab=upload');assert.equal(uploadPage.status,200);const installNonce=nonceFrom(await uploadPage.text());assert.ok(installNonce);
    const form=new FormData();form.set('_wpnonce',installNonce);form.set('_wp_http_referer','/wp-admin/theme-install.php?tab=upload');form.set('themezip',new File([zip],'lets-play.zip',{type:'application/zip'}));form.set('install-theme-submit','Install Now');
    const installed=await request('/wp-admin/update.php?action=upload-theme',{method:'POST',body:form});const installedHtml=await installed.text();await writeFile('artifacts/playtt-theme-install.html',installedHtml);assert.equal(installed.status,200);assert.ok(!/<b>(Fatal error|Warning)<\/b>/.test(installedHtml));
    const activationHref=installedHtml.match(/href=["']([^"']*themes\.php\?action=activate[^"']+)["']/i)?.[1];assert.ok(activationHref,'Activation link missing; inspect installation artifact.');
    const activationUrl=new URL(activationHref.replaceAll('&#038;','&').replaceAll('&amp;','&'),origin+'/wp-admin/');const activated=await request(activationUrl);assert.ok([200,302].includes(activated.status));
    await importer();
    const pages=await api('pages?per_page=100&context=edit');state={zipSha256:sha(zip),pages:{},expectedAboutTitle:'關於 Let’s Play｜Worker 保存驗證'};
    for(const slug of ['home','about','class','coaches','locations','partner']){const p=pages.find(p=>p.slug===slug);assert.ok(p,'Missing page '+slug);state.pages[slug]=p.id;}
    await api('settings',{show_on_front:'page',page_on_front:state.pages.home,title:'Let’s Play 桌球聯盟',description:'從喜歡開始，一起玩桌球。'});
    await api('pages/'+state.pages.about,{title:state.expectedAboutTitle});
    const mediaBefore=await api('media?per_page=100');assert.equal(mediaBefore.length,15);
    await importer();const pagesAfter=await api('pages?per_page=100&context=edit');assert.equal(pagesAfter.length,pages.length);assert.equal((await api('media?per_page=100')).length,15);
    const aboutAfter=pagesAfter.find(p=>p.id===state.pages.about);assert.equal(aboutAfter.title.raw,state.expectedAboutTitle);
    const asset=mediaBefore.find(m=>m.source_url.endsWith('/brand-desktop.webp'));assert.ok(asset);state.brand={url:asset.source_url,sha256:sha(Buffer.from(await (await fetch(asset.source_url)).arrayBuffer()))};
    await writeFile('artifacts/playtt-theme-state.json',JSON.stringify(state,null,2));
  }
  const themes=await api('themes?status=active');assert.equal(themes.length,1);assert.equal(themes[0].stylesheet,'lets-play');assert.equal(themes[0].version,'0.2.1');
  const about=await api('pages/'+state.pages.about+'?context=edit');assert.equal(about.title.raw,state.expectedAboutTitle);
  for(const slug of ['','about/','class/','coaches/','locations/','partner/']){const r=await fetch(origin+'/'+slug,{redirect:'manual',signal:AbortSignal.timeout(60000)});assert.equal(r.status,200,slug);const html=await r.text();assert.ok(html.includes('line.me/R/ti/p/@869usyqy'));assert.ok(!html.includes('id="wpadminbar"'));}
  const media=await fetch(state.brand.url);assert.equal(media.status,200);assert.equal(media.headers.get('x-wp-codebox-static'),'r2-upload');assert.equal(sha(Buffer.from(await media.arrayBuffer())),state.brand.sha256);
  const style=await fetch(origin+'/wp-content/themes/lets-play/style.css');assert.equal(style.status,200);assert.equal(style.headers.get('x-wp-codebox-static'),'r2-wp-content');assert.ok((await style.text()).includes('Version: 0.2.1'));
  const report={scope:'Local workerd / simulated R2 and SQLite DO only; not remote Free plan acceptance.',at:new Date().toISOString(),mode:restart?'after-restart':'install',result:'pass',theme:'0.2.1',state,checks};await writeFile('artifacts/playtt-theme-'+report.mode+'.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}catch(error){await writeFile('artifacts/playtt-theme-failure.json',JSON.stringify({at:new Date().toISOString(),error:String(error),checks},null,2));throw error;}
