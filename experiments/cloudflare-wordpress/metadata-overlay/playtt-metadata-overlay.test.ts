import assert from 'node:assert/strict';
import test from 'node:test';
import { createHash,randomUUID } from 'node:crypto';
import { mkdtemp,writeFile,mkdir,rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createCanonicalRestorePack,decodeCanonicalRestorePack,type RestorePackContents } from '../src/canonical-restore-pack.js';
import { createMetadataOverlay,readMetadataOverlay,validateMetadataOverlay,readOverlayBytes,METADATA_OVERLAY_SCHEMA,type OverlayManifest } from '../src/playtt-metadata-overlay.js';
import { PlayttBackupPins } from '../src/playtt-backup-pins.js';
import { DurableObjectRevisionCoordinator,WordPressStateCoordinator } from '../src/state-coordinator.js';
import { readPlayttSnapshotSources } from '../src/playtt-snapshot-source.js';
import { verifiedBackupPin } from '../scripts/playtt-backup-pin-client.mjs';

const root='sites/default',encode=(s:string)=>new TextEncoder().encode(s),hash=(x:Uint8Array)=>createHash('sha256').update(x).digest('hex');
const PM='_tables/postmeta.json',SEQ='_runtime/playtt-auto-increment.json',MARKER='_runtime/playtt-postmeta-layout.json';
const groups=['markdown','uploads','wpContent'] as const,prefix={markdown:'markdown',uploads:'uploads',wpContent:'wp-content'};
const row=(id:string,key:string,value:string)=>({meta_id:id,post_id:'192',meta_key:key,meta_value:value});
const initialRows=[row('1','_wp_attached_file','2026/11/logo.webp'),row('7','_edit_lock','1795200000:1')];
const file=(path:string,data:unknown)=>({path,bytes:encode(typeof data==='string'?data:JSON.stringify(data))});
const contents=(rows=initialRows,seq='583'):RestorePackContents=>({markdown:[file(MARKER,{schema:'playtt/postmeta-table/v1'}),file(SEQ,{schema:'playtt/auto-increment/v1',sequences:{wp_options:seq,wp_postmeta:'7',wp_posts:'192'}}),file(PM,rows),file('pages/draft.md','繁體中文\n\t ')],uploads:[file('2026/11/logo.webp','original media')],wpContent:[file('themes/lets-play/style.css','original theme')],wpContentDeleted:['plugins/removed.php']});
function manifest(data:RestorePackContents):OverlayManifest{
 const revision=randomUUID(),metadata=(group:typeof groups[number])=>data[group].map(f=>({path:f.path,objectKey:`${root}/${prefix[group]}/objects/${hash(f.bytes)}`,sha256:hash(f.bytes),size:f.bytes.length}));
 return {revision,manifestKey:`${root}/markdown/revisions/${revision}.json`,persistedAt:new Date().toISOString(),files:metadata('markdown'),uploads:metadata('uploads'),wpContent:metadata('wpContent'),wpContentDeleted:data.wpContentDeleted};
}
function storage(){
 const data=new Map<string,Uint8Array>(),reads:string[]=[],values=new Map<string,any>();
 const bucket={async get(key:string){reads.push(key);const bytes=data.get(key);return bytes?{size:bytes.length,arrayBuffer:async()=>bytes.slice().buffer,body:new Blob([bytes as Uint8Array<ArrayBuffer>]).stream()}:null;}};
 const state={get:async(k:string)=>structuredClone(values.get(k)),put:async(k:string,v:any)=>{values.set(k,structuredClone(v));}} as unknown as DurableObjectStorage;
 function add(m:OverlayManifest,c:RestorePackContents){for(const group of groups)for(const f of c[group])data.set(`${root}/${prefix[group]}/objects/${hash(f.bytes)}`,f.bytes);data.set(m.manifestKey,encode(JSON.stringify(m)));}
 return {data,reads,bucket,state,add};
}
async function fixture(){const f=storage(),c=contents(),base=manifest(c),pack=await createCanonicalRestorePack(root,c);base.restorePack=pack.metadata;f.data.set(pack.metadata.objectKey,pack.bytes);f.add(base,c);return {...f,base,c,pack};}
const sorted=(c:RestorePackContents)=>Object.fromEntries([...groups.map(g=>[g,[...c[g]].sort((a,b)=>a.path.localeCompare(b.path))]),['wpContentDeleted',c.wpContentDeleted]]);
async function overlay(f:Awaited<ReturnType<typeof fixture>>,c:RestorePackContents,previous=f.base){const m=manifest(c);f.add(m,c);const candidate=await createMetadataOverlay(f.bucket,root,m,previous);assert.ok(candidate);m.restorePack=candidate;f.add(m,c);return m;}

