import assert from 'node:assert/strict';
import { access } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { client, origin, source, bucket, load, save, hash, validateConfig } from './playtt-pin-restore-lib.mjs';

assert.ok(process.argv.includes('--remote'));
const mode=process.argv.find(x=>['--prepare','--seal','--denied','--unseal','--verify','--cleanup'].includes(x));assert.ok(mode);
await validateConfig();
const prefix='artifacts/playtt-editor-recovery-',guardPath=prefix+'owned-private.json';
const c=await client();let owned,step=mode;
const exact=(a,b)=>assert.equal(hash(a),hash(b),'Private expected/actual comparison differs');
const record=p=>({id:p.id,slug:p.slug,status:p.status,title:p.title?.raw,content:p.content?.raw});
const get=async path=>{const r=await c.request(path,{headers:c.auth});assert.equal(r.status,200);return r.json();};
const cap=async body=>{const r=await c.request('/__playtt-capacity',{method:body?'POST':'GET',headers:{...c.auth,'content-type':'application/json'},body:body?JSON.stringify(body):undefined});assert.equal(r.status,200);return r.json();};
const state=async()=>{const s=await c.operator('operator-fence-status');assert.equal(s.coherent,true);assert.equal((await c.control()).state,'paused');return s;};
const sourceState=async()=>{const sc=await client(source),s=await sc.operator('operator-fence-status');assert.equal(s.coherent,true);assert.equal(s.fence.active,false);assert.equal(s.state.version,309);assert.equal((await sc.control()).state,'paused');return s.state;};
const report=async(name,value)=>{await save(prefix+name+'.json',{at:new Date().toISOString(),bucket,...value,checks:c.checks});console.log(JSON.stringify({report:name,result:value.result,ownedId:owned?.id,version:value.state?.version,editUrl:value.editUrl}));};
const persist=()=>save(guardPath,owned);
async function releaseFence(){if(owned.fence&&!owned.fenceReleased){await c.operator('operator-fence-release',{token:owned.fence.token});owned.fenceReleased=true;await persist();}}
try{
 if(mode==='--prepare'){
  let exists=false;try{await access(guardPath);exists=true;}catch(e){if(e.code!=='ENOENT')throw e;}assert.equal(exists,false,'Existing owned guard must not be replaced');
  const before=await state(),budget=await cap(),previous=await load('artifacts/playtt-write-ack-final-status.json');
  assert.equal(before.fence.active,false);assert.equal(before.state.version,22);exact(before.state,previous.targetState);
  assert.equal(budget.writeTracking.pending,0);assert.equal(budget.writeTracking.sealed,false);assert.ok(budget.remainingBytes>50000000);
  const registry=await get('/__playtt-backup-pins');assert.equal(registry.generation,24);
  owned={origin,bucket,phase:'preparing',cleanupComplete:false,beforeState:before.state,beforeBudget:budget,registry,sourceState:await sourceState(),marker:'playtt-editor-recovery-'+randomUUID(),drainToken:randomUUID()};await persist();
  await c.login();const settings=await c.rest('settings');assert.equal(settings.status,200);owned.frontId=Number(settings.body.page_on_front);assert.ok(owned.frontId>0);
  const home=await c.rest('pages/'+owned.frontId+'?context=edit');assert.equal(home.status,200);owned.originalHome=record(home.body);
  owned.beforeText='原始草稿：讓孩子與大人一起享受桌球。';owned.afterText='儲存失敗仍保留：孩子與大人一起享受桌球，恢復後再試。';
  owned.content='<!-- wp:paragraph -->\n<p>'+owned.beforeText+'</p>\n<!-- /wp:paragraph -->';
  owned.expectedContent=owned.content.replace(owned.beforeText,owned.afterText);
  const created=await c.rest('pages',{title:'編輯器儲存恢復驗收 '+owned.marker,slug:owned.marker,status:'draft',content:owned.content});assert.equal(created.status,201);
  owned.id=created.body.id;assert.ok(owned.id>191);owned.original=record(created.body);assert.equal(owned.original.content,owned.content);owned.phase='prepared';await persist();
  await report('prepared',{result:'pass',state:(await state()).state,editUrl:origin+'/wp-admin/post.php?post='+owned.id+'&action=edit',beforeText:owned.beforeText,afterText:owned.afterText,publisher:'paused'});
 }else{
  owned=await load(guardPath);assert.equal(owned.origin,origin);assert.equal(owned.bucket,bucket);assert.equal(owned.cleanupComplete,false);
  if(mode==='--seal'){
   assert.equal(owned.phase,'prepared');const current=await state();assert.equal(current.fence.active,false);
   owned.fence=await c.operator('operator-fence-acquire',{ttlSeconds:600});owned.fenceReleased=false;owned.phase='acquiring-seal';await persist();
   owned.sealedBudget=await cap({action:'acquire-write-drain',fenceToken:owned.fence.token,drainToken:owned.drainToken});assert.equal(owned.sealedBudget.writeTracking.sealed,true);assert.equal(owned.sealedBudget.writeTracking.pending,0);
   owned.sealedState=(await state()).state;owned.phase='sealed';await persist();await releaseFence();
   await report('sealed',{result:'pass',state:owned.sealedState,pending:0,sealed:true,canonicalFenceReleased:true});
  }else if(mode==='--denied'){
   assert.equal(owned.phase,'sealed');const current=await state();assert.equal(current.fence.active,false);exact(current.state,owned.sealedState);exact(await cap(),owned.sealedBudget);
   owned.phase='denied-checked';await persist();await report('denied',{result:'pass',state:current.state,canonicalUnchanged:true,ledgerUnchanged:true,scope:'Operator state and ledger after separately observed browser save refusal; no browser assertion inferred from this script'});
  }else if(mode==='--unseal'){
   assert.ok(['sealed','denied-checked','acquiring-seal'].includes(owned.phase));
   assert.ok((await cap()).remainingBytes>=30000000,'Insufficient verified headroom for login, retry and cleanup; retain the seal and investigate');
   const s=await state();if(!s.fence.active){owned.fence=await c.operator('operator-fence-acquire',{ttlSeconds:600});owned.fenceReleased=false;await persist();}
   else{assert.equal(owned.fenceReleased,false);await c.operator('operator-fence-renew',{token:owned.fence.token,ttlSeconds:600});}
   const budget=await cap({action:'release-write-drain',fenceToken:owned.fence.token,drainToken:owned.drainToken});assert.equal(budget.writeTracking.sealed,false);assert.equal(budget.writeTracking.pending,0);
   owned.phase='unsealed';await persist();await releaseFence();await report('unsealed',{result:'pass',state:(await state()).state,pending:0,sealed:false});
  }else{
   assert.ok(['unsealed','verified'].includes(owned.phase));assert.equal((await state()).fence.active,false);const budget=await cap();assert.equal(budget.writeTracking.sealed,false);assert.equal(budget.writeTracking.pending,0);
   await c.login();const item=await c.rest('pages/'+owned.id+'?context=edit');assert.equal(item.status,200);const actual=record(item.body);
   assert.equal(actual.id,owned.id);assert.equal(actual.slug,owned.marker);assert.equal(actual.title,owned.original.title);assert.equal(actual.status,'draft');assert.equal(actual.content,owned.expectedContent);
   const home=await c.rest('pages/'+owned.frontId+'?context=edit');assert.equal(home.status,200);exact(record(home.body),owned.originalHome);exact(await sourceState(),owned.sourceState);
   if(mode==='--verify'){owned.phase='verified';owned.expectedSaved=actual;await persist();await report('verified',{result:'pass',state:(await state()).state,exactRecoveredContent:true,originalHomeUnchanged:true,sourceUnchanged:true});}
   else{assert.equal(owned.phase,'verified');exact(actual,owned.expectedSaved);const deleted=await c.rest('pages/'+owned.id+'?force=true',undefined,'DELETE');assert.equal(deleted.status,200);assert.equal(deleted.body.deleted,true);assert.equal((await c.rest('pages/'+owned.id+'?context=edit')).status,404);
    owned.phase='removed';owned.cleanupComplete=true;await persist();const final=await state(),finalBudget=await cap();assert.equal(final.fence.active,false);assert.equal(finalBudget.writeTracking.pending,0);assert.equal(finalBudget.writeTracking.sealed,false);const registry=await get('/__playtt-backup-pins');assert.ok(registry.generation>=owned.registry.generation);for(const pin of owned.registry.pins)exact(registry.pins.find(p=>p.revision===pin.revision),pin);
    await report('cleanup',{result:'pass',state:final.state,budget:finalBudget,cleanupComplete:true,originalHomeUnchanged:true,sourceUnchanged:true,pins:registry.generation,publisher:'paused'});
   }
  }
 }
}catch(error){const stamp=new Date().toISOString().replace(/[:.]/g,'-');await save(prefix+'failure-'+stamp+'-private.json',{step,errorName:error.name,message:error.message});await report('failure-'+stamp,{result:'fail',step,errorName:error.name});process.exitCode=1;}
