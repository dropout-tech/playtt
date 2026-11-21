import { WRITE_PROOF_SCHEMA, WRITE_SETTLED_SCHEMA, PlayttWriteDrainError, isWriteToken, newWriteTracking, validateWriteTracking, openTrackedWrite, settleTrackedWrite, acquireWriteDrain, releaseWriteDrain, writeTrackingStatus, type WriteKind, type WriteTracking } from './playtt-write-drain.js';
import { WINDOW_TRACKING_SCHEMA, WINDOW_PROOF_SCHEMA, WINDOW_ADMISSION_SCHEMA, MAX_WINDOW_MS, PlayttWriteWindowError, armWriteWindow, closeWriteWindow, requireWindowAdmission, writeWindowStatus, type WindowArmInput } from './playtt-write-window.js';
import { handleRecoveryOperation, recoveryEnabled, PlayttRecoveryError, type RecoveryEnv } from './playtt-recovery-uploads.js';
// Private research deployment only. This bounds R2 payload allocation attempts,
// not shared-account billing, metadata, reads, or writes through other clients.
export interface PlayttCapacityEnv extends RecoveryEnv {
  WORDPRESS_STATE_BUCKET: R2Bucket;
  PLAYTT_STORAGE_BUDGET?: DurableObjectNamespace;
  PLAYTT_R2_CAPACITY_SCOPE?: string;
  PLAYTT_R2_CAPACITY_LIMIT_BYTES?: string;
  PLAYTT_R2_WRITE_TRACKING?: string;
  PLAYTT_R2_WRITE_WINDOW?: string;
}

const SCOPES = new Set(['playtt-wordpress-rebuild-audit', 'playtt-wordpress-pin-restore-audit', 'playtt-wordpress-window-audit', 'playtt-wordpress-session-audit']);
const KEY = 'playtt-r2-capacity-ledger-v1';
const SCHEMA = 'playtt/r2-capacity-ledger/v1';
const RESERVATION_SCHEMA = 'playtt/r2-capacity-reservation/v1';
interface Ledger {
  schema: typeof SCHEMA;
  scope: string;
  baselineBytes: number;
  baselineObjects: number;
  chargedBytes: number;
  chargedPuts: number;
  initializedAt: string;
  writeTracking?: WriteTracking;
}

export class PlayttCapacityError extends Error {
  constructor(public readonly status: 503 | 507 = 507, public readonly reason: 'capacity' | 'window' = 'capacity') {
    super(status === 507 ? 'Playtt storage capacity limit reached.' : 'Playtt storage capacity verification is unavailable.');
  }
}

