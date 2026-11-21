import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {gzipSync} from 'node:zlib';
import {resolve} from 'node:path';
import {build} from 'esbuild';
export const sha=b=>createHash('sha256').update(b).digest('hex');
export const enc=v=>Buffer.from(typeof v==='string'?v:JSON.stringify(v));
export const root='sites/default';
export const sourcePaths={baseline:'src/playtt-manifest-envelope.ts',candidate:'scripts/playtt-manifest-bytes-candidate.ts'};
export const sourceHashes={baseline:'f8a7c6e175297f2e8422f1d4c2704fce094f49af0d3b8a48b09e68a472925795',candidate:'c81f37e3ab4399efc98fcb5688d1e62fc3dd114fc8e3e28c9edb0a2fdef76e99'};
export async function sources(){
 const result={};for(const [name,path]of Object.entries(sourcePaths)){result[name]=(await readFile(path,'utf8')).replaceAll('\r\n','\n');assert.equal(sha(result[name]),sourceHashes[name]);}
 const old='const compressed=Uint8Array.from(text,c=>c.charCodeAt(0));';
 const replacement='// atob returns one Latin-1 code unit per byte. Allocate only the destination,\n  // avoiding the iterable-to-list temporary; canonical and hash checks stay intact.\n  const compressed=new Uint8Array(text.length);for(let i=0;i<text.length;i++)compressed[i]=text.charCodeAt(i);';
 assert.equal(result.baseline.split(old).length,2);assert.equal(result.baseline.replace(old,replacement),result.candidate);return result;
}
export async function compile(variant,entry){
 const input=await sources();
 return build({stdin:{contents:entry??input[variant],loader:'ts',sourcefile:'manifest-byte-fixture.ts',resolveDir:resolve('src')},bundle:true,write:false,format:'esm',target:'es2022',keepNames:true,
 plugins:[{name:'manifest-byte-candidate',setup(b){b.onResolve({filter:/^manifest-byte-module$/},()=>({path:'codec',namespace:'manifest-byte-module'}));b.onLoad({filter:/.*/,namespace:'manifest-byte-module'},()=>({contents:input[variant],loader:'ts',resolveDir:resolve('src')}));}}]});
}
export async function api(variant){const r=await compile(variant);return import('data:text/javascript;base64,'+Buffer.from(r.outputFiles[0].text).toString('base64'));}
export function fixture(count=48,padding=0){
 const revision='12345678-1234-1234-1234-123456789abc',baseRevision='12345678-1234-1234-1234-123456789abd',hash=sha('delta');
 const files=Array.from({length:count},(_,i)=>{const body=enc('繁體中文內容🙂 '+i),h=sha(body);return {path:`page/${i}.md`,size:body.length,sha256:h,objectKey:`${root}/markdown/objects/${h}`};});
 const m={revision,manifestKey:`${root}/markdown/revisions/${revision}.json`,persistedAt:'2026-11-22T00:00:00.000Z',files,uploads:[],wpContent:[],wpContentDeleted:[],restorePack:{schema:'playtt/canonical-compressed-content/v1',base:{revision:baseRevision,manifestKey:`${root}/markdown/revisions/${baseRevision}.json`,persistedAt:'2026-11-21T00:00:00.000Z',sha256:sha('base'),size:100},delta:{schema:'playtt/compressed-delta-pack/v1',objectKey:`${root}/delta-packs/${hash}.gz`,sha256:hash,size:100,decodedBytes:100,fileCount:1}}};
 if(padding){let state=0x12345678,text='';const alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';for(let i=0;i<padding;i++){state^=state<<13;state^=state>>>17;state^=state<<5;text+=alphabet[(state>>>0)%64];}m.padding=text;}
 return m;
}
export function envelope(m,raw=enc(m)){
 const zipped=gzipSync(raw);return {schema:'playtt/canonical-manifest-envelope/v1',revision:m.revision,manifestKey:m.manifestKey,persistedAt:m.persistedAt,codec:'gzip-base64',decodedBytes:raw.length,decodedSha256:sha(raw),encodedBytes:zipped.length,encodedSha256:sha(zipped),payload:zipped.toString('base64')};
}
