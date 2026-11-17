import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const remote=process.argv.includes('--remote');assert.ok(remote||process.argv.includes('--local'));assert.ok(!(remote&&process.argv.includes('--local')));
const origin=remote?'https://playtt-wp-free-cms-probe.muzhi-garden-platform.workers.dev':'http://127.0.0.1:9429';
const secrets=remote?JSON.parse(await readFile('../../../playtt-cms-secrets.json','utf8')):{WORDPRESS_OPERATOR_TOKEN:'playtt-cms-local-only-operator',WORDPRESS_ADMIN_PASSWORD:'playtt-cms-local-only-password'};
const checks=[],cookies=new Map();let nonce,error,completed=0;
const sha=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
async function request(path,options={}){
 const headers=new Headers(options.headers);headers.set('X-Playtt-Probe',secrets.WORDPRESS_OPERATOR_TOKEN);headers.set('cookie',[...cookies.values()].join('; '));
 const t=Date.now(),r=await fetch(origin+path,{...options,headers,redirect:'manual',signal:AbortSignal.timeout(90000)});
 checks.push({path,method:options.method||'GET',status:r.status,wallMs:Date.now()-t});
 if(remote)assert.equal(r.headers.get('x-playtt-probe-state'),'restore-v1');
 for(const raw of r.headers.getSetCookie()){const v=raw.split(';')[0];cookies.set(v.split('=')[0],v);}return r;
}
async function api(path){const r=await request('/wp-json/wp/v2/'+path,{headers:{'x-wp-nonce':nonce}});assert.equal(r.status,200,'REST request '+completed+' '+path);return r.json();}
let endpoints=['pages?context=edit&per_page=20','template-parts?context=edit','navigation?context=edit','global-styles/42?context=edit','users/me?context=edit'];
const evidence={};
try{
 const s=await request('/__playtt-publishing',{headers:{authorization:'Bearer '+secrets.WORDPRESS_OPERATOR_TOKEN}});assert.equal(s.status,200);const initialState=await s.json();if(initialState.state!=='paused'){const p=await request('/__playtt-publishing',{method:'POST',headers:{authorization:'Bearer '+secrets.WORDPRESS_OPERATOR_TOKEN,'content-type':'application/json'},body:JSON.stringify({action:'pause'})});assert.equal(p.status,200);assert.equal((await p.json()).state,'paused');}
 assert.equal((await request('/wp-login.php')).status,200);
 assert.equal((await request('/wp-login.php',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({log:'admin',pwd:secrets.WORDPRESS_ADMIN_PASSWORD,testcookie:'1','wp-submit':'Log In',redirect_to:origin+'/wp-admin/'})})).status,302);
 const admin=await request('/wp-admin/');assert.equal(admin.status,200);nonce=(await admin.text()).match(/"nonce":"([^"]+)"/)?.[1];assert.ok(nonce);
 const theme=(await api('themes?context=edit')).find(t=>t.stylesheet==='lets-play');assert.ok(theme);const styleId=theme._links['wp:user-global-styles'][0].href.split('/').at(-1);endpoints[3]='global-styles/'+styleId+'?context=edit';const before=await api(endpoints[0]);evidence.pageHash=sha(before.map(p=>({id:p.id,status:p.status,content:p.content.raw})));
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
 const report={at:new Date().toISOString(),result:error?'fail':'pass',scope:remote?'Private restore-v1 bounded read-only editor workload with retirement between committed requests; no retries':'Local full WordPress read-only editor workload with retirement between committed requests',completed,planned:410,evidence,checks,...(error?{error}:{})};
 await writeFile('artifacts/playtt-retirement-'+(remote?'remote':'local')+'.json',JSON.stringify(report,null,2));console.log(JSON.stringify({result:report.result,completed,error}));if(error)process.exitCode=1;
}
