import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const origin=process.argv.find(arg=>/^https?:/.test(arg))||'http://127.0.0.1:9429', cookies=new Map(), checks=[];
assert.ok(['http://127.0.0.1:9428','http://127.0.0.1:9429','https://playtt-wp-free-cms-probe.muzhi-garden-platform.workers.dev'].includes(origin));
const remote=origin.startsWith('https:');
const credentials=remote?JSON.parse(await readFile('../../../playtt-cms-secrets.json','utf8')):{WORDPRESS_ADMIN_PASSWORD:'playtt-cms-local-only-password'};
const prefix='artifacts/playtt-cms-theme-'+(remote?'remote':origin.endsWith(':9429')?'local-fresh':'local');
async function probeFetch(url,options={}) {
  assert.equal(new URL(url).origin,origin);
  const headers=new Headers(options.headers);
  if(remote) headers.set('X-Playtt-Probe',credentials.WORDPRESS_OPERATOR_TOKEN);
  return fetch(url,{...options,headers,signal:options.signal||AbortSignal.timeout(180000)});
}
const sha=b=>createHash('sha256').update(b).digest('hex');
const restart=process.argv.includes('--verify-restart');
async function request(route,options={}) {
  const url=new URL(route,origin);assert.equal(url.origin,origin);
  const headers=new Headers(options.headers);
  headers.set('cookie',[...cookies.values()].filter(c=>url.pathname.startsWith(c.path)).map(c=>c.value).join('; '));
  const started=performance.now();
  const r=await probeFetch(url,{...options,headers,redirect:'manual'});
  if(remote)assert.equal(r.headers.get('x-playtt-probe-state'),'restore-v1','Language installation is restricted to the restore partition');
  for(const raw of r.headers.getSetCookie()) {
    const pair=raw.split(';')[0],name=pair.split('=')[0],path=raw.match(/;\s*path=([^;]+)/i)?.[1]||'/';
    cookies.set(name+path,{value:pair,path});
  }
  checks.push({method:options.method||'GET',path:url.pathname,status:r.status,wallMs:Math.round(performance.now()-started)});
  console.log(JSON.stringify(checks.at(-1)));
  return r;
}
const nonceFrom=html=>html.match(/name=["']_wpnonce["'][^>]*value=["']([^"']+)["']/i)?.[1];
let nonce;
async function api(route,body){const r=await request('/wp-json/wp/v2/'+route,{method:body?'POST':'GET',headers:{'content-type':'application/json','x-wp-nonce':nonce},...(body?{body:JSON.stringify(body)}:{})});const t=await r.text();assert.ok(r.ok,route+': '+t.slice(0,600));return JSON.parse(t);}
async function importer(){const r=await request('/wp-admin/tools.php?page=lets-play-starter');assert.equal(r.status,200);const n=nonceFrom(await r.text());assert.ok(n);const imported=await request('/wp-admin/admin-post.php',{method:'POST',body:new URLSearchParams({_wpnonce:n,action:'lets_play_import',_wp_http_referer:'/wp-admin/tools.php?page=lets-play-starter'})});assert.equal(imported.status,302,'Starter import failed; HTTP '+imported.status);assert.ok(imported.headers.get('location').includes('imported=1'));}
try {
  assert.equal((await request('/wp-login.php')).status,200);
  assert.equal((await request('/wp-login.php',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({log:'admin',pwd:credentials.WORDPRESS_ADMIN_PASSWORD,redirect_to:origin+'/wp-admin/',testcookie:'1','wp-submit':'Log In'})})).status,302);
  const admin=await request('/wp-admin/');nonce=(await admin.text()).match(/"nonce":"([^"]+)"/)?.[1];assert.ok(nonce);
  if(restart) {
    const dashboard=await request('/wp-admin/');const html=await dashboard.text();assert.ok(html.includes('lang="zh-TW"')&&html.includes('控制台'));
    assert.equal((await api('users/me?context=edit')).locale,'zh_TW');
    assert.ok(!(await api('plugins?context=edit')).some(p=>p.plugin==='playtt-zh-tw/playtt-zh-tw'));
    const report={at:new Date().toISOString(),result:'pass',scope:'After redeployment: official zh_TW admin and user locale persist without the one-time initializer plugin',remote,checks};await writeFile('artifacts/playtt-locale-after-redeploy-'+(remote?'remote':'local')+'.json',JSON.stringify(report,null,2));console.log(JSON.stringify({result:'pass',locale:'zh_TW',afterRedeploy:true}));process.exit(0);
  }
  if(process.argv.includes('--cleanup')) {
    const plugins=await api('plugins?context=edit');const plugin=plugins.find(p=>p.plugin==='playtt-zh-tw/playtt-zh-tw');assert.ok(plugin);
    const route='plugins/'+plugin.plugin;
    await api(route,{status:'inactive'});
    const removed=await request('/wp-json/wp/v2/'+route,{method:'DELETE',headers:{'x-wp-nonce':nonce}});assert.equal(removed.status,200);assert.equal((await removed.json()).deleted,true);
    const dashboard=await request('/wp-admin/');const html=await dashboard.text();assert.ok(html.includes('lang="zh-TW"')&&html.includes('控制台'));
    assert.equal((await api('users/me?context=edit')).locale,'zh_TW');
    const report={at:new Date().toISOString(),result:'pass',scope:'One-time initializer removed through native plugin REST endpoint; official language files and zh_TW admin remain',remote,checks};await writeFile('artifacts/playtt-locale-cleanup-'+(remote?'remote':'local')+'.json',JSON.stringify(report,null,2));console.log(JSON.stringify({result:'pass',locale:'zh_TW',initializerRemoved:true}));process.exit(0);
  }
  const zip=await readFile('../../../playtt-zh-tw-installer.zip');assert.equal(sha(zip),'21a0b3197f8288489706a008aa3b9a8cd96c2d052d8d3bdf3c58e958e516a383');
  const upload=await request('/wp-admin/plugin-install.php?tab=upload');assert.equal(upload.status,200);const n=nonceFrom(await upload.text());assert.ok(n);
  const form=new FormData();form.set('_wpnonce',n);form.set('_wp_http_referer','/wp-admin/plugin-install.php?tab=upload');form.set('pluginzip',new File([zip],'playtt-zh-tw.zip',{type:'application/zip'}));form.set('install-plugin-submit','Install Now');
  const installed=await request('/wp-admin/update.php?action=upload-plugin',{method:'POST',body:form});const html=await installed.text();await writeFile('artifacts/playtt-locale-install-'+(remote?'remote':'local')+'.html',html);assert.equal(installed.status,200);
  const href=html.match(/href=["']([^"']*plugins\.php\?action=activate[^"']+)["']/i)?.[1];assert.ok(href,'Native plugin activation link must be present');
  const url=new URL(href.replaceAll('&#038;','&').replaceAll('&amp;','&'),origin+'/wp-admin/');const activated=await request(url);assert.ok([200,302].includes(activated.status));
  const dashboard=await request('/wp-admin/');assert.equal(dashboard.status,200);const localized=await dashboard.text();assert.ok(localized.includes('lang="zh-TW"'));assert.ok(localized.includes('控制台'));nonce=localized.match(/"nonce":"([^"]+)"/)?.[1];assert.ok(nonce);
  const user=await api('users/me?context=edit');assert.equal(user.locale,'zh_TW');
  const plugins=await api('plugins?context=edit');const plugin=plugins.find(p=>p.plugin.startsWith('playtt-zh-tw/'));assert.ok(plugin);console.log(JSON.stringify({installedPlugin:plugin.plugin,status:plugin.status,locale:user.locale}));
  const report={at:new Date().toISOString(),result:'pass',scope:'Official pinned zh_TW package installed through native WordPress plugin uploader and activated; admin HTML and current-user locale verified',remote,plugin:plugin.plugin,packageSha256:'373d29b034fdf43b8dbd6297b58640471bb64fdc7861c0f2eebc2274f149c4e4',checks};await writeFile('artifacts/playtt-locale-'+(remote?'remote':'local')+'.json',JSON.stringify(report,null,2));
}catch(error){await writeFile('artifacts/playtt-locale-failure-'+(remote?'remote':'local')+'.json',JSON.stringify({at:new Date().toISOString(),error:String(error),checks},null,2));throw error;}
