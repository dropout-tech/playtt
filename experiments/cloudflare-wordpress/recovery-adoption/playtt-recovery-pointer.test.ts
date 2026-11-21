import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { recoveryFixture } from './helpers/playtt-recovery-fixture.js';
import { readRecoveryObject } from '../src/playtt-recovery-uploads.js';
const key = 'sites/default/markdown/current.json';
async function fixture() {
  const f = await recoveryFixture(), sourceRevision = crypto.randomUUID(), targetRevision = crypto.randomUUID();
  const ptr = (revision: string) => ({ revision, manifestKey: 'sites/default/markdown/revisions/' + revision + '.json', persistedAt: '2026-11-21T00:00:00Z' });
  const source = ptr(sourceRevision), target = ptr(targetRevision), bytes = Buffer.from(JSON.stringify(source)); f.data.set(key, bytes);
  Object.assign(f.pointerState, { state: { pointer: target, version: 178 }, receipts: new Map([[177, source], [178, target]]), pins: [source, target] });
  return { ...f, input: { operationId: crypto.randomUUID(), transition: { source, target, sourceVersion: 177, targetVersion: 178, expectedEtag: createHash('sha256').update(bytes).digest('hex') } } };
}
test('pointer advances only after adoption; receipt binds exact source, target, versions and ETag across restart', async () => {
  const f = await fixture(); assert.equal((await f.call('pointer', f.input)).status, 200); f.restart();
  assert.deepEqual(JSON.parse(Buffer.from(f.data.get(key)!).toString()), f.input.transition.target);
  assert.equal((await f.call('pointer', f.input)).status, 200); assert.equal(f.counts().puts, 1);
  assert.equal((await f.call('pointer', { ...f.input, transition: { ...f.input.transition, expectedEtag: 'different' } })).status, 409);
  const status = await f.receipt(f.input.operationId); assert.equal(status.phase, 'settled'); assert.deepEqual(status.transition, f.input.transition);
});
test('unadopted state, wrong historic/current receipts and absent source/target pins stop before charges', async () => {
  for (const mode of ['state','old-receipt','new-receipt','source-pin','target-pin']) {
    const f = await fixture();
    if (mode === 'state') f.pointerState.state = { version: 177, pointer: f.input.transition.source };
    if (mode === 'old-receipt') f.pointerState.receipts.set(177, f.input.transition.target);
    if (mode === 'new-receipt') f.pointerState.receipts.set(178, f.input.transition.source);
    if (mode.endsWith('pin')) f.pointerState.pins = mode === 'source-pin' ? [f.input.transition.target] : [f.input.transition.source];
    assert.equal((await f.call('pointer', f.input)).status, 409, mode); assert.equal((await f.status()).chargedBytes, 0); assert.equal(f.counts().puts, 0);
  }
});
test('stale ETag or a foreign source pointer rejects before reservation', async () => {
  for (const mode of ['etag','pointer']) {
    const f = await fixture(); if (mode === 'etag') f.input.transition.expectedEtag = 'foreign'; else f.data.set(key, Buffer.from(JSON.stringify(f.input.transition.target)));
    assert.equal((await f.call('pointer', f.input)).status, 409); assert.equal((await f.status()).chargedPuts, 0);
  }
});
test('R2 conditional race preserves the foreign pointer, settles the failed condition and never refunds', async () => {
  const f = await fixture(); f.racePointer(); const r = await f.call('pointer', f.input); assert.equal(r.status, 200);
  assert.equal((await r.json() as any).outcome, 'precondition-failed'); assert.notDeepEqual(JSON.parse(Buffer.from(f.data.get(key)!).toString()), f.input.transition.target);
  assert.equal((await f.status()).chargedPuts, 1); assert.equal((await f.status()).writeTracking.pending, 0);
});
test('confirmed pointer reconciles after restart/closed window, unknown pointer remains pending despite new bytes', async () => {
  for (const mode of ['confirmed','unknown']) {
    const f = await fixture(); if (mode === 'confirmed') f.fail('settled'); else f.unknown();
    assert.equal((await f.call('pointer', f.input)).status, mode === 'confirmed' ? 503 : 409);
    await f.internal('/window/close', { token: f.window }); f.restart();
    assert.deepEqual(JSON.parse(Buffer.from(f.data.get(key)!).toString()), f.input.transition.target);
    assert.equal((await f.call('reconcile', { operationId: f.input.operationId })).status, mode === 'confirmed' ? 200 : 409);
    assert.equal((await f.status()).writeTracking.pending, mode === 'confirmed' ? 0 : 1); assert.equal(f.counts().puts, 1);
  }
});
test('forged pointer proof, backward version and malformed target cannot authorize a pointer', async () => {
  const f = await fixture(); f.pointerState.state.version = 177;
  assert.equal((await f.call('pointer', { ...f.input, pointerProof: f.input.transition })).status, 409);
  assert.equal((await f.call('pointer', { ...f.input, transition: { ...f.input.transition, targetVersion: 176 } })).status, 400);
  assert.equal((await f.call('pointer', { ...f.input, transition: { ...f.input.transition, target: { ...f.input.transition.target, manifestKey: 'other' } } })).status, 400);
  assert.equal(f.counts().puts, 0);
});
test('bounded snapshot read is authorized and cannot expose other site or runtime/secret keys', async () => {
  const f = await fixture(); const path = 'read?' + new URLSearchParams({ key, maxBytes: '1024' });
  const response = await f.call(path); assert.equal(response.status, 200); assert.equal(response.headers.get('x-playtt-recovery-etag'), f.input.transition.expectedEtag);
  assert.deepEqual(await response.json(), f.input.transition.source);
  assert.equal((await f.call(path, undefined, false)).status, 401);
  for (const denied of ['sites/other/markdown/current.json','runtime/core.zip','secrets','sites/default/markdown/../../secret']) assert.equal((await f.call('read?' + new URLSearchParams({ key: denied, maxBytes: '1024' }))).status, 400);
  assert.equal((await f.call('read?' + new URLSearchParams({ key, maxBytes: '1' }))).status, 413);
  assert.equal((await f.call('read?' + new URLSearchParams({ key, maxBytes: '8388609' }))).status, 413);
});
test('R2 read stream overrun is canceled and cannot return misleading declared-size evidence', async () => {
  let canceled = false;
  const bucket = { get: async () => ({ size: 1, etag: 'one', body: new ReadableStream({ start(c) { c.enqueue(new Uint8Array(2)); }, cancel() { canceled = true; } }) }) } as unknown as R2Bucket;
  await assert.rejects(readRecoveryObject(bucket, key, 1024)); assert.equal(canceled, true);
});
