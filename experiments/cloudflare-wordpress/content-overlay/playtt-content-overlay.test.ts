import assert from 'node:assert/strict';
import test from 'node:test';
import { createHash, randomUUID } from 'node:crypto';
import { mkdtemp, mkdir, writeFile, readdir, readFile } from 'node:fs/promises';
import { createCanonicalRestorePack, decodeCanonicalRestorePack, type RestorePackContents } from '../src/canonical-restore-pack.js';
import * as content from '../src/playtt-content-overlay.js';
import * as compatible from '../src/playtt-maintenance-overlay.js';
import * as v1 from '../src/playtt-metadata-overlay.js';
import * as v2 from '../src/playtt-usermeta-overlay.js';
import { PlayttBackupPins } from '../src/playtt-backup-pins.js';
import { exportSnapshotBundle, importSnapshotBundle, materializeFullSnapshotBundle } from '../scripts/playtt-snapshot-bundle.mjs';
import { verifiedBackupPin } from '../scripts/playtt-backup-pin-client.mjs';
import { spawnSync } from 'node:child_process';
const root = 'sites/default', groups = ['markdown', 'uploads', 'wpContent'] as const;
const prefix = { markdown: 'markdown', uploads: 'uploads', wpContent: 'wp-content' };
const enc = (v: unknown) => new TextEncoder().encode(typeof v === 'string' ? v : JSON.stringify(v));
const sha = (v: Uint8Array) => createHash('sha256').update(v).digest('hex');
const file = (path: string, value: unknown) => ({ path, bytes: enc(value) });
const PM = '_tables/postmeta.json', UM = '_tables/usermeta.json';
function contents(): RestorePackContents {
  return { markdown: [file('page/draft.md', '繁中\n\t原文'), file('_runtime/playtt-postmeta-layout.json', {schema:'playtt/postmeta-table/v1'}),
    file('_runtime/playtt-auto-increment.json', {schema:'playtt/auto-increment/v1',sequences:{wp_posts:'193',wp_postmeta:'7',wp_users:'2',wp_usermeta:'40'}}),
    file(PM,[{meta_id:'7',post_id:'193',meta_key:'_edit_lock',meta_value:'1795200000:1'}]),
    file('_tables/users.json',[{ID:'1',user_login:'synthetic',user_pass:'synthetic-only'},{ID:'2',user_login:'second'}]),
    file(UM,[{umeta_id:'40',user_id:'1',meta_key:'session_tokens',meta_value:'a:0:{}'}])],
    uploads:[file('image.webp','retained-image')],wpContent:[file('themes/lets-play/style.css','retained-theme')],wpContentDeleted:[] };
}
function manifest(c: RestorePackContents): content.OverlayManifest {
  const revision=randomUUID(), list=(g:typeof groups[number])=>c[g].map(f=>({path:f.path,size:f.bytes.length,sha256:sha(f.bytes),objectKey:`${root}/${prefix[g]}/objects/${sha(f.bytes)}`}));
  return {revision,manifestKey:`${root}/markdown/revisions/${revision}.json`,persistedAt:new Date().toISOString(),files:list('markdown'),uploads:list('uploads'),wpContent:list('wpContent'),wpContentDeleted:c.wpContentDeleted};
}
const sorted=(c:RestorePackContents)=>Object.fromEntries([...groups.map(g=>[g,[...c[g]].sort((a,b)=>a.path.localeCompare(b.path))]),['wpContentDeleted',c.wpContentDeleted]]);
async function fixture(){
  const c=contents(),base=manifest(c),pack=await createCanonicalRestorePack(root,c),data=new Map<string,Uint8Array>();base.restorePack=pack.metadata;
  const bucket={async get(key:string){const b=data.get(key);return b?{size:b.length,body:new Blob([Uint8Array.from(b)]).stream(),arrayBuffer:async()=>Uint8Array.from(b).buffer}:null;}};
  const add=(m:content.OverlayManifest,c:RestorePackContents)=>{data.set(m.manifestKey,enc(m));for(const g of groups)for(const f of c[g])data.set(`${root}/${prefix[g]}/objects/${sha(f.bytes)}`,f.bytes);};
  add(base,c);data.set(pack.metadata.objectKey,pack.bytes);return {c,base,pack,data,bucket,add};
}
async function overlay(f:Awaited<ReturnType<typeof fixture>>,c:RestorePackContents,previous=f.base){const m=manifest(c);f.add(m,c);m.restorePack=(await compatible.createMetadataOverlay(f.bucket,root,m,previous,'content-v1'))!;assert.ok(content.isContentOverlay(m.restorePack));f.add(m,c);return m;}
const anchor=(f:Awaited<ReturnType<typeof fixture>>,m:content.OverlayManifest)=>({...m,manifestSha256:sha(f.data.get(m.manifestKey)!),packKey:f.pack.metadata.objectKey,packSha256:f.pack.metadata.sha256,packBytes:f.pack.bytes.length});
const edit=(c:RestorePackContents,path:string,fn:(v:any)=>void)=>{const f=c.markdown.find(x=>x.path===path)!;const v=JSON.parse(new TextDecoder().decode(f.bytes));fn(v);f.bytes=enc(v);};

