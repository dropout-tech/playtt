// Actual outer Worker + coordinator + SQLite Budget + local R2. No provider I/O.
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdtemp, readdir, copyFile } from 'node:fs/promises';
import { resolve, join, extname } from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { build } from 'esbuild';
import { Miniflare, Log, LogLevel, convertV4MiniflareOptions } from 'miniflare';
assert.equal(process.argv[2], '--local');
const runTag = process.argv[3] ?? 'local'; assert.match(runTag, /^[a-z0-9-]{1,30}$/);
const runtime = process.cwd(), sha = b => createHash('sha256').update(b).digest('hex');
const directory = await mkdtemp(join(runtime, 'artifacts/recovery-uploads-local-'));
const stateRoot = await mkdtemp(resolve(runtime, '../../../../../../playtt-recovery-state-'));
const ownerPath = join(runtime, 'artifacts/playtt-recovery-uploads-' + runTag + '-owned-private.json');
const owner = { phase: 'building', directory, stateRoot, localProcessesDisposed: false };
await writeFile(ownerPath, JSON.stringify(owner, null, 2), { flag: 'wx' });
const save = async phase => { owner.phase = phase; await writeFile(ownerPath, JSON.stringify(owner, null, 2)); };
const scriptPath = join(directory, 'worker.mjs');
const built = await build({ stdin: { resolveDir: runtime, sourcefile: 'recovery-uploads-local-harness.ts', loader: 'ts', contents: `
import worker,{PlayttWordPressExecution,WordPressStateCoordinator,PlayttStorageBudget as Budget} from './src/worker-playtt-do.ts';
import {DurableObjectRevisionCoordinator} from './src/state-coordinator.ts';
export {PlayttWordPressExecution,WordPressStateCoordinator};
export class PlayttStorageBudget extends Budget {
 constructor(state,env){
  let fired=false;
  const wrap=storage=>new Proxy(storage,{get(target,key){
   if(key==='transaction')return callback=>target.transaction(tx=>callback(wrap(tx)));
   if(key==='put')return async(k,value)=>{if(!fired&&env.LOCAL_FAULT===value?.phase&&k.startsWith('playtt-recovery-upload-v1:')){fired=true;throw Error('Local durable boundary interruption');}return target.put(k,value);};
   const value=Reflect.get(target,key,target);return typeof value==='function'?value.bind(target):value;
  }});
  const bucket=env.WORDPRESS_STATE_BUCKET;
  const raw=new Proxy(bucket,{get(target,key){
   if(key==='list')return async(...args)=>{const result=await target.list(...args);return {...result,objects:result.objects.map(o=>({...o,storageClass:o.storageClass||'Standard'}))};};
   if(key==='put')return async(...args)=>{const result=await target.put(...args);if(!fired&&env.LOCAL_FAULT==='raw-after'){fired=true;throw Error('Local R2 reply interruption after completion');}return result;};
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
  const input=await request.json();return Response.json(input.release?(await c.releaseFence(input.release),{released:true}):await c.acquireFence(600000));
 }
 const response=await worker.fetch(request,env);
 if(env.LOCAL_LOSE_RESPONSE==='true'&&u.pathname==='/__playtt-recovery/object'&&response.status===200){await response.arrayBuffer();return new Response('Local simulated lost success reply',{status:502});}
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
const port = 9482, origin = 'http://127.0.0.1:' + port, operator = randomUUID();
const bindings = { ...config.vars, WORDPRESS_SITE_CONTEXTS: JSON.stringify([{ id: 'default', hostname: '127.0.0.1', origin }]),
  WORDPRESS_ADMIN_PASSWORD: randomUUID(), WORDPRESS_AUTH_SECRET: randomUUID(), WORDPRESS_ADMIN_CLAIM_SECRET: randomUUID(), WORDPRESS_OPERATOR_TOKEN: operator,
  PLAYTT_RECOVERY_UPLOADS: 'v1', PLAYTT_R2_CAPACITY_LIMIT_BYTES: '1083839' };
let mf, bucket, outboundAttempts = 0; const scenarios = [], checks = [];
async function start(name, fault = '', lose = false, enabled = true) {
  const modules = [{ type: 'ESModule', path: scriptPath }, ...(await readdir(directory)).filter(n => /\.(wasm|sqlite|zip)$/.test(n)).map(n => ({ type: n.endsWith('.wasm') ? 'CompiledWasm' : 'Data', path: join(directory, n) }))];
  mf = new Miniflare(convertV4MiniflareOptions({ name: 'playtt-recovery-uploads-local', modules, modulesRoot: directory, host: '127.0.0.1', port,
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
try {
  for (const mode of ['lost-success-response', 'settled', 'dispatching', 'confirmed', 'raw-after']) {
    await save('running-' + mode); await start(mode, mode === 'lost-success-response' ? '' : mode, mode === 'lost-success-response');
    const owners = await initialize(), bytes = Buffer.from('原生端點保存與重啟：' + mode), sha256 = sha(bytes), operationId = randomUUID();
    const input = { ...owners, operationId, key: 'sites/default/markdown/objects/' + sha256, sha256, size: bytes.length, base64: bytes.toString('base64') };
    assert.equal((await req('/__playtt-recovery/object', input, false)).status, 401);
    assert.equal((await req('/__playtt-recovery/object', input, false, false)).status, 404);
    const initial = await req('/__playtt-recovery/object', input);
    assert.equal(initial.status, mode === 'lost-success-response' ? 502 : mode === 'raw-after' ? 409 : 503);
    const before = await capacity(); assert.equal(before.chargedBytes, bytes.length); assert.equal(before.chargedPuts, 1);
    await capacity({ action: 'close-write-window', windowToken: owners.windowToken });
    await stop(); await start(mode);
    const receipt = await ok('/__playtt-recovery/status?operationId=' + operationId);
    const expected = { 'lost-success-response': 'settled', settled: 'confirmed', dispatching: 'reserved', confirmed: 'dispatching', 'raw-after': 'unknown' }[mode];
    assert.equal(receipt.phase, expected);
    const reconciled = await req('/__playtt-recovery/reconcile', { operationId, fenceToken: owners.fenceToken });
    const unresolved = ['confirmed', 'raw-after'].includes(mode);
    assert.equal(reconciled.status, unresolved ? 409 : 200);
    const after = await capacity(); assert.equal(after.chargedBytes, bytes.length); assert.equal(after.chargedPuts, 1); assert.equal(after.writeTracking.pending, unresolved ? 1 : 0);
    const stored = await bucket.get(input.key); assert.equal(stored !== null, mode !== 'dispatching');
    if (stored) assert.equal(sha(new Uint8Array(await stored.arrayBuffer())), sha256);
    const seal = await req('/__playtt-capacity', { action: 'acquire-write-drain', fenceToken: owners.fenceToken, drainToken: owners.drainToken });
    assert.equal(seal.status, unresolved ? 409 : 200);
    if (!unresolved) {
      const retry = await ok('/__playtt-recovery/object', input); assert.equal(retry.phase, 'settled');
      assert.equal(retry.outcome, mode === 'dispatching' ? 'not-dispatched' : 'stored');
      assert.equal((await capacity()).chargedPuts, 1);
      await ok('/__local-fence', { release: owners.fenceToken });
    }
    await writeFile(join(directory, mode + '-private.json'), JSON.stringify({ owners, input: { ...input, base64: undefined }, receipt, reconciled, before, after }, null, 2));
    scenarios.push({ mode, initialStatus: initial.status, restartReceipt: receipt.phase, reconciledStatus: reconciled.status, chargedBytes: after.chargedBytes,
      chargedPuts: after.chargedPuts, pending: after.writeTracking.pending, closed: after.writeTracking.window.closed, sealStatus: seal.status,
      objectBytesExact: stored ? true : null, localOnly: true, unknownOutcomeRetained: unresolved });
    await stop();
  }
  await start('disabled', '', false, false);
  assert.equal((await req('/__playtt-recovery/status?operationId=' + randomUUID())).status, 404); await stop();
  assert.equal(outboundAttempts, 0); owner.localProcessesDisposed = true;
  const report = { schema: 'playtt/recovery-uploads-local/v1', at: new Date().toISOString(), result: 'pass', bundleSha256,
    actualOuterWorker: true, actualCoordinatorFence: true, actualSQLiteBudget: true, actualLocalR2: true, processRestarts: 5, cloudRequests: 0, providerTested: false,
    faults: 'Local wrapper injects exceptions at explicit storage boundaries or replaces a completed success response with HTTP 502; not provider crash proof.',
    storageClassFixture: 'Only Miniflare empty storageClass normalized to Standard for existing inventory check.', scenarios, checks,
    outboundAttempts, localProcessesDisposed: true, noPointerAdoption: true, receiptsDefaultDisabled: true };
  await writeFile(join(runtime, 'artifacts/playtt-recovery-uploads-' + runTag + '-summary.json'), JSON.stringify(report, null, 2));
  await save('verified'); console.log(JSON.stringify({ result: 'pass', scenarios: scenarios.length, processRestarts: 5, outboundAttempts, localProcessesDisposed: true }));
} catch (error) { owner.error = String(error); await save('failed'); throw error; }
finally { await stop(); owner.localProcessesDisposed = true; await writeFile(ownerPath, JSON.stringify(owner, null, 2)); }