test('native lock and exact high-water bytes restore with unchanged content, media and theme',async()=>{
 const f=await fixture(),c=contents([initialRows[0],row('7','_edit_lock','1795200120:1')],'585'),m=await overlay(f,c);
 validateMetadataOverlay(m,root);f.reads.length=0;const restored=await readMetadataOverlay(f.bucket,root,m);
 assert.deepEqual(sorted(restored.contents),sorted(c));assert.deepEqual(new Set(f.reads),new Set([f.base.manifestKey,f.pack.metadata.objectKey,...m.files.filter(x=>[PM,SEQ].includes(x.path)).map(x=>x.objectKey)]));
 const full=await createCanonicalRestorePack(root,restored.contents);assert.deepEqual(sorted(await decodeCanonicalRestorePack(full.metadata,root,{markdown:m.files,uploads:m.uploads!,wpContent:m.wpContent!,wpContentDeleted:m.wpContentDeleted!},full.bytes)),sorted(c));
 await assert.rejects(decodeCanonicalRestorePack(m.restorePack,root,{markdown:m.files,uploads:m.uploads!,wpContent:m.wpContent!,wpContentDeleted:m.wpContentDeleted!},f.pack.bytes),/metadata/);
});

test('repeated maintenance keeps one full base with no chain or growing descriptor',async()=>{
 const f=await fixture();let previous=f.base;
 for(let i=1;i<=20;i++){
  const c=contents([initialRows[0],row('7','_edit_lock',`${1795200000+i*10}:1`)],String(583+i*2));const m=await overlay(f,c,previous);
  assert.equal((m.restorePack as any).base.revision,f.base.revision);assert.ok(JSON.stringify(m.restorePack).length<400);
  assert.deepEqual(sorted((await readMetadataOverlay(f.bucket,root,m)).contents),sorted(c));previous=m;
 }
});

test('native lock owner takeover, row deletion and re-addition preserve original identities',async()=>{
 const f=await fixture();let previous=f.base;
 for(const rows of [[initialRows[0],row('7','_edit_lock','1795200200:2')],[initialRows[0]],[initialRows[0],row('8','_edit_lock','1795200300:2')]]){
  const c=contents(rows,'590');if(rows.some(x=>x.meta_id==='8')){const seq=c.markdown.find(x=>x.path===SEQ)!;const value=JSON.parse(new TextDecoder().decode(seq.bytes));value.sequences.wp_postmeta='8';seq.bytes=encode(JSON.stringify(value));}
  const m=await overlay(f,c,previous);assert.deepEqual(sorted((await readMetadataOverlay(f.bucket,root,m)).contents),sorted(c));previous=m;
 }
});

test('content, attachment metadata, assets, tombstones and missing layout never use the maintenance path',async()=>{
 for(const mutate of [(c:RestorePackContents)=>c.markdown.push(file('pages/new.md','new')),
  (c:RestorePackContents)=>{c.markdown.find(x=>x.path==='pages/draft.md')!.bytes=encode('edited');},
  (c:RestorePackContents)=>{c.markdown.find(x=>x.path===PM)!.bytes=encode(JSON.stringify([row('1','_wp_attached_file','changed'),initialRows[1]]));},
  (c:RestorePackContents)=>{c.uploads[0].bytes=encode('new image');},(c:RestorePackContents)=>c.wpContentDeleted.push('themes/new.php'),
  (c:RestorePackContents)=>{c.markdown=c.markdown.filter(x=>x.path!==MARKER);}]){
   const f=await fixture(),c=contents([initialRows[0],row('7','_edit_lock','1795200120:1')],'585');mutate(c);const m=manifest(c);f.add(m,c);assert.equal(await createMetadataOverlay(f.bucket,root,m,f.base),null);
 }
});

test('sequence precision is retained; counter rollback, missing keys and ID reuse are rejected from fast path',async()=>{
 const f=await fixture(),c=contents([initialRows[0],row('7','_edit_lock','1795200120:1')],'9007199254740993'),m=await overlay(f,c);assert.deepEqual(sorted((await readMetadataOverlay(f.bucket,root,m)).contents),sorted(c));
 for(const change of [(s:any)=>s.sequences.wp_options='582',(s:any)=>delete s.sequences.wp_posts,(s:any)=>s.sequences.wp_postmeta='6']){
  const n=contents([initialRows[0],row('7','_edit_lock','1795200120:1')]);const seq=n.markdown.find(x=>x.path===SEQ)!;const value=JSON.parse(new TextDecoder().decode(seq.bytes));change(value);seq.bytes=encode(JSON.stringify(value));const next=manifest(n);f.add(next,n);assert.equal(await createMetadataOverlay(f.bucket,root,next,f.base),null);
 }
 const reused=contents([...initialRows,row('6','_edit_lock','1795200120:1')],'585'),next=manifest(reused);f.add(next,reused);
 assert.equal(await createMetadataOverlay(f.bucket,root,next,f.base),null);
 next.restorePack=m.restorePack;await assert.rejects(readMetadataOverlay(f.bucket,root,next),/maintenance/);
});

