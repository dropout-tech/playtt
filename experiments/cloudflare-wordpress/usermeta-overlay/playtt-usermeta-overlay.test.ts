import assert from 'node:assert/strict';
import test from 'node:test';
import { createHash, randomUUID } from 'node:crypto';
import { mkdtemp, mkdir } from 'node:fs/promises';
import { createCanonicalRestorePack, decodeCanonicalRestorePack, type RestorePackContents } from '../src/canonical-restore-pack.js';
import * as v1 from '../src/playtt-metadata-overlay.js';
import * as v2 from '../src/playtt-usermeta-overlay.js';
import * as compatible from '../src/playtt-maintenance-overlay.js';
import { PlayttBackupPins } from '../src/playtt-backup-pins.js';
import { readPlayttSnapshotSources } from '../src/playtt-snapshot-source.js';
import { exportSnapshotBundle, importSnapshotBundle } from '../scripts/playtt-snapshot-bundle.mjs';

const root='sites/default',PM='_tables/postmeta.json',UM='_tables/usermeta.json',US='_tables/users.json',SEQ='_runtime/playtt-auto-increment.json';
const enc=(v:unknown)=>new TextEncoder().encode(typeof v==='string'?v:JSON.stringify(v));
const sha=(b:Uint8Array)=>createHash('sha256').update(b).digest('hex');
const groups=['markdown','uploads','wpContent'] as const, prefixes={markdown:'markdown',uploads:'uploads',wpContent:'wp-content'};
const file=(path:string,v:unknown)=>({path,bytes:enc(v)});
const user=(id:string,owner:string,key:string,value:string)=>({umeta_id:id,user_id:owner,meta_key:key,meta_value:value});
function contents():RestorePackContents{
 return {markdown:[file('_runtime/playtt-postmeta-layout.json',{schema:'playtt/postmeta-table/v1'}),
 file(SEQ,{schema:'playtt/auto-increment/v1',sequences:{wp_options:'583',wp_posts:'193',wp_postmeta:'7',wp_users:'2',wp_usermeta:'40'}}),
 file(PM,[{meta_id:'7',post_id:'193',meta_key:'_edit_lock',meta_value:'1795200000:1'}]),
 file(US,[{ID:'1',user_login:'admin',user_pass:'synthetic-admin-hash'},{ID:'2',user_login:'editor',user_pass:'synthetic-editor-hash'}]),
 file(UM,[user('1','1','wp_capabilities','a:1:{s:13:"administrator";b:1;}'),user('2','1','session_tokens','a:0:{}'),user('3','2','wp_capabilities','a:1:{s:6:"editor";b:1;}'),user('4','2','wp_persisted_preferences','a:0:{}')]),
 file('page/draft.md','繁體中文\n\t原內容')],uploads:[file('image.webp','retained image')],wpContent:[file('themes/lets-play/style.css','retained theme')],wpContentDeleted:[]};
}
function edit(c:RestorePackContents,path:string,fn:(v:any)=>void){const f=c.markdown.find(f=>f.path===path)!;const v=JSON.parse(new TextDecoder().decode(f.bytes));fn(v);f.bytes=enc(v);}
function manifest(c:RestorePackContents):v2.OverlayManifest{
 const revision=randomUUID(),items=(g:typeof groups[number])=>c[g].map(f=>({path:f.path,size:f.bytes.length,sha256:sha(f.bytes),objectKey:`${root}/${prefixes[g]}/objects/${sha(f.bytes)}`}));
 return {revision,manifestKey:`${root}/markdown/revisions/${revision}.json`,persistedAt:new Date().toISOString(),files:items('markdown'),uploads:items('uploads'),wpContent:items('wpContent'),wpContentDeleted:c.wpContentDeleted};
}
const sorted=(c:RestorePackContents)=>Object.fromEntries([...groups.map(g=>[g,[...c[g]].sort((a,b)=>a.path.localeCompare(b.path))]),['wpContentDeleted',c.wpContentDeleted]]);
async function fixture(){
 const data=new Map<string,Uint8Array>(),c=contents(),base=manifest(c),pack=await createCanonicalRestorePack(root,c);base.restorePack=pack.metadata;
 const bucket={async get(key:string){const b=data.get(key);return b?{size:b.length,arrayBuffer:async()=>Uint8Array.from(b).buffer,body:new Blob([Uint8Array.from(b)]).stream()}:null;}};
 function add(m:v2.OverlayManifest,c:RestorePackContents){data.set(m.manifestKey,enc(m));for(const g of groups)for(const f of c[g])data.set(`${root}/${prefixes[g]}/objects/${sha(f.bytes)}`,f.bytes);}
 add(base,c);data.set(pack.metadata.objectKey,pack.bytes);return {data,c,base,pack,bucket,add};
}
async function overlay(f:Awaited<ReturnType<typeof fixture>>,c:RestorePackContents,previous=f.base){const m=manifest(c);f.add(m,c);m.restorePack=(await v2.createUsermetaOverlay(f.bucket,root,m,previous))!;assert.ok(m.restorePack);f.add(m,c);return m;}
const preference=(c:RestorePackContents)=>edit(c,UM,(r:any[])=>r.find(r=>r.umeta_id==='4').meta_value='a:1:{s:6:"locale";s:5:"zh_TW";}');

