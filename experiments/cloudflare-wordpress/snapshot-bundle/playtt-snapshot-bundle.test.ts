import assert from 'node:assert/strict';
import test from 'node:test';
import {mkdtemp,mkdir,readFile,writeFile,rm,access} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash,randomUUID} from 'node:crypto';
import {createCanonicalRestorePack,decodeCanonicalRestorePack,type RestorePackContents} from '../src/canonical-restore-pack.js';
import {createMetadataOverlay,readMetadataOverlay} from '../src/playtt-metadata-overlay.js';
import {readSnapshotGraph,exportSnapshotBundle,openSnapshotBundle,importSnapshotBundle,materializeFullSnapshotBundle} from '../scripts/playtt-snapshot-bundle.mjs';
import {PlayttBackupPins} from '../src/playtt-backup-pins.js';
import {checkReferenceCoverage} from '../scripts/playtt-reference-coverage.mjs';
import {createCloudflareSnapshotSource} from '../scripts/playtt-snapshot-download.mjs';

const ROOT='sites/default',sha=(b:Uint8Array)=>createHash('sha256').update(b).digest('hex'),bytes=(v:unknown)=>new TextEncoder().encode(typeof v==='string'?v:JSON.stringify(v));
const pointer=()=>{const revision=randomUUID();return {revision,manifestKey:`${ROOT}/markdown/revisions/${revision}.json`,persistedAt:new Date().toISOString()};};
const pm='_tables/postmeta.json',seq='_runtime/playtt-auto-increment.json';
const contents=():RestorePackContents=>({markdown:[{path:'post/page.md',bytes:bytes('繁中\n \t')},{path:pm,bytes:bytes([{meta_id:'8',post_id:'192',meta_key:'_edit_lock',meta_value:'1795200000:1'}])},{path:seq,bytes:bytes({schema:'playtt/auto-increment/v1',sequences:{wp_postmeta:'8',wp_posts:'192'}})},{path:'_runtime/playtt-postmeta-layout.json',bytes:bytes({schema:'playtt/postmeta-table/v1'})}],uploads:[{path:'2026/11/photo.webp',bytes:bytes('media')}],wpContent:[{path:'themes/lets-play/style.css',bytes:bytes('theme')},{path:'themes/lets-play/empty.txt',bytes:new Uint8Array()}],wpContentDeleted:['plugins/removed.php']});
function manifest(c:RestorePackContents){const metadata=(g:'markdown'|'uploads'|'wpContent',prefix:string)=>c[g].map(x=>({path:x.path,size:x.bytes.length,sha256:sha(x.bytes),objectKey:`${ROOT}/${prefix}/objects/${sha(x.bytes)}`}));return {...pointer(),files:metadata('markdown','markdown'),uploads:metadata('uploads','uploads'),wpContent:metadata('wpContent','wp-content'),wpContentDeleted:c.wpContentDeleted,restorePack:undefined as any};}
const equalContents=(c:RestorePackContents)=>({...c,markdown:[...c.markdown].sort((a,b)=>a.path.localeCompare(b.path)),uploads:[...c.uploads].sort((a,b)=>a.path.localeCompare(b.path)),wpContent:[...c.wpContent].sort((a,b)=>a.path.localeCompare(b.path))});
async function fixture(overlay:boolean){
 const data=new Map<string,Uint8Array>(),c=contents(),base=manifest(c),pack=await createCanonicalRestorePack(ROOT,c);base.restorePack=pack.metadata;
 function add(m:any,files:RestorePackContents){data.set(m.manifestKey,bytes(m));for(const [g,prefix]of [['markdown','markdown'],['uploads','uploads'],['wpContent','wp-content']]as const)for(const f of files[g])data.set(`${ROOT}/${prefix}/objects/${sha(f.bytes)}`,f.bytes);}
 data.set(pack.metadata.objectKey,pack.bytes);add(base,c);let online=true,reads=0;
 const bucket={async get(key:string){assert.ok(online,'Source is offline');reads++;const b=data.get(key);return b?{size:b.length,arrayBuffer:async()=>Uint8Array.from(b).buffer}:null;}};
 let current=base;
 if(overlay){c.markdown.find(x=>x.path===pm)!.bytes=bytes([{meta_id:'8',post_id:'192',meta_key:'_edit_lock',meta_value:'1795200120:2'}]);current=manifest(c);add(current,c);current.restorePack=await createMetadataOverlay(bucket,ROOT,current,base);assert.ok(current.restorePack);add(current,c);}
 const anchor={revision:current.revision,manifestKey:current.manifestKey,persistedAt:current.persistedAt,manifestSha256:sha(data.get(current.manifestKey)!),packKey:pack.metadata.objectKey,packSha256:pack.metadata.sha256,packBytes:pack.bytes.length};reads=0;
 return {data,base,current,c,pack,bucket,anchor,offline(){online=false;},reads:()=>reads};
}
async function temporary(fn:(dir:string)=>Promise<void>){const parent=resolve('artifacts');await mkdir(parent,{recursive:true});const dir=await mkdtemp(parent+'/bundle-unit-');try{await fn(dir);}finally{assert.ok(resolve(dir).startsWith(parent+'/')||resolve(dir).startsWith(parent+'\\'));await rm(dir,{recursive:true});}}
function referenceInputs(graph:any){
 const records:any={},rawManifestBytes:any={},objects=graph.objects.map((x:any)=>({key:x.key,size:x.size}));
 for(const item of graph.objects)if(item.key.startsWith(ROOT+'/markdown/revisions/')){records[item.key]=JSON.parse(new TextDecoder().decode(item.bytes));rawManifestBytes[item.key]=Buffer.from(item.bytes).toString('base64');}
 const pointer={revision:graph.anchor.revision,manifestKey:graph.anchor.manifestKey,persistedAt:graph.anchor.persistedAt};records[ROOT+'/markdown/current.json']=pointer;objects.push({key:ROOT+'/markdown/current.json',size:bytes(pointer).length});
 return {roots:{schema:'playtt/coordinator-reference-roots/v1',siteId:'default',version:1,pointer,lease:null,completeCommitListing:true,safeToApply:false,commitReceipts:[{version:1,pointer}]},
 inventory:{schema:'playtt/private-capacity-inventory/v1',bucket:'playtt-wordpress-pin-restore-audit',completeListing:true,metadataIncluded:true,metadataProfile:'references-overlay-v1',objects,records,rawManifestBytes},
 registry:{schema:'playtt/backup-pins/v1',generation:1,pins:[graph.anchor]}};
}

