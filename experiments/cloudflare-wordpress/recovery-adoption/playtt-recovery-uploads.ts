// Private recovery writes. Pointer changes require a server-verified forward
// adoption and exact R2 precondition. Never infer settlement from object reads.
import { isWriteToken } from './playtt-write-drain.js';

export const RECOVERY_PREFIX = '/__playtt-recovery/';
export const RECOVERY_MAX_BODY = 1_400_000;
const MAX_BYTES = 1024 * 1024, MAX_RECEIPTS = 128;
const INDEX = 'playtt-recovery-upload-index-v1';
const PREFIX = 'playtt-recovery-upload-v1:';
const SCHEMA = 'playtt/recovery-upload/v1';
export class PlayttRecoveryError extends Error {
  constructor(public readonly status: 400 | 404 | 405 | 409 | 413 | 503, message: string) { super(message); }
}
export interface RecoveryEnv {
  PLAYTT_RECOVERY_UPLOADS?: string;
  PLAYTT_PROBE_GATE?: string;
  PLAYTT_STATE_PARTITION?: string;
  PLAYTT_R2_CAPACITY_SCOPE?: string;
  PLAYTT_R2_WRITE_TRACKING?: string;
  PLAYTT_R2_WRITE_WINDOW?: string;
}
export function recoveryEnabled(env: RecoveryEnv): boolean {
  return env.PLAYTT_RECOVERY_UPLOADS === 'v1' && env.PLAYTT_PROBE_GATE === 'true'
    && env.PLAYTT_STATE_PARTITION === 'restore-v1'
    && env.PLAYTT_R2_CAPACITY_SCOPE === 'playtt-wordpress-session-audit'
    && env.PLAYTT_R2_WRITE_TRACKING === 'v1' && env.PLAYTT_R2_WRITE_WINDOW === 'v1';
}
export interface RecoveryFence { token: string; expiresAt: number }
export interface RecoveryPointer { revision: string; manifestKey: string; persistedAt: string }
export interface RecoveryTransition {
  source: RecoveryPointer; target: RecoveryPointer;
  sourceVersion: number; targetVersion: number; expectedEtag: string;
}
interface Identity { operationId: string; key: string; sha256: string; size: number; transition?: RecoveryTransition }
interface Receipt extends Identity {
  schema: typeof SCHEMA;
  ticket: string;
  windowExpiresAt: number;
  createdAt: number;
  phase: 'reserved' | 'dispatching' | 'unknown' | 'confirmed' | 'settled';
  outcome?: 'stored' | 'precondition-failed' | 'not-dispatched';
  etag?: string;
}
interface Host {
  storage: DurableObjectStorage;
  bucket: R2Bucket;
  now: () => number;
  reserve: (tx: DurableObjectTransaction, bytes: number) => Promise<{ ticket: string; expiresAt: number }>;
  settle: (tx: DurableObjectTransaction, ticket: string) => Promise<void>;
}
function need(value: unknown, status: PlayttRecoveryError['status'], message: string): asserts value {
  if (!value) throw new PlayttRecoveryError(status, message);
}
export async function readRecoveryJson(request: Request, maxBytes = RECOVERY_MAX_BODY): Promise<Record<string, unknown>> {
  const reader = request.body?.getReader();
  need(reader, 400, 'A JSON body is required.');
  let size = 0; const chunks: Uint8Array[] = [];
  try {
    while (true) {
      const next = await reader.read(); if (next.done) break;
      size += next.value.byteLength;
      if (size > maxBytes) { await reader.cancel(); throw new PlayttRecoveryError(413, 'Recovery request exceeds the byte limit.'); }
      chunks.push(next.value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size); let offset = 0;
  for (const part of chunks) { bytes.set(part, offset); offset += part.byteLength; }
  try {
    const value = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
    need(value && typeof value === 'object' && !Array.isArray(value), 400, 'Invalid recovery request.');
    return value;
  } catch { throw new PlayttRecoveryError(400, 'Invalid recovery request.'); }
}
function operationId(value: unknown): string { need(isWriteToken(value), 400, 'Invalid operation identity.'); return value; }
export function recoveryPointer(value: unknown): RecoveryPointer {
  const p = value as RecoveryPointer;
  need(p && isWriteToken(p.revision) && p.manifestKey === 'sites/default/markdown/revisions/' + p.revision + '.json'
    && typeof p.persistedAt === 'string' && p.persistedAt.length <= 40 && /(?:Z|[+-]\d\d:\d\d)$/.test(p.persistedAt)
    && Number.isFinite(Date.parse(p.persistedAt)), 400, 'Invalid recovery pointer.');
  return { revision: p.revision, manifestKey: p.manifestKey, persistedAt: p.persistedAt };
}
export function recoveryTransition(value: unknown): RecoveryTransition {
  const t = value as RecoveryTransition;
  need(t && Number.isSafeInteger(t.sourceVersion) && t.sourceVersion >= 1
    && Number.isSafeInteger(t.targetVersion) && t.targetVersion === t.sourceVersion + 1
    && typeof t.expectedEtag === 'string' && /^[a-zA-Z0-9_-]{1,128}$/.test(t.expectedEtag), 400, 'Invalid recovery transition.');
  const source = recoveryPointer(t.source), target = recoveryPointer(t.target);
  need(source.revision !== target.revision, 400, 'Recovery requires a new revision.');
  return { source, target, sourceVersion: t.sourceVersion, targetVersion: t.targetVersion, expectedEtag: t.expectedEtag };
}
const POINTER_KEY = 'sites/default/markdown/current.json';
const identical = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
const hash = async (bytes: Uint8Array) => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes as Uint8Array<ArrayBuffer>)), b => b.toString(16).padStart(2, '0')).join('');
// Reads are bounded separately from upload limits; complete backups may include
// an 8 MiB immutable base. Only known default-site snapshot paths are exposed.
export async function readRecoveryObject(bucket: R2Bucket, key: string, limit: number): Promise<{ bytes: Uint8Array; etag: string } | null> {
  const raw = /^sites\/default\/(markdown|uploads|wp-content)\/objects\/[a-f0-9]{64}$/.test(key);
  const manifest = /^sites\/default\/markdown\/revisions\/[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}\.json$/.test(key);
  const pack = /^sites\/default\/restore-packs\/[a-f0-9]{64}\.zip$/.test(key);
  need(raw || manifest || pack || key === POINTER_KEY, 400, 'Unknown recovery object path.');
  need(Number.isSafeInteger(limit) && limit >= 0 && limit <= 8 * 1024 * 1024, 413, 'Invalid read bound.');
  const bound = Math.min(limit, manifest ? 256 * 1024 : key === POINTER_KEY ? 1024 : 8 * 1024 * 1024);
  const object = await bucket.get(key); if (!object) return null;
  const reader = object.body.getReader(); let length = 0; const chunks: Uint8Array[] = [];
  try {
    need(Number.isSafeInteger(object.size) && object.size >= 0 && object.size <= bound, 413, 'Recovery object exceeds the read bound.');
    while (true) {
      const next = await reader.read(); if (next.done) break;
      length += next.value.byteLength; need(length <= bound && length <= object.size, 413, 'Recovery object exceeded its declared size.'); chunks.push(next.value);
    }
    need(length === object.size, 409, 'Recovery object size changed.');
  } catch (error) { await reader.cancel().catch(() => undefined); throw error; }
  finally { reader.releaseLock(); }
  const bytes = new Uint8Array(length); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  return { bytes, etag: object.etag };
}
export async function verifyRecoveryTransition(t: RecoveryTransition, coordinator: {
  state: () => Promise<{ version: number; pointer: unknown }>;
  committed: (version: number) => Promise<unknown>;
  backupPins: () => Promise<{ pins: unknown[] }>;
}): Promise<RecoveryTransition> {
  const state = await coordinator.state();
  const sourceReceipt = await coordinator.committed(t.sourceVersion), targetReceipt = await coordinator.committed(t.targetVersion), registry = await coordinator.backupPins();
  need(state.version === t.targetVersion && identical(recoveryPointer(state.pointer), t.target)
    && identical(recoveryPointer(sourceReceipt), t.source) && identical(recoveryPointer(targetReceipt), t.target), 409, 'Coordinator adoption or commit receipts differ.');
  need([t.source, t.target].every(p => registry.pins.some(pin => identical(recoveryPointer(pin), p))), 409, 'Both source and adopted target must be pinned.');
  return t;
}
function assertFence(value: unknown, now: number): asserts value is RecoveryFence {
  const f = value as RecoveryFence | undefined;
  need(f && isWriteToken(f.token) && Number.isSafeInteger(f.expiresAt) && f.expiresAt > now
    && f.expiresAt <= now + 600_000, 409, 'A fresh owned fence is required.');
}
async function uploadInput(input: Record<string, unknown>): Promise<{ identity: Identity; bytes: Uint8Array }> {
  const id = operationId(input.operationId);
  need(typeof input.sha256 === 'string' && /^[a-f0-9]{64}$/.test(input.sha256), 400, 'Invalid object digest.');
  need(typeof input.key === 'string', 400, 'Invalid object key.');
  const rawKey = new RegExp('^sites/default/(markdown|uploads|wp-content)/objects/' + input.sha256 + '$');
  const manifest = /^sites\/default\/markdown\/revisions\/[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}\.json$/.test(input.key);
  need(rawKey.test(input.key) || manifest, 400, 'Only immutable default-site objects and revision manifests are accepted.');
  need(Number.isSafeInteger(input.size) && (input.size as number) >= 0
    && (input.size as number) <= (manifest ? 256 * 1024 : MAX_BYTES), 413, 'Object exceeds the byte limit.');
  need(typeof input.base64 === 'string' && input.base64.length === 4 * Math.ceil((input.size as number) / 3)
    && /^[A-Za-z0-9+/]*={0,2}$/.test(input.base64), 400, 'Invalid object encoding.');
  const binary = atob(input.base64);
  need(binary.length === input.size && btoa(binary) === input.base64, 400, 'Object size or encoding differs.');
  const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
  const digest = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), b => b.toString(16).padStart(2, '0')).join('');
  need(digest === input.sha256, 400, 'Object digest differs.');
  return { identity: { operationId: id, key: input.key, sha256: digest, size: bytes.length }, bytes };
}
function validateReceipt(r: Receipt, id: string): Receipt {
  need(r && r.schema === SCHEMA && r.operationId === id && isWriteToken(r.ticket)
    && typeof r.key === 'string' && /^[a-f0-9]{64}$/.test(r.sha256)
    && Number.isSafeInteger(r.size) && r.size >= 0 && r.size <= MAX_BYTES
    && Number.isSafeInteger(r.createdAt) && Number.isSafeInteger(r.windowExpiresAt)
    && ['reserved', 'dispatching', 'unknown', 'confirmed', 'settled'].includes(r.phase), 503, 'Recovery receipt is unavailable.');
  const complete = r.phase === 'confirmed' || r.phase === 'settled';
  need(complete ? ['stored', 'precondition-failed', 'not-dispatched'].includes(r.outcome ?? '') : r.outcome === undefined,
    503, 'Recovery completion evidence is unavailable.');
  if (r.transition !== undefined) {
    need(r.key === POINTER_KEY && r.size <= 1024 && identical(recoveryTransition(r.transition), r.transition), 503, 'Pointer receipt is invalid.');
  } else need(r.key !== POINTER_KEY, 503, 'Pointer receipt requires its transition.');
  return r;
}
function publicReceipt(r: Receipt) {
  const { ticket: _ticket, ...publicFields } = r;
  return { ...publicFields, automaticRetry: false, automaticRefund: false,
    canReconcile: r.phase === 'reserved' || r.phase === 'confirmed' };
}

