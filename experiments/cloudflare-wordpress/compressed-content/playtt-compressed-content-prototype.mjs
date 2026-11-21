// Offline prototype proof. No cloud calls, adoption, pin changes or credentials.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,mkdtemp,copyFile,access} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {createHash,randomUUID} from 'node:crypto';
import {openSnapshotBundle,readSnapshotGraph,exportSnapshotBundle,importSnapshotBundle} from './playtt-snapshot-bundle.mjs';
import {createCompressedContent,readCompressedContent,validateCompressedContent,materializeCompressedContents} from '../src/playtt-compressed-content.ts';
import {PlayttBackupPins} from '../src/playtt-backup-pins.ts';
assert.deepEqual(process.argv.slice(2),['--offline']);
const load=async p=>JSON.parse(await readFile(p,'utf8')),enc=v=>new TextEncoder().encode(typeof v==='string'?v:JSON.stringify(v)),sha=b=>createHash('sha256').update(b).digest('hex');
const groups=['markdown','uploads','wpContent'],prefix={markdown:'markdown',uploads:'uploads',wpContent:'wp-content'};
const ownerPath='artifacts/playtt-compressed-content-prototype-owned-private.json';
try{await access(ownerPath);throw Error('Existing prototype proof; inspect rather than overwrite');}catch(e){if(e.code!=='ENOENT')throw e;}
const backup=await load('artifacts/playtt-markdown-provider-cold-backup-owned-private.json');assert.equal(backup.phase,'verified');assert.equal(backup.anchor.revision,'3021e7bd-a125-439d-9027-11005ea71316');
const original=(await openSnapshotBundle(backup.directory+'/independent',backup.anchor)).graph;
const sourceOwner=await load('artifacts/playtt-heartbeat-budget-ui-owned-private.json');assert.equal(sourceOwner.phase,'finished');assert.equal(sourceOwner.localProcessesDisposed,true);
const final=await load(sourceOwner.directory+'/final-private.json');assert.equal(final.state.version,175);
const contents={...Object.fromEntries(groups.map(g=>[g,final.contents[g].map(f=>({path:f.path,bytes:new Uint8Array(Buffer.from(f.bytes,'base64'))}))])),wpContentDeleted:final.wpContentDeleted};
function manifest(c){const revision=randomUUID();return {revision,manifestKey:`sites/default/markdown/revisions/${revision}.json`,persistedAt:new Date().toISOString(),
 ...Object.fromEntries(groups.map(g=>[g==='markdown'?'files':g,c[g].map(f=>({path:f.path,size:f.bytes.length,sha256:sha(f.bytes),objectKey:`sites/default/${prefix[g]}/objects/${sha(f.bytes)}`}))])),wpContentDeleted:c.wpContentDeleted};}
