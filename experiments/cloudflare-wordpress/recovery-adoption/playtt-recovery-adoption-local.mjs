// Actual outer Worker + coordinator + SQLite Budget + local R2. No provider I/O.
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdtemp, readdir, copyFile } from 'node:fs/promises';
import { resolve, join, extname } from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { build } from 'esbuild';
import {openSnapshotBundle} from './playtt-snapshot-bundle.mjs';
import {prepareLegacyAdoption,executeLegacyAdoption} from './playtt-legacy-adoption.mjs';
import {createRecoveryHttpTransport} from './playtt-recovery-http.mjs';
import { Miniflare, Log, LogLevel, convertV4MiniflareOptions } from 'miniflare';
assert.equal(process.argv[2], '--local');
const runTag = process.argv[3] ?? 'local'; assert.match(runTag, /^[a-z0-9-]{1,30}$/);
const runtime = process.cwd(), sha = b => createHash('sha256').update(b).digest('hex');
const directory = await mkdtemp(join(runtime, 'artifacts/recovery-adoption-local-'));
const stateRoot = await mkdtemp(resolve(runtime, '../../../../../../playtt-recovery-state-'));
const ownerPath = join(runtime, 'artifacts/playtt-recovery-adoption-' + runTag + '-owned-private.json');
const owner = { phase: 'building', directory, stateRoot, localProcessesDisposed: false };
await writeFile(ownerPath, JSON.stringify(owner, null, 2), { flag: 'wx' });
const save = async phase => { owner.phase = phase; await writeFile(ownerPath, JSON.stringify(owner, null, 2)); };
const scriptPath = join(directory, 'worker.mjs');
const built = await build({ stdin: { resolveDir: runtime, sourcefile: 'recovery-adoption-local-harness.ts', loader: 'ts', contents: `
import worker,{PlayttWordPressExecution,WordPressStateCoordinator,PlayttStorageBudget as Budget} from './src/worker-playtt-do.ts';
import {DurableObjectRevisionCoordinator} from './src/state-coordinator.ts';
export {PlayttWordPressExecution,WordPressStateCoordinator};
export class PlayttStorageBudget extends Budget {
 constructor(state,env){
  let fired=false;
  const wrap=storage=>new Proxy(storage,{get(target,key){
   if(key==='transaction')return callback=>target.transaction(tx=>callback(wrap(tx)));
   if(key==='put')return async(k,value)=>{if(!fired&&env.LOCAL_FAULT===value?.phase&&value?.key==='sites/default/markdown/current.json'&&k.startsWith('playtt-recovery-upload-v1:')){fired=true;throw Error('Local durable boundary interruption');}return target.put(k,value);};
   const value=Reflect.get(target,key,target);return typeof value==='function'?value.bind(target):value;
  }});
  const bucket=env.WORDPRESS_STATE_BUCKET;
  const raw=new Proxy(bucket,{get(target,key){
   if(key==='list')return async(...args)=>{const result=await target.list(...args);return {...result,objects:result.objects.map(o=>({...o,storageClass:o.storageClass||'Standard'}))};};
   if(key==='put')return async(...args)=>{const result=await target.put(...args);if(!fired&&env.LOCAL_FAULT==='raw-after'&&args[0]==='sites/default/markdown/current.json'){fired=true;throw Error('Local R2 reply interruption after completion');}return result;};
   const value=Reflect.get(target,key,target);return typeof value==='function'?value.bind(target):value;
  }});
  super(new Proxy(state,{get(target,key){if(key==='storage')return wrap(target.storage);const value=Reflect.get(target,key,target);return typeof value==='function'?value.bind(target):value;}}),{...env,WORDPRESS_STATE_BUCKET:raw});
 }
}
export default {async fetch(request,env){
 const u=new URL(request.url);if(u.hostname!=='127.0.0.1')return new Response('Local only',{status:403});
 if(u.pathname==='/__local-fence'){
  if(request.headers.get('authorization')!=='Bearer '+env.WORDPRESS_OPERATOR_TOKEN)return new Response('Unauthorized',{status:401});
  const c=new DurableObjectRevisionCoordinator(env.WORDPRESS_STATE.getByName('playtt-restore-v1:default'),'default');
  const input=await request.json();if(input.adopt)return Response.json(await c.adopt(input.adopt.pointer,input.adopt.version,input.adopt.fenceToken,true));return Response.json(input.release?(await c.releaseFence(input.release),{released:true}):await c.acquireFence(600000));
 }
 const response=await worker.fetch(request,env);
 if(env.LOCAL_LOSE_RESPONSE==='true'&&u.pathname==='/__playtt-recovery/pointer'&&response.status===200){await response.arrayBuffer();return new Response('Local simulated lost success reply',{status:502});}
 return response;
}};` }, bundle: true, format: 'esm', platform: 'browser', target: 'es2022', outfile: scriptPath, metafile: true,
logLevel: 'silent', external: ['node:*', 'worker_threads', 'events'], banner: { js: "import {createRequire} from 'node:module';const require=createRequire('/harness.mjs');" },
plugins: [{ name: 'binary-modules', setup(b) { b.onResolve({ filter: /\.(wasm|sqlite|zip)$/ }, async args => {
  const path = resolve(args.resolveDir, args.path), bytes = await readFile(path), name = sha(bytes) + extname(path);
  try { await copyFile(path, join(directory, name), 1); } catch (error) { if (error.code !== 'EEXIST') throw error; }
  return { path: './' + name, external: true };
}); } }] });
assert.ok(Object.keys(built.metafile.inputs).some(p => p.endsWith('src/worker-playtt-do.ts')));
const bundleSha256 = sha(await readFile(scriptPath));
await writeFile(join(directory, 'metafile.json'), JSON.stringify(built.metafile));
const config = JSON.parse(await readFile(join(runtime, 'wrangler.playtt-session-audit.jsonc'), 'utf8'));
const port = 9483, origin = 'http://127.0.0.1:' + port, operator = randomUUID();
const bindings = { ...config.vars, WORDPRESS_SITE_CONTEXTS: JSON.stringify([{ id: 'default', hostname: '127.0.0.1', origin }]),
  WORDPRESS_ADMIN_PASSWORD: randomUUID(), WORDPRESS_AUTH_SECRET: randomUUID(), WORDPRESS_ADMIN_CLAIM_SECRET: randomUUID(), WORDPRESS_OPERATOR_TOKEN: operator,
  PLAYTT_RECOVERY_UPLOADS: 'v1', PLAYTT_R2_CAPACITY_LIMIT_BYTES: '150000000' };
