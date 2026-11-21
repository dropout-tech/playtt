// Optional byte-exact storage format, not a WordPress mutation/authorization
// policy. The canonical adapter still validates changes before persistence.
import { decodeCanonicalRestorePack, validateCanonicalRestorePackMetadata, type CanonicalRestorePackMetadata, type CanonicalRestorePackFile, type RestorePackBucket, type RestorePackContents } from './canonical-restore-pack.js';
import { validatePlayttSnapshotSources, type PlayttSnapshotManifest } from './playtt-snapshot-source.js';
import * as v1 from './playtt-metadata-overlay.js';
import * as v2 from './playtt-usermeta-overlay.js';
import type { MarkdownPointer } from './revision-coordinator.js';

export const CONTENT_OVERLAY_SCHEMA = 'playtt/canonical-content-overlay/v1';
export const MAX_CONTENT_DELTA_BYTES = 1024 * 1024;
export const MAX_CONTENT_DELTA_FILES = 64;
const { MAX_OVERLAY_MANIFEST, MAX_OVERLAY_PACK, overlayHash } = v1;
const groups = ['markdown', 'uploads', 'wpContent'] as const;
type Group = typeof groups[number];
const filesOf = (m: PlayttSnapshotManifest, g: Group) => g === 'markdown' ? m.files : m[g] || [];
const inventory = (m: PlayttSnapshotManifest) => ({ markdown: m.files, uploads: m.uploads || [], wpContent: m.wpContent || [], wpContentDeleted: m.wpContentDeleted || [] });
const equal = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
const parse = (b: Uint8Array) => JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(b));
function requireValue(v: unknown, message = 'Invalid content overlay.'): asserts v { if (!v) throw new Error(message); }
export interface PlayttContentOverlay {
  schema: typeof CONTENT_OVERLAY_SCHEMA;
  base: MarkdownPointer & { sha256: string; size: number };
}
export interface OverlayManifest extends PlayttSnapshotManifest, MarkdownPointer {
  restorePack?: CanonicalRestorePackMetadata | v1.PlayttMetadataOverlay | v2.PlayttUsermetaOverlay | PlayttContentOverlay;
}
type FullManifest = OverlayManifest & { restorePack: CanonicalRestorePackMetadata };
export const isContentOverlay = (v: unknown): v is PlayttContentOverlay => !!v && typeof v === 'object' && (v as PlayttContentOverlay).schema === CONTENT_OVERLAY_SCHEMA;
function identity(m: MarkdownPointer, root: string): void {
  requireValue(m && /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/.test(m.revision)
    && m.manifestKey === `${root}/markdown/revisions/${m.revision}.json`
    && typeof m.persistedAt === 'string' && /(?:Z|[+-]\d\d:\d\d)$/.test(m.persistedAt) && Number.isFinite(Date.parse(m.persistedAt)));
}
function validateInventory(m: PlayttSnapshotManifest, root: string): void {
  validatePlayttSnapshotSources(root, m);
  const deleted = m.wpContentDeleted || [];
  requireValue(Array.isArray(deleted) && deleted.length <= 5000);
  const present = new Set((m.wpContent || []).map(f => f.path));
  for (let i = 0; i < deleted.length; i++) {
    const path = deleted[i];
    requireValue(typeof path === 'string' && /^(plugins|themes|languages|mu-plugins)\//.test(path)
      && !path.includes('\\') && !path.includes('\0') && !path.split('/').some(p => !p || p === '.' || p === '..')
      && (i === 0 || deleted[i - 1] < path) && !present.has(path), 'Invalid content overlay tombstones.');
  }
}
export function validateContentOverlay(m: OverlayManifest, root: string): void {
  validateInventory(m, root); identity(m, root);
  const overlay = m.restorePack; requireValue(isContentOverlay(overlay));
  requireValue(Object.keys(overlay).sort().join(',') === 'base,schema'); identity(overlay.base, root);
  requireValue(Object.keys(overlay.base).sort().join(',') === 'manifestKey,persistedAt,revision,sha256,size'
    && overlay.base.revision !== m.revision && /^[a-f0-9]{64}$/.test(overlay.base.sha256)
    && Number.isSafeInteger(overlay.base.size) && overlay.base.size > 0 && overlay.base.size <= MAX_OVERLAY_MANIFEST);
}

