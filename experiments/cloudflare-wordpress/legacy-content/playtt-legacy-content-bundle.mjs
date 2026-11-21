// Offline format conversion only. No Cloudflare client, pointer adoption or deployment.
import assert from 'node:assert/strict';
import {randomUUID,createHash} from 'node:crypto';
import {writeFile,access} from 'node:fs/promises';
import {resolve} from 'node:path';
import {openSnapshotBundle,exportSnapshotBundle} from './playtt-snapshot-bundle.mjs';
import {createContentOverlay,validateContentOverlay} from '../src/playtt-content-overlay.ts';
import {isCompressedContent} from '../src/playtt-compressed-content.ts';
const ROOT='sites/default',encode=v=>new TextEncoder().encode(JSON.stringify(v)),hash=b=>createHash('sha256').update(b).digest('hex');
const ordered=c=>Object.fromEntries(['markdown','uploads','wpContent'].map(g=>[g,[...c[g]].sort((a,b)=>a.path.localeCompare(b.path))]));
export async function convertToLegacyContentBundle(sourceDirectory,trustedAnchor,targetDirectory){
 const target=resolve(targetDirectory);await access(target).then(()=>{throw Error('Legacy conversion target already exists');},e=>{if(e.code!=='ENOENT')throw e;});
 const source=await openSnapshotBundle(sourceDirectory,trustedAnchor),original=source.graph;
 assert.ok(isCompressedContent(original.manifest.restorePack),'Expected verified compressed content source');
 const revision=randomUUID(),manifest={...structuredClone(original.manifest),revision,manifestKey:`${ROOT}/markdown/revisions/${revision}.json`,persistedAt:new Date().toISOString()};
 // Reuse the original immutable full base. The existing legacy implementation
 // verifies every cumulative raw replacement, <=64 changes and <=1MiB delta.
 manifest.restorePack=await createContentOverlay(source.bucket,ROOT,manifest,original.base);
 assert.ok(manifest.restorePack,'Source cannot fit legacy cumulative content limits');validateContentOverlay(manifest,ROOT);
 const bytes=encode(manifest);assert.ok(bytes.length<=256*1024,'Legacy plain manifest exceeds the bounded reader');
 const anchor={revision,manifestKey:manifest.manifestKey,persistedAt:manifest.persistedAt,manifestSha256:hash(bytes),packKey:trustedAnchor.packKey,packSha256:trustedAnchor.packSha256,packBytes:trustedAnchor.packBytes};
 const bucket={async get(key){if(key===manifest.manifestKey)return{size:bytes.length,arrayBuffer:async()=>Uint8Array.from(bytes).buffer};return source.bucket.get(key);}};
 const result=await exportSnapshotBundle(bucket,anchor,target);
 assert.equal(result.graph.format,'content-overlay');assert.equal(result.graph.manifestEncoding,'plain-json');
 assert.deepEqual(ordered(result.graph.contents),ordered(original.contents));assert.deepEqual(result.graph.contents.wpContentDeleted,original.contents.wpContentDeleted);
 // Cost model assumes the known full-base raw replicas plus the original
 // compressed dependencies are already present. It does not inspect a cloud
 // bucket, deduct allowance, adopt a pointer or account for later PHP writes.
 const known=new Set([original.base.manifestKey,original.base.restorePack.objectKey,original.anchor.manifestKey,original.manifest.restorePack.delta.objectKey,...['files','uploads','wpContent'].flatMap(k=>(original.base[k]||[]).map(f=>f.objectKey))]);
 const additions=result.graph.objects.filter(o=>!known.has(o.key)).map(o=>({key:o.key,bytes:o.size,sha256:o.sha256}));
 const pointer=Object.fromEntries(['revision','manifestKey','persistedAt'].map(k=>[k,anchor[k]]));
 const provenance={schema:'playtt/offline-legacy-content-conversion/v1',source:original.anchor,converted:anchor,sourceFormat:original.format,targetFormat:'content-overlay',baseRevision:original.base.revision,basePackReused:true,allContentBytesExact:true,manifestBytes:bytes.length,cost:{basis:'Derived base-only replica model; not actual remote inventory or billing',additions,pointerBytes:encode(pointer).length,totalBytes:additions.reduce((n,o)=>n+o.bytes,0)+encode(pointer).length,puts:additions.length+1,includesLaterNativeWrites:false},cloudRequests:0,pointerAdopted:false};
 await writeFile(target+'/legacy-conversion-provenance.json',encode(provenance),{flag:'wx'});
 return {...result,provenance};
}
