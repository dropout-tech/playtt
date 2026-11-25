import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {request as httpsRequest} from 'node:https';
import {randomUUID,createHash} from 'node:crypto';
import {origin,privateClient} from './playtt-private-client.mjs';
assert.ok(process.argv.includes('--remote'));
const mode=process.argv.find(x=>['--capture','--disconnect','--queued-disconnect','--normal-cycle'].includes(x));assert.ok(mode);
const c=await privateClient(),prefix='artifacts/playtt-body-diagnostics-';
const report={at:new Date().toISOString(),origin,mode,result:'pending',checks:c.checks};
try{
 await c.paused();let status=await c.operator('operator-fence-status');assert.equal(status.coherent,true);assert.equal(status.fence.active,false);
 if(mode==='--capture'){
  const backup=JSON.parse(await readFile('artifacts/playtt-rebuild-ui-backup-after-native-ui.json','utf8'));assert.equal(backup.result,'pass');assert.equal(status.state.pointer.revision,backup.revision);assert.equal(status.state.version,133);
  await writeFile(prefix+'before-private.json',JSON.stringify(status.state,null,2));
  Object.assign(report,{result:'pass',scope:'Read-only predeployment state matches the complete native-UI cleanup backup',version:status.state.version,revision:status.state.pointer.revision,publisher:'paused'});
 }else if(mode==='--normal-cycle'){
  const file=prefix+'owned-private.json';let exists=false;try{await readFile(file);exists=true;}catch(e){if(e.code!=='ENOENT')throw e;}assert.ok(!exists,'Inspect existing owned fixture; do not recreate it');
  assert.equal(JSON.parse(await readFile(prefix+'queued-disconnect.json','utf8')).result,'pass');
  await c.login();const homeBefore=await c.rest('pages/24?context=edit');assert.equal(homeBefore.status,200);
  const hash=x=>createHash('sha256').update(x).digest('hex');
  const marker='playtt-body-diagnostics-'+randomUUID();
  const owned={origin,marker,id:null,content:'<!-- wp:paragraph -->\n<p>請求診斷：正常儲存第一版。</p>\n<!-- /wp:paragraph -->',cleanupComplete:false};
  await writeFile(file,JSON.stringify(owned,null,2));
  const created=await c.rest('pages',{slug:marker,title:marker,status:'draft',content:owned.content});assert.equal(created.status,201);owned.id=created.body.id;await writeFile(file,JSON.stringify(owned,null,2));
  owned.content='<!-- wp:paragraph -->\n<p>請求診斷：正常儲存第二版，保留繁中與 &amp; 標記。</p>\n<!-- /wp:paragraph -->';await writeFile(file,JSON.stringify(owned,null,2));
  const updated=await c.rest('pages/'+owned.id,{content:owned.content});assert.equal(updated.status,200);assert.equal(updated.body.content.raw,owned.content);
  const fresh=await privateClient();await fresh.paused();await fresh.login();
  const actual=await fresh.rest('pages/'+owned.id+'?context=edit');assert.equal(actual.status,200);assert.equal(actual.body.slug,marker);assert.equal(actual.body.title.raw,marker);assert.equal(actual.body.status,'draft');assert.equal(actual.body.content.raw,owned.content);
  const homeAfter=await fresh.rest('pages/24?context=edit');assert.equal(homeAfter.status,200);assert.equal(homeAfter.body.content.raw,homeBefore.body.content.raw);
  const deleted=await fresh.rest('pages/'+owned.id+'?force=true',undefined,'DELETE');assert.equal(deleted.status,200);assert.equal(deleted.body.deleted,true);assert.equal(deleted.body.previous.id,owned.id);assert.equal((await fresh.rest('pages/'+owned.id+'?context=edit')).status,404);
  owned.cleanupComplete=true;await writeFile(file,JSON.stringify(owned,null,2));await fresh.paused();
  c.checks.push(...fresh.checks);
  Object.assign(report,{result:'pass',scope:'After controlled disconnect: native authenticated create/update, fresh-session readback and identity-checked cleanup of an owned draft; original homepage content unchanged',id:owned.id,contentHash:hash(owned.content),homeHash:hash(homeBefore.body.content.raw),cleanupComplete:true,publisher:'paused'});
 }else{
  const initial=JSON.parse(await readFile(prefix+'before-private.json','utf8'));assert.deepEqual(status.state,initial,'Diagnostic-only redeployment must not alter canonical state');
  const warm=await c.request('/wp-login.php');assert.equal(warm.status,200);await warm.arrayBuffer();
  const before=await c.operator('operator-fence-status');assert.equal(before.coherent,true);assert.equal(before.fence.active,false);
  const secrets=JSON.parse(await readFile('../../../playtt-cms-secrets.json','utf8'));
  const complete=mode==='--queued-disconnect';
  // The full-body case overlaps one normal PHP read, approximating a browser
  // leaving while its heartbeat waits. Queue arrival order is not assumed.
  const overlapping=complete?c.request('/wp-login.php').then(async r=>{const status=r.status;await r.arrayBuffer();return {status};}).catch(()=>({status:0})):null;
  if(complete)await new Promise(r=>setTimeout(r,300));
  const transport={startedAt:new Date().toISOString(),declaredBytes:complete?21:2048,sentBytes:21,abortAfterMs:complete?700:5000,completeBodySent:complete,overlappingRead:complete,disconnected:false};
  await new Promise((done,fail)=>{
   let timer;
   const req=httpsRequest(origin+'/wp-admin/admin-ajax.php',{method:'POST',headers:{'x-playtt-probe':secrets.WORDPRESS_OPERATOR_TOKEN,'content-type':'application/x-www-form-urlencoded','content-length':String(transport.declaredBytes)}},res=>{clearTimeout(timer);res.resume();fail(Error('Controlled request responded before the planned disconnect'));});
   req.on('error',e=>{clearTimeout(timer);if(e.code==='ECONNRESET'){transport.disconnected=true;transport.endedAt=new Date().toISOString();done();}else fail(Error('Controlled transport failed outside expected disconnect'));});
   req.flushHeaders();req.write('action=heartbeat&data=');if(complete)req.end();timer=setTimeout(()=>req.destroy(),transport.abortAfterMs);
  });
  if(overlapping)assert.equal((await overlapping).status,200,'The unrelated overlapping read must complete');
  const recovery=await c.request('/wp-login.php');assert.equal(recovery.status,200);await recovery.arrayBuffer();
  const after=await c.operator('operator-fence-status');assert.equal(after.coherent,true);assert.equal(after.fence.active,false);assert.deepEqual(after.state,before.state,'Incomplete request must not change the canonical pointer or version');await c.paused();
  Object.assign(report,{result:'pass',scope:complete?'One complete unauthenticated heartbeat canceled while overlapping a normal read; canonical stability verified; execution-layer reason and queue order require separate evidence':'One intentionally incomplete unauthenticated heartbeat; client disconnect and canonical stability verified; execution-layer reason requires separate tail evidence',transport,version:after.state.version,revision:after.state.pointer.revision,canonicalUnchanged:true,publisher:'paused'});
 }
}catch(error){Object.assign(report,{result:'fail',error:String(error)});process.exitCode=1;}
await writeFile(prefix+mode.slice(2)+'.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
