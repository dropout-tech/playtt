import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {verifiedBackupPin} from './playtt-backup-pin-client.mjs';
import {exportSnapshotBundle,importSnapshotBundle,materializeFullSnapshotBundle,openSnapshotBundle} from './playtt-snapshot-bundle.mjs';
import {checkReferenceCoverage} from './playtt-reference-coverage.mjs';
import {createSnapshotPhpVerifier} from './playtt-snapshot-bundle-php.mjs';
const load=async p=>JSON.parse(await readFile(p,'utf8')),sha=b=>createHash('sha256').update(b).digest('hex');
const fullLocation=await load('artifacts/playtt-editor-recovery-inspection-backup-location-private.json');
const originalVerification=await load(fullLocation.directory+'/verification.json');assert.equal(originalVerification.result,'pass');assert.equal(originalVerification.version,62);
const overlayLocation=await load('artifacts/playtt-metadata-overlay-local-location-private.json');
const output=resolve('../../../../outputs/backups/cloudflare-wordpress-snapshot-bundle-local/run-'+new Date().toISOString().replace(/[:.]/g,'-'));await mkdir(output,{recursive:true});
async function localSource(directory,overlay){
 const raw=await readFile(directory+'/manifest.json'),manifest=JSON.parse(raw),base=overlay?await load(directory+'/base-manifest.json'):manifest;
 const files=new Map([[manifest.manifestKey,directory+'/manifest.json'],[base.restorePack.objectKey,directory+'/restore.zip']]);
 if(overlay)files.set(base.manifestKey,directory+'/base-manifest.json');
 for(const item of manifest.files)files.set(item.objectKey,directory+'/objects/'+item.sha256);
 let online=true,reads=0;
 return {anchor:(await verifiedBackupPin(directory)).pin,offline(){online=false;},reads:()=>reads,bucket:{async get(key){assert.ok(online,'Original source is intentionally offline');const path=files.get(key);assert.ok(path);reads++;const b=await readFile(path);return {size:b.length,arrayBuffer:async()=>Uint8Array.from(b).buffer};}}};
}
const results=[],restoredGraphs=[];
for(const [name,directory,overlay]of [['full',fullLocation.directory,false],['overlay',overlayLocation.directory,true]]){
 const source=await localSource(directory,overlay),exported=await exportSnapshotBundle(source.bucket,source.anchor,output+'/'+name+'-export');source.offline();const reads=source.reads();
 const imported=await importSnapshotBundle(output+'/'+name+'-export',source.anchor,output+'/'+name+'-independent');assert.equal(source.reads(),reads);
 assert.deepEqual(imported.graph.objects.map(x=>[x.key,x.sha256,x.size]),exported.graph.objects.map(x=>[x.key,x.sha256,x.size]));
 const graph=imported.graph,records={},rawManifestBytes={},objects=graph.objects.map(x=>({key:x.key,size:x.size}));
 for(const item of graph.objects)if(item.key.startsWith('sites/default/markdown/revisions/')){records[item.key]=JSON.parse(new TextDecoder().decode(item.bytes));rawManifestBytes[item.key]=Buffer.from(item.bytes).toString('base64');}
 const pointer={revision:graph.anchor.revision,manifestKey:graph.anchor.manifestKey,persistedAt:graph.anchor.persistedAt};records['sites/default/markdown/current.json']=pointer;objects.push({key:'sites/default/markdown/current.json',size:Buffer.byteLength(JSON.stringify(pointer))});
 const coverage=checkReferenceCoverage({schema:'playtt/coordinator-reference-roots/v1',siteId:'default',version:1,pointer,lease:null,completeCommitListing:true,safeToApply:false,commitReceipts:[{version:1,pointer}]},
 {schema:'playtt/private-capacity-inventory/v1',bucket:'playtt-wordpress-pin-restore-audit',completeListing:true,metadataIncluded:true,metadataProfile:'references-overlay-v1',objects,records,rawManifestBytes},
 {schema:'playtt/backup-pins/v1',generation:1,pins:[graph.anchor]});
 assert.equal(coverage.uniqueReferencedObjects,graph.objects.length);assert.equal(coverage.safeToApply,false);
 results.push({format:name,files:graph.contents.markdown.length+graph.contents.uploads.length+graph.contents.wpContent.length,immutableObjects:graph.objects.length,payloadBytes:graph.payloadBytes,sourceObjectReads:reads,sourceOfflineDuringImport:true,independentObjectHashesMatch:true,referenceCoverage:coverage});restoredGraphs.push(imported);
}
const full=await materializeFullSnapshotBundle(output+'/overlay-independent',restoredGraphs[1].graph.anchor,output+'/materialized-full');
assert.equal(restoredGraphs[1].graph.base.revision,restoredGraphs[0].graph.anchor.revision);
const rebuilt=await importSnapshotBundle(output+'/materialized-full',full.graph.anchor,output+'/materialized-independent');
for(const group of ['markdown','uploads','wpContent']){
 const digest=g=>g.contents[group].map(f=>[f.path,sha(f.bytes)]).sort((a,b)=>a[0].localeCompare(b[0]));assert.deepEqual(digest(restoredGraphs[1].graph),digest(rebuilt.graph));
}
assert.deepEqual(rebuilt.graph.contents.wpContentDeleted,restoredGraphs[1].graph.contents.wpContentDeleted);
assert.notEqual(full.graph.anchor.revision,restoredGraphs[1].graph.anchor.revision);assert.equal(rebuilt.graph.format,'full-pack');
const php=await createSnapshotPhpVerifier();const phpChecks=[];
for(const [label,graph]of [['overlay-independent',restoredGraphs[1].graph],['materialized-independent',rebuilt.graph]])phpChecks.push({label,...await php.verify(graph.contents)});
assert.equal(phpChecks[0].metadataRowsSha256,phpChecks[1].metadataRowsSha256);
const finalSource=await openSnapshotBundle(output+'/overlay-export',restoredGraphs[1].graph.anchor);assert.equal(finalSource.graph.anchor.revision,restoredGraphs[1].graph.anchor.revision);
const result={at:new Date().toISOString(),result:'pass',scope:'Offline export/import from recorded full canonical62 and the previously simulated overlay, independent local object stores and fresh PHP/MDI/PDO hydration; no provider, browser or complete WordPress HTTP acceptance',baseRevision:restoredGraphs[0].graph.anchor.revision,results,materialization:{newIdentity:true,originalOverlayPreserved:true,fullFiles:rebuilt.graph.contents.markdown.length+rebuilt.graph.contents.uploads.length+rebuilt.graph.contents.wpContent.length,allFileHashesAndTombstonesMatch:true,immutableObjects:rebuilt.graph.objects.length},php:{scope:'Real MDI loader and PDO SQLite; narrow driver adapter',assets:php.assets,checks:phpChecks},cloudflareRequests:0,cloudflareMutations:0,remotePinsAdded:0,featureFlagEnabled:false};
await writeFile(output+'/result.json',JSON.stringify(result,null,2)+'\n');await writeFile('artifacts/playtt-snapshot-bundle-recorded.json',JSON.stringify(result,null,2)+'\n');
await writeFile('artifacts/playtt-snapshot-bundle-location-private.json',JSON.stringify({directory:output,overlayAnchor:restoredGraphs[1].graph.anchor,fullAnchor:full.graph.anchor},null,2));
console.log(JSON.stringify(result));
