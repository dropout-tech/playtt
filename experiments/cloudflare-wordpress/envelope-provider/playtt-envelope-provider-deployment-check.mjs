// GET-only verification of the existing private worker after an explicit deploy.
import assert from 'node:assert/strict';
import {readFile,writeFile,access} from 'node:fs/promises';
const load=async p=>JSON.parse(await readFile(p,'utf8'));
const mode=process.argv[2],version=process.argv.find(a=>a.startsWith('--version='))?.slice(10);
assert.ok(['enabled','cold','disabled'].includes(mode));assert.ok(process.argv.includes('--remote'));assert.match(version||'',/^[a-f0-9-]{36}$/);
const output='artifacts/playtt-envelope-provider-deployment-'+mode+'.json';
await access(output).then(()=>{throw Error('Existing deployment verification; inspect before replay');},e=>{if(e.code!=='ENOENT')throw e;});
const account='3baadbd4abd9fd63c7f7e51664b26f67',worker='playtt-wp-free-session-audit',origin='https://playtt-wp-free-session-audit.muzhi-garden-platform.workers.dev',config=await load('wrangler.playtt-session-audit.jsonc');
const oauth=(await readFile('../../../playtt-wrangler-config/.wrangler/config/default.toml','utf8')).match(/^oauth_token\s*=\s*"([^"\r\n]+)"/m)?.[1],secrets=await load('../../../playtt-cms-secrets.json');assert.ok(oauth);
const checks=[];
async function get(url,headers){const response=await fetch(url,{headers,redirect:'error',signal:AbortSignal.timeout(45000)});checks.push({kind:url.startsWith(origin)?'operator':'deployment',status:response.status});assert.equal(response.status,200);return response.json();}
const api=path=>get('https://api.cloudflare.com/client/v4/accounts/'+account+'/workers/scripts/'+worker+path,{authorization:'Bearer '+oauth});
const op=path=>get(origin+path,{authorization:'Bearer '+secrets.WORDPRESS_OPERATOR_TOKEN,'X-Playtt-Probe':secrets.WORDPRESS_OPERATOR_TOKEN});
const values=await Promise.allSettled([api('/settings'),api('/deployments'),op('/?phase=operator-fence-status'),op('/__playtt-capacity'),op('/__playtt-backup-pins'),op('/__playtt-publishing')]);for(const x of values)assert.equal(x.status,'fulfilled');
const [settings,deploy,s,b,p,pub]=values.map(x=>x.value);assert.equal(settings.success,true);assert.equal(deploy.success,true);
const deployments=Array.isArray(deploy.result)?deploy.result:deploy.result.deployments;assert.deepEqual(deployments[0].versions,[{version_id:version,percentage:100}]);
const actual=settings.result.bindings,flags={...config.vars,...(mode==='disabled'?{}:{PLAYTT_CONTENT_OVERLAY:'content-gzip-v1',PLAYTT_MANIFEST_ENCODING:'gzip-v1',PLAYTT_EDITOR_HEARTBEAT:'native-30s-v1'})};
for(const [name,value]of Object.entries(flags)){const binding=actual.find(x=>x.name===name);assert.equal(binding?.type,'plain_text');assert.equal(binding.text,value,name);}
for(const name of ['PLAYTT_CONTENT_OVERLAY','PLAYTT_MANIFEST_ENCODING','PLAYTT_EDITOR_HEARTBEAT','PLAYTT_EDITOR_READBACK'])if(!(name in flags))assert.equal(actual.some(x=>x.name===name),false,name);
assert.equal(actual.find(x=>x.name==='WORDPRESS_STATE_BUCKET')?.bucket_name,'playtt-wordpress-session-audit');
assert.equal(s.coherent,true);assert.equal(b.writeTracking.pending,0);assert.equal(b.writeTracking.sealed,true);assert.equal(pub.state,'paused');
if(mode==='enabled'){assert.equal(s.state.version,161);assert.equal(s.fence.active,false);assert.equal(b.remainingBytes,1881041);assert.equal(b.writeTracking.window.closed,true);assert.equal(p.generation,13);}
if(mode==='cold'){const owner=await load('artifacts/playtt-envelope-provider-ui-owned-private.json');assert.equal(owner.coldHeld,true);assert.equal(s.fence.active,true);assert.deepEqual(s.state,owner.coldState);assert.equal(b.writeTracking.window.closed,false);assert.equal(p.generation,13);}
if(mode==='disabled'){const run=await load('artifacts/playtt-envelope-provider-ui-result.json');assert.deepEqual(s.state,run.after.state);assert.equal(s.fence.active,false);assert.equal(b.writeTracking.window.closed,true);assert.equal(b.chargedBytes,run.after.budget.chargedBytes);}
const report={at:new Date().toISOString(),result:'pass',mode,worker,version,canonicalVersion:s.state.version,revision:s.state.pointer.revision,pins:p.generation,publisher:pub.state,sealed:true,pending:0,windowClosed:b.writeTracking.window.closed,fenceActive:s.fence.active,remainingBytes:b.remainingBytes,optionalWritersEnabled:mode!=='disabled',heartbeatEnabled:mode!=='disabled',allExpectedBindingsExact:true,checks,remoteMutations:0,productionChanged:false};
await writeFile(output,JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(report));
