import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash,randomUUID} from 'node:crypto';
import {readFile,mkdir,mkdtemp,writeFile,readdir} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import ts from 'typescript';
import {createCanonicalRestorePack,decodeCanonicalRestorePack} from '../src/canonical-restore-pack.js';
import {prepareCompressedContent,persistCompressedFallbackMarkdown} from '../src/playtt-compressed-persistence.js';
import {isCompressedContent,validateCompressedContent,MAX_COMPRESSED_BASE} from '../src/playtt-compressed-content.js';
import {createMetadataOverlay,isMetadataOverlay,readMetadataOverlay,validateMetadataOverlay,type OverlayManifest} from '../src/playtt-maintenance-overlay.js';
import {createContentOverlay} from '../src/playtt-content-overlay.js';
import {readPlayttSnapshotSources} from '../src/playtt-snapshot-source.js';
import {persistPlayttMarkdownObjects} from '../src/playtt-markdown-persistence.js';
import {MutationRetainedBytes} from '../src/mutation-memory.js';
import {PlayttRuntimeManifestCache} from '../src/playtt-runtime-manifest-cache.js';
import {PlayttBackupPins} from '../src/playtt-backup-pins.js';
// @ts-expect-error Local Node helper intentionally has no declarations.
import {exportSnapshotBundle,importSnapshotBundle,materializeFullSnapshotBundle} from '../scripts/playtt-snapshot-bundle.mjs';
// @ts-expect-error Local Node helper intentionally has no declarations.
import {verifiedBackupPin} from '../scripts/playtt-backup-pin-client.mjs';
// @ts-expect-error Local Node helper intentionally has no declarations.
import {createContentSnapshotSource} from '../scripts/playtt-content-snapshot-source.mjs';
const root='sites/default',groups=['markdown','uploads','wpContent'] as const,prefix={markdown:'markdown',uploads:'uploads',wpContent:'wp-content'};
const enc=(v:unknown)=>new TextEncoder().encode(typeof v==='string'?v:JSON.stringify(v));
const sha=(b:Uint8Array)=>createHash('sha256').update(b).digest('hex');
const file=(path:string,raw:string|Uint8Array)=>({path,bytes:typeof raw==='string'?enc(raw):raw});
const sorted=(c:any)=>Object.fromEntries([...groups.map(g=>[g,[...c[g]].sort((a,b)=>a.path.localeCompare(b.path))]),['wpContentDeleted',c.wpContentDeleted]]);
function manifest(c:any):OverlayManifest{const revision=randomUUID(),list=(g:typeof groups[number])=>c[g].map((f:any)=>({path:f.path,size:f.bytes.length,sha256:sha(f.bytes),objectKey:`${root}/${prefix[g]}/objects/${sha(f.bytes)}`}));return {revision,manifestKey:`${root}/markdown/revisions/${revision}.json`,persistedAt:'2026-11-21T00:00:00Z',files:list('markdown'),uploads:list('uploads'),wpContent:list('wpContent'),wpContentDeleted:c.wpContentDeleted};}
async function fixture(){
 const c={markdown:[file('page/draft.md','原文🙂'),file('_tables/posts.json','[]')],uploads:[file('a.bin',new Uint8Array([0,255]))],wpContent:[file('themes/playtt/style.css','body{}')],wpContentDeleted:[]};
 const base=manifest(c),pack=await createCanonicalRestorePack(root,c);base.restorePack=pack.metadata;
 const data=new Map<string,Uint8Array>([[base.manifestKey,enc(base)],[pack.metadata.objectKey,pack.bytes]]),writes:string[]=[];
 for(const g of groups)for(const f of c[g])data.set(`${root}/${prefix[g]}/objects/${sha(f.bytes)}`,f.bytes);
 let fail='';const bucket={async get(key:string){const b=data.get(key);return b?{size:b.length,body:new Blob([Uint8Array.from(b)]).stream(),arrayBuffer:async()=>Uint8Array.from(b).buffer,text:async()=>new TextDecoder().decode(b)}:null;},async put(key:string,body:any){writes.push(key);if(fail&&key.includes(fail))throw Error('injected storage failure');data.set(key,typeof body==='string'?enc(body):Uint8Array.from(body));return {};}};
 const read=(g:typeof groups[number],p:string)=>c[g].find(f=>f.path===p)!.bytes;
 const pin=(m:OverlayManifest)=>({...m,manifestSha256:sha(data.get(m.manifestKey)!),packKey:pack.metadata.objectKey,packSha256:pack.metadata.sha256,packBytes:pack.metadata.size});
 return {c,base,pack,data,bucket,writes,read,pin,setFailure:(value:string)=>{fail=value;}};
}
async function compressed(f:Awaited<ReturnType<typeof fixture>>,previous=f.base){const m=manifest(f.c),encoded=await prepareCompressedContent(f.bucket,root,m,previous,f.read);assert.ok(encoded);m.restorePack=encoded.descriptor;f.data.set(encoded.descriptor.delta.objectKey,encoded.bytes);f.data.set(m.manifestKey,enc(m));return m;}

