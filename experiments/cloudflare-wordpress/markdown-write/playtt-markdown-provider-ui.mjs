// One bounded native Browser-tool exercise. This process owns the live tail,
// write window and containment; it never calls WordPress content endpoints.
import assert from 'node:assert/strict';
import {readFile,writeFile,access,unlink} from 'node:fs/promises';
import {randomUUID,createHash} from 'node:crypto';
import {setTimeout as delay} from 'node:timers/promises';
import {startPlayttProviderObserver} from './playtt-provider-observer.mjs';
import {openSnapshotBundle} from './playtt-snapshot-bundle.mjs';
const mode=process.argv[2];assert.ok(['check','run'].includes(mode));
const prefix='artifacts/playtt-markdown-provider-ui-',origin='https://playtt-wp-free-session-audit.muzhi-garden-platform.workers.dev';
const load=async p=>JSON.parse(await readFile(p,'utf8')),save=(name,v)=>writeFile(prefix+name,JSON.stringify(v,null,2)+'\n');
const hash=b=>createHash('sha256').update(b).digest('hex');
const candidate=await load('../../../playtt/experiments/cloudflare-wordpress/markdown-write/candidate-files.json');
const sourceHashes={};for(const entry of [...candidate.prerequisites,...candidate.files].filter(e=>e.path.startsWith('src/'))){const want=entry.afterSha256||entry.sha256;sourceHashes[entry.path]=hash((await readFile(entry.path,'utf8')).replaceAll('\r\n','\n'));assert.equal(sourceHashes[entry.path],want,entry.path);}
const previous=await load('artifacts/playtt-content-io-provider-cold-owned-private.json'),backup=await load('artifacts/playtt-content-io-provider-backup-owned-private.json'),credentials=await load('artifacts/playtt-canvas-ui-owned-private.json');
assert.equal(previous.phase,'closed-sealed');assert.equal(backup.phase,'verified');assert.equal(backup.anchor.revision,'566e44a3-c953-423e-adde-2b0124ece358');assert.equal(credentials.user.id,2);
const baseline=await openSnapshotBundle(backup.directory+'/independent',backup.anchor);assert.equal(baseline.graph.objects.length,303);
const limits={durationSeconds:420,maxBytes:3*1024*1024,maxOperations:96,observerSeconds:660};
if(mode==='check'){console.log(JSON.stringify({result:'local-preflight-pass',sourceHashes,baseline:130,pins:11,limits,networkCalls:0,deploysNothing:true}));process.exit(0);}
assert.ok(process.argv.includes('--remote'));const expectedVersion=process.argv.find(a=>a.startsWith('--version='))?.slice(10);assert.match(expectedVersion||'',/^[a-f0-9-]{36}$/);
for(const p of [prefix+'owned-private.json',prefix+'command-private.json']){try{await access(p);throw Error('Existing attempt; inspect, never replay');}catch(e){if(e.code!=='ENOENT')throw e;}}
const secrets=await load('../../../playtt-cms-secrets.json');let owner,observer,stage='preflight';
const checks=[];async function json(path,body){
 assert.ok(['/?phase=operator-fence-status','/?phase=operator-fence-acquire','/?phase=operator-fence-release','/__playtt-capacity','/__playtt-backup-pins','/__playtt-publishing'].includes(path));
 const r=await fetch(origin+path,{method:body?'POST':'GET',headers:{authorization:'Bearer '+secrets.WORDPRESS_OPERATOR_TOKEN,'X-Playtt-Probe':secrets.WORDPRESS_OPERATOR_TOKEN,'content-type':'application/json'},body:body?JSON.stringify(body):undefined,redirect:'error',signal:AbortSignal.timeout(45000)});
 checks.push({at:new Date().toISOString(),stage,endpoint:path,method:body?'POST':'GET',status:r.status});assert.equal(r.status,200,'Operator request failed');return r.json();
}
const op=(phase,body)=>json('/?phase=operator-'+phase,body),capacity=body=>json('/__playtt-capacity',body);
async function snapshot(){const [s,b,p,pub]=await Promise.all([op('fence-status'),capacity(),json('/__playtt-backup-pins'),json('/__playtt-publishing')]);assert.equal(s.coherent,true);assert.equal(pub.state,'paused');return{at:new Date().toISOString(),state:s.state,fenceActive:s.fence.active,budget:b,pins:p.generation,publisher:pub.state};}
async function checkpoint(phase){stage=phase;owner.phase=phase;await save('owned-private.json',owner);}
async function fence(){const f=await op('fence-acquire',{ttlSeconds:600});owner.fenceToken=f.token;owner.fenceReleased=false;await save('owned-private.json',owner);}
async function release(){await op('fence-release',{token:owner.fenceToken});owner.fenceReleased=true;await save('owned-private.json',owner);}
async function contain(){
 await checkpoint('closing');if(owner.windowArmed){await capacity({action:'close-write-window',windowToken:owner.windowToken});owner.windowClosed=true;await save('owned-private.json',owner);}
 const deadline=Date.now()+45000;let b=await capacity();while(b.writeTracking.pending>0&&Date.now()<deadline){await delay(1000);b=await capacity();}assert.equal(b.writeTracking.pending,0,'Pending writes remain; never clear unknown tickets');
 const state=await op('fence-status');if(state.fence.active)assert.equal(owner.fenceReleased,false,'Unowned fence');else await fence();
 const sealed=await capacity({action:'acquire-write-drain',fenceToken:owner.fenceToken,drainToken:owner.drainToken});assert.equal(sealed.writeTracking.sealed,true);assert.equal(sealed.writeTracking.pending,0);owner.sealReleased=false;await save('owned-private.json',owner);await release();await checkpoint('closed-sealed');return snapshot();
}
const before=await snapshot();assert.equal(before.state.version,130);assert.equal(before.state.pointer.revision,backup.anchor.revision);assert.equal(before.pins,11);assert.equal(before.fenceActive,false);assert.equal(before.budget.remainingBytes,5935730);assert.equal(before.budget.writeTracking.pending,0);assert.equal(before.budget.writeTracking.sealed,true);assert.equal(before.budget.writeTracking.window.closed,true);
const marker='playtt-markdown-provider-'+randomUUID(),expectedBefore={...previous.expectedBefore,content:previous.expectedContent};
const expectedContent=expectedBefore.content+'\n\n<!-- wp:paragraph -->\n<p>免費 Cloudflare 原生編輯保存驗證：繁體中文、完整重讀與有界寫入。 '+marker+'</p>\n<!-- /wp:paragraph -->';
owner={origin,id:193,user:credentials.user,phase:'preparing',expectedBefore,expectedContent,marker,baseline:backup.anchor,baselineDirectory:backup.directory+'/independent',windowToken:randomUUID(),previousWindowToken:previous.windowToken,drainToken:previous.drainToken,fenceReleased:true,sealReleased:false,windowClosed:true,windowArmed:false,expectedVersion,sourceHashes,limits};
await writeFile(prefix+'owned-private.json',JSON.stringify(owner,null,2)+'\n',{flag:'wx'});
const report={at:new Date().toISOString(),result:'pending',scope:'Live-tail coordinated native-browser provider exercise; operator-only controller',limits,sourceHashes,expectedVersion,before,checks,guards:[],snapshots:[]};let stopped=false;
try{
 observer=await startPlayttProviderObserver({expectedVersion,prefix:'artifacts/playtt-markdown-provider-ui',durationSeconds:limits.observerSeconds});
 await checkpoint('waiting-observer');const waitUntil=Date.now()+75000;
 while(!await observer.ready()){assert.ok(Date.now()<waitUntil,'Tail readiness timed out');observer.assertLive(540000,false);await op('fence-status');await delay(2000);}
 report.observerBeforeArm=observer.assertLive(540000);await checkpoint('arming');await fence();
 const armed=await capacity({action:'arm-write-window',fenceToken:owner.fenceToken,drainToken:owner.drainToken,windowToken:owner.windowToken,previousWindowToken:owner.previousWindowToken,durationSeconds:limits.durationSeconds,maxBytes:limits.maxBytes,maxOperations:limits.maxOperations});
 owner.expiresAt=armed.writeTracking.window.expiresAt;owner.windowArmed=true;owner.windowClosed=false;await save('owned-private.json',owner);
 await capacity({action:'release-write-drain',fenceToken:owner.fenceToken,drainToken:owner.drainToken});owner.sealReleased=true;await save('owned-private.json',owner);await release();await checkpoint('browser-ready');
 report.observerBeforeBrowser=observer.assertLive(limits.durationSeconds*1000);await save('progress.json',report);
 console.log(JSON.stringify({result:'browser-ready',expiresAt:owner.expiresAt,ownedDraft:193,observerLive:true}));
 while(!stopped&&Date.now()<owner.expiresAt-15000){
  observer.assertLive(60000);
  let cmd;try{cmd=await load(prefix+'command-private.json');}catch(e){if(e.code!=='ENOENT')throw e;}
  if(cmd){
   assert.match(cmd.id||'',/^[a-f0-9-]{36}$/);assert.ok(['guard','saved','cold','status','finish'].includes(cmd.action));
   let value;
   try{
    if(cmd.action==='finish'){stopped=true;value={result:'finishing'};}
    else{
     const live=observer.assertLive(90000),remainingMs=owner.expiresAt-Date.now();assert.ok(remainingMs>60000,'Write window too close to expiration');
     const state=await snapshot();assert.equal(state.budget.writeTracking.sealed,false);assert.equal(state.budget.writeTracking.window.closed,false);assert.ok(state.budget.writeTracking.window.remainingBytes>262144,'Insufficient remaining window for another native action');
     value={result:'live',action:cmd.action,at:new Date().toISOString(),observerRemainingMs:live.remainingMs,windowRemainingMs:remainingMs,canonicalVersion:state.state.version,windowRemainingBytes:state.budget.writeTracking.window.remainingBytes};
     report.guards.push(value);if(['saved','cold'].includes(cmd.action)){assert.equal(report.snapshots.some(x=>x.label===cmd.action),false);report.snapshots.push({label:cmd.action,...state});}
    }
    await save('reply-private.json',{id:cmd.id,ok:true,value});
   }catch(e){await save('reply-private.json',{id:cmd.id,ok:false,error:{name:e.name,message:e.message}});throw e;}
   await unlink(prefix+'command-private.json');await save('progress.json',report);
  }
  if(!stopped)await delay(250);
 }
 report.result=stopped?'browser-finished-awaiting-independent-content-verification':'window-ending';
}catch(e){report.result='fail';report.failedStage=stage;report.errorName=e.name;}
finally{
 try{report.after=await contain();report.contained=true;report.chargedBytes=report.after.budget.chargedBytes-before.budget.chargedBytes;report.chargedPuts=report.after.budget.chargedPuts-before.budget.chargedPuts;assert.ok(report.chargedBytes<=limits.maxBytes);}catch(e){report.contained=false;report.containmentErrorName=e.name;}
 if(observer)report.observerFinal=await observer.stop();report.finishedAt=new Date().toISOString();await save('result.json',report);
 console.log(JSON.stringify({result:report.result,contained:report.contained,canonicalVersion:report.after?.state.version,chargedBytes:report.chargedBytes,chargedPuts:report.chargedPuts,observerEnded:report.observerFinal?.ended}));
 if(!report.contained||report.result==='fail')process.exitCode=1;
}
