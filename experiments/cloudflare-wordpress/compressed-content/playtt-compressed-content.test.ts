import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash,randomUUID} from 'node:crypto';
import {gzipSync,gunzipSync} from 'node:zlib';
import {createCanonicalRestorePack,decodeCanonicalRestorePack,validateCanonicalRestorePackMetadata,type RestorePackContents} from '../src/canonical-restore-pack.js';
import * as compressed from '../src/playtt-compressed-content.js';
import {readMetadataOverlay,isMetadataOverlay} from '../src/playtt-maintenance-overlay.js';
const root='sites/default',groups=['markdown','uploads','wpContent'] as const,prefix={markdown:'markdown',uploads:'uploads',wpContent:'wp-content'};
const enc=(v:unknown)=>new TextEncoder().encode(typeof v==='string'?v:JSON.stringify(v));
const sha=(b:Uint8Array)=>createHash('sha256').update(b).digest('hex');
const file=(path:string,raw:string|Uint8Array)=>({path,bytes:typeof raw==='string'?enc(raw):raw});
const sorted=(c:RestorePackContents)=>Object.fromEntries([...groups.map(g=>[g,[...c[g]].sort((a,b)=>a.path.localeCompare(b.path))]),['wpContentDeleted',c.wpContentDeleted]]);
function manifest(c:RestorePackContents):compressed.CompressedManifest{
 const revision=randomUUID(),list=(g:typeof groups[number])=>c[g].map(f=>({path:f.path,size:f.bytes.length,sha256:sha(f.bytes),objectKey:`${root}/${prefix[g]}/objects/${sha(f.bytes)}`}));
 return {revision,manifestKey:`${root}/markdown/revisions/${revision}.json`,persistedAt:'2026-11-21T00:00:00Z',files:list('markdown'),uploads:list('uploads'),wpContent:list('wpContent'),wpContentDeleted:c.wpContentDeleted};
}
async function fixture(){
 const c:RestorePackContents={markdown:[file('page/a.md','原文🙂\n\t'),file('_tables/posts.json','[{"ID":"206","post_modified":"2026-01-01 00:00:00","post_content":"完整原文"}]')],uploads:[file('x.bin',new Uint8Array([0,255,1]))],wpContent:[file('themes/a/style.css','original')],wpContentDeleted:[]};
 const base=manifest(c),pack=await createCanonicalRestorePack(root,c);base.restorePack=pack.metadata;
 const data=new Map<string,Uint8Array>([[base.manifestKey,enc(base)],[pack.metadata.objectKey,pack.bytes]]);
 const bucket={async get(key:string){const value=data.get(key);return value?{size:value.length,body:new Blob([Uint8Array.from(value)]).stream(),arrayBuffer:async()=>Uint8Array.from(value).buffer}:null;}};
 return {c,base,pack,data,bucket};
}
async function candidate(f:Awaited<ReturnType<typeof fixture>>,c:RestorePackContents){
 const m=manifest(c),encoded=await compressed.createCompressedContent(f.bucket,root,m,f.base,(g,p)=>c[g].find(x=>x.path===p)!.bytes);
 assert.ok(encoded);m.restorePack=encoded.descriptor;compressed.validateCompressedContent(m,root);
 f.data.set(encoded.descriptor.delta.objectKey,encoded.bytes);f.data.set(m.manifestKey,enc(m));return m;
}
function replaceCompressed(f:Awaited<ReturnType<typeof fixture>>,m:compressed.CompressedManifest,bytes:Uint8Array){
 const d=(m.restorePack as compressed.CompressedContent).delta;d.sha256=sha(bytes);d.size=bytes.length;d.objectKey=`${root}/delta-packs/${d.sha256}.gz`;f.data.set(d.objectKey,bytes);
}
test('exact raw bytes across text, dates, binary, zero-byte additions, deletions and tombstones',async()=>{
 const f=await fixture(),c=structuredClone(f.c);c.markdown[0].bytes=enc('<!-- wp:paragraph -->\n<p>繁中🙂\t零\u0000</p>\n<!-- /wp:paragraph -->');
 c.markdown[1].bytes=enc('[{"ID":"206","post_modified":"2026-11-21 09:42:41","post_content":"完整原文"}]');
 c.markdown.push(file('page/empty.md',''));c.uploads=[file('other.bin',new Uint8Array([255,0,255]))];c.wpContent=[];c.wpContentDeleted=['themes/a/style.css'];
 const m=await candidate(f,c),decoded=await compressed.readCompressedContent(f.bucket,root,m);
 assert.deepEqual(sorted(decoded.contents),sorted(c));assert.equal(decoded.base.revision,f.base.revision);
 assert.equal(f.data.has(m.files[0].objectKey),false,'No new raw loose object was required');
});
test('twenty snapshots share the exact full base, including an empty delta',async()=>{
 const f=await fixture();
 for(let i=0;i<20;i++){const c=structuredClone(f.c);if(i<19)c.markdown[0].bytes=enc('第'+i+'次');const m=await candidate(f,c);
  assert.equal((m.restorePack as compressed.CompressedContent).base.revision,f.base.revision);assert.deepEqual(sorted((await compressed.readCompressedContent(f.bucket,root,m)).contents),sorted(c));}
});
test('existing readers reject the explicit format before treating it as a legacy archive',async()=>{
 const f=await fixture(),m=await candidate(f,f.c);assert.equal(isMetadataOverlay(m.restorePack),false);
 assert.throws(()=>validateCanonicalRestorePackMetadata(m.restorePack,root,{markdown:m.files,uploads:[],wpContent:[]}));
 await assert.rejects(readMetadataOverlay(f.bucket,root,m as never));
});
test('materialized contents decode through the unchanged full-pack reader',async()=>{
 const f=await fixture(),c=structuredClone(f.c);c.markdown[0].bytes=enc('完整備份還原');const m=await candidate(f,c);
 const decoded=(await compressed.readCompressedContent(f.bucket,root,m)).contents,full=await compressed.materializeCompressedContents(root,decoded);
 assert.deepEqual(sorted(await decodeCanonicalRestorePack(full.metadata,root,{markdown:m.files,uploads:m.uploads!,wpContent:m.wpContent!,wpContentDeleted:m.wpContentDeleted!},full.bytes)),sorted(c));
});
test('one MiB raw delta is accepted; an extra byte and65 cumulative entries fall back before encoding',async()=>{
 const f=await fixture(),c=structuredClone(f.c);c.markdown[0].bytes=new Uint8Array(compressed.MAX_COMPRESSED_DELTA_BYTES);const m=await candidate(f,c);
 assert.deepEqual(sorted((await compressed.readCompressedContent(f.bucket,root,m)).contents),sorted(c));
 c.markdown[0].bytes=new Uint8Array(compressed.MAX_COMPRESSED_DELTA_BYTES+1);
 assert.equal(await compressed.createCompressedContent(f.bucket,root,manifest(c),f.base,()=>{throw Error('must not read');}),null);
 const many=structuredClone(f.c);for(let i=0;i<65;i++)many.markdown.push(file('page/'+i+'.md',''));
 assert.equal(await compressed.createCompressedContent(f.bucket,root,manifest(many),f.base,()=>{throw Error('must not read');}),null);
});
test('deletions and tombstone changes count toward the cumulative limit',async()=>{
 const f=await fixture(),c=structuredClone(f.c);c.wpContentDeleted=Array.from({length:65},(_,i)=>'themes/x/'+String(i).padStart(3,'0'));
 assert.equal(await compressed.createCompressedContent(f.bucket,root,manifest(c),f.base,()=>{throw Error('must not read');}),null);
});
test('changed runtime bytes cannot bypass manifest hashes or sizes',async()=>{
 const f=await fixture(),c=structuredClone(f.c);c.markdown[0].bytes=enc('new');
 for(const bad of [enc('bad'),enc('longer')])await assert.rejects(compressed.createCompressedContent(f.bucket,root,manifest(c),f.base,()=>bad),/integrity/);
});
test('an asynchronously reused caller buffer cannot alter already copied source bytes',async()=>{
 const f=await fixture(),c=structuredClone(f.c);c.markdown[0].bytes=enc('immutable content');const m=manifest(c);
 const encoded=await compressed.createCompressedContent(f.bucket,root,m,f.base,(g,p)=>{
  const body=Uint8Array.from(c[g].find(x=>x.path===p)!.bytes);queueMicrotask(()=>body.fill(0));return body;
 });
 assert.ok(encoded);m.restorePack=encoded.descriptor;f.data.set(encoded.descriptor.delta.objectKey,encoded.bytes);
 assert.deepEqual(sorted((await compressed.readCompressedContent(f.bucket,root,m)).contents),sorted(c));
});
test('stored full-base identity and bytes are bound; linked bases are rejected',async()=>{
 const f=await fixture(),m=await candidate(f,f.c);
 await assert.rejects(compressed.createCompressedContent(f.bucket,root,m,m,()=>enc('x')));
 f.data.set(f.base.manifestKey,enc({...f.base,persistedAt:'2026-01-01T00:00:00Z'}));
 await assert.rejects(compressed.createCompressedContent(f.bucket,root,m,f.base,()=>enc('x')),/differs/);
 await assert.rejects(compressed.readCompressedContent(f.bucket,root,m),/hash|size/);
});
for(const kind of ['base','fullPack','delta']as const)test('missing '+kind+' rejects restore',async()=>{
 const f=await fixture(),m=await candidate(f,f.c),d=m.restorePack as compressed.CompressedContent;
 f.data.delete(kind==='base'?f.base.manifestKey:kind==='fullPack'?f.pack.metadata.objectKey:d.delta.objectKey);
 await assert.rejects(compressed.readCompressedContent(f.bucket,root,m));
});
for(const kind of ['schema','key','size','decodedBytes','fileCount','unknown','self','crossSite']as const)test('invalid descriptor '+kind+' fails closed',async()=>{
 const f=await fixture(),m=await candidate(f,f.c),d=m.restorePack as compressed.CompressedContent;
 if(kind==='schema')(d as any).schema='other';if(kind==='key')d.delta.objectKey='sites/other/delta-packs/'+d.delta.sha256+'.gz';
 if(kind==='size')d.delta.size=compressed.MAX_COMPRESSED_OBJECT+1;if(kind==='decodedBytes')d.delta.decodedBytes++;
 if(kind==='fileCount')d.delta.fileCount++;if(kind==='unknown')(d.delta as any).extra=true;
 if(kind==='self')d.base.revision=m.revision;if(kind==='crossSite')m.manifestKey='sites/other/markdown/revisions/'+m.revision+'.json';
 await assert.rejects(compressed.readCompressedContent(f.bucket,root,m));
});
test('traversal, duplicate files and overlapping tombstones reject before reading',async()=>{
 const f=await fixture(),m=await candidate(f,f.c);
 for(const mutate of [(x:any)=>x.files[0].path='../escape',(x:any)=>x.files.push({...x.files[0]}),(x:any)=>x.wpContentDeleted=['themes/a/style.css']]){
  const bad=structuredClone(m);mutate(bad);await assert.rejects(compressed.readCompressedContent({get:async()=>{throw Error('unexpected read');}},root,bad),/Invalid|metadata/);
 }
});
test('streaming rejects actual bytes beyond declared size and cancels upstream',async()=>{
 let canceled=false;const stream=new ReadableStream<Uint8Array>({pull(c){c.enqueue(new Uint8Array(8));},cancel(){canceled=true;}});
 await assert.rejects(compressed.readExactCompressedStream(stream,4,4),/exceeds declared/);assert.equal(canceled,true);
 await assert.rejects(compressed.readExactCompressedStream(new Blob([enc('x')]).stream(),2,2),/truncated/);
});
test('valid compressed hash does not permit a decompression bomb beyond expected framing',async()=>{
 const f=await fixture(),m=await candidate(f,f.c);
 replaceCompressed(f,m,gzipSync(new Uint8Array(16*1024*1024)));
 await assert.rejects(compressed.readCompressedContent(f.bucket,root,m),/exceeds declared/);
});
test('valid hashes cannot hide truncated gzip, a different header, corrupt file bytes, or trailing members',async()=>{
 for(const kind of ['truncated','header','file','trailing']){
  const f=await fixture(),c=structuredClone(f.c);c.markdown[0].bytes=enc('changed');const m=await candidate(f,c),d=m.restorePack as compressed.CompressedContent;
  const original=f.data.get(d.delta.objectKey)!,raw=gunzipSync(original);let altered:Uint8Array;
  if(kind==='truncated')altered=original.slice(0,-3);
  else if(kind==='trailing')altered=Buffer.concat([original,gzipSync(enc('extra'))]);
  else{raw[kind==='header'?0:raw.length-1]^=1;altered=gzipSync(raw);}
  replaceCompressed(f,m,altered);await assert.rejects(compressed.readCompressedContent(f.bucket,root,m));
 }
});
