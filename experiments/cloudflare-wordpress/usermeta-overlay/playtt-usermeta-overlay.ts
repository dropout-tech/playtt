// Optional v2. No deployment/configuration enables this writer implicitly.
import { decodeCanonicalRestorePack, validateCanonicalRestorePackMetadata, type CanonicalRestorePackMetadata, type CanonicalRestorePackFile, type RestorePackBucket, type RestorePackContents } from './canonical-restore-pack.js';
import { validatePlayttSnapshotSources, type PlayttSnapshotManifest } from './playtt-snapshot-source.js';
import { isMetadataOverlay as isLegacyOverlay, readMetadataOverlay as readLegacyOverlay, type PlayttMetadataOverlay } from './playtt-metadata-overlay.js';
import type { MarkdownPointer } from './revision-coordinator.js';

export const USERMETA_OVERLAY_SCHEMA = 'playtt/canonical-metadata-overlay/v2';
export const MAX_OVERLAY_MANIFEST = 256 * 1024;
export const MAX_OVERLAY_METADATA = 256 * 1024;
export const MAX_OVERLAY_PACK = 8 * 1024 * 1024;
const POSTMETA = '_tables/postmeta.json', SEQUENCE = '_runtime/playtt-auto-increment.json';
const MARKER = '_runtime/playtt-postmeta-layout.json';
const USERMETA = '_tables/usermeta.json', USERS = '_tables/users.json';
const ALLOWED = new Set([POSTMETA, SEQUENCE, USERMETA]);
const USER_KEYS = new Set(['session_tokens', 'wp_persisted_preferences']);
const UUID = /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/;
const SHA = /^[a-f0-9]{64}$/;
const integer = (v: unknown): v is string => typeof v === 'string' && /^(0|[1-9][0-9]{0,18})$/.test(v) && BigInt(v) <= 9223372036854775807n;
const equal = (a: unknown,b: unknown) => JSON.stringify(a) === JSON.stringify(b);
function requireValue(v: unknown, message = 'Invalid metadata overlay.'): asserts v { if(!v)throw new Error(message); }
const text = (bytes: Uint8Array) => new TextDecoder('utf-8',{fatal:true}).decode(bytes);
export const overlayHash = async (bytes: Uint8Array) => [...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes as Uint8Array<ArrayBuffer>))].map(x=>x.toString(16).padStart(2,'0')).join('');

