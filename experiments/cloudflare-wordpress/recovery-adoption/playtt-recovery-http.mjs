// Explicit caller-owned transport. No deployment, implicit window opening,
// teardown, or credential loading. Persist the operation registry before send.
import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import { readSnapshotGraph } from './playtt-snapshot-bundle.mjs';
const sha = b => createHash('sha256').update(b).digest('hex');
const pointer = a => Object.fromEntries(['revision', 'manifestKey', 'persistedAt'].map(k => [k, a[k]]));
const same = (a,b) => JSON.stringify(a) === JSON.stringify(b);
export async function createRecoveryHttpTransport({ plan, digest, origin, operatorToken, fenceToken, loadOperations, saveOperations, fetchImpl = fetch }) {
  const url = new URL(origin); assert.equal(url.origin, origin); assert.ok(!url.username && !url.password);
  assert.ok(url.protocol === 'https:' || url.protocol === 'http:' && url.hostname === '127.0.0.1');
  assert.match(digest, /^[a-f0-9]{64}$/); assert.equal(typeof operatorToken, 'string'); assert.ok(operatorToken.length >= 16);
  assert.equal(typeof saveOperations, 'function');
  let operations = await loadOperations();
  if (operations === null) operations = { schema: 'playtt/recovery-http-operations/v1', planDigest: digest, entries: [] };
  assert.equal(operations.schema, 'playtt/recovery-http-operations/v1'); assert.equal(operations.planDigest, digest);
  assert.ok(Array.isArray(operations.entries) && operations.entries.length <= 66);
  const ids = new Set(), labels = new Set();
  for (const op of operations.entries) {
    assert.match(op.id, /^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/); assert.ok(!ids.has(op.id) && !labels.has(op.label));
    assert.ok(['object','pointer'].includes(op.kind)); assert.match(op.identity, /^[a-f0-9]{64}$/);
    assert.ok(op.binding && typeof op.binding === 'object');
    if (op.kind === 'object') {
      const entry = plan.objects.find(e => e.key === op.label); assert.ok(entry);
      assert.deepEqual(op.binding, { key: entry.key, sha256: entry.sha256, size: entry.bytes.length });
      assert.equal(op.identity, sha(JSON.stringify({ kind: op.kind, ...op.binding, base64: Buffer.from(entry.bytes).toString('base64') })));
    } else {
      assert.equal(op.label, 'pointer'); const t = op.binding.transition;
      assert.deepEqual(t.source, pointer(plan.source)); assert.deepEqual(t.target, pointer(plan.target));
      assert.equal(t.sourceVersion, plan.sourceVersion); assert.equal(t.targetVersion, plan.targetVersion); assert.match(t.expectedEtag, /^[a-zA-Z0-9_-]{1,128}$/);
      assert.equal(op.identity, sha(JSON.stringify({ kind: op.kind, transition: t })));
    }
    ids.add(op.id); labels.add(op.label);
  }
  async function request(path, body) {
    assert.ok(path.startsWith('/') && !path.startsWith('//'));
    return fetchImpl(origin + path, { method: body === undefined ? 'GET' : 'POST', headers: { Authorization: 'Bearer ' + operatorToken,
      'X-Playtt-Probe': operatorToken, 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body), redirect: 'manual', signal: AbortSignal.timeout(60000) });
  }
  async function json(path, body) {
    const r = await request(path, body); if (!r.ok) { await r.body?.cancel(); throw Error('Recovery HTTP ' + r.status + ' ' + path.split('?')[0]); } return r.json();
  }
  async function read(key, maxBytes) {
    const response = await request('/__playtt-recovery/read?' + new URLSearchParams({ key, maxBytes: String(maxBytes) }));
    if (response.status === 404) { await response.body?.cancel(); return null; }
    assert.ok(response.ok, 'Recovery read ' + response.status);
    const reader = response.body.getReader(), chunks = []; let length = 0;
    try { while (true) { const next = await reader.read(); if (next.done) break; length += next.value.length; assert.ok(length <= maxBytes); chunks.push(next.value); } }
    catch (error) { await reader.cancel().catch(() => undefined); throw error; } finally { reader.releaseLock(); }
    const bytes = Buffer.concat(chunks); const declared = response.headers.get('content-length'); if (declared !== null) assert.equal(Number(declared), length);
    const etag = response.headers.get('x-playtt-recovery-etag'); assert.ok(etag); return { bytes, etag };
  }
  async function receipt(op) {
    const r = await request('/__playtt-recovery/status?operationId=' + op.id);
    if (r.status === 404) { await r.body?.cancel(); return null; }
    assert.ok(r.ok, 'Receipt inspection failed'); const value = await r.json(); assert.equal(value.operationId, op.id);
    if (op.kind === 'object') {
      for (const name of ['key','sha256','size']) assert.equal(value[name], op.binding[name], 'Receipt differs from the journaled object');
      assert.equal(value.transition, undefined);
    } else {
      assert.equal(value.key, plan.pointerKey); assert.deepEqual(value.transition, op.binding.transition);
      const bytes = Buffer.from(JSON.stringify(op.binding.transition.target)); assert.equal(value.sha256, sha(bytes)); assert.equal(value.size, bytes.length);
    }
    return value;
  }
  async function reconcile(op) {
    let current = await receipt(op); if (!current) return null;
    if (['reserved','confirmed'].includes(current.phase)) current = await json('/__playtt-recovery/reconcile', { operationId: op.id, fenceToken });
    assert.equal(current.phase, 'settled', 'Storage outcome remains unknown; preserve pending and containment');
    assert.ok(['stored','precondition-failed','not-dispatched'].includes(current.outcome)); return current;
  }
  async function write(kind, label, payload) {
    const identity = sha(JSON.stringify({ kind, ...payload }));
    let op = operations.entries.find(e => e.label === label);
    if (op) { assert.equal(op.identity, identity, 'Persisted operation preconditions changed'); assert.equal(op.kind, kind); }
    else {
      assert.ok(operations.entries.length < 66); const { base64: _payload, ...binding } = payload;
      op = { id: randomUUID(), kind, label, identity, binding };
      const next = { ...operations, entries: [...operations.entries, op] };
      await saveOperations(structuredClone(next)); operations = next; // Must complete before HTTP.
    }
    let outcome;
    try { outcome = await json('/__playtt-recovery/' + kind, { ...payload, operationId: op.id, fenceToken }); }
    catch (error) { outcome = await reconcile(op); if (!outcome) throw error; }
    if (['reserved','confirmed'].includes(outcome.phase)) outcome = await reconcile(op);
    assert.equal(outcome.phase, 'settled', 'Storage operation remains unresolved');
    assert.equal(outcome.operationId, op.id);
    assert.notEqual(outcome.outcome, 'not-dispatched', 'Known unsent operation retained; requires an explicit new attempt/window, not silent replay');
    assert.ok(['stored','precondition-failed'].includes(outcome.outcome)); return outcome;
  }
  const io = {
    async renewFence() { await json('/?phase=operator-fence-renew', { token: fenceToken, ttlSeconds: 600 }); },
    async inspect() {
      const status = await json('/?phase=operator-fence-status'), budget = await json('/__playtt-capacity'), publisher = await json('/__playtt-publishing');
      const raw = await read(plan.pointerKey, 1024); assert.ok(raw); const r2Pointer = pointer(JSON.parse(raw.bytes.toString('utf8')));
      return { state: status.state, receipt: status.receipt, r2Pointer, publisherPaused: publisher.state === 'paused',
        pending: budget.writeTracking.pending, fenceOwned: status.fence.active === true && status.fence.expiresAt > Date.now(),
        admitsNewWrites: budget.writeTracking.window.admitsNewOperations,
        remainingWriteBytes: Math.min(budget.remainingBytes, budget.writeTracking.window.remainingBytes),
        remainingWriteOperations: budget.writeTracking.window.maxOperations - budget.writeTracking.window.operations };
    },
    async listPins() { return (await json('/__playtt-backup-pins')).pins; },
    async getObject(key, maxBytes) { return (await read(key, maxBytes))?.bytes ?? null; },
    async putAbsent(key, bytes) {
      const entry = plan.objects.find(e => e.key === key); assert.ok(entry); assert.equal(sha(bytes), entry.sha256); assert.equal(bytes.length, entry.bytes.length);
      await write('object', key, { key, sha256: sha(bytes), size: bytes.length, base64: Buffer.from(bytes).toString('base64') });
    },
    async ensurePin(pin) { await json('/__playtt-backup-pins', { pin, fenceToken }); },
    async verifySnapshot(anchor) {
      const bucket = { async get(key) { const o = await read(key, 8 * 1024 * 1024); return o ? { size: o.bytes.length, arrayBuffer: async () => Uint8Array.from(o.bytes).buffer } : null; } };
      return readSnapshotGraph(bucket, anchor);
    },
    async adopt(next, version) { assert.deepEqual(next, pointer(plan.target)); assert.equal(version, plan.targetVersion); await json('/?phase=operator-adopt', { pointer: next, version, fenceToken }); },
    async compareAndSetPointer(source, target) {
      assert.deepEqual(source, pointer(plan.source)); assert.deepEqual(target, pointer(plan.target));
      const current = await read(plan.pointerKey, 1024); assert.ok(current); assert.deepEqual(pointer(JSON.parse(current.bytes)), source);
      const outcome = await write('pointer', 'pointer', { transition: { source, target, sourceVersion: plan.sourceVersion, targetVersion: plan.targetVersion, expectedEtag: current.etag } });
      assert.equal(outcome.outcome, 'stored', 'Pointer conditional conflict; preserve foreign value');
    },
  };
  return { io, async reconcileOwnedOperations() { await io.renewFence(); for (const op of operations.entries) await reconcile(op); }, inspectOperations: () => structuredClone(operations) };
}
