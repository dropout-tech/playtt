// LOCAL ONLY. Real runtime/WordPress, SQLite DO and emulated R2. Never deploy.
// Uses an independently verified private backup. No remote requests are allowed.
import assert from 'node:assert/strict';
import {readFile, writeFile, mkdtemp, copyFile, readdir, access, unlink} from 'node:fs/promises';
import {resolve, join, extname} from 'node:path';
import {tmpdir} from 'node:os';
import {createHash, randomUUID} from 'node:crypto';
import {build} from 'esbuild';
import {Miniflare, Log, LogLevel, convertV4MiniflareOptions} from 'miniflare';
import {openSnapshotBundle, readSnapshotGraph} from './playtt-snapshot-bundle.mjs';
import {isMetadataOverlay} from '../src/playtt-maintenance-overlay.ts';
import {inspectBackgroundHistory} from './playtt-background-write-inspect.mjs';

assert.ok(process.argv.includes('--local') && !process.argv.includes('--remote'));
const hash=b=>createHash('sha256').update(b).digest('hex'), load=async p=>JSON.parse(await readFile(p,'utf8'));
const runtime=resolve(import.meta.dirname,'..'), owner=await load('artifacts/playtt-markdown-provider-cold-backup-owned-private.json');
assert.equal(owner.phase,'verified'); assert.equal(owner.anchor.revision,'3021e7bd-a125-439d-9027-11005ea71316');
const baseline=await openSnapshotBundle(owner.directory+'/independent',owner.anchor);
const ui=await load('artifacts/playtt-canvas-ui-owned-private.json'); assert.equal(ui.id,193);
const latest=await load('artifacts/playtt-markdown-provider-cold-ui-owned-private.json');assert.equal(latest.phase,'closed-sealed');ui.expectedBefore.content=latest.expectedContent;
const secrets=await load('../../../playtt-cms-secrets.json');
const directory=await mkdtemp(join(runtime,'artifacts/background-write-ui-'));
const stateDirectory=await mkdtemp(join(tmpdir(),'playtt-background-ui-'));
await writeFile(join(directory,'location-private.json'),JSON.stringify({stateDirectory}));
const ownerPath='artifacts/playtt-background-write-ui-owned-private.json';
try{await access(ownerPath);throw Error('Existing UI attempt: inspect before starting again');}catch(e){if(e.code!=='ENOENT')throw e;}
const marker='playtt-background-write-ui-'+randomUUID();
const content=ui.expectedBefore.content+'\n\n<!-- wp:paragraph -->\n<p>瀏覽器儲存後，完整重新啟動仍保留此段繁體中文。 '+marker+'</p>\n<!-- /wp:paragraph -->';
const expectedHash=hash(content), scriptPath=join(directory,'harness.mjs');
await build({stdin:{resolveDir:runtime,sourcefile:'background-write-ui-harness.ts',loader:'ts',contents:`
import worker, {PlayttWordPressExecution, WordPressStateCoordinator, PlayttStorageBudget} from './src/worker-playtt-do.ts';
export {PlayttWordPressExecution, WordPressStateCoordinator, PlayttStorageBudget};
export default {async fetch(request,env){
 const u=new URL(request.url);
 if(u.hostname!=='127.0.0.1')return new Response('Local only',{status:403});
 if(u.pathname==='/__local-adopt' && request.method==='POST') {
  const payload=await request.json();
  return env.WORDPRESS_STATE.getByName('playtt-restore-v1:default').fetch(new Request('https://coordinator.invalid/?siteId=default&__wp_codebox_coordinator=adopt',{method:'POST',body:JSON.stringify(payload)}));
 }
 const at=new Date().toISOString();let action;
 if(u.pathname==='/wp-admin/admin-ajax.php' && request.method==='POST'){
  const form=await request.clone().formData(),raw=form.get('action');
  action=['heartbeat','rest-nonce','wp-compression-test'].includes(raw)?raw:'other';
 }
 const response=await worker.fetch(request,env);
 const revision=response.headers.get('x-wp-codebox-canonical-revision'),version=Number(response.headers.get('x-wp-codebox-canonical-version'));
 if(revision && Number.isSafeInteger(version))await env.WORDPRESS_STATE_BUCKET.put('__local-test/requests/'+crypto.randomUUID(),JSON.stringify({at,path:u.pathname,method:request.method,action,status:response.status,version,revision}));
 return response;
}};`},bundle:true,format:'esm',platform:'browser',target:'es2022',outfile:scriptPath,logLevel:'silent',external:['node:*','worker_threads','events'],banner:{js:"import { createRequire } from 'node:module'; const require=createRequire('/harness.mjs');"},
plugins:[{name:'workerd-binary-modules',setup(b){b.onResolve({filter:/\.(wasm|sqlite|zip)$/},async args=>{
 const path=resolve(args.resolveDir,args.path),bytes=await readFile(path),name=hash(bytes)+extname(path);await copyFile(path,join(directory,name));return {path:'./'+name,external:true};
});}}]});
let mf,bucket,outboundAttempts=0,origin; const checks=[],cookies=new Map();
const bindings={WORDPRESS_ADMIN_PASSWORD:secrets.WORDPRESS_ADMIN_PASSWORD,WORDPRESS_AUTH_SECRET:'local-markdown-ui-auth-secret-only',WORDPRESS_ADMIN_CLAIM_SECRET:'local-markdown-ui-claim-secret-only',WORDPRESS_OPERATOR_TOKEN:'local-markdown-ui-operator-only',
 WORDPRESS_SITE_CONTEXTS:JSON.stringify([{id:'default',hostname:'127.0.0.1',origin:'http://127.0.0.1:9455'}]),PLAYTT_STATE_PARTITION:'restore-v1',PLAYTT_AUTO_PUBLISH:'true',PLAYTT_METADATA_OVERLAY:'v2',PLAYTT_CORE_EDITOR_LOCK:'gutenberg-79997-v1',PLAYTT_CONTENT_OVERLAY:'content-v1'};