for(const overlay of [false,true])test(`${overlay?'overlay':'full'} exports and restores into an empty independent local object store`,async()=>temporary(async dir=>{
 const f=await fixture(overlay),exported=await exportSnapshotBundle(f.bucket,f.anchor,dir+'/backup');assert.ok(f.reads()<=(overlay?4:2));f.offline();
 const restored=await importSnapshotBundle(dir+'/backup',f.anchor,dir+'/independent');assert.deepEqual(equalContents(restored.graph.contents),equalContents(f.c));
 assert.equal(restored.graph.objects.length,exported.graph.objects.length);assert.ok(restored.graph.objects.some(x=>x.size===0));
 if(overlay){assert.ok(restored.graph.objects.some(x=>x.key===f.base.manifestKey));assert.ok(restored.graph.objects.some(x=>x.key===f.base.files.find(x=>x.path===pm)!.objectKey));assert.deepEqual(equalContents((await readMetadataOverlay(restored.bucket,ROOT,f.current)).contents),equalContents(f.c));}
 // Actual append-only pin implementation validates destination objects after a restart.
 const storage=new Map<string,any>(),state={get:async(k:string)=>structuredClone(storage.get(k)),put:async(k:string,v:any)=>{storage.set(k,structuredClone(v));}} as unknown as DurableObjectStorage;
 const pins=new PlayttBackupPins(state,restored.bucket as unknown as R2Bucket);assert.equal((await pins.register(f.anchor,()=>{})).created,true);
 const restarted=new PlayttBackupPins(state,restored.bucket as unknown as R2Bucket);assert.equal((await restarted.register(f.anchor,()=>{})).created,false);
 assert.equal((await restarted.list()).pins[0].manifestSha256,f.anchor.manifestSha256);
}));

test('materialization creates a new complete identity readable by the old decoder without any overlay dependencies',async()=>temporary(async dir=>{
 const f=await fixture(true);await exportSnapshotBundle(f.bucket,f.anchor,dir+'/backup');f.offline();
 const full=await materializeFullSnapshotBundle(dir+'/backup',f.anchor,dir+'/full');assert.notEqual(full.graph.anchor.revision,f.anchor.revision);assert.equal(full.graph.format,'full-pack');
 assert.ok(!full.graph.objects.some(x=>x.key===f.base.manifestKey||x.key===f.current.manifestKey));
 const m=full.graph.manifest,object=await full.bucket.get(m.restorePack.objectKey);assert.ok(object);
 const decoded=await decodeCanonicalRestorePack(m.restorePack,ROOT,{markdown:m.files,uploads:m.uploads,wpContent:m.wpContent,wpContentDeleted:m.wpContentDeleted},new Uint8Array(await object.arrayBuffer()));assert.deepEqual(equalContents(decoded),equalContents(f.c));
 const original=await openSnapshotBundle(dir+'/backup',f.anchor);assert.equal(original.graph.anchor.revision,f.anchor.revision);
}));

