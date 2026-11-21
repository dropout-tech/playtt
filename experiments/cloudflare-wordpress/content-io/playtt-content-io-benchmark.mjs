// LOCAL ONLY: fixed backup126 and a hash-pinned prior reader; no cloud calls.
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdtemp } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import { build } from 'esbuild';
import { openSnapshotBundle } from './playtt-snapshot-bundle.mjs';
assert.deepEqual(process.argv.slice(2), ['--local']);
const runtime = resolve(import.meta.dirname, '..'), sha = b => createHash('sha256').update(b).digest('hex');
const owner = JSON.parse(await readFile('artifacts/playtt-content-provider-backup-owned-private.json', 'utf8'));
assert.equal(owner.phase, 'verified'); assert.equal(owner.anchor.revision, 'c7933a7c-c54e-4dc7-8a01-7888418761e8');
const baselinePath = resolve(runtime, '../../../playtt-content-provider-assembly/packages/runtime-cloudflare/src/playtt-content-overlay.ts');
const before = (await readFile(baselinePath, 'utf8')).replace(/\r\n/g, '\n');
assert.equal(sha(before), '367b2f462edf85f1ec0b8666538f90d896f3328a4e94ab8dc3f9475b28f188fc');
const after = (await readFile(join(runtime, 'src/playtt-content-overlay.ts'), 'utf8')).replace(/\r\n/g, '\n');
const directory = await mkdtemp(join(runtime, 'artifacts/content-io-benchmark-'));
const modules = {};
for (const [name, source] of [['serial', before], ['bounded', after]]) {
  const outfile = join(directory, name + '.mjs');
  await build({ stdin: { contents: source, loader: 'ts', sourcefile: name + '.ts', resolveDir: join(runtime, 'src') }, outfile, bundle: true, format: 'esm', platform: 'node', packages: 'external', target: 'es2022', logLevel: 'silent' });
  modules[name] = await import(pathToFileURL(outfile).href);
}
const { graph } = await openSnapshotBundle(owner.directory + '/independent', owner.anchor);
const data = new Map(graph.objects.map(o => [o.key, o.bytes]));
const runs = [];
for (const latencyMs of [0, 25]) for (let round = 0; round < 3; round++) for (const phase of ['verify', 'restore']) {
  for (const name of round % 2 ? ['bounded', 'serial'] : ['serial', 'bounded']) {
    let active = 0, peak = 0, activeBytes = 0, peakActiveBytes = 0, calls = 0, bytesRead = 0;
    const bucket = { async get(key) {
      const bytes = data.get(key); assert.ok(bytes, 'Missing fixed local dependency'); calls++; active++; activeBytes += bytes.length;
      peak = Math.max(peak, active); peakActiveBytes = Math.max(peakActiveBytes, activeBytes);
      if (latencyMs) await delay(latencyMs);
      return { size: bytes.length, arrayBuffer: async () => {
        try { bytesRead += bytes.length; return Uint8Array.from(bytes).buffer; }
        finally { active--; activeBytes -= bytes.length; }
      } };
    } };
    const start = performance.now();
    const result = phase === 'verify'
      ? await modules[name].createContentOverlay(bucket, 'sites/default', graph.manifest, graph.manifest)
      : await modules[name].readContentOverlay(bucket, 'sites/default', graph.manifest);
    const durationMs = Math.round((performance.now() - start) * 100) / 100;
    if (phase === 'verify') assert.deepEqual(result, graph.manifest.restorePack);
    else assert.deepEqual(result.contents, graph.contents);
    assert.equal(active, 0); assert.equal(activeBytes, 0); assert.equal(peak, name === 'serial' ? 1 : 4);
    runs.push({ latencyMs, round, phase, implementation: name, durationMs, calls, bytesRead, peakActiveReads: peak, peakDeclaredActiveBytes: peakActiveBytes });
  }
}
for (let i = 0; i < runs.length; i += 2) {
  assert.equal(runs[i].calls, runs[i + 1].calls); assert.equal(runs[i].bytesRead, runs[i + 1].bytesRead);
}
const medians = [];
for (const latencyMs of [0, 25]) for (const phase of ['verify', 'restore']) for (const implementation of ['serial', 'bounded']) {
  const times = runs.filter(r => r.latencyMs === latencyMs && r.phase === phase && r.implementation === implementation).map(r => r.durationMs).sort((a, b) => a - b);
  medians.push({ latencyMs, phase, implementation, medianMs: times[1] });
}
const report = { at: new Date().toISOString(), result: 'pass', scope: 'Offline fixed backup126, identical object bytes and GET counts; injected delay is synthetic, not provider latency or billing', baselineRevision: owner.anchor.revision, baselineSourceSha256: sha(before), candidateSourceSha256: sha(after), completeContentsExact: true, writerDescriptorExact: true, allStartedReadsDrained: true, networkRequests: 0, wholeIsolateMemoryMeasured: false, runs, medians };
await writeFile('artifacts/playtt-content-io-benchmark.json', JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ result: report.result, runs: runs.length, medians }));
