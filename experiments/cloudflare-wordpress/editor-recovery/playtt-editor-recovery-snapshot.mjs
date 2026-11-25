import assert from 'node:assert/strict';
import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { decodeCanonicalRestorePack } from '../src/canonical-restore-pack.ts';
import { verifiedBackupPin, registerBackupPin } from './playtt-backup-pin-client.mjs';
import { client, origin, bucket, configName, cli, load, save, sha, hash } from './playtt-pin-restore-lib.mjs';
assert.ok(process.argv.includes('--remote'));
const prefix='artifacts/playtt-editor-recovery-',location=prefix+'inspection-backup-location-private.json';
let exists=false;try{await access(location);exists=true;}catch(e){if(e.code!=='ENOENT')throw e;}assert.equal(exists,false,'Preserve the existing inspection backup');
const owned=await load(prefix+'owned-private.json');assert.equal(owned.origin,origin);assert.equal(owned.phase,'sealed');
const c=await client(),s=await c.operator('operator-fence-status');assert.equal(s.fence.active,false);assert.equal(s.coherent,true);assert.equal(hash(s.state),hash(owned.sealedState));
const directory=resolve('../../../../outputs/backups/cloudflare-wordpress-editor-recovery/inspection-'+new Date().toISOString().replace(/[:.]/g,'-'));await mkdir(directory,{recursive:true});await mkdir(directory+'/objects');await save(location,{directory});
const fence=await c.operator('operator-fence-acquire',{ttlSeconds:600});await save(prefix+'inspection-fence-private.json',{...fence,released:false});
let stage='download';
try{
 const current=await c.operator('operator-fence-status');assert.equal(hash(current.state),hash(s.state));await save(directory+'/state.json',current);
 async function download(pointer,dir){
  await mkdir(dir,{recursive:true});assert.equal(pointer.manifestKey,'sites/default/markdown/revisions/'+pointer.revision+'.json');
  await cli(['r2','object','get',bucket+'/'+pointer.manifestKey,'--file',dir+'/manifest.json','--remote','--config',configName]);
  const manifestBytes=await readFile(dir+'/manifest.json'),m=JSON.parse(manifestBytes);assert.equal(m.revision,pointer.revision);
  assert.equal(m.restorePack.objectKey,'sites/default/restore-packs/'+m.restorePack.sha256+'.zip');
  await cli(['r2','object','get',bucket+'/'+m.restorePack.objectKey,'--file',dir+'/restore.zip','--remote','--config',configName]);
  const pack=await readFile(dir+'/restore.zip'),decoded=await decodeCanonicalRestorePack(m.restorePack,'sites/default',{markdown:m.files,uploads:m.uploads||[],wpContent:m.wpContent||[],wpContentDeleted:m.wpContentDeleted||[]},pack);
  return {m,manifestBytes,pack,decoded};
 }
 const now=await download(s.state.pointer,directory),prepared=await load(prefix+'prepared.json'),before=await download(prepared.state.pointer,directory+'/prepared-baseline');
 stage='compare';
 const changed=now.m.files.filter(x=>before.m.files.find(y=>y.path===x.path)?.sha256!==x.sha256).map(x=>x.path);
 const removed=before.m.files.filter(x=>!now.m.files.some(y=>y.path===x.path)).map(x=>x.path);
 const decodeTable=(bundle,path)=>JSON.parse(new TextDecoder().decode(bundle.decoded.markdown.find(x=>x.path===path).bytes));
 const rowDiff=(path,key)=>{const a=decodeTable(before,path),b=decodeTable(now,path);return {added:b.filter(y=>!a.some(x=>x[key]===y[key])).map(x=>({id:x[key],metaKey:x.meta_key})),removed:a.filter(x=>!b.some(y=>x[key]===y[key])).map(x=>x[key]),changed:b.flatMap(y=>{const x=a.find(x=>x[key]===y[key]);if(!x||hash(x)===hash(y))return [];return [{id:y[key],metaKey:y.meta_key,fields:[...new Set([...Object.keys(x),...Object.keys(y)])].filter(k=>hash(x[k]??null)!==hash(y[k]??null))}];})};};
 const comparison={at:new Date().toISOString(),result:'observed',preparedVersion:prepared.state.version,currentVersion:s.state.version,changedFiles:changed,removedFiles:removed,postmeta:rowDiff('_tables/postmeta.json','meta_id'),usermeta:rowDiff('_tables/usermeta.json','umeta_id'),posts:rowDiff('_tables/posts.json','ID'),uploadsIdentical:hash(before.m.uploads)===hash(now.m.uploads),themeIdentical:hash(before.m.wpContent)===hash(now.m.wpContent),scope:'Complete decoded prepared draft snapshot versus frozen post-idle snapshot; values retained privately, only field names and IDs reported'};
 await save(prefix+'snapshot-comparison.json',comparison);
 const inventory=[];
 for(const [group,entries]of [[now.decoded.markdown,now.m.files],[now.decoded.uploads,now.m.uploads||[]],[now.decoded.wpContent,now.m.wpContent||[]]])for(const item of group){const entry=entries.find(x=>x.path===item.path);assert.ok(entry);assert.equal(sha(item.bytes),entry.sha256);await writeFile(directory+'/objects/'+entry.sha256,item.bytes);inventory.push({key:entry.objectKey,file:'objects/'+entry.sha256,sha256:entry.sha256,size:entry.size});}
 inventory.push({key:now.m.manifestKey,file:'manifest.json',sha256:sha(now.manifestBytes),size:now.manifestBytes.length},{key:now.m.restorePack.objectKey,file:'restore.zip',sha256:sha(now.pack),size:now.pack.length});await save(directory+'/object-inventory.json',inventory);
 stage='register-pin';const verified=await verifiedBackupPin(directory),secrets=await load('../../../playtt-cms-secrets.json');await c.operator('operator-fence-renew',{token:fence.token,ttlSeconds:600});
 const receipt=await registerBackupPin(c.request,secrets.WORDPRESS_OPERATOR_TOKEN,fence.token,verified.pin);assert.equal(receipt.generation,25);await save(directory+'/retention-pin.json',receipt);
 const report={at:new Date().toISOString(),result:'pass',bucket,revision:now.m.revision,version:s.state.version,objects:inventory.length,decodedBytes:now.m.restorePack.decodedBytes,archiveBytes:now.pack.length,archiveSha256:sha(now.pack),pinRegistered:true,pinGeneration:25,ownedDraftPresent:192,cleanupComplete:false,writeSealRetained:true};await save(directory+'/verification.json',report);await save(prefix+'inspection-backup.json',report);console.log(JSON.stringify({result:'pass',version:s.state.version,pins:25,changedFiles:changed,postmeta:comparison.postmeta,usermeta:comparison.usermeta,posts:comparison.posts}));
}catch(error){await save(prefix+'inspection-failure-private.json',{stage,errorName:error.name,message:error.message});console.log(JSON.stringify({result:'fail',stage,errorName:error.name}));process.exitCode=1;}
finally{await c.operator('operator-fence-release',{token:fence.token});await save(prefix+'inspection-fence-private.json',{...fence,released:true});}
