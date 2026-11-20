import assert from 'node:assert/strict';
import { access } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { client, origin, source, bucket, load, save, hash, validateConfig } from './playtt-pin-restore-lib.mjs';
import { checkReferenceCoverage } from './playtt-reference-coverage.mjs';

assert.ok(process.argv.includes('--remote'));
const mode=process.argv.find(a=>['--preflight','--run'].includes(a));assert.ok(mode);
await validateConfig();const config=await load('wrangler.playtt-pin-restore-audit.jsonc');assert.equal(config.vars.PLAYTT_R2_WRITE_TRACKING,'v1');
for(const key of ['d1_databases','queues','services','workflows'])assert.ok(!config[key]);
const prefix='artifacts/playtt-reference-roots-',basePath=prefix+'before-private.json',guardPath=prefix+'guard-private.json';
const c=await client(), sc=await client(source);
const exists=async path=>{try{await access(path);return true;}catch(e){if(e.code==='ENOENT')return false;throw e;}};
const get=async(path,body)=>{const r=await c.request(path,{method:body?'POST':'GET',headers:{...c.auth,'content-type':'application/json'},body:body?JSON.stringify(body):undefined});assert.equal(r.status,200,path+' status '+r.status);return r.json();};
const cap=body=>get('/__playtt-capacity',body);
const record=async()=>{
  const state=await c.operator('operator-fence-status'),budget=await cap(),registry=await get('/__playtt-backup-pins');
  assert.equal(state.coherent,true);assert.equal(state.state.version,16);assert.equal(state.state.pointer.revision,'8a06b16e-fe6c-428f-9785-3caf79d056a6');
  assert.equal(registry.generation,23);assert.equal(budget.writeTracking.pending,0);assert.equal((await c.control()).state,'paused');
  return {state:state.state,budget,registry,fenceActive:state.fence.active};
};
const sourceState=async()=>{const s=await sc.operator('operator-fence-status');assert.equal(s.coherent,true);assert.equal(s.state.version,309);assert.equal(s.fence.active,false);assert.equal((await sc.control()).state,'paused');return s.state;};
const report=async(name,data)=>{await save(prefix+name+'.json',{at:new Date().toISOString(),...data});console.log(JSON.stringify({report:name,result:data.result,...(data.coverage?{receipts:data.coverage.commitReceipts,revisions:data.coverage.referencedRevisions}:{} )}));};
async function inventory(path,listOnly=false){
  const args=['../../../playtt/experiments/cloudflare-wordpress/capacity/read-inventory.py','--config','../../../playtt-wrangler-config/.wrangler/config/default.toml','--output',path,'--bucket',bucket,'--all-publication-metadata',...(listOnly?['--list-only']:[])];
  let stdout='',stderr='';const code=await new Promise((resolve,reject)=>{const p=spawn('python',args,{windowsHide:true,env:{...process.env,PYTHONUTF8:'1'}});p.stdout.on('data',x=>stdout+=x);p.stderr.on('data',x=>stderr+=x);p.on('error',reject);p.on('close',resolve);});
  await save(path+'.log-private.json',{code,stdout,stderr});assert.equal(code,0,'Read-only inventory process failed; inspect private log, do not blindly replay audit');return load(path);
}
if(mode==='--preflight'){
  assert.equal(await exists(basePath),false,'Do not overwrite the baseline');
  const before=await record();assert.equal(before.fenceActive,false);assert.equal(before.budget.writeTracking.sealed,false);
  assert.equal(before.budget.reservationSchema,'playtt/r2-write-reservation/v1');
  const prior=await load('artifacts/playtt-write-drain-final-status.json');
  assert.equal(hash(before.state),hash(prior.targetState));assert.equal(hash(before.budget),hash(prior.budget));
  await save(basePath,{origin,bucket,...before,sourceState:await sourceState()});
  await report('preflight',{result:'pass',version:16,pins:23,pending:0,sealed:false,fenceActive:false,publisher:'paused',sourceVersion:309,checks:c.checks});
}else{
  const before=await load(basePath);assert.equal(before.origin,origin);assert.equal(await exists(guardPath),false,'Inspect existing guard; completed audits must not be replayed');
  const current=await record();assert.equal(hash(current),hash({state:before.state,budget:before.budget,registry:before.registry,fenceActive:before.fenceActive}));
  const guard={origin,bucket,drainToken:randomUUID(),phase:'before-fence',released:false};await save(guardPath,guard);
  let result;
  try{
    const anonymous=await fetch(origin+'/__playtt-reference-roots',{redirect:'manual',signal:AbortSignal.timeout(30000)});assert.equal(anonymous.status,404);
    const unauthorized=await c.request('/__playtt-reference-roots');assert.equal(unauthorized.status,401);
    const wrongMethod=await c.request('/__playtt-reference-roots',{method:'POST',headers:c.auth});assert.equal(wrongMethod.status,405);
    guard.fence=await c.operator('operator-fence-acquire',{ttlSeconds:600});guard.phase='fenced';await save(guardPath,guard);
    const sealed=await cap({action:'acquire-write-drain',fenceToken:guard.fence.token,drainToken:guard.drainToken});assert.equal(sealed.writeTracking.sealed,true);guard.phase='sealed';await save(guardPath,guard);
    const roots=await get('/__playtt-reference-roots');assert.equal(roots.fence.active,true);assert.equal(roots.lease,null);assert.equal(roots.version,16);
    await save(prefix+'catalog-private.json',roots);
    const inv=await inventory(prefix+'inventory-private.json'),coverage=checkReferenceCoverage(roots,inv,before.registry);
    const afterInv=await inventory(prefix+'after-inventory-private.json',true);
    const sorted=rows=>rows.slice().sort((a,b)=>a.key.localeCompare(b.key));assert.equal(hash(sorted(inv.objects)),hash(sorted(afterInv.objects)));
    const afterRoots=await get('/__playtt-reference-roots');assert.equal(hash(roots),hash(afterRoots));
    const during=await record();assert.equal(hash(during.state),hash(before.state));assert.equal(hash(during.registry),hash(before.registry));assert.equal(hash(during.budget),hash(sealed));
    result={result:'pass',coverage,version:16,sourceVersion:309,objects:inv.objects.length,payloadBytes:inv.objects.reduce((n,o)=>n+o.size,0),
      identicalRootReads:true,identicalObjectListings:true,coordinatorFenceHeld:true,trackedR2SealHeld:true,pending:0,
      contentOrR2Mutations:false,perVersionPhpRestore:false,atomicAcrossServices:false,
      privateCatalogSha256:hash(roots),privateInventorySha256:hash(inv),privateRegistrySha256:hash(before.registry),
      endpointChecks:{anonymous:404,operatorRequired:401,wrongMethod:405},
      safeToApply:false,scope:'Bounded reference export plus sealed target object metadata coverage; external writers and unknown-result reconciliation remain outside this proof'};
    guard.phase='verified';await save(guardPath,guard);
  }catch(error){await save(prefix+'failure-private.json',{errorName:error.name,message:error.message,phase:guard.phase});throw error;}
  finally{
    if(guard.fence){
      await c.operator('operator-fence-renew',{token:guard.fence.token,ttlSeconds:600});
      const released=await cap({action:'release-write-drain',fenceToken:guard.fence.token,drainToken:guard.drainToken});assert.equal(released.writeTracking.sealed,false);
      await c.operator('operator-fence-release',{token:guard.fence.token});guard.released=true;guard.phase=result?'complete':'failed-released';await save(guardPath,guard);
    }
  }
  const after=await record();assert.equal(hash(after),hash({state:before.state,budget:before.budget,registry:before.registry,fenceActive:before.fenceActive}));assert.equal(hash(await sourceState()),hash(before.sourceState));
  await report('remote',{...result,sealReleased:true,fenceReleased:true,finalStateUnchanged:true,finalLedgerUnchanged:true,publisher:'paused',checks:c.checks});
}
