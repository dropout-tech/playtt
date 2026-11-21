// Prototype only: not imported by the Worker or any production reader/writer.
// A separate descriptor prevents old readers from treating compressed bytes as
// existing raw objects. Canonical file paths, sizes and hashes stay byte-exact.
import {createCanonicalRestorePack, decodeCanonicalRestorePack, validateCanonicalRestorePackMetadata, type CanonicalRestorePackMetadata, type CanonicalRestorePackFile, type RestorePackBucket, type RestorePackContents} from './canonical-restore-pack.js';
import {validatePlayttSnapshotSources, type PlayttSnapshotManifest, type PlayttSnapshotRuntimeReader} from './playtt-snapshot-source.js';
import {readContentBytes} from './playtt-content-overlay.js';
import type {MarkdownPointer} from './revision-coordinator.js';

export const COMPRESSED_CONTENT_SCHEMA = 'playtt/canonical-compressed-content/v1';
export const COMPRESSED_DELTA_SCHEMA = 'playtt/compressed-delta-pack/v1';
export const MAX_COMPRESSED_DELTA_BYTES = 1024 * 1024;
export const MAX_COMPRESSED_DELTA_FILES = 64;
export const MAX_COMPRESSED_MANIFEST = 256 * 1024;
export const MAX_COMPRESSED_FRAME = MAX_COMPRESSED_DELTA_BYTES + MAX_COMPRESSED_MANIFEST;
export const MAX_COMPRESSED_OBJECT = MAX_COMPRESSED_FRAME + 64 * 1024;
export const MAX_COMPRESSED_BASE = 8 * 1024 * 1024;
const groups = ['markdown','uploads','wpContent'] as const;
type Group = typeof groups[number];
type Task = {group: Group; file: CanonicalRestorePackFile};
export interface CompressedDelta {
  schema: typeof COMPRESSED_DELTA_SCHEMA;
  objectKey: string;
  sha256: string;
  size: number;
  decodedBytes: number;
  fileCount: number;
}
export interface CompressedContent {
  schema: typeof COMPRESSED_CONTENT_SCHEMA;
  base: MarkdownPointer & {sha256: string; size: number};
  delta: CompressedDelta;
}
export interface CompressedManifest extends PlayttSnapshotManifest, MarkdownPointer {restorePack?: unknown}
type FullManifest = CompressedManifest & {restorePack: CanonicalRestorePackMetadata};
const enc = (v: unknown) => new TextEncoder().encode(typeof v === 'string' ? v : JSON.stringify(v));
const equal = (a: unknown,b: unknown) => JSON.stringify(a) === JSON.stringify(b);
const parse = (b: Uint8Array) => JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(b));
function need(value: unknown,message = 'Invalid compressed content.'): asserts value {if(!value)throw new Error(message);}
const keys = (v: object,want: string) => need(Object.keys(v).sort().join(',')===want);
const sha = async (b: Uint8Array) => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',b as Uint8Array<ArrayBuffer>)),v=>v.toString(16).padStart(2,'0')).join('');
const list = (m: PlayttSnapshotManifest,g: Group) => g==='markdown'?m.files:m[g]||[];
const inventory = (m: PlayttSnapshotManifest) => ({markdown:m.files,uploads:m.uploads||[],wpContent:m.wpContent||[],wpContentDeleted:m.wpContentDeleted||[]});
const sameFile = (a: CanonicalRestorePackFile|undefined,b: CanonicalRestorePackFile) => a?.sha256===b.sha256&&a.size===b.size;
export const isCompressedContent = (v: unknown): v is CompressedContent => !!v&&typeof v==='object'&&(v as CompressedContent).schema===COMPRESSED_CONTENT_SCHEMA;
function identity(m: MarkdownPointer,root: string) {
  need(m&&/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/.test(m.revision)
    &&m.manifestKey===`${root}/markdown/revisions/${m.revision}.json`
    &&typeof m.persistedAt==='string'&&/(?:Z|[+-]\d\d:\d\d)$/.test(m.persistedAt)&&Number.isFinite(Date.parse(m.persistedAt)));
}
function validateInventory(m: PlayttSnapshotManifest,root: string) {
  need(m&&Array.isArray(m.files)&&(!m.uploads||Array.isArray(m.uploads))&&(!m.wpContent||Array.isArray(m.wpContent)));
  validatePlayttSnapshotSources(root,m);
  const deleted=m.wpContentDeleted||[],present=new Set((m.wpContent||[]).map(f=>f.path));
  need(Array.isArray(deleted)&&deleted.length<=5000);
  for(let i=0;i<deleted.length;i++){
    const p=deleted[i];need(typeof p==='string'&&/^(plugins|themes|languages|mu-plugins)\//.test(p)&&!p.includes('\\')&&!p.includes('\0')
      &&!p.split('/').some(s=>!s||s==='.'||s==='..')&&(i===0||deleted[i-1]<p)&&!present.has(p));
  }
  need(groups.reduce((n,g)=>n+list(m,g).reduce((s,f)=>s+f.size,0),0)<=MAX_COMPRESSED_BASE,'Compressed content inventory exceeds budget.');
}
function fullBase(m: CompressedManifest,root: string): asserts m is FullManifest {
  validateInventory(m,root);identity(m,root);
  validateCanonicalRestorePackMetadata(m.restorePack,root,inventory(m));
  need(m.restorePack.size<=MAX_COMPRESSED_BASE&&m.restorePack.decodedBytes<=MAX_COMPRESSED_BASE,'Compressed content base exceeds budget.');
}
function changes(base: PlayttSnapshotManifest,next: PlayttSnapshotManifest) {
  const tasks: Task[]=[];let count=0,bytes=0;
  for(const group of groups){
    const old=new Map(list(base,group).map(f=>[f.path,f]));
    for(const file of list(next,group)){
      if(!sameFile(old.get(file.path),file)){tasks.push({group,file});count++;bytes+=file.size;}
      old.delete(file.path);
    }
    count+=old.size;
  }
  const a=new Set(base.wpContentDeleted||[]),b=new Set(next.wpContentDeleted||[]);
  count+=[...a].filter(p=>!b.has(p)).length+[...b].filter(p=>!a.has(p)).length;
  return {tasks,count,bytes,eligible:count<=MAX_COMPRESSED_DELTA_FILES&&bytes<=MAX_COMPRESSED_DELTA_BYTES};
}
function frameHeader(tasks: Task[],deleted: string[]) {
  const entries=tasks.map(({group,file})=>({group,path:file.path,size:file.size,sha256:file.sha256}));
  const header=enc('PLAYTT-DELTA-V1\n'+JSON.stringify({entries,wpContentDeleted:deleted})+'\n');
  need(header.length<=MAX_COMPRESSED_MANIFEST,'Compressed frame header exceeds budget.');return header;
}
// Fixed-size destination; oversized output is rejected before copying it.
// Canceling the reader propagates to decompression and its input stream.
export async function readExactCompressedStream(stream: ReadableStream<Uint8Array>,size: number,limit: number): Promise<Uint8Array> {
  need(Number.isSafeInteger(size)&&size>=0&&size<=limit,'Compressed stream size exceeds budget.');
  const reader=stream.getReader(),result=new Uint8Array(size);let offset=0;
  try{
    for(;;){const item=await reader.read();if(item.done)break;
      need(item.value instanceof Uint8Array&&offset+item.value.length<=size,'Compressed stream exceeds declared size.');
      result.set(item.value,offset);offset+=item.value.length;
    }
    need(offset===size,'Compressed stream is truncated.');return result;
  }catch(error){await reader.cancel().catch(()=>undefined);throw error;}finally{reader.releaseLock();}
}
async function compress(frame: Uint8Array): Promise<Uint8Array> {
  const stream=new Blob([frame as Uint8Array<ArrayBuffer>]).stream().pipeThrough(new CompressionStream('gzip'));
  const reader=stream.getReader(),chunks: Uint8Array[]=[];let size=0;
  try{for(;;){const item=await reader.read();if(item.done)break;size+=item.value.length;need(size<=MAX_COMPRESSED_OBJECT,'Compressed object exceeds budget.');chunks.push(item.value);}}
  catch(error){await reader.cancel().catch(()=>undefined);throw error;}finally{reader.releaseLock();}
  const result=new Uint8Array(size);let offset=0;for(const part of chunks){result.set(part,offset);offset+=part.length;}return result;
}
export function validateCompressedContent(m: CompressedManifest,root: string) {
  validateInventory(m,root);identity(m,root);const descriptor=m.restorePack;need(isCompressedContent(descriptor));
  keys(descriptor,'base,delta,schema');identity(descriptor.base,root);keys(descriptor.base,'manifestKey,persistedAt,revision,sha256,size');
  need(descriptor.base.revision!==m.revision&&/^[a-f0-9]{64}$/.test(descriptor.base.sha256)
    &&Number.isSafeInteger(descriptor.base.size)&&descriptor.base.size>0&&descriptor.base.size<=MAX_COMPRESSED_MANIFEST);
  const d=descriptor.delta;need(d&&typeof d==='object');keys(d,'decodedBytes,fileCount,objectKey,schema,sha256,size');
  need(d.schema===COMPRESSED_DELTA_SCHEMA&&/^[a-f0-9]{64}$/.test(d.sha256)&&d.objectKey===`${root}/delta-packs/${d.sha256}.gz`
    &&Number.isSafeInteger(d.size)&&d.size>0&&d.size<=MAX_COMPRESSED_OBJECT
    &&Number.isSafeInteger(d.decodedBytes)&&d.decodedBytes>0&&d.decodedBytes<=MAX_COMPRESSED_FRAME
    &&Number.isSafeInteger(d.fileCount)&&d.fileCount>=0&&d.fileCount<=MAX_COMPRESSED_DELTA_FILES);
  need(enc(m).length<=MAX_COMPRESSED_MANIFEST,'Compressed manifest exceeds budget.');
}
// The caller supplies a full base, never a linked overlay. Base bytes are read
// back and compared; changed leased-runtime bytes are hashed independently.
// This function does not write objects, change a pointer, or open a lease.
export async function createCompressedContent(bucket: RestorePackBucket,root: string,next: PlayttSnapshotManifest,base: CompressedManifest,readRuntime: PlayttSnapshotRuntimeReader): Promise<{descriptor: CompressedContent; bytes: Uint8Array}|null> {
  validateInventory(next,root);fullBase(base,root);
  const delta=changes(base,next);if(!delta.eligible)return null;
  const baseBytes=await readContentBytes(bucket,base.manifestKey,MAX_COMPRESSED_MANIFEST);
  need(equal(parse(baseBytes),base),'Stored compressed base differs.');
  const header=frameHeader(delta.tasks,next.wpContentDeleted||[]),frame=new Uint8Array(header.length+delta.bytes);frame.set(header);
  need(frame.length<=MAX_COMPRESSED_FRAME);let offset=header.length;
  // Sequential reads bound owned input copies to one file plus the 1MiB frame.
  for(const {group,file}of delta.tasks){const body=readRuntime(group,file.path);
    need(body instanceof Uint8Array&&body.length===file.size,'Compressed source failed integrity validation.');
    // Copy before the asynchronous digest, then hash the owned bytes. A caller
    // reusing its buffer while the digest runs cannot change the encoded data.
    frame.set(body,offset);
    need(await sha(frame.subarray(offset,offset+file.size))===file.sha256,'Compressed source failed integrity validation.');
    offset+=file.size;
  }
  const bytes=await compress(frame),hash=await sha(bytes);
  return {descriptor:{schema:COMPRESSED_CONTENT_SCHEMA,base:{revision:base.revision,manifestKey:base.manifestKey,persistedAt:base.persistedAt,sha256:await sha(baseBytes),size:baseBytes.length},
    delta:{schema:COMPRESSED_DELTA_SCHEMA,objectKey:`${root}/delta-packs/${hash}.gz`,sha256:hash,size:bytes.length,decodedBytes:frame.length,fileCount:delta.tasks.length}},bytes};
}
export async function readCompressedContent(bucket: RestorePackBucket,root: string,m: CompressedManifest): Promise<{contents: RestorePackContents; base: FullManifest; baseBytes: Uint8Array; deltaBytes: Uint8Array}> {
  validateCompressedContent(m,root);const descriptor=m.restorePack as CompressedContent;
  const baseBytes=await readContentBytes(bucket,descriptor.base.manifestKey,MAX_COMPRESSED_MANIFEST,descriptor.base.size,descriptor.base.sha256);
  const base=parse(baseBytes) as CompressedManifest;fullBase(base,root);
  need(base.revision===descriptor.base.revision&&base.manifestKey===descriptor.base.manifestKey&&base.persistedAt===descriptor.base.persistedAt,'Compressed base identity differs.');
  const delta=changes(base,m);need(delta.eligible,'Compressed delta exceeds cumulative budget.');
  const header=frameHeader(delta.tasks,m.wpContentDeleted||[]),d=descriptor.delta;
  need(d.fileCount===delta.tasks.length&&d.decodedBytes===header.length+delta.bytes,'Compressed delta framing metadata differs.');
  const bytes=await readContentBytes(bucket,d.objectKey,MAX_COMPRESSED_OBJECT,d.size,d.sha256);
  const decoded=await readExactCompressedStream(new Blob([bytes as Uint8Array<ArrayBuffer>]).stream().pipeThrough(new DecompressionStream('gzip')),d.decodedBytes,MAX_COMPRESSED_FRAME);
  need(header.every((v,i)=>decoded[i]===v),'Compressed delta header differs.');
  const replacements=new Map<string,Uint8Array>();let offset=header.length;
  for(const {group,file}of delta.tasks){const body=decoded.slice(offset,offset+file.size);offset+=file.size;
    need(await sha(body)===file.sha256,'Decoded compressed file hash differs.');replacements.set(group+'/'+file.path,body);
  }
  need(offset===decoded.length);
  const pack=await readContentBytes(bucket,base.restorePack.objectKey,MAX_COMPRESSED_BASE,base.restorePack.size,base.restorePack.sha256);
  const contents=await decodeCanonicalRestorePack(base.restorePack,root,inventory(base),pack);
  for(const group of groups){const old=new Map(list(base,group).map(f=>[f.path,f])),raw=new Map(contents[group].map(f=>[f.path,f.bytes]));
    contents[group]=list(m,group).map(file=>({path:file.path,bytes:sameFile(old.get(file.path),file)?raw.get(file.path)!:replacements.get(group+'/'+file.path)!}));
  }
  contents.wpContentDeleted=[...(m.wpContentDeleted||[])];return {contents,base,baseBytes,deltaBytes:bytes};
}
// Materialization helper for prototype verification only. A caller must write
// and independently verify all returned raw objects/pack/manifest before any
// adoption or old-reader rollback. This function cannot promote a pointer.
export async function materializeCompressedContents(root: string,contents: RestorePackContents) {
  return createCanonicalRestorePack(root,contents);
}
