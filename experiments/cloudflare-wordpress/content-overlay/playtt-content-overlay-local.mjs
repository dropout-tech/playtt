// LOCAL ONLY. Real runtime/WordPress, SQLite DO and emulated R2. Never deploy.
// Uses an independently verified private backup. No remote requests are allowed.
import assert from 'node:assert/strict';
import {readFile, writeFile, mkdtemp, copyFile, readdir} from 'node:fs/promises';
import {resolve, join, extname} from 'node:path';
import {tmpdir} from 'node:os';
import {createHash, randomUUID} from 'node:crypto';
import {build} from 'esbuild';
import {parse as yaml} from 'yaml';
import {Miniflare, Log, LogLevel, convertV4MiniflareOptions} from 'miniflare';
import {openSnapshotBundle, readSnapshotGraph, exportSnapshotBundle, importSnapshotBundle, materializeFullSnapshotBundle} from './playtt-snapshot-bundle.mjs';
import {isMetadataOverlay} from '../src/playtt-maintenance-overlay.ts';
import {createCanonicalRestorePack} from '../src/canonical-restore-pack.ts';

assert.ok(process.argv.includes('--local') && !process.argv.includes('--remote'));
const hash=b=>createHash('sha256').update(b).digest('hex'), load=async p=>JSON.parse(await readFile(p,'utf8'));
const runtime=resolve(import.meta.dirname,'..'), owner=await load('artifacts/playtt-readback-provider-backup-owned-private.json');
assert.equal(owner.phase,'verified'); assert.equal(owner.anchor.revision,'6883819c-8ca2-4e26-b899-433c83aa4eea');
const baseline=await openSnapshotBundle(owner.directory+'/independent',owner.anchor);
const ui=await load('artifacts/playtt-canvas-ui-owned-private.json'); assert.equal(ui.id,193);
const latest=await load('artifacts/playtt-readback-provider-owned-private.json');assert.equal(latest.phase,'closed-sealed');ui.expectedBefore.content=latest.expectedContent;
const secrets=await load('../../../playtt-cms-secrets.json');
const directory=await mkdtemp(join(runtime,'artifacts/content-overlay-local-'));
const stateDirectory=await mkdtemp(join(tmpdir(),'playtt-loss-'));
await writeFile(join(directory,'location-private.json'),JSON.stringify({stateDirectory}));
const marker='playtt-content-overlay-local-'+randomUUID();
const content=ui.expectedBefore.content+'\n\n<!-- wp:paragraph -->\n<p>儲存回應中斷後，同一草稿重試仍須完整。 '+marker+'</p>\n<!-- /wp:paragraph -->';
const expectedHash=hash(content), scriptPath=join(directory,'harness.mjs');
await build({stdin:{resolveDir:runtime,sourcefile:'content-overlay-local-harness.ts',loader:'ts',contents:`
import worker, {PlayttWordPressExecution, WordPressStateCoordinator, PlayttStorageBudget} from './src/worker-playtt-do.ts';
export {PlayttWordPressExecution, WordPressStateCoordinator, PlayttStorageBudget};
const key='__local-test/content-overlay-receipt';
const sha=async text=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text))),b=>b.toString(16).padStart(2,'0')).join('');
export default {async fetch(request,env){
 const u=new URL(request.url);
 if(u.hostname!=='127.0.0.1')return new Response('Local only',{status:403});
 if(u.pathname==='/__local-adopt' && request.method==='POST') {
  const payload=await request.json();
  return env.WORDPRESS_STATE.getByName('playtt-restore-v1:default').fetch(new Request('https://coordinator.invalid/?siteId=default&__wp_codebox_coordinator=adopt',{method:'POST',body:JSON.stringify(payload)}));
 }
 const inject=request.method==='POST' && u.pathname==='/wp-json/wp/v2/pages/193' && request.headers.get('x-playtt-local-lose-response')==='once';
 const payload=inject?await request.clone().json():null;
 const response=await worker.fetch(request,env);
 if(!inject || !response.ok || await env.WORDPRESS_STATE_BUCKET.head(key))return response;
 const saved=await response.clone().json();
 if(saved.id!==193 || saved.status!=='draft' || await sha(payload.content)!==${JSON.stringify(expectedHash)} || saved.content.raw!==payload.content)throw Error('Local fault target mismatch');
 const revision=response.headers.get('x-wp-codebox-canonical-revision'),version=Number(response.headers.get('x-wp-codebox-canonical-version'));
 if(!revision || !Number.isSafeInteger(version) || version<=122)throw Error('Local fault requires committed canonical headers');
 await env.WORDPRESS_STATE_BUCKET.put(key,JSON.stringify({version,revision,id:saved.id,contentSha256:await sha(saved.content.raw),status:response.status,at:new Date().toISOString()}));
 // The successful body is deliberately unavailable only AFTER the durable save.
 return new Response(new ReadableStream({start(c){c.error(new Error('PLAYTT_LOCAL_POST_COMMIT_RESPONSE_LOSS'));}}),{status:200,headers:{'content-type':'application/json','cache-control':'no-store'}});
}};`},bundle:true,format:'esm',platform:'browser',target:'es2022',outfile:scriptPath,logLevel:'silent',external:['node:*','worker_threads','events'],banner:{js:"import { createRequire } from 'node:module'; const require=createRequire('/harness.mjs');"},
plugins:[{name:'workerd-binary-modules',setup(b){b.onResolve({filter:/\.(wasm|sqlite|zip)$/},async args=>{
 const path=resolve(args.resolveDir,args.path),bytes=await readFile(path),name=hash(bytes)+extname(path);await copyFile(path,join(directory,name));return {path:'./'+name,external:true};
});}}]});
let mf,bucket,outboundAttempts=0,nonce,origin,report; const checks=[],cookies=new Map();
const bindings={WORDPRESS_ADMIN_PASSWORD:secrets.WORDPRESS_ADMIN_PASSWORD,WORDPRESS_AUTH_SECRET:'local-content-overlay-auth-secret-only',WORDPRESS_ADMIN_CLAIM_SECRET:'local-content-overlay-claim-secret-only',WORDPRESS_OPERATOR_TOKEN:'local-content-overlay-operator-only',
 WORDPRESS_SITE_CONTEXTS:JSON.stringify([{id:'default',hostname:'127.0.0.1',origin:'http://127.0.0.1:9451'}]),PLAYTT_STATE_PARTITION:'restore-v1',PLAYTT_AUTO_PUBLISH:'true',PLAYTT_METADATA_OVERLAY:'v2',PLAYTT_CONTENT_OVERLAY:'content-v1',PLAYTT_CORE_EDITOR_LOCK:'gutenberg-79997-v1'};
