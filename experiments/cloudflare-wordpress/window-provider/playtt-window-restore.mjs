// One bounded forward-adoption/cold-PHP recovery exercise. No reset/delete.
import assert from 'node:assert/strict';
import {readFile,writeFile,access} from 'node:fs/promises';
import {randomUUID,createHash} from 'node:crypto';
import {openSnapshotBundle} from './playtt-snapshot-bundle.mjs';
import {backupPinInput} from '../src/playtt-backup-pins.ts';
import {parse as yaml} from 'yaml';
assert.ok(process.argv.includes('--remote'));
const origin='https://playtt-wp-free-window-audit.muzhi-garden-platform.workers.dev',retryAfterSealDenial=process.argv.includes('--after-seal-denial'),afterTimingAssertion=process.argv.includes('--after-timing-assertion');
assert.ok(!(retryAfterSealDenial&&afterTimingAssertion));
const prefix=afterTimingAssertion?'artifacts/playtt-window-restore-cold-':retryAfterSealDenial?'artifacts/playtt-window-restore-retry-':'artifacts/playtt-window-restore-';
const load=async p=>JSON.parse(await readFile(p,'utf8')),save=(p,v)=>writeFile(p,JSON.stringify(v,null,2)+'\n');
const sha=v=>createHash('sha256').update(v).digest('hex');
const secrets=await load('../../../playtt-cms-secrets.json'),native=await load('artifacts/playtt-window-native-owned-private.json');
const prior=await load('artifacts/playtt-window-native-result.json'),backups=await load('artifacts/playtt-window-backup-result.json'),location=await load('artifacts/playtt-window-backup-owned-private.json');
assert.equal(prior.result,'pass');assert.equal(native.phase,'passed-sealed');assert.equal(native.id,193);assert.equal(backups.result,'pass');assert.equal(location.phase,'verified');
let previous=native,expectedInitialState=prior.finalState;
if(retryAfterSealDenial){const denied=await load('artifacts/playtt-window-restore-result.json');previous=await load('artifacts/playtt-window-restore-owned-private.json');assert.equal(denied.result,'fail');assert.equal(denied.failedStage,'adopt-overlay');assert.equal(denied.checks.find(c=>c.stage==='adopt-overlay'&&c.method==='POST').status,503);assert.deepEqual(denied.finalState,prior.finalState);assert.equal(denied.finalBudget.chargedBytes,prior.finalBudget.chargedBytes);assert.equal(denied.finalBudget.writeTracking.window.operations,0);assert.equal(previous.phase,'failed-sealed');assert.equal(previous.windowClosed,true);assert.equal(previous.fenceReleased,true);}
if(afterTimingAssertion){const stopped=await load('artifacts/playtt-window-restore-retry-result.json');previous=await load('artifacts/playtt-window-restore-retry-owned-private.json');assert.equal(stopped.result,'fail');assert.equal(stopped.failedStage,'overlay-cold-login-form');assert.equal(stopped.checks.find(c=>c.stage==='overlay-cold-login-form').status,200);assert.equal(stopped.finalState.version,8);assert.equal(stopped.finalState.pointer.revision,'ef40f2b5-d72b-45c1-baf2-46591a583fb7');assert.equal(stopped.finalBudget.chargedBytes,prior.finalBudget.chargedBytes);assert.equal(stopped.finalBudget.writeTracking.window.operations,0);assert.equal(previous.phase,'failed-sealed');assert.equal(previous.windowClosed,true);assert.equal(previous.fenceReleased,true);expectedInitialState=stopped.finalState;}
const selected=backups.snapshots.find(s=>s.label==='heartbeat-1'),full=backups.snapshots.find(s=>s.label==='final');assert.equal(selected.format,'metadata-overlay');assert.equal(full.format,'full-pack');
const localOverlay=await openSnapshotBundle(location.directory+'/heartbeat-1-independent',selected.anchor),localFull=await openSnapshotBundle(location.directory+'/final-independent',full.anchor);
const expectedOverlay={...native.expected,content:native.content},expectedFull=native.expected;
assert.notEqual(expectedOverlay.content,expectedFull.content);
// Ordinary pages live in canonical Markdown; the raw posts table preserves
// revisions and unsupported rows. Validate both format and exact framed bytes.
for(const [graph,expected]of [[localOverlay.graph,expectedOverlay],[localFull.graph,expectedFull]]){
 const file=graph.contents.markdown.find(f=>f.path==='page/'+native.marker+'.md');assert.ok(file);const raw=new TextDecoder().decode(file.bytes);assert.ok(raw.startsWith('---\n'));const end=raw.indexOf('\n---\n',4);assert.ok(end>4);const meta=yaml(raw.slice(4,end));
 assert.equal(meta.wordpress.id,193);assert.equal(meta.wordpress.status,expected.status);assert.equal(meta.wordpress.slug,expected.slug);assert.equal(meta.title,expected.title);assert.equal(meta.__playtt_content,'v1:'+Buffer.byteLength(expected.content)+':'+sha(expected.content));assert.ok(raw.endsWith(expected.content+'\n'));
}
try{await access(prefix+'owned-private.json');throw Error('Existing recovery attempt: inspect rather than replay');}catch(e){if(e.code!=='ENOENT')throw e;}
const checks=[],cookies=new Map();let stage='preflight',nonce;
function timings(value){return (value||'').split(',').slice(0,16).map(s=>/^\s*([a-z0-9_-]{1,64});dur=(\d+(?:\.\d+)?)\s*$/i.exec(s)).filter(Boolean).map(m=>({name:m[1],durationMs:Number(m[2])}));}
async function request(path,options={}){
 assert.ok(path.startsWith('/')&&!path.startsWith('//'));const at=Date.now(),headers=new Headers(options.headers);headers.set('X-Playtt-Probe',secrets.WORDPRESS_OPERATOR_TOKEN);headers.set('cookie',[...cookies.values()].join('; '));
 const r=await fetch(origin+path,{...options,headers,redirect:'manual',signal:AbortSignal.timeout(45000)});
 checks.push({stage,startedAt:new Date(at).toISOString(),method:options.method||'GET',status:r.status,wallMs:Date.now()-at,timing:timings(r.headers.get('server-timing'))});
 for(const raw of r.headers.getSetCookie()){const value=raw.split(';')[0];cookies.set(value.split('=')[0],value);}return r;
}
async function control(path,body){const r=await request(path,{method:body?'POST':'GET',headers:{authorization:'Bearer '+secrets.WORDPRESS_OPERATOR_TOKEN,'content-type':'application/json'},body:body?JSON.stringify(body):undefined});assert.equal(r.status,200,stage+': HTTP '+r.status);return r.json();}
const op=(phase,body)=>control('/?phase=operator-'+phase,body),capacity=body=>control('/__playtt-capacity',body);
const state=async()=>{const s=await op('fence-status');assert.equal(s.coherent,true);return s;};
const before=await state(),budget=await capacity(),pins=await control('/__playtt-backup-pins');
assert.deepEqual(before.state,expectedInitialState);assert.equal(before.fence.active,false);assert.equal(budget.writeTracking.sealed,true);assert.equal(budget.writeTracking.pending,0);assert.equal(budget.writeTracking.window.closed,true);assert.equal(budget.chargedBytes,prior.finalBudget.chargedBytes);assert.ok(budget.remainingBytes>16*1024*1024);assert.equal(pins.generation,4);assert.equal((await control('/__playtt-publishing')).state,'paused');
for(const snapshot of [selected,full])assert.deepEqual(backupPinInput(pins.pins.find(p=>p.revision===snapshot.anchor.revision)),snapshot.anchor);
const pointer=a=>({revision:a.revision,manifestKey:a.manifestKey,persistedAt:a.persistedAt});
const owner={origin,phase:'prepared',drainToken:previous.drainToken,previousWindowToken:previous.windowToken,windowToken:randomUUID(),windowArmed:false,sealReleased:false,fenceReleased:true,original:before.state,overlay:pointer(selected.anchor),full:pointer(full.anchor)};
await save(prefix+'owned-private.json',owner);
const report={at:new Date().toISOString(),result:'pending',scope:'Fenced monotonic adoption of pinned overlay and full snapshot followed by real login/REST readback; cold-phase proof requires the separate sanitized provider tail; no browser or process redeployment',checks,transitions:[],resets:0,deletes:0,contentEdits:0};
async function persist(phase){stage=phase;owner.phase=phase;await save(prefix+'owned-private.json',owner);}
async function acquireFence(){const f=await op('fence-acquire',{ttlSeconds:600});owner.fenceToken=f.token;owner.fenceReleased=false;await save(prefix+'owned-private.json',owner);return f;}
async function releaseSeal(){assert.equal(owner.fenceReleased,false);await capacity({action:'release-write-drain',fenceToken:owner.fenceToken,drainToken:owner.drainToken});owner.sealReleased=true;await save(prefix+'owned-private.json',owner);}
async function release(){assert.equal(owner.sealReleased,true);await op('fence-release',{token:owner.fenceToken});owner.fenceReleased=true;await save(prefix+'owned-private.json',owner);}
async function adopt(target){const s=await state();const version=s.state.version+1;const applied=await op('adopt',{pointer:target,version,fenceToken:owner.fenceToken});assert.equal(applied.adopted,true);assert.equal(applied.version,version);assert.deepEqual(applied.pointer,target);const checked=await state();assert.equal(checked.state.version,version);assert.deepEqual(checked.state.pointer,target);report.transitions.push({stage,version,pointer:target});}
async function loginAndRead(label,target,expected){
 cookies.clear();await persist(label+'-cold-login-form');const r=await request('/wp-login.php');assert.equal(r.status,200);const html=await r.text();assert.ok(html.includes('id="loginform"'));
 const observed=await state();assert.deepEqual(observed.state.pointer,target,'Cold read changed the selected snapshot');
 // Ordinary WordPress responses intentionally omit server-timing. Verify the
 // cold restore phase separately against the bounded sanitized provider tail.
 await persist(label+'-login');const logged=await request('/wp-login.php',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({log:'admin',pwd:secrets.WORDPRESS_ADMIN_PASSWORD,testcookie:'1','wp-submit':'Log In',redirect_to:origin+'/wp-admin/'})});assert.equal(logged.status,302);assert.equal(new URL(logged.headers.get('location'),origin).origin,origin);await logged.body?.cancel();
 await persist(label+'-dashboard');const dashboard=await request('/wp-admin/');assert.equal(dashboard.status,200);const body=await dashboard.text();assert.ok(body.includes('lang="zh-TW"'));nonce=body.match(/"nonce":"([^"]+)"/)?.[1];assert.ok(nonce);
 for(const id of [193,24]){await persist(label+'-read-'+id);const response=await request('/wp-json/wp/v2/pages/'+id+'?context=edit',{headers:{'x-wp-nonce':nonce}});assert.equal(response.status,200);const p=await response.json(),value={id:p.id,status:p.status,slug:p.slug,title:p.title.raw,content:p.content.raw};if(id===193)assert.deepEqual(value,expected);else assert.equal(sha(JSON.stringify(value)),native.homeHash);}
 report[label]={selectedSnapshotLoginFormLoaded:true,coldPhaseRequiresSeparateTail:true,traditionalChineseDashboard:true,ownedDraftExact:true,homepageExact:true,afterLoginState:(await state()).state};
}
let failed=false;
try{
 await persist('arm');await acquireFence();const armed=await capacity({action:'arm-write-window',fenceToken:owner.fenceToken,drainToken:owner.drainToken,windowToken:owner.windowToken,previousWindowToken:owner.previousWindowToken,durationSeconds:180,maxBytes:16*1024*1024,maxOperations:96});owner.windowArmed=true;owner.expiresAt=armed.writeTracking.window.expiresAt;await save(prefix+'owned-private.json',owner);
 // Admission refuses a held R2 seal even for adoption. Keep the canonical
 // fence while releasing only our seal, then adopt and release the fence.
 await persist('adopt-overlay');await releaseSeal();await adopt(owner.overlay);await release();await loginAndRead('overlay',owner.overlay,expectedOverlay);
 await persist('reseal-before-full');assert.equal((await capacity()).writeTracking.pending,0);await acquireFence();const sealed=await capacity({action:'acquire-write-drain',fenceToken:owner.fenceToken,drainToken:owner.drainToken});assert.equal(sealed.writeTracking.sealed,true);owner.sealReleased=false;await save(prefix+'owned-private.json',owner);
 await persist('adopt-full');await releaseSeal();await adopt(owner.full);await release();await loginAndRead('full',owner.full,expectedFull);
 report.result='pass';
}catch(e){failed=true;report.result='fail';report.failedStage=stage;report.errorName=e.name;process.exitCode=1;}
finally{
 try{
  await persist('close-and-seal');await capacity({action:'close-write-window',windowToken:owner.windowToken});owner.windowClosed=true;await save(prefix+'owned-private.json',owner);
  const b=await capacity();assert.equal(b.writeTracking.pending,0,'Keep unknown writes pending');const s=await state();if(s.fence.active)assert.equal(owner.fenceReleased,false);else await acquireFence();
  report.finalBudget=await capacity({action:'acquire-write-drain',fenceToken:owner.fenceToken,drainToken:owner.drainToken});assert.equal(report.finalBudget.writeTracking.sealed,true);assert.equal(report.finalBudget.writeTracking.pending,0);owner.sealReleased=false;await save(prefix+'owned-private.json',owner);
  await op('fence-release',{token:owner.fenceToken});owner.fenceReleased=true;owner.phase=failed?'failed-sealed':'passed-sealed';await save(prefix+'owned-private.json',owner);
  report.finalState=(await state()).state;report.publisher=(await control('/__playtt-publishing')).state;const afterPins=await control('/__playtt-backup-pins');assert.deepEqual(afterPins,pins);report.pinsUnchanged=4;report.windowClosed=true;report.writeSealed=true;report.fenceReleased=true;
 }catch(e){report.containment={result:'incomplete',stage,errorName:e.name};process.exitCode=1;}
 await save(prefix+'result.json',report);console.log(JSON.stringify(report));
}
