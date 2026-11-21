import assert from 'node:assert/strict';
import test from 'node:test';
import { createHash } from 'node:crypto';
import { setImmediate as turn, setTimeout as delay } from 'node:timers/promises';
import { persistPlayttMarkdownObjects } from '../src/playtt-markdown-persistence.js';
import { MutationRetainedBytes, PLAYTT_MARKDOWN_WRITE_BYTES, mutationRetentionContract } from '../src/mutation-memory.js';

const KiB = 1024, MiB = 1024 * KiB, prefix = 'sites/default/markdown/objects';
const enc = (s: string) => new TextEncoder().encode(s), sha = (b: Uint8Array) => createHash('sha256').update(b).digest('hex');
const deferred = () => { let resolve!: () => void, reject!: (e: Error) => void; const promise = new Promise<void>((a, b) => { resolve = a; reject = b; }); return { promise, resolve, reject }; };
const until = async (predicate: () => boolean) => { const deadline = Date.now() + 5000; while (!predicate() && Date.now() < deadline) await delay(1); assert.ok(predicate(), 'Boundary not reached'); };
function fixture(sizes: number[]) {
  const paths = sizes.map((_, i) => 'page/' + i + '.md'), data = new Map(paths.map((p, i) => [p, new Uint8Array(sizes[i]).fill(i + 1)]));
  const retained = new MutationRetainedBytes(), reads: string[] = [], writes: Array<{ key: string; body: Uint8Array; gate: ReturnType<typeof deferred> }> = [];
  const o = { paths, previous: [] as Array<{ path: string; sha256: string; objectKey: string; size: number }>, objectPrefix: prefix,
    validPath: (p: string) => !!p && !p.startsWith('/') && !p.includes('\\') && !p.split('/').includes('..'),
    limits: { files: 5000, fileBytes: 16 * MiB, totalBytes: 64 * MiB }, readSizes: async (): Promise<unknown> => sizes,
    readFile: (path: string) => { reads.push(path); return data.get(path)!.slice(); }, retained,
    put: async (key: string, body: Uint8Array) => { const gate = deferred(); writes.push({ key, body, gate }); await gate.promise; },
  };
  return { o, data, paths, retained, reads, writes };
}

test('native bytes, empty objects, duplicates by content, order and unchanged hashes match serial semantics', async () => {
  const f = fixture([0, 1, 1, 1]); f.data.set(f.paths[1], enc('繁中\n🙂\t')); f.data.set(f.paths[2], enc('same')); f.data.set(f.paths[3], enc('same'));
  f.o.paths = [...f.paths].reverse(); f.o.readSizes = async () => f.o.paths.map(p => f.data.get(p)!.length);
  const unchanged = f.paths[1], bytes = f.data.get(unchanged)!;
  f.o.previous.push({ path: unchanged, size: bytes.length, sha256: sha(bytes), objectKey: prefix + '/' + sha(bytes) });
  f.o.put = async (key, body) => { assert.equal(key, prefix + '/' + sha(body)); f.writes.push({ key, body: body.slice(), gate: deferred() }); };
  const r = await persistPlayttMarkdownObjects(f.o);
  assert.deepEqual(r.files, [...f.data].map(([path, b]) => ({ path, size: b.length, sha256: sha(b), objectKey: prefix + '/' + sha(b) })).sort((a, b) => a.path.localeCompare(b.path)));
  assert.equal(r.puts, 3); assert.equal(f.writes.filter(w => w.body.length === 0).length, 1); assert.equal(f.writes.filter(w => sha(w.body) === sha(enc('same'))).length, 2);
  assert.equal(f.retained.current, 0);
});

test('four writes overlap while copied bytes stay within1MiB, including reverse completion', async () => {
  const f = fixture(Array(12).fill(256 * KiB)); let returned = false;
  const pending = persistPlayttMarkdownObjects(f.o).then(r => { returned = true; return r; });
  for (let batch = 0; batch < 3; batch++) {
    await until(() => f.writes.length === 4 * (batch + 1)); assert.equal(f.reads.length, f.writes.length); assert.equal(f.retained.current, MiB); assert.equal(returned, false);
    for (const w of f.writes.slice(batch * 4, (batch + 1) * 4).reverse()) w.gate.resolve();
  }
  const r = await pending; assert.equal(r.peakActive, 4); assert.equal(r.peakBytes, MiB); assert.equal(f.retained.peak, MiB); assert.equal(f.retained.current, 0); assert.equal(r.puts, 12);
});

test('byte admission limits uneven files independently from the four-slot limit', async () => {
  const f = fixture([600 * KiB, 400 * KiB, 100 * KiB]); const pending = persistPlayttMarkdownObjects(f.o);
  await until(() => f.writes.length === 2); assert.equal(f.reads.length, 2); assert.equal(f.retained.current, 1000 * KiB);
  const first = f.writes.find(w => w.body.length === 600 * KiB)!; first.gate.resolve();
  await until(() => f.writes.length === 3); assert.equal(f.retained.current, 500 * KiB);
  for (const w of f.writes) w.gate.resolve(); const r = await pending;
  assert.ok(r.peakBytes <= PLAYTT_MARKDOWN_WRITE_BYTES); assert.equal(f.retained.current, 0);
});

