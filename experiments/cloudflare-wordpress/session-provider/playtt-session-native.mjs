// One native HTTP session/preferences/cold-recovery exercise; no browser UI claim.
import assert from 'node:assert/strict';
import {readFile,writeFile,access,mkdir} from 'node:fs/promises';
import {randomUUID,createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {openSnapshotBundle,exportSnapshotBundle,importSnapshotBundle} from './playtt-snapshot-bundle.mjs';
import {createCloudflareSnapshotSource} from './playtt-snapshot-download.mjs';
import {registerBackupPin} from './playtt-backup-pin-client.mjs';
import {backupPinInput} from '../src/playtt-backup-pins.ts';
import {nativeLogoutPath} from './playtt-native-profile.mjs';
import {isMetadataOverlay} from '../src/playtt-maintenance-overlay.ts';
assert.ok(process.argv.includes('--remote'));
const origin='https://playtt-wp-free-session-audit.muzhi-garden-platform.workers.dev',prefix='artifacts/playtt-session-native-verified-';
const load=async p=>JSON.parse(await readFile(p,'utf8')),save=(p,v)=>writeFile(p,JSON.stringify(v,null,2)+'\n'),sha=b=>createHash('sha256').update(b).digest('hex');
try{await access(prefix+'owned-private.json');throw Error('Existing native attempt: inspect rather than replay');}catch(e){if(e.code!=='ENOENT')throw e;}
const secrets=await load('../../../playtt-cms-secrets.json'),oldOwner=await load('artifacts/playtt-window-lock-owned-private.json'),previous=await load('artifacts/playtt-session-native-retry-owned-private.json'),first=await load('artifacts/playtt-session-native-retry-result.json');
assert.equal(previous.phase,'failed-sealed');assert.equal(first.failedStage,'profile');assert.equal(first.finalState.version,3);assert.equal(oldOwner.user.id,2);assert.equal(oldOwner.phase,'closed-sealed');
const location=await load('artifacts/playtt-window-lock-backup-owned-private.json'),baseline=await openSnapshotBundle(location.directory+'/independent',location.anchor);
const token=(await readFile('../../../playtt-wrangler-config/.wrangler/config/default.toml','utf8')).match(/^oauth_token\s*=\s*"([^"\r\n]+)"/m)?.[1];assert.ok(token);
const checks=[],cookies=new Map();let stage='preflight',nonce,failed=false;
async function request(path,options={}){
 assert.ok(path.startsWith('/')&&!path.startsWith('//'));const headers=new Headers(options.headers);headers.set('X-Playtt-Probe',secrets.WORDPRESS_OPERATOR_TOKEN);if(!headers.has('cookie'))headers.set('cookie',[...cookies.values()].join('; '));
 const at=Date.now(),r=await fetch(origin+path,{...options,headers,redirect:'manual',signal:AbortSignal.timeout(45000)});checks.push({stage,startedAt:new Date(at).toISOString(),method:options.method||'GET',status:r.status,wallMs:Date.now()-at});
 for(const raw of r.headers.getSetCookie()){const value=raw.split(';')[0];cookies.set(value.split('=')[0],value);}if(stage!=='preflight'){owner.cookies=[...cookies.values()];await save(prefix+'owned-private.json',owner);}return r;
}
async function control(path,body){const r=await request(path,{method:body?'POST':'GET',headers:{authorization:'Bearer '+secrets.WORDPRESS_OPERATOR_TOKEN,'content-type':'application/json'},body:body?JSON.stringify(body):undefined});assert.equal(r.status,200,stage+': control HTTP '+r.status);return r.json();}
const cap=body=>control('/__playtt-capacity',body),op=(phase,body)=>control('/?phase=operator-'+phase,body);
async function state(){const s=await op('fence-status');assert.equal(s.coherent,true);return s;}
async function rest(path,body){const r=await request('/wp-json/wp/v2/'+path,{method:body?'POST':'GET',headers:{'content-type':'application/json','x-wp-nonce':nonce},body:body?JSON.stringify(body):undefined});assert.equal(r.status,200,stage+': REST HTTP '+r.status);return r.json();}
const before=await state(),budget=await cap();assert.deepEqual(before.state,first.finalState);assert.equal(before.fence.active,false);assert.equal(budget.writeTracking.pending,0);assert.equal(budget.writeTracking.sealed,true);assert.equal(budget.writeTracking.window.closed,true);assert.ok(budget.remainingBytes>8*1024*1024);assert.equal((await control('/__playtt-backup-pins')).generation,1);assert.equal((await control('/__playtt-publishing')).state,'paused');
const owner={origin,ownedUserId:2,ownedDraftId:193,phase:'preparing',windowToken:randomUUID(),previousWindowToken:previous.windowToken,drainToken:previous.drainToken,sealReleased:false,fenceReleased:true,directory:resolve('../../../../outputs/backups/cloudflare-wordpress-session-native/'+new Date().toISOString().replace(/[:.]/g,'-')),snapshots:[]};
await writeFile(prefix+'owned-private.json',JSON.stringify(owner,null,2)+'\n',{flag:'wx'});await mkdir(owner.directory,{recursive:true});
const report={at:new Date().toISOString(),result:'pending',scope:'Native WordPress HTTP using retained editor2, exact preferences, fenced same-snapshot forward adoption, cold-session readback and logout revocation. Not browser UI or competing-editor acceptance.',checks,steps:[],snapshots:[]};
async function checkpoint(phase){stage=phase;owner.phase=phase;await save(prefix+'owned-private.json',owner);}
async function fence(){const f=await op('fence-acquire',{ttlSeconds:600});owner.fenceToken=f.token;owner.fenceReleased=false;await save(prefix+'owned-private.json',owner);}
async function release(){await op('fence-release',{token:owner.fenceToken});owner.fenceReleased=true;await save(prefix+'owned-private.json',owner);}
async function observe(label,fn){await checkpoint(label);const a=(await state()).state,b=await cap();const result=await fn();const next=(await state()).state,c=await cap();report.steps.push({label,versionBefore:a.version,versionAfter:next.version,pointer:next.pointer,chargedBytes:c.chargedBytes-b.chargedBytes,operations:c.chargedPuts-b.chargedPuts});return result;}
async function snapshot(label){
 assert.equal(owner.fenceReleased,false);const s=(await state()).state,beforeBudget=await cap(),pins=await control('/__playtt-backup-pins');
 const source=createCloudflareSnapshotSource({bucketName:'playtt-wordpress-session-audit',token}),cache=new Map(),bucket={get(key){if(!cache.has(key))cache.set(key,source.bucket.get(key));return cache.get(key);}},raw=await bucket.get(s.pointer.manifestKey);assert.ok(raw);const bytes=new Uint8Array(await raw.arrayBuffer()),m=JSON.parse(new TextDecoder().decode(bytes));
 assert.ok(isMetadataOverlay(m.restorePack));assert.equal(m.restorePack.schema,'playtt/canonical-metadata-overlay/v2');let base=m;const rawBase=await bucket.get(m.restorePack.base.manifestKey);assert.ok(rawBase);base=JSON.parse(new TextDecoder().decode(await rawBase.arrayBuffer()));
 const anchor=backupPinInput({...s.pointer,manifestSha256:sha(bytes),packKey:base.restorePack.objectKey,packSha256:base.restorePack.sha256,packBytes:base.restorePack.size});
 await exportSnapshotBundle(bucket,anchor,owner.directory+'/'+label+'-export');const copied=await importSnapshotBundle(owner.directory+'/'+label+'-export',anchor,owner.directory+'/'+label+'-independent');
 const a=baseline.graph.contents,z=copied.graph.contents;for(const key of ['uploads','wpContent','wpContentDeleted'])assert.deepEqual(z[key],a[key]);assert.deepEqual(z.markdown.map(f=>f.path).sort(),a.markdown.map(f=>f.path).sort());
 const changed=z.markdown.filter(f=>sha(f.bytes)!==sha(a.markdown.find(x=>x.path===f.path).bytes)).map(f=>f.path);assert.ok(changed.every(p=>['_tables/usermeta.json','_runtime/playtt-auto-increment.json'].includes(p)), 'Unexpected content/account change');
 const read=(data,path)=>JSON.parse(new TextDecoder().decode(data.markdown.find(f=>f.path===path).bytes));const oldMeta=read(a,'_tables/usermeta.json'),nextMeta=read(z,'_tables/usermeta.json');
 for(const row of oldMeta){const found=nextMeta.find(x=>x.umeta_id===row.umeta_id);if(row.user_id==='2'&&['session_tokens','wp_persisted_preferences'].includes(row.meta_key)){if(found)assert.deepEqual({...found,meta_value:row.meta_value},row);}else assert.deepEqual(found,row);}
 for(const row of nextMeta.filter(x=>!oldMeta.some(old=>old.umeta_id===x.umeta_id)))assert.ok(row.user_id==='2'&&['session_tokens','wp_persisted_preferences'].includes(row.meta_key));
 const receipt=await registerBackupPin((p,options)=>fetch(origin+p,{...options,headers:{authorization:'Bearer '+secrets.WORDPRESS_OPERATOR_TOKEN,'X-Playtt-Probe':secrets.WORDPRESS_OPERATOR_TOKEN,...options.headers},redirect:'error',signal:AbortSignal.timeout(45000)}),secrets.WORDPRESS_OPERATOR_TOKEN,owner.fenceToken,anchor);
 assert.equal(receipt.generation,pins.generation+1);await save(owner.directory+'/'+label+'-export/retention-pin.json',receipt);assert.deepEqual((await state()).state,s);assert.deepEqual(await cap(),beforeBudget);
 const item={label,version:s.version,anchor,format:m.restorePack.schema,changedFiles:changed,unchangedFiles:z.markdown.length+z.uploads.length+z.wpContent.length-changed.length,files:z.markdown.length+z.uploads.length+z.wpContent.length,objects:copied.graph.objects.length,originalDraftAndAccountsExact:true,otherUsersUnchanged:true,mediaAndThemeExact:true,independentCopyVerified:true,remoteGets:source.stats.requests,downloadedBytes:source.stats.downloadedBytes,pins:receipt.generation};
 owner.snapshots.push(item);report.snapshots.push(item);await save(prefix+'owned-private.json',owner);return item;
}
try{
 await checkpoint('arm');await fence();const armed=await cap({action:'arm-write-window',fenceToken:owner.fenceToken,drainToken:owner.drainToken,windowToken:owner.windowToken,previousWindowToken:owner.previousWindowToken,durationSeconds:300,maxBytes:8*1024*1024,maxOperations:128});owner.expiresAt=armed.writeTracking.window.expiresAt;await save(prefix+'owned-private.json',owner);await cap({action:'release-write-drain',fenceToken:owner.fenceToken,drainToken:owner.drainToken});owner.sealReleased=true;await save(prefix+'owned-private.json',owner);await release();
 await observe('cold-login-form',async()=>{const r=await request('/wp-login.php');assert.equal(r.status,200);assert.ok((await r.text()).includes('id="loginform"'));});
 await observe('editor2-login',async()=>{const r=await request('/wp-login.php',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({log:oldOwner.user.username,pwd:oldOwner.user.password,testcookie:'1','wp-submit':'Log In',redirect_to:origin+'/wp-admin/profile.php'})});assert.equal(r.status,302);assert.equal(new URL(r.headers.get('location'),origin).origin,origin);await r.body?.cancel();});
 let logout;
 await observe('profile',async()=>{const r=await request('/wp-admin/profile.php');assert.equal(r.status,200);const html=await r.text();report.profile={traditionalChinese:html.includes('lang="zh-TW"'),hasInlineRestNonce:/var wpApiSettings\s*=/.test(html),hasAnyInlineNonce:/"nonce":"([^"]+)"/.test(html),hasNativeLogout:/action=logout/.test(html)};assert.ok(report.profile.traditionalChinese);await writeFile(prefix+'profile-private.html',html);logout=nativeLogoutPath(html,origin);});
 await observe('native-rest-nonce',async()=>{const r=await request('/wp-admin/admin-ajax.php?action=rest-nonce');assert.equal(r.status,200);nonce=(await r.text()).trim();assert.match(nonce,/^[a-f0-9]{10}$/);});
 const me=await rest('users/me?context=edit');assert.equal(me.id,2);assert.deepEqual(me.roles,['editor']);assert.ok(me.meta?.persisted_preferences&&typeof me.meta.persisted_preferences==='object');owner.originalPreferences=me.meta.persisted_preferences;
 const prefs=structuredClone(owner.originalPreferences);prefs['_modified']=new Date().toISOString();prefs['core/edit-post']={...(prefs['core/edit-post']||{}),fixedToolbar:!prefs['core/edit-post']?.fixedToolbar};owner.expectedPreferences=prefs;await save(prefix+'owned-private.json',owner);
 await observe('save-preferences',async()=>assert.deepEqual((await rest('users/2',{meta:{persisted_preferences:prefs}})).meta.persisted_preferences,prefs));
 await observe('read-preferences',async()=>assert.deepEqual((await rest('users/me?context=edit')).meta.persisted_preferences,prefs));
 await checkpoint('pin-v2-before-cold');await fence();const saved=await snapshot('preferences');
 await checkpoint('forward-adopt-v2');const current=(await state()).state,adopted=await op('adopt',{pointer:current.pointer,version:current.version+1,fenceToken:owner.fenceToken});assert.equal(adopted.adopted,true);assert.equal(adopted.version,current.version+1);assert.deepEqual(adopted.pointer,current.pointer);report.forwardAdoption={fromVersion:current.version,toVersion:adopted.version,pointer:current.pointer};await release();
 await observe('cold-session-preferences',async()=>{const fresh=await rest('users/me?context=edit');assert.equal(fresh.id,2);assert.deepEqual(fresh.roles,['editor']);assert.deepEqual(fresh.meta.persisted_preferences,prefs);});
 report.coldSessionValidated=true;report.coldPhaseRequiresSeparateTail=true;
 const draft=await rest('pages/193?context=edit');assert.equal(draft.content.raw,oldOwner.expectedBefore.content);assert.equal(draft.status,'draft');report.originalDraftExact=true;
 await observe('restore-preferences',async()=>assert.deepEqual((await rest('users/2',{meta:{persisted_preferences:owner.originalPreferences}})).meta.persisted_preferences,owner.originalPreferences));
 const oldCookie=[...cookies.values()].join('; ');
 await observe('native-logout',async()=>{const r=await request(logout);assert.equal(r.status,302);await r.body?.cancel();});
 await observe('old-cookie-rejected',async()=>{const r=await request('/wp-json/wp/v2/users/me?context=edit',{headers:{cookie:oldCookie,'x-wp-nonce':nonce}});assert.ok([401,403].includes(r.status));const body=await r.json();assert.ok(['rest_cookie_invalid_nonce','rest_not_logged_in'].includes(body.code));report.revokedCookieStatus=r.status;report.revokedCookieCode=body.code;});
 report.result='pass';report.preferencesRestored=true;report.nativeLogoutRevokedSavedCookie=true;
}catch(e){failed=true;report.result='fail';report.failedStage=stage;report.errorName=e.name;if(e.message?.startsWith('native-profile:'))report.profileError=e.message;process.exitCode=1;}
finally{
 try{await checkpoint('close-and-seal');await cap({action:'close-write-window',windowToken:owner.windowToken});owner.windowClosed=true;await save(prefix+'owned-private.json',owner);assert.equal((await cap()).writeTracking.pending,0,'Unknown writes retained');const s=await state();if(s.fence.active)assert.equal(owner.fenceReleased,false);else await fence();const sealed=await cap({action:'acquire-write-drain',fenceToken:owner.fenceToken,drainToken:owner.drainToken});assert.equal(sealed.writeTracking.sealed,true);owner.sealReleased=false;await save(prefix+'owned-private.json',owner);
  if(!failed){await checkpoint('final-backup');await snapshot('final');}
  await release();owner.phase=failed?'failed-sealed':'passed-sealed';await save(prefix+'owned-private.json',owner);report.finalBudget=await cap();report.finalState=(await state()).state;report.finalPins=(await control('/__playtt-backup-pins')).generation;report.publisher=(await control('/__playtt-publishing')).state;report.windowClosed=true;report.writeSealed=true;report.fenceReleased=true;
 }catch(e){report.containment={result:'incomplete',stage,errorName:e.name,deadline:owner.expiresAt};process.exitCode=1;}
 await save(prefix+'result.json',report);console.log(JSON.stringify(report));
}