const modules=[{type:'ESModule',path:scriptPath},...(await readdir(directory)).filter(n=>/\.(wasm|sqlite|zip)$/.test(n)).map(n=>({type:n.endsWith('.wasm')?'CompiledWasm':'Data',path:join(directory,n)}))];
const start=async()=>{mf=new Miniflare(convertV4MiniflareOptions({name:'playtt-background-write-ui-only',modules,modulesRoot:directory,
 host:'127.0.0.1',port:9455,compatibilityDate:'2026-07-18',compatibilityFlags:['nodejs_compat','enable_request_signal'],cf:false,log:new Log(LogLevel.ERROR),
 durableObjects:{WORDPRESS_STATE:{className:'WordPressStateCoordinator',useSQLite:true},PLAYTT_EXECUTION:{className:'PlayttWordPressExecution',useSQLite:true},PLAYTT_STORAGE_BUDGET:{className:'PlayttStorageBudget',useSQLite:true}},
 resourcePersistencePath:join(stateDirectory,'r'),isolatedResourcePersistencePath:join(stateDirectory,'i'),r2Buckets:['WORDPRESS_STATE_BUCKET'],telemetry:{enabled:false},bindings,
 outboundService:()=>{outboundAttempts++;throw Error('External network forbidden in local harness');}}));await mf.ready;origin=String(await mf.ready).replace(/\/$/,'');assert.equal(origin,'http://127.0.0.1:9455');bucket=await mf.getR2Bucket('WORDPRESS_STATE_BUCKET');};
async function req(path,options={}){assert.ok(path.startsWith('/')&&!path.startsWith('//'));const headers=new Headers(options.headers);headers.set('cookie',[...cookies.values()].join('; '));const at=Date.now();
 try{const r=await fetch(origin+path,{...options,headers,redirect:'manual',signal:AbortSignal.timeout(90000)});for(const raw of r.headers.getSetCookie()){const c=raw.split(';')[0];cookies.set(c.split('=')[0],c);}checks.push({path,method:options.method||'GET',status:r.status,wallMs:Date.now()-at});return r;}
 catch(e){checks.push({path,method:options.method||'GET',transportError:e.name,wallMs:Date.now()-at});throw e;}}