test('v2 preserves exact session/preferences, locks, account hashes, content and assets',async()=>{
 const f=await fixture(),c=contents();preference(c);edit(c,UM,r=>r.find((r:any)=>r.umeta_id==='2').meta_value='a:1:{s:9:"synthetic";a:1:{s:10:"expiration";i:1795300000;}}');
 edit(c,PM,r=>r[0].meta_value='1795200100:2');const m=await overlay(f,c);
 const restored=await compatible.readMetadataOverlay(f.bucket,root,m);assert.deepEqual(sorted(restored.contents),sorted(c));
 assert.equal(m.restorePack!.schema,v2.USERMETA_OVERLAY_SCHEMA);assert.equal(v1.isMetadataOverlay(m.restorePack),false);
 await assert.rejects(v1.readMetadataOverlay(f.bucket,root,m as v1.OverlayManifest));
 await assert.rejects(decodeCanonicalRestorePack(m.restorePack,root,{markdown:m.files,uploads:m.uploads!,wpContent:m.wpContent!,wpContentDeleted:[]},f.pack.bytes));
 assert.equal(await compatible.createMetadataOverlay(f.bucket,root,manifest(c),m,'v1'),null);
});

test('session deletion and later recreation keep deleted-ID high water and one full base',async()=>{
 const f=await fixture();let previous=f.base;const c=contents();edit(c,UM,r=>r.splice(r.findIndex((x:any)=>x.umeta_id==='2'),1));previous=await overlay(f,c,previous);
 edit(c,UM,r=>r.push(user('41','1','session_tokens','a:0:{}')));edit(c,SEQ,s=>s.sequences.wp_usermeta='41');previous=await overlay(f,c,previous);
 for(let i=0;i<10;i++){edit(c,UM,r=>r.find((x:any)=>x.umeta_id==='4').meta_value=JSON.stringify({synthetic:i,language:'繁中'}));previous=await overlay(f,c,previous);assert.equal((previous.restorePack as v2.PlayttUsermetaOverlay).base.revision,f.base.revision);assert.deepEqual(sorted((await compatible.readMetadataOverlay(f.bucket,root,previous)).contents),sorted(c));}
 const reuse=structuredClone(c);edit(reuse,UM,r=>{r.splice(r.findIndex((x:any)=>x.umeta_id==='41'),1);r.push(user('2','1','session_tokens','reused'));});const n=manifest(reuse);f.add(n,reuse);assert.equal(await v2.createUsermetaOverlay(f.bucket,root,n,previous),null);
});

