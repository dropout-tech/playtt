import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { resolve } from 'node:path';

// This deliberately breaks only the isolated local R2 emulator job metadata. Never add --remote.
const origin='http://127.0.0.1:9429', operator='playtt-cms-local-only-operator';
const cookies=new Map(), checks=[], run=promisify(execFile);
const config='wrangler.playtt-cms-fresh-local.jsonc', state=resolve('../../../cf-cms-publish-state');
assert.ok(state.endsWith('cf-cms-publish-state'));
let jobKey;const jobBackup=resolve('artifacts/local-job-before-failure.json'),invalidJob=resolve('artifacts/local-invalid-job.json');
let nonce, removed=false, original, aboutId;
async function request(path,options={}){
  const headers=new Headers(options.headers);
  if(!options.anonymous)headers.set('cookie',[...cookies.values()].join('; '));
  const r=await fetch(origin+path,{...options,headers,redirect:'manual',signal:AbortSignal.timeout(90000)});
  if(r.headers.has('x-wp-codebox-publication-job'))jobKey=r.headers.get('x-wp-codebox-publication-job');
  if(!options.anonymous)for(const raw of r.headers.getSetCookie()){const v=raw.split(';')[0];cookies.set(v.split('=')[0],v);}
  checks.push({path,method:options.method||'GET',status:r.status});return r;
}
async function api(path,body){const r=await request('/wp-json/wp/v2/'+path,{method:body?'POST':'GET',headers:{'content-type':'application/json','x-wp-nonce':nonce},body:body?JSON.stringify(body):undefined});assert.ok(r.ok,'REST '+path+' '+r.status);return r.json();}
async function control(action){const r=await request('/__playtt-publishing',{anonymous:true,method:action?'POST':'GET',headers:{authorization:'Bearer '+operator,'content-type':'application/json'},body:action?JSON.stringify({action}):undefined});assert.equal(r.status,200);return r.json();}
async function idle(){const start=Date.now();while(Date.now()-start<120000){const s=await control();assert.notEqual(s.state,'blocked',JSON.stringify(s));if(s.state==='idle')return s;await new Promise(r=>setTimeout(r,1000));}throw Error('Publisher timed out');}
async function localR2(action,file){
  assert.match(jobKey,/^sites\/default\/publications\/jobs\/[0-9]{20}-[a-f0-9-]{36}\.json$/);
  const args=[resolve('node_modules/wrangler/bin/wrangler.js'),'r2','object',action,'playtt-wordpress-probe/'+jobKey,'--local','--persist-to',state,'--config',config,'--file',file];
  assert.ok(!args.includes('--remote'));
  await run(process.execPath,args,{cwd:process.cwd(),timeout:60000,maxBuffer:200000});
}
try {
  assert.equal((await request('/wp-login.php')).status,200);
  assert.equal((await request('/wp-login.php',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({log:'admin',pwd:'playtt-cms-local-only-password',testcookie:'1','wp-submit':'Log In',redirect_to:origin+'/wp-admin/'})})).status,302);
  nonce=(await (await request('/wp-admin/')).text()).match(/"nonce":"([^"]+)"/)?.[1];assert.ok(nonce);
  const about=(await api('pages?context=edit&per_page=100')).find(p=>p.slug==='about');assert.ok(about);aboutId=about.id;original=about.content.raw;
  await idle();const before=await request('/__playtt-published/about/',{anonymous:true});assert.equal(before.status,200);const revision=before.headers.get('x-wp-codebox-publication-revision');assert.ok(revision);
  await control('pause');assert.equal((await control()).state,'paused');
  const marker='PLAYTT_FAILURE_RECOVERY_'+Date.now();
  await api('pages/'+aboutId,{content:original+'\n<!-- wp:paragraph --><p>'+marker+'</p><!-- /wp:paragraph -->'});
  assert.equal((await control()).state,'paused');
  await localR2('get',jobBackup);const job=JSON.parse(await readFile(jobBackup,'utf8'));assert.equal(job.key,jobKey);
  await writeFile(invalidJob,JSON.stringify({schema:'deliberate-local-invalid-job'}));
  removed=true;await localR2('put',invalidJob);await control('resume');
  let failure;const start=Date.now();while(Date.now()-start<45000){const s=await control();if(s.error){failure=s;break;}await new Promise(r=>setTimeout(r,1000));}
  assert.ok(failure,'The deliberately invalid job must fail generation');assert.match(failure.error,/outbox entry is invalid or unavailable/);
  const retained=await request('/__playtt-published/about/',{anonymous:true});assert.equal(retained.status,200);assert.equal(retained.headers.get('x-wp-codebox-publication-revision'),revision);assert.ok(!(await retained.text()).includes(marker));
  assert.equal((await request('/__playtt-published/',{anonymous:true})).status,200);
  await localR2('put',jobBackup);removed=false;await control('retry');await idle();
  const recovered=await request('/__playtt-published/about/',{anonymous:true});assert.equal(recovered.status,200);assert.notEqual(recovered.headers.get('x-wp-codebox-publication-revision'),revision);assert.ok((await recovered.text()).includes(marker));
  await api('pages/'+aboutId,{content:original});await idle();original=undefined;
  const report={at:new Date().toISOString(),result:'pass',scope:'Local invalid-job failure retains the complete public revision; restore and explicit retry publishes the saved edit',failure,checks};
  await writeFile('artifacts/playtt-publication-job-recovery-local.json',JSON.stringify(report,null,2));console.log(JSON.stringify({result:report.result,scope:report.scope,requests:checks.length}));
}catch(error){console.error(error);await writeFile('artifacts/playtt-publication-job-recovery-failure.json',JSON.stringify({at:new Date().toISOString(),error:String(error),checks},null,2));process.exitCode=1;}
finally {
  if(removed){await localR2('put',jobBackup);await control('retry');}
  if(original!==undefined&&nonce&&aboutId){await idle();await api('pages/'+aboutId,{content:original});await idle();}
}
