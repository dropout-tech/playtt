import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { registerBackupPin } from './playtt-backup-pin-client.mjs';
import { backupPinInput } from '../src/playtt-backup-pins.ts';
import { bucket, worker, origin, source, configName, prefix, sha, load, save, report, readPlan, cli, client } from './playtt-pin-restore-lib.mjs';
assert.ok(process.argv.includes('--remote'));
const mode = process.argv.find(x => ['--create-bucket','--secrets','--empty','--upload','--verify-remote-core','--initialize','--pins','--restore'].includes(x)); assert.ok(mode);
const plan = await readPlan();
async function absent(path) { try { await readFile(path); throw Error('Existing owner guard must be inspected'); } catch (e) { if (e.code !== 'ENOENT') throw e; } }
if (mode === '--create-bucket') {
  await absent(prefix + 'resources-private.json');
  const check = await load(prefix + 'cloud-preflight.json'); assert.equal(check.result, 'pass'); assert.ok(Date.now() - Date.parse(check.at) < 300000);
  assert.deepEqual(check.resources.map(x => x.name), [bucket, worker]); assert.ok(check.resources.every(x => x.absent));
  const owner = { bucket, worker, createdIntentAt: new Date().toISOString(), bucketCreated: false, secretsConfigured: false };
  await save(prefix + 'resources-private.json', owner);
  await cli(['r2','bucket','create',bucket,'--config',configName]); owner.bucketCreated = true; await save(prefix + 'resources-private.json', owner);
  await report('bucket-created', { result: 'pass', worker, newBucketCreated: true, existingResourcesReset: false });
  process.exit(0);
}
const owner = await load(prefix + 'resources-private.json'); assert.equal(owner.bucket, bucket); assert.equal(owner.worker, worker); assert.equal(owner.bucketCreated, true);
if (mode === '--secrets') {
  assert.equal(owner.secretsConfigured, false);
  const secrets = await load('../../../playtt-cms-secrets.json'); const selected = {};
  for (const key of ['WORDPRESS_OPERATOR_TOKEN','WORDPRESS_ADMIN_PASSWORD','WORDPRESS_AUTH_SECRET','WORDPRESS_ADMIN_CLAIM_SECRET']) { assert.ok(secrets[key]); selected[key] = secrets[key]; }
  await cli(['secret','bulk','--config',configName], JSON.stringify(selected)); owner.secretsConfigured = true; await save(prefix + 'resources-private.json', owner);
  await report('secrets', { result: 'pass', worker, configuredNames: Object.keys(selected), valuesLogged: false }); process.exit(0);
}
assert.equal(owner.secretsConfigured, true);
const c = await client();
async function pins() { const r = await c.request('/__playtt-backup-pins', { headers: c.auth }); assert.equal(r.status, 200); return r.json(); }
async function capacity(body) { const r = await c.request('/__playtt-capacity', { method: body ? 'POST' : 'GET', headers: { ...c.auth, 'content-type':'application/json' }, body: body ? JSON.stringify(body) : undefined }); assert.equal(r.status, 200); return r.json(); }
const fencePath = prefix + 'bootstrap-fence-private.json';
if (mode === '--empty') {
  await absent(fencePath); const state = await c.operator('operator-fence-status'); assert.equal(state.coherent, true); assert.equal(state.state.pointer, null); assert.equal(state.state.version, 0); assert.equal(state.fence.active, false);
  assert.equal((await pins()).generation, 0); assert.equal((await capacity()).initialized, false); assert.equal((await c.control('pause')).state, 'paused');
  const sourceClient = await client(source), ss = await sourceClient.operator('operator-fence-status'); assert.equal(ss.coherent, true); assert.equal(ss.fence.active, false); assert.equal(ss.state.version, 309); assert.equal(ss.state.pointer.revision, plan.revision); assert.equal((await sourceClient.control()).state, 'paused');
  const fence = await c.operator('operator-fence-acquire', { ttlSeconds:600 });
  await save(fencePath, { ...fence, released:false });
  await report('empty', { result:'pass', scope:'New isolated destination DO has no canonical state, pins or capacity baseline; source untouched', version:0, pointer:null, pins:0, capacityInitialized:false, publisher:'paused', sourceVersion:ss.state.version }); process.exit(0);
}
assert.equal((await c.control()).state, 'paused');
const fence = await load(fencePath); assert.equal(fence.released, false);
await c.operator('operator-fence-renew', { token:fence.token, ttlSeconds:600 });
const state = await c.operator('operator-fence-status'); assert.equal(state.coherent, true); assert.equal(state.state.pointer, null); assert.equal(state.state.version, 0);
if (mode === '--upload') {
  let progress;
  try { progress = await load(prefix+'upload-progress-private.json'); } catch(e) { if(e.code!=='ENOENT')throw e; progress={bucket,completed:[]}; }
  assert.equal(progress.bucket,bucket); assert.ok(progress.completed.every(k=>plan.objects.some(x=>x.key===k)));
  const done=new Set(progress.completed),queue=plan.objects.filter(x=>!done.has(x.key)); let failed; let saving=Promise.resolve();
  const runner=async()=>{ while(queue.length&&!failed){ const item=queue.shift(); try {
    const bytes=await readFile(item.file); assert.equal(bytes.length,item.size);assert.equal(sha(bytes),item.sha256);
    await cli(['r2','object','put',bucket+'/'+item.key,'--file',item.file,'--remote','--config',configName]); done.add(item.key);
    const raw={bucket,completed:[...done]}; saving=saving.then(()=>save(prefix+'upload-progress-private.json',raw));await saving;
    if(done.size%25===0){await c.operator('operator-fence-renew',{token:fence.token,ttlSeconds:600});console.log(JSON.stringify({uploaded:done.size,total:plan.objects.length}));}
  }catch(error){failed=error;} } };
  await Promise.allSettled(Array.from({length:4},runner));await saving;if(failed)throw failed;
  assert.equal(done.size,plan.objects.length);
  await report('upload',{result:'pass',objects:done.size,payloadBytes:plan.totalBytes,scope:'Only verified immutable union objects copied to the new owned bucket; no source writes or reset'});
} else if(mode==='--verify-remote-core'){
  assert.equal((await load(prefix+'upload.json')).result,'pass');
  const core=plan.objects.filter(x=>x.key.startsWith('runtime/'));assert.equal(core.length,3);const checked=[];
  for(const [index,item]of core.entries()){
    const path=prefix+'core-'+index+'-private.bin';
    await cli(['r2','object','get',bucket+'/'+item.key,'--file',path,'--remote','--config',configName]);
    const bytes=await readFile(path);assert.equal(bytes.length,item.size);assert.equal(sha(bytes),item.sha256);checked.push({size:bytes.length,sha256:item.sha256});
  }
  await report('remote-core',{result:'pass',scope:'All three complete core objects downloaded from the independent target and checked against pinned local asset hashes',objects:checked});
} else if(mode==='--initialize'){
  const upload=await load(prefix+'upload.json');assert.equal(upload.result,'pass');assert.equal(upload.objects,plan.objects.length);
  assert.equal((await load(prefix+'remote-core.json')).result,'pass');
  const budget=await capacity({action:'initialize',fenceToken:fence.token});assert.equal(budget.initialized,true);assert.equal(budget.scope,bucket);assert.equal(budget.baselineBytes,plan.totalBytes);assert.equal(budget.baselineObjects,plan.objects.length);assert.equal(budget.chargedBytes,0);assert.equal(budget.chargedPuts,0);assert.equal(budget.limitBytes,300000000);
  await report('initialized',{result:'pass',budget,scope:'Fresh target ledger initialized from actual complete listing after offline imports; source ledger not copied'});
} else if(mode==='--pins'){
  assert.equal((await capacity()).initialized,true);
  const secrets=await load('../../../playtt-cms-secrets.json');
  for(const original of plan.pins){await c.operator('operator-fence-renew',{token:fence.token,ttlSeconds:600});await registerBackupPin(c.request,secrets.WORDPRESS_OPERATOR_TOKEN,fence.token,backupPinInput(original));}
  const restored=await pins();assert.equal(restored.generation,21);assert.equal(restored.pins.length,21);
  for(const original of plan.pins)assert.deepEqual(backupPinInput(restored.pins.find(x=>x.revision===original.revision)),backupPinInput(original));
  await save(prefix+'target-registry-private.json',restored);
  await report('pins',{result:'pass',protectedVersions:restored.pins.length,generation:restored.generation,sourceRegistrySha256:plan.sourceRegistrySha256,scope:'Immutable backup identities restored; registration timestamps belong to the new target, old export retained as provenance'});
} else {
  assert.equal(mode,'--restore');assert.equal((await load(prefix+'pins.json')).result,'pass');assert.equal((await pins()).generation,21);assert.equal((await capacity()).initialized,true);
  await c.operator('operator-fence-release',{token:fence.token});fence.released=true;await save(fencePath,fence);
  const restored=await c.operator('operator-restore',plan.pointer);assert.equal(restored.restored,true);assert.equal(restored.version,1);assert.deepEqual(restored.pointer,plan.pointer);
  const after=await c.operator('operator-fence-status');assert.equal(after.coherent,true);assert.equal(after.fence.active,false);assert.deepEqual(after.state.pointer,plan.pointer);
  const budget=await capacity();assert.equal(budget.chargedPuts,1);assert.equal(budget.chargedBytes,Buffer.byteLength(JSON.stringify(plan.pointer)));
  await report('restored',{result:'pass',version:after.state.version,revision:after.state.pointer.revision,coherent:true,fenceActive:false,publisher:'paused',budget,checks:c.checks});
}
