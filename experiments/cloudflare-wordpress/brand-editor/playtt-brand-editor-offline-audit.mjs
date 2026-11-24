import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {openSnapshotBundle} from './playtt-snapshot-bundle.mjs';
import {normalizeBrandContent} from './playtt-brand-content-equivalence.mjs';
assert.ok(process.argv.includes('--local')&&!process.argv.includes('--remote'));
const load=async p=>JSON.parse(await readFile(p,'utf8'));
const sha=b=>createHash('sha256').update(b).digest('hex');
const owner=await load('artifacts/playtt-brand-editor-complete-owned-private.json');
const report=await load('artifacts/playtt-brand-editor-complete-summary.json');
assert.equal(report.result,'pass');assert.ok(owner.sealed&&owner.localProcessesDisposed);
for(const entry of owner.executedInputs){assert.equal(sha(await readFile(join(owner.directory,'executed-inputs',entry.name))),entry.sha256);assert.equal(sha(await readFile(join('scripts',entry.name))),entry.sha256);}
assert.ok(report.finalBudget.writeTracking.sealed&&report.finalBudget.writeTracking.window.closed);
assert.equal(report.finalBudget.writeTracking.pending,0);assert.equal(report.outboundAttempts,0);
const stages={};
for(const label of ['baseline','installed','saved','pre-restart','post-restart','cold','final']){
 const snapshot=report.snapshots.find(x=>x.label===label);assert.ok(snapshot);
 stages[label]=(await openSnapshotBundle(join(owner.directory,label+'-independent'),snapshot.anchor)).graph;
}
const fingerprint=graph=>Object.fromEntries(['markdown','uploads','wpContent'].map(g=>[g,graph.contents[g].map(x=>[x.path,sha(x.bytes)]).sort((a,b)=>a[0].localeCompare(b[0]))]));
assert.deepEqual(fingerprint(stages['pre-restart']),fingerprint(stages['post-restart']));
const body=g=>Buffer.from(g.contents.markdown.find(x=>x.path==='page/home.md').bytes).toString().match(/^---\n(.+?)\n---\n\n?(.*)$/s)[2].slice(0,-1);
const expected=await load(join(owner.directory,'expected-page-private.json'));
assert.equal(normalizeBrandContent(body(stages.saved)),normalizeBrandContent(expected.expectedContent));
for(const label of ['cold','final'])assert.equal(body(stages[label]),body(stages.saved));
assert.equal(sha(body(stages.final)),report.savedContentSha256);
for(const [from,to]of [['JOOOOO!','CHANGED'],['brand-dong.svg','brand-ko.svg'],['https://line.me','https://example.org'],['<h1','<h2'],['lp-manual-lead','lp-missing'],['class="lp-index"','class="different"']]){
 assert.ok(body(stages.saved).includes(from));assert.notEqual(normalizeBrandContent(body(stages.saved).replace(from,to)),normalizeBrandContent(expected.expectedContent));
}
const pageFiles=stages.installed.contents.markdown.filter(x=>x.path.startsWith('page/')&&x.path!=='page/home.md');
for(const file of pageFiles)assert.equal(sha(stages.final.contents.markdown.find(x=>x.path===file.path).bytes),sha(file.bytes));
for(const g of ['uploads','wpContent'])assert.deepEqual(fingerprint(stages.final)[g],fingerprint(stages.installed)[g]);
for(const file of stages.baseline.contents.wpContent)assert.equal(sha(stages.final.contents.wpContent.find(x=>x.path===file.path).bytes),sha(file.bytes));
for(const file of stages.baseline.contents.markdown.filter(x=>!x.path.startsWith('_')))assert.equal(sha(stages.final.contents.markdown.find(x=>x.path===file.path).bytes),sha(file.bytes),'Original content changed');
const table=(g,p)=>JSON.parse(Buffer.from(g.contents.markdown.find(x=>x.path===p).bytes).toString());
assert.equal(table(stages.final,'_tables/usermeta.json').filter(x=>x.meta_key==='session_tokens').length,0);
assert.deepEqual(table(stages.final,'_tables/users.json'),table(stages.baseline,'_tables/users.json'));
const changedBaseline=stages.baseline.contents.markdown.filter(x=>{
 const other=stages.final.contents.markdown.find(y=>y.path===x.path);return !other||sha(other.bytes)!==sha(x.bytes);
}).map(x=>x.path);
const browser={};
const windowStarted=owner.expiresAt-owner.limits.durationSeconds*1000;
for(const step of ['reading','saved','cold','logout','public']){
 const ui=await load(join(owner.directory,step+'-ui-private.json'));
 const logs=(ui.logs||[]).filter(x=>Date.parse(x.timestamp)>=windowStarted);
 browser[step]={invalidBlocks:ui.snapshot.includes('未預期或無效'),errors:logs.filter(x=>x.level==='error').map(x=>x.message),warnings:logs.filter(x=>x.level==='warn').map(x=>x.message),priorAttemptEntries:(ui.logs||[]).length-logs.length};
 assert.equal(browser[step].invalidBlocks,false);assert.ok(!logs.some(x=>x.message.includes('Block validation failed')));
 if(['saved','cold','public'].includes(step))assert.ok(ui.snapshot.includes(owner.newPhrase));
 if(step==='logout')assert.ok(ui.snapshot.includes('你已完成登出'));
}
const attempts=[];
for(const [name,note]of [
 ['editor','Harness rejected 1024 operations above the existing 512 maximum; no WordPress test request.'],
 ['editor-ui','Theme 0.3.0 six invalid image blocks; browser tab disappeared before logout; one local session remains in sealed offline backup.'],
 ['editor-blockfix','Theme 0.3.1 native UI save succeeded; byte-only test oracle rejected normal WordPress serialization.'],
 ['editor-roundtrip','Save equivalence passed; root-page test required explicit Reading selection because importer preserved the existing homepage.'],
 ['editor-complete','Native Reading selection, canvas edit/save, complete restart/readback, anonymous root and logout passed.']]){
 const o=await load('artifacts/playtt-brand-'+name+'-owned-private.json');assert.ok(o.localProcessesDisposed);
 let b;try{b=await load(join(o.directory,'terminal-budget-private.json'));}catch(e){if(e.code!=='ENOENT')throw e;}
 if(o.expiresAt){assert.ok(o.sealed&&b.writeTracking.sealed&&b.writeTracking.window.closed);assert.equal(b.writeTracking.pending,0);}else{assert.equal(o.homeId,undefined);}
 attempts.push({name,note,phase:o.phase,armed:!!o.expiresAt,sealed:o.sealed,disposed:o.localProcessesDisposed,chargedBytes:b?.writeTracking.window?.bytes??b?.chargedBytes??null,puts:b?.writeTracking.window?.operations??0,executedInputs:o.executedInputs});
}
const result={schema:'playtt/brand-editor-audit/v1',at:new Date().toISOString(),scope:'Independent offline verification of isolated local workerd; no cloud operation or provider acceptance',result:'pass',themeVersion:report.themeVersion,themeFiles:42,themeZipSha256:report.themeZipSha256,bundleSha256:report.bundleSha256,homeId:report.homeId,content:{originalSha256:report.originalContentSha256,savedSha256:report.savedContentSha256,limitedNormalizations:4,mutationControlsRejected:6,coldAndFinalByteExact:true,otherPageFilesUnchanged:pageFiles.length},allInstalledMediaAndWpContentUnchanged:true,allBaselineWpContentUnchanged:true,baselineUserAccountsUnchanged:true,changedBaselinePaths:changedBaseline,allSessionsRemoved:true,limits:report.limits,chargedBytes:report.chargedBytes,chargedPuts:report.chargedPuts,sealed:true,pending:0,localProcessesDisposed:true,restartProofs:report.restartProofs,finalSnapshot:{version:report.snapshots.at(-1).version,objects:report.snapshots.at(-1).objects,files:report.snapshots.at(-1).files,manifestSha256:report.snapshots.at(-1).anchor.manifestSha256},observers:report.observerRuns,browser,attempts,providerMemoryAccepted:false,productionChanged:false};
await writeFile('artifacts/playtt-brand-editor-offline-audit.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({result:'pass',changedBaselinePaths:changedBaseline,browserErrorCount:Object.values(browser).reduce((n,x)=>n+x.errors.length,0),attempts:attempts.map(({name,armed,sealed,disposed,puts,chargedBytes})=>({name,armed,sealed,disposed,puts,chargedBytes})),observers:report.observerRuns}));
