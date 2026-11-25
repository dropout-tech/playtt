// LOCAL ONLY. Real runtime/WordPress, SQLite DO and emulated R2. Never deploy.
// Uses an independently verified private backup. No remote requests are allowed.
import assert from 'node:assert/strict';
import {readFile, writeFile, mkdtemp, copyFile, readdir, access, unlink} from 'node:fs/promises';
import {resolve, join, extname} from 'node:path';
import {tmpdir} from 'node:os';
import {createHash, randomUUID} from 'node:crypto';
import {build} from 'esbuild';
import {Miniflare, Log, LogLevel, convertV4MiniflareOptions} from 'miniflare';
import {openSnapshotBundle, readSnapshotGraph, exportSnapshotBundle, importSnapshotBundle, materializeFullSnapshotBundle} from './playtt-snapshot-bundle.mjs';
import {decodeCanonicalManifestBytes} from '../src/playtt-manifest-envelope.ts';
import {isMetadataOverlay} from '../src/playtt-maintenance-overlay.ts';
import {inspectBackgroundHistory} from './playtt-manifest-budget-history.mjs';

assert.ok(process.argv.includes('--local') && !process.argv.includes('--remote'));
const hash=b=>createHash('sha256').update(b).digest('hex'), load=async p=>JSON.parse(await readFile(p,'utf8'));
const runtime=resolve(import.meta.dirname,'..'), owner=await load('artifacts/playtt-markdown-provider-cold-backup-owned-private.json');
assert.equal(owner.phase,'verified'); assert.equal(owner.anchor.revision,'3021e7bd-a125-439d-9027-11005ea71316');
const baseline=await openSnapshotBundle(owner.directory+'/independent',owner.anchor);
const ui=await load('artifacts/playtt-canvas-ui-owned-private.json'); assert.equal(ui.id,193);
const latest=await load('artifacts/playtt-markdown-provider-cold-ui-owned-private.json');assert.equal(latest.phase,'closed-sealed');ui.expectedBefore.content=latest.expectedContent;
const secrets=await load('../../../playtt-cms-secrets.json');
for(const name of ['owned','command']){try{await access('artifacts/playtt-manifest-budget-ui-'+name+'-private.json');throw Error('Existing budget attempt; inspect, do not replay');}catch(e){if(e.code!=='ENOENT')throw e;}}
assert.equal(hash((await readFile('src/worker.ts','utf8')).replaceAll('\r\n','\n')),'e730b3ad9172b767b35de8031b38fa7d4d758cd035187e4562fe45e29c930439');
assert.equal(hash((await readFile('src/playtt-editor-heartbeat.ts','utf8')).replaceAll('\r\n','\n')),'341ffbe6394d12c0bdadfdd8b53523dc0810f383a777551617a1acb1727f028b');
assert.equal(hash((await readFile('src/playtt-compressed-content.ts','utf8')).replaceAll('\r\n','\n')),'e7cb72fae29723156dbb7eb878a6c6bc20989e34b2304bce0c338595acaf5620');
assert.equal(hash((await readFile('src/playtt-compressed-persistence.ts','utf8')).replaceAll('\r\n','\n')),'8fc173296eece52c5cc5018b967ae6260511b2dd561ff7274fd79cb3b94864a9');
assert.equal(hash((await readFile('src/playtt-markdown-persistence.ts','utf8')).replaceAll('\r\n','\n')),'ea333f1111e4608a2dd6505f4dde68ed0b0647168a222494860d4cd5aeea69ff');
assert.equal(hash((await readFile('src/playtt-maintenance-overlay.ts','utf8')).replaceAll('\r\n','\n')),'a5e811a88fa3b3081ee108807bf6a68c8c9acadcec711e7adf859502632bb6e9');
assert.equal(hash((await readFile('scripts/playtt-snapshot-bundle.mjs','utf8')).replaceAll('\r\n','\n')),'e4695b61d524bdf61a5a3fdcb31dee2cc07e1d0afc356dd2b684f1eef97d57ba');
assert.equal(hash((await readFile('src/playtt-storage-capacity.ts','utf8')).replaceAll('\r\n','\n')),'3ddc0834f7397dfe18149aad2e441b8528a5f9717eea338e1208508a793d6245');
assert.equal(hash((await readFile('src/worker-playtt-do.ts','utf8')).replaceAll('\r\n','\n')),'ad31e78d03643c0e00ccafff47b9cd27e049086e38d69fc04ecac6df288e6f4d');
const expectedSourceHashes={"src/worker.ts": "e730b3ad9172b767b35de8031b38fa7d4d758cd035187e4562fe45e29c930439", "src/playtt-editor-heartbeat.ts": "341ffbe6394d12c0bdadfdd8b53523dc0810f383a777551617a1acb1727f028b", "src/playtt-compressed-content.ts": "e7cb72fae29723156dbb7eb878a6c6bc20989e34b2304bce0c338595acaf5620", "src/playtt-compressed-persistence.ts": "8fc173296eece52c5cc5018b967ae6260511b2dd561ff7274fd79cb3b94864a9", "src/playtt-markdown-persistence.ts": "ea333f1111e4608a2dd6505f4dde68ed0b0647168a222494860d4cd5aeea69ff", "src/playtt-maintenance-overlay.ts": "a5e811a88fa3b3081ee108807bf6a68c8c9acadcec711e7adf859502632bb6e9", "scripts/playtt-snapshot-bundle.mjs": "e4695b61d524bdf61a5a3fdcb31dee2cc07e1d0afc356dd2b684f1eef97d57ba", "src/playtt-storage-capacity.ts": "3ddc0834f7397dfe18149aad2e441b8528a5f9717eea338e1208508a793d6245", "src/worker-playtt-do.ts": "ad31e78d03643c0e00ccafff47b9cd27e049086e38d69fc04ecac6df288e6f4d", "src/playtt-manifest-envelope.ts": "f8a7c6e175297f2e8422f1d4c2704fce094f49af0d3b8a48b09e68a472925795", "src/public-reader.ts": "26d75286301f325ecede93ce9382d4b5cbe631081502e88b5f2c5ed8f2652579", "src/playtt-backup-pins.ts": "587861372f708ea05177107f983da902628f1bbdd3c8f00037e510a811c4f4f1"};
for(const [path,want]of Object.entries(expectedSourceHashes))assert.equal(hash((await readFile(path,'utf8')).replaceAll('\r\n','\n')),want,path);
const directory=await mkdtemp(join(runtime,'artifacts/manifest-budget-ui-'));
const stateDirectory=await mkdtemp(join(tmpdir(),'playtt-manifest-budget-'));
await writeFile(join(directory,'location-private.json'),JSON.stringify({stateDirectory}));
const ownerPath='artifacts/playtt-manifest-budget-ui-owned-private.json';
try{await access(ownerPath);throw Error('Existing UI attempt: inspect before starting again');}catch(e){if(e.code!=='ENOENT')throw e;}
const marker='playtt-manifest-budget-ui-'+randomUUID();
const content=ui.expectedBefore.content+'\n\n<!-- wp:paragraph -->\n<p>瀏覽器儲存後，完整重新啟動仍保留此段繁體中文。 '+marker+'</p>\n<!-- /wp:paragraph -->';
const expectedHash=hash(content), scriptPath=join(directory,'harness.mjs');
await build({stdin:{resolveDir:runtime,sourcefile:'manifest-budget-ui-harness.ts',loader:'ts',contents:`
import worker, {PlayttWordPressExecution, WordPressStateCoordinator, PlayttStorageBudget as ActualStorageBudget} from './src/worker-playtt-do.ts';
export {PlayttWordPressExecution, WordPressStateCoordinator};
// Miniflare's pinned R2 serializer omits storageClass; workerd returns "". Supply only that
// fixture metadata; the actual capacity/tracking/window implementation is intact.
export class PlayttStorageBudget extends ActualStorageBudget {
 constructor(state,env){
  const bucket=env.WORDPRESS_STATE_BUCKET;
  const fixture=new Proxy(bucket,{get(target,key){
   if(key==='list')return async options=>{const page=await target.list(options);console.log(JSON.stringify({localInventory:{count:page.objects.length,truncated:page.truncated,classes:[...new Set(page.objects.map(o=>typeof o.storageClass+':'+String(o.storageClass)))],bytes:page.objects.reduce((n,o)=>n+o.size,0)}}));return {...page,objects:page.objects.map(o=>{
    if(o.storageClass!==''&&o.storageClass!=='Standard')throw Error('Unexpected local storage class');
    return {key:o.key,size:o.size,storageClass:o.storageClass||'Standard'};
   })};};
   const value=Reflect.get(target,key,target);return typeof value==='function'?value.bind(target):value;
  }});
  super(state,{...env,WORDPRESS_STATE_BUCKET:fixture});
 }
}
const key='__local-test/native-save-receipt';
const sha=async text=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text))),b=>b.toString(16).padStart(2,'0')).join('');
export default {async fetch(request,env){
 const u=new URL(request.url);
 if(u.hostname!=='127.0.0.1')return new Response('Local only',{status:403});
 if(u.pathname==='/__local-adopt' && request.method==='POST') {
  const payload=await request.json();
  return env.WORDPRESS_STATE.getByName('playtt-restore-v1:default').fetch(new Request('https://coordinator.invalid/?siteId=default&__wp_codebox_coordinator=adopt',{method:'POST',body:JSON.stringify(payload)}));
 }
 const observe=request.method==='POST' && u.pathname==='/wp-json/wp/v2/pages/193';
 const payload=observe?await request.clone().json():null;
 const at=new Date().toISOString();let action;
 if(u.pathname==='/wp-admin/admin-ajax.php' && request.method==='POST'){
  const form=await request.clone().formData(),raw=form.get('action');action=['heartbeat','rest-nonce','wp-compression-test'].includes(raw)?raw:'other';
 }
 const response=await worker.fetch(request,env);
 const traceRevision=response.headers.get('x-wp-codebox-canonical-revision'),traceVersion=Number(response.headers.get('x-wp-codebox-canonical-version'));
 const nativeRequest=['/wp-login.php','/wp-admin/post.php','/wp-admin/admin-ajax.php'].includes(u.pathname)||u.pathname.startsWith('/wp-json/');
 if((traceRevision && Number.isSafeInteger(traceVersion))||nativeRequest)await env.WORDPRESS_STATE_BUCKET.put('__local-test/requests/'+crypto.randomUUID(),JSON.stringify({at,path:u.pathname,method:request.method,action,status:response.status,version:traceVersion,revision:traceRevision}));
 if(u.pathname==='/wp-admin/post.php' && response.ok){
  const html=await response.clone().text(),match=html.match(/var heartbeatSettings\\s*=\\s*(\\{[^;]+\\});/);if(!match)throw Error('Native heartbeat settings missing');
  const settings=JSON.parse(match[1]);
  await env.WORDPRESS_STATE_BUCKET.put('__local-test/heartbeat-settings',JSON.stringify({minimalInterval:settings.minimalInterval,suspension:settings.suspension,hasNonce:typeof settings.nonce==='string',probe:settings.playttProbe}));
 }

 if(!observe || !response.ok)return response;
 if(typeof payload.content!=='string' || await sha(payload.content)!==${JSON.stringify(expectedHash)})return response;
 const saved=await response.clone().json();
 if(saved.id!==193 || saved.status!=='draft' || await sha(payload.content)!==${JSON.stringify(expectedHash)} || saved.content.raw!==payload.content)throw Error('Local save target mismatch');
 const revision=response.headers.get('x-wp-codebox-canonical-revision'),version=Number(response.headers.get('x-wp-codebox-canonical-version'));
 if(!revision || !Number.isSafeInteger(version) || version<=161)throw Error('Local save requires committed canonical headers');
 const receipt={version,revision,id:saved.id,contentSha256:await sha(saved.content.raw),status:response.status,payloadFields:Object.keys(payload).sort(),at:new Date().toISOString()};
 if(await env.WORDPRESS_STATE_BUCKET.head(key)){if(!await env.WORDPRESS_STATE_BUCKET.head(key+'-retry'))await env.WORDPRESS_STATE_BUCKET.put(key+'-retry',JSON.stringify(receipt));return response;}
 await env.WORDPRESS_STATE_BUCKET.put(key,JSON.stringify(receipt));
 return response;
}};`},bundle:true,format:'esm',platform:'browser',target:'es2022',outfile:scriptPath,logLevel:'silent',external:['node:*','worker_threads','events'],banner:{js:"import { createRequire } from 'node:module'; const require=createRequire('/harness.mjs');"},
plugins:[{name:'workerd-binary-modules',setup(b){b.onResolve({filter:/\.(wasm|sqlite|zip)$/},async args=>{
 const path=resolve(args.resolveDir,args.path),bytes=await readFile(path),name=hash(bytes)+extname(path);await copyFile(path,join(directory,name));return {path:'./'+name,external:true};
});}}]});
let mf,bucket,outboundAttempts=0,origin; const checks=[],cookies=new Map();
const bindings={WORDPRESS_ADMIN_PASSWORD:secrets.WORDPRESS_ADMIN_PASSWORD,WORDPRESS_AUTH_SECRET:'local-markdown-ui-auth-secret-only',WORDPRESS_ADMIN_CLAIM_SECRET:'local-markdown-ui-claim-secret-only',WORDPRESS_OPERATOR_TOKEN:'local-markdown-ui-operator-only',
 WORDPRESS_SITE_CONTEXTS:JSON.stringify([{id:'default',hostname:'127.0.0.1',origin:'http://127.0.0.1:9473'}]),PLAYTT_STATE_PARTITION:'restore-v1',PLAYTT_AUTO_PUBLISH:'true',PLAYTT_METADATA_OVERLAY:'v2',PLAYTT_CORE_EDITOR_LOCK:'gutenberg-79997-v1',PLAYTT_CONTENT_OVERLAY:'content-gzip-v1',PLAYTT_MANIFEST_ENCODING:'gzip-v1',PLAYTT_EDITOR_HEARTBEAT:'native-30s-v1',PLAYTT_PROBE_GATE:'true',PLAYTT_R2_CAPACITY_SCOPE:'playtt-wordpress-session-audit',PLAYTT_R2_CAPACITY_LIMIT_BYTES:'150000000',PLAYTT_R2_WRITE_TRACKING:'v1',PLAYTT_R2_WRITE_WINDOW:'v1'};
