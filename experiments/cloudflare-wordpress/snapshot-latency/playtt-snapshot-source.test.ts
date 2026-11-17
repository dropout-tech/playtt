import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createHash} from 'node:crypto';
import {createCanonicalRestorePack, decodeCanonicalRestorePack, type RestorePackContents} from '../src/canonical-restore-pack.js';
import {readPlayttSnapshotSources, type PlayttSnapshotManifest, type PlayttSnapshotRuntimeReader} from '../src/playtt-snapshot-source.js';

const root='sites/default',encode=(s:string)=>new TextEncoder().encode(s);
const hash=(bytes:Uint8Array)=>createHash('sha256').update(bytes).digest('hex');
const groups=['markdown','uploads','wpContent'] as const;
const prefix={markdown:'markdown',uploads:'uploads',wpContent:'wp-content'};
const metadata=(group:typeof groups[number],file:{path:string;bytes:Uint8Array})=>({path:file.path,objectKey:`${root}/${prefix[group]}/objects/${hash(file.bytes)}`,size:file.bytes.length,sha256:hash(file.bytes)});
function manifest(contents:RestorePackContents):PlayttSnapshotManifest{return {files:contents.markdown.map(f=>metadata('markdown',f)),uploads:contents.uploads.map(f=>metadata('uploads',f)),wpContent:contents.wpContent.map(f=>metadata('wpContent',f)),wpContentDeleted:[...contents.wpContentDeleted]};}
function bucket(entries:Map<string,Uint8Array>){
 const reads:string[]=[];let active=0,maxActive=0;
 return {reads,get active(){return active},get maxActive(){return maxActive},async get(key:string){reads.push(key);active++;maxActive=Math.max(maxActive,active);await new Promise(r=>setTimeout(r,1));const bytes=entries.get(key);if(!bytes){active--;return null;}return {size:bytes.length,async arrayBuffer(){await new Promise(r=>setTimeout(r,1));active--;return bytes.slice().buffer;}};}};
}
function loose(entries:Map<string,Uint8Array>,contents:RestorePackContents){for(const group of groups)for(const file of contents[group])entries.set(metadata(group,file).objectKey,file.bytes);}
function reader(contents:RestorePackContents){const reads:string[]=[];const read:PlayttSnapshotRuntimeReader=(group,path)=>{reads.push(group+'/'+path);const file=contents[group].find(f=>f.path===path);if(!file)throw Error('Runtime file missing');return file.bytes.slice();};return {reads,read};}
function fixture(){const contents:RestorePackContents={markdown:[{path:'pages/a.md',bytes:encode('page one')},{path:'pages/b.md',bytes:encode('page two')}],uploads:[{path:'2026/11/logo.webp',bytes:encode('image bytes')}],wpContent:[{path:'themes/lets-play/style.css',bytes:encode('theme styles')}],wpContentDeleted:['plugins/old/file.php']};const entries=new Map<string,Uint8Array>();loose(entries,contents);return {contents,previous:manifest(contents),entries};}
const sorted=(contents:RestorePackContents)=>Object.fromEntries([...groups.map(group=>[group,[...contents[group]].sort((a,b)=>a.path.localeCompare(b.path))]),['wpContentDeleted',contents.wpContentDeleted]]);

