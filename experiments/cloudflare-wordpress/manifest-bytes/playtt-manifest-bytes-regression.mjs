// Run existing envelope integration regressions with the exact candidate substituted.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdtemp,access} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {build} from 'esbuild';
import {sources,sourceHashes,sha} from './playtt-manifest-bytes-common.mjs';
assert.ok(process.argv.includes('--local')&&!process.argv.includes('--remote'));
const input=await sources(),testPath=resolve('tests/playtt-manifest-envelope.test.ts'),testBytes=await readFile(testPath);
assert.equal(sha(testBytes),'52405a7bc7a6aea298d912264a18e923a82280f05ab58112c42114f0dfdc7573');
const reportPath='artifacts/playtt-manifest-bytes-regression.json';
if(process.argv.includes('--check')){
 const report=JSON.parse(await readFile(reportPath,'utf8')),owner=JSON.parse(await readFile('artifacts/playtt-manifest-bytes-regression-owned-private.json','utf8'));
 assert.equal(owner.phase,'verified');assert.equal(report.exit,0);assert.equal(report.failures,0);assert.equal(report.tests,25);assert.deepEqual(report.sourceHashes,sourceHashes);assert.equal(report.testSourceSha256,sha(testBytes));
 assert.equal(report.compiledTestSha256,sha(await readFile(join(owner.directory,'regression.test.mjs'))));
 assert.deepEqual(JSON.parse(await readFile(join(owner.directory,'result.json'),'utf8')),report);
 console.log(JSON.stringify({result:'pass',tests:25,readOnly:true}));process.exit(0);
}
await access(reportPath).then(()=>{throw Error('Completed regression: inspect without replay');},e=>{if(e.code!=='ENOENT')throw e;});
const directory=await mkdtemp(resolve('artifacts/manifest-bytes-regression-'));
const output=join(directory,'regression.test.mjs');
await build({entryPoints:[testPath],outfile:output,bundle:true,platform:'node',format:'esm',target:'es2022',packages:'external',plugins:[{name:'exact-candidate',setup(b){b.onLoad({filter:/playtt-manifest-envelope\.ts$/},async args=>{if(resolve(args.path)!==resolve('src/playtt-manifest-envelope.ts'))return;return {contents:input.candidate,loader:'ts',resolveDir:resolve('src')};});}}]});
const result=spawnSync(process.execPath,['--test',output],{encoding:'utf8',timeout:120000,windowsHide:true});
await writeFile(join(directory,'stdout-private.log'),result.stdout||'');await writeFile(join(directory,'stderr-private.log'),result.stderr||'');
const report={schema:'playtt/manifest-bytes-regression/v1',sourceHashes,testSourceSha256:sha(testBytes),compiledTestSha256:sha(await readFile(output)),exit:result.status,signal:result.signal,tests:Number(result.stdout?.match(/ℹ tests (\d+)|# tests (\d+)/)?.slice(1).find(Boolean)),failures:Number(result.stdout?.match(/ℹ fail (\d+)|# fail (\d+)/)?.slice(1).find(Boolean)),cloudRequests:0};
await writeFile(join(directory,'result.json'),JSON.stringify(report,null,2)+'\n');
if(result.status!==0){console.log(result.stdout?.slice(-4000));console.log(result.stderr?.slice(-1000));}
assert.equal(result.status,0);assert.equal(report.failures,0);assert.ok(report.tests>=20);
await writeFile('artifacts/playtt-manifest-bytes-regression.json',JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(report));
await writeFile('artifacts/playtt-manifest-bytes-regression-owned-private.json',JSON.stringify({phase:'verified',directory},null,2)+'\n',{flag:'wx'});
