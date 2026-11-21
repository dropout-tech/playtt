import { PLAYTT_MARKDOWN_WRITE_BYTES, type MutationRetainedBytes } from './mutation-memory.js';

export const PLAYTT_MARKDOWN_WRITE_CONCURRENCY = 4;
interface File { path: string; objectKey: string; sha256: string; size: number }
interface Options {
  paths: readonly string[];
  previous: readonly File[];
  objectPrefix: string;
  validPath: (path: string) => boolean;
  limits: { files: number; fileBytes: number; totalBytes: number };
  readSizes: () => Promise<unknown>;
  readFile: (path: string) => Uint8Array;
  put: (key: string, bytes: Uint8Array) => Promise<unknown>;
  retained: Pick<MutationRetainedBytes, 'retain' | 'release'>;
}

// A single-quoted PHP literal prevents interpolation of '$', quotes, slashes
// or Unicode filenames. The result returns only stat sizes, never file bytes.
export function markdownSizeCode(root: string, paths: readonly string[]): string {
  const literal = (s: string) => "'" + s.replaceAll('\\', '\\\\').replaceAll("'", "\\'") + "'";
  return `<?php
$paths = json_decode(${literal(JSON.stringify(paths))}, true, 512, JSON_THROW_ON_ERROR);
$sizes = array();
foreach ($paths as $relative) {
    $path = ${literal(root)} . '/' . $relative;
    clearstatcache(true, $path);
    if (!is_file($path)) throw new RuntimeException('Canonical runtime file is missing.');
    $size = filesize($path);
    if (!is_int($size) || $size < 0) throw new RuntimeException('Canonical runtime file size is invalid.');
    $sizes[] = $size;
}
echo json_encode($sizes, JSON_THROW_ON_ERROR);`;
}

// Called while the canonical lease owns this PHP runtime. It performs no PHP
// mutation and never creates a manifest or promotes the canonical pointer.
export async function persistPlayttMarkdownObjects(o: Options): Promise<{ files: File[]; bytes: number; puts: number; peakActive: number; peakBytes: number }> {
  if (!Array.isArray(o.paths) || o.paths.length > o.limits.files || o.paths.some(p => typeof p !== 'string' || !o.validPath(p)) || new Set(o.paths).size !== o.paths.length) throw new Error('Invalid canonical Markdown inventory.');
  const sizes = await o.readSizes();
  if (!Array.isArray(sizes) || sizes.length !== o.paths.length || sizes.some(n => !Number.isSafeInteger(n) || n < 0 || n > o.limits.fileBytes)) throw new Error('Canonical Markdown inventory exceeds its file byte budget.');
  const bytes = sizes.reduce((sum: number, n: number) => sum + n, 0);
  if (!Number.isSafeInteger(bytes) || bytes > o.limits.totalBytes) throw new Error('Canonical Markdown inventory exceeds its total byte budget.');
  const previous = new Map(o.previous.map(f => [f.path, f])), files: File[] = new Array(o.paths.length);
  const active = new Set<Promise<void>>();
  let cursor = 0, reservedBytes = 0, puts = 0, peakActive = 0, peakBytes = 0;
  let failure: { error: unknown } | undefined;
  const start = (index: number) => {
    const path = o.paths[index], size = sizes[index];
    reservedBytes += size; peakBytes = Math.max(peakBytes, reservedBytes); peakActive = Math.max(peakActive, active.size + 1);
    const work = (async () => {
      const body = o.readFile(path);
      o.retained.retain(body.byteLength);
      try {
        if (body.byteLength !== size) throw new Error('Canonical runtime file changed during persistence.');
        const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', body as Uint8Array<ArrayBuffer>));
        const sha256 = Array.from(digest, b => b.toString(16).padStart(2, '0')).join('');
        const objectKey = `${o.objectPrefix}/${sha256}`, old = previous.get(path);
        if (old?.sha256 !== sha256 || old.size !== size) { puts++; await o.put(objectKey, body); }
        files[index] = { path, size, sha256, objectKey };
      } finally { o.retained.release(body.byteLength); }
    })().catch(error => { failure ??= { error }; }).finally(() => { reservedBytes -= size; active.delete(work); });
    active.add(work);
  };
  while (cursor < o.paths.length && !failure) {
    const size = sizes[cursor];
    // Large files are admitted alone. Small files share a fixed byte window;
    // an unchanged file still consumes its slot until hash verification ends.
    const fits = size > PLAYTT_MARKDOWN_WRITE_BYTES ? active.size === 0 : reservedBytes + size <= PLAYTT_MARKDOWN_WRITE_BYTES;
    if (active.size < PLAYTT_MARKDOWN_WRITE_CONCURRENCY && fits) start(cursor++);
    else await Promise.race(active);
  }
  // Every task handles its own failure, and all started work is drained before
  // returning or throwing. Immutable objects may remain after a failed write;
  // callers must not publish a manifest or refund already charged attempts.
  await Promise.all(active);
  if (failure) throw failure.error;
  return { files: files.sort((a, b) => a.path.localeCompare(b.path)), bytes, puts, peakActive, peakBytes };
}
