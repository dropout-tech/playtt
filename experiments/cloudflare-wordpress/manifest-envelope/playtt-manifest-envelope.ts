// Only optional compressed-content snapshots may use this physical envelope.
// Full bases stay plain JSON; decoded metadata never replaces the physical
// bytes or SHA used by a backup pin. No lease, writes or pointer changes here.
import {isCompressedContent,validateCompressedContent,readExactCompressedStream,type CompressedManifest} from './playtt-compressed-content.js';
export const MANIFEST_ENVELOPE_SCHEMA='playtt/canonical-manifest-envelope/v1';
export const MAX_MANIFEST_ENVELOPE=256*1024;
export const MAX_MANIFEST_DECODED=256*1024;
export const MAX_MANIFEST_GZIP=192*1024;
const enc=(s:string)=>new TextEncoder().encode(s);
const parse=(b:Uint8Array)=>JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(b));
const sha=async(b:Uint8Array)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',b as Uint8Array<ArrayBuffer>)),v=>v.toString(16).padStart(2,'0')).join('');
function need(v:unknown,message='Invalid canonical manifest envelope.'):asserts v{if(!v)throw new Error(message);}
const object=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
export const isManifestEnvelope=(v:unknown):v is Record<string,unknown>=>object(v)&&v.schema===MANIFEST_ENVELOPE_SCHEMA;
function plain(v:unknown):CompressedManifest{
  need(object(v)&&!Object.hasOwn(v,'schema'),'Unknown canonical manifest schema.');
  return v as unknown as CompressedManifest;
}
function base64(b:Uint8Array):string{let text='';for(let i=0;i<b.length;i+=16384)text+=String.fromCharCode(...b.subarray(i,i+16384));return btoa(text);}
async function gzip(raw:Uint8Array):Promise<Uint8Array|null>{
  const reader=new Blob([raw as Uint8Array<ArrayBuffer>]).stream().pipeThrough(new CompressionStream('gzip')).getReader();
  const chunks:Uint8Array[]=[];let size=0;
  try{for(;;){const item=await reader.read();if(item.done)break;size+=item.value.length;if(size>MAX_MANIFEST_GZIP){await reader.cancel();return null;}chunks.push(item.value);}}
  catch(error){await reader.cancel().catch(()=>undefined);throw error;}finally{reader.releaseLock();}
  const bytes=new Uint8Array(size);let offset=0;for(const part of chunks){bytes.set(part,offset);offset+=part.length;}return bytes;
}
// Snapshot the caller's metadata before the first await; mutable caller fields
// cannot make envelope identity diverge from the already encoded payload.
// If the envelope does not reduce bytes, return the same valid plain JSON.
export async function serializeManifestEnvelope(manifest:CompressedManifest,root:string):Promise<string>{
  const serialized=JSON.stringify(manifest),raw=enc(serialized);need(raw.length<=MAX_MANIFEST_DECODED,'Decoded manifest exceeds its byte budget.');
  const copied=plain(parse(raw));need(isCompressedContent(copied.restorePack),'Only compressed-content manifests can be enveloped.');validateCompressedContent(copied,root);
  const compressed=await gzip(raw);if(!compressed)return serialized;
  const envelope={schema:MANIFEST_ENVELOPE_SCHEMA,revision:copied.revision,manifestKey:copied.manifestKey,persistedAt:copied.persistedAt,codec:'gzip-base64',decodedBytes:raw.length,decodedSha256:await sha(raw),encodedBytes:compressed.length,encodedSha256:await sha(compressed),payload:base64(compressed)};
  const wire=JSON.stringify(envelope),length=enc(wire).length;
  return length<raw.length&&length<=MAX_MANIFEST_ENVELOPE?wire:serialized;
}
export async function decodeCanonicalManifestBytes(bytes:Uint8Array,root:string):Promise<CompressedManifest>{
  need(bytes.length<=MAX_MANIFEST_ENVELOPE,'Manifest wire bytes exceed budget.');const value=parse(bytes);
  if(!isManifestEnvelope(value))return plain(value);
  need(Object.keys(value).sort().join(',')==='codec,decodedBytes,decodedSha256,encodedBytes,encodedSha256,manifestKey,payload,persistedAt,revision,schema');
  need(value.codec==='gzip-base64'&&typeof value.revision==='string'&&/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/.test(value.revision)
    &&value.manifestKey===`${root}/markdown/revisions/${value.revision}.json`&&typeof value.persistedAt==='string'&&/(?:Z|[+-]\d\d:\d\d)$/.test(value.persistedAt)&&Number.isFinite(Date.parse(value.persistedAt)));
  const n=value.decodedBytes,z=value.encodedBytes,payload=value.payload;
  need(Number.isSafeInteger(n)&&Number(n)>0&&Number(n)<=MAX_MANIFEST_DECODED&&Number.isSafeInteger(z)&&Number(z)>0&&Number(z)<=MAX_MANIFEST_GZIP);
  need(typeof value.decodedSha256==='string'&&/^[a-f0-9]{64}$/.test(value.decodedSha256)&&typeof value.encodedSha256==='string'&&/^[a-f0-9]{64}$/.test(value.encodedSha256));
  need(typeof payload==='string'&&payload.length===4*Math.ceil(Number(z)/3)&&payload.length<=4*Math.ceil(MAX_MANIFEST_GZIP/3));
  const text=atob(payload);need(text.length===z&&btoa(text)===payload,'Manifest base64 is not canonical.');
  const compressed=Uint8Array.from(text,c=>c.charCodeAt(0));need(await sha(compressed)===value.encodedSha256,'Encoded manifest hash differs.');
  const decoded=await readExactCompressedStream(new Blob([compressed]).stream().pipeThrough(new DecompressionStream('gzip')),Number(n),MAX_MANIFEST_DECODED);
  need(await sha(decoded)===value.decodedSha256,'Decoded manifest hash differs.');
  const manifest=plain(parse(decoded));need(isCompressedContent(manifest.restorePack),'Envelope does not contain compressed content.');validateCompressedContent(manifest,root);
  need(manifest.revision===value.revision&&manifest.manifestKey===value.manifestKey&&manifest.persistedAt===value.persistedAt,'Envelope and decoded manifest identities differ.');
  return manifest;
}
interface ManifestObject{size:number;body?:ReadableStream<Uint8Array>;arrayBuffer():Promise<ArrayBuffer>;json<T=unknown>():Promise<T>}
export async function readCanonicalManifestObject(object:ManifestObject,root:string):Promise<CompressedManifest>{
  need(Number.isSafeInteger(object.size)&&object.size>=0,'Invalid manifest object size.');
  // Preserve the existing large plain-manifest path and its caller's inventory
  // limits. An oversized object can never use the new decompression path.
  if(object.size>MAX_MANIFEST_ENVELOPE)return plain(await object.json());
  const bytes=object.body?await readExactCompressedStream(object.body,object.size,MAX_MANIFEST_ENVELOPE):new Uint8Array(await object.arrayBuffer());
  need(bytes.length===object.size,'Manifest object length differs.');return decodeCanonicalManifestBytes(bytes,root);
}
