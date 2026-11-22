// Rebuildable isolated source candidate; read-only --check after local dry-run.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,access,readdir} from 'node:fs/promises';
import {resolve,join,relative} from 'node:path';
import {makeCandidate,sha,baselineSha256} from './playtt-path-scan-candidate.mjs';
assert.ok(process.argv.includes('--local')&&!process.argv.includes('--remote'));
const get=name=>process.argv.find(x=>x.startsWith('--'+name+'='))?.slice(name.length+3);
const rt=process.cwd(),previous=resolve(get('previous')||'../../../playtt-manifest-bytes-build'),target=resolve(get('target')||'../../../playtt-path-scan-build');
const load=async p=>JSON.parse(await readFile(p,'utf8')),priorInputs=await load(join(previous,'build-inputs.json')),files=new Map();
assert.equal(priorInputs.sourceCount,83);assert.equal(priorInputs.files.length,206);assert.notEqual(target,previous);assert.notEqual(target,rt);
for(const f of priorInputs.files){assert.ok(!f.path.includes('..')&&!resolve(previous,f.path).startsWith(target));const data=await readFile(join(previous,f.path));assert.equal(sha(data),f.sha256);files.set(f.path,data);}
assert.equal(sha(files.get('src/playtt-php-loader.mjs')),baselineSha256);const patch=makeCandidate(files.get('src/playtt-php-loader.mjs').toString());files.set('src/playtt-php-loader.mjs',Buffer.from(patch.candidate));
const inputs={schema:'playtt/path-scan-build-inputs/v1',sourceCount:83,files:[...files].map(([path,data])=>({path,sha256:sha(data)})),baselineSha256,candidateSha256:patch.candidateSha256,changedInputs:['src/playtt-php-loader.mjs'],centralSourceChanged:false,cloudRequests:0};
if(!process.argv.includes('--check')){
 await access(target).then(()=>{throw Error('Target already exists');},e=>{if(e.code!=='ENOENT')throw e;});
 for(const [name,data]of files){const path=join(target,name);await mkdir(resolve(path,'..'),{recursive:true});await writeFile(path,data,{flag:'wx'});}await writeFile(join(target,'build-inputs.json'),JSON.stringify(inputs,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({result:'prepared',inputs:files.size,candidateSha256:patch.candidateSha256}));
}else{
 assert.deepEqual(await load(join(target,'build-inputs.json')),inputs);for(const f of inputs.files)assert.equal(sha(await readFile(join(target,f.path))),f.sha256,f.path);
 assert.equal((await readFile(join(target,'typecheck-private.log'))).length,0);assert.ok((await readFile(join(target,'dry-run-private.log'),'utf8')).includes('--dry-run: exiting now.'));
 const prior=await load('artifacts/playtt-manifest-bytes-build-private.json'),old=await readFile(prior.entry,'utf8'),current=await readFile(join(target,'dry-run/worker-playtt-do.js'),'utf8');assert.equal(sha(old),prior.productionBundleSha256);
 const scoped=text=>{const a=text.indexOf('    lookupPath(path, opts = {}) {'),b=text.indexOf('\n    getPath(node) {',a);assert.ok(a>=0&&b>a);return {outside:text.slice(0,a)+'<LOOKUP>'+text.slice(b),lookup:text.slice(a,b)};};
 const a=scoped(old),b=scoped(current);assert.equal(a.outside,b.outside,'Compiled change outside lookupPath');assert.ok(b.lookup.includes('path.indexOf("/", scanPosition)'));assert.notEqual(a.lookup,b.lookup);
 const modules=[];for(const name of await readdir(join(target,'dry-run'))){if(!/\.(js|wasm|sqlite|zip)$/.test(name))continue;const path=join(target,'dry-run',name),data=await readFile(path);modules.push({path,bytes:data.length,sha256:sha(data)});}assert.equal(modules.length,6);
 assert.deepEqual(modules.filter(m=>!m.path.endsWith('.js')).map(m=>m.sha256).sort(),prior.productionModules.filter(m=>!m.path.endsWith('.js')).map(m=>m.sha256).sort());
 const meta=await load(join(target,'dry-run/bundle-meta.json'));let loaded=0;for(const name of Object.keys(meta.inputs)){if(name.startsWith('node-built-in-modules:'))continue;const path=resolve(target,name);if(name.startsWith('src/')){assert.equal(sha(await readFile(path)),inputs.files.find(f=>f.path===name)?.sha256);loaded++;}else assert.ok(!path.startsWith(join(rt,'src')));}
 const central=await load('artifacts/playtt-recovery-provider-source-plan.json');for(const f of central.sources)assert.equal(sha((await readFile(f.path,'utf8')).replaceAll('\r\n','\n')),f.sha256);assert.equal(sha((await readFile('src/playtt-php-loader.mjs','utf8')).replaceAll('\r\n','\n')),baselineSha256);
 const plan={schema:'playtt/path-scan-build/v1',productionModules:modules,productionBundleSha256:sha(current),entry:join(target,'dry-run/worker-playtt-do.js')};
 const proof={schema:'playtt/path-scan-build-proof/v1',result:'pass',inputs:206,sourceCount:83,loadedSourceCount:loaded,baselineSha256,candidateSha256:patch.candidateSha256,baselineBundleSha256:sha(old),bundleSha256:sha(current),typecheck:'pass',wranglerDryRun:'pass',exactScopedCompiledChanges:true,unchangedBinaryModules:5,centralRuntimeChanged:false,cloudRequests:0,deployed:false};
 for(const [name,obj]of [['private',plan],['proof',proof]]){const path='artifacts/playtt-path-scan-build-'+name+'.json';try{assert.deepEqual(await load(path),obj);}catch(e){if(e.code!=='ENOENT')throw e;await writeFile(path,JSON.stringify(obj,null,2)+'\n',{flag:'wx'});}}console.log(JSON.stringify(proof));
}