test('ordinary edits preserve exact bytes, additions, deletions, zero objects, assets and tombstones',async()=>{
 const f=await fixture(),c=structuredClone(f.c);c.markdown[0].bytes=enc('<!-- wp:paragraph -->\n<p>全新內容🙂\t</p>\n<!-- /wp:paragraph -->');
 c.markdown.push(file('revision/194.md','original revision, exact ID 194'),file('page/empty.md',''));
 c.uploads=[file('new.webp',new Uint8Array([0,1,255]))];c.wpContent=[];c.wpContentDeleted=['themes/lets-play/style.css'];
 const m=await overlay(f,c);assert.deepEqual(sorted((await compatible.readMetadataOverlay(f.bucket,root,m)).contents),sorted(c));
 assert.equal((m.restorePack as content.PlayttContentOverlay).base.revision,f.base.revision);
 assert.equal(v1.isMetadataOverlay(m.restorePack),false);assert.equal(v2.isUsermetaOverlay(m.restorePack),false);
 await assert.rejects(v1.readMetadataOverlay(f.bucket,root,m as v1.OverlayManifest));await assert.rejects(v2.readUsermetaOverlay(f.bucket,root,m as v2.OverlayManifest));
});
test('twenty saves flatten to one full base, including reverting exactly to its inventory',async()=>{
 const f=await fixture();let previous=f.base;
 for(let i=0;i<20;i++){const c=structuredClone(f.c);c.markdown[0].bytes=enc('第'+i+'次');previous=await overlay(f,c,previous);assert.equal((previous.restorePack as content.PlayttContentOverlay).base.revision,f.base.revision);assert.deepEqual(sorted((await compatible.readMetadataOverlay(f.bucket,root,previous)).contents),sorted(c));}
 const reverted=await overlay(f,f.c,previous);assert.deepEqual(sorted((await compatible.readMetadataOverlay(f.bucket,root,reverted)).contents),sorted(f.c));
});
test('strict v1/v2 histories transition to content without weakening their classifiers',async()=>{
 for(const version of ['v1','v2'] as const){const f=await fixture(),c=structuredClone(f.c);edit(c,PM,r=>r[0].meta_value='1795200100:2');if(version==='v2')edit(c,UM,r=>r[0].meta_value='a:1:{s:4:"test";i:1;}');
 const old=manifest(c);f.add(old,c);old.restorePack=(await compatible.createMetadataOverlay(f.bucket,root,old,f.base,version))!;assert.ok(old.restorePack);f.add(old,c);
 c.markdown[0].bytes=enc('真實內容修改');const m=await overlay(f,c,old);assert.equal((m.restorePack as content.PlayttContentOverlay).base.revision,f.base.revision);assert.deepEqual(sorted((await compatible.readMetadataOverlay(f.bucket,root,m)).contents),sorted(c));
 for(const writer of ['v1','v2'] as const)assert.equal(await compatible.createMetadataOverlay(f.bucket,root,manifest(c),m,writer),null);
 }
});
test('byte and cumulative file limits fall back, while a large unchanged asset is reused',async()=>{
 const f=await fixture();const c=structuredClone(f.c);c.markdown[0].bytes=new Uint8Array(content.MAX_CONTENT_DELTA_BYTES+1);let m=manifest(c);f.add(m,c);assert.equal(await content.createContentOverlay(f.bucket,root,m,f.base),null);
 const small=structuredClone(f.c);for(let i=0;i<40;i++)small.markdown.push(file('page/'+i+'.md','x'));const previous=await overlay(f,small);
 for(let i=40;i<65;i++)small.markdown.push(file('page/'+i+'.md','x'));m=manifest(small);f.add(m,small);assert.equal(await content.createContentOverlay(f.bucket,root,m,previous),null);
 m.restorePack=previous.restorePack;await assert.rejects(content.readContentOverlay(f.bucket,root,m),/cumulative budget/);
 const large=structuredClone(f.c);large.uploads[0].bytes=new Uint8Array(2*1024*1024);const base=manifest(large),pack=await createCanonicalRestorePack(root,large);base.restorePack=pack.metadata;f.add(base,large);f.data.set(pack.metadata.objectKey,pack.bytes);large.markdown[0].bytes=enc('小改');const reuse=await overlay(f,large,base);assert.deepEqual(sorted((await content.readContentOverlay(f.bucket,root,reuse)).contents),sorted(large));
});
test('missing or corrupt base, archive, replacement and zero objects fail closed',async()=>{
 for(const target of ['base','pack','replacement','zero'])for(const corrupt of [false,true]){const f=await fixture(),c=structuredClone(f.c);c.markdown[0].bytes=enc('新內容');c.markdown.push(file('empty',''));const m=await overlay(f,c);
 const key=target==='base'?f.base.manifestKey:target==='pack'?f.pack.metadata.objectKey:m.files.find(x=>x.path===(target==='zero'?'empty':'page/draft.md'))!.objectKey;
 if(corrupt){const b=f.data.get(key)!;f.data.set(key,b.length?Uint8Array.from(b,x=>x^1):enc('not empty'));}else f.data.delete(key);
 await assert.rejects(content.readContentOverlay(f.bucket,root,m));
 }
});
test('wrong previous manifest, chained and self references, traversal and duplicate inventories are rejected',async()=>{
 const f=await fixture(),c=structuredClone(f.c);c.markdown[0].bytes=enc('新文');const m=await overlay(f,c);
 await assert.rejects(content.createContentOverlay(f.bucket,root,manifest(c),{...m,persistedAt:'2026-01-01T00:00:00Z'}),/Stored previous/);
 const chained=manifest(c);chained.restorePack={schema:content.CONTENT_OVERLAY_SCHEMA,base:{revision:m.revision,manifestKey:m.manifestKey,persistedAt:m.persistedAt,sha256:sha(f.data.get(m.manifestKey)!),size:f.data.get(m.manifestKey)!.length}};await assert.rejects(content.readContentOverlay(f.bucket,root,chained),/chains/);
 for(const mutate of [(x:content.OverlayManifest)=>{(x.restorePack as content.PlayttContentOverlay).base.revision=x.revision;},(x:content.OverlayManifest)=>{x.files[0].path='../escape';},(x:content.OverlayManifest)=>x.files.push({...x.files[0]}),(x:content.OverlayManifest)=>{x.wpContentDeleted=['themes/x','themes/x'];},(x:content.OverlayManifest)=>{x.wpContentDeleted=['themes/lets-play/style.css'];}]){const bad=structuredClone(m);mutate(bad);await assert.rejects(content.readContentOverlay(f.bucket,root,bad));}
});
test('bounded streaming rejects dishonest lengths before returning partial bytes',async()=>{
 const bucket={async get(){return {size:1,body:new Blob([enc('oversized')]).stream(),arrayBuffer:async()=>new ArrayBuffer(0)};}};
 await assert.rejects(content.readContentBytes(bucket,'x',2),/exceeded declared/);
 const short={async get(){return {size:2,arrayBuffer:async()=>new ArrayBuffer(1)};}};await assert.rejects(content.readContentBytes(short,'x',2),/length mismatch/);
});
test('complete independent bundle, server pin, composite client and old-reader materialization verify all groups',async()=>{
 const f=await fixture(),c=structuredClone(f.c);c.markdown[0].bytes=enc('新正文');c.uploads.push(file('empty.webp',''));c.wpContent.push(file('themes/new.css','new'));const m=await overlay(f,c),pin=anchor(f,m);
 const values=new Map<string,any>(),state={get:async(k:string)=>structuredClone(values.get(k)),put:async(k:string,v:any)=>{values.set(k,structuredClone(v));}} as unknown as DurableObjectStorage;
 const pins=new PlayttBackupPins(state,f.bucket as unknown as R2Bucket);assert.equal((await pins.register(pin,()=>{})).generation,1);
 await mkdir('artifacts',{recursive:true});const dir=await mkdtemp('artifacts/content-overlay-unit-');await exportSnapshotBundle(f.bucket,pin,dir+'/export');const copy=await importSnapshotBundle(dir+'/export',pin,dir+'/independent');assert.deepEqual(sorted(copy.graph.contents),sorted(c));assert.equal(copy.graph.format,'content-overlay');
 const full=await materializeFullSnapshotBundle(dir+'/independent',pin,dir+'/materialized');assert.equal(full.graph.format,'full-pack');assert.deepEqual(sorted(full.graph.contents),sorted(c));
 const p=full.graph.manifest.restorePack;assert.deepEqual(sorted(await decodeCanonicalRestorePack(p,root,{markdown:full.graph.manifest.files,uploads:full.graph.manifest.uploads,wpContent:full.graph.manifest.wpContent,wpContentDeleted:[]},full.graph.objects.find((x:any)=>x.key===p.objectKey).bytes)),sorted(c));
 await mkdir(dir+'/composite');await mkdir(dir+'/composite/objects');await writeFile(dir+'/composite/manifest.json',f.data.get(m.manifestKey)!);await writeFile(dir+'/composite/base-manifest.json',f.data.get(f.base.manifestKey)!);await writeFile(dir+'/composite/restore.zip',f.pack.bytes);
 for(const g of groups)for(const file of c[g])await writeFile(dir+'/composite/objects/'+sha(file.bytes),file.bytes);
 assert.equal((await verifiedBackupPin(dir+'/composite')).dependenciesVerified,true);
 const next=await overlay(f,(()=>{const n=structuredClone(c);n.wpContent[1].bytes=enc('second');return n;})(),m);f.data.delete(next.wpContent![1].objectKey);await assert.rejects(pins.register(anchor(f,next),()=>{}));assert.equal((await pins.list()).generation,1);
 f.data.clear();assert.deepEqual(sorted((await importSnapshotBundle(dir+'/independent',pin,dir+'/third')).graph.contents),sorted(c));
});
test('checked-in configs never opt in and v1/v2 sources remain exactly the stage-9 readers',async()=>{
 const names=(await readdir('.')).filter(p=>p.startsWith('wrangler')&&p.endsWith('.jsonc'));assert.ok(names.length>=20);
 for(const name of names)assert.equal((await readFile(name,'utf8')).includes('PLAYTT_CONTENT_OVERLAY'),false,name);
 for(const [name,expected] of [["playtt-metadata-overlay.ts", "36a6959e3c06fb12aba40662dec5876ce5b174b5a0f65e436d6b77bb99f77d43"], ["playtt-usermeta-overlay.ts", "caafbbd624cbda0bbdef5fd593dbfe83932085001749a3b4c86ea66bc9d1b1a0"]])assert.equal(sha(enc((await readFile('src/'+name,'utf8')).replace(/\r\n/g,'\n'))),expected);
});
test('legacy retention proposal refuses content overlays before producing deletion candidates',()=>{
 const code=`import importlib.util,datetime
spec=importlib.util.spec_from_file_location('retention','scripts/playtt-plan-snapshot-retention.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
rev='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';key=m.MANIFESTS+rev+'.json'
manifest={'revision':rev,'manifestKey':key,'persistedAt':'2026-01-01T00:00:00Z','files':[],'restorePack':{'schema':'playtt/canonical-content-overlay/v1'}}
inv={'schema':'playtt/private-capacity-inventory/v1','bucket':m.BUCKET,'completeListing':True,'objects':[{'key':key,'size':100}],'records':{key:manifest}}
try:m.plan(inv,[],datetime.datetime(2026,11,21,tzinfo=datetime.timezone.utc))
except ValueError as e:assert str(e)=='Unknown snapshot format'
else:raise AssertionError('Legacy planner accepted an unsupported format')`;
 const result=spawnSync('python',['-c',code],{encoding:'utf8'});assert.equal(result.status,0,result.stderr);
});