// The caller serializes this handler in the same DO as the ledger. Reservation
// plus receipt, and settlement plus receipt, each use one durable transaction.
export async function handleRecoveryOperation(request: Request, host: Host): Promise<Response> {
  const url = new URL(request.url), action = url.pathname.replace('/recovery/', '');
  if (action === 'status' && request.method === 'GET') {
    const id = operationId(url.searchParams.get('operationId'));
    const receipt = await host.storage.get<Receipt>(PREFIX + id);
    need(receipt, 404, 'Operation has no durable receipt.');
    return Response.json(publicReceipt(validateReceipt(receipt, id)));
  }
  need(['object', 'pointer', 'reconcile'].includes(action), 404, 'Unknown recovery action.');
  need(request.method === 'POST', 405, 'POST is required.');
  const input = await readRecoveryJson(request, action === 'object' ? RECOVERY_MAX_BODY : 4096);
  assertFence(input.fenceProof, host.now()); // Internal, server-constructed proof.
  const id = operationId(input.operationId), receiptKey = PREFIX + id;
  let receipt = await host.storage.get<Receipt>(receiptKey);
  if (receipt) validateReceipt(receipt, id);
  if (action === 'object' || action === 'pointer') {
    let identity: Identity, bytes: Uint8Array;
    if (action === 'pointer') {
      const transition = recoveryTransition(input.transition);
      need(identical(transition, input.pointerProof), 409, 'A server-verified adoption proof is required.');
      bytes = new TextEncoder().encode(JSON.stringify(transition.target));
      identity = { operationId: id, key: POINTER_KEY, sha256: await hash(bytes), size: bytes.length, transition };
    } else ({ identity, bytes } = await uploadInput(input));
    if (receipt) {
      need(['key', 'sha256', 'size'].every(k => receipt![k as keyof Identity] === identity[k as keyof Identity])
        && identical(receipt.transition ?? null, identity.transition ?? null), 409, 'Operation identity is already bound to different bytes or conditions.');
      // Even a reserved receipt is never replayed implicitly. Reconciliation
      // records that it never dispatched, without erasing its attempted charge.
      return Response.json(publicReceipt(receipt), { status: ['dispatching', 'unknown'].includes(receipt.phase) ? 409 : 200 });
    }
    if (identity.transition) {
      const current = await readRecoveryObject(host.bucket, POINTER_KEY, 1024);
      need(current && current.etag === identity.transition.expectedEtag, 409, 'R2 pointer precondition differs.');
      let actual: unknown; try { actual = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(current.bytes)); } catch { throw new PlayttRecoveryError(409, 'R2 pointer is invalid.'); }
      need(identical(recoveryPointer(actual), identity.transition.source), 409, 'R2 pointer differs from the exact source.');
    }
    assertFence(input.fenceProof, host.now());
    await host.storage.transaction(async tx => {
      const ids = await tx.get<string[]>(INDEX) ?? [];
      need(Array.isArray(ids) && ids.length < MAX_RECEIPTS && ids.every(isWriteToken) && new Set(ids).size === ids.length,
        503, 'Recovery receipt retention limit reached or index unavailable.');
      need(!ids.includes(id) && !await tx.get(receiptKey), 409, 'Operation identity already exists.');
      const reservation = await host.reserve(tx, bytes.byteLength);
      receipt = { schema: SCHEMA, ...identity, ticket: reservation.ticket, windowExpiresAt: reservation.expiresAt,
        createdAt: host.now(), phase: 'reserved' };
      await tx.put(receiptKey, receipt); await tx.put(INDEX, [...ids, id]);
    });
    // Await the durable dispatch marker before making the R2 call. A crash in
    // this gap is conservatively unknown, never inferred from object presence.
    assertFence(input.fenceProof, host.now());
    need(host.now() < receipt!.windowExpiresAt, 409, 'Write window expired before dispatch.');
    receipt!.phase = 'dispatching'; await host.storage.put(receiptKey, receipt!);
    if (host.now() >= receipt!.windowExpiresAt || host.now() >= input.fenceProof.expiresAt) {
      receipt!.phase = 'confirmed'; receipt!.outcome = 'not-dispatched';
    } else {
      let result: R2Object | null;
      try { result = await host.bucket.put(identity.key, bytes, { onlyIf: identity.transition ? { etagMatches: identity.transition.expectedEtag } : { etagDoesNotMatch: '*' } }); }
      catch {
        receipt!.phase = 'unknown'; await host.storage.put(receiptKey, receipt!);
        throw new PlayttRecoveryError(409, 'R2 outcome is unknown; the operation remains pending and must not be replayed.');
      }
      receipt!.phase = 'confirmed'; receipt!.outcome = result ? 'stored' : 'precondition-failed';
      if (result) receipt!.etag = result.etag;
    }
    await host.storage.put(receiptKey, receipt!);
  } else {
    need(receipt, 404, 'Operation has no durable receipt.');
    need(!['dispatching', 'unknown'].includes(receipt.phase), 409, 'No authoritative completion evidence; pending operation is retained.');
    if (receipt.phase === 'reserved') { receipt.phase = 'confirmed'; receipt.outcome = 'not-dispatched'; await host.storage.put(receiptKey, receipt); }
  }
  if (receipt!.phase === 'confirmed') {
    await host.storage.transaction(async tx => {
      const current = validateReceipt((await tx.get<Receipt>(receiptKey))!, id);
      need(current.phase === 'confirmed' && current.ticket === receipt!.ticket, 409, 'Receipt changed before settlement.');
      await host.settle(tx, current.ticket);
      current.phase = 'settled'; await tx.put(receiptKey, current); receipt = current;
    });
  }
  return Response.json(publicReceipt(receipt!));
}

