import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
const root=resolve(import.meta.dirname,'..');
const stateDirectory='../../../cf-cms-secure-state';
// Only local R2 emulation. The optional website importer has an upstream
// capability-contract mismatch and is deliberately excluded from this probe.
for(const [manifestName,fileName] of [
  ['wordpress-runtime-artifact','cloudflare-wordpress-runtime-corpus.zip'],
  ['wordpress-static-artifact','cloudflare-wordpress-static-corpus.bin'],
  ['sqlite-database-integration-artifact','cloudflare-sqlite-database-integration.zip'],
]) {
  const manifest=JSON.parse(await readFile(resolve(root,'assets',manifestName+'.json'),'utf8'));
  const file=resolve(root,'artifacts',fileName);
  const data=await readFile(file), expected=manifest.archive||manifest.blob;
  if(data.length!==expected.size||createHash('sha256').update(data).digest('hex')!==expected.sha256)throw Error('Artifact mismatch: '+fileName);
  await new Promise((accept,reject)=>{
    const child=spawn(process.execPath,[resolve(root,'node_modules/wrangler/bin/wrangler.js'),'r2','object','put','playtt-wordpress-probe/'+manifest.key,'--file',file,'--local','--persist-to',resolve(root,stateDirectory)],{cwd:root,stdio:'inherit'});
    child.on('error',reject);child.on('exit',code=>code===0?accept():reject(Error('Local provision failed: '+code)));
  });
}