test('changed, added and deleted content produces exactly the complete archive from a full independent read',async()=>{
 const f=fixture();const next:RestorePackContents={markdown:[{path:'pages/a.md',bytes:encode('changed')},{path:'pages/new.md',bytes:encode('new draft')}],uploads:f.contents.uploads,wpContent:[...f.contents.wpContent,{path:'themes/lets-play/new.json',bytes:encode('{}')}],wpContentDeleted:['plugins/newly-removed/file.php']};loose(f.entries,next);
 const b=bucket(f.entries),runtime=reader(next),result=await readPlayttSnapshotSources(b,root,manifest(next),f.previous,runtime.read);
 assert.equal(result.reusedFiles,2);assert.equal(result.objectReads,3);assert.equal(b.reads.length,3);assert.equal(runtime.reads.length,2);assert.equal(result.runtimeSourceUsed,true);assert.deepEqual(sorted(result.contents),sorted(next));
 const actual=await createCanonicalRestorePack(root,result.contents),expected=await createCanonicalRestorePack(root,next);assert.deepEqual(actual.bytes,expected.bytes);
 assert.deepEqual(sorted(await decodeCanonicalRestorePack(actual.metadata,root,{markdown:manifest(next).files,uploads:manifest(next).uploads!,wpContent:manifest(next).wpContent!,wpContentDeleted:next.wpContentDeleted},actual.bytes)),sorted(next));
});
test('unchanged runtime bytes are fully verified even when loose replicas are unavailable',async()=>{
 const f=fixture(),b=bucket(new Map()),runtime=reader(f.contents),result=await readPlayttSnapshotSources(b,root,manifest(f.contents),f.previous,runtime.read);assert.deepEqual(b.reads,[]);assert.equal(runtime.reads.length,4);assert.equal(result.reusedFiles,4);assert.deepEqual(sorted(result.contents),sorted(f.contents));
});
test('callers without a runtime reader independently read every object with bounded concurrency',async()=>{
 const contents:RestorePackContents={markdown:Array.from({length:17},(_,i)=>({path:`pages/${i}.md`,bytes:encode('unique '+i)})),uploads:[],wpContent:[],wpContentDeleted:[]};const entries=new Map<string,Uint8Array>();loose(entries,contents);const b=bucket(entries),result=await readPlayttSnapshotSources(b,root,manifest(contents),manifest(contents));assert.equal(result.reusedFiles,0);assert.equal(result.runtimeSourceUsed,false);assert.equal(b.reads.length,17);assert.ok(b.maxActive<=6&&b.maxActive>1);assert.equal(b.active,0);assert.deepEqual(sorted(result.contents),sorted(contents));
});
test('same path in another domain does not reuse unrelated runtime bytes',async()=>{
 const f=fixture(),next:RestorePackContents={markdown:[],uploads:[{path:f.contents.markdown[0].path,bytes:f.contents.markdown[0].bytes}],wpContent:[],wpContentDeleted:[]};loose(f.entries,next);const b=bucket(f.entries),runtime=reader(next),result=await readPlayttSnapshotSources(b,root,manifest(next),f.previous,runtime.read);assert.equal(result.reusedFiles,0);assert.deepEqual(runtime.reads,[]);assert.deepEqual(b.reads,[metadata('uploads',next.uploads[0]).objectKey]);
});
for(const problem of ['missing','size','bytes'] as const)test('untrusted runtime '+problem+' failure rejects reuse',async()=>{
 const f=fixture(),runtime=structuredClone(f.contents);if(problem==='missing')runtime.markdown.shift();else runtime.markdown[0].bytes=encode(problem==='size'?'short':'PAGE ONE');
 await assert.rejects(readPlayttSnapshotSources(bucket(f.entries),root,manifest(f.contents),f.previous,reader(runtime).read),/Runtime file missing|Snapshot source failed/);
});
test('a new hash must come from R2, not an uncommitted runtime buffer',async()=>{
 const f=fixture(),next=structuredClone(f.contents);next.markdown[0].bytes=encode('new hash');loose(f.entries,next);const runtime=reader(f.contents),b=bucket(f.entries),result=await readPlayttSnapshotSources(b,root,manifest(next),f.previous,runtime.read);assert.ok(!runtime.reads.includes('markdown/pages/a.md'));assert.deepEqual(b.reads,[metadata('markdown',next.markdown[0]).objectKey]);assert.deepEqual(sorted(result.contents),sorted(next));
});
for(const problem of ['missing','size','bytes'] as const)test('changed R2 object '+problem+' failure rejects the entire snapshot',async()=>{
 const f=fixture(),next=structuredClone(f.contents);next.markdown[0].bytes=encode('replacement');const key=metadata('markdown',next.markdown[0]).objectKey;if(problem==='size')f.entries.set(key,encode('short'));if(problem==='bytes')f.entries.set(key,encode('REPLACEMENT'));
 await assert.rejects(readPlayttSnapshotSources(bucket(f.entries),root,manifest(next),f.previous,reader(next).read),/snapshot source|Snapshot source/);
});
test('invalid metadata cannot read another site, duplicate or traverse paths',async()=>{
 const f=fixture();for(const mutate of [(m:PlayttSnapshotManifest)=>m.files[0].path='../private',(m:PlayttSnapshotManifest)=>m.files[0].objectKey=m.files[0].objectKey.replace('sites/default/','sites/other/'),(m:PlayttSnapshotManifest)=>m.files.push(m.files[0])]){const next=manifest(f.contents);mutate(next);const b=bucket(f.entries),runtime=reader(f.contents);await assert.rejects(readPlayttSnapshotSources(b,root,next,f.previous,runtime.read),/metadata/);assert.deepEqual(b.reads,[]);assert.deepEqual(runtime.reads,[]);}
});
test('a runtime reader needs the previous committed inventory',async()=>{
 const f=fixture(),b=bucket(f.entries),runtime=reader(f.contents);await assert.rejects(readPlayttSnapshotSources(b,root,manifest(f.contents),undefined,runtime.read),/prior committed/);assert.deepEqual(runtime.reads,[]);assert.deepEqual(b.reads,[]);
});
test('an empty new inventory preserves only the requested tombstones',async()=>{
 const f=fixture(),next:RestorePackContents={markdown:[],uploads:[],wpContent:[],wpContentDeleted:['themes/removed/style.css']},b=bucket(f.entries),runtime=reader(f.contents);const result=await readPlayttSnapshotSources(b,root,manifest(next),f.previous,runtime.read);assert.deepEqual(result.contents,next);assert.deepEqual(b.reads,[]);assert.deepEqual(runtime.reads,[]);
});
test('failure settles every in-flight read before returning',async()=>{
 const f=fixture(),next:RestorePackContents={markdown:Array.from({length:9},(_,i)=>({path:`pages/new-${i}.md`,bytes:encode('new '+i)})),uploads:[],wpContent:[],wpContentDeleted:[]};loose(f.entries,next);f.entries.set(metadata('markdown',next.markdown[0]).objectKey,encode('bad 0'));const b=bucket(f.entries);await assert.rejects(readPlayttSnapshotSources(b,root,manifest(next),f.previous,reader(next).read),/integrity/);assert.equal(b.active,0);assert.ok(b.reads.length<9);
});
