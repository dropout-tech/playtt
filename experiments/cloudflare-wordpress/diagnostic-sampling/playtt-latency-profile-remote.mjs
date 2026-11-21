import assert from 'node:assert/strict';
import {readFile,writeFile,access} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {origin,privateClient} from './playtt-private-client.mjs';
assert.ok(process.argv.includes('--remote'));assert.ok(process.argv.includes('--capture'));const retry=process.argv.includes('--retry-warmed');const suffix=retry?'-retry':'';if(retry){const prior=JSON.parse(await readFile('artifacts/playtt-latency-profile-capture.json','utf8'));assert.equal(prior.captured,false);assert.deepEqual(prior.errorCodes,[10393]);}
try{await access('artifacts/playtt-latency-profile-capture'+suffix+'.json');assert.fail('Do not overwrite completed capture evidence');}catch(e){if(e.code!=='ENOENT')throw e;}
const config=JSON.parse(await readFile('wrangler.playtt-rebuild-audit.jsonc','utf8'));assert.equal(config.name,'playtt-wp-free-rebuild-audit');assert.equal(config.account_id,'3baadbd4abd9fd63c7f7e51664b26f67');
const auth=await readFile('../../../playtt-wrangler-config/.wrangler/config/default.toml','utf8'),token=auth.match(/^oauth_token\s*=\s*"([^"]+)"/m)?.[1];assert.ok(token);
const base='https://api.cloudflare.com/client/v4/accounts/'+config.account_id;
const apiChecks=[];
async function api(path,body){assert.ok(path.startsWith('/')&&!path.startsWith('//'));const r=await fetch(base+path,{method:body?'POST':'GET',headers:{authorization:'Bearer '+token,'content-type':'application/json'},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(60000)});apiChecks.push({operation:body?'capture':'lookup',status:r.status});return r;}
async function json(path){const r=await api(path);assert.equal(r.status,200,'Scoped API lookup failed');const b=await r.json();assert.equal(b.success,true);return b;}
const c=await privateClient();await c.paused();const before=await c.operator('operator-fence-status');assert.equal(before.coherent,true);assert.equal(before.fence.active,false);
const settings=(await json('/workers/scripts/'+config.name+'/settings')).result;const binding=settings.bindings.find(x=>x.type==='durable_object_namespace'&&x.name==='PLAYTT_EXECUTION');assert.ok(binding?.namespace_id);assert.equal(binding.class_name,'PlayttWordPressExecution');
const objects=await json('/workers/durable_objects/namespaces/'+binding.namespace_id+'/objects');assert.equal(objects.result.length,1,'Do not guess among multiple private execution actors');if(objects.result_info?.cursor){const next=await json('/workers/durable_objects/namespaces/'+binding.namespace_id+'/objects?cursor='+encodeURIComponent(objects.result_info.cursor));assert.equal(next.result.length,0,'Additional private actors require explicit selection');}const actor=objects.result[0].id;assert.match(actor,/^[a-f0-9]{64}$/);
await writeFile('artifacts/playtt-latency-profile-target-private.json',JSON.stringify({namespace:binding.namespace_id,actor,worker:config.name},null,2));
const warm=await c.request('/wp-login.php');assert.equal(warm.status,200);await warm.arrayBuffer();
const version='b90bf162-72f3-4c7b-a3a9-e61c46c8a773';
// A bounded capture and three sequential read-only requests overlap. This is
// explicitly the private execution actor, never the daily source or Pages.
const capture=api('/workers/workers/'+config.name+'/versions/'+(retry?'latest-deployed':version)+'/profile',{duration_ms:retry?10000:5000,profile_type:'cpu',namespace_id:binding.namespace_id,actor_id:actor});
const reads=(async()=>{for(let i=0;i<(retry?5:3);i++){const r=await c.request('/wp-login.php');assert.equal(r.status,200);await r.arrayBuffer();}})();
const result=await capture;const bytes=Buffer.from(await result.arrayBuffer());await reads;
let captured=false,errorCodes=[];if(result.status===200){assert.ok(bytes.length>0);await writeFile('artifacts/playtt-latency-cpu'+suffix+'-private.pprof'+(bytes[0]===31&&bytes[1]===139?'.gz':''),bytes);captured=true;}else{let error;try{error=JSON.parse(bytes);}catch{}errorCodes=(error?.errors||[]).map(e=>e.code).filter(Number.isFinite);await writeFile('artifacts/playtt-latency-profile-error'+suffix+'-private.json',bytes);}
const after=await c.operator('operator-fence-status');assert.equal(after.coherent,true);assert.equal(after.fence.active,false);assert.deepEqual(after.state,before.state);await c.paused();
const report={at:new Date().toISOString(),result:captured?'captured':'unavailable',scope:retry?'One 10-second warmed retry on latest-deployed, sole private execution actor and five read-only requests; no deployment or canonical changes.':'One bounded 5-second CPU capture for the sole private execution actor with three read-only login-page requests; no deployment or canonical changes.',worker:config.name,version,captured,captureStatus:result.status,errorCodes,...(captured?{profileBytes:bytes.length,profileSha256:createHash('sha256').update(bytes).digest('hex')}:{ }),canonicalUnchanged:true,canonicalVersion:after.state.version,revision:after.state.pointer.revision,publisher:'paused',apiChecks,requests:c.checks};
await writeFile('artifacts/playtt-latency-profile-capture'+suffix+'.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