async function json(path,body,headers={}){const r=await req(path,{method:body?'POST':'GET',headers:{'content-type':'application/json',...headers},body:body?JSON.stringify(body):undefined});assert.equal(r.status,200,path+': '+r.status);return r.json();}
const op=(phase,body)=>json('/?phase=operator-'+phase,body,{authorization:'Bearer '+bindings.WORDPRESS_OPERATOR_TOKEN});
async function snapshot(){const s=await op('fence-status');assert.equal(s.coherent,true);const raw=await bucket.get(s.state.pointer.manifestKey),bytes=new Uint8Array(await raw.arrayBuffer()),m=JSON.parse(new TextDecoder().decode(bytes));let base=m;
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

 const ownerState={at:new Date().toISOString(),phase:'ready',origin,id:193,marker,user:latest.user,expectedBefore:ui.expectedBefore,expectedContent:content,directory,stateDirectory,anchor:owner.anchor,expiresAt:new Date(Date.now()+1200000).toISOString(),outboundAttempts:0};
 await writeFile(ownerPath,JSON.stringify(ownerState,null,2)+'\n',{flag:'wx'});
 const commandPath='artifacts/playtt-background-write-ui-command-private.json',replyPath='artifacts/playtt-background-write-ui-reply-private.json';
 let stopping=false,restarts=0;
 const result={schema:'playtt/local-background-write-diagnostic/v1',at:new Date().toISOString(),origin,baselineRevision:owner.anchor.revision,ownedDraft:193,marker,expectedContentSha256:expectedHash,observations:[],localProcessesDisposed:false,ttlSeconds:1200};
 async function captured(label,receipt){
  let graph,state;
  if(receipt){
   const manifestKey='sites/default/markdown/revisions/'+receipt.revision+'.json',raw=await bucket.get(manifestKey),bytes=new Uint8Array(await raw.arrayBuffer()),manifest=JSON.parse(new TextDecoder().decode(bytes));let base=manifest;
   if(isMetadataOverlay(manifest.restorePack))base=await(await bucket.get(manifest.restorePack.base.manifestKey)).json();
   graph=await readSnapshotGraph(bucket,{revision:manifest.revision,manifestKey,persistedAt:manifest.persistedAt,manifestSha256:hash(bytes),packKey:base.restorePack.objectKey,packSha256:base.restorePack.sha256,packBytes:base.restorePack.size});state={version:receipt.version,pointer:{revision:manifest.revision,manifestKey,persistedAt:manifest.persistedAt}};
  }else({graph,state}=await snapshot());
  const item={label,at:new Date().toISOString(),state,receipt,files:graph.contents.markdown.length+graph.contents.uploads.length+graph.contents.wpContent.length,objects:graph.objects.length};
  // Canonical files only, never browser cookies. Retain full local proof privately.
  await writeFile(join(directory,label+'-private.json'),JSON.stringify({state,anchor:graph.anchor,contents:Object.fromEntries(['markdown','uploads','wpContent'].map(k=>[k,graph.contents[k].map(f=>({path:f.path,bytes:Buffer.from(f.bytes).toString('base64')}))])),wpContentDeleted:graph.contents.wpContentDeleted},null,2));
  result.observations.push(item);await writeFile(join(directory,'observations-private.json'),JSON.stringify(result,null,2));return item;
 }
 console.log(JSON.stringify({result:'ready',origin,id:193,expiresAt:ownerState.expiresAt}));
 const deadline=Date.now()+1200000;
 while(!stopping&&Date.now()<deadline){
  let cmd;try{cmd=await load(commandPath);}catch(e){if(e.code!=='ENOENT')throw e;}
  if(cmd){
   assert.ok(typeof cmd.id==='string'&&['status','before','saved','restart','finish'].includes(cmd.action));
   let value;
   try{
    if(cmd.action==='status'){const saved=await bucket.get('__local-test/native-save-receipt'),retry=await bucket.get('__local-test/native-save-receipt-retry');value={result:'status',saved:saved?await saved.json():null,retry:retry?await retry.json():null,restarts,expiresAt:ownerState.expiresAt,outboundAttempts};}
    else if(cmd.action==='before'){assert.equal(result.observations.some(x=>x.label==='before'),false);value=await captured('before');}
    else if(cmd.action==='saved'){assert.equal(result.observations.some(x=>x.label===cmd.action),false);const raw=await bucket.get('__local-test/native-save-receipt');assert.ok(raw,'Expected UI save receipt not observed');value=await captured(cmd.action,await raw.json());}
    else if(cmd.action==='restart'){assert.equal(restarts,0);assert.ok(result.observations.some(x=>x.label==='saved'));await mf.dispose();mf=undefined;await start();restarts++;value={result:'restarted',restarts};}
    else{value=await captured('final');result.history=await inspectBackgroundHistory(bucket,baseline.graph);await writeFile('artifacts/playtt-background-write-history.json',JSON.stringify(result.history,null,2)+'\n');const retry=await bucket.get('__local-test/native-save-receipt-retry');result.matchingRetry=retry?await retry.json():null;stopping=true;}
    await writeFile(replyPath,JSON.stringify({id:cmd.id,action:cmd.action,ok:true,value},null,2));
   }catch(e){await writeFile(replyPath,JSON.stringify({id:cmd.id,action:cmd.action,ok:false,error:{name:e.name,message:e.message}},null,2));}
   await unlink(commandPath);
  }
  if(!stopping)await new Promise(resolve=>setTimeout(resolve,250));
 }
 ownerState.phase=stopping?'finished':'expired';ownerState.outboundAttempts=outboundAttempts;ownerState.restarts=restarts;result.outboundAttempts=outboundAttempts;result.restarts=restarts;result.stopReason=ownerState.phase;
 await mf.dispose();mf=undefined;ownerState.localProcessesDisposed=true;result.localProcessesDisposed=true;
 await writeFile(ownerPath,JSON.stringify(ownerState,null,2)+'\n');await writeFile('artifacts/playtt-background-write-ui-server-private.json',JSON.stringify(result,null,2)+'\n');
 console.log(JSON.stringify({result:ownerState.phase,restarts,outboundAttempts,localProcessesDisposed:true}));
}finally{if(mf)await mf.dispose();}
