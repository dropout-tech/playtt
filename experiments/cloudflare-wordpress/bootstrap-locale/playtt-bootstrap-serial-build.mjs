// Isolated full candidate. Preserve write accounting; serialize initial object writes.
import assert from 'node:assert/strict';import{readFile,writeFile,mkdir,access,readdir}from'node:fs/promises';import{resolve,join}from'node:path';import{createHash}from'node:crypto';
assert.ok(process.argv.includes('--local')&&!process.argv.includes('--remote'));
const load=async p=>JSON.parse(await readFile(p,'utf8')),sha=b=>createHash('sha256').update(b).digest('hex'),prior=resolve('../../../playtt-lazy-core-build'),target=resolve('../../../playtt-bootstrap-serial-build'),manifest=await load(join(prior,'build-inputs.json')),files=new Map();assert.equal(manifest.files.length,215);
for(const e of manifest.files){const b=await readFile(join(prior,e.path));assert.equal(sha(b),e.sha256);files.set(e.path,b);}
const old=files.get('src/worker.ts').toString();const before=`  const manifestFiles = await Promise.all(files.map(async (file): Promise<MarkdownManifestFile> => {
    const sha256 = await sha256Hex(file.bytes)
    const existing = currentFiles.get(file.path)
    if (existing?.sha256 === sha256 && existing.size === file.bytes.byteLength) return existing
    const objectKey = \\KEY\\
    if (current || !await bucket.head(objectKey)) await bucket.put(objectKey, file.bytes)
    return { path: file.path, objectKey, sha256, size: file.bytes.byteLength }
  }))`.replace('\\KEY\\','`${siteStorageKeys(site).markdownObjectPrefix}/${sha256}`');
const after=`  // The seed has more files than the durable write tracker permits in flight.
  // Settle each object before reserving the next; a failure cannot leave a
  // background Promise.all batch writing after the canonical lease aborts.
  const manifestFiles: MarkdownManifestFile[] = []
  for (const file of files) {
    const sha256 = await sha256Hex(file.bytes)
    const existing = currentFiles.get(file.path)
    if (existing?.sha256 === sha256 && existing.size === file.bytes.byteLength) {
      manifestFiles.push(existing)
      continue
    }
    const objectKey = \\KEY\\
    if (current || !await bucket.head(objectKey)) await bucket.put(objectKey, file.bytes)
    manifestFiles.push({ path: file.path, objectKey, sha256, size: file.bytes.byteLength })
  }`.replace('\\KEY\\','`${siteStorageKeys(site).markdownObjectPrefix}/${sha256}`');
assert.equal(old.split(before).length,2);const changed=old.replace(before,after);files.set('src/worker.ts',Buffer.from(changed));
const inputs={schema:'playtt/bootstrap-serial-build-inputs/v1',files:[...files].map(([path,b])=>({path,sha256:sha(b)})),changedInputs:['src/worker.ts'],addedInputs:[],unchangedPriorInputs:214,patches:[{path:'src/worker.ts',before,after,priorSha256:sha(old),sha256:sha(changed)}],centralRuntimeChanged:false,cloudRequests:0};
if(!process.argv.includes('--check')){await access(target).then(()=>{throw Error('Build exists; do not overwrite');},e=>{if(e.code!=='ENOENT')throw e;});for(const [name,b]of files){const p=join(target,name);await mkdir(dirnameFor(p),{recursive:true});await writeFile(p,b,{flag:'wx'});}await writeFile(join(target,'build-inputs.json'),JSON.stringify(inputs,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({prepared:true,inputs:215,changed:['src/worker.ts']}));}
else{
 assert.deepEqual(await load(join(target,'build-inputs.json')),inputs);for(const e of inputs.files)assert.equal(sha(await readFile(join(target,e.path))),e.sha256);
 assert.equal((await readFile(join(target,'typecheck-private.log'))).length,0);assert.ok((await readFile(join(target,'dry-run-private.log'),'utf8')).includes('--dry-run: exiting now.'));
 const priorPlan=await load('artifacts/playtt-lazy-core-build-private.json'),modules=[];for(const name of await readdir(join(target,'dry-run'))){if(!/\.(js|wasm|sqlite|zip)$/.test(name))continue;const path=join(target,'dry-run',name),b=await readFile(path);modules.push({path,bytes:b.length,sha256:sha(b)});}assert.equal(modules.length,6);assert.deepEqual(modules.filter(x=>!x.path.endsWith('.js')).map(x=>x.sha256).sort(),priorPlan.productionModules.filter(x=>!x.path.endsWith('.js')).map(x=>x.sha256).sort());
 const entry=modules.find(x=>x.path.endsWith('.js')),meta=await load(join(target,'dry-run/bundle-meta.json'));assert.equal(Object.keys(meta.inputs).filter(p=>p.startsWith('src/')).length,77);
 const source=await load('artifacts/playtt-recovery-provider-source-plan.json');for(const e of source.sources)assert.equal(sha((await readFile(e.path,'utf8')).replaceAll('\r\n','\n')),e.sha256);
 const proof={schema:'playtt/bootstrap-serial-build-proof/v1',result:'pass',sourceInputs:215,loadedSources:77,unchangedPriorInputs:214,changedInputs:['src/worker.ts'],bundleSha256:entry.sha256,binaryModulesUnchanged:5,centralSourcesUnchanged:82,typecheck:'pass',dryRun:'pass',deployed:false};
 await writeFile('artifacts/playtt-bootstrap-serial-build-private.json',JSON.stringify({productionModules:modules,productionBundleSha256:entry.sha256,entry:entry.path},null,2)+'\n',{flag:'wx'});await writeFile('artifacts/playtt-bootstrap-serial-build-proof.json',JSON.stringify(proof,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(proof));
}
function dirnameFor(p){return resolve(p,'..');}
