// Fixed GET-only readback before considering the old private runtime.
import assert from 'node:assert/strict';
import {readFile,writeFile,access} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {openSnapshotBundle} from './playtt-snapshot-bundle.mjs';
import {createContentSnapshotSource} from './playtt-content-snapshot-source.mjs';
import {decodeCanonicalManifestBytes} from '../src/playtt-manifest-envelope.ts';
assert.deepEqual(process.argv.slice(2),['--remote']);
const prefix='artifacts/playtt-old-provider-',load=async p=>JSON.parse(await readFile(p,'utf8')),sha=b=>createHash('sha256').update(b).digest('hex');
for(const suffix of ['preflight.json','preflight-state-private.json'])await access(prefix+suffix).then(()=>{throw Error('Existing preflight; inspect before replay.');},e=>{if(e.code!=='ENOENT')throw e;});
const config=await load('wrangler.playtt-session-audit.jsonc'),previous=await load('artifacts/playtt-recovery-provider-final.json'),owner=await load('artifacts/playtt-recovery-provider-owned-private.json'),original=await load('artifacts/playtt-recovery-provider-preflight-state-private.json');
assert.equal(config.name,'playtt-wp-free-session-audit');assert.equal(config.account_id,'3baadbd4abd9fd63c7f7e51664b26f67');assert.equal(config.vars.PLAYTT_R2_CAPACITY_LIMIT_BYTES,'150000000');assert.equal(config.routes,undefined);assert.deepEqual(config.triggers,{crons:[]});
assert.equal(owner.phase,'verified-closed-sealed');assert.equal(owner.finalVersion,178);assert.equal(previous.version,'8c615f36-9771-4798-834e-df40df63fdf9');
const baseline=await openSnapshotBundle(owner.directory+'/independent',owner.anchor);assert.equal(baseline.graph.objects.length,303);assert.equal(baseline.graph.format,'content-overlay');
const secrets=await load('../../../playtt-cms-secrets.json'),oauth=(await readFile('../../../playtt-wrangler-config/.wrangler/config/default.toml','utf8')).match(/^oauth_token\s*=\s*"([^"\r\n]+)"/m)?.[1];assert.ok(oauth);
const origin='https://playtt-wp-free-session-audit.muzhi-garden-platform.workers.dev',api='https://api.cloudflare.com/client/v4/accounts/'+config.account_id,checks=[];
async function get(url,headers){const r=await fetch(url,{headers,redirect:'error',signal:AbortSignal.timeout(45000)});checks.push({kind:url.startsWith(origin)?'operator':'provider',status:r.status});assert.equal(r.status,200);return r;}
const op=async path=>(await get(origin+path,{authorization:'Bearer '+secrets.WORDPRESS_OPERATOR_TOKEN,'X-Playtt-Probe':secrets.WORDPRESS_OPERATOR_TOKEN})).json();
const provider=async path=>{const b=await(await get(api+'/workers/scripts/'+config.name+'/'+path,{authorization:'Bearer '+oauth})).json();assert.equal(b.success,true);return b.result;};
const reads=await Promise.allSettled([provider('settings'),provider('deployments'),op('/?phase=operator-fence-status'),op('/__playtt-capacity'),op('/__playtt-backup-pins'),op('/__playtt-publishing')]);for(const r of reads)assert.equal(r.status,'fulfilled',r.status==='rejected'?String(r.reason):undefined);
const [settings,deployments,s,b,p,pub]=reads.map(r=>r.value),head=(Array.isArray(deployments)?deployments:deployments.deployments)[0];assert.deepEqual(head.versions,[{version_id:previous.version,percentage:100}]);
for(const [name,text]of Object.entries(config.vars)){const binding=settings.bindings.find(x=>x.name===name);assert.equal(binding?.type,'plain_text');assert.equal(binding.text,text,name);}
for(const name of ['PLAYTT_RECOVERY_UPLOADS','PLAYTT_CONTENT_OVERLAY','PLAYTT_MANIFEST_ENCODING','PLAYTT_EDITOR_HEARTBEAT','PLAYTT_EDITOR_READBACK'])assert.equal(settings.bindings.some(x=>x.name===name),false,name);
assert.equal(settings.bindings.find(x=>x.name==='WORDPRESS_STATE_BUCKET')?.bucket_name,'playtt-wordpress-session-audit');
assert.equal(s.coherent,true);assert.equal(s.state.version,178);const pointer=Object.fromEntries(['revision','manifestKey','persistedAt'].map(k=>[k,owner.anchor[k]]));assert.deepEqual(s.state.pointer,pointer);assert.deepEqual(s.receipt,pointer);assert.equal(s.fence.active,false);
assert.equal(b.remainingBytes,650908);assert.equal(b.writeTracking.pending,0);assert.equal(b.writeTracking.sealed,true);assert.equal(b.writeTracking.window.closed,true);assert.equal(pub.state,'paused');assert.equal(p.generation,15);
for(const pin of original.pins.pins)assert.ok(p.pins.some(x=>JSON.stringify(x)===JSON.stringify(pin)));assert.ok(p.pins.some(x=>x.revision===owner.anchor.revision&&x.manifestSha256===owner.anchor.manifestSha256));
const current=await get(api+'/r2/buckets/playtt-wordpress-session-audit/objects/'+encodeURIComponent('sites/default/markdown/current.json'),{authorization:'Bearer '+oauth});
const reader=current.body.getReader(),parts=[];let length=0;try{while(true){const n=await reader.read();if(n.done)break;length+=n.value.length;assert.ok(length<=1024);parts.push(n.value);}}catch(e){await reader.cancel().catch(()=>{});throw e;}finally{reader.releaseLock();}assert.deepEqual(JSON.parse(Buffer.concat(parts).toString('utf8')),pointer);
const source=createContentSnapshotSource({token:oauth});
const raw=await source.bucket.get(pointer.manifestKey);assert.ok(raw);const bytes=new Uint8Array(await raw.arrayBuffer());assert.equal(sha(bytes),owner.anchor.manifestSha256);assert.deepEqual(await decodeCanonicalManifestBytes(bytes,'sites/default'),baseline.graph.manifest);
const at=new Date().toISOString();await writeFile(prefix+'preflight-state-private.json',JSON.stringify({at,state:s.state,receipt:s.receipt,budget:b,pins:p,publisher:pub,previousOwner:'artifacts/playtt-recovery-provider-owned-private.json'},null,2)+'\n',{flag:'wx'});
const report={schema:'playtt/old-provider-preflight/v1',at,result:'pass',version:previous.version,canonicalVersion:178,revision:pointer.revision,pins:15,allOriginalPinsExact:true,remainingBytes:650908,pending:0,sealed:true,windowClosed:true,fenceActive:false,publisher:'paused',bothPointersAndReceiptExact:true,remoteManifestAndIndependentBackupExact:true,optionalFlagsOff:true,checks,objectGets:source.stats.requests,downloadedBytes:source.stats.downloadedBytes,remoteMutations:0,productionChanged:false};
await writeFile(prefix+'preflight.json',JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(report));
