import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
assert.ok(process.argv.includes('--remote'));
const expectInk=process.argv.includes('--expect-ink'),drain=process.argv.includes('--drain');
const origin='https://playtt-wp-free-cms-probe.muzhi-garden-platform.workers.dev';
const secrets=JSON.parse(await readFile('../../../playtt-cms-secrets.json','utf8'));
const original=JSON.parse(await readFile('artifacts/playtt-batch-remote-original-private.json','utf8'));
const originalStyle=JSON.parse(await readFile('artifacts/playtt-memory-original-remote.json','utf8'));
const cookies=new Map(),checks=[];let nonce,error;
const sha=s=>createHash('sha256').update(s).digest('hex');
async function request(path,options={}){
 const headers=new Headers(options.headers);headers.set('X-Playtt-Probe',secrets.WORDPRESS_OPERATOR_TOKEN);headers.set('cookie',[...cookies.values()].join('; '));
 const t=Date.now(),r=await fetch(origin+path,{...options,headers,redirect:'manual',signal:AbortSignal.timeout(90000)});
 checks.push({path,method:options.method||'GET',status:r.status,wallMs:Date.now()-t});
 assert.equal(r.headers.get('x-playtt-probe-state'),'restore-v1');
 for(const raw of r.headers.getSetCookie()){const v=raw.split(';')[0];cookies.set(v.split('=')[0],v);}return r;
}
async function api(path){const r=await request('/wp-json/wp/v2/'+path,{headers:{'x-wp-nonce':nonce}});assert.equal(r.status,200);return r.json();}
async function control(action){const r=await request('/__playtt-publishing',{method:action?'POST':'GET',headers:{authorization:'Bearer '+secrets.WORDPRESS_OPERATOR_TOKEN,'content-type':'application/json'},body:action?JSON.stringify({action}):undefined});assert.equal(r.status,200);return r.json();}
const evidence={};
try{
 assert.equal((await control()).state,'paused');
 assert.equal((await request('/wp-login.php')).status,200);
 assert.equal((await request('/wp-login.php',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({log:'admin',pwd:secrets.WORDPRESS_ADMIN_PASSWORD,testcookie:'1','wp-submit':'Log In',redirect_to:origin+'/wp-admin/'})})).status,302);
 const r=await request('/wp-admin/');assert.equal(r.status,200);const html=await r.text();assert.ok(html.includes('lang="zh-TW"')&&html.includes('控制台'));nonce=html.match(/"nonce":"([^"]+)"/)?.[1];assert.ok(nonce);
 assert.equal((await api('users/me?context=edit')).locale,'zh_TW');
 assert.ok(!(await api('plugins?context=edit')).some(p=>p.plugin==='playtt-zh-tw/playtt-zh-tw'));
 const style=await api('global-styles/'+originalStyle.id+'?context=edit');
 if(expectInk)assert.equal(style.styles.elements.link.color.text,'var(--wp--preset--color--ink)');
 else assert.deepEqual(style.styles,originalStyle.styles);
 evidence.style=expectInk?'native ink color persisted after redeployment':'exact original style restored';
 evidence.content=[];
 for(const key of ['about','course']){const expected=original[key],actual=await api('pages/'+expected.id+'?context=edit');assert.equal(actual.status,expected.status);assert.equal(actual.content.raw,expected.content.raw);evidence.content.push({slug:actual.slug,status:actual.status,sha256:sha(actual.content.raw)});}
 const part=await api('template-parts/'+encodeURIComponent(original.footer.id)+'?context=edit');assert.equal(part.content.raw,original.footer.content.raw);evidence.footerSha256=sha(part.content.raw);
 if(drain){
  assert.ok(!expectInk,'Only drain after native test has restored the original style');
  await control('resume');const started=Date.now();let idle=false;
  while(Date.now()-started<360000){const state=await control();assert.notEqual(state.state,'blocked');if(state.state==='idle'){idle=true;break;}await new Promise(r=>setTimeout(r,2500));}assert.ok(idle,'Publisher drain timeout');evidence.drainMs=Date.now()-started;
  const revisions=new Set();for(const path of ['/','/about/','/class/','/coaches/','/locations/','/partner/']){const r=await request('/__playtt-published'+path);assert.equal(r.status,200);const body=await r.text();assert.ok(!/PLAYTT_BATCH_|PLAYTT_SHARED_FOOTER_|PLAYTT_AUTOMATIC_PUBLICATION_/.test(body));revisions.add(r.headers.get('x-wp-codebox-publication-revision'));}assert.equal(revisions.size,1);evidence.sixPagesRestored=true;
 }
}catch(e){error=String(e);}
finally{
 if(drain)try{assert.equal((await control('pause')).state,'paused');}catch(e){error=(error||'')+'; pause: '+String(e);}
 const report={at:new Date().toISOString(),result:error?'fail':'pass',scope:'Private restore-v1 only; native styles and original content readback',expectInk,evidence,checks,...(error?{error}:{})};
 await writeFile('artifacts/playtt-lifetime-readback-'+(expectInk?'ink':'restored')+'.json',JSON.stringify(report,null,2));console.log(JSON.stringify({result:report.result,evidence,error}));if(error)process.exitCode=1;
}