export function playttCapacityResponse(error: PlayttCapacityError): Response {
  if (error.reason === 'window') return Response.json({ code: 'playtt_write_window_closed', message: '目前已暫停儲存，請保留編輯內容並聯絡管理員。', data: { status: 503 } }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  return Response.json({ code: error.status === 507 ? 'playtt_storage_capacity' : 'playtt_storage_capacity_unavailable',
    message: error.status === 507 ? '儲存空間已達設定上限，這次變更未完成保存。請保留編輯內容並聯絡管理員。' : '目前無法確認儲存空間，這次變更未完成保存。請保留編輯內容並稍後重試。',
    data: { status: error.status } }, { status: error.status, headers: { 'Cache-Control': 'no-store' } });
}

export function playttCapacityLimit(env: PlayttCapacityEnv): number | null {
  if (env.PLAYTT_R2_WRITE_WINDOW !== undefined && (env.PLAYTT_R2_WRITE_WINDOW !== 'v1' || env.PLAYTT_R2_WRITE_TRACKING !== 'v1')) throw new PlayttCapacityError(503);
  if (env.PLAYTT_R2_WRITE_TRACKING !== undefined && env.PLAYTT_R2_WRITE_TRACKING !== 'v1') throw new PlayttCapacityError(503);
  if (env.PLAYTT_R2_WRITE_TRACKING && env.PLAYTT_R2_CAPACITY_SCOPE === undefined) throw new PlayttCapacityError(503);
  if (env.PLAYTT_R2_CAPACITY_SCOPE === undefined && env.PLAYTT_R2_CAPACITY_LIMIT_BYTES === undefined) return null;
  const raw = env.PLAYTT_R2_CAPACITY_LIMIT_BYTES;
  if (!SCOPES.has(env.PLAYTT_R2_CAPACITY_SCOPE ?? '') || !env.PLAYTT_STORAGE_BUDGET || !raw || !/^[1-9][0-9]*$/.test(raw)) throw new PlayttCapacityError(503);
  const limit = Number(raw);
  if (!Number.isSafeInteger(limit) || limit > 2_000_000_000) throw new PlayttCapacityError(503);
  return limit;
}

export function playttCapacityStub(env: PlayttCapacityEnv): DurableObjectStub {
  if (playttCapacityLimit(env) === null) throw new PlayttCapacityError(503);
  return env.PLAYTT_STORAGE_BUDGET!.getByName('playtt-r2-capacity-v1');
}

function validWindowProof(proof: { windowId?: string; openedAt?: number; expiresAt?: number }): boolean {
  return isWriteToken(proof.windowId) && Number.isSafeInteger(proof.openedAt) && proof.openedAt! > 0
    && Number.isSafeInteger(proof.expiresAt) && proof.expiresAt! > proof.openedAt!
    && proof.expiresAt! - proof.openedAt! <= MAX_WINDOW_MS;
}
export async function playttWriteWindowAdmission(env: PlayttCapacityEnv): Promise<void> {
  playttCapacityLimit(env);
  if (env.PLAYTT_R2_WRITE_WINDOW !== 'v1') return;
  try {
    const response = await playttCapacityStub(env).fetch('https://playtt-capacity.invalid/window/admission');
    if (!response.ok) { await response.body?.cancel(); throw new PlayttCapacityError(503, 'window'); }
    const proof = await response.json<{ schema?: string; allowed?: boolean; windowId?: string; openedAt?: number; expiresAt?: number }>();
    if (proof.schema !== WINDOW_ADMISSION_SCHEMA || proof.allowed !== true || !validWindowProof(proof)) throw new PlayttCapacityError(503);
    if (Date.now() < proof.openedAt! || Date.now() >= proof.expiresAt!) throw new PlayttCapacityError(503, 'window');
  } catch (error) { throw error instanceof PlayttCapacityError ? error : new PlayttCapacityError(503); }
}

function bytesOf(value: unknown): number {
  if (value === null) return 0;
  if (typeof value === 'string') return new TextEncoder().encode(value).byteLength;
  if (value instanceof ArrayBuffer || ArrayBuffer.isView(value)) return value.byteLength;
  if (value instanceof Blob) return value.size;
  // Streams and multipart uploads need a separate bounded allocation protocol.
  // Reject instead of buffering an unknown-size stream in the PHP isolate.
  throw new PlayttCapacityError(503);
}

const guarded = new WeakSet<object>();
export function withPlayttStorageCapacity<T extends PlayttCapacityEnv>(env: T): T {
  const callerLimit = playttCapacityLimit(env);
  if (callerLimit === null || guarded.has(env.WORDPRESS_STATE_BUCKET)) return env;
  const bucket = env.WORDPRESS_STATE_BUCKET;
  const tracking = env.PLAYTT_R2_WRITE_TRACKING === 'v1';
  const windowRequired = env.PLAYTT_R2_WRITE_WINDOW === 'v1';
  const reserve = async (bytes: number, kind: WriteKind = 'put'): Promise<{ ticket?: string; openedAt?: number; expiresAt?: number }> => {
    try {
    const response = await playttCapacityStub(env).fetch('https://playtt-capacity.invalid/reserve', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ bytes, limitBytes: callerLimit, ...(tracking ? { schema: windowRequired ? WINDOW_PROOF_SCHEMA : WRITE_PROOF_SCHEMA, kind } : kind === 'delete' ? { schema: RESERVATION_SCHEMA, kind } : {}) }),
    });
    if (!response.ok) {
      const code = await response.json<{ code?: string }>().then(value => value.code).catch(() => undefined);
      throw new PlayttCapacityError(response.status === 507 ? 507 : 503, code === 'playtt_write_window' ? 'window' : 'capacity');
    }
    const proof = await response.json<{ schema?: string; reserved?: boolean; bytes?: number; limitBytes?: number; ticket?: string; kind?: string; windowId?: string; openedAt?: number; expiresAt?: number }>();
    if (proof.schema !== (windowRequired ? WINDOW_PROOF_SCHEMA : tracking ? WRITE_PROOF_SCHEMA : RESERVATION_SCHEMA) || proof.reserved !== true || proof.bytes !== bytes
        || !Number.isSafeInteger(proof.limitBytes) || proof.limitBytes! < 1 || proof.limitBytes! > callerLimit) throw new PlayttCapacityError(503);
    if ((tracking && !isWriteToken(proof.ticket)) || ((tracking || kind === 'delete') && proof.kind !== kind)) throw new PlayttCapacityError(503);
    if (windowRequired && !validWindowProof(proof)) throw new PlayttCapacityError(503);
    return { ticket: proof.ticket, ...(windowRequired ? { openedAt: proof.openedAt, expiresAt: proof.expiresAt } : {}) };
    } catch (error) {
      throw error instanceof PlayttCapacityError ? error : new PlayttCapacityError(503);
    }
  };
  const settled = async (ticket: string | undefined, notAttempted = false): Promise<void> => {
    if (!tracking) return;
    // Only this ticket's idempotent acknowledgement is retried. Reservation and
    // R2 mutation are never replayed, and an ambiguous R2 rejection never calls
    // this function. Healthy writes still make exactly one settlement call.
    const attempts = 3;
    for (let attempt = 1; attempt <= attempts; attempt++) {
      try {
        const response = await playttCapacityStub(env).fetch('https://playtt-capacity.invalid/tracking/settle', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ticket }),
        });
        if (!response.ok) { await response.body?.cancel(); throw new PlayttCapacityError(503); }
        const proof = await response.json<{ schema?: string; settled?: boolean; ticket?: string }>();
        if (proof.schema !== WRITE_SETTLED_SCHEMA || proof.settled !== true || proof.ticket !== ticket) throw new PlayttCapacityError(503);
        if (attempt > 1) console.info(JSON.stringify({ schema: 'playtt/r2-write-ack-recovered/v1', knownR2Completion: !notAttempted, ...(notAttempted ? { notAttempted: true } : {}), attempts: attempt }));
        return;
      } catch {
        if (attempt < attempts) await new Promise<void>(resolve => setTimeout(resolve, attempt * 100));
      }
    }
    // Preserve confirmed R2 success (or the known no-dispatch rejection) even
    // when all acknowledgements fail. An
    // unresolved durable ticket still blocks maintenance; there is no refund,
    // force-clear or inference of a failed R2 operation from an elapsed timer.
    console.warn(JSON.stringify({ schema: 'playtt/r2-write-ack-failure/v1', knownR2Completion: !notAttempted, ...(notAttempted ? { notAttempted: true } : {}), attempts }));
  };
  const wrapped = {
    head: bucket.head.bind(bucket), get: bucket.get.bind(bucket), list: bucket.list.bind(bucket),
    delete: (async (keys: string | string[]) => {
      const selected = typeof keys === 'string' ? [keys] : keys;
      if (!Array.isArray(selected) || selected.length > 1000 || selected.some(key => typeof key !== 'string' || (!key.startsWith('sites/default/') && !key.startsWith('runtime/')))) throw new PlayttCapacityError(503);
      const proof = await reserve(0, 'delete');
      if (proof.expiresAt !== undefined && (Date.now() < proof.openedAt! || Date.now() >= proof.expiresAt)) {
        // Valid reservation, but this caller has not dispatched R2. This local
        // evidence, not an elapsed timer, permits acknowledging the unused ticket.
        await settled(proof.ticket, true); throw new PlayttCapacityError(503, 'window');
      }
      await bucket.delete(keys);
      await settled(proof.ticket);
    }) as R2Bucket['delete'],
    put: (async (key: string, value: Parameters<R2Bucket['put']>[1], options?: R2PutOptions) => {
      if (!key.startsWith('sites/default/') && !key.startsWith('runtime/')) throw new PlayttCapacityError(503);
      const bytes = bytesOf(value);
      const proof = await reserve(bytes); // Durable charge and open ticket precede every attempted R2 write.
      if (bytesOf(value) !== bytes) throw new PlayttCapacityError(503);
      if (proof.expiresAt !== undefined && (Date.now() < proof.openedAt! || Date.now() >= proof.expiresAt)) {
        await settled(proof.ticket, true); throw new PlayttCapacityError(503, 'window');
      }
      // Conditional misses, failures, aborts and overwrites keep their charge.
      // No automatic refund can make uncertain writes disappear from the bound.
      const result = await bucket.put(key, value, options);
      // No finally acknowledgement: an R2 rejection may have an unknown outcome.
      await settled(proof.ticket);
      return result;
    }) as R2Bucket['put'],
    createMultipartUpload: async () => { throw new PlayttCapacityError(503); },
    resumeMultipartUpload: () => { throw new PlayttCapacityError(503); },
  } as R2Bucket;
  guarded.add(wrapped);
  return { ...env, WORDPRESS_STATE_BUCKET: wrapped };
}

