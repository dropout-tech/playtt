// Four read-only operator GETs. Never opens a window, invokes PHP or deploys.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
assert.deepEqual(process.argv.slice(2),['--remote-read-only']);
const load=async p=>JSON.parse(await readFile(p,'utf8'));
const secrets=await load('../../../playtt-cms-secrets.json');
const origin='https://playtt-wp-free-session-audit.muzhi-garden-platform.workers.dev';
const paths=['/?phase=operator-fence-status','/__playtt-capacity','/__playtt-backup-pins','/__playtt-publishing'];
const values=await Promise.all(paths.map(async path=>{
 const r=await fetch(origin+path,{method:'GET',headers:{authorization:'Bearer '+secrets.WORDPRESS_OPERATOR_TOKEN,'X-Playtt-Probe':secrets.WORDPRESS_OPERATOR_TOKEN},redirect:'error',signal:AbortSignal.timeout(45000)});
 assert.equal(r.status,200,path);return r.json();
}));
const [state,budget,pins,publishing]=values;
assert.equal(state.coherent,true);assert.equal(state.state.version,122);assert.equal(state.state.pointer.revision,'6883819c-8ca2-4e26-b899-433c83aa4eea');
assert.equal(state.fence.active,false);assert.equal(budget.writeTracking.pending,0);assert.equal(budget.writeTracking.sealed,true);assert.equal(budget.writeTracking.window.closed,true);
assert.equal(pins.generation,9);assert.equal(publishing.state,'paused');assert.equal(budget.chargedBytes,41989784);assert.equal(budget.remainingBytes,7271788);
const report={at:new Date().toISOString(),result:'pass',scope:'Read-only private operator state; no deployment, PHP requests or cloud writes',canonicalVersion:state.state.version,revision:state.state.pointer.revision,pins:pins.generation,chargedBytes:budget.chargedBytes,remainingBytes:budget.remainingBytes,pending:0,sealed:true,closed:true,fenceActive:false,publisher:'paused',requests:4};
await writeFile('artifacts/playtt-content-overlay-remote-status.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
