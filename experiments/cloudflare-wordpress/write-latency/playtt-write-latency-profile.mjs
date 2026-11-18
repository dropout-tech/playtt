import assert from 'node:assert/strict';
import {readFile,writeFile,access} from 'node:fs/promises';
import {createHash,randomUUID} from 'node:crypto';
import {origin,privateClient} from './playtt-private-client.mjs';

assert.ok(process.argv.includes('--remote'));
const prefix='artifacts/playtt-write-latency';
for(const path of [prefix+'-owned-private.json',prefix+'-profile.json']) {
 try{await access(path);assert.fail('Do not replay or overwrite an existing write investigation');}catch(e){if(e.code!=='ENOENT')throw e;}
}
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
const c=await privateClient();await c.paused();const before=await c.operator('operator-fence-status');assert.equal(before.coherent,true);assert.equal(before.fence.active,false);assert.equal(before.state.version,158);assert.equal(before.state.pointer.revision,'78a0d6bd-c4a3-4c7b-be37-66e03578671b');
const marker='playtt-write-latency-'+randomUUID(),sha=v=>createHash('sha256').update(v).digest('hex');
const content=n=>'<!-- wp:paragraph --><p>'+marker+' 保存延遲量測 '+n+'</p><!-- /wp:paragraph --> \n';
const owned={origin,marker,id:null,phase:'prepared',cleanupComplete:false,baselineVersion:version,initial:content(0)};
async function phase(name){owned.phase=name;await writeFile(prefix+'-owned-private.json',JSON.stringify(owned,null,2));console.log(JSON.stringify({phase:name,id:owned.id}));}
await phase('prepared');
try{
 await c.login();const home=await c.rest('pages/24?context=edit');assert.equal(home.status,200);owned.homeHash=sha(home.body.content.raw);
 const created=await c.rest('pages',{slug:marker,title:marker,status:'draft',content:content(0)});assert.equal(created.status,201);assert.ok(created.body.id>145);owned.id=created.body.id;await phase('created');
 const route='pages/'+owned.id;
 // The warm actor receives only this owned page's two updates during capture.
 const capture=api('/workers/workers/'+config.name+'/versions/latest-deployed/profile',{duration_ms:25000,profile_type:'cpu',namespace_id:binding.namespace_id,actor_id:actor});
 const capturedWrites=[];
 const writes=(async()=>{for(let i=1;i<=2;i++){const at=performance.now();const r=await c.rest(route,{content:content(i)});assert.equal(r.status,200);assert.equal(sha(r.body.content.raw),sha(content(i)));capturedWrites.push({index:i,wallMs:Math.round((performance.now()-at)*1000)/1000});owned.content=content(i);await phase('profile-write-'+i);}})();
 const results=await Promise.allSettled([capture,writes]);assert.equal(results[1].status,'fulfilled','Owned profile writes failed; preserve fixture for inspection');
 assert.equal(results[0].status,'fulfilled','Profile request failed');const response=results[0].value,bytes=Buffer.from(await response.arrayBuffer());
 let errorCodes=[];if(response.status===200){assert.ok(bytes.length);await writeFile(prefix+'-cpu-private.pprof'+(bytes[0]===31&&bytes[1]===139?'.gz':''),bytes);}else{try{errorCodes=JSON.parse(bytes).errors?.map(e=>e.code)||[];}catch{}await writeFile(prefix+'-profile-error-private.json',bytes);}
 await phase('profile-finished');
 const reads=await c.rest(route+'?context=edit');assert.equal(reads.status,200);assert.equal(sha(reads.body.content.raw),sha(owned.content));
 const benchmark=[];
 for(let i=3;i<=5;i++){const at=performance.now();const r=await c.rest(route,{content:content(i)});assert.equal(r.status,200);assert.equal(sha(r.body.content.raw),sha(content(i)));benchmark.push({index:i,wallMs:Math.round((performance.now()-at)*1000)/1000});owned.content=content(i);await phase('baseline-write-'+i);}
 const homeAfter=await c.rest('pages/24?context=edit');assert.equal(homeAfter.status,200);assert.equal(sha(homeAfter.body.content.raw),owned.homeHash);await c.paused();
 const after=await c.operator('operator-fence-status');assert.equal(after.coherent,true);assert.equal(after.fence.active,false);await phase('baseline-complete');
 const sorted=benchmark.map(x=>x.wallMs).sort((a,b)=>a-b);
 const report={at:new Date().toISOString(),result:'baseline-complete',scope:'Private owned draft only. Two native updates during one 25-second CPU capture; three subsequent sequential updates without capture. Fixture intentionally retained for same-page candidate comparison; publisher remains paused.',worker:config.name,version,id:owned.id,profile:{status:response.status,captured:response.status===200,bytes:bytes.length,sha256:sha(bytes),errorCodes,writes:capturedWrites},baseline:{writes:benchmark,medianMs:sorted[1],minMs:sorted[0],maxMs:sorted.at(-1),wholeResponseClientWallTime:true},homeUnchanged:true,canonicalVersion:after.state.version,revision:after.state.pointer.revision,publisher:'paused',checks:c.checks};
 await writeFile(prefix+'-profile.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}catch(error){await writeFile(prefix+'-failure.json',JSON.stringify({at:new Date().toISOString(),phase:owned.phase,id:owned.id,errorName:error.name,checks:c.checks},null,2));throw error;}
