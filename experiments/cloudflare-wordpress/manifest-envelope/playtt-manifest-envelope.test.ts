import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash,randomUUID,randomBytes} from 'node:crypto';
import {gzipSync} from 'node:zlib';
import {readFile,mkdir,mkdtemp,writeFile,readdir} from 'node:fs/promises';
import ts from 'typescript';
import * as codec from '../src/playtt-manifest-envelope.js';
import {createCanonicalRestorePack,decodeCanonicalRestorePack,validateCanonicalRestorePackMetadata} from '../src/canonical-restore-pack.js';
import {createCompressedContent,isCompressedContent,validateCompressedContent,type CompressedManifest} from '../src/playtt-compressed-content.js';
import {prepareCompressedContent,persistCompressedFallbackMarkdown} from '../src/playtt-compressed-persistence.js';
import {readMetadataOverlay,createMetadataOverlay,isMetadataOverlay,validateMetadataOverlay} from '../src/playtt-maintenance-overlay.js';
import {readPlayttSnapshotSources} from '../src/playtt-snapshot-source.js';
import {PlayttBackupPins} from '../src/playtt-backup-pins.js';
import {servePublicPublication} from '../src/public-reader.js';
import {PUBLISHED_REVISION_SCHEMA,publishedPageObjectKey} from '../src/published-reader.js';
import {DEFAULT_SITE_CONTEXT,siteStorageKeys} from '../src/site-context.js';
// @ts-expect-error Local helper has no declarations.
import {readSnapshotGraph,exportSnapshotBundle,importSnapshotBundle,materializeFullSnapshotBundle} from '../scripts/playtt-snapshot-bundle.mjs';
// @ts-expect-error Local helper has no declarations.
import {verifiedBackupPin} from '../scripts/playtt-backup-pin-client.mjs';
const root='sites/default',groups=['markdown','uploads','wpContent'] as const,prefix={markdown:'markdown',uploads:'uploads',wpContent:'wp-content'};
const enc=(v:unknown)=>new TextEncoder().encode(typeof v==='string'?v:JSON.stringify(v));
const sha=(v:Uint8Array)=>createHash('sha256').update(v).digest('hex');
const parse=(v:Uint8Array)=>JSON.parse(new TextDecoder().decode(v));
const file=(path:string,text:string)=>({path,bytes:enc(text)});
const sorted=(c:any)=>Object.fromEntries([...groups.map(g=>[g,[...c[g]].sort((a,b)=>a.path.localeCompare(b.path))]),['wpContentDeleted',c.wpContentDeleted]]);
function manifest(c:any):CompressedManifest{const revision=randomUUID(),list=(g:typeof groups[number])=>c[g].map((f:any)=>({path:f.path,size:f.bytes.length,sha256:sha(f.bytes),objectKey:`${root}/${prefix[g]}/objects/${sha(f.bytes)}`}));return {revision,manifestKey:`${root}/markdown/revisions/${revision}.json`,persistedAt:'2026-11-21T12:30:00.000Z',files:list('markdown'),uploads:list('uploads'),wpContent:list('wpContent'),wpContentDeleted:c.wpContentDeleted};}
async function fixture(){
 const contents={markdown:Array.from({length:32},(_,i)=>file('page/'+i+'.md','原生資料 '+i+' 🙂\n')),uploads:[file('image.png','image bytes')],wpContent:[file('themes/example/style.css','body{color:green}')],wpContentDeleted:[]};
 const base=manifest(contents),pack=await createCanonicalRestorePack(root,contents);base.restorePack=pack.metadata;
 const data=new Map<string,Uint8Array>([[base.manifestKey,enc(base)],[pack.metadata.objectKey,pack.bytes]]),writes:string[]=[];
 const bucket={async get(key:string){const b=data.get(key);return b?{size:b.length,body:new Blob([Uint8Array.from(b)]).stream(),arrayBuffer:async()=>Uint8Array.from(b).buffer,json:async<T=unknown>()=>parse(b) as T,text:async()=>new TextDecoder().decode(b)}:null;},async put(key:string,body:Uint8Array|string){writes.push(key);data.set(key,typeof body==='string'?enc(body):Uint8Array.from(body));return {};}};
 for(const g of groups)for(const f of contents[g])data.set(`${root}/${prefix[g]}/objects/${sha(f.bytes)}`,f.bytes);
 contents.markdown[0].bytes=enc('更新正文\n🙂');const m=manifest(contents),read=(g:typeof groups[number],p:string)=>contents[g].find(f=>f.path===p)!.bytes;
 const encoded=await createCompressedContent(bucket,root,m,base,read);assert.ok(encoded);m.restorePack=encoded.descriptor;data.set(encoded.descriptor.delta.objectKey,encoded.bytes);
 const wire=await codec.serializeManifestEnvelope(m,root);assert.ok(codec.isManifestEnvelope(JSON.parse(wire)));data.set(m.manifestKey,enc(wire));
 const pin={revision:m.revision,manifestKey:m.manifestKey,persistedAt:m.persistedAt,manifestSha256:sha(enc(wire)),packKey:pack.metadata.objectKey,packSha256:pack.metadata.sha256,packBytes:pack.metadata.size};
 return {contents,base,pack,m,wire,data,writes,bucket,read,pin};
}
function rewritePayload(envelope:any,raw:Uint8Array){const zipped=gzipSync(raw);return {...envelope,decodedBytes:raw.length,decodedSha256:sha(raw),encodedBytes:zipped.length,encodedSha256:sha(zipped),payload:zipped.toString('base64')};}
test('envelope restores exact full metadata and binds outer and inner identities',async()=>{
 const f=await fixture(),decoded=await codec.decodeCanonicalManifestBytes(enc(f.wire),root);assert.deepEqual(decoded,f.m);assert.ok(enc(f.wire).length<enc(f.m).length);
 assert.deepEqual(await codec.readCanonicalManifestObject((await f.bucket.get(f.m.manifestKey))!,root),f.m);
 assert.equal(sha(enc(f.wire)),f.pin.manifestSha256);assert.notEqual(sha(enc(f.m)),f.pin.manifestSha256);
 assert.deepEqual(sorted((await readMetadataOverlay(f.bucket,root,decoded as never)).contents),sorted(f.contents));
});
test('serialization snapshots mutable metadata before asynchronous hashing',async()=>{
 const f=await fixture(),m=structuredClone(f.m),expected=structuredClone(m),pending=codec.serializeManifestEnvelope(m,root);m.revision=randomUUID();m.files[0].path='changed';
 assert.deepEqual(await codec.decodeCanonicalManifestBytes(enc(await pending),root),expected);
});
for(const field of ['schema','codec','revision','manifestKey','persistedAt','decodedBytes','decodedSha256','encodedBytes','encodedSha256','payload','unknown'] as const)test('invalid envelope '+field+' rejects',async()=>{
 const f=await fixture(),e=JSON.parse(f.wire);
 if(field==='schema')e.schema='playtt/canonical-manifest-envelope/v2';else if(field==='codec')e.codec='identity';else if(field==='revision')e.revision=randomUUID();else if(field==='manifestKey')e.manifestKey=e.manifestKey.replace('default','other');else if(field==='persistedAt')e.persistedAt='2026-01-01T00:00:00Z';else if(field==='decodedBytes')e.decodedBytes++;else if(field==='encodedBytes')e.encodedBytes++;else if(field==='decodedSha256'||field==='encodedSha256')e[field]='0'.repeat(64);else if(field==='payload')e.payload=' '+e.payload;else e.extra=true;
 await assert.rejects(codec.decodeCanonicalManifestBytes(enc(e),root));
});
test('canonical base64, finite integer lengths and all three wire limits are enforced',async()=>{
 const f=await fixture(),e=JSON.parse(f.wire);
 for(const patch of [{decodedBytes:0},{decodedBytes:-1},{decodedBytes:1.5},{decodedBytes:codec.MAX_MANIFEST_DECODED+1},{encodedBytes:codec.MAX_MANIFEST_GZIP+1},{encodedBytes:NaN},{payload:e.payload.slice(0,-1)+'-'}])await assert.rejects(codec.decodeCanonicalManifestBytes(enc({...e,...patch}),root));
 await assert.rejects(codec.decodeCanonicalManifestBytes(new Uint8Array(codec.MAX_MANIFEST_ENVELOPE+1),root),/wire bytes/);
});
test('valid compressed hashes cannot hide a bomb, invalid UTF8/JSON, nested or old-format payload',async()=>{
 const f=await fixture(),e=JSON.parse(f.wire),bomb=rewritePayload(e,new Uint8Array(4*1024*1024));bomb.decodedBytes=100;
 await assert.rejects(codec.decodeCanonicalManifestBytes(enc(bomb),root),/declared size/);
 for(const raw of [new Uint8Array([255]),enc('not JSON'),enc(e),enc(f.base)])await assert.rejects(codec.decodeCanonicalManifestBytes(enc(rewritePayload(e,raw)),root));
 const truncated=Buffer.from(e.payload,'base64').subarray(0,-4);e.payload=truncated.toString('base64');e.encodedBytes=truncated.length;e.encodedSha256=sha(truncated);await assert.rejects(codec.decodeCanonicalManifestBytes(enc(e),root));
});
test('decoded bytes exactly at256KiB pass, an extra byte rejects; incompressible metadata remains plain',async()=>{
 const f=await fixture(),m={...f.m,padding:''};m.padding='x'.repeat(codec.MAX_MANIFEST_DECODED-enc(m).length);assert.equal(enc(m).length,codec.MAX_MANIFEST_DECODED);
 const wire=await codec.serializeManifestEnvelope(m,root);assert.deepEqual(await codec.decodeCanonicalManifestBytes(enc(wire),root),m);
 m.padding+='x';await assert.rejects(codec.serializeManifestEnvelope(m,root),/budget/);
 const alphabet=Array.from({length:94},(_,i)=>String.fromCharCode(i+33)).filter(c=>c!=='"'&&c!=='\\');
 const padding=Array.from(randomBytes(250000),v=>alphabet[v%alphabet.length]).join(''),plain={...f.m,padding};assert.ok(enc(plain).length<codec.MAX_MANIFEST_DECODED);assert.ok(gzipSync(enc(plain)).length>codec.MAX_MANIFEST_GZIP);
 const serialized=await codec.serializeManifestEnvelope(plain,root);assert.equal(sha(enc(serialized)),sha(enc(plain)));
});
test('large legacy plain objects retain their original path; oversized envelopes never decompress',async()=>{
 const f=await fixture(),large={...f.base,padding:'x'.repeat(300000)},raw=enc(large);let arrayReads=0;
 const object={size:raw.length,json:async<T>()=>large as T,arrayBuffer:async()=>{arrayReads++;return raw.buffer;}};
 assert.deepEqual(await codec.readCanonicalManifestObject(object,root),large);assert.equal(arrayReads,0);
 await assert.rejects(codec.readCanonicalManifestObject({...object,json:async<T>()=>({...JSON.parse(f.wire),padding:'x'.repeat(300000)}) as T},root),/schema/);
});
test('dishonest object lengths cancel the stream before returning partial metadata',async()=>{
 let canceled=0;const object={size:1,json:async<T>()=>({}) as T,arrayBuffer:async()=>new ArrayBuffer(0),body:new ReadableStream<Uint8Array>({start(c){c.enqueue(new Uint8Array(20));},cancel(){canceled++;}})};
 await assert.rejects(codec.readCanonicalManifestObject(object,root),/declared size/);assert.equal(canceled,1);
});
test('wrapped previous manifests match logical cache but altered decoded content cannot replace it',async()=>{
 const f=await fixture(),next=manifest(f.contents);assert.ok(await prepareCompressedContent(f.bucket,root,next,f.m as never,f.read));
 await assert.rejects(prepareCompressedContent(f.bucket,root,next,{...f.m,persistedAt:'2026-01-01T00:00:00Z'} as never,f.read),/previous manifest/);
 const changed={...f.m,padding:'unexpected'};f.data.set(f.m.manifestKey,enc(await codec.serializeManifestEnvelope(changed,root)));await assert.rejects(prepareCompressedContent(f.bucket,root,next,f.m as never,f.read),/previous manifest/);
});
test('physical pin anchors survive export, detached import, composite verification and old full materialization',async()=>{
 const f=await fixture(),state=new Map(),pins=new PlayttBackupPins({get:async(k:string)=>structuredClone(state.get(k)),put:async(k:string,v:any)=>{state.set(k,structuredClone(v));}} as any,f.bucket as any);
 assert.equal((await pins.register(f.pin,()=>{})).generation,1);
 await mkdir('artifacts',{recursive:true});const dir=await mkdtemp('artifacts/manifest-envelope-unit-');await exportSnapshotBundle(f.bucket,f.pin,dir+'/export');const copy=await importSnapshotBundle(dir+'/export',f.pin,dir+'/independent');assert.equal(copy.graph.manifestEncoding,'gzip-envelope');assert.deepEqual(copy.graph.manifest,f.m);assert.equal(sha(copy.graph.objects.find((x:any)=>x.key===f.m.manifestKey).bytes),f.pin.manifestSha256);
 for(const x of [...f.m.files,...f.m.uploads!,...f.m.wpContent!])assert.equal(sha(new Uint8Array(await(await copy.bucket.get(x.objectKey)).arrayBuffer())),x.sha256);
 await assert.rejects(readSnapshotGraph(copy.bucket,{...f.pin,manifestSha256:sha(enc(f.m))}));
 const full=await materializeFullSnapshotBundle(dir+'/independent',f.pin,dir+'/full');assert.equal(full.graph.manifestEncoding,'plain-json');assert.equal(full.graph.format,'full-pack');assert.deepEqual(sorted(full.graph.contents),sorted(f.contents));
 await mkdir(dir+'/composite');await writeFile(dir+'/composite/manifest.json',f.wire);await writeFile(dir+'/composite/base-manifest.json',enc(f.base));await writeFile(dir+'/composite/restore.zip',f.pack.bytes);await writeFile(dir+'/composite/delta.gz',f.data.get((f.m.restorePack as any).delta.objectKey)!);assert.deepEqual((await verifiedBackupPin(dir+'/composite')).pin,f.pin);
 f.data.clear();assert.deepEqual(sorted((await importSnapshotBundle(dir+'/independent',f.pin,dir+'/third')).graph.contents),sorted(f.contents));
});
test('a corrupt inner envelope with a recomputed physical anchor cannot register a pin',async()=>{
 const f=await fixture(),e=JSON.parse(f.wire);e.decodedSha256='0'.repeat(64);f.data.set(f.m.manifestKey,enc(e));const values=new Map(),pins=new PlayttBackupPins({get:async(k:string)=>values.get(k),put:async(k:string,v:any)=>{values.set(k,v);}} as any,f.bucket as any);
 await assert.rejects(pins.register({...f.pin,manifestSha256:sha(enc(e))},()=>{}));assert.equal((await pins.list()).generation,0);
});
test('public upload/theme GET and HEAD read the envelope and preserve raw assets and revision identity',async()=>{
 const f=await fixture(),revision=randomUUID(),route='/',canonicalRevision=f.m.revision,objectKey=await publishedPageObjectKey(canonicalRevision,route,DEFAULT_SITE_CONTEXT);
 f.data.set(siteStorageKeys(DEFAULT_SITE_CONTEXT).publishedCurrent,enc({schema:PUBLISHED_REVISION_SCHEMA,state:'complete',revision,canonicalRevision,canonicalVersion:9,publishedAt:'2026-11-21T00:00:00Z',routes:[{route,objectKey,canonicalRevision}]}));
 for(const [path,expected]of [['/wp-content/uploads/image.png',f.contents.uploads[0].bytes],['/wp-content/themes/example/style.css',f.contents.wpContent[0].bytes]] as const){for(const method of ['GET','HEAD']){const response=await servePublicPublication(new Request('https://reader.example'+path,{method}),f.bucket as any,DEFAULT_SITE_CONTEXT);assert.equal(response.status,200);assert.equal(response.headers.get('x-wp-codebox-publication-revision'),revision);assert.deepEqual(new Uint8Array(await response.arrayBuffer()),method==='GET'?expected:new Uint8Array());}}
 const bad=JSON.parse(f.wire);bad.decodedSha256='0'.repeat(64);f.data.set(f.m.manifestKey,enc(bad));assert.equal((await servePublicPublication(new Request('https://reader.example/wp-content/uploads/image.png'),f.bucket as any,DEFAULT_SITE_CONTEXT)).status,503);
});