function validateLedger(value: Ledger, scope: string): void {
  if (!value || value.schema !== SCHEMA || value.scope !== scope || !Number.isFinite(Date.parse(value.initializedAt))
      || ![value.baselineBytes, value.baselineObjects, value.chargedBytes, value.chargedPuts].every(v => Number.isSafeInteger(v) && v >= 0)
      || !Number.isSafeInteger(value.baselineBytes + value.chargedBytes)) throw new PlayttCapacityError(503);
  if (value.writeTracking !== undefined) validateWriteTracking(value.writeTracking);
  if (value.writeTracking?.window) writeWindowStatus(value.writeTracking.window, value.chargedBytes, Date.now());
}

export class PlayttStorageBudget implements DurableObject {
  private tail: Promise<void> = Promise.resolve();
  constructor(private state: DurableObjectState, private env: PlayttCapacityEnv, private now: () => number = () => Date.now()) {}

  fetch(request: Request): Promise<Response> {
    const result = this.tail.then(() => this.handle(request)).catch(error => {
      if (error instanceof PlayttRecoveryError) return Response.json({ code: 'playtt_recovery_upload', message: error.message }, { status: error.status });
      if (error instanceof PlayttWriteWindowError) return Response.json({ code: 'playtt_write_window', message: error.message }, { status: error.status });
      if (error instanceof PlayttWriteDrainError) return Response.json({ code: 'playtt_write_drain', message: error.message }, { status: error.status });
      if (error instanceof PlayttCapacityError) return playttCapacityResponse(error);
      return playttCapacityResponse(new PlayttCapacityError(503));
    });
    this.tail = result.then(() => undefined, () => undefined);
    return result;
  }

