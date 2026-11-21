import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {backupPinInput} from '../src/playtt-backup-pins.ts';
assert.ok(process.argv.includes('--remote'));
const load=async p=>JSON.parse(await readFile(p,'utf8')),secrets=await load('../../../playtt-cms-secrets.json');
const origin='https://playtt-wp-free-session-audit.muzhi-garden-platform.workers.dev',old='https://playtt-wp-free-window-audit.muzhi-garden-platform.workers.dev';
const paths=['/?phase=operator-fence-status','/__playtt-capacity','/__playtt-backup-pins','/__playtt-publishing'];
async function read(host,path){assert.ok([origin,old].includes(host)&&paths.includes(path));const r=await fetch(host+path,{headers:{authorization:'Bearer '+secrets.WORDPRESS_OPERATOR_TOKEN,'X-Playtt-Probe':secrets.WORDPRESS_OPERATOR_TOKEN},redirect:'error',signal:AbortSignal.timeout(45000)});assert.equal(r.status,200);return r.json();}
async function inspect(host){const [state,budget,pins,publisher]=await Promise.all(paths.map(p=>read(host,p)));assert.equal(state.coherent,true);assert.equal(state.fence.active,false);assert.equal(budget.writeTracking.pending,0);assert.equal(budget.writeTracking.sealed,true);assert.equal(budget.writeTracking.window.closed,true);assert.equal(publisher.state,'paused');return {state:state.state,budget,pins,publisher:publisher.state};}
const latest=await load('artifacts/playtt-session-logout-result.json');assert.equal(latest.result,'pass');assert.equal(latest.coldLogoutRevocationValidated,true);assert.equal(latest.persistedTokenRemoved,true);
const current=await inspect(origin),previous=await inspect(old),baseline=await load('artifacts/playtt-usermeta-overlay-provider-source-status.json');
assert.deepEqual(current.state,latest.finalState);assert.equal(current.budget.chargedBytes,latest.finalBudget.chargedBytes);assert.equal(current.pins.generation,5);
assert.deepEqual(previous.state,baseline.state);assert.deepEqual(previous.budget,baseline.budget);assert.equal(previous.pins.generation,8);
const anchors=[(await load('artifacts/playtt-session-provider-prepared.json')).selectedPin];
for(const file of ['artifacts/playtt-session-native-verified-result.json','artifacts/playtt-session-logout-result.json'])anchors.push(...(await load(file)).snapshots.map(s=>s.anchor));
assert.equal(anchors.length,5);assert.equal(current.pins.pins.length,5);
for(const a of anchors)assert.ok(current.pins.pins.some(p=>JSON.stringify(backupPinInput(p))===JSON.stringify(backupPinInput(a))),'Previously pinned identity missing');
const report={at:new Date().toISOString(),result:'pass',state:current.state,budget:current.budget,pins:current.pins.generation,allFivePinIdentitiesRetained:true,publisher:current.publisher,pending:0,writeSealed:true,windowClosed:true,fenceActive:false,oldTarget:{version:previous.state.version,pins:previous.pins.generation,stateAndBudgetUnchanged:true,writeSealed:true,windowClosed:true,fenceActive:false,publisher:previous.publisher},remoteMutations:0};
await writeFile('artifacts/playtt-session-final-status.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
