// Read a closed/sealed LOCAL fixture after a verifier rejected WordPress's
// floating draft date. Does not arm, refund, write WordPress, or contact cloud.
import assert from 'node:assert/strict';
import {readFile,writeFile,access} from 'node:fs/promises';
import {resolve,dirname,join} from 'node:path';
import {createHash} from 'node:crypto';
import {Miniflare,Log,LogLevel,convertV4MiniflareOptions} from 'miniflare';
import {readSnapshotGraph,exportSnapshotBundle,importSnapshotBundle,materializeFullSnapshotBundle} from './playtt-snapshot-bundle.mjs';
import {decodeCanonicalManifestBytes} from '../src/playtt-manifest-envelope.ts';
import {isMetadataOverlay} from '../src/playtt-maintenance-overlay.ts';
assert.ok(process.argv.includes('--local')&&!process.argv.includes('--remote'));
const load=async p=>JSON.parse(await readFile(p,'utf8')),sha=b=>createHash('sha256').update(b).digest('hex');
const prefix='artifacts/playtt-path-save-native-v3-',owner=await load(prefix+'owned-private.json');
assert.equal(owner.phase,'failed');assert.equal(owner.sealed,true);assert.equal(owner.localProcessesDisposed,true);
await access(join(owner.directory,'independent')).then(()=>{throw Error('Already exported; audit without replay');},e=>{if(e.code!=='ENOENT')throw e;});
const failure=await load(join(owner.directory,'failure-private.json'));
assert.equal(failure.name,'AssertionError');assert.ok(failure.message.includes('  date:'));assert.ok(failure.message.includes('  date_gmt:'));
const target=(await load('artifacts/playtt-path-join-deploy-plan.json')).targets.candidate;
for(const m of target.modules){const b=await readFile(m.path);assert.equal(b.length,m.bytes);assert.equal(sha(b),m.sha256);}
const origin=owner.origin;assert.equal(origin,'http://127.0.0.1:9493');
const bindings={LOCAL_EXPECTED_CONTENT_SHA:owner.expectedSha,WORDPRESS_ADMIN_PASSWORD:'local-editor-unused-admin-only',WORDPRESS_AUTH_SECRET:'local-editor-auth-only',WORDPRESS_ADMIN_CLAIM_SECRET:'local-editor-claim-only',WORDPRESS_OPERATOR_TOKEN:owner.gate,WORDPRESS_SITE_CONTEXTS:JSON.stringify([{id:'default',hostname:'127.0.0.1',origin}]),PLAYTT_STATE_PARTITION:'restore-v1',PLAYTT_AUTO_PUBLISH:'true',PLAYTT_METADATA_OVERLAY:'v2',PLAYTT_CORE_EDITOR_LOCK:'gutenberg-79997-v1',PLAYTT_CONTENT_OVERLAY:'content-gzip-v1',PLAYTT_MANIFEST_ENCODING:'gzip-v1',PLAYTT_EDITOR_HEARTBEAT:'native-30s-v1',PLAYTT_MEMORY_DIAGNOSTICS:'true',PLAYTT_PROBE_GATE:'true',PLAYTT_R2_CAPACITY_SCOPE:'playtt-wordpress-session-audit',PLAYTT_R2_CAPACITY_LIMIT_BYTES:'150000000',PLAYTT_R2_WRITE_TRACKING:'v1',PLAYTT_R2_WRITE_WINDOW:'v1'};
const modules=[{type:'ESModule',path:owner.wrapper},...target.modules.map(e=>({type:e.path.endsWith('.js')?'ESModule':e.path.endsWith('.wasm')?'CompiledWasm':'Data',path:resolve(e.path)}))];
let mf,outboundAttempts=0,report;
const request=async path=>{assert.ok(['/__playtt-capacity','/?phase=operator-fence-status','/__playtt-publishing'].includes(path));const r=await fetch(origin+path,{headers:{'X-Playtt-Probe':owner.gate,authorization:'Bearer '+owner.gate},signal:AbortSignal.timeout(45000)});assert.equal(r.status,200);return r.json();};
const order=c=>Object.fromEntries(['markdown','uploads','wpContent'].map(g=>[g,[...c[g]].sort((a,b)=>a.path.localeCompare(b.path))]));
try{
 mf=new Miniflare(convertV4MiniflareOptions({name:'playtt-path-save-local',modules,modulesRoot:resolve(dirname(target.entry)),host:'127.0.0.1',port:9493,compatibilityDate:'2026-07-18',compatibilityFlags:['nodejs_compat','enable_request_signal'],cf:false,log:new Log(LogLevel.ERROR),durableObjects:{WORDPRESS_STATE:{className:'WordPressStateCoordinator',useSQLite:true},PLAYTT_EXECUTION:{className:'PlayttWordPressExecution',useSQLite:true},PLAYTT_STORAGE_BUDGET:{className:'PlayttStorageBudget',useSQLite:true}},resourcePersistencePath:join(owner.stateDirectory,'r'),isolatedResourcePersistencePath:join(owner.stateDirectory,'i'),r2Buckets:['WORDPRESS_STATE_BUCKET'],telemetry:{enabled:false},bindings,outboundService:()=>{outboundAttempts++;throw Error('External network forbidden');}}));
 assert.equal(new URL(String(await mf.ready)).origin,origin);
 const budget=await request('/__playtt-capacity');assert.equal(budget.writeTracking.pending,0);assert.equal(budget.writeTracking.sealed,true);assert.equal(budget.writeTracking.window.closed,true);
 const state=await request('/?phase=operator-fence-status');assert.equal(state.coherent,true);assert.equal(state.fence.active,false);
 const bucket=await mf.getR2Bucket('WORDPRESS_STATE_BUCKET'),raw=new Uint8Array(await(await bucket.get(state.state.pointer.manifestKey)).arrayBuffer());
 const manifest=await decodeCanonicalManifestBytes(raw,'sites/default'),base=isMetadataOverlay(manifest.restorePack)?await(await bucket.get(manifest.restorePack.base.manifestKey)).json():manifest;
 const graph=await readSnapshotGraph(bucket,{...state.state.pointer,manifestSha256:sha(raw),packKey:base.restorePack.objectKey,packSha256:base.restorePack.sha256,packBytes:base.restorePack.size});
 await exportSnapshotBundle(bucket,graph.anchor,join(owner.directory,'export'));
 const independent=await importSnapshotBundle(join(owner.directory,'export'),graph.anchor,join(owner.directory,'independent'));
 const full=await materializeFullSnapshotBundle(join(owner.directory,'independent'),graph.anchor,join(owner.directory,'materialized'));
 for(const g of [independent.graph,full.graph]){assert.deepEqual(order(g.contents),order(graph.contents));assert.deepEqual(g.contents.wpContentDeleted,graph.contents.wpContentDeleted);}
 assert.deepEqual(await request('/__playtt-capacity'),budget);assert.deepEqual(await request('/?phase=operator-fence-status'),state);assert.equal(outboundAttempts,0);
 report={schema:'playtt/path-save-sealed-recovery/v1',at:new Date().toISOString(),localOnly:true,cloudRequests:0,wordPressRequests:0,noSeedOrRearm:true,noLedgerChange:true,closed:true,sealed:true,pending:0,finalVersion:state.state.version,finalBudget:budget,independentExact:true,fullMaterializedExact:true,objects:graph.objects.length,files:['markdown','uploads','wpContent'].reduce((n,g)=>n+graph.contents[g].length,0),outboundAttempts};
 owner.finalAnchor=graph.anchor;owner.finalVersion=state.state.version;owner.sealedRecoveryReadOnly=true;
}finally{if(mf)await mf.dispose();}
report.localProcessesDisposed=true;await writeFile(prefix+'owned-private.json',JSON.stringify(owner,null,2));await writeFile(prefix+'recovery.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({result:'sealed-data-exported',version:report.finalVersion,objects:report.objects,files:report.files,chargedBytes:report.finalBudget.chargedBytes,chargedPuts:report.finalBudget.chargedPuts}));
