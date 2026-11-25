// Read-only manifest audit of the stopped two-browser exercise; never prune.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
assert.ok(process.argv.includes('--remote'));
const prefix='artifacts/playtt-session-lock-',origin='https://playtt-wp-free-session-audit.muzhi-garden-platform.workers.dev',load=async p=>JSON.parse(await readFile(p,'utf8')),sha=b=>createHash('sha256').update(b).digest('hex');
const secrets=await load('../../../playtt-cms-secrets.json'),oauth=(await readFile('../../../playtt-wrangler-config/.wrangler/config/default.toml','utf8')).match(/^oauth_token\s*=\s*"([^"\r\n]+)"/m)?.[1];assert.ok(oauth);
const headers={authorization:'Bearer '+secrets.WORDPRESS_OPERATOR_TOKEN,'X-Playtt-Probe':secrets.WORDPRESS_OPERATOR_TOKEN};
async function control(path){const r=await fetch(origin+path,{headers,signal:AbortSignal.timeout(45000),redirect:'error'});assert.equal(r.status,200);return r.json();}
async function status(){const s=await control('/?phase=operator-fence-status'),b=await control('/__playtt-capacity'),p=await control('/__playtt-backup-pins');assert.equal(s.state.version,43);assert.equal(s.fence.active,false);assert.equal(s.coherent,true);assert.equal(b.writeTracking.sealed,true);assert.equal(b.writeTracking.pending,0);assert.equal(b.writeTracking.window.closed,true);assert.equal(p.generation,5);return {state:s.state,chargedBytes:b.chargedBytes,pins:p.generation};}
const before=await status(),roots=await control('/__playtt-reference-roots');assert.equal(roots.version,43);assert.equal(roots.completeCommitListing,true);assert.equal(roots.lease,null);
await writeFile(prefix+'cost-roots-private.json',JSON.stringify(roots,null,2)+'\n');
const receipts=roots.commitReceipts.filter(r=>r.version>=16&&r.version<=43).sort((a,b)=>a.version-b.version);assert.deepEqual(receipts.map(r=>r.version),Array.from({length:28},(_,i)=>16+i));
const owner=await load(prefix+'owned-private.json'),baseline={anchor:owner.baseline},latest=await load(prefix+'backup-inspection.json');assert.equal(latest.result,'independent-copy-verified-comparison-pending');receipts.unshift({version:15,pointer:owner.baseline});
const dir=prefix+'cost-manifests-private';await mkdir(dir,{recursive:true});let downloadedBytes=0,requests=0;const snapshots=[];
for(const r of receipts){
 const key=r.pointer.manifestKey;assert.equal(key,'sites/default/markdown/revisions/'+r.pointer.revision+'.json');assert.ok(/^[a-f0-9-]{36}$/.test(r.pointer.revision));
 const url='https://api.cloudflare.com/client/v4/accounts/3baadbd4abd9fd63c7f7e51664b26f67/r2/buckets/playtt-wordpress-session-audit/objects/'+encodeURIComponent(key);
 assert.ok(++requests<=29);const response=await fetch(url,{headers:{authorization:'Bearer '+oauth},redirect:'error',signal:AbortSignal.timeout(45000)});assert.equal(response.status,200);assert.ok(response.body);const reader=response.body.getReader(),chunks=[];let size=0;
 try{for(;;){const x=await reader.read();if(x.done)break;size+=x.value.length;downloadedBytes+=x.value.length;assert.ok(size<=256*1024&&downloadedBytes<=5*1024*1024);chunks.push(x.value);}}finally{reader.releaseLock();}
 const bytes=Buffer.concat(chunks),manifest=JSON.parse(bytes.toString('utf8'));for(const k of ['revision','manifestKey','persistedAt'])assert.equal(manifest[k],r.pointer[k]);
 if(r.version===15)assert.equal(sha(bytes),baseline.anchor.manifestSha256);if(r.version===43)assert.equal(sha(bytes),latest.anchor.manifestSha256);
 await writeFile(dir+'/'+r.version+'.json',bytes);snapshots.push({version:r.version,manifest,manifestBytes:size,manifestSha256:sha(bytes)});
}
const changes=[];
for(let i=1;i<snapshots.length;i++){
 const previous=snapshots[i-1],current=snapshots[i],a=new Map(previous.manifest.files.map(f=>[f.path,f])),b=new Map(current.manifest.files.map(f=>[f.path,f]));
 for(const key of ['uploads','wpContent','wpContentDeleted'])assert.deepEqual(current.manifest[key],previous.manifest[key]);
 const changed=[...b].filter(([p,f])=>!a.has(p)||f.sha256!==a.get(p).sha256).map(([p])=>p),removed=[...a.keys()].filter(p=>!b.has(p)),overlay=['playtt/canonical-metadata-overlay/v1','playtt/canonical-metadata-overlay/v2'].includes(current.manifest.restorePack?.schema);
 const onlyUsermeta=changed.length>0&&changed.every(p=>['_tables/usermeta.json','_runtime/playtt-auto-increment.json'].includes(p))&&removed.length===0;
 changes.push({version:current.version,persistedAt:current.manifest.persistedAt,kind:overlay?'metadata-overlay':'full',changed,removed,manifestBytes:current.manifestBytes,packBytes:overlay?0:current.manifest.restorePack.size,changedLogicalBytes:changed.reduce((n,p)=>n+b.get(p).size,0),onlyUsermetaAndCounter:onlyUsermeta,manifestSha256:current.manifestSha256});
}
assert.deepEqual(await status(),before);const full=changes.filter(x=>x.kind==='full'),candidates=full.filter(x=>x.onlyUsermetaAndCounter),closed=await load(prefix+'closed.json');
const report={at:new Date().toISOString(),result:'pass',scope:'Read-only authenticated manifest comparison of committed versions15-43; no remote mutation or snapshot decoding for historical intermediates',canonicalUnchanged:true,capacityUnchanged:true,pins:5,remoteManifestGets:requests,downloadedBytes,baselineAndLatestAnchorsVerified:true,commits:changes.length,fullSnapshots:full.length,overlays:changes.length-full.length,committedFullPackBytes:full.reduce((n,x)=>n+x.packBytes,0),windowChargedBytes:closed.budget.writeTracking.window.usedBytes,usermetaOnlyFullSnapshots:candidates.length,usermetaOnlyPackBytes:candidates.reduce((n,x)=>n+x.packBytes,0),usermetaOnlyChangedLogicalBytes:candidates.reduce((n,x)=>n+x.changedLogicalBytes,0),changes,next:'Investigate repeated unchanged-content autosave timestamps and the native post-lock heartbeat effect. Preserve all current history and accounting.',limitations:['The sum of committed pack sizes is not the complete charge ledger: loose objects, manifests, mirror writes and unsuccessful attempts also count.','Manifest differences identify changed files, not usermeta keys; do not infer every usermeta-only commit is a login.','Estimated avoidable pack bytes are not measured savings until an implementation and complete restoration test pass.'],safeToApply:false};
await writeFile(prefix+'cost.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({...report,changes:undefined}));