const modules=[{type:'ESModule',path:scriptPath},...(await readdir(directory)).filter(n=>/\.(wasm|sqlite|zip)$/.test(n)).map(n=>({type:n.endsWith('.wasm')?'CompiledWasm':'Data',path:join(directory,n)}))];
const start=async()=>{mf=new Miniflare(convertV4MiniflareOptions({name:'playtt-manifest-budget-ui-only',modules,modulesRoot:directory,
 host:'127.0.0.1',port:9473,compatibilityDate:'2026-07-18',compatibilityFlags:['nodejs_compat','enable_request_signal'],cf:false,log:new Log(LogLevel.ERROR),
 durableObjects:{WORDPRESS_STATE:{className:'WordPressStateCoordinator',useSQLite:true},PLAYTT_EXECUTION:{className:'PlayttWordPressExecution',useSQLite:true},PLAYTT_STORAGE_BUDGET:{className:'PlayttStorageBudget',useSQLite:true}},
 resourcePersistencePath:join(stateDirectory,'r'),isolatedResourcePersistencePath:join(stateDirectory,'i'),r2Buckets:['WORDPRESS_STATE_BUCKET'],telemetry:{enabled:false},bindings,
 outboundService:()=>{outboundAttempts++;throw Error('External network forbidden in local harness');}}));await mf.ready;origin=String(await mf.ready).replace(/\/$/,'');assert.equal(origin,'http://127.0.0.1:9473');bucket=await mf.getR2Bucket('WORDPRESS_STATE_BUCKET');};
