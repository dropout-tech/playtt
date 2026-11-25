// Private research deployment only. This bounds R2 payload allocation attempts,
// not shared-account billing, metadata, reads, or writes through other clients.
export interface PlayttCapacityEnv {
  WORDPRESS_STATE_BUCKET: R2Bucket;
  PLAYTT_STORAGE_BUDGET?: DurableObjectNamespace;
  PLAYTT_R2_CAPACITY_SCOPE?: string;
  PLAYTT_R2_CAPACITY_LIMIT_BYTES?: string;
}

const SCOPE = 'playtt-wordpress-rebuild-audit';
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
}

export class PlayttCapacityError extends Error {
  constructor(public readonly status: 503 | 507 = 507) {
    super(status === 507 ? 'Playtt storage capacity limit reached.' : 'Playtt storage capacity verification is unavailable.');
  }
}

export function playttCapacityResponse(error: PlayttCapacityError): Response {
  return Response.json({ code: error.status === 507 ? 'playtt_storage_capacity' : 'playtt_storage_capacity_unavailable',
    message: error.status === 507 ? '儲存空間已達設定上限，這次變更未完成保存。請保留編輯內容並聯絡管理員。' : '目前無法確認儲存空間，這次變更未完成保存。請保留編輯內容並稍後重試。',
    data: { status: error.status } }, { status: error.status, headers: { 'Cache-Control': 'no-store' } });
}

export function playttCapacityLimit(env: PlayttCapacityEnv): number | null {
  if (env.PLAYTT_R2_CAPACITY_SCOPE === undefined && env.PLAYTT_R2_CAPACITY_LIMIT_BYTES === undefined) return null;
  const raw = env.PLAYTT_R2_CAPACITY_LIMIT_BYTES;
  if (env.PLAYTT_R2_CAPACITY_SCOPE !== SCOPE || !env.PLAYTT_STORAGE_BUDGET || !raw || !/^[1-9][0-9]*$/.test(raw)) throw new PlayttCapacityError(503);
  const limit = Number(raw);
  if (!Number.isSafeInteger(limit) || limit > 2_000_000_000) throw new PlayttCapacityError(503);
  return limit;
}

export function playttCapacityStub(env: PlayttCapacityEnv): DurableObjectStub {
  if (playttCapacityLimit(env) === null) throw new PlayttCapacityError(503);
  return env.PLAYTT_STORAGE_BUDGET!.getByName('playtt-r2-capacity-v1');
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
  const reserve = async (bytes: number): Promise<void> => {
    try {
    const response = await playttCapacityStub(env).fetch('https://playtt-capacity.invalid/reserve', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ bytes, limitBytes: callerLimit }),
    });
    if (!response.ok) throw new PlayttCapacityError(response.status === 507 ? 507 : 503);
    const proof = await response.json<{ schema?: string; reserved?: boolean; bytes?: number; limitBytes?: number }>();
    if (proof.schema !== RESERVATION_SCHEMA || proof.reserved !== true || proof.bytes !== bytes
        || !Number.isSafeInteger(proof.limitBytes) || proof.limitBytes! < 1 || proof.limitBytes! > callerLimit) throw new PlayttCapacityError(503);
    } catch (error) {
      throw error instanceof PlayttCapacityError ? error : new PlayttCapacityError(503);
    }
  };
  const wrapped = {
    head: bucket.head.bind(bucket), get: bucket.get.bind(bucket), list: bucket.list.bind(bucket), delete: bucket.delete.bind(bucket),
    put: (async (key: string, value: Parameters<R2Bucket['put']>[1], options?: R2PutOptions) => {
      if (!key.startsWith('sites/default/') && !key.startsWith('runtime/')) throw new PlayttCapacityError(503);
      const bytes = bytesOf(value);
      await reserve(bytes); // Durable charge precedes every attempted R2 write.
      if (bytesOf(value) !== bytes) throw new PlayttCapacityError(503);
      // Conditional misses, failures, aborts and overwrites keep their charge.
      // No automatic refund can make uncertain writes disappear from the bound.
      return bucket.put(key, value, options);
    }) as R2Bucket['put'],
    createMultipartUpload: async () => { throw new PlayttCapacityError(503); },
    resumeMultipartUpload: () => { throw new PlayttCapacityError(503); },
  } as R2Bucket;
  guarded.add(wrapped);
  return { ...env, WORDPRESS_STATE_BUCKET: wrapped };
}