  private async handle(request: Request): Promise<Response> {
    const limit = playttCapacityLimit(this.env);
    if (limit === null) throw new PlayttCapacityError(503);
    const scope = this.env.PLAYTT_R2_CAPACITY_SCOPE!;
    const path = new URL(request.url).pathname;
    if (path.startsWith('/recovery/')) {
      if (!recoveryEnabled(this.env)) return new Response('Recovery uploads are disabled', { status: 404 });
      return handleRecoveryOperation(request, {
        storage: this.state.storage, bucket: this.env.WORDPRESS_STATE_BUCKET, now: this.now,
        reserve: async (tx, bytes) => {
          const ledger = await tx.get<Ledger>(KEY);
          if (!ledger) throw new PlayttCapacityError(503);
          validateLedger(ledger, scope);
          if (!ledger.writeTracking || ledger.writeTracking.pending.length) throw new PlayttWriteDrainError(409, 'Existing pending operations require reconciliation.');
          const proof = await this.reserveInTransaction(tx, { bytes, schema: WINDOW_PROOF_SCHEMA, kind: 'put' }, scope, limit);
          if (!proof.ticket || !proof.windowProof) throw new PlayttCapacityError(503);
          return { ticket: proof.ticket, expiresAt: proof.windowProof.expiresAt };
        },
        settle: async (tx, ticket) => {
          const ledger = await tx.get<Ledger>(KEY);
          if (!ledger) throw new PlayttCapacityError(503);
          validateLedger(ledger, scope);
          if (!ledger.writeTracking) throw new PlayttCapacityError(503);
          settleTrackedWrite(ledger.writeTracking, ticket);
          validateLedger(ledger, scope); await tx.put(KEY, ledger);
        },
      });
    }
    if (path === '/status' && request.method === 'GET') return this.status(limit);
    if (path === '/window/admission' && request.method === 'GET') {
      const ledger = await this.state.storage.get<Ledger>(KEY);
      if (!ledger) throw new PlayttCapacityError(503);
      validateLedger(ledger, scope);
      if (ledger.writeTracking?.drain) throw new PlayttWriteWindowError(503, 'R2 mutations are sealed for maintenance.');
      requireWindowAdmission(ledger.writeTracking?.window, ledger.chargedBytes, this.now());
      const window = ledger.writeTracking!.window!;
      return Response.json({ schema: WINDOW_ADMISSION_SCHEMA, allowed: true, windowId: window.id, openedAt: window.openedAt, expiresAt: window.expiresAt });
    }
    if (path.startsWith('/window/') && request.method === 'POST') return this.windowAction(path, request, scope, limit);
    if (path === '/initialize' && request.method === 'POST') {
      const previous = await this.state.storage.get<Ledger>(KEY);
      if (previous !== undefined) { validateLedger(previous, scope); return this.status(limit); }
      let cursor: string | undefined, bytes = 0, count = 0;
      const cursors = new Set<string>();
      let complete = false;
      for (let page = 0; page < 100; page++) {
        const result = await this.env.WORDPRESS_STATE_BUCKET.list({ limit: 1000, ...(cursor ? { cursor } : {}) });
        for (const object of result.objects) {
          if (!Number.isSafeInteger(object.size) || object.size < 0 || object.storageClass !== 'Standard') throw new PlayttCapacityError(503);
          bytes += object.size; count++;
          if (!Number.isSafeInteger(bytes)) throw new PlayttCapacityError(503);
        }
        if (result.truncated === false) { complete = true; break; }
        if (!result.truncated || !result.cursor || cursors.has(result.cursor)) throw new PlayttCapacityError(503);
        cursor = result.cursor; cursors.add(cursor);
      }
      if (!complete) throw new PlayttCapacityError(503);
      const ledger: Ledger = { schema: SCHEMA, scope, baselineBytes: bytes, baselineObjects: count,
        chargedBytes: 0, chargedPuts: 0, initializedAt: new Date().toISOString() };
      await this.state.storage.put(KEY, ledger);
      return this.status(limit);
    }
    if (path.startsWith('/tracking/') && request.method === 'POST') return this.trackingAction(path, request, scope, limit);
    if (path !== '/reserve' || request.method !== 'POST') return new Response('Not found', { status: 404 });
    const raw = await request.text();
    if (raw.length > 256) throw new PlayttCapacityError(503);
    const input = JSON.parse(raw) as { bytes: number; limitBytes: number; schema?: string; kind?: WriteKind };
    if (!Number.isSafeInteger(input.bytes) || input.bytes < 0 || !Number.isSafeInteger(input.limitBytes)
        || input.limitBytes < 1 || input.limitBytes > 2_000_000_000) throw new PlayttCapacityError(503);
    const effectiveLimit = Math.min(limit, input.limitBytes);
    const { ticket, windowProof } = await this.state.storage.transaction(transaction => this.reserveInTransaction(transaction, input, scope, effectiveLimit));
    return Response.json({ schema: windowProof ? WINDOW_PROOF_SCHEMA : ticket ? WRITE_PROOF_SCHEMA : RESERVATION_SCHEMA, reserved: true, bytes: input.bytes, limitBytes: effectiveLimit, ...(input.kind ? { kind: input.kind } : {}), ...(ticket ? { ticket } : {}), ...windowProof });
  }

