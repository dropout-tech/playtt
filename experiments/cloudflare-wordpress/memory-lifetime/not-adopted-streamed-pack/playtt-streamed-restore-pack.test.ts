import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createHash} from 'node:crypto';
import {createCanonicalRestorePack,createStreamedCanonicalRestorePack,decodeCanonicalRestorePack} from '../src/canonical-restore-pack.js';

const root='sites/default';
const hash=(bytes:Uint8Array)=>createHash('sha256').update(bytes).digest('hex');
function fixture(){
 const objects=new Map<string,Uint8Array>();
 const content={markdown:[],uploads:[],wpContent:[],wpContentDeleted:['themes/removed/style.css']} as {markdown:{path:string;bytes:Uint8Array}[];uploads:{path:string;bytes:Uint8Array}[];wpContent:{path:string;bytes:Uint8Array}[];wpContentDeleted:string[]};
 const files={markdown:[],uploads:[],wpContent:[],wpContentDeleted:content.wpContentDeleted} as {markdown:any[];uploads:any[];wpContent:any[];wpContentDeleted:string[]};
 for(let i=0;i<45;i++){
  const domain=(['markdown','uploads','wpContent'] as const)[i%3];
  const path='folder/繁中-'+i+'.txt',bytes=new TextEncoder().encode('真實內容 '+i+' abc '.repeat(i*15));
  const sha256=hash(bytes),objectKey=root+'/objects/'+sha256;
  content[domain].push({path,bytes});files[domain].push({path,size:bytes.length,sha256,objectKey});objects.set(objectKey,bytes);
 }
 return {objects,content,files};
}
test('bounded archive is byte-identical to v1 and restores every file and tombstone',async()=>{
 const {objects,content,files}=fixture();let active=0,peak=0,reads=0;
 const bucket={async get(key:string){active++;peak=Math.max(peak,active);reads++;await new Promise(r=>setTimeout(r,1));const bytes=objects.get(key)!;return {size:bytes.length,async arrayBuffer(){await new Promise(r=>setTimeout(r,1));active--;return Uint8Array.from(bytes).buffer;}};}};
 const expected=await createCanonicalRestorePack(root,content),actual=await createStreamedCanonicalRestorePack(root,bucket,files);
 assert.ok(peak<=4&&peak>1);assert.equal(reads,45);assert.equal(active,0);assert.deepEqual(actual.metadata,expected.metadata);assert.deepEqual(actual.bytes,expected.bytes);
 const restored=await decodeCanonicalRestorePack(actual.metadata,root,files,actual.bytes);
 for(const domain of ['markdown','uploads','wpContent'] as const){assert.equal(restored[domain].length,content[domain].length);for(const item of restored[domain])assert.deepEqual(item.bytes,content[domain].find(x=>x.path===item.path)!.bytes);}
 assert.deepEqual(restored.wpContentDeleted,content.wpContentDeleted);
});
test('missing, size-mismatched and hash-corrupt source objects cannot produce a pack',async()=>{
 for(const mode of ['missing','size','hash']){
  const {objects,files}=fixture();let reads=0;const bad=files.markdown[1].objectKey;
  const bucket={async get(key:string){reads++;const bytes=objects.get(key)!;if(key===bad&&mode==='missing')return null;return {size:bytes.length+(key===bad&&mode==='size'?1:0),async arrayBuffer(){const copy=Uint8Array.from(bytes);if(key===bad&&mode==='hash')copy[0]^=1;return copy.buffer;}};}};
  await assert.rejects(createStreamedCanonicalRestorePack(root,bucket,files),/source.*(invalid size|integrity)/);
  assert.ok(reads<45,'Failure must not start unbounded reads');
 }
});
test('an empty archive still preserves the required tombstone metadata',async()=>{
 const files={markdown:[],uploads:[],wpContent:[],wpContentDeleted:[]};
 const pack=await createStreamedCanonicalRestorePack(root,{get:async()=>{assert.fail('No objects should be read');}},files);
 assert.equal(pack.metadata.fileCount,0);assert.equal(pack.metadata.decodedBytes,0);assert.deepEqual(await decodeCanonicalRestorePack(pack.metadata,root,files,pack.bytes),files);
});
