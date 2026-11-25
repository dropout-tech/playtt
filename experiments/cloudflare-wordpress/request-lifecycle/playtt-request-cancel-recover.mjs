// Read-only recovery of an already sealed local attempt. No user request replay or new budget.
import assert from 'node:assert/strict';
import {readFile,writeFile,access} from 'node:fs/promises';
import {dirname,basename,join} from 'node:path';
import {createHash} from 'node:crypto';
import {Miniflare,Log,LogLevel,convertV4MiniflareOptions} from 'miniflare';
import {openSnapshotBundle,readSnapshotGraph,exportSnapshotBundle,importSnapshotBundle,materializeFullSnapshotBundle} from './playtt-snapshot-bundle.mjs';
import {decodeCanonicalManifestBytes} from '../src/playtt-manifest-envelope.ts';
import {isMetadataOverlay} from '../src/playtt-maintenance-overlay.ts';
assert.ok(process.argv.includes('--local')&&!process.argv.includes('--remote'));
const load=async p=>JSON.parse(await readFile(p,'utf8')),sha=b=>createHash('sha256').update(b).digest('hex');
const owner=await load('artifacts/playtt-request-cancel-v2-owned-private.json');assert.equal(owner.phase,'failed');assert.equal(owner.sealed,true);assert.equal(owner.localProcessesDisposed,true);
const out=join(owner.directory,'recovery-private.json');await access(out).then(()=>{throw Error('Existing recovery: inspect without replay');},e=>{if(e.code!=='ENOENT')throw e;});
const source=(await readFile(join(owner.directory,'executed-inputs/playtt-request-cancel-local.mjs'),'utf8')).replaceAll('\r\n','\n');
const config=source.match(/const origin='([^']+)',workerName='([^']+)',bindings=(\{.+?\});\n/);assert.ok(config);
// Configuration is pinned to the archived local harness, never obtained from runtime input or the web.
const origin=config[1],workerName=config[2];assert.equal(origin,'http://127.0.0.1:9529');
const bindings=Function('origin','return ('+config[3]+')')(origin);assert.equal(bindings.PLAYTT_R2_CAPACITY_LIMIT_BYTES,'150000000');
const compiled=dirname(owner.wrapper),plan=await load('artifacts/playtt-manifest-bytes-build-private.json');
for(const m of plan.productionModules){const b=await readFile(join(compiled,basename(m.path)));assert.equal(sha(b),m.sha256);assert.equal(b.length,m.bytes);}
for(const e of await load(join(owner.directory,'executed-inputs/hashes.json')))assert.equal(sha(await readFile(join(owner.directory,'executed-inputs',e.name))),e.sha256);
const cloud=await load('artifacts/playtt-old-provider-owned-private.json'),baseline=(await openSnapshotBundle(cloud.directory+'/independent',cloud.anchor)).graph;
let mf,bucket,outboundAttempts=0,report;
async function get(path){const r=await fetch(origin+path,{headers:{'X-Playtt-Probe':bindings.WORDPRESS_OPERATOR_TOKEN,authorization:'Bearer '+bindings.WORDPRESS_OPERATOR_TOKEN},redirect:'manual',signal:AbortSignal.timeout(45000)});assert.equal(r.status,200);return r.json();}
try{
 const modules=[{type:'ESModule',path:owner.wrapper},...['playtt-request-lifecycle.mjs','playtt-ajax-classifier.mjs'].map(name=>({type:'ESModule',path:join(compiled,name)})),...plan.productionModules.map(m=>({type:m.path.endsWith('.js')?'ESModule':m.path.endsWith('.wasm')?'CompiledWasm':'Data',path:join(compiled,basename(m.path))}))];
 mf=new Miniflare(convertV4MiniflareOptions({name:workerName,modules,modulesRoot:compiled,host:'127.0.0.1',port:9529,inspectorHost:'127.0.0.1',inspectorPort:9530,compatibilityDate:'2026-07-18',compatibilityFlags:['nodejs_compat','enable_request_signal'],cf:false,log:new Log(LogLevel.ERROR),durableObjects:{WORDPRESS_STATE:{className:'WordPressStateCoordinator',useSQLite:true},PLAYTT_EXECUTION:{className:'PlayttWordPressExecution',useSQLite:true},PLAYTT_STORAGE_BUDGET:{className:'PlayttStorageBudget',useSQLite:true}},resourcePersistencePath:join(owner.stateDirectory,'r'),isolatedResourcePersistencePath:join(owner.stateDirectory,'i'),r2Buckets:['WORDPRESS_STATE_BUCKET'],telemetry:{enabled:false},bindings,outboundService:()=>{outboundAttempts++;throw Error('External network forbidden');}}));assert.equal(new URL(String(await mf.ready)).origin,origin);bucket=await mf.getR2Bucket('WORDPRESS_STATE_BUCKET');
 const before=await get('/__playtt-capacity');assert.equal(before.writeTracking.sealed,true);assert.equal(before.writeTracking.pending,0);assert.equal(before.writeTracking.window.closed,true);
 const state=await get('/?phase=operator-fence-status');assert.equal(state.coherent,true);assert.ok(state.state.version>181);
 const obj=await bucket.get(state.state.pointer.manifestKey),wire=new Uint8Array(await obj.arrayBuffer()),manifest=await decodeCanonicalManifestBytes(wire,'sites/default'),base=isMetadataOverlay(manifest.restorePack)?await(await bucket.get(manifest.restorePack.base.manifestKey)).json():manifest;
 const graph=await readSnapshotGraph(bucket,{...state.state.pointer,manifestSha256:sha(wire),packKey:base.restorePack.objectKey,packSha256:base.restorePack.sha256,packBytes:base.restorePack.size});
 await exportSnapshotBundle(bucket,graph.anchor,join(owner.directory,'recovery-export'));const independent=await importSnapshotBundle(join(owner.directory,'recovery-export'),graph.anchor,join(owner.directory,'recovery-independent'));assert.deepEqual(independent.graph.contents,graph.contents);
 const full=await materializeFullSnapshotBundle(join(owner.directory,'recovery-independent'),graph.anchor,join(owner.directory,'recovery-materialized'));
 const ordered=c=>Object.fromEntries(['markdown','uploads','wpContent'].map(g=>[g,[...c[g]].sort((a,b)=>a.path.localeCompare(b.path))]));assert.deepEqual(ordered(full.graph.contents),ordered(graph.contents));assert.deepEqual(full.graph.contents.wpContentDeleted,graph.contents.wpContentDeleted);
 const bytes=(g,p)=>Buffer.from(g.contents.markdown.find(x=>x.path===p).bytes),paths=baseline.contents.markdown.map(x=>x.path).sort();assert.deepEqual(graph.contents.markdown.map(x=>x.path).sort(),paths);
 const changed=paths.filter(p=>!bytes(baseline,p).equals(bytes(graph,p))),after=await get('/__playtt-capacity');assert.deepEqual(after,before);const afterState=await get('/?phase=operator-fence-status');assert.deepEqual(afterState,state);assert.equal(outboundAttempts,0);
 report={schema:'playtt/local-request-cancel-recovery/v1',at:new Date().toISOString(),result:'read-only-export-complete; original-validation-failure-preserved',anchor:graph.anchor,version:state.state.version,budget:after,changedFiles:changed,objects:graph.objects.length,files:paths.length+graph.contents.uploads.length+graph.contents.wpContent.length,independentExact:true,materializedExact:true,budgetAndStateUnchanged:true,cloudRequests:0,outboundAttempts:0,localProcessesDisposed:false};
}finally{if(mf)await mf.dispose();}
report.localProcessesDisposed=true;await writeFile(out,JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({result:report.result,version:report.version,changedFiles:report.changedFiles,chargedBytes:report.budget.chargedBytes,closed:true,sealed:true,pending:0,disposed:true}));
