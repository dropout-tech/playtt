// Append-only protection for independently verified local backups. The caller
// must serialize this operation with its coordinator's renewable fence.
const KEY = 'playtt-backup-pins-v1';
export const PLAYTT_BACKUP_PINS_SCHEMA = 'playtt/backup-pins/v1';
const ROOT = 'sites/default/';
const UUID = /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/;
const SHA = /^[a-f0-9]{64}$/;
const MAX_PACK_BYTES = 8 * 1024 * 1024;
const MAX_REGISTRY_BYTES = 64 * 1024;

export interface PlayttBackupPinInput {
  revision: string;
  manifestKey: string;
  persistedAt: string;
  manifestSha256: string;
  packKey: string;
  packSha256: string;
  packBytes: number;
}
interface Pin extends PlayttBackupPinInput { registeredAt: string }
interface Registry { schema: typeof PLAYTT_BACKUP_PINS_SCHEMA; generation: number; pins: Pin[] }

export class PlayttBackupPinError extends Error {
  readonly status: 409 | 503;
  constructor(status: 409 | 503, message: string) { super(message); this.status = status; }
}
function requirePin(value: unknown, message: string): asserts value {
  if (!value) throw new PlayttBackupPinError(503, message);
}
function validDate(value: unknown): value is string {
  return typeof value === 'string' && /(?:Z|[+-]\d\d:\d\d)$/.test(value) && Number.isFinite(Date.parse(value));
}
export function backupPinInput(value: unknown): PlayttBackupPinInput {
  requirePin(value && typeof value === 'object', 'Invalid backup pin.');
  const v = value as PlayttBackupPinInput;
  requirePin(typeof v.revision === 'string' && UUID.test(v.revision)
    && v.manifestKey === `${ROOT}markdown/revisions/${v.revision}.json`
    && validDate(v.persistedAt) && typeof v.manifestSha256 === 'string' && SHA.test(v.manifestSha256)
    && typeof v.packSha256 === 'string' && SHA.test(v.packSha256)
    && v.packKey === `${ROOT}restore-packs/${v.packSha256}.zip`
    && Number.isSafeInteger(v.packBytes) && v.packBytes > 0 && v.packBytes <= MAX_PACK_BYTES, 'Invalid backup pin.');
  return { revision: v.revision, manifestKey: v.manifestKey, persistedAt: v.persistedAt,
    manifestSha256: v.manifestSha256, packKey: v.packKey, packSha256: v.packSha256, packBytes: v.packBytes };
}
function validateRegistry(value: Registry): void {
  requirePin(value && value.schema === PLAYTT_BACKUP_PINS_SCHEMA && Array.isArray(value.pins)
    && value.pins.length <= 128 && value.generation === value.pins.length, 'Backup pin registry is invalid.');
  const revisions = new Set<string>();
  for (const pin of value.pins) {
    backupPinInput(pin);
    requirePin(validDate(pin.registeredAt) && !revisions.has(pin.revision), 'Backup pin registry is invalid.');
    revisions.add(pin.revision);
  }
  requirePin(new TextEncoder().encode(JSON.stringify(value)).length <= MAX_REGISTRY_BYTES, 'Backup pin registry exceeds its budget.');
}
async function sha(bytes: ArrayBuffer): Promise<string> {
  return [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map(x => x.toString(16).padStart(2, '0')).join('');
}
async function readBounded(bucket: R2Bucket, key: string, limit: number): Promise<ArrayBuffer> {
  const object = await bucket.get(key);
  requirePin(object && Number.isSafeInteger(object.size) && object.size > 0 && object.size <= limit, 'Backup object is missing or too large.');
  const reader = object.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const result = await reader.read();
      if (result.done) break;
      length += result.value.byteLength;
      requirePin(length <= object.size && length <= limit, 'Backup object exceeded its declared size.');
      chunks.push(result.value);
    }
  } catch (error) { await reader.cancel().catch(() => undefined); throw error; }
  finally { reader.releaseLock(); }
  requirePin(length === object.size, 'Backup object length changed.');
  const all = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) { all.set(chunk, offset); offset += chunk.length; }
  return all.buffer;
}

export class PlayttBackupPins {
  private storage: DurableObjectStorage;
  private bucket: R2Bucket;
  constructor(storage: DurableObjectStorage, bucket: R2Bucket) { this.storage = storage; this.bucket = bucket; }

  async list(): Promise<Registry> {
    const stored = await this.storage.get<Registry>(KEY);
    const registry: Registry = stored === undefined ? { schema: PLAYTT_BACKUP_PINS_SCHEMA, generation: 0, pins: [] } : stored;
    validateRegistry(registry);
    return registry;
  }

  async register(value: unknown, requireFence: () => void): Promise<{ schema: string; generation: number; created: boolean; pin: Pin }> {
    requireFence();
    const input = backupPinInput(value), registry = await this.list();
    const existing = registry.pins.find(pin => pin.revision === input.revision);
    if (existing) {
      if (JSON.stringify(backupPinInput(existing)) !== JSON.stringify(input)) throw new PlayttBackupPinError(409, 'Backup revision already has a different immutable pin.');
      requireFence();
      return { schema: PLAYTT_BACKUP_PINS_SCHEMA, generation: registry.generation, created: false, pin: existing };
    }
    requirePin(registry.pins.length < 128, 'Backup pin registry is full.');
    const manifestBytes = await readBounded(this.bucket, input.manifestKey, 256 * 1024);
    requirePin(await sha(manifestBytes) === input.manifestSha256, 'Backup manifest hash mismatch.');
    let manifest: Record<string, any>;
    try { manifest = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(manifestBytes)); }
    catch { throw new PlayttBackupPinError(503, 'Backup manifest is invalid.'); }
    requirePin(manifest && manifest.revision === input.revision && manifest.manifestKey === input.manifestKey
      && manifest.persistedAt === input.persistedAt && manifest.restorePack?.schema === 'wp-codebox/cloudflare-canonical-restore-pack/v1'
      && manifest.restorePack?.objectKey === input.packKey && manifest.restorePack.sha256 === input.packSha256
      && manifest.restorePack.size === input.packBytes, 'Backup manifest identity mismatch.');
    const pack = await readBounded(this.bucket, input.packKey, MAX_PACK_BYTES);
    requirePin(pack.byteLength === input.packBytes && await sha(pack) === input.packSha256, 'Backup archive hash mismatch.');
    requireFence(); // I/O must not outlive the owning fence before persisting.
    const pin = { ...input, registeredAt: new Date().toISOString() };
    const next = { ...registry, generation: registry.generation + 1, pins: [...registry.pins, pin] };
    validateRegistry(next);
    // Caller holds the coordinator's serial request queue through this await.
    await this.storage.put(KEY, next);
    return { schema: PLAYTT_BACKUP_PINS_SCHEMA, generation: next.generation, created: true, pin };
  }
}
