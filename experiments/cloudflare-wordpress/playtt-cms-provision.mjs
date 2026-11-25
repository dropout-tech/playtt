import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';

assert.ok(process.argv.includes('--remote'), 'Explicit --remote required for the isolated playtt bucket.');
const restore=process.argv.includes('--restore-target');
const root=resolve(import.meta.dirname,'..'), bucket=restore?'playtt-wordpress-restore-probe':'playtt-wordpress-probe', files=[];
for(const [manifestName,fileName] of [
  ['wordpress-runtime-artifact','cloudflare-wordpress-runtime-corpus.zip'],
  ['wordpress-static-artifact','cloudflare-wordpress-static-corpus.bin'],
  ['sqlite-database-integration-artifact','cloudflare-sqlite-database-integration.zip'],
]) {
  const manifest=JSON.parse(await readFile(resolve(root,'assets',manifestName+'.json'),'utf8'));
  const file=resolve(root,'artifacts',fileName), data=await readFile(file), expected=manifest.archive||manifest.blob;
  assert.equal(data.length,expected.size); assert.equal(createHash('sha256').update(data).digest('hex'),expected.sha256);
  files.push({file,key:manifest.key,size:data.length,sha256:expected.sha256});
}
assert.ok(files.reduce((total,file)=>total+file.size,0)<70*1024*1024,'Provisioning exceeds the reviewed 70 MiB budget.');
for(const file of files) {
  await new Promise((accept,reject)=>{
    const child=spawn(process.execPath,[resolve(root,'node_modules/wrangler/bin/wrangler.js'),'r2','object','put',bucket+'/'+file.key,'--file',file.file,'--remote','--config','wrangler.playtt-cms.jsonc'],{cwd:root,stdio:'inherit'});
    child.on('error',reject); child.on('exit',code=>code===0?accept():reject(Error('Remote provision failed: '+code)));
  });
}
await writeFile(resolve(root,'artifacts/playtt-cms-'+(restore?'restore':'remote')+'-provision.json'),JSON.stringify({at:new Date().toISOString(),bucket,scope:'Three immutable core artifacts only; optional importer excluded',files:files.map(({file,...metadata})=>metadata)},null,2));
