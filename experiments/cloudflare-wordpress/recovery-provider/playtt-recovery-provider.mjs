// One fixed private forward adoption; no production deployment or deletion.
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { resolve } from 'node:path';
import { randomUUID, createHash } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import { prepareLegacyAdoption, executeLegacyAdoption } from './playtt-legacy-adoption.mjs';
import { createRecoveryHttpTransport } from './playtt-recovery-http.mjs';
import { exportSnapshotBundle, importSnapshotBundle, openSnapshotBundle } from './playtt-snapshot-bundle.mjs';
import { createContentSnapshotSource } from './playtt-content-snapshot-source.mjs';
import { startPlayttProviderObserver } from './playtt-envelope-provider-observer.mjs';
const mode = process.argv[2]; assert.ok(['check','run'].includes(mode));
const prefix = 'artifacts/playtt-recovery-provider-', load = async p => JSON.parse(await readFile(p,'utf8'));
const sha = b => createHash('sha256').update(b).digest('hex');
const fixed = await load(prefix+'source-plan.json'), config = await load('wrangler.playtt-session-audit.jsonc');
assert.equal(fixed.sources.length,82); for (const file of fixed.sources) assert.equal(sha((await readFile(file.path,'utf8')).replaceAll('\r\n','\n')),file.sha256,file.path);
assert.equal(sha((await readFile('wrangler.playtt-session-audit.jsonc','utf8')).replaceAll('\r\n','\n')),fixed.configSha256);
assert.equal(config.name,'playtt-wp-free-session-audit'); assert.equal(config.account_id,'3baadbd4abd9fd63c7f7e51664b26f67'); assert.equal(config.routes,undefined);
assert.deepEqual(config.triggers,{crons:[]}); assert.equal(config.vars.PLAYTT_R2_CAPACITY_LIMIT_BYTES,'150000000');
const preflight = await load(prefix+'preflight-result.json'), prior = await load('artifacts/playtt-envelope-provider-ui-owned-private.json');
const backup = await load('artifacts/playtt-envelope-provider-backup-owned-private.json'), converted = await load('artifacts/playtt-legacy-content-owned-private.json');
assert.equal(prior.phase,'closed-sealed'); assert.equal(backup.phase,'verified'); assert.equal(converted.phase,'converted');
assert.equal(preflight.canonicalVersion,177); assert.equal(preflight.pins,14); assert.equal(preflight.deployedVersion,fixed.expectedPriorDeployment);
const { plan,digest } = await prepareLegacyAdoption({ sourceDirectory:backup.directory+'/independent',sourceAnchor:backup.anchor,targetDirectory:converted.directory+'/independent',targetAnchor:converted.anchor,sourceVersion:177 });
const ptr = a => Object.fromEntries(['revision','manifestKey','persistedAt'].map(k=>[k,a[k]]));
const maximumBytes = plan.objects.reduce((n,o)=>n+o.bytes.length,0)+Buffer.byteLength(JSON.stringify(ptr(plan.target)));
assert.equal(maximumBytes,432931); assert.equal(plan.objects.length+1,7);
const limits = {durationSeconds:600,maxBytes:432931,maxOperations:7};
if(mode==='check'){console.log(JSON.stringify({result:'offline-check-pass',sources:82,sourceVersion:177,targetVersion:178,planDigest:digest,limits,sourceBackupExact:true,cloudRequests:0,deployments:0}));process.exit(0);}
assert.ok(process.argv.includes('--remote'));const expectedVersion = process.argv.find(a=>a.startsWith('--version='))?.slice(10);assert.match(expectedVersion||'',/^[a-f0-9-]{36}$/);
assert.ok(Date.now()-Date.parse(preflight.at)<30*60*1000,'Refresh preflight after 30 minutes');
for(const suffix of ['owned-private.json','result.json'])await access(prefix+suffix).then(()=>{throw Error('Existing attempt; inspect rather than replay.');},e=>{if(e.code!=='ENOENT')throw e;});
const secrets = await load('../../../playtt-cms-secrets.json'), origin = 'https://playtt-wp-free-session-audit.muzhi-garden-platform.workers.dev';
const oauth = (await readFile('../../../playtt-wrangler-config/.wrangler/config/default.toml','utf8')).match(/^oauth_token\s*=\s*"([^"\r\n]+)"/m)?.[1];assert.ok(oauth);
const checks=[]; let owner,observer,transport,registry=null,armed=false,windowClosed=false,phase='preflight';
const save = async () => { owner.phase=phase; await writeFile(prefix+'owned-private.json',JSON.stringify(owner,null,2)+'\n'); };
async function json(path,body){
 assert.ok(['/?phase=operator-fence-status','/?phase=operator-fence-acquire','/?phase=operator-fence-release','/__playtt-capacity','/__playtt-backup-pins','/__playtt-publishing'].includes(path));
 const r=await fetch(origin+path,{method:body?'POST':'GET',headers:{authorization:'Bearer '+secrets.WORDPRESS_OPERATOR_TOKEN,'X-Playtt-Probe':secrets.WORDPRESS_OPERATOR_TOKEN,'content-type':'application/json'},body:body?JSON.stringify(body):undefined,redirect:'error',signal:AbortSignal.timeout(45000)});
 checks.push({phase,endpoint:path,method:body?'POST':'GET',status:r.status});if(!r.ok){await r.body?.cancel();throw Error('Private operator HTTP '+r.status+' '+path);}return r.json();
}
const cap = body => json('/__playtt-capacity',body);
async function status(){
 const results=await Promise.allSettled([json('/?phase=operator-fence-status'),cap(),json('/__playtt-backup-pins'),json('/__playtt-publishing')]);for(const r of results)assert.equal(r.status,'fulfilled');
 const [s,b,p,pub]=results.map(r=>r.value);assert.equal(s.coherent,true);assert.equal(pub.state,'paused');return {state:s.state,receipt:s.receipt,fence:s.fence,budget:b,pins:p,publisher:pub.state};
}
async function deployment(){
 const results=await Promise.allSettled(['settings','deployments'].map(async path=>{
  const r=await fetch('https://api.cloudflare.com/client/v4/accounts/'+config.account_id+'/workers/scripts/'+config.name+'/'+path,{headers:{authorization:'Bearer '+oauth},redirect:'error',signal:AbortSignal.timeout(45000)});assert.equal(r.status,200);const b=await r.json();assert.equal(b.success,true);return b.result;
 }));for(const r of results)assert.equal(r.status,'fulfilled');const [settings,deploy]=results.map(r=>r.value),head=(Array.isArray(deploy)?deploy:deploy.deployments)[0];
 assert.deepEqual(head.versions,[{version_id:expectedVersion,percentage:100}]);
 const bindings=settings.bindings;assert.equal(bindings.find(b=>b.name==='WORDPRESS_STATE_BUCKET')?.bucket_name,'playtt-wordpress-session-audit');
 for(const [name,value]of Object.entries({...config.vars,PLAYTT_RECOVERY_UPLOADS:'v1'})){const b=bindings.find(b=>b.name===name);assert.equal(b?.type,'plain_text');assert.equal(b.text,value,name);}
 for(const name of ['PLAYTT_CONTENT_OVERLAY','PLAYTT_MANIFEST_ENCODING','PLAYTT_EDITOR_HEARTBEAT','PLAYTT_EDITOR_READBACK'])assert.equal(bindings.some(b=>b.name===name),false);
 return {version:expectedVersion,bindingsExact:true};
}
const deployed=await deployment(),before=await status();assert.deepEqual(before.state.pointer,ptr(plan.source));assert.equal(before.state.version,177);assert.equal(before.fence.active,false);
assert.equal(before.budget.remainingBytes,1083839);assert.equal(before.budget.writeTracking.pending,0);assert.equal(before.budget.writeTracking.sealed,true);assert.equal(before.budget.writeTracking.window.closed,true);assert.equal(before.pins.generation,14);
owner={phase,directory:resolve('../../../../outputs/backups/cloudflare-wordpress-recovery-provider/'+new Date().toISOString().replace(/[:.]/g,'-')),planDigest:digest,source:plan.source,target:plan.target,expectedVersion,limits,
 windowToken:randomUUID(),previousWindowToken:prior.windowToken,drainToken:prior.drainToken,fenceReleased:true,windowArmed:false,windowClosed:true,sealReleased:false};
