// Explicitly isolated private acceptance target. Never unseals the old target.
import assert from 'node:assert/strict';
import {readFile,writeFile,access} from 'node:fs/promises';
import {createHash,randomUUID} from 'node:crypto';
import {resolve} from 'node:path';
import {spawn} from 'node:child_process';
import {registerBackupPin} from './playtt-backup-pin-client.mjs';
import {openSnapshotBundle} from './playtt-snapshot-bundle.mjs';
import {backupPinInput} from '../src/playtt-backup-pins.ts';

const account='3baadbd4abd9fd63c7f7e51664b26f67',worker='playtt-wp-free-session-audit',bucket='playtt-wordpress-session-audit';
const origin=`https://${worker}.muzhi-garden-platform.workers.dev`,old='https://playtt-wp-free-window-audit.muzhi-garden-platform.workers.dev';
const configName='wrangler.playtt-session-audit.jsonc',prefix='artifacts/playtt-session-provider-';
const load=async p=>JSON.parse(await readFile(p,'utf8')),save=(p,v)=>writeFile(p,JSON.stringify(v,null,2)+'\n');
const sha=b=>createHash('sha256').update(b).digest('hex');
const report=async(name,value)=>{const r={at:new Date().toISOString(),worker,bucket,...value};await save(prefix+name+'.json',r);console.log(JSON.stringify(r));return r;};
const mode=process.argv[2];assert.ok(['prepare','preflight','create','secrets','upload','bootstrap','expiry','status'].includes(mode));
const cfg=await load(configName);assert.equal(cfg.name,worker);assert.equal(cfg.account_id,account);assert.deepEqual(cfg.r2_buckets,[{binding:'WORDPRESS_STATE_BUCKET',bucket_name:bucket}]);
assert.equal(cfg.vars.PLAYTT_R2_CAPACITY_SCOPE,bucket);assert.equal(cfg.vars.PLAYTT_R2_CAPACITY_LIMIT_BYTES,'150000000');assert.equal(cfg.vars.PLAYTT_R2_WRITE_WINDOW,'v1');assert.equal(cfg.vars.PLAYTT_METADATA_OVERLAY,'v2');assert.equal(cfg.vars.PLAYTT_PROBE_GATE,'true');
assert.deepEqual(JSON.parse(cfg.vars.WORDPRESS_SITE_CONTEXTS),[{id:'default',hostname:new URL(origin).hostname,origin}]);
assert.ok(!cfg.routes&&!cfg.services&&!cfg.limits);assert.deepEqual(cfg.triggers.crons,[]);assert.ok(cfg.durable_objects.bindings.every(b=>!b.script_name));
if(mode==='prepare'){
  try{await access(prefix+'plan-private.json');throw Error('Existing plan: inspect rather than overwrite');}catch(e){if(e.code!=='ENOENT')throw e;}
  const location=await load('artifacts/playtt-window-lock-backup-owned-private.json');assert.equal(location.phase,'verified');
  const bundle=await openSnapshotBundle(location.directory+'/independent',location.anchor);
  const pin=backupPinInput(location.anchor);assert.equal(pin.revision,'34a7df5f-087f-4d50-925d-05a748c1d66e');assert.equal(pin.manifestSha256,'b57d9f7efb135fb26d53894c2c13d2d18555fbaf901c0ea3c7542c2a1a26484f');
  const receipt=await load(location.directory+'/export/retention-pin.json');assert.deepEqual(backupPinInput(receipt.pin),pin);assert.equal(receipt.generation,8);
  const verified={pin},objects=new Map();
  for(const item of bundle.graph.objects){
    assert.ok(item.key.startsWith('sites/default/')&&!item.key.includes('..')&&!item.key.endsWith('/current.json'));
    const file=resolve(location.directory,'independent/objects/'+item.sha256),bytes=await readFile(file);assert.equal(bytes.length,item.size);assert.equal(sha(bytes),item.sha256);
    assert.ok(!objects.has(item.key));objects.set(item.key,{key:item.key,file,size:item.size,sha256:item.sha256});
  }
  for(const [asset,file] of [['wordpress-runtime-artifact','cloudflare-wordpress-runtime-corpus.zip'],['wordpress-static-artifact','cloudflare-wordpress-static-corpus.bin'],['sqlite-database-integration-artifact','cloudflare-sqlite-database-integration.zip']]){
    const meta=await load('assets/'+asset+'.json'),info=meta.archive||meta.blob,path=resolve('artifacts',file),bytes=await readFile(path);assert.equal(bytes.length,info.size);assert.equal(sha(bytes),info.sha256);assert.ok(meta.key.startsWith('runtime/'));objects.set(meta.key,{key:meta.key,file:path,size:bytes.length,sha256:info.sha256});
  }
  const list=[...objects.values()],totalBytes=list.reduce((n,o)=>n+o.size,0);assert.ok(list.length<350&&totalBytes<120000000);
  const plan={worker,bucket,origin,pin:verified.pin,pointer:{revision:verified.pin.revision,manifestKey:verified.pin.manifestKey,persistedAt:verified.pin.persistedAt},objects:list,totalBytes,sourceDirectory:location.directory,selectedSourceVersion:57,allHistoricalPinsImported:false};
  const bytes=JSON.stringify(plan,null,2)+'\n';await writeFile(prefix+'plan-private.json',bytes);
  await report('prepared',{result:'pass',objects:list.length,payloadBytes:totalBytes,remainingPayloadAllowance:150000000-totalBytes,selectedSourceVersion:57,selectedPin:verified.pin,planSha256:sha(bytes),allHistoricalPinsImported:false,remoteMutations:0});process.exit(0);
}
assert.ok(process.argv.includes('--remote'));
const planBytes=await readFile(prefix+'plan-private.json'),plan=JSON.parse(planBytes),prepared=await load(prefix+'prepared.json');assert.equal(sha(planBytes),prepared.planSha256);assert.equal(plan.worker,worker);assert.equal(plan.bucket,bucket);
const secrets=await load('../../../playtt-cms-secrets.json');
const oauth=(await readFile('../../../playtt-wrangler-config/.wrangler/config/default.toml','utf8')).match(/^oauth_token\s*=\s*"([^"\r\n]+)"/m)?.[1];assert.ok(oauth);
async function api(path,init={}){
  assert.ok(path.startsWith(`/accounts/${account}/`));
  const method=init.method||'GET', allowed=[`/accounts/${account}/r2/buckets/${bucket}`,`/accounts/${account}/workers/scripts/${worker}/settings`,`/accounts/${account}/workers/scripts/${worker}/deployments`];
  if(method==='POST')assert.equal(path,`/accounts/${account}/r2/buckets`);
  else if(method==='PUT')assert.ok(path.startsWith(`/accounts/${account}/r2/buckets/${bucket}/objects/`));
  else assert.ok(method==='GET'&&(allowed.includes(path)||path.startsWith(`/accounts/${account}/r2/buckets/${bucket}/objects/`)));
  return fetch('https://api.cloudflare.com/client/v4'+path,{...init,method,headers:{authorization:'Bearer '+oauth,...init.headers},redirect:'error',signal:AbortSignal.timeout(120000)});
}
const auth={authorization:'Bearer '+secrets.WORDPRESS_OPERATOR_TOKEN,'X-Playtt-Probe':secrets.WORDPRESS_OPERATOR_TOKEN};
async function request(path,body,host=origin){
  assert.ok([origin,old].includes(host));assert.ok(path.startsWith('/')&&!path.startsWith('//'));
  if(host===old)assert.ok(body===undefined&&['/?phase=operator-fence-status','/__playtt-capacity','/__playtt-backup-pins','/__playtt-publishing'].includes(path));
  return fetch(host+path,{method:body===undefined?'GET':'POST',headers:{...auth,'content-type':'application/json'},body:body===undefined?undefined:JSON.stringify(body),redirect:'manual',signal:AbortSignal.timeout(45000)});
}
async function json(path,body,host=origin){const r=await request(path,body,host);assert.equal(r.status,200,`${path}: HTTP ${r.status}`);assert.equal(r.headers.get('x-playtt-probe-state'),'restore-v1');return r.json();}
const operator=(phase,body)=>json('/?phase=operator-'+phase,body),capacity=body=>json('/__playtt-capacity',body);
async function oldState(){
  const [state,budget,pins,publishing]=await Promise.all(['/?phase=operator-fence-status','/__playtt-capacity','/__playtt-backup-pins','/__playtt-publishing'].map(p=>json(p,undefined,old)));
  const previous=await load('artifacts/playtt-usermeta-overlay-provider-source-status.json');
  assert.deepEqual(state.state,previous.state);assert.equal(state.state.version,57);assert.equal(state.fence.active,false);assert.equal(state.coherent,true);
  for(const key of ['baselineBytes','chargedBytes','chargedPuts','remainingBytes'])assert.equal(budget[key],previous.budget[key]);
  assert.equal(budget.writeTracking.pending,0);assert.equal(budget.writeTracking.sealed,true);assert.equal(budget.writeTracking.window.closed,true);assert.equal(pins.generation,8);assert.equal(publishing.state,'paused');
  assert.deepEqual(backupPinInput(pins.pins.find(p=>p.revision===plan.pin.revision)),plan.pin);
  return {canonicalVersion:state.state.version,revision:state.state.pointer.revision,pins:pins.pins.length,pending:budget.writeTracking.pending,sealed:budget.writeTracking.sealed,remainingBytes:budget.remainingBytes,publisher:publishing.state};
}
async function absent(){for(const path of [`r2/buckets/${bucket}`,`workers/scripts/${worker}/settings`]){const r=await api(`/accounts/${account}/${path}`);await r.body?.cancel();assert.equal(r.status,404,'Destination already exists or lookup unavailable');}}
if(mode==='preflight'){
  await absent();const previous=await oldState();const usage=await load(prefix+'usage.json');assert.ok(Date.now()-Date.parse(usage.at)<3600000);const published=usage.accountMetrics.result.standard.published;
  assert.ok(published.payloadSize+published.metadataSize+150000000<3000000000);
  assert.ok(Array.isArray(usage.accountOperations)&&usage.accountOperations.reduce((n,o)=>n+o.sum.requests,0)<100000); // Deliberately below advertised 10 GB-month, not billing proof.
  await report('preflight',{result:'pass',targetResourcesAbsent:true,oldTarget:previous,accountR2CurrentPayload:published.payloadSize,accountR2CurrentMetadata:published.metadataSize,newTargetPayloadLimit:150000000,analyticsNotInvoice:true});process.exit(0);
}
if(mode==='create'){
  try{await access(prefix+'owner-private.json');throw Error('Existing ownership intent: inspect before retry');}catch(e){if(e.code!=='ENOENT')throw e;}
  const preflight=await load(prefix+'preflight.json');assert.equal(preflight.result,'pass');assert.ok(Date.now()-Date.parse(preflight.at)<900000);await absent();
  const owner={worker,bucket,createdIntentAt:new Date().toISOString(),bucketCreated:false,secretsConfigured:false};await save(prefix+'owner-private.json',owner);
  const r=await api(`/accounts/${account}/r2/buckets`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({name:bucket})});assert.equal(r.status,200);const created=await r.json();assert.equal(created.success,true);assert.equal(created.result.name,bucket);assert.equal(created.result.storage_class,'Standard');owner.bucketCreated=true;await save(prefix+'owner-private.json',owner);
  await report('created',{result:'pass',bucketCreated:true,storageClass:created.result.storage_class});process.exit(0);
}
const owner=await load(prefix+'owner-private.json');assert.equal(owner.worker,worker);assert.equal(owner.bucket,bucket);assert.equal(owner.bucketCreated,true);
if(mode==='secrets'){
  assert.equal(owner.secretsConfigured,false);const selected=Object.fromEntries(['WORDPRESS_OPERATOR_TOKEN','WORDPRESS_ADMIN_PASSWORD','WORDPRESS_AUTH_SECRET','WORDPRESS_ADMIN_CLAIM_SECRET'].map(k=>{assert.ok(secrets[k]);return [k,secrets[k]];}));
  await new Promise((done,fail)=>{const child=spawn(process.execPath,['node_modules/wrangler/bin/wrangler.js','secret','bulk','--config',configName],{stdio:['pipe','ignore','ignore'],env:{...process.env,XDG_CONFIG_HOME:resolve('../../../playtt-wrangler-config'),WRANGLER_SEND_METRICS:'false'}});child.once('error',fail);child.once('exit',code=>code===0?done():fail(Error('Secret setup failed: '+code)));child.stdin.end(JSON.stringify(selected));});
  owner.secretsConfigured=true;await save(prefix+'owner-private.json',owner);await report('secrets',{result:'pass',names:Object.keys(selected),valuesLogged:false});process.exit(0);
}
assert.equal(owner.secretsConfigured,true);
if(mode==='upload'){
  assert.equal((await capacity()).initialized,false);const empty=await operator('fence-status');assert.equal(empty.state.version,0);assert.equal(empty.state.pointer,null);assert.equal((await json('/__playtt-publishing',{action:'pause'})).state,'paused');
  const denied=await request('/wp-admin/');assert.equal(denied.status,503);await denied.body?.cancel();
  let progress;try{progress=await load(prefix+'upload-private.json');}catch(e){if(e.code!=='ENOENT')throw e;progress={worker,bucket,completed:[]};}
  assert.equal(progress.bucket,bucket);const done=new Set(progress.completed);assert.ok([...done].every(k=>plan.objects.some(o=>o.key===k)));
  const queue=plan.objects.filter(o=>!done.has(o.key));let failed,saving=Promise.resolve();
  async function upload(){while(queue.length&&!failed){const o=queue.shift();let stage='inspect-existing',httpStatus;try{
    const path=`/accounts/${account}/r2/buckets/${bucket}/objects/`+encodeURIComponent(o.key);let r=await api(path);
    httpStatus=r.status;
    if(r.status===404){await r.body?.cancel();const bytes=await readFile(o.file);assert.equal(bytes.length,o.size);assert.equal(sha(bytes),o.sha256);
      stage='upload';const put=await api(path,{method:'PUT',headers:{'content-type':'application/octet-stream','cf-r2-storage-class':'Standard','cf-r2-data-catalog-check':'true'},body:bytes});httpStatus=put.status;assert.ok(put.ok,`Upload HTTP ${put.status}`);await put.body?.cancel();stage='verify-download';r=await api(path);httpStatus=r.status;
    }
    assert.equal(r.status,200);const remote=await r.arrayBuffer();assert.equal(remote.byteLength,o.size);assert.equal(sha(new Uint8Array(remote)),o.sha256);
    done.add(o.key);const next={worker,bucket,completed:[...done]};saving=saving.then(()=>save(prefix+'upload-private.json',next));await saving;if(done.size%25===0)console.log(JSON.stringify({verifiedUploads:done.size,total:plan.objects.length}));
  }catch(e){failed=e;await report('upload-failure-'+Date.now(),{result:'fail',stage,httpStatus,objectKeySha256:sha(o.key),objectBytes:o.size,verifiedObjects:done.size,errorName:e.name,uncertainObjectsNotOverwritten:true});}}}
  await Promise.allSettled(Array.from({length:4},upload));await saving;if(failed)throw failed;
  assert.equal(done.size,plan.objects.length);await report('upload',{result:'pass',objects:done.size,payloadBytes:plan.totalBytes,allRemoteObjectsDownloadedAndHashed:true,originalTargetWritten:false});process.exit(0);
}
if(mode==='bootstrap'){
  const up=await load(prefix+'upload.json');assert.equal(up.result,'pass');assert.equal(up.objects,plan.objects.length);
  const before=await operator('fence-status');assert.equal(before.state.version,0);assert.equal(before.state.pointer,null);assert.equal(before.fence.active,false);
  const fence=await operator('fence-acquire',{ttlSeconds:600}),drainToken=randomUUID(),windowToken=randomUUID();
  const guard={worker,bucket,fenceToken:fence.token,drainToken,windowToken,fenceReleased:false,sealReleased:false,phase:'initializing'};await save(prefix+'guard-private.json',guard);
  const initial=await capacity({action:'initialize',fenceToken:fence.token});assert.equal(initial.baselineBytes,plan.totalBytes);assert.equal(initial.baselineObjects,plan.objects.length);assert.equal(initial.chargedBytes,0);
  await capacity({action:'initialize-write-tracking',fenceToken:fence.token,legacyWritersDrained:true});
  await capacity({action:'acquire-write-drain',fenceToken:fence.token,drainToken});
  await registerBackupPin((p,options)=>fetch(origin+p,{...options,headers:{...auth,...options.headers},redirect:'error',signal:AbortSignal.timeout(45000)}),secrets.WORDPRESS_OPERATOR_TOKEN,fence.token,plan.pin);
  const armed=await capacity({action:'arm-write-window',fenceToken:fence.token,drainToken,windowToken,previousWindowToken:null,durationSeconds:30,maxBytes:1024*1024,maxOperations:8});
  guard.expiresAt=armed.writeTracking.window.expiresAt;guard.phase='armed-bootstrap';await save(prefix+'guard-private.json',guard);
  await capacity({action:'release-write-drain',fenceToken:fence.token,drainToken});guard.sealReleased=true;await save(prefix+'guard-private.json',guard);
  await operator('fence-release',{token:fence.token});guard.fenceReleased=true;await save(prefix+'guard-private.json',guard);
  const restored=await operator('restore',plan.pointer);assert.equal(restored.restored,true);assert.equal(restored.version,1);assert.deepEqual(restored.pointer,plan.pointer);
  const state=await operator('fence-status'),budget=await capacity();assert.equal(state.state.version,1);assert.equal(budget.writeTracking.pending,0);assert.equal(budget.writeTracking.window.operations,1);
  guard.phase='restored-awaiting-expiry';await save(prefix+'guard-private.json',guard);
  await report('bootstrap',{result:'pass',version:1,pins:1,selectedSourceVersion:57,allHistoricalPinsImported:false,overlaySnapshotRestored:true,budget,publisher:(await json('/__playtt-publishing')).state});process.exit(0);
}
if(mode==='expiry'){
  const guard=await load(prefix+'guard-private.json');assert.equal(guard.phase,'restored-awaiting-expiry');
  const wait=guard.expiresAt-Date.now()+250;assert.ok(wait<60000);if(wait>0)await new Promise(r=>setTimeout(r,wait));
  const before=await capacity();assert.equal(before.writeTracking.window.expired,true);
  const checks=[];for(const path of ['/wp-admin/','/wp-json/wp/v2/posts','/?phase=operator-restore']){const r=await request(path,path.includes('restore')?plan.pointer:undefined);assert.equal(r.status,503);const body=await r.json();assert.equal(body.code,'playtt_write_window_closed');checks.push({path,status:r.status,code:body.code});}
  const after=await capacity();assert.deepEqual(after,before);const state=await operator('fence-status');assert.equal(state.state.version,1);assert.deepEqual(state.state.pointer,plan.pointer);
  const wrong=await request('/__playtt-capacity',{action:'close-write-window',windowToken:randomUUID()});assert.equal(wrong.status,409);await wrong.body?.cancel();
  await capacity({action:'close-write-window',windowToken:guard.windowToken});
  const fence=await operator('fence-acquire',{ttlSeconds:600});guard.fenceToken=fence.token;guard.fenceReleased=false;await save(prefix+'guard-private.json',guard);
  const sealed=await capacity({action:'acquire-write-drain',fenceToken:fence.token,drainToken:guard.drainToken});assert.equal(sealed.writeTracking.pending,0);assert.equal(sealed.writeTracking.sealed,true);
  await operator('fence-release',{token:fence.token});guard.fenceReleased=true;guard.sealReleased=false;guard.phase='sealed-after-expiry';await save(prefix+'guard-private.json',guard);
  const oldTarget=await oldState();await report('expiry',{result:'pass',checks,chargedBytesUnchanged:after.chargedBytes,operationsUnchanged:after.writeTracking.window.operations,canonicalVersion:1,wrongOwnerDenied:true,budget:sealed,fenceReleased:true,publisher:(await json('/__playtt-publishing')).state,oldTarget});process.exit(0);
}
const state=await operator('fence-status'),budget=await capacity(),pins=await json('/__playtt-backup-pins');
const deploymentResponse=await api(`/accounts/${account}/workers/scripts/${worker}/deployments`);assert.equal(deploymentResponse.status,200);const deploymentBody=await deploymentResponse.json();assert.equal(deploymentBody.success,true);
const deployments=deploymentBody.result.deployments.map(d=>({id:d.id,createdOn:d.created_on,versions:d.versions}));
await report('status',{result:'pass',state:state.state,coherent:state.coherent,fenceActive:state.fence.active,budget,pins:pins.generation,publisher:(await json('/__playtt-publishing')).state,deployments});
