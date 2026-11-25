// Offline-verifiable export/import. The injected source supports GET only.
// Import creates a new local directory; it never writes cloud state or a pointer.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,lstat} from 'node:fs/promises';
import {createHash,randomUUID} from 'node:crypto';
import {resolve} from 'node:path';
import {backupPinInput} from '../src/playtt-backup-pins.ts';
import {createCanonicalRestorePack,decodeCanonicalRestorePack,validateCanonicalRestorePackMetadata} from '../src/canonical-restore-pack.ts';
import {isMetadataOverlay,readMetadataOverlay,readOverlayBytes,MAX_OVERLAY_MANIFEST,MAX_OVERLAY_PACK} from '../src/playtt-metadata-overlay.ts';
import {validatePlayttSnapshotSources} from '../src/playtt-snapshot-source.ts';

const ROOT='sites/default',SCHEMA='playtt/snapshot-bundle/v1';
const MAX_OBJECTS=20004,MAX_BYTES=32*1024*1024,MAX_INDEX=8*1024*1024;
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const encode=value=>new TextEncoder().encode(JSON.stringify(value));
const parse=bytes=>JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
const inventory=m=>({markdown:m.files,uploads:m.uploads||[],wpContent:m.wpContent||[],wpContentDeleted:m.wpContentDeleted||[]});
const groups=[['markdown','files','markdown'],['uploads','uploads','uploads'],['wpContent','wpContent','wp-content']];
function sameIdentity(manifest,anchor){for(const key of ['revision','manifestKey','persistedAt'])assert.equal(manifest[key],anchor[key],'Snapshot identity mismatch');}
function addObject(objects,key,bytes){
 const copy=Uint8Array.from(bytes),object={key,sha256:sha(copy),size:copy.length,bytes:copy};
 if(objects.has(key))assert.deepEqual(objects.get(key).bytes,copy,'Conflicting object identities');
 else objects.set(key,object);
 assert.ok(objects.size<=MAX_OBJECTS);
}
function addContents(objects,manifest,contents){
 for(const [group,field,prefix]of groups){
  const expected=manifest[field]||[];assert.equal(contents[group].length,expected.length);
  for(const file of contents[group]){
   const metadata=expected.find(x=>x.path===file.path);assert.ok(metadata);
   assert.equal(metadata.objectKey,`${ROOT}/${prefix}/objects/${metadata.sha256}`);
   assert.equal(sha(file.bytes),metadata.sha256);assert.equal(file.bytes.length,metadata.size);
   addObject(objects,metadata.objectKey,file.bytes);
  }
 }
}

// The anchor comes from an independently trusted pin or an explicitly reviewed
// source manifest. A self-authored bundle index is never the trust anchor.
export async function readSnapshotGraph(bucket,expectedPin){
 const anchor=backupPinInput(expectedPin),objects=new Map();
 const raw=await readOverlayBytes(bucket,anchor.manifestKey,MAX_OVERLAY_MANIFEST,undefined,anchor.manifestSha256);
 const manifest=parse(raw);sameIdentity(manifest,anchor);validatePlayttSnapshotSources(ROOT,manifest);
 addObject(objects,anchor.manifestKey,raw);
 let base=manifest,baseBytes=raw,contents,pack,baseContents;
 if(isMetadataOverlay(manifest.restorePack)){
  const cached=new Map();
  const recording={async get(key){
   if(cached.has(key)){const b=cached.get(key);return {size:b.length,arrayBuffer:async()=>Uint8Array.from(b).buffer};}
   const limit=key===manifest.restorePack.base.manifestKey?MAX_OVERLAY_MANIFEST:MAX_OVERLAY_PACK;
   const b=await readOverlayBytes(bucket,key,limit);cached.set(key,b);return {size:b.length,arrayBuffer:async()=>Uint8Array.from(b).buffer};
  }};
  const restored=await readMetadataOverlay(recording,ROOT,manifest);
  ({base,baseBytes,contents}=restored);pack=cached.get(base.restorePack.objectKey);assert.ok(pack);
  // A second local decode reconstructs base-only loose objects as well, so
  // exporting this overlay does not orphan its full-base recovery metadata.
  baseContents=await decodeCanonicalRestorePack(base.restorePack,ROOT,inventory(base),pack);
  addObject(objects,base.manifestKey,baseBytes);
 }else{
  validateCanonicalRestorePackMetadata(manifest.restorePack,ROOT,inventory(manifest));
  assert.ok(manifest.restorePack.size<=MAX_OVERLAY_PACK&&manifest.restorePack.decodedBytes<=MAX_OVERLAY_PACK,'Snapshot exceeds the private backup budget');
  pack=await readOverlayBytes(bucket,manifest.restorePack.objectKey,MAX_OVERLAY_PACK,manifest.restorePack.size,manifest.restorePack.sha256);
  contents=await decodeCanonicalRestorePack(manifest.restorePack,ROOT,inventory(manifest),pack);baseContents=contents;
 }
 assert.equal(base.restorePack.objectKey,anchor.packKey);assert.equal(base.restorePack.sha256,anchor.packSha256);assert.equal(base.restorePack.size,anchor.packBytes);
 addObject(objects,base.restorePack.objectKey,pack);addContents(objects,base,baseContents);addContents(objects,manifest,contents);
 const ordered=[...objects.values()].sort((a,b)=>a.key.localeCompare(b.key));
 const payloadBytes=ordered.reduce((n,x)=>n+x.size,0);assert.ok(payloadBytes<=MAX_BYTES);
 return {anchor,manifest,base,contents,objects:ordered,payloadBytes,format:isMetadataOverlay(manifest.restorePack)?'metadata-overlay':'full-pack'};
}