const modules=[{type:'ESModule',path:scriptPath},...(await readdir(directory)).filter(n=>/\.(wasm|sqlite|zip)$/.test(n)).map(n=>({type:n.endsWith('.wasm')?'CompiledWasm':'Data',path:join(directory,n)}))];
const start=async()=>{mf=new Miniflare(convertV4MiniflareOptions({name:'playtt-content-overlay-local-only',modules,modulesRoot:directory,
 host:'127.0.0.1',port:9451,compatibilityDate:'2026-07-18',compatibilityFlags:['nodejs_compat','enable_request_signal'],cf:false,log:new Log(LogLevel.ERROR),
 durableObjects:{WORDPRESS_STATE:{className:'WordPressStateCoordinator',useSQLite:true},PLAYTT_EXECUTION:{className:'PlayttWordPressExecution',useSQLite:true},PLAYTT_STORAGE_BUDGET:{className:'PlayttStorageBudget',useSQLite:true}},
 resourcePersistencePath:join(stateDirectory,'r'),isolatedResourcePersistencePath:join(stateDirectory,'i'),r2Buckets:['WORDPRESS_STATE_BUCKET'],telemetry:{enabled:false},bindings,
 outboundService:()=>{outboundAttempts++;throw Error('External network forbidden in local harness');}}));await mf.ready;origin=String(await mf.ready).replace(/\/$/,'');assert.equal(origin,'http://127.0.0.1:9451');bucket=await mf.getR2Bucket('WORDPRESS_STATE_BUCKET');};
async function req(path,options={}){assert.ok(path.startsWith('/')&&!path.startsWith('//'));const headers=new Headers(options.headers);headers.set('cookie',[...cookies.values()].join('; '));const at=Date.now();
 try{const r=await fetch(origin+path,{...options,headers,redirect:'manual',signal:AbortSignal.timeout(90000)});for(const raw of r.headers.getSetCookie()){const c=raw.split(';')[0];cookies.set(c.split('=')[0],c);}checks.push({path,method:options.method||'GET',status:r.status,wallMs:Date.now()-at});return r;}
 catch(e){checks.push({path,method:options.method||'GET',transportError:e.name,wallMs:Date.now()-at});throw e;}}