  private async reserveInTransaction(transaction: DurableObjectTransaction, input: { bytes: number; schema?: string; kind?: WriteKind }, scope: string, effectiveLimit: number) {
      let ticket: string | undefined;
      let windowProof: { windowId: string; openedAt: number; expiresAt: number } | undefined;
      const ledger = await transaction.get<Ledger>(KEY);
      if (!ledger) throw new PlayttCapacityError(503);
      validateLedger(ledger, scope);
      const trackingRequired = this.env.PLAYTT_R2_WRITE_TRACKING === 'v1' || ledger.writeTracking !== undefined;
      const windowRequired = this.env.PLAYTT_R2_WRITE_WINDOW === 'v1' || ledger.writeTracking?.schema === WINDOW_TRACKING_SCHEMA;
      if (windowRequired) {
        if (input.schema !== WINDOW_PROOF_SCHEMA) throw new PlayttWriteWindowError(503, 'A window-aware caller is required.');
        requireWindowAdmission(ledger.writeTracking?.window, ledger.chargedBytes, this.now(), input.bytes);
        const window = ledger.writeTracking!.window!;
        windowProof = { windowId: window.id, openedAt: window.openedAt, expiresAt: window.expiresAt };
      }
      if (trackingRequired) {
        if (!ledger.writeTracking || input.schema !== (windowRequired ? WINDOW_PROOF_SCHEMA : WRITE_PROOF_SCHEMA) || !['put', 'delete'].includes(input.kind ?? '')
          || (input.kind === 'delete' && input.bytes !== 0)) throw new PlayttCapacityError(503);
        ticket = openTrackedWrite(ledger.writeTracking, input.kind!, input.bytes);
        if (windowRequired) ledger.writeTracking.window!.operations++;
      } else if ((input.schema !== undefined || input.kind !== undefined) && !(input.schema === RESERVATION_SCHEMA && input.kind === 'delete' && input.bytes === 0)) throw new PlayttCapacityError(503);
      if (input.bytes > effectiveLimit - ledger.baselineBytes - ledger.chargedBytes) throw new PlayttCapacityError(507);
      const next = { ...ledger, chargedBytes: ledger.chargedBytes + input.bytes, chargedPuts: ledger.chargedPuts + (input.kind === 'delete' ? 0 : 1) };
      validateLedger(next, scope);
      await transaction.put(KEY, next);
      return { ticket, windowProof };
  }

