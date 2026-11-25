// Fixed GET-only readback after recovery capability is disabled.
import assert from 'node:assert/strict';
import { readFile, writeFile, access } from 'node:fs/promises';
const version=process.argv.find(a=>a.startsWith('--version='))?.slice(10);assert.ok(process.argv.includes('--remote'));assert.match(version||'',/^[a-f0-9-]{36}$/);
const prefix='artifacts/playtt-old-provider-',output='artifacts/playtt-lazy-provider-final.json',load=async p=>JSON.parse(await readFile(p,'utf8'));
await access(output).then(()=>{throw Error('Final evidence exists; inspect before replay.');},e=>{if(e.code!=='ENOENT')throw e;});
const restored=await load('artifacts/playtt-lazy-provider-restored.json'),cold=await load('artifacts/playtt-lazy-provider-cold-result.json'),fresh=await load('artifacts/playtt-lazy-provider-preflight-state-private.json');assert.equal(restored.version,version);assert.equal(cold.contained,true);
const config=await load('wrangler.playtt-session-audit.jsonc'),run=await load(prefix+'native-result.json'),owner=await load(prefix+'owned-private.json'),before=await load(prefix+'preflight-state-private.json');
assert.equal(run.result,'pass');assert.equal(owner.phase,'verified-closed-sealed-compatible-reader');assert.equal(config.name,'playtt-wp-free-session-audit');assert.equal(config.account_id,'3baadbd4abd9fd63c7f7e51664b26f67');
const secret=await load('../../../playtt-cms-secrets.json'),oauth=(await readFile('../../../playtt-wrangler-config/.wrangler/config/default.toml','utf8')).match(/^oauth_token\s*=\s*"([^"\r\n]+)"/m)?.[1];assert.ok(oauth);
const origin='https://playtt-wp-free-session-audit.muzhi-garden-platform.workers.dev',api='https://api.cloudflare.com/client/v4/accounts/'+config.account_id,checks=[];
async function get(url,headers,expect=200){const r=await fetch(url,{headers,redirect:'error',signal:AbortSignal.timeout(45000)});checks.push({kind:url.startsWith(origin)?'operator':'provider',status:r.status});assert.equal(r.status,expect);return r;}
const op=async path=>(await get(origin+path,{authorization:'Bearer '+secret.WORDPRESS_OPERATOR_TOKEN,'X-Playtt-Probe':secret.WORDPRESS_OPERATOR_TOKEN})).json();
const provider=async path=>{const b=await(await get(api+'/workers/scripts/'+config.name+'/'+path,{authorization:'Bearer '+oauth})).json();assert.equal(b.success,true);return b.result;};
const settled=await Promise.allSettled([provider('settings'),provider('deployments'),op('/?phase=operator-fence-status'),op('/__playtt-capacity'),op('/__playtt-backup-pins'),op('/__playtt-publishing')]);for(const r of settled)assert.equal(r.status,'fulfilled');
const [settings,deploy,s,b,p,pub]=settled.map(r=>r.value),head=(Array.isArray(deploy)?deploy:deploy.deployments)[0];assert.deepEqual(head.versions,[{version_id:version,percentage:100}]);
for(const [name,value]of Object.entries(config.vars)){const binding=settings.bindings.find(x=>x.name===name);assert.equal(binding?.type,'plain_text');assert.equal(binding.text,value,name);}
for(const name of ['PLAYTT_RECOVERY_UPLOADS','PLAYTT_CONTENT_OVERLAY','PLAYTT_MANIFEST_ENCODING','PLAYTT_EDITOR_HEARTBEAT','PLAYTT_EDITOR_READBACK'])assert.equal(settings.bindings.some(x=>x.name===name),false,name);
assert.equal(settings.bindings.find(x=>x.name==='WORDPRESS_STATE_BUCKET')?.bucket_name,'playtt-wordpress-session-audit');
assert.equal(s.coherent,true);assert.equal(s.state.version,181);const pointer=Object.fromEntries(['revision','manifestKey','persistedAt'].map(k=>[k,owner.anchor[k]]));assert.deepEqual(s.state.pointer,pointer);assert.deepEqual(s.receipt,pointer);assert.equal(s.fence.active,false);
assert.equal(b.remainingBytes,run.after.remainingBytes);assert.equal(b.writeTracking.pending,0);assert.equal(b.writeTracking.sealed,true);assert.equal(b.writeTracking.window.closed,true);assert.equal(pub.state,'paused');assert.equal(p.generation,16);assert.deepEqual(p,fresh.pins);assert.equal(b.chargedBytes,fresh.budget.chargedBytes);assert.equal(b.chargedPuts,fresh.budget.chargedPuts);assert.equal(b.writeTracking.window.operations,0);assert.equal(b.writeTracking.window.usedBytes,0);
for(const pin of before.pins.pins)assert.ok(p.pins.some(x=>JSON.stringify(x)===JSON.stringify(pin)));
const raw=await get(api+'/r2/buckets/playtt-wordpress-session-audit/objects/'+encodeURIComponent('sites/default/markdown/current.json'),{authorization:'Bearer '+oauth});
const reader=raw.body.getReader(),chunks=[];let length=0;
try{while(true){const next=await reader.read();if(next.done)break;length+=next.value.length;assert.ok(length<=1024);chunks.push(next.value);}}catch(error){await reader.cancel().catch(()=>undefined);throw error;}finally{reader.releaseLock();}
assert.deepEqual(JSON.parse(Buffer.concat(chunks).toString('utf8')),pointer);
const disabled=await get(origin+'/__playtt-recovery/status?operationId=00000000-0000-0000-0000-000000000000',{authorization:'Bearer '+secret.WORDPRESS_OPERATOR_TOKEN,'X-Playtt-Probe':secret.WORDPRESS_OPERATOR_TOKEN},404);await disabled.body?.cancel();
const report={schema:'playtt/lazy-provider-final/v1',at:new Date().toISOString(),result:'pass',version,canonicalVersion:181,revision:pointer.revision,allExpectedBindingsExact:true,recoveryCapabilityDisabled:true,optionalWritersDisabled:true,
 pins:16,all16PinsExact:true,chargedBytes:0,chargedPuts:0,originalCodeRestored:true,bothPointersAndCommitReceiptExact:true,remainingBytes:b.remainingBytes,pending:0,sealed:true,windowClosed:true,fenceActive:false,publisher:pub.state,checks,remoteMutations:0,productionChanged:false};
await writeFile(output,JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(report));