async function req(path,options={}){assert.ok(path.startsWith('/')&&!path.startsWith('//'));const headers=new Headers(options.headers);headers.set('X-Playtt-Probe',bindings.WORDPRESS_OPERATOR_TOKEN);headers.set('cookie',[...cookies.values()].join('; '));const at=Date.now();
 try{const r=await fetch(origin+path,{...options,headers,redirect:'manual',signal:AbortSignal.timeout(90000)});for(const raw of r.headers.getSetCookie()){const c=raw.split(';')[0];cookies.set(c.split('=')[0],c);}checks.push({path,method:options.method||'GET',status:r.status,wallMs:Date.now()-at});return r;}
 catch(e){checks.push({path,method:options.method||'GET',transportError:e.name,wallMs:Date.now()-at});throw e;}}
async function json(path,body,headers={}){const r=await req(path,{method:body?'POST':'GET',headers:{'content-type':'application/json',...headers},body:body?JSON.stringify(body):undefined});if(r.status!==200){const error=await r.clone().json().catch(()=>null);console.log(JSON.stringify({localFailure:{path,action:body?.action,status:r.status,code:error?.code}}));}assert.equal(r.status,200,path+': '+r.status);return r.json();}
const capacity=body=>json('/__playtt-capacity',body,{authorization:'Bearer '+bindings.WORDPRESS_OPERATOR_TOKEN});
const limits={durationSeconds:600,maxBytes:1881041,maxOperations:96};
const drainToken=randomUUID(),windowToken=randomUUID();
let windowArmed=false,contained=false;
async function contain(){
 if(!windowArmed)return null;
 await capacity({action:'close-write-window',windowToken});
 const deadline=Date.now()+45000;let state=await capacity();
 while(state.writeTracking.pending>0&&Date.now()<deadline){await new Promise(r=>setTimeout(r,250));state=await capacity();}
 assert.equal(state.writeTracking.pending,0,'Never clear unsettled write tickets');
 const fence=await op('fence-acquire',{ttlSeconds:600});
 try{state=await capacity({action:'acquire-write-drain',fenceToken:fence.token,drainToken});assert.equal(state.writeTracking.sealed,true);assert.equal(state.writeTracking.window.closed,true);}
 finally{await op('fence-release',{token:fence.token});}
 contained=true;return state;
}
const op=(phase,body)=>json('/?phase=operator-'+phase,body,{authorization:'Bearer '+bindings.WORDPRESS_OPERATOR_TOKEN});
async function snapshot(){const s=await op('fence-status');assert.equal(s.coherent,true);const raw=await bucket.get(s.state.pointer.manifestKey),bytes=new Uint8Array(await raw.arrayBuffer()),m=await decodeCanonicalManifestBytes(bytes,'sites/default');let base=m;
 if(isMetadataOverlay(m.restorePack))base=await(await bucket.get(m.restorePack.base.manifestKey)).json();
 return {state:s.state,graph:await readSnapshotGraph(bucket,{...s.state.pointer,manifestSha256:hash(bytes),packKey:base.restorePack.objectKey,packSha256:base.restorePack.sha256,packBytes:base.restorePack.size})};}
