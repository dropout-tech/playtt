import test from 'node:test';
import assert from 'node:assert/strict';
import { recoveryFixture, upload } from './helpers/playtt-recovery-fixture.js';

test('exact retry and concurrent same-id requests preserve one charge and one R2 put after restart', async () => {
  const f = await recoveryFixture(), item = upload();
  const results = await Promise.all([f.call('object', item), f.call('object', item)]);
  for (const r of results) { assert.equal(r.status, 200); assert.equal((await r.json() as any).phase, 'settled'); }
  f.restart(); const recovered = await f.receipt(item.operationId);
  assert.equal(recovered.outcome, 'stored'); assert.equal('ticket' in recovered, false);
  assert.equal((await f.call('object', item)).status, 200);
  assert.deepEqual(f.data.get(item.key), Uint8Array.from(Buffer.from(item.base64, 'base64')));
  const s = await f.status(); assert.equal(s.chargedPuts, 1); assert.equal(s.chargedBytes, item.size); assert.equal(s.writeTracking.pending, 0); assert.equal(f.counts().puts, 1);
});
test('durable confirmed receipt reconciles after settlement failure without replaying R2, even after window close', async () => {
  const f = await recoveryFixture(), item = upload(); f.fail('settled');
  assert.equal((await f.call('object', item)).status, 503); assert.equal((await f.receipt(item.operationId)).phase, 'confirmed');
  assert.equal((await f.status()).writeTracking.pending, 1);
  await f.internal('/window/close', { token: f.window }); f.restart();
  const r = await f.call('reconcile', { operationId: item.operationId }); assert.equal(r.status, 200);
  assert.equal((await r.json() as any).outcome, 'stored'); assert.equal((await f.status()).writeTracking.pending, 0); assert.equal(f.counts().puts, 1);
  assert.equal((await f.call('reconcile', { operationId: item.operationId })).status, 200);
});
test('reserved receipt proves no dispatch and can settle without refund after restart', async () => {
  const f = await recoveryFixture(), item = upload(); f.fail('dispatching');
  assert.equal((await f.call('object', item)).status, 503); f.restart();
  assert.equal((await f.receipt(item.operationId)).phase, 'reserved'); assert.equal(f.counts().puts, 0);
  const r = await f.call('reconcile', { operationId: item.operationId }); assert.equal(r.status, 200);
  assert.equal((await r.json() as any).outcome, 'not-dispatched'); assert.equal((await f.status()).chargedBytes, item.size); assert.equal((await f.status()).writeTracking.pending, 0);
  await f.call('object', item); assert.equal(f.counts().puts, 0);
});
for (const mode of ['raw-r2', 'dispatch-receipt-ack', 'completion-receipt-before'] as const) {
  test(mode + ' stays pending and cannot infer completion from an object or restart', async () => {
    const f = await recoveryFixture(), item = upload();
    if (mode === 'raw-r2') f.unknown();
    else f.fail(mode === 'dispatch-receipt-ack' ? 'dispatching' : 'confirmed', mode === 'dispatch-receipt-ack');
    assert.ok([409, 503].includes((await f.call('object', item)).status)); f.restart();
    assert.equal((await f.status()).writeTracking.pending, 1);
    assert.equal((await f.call('reconcile', { operationId: item.operationId })).status, 409);
    assert.equal((await f.call('object', item)).status, 409);
    assert.equal((await f.call('object', upload('第二個'))).status, 409);
    assert.equal((await f.internal('/tracking/acquire', { token: f.drain })).status, 409);
    assert.equal(f.counts().puts, mode === 'dispatch-receipt-ack' ? 0 : 1);
    assert.equal(f.data.has(item.key), mode !== 'dispatch-receipt-ack');
  });
}
test('confirmed receipt commit followed by lost acknowledgement is recoverable', async () => {
  const f = await recoveryFixture(), item = upload(); f.fail('confirmed', true);
  assert.equal((await f.call('object', item)).status, 503); f.restart();
  assert.equal((await f.receipt(item.operationId)).phase, 'confirmed');
  assert.equal((await f.call('reconcile', { operationId: item.operationId })).status, 200);
  assert.equal(f.counts().puts, 1); assert.equal((await f.status()).writeTracking.pending, 0);
});
test('reservation transaction failure rolls back receipt, index, charge and pending together', async () => {
  const f = await recoveryFixture(), item = upload(); f.fail('reserved', true);
  assert.equal((await f.call('object', item)).status, 503); f.restart();
  assert.equal((await f.call('status?operationId=' + item.operationId)).status, 404);
  assert.equal((await f.status()).chargedBytes, 0); assert.equal((await f.status()).writeTracking.pending, 0); assert.equal(f.counts().puts, 0);
});
test('conditional conflict preserves existing bytes and charges the attempt without claiming stored', async () => {
  const f = await recoveryFixture(), item = upload(); f.data.set(item.key, new Uint8Array([1, 2, 3]));
  const r = await f.call('object', item); assert.equal(r.status, 200); assert.equal((await r.json() as any).outcome, 'precondition-failed');
  assert.deepEqual(f.data.get(item.key), new Uint8Array([1, 2, 3])); assert.equal((await f.status()).chargedBytes, item.size);
});
test('operation id cannot be rebound to different content or a different key', async () => {
  const f = await recoveryFixture(), item = upload(); await f.call('object', item);
  assert.equal((await f.call('object', upload('其他', item.operationId))).status, 409);
  assert.equal((await f.call('object', { ...item, key: item.key.replace('/markdown/', '/uploads/') })).status, 409);
  assert.equal(f.counts().puts, 1);
});
test('auth, feature flag, audit scope, partition, gate and default site are enforced before reservations', async () => {
  const f = await recoveryFixture(), item = upload();
  assert.equal((await f.call('object', item, false)).status, 401);
  for (const key of ['PLAYTT_RECOVERY_UPLOADS', 'PLAYTT_R2_CAPACITY_SCOPE', 'PLAYTT_STATE_PARTITION', 'PLAYTT_PROBE_GATE', 'PLAYTT_R2_WRITE_TRACKING', 'PLAYTT_R2_WRITE_WINDOW'] as const) {
    const previous = f.env[key]; f.env[key] = 'wrong'; assert.equal((await f.call('object', item)).status, 404); f.env[key] = previous;
  }
  assert.equal((await f.route(new Request('https://private.invalid/__playtt-recovery/status?operationId=' + item.operationId), 'other')).status, 404);
  assert.equal(f.counts().puts, 0); assert.equal(f.counts().renewals, 0);
});
test('invalid hashes, encoding, path, manifest size and huge/chunked bodies fail before ledger writes', async () => {
  const f = await recoveryFixture(), item = upload();
  for (const changed of [{ sha256: '0'.repeat(64), key: item.key.replace(item.sha256, '0'.repeat(64)) }, { base64: '!!!!' }, { key: 'sites/default/markdown/current.json' }, { key: 'sites/other/markdown/objects/' + item.sha256 }, { key: 'sites/default/markdown/revisions/' + crypto.randomUUID() + '.json', size: 262145 }]) {
    assert.ok([400, 413].includes((await f.call('object', { ...item, ...changed })).status));
  }
  const r = await f.call('object', { ...item, extra: 'x'.repeat(1_400_001) }); assert.equal(r.status, 413);
  const stream = new ReadableStream({ start(c) { c.enqueue(new Uint8Array(700_001)); c.enqueue(new Uint8Array(700_000)); c.close(); } });
  const streamed = new Request('https://private.invalid/__playtt-recovery/object', { method: 'POST', headers: { Authorization: 'Bearer local-operator' }, body: stream, duplex: 'half' } as RequestInit);
  assert.equal((await f.route(streamed)).status, 413); assert.equal((await f.status()).chargedBytes, 0); assert.equal(f.counts().puts, 0);
});
test('forged client fence proof is discarded and invalid owner cannot enter Budget', async () => {
  const f = await recoveryFixture(), item = upload();
  const req = new Request('https://private.invalid/__playtt-recovery/object', { method: 'POST', headers: { Authorization: 'Bearer local-operator' }, body: JSON.stringify({ ...item, fenceToken: crypto.randomUUID(), fenceProof: { token: f.fenceToken, expiresAt: Date.now() + 999999 } }) });
  assert.equal((await f.route(req)).status, 409); assert.equal(f.counts().puts, 0);
  assert.equal((await f.call('object', { ...item, fenceProof: { token: 'fake', expiresAt: 0 } })).status, 200);
});
test('closed, sealed and exhausted allowance cannot admit a new recovery write', async () => {
  for (const mode of ['closed', 'sealed', 'bytes', 'operations', 'expired']) {
    const f = await recoveryFixture(mode === 'bytes' ? 1 : 100, mode === 'operations' ? 1 : 10), item = upload();
    if (mode === 'closed') await f.internal('/window/close', { token: f.window });
    if (mode === 'sealed') await f.internal('/tracking/acquire', { token: f.drain });
    if (mode === 'expired') f.advance();
    if (mode === 'operations') await f.call('object', upload('x'));
    assert.ok([503, 507].includes((await f.call('object', item)).status), mode);
    assert.equal(f.counts().puts, mode === 'operations' ? 1 : 0);
  }
});
test('expiry during durable dispatch marker settles as not-dispatched and never calls R2', async () => {
  const f = await recoveryFixture(), item = upload(); f.advanceOn('dispatching');
  const r = await f.call('object', item); assert.equal(r.status, 200); assert.equal((await r.json() as any).outcome, 'not-dispatched');
  assert.equal(f.counts().puts, 0); assert.equal((await f.status()).writeTracking.pending, 0); assert.equal((await f.status()).chargedBytes, item.size);
});
test('maximum raw object is accepted and receipt storage never retains payload', async () => {
  const f = await recoveryFixture(), item = upload('x'.repeat(1024 * 1024));
  assert.equal((await f.call('object', item)).status, 200);
  const r = f.values.get('playtt-recovery-upload-v1:' + item.operationId); assert.ok(JSON.stringify(r).length < 1500); assert.equal('base64' in r, false);
});
test('receipt retention is bounded and unknown/corrupt history is never silently deleted', async () => {
  const f = await recoveryFixture(), item = upload();
  const ids = Array.from({ length: 128 }, () => crypto.randomUUID()); f.values.set('playtt-recovery-upload-index-v1', ids);
  assert.equal((await f.call('object', item)).status, 503); assert.deepEqual(f.values.get('playtt-recovery-upload-index-v1'), ids);
  assert.equal((await f.status()).chargedBytes, 0); assert.equal(f.counts().puts, 0);
});
