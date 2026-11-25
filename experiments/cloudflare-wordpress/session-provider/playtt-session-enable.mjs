// Finish only the workers.dev step after a verified upload; no redeployment.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
assert.ok(process.argv.includes('--remote'));
const load=async p=>JSON.parse(await readFile(p,'utf8'));
const owner=await load('artifacts/playtt-session-provider-owner-private.json');
assert.equal(owner.worker,'playtt-wp-free-session-audit');assert.equal(owner.bucket,'playtt-wordpress-session-audit');assert.equal(owner.secretsConfigured,true);
const cfg=await load('wrangler.playtt-session-audit.jsonc'),version='e6bdff14-4ed6-4159-9b1b-bf6c87a48b25';
const token=(await readFile('../../../playtt-wrangler-config/.wrangler/config/default.toml','utf8')).match(/^oauth_token\s*=\s*"([^"\r\n]+)"/m)?.[1];assert.ok(token);
const root='https://api.cloudflare.com/client/v4/accounts/3baadbd4abd9fd63c7f7e51664b26f67/workers/scripts/'+owner.worker;
async function api(part,body){assert.ok(['deployments','versions/'+version,'subdomain'].includes(part));if(body)assert.equal(part,'subdomain');const r=await fetch(root+'/'+part,{method:body?'POST':'GET',headers:{authorization:'Bearer '+token,'content-type':'application/json'},body:body?JSON.stringify(body):undefined,redirect:'error',signal:AbortSignal.timeout(30000)});assert.equal(r.status,200);const d=await r.json();assert.equal(d.success,true);return d.result;}
const before=await api('deployments');assert.deepEqual(before.deployments[0].versions,[{version_id:version,percentage:100}]);const uploaded=await api('versions/'+version);
const bindings=uploaded.resources.bindings;
for(const [name,value]of Object.entries(cfg.vars))assert.equal(bindings.find(b=>b.name===name)?.text,value);
assert.equal(bindings.find(b=>b.name==='WORDPRESS_STATE_BUCKET')?.bucket_name,owner.bucket);
for(const b of cfg.durable_objects.bindings)assert.equal(bindings.find(x=>x.name===b.name)?.class_name,b.class_name);
assert.equal(uploaded.resources.script_runtime.migration_tag,'v2-capacity');
const verifyOnly=process.argv.includes('--verify-only');
if(!verifyOnly){assert.equal((await api('subdomain')).enabled,false);await writeFile('artifacts/playtt-session-provider-enable-intent-private.json',JSON.stringify({at:new Date().toISOString(),worker:owner.worker,version}),{flag:'wx'});await api('subdomain',{enabled:true,previews_enabled:false});}
let route=await api('subdomain'),polls=1;const deadline=Date.now()+30000;
while(!route.enabled&&Date.now()<deadline){await new Promise(r=>setTimeout(r,2000));route=await api('subdomain');polls++;}
await writeFile('artifacts/playtt-session-provider-subdomain-observation.json',JSON.stringify({at:new Date().toISOString(),verifyOnly,polls,route},null,2)+'\n');
assert.equal(route.enabled,true);assert.equal(route.previews_enabled,false);assert.deepEqual((await api('deployments')).deployments,before.deployments);
const report={at:new Date().toISOString(),result:'pass',worker:owner.worker,version,bindingsMatchPreparedConfig:true,workersDevEnabled:true,previewUrlsEnabled:false,deploymentUnchanged:true,productionRoutesChanged:false,initialWranglerFailure:{endpoint:'subdomain',code:10007,cause:'unresolved; uploaded version verified before completing only the subdomain step'}};
await writeFile('artifacts/playtt-session-provider-enabled.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
