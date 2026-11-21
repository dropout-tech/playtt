// One post-redeploy native GET. A 90-second/1-byte/1-operation window
// admits PHP while preventing any ordinary persistence payload. Never deploy.
import assert from 'node:assert/strict';
import {readFile,writeFile,access} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
const mode=process.argv[2];assert.ok(['check','exercise','contain'].includes(mode));assert.ok(mode==='check'||process.argv.includes('--remote'));
const load=async p=>JSON.parse(await readFile(p,'utf8')),prefix='artifacts/playtt-content-provider-cold-';
const save=(suffix,v)=>writeFile(prefix+suffix,JSON.stringify(v,null,2)+'\n');
const previous=await load('artifacts/playtt-content-provider-owned-private.json'),backup=await load('artifacts/playtt-content-provider-backup-owned-private.json'),verified=await load('artifacts/playtt-content-provider-backup-result.json');
assert.equal(previous.phase,'closed-sealed');assert.equal(backup.phase,'verified');assert.equal(verified.result,'pass');assert.equal(verified.finalPins,10);assert.equal(verified.canonicalVersion,126);
const limits={durationSeconds:90,maxBytes:1,maxOperations:1,nativeRequests:1};
if(mode==='check'){console.log(JSON.stringify({result:'local-preflight-pass',baseline:126,pins:10,limits,networkCalls:0}));process.exit(0);}
const secrets=await load('../../../playtt-cms-secrets.json'),origin='https://playtt-wp-free-session-audit.muzhi-garden-platform.workers.dev';let owner;
async function request(path,body){return fetch(origin+path,{method:body?'POST':'GET',body:body?JSON.stringify(body):undefined,headers:{'X-Playtt-Probe':secrets.WORDPRESS_OPERATOR_TOKEN,authorization:'Bearer '+secrets.WORDPRESS_OPERATOR_TOKEN,'content-type':'application/json'},signal:AbortSignal.timeout(45000),redirect:'error'});}
async function json(path,body){const r=await request(path,body);assert.equal(r.status,200);return r.json();}
const op=(phase,body)=>json('/?phase=operator-'+phase,body),cap=body=>json('/__playtt-capacity',body);
async function state(){const [s,b,p,pub]=await Promise.all([op('fence-status'),cap(),json('/__playtt-backup-pins'),json('/__playtt-publishing')]);assert.equal(s.coherent,true);assert.equal(pub.state,'paused');return {state:s.state,budget:b,pins:p.generation,fenceActive:s.fence.active,publisher:pub.state};}
async function fence(){const v=await op('fence-acquire',{ttlSeconds:600});owner.fenceToken=v.token;owner.fenceReleased=false;await save('owned-private.json',owner);}
async function release(){await op('fence-release',{token:owner.fenceToken});owner.fenceReleased=true;await save('owned-private.json',owner);}
async function contain(){owner.phase='closing';await save('owned-private.json',owner);await cap({action:'close-write-window',windowToken:owner.windowToken});owner.windowClosed=true;
 const s=await state();assert.equal(s.budget.writeTracking.pending,0);if(s.fenceActive)assert.equal(owner.fenceReleased,false);else await fence();
 const sealed=await cap({action:'acquire-write-drain',fenceToken:owner.fenceToken,drainToken:owner.drainToken});assert.equal(sealed.writeTracking.sealed,true);assert.equal(sealed.writeTracking.pending,0);owner.sealReleased=false;await release();owner.phase='closed-sealed';await save('owned-private.json',owner);return state();}
if(mode==='contain'){owner=await load(prefix+'owned-private.json');assert.equal(owner.origin,origin);await contain();console.log(JSON.stringify({result:'contained'}));process.exit(0);}
try{await access(prefix+'owned-private.json');throw Error('Existing cold attempt; inspect instead of replaying');}catch(e){if(e.code!=='ENOENT')throw e;}
const before=await state();assert.equal(before.state.version,126);assert.equal(before.state.pointer.revision,backup.anchor.revision);assert.equal(before.pins,10);assert.equal(before.fenceActive,false);assert.equal(before.budget.writeTracking.pending,0);assert.equal(before.budget.writeTracking.sealed,true);assert.equal(before.budget.writeTracking.window.closed,true);assert.equal(before.budget.remainingBytes,6604978);
owner={...previous,origin,phase:'preparing-cold',expectedBefore:{...previous.expectedBefore,content:previous.expectedContent},baseline:backup.anchor,baselineDirectory:backup.directory+'/independent',windowToken:randomUUID(),previousWindowToken:previous.windowToken,drainToken:previous.drainToken,fenceReleased:true,windowClosed:false,sealReleased:false};await writeFile(prefix+'owned-private.json',JSON.stringify(owner,null,2)+'\n',{flag:'wx'});
const report={at:new Date().toISOString(),result:'pending',scope:'Post-redeploy native login-form GET under a 1-byte window; cold hydration requires matching provider trace',limits,before};let failed=false;
try{
 await fence();await cap({action:'arm-write-window',fenceToken:owner.fenceToken,drainToken:owner.drainToken,windowToken:owner.windowToken,previousWindowToken:owner.previousWindowToken,...limits});
 await cap({action:'release-write-drain',fenceToken:owner.fenceToken,drainToken:owner.drainToken});owner.sealReleased=true;await release();owner.phase='native-cold-read';await save('owned-private.json',owner);
 const at=Date.now(),response=await fetch(origin+'/wp-login.php',{method:'GET',headers:{'X-Playtt-Probe':secrets.WORDPRESS_OPERATOR_TOKEN},signal:AbortSignal.timeout(45000),redirect:'error'});report.httpStatus=response.status;assert.equal(response.status,200);const html=await response.text();assert.ok(html.includes('id="loginform"'));report.nativeLoginForm=true;report.wallMs=Date.now()-at;report.bodyBytes=Buffer.byteLength(html);report.result='pass';
}catch(e){failed=true;report.result='fail';report.errorName=e.name;}
finally{
 try{report.after=await contain();assert.deepEqual(report.after.state,before.state);assert.equal(report.after.pins,10);assert.equal(report.after.budget.chargedBytes,before.budget.chargedBytes);assert.equal(report.after.budget.chargedPuts,before.budget.chargedPuts);assert.equal(report.after.budget.writeTracking.window.operations,0);assert.equal(report.after.budget.writeTracking.window.usedBytes,0);report.contained=true;report.stateAndAccountingUnchanged=true;}catch(e){report.contained=false;report.containmentErrorName=e.name;failed=true;}
 report.finishedAt=new Date().toISOString();await save('result.json',report);console.log(JSON.stringify({result:report.result,contained:report.contained,wallMs:report.wallMs,httpStatus:report.httpStatus,stateAndAccountingUnchanged:report.stateAndAccountingUnchanged}));if(failed)process.exitCode=1;
}