try{
 await start();
 for(const o of baseline.graph.objects)await bucket.put(o.key,o.bytes);
 for(const [manifestName,file]of [['wordpress-runtime-artifact','cloudflare-wordpress-runtime-corpus.zip'],['wordpress-static-artifact','cloudflare-wordpress-static-corpus.bin'],['sqlite-database-integration-artifact','cloudflare-sqlite-database-integration.zip']]){
  const m=await load('assets/'+manifestName+'.json'),b=await readFile('artifacts/'+file),expected=m.archive||m.blob;assert.equal(b.length,expected.size);assert.equal(hash(b),expected.sha256);await bucket.put(m.key,b);
 }
 const pointer=Object.fromEntries(['revision','manifestKey','persistedAt'].map(k=>[k,owner.anchor[k]]));await bucket.put('sites/default/markdown/current.json',JSON.stringify(pointer));
 await json('/__local-adopt',{pointer,version:161});
 await json('/__playtt-publishing',{action:'pause'},{authorization:'Bearer '+bindings.WORDPRESS_OPERATOR_TOKEN});

 const fence=await op('fence-acquire',{ttlSeconds:600});
 let initialBudget;
 try{
  const initialized=await capacity({action:'initialize',fenceToken:fence.token});
  assert.ok(initialized.remainingBytes>=limits.maxBytes);
  await capacity({action:'initialize-write-tracking',fenceToken:fence.token,legacyWritersDrained:true});
  await capacity({action:'acquire-write-drain',fenceToken:fence.token,drainToken});
  initialBudget=await capacity({action:'arm-write-window',fenceToken:fence.token,drainToken,windowToken,previousWindowToken:null,...limits});windowArmed=true;
  await capacity({action:'release-write-drain',fenceToken:fence.token,drainToken});
 }finally{await op('fence-release',{token:fence.token});}
 const ownerState={at:new Date().toISOString(),phase:'ready',origin,id:193,marker,user:latest.user,expectedBefore:ui.expectedBefore,expectedContent:content,directory,stateDirectory,anchor:owner.anchor,expiresAt:new Date(initialBudget.writeTracking.window.expiresAt).toISOString(),outboundAttempts:0,windowToken,drainToken,limits};
 await writeFile(ownerPath,JSON.stringify(ownerState,null,2)+'\n',{flag:'wx'});
 const commandPath='artifacts/playtt-manifest-budget-ui-command-private.json',replyPath='artifacts/playtt-manifest-budget-ui-reply-private.json';
 let stopping=false,restarts=0;
 const result={schema:'playtt/local-native-ui-manifest-budget/v1',at:new Date().toISOString(),origin,baselineRevision:owner.anchor.revision,ownedDraft:193,marker,expectedContentSha256:expectedHash,observations:[],localProcessesDisposed:false,ttlSeconds:600,limits,initialBudget,outerWorkerGateAndBudget:true,diagnosticObjectsOutsideAccounting:true,runtimeSourceChanged:false,sourceCommit:'b5eec65392ee43bf7c2bfcee65987b323aa20816',sourceHashes:expectedSourceHashes,compressedWriterEnabled:true,manifestEncodingEnabled:true,policyInjected:false,localFixtureStorageClassDefault:'Standard for observed empty-string Miniflare field only; unknown values rejected',cloudRequests:0};
 async function captured(label,receipt){
  let graph,state;
  if(receipt){
   const manifestKey='sites/default/markdown/revisions/'+receipt.revision+'.json',raw=await bucket.get(manifestKey),bytes=new Uint8Array(await raw.arrayBuffer()),manifest=await decodeCanonicalManifestBytes(bytes,'sites/default');let base=manifest;
   if(isMetadataOverlay(manifest.restorePack))base=await(await bucket.get(manifest.restorePack.base.manifestKey)).json();
   graph=await readSnapshotGraph(bucket,{revision:manifest.revision,manifestKey,persistedAt:manifest.persistedAt,manifestSha256:hash(bytes),packKey:base.restorePack.objectKey,packSha256:base.restorePack.sha256,packBytes:base.restorePack.size});state={version:receipt.version,pointer:{revision:manifest.revision,manifestKey,persistedAt:manifest.persistedAt}};
  }else({graph,state}=await snapshot());
  const item={label,at:new Date().toISOString(),state,receipt,budget:await capacity(),manifestEncoding:graph.manifestEncoding,files:graph.contents.markdown.length+graph.contents.uploads.length+graph.contents.wpContent.length,objects:graph.objects.length};
  // Canonical files only, never browser cookies. Retain full local proof privately.
  await writeFile(join(directory,label+'-private.json'),JSON.stringify({state,anchor:graph.anchor,contents:Object.fromEntries(['markdown','uploads','wpContent'].map(k=>[k,graph.contents[k].map(f=>({path:f.path,bytes:Buffer.from(f.bytes).toString('base64')}))])),wpContentDeleted:graph.contents.wpContentDeleted},null,2));
  result.observations.push(item);await writeFile(join(directory,'observations-private.json'),JSON.stringify(result,null,2));return item;
 }
 console.log(JSON.stringify({result:'ready',origin,id:193,expiresAt:ownerState.expiresAt,maxBytes:limits.maxBytes}));
 const deadline=initialBudget.writeTracking.window.expiresAt-5000;
 process.on('SIGINT',()=>{stopping=true;});
 while(!stopping&&Date.now()<deadline){
  let cmd;try{cmd=await load(commandPath);}catch(e){if(e.code!=='ENOENT')throw e;}
  if(cmd){
   assert.ok(typeof cmd.id==='string'&&['status','diagnostic','before','saved','cold','restart','finish'].includes(cmd.action));
   let value;
   try{
    if(cmd.action==='diagnostic'){const raw=await bucket.get('__local-test/heartbeat-settings');value=raw?await raw.json():null;}else if(cmd.action==='status'){const saved=await bucket.get('__local-test/native-save-receipt'),retry=await bucket.get('__local-test/native-save-receipt-retry');const nativeRequests=[];let cursor;do{const page=await bucket.list({prefix:'__local-test/requests/',cursor});for(const item of page.objects)nativeRequests.push(await(await bucket.get(item.key)).json());cursor=page.truncated?page.cursor:undefined;}while(cursor);
     nativeRequests.sort((a,b)=>a.at.localeCompare(b.at));value={result:'status',saved:saved?await saved.json():null,retry:retry?await retry.json():null,restarts,expiresAt:ownerState.expiresAt,outboundAttempts,budget:await capacity(),requestSummary:{autosaves:nativeRequests.filter(r=>r.path.endsWith('/autosaves')),failures:nativeRequests.filter(r=>r.status>=400),recent:nativeRequests.slice(-3)}};}
    else if(cmd.action==='before'){assert.equal(result.observations.some(x=>x.label==='before'),false);value=await captured('before');}
    else if(cmd.action==='saved'){assert.equal(result.observations.some(x=>x.label===cmd.action),false);const raw=await bucket.get('__local-test/native-save-receipt');assert.ok(raw,'Expected UI save receipt not observed');value=await captured(cmd.action,await raw.json());}
    else if(cmd.action==='cold'){assert.equal(result.observations.some(x=>x.label==='cold'),false);value=await captured('cold');}
    else if(cmd.action==='restart'){assert.equal(restarts,0);assert.ok(result.observations.some(x=>x.label==='saved'));await mf.dispose();mf=undefined;await start();restarts++;value={result:'restarted',restarts};}
    else{result.finalBudget=await contain();value=await captured('final');result.history=await inspectBackgroundHistory(bucket,baseline.graph);const settings=await bucket.get('__local-test/heartbeat-settings');result.heartbeatSettings=settings?await settings.json():null;await writeFile('artifacts/playtt-manifest-budget-history.json',JSON.stringify(result.history,null,2)+'\n');const retry=await bucket.get('__local-test/native-save-receipt-retry');result.matchingRetry=retry?await retry.json():null;
     const finalSnapshot=await snapshot();await exportSnapshotBundle(bucket,finalSnapshot.graph.anchor,join(directory,'export'));
     const independent=await importSnapshotBundle(join(directory,'export'),finalSnapshot.graph.anchor,join(directory,'independent'));
     assert.deepEqual(independent.graph.contents,finalSnapshot.graph.contents);
     const full=await materializeFullSnapshotBundle(join(directory,'independent'),finalSnapshot.graph.anchor,join(directory,'materialized'));
     const order=c=>Object.fromEntries(['markdown','uploads','wpContent'].map(g=>[g,[...c[g]].sort((a,b)=>a.path.localeCompare(b.path))]));
     assert.deepEqual(order(full.graph.contents),order(finalSnapshot.graph.contents));assert.deepEqual(full.graph.contents.wpContentDeleted,finalSnapshot.graph.contents.wpContentDeleted);
     result.backup={format:independent.graph.format,manifestEncoding:independent.graph.manifestEncoding,objects:independent.graph.objects.length,independentExact:true,fullMaterializedExact:true};stopping=true;}
    await writeFile(replyPath,JSON.stringify({id:cmd.id,action:cmd.action,ok:true,value},null,2));
   }catch(e){await writeFile(replyPath,JSON.stringify({id:cmd.id,action:cmd.action,ok:false,error:{name:e.name,message:e.message}},null,2));}
   await unlink(commandPath);
  }
  if(!stopping)await new Promise(resolve=>setTimeout(resolve,250));
 }
 if(!contained)result.finalBudget=await contain();
 for(const [path,want]of Object.entries(expectedSourceHashes))assert.equal(hash((await readFile(path,'utf8')).replaceAll('\r\n','\n')),want,path);
 result.contained=contained;result.checks=checks;result.elapsedWindowMs=Date.now()-initialBudget.writeTracking.window.openedAt;
 ownerState.phase=stopping?'finished':'expired';ownerState.outboundAttempts=outboundAttempts;ownerState.restarts=restarts;result.outboundAttempts=outboundAttempts;result.restarts=restarts;result.stopReason=ownerState.phase;
 await mf.dispose();mf=undefined;ownerState.localProcessesDisposed=true;result.localProcessesDisposed=true;
 await writeFile(ownerPath,JSON.stringify(ownerState,null,2)+'\n');await writeFile('artifacts/playtt-manifest-budget-ui-server-private.json',JSON.stringify(result,null,2)+'\n');
 console.log(JSON.stringify({result:ownerState.phase,restarts,outboundAttempts,localProcessesDisposed:true}));
}finally{if(mf){if(windowArmed&&!contained)await contain();await mf.dispose();}}
