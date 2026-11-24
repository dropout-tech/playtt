// Release only the fence owned by the failed preflight. No native or R2 writes.
import assert from 'node:assert/strict';import {readFile,writeFile} from 'node:fs/promises';
assert.deepEqual(process.argv.slice(2),['--remote']);const prefix='artifacts/playtt-native-next-ui-',load=async p=>JSON.parse(await readFile(p,'utf8')),owner=await load(prefix+'owned-private.json'),fresh=await load('artifacts/playtt-native-approved-preflight-state-private.json');
assert.equal(owner.phase,'closing');assert.equal(owner.windowArmed,false);assert.equal(owner.armAttempted,false);assert.deepEqual(owner.deploymentAttempts,[]);assert.equal(owner.sealReleased,false);
const secret=await load('../../../playtt-cms-secrets.json'),origin=owner.origin;assert.equal(origin,'https://playtt-wp-free-session-audit.muzhi-garden-platform.workers.dev');const checks=[];
async function call(path,body){const r=await fetch(origin+path,{method:body?'POST':'GET',headers:{authorization:'Bearer '+secret.WORDPRESS_OPERATOR_TOKEN,'X-Playtt-Probe':secret.WORDPRESS_OPERATOR_TOKEN,'content-type':'application/json'},body:body?JSON.stringify(body):undefined,redirect:'error',signal:AbortSignal.timeout(45000)});checks.push({path,status:r.status});assert.equal(r.status,200);return r.json();}
const s=await call('/?phase=operator-fence-status'),b=await call('/__playtt-capacity');assert.equal(s.coherent,true);assert.deepEqual(s.state,fresh.state);assert.deepEqual(b,fresh.budget);
if(s.fence.active){assert.equal(owner.fenceReleased,false);await call('/?phase=operator-fence-release',{token:owner.fenceToken});}
const final=await call('/?phase=operator-fence-status');assert.equal(final.fence.active,false);assert.deepEqual(final.state,fresh.state);assert.equal(final.coherent,true);
const report={at:new Date().toISOString(),result:'failed-preflight-contained',canonicalVersion:181,limitBytes:150000000,remainingBytes:62344,chargedBytes:0,chargedPuts:0,windowArmed:false,sealed:true,windowClosed:true,pending:0,fenceActive:false,deployments:0,nativeRequests:0,checks};
await writeFile('artifacts/playtt-native-approved-preflight-cleanup.json',JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(report));