const identify=c=>({...Object.fromEntries(groups.map(g=>[g,c[g].map(f=>({path:f.path,size:f.bytes.length,sha256:sha(f.bytes)})).sort((a,b)=>a.path.localeCompare(b.path))])),wpContentDeleted:c.wpContentDeleted});
const expected=identify(contents),m=manifest(contents),data=new Map(original.objects.map(o=>[o.key,o.bytes]));
const bucketFor=values=>({async get(key){const bytes=values.get(key);return bytes?{size:bytes.length,body:new Blob([bytes]).stream(),arrayBuffer:async()=>Uint8Array.from(bytes).buffer}:null;}});
const bucket=bucketFor(data),encoded=await createCompressedContent(bucket,'sites/default',m,original.base,(g,p)=>Uint8Array.from(contents[g].find(f=>f.path===p).bytes));assert.ok(encoded);
m.restorePack=encoded.descriptor;validateCompressedContent(m,'sites/default');const raw=enc(m);data.set(m.manifestKey,raw);data.set(encoded.descriptor.delta.objectKey,encoded.bytes);
const directory=await mkdtemp(resolve('artifacts/compressed-content-prototype-'));
const owner={at:new Date().toISOString(),phase:'preparing',directory,manifest:m,manifestSha256:sha(raw),sourceCanonicalVersion:175,sourceAnchor:backup.anchor};
await writeFile(ownerPath,JSON.stringify(owner,null,2)+'\n',{flag:'wx'});
const physical=[m.manifestKey,m.restorePack.delta.objectKey,m.restorePack.base.manifestKey,original.base.restorePack.objectKey];assert.equal(new Set(physical).size,4);
const index={schema:'playtt/compressed-prototype-bundle/v1',manifestKey:m.manifestKey,manifestSha256:sha(raw),objects:physical.map(key=>({key,size:data.get(key).length,sha256:sha(data.get(key)),file:sha(data.get(key))}))};
await mkdir(directory+'/export');await mkdir(directory+'/independent');
for(const item of index.objects){await writeFile(directory+'/export/'+item.file,data.get(item.key),{flag:'wx'});await copyFile(directory+'/export/'+item.file,directory+'/independent/'+item.file);}
for(const folder of ['export','independent'])await writeFile(directory+'/'+folder+'/bundle-private.json',JSON.stringify(index,null,2)+'\n',{flag:'wx'});
const independent=new Map();
for(const item of index.objects){const bytes=new Uint8Array(await readFile(directory+'/independent/'+item.file));assert.equal(bytes.length,item.size);assert.equal(sha(bytes),item.sha256);independent.set(item.key,bytes);}
const detached=bucketFor(independent);data.clear();
const restored=await readCompressedContent(detached,'sites/default',m);assert.deepEqual(identify(restored.contents),expected);
const pin={...m,manifestSha256:sha(raw),packKey:original.base.restorePack.objectKey,packSha256:original.base.restorePack.sha256,packBytes:original.base.restorePack.size};
await assert.rejects(readSnapshotGraph(detached,pin));
const values=new Map(),storage={get:async k=>values.get(k),put:async(k,v)=>{values.set(k,v);}};
const pins=new PlayttBackupPins(storage,detached);await assert.rejects(pins.register(pin,()=>{}));assert.equal((await pins.list()).generation,0);
const full=await materializeCompressedContents('sites/default',restored.contents),fullManifest=manifest(restored.contents);fullManifest.restorePack=full.metadata;
const fullRaw=enc(fullManifest),fullMap=new Map([[full.metadata.objectKey,full.bytes],[fullManifest.manifestKey,fullRaw]]);
for(const g of groups)for(const f of restored.contents[g])fullMap.set(`sites/default/${prefix[g]}/objects/${sha(f.bytes)}`,f.bytes);
const fullPin={...fullManifest,manifestSha256:sha(fullRaw),packKey:full.metadata.objectKey,packSha256:full.metadata.sha256,packBytes:full.metadata.size};
await exportSnapshotBundle(bucketFor(fullMap),fullPin,directory+'/materialized');
const copied=await importSnapshotBundle(directory+'/materialized',fullPin,directory+'/independent-full');assert.equal(copied.graph.format,'full-pack');assert.deepEqual(identify(copied.graph.contents),expected);
const pagePath='page/'+sourceOwner.expectedBefore.slug+'.md';
assert.equal(sha(restored.contents.markdown.find(f=>f.path===pagePath).bytes),sha(original.contents.markdown.find(f=>f.path===pagePath).bytes));
const posts=JSON.parse(new TextDecoder().decode(restored.contents.markdown.find(f=>f.path==='_tables/posts.json').bytes));
assert.equal(posts.find(p=>p.ID==='206').post_content,sourceOwner.expectedContent);assert.equal(posts.some(p=>p.ID==='207'),false);
const baseByGroup=Object.fromEntries(groups.map(g=>[g,new Map((g==='markdown'?original.base.files:original.base[g]||[]).map(f=>[f.path,f]))]));
const changed=groups.flatMap(g=>(g==='markdown'?m.files:m[g]).filter(f=>baseByGroup[g].get(f.path)?.sha256!==f.sha256).map(f=>({group:g,path:f.path,bytes:f.size})));
owner.phase='verified';owner.expected=expected;owner.physicalIndex=index;owner.fullPin=fullPin;await writeFile(ownerPath,JSON.stringify(owner,null,2)+'\n');
const report={schema:'playtt/compressed-content-prototype-proof/v1',at:new Date().toISOString(),result:'offline-prototype-pass',
 source:{cloudBackupVersion:161,localStoppedVersion:175,sourceFilesUnchanged:true},
 format:{schema:m.restorePack.schema,base:'one exact full snapshot; no overlay chain',changedFiles:changed,changedLogicalBytes:changed.reduce((n,f)=>n+f.bytes,0),framedDecodedBytes:m.restorePack.delta.decodedBytes,compressedBytes:encoded.bytes.length,manifestBytes:raw.length,physicalDependencyObjects:4,dependencyPayloadBytes:index.objects.reduce((n,o)=>n+o.size,0)},
 preservation:{allGroupsExact:true,canonicalFiles:groups.reduce((n,g)=>n+contents[g].length,0),originalPageUnchanged:true,autosave206Exact:true,manualRevision207Absent:true,includesSessionsCountersLocksDates:true},
 recovery:{independentFourObjectCopy:true,sourceRemovedBeforeRestore:true,legacyBundleReaderRejectsNewFormat:true,legacyServerPinRejectsWithoutChangingRegistry:true,fullMaterialization:true,independentExistingBundleImporter:true,fullObjects:copied.graph.objects.length,fullPackBytes:full.bytes.length,fullBytesExact:true,adopted:false},
 limits:{rawDeltaBytes:1048576,deltaChanges:64,manifestBytes:262144,framedBytes:1310720,compressedObjectBytes:1376256,baseOrFinalDecodedBytes:8388608},
 implementation:{workerWired:false,productionBackupToolsUpdated:false,flagsAdded:false,cloudRequests:0,deployed:false,productionChanged:false},
 limitations:['New module is not wired into runtime persistence, normal cold reads, backup pins or existing snapshot bundle tools. Their current readers intentionally reject this format.','Four-object prototype bundle has an independent local copy; it is not a new production backup/pin integration.','Full materialization was verified locally; no canonical pointer was adopted or provider rollback performed.','Compression size is one cumulative snapshot, not complete attempted-write traffic, latency, CPU or whole-isolate memory.'],goalStatus:'active'};
await writeFile('artifacts/playtt-compressed-content-prototype.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
