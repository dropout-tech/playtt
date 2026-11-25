// A lease timeout does not prove that a previously sent R2 operation settled.
// These durable tickets never expire. Unknown outcomes keep maintenance closed.
export const WRITE_TRACKING_SCHEMA = 'playtt/r2-write-tracking/v1';
export const WRITE_PROOF_SCHEMA = 'playtt/r2-write-reservation/v1';
export const WRITE_SETTLED_SCHEMA = 'playtt/r2-write-settled/v1';
export const MAX_PENDING_WRITES = 128;
export type WriteKind = 'put' | 'delete';
interface PendingWrite { id: string; kind: WriteKind; bytes: number; startedAt: string }
export interface WriteTracking {
  schema: typeof WRITE_TRACKING_SCHEMA;
  initializedAt: string;
  pending: PendingWrite[];
  drain?: { token: string; acquiredAt: string };
}

export class PlayttWriteDrainError extends Error {
  constructor(public readonly status: 409 | 503, message: string) { super(message); }
}
export function isWriteToken(value: unknown): value is string {
  return typeof value === 'string' && /^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/.test(value);
}
export function validateWriteTracking(value: WriteTracking): void {
  const fail = () => { throw new PlayttWriteDrainError(503, 'Write tracking is unavailable.'); };
  if (!value || value.schema !== WRITE_TRACKING_SCHEMA || !Number.isFinite(Date.parse(value.initializedAt))
    || !Array.isArray(value.pending) || value.pending.length > MAX_PENDING_WRITES) fail();
  const ids = new Set<string>();
  for (const item of value.pending) {
    if (!item || !isWriteToken(item.id) || ids.has(item.id) || !['put', 'delete'].includes(item.kind)
      || !Number.isSafeInteger(item.bytes) || item.bytes < 0 || (item.kind === 'delete' && item.bytes !== 0)
      || !Number.isFinite(Date.parse(item.startedAt))) fail();
    ids.add(item.id);
  }
  if (value.drain !== undefined && (!value.drain || !isWriteToken(value.drain.token)
    || !Number.isFinite(Date.parse(value.drain.acquiredAt)) || value.pending.length !== 0)) fail();
}
export function newWriteTracking(): WriteTracking {
  return { schema: WRITE_TRACKING_SCHEMA, initializedAt: new Date().toISOString(), pending: [] };
}
export function openTrackedWrite(value: WriteTracking, kind: WriteKind, bytes: number): string {
  validateWriteTracking(value);
  if (value.drain) throw new PlayttWriteDrainError(503, 'R2 mutations are sealed for maintenance.');
  if (value.pending.length >= MAX_PENDING_WRITES) throw new PlayttWriteDrainError(503, 'Unsettled R2 operations require reconciliation.');
  const id = crypto.randomUUID();
  value.pending.push({ id, kind, bytes, startedAt: new Date().toISOString() });
  validateWriteTracking(value);
  return id;
}
export function settleTrackedWrite(value: WriteTracking, id: unknown): void {
  validateWriteTracking(value);
  if (!isWriteToken(id)) throw new PlayttWriteDrainError(503, 'Invalid R2 operation ticket.');
  // Repeated acknowledgement cannot close a different operation. An absent
  // ticket has no effect, including after an acknowledgement response is lost.
  value.pending = value.pending.filter(item => item.id !== id);
}
export function acquireWriteDrain(value: WriteTracking, token: unknown): void {
  validateWriteTracking(value);
  if (!isWriteToken(token)) throw new PlayttWriteDrainError(503, 'Invalid write drain token.');
  if (value.drain?.token === token) return;
  if (value.drain || value.pending.length) throw new PlayttWriteDrainError(409, 'R2 operations have not drained or another maintenance owner holds the seal.');
  value.drain = { token, acquiredAt: new Date().toISOString() };
}
export function releaseWriteDrain(value: WriteTracking, token: unknown): void {
  validateWriteTracking(value);
  if (!isWriteToken(token)) throw new PlayttWriteDrainError(503, 'Invalid write drain token.');
  if (value.drain && value.drain.token !== token) throw new PlayttWriteDrainError(409, 'Write drain token does not match.');
  delete value.drain;
}
export function writeTrackingStatus(value: WriteTracking) {
  validateWriteTracking(value);
  return { schema: value.schema, initializedAt: value.initializedAt, pending: value.pending.length,
    sealed: !!value.drain, acquiredAt: value.drain?.acquiredAt,
    oldestUnsettledAt: value.pending.length ? value.pending.reduce((a, b) => a.startedAt < b.startedAt ? a : b).startedAt : undefined,
    maximumPending: MAX_PENDING_WRITES, automaticExpiry: false };
}
