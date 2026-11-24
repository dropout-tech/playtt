// Read-only boundary check for a new, separately authorized visual-editor trial.
import assert from 'node:assert/strict';
import {readFile,writeFile,access} from 'node:fs/promises';
import {basename} from 'node:path';
import {createHash} from 'node:crypto';
import {openSnapshotBundle} from './playtt-snapshot-bundle.mjs';
assert.equal(process.argv[2],'--remote-read-only');assert.equal(process.argv.length,4);
const attempt=process.argv[3];assert.match(attempt,/^[a-z][a-z0-9-]{0,30}$/);
const prefix='artifacts/playtt-visual-cloud-next-'+attempt+'-',load=async p=>JSON.parse(await readFile(p,'utf8')),sha=b=>createHash('sha256').update(b).digest('hex');
await access(prefix+'preflight-started-private.json').then(()=>{throw Error('Read already started; inspect retained result before another attempt');},e=>{if(e.code!=='ENOENT')throw e;});
const prior=await load('artifacts/playtt-native-approved-v3-ui-result.json'),final=await load('artifacts/playtt-native-approved-final.json'),backup=await load('artifacts/playtt-native-approved-backup-owned-private.json'),old=await load('artifacts/playtt-native-approved-v3-preflight-state-private.json'),plan=await load('artifacts/playtt-native-next-plan-private.json');
assert.equal(final.result,'pass');assert.equal(final.canonicalVersion,201);assert.equal(final.limitBytes,152000000);assert.equal(final.remainingBytes,1067374);
const independent=await openSnapshotBundle(backup.directory+'/independent',backup.anchor);assert.equal(backup.anchor.revision,final.revision);
const rollback=plan.variants.fallback;assert.equal(sha(await readFile(rollback.config)),rollback.configSha256);
for(const m of rollback.modules){const b=await readFile(m.path);assert.equal(b.length,m.bytes);assert.equal(sha(b),m.sha256);}
const secret=await load('../../../playtt-cms-secrets.json'),oauth=(await readFile('../../../playtt-wrangler-config/.wrangler/config/default.toml','utf8')).match(/^oauth_token\s*=\s*"([^"\r\n]+)"/m)?.[1];assert.ok(oauth);
const origin='https://playtt-wp-free-session-audit.muzhi-garden-platform.workers.dev',api='https://api.cloudflare.com/client/v4/accounts/3baadbd4abd9fd63c7f7e51664b26f67',worker=api+'/workers/scripts/playtt-wp-free-session-audit',checks=[];
const opHeaders={authorization:'Bearer '+secret.WORDPRESS_OPERATOR_TOKEN,'X-Playtt-Probe':secret.WORDPRESS_OPERATOR_TOKEN},apiHeaders={authorization:'Bearer '+oauth};
await writeFile(prefix+'preflight-started-private.json',JSON.stringify({at:new Date().toISOString(),scriptSha256:sha(await readFile(new URL(import.meta.url))),scope:'GET-only'}),{flag:'wx'});
async function get(url,headers){const r=await fetch(url,{method:'GET',headers,redirect:'error',signal:AbortSignal.timeout(45000)});checks.push({kind:url.startsWith(origin)?'operator':'provider',status:r.status});assert.equal(r.status,200,'Read-only request failed: '+new URL(url).pathname);return r;}
const op=async p=>(await get(origin+p,opHeaders)).json();
const provider=async p=>{const r=await(await get(worker+p,apiHeaders)).json();assert.equal(r.success,true);return r.result;};
const reads=await Promise.allSettled([provider('/settings'),provider('/deployments'),op('/?phase=operator-fence-status'),op('/__playtt-capacity'),op('/__playtt-backup-pins'),op('/__playtt-publishing'),get(worker+'/content/v2',apiHeaders)]);
for(const r of reads)if(r.status==='rejected')throw r.reason;
const [settings,deployments,status,budget,pins,publisher,content]=reads.map(r=>r.value);
assert.deepEqual(deployments.deployments[0].versions,[{version_id:final.version,percentage:100}]);
assert.equal(status.coherent,true);assert.deepEqual(status.state,prior.after.state);assert.deepEqual(status.receipt,status.state.pointer);assert.equal(status.fence.active,false);
assert.deepEqual(budget,{...prior.after.budget,writeTracking:{...prior.after.budget.writeTracking,window:{...prior.after.budget.writeTracking.window,expired:budget.writeTracking.window.expired}}});
assert.equal(budget.limitBytes,152000000);assert.equal(budget.remainingBytes,1067374);assert.equal(budget.writeTracking.pending,0);assert.equal(budget.writeTracking.sealed,true);assert.equal(budget.writeTracking.window.closed,true);assert.equal(publisher.state,'paused');
assert.equal(pins.generation,17);assert.equal(pins.pins.length,17);for(const pin of old.pins.pins)assert.ok(pins.pins.some(p=>JSON.stringify(p)===JSON.stringify(pin)));assert.ok(pins.pins.some(p=>p.revision===backup.anchor.revision&&p.manifestSha256===backup.anchor.manifestSha256));
const sorted=a=>[...a].sort((a,b)=>a.name.localeCompare(b.name));const expected=old.settings.bindings.filter(x=>x.type!=='plain_text'||!(x.name in rollback.expectedVars));for(const [name,text]of Object.entries(rollback.expectedVars))expected.push({name,type:'plain_text',text});assert.deepEqual(sorted(settings.bindings),sorted(expected));for(const k of ['compatibility_date','compatibility_flags','usage_model','limits'])assert.deepEqual(settings[k],old.settings[k]);
assert.match(content.headers.get('content-type'),/^multipart\//);const reader=content.body.getReader(),chunks=[];let bytes=0;try{for(;;){const n=await reader.read();if(n.done)break;bytes+=n.value.length;assert.ok(bytes<=25000000);chunks.push(n.value);}}finally{reader.releaseLock();}
const form=await new Response(Buffer.concat(chunks),{headers:{'content-type':content.headers.get('content-type')}}).formData(),modules=[];for(const [name,file]of form){assert.ok(file instanceof Blob);const b=new Uint8Array(await file.arrayBuffer());modules.push({name,bytes:b.length,sha256:sha(b)});}assert.deepEqual(sorted(modules),sorted(rollback.modules.map(m=>({name:basename(m.path),bytes:m.bytes,sha256:m.sha256}))));
const pointerText=await(await get(api+'/r2/buckets/playtt-wordpress-session-audit/objects/'+encodeURIComponent('sites/default/markdown/current.json'),apiHeaders)).text();assert.ok(Buffer.byteLength(pointerText)<=1024);assert.deepEqual(JSON.parse(pointerText),status.state.pointer);
const at=new Date().toISOString();await writeFile(prefix+'preflight-state-private.json',JSON.stringify({at,state:status.state,receipt:status.receipt,budget,pins,publisher,settings,deployments},null,2)+'\n',{flag:'wx'});
const result={schema:'playtt/visual-cloud-next-preflight/v1',at,result:'pass',scope:'GET-only; no deployment or write-window operations',canonicalVersion:201,version:final.version,pins:17,allPriorPinsPreserved:true,localBackupVerified:true,allSixModuleBytesExact:true,allBindingsExact:true,limitBytes:budget.limitBytes,remainingBytes:budget.remainingBytes,sealed:true,windowClosed:true,pending:0,fenceActive:false,publisher:publisher.state,bothPointersAndReceiptExact:true,checks,remoteMutations:0};
await writeFile(prefix+'preflight.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(result));
