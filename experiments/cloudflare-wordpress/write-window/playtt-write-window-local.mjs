// LOCAL ONLY: real workerd + SQLite DO + emulated R2, with no WordPress/PHP.
// The harness has unauthenticated test controls and must never be deployed.
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { build } from 'esbuild';
import { Miniflare, Log, LogLevel, convertV4MiniflareOptions } from 'miniflare';

const runtime=resolve(fileURLToPath(new URL('..',import.meta.url)));
const artifacts=join(runtime,'artifacts'); await mkdir(artifacts,{recursive:true});
const directory=await mkdtemp(join(artifacts,'write-window-local-'));
// Keep SQLite filenames below Windows path limits; only synthetic test data.
const stateDirectory=await mkdtemp(join(tmpdir(),'playtt-w-'));
await writeFile(join(directory,'state-location-private.json'),JSON.stringify({stateDirectory})+'\n');
const scriptPath=join(directory,'harness.mjs');
await build({stdin:{contents:`
import { PlayttStorageBudget, withPlayttStorageCapacity, playttWriteWindowAdmission, PlayttCapacityError, playttCapacityResponse } from './src/playtt-storage-capacity.ts';
export { PlayttStorageBudget };
export default { async fetch(request, env) {
  const path = new URL(request.url).pathname;
  if (path.startsWith('/control/')) return env.PLAYTT_STORAGE_BUDGET.getByName('playtt-r2-capacity-v1').fetch(new Request('https://budget.invalid/'+path.slice(9),request));
  if (path === '/read') { const value=await env.WORDPRESS_STATE_BUCKET.get('sites/default/local.txt'); return new Response(value?await value.text():'missing'); }
  try {
    if(path==='/admission') { await playttWriteWindowAdmission(env); return new Response('admitted'); }
    const bucket=withPlayttStorageCapacity(env).WORDPRESS_STATE_BUCKET;
    if(path==='/put') { await bucket.put('sites/default/local.txt',await request.text()); return new Response('stored'); }
    if(path==='/delete') { await bucket.delete('sites/default/local.txt'); return new Response('deleted'); }
    return new Response('Not found',{status:404});
  } catch(error) { if(error instanceof PlayttCapacityError)return playttCapacityResponse(error);throw error; }
}};
`,resolveDir:runtime,sourcefile:'playtt-window-local-harness.ts',loader:'ts'},bundle:true,format:'esm',platform:'browser',target:'es2022',outfile:scriptPath});
let mf, outboundAttempts=0;
const start=()=>new Miniflare(convertV4MiniflareOptions({name:'playtt-write-window-local-only',modules:true,scriptPath,host:'127.0.0.1',port:0,compatibilityDate:'2026-07-18',cf:false,
  log:new Log(LogLevel.ERROR),
  durableObjects:{PLAYTT_STORAGE_BUDGET:{className:'PlayttStorageBudget',useSQLite:true}},
  resourcePersistencePath:join(stateDirectory,'r'),isolatedResourcePersistencePath:join(stateDirectory,'i'),r2Buckets:['WORDPRESS_STATE_BUCKET'],telemetry:{enabled:false},
  bindings:{PLAYTT_R2_CAPACITY_SCOPE:'playtt-wordpress-pin-restore-audit',PLAYTT_R2_CAPACITY_LIMIT_BYTES:'1000000',PLAYTT_R2_WRITE_TRACKING:'v1',PLAYTT_R2_WRITE_WINDOW:'v1'},
  outboundService:()=>{outboundAttempts++;throw Error('External network forbidden in local harness');},
}));
const request=(path,body)=>mf.dispatchFetch('http://local.invalid'+path,body===undefined?{}:{method:'POST',body:typeof body==='string'?body:JSON.stringify(body)});
const control=(path,body)=>request('/control'+path,body);
const status=async()=>{const r=await control('/status');assert.equal(r.status,200);return r.json();};
const ok=async(p)=>{const r=await p;assert.equal(r.status,200,await r.text());};
let report;
try {
  mf=start(); await mf.ready;
  await ok(control('/initialize',{})); await ok(control('/tracking/initialize',{}));
  assert.equal((await request('/put','before arm')).status,503);
  const drain=crypto.randomUUID(),owner=crypto.randomUUID();
  await ok(control('/tracking/acquire',{token:drain}));
  const arm={token:owner,previousToken:null,drainToken:drain,durationSeconds:3,maxBytes:100,maxOperations:5};
  await ok(control('/window/arm',arm));
  assert.equal((await request('/admission')).status,503);
  await ok(control('/tracking/release',{token:drain}));
  await ok(request('/admission')); await ok(request('/put','persistent sample'));
  const before=await status(); assert.equal(before.chargedBytes,17); assert.equal(before.writeTracking.pending,0);
  await mf.dispose(); mf=undefined;
  mf=start(); await mf.ready;
  const recovered=await status();
  assert.equal(recovered.writeTracking.window.id,before.writeTracking.window.id);
  assert.equal(recovered.writeTracking.window.expiresAt,before.writeTracking.window.expiresAt);
  assert.equal(recovered.chargedBytes,17); assert.equal(await (await request('/read')).text(),'persistent sample');
  await new Promise(r=>setTimeout(r,Math.max(0,before.writeTracking.window.expiresAt-Date.now()+75)));
  for(const [path,body] of [['/admission',undefined],['/put','must not save'],['/delete','']]) assert.equal((await request(path,body)).status,503);
  const expired=await status(); assert.equal(expired.writeTracking.window.expired,true);
  assert.equal(expired.writeTracking.window.operations,1); assert.equal(expired.chargedBytes,17); assert.equal(expired.writeTracking.pending,0);
  assert.equal(await (await request('/read')).text(),'persistent sample');
  await ok(control('/tracking/acquire',{token:drain}));
  await ok(control('/window/arm',arm)); assert.equal((await status()).writeTracking.window.expiresAt,before.writeTracking.window.expiresAt);
  const nextOwner=crypto.randomUUID();
  await ok(control('/window/arm',{...arm,token:nextOwner,previousToken:owner,durationSeconds:30}));
  assert.equal((await control('/window/close',{token:owner})).status,409);
  await ok(control('/tracking/release',{token:drain})); await ok(request('/put','next'));
  await ok(control('/window/close',{token:nextOwner})); assert.equal((await request('/put','closed')).status,503);
  const final=await status(); assert.equal(final.chargedBytes,21); assert.equal(final.writeTracking.window.usedBytes,4); assert.equal(final.writeTracking.window.closed,true);
  await ok(control('/tracking/acquire',{token:drain})); assert.equal((await status()).writeTracking.sealed,true);
  assert.equal(outboundAttempts,0);
  report={schema:'playtt/local-write-window-proof/v1',at:new Date().toISOString(),result:'pass',
    realWorkerd:true,sqliteDurableObject:true,localR2:true,instanceRestarts:1,windowSurvivedRestart:true,
    deadlineDenied:['admission','put','delete'],originalObjectUnchangedAfterDeadline:true,exactRetryKeptDeadline:true,
    explicitNewWindowRequiredPreviousOwner:true,oldOwnerCannotCloseNewWindow:true,closedWindowDenied:true,
    totalChargedBytes:21,remainingPending:final.writeTracking.pending,finalSealed:true,outboundAttempts,
    wordpressOrPhpExecuted:false,operatorHttpAuthenticationTested:false,cloudflareProviderTested:false,
    localProcessesDisposed:false};
} finally { if(mf)await mf.dispose(); }
report.localProcessesDisposed=true;
await writeFile(join(artifacts,'playtt-write-window-local.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report));
