import type { MutationRetainedBytes } from './mutation-memory.js';

export const PLAYTT_CANONICAL_WRITE_CONCURRENCY = 3;
export const PLAYTT_CANONICAL_WRITE_BUFFER_BYTES = 1024 * 1024;

interface CanonicalFile { path: string; objectKey: string; sha256: string; size: number }
interface WriteOptions {
  paths: string[];
  current: CanonicalFile[];
  objectPrefix: string;
  readFile(path: string): Uint8Array;
  put(key: string, bytes: Uint8Array): Promise<unknown>;
  retained: MutationRetainedBytes;
  maxFileBytes: number;
  maxTotalBytes: number;
}

// Keep at most three immutable writes and 1 MiB of their source buffers in
// flight. A larger file drains the queue and writes alone. The next copied file
// may coexist with the queue until its size is known, so the bound is one file
// plus 1 MiB, not a copy of the entire canonical tree.
export async function persistPlayttCanonicalFiles(options: WriteOptions): Promise<{ files: CanonicalFile[]; bytes: number }> {
  const current = new Map(options.current.map(file => [file.path, file]));
  const files: CanonicalFile[] = [];
  const pending = new Set<Promise<void>>();
  const writing = new Map<string, Promise<void>>();
  const written = new Set<string>();
  let queuedBytes = 0, totalBytes = 0, failed = false, failure: unknown;
  const recordFailure = (error: unknown) => { if (!failed) { failed = true; failure = error; } };
  const check = () => { if (failed) throw failure; };
  const drain = async () => { await Promise.all([...pending]); check(); };

  try {
    for (const path of options.paths) {
      check();
      while (pending.size >= PLAYTT_CANONICAL_WRITE_CONCURRENCY) { await Promise.race(pending); check(); }
      const bytes = options.readFile(path);
      options.retained.retain(bytes.byteLength);
      let transferred = false;
      try {
        totalBytes += bytes.byteLength;
        if (bytes.byteLength > options.maxFileBytes || totalBytes > options.maxTotalBytes) throw new Error('Canonical Markdown inventory exceeds its byte budget.');
        const digest = await crypto.subtle.digest('SHA-256', bytes as Uint8Array<ArrayBuffer>);
        const sha256 = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
        check();
        const objectKey = `${options.objectPrefix}/${sha256}`;
        const existing = current.get(path);
        files.push({ path, objectKey, sha256, size: bytes.byteLength });
        if ((existing?.sha256 === sha256 && existing.size === bytes.byteLength) || written.has(objectKey)) continue;
        const duplicate = writing.get(objectKey);
        if (duplicate) { await duplicate; check(); continue; }

        if (bytes.byteLength > PLAYTT_CANONICAL_WRITE_BUFFER_BYTES) {
          await drain();
          await options.put(objectKey, bytes);
          written.add(objectKey);
        } else {
          while (pending.size >= PLAYTT_CANONICAL_WRITE_CONCURRENCY || queuedBytes + bytes.byteLength > PLAYTT_CANONICAL_WRITE_BUFFER_BYTES) {
            await Promise.race(pending); check();
          }
          check();
          queuedBytes += bytes.byteLength;
          transferred = true;
          // Start in a microtask so even a synchronous put failure uses the same
          // cleanup path. Rejections are consumed immediately, never detached.
          let task: Promise<void>;
          task = Promise.resolve().then(() => options.put(objectKey, bytes)).then(() => { written.add(objectKey); }).catch(recordFailure).finally(() => {
            queuedBytes -= bytes.byteLength;
            options.retained.release(bytes.byteLength);
            pending.delete(task); writing.delete(objectKey);
          });
          pending.add(task); writing.set(objectKey, task);
        }
      } finally {
        if (!transferred) options.retained.release(bytes.byteLength);
      }
    }
    await drain();
    return { files: files.sort((a, b) => a.path.localeCompare(b.path)), bytes: totalBytes };
  } catch (error) {
    recordFailure(error);
    // Lease abort/runtime disposal must not race an outstanding R2 write.
    await Promise.all([...pending]);
    throw failure;
  }
}
