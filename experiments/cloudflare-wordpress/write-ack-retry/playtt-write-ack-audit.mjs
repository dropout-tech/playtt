import assert from 'node:assert/strict';
import { access } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { client, origin, source, bucket, load, save, hash, readPlan, validateConfig } from './playtt-pin-restore-lib.mjs';

assert.ok(process.argv.includes('--remote'));
const mode=process.argv.find(x=>['--preflight','--save','--cold-cleanup'].includes(x));assert.ok(mode);
await validateConfig();assert.equal((await load('wrangler.playtt-pin-restore-audit.jsonc')).vars.PLAYTT_R2_WRITE_TRACKING,'v1');
const prefix='artifacts/playtt-write-ack-',basePath=prefix+'before-private.json',ownedPath=prefix+'owned-private.json';
const c=await client();let step=mode;
const exists=async path=>{try{await access(path);return true;}catch(e){if(e.code==='ENOENT')return false;throw e;}};
const exact=(a,b)=>assert.equal(hash(a),hash(b),'Private expected/actual comparison differs');
const get=async path=>{const r=await c.request(path,{headers:c.auth});assert.equal(r.status,200);return r.json();};
const budget=async()=>{const b=await get('/__playtt-capacity');assert.equal(b.reservationSchema,'playtt/r2-write-reservation/v1');assert.equal(b.writeTracking.pending,0);assert.equal(b.writeTracking.sealed,false);assert.ok(b.remainingBytes>0);return b;};
const state=async()=>{const s=await c.operator('operator-fence-status');assert.equal(s.coherent,true);assert.equal(s.fence.active,false);assert.equal((await c.control()).state,'paused');return s.state;};
const sourceState=async()=>{const sc=await client(source),s=await sc.operator('operator-fence-status');assert.equal(s.coherent,true);assert.equal(s.state.version,309);assert.equal(s.fence.active,false);assert.equal((await sc.control()).state,'paused');return s.state;};
const record=p=>({id:p.id,slug:p.slug,status:p.status,title:p.title?.raw,content:p.content?.raw});
const report=async(name,value)=>{await save(prefix+name+'.json',{at:new Date().toISOString(),bucket,...value});console.log(JSON.stringify({report:name,result:value.result,version:value.state?.version,ownedId:value.ownedId}));};
try{
 if(mode==='--preflight'){
  assert.equal(await exists(basePath),false,'Do not overwrite existing baseline');
  const before={origin,bucket,state:await state(),budget:await budget(),registry:await get('/__playtt-backup-pins'),sourceState:await sourceState()};
  assert.equal(before.state.version,16);assert.equal(before.registry.generation,23);
  const prior=await load('artifacts/playtt-reference-roots-before-private.json');exact(before.state,prior.state);exact(before.budget,prior.budget);exact(before.registry,prior.registry);
  await save(basePath,before);
  await report('preflight',{result:'pass',state:before.state,pins:23,pending:0,publisher:'paused',sourceVersion:309,payloadBoundBytes:before.budget.baselineBytes+before.budget.chargedBytes,checks:c.checks});
 }else{
  const before=await load(basePath);assert.equal(before.origin,origin);await readPlan();
  if(mode==='--save'){
   assert.equal(await exists(ownedPath),false,'Do not repeat owned creation');exact(await state(),before.state);exact(await budget(),before.budget);
   step='login-and-original';await c.login();const settings=await c.rest('settings');assert.equal(settings.status,200);
   const frontId=Number(settings.body.page_on_front);assert.ok(Number.isSafeInteger(frontId)&&frontId>0);
   const original=await c.rest('pages/'+frontId+'?context=edit');assert.equal(original.status,200);
   const owned={origin,marker:'playtt_write_ack_'+randomUUID(),phase:'before-create',cleanupComplete:false,frontId,original:record(original.body)};
   await save(ownedPath,owned);step='create';
   const created=await c.rest('pages',{title:owned.marker,status:'draft',content:''});assert.equal(created.status,201);owned.id=created.body.id;assert.ok(owned.id>186);owned.expected=record(created.body);owned.phase='created';await save(ownedPath,owned);
   step='save';const content='<!-- wp:paragraph --><p>寫入確認恢復：繁體中文與桌球內容保存。</p><!-- /wp:paragraph -->\n \t\n';
   const saved=await c.rest('pages/'+owned.id,{content});assert.equal(saved.status,200);owned.expected=record(saved.body);assert.equal(owned.expected.content,content);owned.phase='saved';await save(ownedPath,owned);
   const reread=await c.rest('pages/'+owned.id+'?context=edit');assert.equal(reread.status,200);exact(record(reread.body),owned.expected);
   const homepage=await c.rest('pages/'+frontId+'?context=edit');assert.equal(homepage.status,200);exact(record(homepage.body),owned.original);
   owned.savedState=await state();await save(ownedPath,owned);const b=await budget();exact(await sourceState(),before.sourceState);
   await report('saved',{result:'pass',state:owned.savedState,ownedId:owned.id,pending:0,exactContentAndTrailingWhitespace:true,originalFrontPageUnchanged:true,budget:b,
     scope:'Real native HTTP draft save and precise readback on candidate; no remote injected loss',checks:c.checks});
  }else{
   const owned=await load(ownedPath);assert.equal(owned.origin,origin);assert.equal(owned.phase,'saved');assert.equal(owned.cleanupComplete,false);
   exact(await state(),owned.savedState);step='cold-login-readback';await c.login();
   const cold=await c.rest('pages/'+owned.id+'?context=edit');assert.equal(cold.status,200);exact(record(cold.body),owned.expected);assert.equal(cold.body.title.raw,owned.marker);assert.equal(cold.body.status,'draft');
   const homepage=await c.rest('pages/'+owned.frontId+'?context=edit');assert.equal(homepage.status,200);exact(record(homepage.body),owned.original);
   step='second-save';const content=owned.expected.content+'<!-- wp:paragraph --><p>重新部署與全新登入後再次保存。</p><!-- /wp:paragraph -->\n \t\n';
   const saved=await c.rest('pages/'+owned.id,{content});assert.equal(saved.status,200);assert.equal(saved.body.content.raw,content);owned.expected=record(saved.body);owned.phase='recovered';await save(ownedPath,owned);
   const readback=await c.rest('pages/'+owned.id+'?context=edit');assert.equal(readback.status,200);exact(record(readback.body),owned.expected);
   step='owned-cleanup';const deleted=await c.rest('pages/'+owned.id+'?force=true',undefined,'DELETE');assert.equal(deleted.status,200);assert.equal(deleted.body.deleted,true);owned.phase='removed';owned.cleanupComplete=true;await save(ownedPath,owned);
   assert.equal((await c.rest('pages/'+owned.id+'?context=edit')).status,404);
   const finalHome=await c.rest('pages/'+owned.frontId+'?context=edit');assert.equal(finalHome.status,200);exact(record(finalHome.body),owned.original);
   const current=await state(),b=await budget();exact(await sourceState(),before.sourceState);
   await report('cold',{result:'pass',state:current,ownedId:owned.id,cleanupComplete:true,originalFrontPageUnchanged:true,exactContentAndTrailingWhitespace:true,budget:b,
     scope:'Fresh native login after same-code redeployment, exact draft readback, second save and guarded cleanup; no provider-fault injection or browser UI acceptance',checks:c.checks});
  }
 }
}catch(error){const stamp=new Date().toISOString().replace(/[:.]/g,'-');await save(prefix+'failure-'+stamp+'-private.json',{step,errorName:error.name,message:error.message});await report('failure-'+stamp,{result:'fail',step,errorName:error.name,checks:c.checks});process.exitCode=1;}
