import assert from 'node:assert/strict';
import {request as httpsRequest} from 'node:https';
import {readFile,writeFile} from 'node:fs/promises';
assert.ok(process.argv.includes('--remote'));
const origin='https://playtt-wp-free-restore-audit.muzhi-garden-platform.workers.dev';
const secret=JSON.parse(await readFile('../../../playtt-cms-secrets.json','utf8')).WORDPRESS_OPERATOR_TOKEN;
const checks=[];let error,before,after,disconnected=false;
async function get(path){const start=Date.now();const r=await fetch(origin+path,{headers:{'x-playtt-probe':secret},signal:AbortSignal.timeout(90000)});checks.push({at:new Date(start).toISOString(),path,status:r.status,wallMs:Date.now()-start});assert.equal(r.headers.get('x-playtt-probe-state'),'restore-v1');assert.equal(r.status,200);return r;}
async function control(path){const r=await fetch(origin+path,{headers:{'x-playtt-probe':secret,authorization:'Bearer '+secret},signal:AbortSignal.timeout(90000)});assert.equal(r.status,200);assert.equal(r.headers.get('x-playtt-probe-state'),'restore-v1');return r.json();}
try{
 assert.equal((await control('/__playtt-publishing')).state,'paused');
 await(await get('/wp-login.php')).text();await(await get('/wp-login.php')).text();
 before=(await control('/?phase=operator-fence-status')).state;
 await new Promise((resolve,reject)=>{
  const req=httpsRequest(origin+'/wp-admin/admin-ajax.php',{method:'POST',headers:{'x-playtt-probe':secret,'content-type':'application/x-www-form-urlencoded','content-length':'2048'}},res=>{res.resume();reject(Error('Incomplete request unexpectedly responded '+res.statusCode));});
  req.on('error',e=>{if(e.code==='ECONNRESET'){disconnected=true;resolve();}else reject(Error('Controlled connection test failed'));});
  req.flushHeaders();req.write('action=heartbeat&data=');setTimeout(()=>req.destroy(),2000);
 });
 await(await get('/wp-login.php')).text();after=(await control('/?phase=operator-fence-status')).state;
 assert.deepEqual(after,before,'Incomplete body must not change canonical state');
 assert.equal((await control('/__playtt-publishing')).state,'paused');
}catch(e){error=e instanceof Error?e.message:'Unknown test failure';}
const report={at:new Date().toISOString(),result:error?'fail':'pass',scope:'One intentional incomplete heartbeat transport disconnect on private audit only; canonical pointer/version must remain unchanged; tail separately proves whether PHP was reached',disconnected,canonicalUnchanged:!!before&&!!after&&JSON.stringify(before)===JSON.stringify(after),checks,...(error?{error}:{})};await writeFile('artifacts/playtt-aborted-body-remote.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));if(error)process.exitCode=1;
