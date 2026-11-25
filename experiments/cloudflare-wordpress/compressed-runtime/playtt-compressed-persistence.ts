import {validateCanonicalRestorePackMetadata, type RestorePackBucket, type CanonicalRestorePackFile} from './canonical-restore-pack.js';
import {validatePlayttSnapshotSources, type PlayttSnapshotRuntimeReader} from './playtt-snapshot-source.js';
import {isMetadataOverlay, validateMetadataOverlay, type OverlayManifest} from './playtt-maintenance-overlay.js';
import {readContentBytes} from './playtt-content-overlay.js';
import {createCompressedContent, validateCompressedContent, MAX_COMPRESSED_BASE, MAX_COMPRESSED_MANIFEST} from './playtt-compressed-content.js';

const encode=(v:unknown)=>new TextEncoder().encode(JSON.stringify(v));
const parse=(b:Uint8Array)=>JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(b));
const sha=async(b:Uint8Array)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',b as Uint8Array<ArrayBuffer>)),v=>v.toString(16).padStart(2,'0')).join('');
const inventory=(m:OverlayManifest)=>({markdown:m.files,uploads:m.uploads||[],wpContent:m.wpContent||[],wpContentDeleted:m.wpContentDeleted||[]});
const total=(m:OverlayManifest)=>[m.files,m.uploads||[],m.wpContent||[]].flat().reduce((n,f)=>n+f.size,0);

// The canonical lease supplies a fully restored runtime and its committed
// manifest. Bind that manifest to its actual stored representation on every
// save; resolve exactly one full base, never an overlay chain. Cold reads and
// backup verification validate the base ZIP and all delta bytes independently.
export async function prepareCompressedContent(bucket:RestorePackBucket,root:string,next:OverlayManifest,previous:OverlayManifest,readRuntime:PlayttSnapshotRuntimeReader){
  validatePlayttSnapshotSources(root,next);validatePlayttSnapshotSources(root,previous);
  if(!previous.restorePack||encode(previous).length>MAX_COMPRESSED_MANIFEST||total(next)>MAX_COMPRESSED_BASE)return null;
  const stored=await readContentBytes(bucket,previous.manifestKey,MAX_COMPRESSED_MANIFEST);
  if(JSON.stringify(parse(stored))!==JSON.stringify(previous))throw new Error('Stored previous manifest differs from the committed runtime manifest.');
  let base=previous;
  if(isMetadataOverlay(previous.restorePack)){
    validateMetadataOverlay(previous,root);
    const ref=previous.restorePack.base;
    base=parse(await readContentBytes(bucket,ref.manifestKey,MAX_COMPRESSED_MANIFEST,ref.size,ref.sha256));
    if(base.revision!==ref.revision||base.manifestKey!==ref.manifestKey||base.persistedAt!==ref.persistedAt)throw new Error('Compressed full base identity differs.');
  }
  validatePlayttSnapshotSources(root,base);
  validateCanonicalRestorePackMetadata(base.restorePack,root,inventory(base));
  if(base.restorePack.size>MAX_COMPRESSED_BASE||base.restorePack.decodedBytes>MAX_COMPRESSED_BASE||total(base)>MAX_COMPRESSED_BASE)return null;
  const encoded=await createCompressedContent(bucket,root,next,base,readRuntime);
  if(!encoded||encode({...next,restorePack:encoded.descriptor}).length>MAX_COMPRESSED_MANIFEST)return null;
  validateCompressedContent({...next,restorePack:encoded.descriptor},root);
  return encoded;
}

// A compressed snapshot deliberately omits raw Markdown replicas. When the
// writer is disabled or exceeds its bounds, materialize every missing replica
// before the existing full-pack writer reads it. Never assume an unchanged
// hash has a corresponding raw object; verify an existing object as well.
export async function persistCompressedFallbackMarkdown(bucket:RestorePackBucket,root:string,files:CanonicalRestorePackFile[],readRuntime:PlayttSnapshotRuntimeReader,put:(key:string,bytes:Uint8Array)=>Promise<void>){
  validatePlayttSnapshotSources(root,{files});
  let puts=0;
  for(const file of files){
    const existing=await bucket.get(file.objectKey);
    if(existing){
      if(existing.size!==file.size)throw new Error('Compressed fallback object size differs.');
      const bytes=await readContentBytes({get:async()=>existing},file.objectKey,file.size,file.size,file.sha256);
      if(bytes.length!==file.size)throw new Error('Compressed fallback object differs.');
      continue;
    }
    const bytes=Uint8Array.from(readRuntime('markdown',file.path));
    if(bytes.length!==file.size||await sha(bytes)!==file.sha256)throw new Error('Compressed fallback runtime bytes differ.');
    await put(file.objectKey,bytes);puts++;
  }
  return {puts};
}
