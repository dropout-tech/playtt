// One bounded native HTTP/provider exercise. Fault is client-side only.
// No browser/UI claim, no Worker fault injection, no write retry or ledger reset.
import assert from 'node:assert/strict';
import {readFile,writeFile,access,open} from 'node:fs/promises';
import {createHash,randomUUID,webcrypto} from 'node:crypto';
import vm from 'node:vm';
import {PLAYTT_EDITOR_READBACK_SCRIPT} from '../src/playtt-editor-readback.ts';
import {openSnapshotBundle} from './playtt-snapshot-bundle.mjs';
import {nativeLogoutPath} from './playtt-native-profile.mjs';

const mode=process.argv[2];assert.ok(['check','exercise','status','contain'].includes(mode));
assert.ok(mode==='check'||process.argv.includes('--remote'));
const origin='https://playtt-wp-free-session-audit.muzhi-garden-platform.workers.dev';
const prefix='artifacts/playtt-content-provider-',load=async p=>JSON.parse(await readFile(p,'utf8'));
const save=(suffix,v)=>writeFile(prefix+suffix,JSON.stringify(v,null,2)+'\n');
const hash=b=>createHash('sha256').update(b).digest('hex');
const sourceHashes={};
for(const [p,expected]of Object.entries({'src/worker.ts':'39e17a22d150e4ddb27b602c675df9ac4c015829b3b979a898097d313990d6bd','src/playtt-content-overlay.ts':'367b2f462edf85f1ec0b8666538f90d896f3328a4e94ab8dc3f9475b28f188fc','src/playtt-maintenance-overlay.ts':'be0104515c3853cd4010d13f5059231859842b0c38f618732c8d6026f7f9f06e','src/playtt-editor-readback.ts':'8fce1fe4538991ae876c1f2d1576d1dd9cf8f09a8886b43c650dc59ed915c71e'})){
 sourceHashes[p]=hash((await readFile(p,'utf8')).replaceAll('\r\n','\n'));assert.equal(sourceHashes[p],expected);
}
const previous=await load('artifacts/playtt-readback-provider-owned-private.json'),backup=await load('artifacts/playtt-readback-provider-backup-owned-private.json'),credentialOwner=await load('artifacts/playtt-canvas-ui-owned-private.json');
assert.equal(credentialOwner.phase,'closed-sealed');assert.equal(credentialOwner.user.id,2);previous.user=credentialOwner.user;previous.expectedBefore={...previous.expectedBefore,content:previous.expectedContent};
assert.equal(previous.phase,'closed-sealed');assert.equal(previous.user.id,2);assert.equal(backup.phase,'verified');assert.equal(backup.anchor.revision,'6883819c-8ca2-4e26-b899-433c83aa4eea');
const baseline=await openSnapshotBundle(backup.directory+'/independent',backup.anchor);assert.equal(baseline.graph.contents.markdown.length+baseline.graph.contents.wpContent.length+baseline.graph.contents.uploads.length,298);
const staticManifest=await load('assets/wordpress-static-artifact.json'),packageHashes={};
async function source(name){const item=staticManifest.files.find(x=>x.path==='wordpress/wp-includes/js/dist/'+name+'.js');assert.ok(item);const f=await open('artifacts/cloudflare-wordpress-static-corpus.bin','r'),bytes=Buffer.alloc(item.size);try{assert.equal((await f.read(bytes,0,item.size,item.offset)).bytesRead,item.size);}finally{await f.close();}assert.equal(hash(bytes),item.sha256);packageHashes[name]=item.sha256;return bytes.toString('utf8');}
const apiSource=await source('api-fetch'),urlSource=await source('url');
const limits={durationSeconds:180,maxBytes:2*1024*1024,maxOperations:64,maxNativeRequests:14};
if(mode==='check'){console.log(JSON.stringify({result:'local-preflight-pass',sourceHashes,packageHashes,baseline:122,limits,deploysNothing:true,networkCalls:0}));process.exit(0);}
const secrets=await load('../../../playtt-cms-secrets.json');let owner,stage='preflight',nativeRequests=0;const checks=[],cookies=new Map();
async function request(path,options={},control=false){
 assert.ok(path.startsWith('/')&&!path.startsWith('//'));
 if(!control){nativeRequests++;assert.ok(nativeRequests<=limits.maxNativeRequests,'Native request bound reached');}
 const headers=new Headers(options.headers);headers.set('X-Playtt-Probe',secrets.WORDPRESS_OPERATOR_TOKEN);
 if(!control)headers.set('cookie',[...cookies.values()].join('; '));
 const signal=options.signal?AbortSignal.any([options.signal,AbortSignal.timeout(45000)]):AbortSignal.timeout(45000),start=Date.now();
 try{
  const response=await fetch(origin+path,{...options,headers,signal,redirect:'manual'});
  checks.push({stage,kind:control?'operator':'native',endpoint:path.split('?')[0],method:options.method||'GET',status:response.status,headersWallMs:Date.now()-start});
  if(!control){for(const raw of response.headers.getSetCookie()){const value=raw.split(';')[0];cookies.set(value.split('=')[0],value);}if(owner){owner.cookies=[...cookies.values()];await save('owned-private.json',owner);}}
  return response;
 }catch(e){checks.push({stage,kind:control?'operator':'native',endpoint:path.split('?')[0],method:options.method||'GET',errorName:e.name,wallMs:Date.now()-start});throw e;}
}
async function control(path,body){const r=await request(path,{method:body?'POST':'GET',headers:{authorization:'Bearer '+secrets.WORDPRESS_OPERATOR_TOKEN,'content-type':'application/json'},body:body?JSON.stringify(body):undefined},true);assert.equal(r.status,200,stage+': operator status '+r.status);return r.json();}
const op=(phase,body)=>control('/?phase=operator-'+phase,body),cap=body=>control('/__playtt-capacity',body);
async function snapshot(){const state=await op('fence-status');assert.equal(state.coherent,true);return{at:new Date().toISOString(),state:state.state,fenceActive:state.fence.active,budget:await cap(),pins:(await control('/__playtt-backup-pins')).generation,publisher:(await control('/__playtt-publishing')).state};}
async function checkpoint(next){stage=next;owner.phase=next;await save('owned-private.json',owner);}
async function fence(){const r=await op('fence-acquire',{ttlSeconds:600});owner.fenceToken=r.token;owner.fenceReleased=false;await save('owned-private.json',owner);}
async function release(){await op('fence-release',{token:owner.fenceToken});owner.fenceReleased=true;await save('owned-private.json',owner);}
async function contain(){
 await checkpoint('closing');await cap({action:'close-write-window',windowToken:owner.windowToken});owner.windowClosed=true;await save('owned-private.json',owner);
 assert.equal((await cap()).writeTracking.pending,0,'Unknown writes remain; inspect, never clear tickets');
 const state=await op('fence-status');if(state.fence.active)assert.equal(owner.fenceReleased,false,'Unowned fence');else await fence();
 const sealed=await cap({action:'acquire-write-drain',fenceToken:owner.fenceToken,drainToken:owner.drainToken});assert.equal(sealed.writeTracking.sealed,true);assert.equal(sealed.writeTracking.pending,0);owner.sealReleased=false;await save('owned-private.json',owner);await release();owner.phase='closed-sealed';await save('owned-private.json',owner);return snapshot();
}
if(mode==='status'){const s=await snapshot();await save('status.json',s);console.log(JSON.stringify(s));process.exit(0);}
if(mode==='contain'){owner=await load(prefix+'owned-private.json');assert.equal(owner.origin,origin);const s=await contain();await save('contained.json',s);console.log(JSON.stringify(s));process.exit(0);}
try{await access(prefix+'owned-private.json');throw Error('Existing owned attempt; inspect instead of replaying');}catch(e){if(e.code!=='ENOENT')throw e;}
const before=await snapshot();assert.equal(before.state.version,122);assert.equal(before.state.pointer.revision,backup.anchor.revision);assert.equal(before.fenceActive,false);assert.equal(before.budget.writeTracking.pending,0);assert.equal(before.budget.writeTracking.sealed,true);assert.equal(before.budget.writeTracking.window.closed,true);assert.equal(before.pins,9);assert.equal(before.publisher,'paused');assert.equal(before.budget.remainingBytes,7271788);assert.ok(before.budget.remainingBytes>limits.maxBytes);
const marker='playtt-provider-content-'+randomUUID(),content=previous.expectedBefore.content+'\n\n<!-- wp:paragraph -->\n<p>私人免費環境的差異保存驗證：繁體中文、完整內容與完整備份。 '+marker+'</p>\n<!-- /wp:paragraph -->';
owner={origin,id:193,userId:2,user:previous.user,phase:'preparing',marker,expectedBefore:previous.expectedBefore,expectedContent:content,baseline:backup.anchor,baselineDirectory:backup.directory+'/independent',windowToken:randomUUID(),previousWindowToken:previous.windowToken,drainToken:previous.drainToken,fenceReleased:true,sealReleased:false,windowClosed:false,sourceHashes,packageHashes};
await writeFile(prefix+'owned-private.json',JSON.stringify(owner,null,2)+'\n',{flag:'wx'});
const report={at:new Date().toISOString(),result:'pending',scope:'Content-overlay format with real provider native HTTP and pinned api-fetch middleware in Node VM; client-side body suppression, not a browser UI or server-disconnect test',sourceHashes,packageHashes,limits,before,checks,transportCalls:[],transportAttempts:[]};let nonce,logout,failed=false;
async function rest(path){const r=await request('/wp-json/wp/v2/'+path,{headers:{'x-wp-nonce':nonce}});assert.equal(r.status,200,stage+': REST '+r.status);return r.json();}
const record=p=>({id:p.id,slug:p.slug,status:p.status,title:p.title.raw,content:p.content.raw});
try{
 await checkpoint('arm');await fence();const armed=await cap({action:'arm-write-window',fenceToken:owner.fenceToken,drainToken:owner.drainToken,windowToken:owner.windowToken,previousWindowToken:owner.previousWindowToken,durationSeconds:limits.durationSeconds,maxBytes:limits.maxBytes,maxOperations:limits.maxOperations});owner.expiresAt=armed.writeTracking.window.expiresAt;await save('owned-private.json',owner);
 await cap({action:'release-write-drain',fenceToken:owner.fenceToken,drainToken:owner.drainToken});owner.sealReleased=true;await save('owned-private.json',owner);await release();
 await checkpoint('login-form');const form=await request('/wp-login.php');assert.equal(form.status,200);assert.ok((await form.text()).includes('id="loginform"'));
 await checkpoint('login');const login=await request('/wp-login.php',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({log:previous.user.username,pwd:previous.user.password,testcookie:'1','wp-submit':'Log In',redirect_to:origin+'/wp-admin/post.php?post=193&action=edit'})});assert.equal(login.status,302);await login.arrayBuffer();
 await checkpoint('native-editor-html');const editor=await request('/wp-admin/post.php?post=193&action=edit');assert.equal(editor.status,200);const html=await editor.text();await writeFile(prefix+'editor-private.html',html);assert.ok(html.includes('lang="zh-TW"'));assert.ok(html.includes(PLAYTT_EDITOR_READBACK_SCRIPT),'Readback middleware absent from native editor');report.nativeEditorPolicyExact=true;logout=nativeLogoutPath(html,origin);nonce=html.match(/wp\.apiFetch\.createNonceMiddleware\(\s*"([a-f0-9]+)"\s*\)/)?.[1];assert.match(nonce||'',/^[a-f0-9]{10}$/);owner.nonce=nonce;await save('owned-private.json',owner);
 await checkpoint('baseline-page');assert.deepEqual(record(await rest('pages/193?context=edit')),owner.expectedBefore);
 await checkpoint('client-loss-and-readback');
 const transport=async(url,options)=>{
  const u=new URL(url);assert.equal(u.origin,origin);assert.equal(u.pathname,'/wp-json/wp/v2/pages/193');assert.ok(report.transportAttempts.length<2,'Unexpected middleware replay');report.transportAttempts.push({method:options.method,at:new Date().toISOString()});const at=Date.now();
  const r=await request(u.pathname+u.search,options);const headers={version:Number(r.headers.get('x-wp-codebox-canonical-version')),revision:r.headers.get('x-wp-codebox-canonical-revision'),marker:r.headers.get('x-playtt-draft-readback')};
  if(options.method==='POST'){
   assert.equal(report.transportCalls.length,0);assert.equal(new Headers(options.headers).get('x-http-method-override'),'PUT');assert.equal(r.status,200);const saved=await r.json();assert.equal(saved.id,193);assert.equal(saved.status,'draft');assert.equal(saved.content.raw,content);assert.ok(headers.version>122&&headers.revision);
   report.committed={...headers,id:193,contentSha256:hash(content),status:r.status};owner.committed=report.committed;await save('owned-private.json',owner);
   report.transportCalls.push({method:'POST',status:r.status,wallMs:Date.now()-at,...headers,bodySuppressedLocally:true});await save('progress.json',report);
   return new Response('',{status:200,headers:{'content-type':'application/json'}});
  }
  assert.equal(options.method,'GET');assert.ok(u.searchParams.has('_playtt_readback'));assert.equal(options.body,undefined);
  const raw=await r.clone().json();report.transportCalls.push({method:'GET',status:r.status,wallMs:Date.now()-at,...headers,id:raw.id??null,code:raw.code??null,contentSha256:typeof raw.content?.raw==='string'?hash(raw.content.raw):null});await save('progress.json',report);return r;
 };
 const sandbox={Response,Headers,URL,URLSearchParams,AbortController,crypto:webcrypto,navigator:{onLine:true},setTimeout,clearTimeout,fetch:transport,window:{location:{origin,href:origin+'/wp-admin/post.php?post=193&action=edit'},wp:{i18n:{__:s=>s},privateApis:{__dangerousOptInToUnstableAPIsOnlyForCoreModules:()=>({lock:()=>{},unlock:()=>{}})}}}};
 const context=vm.createContext(sandbox);vm.runInContext(urlSource,context);vm.runInContext(apiSource,context);const api=sandbox.window.wp.apiFetch;api.use(api.createRootURLMiddleware(origin+'/wp-json/'));api.use(api.createNonceMiddleware(nonce));vm.runInContext('('+PLAYTT_EDITOR_READBACK_SCRIPT+')('+JSON.stringify({id:193,origin})+')',context);
 const started=Date.now();try{const result=await api({path:'/wp/v2/pages/193',method:'PUT',data:{id:193,content}});assert.equal(result.content.raw,content);assert.equal(result.id,193);report.reconciled=true;}catch(e){report.reconciled=false;report.reconciliationErrorCode=typeof e.code==='string'?e.code:'unknown';failed=true;}report.clientWorkflowMs=Date.now()-started;
 assert.deepEqual(report.transportAttempts.map(x=>x.method),['POST','GET']);assert.ok(owner.committed);
 await checkpoint('cold-same-session-read');const cold=await rest('pages/193?context=edit');assert.equal(cold.id,193);assert.equal(cold.content.raw,content);assert.equal(cold.status,'draft');report.coldReadContentExact=true;report.sameSession=true;
 await checkpoint('logout');const out=await request(logout);assert.equal(out.status,302);await out.arrayBuffer();report.nativeLogoutCompleted=true;
 report.result=failed?'reconciliation-failed-content-preserved':'pass';
}catch(e){failed=true;report.result='fail';report.failedStage=stage;report.errorName=e.name;}
finally{
 try{report.after=await contain();assert.equal(report.after.publisher,'paused');assert.equal(report.after.pins,9);report.chargedBytes=report.after.budget.chargedBytes-before.budget.chargedBytes;report.chargedPuts=report.after.budget.chargedPuts-before.budget.chargedPuts;assert.ok(report.chargedBytes<=limits.maxBytes);report.contained=true;}catch(e){report.contained=false;report.containmentErrorName=e.name;failed=true;}
 report.nativeRequests=nativeRequests;report.finishedAt=new Date().toISOString();await save('result.json',report);console.log(JSON.stringify(report));if(failed)process.exitCode=1;
}