test('v1 to v2 transition anchors the same full base and generic reader retains v1 support',async()=>{
 const f=await fixture(),c=contents();edit(c,PM,r=>r[0].meta_value='1795200100:2');const legacy=manifest(c) as v1.OverlayManifest;f.add(legacy,c);legacy.restorePack=(await v1.createMetadataOverlay(f.bucket,root,legacy,f.base as v1.OverlayManifest))!;f.add(legacy,c);
 assert.deepEqual(sorted((await compatible.readMetadataOverlay(f.bucket,root,legacy)).contents),sorted(c));preference(c);const m=await overlay(f,c,legacy);
 assert.equal((m.restorePack as v2.PlayttUsermetaOverlay).base.revision,f.base.revision);assert.deepEqual(sorted((await compatible.readMetadataOverlay(f.bucket,root,m)).contents),sorted(c));
 const n=manifest(c);assert.equal(await compatible.createMetadataOverlay(f.bucket,root,n,m,'v1'),null);
});

test('roles, credentials, ownership moves, other keys and duplicate sessions cannot use v2',async()=>{
 const cases:Array<[string,(c:RestorePackContents)=>void]>=[
 ['role',c=>edit(c,UM,r=>r[0].meta_value='a:1:{s:6:"editor";b:1;}')],
 ['credential',c=>edit(c,US,r=>r[0].user_pass='changed')],
 ['owner',c=>edit(c,UM,r=>r[1].user_id='2')],
 ['key',c=>edit(c,UM,r=>r[1].meta_key='wp_persisted_preferences')],
 ['other key',c=>edit(c,UM,r=>r.push(user('41','2','locale','zh_TW')))],
 ['duplicate',c=>edit(c,UM,r=>r.push(user('41','1','session_tokens','a:0:{}')))],
 ['missing account',c=>edit(c,UM,r=>r.push(user('41','3','session_tokens','a:0:{}')))],
 ['account added',c=>edit(c,US,r=>r.push({ID:'3',user_login:'third'}))],
 ['content',c=>{c.markdown.find(f=>f.path==='page/draft.md')!.bytes=enc('changed');}],
 ['media',c=>{c.uploads[0].bytes=enc('changed');}],
 ['oversize',c=>edit(c,UM,r=>r[1].meta_value='x'.repeat(262144))]
 ];
 for(const [name,mutate] of cases){const f=await fixture(),c=contents();preference(c);edit(c,SEQ,s=>s.sequences.wp_usermeta='41');mutate(c);const m=manifest(c);f.add(m,c);assert.equal(await v2.createUsermetaOverlay(f.bucket,root,m,f.base),null,name);
   // A valid-hash malicious descriptor is not allowed to bypass classification.
   const good=contents();preference(good);const goodM=await overlay(f,good);m.restorePack=goodM.restorePack;await assert.rejects(v2.readUsermetaOverlay(f.bucket,root,m),undefined,name);
 }
});

test('signed-64-bit counters, missing columns, duplicate IDs and rollback fail closed',async()=>{
 const f=await fixture(),c=contents();preference(c);edit(c,SEQ,s=>s.sequences.wp_usermeta='9007199254740993');const m=await overlay(f,c);assert.deepEqual(sorted((await v2.readUsermetaOverlay(f.bucket,root,m)).contents),sorted(c));
 for(const mutate of [(c:RestorePackContents)=>edit(c,SEQ,s=>s.sequences.wp_usermeta='39'),(c:RestorePackContents)=>edit(c,SEQ,s=>delete s.sequences.wp_users),(c:RestorePackContents)=>edit(c,SEQ,s=>s.sequences.wp_users='1')]){const c=contents();preference(c);mutate(c);const n=manifest(c);f.add(n,c);assert.equal(await v2.createUsermetaOverlay(f.bucket,root,n,f.base),null);}
 for(const mutate of [(r:any[])=>delete r[1].umeta_id,(r:any[])=>r.push({...r[1]}),(r:any[])=>r[1].user_id=1,(r:any[])=>r[1].extra=true]){const c=contents();edit(c,UM,mutate);const n=manifest(c);f.add(n,c);await assert.rejects(v2.createUsermetaOverlay(f.bucket,root,n,f.base));}
});