test('a wrong external anchor is rejected before creating an output or trusting a self-consistent catalog',async()=>temporary(async dir=>{
 const f=await fixture(true),wrong={...f.anchor,manifestSha256:'0'.repeat(64)};
 await assert.rejects(exportSnapshotBundle(f.bucket,wrong,dir+'/wrong'));await assert.rejects(access(dir+'/wrong'));
 await exportSnapshotBundle(f.bucket,f.anchor,dir+'/backup');await assert.rejects(openSnapshotBundle(dir+'/backup',wrong));
}));

test('damaged copied loose content fails verification despite an intact ZIP and manifest',async()=>temporary(async dir=>{
 const f=await fixture(true),result=await exportSnapshotBundle(f.bucket,f.anchor,dir+'/backup');
 const file=result.graph.manifest.uploads[0];await writeFile(dir+'/backup/objects/'+file.sha256,'bad');
 await assert.rejects(openSnapshotBundle(dir+'/backup',f.anchor));await assert.rejects(importSnapshotBundle(dir+'/backup',f.anchor,dir+'/independent'));await assert.rejects(access(dir+'/independent'));
}));

test('missing dependencies, unrelated catalog objects and unsafe filenames are rejected',async()=>temporary(async dir=>{
 for(const mode of ['missing','extra','path']){
  const f=await fixture(true),path=dir+'/'+mode;await exportSnapshotBundle(f.bucket,f.anchor,path);const index=JSON.parse(await readFile(path+'/bundle.json','utf8'));
  if(mode==='missing')index.objects=index.objects.filter((x:any)=>x.key!==f.base.manifestKey);
  if(mode==='extra')index.objects.push({key:ROOT+'/unrelated',size:0,sha256:sha(new Uint8Array()),file:'objects/'+sha(new Uint8Array())});
  if(mode==='path')index.objects[0].file='../outside';
  await writeFile(path+'/bundle.json',JSON.stringify(index));await assert.rejects(openSnapshotBundle(path,f.anchor));
 }
}));

test('an interrupted or mismatched remote object never creates a verified bundle',async()=>temporary(async dir=>{
 for(const mode of ['missing','truncated','wrong']){
  const f=await fixture(true);if(mode==='missing')f.data.delete(f.pack.metadata.objectKey);else{const b=f.data.get(f.pack.metadata.objectKey)!.slice();if(mode==='truncated')f.data.set(f.pack.metadata.objectKey,b.slice(1));else{b[0]^=1;f.data.set(f.pack.metadata.objectKey,b);}}
  await assert.rejects(exportSnapshotBundle(f.bucket,f.anchor,dir+'/'+mode));await assert.rejects(access(dir+'/'+mode));
 }
}));

test('import cannot overwrite an existing directory and an independent target never falls back to its source',async()=>temporary(async dir=>{
 const f=await fixture(true);await exportSnapshotBundle(f.bucket,f.anchor,dir+'/backup');await importSnapshotBundle(dir+'/backup',f.anchor,dir+'/independent');
 const before=await readFile(dir+'/independent/bundle.json');await assert.rejects(importSnapshotBundle(dir+'/backup',f.anchor,dir+'/independent'));assert.deepEqual(await readFile(dir+'/independent/bundle.json'),before);
 await writeFile(dir+'/independent/objects/'+f.pack.metadata.sha256,'broken');await assert.rejects(openSnapshotBundle(dir+'/independent',f.anchor));assert.equal((await openSnapshotBundle(dir+'/backup',f.anchor)).graph.format,'metadata-overlay');
}));

test('reference coverage protects the unpinned full base and its old metadata even with only the overlay as a live root',async()=>{
 const f=await fixture(true),graph=await readSnapshotGraph(f.bucket,f.anchor),input=referenceInputs(graph);
 const coverage=checkReferenceCoverage(input.roots,input.inventory,input.registry);
 assert.equal(coverage.overlayRevisions,1);assert.equal(coverage.overlayBaseRevisions,1);assert.equal(coverage.referencedRevisions,2);
 assert.equal(coverage.uniqueReferencedObjects,graph.objects.length);assert.equal(coverage.safeToApply,false);assert.equal(coverage.outsideReferenceSetDeletable,false);
 assert.ok(coverage.referenced.find((x:any)=>x.revision===f.base.revision).reasons.includes('overlay-base'));
});

