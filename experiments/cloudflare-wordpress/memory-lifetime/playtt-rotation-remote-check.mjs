import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
assert.ok(process.argv.includes('--remote'));
const origin='https://playtt-wp-free-cms-probe.muzhi-garden-platform.workers.dev';
const secrets=JSON.parse(await readFile('../../../playtt-cms-secrets.json','utf8'));
const checks=[],cookies=new Map();let nonce,error,completed=0;
const sha=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
async function request(path,options={}){
 const headers=new Headers(options.headers);headers.set('X-Playtt-Probe',secrets.WORDPRESS_OPERATOR_TOKEN);headers.set('cookie',[...cookies.values()].join('; '));
 const t=Date.now(),r=await fetch(origin+path,{...options,headers,redirect:'manual',signal:AbortSignal.timeout(90000)});
 checks.push({path,method:options.method||'GET',status:r.status,wallMs:Date.now()-t});
 assert.equal(r.headers.get('x-playtt-probe-state'),'restore-v1');
 for(const raw of r.headers.getSetCookie()){const v=raw.split(';')[0];cookies.set(v.split('=')[0],v);}return r;
}
async function api(path){const r=await request('/wp-json/wp/v2/'+path,{headers:{'x-wp-nonce':nonce}});assert.equal(r.status,200,'REST request '+completed+' '+path);return r.json();}
const endpoints=['pages?context=edit&per_page=20','template-parts?context=edit','navigation?context=edit','global-styles/42?context=edit','users/me?context=edit'];
const evidence={};
try{
 const s=await request('/__playtt-publishing',{headers:{authorization:'Bearer '+secrets.WORDPRESS_OPERATOR_TOKEN}});assert.equal(s.status,200);assert.equal((await s.json()).state,'paused');
 assert.equal((await request('/wp-login.php')).status,200);
 assert.equal((await request('/wp-login.php',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({log:'admin',pwd:secrets.WORDPRESS_ADMIN_PASSWORD,testcookie:'1','wp-submit':'Log In',redirect_to:origin+'/wp-admin/'})})).status,302);
 const admin=await request('/wp-admin/');assert.equal(admin.status,200);nonce=(await admin.text()).match(/"nonce":"([^"]+)"/)?.[1];assert.ok(nonce);
 const before=await api(endpoints[0]);evidence.pageHash=sha(before.map(p=>({id:p.id,status:p.status,content:p.content.raw})));
 const styles=(await api(endpoints[3])).styles;evidence.styleHash=sha(styles);
 for(let i=0;i<410;i++){
  const data=await api(endpoints[i%endpoints.length]);
  if(i%5===4)assert.equal(data.locale,'zh_TW');
  completed++;
  if(completed%25===0)console.log(JSON.stringify({completed,planned:410,lastWallMs:checks.at(-1).wallMs}));
 }
 assert.equal(sha((await api(endpoints[0])).map(p=>({id:p.id,status:p.status,content:p.content.raw}))),evidence.pageHash);
 assert.deepEqual((await api(endpoints[3])).styles,styles);
 evidence.contentUnchanged=true;
}catch(e){error=String(e);}
finally{
 const report={at:new Date().toISOString(),result:error?'fail':'pass',scope:'Private restore-v1 bounded sequential read-only editor workload; no retries; rotation is independently observed through numeric runtime-generation tail evidence',completed,planned:410,evidence,checks,...(error?{error}:{})};
 await writeFile('artifacts/playtt-rotation-remote.json',JSON.stringify(report,null,2));console.log(JSON.stringify({result:report.result,completed,error}));if(error)process.exitCode=1;
}
