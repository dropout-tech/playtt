import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { PlayttStorageBudget, type PlayttCapacityEnv } from '../../src/playtt-storage-capacity.js';
import { routeRecoveryRequest, readRecoveryObject, verifyRecoveryTransition } from '../../src/playtt-recovery-uploads.js';

export function upload(text = '復原資料', operationId = crypto.randomUUID()) {
  const bytes = Buffer.from(text), sha256 = createHash('sha256').update(bytes).digest('hex');
  return { operationId, key: 'sites/default/markdown/objects/' + sha256, sha256, size: bytes.length, base64: bytes.toString('base64') };
}
export async function recoveryFixture(maxBytes = 1024 * 1024 + 1, maxOperations = 96) {
  const values = new Map<string, any>(), data = new Map<string, Uint8Array>();
  let now = Date.now(), puts = 0, renewals = 0;
  let failPhase: string | undefined, afterWrite = false, unknownR2 = false, advancePhase: string | undefined;
  const pointerState: any = { state: null, receipts: new Map(), pins: [] };
  let pointerRace = false;
  const storage = {
    async get(key: string) { return structuredClone(values.get(key)); },
    async put(key: string, value: any) {
      if (key.startsWith('playtt-recovery-upload-v1:') && value.phase === failPhase) {
        failPhase = undefined;
        if (afterWrite) values.set(key, structuredClone(value));
        throw Error('Simulated persistence interruption');
      }
      values.set(key, structuredClone(value));
      if (advancePhase !== undefined && value.phase === advancePhase) { advancePhase = undefined; now += 601_000; }
    },
    async transaction<T>(fn: (tx: typeof storage) => Promise<T>) {
      const before = structuredClone(values);
      try { return await fn(storage); } catch (error) { values.clear(); for (const [k, v] of before) values.set(k, v); throw error; }
    },
  };
  const raw = {
    async list() { return { objects: [], truncated: false }; },
    async get(key: string) { const bytes = data.get(key); return bytes ? { size: bytes.length, etag: createHash('sha256').update(bytes).digest('hex'), body: new Blob([bytes]).stream() } : null; },
    async put(key: string, bytes: Uint8Array, options: R2PutOptions) {
      puts++;
      if (key.endsWith('/current.json')) {
        if (pointerRace) { pointerRace = false; data.set(key, new TextEncoder().encode(JSON.stringify({ ...pointerState.state.pointer, revision: crypto.randomUUID() }))); }
        const current = data.get(key); if (!current || createHash('sha256').update(current).digest('hex') !== (options.onlyIf as R2Conditional)?.etagMatches) return null;
      } else { assert.deepEqual(options.onlyIf, { etagDoesNotMatch: '*' }); if (data.has(key)) return null; }
      data.set(key, bytes.slice());
      if (unknownR2) throw Error('R2 result is unknown after dispatch');
      return { key, etag: 'local-etag' };
    },
  } as unknown as R2Bucket;
  const env: PlayttCapacityEnv = { WORDPRESS_STATE_BUCKET: raw, PLAYTT_RECOVERY_UPLOADS: 'v1', PLAYTT_PROBE_GATE: 'true',
    PLAYTT_STATE_PARTITION: 'restore-v1', PLAYTT_R2_CAPACITY_SCOPE: 'playtt-wordpress-session-audit',
    PLAYTT_R2_CAPACITY_LIMIT_BYTES: String(maxBytes), PLAYTT_R2_WRITE_TRACKING: 'v1', PLAYTT_R2_WRITE_WINDOW: 'v1' };
  let actor: PlayttStorageBudget;
  const stub = { fetch: (request: Request) => actor.fetch(request) };
  env.PLAYTT_STORAGE_BUDGET = { getByName: () => stub } as unknown as DurableObjectNamespace;
  const restart = () => { actor = new PlayttStorageBudget({ storage } as unknown as DurableObjectState, env, () => now); }; restart();
  const internal = (path: string, input?: unknown) => actor.fetch(new Request('https://budget.invalid' + path,
    input === undefined ? {} : { method: 'POST', body: JSON.stringify(input) }));
  const fenceToken = crypto.randomUUID(), drain = crypto.randomUUID(), window = crypto.randomUUID();
  for (const [path, input] of [
    ['/initialize', {}], ['/tracking/initialize', {}], ['/tracking/acquire', { token: drain }],
    ['/window/arm', { token: window, previousToken: null, drainToken: drain, durationSeconds: 600, maxBytes, maxOperations }],
    ['/tracking/release', { token: drain }],
  ] as const) assert.equal((await internal(path, input)).status, 200);
  const route = (request: Request, siteId = 'default') => routeRecoveryRequest(request, env, {
    siteId, authorized: async () => request.headers.get('Authorization') === 'Bearer local-operator',
    renewFence: async token => { renewals++; assert.equal(token, fenceToken); return { token, expiresAt: now + 600_000 }; }, budget: () => stub,
    readObject: (key, limit) => readRecoveryObject(raw, key, limit),
    verifyTransition: transition => verifyRecoveryTransition(transition, { state: async () => pointerState.state, committed: async v => pointerState.receipts.get(v), backupPins: async () => ({ pins: pointerState.pins }) }),
  });
  const call = (action: string, input?: unknown, authorized = true) => route(new Request('https://private.invalid/__playtt-recovery/' + action,
    { headers: authorized ? { Authorization: 'Bearer local-operator' } : {}, ...(input === undefined ? {} : { method: 'POST', body: JSON.stringify({ ...input as object, fenceToken }) }) }));
  const status = async () => (await internal('/status')).json() as Promise<any>;
  const receipt = async (id: string) => (await call('status?operationId=' + id)).json() as Promise<any>;
  return { env, values, data, call, route, internal, restart, status, receipt, fenceToken, drain, window, pointerState,
    racePointer: () => { pointerRace = true; },
    counts: () => ({ puts, renewals }), fail: (phase: string, after = false) => { failPhase = phase; afterWrite = after; },
    unknown: () => { unknownR2 = true; }, advance: () => { now += 601_000; }, advanceOn: (phase: string) => { advancePhase = phase; } };
}
