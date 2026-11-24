// Single private native-browser trial. Owns deployment, bounded window and recovery.
// WordPress content requests are made only by the native Browser UI.
import assert from 'node:assert/strict';
import {readFile,writeFile,rename,access,unlink} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {basename,resolve} from 'node:path';
import {createHash,randomUUID} from 'node:crypto';
import {setTimeout as delay} from 'node:timers/promises';
import {startPlayttProviderObserver} from './playtt-native-trace-observer.mjs';
import {readNativeTrialState} from './playtt-native-approved-state.mjs';
const mode=process.argv[2];assert.ok(['check','run'].includes(mode));
const preparation='artifacts/playtt-visual-cloud-next-',prefix='artifacts/playtt-visual-cloud-next-',load=async p=>JSON.parse(await readFile(p,'utf8')),sha=b=>createHash('sha256').update(b).digest('hex');
const plan=await load(preparation+'plan-private.json');
const preflightPath=process.argv.find(x=>x.startsWith('--preflight='))?.slice(12)||plan.preflight;
const freePath=process.argv.find(x=>x.startsWith('--free='))?.slice(7)||preparation+'free-before.json';
assert.match(preflightPath,/^artifacts\/playtt-visual-cloud-next-[a-z0-9-]+-preflight-state-private\.json$/);
assert.match(freePath,/^artifacts\/playtt-visual-cloud-next-[a-z0-9-]+\.json$/);
const fresh=await load(preflightPath),previous=await load(plan.previousOwner),free=await load(freePath);
assert.equal(plan.worker,'playtt-wp-free-session-audit');assert.equal(plan.account,'3baadbd4abd9fd63c7f7e51664b26f67');assert.equal(plan.newLimitBytes,152000000);assert.equal(plan.oldLimitBytes,152000000);assert.equal(plan.fixture.id,193);
assert.deepEqual(plan.limits,{durationSeconds:600,maxBytes:1050000,maxOperations:96,observerSeconds:660});
for(const [name,v]of Object.entries(plan.variants)){
 assert.equal(sha(await readFile(v.config)),v.configSha256);for(const m of v.modules){assert.equal(sha(await readFile(m.path)),m.sha256);assert.equal(sha(await readFile(preparation+name+'-dryrun/'+basename(m.path))),m.sha256);}
}
if(mode==='check'){console.log(JSON.stringify({result:'pass',sixCandidateAndFallbackModulesExact:true,networkCalls:0,limits:plan.limits}));process.exit(0);}
assert.ok(process.argv.includes('--remote'));
const approval=await load(preparation+'authorization-private.json');
assert.equal(approval.authorized,true,'A new explicit user authorization is required');
assert.equal(approval.planSha256,sha(await readFile(preparation+'plan-private.json')));
assert.equal(approval.controllerSha256,sha(await readFile(new URL(import.meta.url))));
assert.equal(approval.scope,'one-private-visual-trial-600s-1050000bytes-96puts');
assert.ok(typeof approval.userReply==='string'&&approval.userReply.length>0);
assert.equal(previous.phase,'closed-sealed-compatible-reader');
assert.equal(fresh.state.version,201);assert.equal(fresh.budget.limitBytes,152000000);assert.equal(fresh.budget.remainingBytes,1067374);
assert.ok(Date.now()-Date.parse(fresh.at)<3600000);assert.ok(Date.now()-Date.parse(free.at)<3600000);assert.equal(free.workers.plan,'Free');assert.equal(free.r2.billableUsd,0);
const cliEnv={...process.env,XDG_CONFIG_HOME:resolve('../../../playtt-wrangler-config'),WRANGLER_SEND_METRICS:'false'};
await access(prefix+'ui-owned-private.json').then(()=>{throw Error('Existing attempt: never replay');},e=>{if(e.code!=='ENOENT')throw e;});
const secret=await load('../../../playtt-cms-secrets.json'),oauth=()=>readFile('../../../playtt-wrangler-config/.wrangler/config/default.toml','utf8').then(s=>s.match(/^oauth_token\s*=\s*"([^"\r\n]+)"/m)?.[1]);
const origin='https://playtt-wp-free-session-audit.muzhi-garden-platform.workers.dev',api='https://api.cloudflare.com/client/v4/accounts/'+plan.account+'/workers/scripts/'+plan.worker;
const owner={phase:'preparing',origin,preflightPath,freePath,windowToken:randomUUID(),previousWindowToken:previous.windowToken,drainToken:previous.drainToken,fenceReleased:true,sealReleased:false,windowClosed:true,windowArmed:false,armAttempted:false,deploymentAttempts:[],fixture:plan.fixture,baseline:plan.baseline,baselineDirectory:plan.baselineDirectory,limits:plan.limits};
await writeFile(prefix+'ui-owned-private.json',JSON.stringify(owner,null,2)+'\n',{flag:'wx'});
const report={schema:'playtt/native-next-ui/v1',at:new Date().toISOString(),result:'pending',limits:plan.limits,baselineVersion:201,oldLimitBytes:152000000,newLimitBytes:152000000,checks:[],steps:[],deployments:[],productionChanged:false,fullBackendAccepted:false};
const save=async (suffix,value)=>{const path=prefix+suffix,tmp=path+'.tmp';await writeFile(tmp,JSON.stringify(value,null,2)+'\n');await rename(tmp,path);};
const persist=()=>save('ui-owned-private.json',owner);
async function json(path,body){
 assert.ok(['/?phase=operator-fence-acquire','/?phase=operator-fence-renew','/?phase=operator-fence-release','/?phase=r2-state','/?phase=operator-fence-status','/__playtt-capacity','/__playtt-backup-pins','/__playtt-publishing'].includes(path));
 const r=await fetch(origin+path,{method:body?'POST':'GET',headers:{authorization:'Bearer '+secret.WORDPRESS_OPERATOR_TOKEN,'X-Playtt-Probe':secret.WORDPRESS_OPERATOR_TOKEN,'content-type':'application/json'},body:body?JSON.stringify(body):undefined,redirect:'error',signal:AbortSignal.timeout(45000)});report.checks.push({at:new Date().toISOString(),path,method:body?'POST':'GET',status:r.status});assert.equal(r.status,200,path);return r.json();
}
const op=(p,b)=>json('/?phase=operator-'+p,b),cap=b=>json('/__playtt-capacity',b);
async function pointer(){const token=await oauth();const r=await fetch('https://api.cloudflare.com/client/v4/accounts/'+plan.account+'/r2/buckets/'+plan.bucket+'/objects/'+encodeURIComponent('sites/default/markdown/current.json'),{headers:{authorization:'Bearer '+token},redirect:'error',signal:AbortSignal.timeout(45000)});assert.equal(r.status,200);const reader=r.body.getReader(),parts=[];let size=0;try{for(;;){const n=await reader.read();if(n.done)break;size+=n.value.length;assert.ok(size<=1024);parts.push(n.value);}}finally{reader.releaseLock();}return JSON.parse(Buffer.concat(parts).toString());}
async function state(mode='native',expectedState){return readNativeTrialState({mode,expectedState,fenceHeld:!owner.fenceReleased,control:json,readPointer:pointer,expectedPins:fresh.pins});}
async function fence(){const f=await op('fence-acquire',{ttlSeconds:600});owner.fenceToken=f.token;owner.fenceReleased=false;await persist();}
async function renew(){await op('fence-renew',{token:owner.fenceToken,ttlSeconds:600});}
async function release(){await op('fence-release',{token:owner.fenceToken});owner.fenceReleased=true;await persist();}
async function seal(){let b=await cap();const until=Date.now()+45000;while(b.writeTracking.pending>0&&Date.now()<until){await delay(1000);b=await cap();}assert.equal(b.writeTracking.pending,0,'Unknown pending tickets: never clear');if(owner.fenceReleased)await fence();else await renew();b=await cap({action:'acquire-write-drain',fenceToken:owner.fenceToken,drainToken:owner.drainToken});assert.equal(b.writeTracking.sealed,true);assert.equal(b.writeTracking.pending,0);owner.sealReleased=false;await persist();return b;}
async function provider(path){const r=await fetch(api+path,{headers:{authorization:'Bearer '+await oauth()},redirect:'error',signal:AbortSignal.timeout(45000)});assert.equal(r.status,200);return r;}
async function verify(name){
 const v=plan.variants[name],s=await(await provider('/settings')).json(),d=await(await provider('/deployments')).json();assert.equal(s.success,true);assert.equal(d.success,true);const head=d.result.deployments[0];assert.equal(head.versions.length,1);assert.equal(head.versions[0].percentage,100);
 const expected=fresh.settings.bindings.filter(x=>x.type!=='plain_text'||!(x.name in v.expectedVars));for(const [key,text]of Object.entries(v.expectedVars))expected.push({name:key,type:'plain_text',text});
 const sorted=x=>[...x].sort((a,b)=>a.name.localeCompare(b.name));assert.deepEqual(sorted(s.result.bindings),sorted(expected));for(const k of ['compatibility_date','compatibility_flags','usage_model','limits'])assert.deepEqual(s.result[k],fresh.settings[k]);
 const response=await provider('/content/v2');assert.match(response.headers.get('content-type'),/^multipart\//);const reader=response.body.getReader(),parts=[];let size=0;try{for(;;){const n=await reader.read();if(n.done)break;size+=n.value.length;assert.ok(size<=25000000);parts.push(n.value);}}finally{reader.releaseLock();}
 const form=await new Response(Buffer.concat(parts),{headers:{'content-type':response.headers.get('content-type')}}).formData(),modules=[];for(const [n,b]of form){const bytes=new Uint8Array(await b.arrayBuffer());modules.push({name:n,bytes:bytes.length,sha256:sha(bytes)});}assert.deepEqual(sorted(modules),sorted(v.modules.map(m=>({name:basename(m.path),bytes:m.bytes,sha256:m.sha256}))));
 return {version:head.versions[0].version_id,modulesExact:6,bindingsExact:true,namespaceIdsExact:true,variant:name};
}
async function deploy(name,label){
 await renew();const v=plan.variants[name];assert.equal(sha(await readFile(v.config)),v.configSha256);owner.deploymentAttempts.push({name,label,at:new Date().toISOString()});await persist();
 const child=spawn(process.execPath,['node_modules/wrangler/bin/wrangler.js','deploy','--config',v.config,'--no-bundle'],{stdio:['ignore','pipe','pipe'],env:cliEnv,windowsHide:true});let log='';child.stdout.on('data',b=>log+=b);child.stderr.on('data',b=>log+=b);const timeout=setTimeout(()=>child.kill(),180000);let code;try{code=await new Promise((res,rej)=>{child.once('error',rej);child.once('close',res);});}finally{clearTimeout(timeout);await writeFile(prefix+label+'-deploy-private.log',log,{flag:'wx'});}assert.equal(code,0,'Private deployment failed');const checked=await verify(name);report.deployments.push({label,...checked});await save('ui-progress.json',report);return checked.version;
}
let observer,failed=false;
try{
 const before=await state('full');assert.deepEqual(before.state,fresh.state);assert.deepEqual(before.budget,fresh.budget);report.before=before;await fence();await seal();
 owner.phase='deploying';await persist();owner.version=await deploy('candidate','initial');await persist();
 const configured=await state('held',before.state);assert.deepEqual(configured.state,before.state);for(const k of ['baselineBytes','baselineObjects','chargedBytes','chargedPuts','initializedAt','limitBytes','remainingBytes'])assert.equal(configured.budget[k],before.budget[k]);assert.equal(configured.budget.writeTracking.sealed,true);assert.equal(configured.budget.limitBytes,152000000);assert.equal(configured.budget.remainingBytes,1067374);report.afterConfig=configured;
 observer=await startPlayttProviderObserver({expectedVersion:owner.version,prefix:prefix.slice(0,-1)+'-ui-tail',spawnProcess:(file,args,options)=>spawn(file,args,{...options,env:cliEnv,windowsHide:true})});const until=Date.now()+45000;
 while(!await observer.ready()){assert.ok(Date.now()<until,'Observer readiness timeout');await renew();await delay(1500);}observer.assertLive(615000);
 owner.armAttempted=true;await persist();const armed=await cap({action:'arm-write-window',fenceToken:owner.fenceToken,drainToken:owner.drainToken,windowToken:owner.windowToken,previousWindowToken:owner.previousWindowToken,durationSeconds:600,maxBytes:1050000,maxOperations:96});owner.windowArmed=true;owner.windowClosed=false;owner.expiresAt=armed.writeTracking.window.expiresAt;await persist();
 await cap({action:'release-write-drain',fenceToken:owner.fenceToken,drainToken:owner.drainToken});owner.sealReleased=true;await persist();await release();owner.phase='browser-ready';await persist();await save('ui-progress.json',report);console.log(JSON.stringify({result:'browser-ready',version:owner.version,expiresAt:owner.expiresAt}));
 let done=false;while(!done&&Date.now()<owner.expiresAt-30000){
  observer.assertLive(20000);let cmd;try{cmd=await load(prefix+'ui-command-private.json');}catch(e){if(e.code!=='ENOENT')throw e;}
  if(cmd){assert.match(cmd.id||'',/^[a-f0-9-]{36}$/);assert.ok(['guard','saved','restart','cold','finish'].includes(cmd.action));let value;
   try{
    if(cmd.action==='finish'){done=true;value={result:'finishing'};}
    else{const s=await state();assert.equal(s.budget.writeTracking.sealed,false);assert.equal(s.budget.writeTracking.window.closed,false);assert.ok(Date.now()+30000<owner.expiresAt);if(cmd.action==='guard')assert.ok(s.budget.writeTracking.window.remainingBytes>=650000);
     if(cmd.action==='restart'){assert.equal(owner.restarted,undefined);assert.ok(Date.now()+180000<owner.expiresAt);assert.ok(s.budget.writeTracking.window.remainingBytes>=350000);await fence();owner.coldState=(await state()).state;await seal();owner.coldVersion=await deploy('candidate','restart');const observedUntil=Date.now()+30000;while(!await observer.observedVersion(owner.coldVersion)){assert.ok(Date.now()<observedUntil);await renew();await delay(1000);}const after=await state('held',owner.coldState);assert.deepEqual(after.state,owner.coldState);assert.equal(after.budget.writeTracking.pending,0);await cap({action:'release-write-drain',fenceToken:owner.fenceToken,drainToken:owner.drainToken});owner.sealReleased=true;await persist();assert.deepEqual((await state()).state,owner.coldState);await release();owner.restarted=true;await persist();}
     value={result:'live',action:cmd.action,canonicalVersion:s.state.version,remainingBytes:s.budget.writeTracking.window.remainingBytes,remainingMs:owner.expiresAt-Date.now(),restarted:owner.restarted===true};report.steps.push({action:cmd.action,...s});
    }
    await save('ui-reply-private.json',{id:cmd.id,ok:true,value});
   }catch(e){await save('ui-reply-private.json',{id:cmd.id,ok:false,error:{name:e.name,message:e.message}});throw e;}
   await unlink(prefix+'ui-command-private.json');await save('ui-progress.json',report);
  }if(!done)await delay(250);
 }
 report.result=done?'browser-finished-awaiting-independent-verification':'window-ending';
}catch(e){failed=true;report.result='fail';report.errorName=e.name;owner.failure={phase:owner.phase,name:e.name,message:e.message};await persist();}
finally{
 try{owner.phase='closing';await persist();if(owner.armAttempted&&!owner.windowClosed){try{await cap({action:'close-write-window',windowToken:owner.windowToken});owner.windowClosed=true;await persist();}catch(e){const b=await cap();assert.equal(b.writeTracking.window.id,fresh.budget.writeTracking.window.id);assert.equal(b.writeTracking.window.closed,true);assert.equal(b.writeTracking.sealed,true);owner.windowClosed=true;await persist();}}await seal();report.contained=true;}catch(e){report.contained=false;owner.containmentFailure={name:e.name,message:e.message};failed=true;await persist();}
 if(observer){try{observer.assertLive(6000);await delay(5000);report.observer=await observer.stop();}catch(e){report.observerError=e.name;try{report.observer=await observer.stop();}catch{}failed=true;}}
 if(report.contained){try{if(owner.deploymentAttempts.length){owner.finalVersion=await deploy('fallback','restore');report.restored=true;}else report.restored=false;report.after=await state('full');assert.equal(report.after.budget.writeTracking.pending,0);assert.equal(report.after.budget.writeTracking.sealed,true);assert.equal(report.after.budget.writeTracking.window.closed,true);report.chargedBytes=report.after.budget.chargedBytes-fresh.budget.chargedBytes;report.chargedPuts=report.after.budget.chargedPuts-fresh.budget.chargedPuts;assert.ok(report.chargedBytes<=1050000);await release();owner.phase='closed-sealed-compatible-reader';await persist();}catch(e){failed=true;owner.restorationFailure={name:e.name,message:e.message};report.restorationError=e.name;await persist();}}
 report.finishedAt=new Date().toISOString();await save('ui-result.json',report);console.log(JSON.stringify({result:report.result,contained:report.contained,restored:report.restored,canonicalVersion:report.after?.state.version,chargedBytes:report.chargedBytes,chargedPuts:report.chargedPuts,finalVersion:owner.finalVersion}));if(failed)process.exitCode=1;
}
