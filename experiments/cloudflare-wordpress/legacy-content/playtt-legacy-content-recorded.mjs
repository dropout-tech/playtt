import assert from 'node:assert/strict';
import {readFile,writeFile,mkdtemp,access} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {convertToLegacyContentBundle} from './playtt-legacy-content-bundle.mjs';
import {importSnapshotBundle} from './playtt-snapshot-bundle.mjs';
assert.deepEqual(process.argv.slice(2),['--offline']);
const ownerPath='artifacts/playtt-legacy-content-owned-private.json',load=async p=>JSON.parse(await readFile(p,'utf8'));
await access(ownerPath).then(()=>{throw Error('Existing legacy conversion owner; do not replay');},e=>{if(e.code!=='ENOENT')throw e;});
const source=await load('artifacts/playtt-envelope-provider-backup-owned-private.json');assert.equal(source.phase,'verified');assert.equal(source.anchor.revision,'84fea105-9e00-41ad-abba-23ba958cc215');
const directory=await mkdtemp(resolve('artifacts/legacy-content-')),owner={phase:'converting',directory,sourceAnchor:source.anchor};await writeFile(ownerPath,JSON.stringify(owner,null,2),{flag:'wx'});
try{
 const result=await convertToLegacyContentBundle(source.directory+'/independent',source.anchor,join(directory,'legacy'));const independent=await importSnapshotBundle(join(directory,'legacy'),result.graph.anchor,join(directory,'independent'));assert.deepEqual(independent.graph.contents,result.graph.contents);
 owner.phase='converted';owner.anchor=result.graph.anchor;owner.sourceDirectory=source.directory;await writeFile(ownerPath,JSON.stringify(owner,null,2));
 const report={...result.provenance,at:new Date().toISOString(),objects:result.graph.objects.length,files:result.graph.contents.markdown.length+result.graph.contents.uploads.length+result.graph.contents.wpContent.length,independentImportExact:true,lastCloudReadAt:'2026-11-21T14:24:49.947Z',lastCloudRemaining:1083839,fitsTransferOnly:result.provenance.cost.totalBytes<=1083839,providerTested:false,nativeRuntimeTested:false};
 await writeFile('artifacts/playtt-legacy-content-conversion-summary.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({result:'converted',format:report.targetFormat,files:report.files,objects:report.objects,bytes:report.cost.totalBytes,puts:report.cost.puts,fitsTransferOnly:report.fitsTransferOnly}));
}catch(e){owner.phase='failed';await writeFile(ownerPath,JSON.stringify(owner,null,2));throw e;}