async function boundedFile(path,limit){
 const info=await lstat(path);assert.ok(info.isFile()&&!info.isSymbolicLink()&&info.size<=limit);
 const bytes=await readFile(path);assert.equal(bytes.length,info.size);return bytes;
}
function catalog(graph){return {schema:SCHEMA,anchor:graph.anchor,format:graph.format,objects:graph.objects.map(({key,size,sha256})=>({key,size,sha256,file:'objects/'+sha256}))};}
async function writeGraph(directory,graph){
 const target=resolve(directory);await mkdir(target);await mkdir(target+'/objects');
 const written=new Set();
 for(const item of graph.objects)if(!written.has(item.sha256)){await writeFile(target+'/objects/'+item.sha256,item.bytes,{flag:'wx'});written.add(item.sha256);}
 await writeFile(target+'/bundle.json',encode(catalog(graph)),{flag:'wx'});
 return target;
}
export async function openSnapshotBundle(directory,expectedPin){
 const target=resolve(directory),info=await lstat(target);assert.ok(info.isDirectory()&&!info.isSymbolicLink());
 const objectsInfo=await lstat(target+'/objects');assert.ok(objectsInfo.isDirectory()&&!objectsInfo.isSymbolicLink());
 const index=parse(await boundedFile(target+'/bundle.json',MAX_INDEX)),anchor=backupPinInput(expectedPin);
 assert.equal(index.schema,SCHEMA);assert.deepEqual(index.anchor,anchor);
 assert.ok(Array.isArray(index.objects)&&index.objects.length<=MAX_OBJECTS);
 const entries=new Map();let payload=0;
 for(const item of index.objects){
  assert.deepEqual(Object.keys(item).sort(),['file','key','sha256','size']);
  assert.ok(typeof item.key==='string'&&item.key.startsWith(ROOT+'/')&&!entries.has(item.key));
  assert.match(item.sha256,/^[a-f0-9]{64}$/);assert.equal(item.file,'objects/'+item.sha256);
  assert.ok(Number.isSafeInteger(item.size)&&item.size>=0&&item.size<=MAX_OVERLAY_PACK);
  entries.set(item.key,item);payload+=item.size;
 }
 assert.ok(payload<=MAX_BYTES);
 const bucket={async get(key){const item=entries.get(key);if(!item)return null;const bytes=await boundedFile(target+'/'+item.file,MAX_OVERLAY_PACK);assert.equal(bytes.length,item.size);assert.equal(sha(bytes),item.sha256);return {size:bytes.length,body:new Blob([bytes]).stream(),arrayBuffer:async()=>Uint8Array.from(bytes).buffer};}};
 const graph=await readSnapshotGraph(bucket,anchor);
 assert.deepEqual(index,catalog(graph),'Bundle inventory has omitted, altered or unrelated objects');
 // ZIP validation alone would miss a damaged loose object needed by a later
 // full snapshot. Check every copied object before reporting recoverability.
 for(const item of graph.objects){const stored=await bucket.get(item.key);assert.ok(stored);assert.equal(sha(new Uint8Array(await stored.arrayBuffer())),item.sha256);}
 return {graph,bucket,directory:target};
}
export async function exportSnapshotBundle(bucket,expectedPin,directory){
 const graph=await readSnapshotGraph(bucket,expectedPin),target=await writeGraph(directory,graph);
 const verified=await openSnapshotBundle(target,expectedPin);
 await writeFile(target+'/verification.json',encode({result:'pass',scope:'Complete local snapshot graph; remote pin acknowledgement and provider restore are separate',anchor:graph.anchor,format:graph.format,objects:graph.objects.length,payloadBytes:graph.payloadBytes}),{flag:'wx'});
 return verified;
}
export async function importSnapshotBundle(directory,expectedPin,newDirectory){
 const {graph}=await openSnapshotBundle(directory,expectedPin);
 await writeGraph(newDirectory,graph);
 // Independent destination reads; no source fallback remains in this bucket.
 return openSnapshotBundle(newDirectory,expectedPin);
}
export async function materializeFullSnapshotBundle(directory,expectedPin,newDirectory){
 const {graph}=await openSnapshotBundle(directory,expectedPin);
 const full=await createCanonicalRestorePack(ROOT,graph.contents),revision=randomUUID();
 const manifest={...graph.manifest,revision,manifestKey:`${ROOT}/markdown/revisions/${revision}.json`,persistedAt:new Date().toISOString(),restorePack:full.metadata};
 const raw=encode(manifest),objects=new Map([[manifest.manifestKey,raw],[full.metadata.objectKey,full.bytes]]);
 const anchor=backupPinInput({...manifest,manifestSha256:sha(raw),packKey:full.metadata.objectKey,packSha256:full.metadata.sha256,packBytes:full.metadata.size});
 const bucket={async get(key){const b=objects.get(key);return b?{size:b.length,arrayBuffer:async()=>Uint8Array.from(b).buffer}:null;}};
 const exported=await exportSnapshotBundle(bucket,anchor,newDirectory);
 await writeFile(resolve(newDirectory)+'/materialization-provenance.json',encode({source:graph.anchor,materialized:anchor,scope:'New local full snapshot identity; does not overwrite an original manifest or register a remote pin'}),{flag:'wx'});
 return exported;
}
