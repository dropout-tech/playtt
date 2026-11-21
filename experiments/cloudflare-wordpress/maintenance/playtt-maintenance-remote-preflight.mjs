import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
assert.ok(process.argv.includes('--remote'));
const origin='https://playtt-wp-free-restore-audit.muzhi-garden-platform.workers.dev';
const secret=JSON.parse(await readFile('../../../playtt-cms-secrets.json','utf8')).WORDPRESS_OPERATOR_TOKEN;
const headers={'x-playtt-probe':secret,authorization:'Bearer '+secret};
const config=JSON.parse(await readFile('wrangler.playtt-retirement-restore-audit.jsonc','utf8'));
assert.equal(config.name,'playtt-wp-free-restore-audit');assert.equal(config.main,'src/worker-playtt-do.ts');assert.equal(config.vars.PLAYTT_STATE_PARTITION,'restore-v1');assert.equal(config.r2_buckets[0].bucket_name,'playtt-wordpress-retirement-audit');assert.ok(!config.routes?.length&&!config.triggers?.crons?.length);
async function get(path){const r=await fetch(origin+path,{headers,signal:AbortSignal.timeout(90000)});assert.equal(r.status,200);assert.equal(r.headers.get('x-playtt-probe-state'),'restore-v1');return r.json();}
assert.equal((await get('/__playtt-publishing')).state,'paused');
const state=await get('/?phase=operator-fence-status');assert.equal(state.coherent,true);assert.equal(state.fence.active,false);
const location=JSON.parse(await readFile('../../../playtt-snapshot-audit-backup-location.json','utf8'));
const backup=JSON.parse(await readFile(location.directory+'/state.json','utf8'));assert.deepEqual(state.state.pointer,backup.state.pointer,'Existing complete verified backup must match current pointer before deployment');
const report={at:new Date().toISOString(),result:'pass',scope:'Read-only private audit preflight; no production route or cron in the chosen config',revision:state.state.pointer.revision,publisherPaused:true,backupPointerMatches:true,fenceInactive:true};
await writeFile('artifacts/playtt-maintenance-remote-preflight.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