test('overlay reference coverage rejects omitted dependencies, absent raw evidence, tampered catalogs and wrong pin identity',async()=>{
 const f=await fixture(true),graph=await readSnapshotGraph(f.bucket,f.anchor);
 for(const mode of ['base','base-content','pack','raw-missing','raw-hash','catalog','pin','profile']){
  const {roots,inventory,registry}=referenceInputs(graph);
  if(mode==='base'){delete inventory.records[f.base.manifestKey];delete inventory.rawManifestBytes[f.base.manifestKey];inventory.objects=inventory.objects.filter((x:any)=>x.key!==f.base.manifestKey);}
  if(mode==='base-content')inventory.objects=inventory.objects.filter((x:any)=>x.key!==f.base.files.find(x=>x.path===pm)!.objectKey);
  if(mode==='pack')inventory.objects=inventory.objects.filter((x:any)=>x.key!==f.pack.metadata.objectKey);
  if(mode==='raw-missing')delete inventory.rawManifestBytes[f.base.manifestKey];
  if(mode==='raw-hash'){const raw=Buffer.from(inventory.rawManifestBytes[f.base.manifestKey],'base64');const changed=Buffer.concat([raw,Buffer.from(' ')]);inventory.rawManifestBytes[f.base.manifestKey]=changed.toString('base64');inventory.objects.find((x:any)=>x.key===f.base.manifestKey).size=changed.length;}
  if(mode==='catalog')inventory.records[f.base.manifestKey].files[0].size++;
  if(mode==='pin')registry.pins[0]={...registry.pins[0],manifestSha256:'0'.repeat(64)};
  if(mode==='profile')inventory.metadataProfile='references-v1';
  assert.throws(()=>checkReferenceCoverage(roots,inventory,registry),mode);
 }
});

test('provider adapter exports an exact overlay with bounded GET-only requests and no redirect or credential output',async()=>temporary(async dir=>{
 const f=await fixture(true),requests:any[]=[];
 const source=createCloudflareSnapshotSource({bucketName:'playtt-wordpress-pin-restore-audit',token:'local-synthetic-token',fetchImpl:async(url:string,options:any)=>{
  requests.push({url,options});assert.ok(url.startsWith('https://api.cloudflare.com/client/v4/accounts/3baadbd4abd9fd63c7f7e51664b26f67/r2/buckets/playtt-wordpress-pin-restore-audit/objects/'));
  assert.equal(options.method,'GET');assert.equal(options.redirect,'error');assert.ok(options.signal instanceof AbortSignal);assert.equal(options.headers.authorization,'Bearer local-synthetic-token');
  const key=decodeURIComponent(url.split('/objects/')[1]),b=f.data.get(key);return new Response(b||null,{status:b?200:404});
 }});
 const result=await exportSnapshotBundle(source.bucket,f.anchor,dir+'/backup');assert.deepEqual(equalContents(result.graph.contents),equalContents(f.c));assert.equal(source.stats.requests,4);
 assert.equal(source.stats.downloadedBytes,requests.reduce((n,r)=>n+f.data.get(decodeURIComponent(r.url.split('/objects/')[1]))!.length,0));assert.ok(!JSON.stringify(source.stats).includes('token'));
 await source.bucket.get(f.anchor.manifestKey);await assert.rejects(source.bucket.get(f.anchor.manifestKey),/request count/);assert.equal(requests.length,5);
}));

test('provider failures, excessive responses and wrong project namespaces fail without exposing response secrets',async()=>{
 const key=ROOT+'/markdown/revisions/'+randomUUID()+'.json';
 for(const code of [401,403,429,500]){
  const source=createCloudflareSnapshotSource({bucketName:'playtt-wordpress-pin-restore-audit',token:'local-synthetic-token',fetchImpl:async()=>new Response('private-error-body',{status:code})});
  await assert.rejects(source.bucket.get(key),(error:Error)=>error.message==='Snapshot GET failed: HTTP '+code);
 }
 let canceled=false,calls=0;
 const source=createCloudflareSnapshotSource({bucketName:'playtt-wordpress-pin-restore-audit',token:'local-synthetic-token',fetchImpl:async()=>{calls++;return new Response(new ReadableStream({start(c){c.enqueue(new Uint8Array(8*1024*1024+1));},cancel(){canceled=true;}}));}});
 await assert.rejects(source.bucket.get('sites/other/key'));assert.equal(calls,0);await assert.rejects(source.bucket.get(key),/byte budget/);assert.equal(canceled,true);
 assert.throws(()=>createCloudflareSnapshotSource({bucketName:'other-project',token:'local-synthetic-token'}));
});