await writeFile(prefix+'owned-private.json',JSON.stringify(owner,null,2)+'\n',{flag:'wx'});
const events=[],report={schema:'playtt/recovery-provider/v1',at:new Date().toISOString(),result:'pending',worker:config.name,sourceVersion:177,targetVersion:178,planDigest:digest,deployed,limits,checks};
const started=Date.now();
try{
 observer=await startPlayttProviderObserver({expectedVersion,prefix:'artifacts/playtt-recovery-provider-observer',durationSeconds:660});
 phase='waiting-observer';await save();const deadline=Date.now()+60000;
 while(!await observer.ready()){assert.ok(Date.now()<deadline,'Live observer readiness expired');observer.assertLive(540000,false);await json('/?phase=operator-fence-status');await delay(1000);}
 observer.assertLive(610000);phase='acquiring-fence';await save();const fence=await json('/?phase=operator-fence-acquire',{ttlSeconds:600});owner.fenceToken=fence.token;owner.fenceReleased=false;await save();
 transport=await createRecoveryHttpTransport({plan,digest,origin,operatorToken:secrets.WORDPRESS_OPERATOR_TOKEN,fenceToken:owner.fenceToken,
  loadOperations:async()=>registry,saveOperations:async value=>{await writeFile(prefix+'operations-private.json',JSON.stringify(value,null,2)+'\n');registry=value;}});
 // Read the source current.json before any window or R2 mutation.
 assert.deepEqual((await transport.io.inspect()).r2Pointer,ptr(plan.source));
 phase='arming';await save();const window=await cap({action:'arm-write-window',fenceToken:owner.fenceToken,drainToken:owner.drainToken,windowToken:owner.windowToken,previousWindowToken:owner.previousWindowToken,...limits});
 owner.expiresAt=window.writeTracking.window.expiresAt;owner.windowArmed=true;owner.windowClosed=false;armed=true;await save();
 await cap({action:'release-write-drain',fenceToken:owner.fenceToken,drainToken:owner.drainToken});owner.sealReleased=true;
 phase='adopting';await save();
 report.adoption=await executeLegacyAdoption({plan,digest,io:transport.io,journal:async e=>{observer.assertLive(10000);events.push(e);await writeFile(prefix+'journal-private.json',JSON.stringify(events,null,2)+'\n');}});
 const adopted=await transport.io.inspect();assert.equal(adopted.state.version,178);assert.deepEqual(adopted.r2Pointer,ptr(plan.target));assert.equal(adopted.pending,0);
 phase='closing';await save();await cap({action:'close-write-window',windowToken:owner.windowToken});windowClosed=true;owner.windowClosed=true;await save();
 const sealed=await cap({action:'acquire-write-drain',fenceToken:owner.fenceToken,drainToken:owner.drainToken});assert.equal(sealed.writeTracking.sealed,true);assert.equal(sealed.writeTracking.pending,0);owner.sealReleased=false;await save();
 const pins=await transport.io.listPins();for(const pin of before.pins.pins)assert.ok(pins.some(p=>JSON.stringify(p)===JSON.stringify(pin)));assert.equal(pins.length,15);
 // Independent API download after sealing, not a copy of the uploaded bytes.
 phase='independent-backup';await save();await mkdir(owner.directory,{recursive:true});
 const source=createContentSnapshotSource({token:oauth});await exportSnapshotBundle(source.bucket,plan.target,owner.directory+'/export');
 const independent=await importSnapshotBundle(owner.directory+'/export',plan.target,owner.directory+'/independent'),baseline=await openSnapshotBundle(backup.directory+'/independent',backup.anchor);
 const contents = graph => Object.fromEntries(['markdown','uploads','wpContent'].map(g=>[g,[...graph.contents[g]].sort((a,b)=>a.path.localeCompare(b.path))]));
 assert.deepEqual(contents(independent.graph),contents(baseline.graph));assert.deepEqual(independent.graph.contents.wpContentDeleted,baseline.graph.contents.wpContentDeleted);assert.equal(independent.graph.objects.length,303);
 assert.deepEqual((await transport.io.inspect()).r2Pointer,ptr(plan.target));await json('/?phase=operator-fence-release',{token:owner.fenceToken});owner.fenceReleased=true;
 const after=await status();assert.equal(after.state.version,178);assert.equal(after.fence.active,false);assert.equal(after.budget.writeTracking.pending,0);assert.equal(after.budget.writeTracking.sealed,true);assert.equal(after.budget.writeTracking.window.closed,true);
 const bytes=after.budget.chargedBytes-before.budget.chargedBytes,puts=after.budget.chargedPuts-before.budget.chargedPuts;assert.ok(bytes<=limits.maxBytes&&puts<=limits.maxOperations);assert.equal(after.budget.remainingBytes,1083839-bytes);
 owner.anchor=plan.target;owner.finalVersion=178;phase='verified-closed-sealed';await save();
 Object.assign(report,{result:'pass',before:{version:177,pins:14,remainingBytes:1083839},after:{version:178,pins:15,remainingBytes:after.budget.remainingBytes,pending:0,sealed:true,windowClosed:true,fenceActive:false,publisher:after.publisher},
  chargedBytes:bytes,chargedPuts:puts,wallMs:Date.now()-started,allOriginalPinsExact:true,allContentsMediaThemeExact:true,independentBackup:{objects:303,files:298,remoteGets:source.stats.requests,downloadedBytes:source.stats.downloadedBytes,exact:true},
  observerLiveDuringAdoption:true,productionChanged:false,paidUpgrade:false,capChanged:false,historyDeleted:false,oldSourceDeployed:false,providerFaultInjected:false,nativePhpEdited:false});
}catch(error){
 report.result='failed';report.error=String(error);phase='containing-error';await save();
 if(armed&&!windowClosed){try{await cap({action:'close-write-window',windowToken:owner.windowToken});owner.windowClosed=true;windowClosed=true;await save();}catch(e){report.closeError=String(e);}}
 // Never release a partial/unknown adoption or clear a pending ticket.
 try{const b=await cap();if(b.writeTracking.pending===0&&owner.fenceToken){await cap({action:'acquire-write-drain',fenceToken:owner.fenceToken,drainToken:owner.drainToken});owner.sealReleased=false;await save();}report.failurePending=b.writeTracking.pending;}catch(e){report.sealError=String(e);}
 phase='failed-contained-review-required';await save();
}finally{
 if(observer)report.observer=await observer.stop();report.at=new Date().toISOString();await writeFile(prefix+'result.json',JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({result:report.result,phase:owner.phase,chargedBytes:report.chargedBytes,chargedPuts:report.chargedPuts,after:report.after,error:report.error,observerStopped:report.observer?.ended}));
}
if(report.result!=='pass')process.exitCode=1;