let mf, bucket, outboundAttempts = 0; const scenarios = [], checks = [];
async function start(name, fault = '', lose = false, enabled = true) {
  const modules = [{ type: 'ESModule', path: scriptPath }, ...(await readdir(directory)).filter(n => /\.(wasm|sqlite|zip)$/.test(n)).map(n => ({ type: n.endsWith('.wasm') ? 'CompiledWasm' : 'Data', path: join(directory, n) }))];
  mf = new Miniflare(convertV4MiniflareOptions({ name: 'playtt-recovery-adoption-local', modules, modulesRoot: directory, host: '127.0.0.1', port,
    compatibilityDate: '2026-07-18', compatibilityFlags: ['nodejs_compat', 'enable_request_signal'], cf: false, log: new Log(LogLevel.ERROR),
    durableObjects: { WORDPRESS_STATE: { className: 'WordPressStateCoordinator', useSQLite: true }, PLAYTT_EXECUTION: { className: 'PlayttWordPressExecution', useSQLite: true }, PLAYTT_STORAGE_BUDGET: { className: 'PlayttStorageBudget', useSQLite: true } },
    resourcePersistencePath: join(stateRoot, name, 'r'), isolatedResourcePersistencePath: join(stateRoot, name, 'i'), r2Buckets: ['WORDPRESS_STATE_BUCKET'], telemetry: { enabled: false },
    bindings: { ...bindings, PLAYTT_RECOVERY_UPLOADS: enabled ? 'v1' : '', LOCAL_FAULT: fault, LOCAL_LOSE_RESPONSE: String(lose) },
    outboundService: () => { outboundAttempts++; throw Error('External network forbidden'); } }));
  assert.equal(new URL(String(await mf.ready)).origin, origin); bucket = await mf.getR2Bucket('WORDPRESS_STATE_BUCKET');
}
async function stop() { if (mf) { await mf.dispose(); mf = undefined; } }
async function req(path, body, auth = true, gate = true) {
  const response = await fetch(origin + path, { method: body === undefined ? 'GET' : 'POST', body: body === undefined ? undefined : JSON.stringify(body),
    headers: { ...(auth ? { Authorization: 'Bearer ' + operator } : {}), ...(gate ? { 'X-Playtt-Probe': operator } : {}), 'Content-Type': 'application/json' }, redirect: 'manual', signal: AbortSignal.timeout(30000) });
  const text = await response.text(); let data; try { data = JSON.parse(text); } catch {}
  checks.push({ path: path.split('?')[0], status: response.status }); return { status: response.status, data, text };
}
async function ok(path, body) { const r = await req(path, body); assert.equal(r.status, 200, path + ': ' + r.text.slice(0, 180)); return r.data; }
const capacity = body => ok('/__playtt-capacity', body);
async function initialize() {
  const fence = await ok('/__local-fence', {}), drainToken = randomUUID(), windowToken = randomUUID();
  for (const input of [{ action: 'initialize' }, { action: 'initialize-write-tracking', legacyWritersDrained: true }, { action: 'acquire-write-drain', drainToken },
    { action: 'arm-write-window', drainToken, windowToken, previousWindowToken: null, durationSeconds: 600, maxBytes: 1083839, maxOperations: 96 }, { action: 'release-write-drain', drainToken }]) await capacity({ ...input, fenceToken: fence.token });
  return { fenceToken: fence.token, drainToken, windowToken };
}
const sourceOwner=JSON.parse(await readFile(join(runtime,'artifacts/playtt-envelope-provider-backup-owned-private.json'),'utf8'));
const targetOwner=JSON.parse(await readFile(join(runtime,'artifacts/playtt-legacy-content-owned-private.json'),'utf8'));
assert.equal(sourceOwner.phase,'verified');assert.equal(targetOwner.phase,'converted');
const sourceDirectory=join(sourceOwner.directory,'independent'),targetDirectory=join(targetOwner.directory,'independent');
const {plan,digest}=await prepareLegacyAdoption({sourceDirectory,sourceAnchor:sourceOwner.anchor,targetDirectory,targetAnchor:targetOwner.anchor,sourceVersion:177});
const sourceGraph=(await openSnapshotBundle(sourceDirectory,sourceOwner.anchor)).graph;
const ptr=a=>Object.fromEntries(['revision','manifestKey','persistedAt'].map(k=>[k,a[k]]));
const known=new Set([sourceGraph.base.manifestKey,sourceGraph.base.restorePack.objectKey,plan.source.manifestKey,sourceGraph.manifest.restorePack.delta.objectKey,...['files','uploads','wpContent'].flatMap(k=>(sourceGraph.base[k]||[]).map(f=>f.objectKey))]);
const limits={durationSeconds:600,maxBytes:1083839,maxOperations:96};
try {
 for(const mode of ['success','partial-adoption','lost-pointer-response','confirmed','raw-after']){
  await save('running-'+mode);await start(mode,mode==='confirmed'?'settled':mode==='raw-after'?'raw-after':'',mode==='lost-pointer-response');
  for(const object of sourceGraph.objects)if(known.has(object.key))await bucket.put(object.key,object.bytes);
  await bucket.put(plan.pointerKey,JSON.stringify(ptr(plan.source)));
  const owners=await initialize();await ok('/__local-fence',{adopt:{pointer:ptr(plan.source),version:177,fenceToken:owners.fenceToken}});
  await ok('/__playtt-publishing',{action:'pause'});
  await ok('/__playtt-backup-pins',{pin:plan.source,fenceToken:owners.fenceToken});
  const base=sourceGraph.base,baseObject=sourceGraph.objects.find(o=>o.key===base.manifestKey);
  await ok('/__playtt-backup-pins',{pin:{...ptr(base),manifestSha256:baseObject.sha256,packKey:base.restorePack.objectKey,packSha256:base.restorePack.sha256,packBytes:base.restorePack.size},fenceToken:owners.fenceToken});
  const pinsBefore=(await ok('/__playtt-backup-pins')).pins;
  const registryPath=join(directory,mode+'-operations-private.json'),events=[],started=Date.now();let registry=null,stopAfterAdopt=mode==='partial-adoption',injected=false;
  const makeTransport=()=>createRecoveryHttpTransport({plan,digest,origin,operatorToken:operator,fenceToken:owners.fenceToken,
   loadOperations:async()=>registry,saveOperations:async value=>{await writeFile(registryPath,JSON.stringify(value,null,2));registry=value;},
   fetchImpl:async(url,init)=>{if(stopAfterAdopt&&new URL(url).pathname==='/__playtt-recovery/pointer'){stopAfterAdopt=false;injected=true;throw Error('Local client stopped before pointer send');}return fetch(url,init);}});
  let transport=await makeTransport();
  const run=()=>executeLegacyAdoption({plan,digest,io:transport.io,journal:async e=>{events.push(e);await writeFile(join(directory,mode+'-journal-private.json'),JSON.stringify(events,null,2));}});
  let firstError=null;try{await transport.reconcileOwnedOperations();await run();}catch(error){firstError=String(error);}
  if(['partial-adoption','raw-after'].includes(mode))assert.ok(firstError);else assert.equal(firstError,null,firstError);
  const firstState=await transport.io.inspect(),before=await capacity();assert.equal(firstState.state.version,178);
  if(mode==='partial-adoption'){assert.ok(injected);assert.deepEqual(firstState.r2Pointer,ptr(plan.source));assert.equal(firstState.pending,0);}
  else assert.deepEqual(firstState.r2Pointer,ptr(plan.target));
  await stop();await start(mode);registry=JSON.parse(await readFile(registryPath,'utf8'));transport=await makeTransport();
  const unresolved=mode==='raw-after';let finalResult;
  if(unresolved){await assert.rejects(transport.reconcileOwnedOperations(),/outcome remains unknown/);await assert.rejects(run(),/Pending storage attempt/);}
  else {await transport.reconcileOwnedOperations();finalResult=await run();assert.equal(finalResult.bothPointersVerified,true);}
  const final=await transport.io.inspect(),after=await capacity();assert.equal(final.state.version,178);assert.deepEqual(final.receipt,ptr(plan.target));assert.deepEqual(final.r2Pointer,ptr(plan.target));
  assert.equal(after.chargedBytes,432931);assert.equal(after.chargedPuts,7);assert.equal(after.writeTracking.pending,unresolved?1:0);
  const pinsAfter=await transport.io.listPins();for(const pin of pinsBefore)assert.ok(pinsAfter.some(p=>JSON.stringify(p)===JSON.stringify(pin)));assert.equal(pinsAfter.length,3);
  const restored=await transport.io.verifySnapshot(plan.target);assert.equal(restored.objects.length,303);
  await capacity({action:'close-write-window',windowToken:owners.windowToken});
  const seal=await req('/__playtt-capacity',{action:'acquire-write-drain',fenceToken:owners.fenceToken,drainToken:owners.drainToken});assert.equal(seal.status,unresolved?409:200);
  if(!unresolved)await ok('/__local-fence',{release:owners.fenceToken});
  scenarios.push({mode,sourceVersion:177,firstCoordinatorVersion:firstState.state.version,firstPointerIsTarget:firstState.r2Pointer.revision===plan.target.revision,finalVersion:178,firstError:firstError?'expected controlled interruption':null,
   transferBytes:after.chargedBytes,puts:after.chargedPuts,pending:after.writeTracking.pending,pinsBefore:pinsBefore.length,pinsAfter:pinsAfter.length,originalPinsExact:true,verifiedTargetObjects:restored.objects.length,
   fullProcessRestart:true,sealed:seal.status===200,windowClosed:true,wallMs:Date.now()-started,localOnly:true,unknownStorageRetained:unresolved});
  await writeFile(join(directory,mode+'-private.json'),JSON.stringify({owners,before,after,firstState,final,registry,finalResult},null,2));await stop();
 }
 assert.equal(outboundAttempts,0);owner.localProcessesDisposed=true;
 const report={schema:'playtt/recovery-adoption-local/v1',at:new Date().toISOString(),result:'pass',actualOuterWorker:true,actualCoordinator:true,actualSQLiteBudget:true,actualLocalR2:true,
  source:'Verified private177 backup and independently converted plain content-v1 target',planDigest:digest,bundleSha256,limits,scenarios,processRestarts:5,
  noProviderTest:true,noNativePhpEdit:true,cloudRequests:0,outboundAttempts,localProcessesDisposed:true,
  limitations:['Fresh local base replicas, two fixture pins; not live14-pin inventory.','Exceptions/HTTP response replacement are local boundary injections, not provider crash guarantees.','Unknown R2 pointer result remains pending despite matching target bytes; no refund or inferred completion.','No remote deployment or old-source rollout.']};
 await writeFile(join(runtime,'artifacts/playtt-recovery-adoption-'+runTag+'-summary.json'),JSON.stringify(report,null,2));await save('verified');
 console.log(JSON.stringify({result:'pass',scenarios:scenarios.length,processRestarts:5,bytesEach:432931,putsEach:7,unresolvedFixtures:1,outboundAttempts,localProcessesDisposed:true}));
} catch(error){owner.error=String(error);await save('failed');throw error;}
finally {await stop();owner.localProcessesDisposed=true;await writeFile(ownerPath,JSON.stringify(owner,null,2));}
