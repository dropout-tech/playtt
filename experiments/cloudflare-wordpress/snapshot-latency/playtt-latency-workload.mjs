import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash,randomUUID} from 'node:crypto';
const remote=process.argv.includes('--remote');assert.ok(remote||process.argv.includes('--local'));assert.ok(!(remote&&process.argv.includes('--local')));
const label=process.argv.find(a=>a.startsWith('--label='))?.slice(8);assert.match(label||'',/^[a-z0-9-]{1,40}$/);
const origin=remote?'https://playtt-wp-free-restore-audit.muzhi-garden-platform.workers.dev':'http://127.0.0.1:9429';
const secrets=remote?JSON.parse(await readFile('../../../playtt-cms-secrets.json','utf8')):{WORDPRESS_ADMIN_PASSWORD:'playtt-cms-local-only-password',WORDPRESS_OPERATOR_TOKEN:'playtt-cms-local-only-operator'};
const cookies=new Map(),checks=[],evidence={};let nonce,created,error,beforeHash;
const marker='PLAYTT_LATENCY_'+randomUUID(),slug=marker.toLowerCase().replaceAll('_','-');
const content=version=>'<!-- wp:paragraph --><p>'+marker+' '+version+'</p><!-- /wp:paragraph -->';
const allowedContents=[content(1),content(2),content(3)];
const sha=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
async function request(path,options={}){
 const headers=new Headers(options.headers);headers.set('X-Playtt-Probe',secrets.WORDPRESS_OPERATOR_TOKEN);headers.set('cookie',[...cookies.values()].join('; '));
 const start=Date.now(),r=await fetch(origin+path,{...options,headers,redirect:'manual',signal:AbortSignal.timeout(120000)});
 if(remote)assert.equal(r.headers.get('x-playtt-probe-state'),'restore-v1');
 for(const raw of r.headers.getSetCookie()){const value=raw.split(';')[0];cookies.set(value.split('=')[0],value);}
 checks.push({at:new Date(start).toISOString(),path,method:options.method||'GET',status:r.status,wallMs:Date.now()-start});console.log(JSON.stringify(checks.at(-1)));return r;
}
async function api(path,body){const r=await request('/wp-json/wp/v2/'+path,{method:body?'POST':'GET',headers:{'content-type':'application/json','x-wp-nonce':nonce},body:body?JSON.stringify(body):undefined});assert.equal(r.status,body&&path==='pages'?201:200,'REST '+path);return r.json();}
async function state(){const r=await request('/__playtt-publishing',{headers:{authorization:'Bearer '+secrets.WORDPRESS_OPERATOR_TOKEN}});assert.equal(r.status,200);return r.json();}
async function pagesHash(){return sha((await api('pages?context=edit&per_page=100')).map(p=>({id:p.id,content:p.content.raw,status:p.status,title:p.title.raw})).sort((a,b)=>a.id-b.id));}
try{
 assert.equal((await state()).state,'paused');assert.equal((await request('/wp-login.php')).status,200);
 const login=await request('/wp-login.php',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({log:'admin',pwd:secrets.WORDPRESS_ADMIN_PASSWORD,testcookie:'1','wp-submit':'Log In',redirect_to:origin+'/wp-admin/'})});assert.equal(login.status,302);assert.equal(new URL(login.headers.get('location'),origin).origin,origin);
 const admin=await request('/wp-admin/');assert.equal(admin.status,200);const html=await admin.text();assert.ok(html.includes('lang="zh-TW"'));nonce=html.match(/"nonce":"([^"]+)"/)?.[1];assert.ok(nonce);
 beforeHash=await pagesHash();evidence.publishedPageHash=beforeHash;
 await writeFile('artifacts/playtt-latency-'+label+'-owned-private.json',JSON.stringify({origin,marker,slug,allowedContents}));
 created=await api('pages',{title:marker,slug,status:'draft',content:allowedContents[0]});assert.equal(created.status,'draft');
 for(let i=1;i<allowedContents.length;i++){await api('pages/'+created.id,{content:allowedContents[i]});assert.equal((await api('pages/'+created.id+'?context=edit')).content.raw,allowedContents[i]);}
 evidence.createdAndEdited=true;
}catch(e){error=String(e);}
finally{
 if(nonce)try{
  const owned=await api('pages?context=edit&status=draft&slug='+encodeURIComponent(slug));assert.ok(owned.length<=1);
  if(owned.length){const p=owned[0];assert.equal(p.title.raw,marker);assert.equal(p.status,'draft');assert.ok(allowedContents.includes(p.content.raw));const r=await request('/wp-json/wp/v2/pages/'+p.id+'?force=true',{method:'DELETE',headers:{'x-wp-nonce':nonce}});assert.equal(r.status,200);assert.equal((await r.json()).deleted,true);evidence.ownedDraftRemoved=true;}
  if(beforeHash){assert.equal(await pagesHash(),beforeHash);evidence.originalPagesUnchanged=true;}
  assert.equal((await state()).state,'paused');
 }catch(e){error=(error||'')+'; cleanup: '+String(e);}
 const report={at:new Date().toISOString(),label,environment:remote?'private independent remote audit':'local emulator',result:error?'fail':'pass',scope:'Login and three draft writes with exact readback, owned cleanup and unchanged published content; finite latency workload',evidence,checks,...(error?{error}:{})};await writeFile('artifacts/playtt-latency-'+label+'.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({result:report.result,evidence,error}));if(error)process.exitCode=1;
}
