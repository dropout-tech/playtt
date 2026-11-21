// Two tested implementation edits applied only to the fixed diagnostic bundle copy.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdtemp,copyFile,access} from 'node:fs/promises';
import {resolve,join,basename} from 'node:path';
import {createHash} from 'node:crypto';
assert.ok(process.argv.includes('--local')&&!process.argv.includes('--remote'));
const load=async p=>JSON.parse(await readFile(p,'utf8')),sha=b=>createHash('sha256').update(b).digest('hex');
const output='artifacts/playtt-preallocated-cold-build-private.json';await access(output).then(()=>{throw Error('Existing build; inspect without replay');},e=>{if(e.code!=='ENOENT')throw e;});
const owner=await load('artifacts/playtt-preallocated-corpus-v2-owned-private.json'),proof=await load('artifacts/playtt-preallocated-corpus-v2-proof.json');assert.equal(owner.phase,'verified');assert.equal(proof.result,'pass');
const original=(await readFile('src/wordpress-runtime-artifact.ts','utf8')).replaceAll('\r\n','\n'),candidate=(await readFile(join(owner.directory,'candidate-source.ts'),'utf8')).replaceAll('\r\n','\n');
assert.equal(sha(original),proof.baselineSourceSha256);assert.equal(sha(candidate),proof.candidateSourceSha256);
const before=`        if (!$zip->extractTo('/', array_keys($expected))) {
            throw new RuntimeException('WordPress runtime artifact ZIP extraction failed.');
        }`;
const start=candidate.indexOf('        foreach ($expected as $name => $size) {'),end=candidate.indexOf('\n        foreach ($required as $path)',start);assert.ok(start>0&&end>start);const after=candidate.slice(start,end);
const hashOld='crypto.subtle.digest("SHA-256", Uint8Array.from(bytes).buffer)',hashNew='crypto.subtle.digest("SHA-256", bytes as Uint8Array<ArrayBuffer>)';assert.equal(original.replace(before,after).replace(hashOld,hashNew),candidate);
const baseline=await load('artifacts/playtt-cold-boot-build-v2-private.json');for(const m of baseline.modules)assert.equal(sha(await readFile(m.path)),m.sha256);
const entry=baseline.modules.find(m=>m.path.endsWith('.js'));let code=await readFile(entry.path,'utf8');assert.equal(code.split(before).length,2);code=code.replace(before,after);
const digestBefore='async function sha256Hex3(bytes) {\n  const digest2 = await crypto.subtle.digest("SHA-256", Uint8Array.from(bytes).buffer);',digestAfter='async function sha256Hex3(bytes) {\n  const digest2 = await crypto.subtle.digest("SHA-256", bytes);';assert.equal(code.split(digestBefore).length,2);code=code.replace(digestBefore,digestAfter);
const directory=await mkdtemp(resolve('artifacts/preallocated-cold-build-')),modules=[];
for(const m of baseline.modules){const path=join(directory,basename(m.path));if(m===entry)await writeFile(path,code,{flag:'wx'});else await copyFile(m.path,path);const b=await readFile(path);modules.push({path,bytes:b.length,sha256:sha(b)});}
const plan={...baseline,at:new Date().toISOString(),directory,entry:join(directory,basename(entry.path)),modules,variant:'preallocated-core-and-view-digest',baselineDiagnosticBundleSha256:entry.sha256,candidateSourceSha256:proof.candidateSourceSha256,semanticProofSha256:sha(await readFile('artifacts/playtt-preallocated-corpus-v2-proof.json')),candidateEdits:[{label:'preallocated-entry-streams',before,after},{label:'digest-buffer-view',before:digestBefore,after:digestAfter}],freshFullSourceBuild:false,centralRuntimeChanged:false,deployed:false};
await writeFile(output,JSON.stringify(plan,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({result:'pass',diagnosticModules:6,candidateImplementationEdits:2,centralRuntimeChanged:false,deployed:false}));