test('a16MiB file waits for every small write, runs alone, then releases its memory', async () => {
  const f = fixture([128 * KiB, 128 * KiB, 16 * MiB, 32 * KiB]); const pending = persistPlayttMarkdownObjects(f.o);
  await until(() => f.writes.length === 2); assert.equal(f.reads.length, 2);
  f.writes[0].gate.resolve(); for (let i = 0; i < 10; i++) await turn(); assert.equal(f.reads.length, 2);
  f.writes[1].gate.resolve(); await until(() => f.writes.length === 3); assert.equal(f.retained.current, 16 * MiB); assert.equal(f.reads.length, 3);
  f.writes[2].gate.resolve(); await until(() => f.writes.length === 4); assert.equal(f.retained.current, 32 * KiB); f.writes[3].gate.resolve();
  const r = await pending; assert.equal(r.peakBytes, 16 * MiB); assert.equal(f.retained.peak, 16 * MiB); assert.equal(f.retained.current, 0);
});

test('put failure stops new work, drains every in-flight write and never returns a partial manifest', async () => {
  const f = fixture(Array(12).fill(32 * KiB)); let settled = false, promoted = false;
  const pending = persistPlayttMarkdownObjects(f.o).then(() => { promoted = true; return null; }, e => e).finally(() => { settled = true; });
  await until(() => f.writes.length === 4); f.writes[0].gate.reject(Error('Injected storage rejection'));
  await until(() => f.retained.current === 3 * 32 * KiB); assert.equal(settled, false); assert.equal(f.reads.length, 4);
  for (const w of f.writes.slice(1)) w.gate.resolve(); assert.match((await pending).message, /Injected storage rejection/);
  assert.equal(promoted, false); assert.equal(f.retained.current, 0); assert.equal(f.reads.length, 4);
  for (let i = 0; i < 10; i++) await turn(); assert.equal(f.reads.length, 4);
});

test('file growth after stat fails before its put and drains already scheduled writes', async () => {
  const f = fixture(Array(8).fill(1024)); f.data.set(f.paths[0], new Uint8Array(1025)); let settled = false;
  const pending = persistPlayttMarkdownObjects(f.o).then(() => null, e => e).finally(() => { settled = true; });
  await until(() => f.writes.length === 3); assert.equal(f.reads.length, 4); assert.equal(settled, false);
  for (const w of f.writes) w.gate.resolve(); assert.match((await pending).message, /changed during persistence/); assert.equal(f.retained.current, 0); assert.equal(f.reads.length, 4);
});

test('synchronous filesystem failure is contained until other scheduled writes finish', async () => {
  const f = fixture(Array(8).fill(1024)), read = f.o.readFile; f.o.readFile = p => { if (p === f.paths[1]) { f.reads.push(p); throw Error('Missing file'); } return read(p); };
  let settled = false; const pending = persistPlayttMarkdownObjects(f.o).then(() => null, e => e).finally(() => { settled = true; });
  await until(() => f.writes.length === 3); assert.equal(settled, false); assert.equal(f.reads.length, 4);
  for (const w of f.writes) w.gate.resolve(); assert.match((await pending).message, /Missing file/); assert.equal(f.retained.current, 0);
});

test('invalid path/count/size inventories fail before copying bytes or writing objects', async () => {
  const variants = [
    (f: ReturnType<typeof fixture>) => { f.o.paths = ['../escape', f.paths[1]]; },
    (f: ReturnType<typeof fixture>) => { f.o.paths = [f.paths[0], f.paths[0]]; },
    (f: ReturnType<typeof fixture>) => { f.o.limits.files = 1; },
    (f: ReturnType<typeof fixture>) => { f.o.readSizes = async () => [1]; },
    (f: ReturnType<typeof fixture>) => { f.o.readSizes = async () => [-1, 1]; },
    (f: ReturnType<typeof fixture>) => { f.o.readSizes = async () => [1.5, 1]; },
    (f: ReturnType<typeof fixture>) => { f.o.readSizes = async () => [16 * MiB + 1, 1]; },
    (f: ReturnType<typeof fixture>) => { f.o.limits.totalBytes = 1; },
    (f: ReturnType<typeof fixture>) => { f.o.readSizes = async () => { throw Error('stat failed'); }; },
  ];
  for (const change of variants) { const f = fixture([1, 1]); change(f); await assert.rejects(persistPlayttMarkdownObjects(f.o)); assert.equal(f.reads.length, 0); assert.equal(f.writes.length, 0); assert.equal(f.retained.current, 0); }
});

test('all unchanged and empty inventories write nothing but still verify exact hashes', async () => {
  for (const sizes of [[], [0, 64, 128]]) {
    const f = fixture(sizes); f.o.previous = [...f.data].map(([path, body]) => ({ path, size: body.length, sha256: sha(body), objectKey: prefix + '/' + sha(body) }));
    const r = await persistPlayttMarkdownObjects(f.o); assert.equal(r.puts, 0); assert.equal(f.writes.length, 0); assert.equal(f.reads.length, sizes.length); assert.equal(f.retained.current, 0);
  }
});

test('retained-byte estimate includes the small-file window and a single large file', () => {
  const shape = { responseBytes: 0, markdownBytes: 2 * MiB, uploadBytes: 0, wpContentBytes: 0, largestChangedFileBytes: 64 * KiB };
  assert.equal(mutationRetentionContract(shape).incrementalPeakBytes, MiB);
  assert.equal(mutationRetentionContract({ ...shape, markdownBytes: 128 * KiB }).incrementalPeakBytes, 128 * KiB);
  assert.equal(mutationRetentionContract({ ...shape, largestChangedFileBytes: 16 * MiB }).incrementalPeakBytes, 16 * MiB);
});