const source=await readFile('src/worker.ts','utf8'),section=(a:string,b:string)=>source.slice(source.indexOf(a),source.indexOf(b,source.indexOf(a)));
const code=ts.transpileModule([section('async function putImmutableBytes(','function wordPressPageCacheKey('),section('async function persistMarkdownManifest(','async function readMarkdownManifest('),section('async function readMarkdownManifest(','function validateMarkdownManifestFiles('),section('async function readCanonicalRevision(','function sumManifestFileBytes(')].join('\n'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
function worker(){const values={...codec,prepareCompressedContent,persistCompressedFallbackMarkdown,isCompressedContent,validateCompressedContent,createMetadataOverlay,isMetadataOverlay,readMetadataOverlay,validateMetadataOverlay,readPlayttSnapshotSources,createCanonicalRestorePack,decodeCanonicalRestorePack,validateCanonicalRestorePackMetadata,siteStorageKeys,sha256Hex:async(b:Uint8Array)=>sha(b),sumManifestFileBytes:(f:any[])=>f.reduce((n,x)=>n+x.size,0),logPlayttSnapshotPhase:()=>0,validateMarkdownManifestFiles:()=>{},validateUploadManifestFiles:()=>{},validateWpContentManifestFiles:()=>{},validateWpContentDeletedPaths:()=>{},WEBSITE_IMPORTER_OWNED_WP_CONTENT_PATHS:new Set(),isCanonicalRestorePointer:()=>true,samePointer:(a:any,b:any)=>['revision','manifestKey','persistedAt'].every(k=>a[k]===b[k])};return new Function(...Object.keys(values),code+'\nreturn {persistMarkdownManifest,readMarkdownManifest,readCanonicalRevision};')(...Object.values(values));}
test('actual worker writes envelope after delta, remembers logical metadata, and both cold readers restore',async()=>{
 const f=await fixture();f.contents.markdown[0].bytes=enc('another save');const next=manifest(f.contents);let remembered:any;
 const pointer=await worker().persistMarkdownManifest(f.bucket,next.files,DEFAULT_SITE_CONTEXT,next.uploads,next.wpContent,[],f.m,f.read,(v:any)=>{remembered=v;},'content-gzip-v1',true);
 assert.equal(codec.isManifestEnvelope(parse(f.data.get(pointer.manifestKey)!)),true);assert.equal(codec.isManifestEnvelope(remembered),false);assert.equal(remembered.revision,pointer.revision);
 assert.deepEqual(f.writes,[(remembered.restorePack as any).delta.objectKey,pointer.manifestKey]);
 assert.deepEqual(await worker().readMarkdownManifest(f.bucket,pointer,DEFAULT_SITE_CONTEXT),remembered);
 const cold=await worker().readCanonicalRevision(f.bucket,pointer,DEFAULT_SITE_CONTEXT);assert.deepEqual(sorted(cold),sorted(f.contents));
});
test('actual worker manifest-encoding failure and PUT failure never remember or return a new pointer',async()=>{
 for(const fault of ['encode','put']){const f=await fixture();let remembered=false,promoted=false;
 const api=worker();if(fault==='put'){const put=f.bucket.put;f.bucket.put=async(k,b)=>{if(k.includes('/revisions/'))throw Error('injected put failure');return put(k,b);};}
 const next=manifest(f.contents);if(fault==='encode')next.files[0].path='../unsafe';
 await assert.rejects(api.persistMarkdownManifest(f.bucket,next.files,DEFAULT_SITE_CONTEXT,next.uploads,next.wpContent,[],f.m,f.read,()=>{remembered=true;},'content-gzip-v1',true).then(()=>{promoted=true;}));assert.equal(remembered,false);assert.equal(promoted,false);
 }
});
test('writer flag stays default-off; wrapped previous data can save plain content and then full fallback',async()=>{
 const f=await fixture();f.contents.markdown[0].bytes=enc('plain compressed save');let next=manifest(f.contents);
 let pointer=await worker().persistMarkdownManifest(f.bucket,next.files,DEFAULT_SITE_CONTEXT,next.uploads,next.wpContent,[],f.m,f.read,undefined,'content-gzip-v1');
 let m=parse(f.data.get(pointer.manifestKey)!);assert.equal(codec.isManifestEnvelope(m),false);assert.ok(isCompressedContent(m.restorePack));
 f.contents.markdown[0].bytes=enc('full save');next=manifest(f.contents);pointer=await worker().persistMarkdownManifest(f.bucket,next.files,DEFAULT_SITE_CONTEXT,next.uploads,next.wpContent,[],m,f.read,undefined,false,true);
 m=parse(f.data.get(pointer.manifestKey)!);assert.equal(codec.isManifestEnvelope(m),false);assert.equal(isMetadataOverlay(m.restorePack),false);assert.deepEqual(sorted(await worker().readCanonicalRevision(f.bucket,pointer,DEFAULT_SITE_CONTEXT)),sorted(f.contents));
 for(const name of(await readdir('.')).filter(p=>p.startsWith('wrangler')&&p.endsWith('.jsonc')))assert.equal((await readFile(name,'utf8')).includes('PLAYTT_MANIFEST_ENCODING'),false,name);
});
