import assert from 'node:assert/strict';
import {request as httpRequest} from 'node:http';
import {writeFile} from 'node:fs/promises';
assert.ok(process.argv.includes('--local'));
const label=process.argv.find(a=>a.startsWith('--label='))?.slice(8);assert.match(label||'',/^[a-z0-9-]{1,30}$/);
const origin='http://127.0.0.1:9429',checks=[];
async function get(path){const started=Date.now(),r=await fetch(origin+path,{signal:AbortSignal.timeout(90000)});checks.push({at:new Date(started).toISOString(),path,status:r.status,wallMs:Date.now()-started});assert.equal(r.status,200);return r;}
const state=async()=>{const r=await fetch(origin+'/?phase=operator-fence-status',{headers:{authorization:'Bearer playtt-cms-local-only-operator'},signal:AbortSignal.timeout(90000)});assert.equal(r.status,200);return (await r.json()).state;};
const paused=await fetch(origin+'/__playtt-publishing',{headers:{authorization:'Bearer playtt-cms-local-only-operator'}});assert.equal((await paused.json()).state,'paused');
await(await get('/wp-login.php')).text();await(await get('/wp-login.php')).text();
const before=await state();
await new Promise((resolve,reject)=>{
 const req=httpRequest(origin+'/wp-admin/admin-ajax.php',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded','content-length':'2048'}},res=>{res.resume();reject(Error('Incomplete request unexpectedly responded '+res.statusCode));});
 req.on('error',error=>{if(error.code==='ECONNRESET')resolve();else reject(error)});
 req.flushHeaders();req.write('action=heartbeat&data=');
 setTimeout(()=>req.destroy(),1200);
});
await(await get('/wp-login.php')).text();
const after=await state();assert.deepEqual(after,before,'Aborted incomplete body must not commit or retain a lease');
const report={at:new Date().toISOString(),result:'pass',scope:'Local incomplete HTTP body disconnected before PHP execution; canonical pointer/version unchanged and subsequent login page loads',label,checks};await writeFile('artifacts/playtt-aborted-body-'+label+'.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
