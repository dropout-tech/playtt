// Existing tests run unchanged against the exact isolated full-source candidate.
// Node currently lacks toBase64, so this integration run exercises the fallback.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,mkdtemp,access} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {build} from 'esbuild';
import {sha,sources} from './playtt-base64-native-common.mjs';
assert.ok(process.argv.includes('--local')&&!process.argv.includes('--remote'));
const prefix='artifacts/playtt-base64-native-regression-',ownerPath=prefix+'owned-private.json';await access(ownerPath).then(()=>{throw Error('Existing attempt: inspect without replay');},e=>{if(e.code!=='ENOENT')throw e;});
const target=resolve('../../../playtt-base64-native-build'),input=await sources();assert.equal(sha(await readFile(join(target,'src/playtt-manifest-envelope.ts'))),input.candidateSha256);
const directory=await mkdtemp(resolve('artifacts/base64-native-regression-')),owner={phase:'starting',directory,processCompleted:false};await writeFile(ownerPath,JSON.stringify(owner,null,2),{flag:'wx'});
try{
 const inputs=[];for(const name of ['tests/playtt-manifest-envelope.test.ts','scripts/playtt-snapshot-bundle.mjs','scripts/playtt-backup-pin-client.mjs','scripts/playtt-content-snapshot-source.mjs']){const bytes=await readFile(name),path=join(target,name);await mkdir(resolve(path,'..'),{recursive:true});await writeFile(path,bytes,{flag:'wx'});assert.equal(sha(await readFile(path)),sha(bytes));inputs.push({path:name,sha256:sha(bytes)});}
 assert.equal(inputs[0].sha256,'52405a7bc7a6aea298d912264a18e923a82280f05ab58112c42114f0dfdc7573');
 const output=join(directory,'regression.test.mjs');await build({entryPoints:[join(target,inputs[0].path)],outfile:output,bundle:true,platform:'node',format:'esm',target:'es2022',packages:'external',logLevel:'error'});
 const result=spawnSync(process.execPath,['--test',output],{cwd:target,encoding:'utf8',timeout:120000,windowsHide:true});owner.processCompleted=true;await writeFile(join(directory,'stdout-private.log'),result.stdout||'');await writeFile(join(directory,'stderr-private.log'),result.stderr||'');
 const tests=Number(result.stdout?.match(/ℹ tests (\d+)|# tests (\d+)/)?.slice(1).find(Boolean)),failures=Number(result.stdout?.match(/ℹ fail (\d+)|# fail (\d+)/)?.slice(1).find(Boolean));assert.equal(result.status,0);assert.equal(tests,25);assert.equal(failures,0);
 const report={schema:'playtt/base64-native-regression/v1',at:new Date().toISOString(),result:'pass',candidateSha256:input.candidateSha256,inputs,compiledTestSha256:sha(await readFile(output)),stdoutSha256:sha(result.stdout),stderrSha256:sha(result.stderr),exit:result.status,tests,failures,nodeNative:typeof Uint8Array.prototype.toBase64,cloudRequests:0,centralRuntimeChanged:false,scope:'25 unchanged envelope/persistence/corruption/backup/pin/public-reader tests against isolated full source, using Node fallback. Native fast path separately validated in actual workerd.'};assert.equal(report.nodeNative,'undefined');await writeFile(prefix+'summary.json',JSON.stringify(report,null,2)+'\n',{flag:'wx'});owner.phase='verified';console.log(JSON.stringify(report));
}catch(e){owner.phase='failed';await writeFile(join(directory,'failure-private.json'),JSON.stringify({name:e.name,message:e.message,stack:e.stack}));throw e;}finally{await writeFile(ownerPath,JSON.stringify(owner,null,2));}
