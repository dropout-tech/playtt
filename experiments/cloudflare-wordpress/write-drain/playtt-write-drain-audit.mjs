import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { client, origin, source, bucket, load, save, hash, validateConfig } from './playtt-pin-restore-lib.mjs';

assert.ok(process.argv.includes('--remote'));
const mode=process.argv.find(x=>['--prepare-migration','--initialize-and-seal','--cold-unseal-cleanup'].includes(x));assert.ok(mode);
await validateConfig();assert.equal((await load('wrangler.playtt-pin-restore-audit.jsonc')).vars.PLAYTT_R2_WRITE_TRACKING,'v1');
const prefix='artifacts/playtt-write-drain-',guardPath=prefix+'migration-private.json',ownedPath=prefix+'owned-private.json';
const c=await client();let guard,lastResponse,step=mode;
const report=async(name,value)=>{const result={at:new Date().toISOString(),bucket,...value};await save(prefix+name+'.json',result);console.log(JSON.stringify({report:name,result:value.result,version:value.version,pending:value.pending}));};
const capacity=async(body)=>{const r=await c.request('/__playtt-capacity',{method:body?'POST':'GET',headers:{...c.auth,'content-type':'application/json'},body:body?JSON.stringify(body):undefined});lastResponse={status:r.status,body:await r.json()};return lastResponse;};
const capOK=async(body)=>{const r=await capacity(body);assert.equal(r.status,200);return r.body;};
const state=()=>c.operator('operator-fence-status');
const record=p=>({id:p.id,slug:p.slug,status:p.status,title:p.title?.raw,content:p.content?.raw});
const exact=(a,b)=>assert.equal(hash(a),hash(b),'Private expected/actual comparison failed');
const rest=async(path,body,method)=>{lastResponse=await c.rest(path,body,method);return lastResponse;};
const sourceUnchanged=async()=>{const sc=await client(source),s=await sc.operator('operator-fence-status');assert.equal(s.coherent,true);assert.equal(s.state.version,309);assert.equal(s.state.pointer.revision,'c0ba467c-c422-41e8-861c-64926c69e1fb');assert.equal(s.fence.active,false);assert.equal((await sc.control()).state,'paused');return s.state;};
try{
 if(mode==='--prepare-migration'){
  let exists=false;try{await readFile(guardPath);exists=true;}catch(e){if(e.code!=='ENOENT')throw e;}assert.equal(exists,false,'Inspect the existing guard; do not replay migration');
  const previous=await load('artifacts/playtt-pin-restore-final-status.json'),observation=await load('artifacts/playtt-pin-restore-observation-summary.json');
  assert.equal(previous.result,'pass');assert.equal(observation.observerStopped,true);assert.equal(observation.requestFailures,0);assert.equal(observation.incompleteTraces,0);
  const current=await state(),budget=await capOK();assert.equal(current.coherent,true);assert.equal(current.fence.active,false);exact(current.state,previous.targetState);
  assert.equal(budget.chargedBytes,previous.budget.chargedBytes);assert.equal(budget.chargedPuts,previous.budget.chargedPuts);assert.equal(budget.writeTracking,undefined);
  assert.equal((await c.control()).state,'paused');await sourceUnchanged();
  const pinsResponse=await c.request('/__playtt-backup-pins',{headers:c.auth});assert.equal(pinsResponse.status,200);const registry=await pinsResponse.json();assert.equal(registry.generation,22);
  guard={origin,bucket,phase:'before-fence',drainToken:randomUUID(),beforeState:current.state,beforeBudget:budget,registry,legacyProof:{scope:'This newly isolated owner-only target; all known upload/native sessions completed and full observation recorded no pending failures. Not a general inference for an arbitrary existing bucket.',events:observation.events,knownCompletedChargedPuts:budget.chargedPuts}};
  await save(guardPath,guard);
  const fence=await c.operator('operator-fence-acquire',{ttlSeconds:600});guard.fence=fence;guard.fenceReleased=false;guard.phase='fenced-before-deploy';await save(guardPath,guard);
  exact((await state()).state,guard.beforeState);
  await report('preflight',{result:'pass',version:current.state.version,protectedPins:registry.generation,legacyProof:guard.legacyProof,publisher:'paused',sourceVersion:309,checks:c.checks});
 }else{
  guard=await load(guardPath);assert.equal(guard.origin,origin);assert.equal(guard.bucket,bucket);
  assert.equal(guard.fenceReleased,false);await c.operator('operator-fence-renew',{token:guard.fence.token,ttlSeconds:600});
  if(mode==='--initialize-and-seal'){
   assert.equal(guard.phase,'fenced-before-deploy');step='initialize-tracking';
   let budget=await capOK();assert.equal(budget.trackingConfigured,true);exact((await state()).state,guard.beforeState);
   budget=await capOK({action:'initialize-write-tracking',fenceToken:guard.fence.token,legacyWritersDrained:true});
   assert.equal(budget.reservationSchema,'playtt/r2-write-reservation/v1');assert.equal(budget.writeTracking.pending,0);assert.equal(budget.writeTracking.sealed,false);
   assert.equal(budget.chargedBytes,guard.beforeBudget.chargedBytes);assert.equal(budget.chargedPuts,guard.beforeBudget.chargedPuts);
   guard.phase='tracking-initialized';await save(guardPath,guard);
   await c.operator('operator-fence-release',{token:guard.fence.token});guard.fenceReleased=true;await save(guardPath,guard);
   step='native-save';await c.login();
   let exists=false;try{await readFile(ownedPath);exists=true;}catch(e){if(e.code!=='ENOENT')throw e;}assert.equal(exists,false);
   const owned={origin,marker:'playtt_write_drain_'+randomUUID(),phase:'before-create',cleanupComplete:false};await save(ownedPath,owned);
   const created=await rest('pages',{title:owned.marker,status:'draft',content:''});assert.equal(created.status,201);owned.id=created.body.id;owned.expected=record(created.body);owned.phase='created';await save(ownedPath,owned);assert.ok(owned.id>185);
   const content='<!-- wp:paragraph --><p>寫入排空：繁體中文保存測試。</p><!-- /wp:paragraph -->\n \t\n';
   const saved=await rest('pages/'+owned.id,{content});assert.equal(saved.status,200);owned.expected=record(saved.body);assert.equal(owned.expected.content,content);owned.phase='saved';await save(ownedPath,owned);
   const reread=await rest('pages/'+owned.id+'?context=edit');assert.equal(reread.status,200);exact(record(reread.body),owned.expected);
   step='seal-and-deny';guard.fence=await c.operator('operator-fence-acquire',{ttlSeconds:600});guard.fenceReleased=false;guard.phase='ready-to-seal';await save(guardPath,guard);
   budget=await capOK({action:'acquire-write-drain',fenceToken:guard.fence.token,drainToken:guard.drainToken});assert.equal(budget.writeTracking.pending,0);assert.equal(budget.writeTracking.sealed,true);
   guard.sealedState=(await state()).state;guard.sealedBudget=budget;guard.phase='sealed';await save(guardPath,guard);
   await c.operator('operator-fence-release',{token:guard.fence.token});guard.fenceReleased=true;await save(guardPath,guard);
   const denied=await rest('pages/'+owned.id,{content:'此內容不應在封存期間保存'});assert.equal(denied.status,503);assert.equal(denied.body.code,'playtt_storage_capacity_unavailable');
   const after=await state();assert.equal(after.coherent,true);exact(after.state,guard.sealedState);budget=await capOK();exact(budget,guard.sealedBudget);
   guard.fence=await c.operator('operator-fence-acquire',{ttlSeconds:600});guard.fenceReleased=false;guard.phase='sealed-awaiting-redeploy';await save(guardPath,guard);
   await report('sealed',{result:'pass',version:after.state.version,ownedId:owned.id,deniedStatus:denied.status,deniedCode:denied.body.code,pointerUnchanged:true,ledgerUnchanged:true,pending:0,sealed:true,scope:'Actual native update denied by durable R2 seal with the canonical fence released; canonical state and ledger unchanged',checks:c.checks});
  }else{
   assert.equal(guard.phase,'sealed-awaiting-redeploy');step='cold-seal-check';
   let budget=await capOK();exact(budget,guard.sealedBudget);exact((await state()).state,guard.sealedState);
   const retry=await capOK({action:'acquire-write-drain',fenceToken:guard.fence.token,drainToken:guard.drainToken});exact(retry,budget);
   const denied=await capacity({action:'release-write-drain',fenceToken:guard.fence.token,drainToken:randomUUID()});assert.equal(denied.status,409);exact(await capOK(),budget);
   step='release-seal';budget=await capOK({action:'release-write-drain',fenceToken:guard.fence.token,drainToken:guard.drainToken});assert.equal(budget.writeTracking.sealed,false);assert.equal(budget.writeTracking.pending,0);
   guard.phase='unsealed';await save(guardPath,guard);await c.operator('operator-fence-release',{token:guard.fence.token});guard.fenceReleased=true;await save(guardPath,guard);
   step='native-cold-cleanup';await c.login();const owned=await load(ownedPath);assert.equal(owned.origin,origin);assert.equal(owned.phase,'saved');
   const cold=await rest('pages/'+owned.id+'?context=edit');assert.equal(cold.status,200);exact(record(cold.body),owned.expected);
   const content=owned.expected.content+'<!-- wp:paragraph --><p>解除封存後保存成功。</p><!-- /wp:paragraph -->\n \t\n';
   const saved=await rest('pages/'+owned.id,{content});assert.equal(saved.status,200);owned.expected=record(saved.body);assert.equal(owned.expected.content,content);owned.phase='recovered';await save(ownedPath,owned);
   const reread=await rest('pages/'+owned.id+'?context=edit');assert.equal(reread.status,200);exact(record(reread.body),owned.expected);
   const deleted=await rest('pages/'+owned.id+'?force=true',undefined,'DELETE');assert.equal(deleted.status,200);assert.equal(deleted.body.deleted,true);owned.phase='removed';owned.cleanupComplete=true;await save(ownedPath,owned);
   assert.equal((await rest('pages/'+owned.id+'?context=edit')).status,404);
   const final=await state();assert.equal(final.coherent,true);assert.equal(final.fence.active,false);assert.equal((await c.control()).state,'paused');
   budget=await capOK();assert.equal(budget.writeTracking.pending,0);assert.equal(budget.writeTracking.sealed,false);await sourceUnchanged();
   guard.phase='native-cleanup-complete';await save(guardPath,guard);
   await report('cold',{result:'pass',version:final.state.version,ownedId:owned.id,cleanupComplete:true,sealSurvivedRedeploy:true,exactTrailingWhitespace:true,wrongDrainOwnerRejected:409,state:final.state,budget,sourceVersion:309,publisher:'paused',checks:c.checks});
  }
 }
}catch(error){
 const stamp=new Date().toISOString().replace(/[:.]/g,'-');await save(prefix+'failure-'+stamp+'-private.json',{step,lastResponse,errorName:error.name,message:error.message});
 await report('failure-'+stamp,{result:'fail',step,errorName:error.name,checks:c.checks});process.exitCode=1;
}