async function json(path,body,headers={}){const r=await req(path,{method:body?'POST':'GET',headers:{'content-type':'application/json',...headers},body:body?JSON.stringify(body):undefined});assert.equal(r.status,200,path+': '+r.status);return r.json();}
const op=(phase,body)=>json('/?phase=operator-'+phase,body,{authorization:'Bearer '+bindings.WORDPRESS_OPERATOR_TOKEN});
const api=(path,body)=>json('/wp-json/wp/v2/'+path,body,{'x-wp-nonce':nonce});
async function snapshot(){const s=await op('fence-status');assert.equal(s.coherent,true);const raw=await bucket.get(s.state.pointer.manifestKey),bytes=new Uint8Array(await raw.arrayBuffer()),m=JSON.parse(new TextDecoder().decode(bytes));let base=m;
 if(isMetadataOverlay(m.restorePack))base=await(await bucket.get(m.restorePack.base.manifestKey)).json();
 return {state:s.state,graph:await readSnapshotGraph(bucket,{...s.state.pointer,manifestSha256:hash(bytes),packKey:base.restorePack.objectKey,packSha256:base.restorePack.sha256,packBytes:base.restorePack.size})};}
const record=p=>({id:p.id,slug:p.slug,status:p.status,title:p.title.raw,content:p.content.raw});
const table=(g,path)=>JSON.parse(new TextDecoder().decode(g.contents.markdown.find(f=>f.path===path).bytes));
try{
 await start();
 for(const o of baseline.graph.objects)await bucket.put(o.key,o.bytes);
 for(const [manifestName,file]of [['wordpress-runtime-artifact','cloudflare-wordpress-runtime-corpus.zip'],['wordpress-static-artifact','cloudflare-wordpress-static-corpus.bin'],['sqlite-database-integration-artifact','cloudflare-sqlite-database-integration.zip']]){
  const m=await load('assets/'+manifestName+'.json'),b=await readFile('artifacts/'+file),expected=m.archive||m.blob;assert.equal(b.length,expected.size);assert.equal(hash(b),expected.sha256);await bucket.put(m.key,b);
 }
 const pointer=Object.fromEntries(['revision','manifestKey','persistedAt'].map(k=>[k,owner.anchor[k]]));await bucket.put('sites/default/markdown/current.json',JSON.stringify(pointer));
 await json('/__local-adopt',{pointer,version:122});
 await json('/__playtt-publishing',{action:'pause'},{authorization:'Bearer '+bindings.WORDPRESS_OPERATOR_TOKEN});
 const loginPage=await req('/wp-login.php');if(loginPage.status!==200){await writeFile(join(directory,'runtime-error-private.txt'),await loginPage.text());throw Error('Login GET failed; inspect local private response');}await loginPage.arrayBuffer();
 const login=await req('/wp-login.php',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({log:'admin',pwd:secrets.WORDPRESS_ADMIN_PASSWORD,testcookie:'1',redirect_to:origin+'/wp-admin/'})});assert.equal(login.status,302);await login.arrayBuffer();
 const admin=await req('/wp-admin/profile.php');assert.equal(admin.status,200);const html=await admin.text();await writeFile(join(directory,'profile-private.html'),html);
 nonce=html.match(/wp\.apiFetch\.createNonceMiddleware\(\s*"([a-f0-9]+)"\s*\)/)?.[1];assert.ok(nonce,'Native REST nonce middleware not found');
 assert.deepEqual(record(await api('pages/193?context=edit')),ui.expectedBefore);
 const before=await snapshot();
 const packsBefore=(await bucket.list({prefix:'sites/default/restore-packs/'})).objects.map(x=>x.key).sort();
 assert.equal(before.graph.format,'content-overlay');
 const payload={id:193,content,status:'draft'};let loss,lossStatus,lossBodyBytes;
 try{const r=await req('/wp-json/wp/v2/pages/193?_locale=user',{method:'POST',headers:{'x-wp-nonce':nonce,'content-type':'application/json','x-playtt-local-lose-response':'once'},body:JSON.stringify(payload)});lossStatus=r.status;const text=await r.text();lossBodyBytes=Buffer.byteLength(text);JSON.parse(text);loss={observed:false};}
 catch(e){loss={observed:true,errorName:e.name,status:lossStatus,bodyBytes:lossBodyBytes};}assert.equal(loss.observed,true);
 const receipt=await(await bucket.get('__local-test/content-overlay-receipt')).json();assert.equal(receipt.id,193);assert.equal(receipt.contentSha256,expectedHash);
 const committed=await snapshot();assert.equal(committed.state.version,receipt.version);assert.equal(committed.state.pointer.revision,receipt.revision);
 // Replace the entire workerd instance before readback and retry.
 await mf.dispose();mf=undefined;await start();
 const cold=await api('pages/193?context=edit');assert.equal(cold.content.raw,content);assert.equal(cold.status,'draft');
 const retry=await api('pages/193',payload);assert.equal(retry.content.raw,content);assert.equal(retry.id,193);
 const after=await snapshot();const firstRows=table(committed.graph,'_tables/posts.json'),lastRows=table(after.graph,'_tables/posts.json');
 const firstIds=firstRows.filter(p=>p.post_parent==='193'&&p.post_type==='revision').map(p=>p.ID).sort(),lastIds=lastRows.filter(p=>p.post_parent==='193'&&p.post_type==='revision').map(p=>p.ID).sort();
 assert.deepEqual(lastIds,firstIds,'Same-content retry created an extra revision');assert.deepEqual(firstRows,lastRows,'Retry changed revision rows');
 const firstFiles=new Map(committed.graph.contents.markdown.map(f=>[f.path,f.bytes])),lastFiles=new Map(after.graph.contents.markdown.map(f=>[f.path,f.bytes]));
 const changed=[...lastFiles].filter(([p,b])=>!firstFiles.has(p)||hash(b)!==hash(firstFiles.get(p))).map(([p])=>p);
 const pagePath='page/'+ui.expectedBefore.slug+'.md';assert.ok(changed.every(p=>['_runtime/playtt-auto-increment.json',pagePath].includes(p)));
 assert.deepEqual([...firstFiles.keys()].sort(),[...lastFiles.keys()].sort());
 const page=bytes=>{const text=new TextDecoder().decode(bytes),end=text.indexOf('\n---\n',4);assert.ok(end>4);return {meta:yaml(text.slice(4,end)),body:text.slice(end+5)};};
 const firstPage=page(firstFiles.get(pagePath)),lastPage=page(lastFiles.get(pagePath));assert.equal(lastPage.body,firstPage.body);
 const retryDateChanges=Object.keys(lastPage.meta.wordpress).filter(k=>JSON.stringify(firstPage.meta.wordpress[k])!==JSON.stringify(lastPage.meta.wordpress[k]));
 // Core wp_update_post() refreshes floating draft dates when date_gmt is zero.
 // Verified in pinned wp-includes/post.php 5356-5372; content is still exact.
 assert.ok(retryDateChanges.every(k=>['date','modified','modified_gmt'].includes(k)));
 for(const k of retryDateChanges)lastPage.meta.wordpress[k]=firstPage.meta.wordpress[k];assert.deepEqual(lastPage.meta,firstPage.meta);
 const beforeFiles=new Map(before.graph.contents.markdown.map(f=>[f.path,f.bytes])),firstChanged=[...firstFiles].filter(([p,b])=>!beforeFiles.has(p)||hash(b)!==hash(beforeFiles.get(p))).map(([p])=>p);
 assert.deepEqual(firstChanged.sort(),['_runtime/playtt-auto-increment.json','_tables/posts.json',pagePath].sort());
 assert.deepEqual([...beforeFiles.keys()].sort(),[...firstFiles.keys()].sort());
 const oldRows=table(before.graph,'_tables/posts.json'),addedRows=firstRows.filter(p=>!oldRows.some(o=>o.ID===p.ID));assert.equal(addedRows.length,1);
 assert.equal(addedRows[0].post_parent,'193');assert.equal(addedRows[0].post_type,'revision');assert.equal(addedRows[0].post_content,content);
 assert.deepEqual(firstRows.filter(p=>p.ID!==addedRows[0].ID),oldRows);
 for(const group of ['uploads','wpContent','wpContentDeleted'])assert.deepEqual(after.graph.contents[group],baseline.graph.contents[group]);
 const all=await api('pages?context=edit&status=draft&per_page=100');assert.equal(all.filter(p=>p.slug===ui.expectedBefore.slug).length,1);
 assert.equal((await json('/__playtt-publishing',undefined,{authorization:'Bearer '+bindings.WORDPRESS_OPERATOR_TOKEN})).state,'paused');
 assert.equal(outboundAttempts,0);
 for(const s of [before,committed,after]){assert.equal(s.graph.format,'content-overlay');assert.equal(s.graph.base.revision,baseline.graph.base.revision);}
 assert.deepEqual((await bucket.list({prefix:'sites/default/restore-packs/'})).objects.map(x=>x.key).sort(),packsBefore);
 const deltaBytes=committed.graph.manifest.files.filter(f=>!before.graph.manifest.files.some(p=>p.path===f.path&&p.sha256===f.sha256)).reduce((n,f)=>n+f.size,0);
 const manifestBytes=(await bucket.head(committed.state.pointer.manifestKey)).size;
 const firstFull=await createCanonicalRestorePack('sites/default',committed.graph.contents);
 const firstFullManifestBytes=Buffer.byteLength(JSON.stringify({...committed.graph.manifest,restorePack:firstFull.metadata}));
 await exportSnapshotBundle(bucket,after.graph.anchor,join(directory,'export'));
 const independent=await importSnapshotBundle(join(directory,'export'),after.graph.anchor,join(directory,'independent'));
 assert.deepEqual(independent.graph.contents,after.graph.contents);
 const full=await materializeFullSnapshotBundle(join(directory,'independent'),after.graph.anchor,join(directory,'materialized'));
 assert.deepEqual(Object.fromEntries(['markdown','uploads','wpContent'].map(g=>[g,[...full.graph.contents[g]].sort((a,b)=>a.path.localeCompare(b.path))])),Object.fromEntries(['markdown','uploads','wpContent'].map(g=>[g,[...after.graph.contents[g]].sort((a,b)=>a.path.localeCompare(b.path))])));
 assert.deepEqual(full.graph.contents.wpContentDeleted,after.graph.contents.wpContentDeleted);

 // Disable only the local writer, retaining its compatible reader. The next
 // native save must materialize a complete archive before an old-source rollback.
 delete bindings.PLAYTT_CONTENT_OVERLAY;
 await mf.dispose();mf=undefined;await start();
 const fallbackSaved=await api('pages/193',payload);assert.equal(fallbackSaved.content.raw,content);
 const fallback=await snapshot();assert.equal(fallback.graph.format,'full-pack');
 const fallbackFiles=new Map(fallback.graph.contents.markdown.map(f=>[f.path,f.bytes]));
 assert.deepEqual([...fallbackFiles.keys()].sort(),[...lastFiles.keys()].sort());
 for(const [path,bytes]of lastFiles)if(!['_runtime/playtt-auto-increment.json',pagePath].includes(path))assert.equal(hash(fallbackFiles.get(path)),hash(bytes));
 for(const group of ['uploads','wpContent','wpContentDeleted'])assert.deepEqual(fallback.graph.contents[group],after.graph.contents[group]);
 await mf.dispose();mf=undefined;await start();assert.equal((await api('pages/193?context=edit')).content.raw,content);
 assert.equal(outboundAttempts,0);
 report={at:new Date().toISOString(),result:'pass',scope:'Native WordPress HTTP save, post-commit response stream failure, complete local workerd restart, cold readback and same-content retry; not a browser or remote-provider acceptance',baselineRevision:owner.anchor.revision,ownedDraft:193,
  beforeVersion:before.state.version,committedVersion:committed.state.version,retryVersion:after.state.version,responseLoss:loss,receipt,revisionIdsAfterCommit:firstIds,revisionIdsAfterRetry:lastIds,changedFilesOnFirstSave:firstChanged,changedFilesOnRetry:changed,retryDateChanges,
  persistence:{format:after.graph.format,newFullPacks:0,basePackBytes:after.graph.base.restorePack.size,changedObjectBytes:deltaBytes,manifestBytes,comparedApplicationBytes:{overlay:deltaBytes+manifestBytes,fullPack:deltaBytes+firstFullManifestBytes+firstFull.metadata.size},fullManifestBytes:firstFullManifestBytes,fullArchiveBytes:firstFull.metadata.size,excludesPointerCoordinatorAndDedup:true,independentCopyExact:true,materializedFullExact:true,disabledWriterFullFallback:true,disabledWriterVersion:fallback.state.version,coldFullReadExact:true},otherCanonicalFilesExact:true,oneExpectedRevisionOnFirstSave:true,
  exactChineseContentAfterColdRestart:true,noExtraPage:true,noExtraRevisionOnRetry:true,mediaAndThemeExact:true,publisherPaused:true,outboundAttempts,capacityWindowTested:false,cloudflareFreeTierTested:false,browserUiTested:false,checks,localProcessesDisposed:false};
 await writeFile(join(directory,'report.json'),JSON.stringify(report,null,2)+'\n');
}catch(e){await writeFile(join(directory,'failure-private.json'),JSON.stringify({at:new Date().toISOString(),name:e.name,message:e.message,checks},null,2));throw e;}
finally{if(mf)await mf.dispose();}
report.localProcessesDisposed=true;await writeFile('artifacts/playtt-content-overlay-local.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