test('corrupt, missing and chained dependencies fail before exposing a recovered graph',async()=>{
 for(const target of ['base','pack','usermeta','missing']){const f=await fixture(),c=contents();preference(c);const m=await overlay(f,c),key=target==='base'?f.base.manifestKey:target==='pack'?f.pack.metadata.objectKey:m.files.find(f=>f.path===UM)!.objectKey;
 if(target==='missing')f.data.delete(key);else{const b=f.data.get(key)!.slice();b[0]^=1;f.data.set(key,b);}await assert.rejects(v2.readUsermetaOverlay(f.bucket,root,m));}
 const f=await fixture(),c=contents();preference(c);const m=await overlay(f,c),n=manifest(c);n.restorePack={schema:v2.USERMETA_OVERLAY_SCHEMA,base:{revision:m.revision,manifestKey:m.manifestKey,persistedAt:m.persistedAt,sha256:sha(f.data.get(m.manifestKey)!),size:f.data.get(m.manifestKey)!.length}};await assert.rejects(v2.readUsermetaOverlay(f.bucket,root,n),/chains/);
});

test('new readers pin and independently export/import v2; corrupt replacement cannot create a pin',async()=>{
 const f=await fixture(),c=contents();preference(c);const m=await overlay(f,c),anchor={revision:m.revision,manifestKey:m.manifestKey,persistedAt:m.persistedAt,manifestSha256:sha(f.data.get(m.manifestKey)!),packKey:f.pack.metadata.objectKey,packSha256:f.pack.metadata.sha256,packBytes:f.pack.bytes.length};
 const values=new Map<string,any>(),state={get:async(k:string)=>structuredClone(values.get(k)),put:async(k:string,v:any)=>{values.set(k,structuredClone(v));}} as unknown as DurableObjectStorage;
 const pins=new PlayttBackupPins(state,f.bucket as unknown as R2Bucket);assert.equal((await pins.register(anchor,()=>{})).generation,1);assert.equal((await pins.register(anchor,()=>{})).created,false);
 await mkdir('artifacts',{recursive:true});const dir=await mkdtemp('artifacts/usermeta-unit-');await exportSnapshotBundle(f.bucket,anchor,dir+'/export');const copy=await importSnapshotBundle(dir+'/export',anchor,dir+'/independent');assert.deepEqual(sorted(copy.graph.contents),sorted(c));
 const n=await overlay(f,(()=>{const v=structuredClone(c);edit(v,UM,r=>r[1].meta_value='a:1:{}');return v;})(),m);const bad={...anchor,revision:n.revision,manifestKey:n.manifestKey,persistedAt:n.persistedAt,manifestSha256:sha(f.data.get(n.manifestKey)!)};f.data.delete(n.files.find(f=>f.path===UM)!.objectKey);await assert.rejects(pins.register(bad,()=>{}));assert.equal((await pins.list()).generation,1);
});

test('a content save after v2 creates a full pack retaining the latest usermeta and lock bytes',async()=>{
 const f=await fixture(),c=contents();preference(c);edit(c,PM,r=>r[0].meta_value='1795200100:2');const previous=await overlay(f,c);
 c.markdown.find(f=>f.path==='page/draft.md')!.bytes=enc('編輯者 B 的新內容\n\t');const next=manifest(c);f.add(next,c);
 assert.equal(await compatible.createMetadataOverlay(f.bucket,root,next,previous,'v2'),null);
 const source=await readPlayttSnapshotSources(f.bucket,root,next,previous,(group,path)=>c[group].find(f=>f.path===path)!.bytes);
 const full=await createCanonicalRestorePack(root,source.contents);
 assert.deepEqual(sorted(await decodeCanonicalRestorePack(full.metadata,root,{markdown:next.files,uploads:next.uploads!,wpContent:next.wpContent!,wpContentDeleted:next.wpContentDeleted!},full.bytes)),sorted(c));
});
