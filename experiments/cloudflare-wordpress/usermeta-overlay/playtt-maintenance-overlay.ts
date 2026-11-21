// Readers understand both formats; writer selection is explicit. The legacy
// module is unchanged, so a v1-only reader still rejects every v2 descriptor.
import * as v1 from './playtt-metadata-overlay.js';
import * as v2 from './playtt-usermeta-overlay.js';
import type { RestorePackBucket } from './canonical-restore-pack.js';
import type { PlayttSnapshotManifest } from './playtt-snapshot-source.js';
export { readOverlayBytes, MAX_OVERLAY_MANIFEST, MAX_OVERLAY_PACK } from './playtt-metadata-overlay.js';
export type PlayttMetadataOverlay = v1.PlayttMetadataOverlay | v2.PlayttUsermetaOverlay;
export type OverlayManifest = v2.OverlayManifest;
export const isMetadataOverlay = (value:unknown):value is PlayttMetadataOverlay => v1.isMetadataOverlay(value)||v2.isUsermetaOverlay(value);
export function validateMetadataOverlay(manifest:OverlayManifest,root:string):void{
  if(v2.isUsermetaOverlay(manifest.restorePack))v2.validateUsermetaOverlay(manifest,root);
  else v1.validateMetadataOverlay(manifest as v1.OverlayManifest,root);
}
export function readMetadataOverlay(bucket:RestorePackBucket,root:string,manifest:OverlayManifest){
  return v2.isUsermetaOverlay(manifest.restorePack)?v2.readUsermetaOverlay(bucket,root,manifest):v1.readMetadataOverlay(bucket,root,manifest as v1.OverlayManifest);
}
export function createMetadataOverlay(bucket:RestorePackBucket,root:string,next:PlayttSnapshotManifest,previous:OverlayManifest,version:'v1'|'v2'='v1'){
  if(version==='v2')return v2.createUsermetaOverlay(bucket,root,next,previous);
  // A compatible reader with the writer disabled/downgraded may materialize a
  // full snapshot. It must never pass a v2 descriptor through the v1 validator.
  if(v2.isUsermetaOverlay(previous.restorePack))return Promise.resolve(null);
  return v1.createMetadataOverlay(bucket,root,next,previous as v1.OverlayManifest);
}
