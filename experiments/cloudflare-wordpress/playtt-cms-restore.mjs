import assert from 'node:assert/strict';
import { readFile, writeFile, realpath } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
const bucket='playtt-wordpress-restore-probe',origin='https://playtt-wp-free-cms-probe.muzhi-garden-platform.workers.dev';
const mode=process.argv[2];assert.ok(['--check-empty','--upload-backup','--restore'].includes(mode));
const {directory}=JSON.parse(await readFile('../../../playtt-cms-backup-location.json','utf8'));
assert.ok((await realpath(directory)).startsWith((await realpath('../../../../outputs/backups/cloudflare-wordpress'))+sep));
const config=JSON.parse(await readFile('wrangler.playtt-cms-restore.jsonc','utf8'));
assert.equal(config.r2_buckets[0].bucket_name,bucket);assert.equal(config.vars.PLAYTT_STATE_PARTITION,'restore-v1');
const secrets=JSON.parse(await readFile('../../../playtt-cms-secrets.json','utf8'));
async function operator(phase,body){
  const r=await fetch(origin+'/?phase='+phase,{method:body?'POST':'GET',headers:{'X-Playtt-Probe':secrets.WORDPRESS_OPERATOR_TOKEN,authorization:'Bearer '+secrets.WORDPRESS_OPERATOR_TOKEN,'content-type':'application/json'},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(180000)});
  assert.equal(r.headers.get('x-playtt-probe-state'),'restore-v1','Refuse to touch primary state');assert.equal(r.status,200,'Operator failed: '+phase+' '+r.status);return r.json();
}
if(mode==='--upload-backup'){
  const inventory=JSON.parse(await readFile(directory+'/object-inventory.json','utf8'));
  const objects=[...new Map(inventory.map(x=>[x.key,x])).values()];
  assert.ok(objects.length>0&&objects.length<1000);let completed=0;
  for(const item of objects){
    assert.ok(item.key.startsWith('sites/default/')&&!item.key.includes('..'));
    assert.ok(/^(objects\/[a-f0-9]{64}|manifest\.json|restore\.zip)$/.test(item.file));
    const data=await readFile(resolve(directory,item.file));assert.equal(data.length,item.size);assert.equal(createHash('sha256').update(data).digest('hex'),item.sha256);
  }
  const queue=[...objects];
  await Promise.all(Array.from({length:4},async()=>{while(queue.length){const item=queue.shift();await new Promise((done,fail)=>{const child=spawn(process.execPath,['node_modules/wrangler/bin/wrangler.js','r2','object','put',bucket+'/'+item.key,'--file',resolve(directory,item.file),'--remote','--config','wrangler.playtt-cms-restore.jsonc'],{stdio:'ignore'});child.on('error',fail);child.on('exit',code=>code===0?done():fail(Error('Restore target upload failed')));});completed++;if(completed%25===0)console.log(JSON.stringify({uploaded:completed,total:objects.length}));}}));
  const report={at:new Date().toISOString(),result:'pass',scope:'Verified local backup objects copied only into separate private R2 restore bucket',bucket,objects:completed};await writeFile('artifacts/playtt-cms-restore-upload.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}else if(mode==='--check-empty'){
  const status=await operator('operator-fence-status');assert.equal(status.coherent,true);assert.equal(status.state.pointer,null);assert.equal(status.state.version,0);
  const report={at:new Date().toISOString(),result:'pass',scope:'Separate remote restore partition has no canonical WordPress state',status};await writeFile('artifacts/playtt-cms-restore-empty.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}else{
  const before=await operator('operator-fence-status');assert.equal(before.coherent,true);assert.ok(before.state.pointer);
  const source=JSON.parse(await readFile(directory+'/state.json','utf8'));assert.notEqual(before.state.pointer.revision,source.state.pointer.revision,'Target must be independent fresh test data');
  const upload=JSON.parse(await readFile('artifacts/playtt-cms-restore-upload.json','utf8'));assert.equal(upload.bucket,bucket);assert.equal(upload.result,'pass');
  await operator('operator-reset',{});const empty=await operator('operator-fence-status');assert.equal(empty.state.pointer,null);
  const restored=await operator('operator-restore',source.state.pointer);assert.equal(restored.restored,true);
  const after=await operator('operator-fence-status');assert.equal(after.coherent,true);assert.equal(after.state.pointer.revision,source.state.pointer.revision);
  const report={at:new Date().toISOString(),result:'pass',scope:'Independent R2 bucket and DO partition restored from verified local backup; content checks follow separately',bucket,sourceRevision:source.state.pointer.revision,targetFreshRevision:before.state.pointer.revision,after};await writeFile('artifacts/playtt-cms-restore.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}