// Also accepts a verified zero-byte content object. Legacy v1/v2 readers keep
// their original stricter dependency reader unchanged.
export async function readContentBytes(bucket: RestorePackBucket, key: string, limit: number, size?: number, hash?: string): Promise<Uint8Array> {
  const object = await bucket.get(key);
  requireValue(object && Number.isSafeInteger(object.size) && object.size >= 0 && object.size <= limit && (size === undefined || size === object.size), 'Missing or oversized content dependency.');
  const body = (object as typeof object & { body?: ReadableStream<Uint8Array> }).body;
  let bytes: Uint8Array;
  if (body) {
    const reader = body.getReader(), chunks: Uint8Array[] = []; let length = 0;
    try {
      for (;;) { const item = await reader.read(); if (item.done) break; length += item.value.byteLength; requireValue(length <= object.size && length <= limit, 'Content dependency exceeded declared size.'); chunks.push(item.value); }
    } catch (error) { await reader.cancel().catch(() => undefined); throw error; } finally { reader.releaseLock(); }
    bytes = new Uint8Array(length); let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  } else bytes = new Uint8Array(await object.arrayBuffer());
  requireValue(bytes.length === object.size, 'Content dependency length mismatch.');
  if (hash !== undefined) requireValue(await overlayHash(bytes) === hash, 'Content dependency hash mismatch.');
  return bytes;
}
function fullBase(m: OverlayManifest, root: string): asserts m is FullManifest {
  validateInventory(m, root); identity(m, root);
  requireValue(!isContentOverlay(m.restorePack) && !v1.isMetadataOverlay(m.restorePack) && !v2.isUsermetaOverlay(m.restorePack), 'Overlay chains are forbidden.');
  validateCanonicalRestorePackMetadata(m.restorePack, root, inventory(m));
  requireValue(m.restorePack.size <= MAX_OVERLAY_PACK && m.restorePack.decodedBytes <= MAX_OVERLAY_PACK, 'Content overlay base exceeds its budget.');
}
const sameFile = (a: CanonicalRestorePackFile | undefined, b: CanonicalRestorePackFile) => a?.sha256 === b.sha256 && a.size === b.size;
function delta(base: PlayttSnapshotManifest, next: PlayttSnapshotManifest) {
  const replacements: Array<{ group: Group; file: CanonicalRestorePackFile }> = [];
  let changes = 0, bytes = 0, finalBytes = 0;
  for (const group of groups) {
    const old = new Map(filesOf(base, group).map(f => [f.path, f]));
    for (const file of filesOf(next, group)) {
      finalBytes += file.size;
      if (!sameFile(old.get(file.path), file)) { replacements.push({ group, file }); changes++; bytes += file.size; }
      old.delete(file.path);
    }
    changes += old.size; // Deletions consume the same bounded delta allowance.
  }
  const a = new Set(base.wpContentDeleted || []), b = new Set(next.wpContentDeleted || []);
  changes += [...a].filter(p => !b.has(p)).length + [...b].filter(p => !a.has(p)).length;
  return { replacements, changes, bytes, eligible: changes <= MAX_CONTENT_DELTA_FILES && bytes <= MAX_CONTENT_DELTA_BYTES && finalBytes <= MAX_OVERLAY_PACK };
}
async function baseFor(bucket: RestorePackBucket, root: string, manifest: OverlayManifest) {
  validateContentOverlay(manifest, root); const descriptor = manifest.restorePack as PlayttContentOverlay;
  const baseBytes = await readContentBytes(bucket, descriptor.base.manifestKey, MAX_OVERLAY_MANIFEST, descriptor.base.size, descriptor.base.sha256);
  const base = parse(baseBytes) as OverlayManifest; fullBase(base, root);
  requireValue(base.revision === descriptor.base.revision && base.manifestKey === descriptor.base.manifestKey && base.persistedAt === descriptor.base.persistedAt, 'Content overlay base identity mismatch.');
  const changes = delta(base, manifest); requireValue(changes.eligible, 'Content overlay exceeds its cumulative budget.');
  return { base, baseBytes, changes };
}
export async function createContentOverlay(bucket: RestorePackBucket, root: string, next: PlayttSnapshotManifest, previous: OverlayManifest): Promise<PlayttContentOverlay | null> {
  validateInventory(next, root); validateInventory(previous, root); identity(previous, root);
  if (!previous.restorePack || !delta(previous, next).eligible) return null;
  // Bind the actual committed representation, not only a reserialized cache.
  const stored = await readContentBytes(bucket, previous.manifestKey, MAX_OVERLAY_MANIFEST);
  requireValue(equal(parse(stored), previous), 'Stored previous manifest differs from the committed runtime manifest.');
  let base: FullManifest, baseBytes: Uint8Array;
  if (isContentOverlay(previous.restorePack)) ({ base, baseBytes } = await baseFor(bucket, root, previous));
  else if (v2.isUsermetaOverlay(previous.restorePack)) ({ base, baseBytes } = await v2.readUsermetaOverlay(bucket, root, previous as v2.OverlayManifest));
  else if (v1.isMetadataOverlay(previous.restorePack)) ({ base, baseBytes } = await v1.readMetadataOverlay(bucket, root, previous as v1.OverlayManifest));
  else {
    validateCanonicalRestorePackMetadata(previous.restorePack, root, inventory(previous));
    if (previous.restorePack.size > MAX_OVERLAY_PACK || previous.restorePack.decodedBytes > MAX_OVERLAY_PACK) return null;
    fullBase(previous, root); base = previous; baseBytes = stored;
  }
  const changes = delta(base, next); if (!changes.eligible) return null;
  // Verify every cumulative replacement; do not retain buffers across writes.
  // The immutable full archive is checked on cold restore/pin, not redownloaded
  // on every save. No overlay may reference a second overlay.
  for (const { file } of changes.replacements) await readContentBytes(bucket, file.objectKey, MAX_CONTENT_DELTA_BYTES, file.size, file.sha256);
  return { schema: CONTENT_OVERLAY_SCHEMA, base: { revision: base.revision, manifestKey: base.manifestKey, persistedAt: base.persistedAt, sha256: await overlayHash(baseBytes), size: baseBytes.length } };
}
export async function readContentOverlay(bucket: RestorePackBucket, root: string, manifest: OverlayManifest): Promise<{ contents: RestorePackContents; base: FullManifest; baseBytes: Uint8Array; changed: string[] }> {
  const { base, baseBytes, changes } = await baseFor(bucket, root, manifest);
  const pack = await readContentBytes(bucket, base.restorePack.objectKey, MAX_OVERLAY_PACK, base.restorePack.size, base.restorePack.sha256);
  const contents = await decodeCanonicalRestorePack(base.restorePack, root, inventory(base), pack);
  for (const group of groups) {
    const metadata = new Map(filesOf(base, group).map(f => [f.path, f])), decoded = new Map(contents[group].map(f => [f.path, f.bytes]));
    const current: RestorePackContents[Group] = [];
    for (const file of filesOf(manifest, group)) current.push({ path: file.path, bytes: sameFile(metadata.get(file.path), file) ? decoded.get(file.path)! : await readContentBytes(bucket, file.objectKey, MAX_CONTENT_DELTA_BYTES, file.size, file.sha256) });
    contents[group] = current;
  }
  contents.wpContentDeleted = [...(manifest.wpContentDeleted || [])];
  return { contents, base, baseBytes, changed: changes.replacements.map(({ group, file }) => `${group}/${file.path}`) };
}