test('metadata-only hashes exactly, emits no raw PUTs and retains default byte/concurrency guards',async()=>{
 const f=await fixture();f.c.markdown[0].bytes=enc('new');let puts=0;const retained=new MutationRetainedBytes();
 const result=await persistPlayttMarkdownObjects({metadataOnly:true,paths:f.c.markdown.map(x=>x.path),previous:f.base.files,objectPrefix:root+'/markdown/objects',validPath:()=>true,limits:{files:100,fileBytes:1024,totalBytes:4096},readSizes:async()=>f.c.markdown.map(x=>x.bytes.length),readFile:p=>f.read('markdown',p),put:async()=>{puts++;throw Error('must not write');},retained});
 assert.equal(puts,0);assert.equal(result.puts,0);assert.deepEqual(result.files,manifest(f.c).files.sort((a,b)=>a.path.localeCompare(b.path)));assert.equal(retained.current,0);
});
test('full, old content and repeated compressed saves resolve one full base without chains',async()=>{
 const f=await fixture();f.c.markdown[0].bytes=enc('old content');const old=manifest(f.c);for(const x of f.c.markdown)f.data.set(root+'/markdown/objects/'+sha(x.bytes),x.bytes);
 old.restorePack=(await createContentOverlay(f.bucket,root,old,f.base))!;f.data.set(old.manifestKey,enc(old));
 let previous=old;for(let i=0;i<5;i++){f.c.markdown[0].bytes=enc('第'+i+'次');previous=await compressed(f,previous);assert.ok(isCompressedContent(previous.restorePack));assert.equal(previous.restorePack.base.revision,f.base.revision);assert.deepEqual(sorted((await readMetadataOverlay(f.bucket,root,previous)).contents),sorted(f.c));}
 for(const version of ['v1','v2','content-v1'] as const)assert.equal(await createMetadataOverlay(f.bucket,root,manifest(f.c),previous,version),null);
});
test('cached previous mismatch and tampered full base reject before encoding or writing',async()=>{
 const f=await fixture(),m=await compressed(f);f.c.markdown[0].bytes=enc('new');
 await assert.rejects(prepareCompressedContent(f.bucket,root,manifest(f.c),{...m,persistedAt:'2026-01-01T00:00:00Z'},f.read),/Stored previous/);
 f.data.set(f.base.manifestKey,enc({...f.base,persistedAt:'2026-01-02T00:00:00Z'}));await assert.rejects(prepareCompressedContent(f.bucket,root,manifest(f.c),m,f.read),/hash|size/);assert.equal(f.writes.length,0);
});
for(const version of ['v1','v2'] as const)test('valid '+version+' history transitions directly to its full base',async()=>{
 const f=await fixture();f.c.markdown.push(file('_runtime/playtt-postmeta-layout.json',enc({schema:'playtt/postmeta-table/v1'})),file('_runtime/playtt-auto-increment.json',enc({schema:'playtt/auto-increment/v1',sequences:{wp_posts:'193',wp_postmeta:'7',wp_users:'2',wp_usermeta:'40'}})),file('_tables/postmeta.json',enc([{meta_id:'7',post_id:'193',meta_key:'_edit_lock',meta_value:'1795200000:1'}])),file('_tables/users.json',enc([{ID:'1',user_login:'synthetic'},{ID:'2',user_login:'second'}])),file('_tables/usermeta.json',enc([{umeta_id:'40',user_id:'1',meta_key:'session_tokens',meta_value:'a:0:{}'}])));
 const base=manifest(f.c),pack=await createCanonicalRestorePack(root,f.c);base.restorePack=pack.metadata;f.data.set(base.manifestKey,enc(base));f.data.set(pack.metadata.objectKey,pack.bytes);
 for(const row of f.c.markdown)f.data.set(root+'/markdown/objects/'+sha(row.bytes),row.bytes);
 const pm=f.c.markdown.find(x=>x.path==='_tables/postmeta.json')!;pm.bytes=enc([{meta_id:'7',post_id:'193',meta_key:'_edit_lock',meta_value:'1795200100:2'}]);f.data.set(root+'/markdown/objects/'+sha(pm.bytes),pm.bytes);
 const old=manifest(f.c);old.restorePack=(await createMetadataOverlay(f.bucket,root,old,base,version))!;assert.ok(old.restorePack);f.data.set(old.manifestKey,enc(old));f.c.markdown[0].bytes=enc('原生內容');const m=await compressed(f,old);assert.equal((m.restorePack as any).base.revision,base.revision);assert.deepEqual(sorted((await readMetadataOverlay(f.bucket,root,m)).contents),sorted(f.c));
});
test('provider download adapter allows only bounded same-project gzip GETs and rejects excess before returning data',async()=>{
 const key=root+'/delta-packs/'+'a'.repeat(64)+'.gz';let calls=0,canceled=0;
 const source=createContentSnapshotSource({token:'synthetic-only',fetchImpl:async(url:string,options:any)=>{calls++;assert.ok(url.endsWith(encodeURIComponent(key)));assert.equal(options.method,'GET');assert.equal(options.redirect,'error');return new Response(new ReadableStream({start(c){c.enqueue(new Uint8Array(1376257));},cancel(){canceled++;}}));}});
 await assert.rejects(source.bucket.get(key),/byte budget/);assert.equal(canceled,1);
 await assert.rejects(source.bucket.get(key.replace('sites/default/','sites/other/')));assert.equal(calls,1);
});
test('valid oversized final inventory and manifest select full fallback; wrong content is an error',async()=>{
 const f=await fixture();f.c.markdown[0].bytes=new Uint8Array(MAX_COMPRESSED_BASE+1);assert.equal(await prepareCompressedContent(f.bucket,root,manifest(f.c),f.base,f.read),null);
 f.c.markdown[0].bytes=enc('new');const huge=manifest(f.c);(huge as any).padding='a'.repeat(256*1024);assert.equal(await prepareCompressedContent(f.bucket,root,huge,f.base,f.read),null);
 await assert.rejects(prepareCompressedContent(f.bucket,root,manifest(f.c),f.base,()=>enc('bad')),/integrity/);
});
test('fallback restores missing unchanged raw Markdown, deduplicates and refuses corrupted existing objects',async()=>{
 const f=await fixture();f.c.markdown[0].bytes=enc('compressed-only');const m=await compressed(f);assert.equal(f.data.has(m.files[0].objectKey),false);
 const put=async(k:string,b:Uint8Array)=>{await f.bucket.put(k,b);};const r=await persistCompressedFallbackMarkdown(f.bucket,root,m.files,f.read,put);assert.equal(r.puts,1);assert.equal((await persistCompressedFallbackMarkdown(f.bucket,root,m.files,f.read,put)).puts,0);
 f.data.set(m.files[0].objectKey,enc('corrupt'));await assert.rejects(persistCompressedFallbackMarkdown(f.bucket,root,m.files,f.read,put),/size|hash/);
});

