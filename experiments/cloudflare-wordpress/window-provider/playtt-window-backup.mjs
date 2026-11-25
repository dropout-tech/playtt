// Pin exact remote snapshots after complete independent local reconstruction.
// Target stays write-sealed. No R2 PUT/DELETE, restore, login or publication.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,access} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {createCloudflareSnapshotSource} from './playtt-snapshot-download.mjs';
import {exportSnapshotBundle,importSnapshotBundle} from './playtt-snapshot-bundle.mjs';
import {registerBackupPin} from './playtt-backup-pin-client.mjs';
import {backupPinInput} from '../src/playtt-backup-pins.ts';
import {isMetadataOverlay} from '../src/playtt-metadata-overlay.ts';

assert.ok(process.argv.includes('--remote'));
const prefix='artifacts/playtt-window-backup-',origin='https://playtt-wp-free-window-audit.muzhi-garden-platform.workers.dev';
const load=async p=>JSON.parse(await readFile(p,'utf8')),save=(p,v)=>writeFile(p,JSON.stringify(v,null,2)+'\n');
const sha=b=>createHash('sha256').update(b).digest('hex');
try{await access(prefix+'owned-private.json');throw Error('Existing backup attempt: inspect before retry');}catch(e){if(e.code!=='ENOENT')throw e;}
const native=await load('artifacts/playtt-window-native-result.json'),secrets=await load('../../../playtt-cms-secrets.json');
assert.equal(native.result,'pass');assert.equal(native.writeSealed,true);assert.equal(native.windowClosed,true);
const oauth=(await readFile('../../../playtt-wrangler-config/.wrangler/config/default.toml','utf8')).match(/^oauth_token\s*=\s*"([^"\r\n]+)"/m)?.[1];assert.ok(oauth);
async function request(path,options={}){
 assert.ok(path.startsWith('/')&&!path.startsWith('//'));
 return fetch(origin+path,{...options,headers:{authorization:'Bearer '+secrets.WORDPRESS_OPERATOR_TOKEN,'X-Playtt-Probe':secrets.WORDPRESS_OPERATOR_TOKEN,'content-type':'application/json',...options.headers},redirect:'error',signal:AbortSignal.timeout(45000)});
}
async function json(path,body){const r=await request(path,{method:body?'POST':'GET',body:body?JSON.stringify(body):undefined});assert.equal(r.status,200,path+': HTTP '+r.status);return r.json();}
const op=(phase,body)=>json('/?phase=operator-'+phase,body);
const before=await op('fence-status'),budget=await json('/__playtt-capacity'),pins=await json('/__playtt-backup-pins');
assert.deepEqual(before.state,native.finalState);assert.equal(before.fence.active,false);assert.equal(before.coherent,true);
assert.equal(budget.writeTracking.pending,0);assert.equal(budget.writeTracking.sealed,true);assert.equal(budget.writeTracking.window.closed,true);assert.equal(pins.generation,1);
assert.equal((await json('/__playtt-publishing')).state,'paused');
const directory=resolve('../../../../outputs/backups/cloudflare-wordpress-window-provider/'+new Date().toISOString().replace(/[:.]/g,'-'));
await mkdir(directory,{recursive:true});const owner={directory,phase:'prepared',fenceReleased:true,anchors:[]};await save(prefix+'owned-private.json',owner);
const report={at:new Date().toISOString(),result:'pending',snapshots:[],sourceVersion:before.state.version,remoteR2Mutations:0,remoteRestoreAttempted:false};
try{
 const fence=await op('fence-acquire',{ttlSeconds:600});owner.fenceToken=fence.token;owner.fenceReleased=false;owner.phase='reading';await save(prefix+'owned-private.json',owner);
 for(const [label,pointer]of [['heartbeat-0',native.heartbeat[0].pointer],['heartbeat-1',native.heartbeat[1].pointer],['final',before.state.pointer]]){
  const source=createCloudflareSnapshotSource({bucketName:'playtt-wordpress-window-audit',token:oauth}),cache=new Map();
  const bucket={async get(key){if(cache.has(key))return cache.get(key);const v=await source.bucket.get(key);cache.set(key,v);return v;}};
  const object=await bucket.get(pointer.manifestKey);assert.ok(object);const raw=new Uint8Array(await object.arrayBuffer()),manifest=JSON.parse(new TextDecoder().decode(raw));
  for(const k of ['revision','manifestKey','persistedAt'])assert.equal(manifest[k],pointer[k]);
  const overlay=isMetadataOverlay(manifest.restorePack);assert.equal(overlay,label!=='final');
  let base=manifest;
  if(overlay){const v=await bucket.get(manifest.restorePack.base.manifestKey);assert.ok(v);base=JSON.parse(new TextDecoder().decode(await v.arrayBuffer()));}
  const anchor=backupPinInput({...pointer,manifestSha256:sha(raw),packKey:base.restorePack.objectKey,packSha256:base.restorePack.sha256,packBytes:base.restorePack.size});
  // Trust anchored in the authenticated sealed coordinator/observed commit and
  // exact remote manifest bytes, before creating either bundle index.
  owner.anchors.push({label,anchor});await save(prefix+'owned-private.json',owner);
  const exported=await exportSnapshotBundle(bucket,anchor,directory+'/'+label);
  const copied=await importSnapshotBundle(directory+'/'+label,anchor,directory+'/'+label+'-independent');
  assert.deepEqual(copied.graph.contents,exported.graph.contents);assert.deepEqual(copied.graph.manifest.wpContentDeleted,exported.graph.manifest.wpContentDeleted);
  // The remote registry independently revalidates overlay base and replacements.
  const receipt=await registerBackupPin(request,secrets.WORDPRESS_OPERATOR_TOKEN,fence.token,anchor);
  await save(directory+'/'+label+'/retention-pin.json',receipt);
  report.snapshots.push({label,anchor,format:copied.graph.format,baseRevision:copied.graph.base.revision,files:Object.values(copied.graph.contents).reduce((n,a)=>n+a.length,0),objects:copied.graph.objects.length,payloadBytes:copied.graph.payloadBytes,remoteGets:source.stats.requests,downloadedBytes:source.stats.downloadedBytes,independentCopyVerified:true,remotePinGeneration:receipt.generation});
 }
 const after=await op('fence-status'),afterBudget=await json('/__playtt-capacity'),afterPins=await json('/__playtt-backup-pins');
 assert.deepEqual(after.state,before.state);assert.deepEqual(afterBudget,budget);assert.equal(afterPins.generation,4);
 for(const pin of pins.pins)assert.deepEqual(afterPins.pins.find(p=>p.revision===pin.revision),pin);
 report.finalPins=afterPins.generation;report.canonicalUnchanged=true;report.capacityLedgerUnchanged=true;report.result='pass';owner.phase='verified';
}catch(e){report.result='fail';report.errorName=e.name;owner.phase='failed';process.exitCode=1;}
finally{
 if(!owner.fenceReleased){try{await op('fence-release',{token:owner.fenceToken});owner.fenceReleased=true;}catch(e){report.fenceReleaseError=e.name;process.exitCode=1;}}
 await save(prefix+'owned-private.json',owner);report.fenceReleased=owner.fenceReleased;await save(prefix+'result.json',report);console.log(JSON.stringify(report));
}