  private async windowAction(path: string, request: Request, scope: string, limit: number): Promise<Response> {
    const raw = await request.text(); if (raw.length > 1024) throw new PlayttCapacityError(503);
    const input = JSON.parse(raw) as WindowArmInput & { drainToken?: string };
    await this.state.storage.transaction(async transaction => {
      const ledger = await transaction.get<Ledger>(KEY); if (!ledger) throw new PlayttCapacityError(503);
      validateLedger(ledger, scope);
      const tracking = ledger.writeTracking; if (!tracking) throw new PlayttCapacityError(503);
      if (path === '/window/arm') {
        if (this.env.PLAYTT_R2_WRITE_WINDOW !== 'v1' || !tracking.drain || tracking.drain.token !== input.drainToken || tracking.pending.length)
          throw new PlayttWriteWindowError(409, 'Owned write seal and zero pending operations are required.');
        tracking.window = armWriteWindow(tracking.window, input, ledger.chargedBytes, Math.max(0, limit - ledger.baselineBytes - ledger.chargedBytes), this.now());
        tracking.schema = WINDOW_TRACKING_SCHEMA;
      } else if (path === '/window/close') {
        if (!tracking.window) throw new PlayttWriteWindowError(503, 'Write window is unavailable.');
        closeWriteWindow(tracking.window, input.token, this.now());
      } else throw new PlayttWriteWindowError(503, 'Unknown write window action.');
      validateLedger(ledger, scope); await transaction.put(KEY, ledger);
    });
    return this.status(limit);
  }

