import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readFile,access} from 'node:fs/promises';
import {resolve} from 'node:path';
import {randomUUID,createHash} from 'node:crypto';
import {createCanonicalRestorePack,type RestorePackContents} from '../src/canonical-restore-pack.js';
import {createCompressedContent} from '../src/playtt-compressed-content.js';
import {serializeManifestEnvelope} from '../src/playtt-manifest-envelope.js';
import {readContentOverlay} from '../src/playtt-content-overlay.js';
import {exportSnapshotBundle,openSnapshotBundle,importSnapshotBundle} from '../scripts/playtt-snapshot-bundle.mjs';
import {convertToLegacyContentBundle} from '../scripts/playtt-legacy-content-bundle.mjs';
const ROOT='sites/default',enc=(v:unknown)=>new TextEncoder().encode(typeof v==='string'?v:JSON.stringify(v)),sha=(b:Uint8Array)=>createHash('sha256').update(b).digest('hex');
const file=(path:string,text:string)=>({path,bytes:enc(text)});
const order=(c:any)=>Object.fromEntries(['markdown','uploads','wpContent'].map(g=>[g,[...c[g]].sort((a:any,b:any)=>a.path.localeCompare(b.path))]));
function manifest(c:RestorePackContents){const revision=randomUUID();return{revision,manifestKey:`${ROOT}/markdown/revisions/${revision}.json`,persistedAt:'2026-11-21T00:00:00Z',...Object.fromEntries([['markdown','files','markdown'],['uploads','uploads','uploads'],['wpContent','wpContent','wp-content']].map(([g,k,p])=>[k,c[g as keyof Pick<RestorePackContents,'markdown'|'uploads'|'wpContent'>].map(f=>({path:f.path,size:f.bytes.length,sha256:sha(f.bytes),objectKey:`${ROOT}/${p}/objects/${sha(f.bytes)}`}))])),wpContentDeleted:c.wpContentDeleted,restorePack:undefined as any};}
async function fixture(large=false){
 const c:RestorePackContents={markdown:[file('page/a.md','繁體中文🙂\n\t'),file('_tables/posts.json','[{"ID":"207","content":"original"}]'),file('_tables/usermeta.json','[{"session":"unchanged"}]')],uploads:[file('one.bin','binary')],wpContent:[file('themes/a/style.css','style')],wpContentDeleted:[]};
 const base:any=manifest(c),pack=await createCanonicalRestorePack(ROOT,c);base.restorePack=pack.metadata;const data=new Map([[base.manifestKey,enc(base)],[pack.metadata.objectKey,pack.bytes]]);
 const bucket={async get(key:string){const b=data.get(key);return b?{size:b.length,arrayBuffer:async()=>Uint8Array.from(b).buffer}:null;}};
 const next=structuredClone(c);next.markdown[0].bytes=large?new Uint8Array(1024*1024):enc('<!-- wp:paragraph -->\n<p>原封不動 繁中🙂\t\u0000</p>\n<!-- /wp:paragraph -->');
 if(!large){next.markdown.push(file('page/empty.md',''));next.uploads=[file('two.bin','new binary')];next.wpContent=[];next.wpContentDeleted=['themes/a/style.css'];}
 const m:any=manifest(next),delta=await createCompressedContent(bucket,ROOT,m,base,(g,p)=>next[g].find(f=>f.path===p)!.bytes);assert.ok(delta);m.restorePack=delta.descriptor;data.set(delta.descriptor.delta.objectKey,delta.bytes);const raw=enc(await serializeManifestEnvelope(m,ROOT));data.set(m.manifestKey,raw);
 const anchor={revision:m.revision,manifestKey:m.manifestKey,persistedAt:m.persistedAt,manifestSha256:sha(raw),packKey:pack.metadata.objectKey,packSha256:pack.metadata.sha256,packBytes:pack.bytes.length};
 const dir=await mkdtemp(resolve('artifacts/legacy-unit-'));await exportSnapshotBundle(bucket,anchor,dir+'/source');return{dir,anchor,c:next,base,data};
}
test('compressed source converts to old plain content format, with exact bytes, sessions, deletes and zero-byte additions',async()=>{
 const f=await fixture(),before=await readFile(f.dir+'/source/bundle.json'),out=await convertToLegacyContentBundle(f.dir+'/source',f.anchor,f.dir+'/legacy');
 assert.equal(out.graph.format,'content-overlay');assert.equal(out.graph.manifestEncoding,'plain-json');assert.notEqual(out.graph.anchor.revision,f.anchor.revision);assert.equal(out.graph.anchor.packKey,f.anchor.packKey);assert.deepEqual(order(out.graph.contents),order(f.c));assert.deepEqual(out.graph.contents.wpContentDeleted,f.c.wpContentDeleted);
 assert.ok(!out.graph.objects.some((o:any)=>o.key.includes('/delta-packs/')||o.key===f.anchor.manifestKey));assert.deepEqual((await readContentOverlay(out.bucket,ROOT,out.graph.manifest)).contents,out.graph.contents);
 assert.deepEqual(await readFile(f.dir+'/source/bundle.json'),before);const independent=await importSnapshotBundle(f.dir+'/legacy',out.graph.anchor,f.dir+'/independent');assert.deepEqual(order(independent.graph.contents),order(f.c));assert.equal(out.provenance.cost.puts,out.provenance.cost.additions.length+1);
 assert.equal(out.provenance.cost.totalBytes,out.provenance.cost.additions.reduce((n:number,o:any)=>n+o.bytes,0)+out.provenance.cost.pointerBytes);
});
test('wrong external trust anchor rejects before creating output',async()=>{const f=await fixture();await assert.rejects(convertToLegacyContentBundle(f.dir+'/source',{...f.anchor,manifestSha256:'0'.repeat(64)},f.dir+'/bad'));await assert.rejects(access(f.dir+'/bad'));});
test('damaged detached replacement rejects despite an intact compressed delta',async()=>{const f=await fixture();const source=await openSnapshotBundle(f.dir+'/source',f.anchor),changed=source.graph.manifest.files.find((x:any)=>x.path==='page/a.md');await writeFile(f.dir+'/source/objects/'+changed.sha256,'damaged');await assert.rejects(convertToLegacyContentBundle(f.dir+'/source',f.anchor,f.dir+'/bad'));await assert.rejects(access(f.dir+'/bad'));});
test('existing output cannot be overwritten and damage cannot fall back to the compressed source',async()=>{const f=await fixture(),out=await convertToLegacyContentBundle(f.dir+'/source',f.anchor,f.dir+'/legacy'),before=await readFile(f.dir+'/legacy/bundle.json');await assert.rejects(convertToLegacyContentBundle(f.dir+'/source',f.anchor,f.dir+'/legacy'),/already exists/);assert.deepEqual(await readFile(f.dir+'/legacy/bundle.json'),before);const changed=out.graph.manifest.files.find((x:any)=>x.path==='page/a.md');await writeFile(f.dir+'/legacy/objects/'+changed.sha256,'bad');await assert.rejects(openSnapshotBundle(f.dir+'/legacy',out.graph.anchor));assert.equal((await openSnapshotBundle(f.dir+'/source',f.anchor)).graph.format,'compressed-content');});
test('one MiB replacement remains within the unchanged legacy reader bound',async()=>{const f=await fixture(true),out=await convertToLegacyContentBundle(f.dir+'/source',f.anchor,f.dir+'/legacy');assert.deepEqual(order((await readContentOverlay(out.bucket,ROOT,out.graph.manifest)).contents),order(f.c));assert.equal(out.graph.manifest.files.find((x:any)=>x.path==='page/a.md').size,1024*1024);});