// Outer Worker gate: caller-provided fenceProof and internal fields are never
// forwarded. Renew before entering Budget, avoiding a coordinator/Budget cycle.
export async function routeRecoveryRequest(request: Request, env: RecoveryEnv, services: {
  siteId: string;
  authorized: () => Promise<boolean>;
  renewFence: (token: string) => Promise<RecoveryFence>;
  verifyTransition?: (transition: RecoveryTransition) => Promise<RecoveryTransition>;
  readObject?: (key: string, limit: number) => Promise<{ bytes: Uint8Array; etag: string } | null>;
  budget: () => { fetch: (request: Request) => Promise<Response> };
}): Promise<Response> {
  const headers = { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' };
  try {
    need(recoveryEnabled(env) && services.siteId === 'default', 404, 'Recovery uploads are disabled.');
    if (!await services.authorized()) return new Response('Unauthorized', { status: 401, headers });
    const url = new URL(request.url), action = url.pathname.slice(RECOVERY_PREFIX.length);
    if (action === 'read' && request.method === 'GET') {
      need(services.readObject, 404, 'Recovery reads are disabled.');
      const rawLimit = url.searchParams.get('maxBytes'); need(rawLimit !== null && /^(0|[1-9][0-9]{0,7})$/.test(rawLimit), 400, 'Invalid read bound.');
      const object = await services.readObject(url.searchParams.get('key') ?? '', Number(rawLimit));
      if (!object) return new Response('Object not found', { status: 404, headers });
      return new Response(Uint8Array.from(object.bytes).buffer, { headers: { ...headers, 'Content-Type': 'application/octet-stream', 'Content-Length': String(object.bytes.length), 'X-Playtt-Recovery-Etag': object.etag } });
    }
    let internal: Request;
    if (action === 'status' && request.method === 'GET') {
      const id = operationId(url.searchParams.get('operationId'));
      internal = new Request('https://playtt-capacity.invalid/recovery/status?operationId=' + id);
    } else {
      need(['object', 'pointer', 'reconcile'].includes(action), 404, 'Unknown recovery action.');
      need(request.method === 'POST', 405, 'POST is required.');
      const input = await readRecoveryJson(request, action === 'object' ? RECOVERY_MAX_BODY : 4096);
      need(isWriteToken(input.fenceToken), 400, 'Invalid fence owner.');
      const id = operationId(input.operationId);
      let fenceProof = await services.renewFence(input.fenceToken);
      need(fenceProof.token === input.fenceToken, 409, 'Fence owner differs.');
      let payload: object = action === 'object'
        ? { operationId: id, key: input.key, size: input.size, sha256: input.sha256, base64: input.base64, fenceProof }
        : { operationId: id, fenceProof };
      if (action === 'pointer') {
        need(services.verifyTransition, 404, 'Recovery pointer updates are disabled.');
        const transition = recoveryTransition(input.transition), pointerProof = await services.verifyTransition(transition);
        fenceProof = await services.renewFence(input.fenceToken);
        need(fenceProof.token === input.fenceToken, 409, 'Fence owner differs.');
        payload = { operationId: id, transition, pointerProof, fenceProof };
      }
      internal = new Request('https://playtt-capacity.invalid/recovery/' + action, { method: 'POST', body: JSON.stringify(payload) });
    }
    const response = await services.budget().fetch(internal);
    const result = new Response(response.body, response);
    for (const [name, value] of Object.entries(headers)) result.headers.set(name, value);
    return result;
  } catch (error) {
    return Response.json({ code: 'playtt_recovery_upload', message: error instanceof PlayttRecoveryError ? error.message : 'Recovery operation unavailable.' },
      { status: error instanceof PlayttRecoveryError ? error.status : 409, headers });
  }
}
