import assert from 'node:assert/strict';
import {readFile,writeFile,access,mkdtemp} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {createHash} from 'node:crypto';
import {openSnapshotBundle} from './playtt-snapshot-bundle.mjs';
import {prepareLegacyAdoption,executeLegacyAdoption} from './playtt-legacy-adoption.mjs';
import {createAdoptionModel} from './playtt-adoption-model.mjs';
const windowCheck=process.argv.includes('--window-check');assert.deepEqual(process.argv.slice(2),windowCheck?['--offline','--window-check']:['--offline']);
const prefix='artifacts/playtt-legacy-adoption-'+(windowCheck?'window-':''),load=async p=>JSON.parse(await readFile(p,'utf8')),sha=b=>createHash('sha256').update(b).digest('hex'),ownerPath=prefix+'owned-private.json';
if(windowCheck){const prior=await load('artifacts/playtt-legacy-adoption-owned-private.json');assert.equal(prior.phase,'verified-models-with-unknown-write-stop');}
const toolHashes=Object.fromEntries(await Promise.all(['scripts/playtt-legacy-adoption.mjs','scripts/playtt-adoption-model.mjs','scripts/playtt-legacy-adoption-recorded.mjs'].map(async p=>[p,sha((await readFile(p,'utf8')).replaceAll('\r\n','\n'))])));
await access(ownerPath).then(()=>{throw Error('Recorded adoption models already exist; do not replay');},e=>{if(e.code!=='ENOENT')throw e;});
const source=await load('artifacts/playtt-envelope-provider-backup-owned-private.json'),target=await load('artifacts/playtt-legacy-content-owned-private.json'),sourcePlan=await load('artifacts/playtt-envelope-provider-source-plan.json');assert.equal(source.phase,'verified');assert.equal(target.phase,'converted');assert.equal(source.anchor.revision,'84fea105-9e00-41ad-abba-23ba958cc215');
for(const e of sourcePlan.sources)assert.equal(sha((await readFile(e.path,'utf8')).replaceAll('\r\n','\n')),e.sha256);
const prepared=await prepareLegacyAdoption({sourceDirectory:source.directory+'/independent',sourceAnchor:source.anchor,targetDirectory:target.directory+'/independent',targetAnchor:target.anchor,sourceVersion:177}),baseline=await openSnapshotBundle(source.directory+'/independent',source.anchor);
const safePlan={...prepared.plan,objects:prepared.plan.objects.map(o=>({key:o.key,size:o.bytes.length,sha256:o.sha256})),digest:prepared.digest};await writeFile(prefix+'plan.json',JSON.stringify(safePlan,null,2)+'\n',{flag:'wx'});
const directory=await mkdtemp(resolve('artifacts/legacy-adoption-')),owner={phase:'modeling',directory,planDigest:prepared.digest,sourceAnchor:source.anchor,targetAnchor:target.anchor};await writeFile(ownerPath,JSON.stringify(owner,null,2),{flag:'wx'});const results=[];
try{
 for(const mode of ['happy','settled-response-loss','adopted-pointer-pending','ambiguous-storage-write']){
  const model=await createAdoptionModel(prepared.plan,baseline.graph),run=()=>executeLegacyAdoption({...prepared,io:model.io,journal:model.journal});let firstError=null;
  if(mode==='settled-response-loss')model.faults.stageResponseAfter=true;
  if(mode==='adopted-pointer-pending')model.faults.pointerBefore=true;
  if(mode==='ambiguous-storage-write')model.faults.rawAfter=prepared.plan.objects[0].key;
  try{await run();}catch(e){firstError=e.message;}
  const intermediate=await model.io.inspect();let finalResult;
  if(mode==='ambiguous-storage-write'){
   assert.equal(intermediate.pending,1);assert.equal(intermediate.state.version,177);model.restart();await assert.rejects(run(),/Pending storage attempt/);await assert.rejects(model.close(),/tracking\/acquire/);finalResult='stopped-with-original-state-and-unsettled-ticket';
  }else{
   if(firstError){model.restart();await run();}const before=model.writes.length;await run();assert.equal(model.writes.length,before);const complete=await model.io.inspect();assert.equal(complete.state.version,178);assert.deepEqual(complete.state.pointer,complete.r2Pointer);assert.equal((await model.io.listPins()).length,3);await model.close();await model.releaseFence();finalResult='verified-and-sealed';
  }
  const state=await model.io.inspect(),budget=await model.status();
  await writeFile(join(directory,mode+'-private.json'),JSON.stringify({coordinator:[...model.coordinatorStorage.values],budget:[...model.budgetStorage.values],events:model.events}));
  results.push({mode,result:finalResult,firstError,intermediate:{version:intermediate.state.version,pointer:intermediate.state.pointer,r2Pointer:intermediate.r2Pointer,pending:intermediate.pending},final:{version:state.state.version,pointer:state.state.pointer,r2Pointer:state.r2Pointer,fenceOwned:state.fenceOwned},chargedBytes:budget.chargedBytes,chargedPuts:budget.chargedPuts,pending:budget.writeTracking.pending,sealed:budget.writeTracking.sealed,windowClosed:budget.writeTracking.window.closed,stats:model.stats,journal:model.events,originalTwoModelPinsPreserved:(await model.io.listPins()).some(x=>x.revision===prepared.plan.source.revision)});
 }
 const success=results.filter(x=>x.result==='verified-and-sealed');assert.ok(success.every(x=>x.chargedBytes===432931&&x.chargedPuts===7&&x.pending===0&&x.sealed));assert.equal(results.at(-1).stats.adopts,0);
 const report={schema:'playtt/legacy-adoption-recorded-model/v1',at:new Date().toISOString(),result:'pass-with-explicit-unknown-storage-stop',planDigest:prepared.digest,sourceVersion:177,targetVersion:178,sourceFilesVerified:81,model:'Actual coordinator/pin/budget classes over in-memory R2 and durable-storage models; not workerd/Cloudflare',existingPinsInEachModel:2,allContentBytesPreservedByPreparedPlan:true,scenarios:results,successfulAdoptionBytes:432931,successfulAdoptionPuts:7,cloudRequests:0,cloudChanged:false,runtimeSourceChanged:false,actualProviderAdapterImplemented:false,unknownStorageOutcomeRecoveryImplemented:false,observedLimitations:['Existing operator coherent status does not compare R2 current.json; protocol reads both pointers and exact receipt independently.','A pending ambiguous R2 attempt is not cleared by object presence or restart; window closes but drain cannot seal, source remains177.','No actual network/conditional-write timing or Cloudflare control endpoint was tested.','Model existing pin count2 is not the live14-pin registry.','No safe remote scoped upload/ticket settlement API is provided by these scripts.'],goalStatus:'active'};
 for(const[p,h]of Object.entries(toolHashes))assert.equal(sha((await readFile(p,'utf8')).replaceAll('\r\n','\n')),h);report.toolHashes=toolHashes;report.windowAdmissionGuardsChecked=windowCheck;
 await writeFile(prefix+'summary.json',JSON.stringify(report,null,2)+'\n');owner.phase='verified-models-with-unknown-write-stop';await writeFile(ownerPath,JSON.stringify(owner,null,2));console.log(JSON.stringify({result:report.result,scenarios:results.map(x=>({mode:x.mode,result:x.result,bytes:x.chargedBytes,pending:x.pending})),cloudRequests:0}));
}catch(e){owner.phase='failed';await writeFile(ownerPath,JSON.stringify(owner,null,2));throw e;}