export interface PlayttUsermetaOverlay {
  schema: typeof USERMETA_OVERLAY_SCHEMA;
  base: MarkdownPointer & { sha256: string; size: number };
}
export interface OverlayManifest extends PlayttSnapshotManifest, MarkdownPointer {
  restorePack?: CanonicalRestorePackMetadata | PlayttUsermetaOverlay | PlayttMetadataOverlay;
}
export function isUsermetaOverlay(value: unknown): value is PlayttUsermetaOverlay {
  return !!value && typeof value === 'object' && (value as PlayttUsermetaOverlay).schema === USERMETA_OVERLAY_SCHEMA;
}
function identity(manifest: MarkdownPointer, root: string): void {
  requireValue(manifest && UUID.test(manifest.revision) && manifest.manifestKey === `${root}/markdown/revisions/${manifest.revision}.json`
    && typeof manifest.persistedAt === 'string' && /(?:Z|[+-]\d\d:\d\d)$/.test(manifest.persistedAt) && Number.isFinite(Date.parse(manifest.persistedAt)));
}
export function validateUsermetaOverlay(manifest: OverlayManifest,root: string): void {
  validatePlayttSnapshotSources(root,manifest);identity(manifest,root);
  const overlay=manifest.restorePack;requireValue(isUsermetaOverlay(overlay));
  requireValue(Object.keys(overlay).sort().join(',') === 'base,schema');identity(overlay.base,root);
  requireValue(Object.keys(overlay.base).sort().join(',') === 'manifestKey,persistedAt,revision,sha256,size'
    && overlay.base.revision !== manifest.revision && SHA.test(overlay.base.sha256)
    && Number.isSafeInteger(overlay.base.size) && overlay.base.size>0 && overlay.base.size<=MAX_OVERLAY_MANIFEST);
}
const inventory = (m: PlayttSnapshotManifest) => ({markdown:m.files,uploads:m.uploads||[],wpContent:m.wpContent||[],wpContentDeleted:m.wpContentDeleted||[]});
const sameFile = (a:CanonicalRestorePackFile,b:CanonicalRestorePackFile) => a.path===b.path&&a.objectKey===b.objectKey&&a.sha256===b.sha256&&a.size===b.size;
function differences(before:PlayttSnapshotManifest,after:PlayttSnapshotManifest):string[]|null {
  if(!equal(before.uploads||[],after.uploads||[])||!equal(before.wpContent||[],after.wpContent||[])||!equal(before.wpContentDeleted||[],after.wpContentDeleted||[])||before.files.length!==after.files.length)return null;
  const old=new Map(before.files.map(x=>[x.path,x])),changed:string[]=[];
  if(!old.has(MARKER))return null;
  for(const file of after.files){const previous=old.get(file.path);if(!previous)return null;if(!sameFile(previous,file)){if(!ALLOWED.has(file.path))return null;changed.push(file.path);}}
  const metadata=after.files.filter(x=>ALLOWED.has(x.path)||x.path===USERS);
  if(metadata.length!==4||metadata.reduce((n,x)=>n+x.size,0)>MAX_OVERLAY_METADATA)return null;
  return changed;
}
export async function readOverlayBytes(bucket:RestorePackBucket,key:string,limit:number,expectedSize?:number,expectedHash?:string):Promise<Uint8Array>{
  const object=await bucket.get(key);requireValue(object&&Number.isSafeInteger(object.size)&&object.size>0&&object.size<=limit&&(expectedSize===undefined||object.size===expectedSize),'Missing or oversized overlay dependency.');
  let bytes:Uint8Array;
  const body=(object as typeof object & {body?:ReadableStream<Uint8Array>}).body;
  if(body){
    const reader=body.getReader(),chunks:Uint8Array[]=[];let length=0;
    try{for(;;){const result=await reader.read();if(result.done)break;length+=result.value.byteLength;requireValue(length<=object.size&&length<=limit,'Overlay dependency exceeded declared size.');chunks.push(result.value);}}
    catch(e){await reader.cancel().catch(()=>undefined);throw e;}finally{reader.releaseLock();}
    bytes=new Uint8Array(length);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
  }else bytes=new Uint8Array(await object.arrayBuffer());
  requireValue(bytes.length===object.size&&bytes.length<=limit,'Overlay dependency length mismatch.');
  if(expectedHash!==undefined)requireValue(await overlayHash(bytes)===expectedHash,'Overlay dependency hash mismatch.');
  return bytes;
}
function fullBase(manifest:OverlayManifest,root:string):asserts manifest is OverlayManifest & {restorePack:CanonicalRestorePackMetadata}{
  identity(manifest,root);validatePlayttSnapshotSources(root,manifest);
  requireValue(!isUsermetaOverlay(manifest.restorePack),'Overlay chains are forbidden.');
  validateCanonicalRestorePackMetadata(manifest.restorePack,root,inventory(manifest));
  requireValue(manifest.restorePack.size<=MAX_OVERLAY_PACK && manifest.restorePack.decodedBytes<=MAX_OVERLAY_PACK,'Overlay base exceeds its private budget.');
}
async function baseFor(bucket:RestorePackBucket,root:string,manifest:OverlayManifest){
  validateUsermetaOverlay(manifest,root);const overlay=manifest.restorePack as PlayttUsermetaOverlay;
  const bytes=await readOverlayBytes(bucket,overlay.base.manifestKey,MAX_OVERLAY_MANIFEST,overlay.base.size,overlay.base.sha256);
  const base=JSON.parse(text(bytes)) as OverlayManifest;fullBase(base,root);
  requireValue(base.revision===overlay.base.revision&&base.manifestKey===overlay.base.manifestKey&&base.persistedAt===overlay.base.persistedAt,'Overlay base identity mismatch.');
  const changed=differences(base,manifest);requireValue(changed&&changed.length>0,'Overlay inventory exceeds its maintenance scope.');
  return {base,bytes,changed};
}
function sequences(bytes:Uint8Array):Record<string,string>{
  requireValue(bytes.length<=131072);const data=JSON.parse(text(bytes));
  requireValue(data&&Object.keys(data).sort().join(',')==='schema,sequences'&&data.schema==='playtt/auto-increment/v1'&&data.sequences&&typeof data.sequences==='object'&&!Array.isArray(data.sequences));
  requireValue(Object.keys(data.sequences).length<=512);
  for(const [key,value]of Object.entries(data.sequences))requireValue(/^[A-Za-z_][A-Za-z0-9_$-]{0,127}$/.test(key)&&integer(value));
  return data.sequences;
}
type MetaRow={meta_id:string;post_id:string;meta_key:string|null;meta_value:string|null};
function postmeta(bytes:Uint8Array):Map<string,MetaRow>{
  requireValue(bytes.length<=MAX_OVERLAY_METADATA);const data=JSON.parse(text(bytes));requireValue(Array.isArray(data)&&data.length<=4096);
  const rows=new Map<string,MetaRow>();
  for(const row of data){requireValue(row&&Object.keys(row).sort().join(',')==='meta_id,meta_key,meta_value,post_id'&&integer(row.meta_id)&&row.meta_id!=='0'&&integer(row.post_id)&&!rows.has(row.meta_id)
    &&(row.meta_key===null||typeof row.meta_key==='string')&&(row.meta_value===null||typeof row.meta_value==='string'));rows.set(row.meta_id,row);}
  return rows;
}
function lock(row:MetaRow|undefined):boolean{
  return !!row&&row.meta_key==='_edit_lock'&&row.post_id!=='0'&&typeof row.meta_value==='string'&&/^[1-9][0-9]{0,18}:[1-9][0-9]{0,18}$/.test(row.meta_value)&&row.meta_value.split(':').every(integer);
}
// Classify only after complete manifest comparison. All changed bytes remain
// canonical, including meta IDs, lock ownership and deleted-ID high-water.
function lockEligible(before:Map<string,Uint8Array>,after:Map<string,Uint8Array>):boolean{
  for(const files of [before,after]){const marker=files.get(MARKER);requireValue(marker&&marker.length<=256&&equal(JSON.parse(text(marker)),{schema:'playtt/postmeta-table/v1'}),'Full-table metadata marker is required.');}
  const old=postmeta(before.get(POSTMETA)!),next=postmeta(after.get(POSTMETA)!);
  const a=sequences(before.get(SEQUENCE)!),b=sequences(after.get(SEQUENCE)!);
  if(!equal(Object.keys(a).sort(),Object.keys(b).sort())||Object.keys(a).some(k=>BigInt(b[k])<BigInt(a[k])))return false;
  for(const [rows,seq]of [[old,a],[next,b]] as const){if(!integer(seq.wp_postmeta))return false;for(const id of rows.keys())if(BigInt(id)>BigInt(seq.wp_postmeta))return false;}
  for(const id of new Set([...old.keys(),...next.keys()])){
    const x=old.get(id),y=next.get(id);if(equal(x,y))continue;
    if(!x&&y&&BigInt(id)<=BigInt(a.wp_postmeta))return false;
    if((x&&!lock(x))||(y&&!lock(y))||(x&&y&&x.post_id!==y.post_id))return false;
  }
  return true;
}
// Values remain opaque PHP-serialized bytes; never deserialize sessions or
// preferences in JavaScript. A changed role, identity or unrelated key falls
// back to a complete pack. The v1 validator remains byte-for-byte unchanged.
type UserRow={umeta_id:string;user_id:string;meta_key:string|null;meta_value:string|null};
function usermeta(bytes:Uint8Array):Map<string,UserRow>{
  requireValue(bytes.length<=MAX_OVERLAY_METADATA);const data=JSON.parse(text(bytes));
  requireValue(Array.isArray(data)&&data.length<=4096);const rows=new Map<string,UserRow>();
  for(const row of data){
    requireValue(row&&Object.keys(row).sort().join(',')==='meta_key,meta_value,umeta_id,user_id'
      &&integer(row.umeta_id)&&row.umeta_id!=='0'&&integer(row.user_id)&&row.user_id!=='0'&&!rows.has(row.umeta_id)
      &&(row.meta_key===null||typeof row.meta_key==='string')&&(row.meta_value===null||typeof row.meta_value==='string'));
    rows.set(row.umeta_id,row);
  }
  return rows;
}
function accounts(bytes:Uint8Array):Set<string>{
  requireValue(bytes.length<=MAX_OVERLAY_METADATA);const data=JSON.parse(text(bytes));
  requireValue(Array.isArray(data)&&data.length<=4096);const ids=new Set<string>();
  for(const row of data){requireValue(row&&integer(row.ID)&&row.ID!=='0'&&!ids.has(row.ID));ids.add(row.ID);}
  return ids;
}
function eligible(before:Map<string,Uint8Array>,after:Map<string,Uint8Array>):boolean{
  if(!lockEligible(before,after))return false;
  const a=sequences(before.get(SEQUENCE)!),b=sequences(after.get(SEQUENCE)!);
  const old=usermeta(before.get(USERMETA)!),next=usermeta(after.get(USERMETA)!);
  const ids=accounts(before.get(USERS)!);
  const oldAccounts=before.get(USERS)!,newAccounts=after.get(USERS)!;
  if(oldAccounts.length!==newAccounts.length||oldAccounts.some((byte,i)=>byte!==newAccounts[i]))return false;
  for(const [rows,seq] of [[old,a],[next,b]] as const){
    if(!integer(seq.wp_usermeta)||!integer(seq.wp_users))return false;
    for(const id of ids)if(BigInt(id)>BigInt(seq.wp_users))return false;
    const keys=new Set<string>();
    for(const row of rows.values()){
      if(BigInt(row.umeta_id)>BigInt(seq.wp_usermeta)||!ids.has(row.user_id))return false;
      if(USER_KEYS.has(row.meta_key!)){
        const key=row.user_id+':'+row.meta_key;if(keys.has(key))return false;keys.add(key);
      }
    }
  }
  for(const id of new Set([...old.keys(),...next.keys()])){
    const x=old.get(id),y=next.get(id);if(equal(x,y))continue;
    if(!x&&y&&BigInt(id)<=BigInt(a.wp_usermeta))return false;
    for(const row of [x,y])if(row&&(!USER_KEYS.has(row.meta_key!)||typeof row.meta_value!=='string'))return false;
    if(x&&y&&(x.user_id!==y.user_id||x.meta_key!==y.meta_key))return false;
  }
  return true;
}
async function metadataBytes(bucket:RestorePackBucket,manifest:PlayttSnapshotManifest){
  const out=new Map<string,Uint8Array>();
  for(const path of [POSTMETA,SEQUENCE,MARKER,USERMETA,USERS]){const file=manifest.files.find(x=>x.path===path);requireValue(file&&file.size<=MAX_OVERLAY_METADATA);out.set(path,await readOverlayBytes(bucket,file.objectKey,MAX_OVERLAY_METADATA,file.size,file.sha256));}
  return out;
}
export async function createUsermetaOverlay(bucket:RestorePackBucket,root:string,next:PlayttSnapshotManifest,previous:OverlayManifest):Promise<PlayttUsermetaOverlay|null>{
  validatePlayttSnapshotSources(root,previous);validatePlayttSnapshotSources(root,next);identity(previous,root);
  const changed=differences(previous,next);if(!changed?.length)return null;
  if(!previous.restorePack)return null;
  if(!isUsermetaOverlay(previous.restorePack)&&!isLegacyOverlay(previous.restorePack)){
    validateCanonicalRestorePackMetadata(previous.restorePack,root,inventory(previous));
    if(previous.restorePack.size>MAX_OVERLAY_PACK||previous.restorePack.decodedBytes>MAX_OVERLAY_PACK)return null;
  }
  const before=await metadataBytes(bucket,previous),after=await metadataBytes(bucket,next);
  if(!eligible(before,after))return null;
  let base:OverlayManifest,bytes:Uint8Array;
  if(isUsermetaOverlay(previous.restorePack))({base,bytes}=await baseFor(bucket,root,previous));
  else if(isLegacyOverlay(previous.restorePack)){
    const restored=await readLegacyOverlay(bucket,root,{...previous,restorePack:previous.restorePack});
    base=restored.base;bytes=restored.baseBytes;
  }
  else{
    // Anchor the exact stored bytes, rather than a reserialized warm cache.
    bytes=await readOverlayBytes(bucket,previous.manifestKey,MAX_OVERLAY_MANIFEST);base=JSON.parse(text(bytes));
    requireValue(equal(base,previous),'Stored base differs from the committed runtime manifest.');fullBase(base,root);
  }
  const cumulative=differences(base,next);if(!cumulative?.length)return null;
  const baseMetadata=equal(base.files,previous.files)?before:await metadataBytes(bucket,base);
  if(!eligible(baseMetadata,after))return null;
  return {schema:USERMETA_OVERLAY_SCHEMA,base:{revision:base.revision,manifestKey:base.manifestKey,persistedAt:base.persistedAt,sha256:await overlayHash(bytes),size:bytes.length}};
}
export async function readUsermetaOverlay(bucket:RestorePackBucket,root:string,manifest:OverlayManifest):Promise<{contents:RestorePackContents;base:OverlayManifest & {restorePack:CanonicalRestorePackMetadata};baseBytes:Uint8Array;changed:string[]}>{
  const {base,bytes:baseBytes,changed}=await baseFor(bucket,root,manifest);
  const pack=await readOverlayBytes(bucket,base.restorePack.objectKey,MAX_OVERLAY_PACK,base.restorePack.size,base.restorePack.sha256);
  const contents=await decodeCanonicalRestorePack(base.restorePack,root,inventory(base),pack);
  const before=new Map(contents.markdown.filter(x=>ALLOWED.has(x.path)||x.path===MARKER||x.path===USERS).map(x=>[x.path,x.bytes]));
  const after=new Map(before);
  for(const path of changed){const file=manifest.files.find(x=>x.path===path)!;after.set(path,await readOverlayBytes(bucket,file.objectKey,MAX_OVERLAY_METADATA,file.size,file.sha256));}
  requireValue(eligible(before,after),'Overlay changes are not native lock/session/preference maintenance.');
  contents.markdown=contents.markdown.map(file=>ALLOWED.has(file.path)?{path:file.path,bytes:after.get(file.path)!}:file);
  return {contents,base,baseBytes,changed};
}
