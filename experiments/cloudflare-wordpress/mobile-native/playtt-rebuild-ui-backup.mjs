import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { decodeCanonicalRestorePack } from '../src/canonical-restore-pack.ts';
assert.ok(process.argv.includes('--remote'));
const label=process.argv.find(v=>v.startsWith('--label='))?.slice(8);assert.ok(['origin-diagnostic','before-postmeta','postmeta-upload','postmeta-cold','postmeta-cleanup','after-media-repair','before-origin','after-origin','after-native-ui','after-body-diagnostics','history-native-failure','content-native-restored','after-history-origin','after-memory-sampling','after-write-latency','after-mobile-native'].includes(label),'Explicit UI backup phase required');
const config=JSON.parse(await readFile('wrangler.playtt-rebuild-audit.jsonc','utf8'));assert.equal(config.name,'playtt-wp-free-rebuild-audit');assert.equal(config.r2_buckets[0].bucket_name,'playtt-wordpress-rebuild-audit');assert.deepEqual(config.triggers.crons,[]);
const origin='https://playtt-wp-free-rebuild-audit.muzhi-garden-platform.workers.dev';
const bucket='playtt-wordpress-rebuild-audit';
const secrets=JSON.parse(await readFile('../../../playtt-cms-secrets.json','utf8'));
const directory=resolve('../../../../outputs/backups/cloudflare-wordpress-rebuild-ui/'+label+'-'+new Date().toISOString().replace(/[:.]/g,'-'));
await mkdir(directory,{recursive:true});await mkdir(directory+'/objects');
const sha=b=>createHash('sha256').update(b).digest('hex');
async function operator(phase,body){
  const r=await fetch(origin+'/?phase='+phase,{method:body?'POST':'GET',headers:{'X-Playtt-Probe':secrets.WORDPRESS_OPERATOR_TOKEN,authorization:'Bearer '+secrets.WORDPRESS_OPERATOR_TOKEN,'content-type':'application/json'},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(180000)});
  assert.equal(r.headers.get('x-playtt-probe-state'),'restore-v1');assert.equal(r.status,200,'Operator '+phase+' failed: '+r.status);return r.json();
}
async function getObject(key,path){
  assert.ok(key.startsWith('sites/default/'));assert.ok(!key.includes('..'));
  await new Promise((done,fail)=>{const child=spawn(process.execPath,['node_modules/wrangler/bin/wrangler.js','r2','object','get',bucket+'/'+key,'--file',path,'--remote','--config','wrangler.playtt-rebuild-audit.jsonc'],{stdio:'ignore'});child.on('error',fail);child.on('exit',code=>code===0?done():fail(Error('Backup object download failed.')));});
}
const fence=await operator('operator-fence-acquire',{ttlSeconds:600});
try{
  const status=await operator('operator-fence-status');assert.equal(status.coherent,true);assert.ok(status.state.pointer);
  await writeFile(directory+'/state.json',JSON.stringify(status,null,2));
  await getObject(status.state.pointer.manifestKey,directory+'/manifest.json');
  const manifest=JSON.parse(await readFile(directory+'/manifest.json','utf8'));
  assert.equal(manifest.revision,status.state.pointer.revision);assert.ok(manifest.restorePack);
  await getObject(manifest.restorePack.objectKey,directory+'/restore.zip');
  const pack=await readFile(directory+'/restore.zip');
  const decoded=await decodeCanonicalRestorePack(manifest.restorePack,'sites/default',{markdown:manifest.files,uploads:manifest.uploads||[],wpContent:manifest.wpContent||[],wpContentDeleted:manifest.wpContentDeleted||[]},pack);
  const objects=[];
  for(const [group,files]of [[decoded.markdown,manifest.files],[decoded.uploads,manifest.uploads||[]],[decoded.wpContent,manifest.wpContent||[]]])for(const item of group){
    const entry=files.find(x=>x.path===item.path);assert.ok(entry);assert.equal(sha(item.bytes),entry.sha256);
    await writeFile(directory+'/objects/'+entry.sha256,item.bytes);objects.push({key:entry.objectKey,file:'objects/'+entry.sha256,sha256:entry.sha256,size:entry.size});
  }
  objects.push({key:manifest.manifestKey,file:'manifest.json',sha256:sha(await readFile(directory+'/manifest.json')),size:(await readFile(directory+'/manifest.json')).length},{key:manifest.restorePack.objectKey,file:'restore.zip',sha256:sha(pack),size:pack.length});
  await writeFile(directory+'/object-inventory.json',JSON.stringify(objects,null,2));
  const report={at:new Date().toISOString(),scope:'Authenticated remote R2 backup; every decoded entry verified; restore is a separate acceptance',result:'pass',bucket,revision:manifest.revision,objects:objects.length,decodedBytes:manifest.restorePack.decodedBytes,archiveBytes:pack.length,archiveSha256:sha(pack)};
  await writeFile(directory+'/verification.json',JSON.stringify(report,null,2));
  await writeFile('artifacts/playtt-rebuild-ui-backup-'+label+'.json',JSON.stringify(report,null,2));
  await writeFile('artifacts/playtt-rebuild-ui-backup-'+label+'-location-private.json',JSON.stringify({directory}));
  console.log(JSON.stringify(report));
}finally{await operator('operator-fence-release',{token:fence.token});}
