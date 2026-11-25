import assert from 'node:assert/strict';
import { readFile, mkdir, readdir, stat, rename } from 'node:fs/promises';
import { resolve } from 'node:path';
import { decodeCanonicalRestorePack } from '../src/canonical-restore-pack.ts';
import { verifiedBackupPin, registerBackupPin } from './playtt-backup-pin-client.mjs';
import { backupPinInput } from '../src/playtt-backup-pins.ts';
import { bucket, origin, source, configName, sha, hash, load, save, readPlan, cli, client } from './playtt-pin-restore-lib.mjs';
const prefix='artifacts/playtt-write-drain-';
const report=async(name,value)=>{const result={at:new Date().toISOString(),bucket,...value};await save(prefix+name+'.json',result);console.log(JSON.stringify({report:name,result:value.result,revision:value.revision,pins:value.pins}));};
assert.ok(process.argv.includes('--remote'));
const plan=await readPlan(),owned=await load(prefix+'owned-private.json');assert.equal(owned.cleanupComplete,true);
const c=await client();assert.equal((await c.control()).state,'paused');
const locationFile=prefix+'final-backup-location-private.json';
let exists=false;try{await readFile(locationFile);exists=true;}catch(e){if(e.code!=='ENOENT')throw e;}
let directory, previousState;
if(exists){
 assert.ok(process.argv.includes('--resume-before-download'),'Preserve existing attempt; explicit bounded resume required');
 const previousFence=await load(prefix+'final-backup-fence-private.json');assert.equal(previousFence.released,true);
 directory=(await load(locationFile)).directory;
 assert.equal(resolve(directory),directory);assert.ok(directory.startsWith(resolve('../../../../outputs/backups/cloudflare-wordpress-write-drain')+'/') || directory.startsWith(resolve('../../../../outputs/backups/cloudflare-wordpress-write-drain')+'\\'));
 const names=(await readdir(directory)).sort();
 const emptyManifest=names.includes('manifest.json');
 assert.deepEqual(names,emptyManifest?['manifest.json','objects','state.json']:['objects','state.json']);
 if(emptyManifest)assert.equal((await stat(directory+'/manifest.json')).size,0);
 assert.deepEqual(await readdir(directory+'/objects'),[]);
 previousState=await load(directory+'/state.json');
 const current=await c.operator('operator-fence-status');assert.equal(current.fence.active,false);assert.deepEqual(current.state,previousState.state);
 if(emptyManifest)await rename(directory+'/manifest.json',directory+'/manifest-incomplete-first.json');
 await report('final-backup-resume',{result:'pass',stage:'before-download',version:current.state.version,previousFenceReleased:true,scope:'Prior attempt has only state.json and an empty objects directory; no download or pin is replayed'});
}else{
 assert.equal(process.argv.includes('--resume-before-download'),false);
 directory=resolve('../../../../outputs/backups/cloudflare-wordpress-write-drain/final-'+new Date().toISOString().replace(/[:.]/g,'-'));
 await mkdir(directory,{recursive:true});await mkdir(directory+'/objects');await save(locationFile,{directory});
}
const fence=await c.operator('operator-fence-acquire',{ttlSeconds:600});await save(prefix+'final-backup-fence-private.json',{...fence,released:false});
let comparison, stage='fenced-state';
try{
 const state=await c.operator('operator-fence-status');assert.equal(state.coherent,true);assert.ok(state.state.pointer);
 if(previousState){assert.deepEqual(state.state,previousState.state);await save(directory+'/resumed-state.json',state);}else await save(directory+'/state.json',state);
 const pointer=state.state.pointer;assert.equal(pointer.manifestKey,'sites/default/markdown/revisions/'+pointer.revision+'.json');assert.ok(/^[a-f0-9-]{36}$/.test(pointer.revision));
 stage='download-manifest';
 await cli(['r2','object','get',bucket+'/'+pointer.manifestKey,'--file',directory+'/manifest.json','--remote','--config',configName]);
 const manifestBytes=await readFile(directory+'/manifest.json'),manifest=JSON.parse(manifestBytes);assert.equal(manifest.revision,pointer.revision);
 assert.equal(manifest.restorePack.objectKey,'sites/default/restore-packs/'+manifest.restorePack.sha256+'.zip');assert.match(manifest.restorePack.sha256,/^[a-f0-9]{64}$/);
 stage='download-pack';
 await cli(['r2','object','get',bucket+'/'+manifest.restorePack.objectKey,'--file',directory+'/restore.zip','--remote','--config',configName]);
 const pack=await readFile(directory+'/restore.zip');
 stage='decode-pack';
 const decoded=await decodeCanonicalRestorePack(manifest.restorePack,'sites/default',{markdown:manifest.files,uploads:manifest.uploads||[],wpContent:manifest.wpContent||[],wpContentDeleted:manifest.wpContentDeleted||[]},pack);
 const inventory=[];
 for(const [group,files]of [[decoded.markdown,manifest.files],[decoded.uploads,manifest.uploads||[]],[decoded.wpContent,manifest.wpContent||[]]])for(const item of group){const entry=files.find(x=>x.path===item.path);assert.ok(entry);assert.equal(sha(item.bytes),entry.sha256);await saveObject(entry.sha256,item.bytes);inventory.push({key:entry.objectKey,file:'objects/'+entry.sha256,sha256:entry.sha256,size:entry.size});}
 async function saveObject(name,bytes){const {writeFile}=await import('node:fs/promises');await writeFile(directory+'/objects/'+name,bytes);}
 inventory.push({key:manifest.manifestKey,file:'manifest.json',sha256:sha(manifestBytes),size:manifestBytes.length},{key:manifest.restorePack.objectKey,file:'restore.zip',sha256:sha(pack),size:pack.length});
 await save(directory+'/object-inventory.json',inventory);
 const verified=await verifiedBackupPin(directory),secrets=await load('../../../playtt-cms-secrets.json');
 await c.operator('operator-fence-renew',{token:fence.token,ttlSeconds:600});
 stage='register-pin';
 const receipt=await registerBackupPin(c.request,secrets.WORDPRESS_OPERATOR_TOKEN,fence.token,verified.pin);assert.equal(receipt.generation,23);await save(directory+'/retention-pin.json',receipt);
 const verification={at:new Date().toISOString(),result:'pass',scope:'Tracked-write target after seal denial/redeployment/recovery and owned cleanup; every archive entry decoded and verified, new backup pin acknowledged',bucket,revision:manifest.revision,objects:inventory.length,decodedBytes:manifest.restorePack.decodedBytes,archiveBytes:pack.length,archiveSha256:sha(pack),pinRegistered:true,pinGeneration:receipt.generation};
 await save(directory+'/verification.json',verification);await report('final-backup',verification);
 stage='compare-original';
 const original=await load(plan.latestDirectory+'/manifest.json');
 const differences=[];
 const compare=(a,b,field)=>{if(hash(a)!==hash(b))differences.push({field,expectedHash:hash(a),actualHash:hash(b)});};
 compare(original.files.map(x=>x.path).sort(),manifest.files.map(x=>x.path).sort(),'canonical-paths');
 const mutable=new Set(['_tables/usermeta.json','_runtime/playtt-auto-increment.json']);
 let unchanged=0;
 for(const item of original.files){if(mutable.has(item.path))continue;const actual=manifest.files.find(x=>x.path===item.path);compare(item.sha256,actual?.sha256,'file:'+item.path);if(actual?.sha256===item.sha256)unchanged++;}
 for(const field of ['uploads','wpContent','wpContentDeleted'])compare(original[field],manifest[field],field);
 const table=path=>JSON.parse(new TextDecoder().decode(decoded.markdown.find(x=>x.path===path).bytes));
 const posts=table('_tables/posts.json'),postmeta=table('_tables/postmeta.json'),sequence=table('_runtime/playtt-auto-increment.json');
 compare(plan.expected.postsTable,posts,'posts-table');compare(plan.expected.postmeta,postmeta,'postmeta-table');
 assert.equal(posts.some(x=>[owned.id,owned.id].includes(Number(x.ID))||[owned.id,owned.id].includes(Number(x.post_parent))),false);
 assert.ok(BigInt(sequence.sequences.wp_posts)>=BigInt(owned.id));
 for(const [key,value]of Object.entries(plan.expected.sequence.sequences))assert.ok(BigInt(sequence.sequences[key])>=BigInt(value));
 comparison={result:differences.length?'fail':'pass',unchangedCanonicalFiles:unchanged,originalMarkdown:plan.expected.metadata.length,originalHistoryRows:posts.filter(x=>x.post_type==='revision').length,postmetaRows:postmeta.length,uploads:manifest.uploads.length,cleanupComplete:true,sequenceHighWater:sequence.sequences,differences,scope:'Only login session metadata and monotonic ID counters are allowed to change; all original content/table/media/theme bytes compared'};
 await report('final-comparison',comparison);
}catch(error){await report('final-backup-failure-'+new Date().toISOString().replace(/[:.]/g,'-'),{result:'fail',stage,errorName:error.name,checks:c.checks});process.exitCode=1;}
finally{
 await c.operator('operator-fence-release',{token:fence.token});await save(prefix+'final-backup-fence-private.json',{...fence,released:true});
}
if(process.exitCode!==1){
 const current=await c.operator('operator-fence-status');assert.equal(current.coherent,true);assert.equal(current.fence.active,false);assert.equal((await c.control()).state,'paused');
 const pr=await c.request('/__playtt-backup-pins',{headers:c.auth});assert.equal(pr.status,200);const pins=await pr.json();assert.equal(pins.generation,23);
 for(const pin of (await load(prefix+'migration-private.json')).registry.pins)assert.deepEqual(backupPinInput(pins.pins.find(x=>x.revision===pin.revision)),backupPinInput(pin));
 await save(prefix+'final-registry-private.json',pins);
 const br=await c.request('/__playtt-capacity',{headers:c.auth});assert.equal(br.status,200);const budget=await br.json();assert.equal(budget.scope,bucket);assert.equal(budget.limitBytes,300000000);assert.ok(budget.remainingBytes>0);assert.equal(budget.writeTracking.pending,0);assert.equal(budget.writeTracking.sealed,false);assert.equal(budget.trackingConfigured,true);
 const sourceClient=await client(source),ss=await sourceClient.operator('operator-fence-status');assert.equal(ss.coherent,true);assert.equal(ss.fence.active,false);assert.equal(ss.state.version,309);assert.equal(ss.state.pointer.revision,plan.revision);assert.equal((await sourceClient.control()).state,'paused');
 const gateChecks=[];for(const path of ['/wp-admin/','/wp-json/wp/v2/media','/__playtt-backup-pins','/wp-content/uploads/2026/11/logo.webp']){const r=await fetch(origin+path,{redirect:'manual',signal:AbortSignal.timeout(30000)});assert.equal(r.status,404);assert.ok(r.headers.get('x-robots-tag')?.includes('noindex'));await r.arrayBuffer();gateChecks.push({path,status:r.status});}
 await report('final-status',{result:comparison?.result==='pass'?'pass':'fail',targetState:current.state,sourceState:ss.state,fenceActive:false,publisher:'paused',pins:23,budget,gateChecks,checks:c.checks});
 if(comparison?.result!=='pass')process.exitCode=1;
}