  private async trackingAction(path: string, request: Request, scope: string, limit: number): Promise<Response> {
    const raw = await request.text();
    if (raw.length > 256) throw new PlayttCapacityError(503);
    const input = (raw ? JSON.parse(raw) : {}) as { token?: string; ticket?: string };
    let publicProof: object | undefined;
    await this.state.storage.transaction(async transaction => {
      const ledger = await transaction.get<Ledger>(KEY);
      if (!ledger) throw new PlayttCapacityError(503);
      validateLedger(ledger, scope);
      if (path === '/tracking/initialize') {
        if (this.env.PLAYTT_R2_WRITE_TRACKING !== 'v1') throw new PlayttCapacityError(503);
        if (ledger.writeTracking === undefined) ledger.writeTracking = newWriteTracking();
      } else {
        if (!ledger.writeTracking) throw new PlayttCapacityError(503);
        if (path === '/tracking/settle') {
          settleTrackedWrite(ledger.writeTracking, input.ticket);
          publicProof = { schema: WRITE_SETTLED_SCHEMA, settled: true, ticket: input.ticket };
        } else if (path === '/tracking/acquire') acquireWriteDrain(ledger.writeTracking, input.token);
        else if (path === '/tracking/release') releaseWriteDrain(ledger.writeTracking, input.token);
        else throw new PlayttCapacityError(503);
      }
      validateLedger(ledger, scope);
      await transaction.put(KEY, ledger);
    });
    return publicProof ? Response.json(publicProof) : this.status(limit);
  }

  private async status(limit: number): Promise<Response> {
    const ledger = await this.state.storage.get<Ledger>(KEY);
    if (!ledger) return Response.json({ schema: SCHEMA, reservationSchema: RESERVATION_SCHEMA, initialized: false, limitBytes: limit, trackingConfigured: this.env.PLAYTT_R2_WRITE_TRACKING === 'v1', windowConfigured: this.env.PLAYTT_R2_WRITE_WINDOW === 'v1' });
    validateLedger(ledger, this.env.PLAYTT_R2_CAPACITY_SCOPE!);
    const { writeTracking, ...publicLedger } = ledger;
    return Response.json({ ...publicLedger, ...(writeTracking ? { writeTracking: { ...writeTrackingStatus(writeTracking), ...(writeTracking.window ? { window: writeWindowStatus(writeTracking.window, ledger.chargedBytes, this.now()) } : {}) } } : {}), reservationSchema: writeTracking?.window ? WINDOW_PROOF_SCHEMA : writeTracking ? WRITE_PROOF_SCHEMA : RESERVATION_SCHEMA, initialized: true, limitBytes: limit, trackingConfigured: this.env.PLAYTT_R2_WRITE_TRACKING === 'v1', windowConfigured: this.env.PLAYTT_R2_WRITE_WINDOW === 'v1',
      remainingBytes: Math.max(0, limit - ledger.baselineBytes - ledger.chargedBytes),
      accounting: 'payload baseline plus all attempted put bytes; no automatic refunds' });
  }
}
