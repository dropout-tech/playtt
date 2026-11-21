// Local only: real PHP/WordPress plus SQLite coordinator and emulated R2.
// The direct runtime entry permits same-isolate flag changes without deployment.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdtemp,copyFile,readdir,access} from 'node:fs/promises';
import {resolve,join,extname} from 'node:path';
import {tmpdir} from 'node:os';
import {createHash} from 'node:crypto';
import {build} from 'esbuild';
import {Miniflare,Log,LogLevel,convertV4MiniflareOptions} from 'miniflare';
import {openSnapshotBundle} from './playtt-snapshot-bundle.mjs';
assert.ok([['--local'],['--local','--attempt=2'],['--local','--attempt=3'],['--local','--cold-enabled']].some(args=>JSON.stringify(process.argv.slice(2))===JSON.stringify(args)));
const load=async p=>JSON.parse(await readFile(p,'utf8')),sha=b=>createHash('sha256').update(b).digest('hex'),runtime=resolve(import.meta.dirname,'..');
const attempt=process.argv.includes('--attempt=3')?3:process.argv.includes('--attempt=2')?2:1;
const cold=process.argv.includes('--cold-enabled');
const prefix='artifacts/playtt-heartbeat-policy-local-'+(cold?'cold-':attempt>1?attempt+'-':''),ownerPath=prefix+'owned-private.json';
try{await access(ownerPath);throw Error('Existing attempt must not be replayed');}catch(e){if(e.code!=='ENOENT')throw e;}
const backup=await load('artifacts/playtt-markdown-provider-cold-backup-owned-private.json');assert.equal(backup.phase,'verified');assert.equal(backup.anchor.revision,'3021e7bd-a125-439d-9027-11005ea71316');
const baseline=await openSnapshotBundle(backup.directory+'/independent',backup.anchor),ui=await load('artifacts/playtt-markdown-provider-cold-ui-owned-private.json'),secrets=await load('../../../playtt-cms-secrets.json');
const directory=await mkdtemp(join(runtime,'artifacts/heartbeat-policy-local-')),stateDirectory=await mkdtemp(join(tmpdir(),'playtt-heartbeat-policy-'));
const owner={phase:'preparing',directory,stateDirectory,at:new Date().toISOString(),baseline:backup.anchor};await writeFile(ownerPath,JSON.stringify(owner,null,2),{flag:'wx'});
const scriptPath=join(directory,'harness.mjs');
const fixture=String.raw`<?php
$GLOBALS['heartbeat_filters'] = array(); $GLOBALS['test_admin'] = true;
function add_filter($name, $fn, $priority=10, $args=1) { if ('heartbeat_settings' === $name) $GLOBALS['heartbeat_filters'][] = $fn; }
function add_action($name, $fn, $priority=10, $args=1) {}
function is_admin() { return $GLOBALS['test_admin']; }
require '/wordpress/wp-content/mu-plugins/wp-codebox-cloudflare-canonical-changes.php';
$cases = array(array(true,'post.php',null),array(true,'post-new.php',null),array(false,'post.php',null),array(true,'edit.php',null),array(true,'profile.php',null),array(true,'index.php',null),array(true,'customize.php',null),array(true,'site-editor.php',null),array(true,'post.php',10),array(true,'post.php','30'),array(true,'post.php','90'),array(true,'post-new.php',120));
$out = array();
foreach ($cases as $case) { $GLOBALS['test_admin'] = $case[0]; $pagenow = $case[1]; $settings = array('nonce'=>'synthetic','suspension'=>'disable','interval'=>10,'extra'=>array('retained'=>true)); if (null !== $case[2]) $settings['minimalInterval']=$case[2]; foreach ($GLOBALS['heartbeat_filters'] as $filter) $settings=$filter($settings); $out[]=$settings; }
echo json_encode(array('registered'=>count($GLOBALS['heartbeat_filters']),'cases'=>$out));`;
await build({stdin:{resolveDir:runtime,sourcefile:'heartbeat-policy-local.ts',loader:'ts',contents:`
import {createCloudflareRuntime,createPhpRuntime,materializeCanonicalChangeAdapter,localHeartbeatCache} from './src/worker.ts';
import {DurableObjectRevisionCoordinator,WordPressStateCoordinator} from './src/state-coordinator.ts';
import {PHP} from '@php-wasm/universal';
export {WordPressStateCoordinator};
let mode=${JSON.stringify(cold?'enabled':'disabled')};
const runtime=createCloudflareRuntime((env,site)=>new DurableObjectRevisionCoordinator(env.WORDPRESS_STATE.getByName('local-heartbeat:'+site.id),site.id));
export default {async fetch(request,env){
 const u=new URL(request.url);if(u.hostname!=='127.0.0.1')return new Response('Local only',{status:403});
 if(u.pathname==='/__local-mode'&&request.method==='POST'){const value=(await request.json()).mode;if(!['disabled','enabled','unknown'].includes(value))return new Response('Invalid mode',{status:400});mode=value;return Response.json({mode});}
 if(u.pathname==='/__local-cache')return Response.json(await localHeartbeatCache());
 if(u.pathname==='/__local-php-fixture'){
  const results=[];for(const enabled of [false,true]){const php=new PHP(await createPhpRuntime());try{materializeCanonicalChangeAdapter(php,false,enabled);results.push({enabled,result:JSON.parse((await php.run({code:${JSON.stringify(fixture)}})).text.trim())});}finally{php.exit();}}
  return Response.json(results);
 }
 if(u.pathname==='/__local-adopt'&&request.method==='POST')return env.WORDPRESS_STATE.getByName('local-heartbeat:default').fetch(new Request('https://coordinator.invalid/?siteId=default&__wp_codebox_coordinator=adopt',{method:'POST',body:await request.text()}));
 return runtime.fetch(request,{...env,PLAYTT_EDITOR_HEARTBEAT:mode==='enabled'?'native-30s-v1':mode==='unknown'?'unrecognized':undefined});
}};`},bundle:true,format:'esm',platform:'browser',target:'es2022',outfile:scriptPath,logLevel:'silent',external:['node:*','worker_threads','events'],banner:{js:"import {createRequire} from 'node:module'; const require=createRequire('/harness.mjs');"},plugins:[{name:'local-runtime-observer',setup(b){b.onLoad({filter:/[\\/]src[\\/]worker\.ts$/},async args=>({contents:(await readFile(args.path,'utf8'))+`
export {createPhpRuntime,materializeCanonicalChangeAdapter};
const localIds=new WeakMap();let localSerial=0;
export async function localHeartbeatCache(){const cached=cachedRuntimes.get('default');if(!cached)return null;const r=await cached.promise;if(!localIds.has(r.php))localIds.set(r.php,++localSerial);return {id:localIds.get(r.php),editorHeartbeat:r.editorHeartbeat,readbackClean:!!cached.readbackClean};}
`,loader:'ts',resolveDir:resolve(args.path,'..')}));}},{name:'binary-modules',setup(b){b.onResolve({filter:/\.(wasm|sqlite|zip)$/},async args=>{const p=resolve(args.resolveDir,args.path),bytes=await readFile(p),name=sha(bytes)+extname(p);await copyFile(p,join(directory,name));return {path:'./'+name,external:true};});}}]});
let mf,outboundAttempts=0,report;const checks=[],cookies=new Map(),origin='http://127.0.0.1:9458';
const bindings={WORDPRESS_ADMIN_PASSWORD:secrets.WORDPRESS_ADMIN_PASSWORD,WORDPRESS_AUTH_SECRET:'local-heartbeat-policy-auth-only',WORDPRESS_ADMIN_CLAIM_SECRET:'local-heartbeat-policy-claim-only',WORDPRESS_OPERATOR_TOKEN:'local-heartbeat-policy-operator-only',WORDPRESS_SITE_CONTEXTS:JSON.stringify([{id:'default',hostname:'127.0.0.1',origin}]),PLAYTT_METADATA_OVERLAY:'v2',PLAYTT_CONTENT_OVERLAY:'content-v1'};
async function req(path,options={}){assert.ok(path.startsWith('/')&&!path.startsWith('//'));const headers=new Headers(options.headers);headers.set('cookie',[...cookies.values()].join('; '));const start=Date.now(),response=await fetch(origin+path,{...options,headers,redirect:'manual',signal:AbortSignal.timeout(90000)});for(const raw of response.headers.getSetCookie()){const c=raw.split(';')[0];cookies.set(c.split('=')[0],c);}checks.push({path:new URL(path,origin).pathname,method:options.method||'GET',status:response.status,wallMs:Date.now()-start});return response;}
async function json(path,body){const r=await req(path,{method:body?'POST':'GET',headers:{'content-type':'application/json'},body:body?JSON.stringify(body):undefined});assert.equal(r.status,200,path);return r.json();}
async function page(path){const r=await req(path),text=await r.text();if(r.status!==200){await writeFile(join(directory,'failed-response-private.html'),text);throw Error('Native page response was not 200');}const match=text.match(/var heartbeatSettings\s*=\s*(\{[^;]+\});/);assert.ok(match,'Native settings missing');return {html:text,settings:JSON.parse(match[1])};}
const mode=value=>json('/__local-mode',{mode:value}),cache=()=>json('/__local-cache');
try{
 const modules=[{type:'ESModule',path:scriptPath},...(await readdir(directory)).filter(n=>/\.(wasm|sqlite|zip)$/.test(n)).map(n=>({type:n.endsWith('.wasm')?'CompiledWasm':'Data',path:join(directory,n)}))];
 mf=new Miniflare(convertV4MiniflareOptions({name:'playtt-heartbeat-policy-local-only',modules,modulesRoot:directory,host:'127.0.0.1',port:9458,compatibilityDate:'2026-07-18',compatibilityFlags:['nodejs_compat','enable_request_signal'],cf:false,log:new Log(LogLevel.ERROR),durableObjects:{WORDPRESS_STATE:{className:'WordPressStateCoordinator',useSQLite:true}},resourcePersistencePath:join(stateDirectory,'r'),isolatedResourcePersistencePath:join(stateDirectory,'i'),r2Buckets:['WORDPRESS_STATE_BUCKET'],telemetry:{enabled:false},bindings,outboundService:()=>{outboundAttempts++;throw Error('External network forbidden');}}));await mf.ready;assert.equal(String(await mf.ready).replace(/\/$/,''),origin);
 const bucket=await mf.getR2Bucket('WORDPRESS_STATE_BUCKET');
 const fixtures=cold?[]:await json('/__local-php-fixture');
 for(const test of fixtures){assert.equal(test.result.registered,test.enabled?1:0);const expected=test.enabled?[30,30,undefined,undefined,undefined,undefined,undefined,undefined,30,30,90,120]:[undefined,undefined,undefined,undefined,undefined,undefined,undefined,undefined,10,'30','90',120];test.result.cases.forEach((c,i)=>{assert.equal(c.minimalInterval,expected[i]);assert.equal(c.nonce,'synthetic');assert.equal(c.suspension,'disable');assert.equal(c.interval,10);assert.deepEqual(c.extra,{retained:true});});}
 for(const o of baseline.graph.objects)await bucket.put(o.key,o.bytes);
 for(const [manifestName,file]of [['wordpress-runtime-artifact','cloudflare-wordpress-runtime-corpus.zip'],['wordpress-static-artifact','cloudflare-wordpress-static-corpus.bin'],['sqlite-database-integration-artifact','cloudflare-sqlite-database-integration.zip']]){const m=await load('assets/'+manifestName+'.json'),bytes=await readFile('artifacts/'+file),expected=m.archive||m.blob;assert.equal(bytes.length,expected.size);assert.equal(sha(bytes),expected.sha256);await bucket.put(m.key,bytes);}
 const pointer=Object.fromEntries(['revision','manifestKey','persistedAt'].map(k=>[k,backup.anchor[k]]));await bucket.put('sites/default/markdown/current.json',JSON.stringify(pointer));await json('/__local-adopt',{pointer,version:161});owner.phase='running';await writeFile(ownerPath,JSON.stringify(owner,null,2));
 const loginPage=await req('/wp-login.php');assert.equal(loginPage.status,200);await loginPage.arrayBuffer();const login=await req('/wp-login.php',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({log:ui.user.username,pwd:ui.user.password,testcookie:'1',redirect_to:origin+'/wp-admin/'})});assert.equal(login.status,302);await login.arrayBuffer();
 if(cold){
  const editor=await page('/wp-admin/post.php?post=193&action=edit');assert.equal(editor.settings.minimalInterval,'30');assert.equal(editor.settings.suspension,'disable');const state=await cache();assert.equal(state.editorHeartbeat,true);assert.equal(state.id,1);
  const profile=await page('/wp-admin/profile.php');assert.equal(profile.settings.minimalInterval,undefined);const nonce=profile.html.match(/wp\.apiFetch\.createNonceMiddleware\(\s*"([a-f0-9]+)"\s*\)/)?.[1];assert.ok(nonce);const content=await req('/wp-json/wp/v2/pages/193?context=edit',{headers:{'x-wp-nonce':nonce}});assert.equal(content.status,200);assert.ok((await content.json()).content.raw===ui.expectedContent,'Cold original content differs');
  const logout=editor.html.match(/href=(["'])([^"']*wp-login\.php\?action=logout[^"']*)\1/)?.[2]?.replace(/&(?:amp|#0*38);/g,'&');assert.ok(logout);const url=new URL(logout,origin);assert.equal(url.origin,origin);const response=await req(url.pathname+url.search);assert.equal(response.status,302);assert.ok(response.headers.get('location')?.includes('loggedout=true'));await response.arrayBuffer();
  report={schema:'playtt/local-editor-heartbeat-policy/v1',at:new Date().toISOString(),result:'pass',scenario:'cold-enabled',baselineVersion:161,coldFlagEnabled:true,firstRuntimePolicyEnabled:true,nativeEditorFloor30:true,nativeSuspensionUnchanged:true,unrelatedProfileUnchanged:true,originalContentExact:true,nativeLogoutRedirect:true,checks,outboundAttempts,remoteRequests:0,localProcessesDisposed:false,scope:'Fresh direct local runtime, real PHP/WordPress with flag enabled before its first request; no browser or provider acceptance.'};
 }else{
 const disabled=await page('/wp-admin/post.php?post=193&action=edit');assert.equal(disabled.settings.minimalInterval,undefined);const first=await cache();assert.equal(first.editorHeartbeat,false);
 await mode('enabled');const enabled=await page('/wp-admin/post.php?post=193&action=edit');assert.equal(enabled.settings.minimalInterval,'30');const second=await cache();assert.equal(second.editorHeartbeat,true);assert.equal(second.id,first.id,'Flag change must preserve PHP inventory');
 const profile=await page('/wp-admin/profile.php');assert.equal(profile.settings.minimalInterval,undefined);const nonce=profile.html.match(/wp\.apiFetch\.createNonceMiddleware\(\s*"([a-f0-9]+)"\s*\)/)?.[1];assert.ok(nonce);
 const fresh=await page('/wp-admin/post-new.php?post_type=page');assert.equal(fresh.settings.minimalInterval,'30');await writeFile(join(directory,'new-editor-private.html'),fresh.html);const newId=Number(fresh.html.match(/wp\.editPost\.initializeEditor\(\s*'editor',\s*"page",\s*(\d+),/)?.[1]);assert.ok(Number.isSafeInteger(newId)&&newId>205,'Native auto-draft ID missing');const pending=await cache();assert.equal(pending.id,first.id);
 await mode('disabled');const preserved=await page('/wp-admin/post.php?post='+newId+'&action=edit');assert.equal(preserved.settings.minimalInterval,undefined);const disabledAgain=await cache();assert.equal(disabledAgain.editorHeartbeat,false);assert.equal(disabledAgain.id,pending.id,'Native auto-draft lost during policy change');
 await mode('unknown');const unknown=await page('/wp-admin/post.php?post=193&action=edit');assert.equal(unknown.settings.minimalInterval,undefined);
 await mode('enabled');const restored=await page('/wp-admin/post.php?post=193&action=edit');assert.equal(restored.settings.minimalInterval,'30');assert.equal((await cache()).id,first.id);
 for(const [id,content]of [[193,ui.expectedContent],[newId,'']]){const r=await req('/wp-json/wp/v2/pages/'+id+'?context=edit',{headers:{'x-wp-nonce':nonce}});assert.equal(r.status,200);const row=await r.json();assert.ok(row.content.raw===content,'Canonical draft content differs');}
 const logout=restored.html.match(/href=(["'])([^"']*wp-login\.php\?action=logout[^"']*)\1/)?.[2]?.replace(/&(?:amp|#0*38);/g,'&');assert.ok(logout,'Native logout link missing');const logoutUrl=new URL(logout,origin);assert.equal(logoutUrl.origin,origin);const logoutResponse=await req(logoutUrl.pathname+logoutUrl.search);assert.equal(logoutResponse.status,302);await logoutResponse.arrayBuffer();
 const state=await bucket.get('sites/default/markdown/current.json');assert.ok(state);report={schema:'playtt/local-editor-heartbeat-policy/v1',at:new Date().toISOString(),result:'pass',baselineVersion:161,phpFixtureCases:24,disabledDefault:true,unknownFlagDisabled:true,existingEditorEnabled:true,newEditorEnabled:true,unrelatedProfileUnchanged:true,samePhpInstanceAcrossFlagChanges:true,uncommittedNativeAutoDraftPreserved:true,ownedLocalAutoDraft:newId,existingDraftContentExact:true,nativeLogout:true,coreCallbacksNotReplaced:true,checks,outboundAttempts,remoteRequests:0,localProcessesDisposed:false,scope:'Direct local runtime entry with real PHP/WordPress/SQLite DO/R2; does not test outer provider gate/budget or browser throttling.'};
 }
}catch(error){report={schema:'playtt/local-editor-heartbeat-policy/v1',at:new Date().toISOString(),result:'fail',errorName:error.name,errorMessage:error.message,checks,outboundAttempts,remoteRequests:0};process.exitCode=1;}
finally{if(mf)await mf.dispose();owner.phase=report?.result==='pass'?'finished':'failed';owner.localProcessesDisposed=true;await writeFile(ownerPath,JSON.stringify(owner,null,2));if(report){report.localProcessesDisposed=true;await writeFile(prefix+'result.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({...report,checks:undefined}));}}
