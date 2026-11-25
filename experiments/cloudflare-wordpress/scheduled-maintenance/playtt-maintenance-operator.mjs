// Run from runtime-cloudflare. This tool is deliberately fixed to the private audit.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {validatePlayttMaintenanceResult} from '../src/playtt-maintenance.ts';

const args=process.argv.slice(2);
if(args.length!==1||!['status','preview','run'].includes(args[0])) {
  console.error('Usage: node scripts/playtt-maintenance-operator.mjs status|preview|run');
  process.exit(2);
}
const action=args[0],origin='https://playtt-wp-free-restore-audit.muzhi-garden-platform.workers.dev';
const config=JSON.parse(await readFile('wrangler.playtt-retirement-restore-audit.jsonc','utf8'));
assert.equal(config.name,'playtt-wp-free-restore-audit');
assert.equal(config.vars.PLAYTT_STATE_PARTITION,'restore-v1');
const secret=JSON.parse(await readFile('../../../playtt-cms-secrets.json','utf8')).WORDPRESS_OPERATOR_TOKEN;
assert.ok(typeof secret==='string'&&secret.length>=32);
async function request(path,body) {
  const response=await fetch(origin+path,{
    method:body?'POST':'GET',redirect:'manual',signal:AbortSignal.timeout(120000),
    headers:{'x-playtt-probe':secret,authorization:'Bearer '+secret,'content-type':'application/json'},
    body:body?JSON.stringify(body):undefined,
  });
  assert.equal(response.headers.get('x-playtt-probe-state'),'restore-v1','Unexpected state partition');
  if(response.status!==200){await response.body?.cancel();throw Error('Private maintenance request returned HTTP '+response.status+'; no automatic retry.');}
  return {response,value:await response.json()};
}
assert.equal((await request('/__playtt-publishing')).value.state,'paused','This operator tool requires paused publishing');
if(action==='status') {
  const {value}=await request('/?phase=operator-fence-status');
  console.log(JSON.stringify({at:new Date().toISOString(),action,worker:config.name,publisher:'paused',coherent:value.coherent,fenceActive:value.fence.active,revision:value.state.pointer?.revision??null,version:value.state.version,configuredCron:config.vars.PLAYTT_MAINTENANCE_CRON??null,cronSource:'Local deployment configuration; not proof of a remote invocation'}));
} else {
  // preview does not delete, but can commit previously pending canonical GET state.
  const {response,value}=await request('/?phase=operator-auto-draft-maintenance',{action});
  validatePlayttMaintenanceResult(value,action);
  const version=Number(response.headers.get('x-wp-codebox-canonical-version'));
  const revision=response.headers.get('x-wp-codebox-canonical-revision');
  assert.ok(Number.isSafeInteger(version)&&version>0&&/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(revision??''),'Missing commit receipt');
  console.log(JSON.stringify({at:new Date().toISOString(),action,worker:config.name,publisher:'paused',batchLimit:value.batchLimit,eligibleBefore:value.eligibleBefore,selected:value.selectedIds.length,deleted:value.deletedIds.length,remainingEligible:value.remainingEligible,skipped:value.skippedIds.length,revision,version}));
}