function validateLedger(value: Ledger): void {
  if (value.schema !== SCHEMA || value.scope !== SCOPE || !Number.isFinite(Date.parse(value.initializedAt))
      || ![value.baselineBytes, value.baselineObjects, value.chargedBytes, value.chargedPuts].every(v => Number.isSafeInteger(v) && v >= 0)
      || !Number.isSafeInteger(value.baselineBytes + value.chargedBytes)) throw new PlayttCapacityError(503);
}

export class PlayttStorageBudget implements DurableObject {
  private tail: Promise<void> = Promise.resolve();
  constructor(private state: DurableObjectState, private env: PlayttCapacityEnv) {}

  fetch(request: Request): Promise<Response> {
    const result = this.tail.then(() => this.handle(request)).catch(error => {
      if (error instanceof PlayttCapacityError) return playttCapacityResponse(error);
      return playttCapacityResponse(new PlayttCapacityError(503));
    });
    this.tail = result.then(() => undefined, () => undefined);
    return result;
  }

  private async handle(request: Request): Promise<Response> {
    const limit = playttCapacityLimit(this.env);
    if (limit === null) throw new PlayttCapacityError(503);
    const path = new URL(request.url).pathname;
    if (path === '/status' && request.method === 'GET') return this.status(limit);
    if (path === '/initialize' && request.method === 'POST') {
      const previous = await this.state.storage.get<Ledger>(KEY);
      if (previous) { validateLedger(previous); return this.status(limit); }
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
      const ledger: Ledger = { schema: SCHEMA, scope: SCOPE, baselineBytes: bytes, baselineObjects: count,
        chargedBytes: 0, chargedPuts: 0, initializedAt: new Date().toISOString() };
      await this.state.storage.put(KEY, ledger);
      return this.status(limit);
    }
    if (path !== '/reserve' || request.method !== 'POST') return new Response('Not found', { status: 404 });
    const raw = await request.text();
    if (raw.length > 128) throw new PlayttCapacityError(503);
    const input = JSON.parse(raw) as { bytes: number; limitBytes: number };
    if (!Number.isSafeInteger(input.bytes) || input.bytes < 0 || !Number.isSafeInteger(input.limitBytes)
        || input.limitBytes < 1 || input.limitBytes > 2_000_000_000) throw new PlayttCapacityError(503);
    const effectiveLimit = Math.min(limit, input.limitBytes);
    await this.state.storage.transaction(async transaction => {
      const ledger = await transaction.get<Ledger>(KEY);
      if (!ledger) throw new PlayttCapacityError(503);
      validateLedger(ledger);
      if (input.bytes > effectiveLimit - ledger.baselineBytes - ledger.chargedBytes) throw new PlayttCapacityError(507);
      const next = { ...ledger, chargedBytes: ledger.chargedBytes + input.bytes, chargedPuts: ledger.chargedPuts + 1 };
      validateLedger(next);
      await transaction.put(KEY, next);
    });
    return Response.json({ schema: RESERVATION_SCHEMA, reserved: true, bytes: input.bytes, limitBytes: effectiveLimit });
  }

  private async status(limit: number): Promise<Response> {
    const ledger = await this.state.storage.get<Ledger>(KEY);
    if (!ledger) return Response.json({ schema: SCHEMA, reservationSchema: RESERVATION_SCHEMA, initialized: false, limitBytes: limit });
    validateLedger(ledger);
    return Response.json({ ...ledger, reservationSchema: RESERVATION_SCHEMA, initialized: true, limitBytes: limit,
      remainingBytes: Math.max(0, limit - ledger.baselineBytes - ledger.chargedBytes),
      accounting: 'payload baseline plus all attempted put bytes; no automatic refunds' });
  }
}