test('incorrect hashes, unavailable dependencies and changed base bytes fail closed',async()=>{
 for(const failure of ['base','pack','metadata','missing']){
  const f=await fixture(),m=await overlay(f,contents([initialRows[0],row('7','_edit_lock','1795200120:1')],'585'));
  const key=failure==='base'?f.base.manifestKey:failure==='pack'?f.pack.metadata.objectKey:m.files.find(x=>x.path===PM)!.objectKey;
  if(failure==='missing')f.data.delete(key);else{const bytes=f.data.get(key)!.slice();bytes[0]^=1;f.data.set(key,bytes);}
  await assert.rejects(readMetadataOverlay(f.bucket,root,m));
 }
});

test('a valid-hash overlay cannot smuggle attachment changes or reset the stored counters',async()=>{
 for(const bad of ['attachment','counter']){
  const f=await fixture(),c=contents([initialRows[0],row('7','_edit_lock','1795200120:1')],'585'),m=await overlay(f,c);
  if(bad==='attachment')c.markdown.find(x=>x.path===PM)!.bytes=encode(JSON.stringify([row('1','_wp_attached_file','other.webp'),row('7','_edit_lock','1795200120:1')]));
  else c.markdown.find(x=>x.path===SEQ)!.bytes=contents(initialRows,'500').markdown.find(x=>x.path===SEQ)!.bytes;
  const badManifest={...manifest(c),restorePack:m.restorePack};f.add(badManifest,c);await assert.rejects(readMetadataOverlay(f.bucket,root,badManifest),/maintenance/);
 }
});

test('cross-site bases, self references, chained overlays and extra descriptor fields are rejected',async()=>{
 const f=await fixture(),m=await overlay(f,contents([initialRows[0],row('7','_edit_lock','1795200120:1')],'585'));
 for(const mutate of [(x:any)=>x.restorePack.base.manifestKey=x.restorePack.base.manifestKey.replace('default','other'),(x:any)=>x.restorePack.base={...x.restorePack.base,revision:x.revision,manifestKey:x.manifestKey},(x:any)=>x.restorePack.unsafe=true]){const bad=structuredClone(m);mutate(bad);await assert.rejects(readMetadataOverlay(f.bucket,root,bad));}
 const chain=structuredClone(m);chain.revision=randomUUID();chain.manifestKey=`${root}/markdown/revisions/${chain.revision}.json`;chain.restorePack={schema:METADATA_OVERLAY_SCHEMA,base:{revision:m.revision,manifestKey:m.manifestKey,persistedAt:m.persistedAt,size:f.data.get(m.manifestKey)!.length,sha256:hash(f.data.get(m.manifestKey)!)}};
 await assert.rejects(readMetadataOverlay(f.bucket,root,chain),/chains/);
});

test('bounded read cancels a stream that exceeds its declaration',async()=>{
 let canceled=false;const bucket={get:async()=>({size:2,body:new ReadableStream<Uint8Array>({start(c){c.enqueue(encode('oversize'));},cancel(){canceled=true;}}),arrayBuffer:async()=>new ArrayBuffer(0)})};
 await assert.rejects(readOverlayBytes(bucket,'key',3),/exceeded/);assert.equal(canceled,true);
});

test('remote pin verifies complete overlay dependencies and preserves exact retry semantics',async()=>{
 const f=await fixture(),m=await overlay(f,contents([initialRows[0],row('7','_edit_lock','1795200120:1')],'585'));
 const pin={revision:m.revision,manifestKey:m.manifestKey,persistedAt:m.persistedAt,manifestSha256:hash(f.data.get(m.manifestKey)!),packKey:f.pack.metadata.objectKey,packSha256:f.pack.metadata.sha256,packBytes:f.pack.bytes.length};
 const pins=new PlayttBackupPins(f.state,f.bucket as unknown as R2Bucket);let fenced=true;
 const result=await pins.register(pin,()=>assert.ok(fenced));assert.equal(result.generation,1);assert.equal((await pins.register(pin,()=>assert.ok(fenced))).created,false);
 const n=await overlay(f,contents([initialRows[0],row('7','_edit_lock','1795200240:1')],'587'),m);const next={...pin,revision:n.revision,manifestKey:n.manifestKey,persistedAt:n.persistedAt,manifestSha256:hash(f.data.get(n.manifestKey)!)};
 f.data.delete(n.files.find(x=>x.path===PM)!.objectKey);await assert.rejects(pins.register(next,()=>assert.ok(fenced)));assert.equal((await pins.list()).generation,1);
 fenced=false;await assert.rejects(pins.register(pin,()=>assert.ok(fenced)));
});

