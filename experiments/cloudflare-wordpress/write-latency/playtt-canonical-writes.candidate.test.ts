import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {MutationRetainedBytes} from '../src/mutation-memory.ts';
import {persistPlayttCanonicalFiles, PLAYTT_CANONICAL_WRITE_BUFFER_BYTES as cap} from '../src/playtt-canonical-writes.ts';
import {readPlayttSnapshotSources} from '../src/playtt-snapshot-source.ts';
import {createCanonicalRestorePack, decodeCanonicalRestorePack} from '../src/canonical-restore-pack.ts';

const hash=(bytes:Uint8Array)=>createHash('sha256').update(bytes).digest('hex');
const encode=(s:string)=>new TextEncoder().encode(s);
const prefix='sites/default/markdown/objects';
function fixture(values:Record<string,Uint8Array>) {
  const retained=new MutationRetainedBytes();retained.retain(17);
  const puts:Array<{key:string;bytes:Uint8Array}>=[];let active=0,maxActive=0,activeBytes=0,maxBytes=0;
  const options={paths:Object.keys(values),current:[] as Array<{path:string;objectKey:string;sha256:string;size:number}>,objectPrefix:prefix,readFile:(path:string)=>values[path].slice(),retained,maxFileBytes:16*1024*1024,maxTotalBytes:64*1024*1024,put:async(key:string,bytes:Uint8Array)=>{
    active++;activeBytes+=bytes.length;maxActive=Math.max(maxActive,active);maxBytes=Math.max(maxBytes,activeBytes);
    await new Promise(r=>setTimeout(r,5));puts.push({key,bytes:bytes.slice()});active--;activeBytes-=bytes.length;
  }};
  return {options,puts,get active(){return active},get maxActive(){return maxActive},get maxBytes(){return maxBytes}};
}

test('complete sorted inventory includes unchanged files and omits deleted ones; only new hashes are written',async()=>{
 const f=fixture({'z.md':encode('new'), 'same.md':encode('old'), 'a.md':encode('first')});const old=encode('old');f.options.current=[{path:'same.md',objectKey:prefix+'/'+hash(old),sha256:hash(old),size:old.length},{path:'deleted.md',objectKey:prefix+'/'+hash(old),sha256:hash(old),size:old.length}];
 const result=await persistPlayttCanonicalFiles(f.options);assert.deepEqual(result.files.map(f=>f.path),['a.md','same.md','z.md']);assert.equal(result.bytes,11);assert.equal(f.puts.length,2);assert.equal(f.options.retained.current,17);
 for(const file of result.files)assert.equal(file.objectKey,prefix+'/'+file.sha256);
});

test('small writes overlap at most three while retaining a bounded byte budget',async()=>{
 const values=Object.fromEntries(Array.from({length:12},(_,i)=>[i+'.md',new Uint8Array(400000).fill(i)])),f=fixture(values);
 await persistPlayttCanonicalFiles(f.options);assert.ok(f.maxActive>1&&f.maxActive<=3);assert.ok(f.maxBytes<=cap);assert.ok(f.options.retained.peak<=17+cap+400000);assert.equal(f.options.retained.current,17);assert.equal(f.active,0);assert.equal(f.puts.length,12);
});

test('a file larger than the queue byte budget writes alone and preserves exact bytes',async()=>{
 const large=new Uint8Array(cap+123).fill(211),f=fixture({'small-1':encode('one'),'large':large,'small-2':encode('two')});const put=f.options.put;let active=0;
 f.options.put=async(key,bytes)=>{if(bytes.length>cap)assert.equal(active,0);active++;await put(key,bytes);active--;};
 await persistPlayttCanonicalFiles(f.options);assert.equal(hash(f.puts.find(x=>x.bytes.length===large.length)!.bytes),hash(large));assert.ok(f.options.retained.peak<=17+cap+large.length);assert.equal(f.options.retained.current,17);
});

test('same new content under different paths writes its immutable object once',async()=>{
 const f=fixture({'a.md':encode('identical'),'b.md':encode('identical'),'c.md':encode('identical')});const result=await persistPlayttCanonicalFiles(f.options);assert.equal(result.files.length,3);assert.equal(f.puts.length,1);assert.equal(f.options.retained.current,17);
});

test('a rejected write stops scheduling and drains every in-flight write before rejecting',async()=>{
 const f=fixture(Object.fromEntries(Array.from({length:12},(_,i)=>[i+'.md',encode('unique '+i)])));let active=0,started=0,finished=0;const failure=new Error('Injected immutable write failure');
 f.options.put=async()=>{const index=started++;active++;try{await new Promise(r=>setTimeout(r,index===0?1:15));if(index===0)throw failure;}finally{active--;finished++;}};
 await assert.rejects(persistPlayttCanonicalFiles(f.options),e=>e===failure);assert.ok(started<=3);assert.equal(finished,started);assert.equal(active,0);assert.equal(f.options.retained.current,17);
});

test('read and byte-budget failures drain earlier writes and release all owned buffers',async()=>{
 for(const mode of ['read','file-budget','total-budget']) {
  const f=fixture({'one':encode('first'),'two':encode('second')});if(mode==='read'){const read=f.options.readFile;f.options.readFile=path=>{if(path==='two')throw Error('Injected read failure');return read(path);};}else if(mode==='file-budget')f.options.maxFileBytes=5;else f.options.maxTotalBytes=10;
  await assert.rejects(persistPlayttCanonicalFiles(f.options),/failure|budget/);assert.equal(f.active,0);assert.equal(f.options.retained.current,17);
 }
});

test('synchronous put failure is observed and no work outlives rejection',async()=>{
 const f=fixture({'a':encode('one'),'b':encode('two')});f.options.put=()=>{throw Error('Synchronous put failure');};await assert.rejects(persistPlayttCanonicalFiles(f.options),/Synchronous/);assert.equal(f.options.retained.current,17);
});

test('concurrent immutable writes feed an independently verified complete restore pack',async()=>{
 const values={'page/a.md':encode('first \n'),'page/b.md':encode('second\n'),'_tables/posts.json':encode('[{"ID":42}]')},f=fixture(values),objects=new Map<string,Uint8Array>();
 f.options.put=async(key,bytes)=>{await new Promise(r=>setTimeout(r,1));objects.set(key,bytes.slice());};
 const persisted=await persistPlayttCanonicalFiles(f.options);
 const bucket={async get(key:string){const bytes=objects.get(key);return bytes?{size:bytes.length,async arrayBuffer(){return bytes.slice().buffer}}:null;}};
 const sources=await readPlayttSnapshotSources(bucket,'sites/default',{files:persisted.files});assert.equal(sources.objectReads,3);
 const pack=await createCanonicalRestorePack('sites/default',sources.contents);
 const restored=await decodeCanonicalRestorePack(pack.metadata,'sites/default',{markdown:persisted.files,uploads:[],wpContent:[],wpContentDeleted:[]},pack.bytes);
 assert.deepEqual(Object.fromEntries(restored.markdown.map(f=>[f.path,hash(f.bytes)])),Object.fromEntries(Object.entries(values).map(([path,bytes])=>[path,hash(bytes)])));assert.equal(f.options.retained.current,17);
});
