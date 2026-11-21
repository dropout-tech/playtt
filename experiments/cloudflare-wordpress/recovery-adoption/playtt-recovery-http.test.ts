import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createRecoveryHttpTransport } from '../scripts/playtt-recovery-http.mjs';
const sha = (b: Uint8Array | string) => createHash('sha256').update(b).digest('hex');
function fixture() {
  const bytes = Buffer.from('繁中 HTTP 復原'), digest = sha('local-plan'), item = { key: 'sites/default/markdown/objects/' + sha(bytes), bytes, sha256: sha(bytes) };
  const ptr = () => { const revision = crypto.randomUUID(); return { revision, manifestKey: 'sites/default/markdown/revisions/' + revision + '.json', persistedAt: '2026-11-21T00:00:00Z' }; };
  return { item, options: { plan: { objects: [item], pointerKey: 'sites/default/markdown/current.json', source: ptr(), target: ptr(), sourceVersion: 177, targetVersion: 178 }, digest,
    origin: 'https://fixture.invalid', operatorToken: 'local-operator-token-only', fenceToken: crypto.randomUUID() } };
}
test('client journal must finish saving before any upload HTTP request', async () => {
  const f = fixture(); let requests = 0;
  const transport = await createRecoveryHttpTransport({ ...f.options, loadOperations: async () => null,
    saveOperations: async () => { throw Error('local journal disk failed'); }, fetchImpl: async () => { requests++; return Response.json({}); } });
  await assert.rejects(transport.io.putAbsent(f.item.key, f.item.bytes), /journal disk failed/); assert.equal(requests, 0);
});
test('client registry corruption and foreign operation receipts cannot authorize owned-ticket reconciliation', async () => {
  const f = fixture(); let registry: any, calls: string[] = [], id: string;
  const first = await createRecoveryHttpTransport({ ...f.options, loadOperations: async () => null, saveOperations: async (v: any) => { registry = v; },
    fetchImpl: async (_url: string, init: RequestInit) => { const body = JSON.parse(init.body as string); id = body.operationId; return Response.json({ operationId: id, phase: 'settled', outcome: 'stored' }); } });
  await first.io.putAbsent(f.item.key, f.item.bytes);
  const corrupt = structuredClone(registry); corrupt.entries[0].binding.sha256 = 'f'.repeat(64);
  await assert.rejects(createRecoveryHttpTransport({ ...f.options, loadOperations: async () => corrupt, saveOperations: async () => {}, fetchImpl: async () => { throw Error('must not reach network'); } }));
  const second = await createRecoveryHttpTransport({ ...f.options, loadOperations: async () => registry, saveOperations: async () => {},
    fetchImpl: async (url: string) => { const path = new URL(url).pathname; calls.push(path);
      if (path === '/') return Response.json({});
      return Response.json({ operationId: id!, phase: 'confirmed', key: f.item.key, sha256: '0'.repeat(64), size: f.item.bytes.length }); } });
  await assert.rejects(second.reconcileOwnedOperations(), /Receipt differs/); assert.deepEqual(calls, ['/', '/__playtt-recovery/status']);
});