test('content edits after an overlay fall back to a full archive with the latest locks and counters',async()=>{
 const f=await fixture(),c=contents([initialRows[0],row('7','_edit_lock','1795200120:2')],'585'),previous=await overlay(f,c);
 c.markdown.find(x=>x.path==='pages/draft.md')!.bytes=encode('真正的新內容\n\t ');const next=manifest(c);f.add(next,c);
 assert.equal(await createMetadataOverlay(f.bucket,root,next,previous),null);
 const sources=await readPlayttSnapshotSources(f.bucket,root,next,previous,(group,path)=>c[group].find(x=>x.path===path)!.bytes);
 const pack=await createCanonicalRestorePack(root,sources.contents);
 const restored=await decodeCanonicalRestorePack(pack.metadata,root,{markdown:next.files,uploads:next.uploads!,wpContent:next.wpContent!,wpContentDeleted:next.wpContentDeleted!},pack.bytes);
 assert.deepEqual(sorted(restored),sorted(c));
});

test('the existing coordinator serializes overlay commits and exposes a durable receipt after a lost response',async()=>{
 const f=await fixture(),c=contents([initialRows[0],row('7','_edit_lock','1795200120:2')],'585'),m=await overlay(f,c);
 const values=new Map<string,any>();let lost=false;
 const state={get:async(k:string)=>structuredClone(values.get(k)),put:async(k:string,v:any)=>{values.set(k,structuredClone(v));},async transaction(fn:any){const before=structuredClone(values);try{return await fn(state);}catch(e){values.clear();for(const [k,v]of before)values.set(k,v);throw e;}}};
 const pointer=(x:OverlayManifest)=>({revision:x.revision,manifestKey:x.manifestKey,persistedAt:x.persistedAt});
 values.set('wordpress-state-coordinator',{initialized:true,siteId:'default',pointer:pointer(f.base),version:62});
 const bucket={...f.bucket,put:async(key:string,value:string)=>{f.data.set(key,encode(value));return {};}} as unknown as R2Bucket;
 const env={WORDPRESS_STATE_BUCKET:bucket};let server=new WordPressStateCoordinator({storage:state} as unknown as DurableObjectState,env);
 const client=new DurableObjectRevisionCoordinator({async fetch(request:Request){const result=await server.fetch(request);if(lost&&new URL(request.url).searchParams.get('__wp_codebox_coordinator')==='commit'){lost=false;throw new Error('Lost response after durable commit');}return result;}} as DurableObjectStub,'default');
 const lease=await client.acquire();await assert.rejects(client.acquire());lost=true;await assert.rejects(client.commit(lease,pointer(m)),/Lost response/);
 server=new WordPressStateCoordinator({storage:state} as unknown as DurableObjectState,env);
 assert.deepEqual(await client.committed(63),pointer(m));assert.deepEqual((await client.state()).pointer,pointer(m));assert.deepEqual(JSON.parse(new TextDecoder().decode(f.data.get(root+'/markdown/current.json'))),pointer(m));
 await assert.rejects(client.commit(lease,pointer(m)));assert.deepEqual(sorted((await readMetadataOverlay(f.bucket,root,m)).contents),sorted(c));
 const next=await client.acquire();assert.equal(next.version,63);await client.release(next);
});

test('portable local backup requires the anchored base and exact replacement files',async()=>{
 const f=await fixture(),m=await overlay(f,contents([initialRows[0],row('7','_edit_lock','1795200120:1')],'585'));
 const parent=resolve('artifacts');await mkdir(parent,{recursive:true});const dir=await mkdtemp(parent+'/overlay-unit-');assert.ok(resolve(dir).startsWith(parent));
 try{
  await mkdir(dir+'/objects');await writeFile(dir+'/manifest.json',f.data.get(m.manifestKey)!);await writeFile(dir+'/base-manifest.json',f.data.get(f.base.manifestKey)!);await writeFile(dir+'/restore.zip',f.pack.bytes);
  for(const item of m.files.filter(x=>[PM,SEQ].includes(x.path)))await writeFile(dir+'/objects/'+item.sha256,f.data.get(item.objectKey)!);
  const verified=await verifiedBackupPin(dir);assert.equal(verified.pin.revision,m.revision);assert.equal(verified.format,'metadata-overlay-with-base');assert.equal(verified.dependenciesVerified,true);assert.equal(verified.objects,5);assert.equal(verified.reconstructedFiles,6);
  await writeFile(dir+'/objects/'+m.files.find(x=>x.path===PM)!.sha256,'corrupt');await assert.rejects(verifiedBackupPin(dir));
 }finally{assert.ok(resolve(dir).startsWith(parent+'/')||resolve(dir).startsWith(parent+'\\'));await rm(dir,{recursive:true});}
});
