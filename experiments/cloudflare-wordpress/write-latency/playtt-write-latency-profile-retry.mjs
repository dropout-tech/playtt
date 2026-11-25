import assert from 'node:assert/strict';
import {readFile,writeFile,access} from 'node:fs/promises';
import {createHash,randomUUID} from 'node:crypto';
import {origin,privateClient} from './playtt-private-client.mjs';

assert.ok(process.argv.includes('--remote'));
const prefix='artifacts/playtt-write-latency';
const version='04c50a77-d4ca-4af0-93ab-0cc3ff1963e9';
const config=JSON.parse(await readFile('wrangler.playtt-rebuild-audit.jsonc','utf8'));
assert.equal(config.name,'playtt-wp-free-rebuild-audit');assert.equal(config.account_id,'3baadbd4abd9fd63c7f7e51664b26f67');
const token=(await readFile('../../../playtt-wrangler-config/.wrangler/config/default.toml','utf8')).match(/^oauth_token\s*=\s*"([^"]+)"/m)?.[1];assert.ok(token);
const base='https://api.cloudflare.com/client/v4/accounts/'+config.account_id;
async function api(path,body){const r=await fetch(base+path,{method:body?'POST':'GET',headers:{authorization:'Bearer '+token,'content-type':'application/json'},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(60000)});return r;}
async function lookup(path){const r=await api(path);assert.equal(r.status,200,'Scoped API lookup failed');const b=await r.json();assert.equal(b.success,true);return b;}
const deployments=(await lookup('/workers/scripts/'+config.name+'/deployments')).result;
const latest=(deployments.deployments||deployments)[0];assert.ok(latest?.versions);assert.deepEqual(latest.versions.map(v=>({id:v.version_id,percentage:v.percentage})),[{id:version,percentage:100}],'Investigate the verified private version only');
const settings=(await lookup('/workers/scripts/'+config.name+'/settings')).result;
const binding=settings.bindings.find(x=>x.type==='durable_object_namespace'&&x.name==='PLAYTT_EXECUTION');assert.equal(binding?.class_name,'PlayttWordPressExecution');
const objects=await lookup('/workers/durable_objects/namespaces/'+binding.namespace_id+'/objects');assert.equal(objects.result.length,1);
if(objects.result_info?.cursor){const next=await lookup('/workers/durable_objects/namespaces/'+binding.namespace_id+'/objects?cursor='+encodeURIComponent(objects.result_info.cursor));assert.equal(next.result.length,0);}
const actor=objects.result[0].id;assert.match(actor,/^[a-f0-9]{64}$/);

const owned=JSON.parse(await readFile(prefix+'-owned-private.json','utf8'));
assert.equal(owned.origin,origin);assert.equal(owned.phase,'baseline-complete');assert.equal(owned.cleanupComplete,false);
const baseline=JSON.parse(await readFile(prefix+'-profile.json','utf8'));assert.equal(baseline.profile.captured,false);assert.deepEqual(baseline.profile.errorCodes,[10393]);
try{await access(prefix+'-profile-retry.json');assert.fail('Do not overwrite a completed retry');}catch(e){if(e.code!=='ENOENT')throw e;}
const c=await privateClient();await c.paused();const before=await c.operator('operator-fence-status');assert.equal(before.state.version,baseline.canonicalVersion);assert.equal(before.state.pointer.revision,baseline.revision);assert.equal(before.coherent,true);assert.equal(before.fence.active,false);
const sha=v=>createHash('sha256').update(v).digest('hex'),route='pages/'+owned.id;
await c.login();const actual=await c.rest(route+'?context=edit');assert.equal(actual.status,200);assert.equal(actual.body.slug,owned.marker);assert.equal(sha(actual.body.content.raw),sha(owned.content));
const capture=api('/workers/workers/'+config.name+'/versions/latest-deployed/profile',{duration_ms:25000,profile_type:'cpu',namespace_id:binding.namespace_id,actor_id:actor});
const writes=[];
const updating=(async()=>{for(let i=6;i<=7;i++){const content='<!-- wp:paragraph --><p>'+owned.marker+' 保存延遲量測 '+i+'</p><!-- /wp:paragraph --> \n';const at=performance.now(),r=await c.rest(route,{content});assert.equal(r.status,200);assert.equal(sha(r.body.content.raw),sha(content));writes.push({index:i,wallMs:Math.round((performance.now()-at)*1000)/1000});owned.content=content;owned.phase='profile-retry-write-'+i;await writeFile(prefix+'-owned-private.json',JSON.stringify(owned,null,2));console.log(JSON.stringify({phase:owned.phase,id:owned.id}));}})();
const settled=await Promise.allSettled([capture,updating]);assert.equal(settled[1].status,'fulfilled');assert.equal(settled[0].status,'fulfilled');const response=settled[0].value,bytes=Buffer.from(await response.arrayBuffer());let errorCodes=[];
if(response.status===200){await writeFile(prefix+'-cpu-retry-private.pprof'+(bytes[0]===31&&bytes[1]===139?'.gz':''),bytes);}else{try{errorCodes=JSON.parse(bytes).errors?.map(e=>e.code)||[];}catch{}await writeFile(prefix+'-profile-error-retry-private.json',bytes);}
const after=await c.operator('operator-fence-status');assert.equal(after.coherent,true);assert.equal(after.fence.active,false);await c.paused();owned.phase='profile-retry-complete';await writeFile(prefix+'-owned-private.json',JSON.stringify(owned,null,2));
const report={at:new Date().toISOString(),scope:'Only warmed retry after 10393, same private actor and two owned native updates; existing baseline evidence retained. Not a deployment or general latency benchmark.',version,id:owned.id,captured:response.status===200,status:response.status,profileBytes:bytes.length,profileSha256:sha(bytes),errorCodes,writes,canonicalVersion:after.state.version,revision:after.state.pointer.revision,publisher:'paused',checks:c.checks};await writeFile(prefix+'-profile-retry.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
