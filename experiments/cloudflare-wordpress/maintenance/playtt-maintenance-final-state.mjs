import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
assert.ok(process.argv.includes('--remote'));
const origin='https://playtt-wp-free-restore-audit.muzhi-garden-platform.workers.dev';
const secret=JSON.parse(await readFile('../../../playtt-cms-secrets.json','utf8')).WORDPRESS_OPERATOR_TOKEN;
async function get(path){const r=await fetch(origin+path,{headers:{'x-playtt-probe':secret,authorization:'Bearer '+secret},signal:AbortSignal.timeout(90000)});assert.equal(r.status,200);assert.equal(r.headers.get('x-playtt-probe-state'),'restore-v1');return r.json();}
assert.equal((await get('/__playtt-publishing')).state,'paused');
const state=await get('/?phase=operator-fence-status');assert.equal(state.coherent,true);assert.equal(state.fence.active,false);
const report={at:new Date().toISOString(),result:'pass',revision:state.state.pointer.revision,publisherPaused:true,fenceInactive:true,coherent:true};
await writeFile('artifacts/playtt-maintenance-final-state.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