// Execute the current worker's real persistence functions without booting its
// unrelated Wasm imports. Actual codecs, inventory hashing, source validation
// and immutable writes run here; host filesystem/trace collaborators are supplied.
const source=await readFile('src/worker.ts','utf8');
const section=(start:string,end:string)=>source.slice(source.indexOf(start),source.indexOf(end,source.indexOf(start)));
const code=ts.transpileModule([section('async function putImmutableBytes(','function wordPressPageCacheKey('),section('async function persistMarkdownManifest(','async function readMarkdownManifest('),section('async function persistRuntime(','function readCanonicalChanges(')].join('\n'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
function worker(f:Awaited<ReturnType<typeof fixture>>){
 const values={prepareCompressedContent,persistCompressedFallbackMarkdown,isCompressedContent,validateCompressedContent,createMetadataOverlay,validateMetadataOverlay,readPlayttSnapshotSources,createCanonicalRestorePack,sha256Hex:async(b:Uint8Array)=>sha(b),
  siteStorageKeys:()=>({root,markdownRevisionPrefix:root+'/markdown/revisions',markdownObjectPrefix:root+'/markdown/objects',uploadObjectPrefix:root+'/uploads/objects',wpContentObjectPrefix:root+'/wp-content/objects'}),
  validateMarkdownManifestFiles:()=>{},validateUploadManifestFiles:()=>{},validateWpContentManifestFiles:()=>{},validateWpContentDeletedPaths:()=>{},WEBSITE_IMPORTER_OWNED_WP_CONTENT_PATHS:new Set(),sumManifestFileBytes:(files:any[])=>files.reduce((n,f)=>n+f.size,0),logPlayttSnapshotPhase:()=>0,
  MutationRetainedBytes,PlayttRuntimeManifestCache,persistPlayttMarkdownObjects,validateMarkdownChanges:()=>{},collectCanonicalRuntimePaths:()=>f.c.markdown.map(x=>x.path),collectUploadFiles:async()=>[],collectWpContentFiles:async()=>({files:[],deleted:[]}),persistRuntimeObjects:async(_b:any,_p:any,_r:any,_f:any,previous:any)=>previous,
  logMutationPhase:()=>{},sumMetadataBytes:()=>0,isCanonicalRelativePath:()=>true,MAX_MARKDOWN_FILES:5000,MAX_MARKDOWN_FILE_BYTES:16*1024*1024,MAX_MARKDOWN_TOTAL_BYTES:64*1024*1024,MARKDOWN_ROOT:'/markdown',UPLOADS_ROOT:'/uploads',markdownSizeCode:()=>'',readMarkdownManifest:async()=>f.base};
 return new Function(...Object.keys(values),code+'\nreturn {persistMarkdownManifest,persistRuntime};')(...Object.values(values));
}
async function save(f:Awaited<ReturnType<typeof fixture>>,previous=f.base,mode:any='content-gzip-v1'){
 let remembered:any;const m=manifest(f.c);const pointer=await worker(f).persistMarkdownManifest(f.bucket,m.files,{},m.uploads,m.wpContent,[],previous,f.read,(v:any)=>{remembered=v;},mode);assert.deepEqual(pointer,Object.fromEntries(['revision','manifestKey','persistedAt'].map(k=>[k,remembered[k]])));return remembered as OverlayManifest;
}
test('actual worker writes gzip then manifest without raw Markdown or full ZIP',async()=>{
 const f=await fixture();f.c.markdown[0].bytes=enc('first save');const m=await save(f);assert.ok(isCompressedContent(m.restorePack));assert.deepEqual(f.writes,[m.restorePack.delta.objectKey,m.manifestKey]);assert.equal(f.data.has(m.files[0].objectKey),false);assert.deepEqual(sorted((await readMetadataOverlay(f.bucket,root,m)).contents),sorted(f.c));
});
for(const failure of ['/delta-packs/','/markdown/revisions/'])test('actual worker '+failure+' failure cannot return a pointer or remember a partial manifest',async()=>{
 const f=await fixture();f.c.markdown[0].bytes=enc('failed save');f.setFailure(failure);let remembered=false,promoted=false;const m=manifest(f.c);
 await assert.rejects(worker(f).persistMarkdownManifest(f.bucket,m.files,{},m.uploads,m.wpContent,[],f.base,f.read,()=>{remembered=true;},'content-gzip-v1').then(()=>{promoted=true;}),/injected/);assert.equal(remembered,false);assert.equal(promoted,false);assert.equal(f.writes.length,failure.includes('delta')?1:2);
 assert.deepEqual(JSON.parse(new TextDecoder().decode(f.data.get(f.base.manifestKey))),f.base);
});
for(const kind of ['disabled','cumulative-limit'] as const)test('actual worker full fallback '+kind+' materializes every required raw object before ZIP and manifest',async()=>{
 const f=await fixture();f.c.markdown[0].bytes=enc('compressed-only');const previous=await compressed(f);if(kind==='cumulative-limit')f.c.markdown[1].bytes=new Uint8Array(1024*1024+1);else f.c.markdown[1].bytes=enc('[1]');const m=await save(f,previous,kind==='disabled'?false:'content-gzip-v1');
 assert.equal(isMetadataOverlay(m.restorePack),false);for(const x of m.files)assert.equal(sha(f.data.get(x.objectKey)!),x.sha256);assert.match(f.writes.at(-2)!,/restore-packs\/.*\.zip$/);assert.equal(f.writes.at(-1),m.manifestKey);
 const p=m.restorePack as any;assert.deepEqual(sorted(await decodeCanonicalRestorePack(p,root,{markdown:m.files,uploads:m.uploads!,wpContent:m.wpContent!,wpContentDeleted:[]},f.data.get(p.objectKey)!)),sorted(f.c));
});
test('actual full persistence pipeline with an unchanged compressed inventory writes no object or new pointer',async()=>{
 const f=await fixture(),previous=await compressed(f),cache=new PlayttRuntimeManifestCache<OverlayManifest>();previous.files.sort((a,b)=>a.path.localeCompare(b.path));f.data.set(previous.manifestKey,enc(previous));cache.remember(root,previous,previous);
 const runtime={pointer:previous,manifestCache:cache,php:{run:async()=>({text:JSON.stringify(f.c.markdown.map(x=>x.bytes.length))}),readFileAsBuffer:(p:string)=>f.read('markdown',p.slice('/markdown/'.length))}};
 const pointer=await worker(f).persistRuntime(f.bucket,runtime,{}, {},Date.now(),new MutationRetainedBytes(),undefined,'content-gzip-v1');assert.equal(pointer,previous);assert.equal(f.writes.length,0);
});
test('compressed independent backup includes gzip and raw assets, verifies pins and materializes for old readers',async()=>{
 const f=await fixture();f.c.markdown[0].bytes=enc('new');f.c.uploads[0].bytes=enc('changed image');f.c.wpContent[0].bytes=enc('changed theme');const m=await compressed(f),pin=f.pin(m);
 const state=new Map(),pins=new PlayttBackupPins({get:async(k:string)=>structuredClone(state.get(k)),put:async(k:string,v:any)=>{state.set(k,structuredClone(v));}} as any,f.bucket as any);
 assert.equal((await pins.register(pin,()=>{})).generation,1);
 await mkdir('artifacts',{recursive:true});const dir=await mkdtemp('artifacts/compressed-integration-');await exportSnapshotBundle(f.bucket,pin,dir+'/export');const copy=await importSnapshotBundle(dir+'/export',pin,dir+'/independent');assert.equal(copy.graph.format,'compressed-content');assert.deepEqual(sorted(copy.graph.contents),sorted(f.c));
 for(const x of [...m.files,...m.uploads!,...m.wpContent!]){const raw=await copy.bucket.get(x.objectKey);assert.ok(raw);assert.equal(sha(new Uint8Array(await raw.arrayBuffer())),x.sha256);}
 await mkdir(dir+'/composite');await writeFile(dir+'/composite/manifest.json',f.data.get(m.manifestKey)!);await writeFile(dir+'/composite/base-manifest.json',f.data.get(f.base.manifestKey)!);await writeFile(dir+'/composite/restore.zip',f.pack.bytes);await writeFile(dir+'/composite/delta.gz',f.data.get((m.restorePack as any).delta.objectKey)!);assert.deepEqual((await verifiedBackupPin(dir+'/composite')).pin,pinFrom(pin));
 const full=await materializeFullSnapshotBundle(dir+'/independent',pin,dir+'/full');assert.equal(full.graph.format,'full-pack');assert.deepEqual(sorted(full.graph.contents),sorted(f.c));
 f.data.clear();assert.deepEqual(sorted((await importSnapshotBundle(dir+'/independent',pin,dir+'/third')).graph.contents),sorted(f.c));
 function pinFrom(v:any){return Object.fromEntries(['revision','manifestKey','persistedAt','manifestSha256','packKey','packSha256','packBytes'].map(k=>[k,v[k]]));}
});
for(const dependency of ['gzip','base','zip'])test('corrupt '+dependency+' cannot register a backup pin',async()=>{
 const f=await fixture(),m=await compressed(f),pin=f.pin(m);const key=dependency==='gzip'?(m.restorePack as any).delta.objectKey:dependency==='base'?f.base.manifestKey:f.pack.metadata.objectKey;f.data.set(key,enc('corrupt'));
 const state=new Map(),pins=new PlayttBackupPins({get:async(k:string)=>state.get(k),put:async(k:string,v:any)=>{state.set(k,v);}} as any,f.bucket as any);await assert.rejects(pins.register(pin,()=>{}));assert.equal((await pins.list()).generation,0);
});
test('all delivered configs leave compression disabled and retention planner rejects the new format',async()=>{
 for(const name of (await readdir('.')).filter(p=>p.startsWith('wrangler')&&p.endsWith('.jsonc')))assert.equal((await readFile(name,'utf8')).includes('content-gzip-v1'),false,name);
 const code=`import importlib.util,datetime
spec=importlib.util.spec_from_file_location('retention','scripts/playtt-plan-snapshot-retention.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
rev='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';key=m.MANIFESTS+rev+'.json'
manifest={'revision':rev,'manifestKey':key,'persistedAt':'2026-01-01T00:00:00Z','files':[],'restorePack':{'schema':'playtt/canonical-compressed-content/v1'}}
inv={'schema':'playtt/private-capacity-inventory/v1','bucket':m.BUCKET,'completeListing':True,'objects':[{'key':key,'size':100}],'records':{key:manifest}}
try:m.plan(inv,[],datetime.datetime(2026,11,21,tzinfo=datetime.timezone.utc))
except ValueError as e:assert str(e)=='Unknown snapshot format'
else:raise AssertionError('Unexpected retention acceptance')`;const result=spawnSync('python',['-c',code],{encoding:'utf8'});assert.equal(result.status,0,result.stderr);
});
