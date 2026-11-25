import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
const remote=process.argv.includes('--remote');
const label=process.argv.find(s=>s.startsWith('--label='))?.slice(8)||'baseline';
assert.match(label,/^[a-z0-9-]+$/);
const origin=remote?'https://playtt-wp-free-cms-probe.muzhi-garden-platform.workers.dev':'http://127.0.0.1:9429';
const secrets=remote?JSON.parse(await readFile('../../../playtt-cms-secrets.json','utf8')):{WORDPRESS_OPERATOR_TOKEN:'playtt-cms-local-only-operator',WORDPRESS_ADMIN_PASSWORD:'playtt-cms-local-only-password'};
const checks=[],cookies=new Map();let nonce,id,original,restored=false;
async function request(path,options={}) {
 const headers=new Headers(options.headers);if(remote)headers.set('X-Playtt-Probe',secrets.WORDPRESS_OPERATOR_TOKEN);
 headers.set('cookie',[...cookies.values()].join('; '));
 const start=Date.now(),r=await fetch(origin+path,{...options,headers,redirect:'manual',signal:AbortSignal.timeout(90000)});
 if(remote&&r.headers.get('x-playtt-probe-state')!=='restore-v1')throw Error('Unexpected partition/status '+r.status);
 for(const raw of r.headers.getSetCookie()){const v=raw.split(';')[0];cookies.set(v.split('=')[0],v);}
 const result={path,method:options.method||'GET',status:r.status,wallMs:Date.now()-start};checks.push(result);console.log(JSON.stringify(result));return r;
}
async function api(path,body){const r=await request('/wp-json/wp/v2/'+path,{method:body?'POST':'GET',headers:{'content-type':'application/json','x-wp-nonce':nonce},body:body?JSON.stringify(body):undefined});assert.ok(r.ok,'REST '+path+' status '+r.status);return r.json();}
async function pause(){const r=await request('/__playtt-publishing',{method:'POST',headers:{authorization:'Bearer '+secrets.WORDPRESS_OPERATOR_TOKEN,'content-type':'application/json'},body:JSON.stringify({action:'pause'})});assert.equal(r.status,200);assert.equal((await r.json()).state,'paused');}
let error;
try {
 await pause();
 assert.equal((await request('/wp-login.php')).status,200);
 assert.equal((await request('/wp-login.php',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({log:'admin',pwd:secrets.WORDPRESS_ADMIN_PASSWORD,testcookie:'1','wp-submit':'Log In',redirect_to:origin+'/wp-admin/'})})).status,302);
 const admin=await request('/wp-admin/');assert.equal(admin.status,200);nonce=(await admin.text()).match(/"nonce":"([^"]+)"/)?.[1];assert.ok(nonce);
 const theme=(await api('themes?context=edit')).find(t=>t.stylesheet==='lets-play');assert.ok(theme);
 id=theme._links['wp:user-global-styles'][0].href.split('/').at(-1);original=await api('global-styles/'+id+'?context=edit');
 // Keep private backup of this experiment's exact original style, never publish it as a report.
 await writeFile('artifacts/playtt-memory-original-'+(remote?'remote':'local')+'.json',JSON.stringify(original));
 for(let round=0;round<2;round++){
  assert.equal((await request('/wp-admin/site-editor.php')).status,200);
  for(const endpoint of ['pages?context=edit&per_page=20','template-parts?context=edit','navigation?context=edit','settings'])await api(endpoint);
  await api('global-styles/'+id,{styles:{...original.styles,elements:{...original.styles?.elements,link:{color:{text:'var:preset|color|ink'}}}}});
  assert.equal((await api('global-styles/'+id+'?context=edit')).styles.elements.link.color.text,'var(--wp--preset--color--ink)');
  await api('global-styles/'+id,{styles:original.styles});
  const saved=await api('global-styles/'+id+'?context=edit');assert.deepEqual(saved.styles,original.styles);restored=true;
 }
}catch(e){error=String(e);}
finally {
 // One bounded cleanup attempt after a failure; never loop on the known remote limit.
 if(error&&id&&original)try{await api('global-styles/'+id,{styles:original.styles});restored=true;}catch{}
 try{await pause();}catch{}
 const report={at:new Date().toISOString(),scope:remote?'private restore-v1 only; publisher paused':'local emulator only',label,result:error?'fail':'pass',restored,checks,...(error?{error}:{})};
 await writeFile('artifacts/playtt-memory-workload-'+(remote?'remote-':'local-')+label+'.json',JSON.stringify(report,null,2));
 console.log(JSON.stringify({result:report.result,requests:checks.length,restored,error}));if(error)process.exitCode=1;
}
