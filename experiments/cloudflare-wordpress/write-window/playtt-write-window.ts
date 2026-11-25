export const WINDOW_TRACKING_SCHEMA = 'playtt/r2-write-tracking/v2';
export const WINDOW_PROOF_SCHEMA = 'playtt/r2-window-reservation/v1';
export const WINDOW_ADMISSION_SCHEMA = 'playtt/r2-window-admission/v1';
export const MAX_WINDOW_MS = 15 * 60 * 1000;
export const MAX_WINDOW_BYTES = 32 * 1024 * 1024;
export const MAX_WINDOW_OPERATIONS = 512;
const UUID = /^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/;
const token = (v: unknown): v is string => typeof v === 'string' && UUID.test(v);
const integer = (v: unknown): v is number => typeof v === 'number' && Number.isSafeInteger(v) && v >= 0;

export interface WriteWindow {
  schema: 'playtt/r2-write-window/v1';
  id: string;
  token: string;
  openedAt: number;
  expiresAt: number;
  maxBytes: number;
  maxOperations: number;
  baselineChargedBytes: number;
  operations: number;
  closedAt?: number;
}
export interface WindowArmInput {
  token: string;
  previousToken: string | null;
  durationSeconds: number;
  maxBytes: number;
  maxOperations: number;
}
export class PlayttWriteWindowError extends Error {
  constructor(public readonly status: 409 | 503, message: string) { super(message); }
}
function requireValue(value: unknown, message = 'Write window is unavailable.'): asserts value {
  if (!value) throw new PlayttWriteWindowError(503, message);
}
export function validateWriteWindow(value: WriteWindow): void {
  requireValue(value && value.schema === 'playtt/r2-write-window/v1' && token(value.id) && token(value.token));
  requireValue(Object.keys(value).every(key => ['schema','id','token','openedAt','expiresAt','maxBytes','maxOperations','baselineChargedBytes','operations','closedAt'].includes(key)));
  requireValue(integer(value.openedAt) && value.openedAt > 0 && integer(value.expiresAt)
    && value.expiresAt > value.openedAt && value.expiresAt - value.openedAt <= MAX_WINDOW_MS);
  requireValue(integer(value.maxBytes) && value.maxBytes > 0 && value.maxBytes <= MAX_WINDOW_BYTES
    && integer(value.maxOperations) && value.maxOperations > 0 && value.maxOperations <= MAX_WINDOW_OPERATIONS
    && integer(value.baselineChargedBytes) && integer(value.operations) && value.operations <= value.maxOperations);
  requireValue(value.closedAt === undefined || (integer(value.closedAt) && value.closedAt >= value.openedAt));
}
export function armWriteWindow(previous: WriteWindow | undefined, input: WindowArmInput, chargedBytes: number, remainingBytes: number, now: number): WriteWindow {
  requireValue(input && token(input.token) && (input.previousToken === null || token(input.previousToken))
    && integer(input.durationSeconds) && input.durationSeconds > 0 && input.durationSeconds * 1000 <= MAX_WINDOW_MS
    && integer(input.maxBytes) && input.maxBytes > 0 && input.maxBytes <= MAX_WINDOW_BYTES
    && integer(input.maxOperations) && input.maxOperations > 0 && input.maxOperations <= MAX_WINDOW_OPERATIONS
    && integer(chargedBytes) && integer(remainingBytes) && integer(now) && now > 0);
  if (previous) {
    validateWriteWindow(previous);
    if (previous.token === input.token) {
      if (previous.expiresAt - previous.openedAt !== input.durationSeconds * 1000 || previous.maxBytes !== input.maxBytes || previous.maxOperations !== input.maxOperations)
        throw new PlayttWriteWindowError(409, 'Write window identity already has different limits.');
      return previous; // Exact retry never extends, reopens, or resets its allowance.
    }
  }
  if (input.previousToken !== (previous?.token ?? null)) throw new PlayttWriteWindowError(409, 'Previous write window identity differs.');
  requireValue(input.maxBytes <= remainingBytes, 'Write window exceeds verified remaining capacity.');
  const next: WriteWindow = { schema: 'playtt/r2-write-window/v1', id: crypto.randomUUID(), token: input.token,
    openedAt: now, expiresAt: now + input.durationSeconds * 1000, maxBytes: input.maxBytes,
    maxOperations: input.maxOperations, baselineChargedBytes: chargedBytes, operations: 0 };
  validateWriteWindow(next); return next;
}
export function closeWriteWindow(value: WriteWindow, owner: unknown, now: number): void {
  validateWriteWindow(value);
  if (!token(owner) || owner !== value.token) throw new PlayttWriteWindowError(409, 'Write window owner differs.');
  requireValue(integer(now));
  value.closedAt ??= Math.max(value.openedAt, now);
}
export function requireWindowAdmission(value: WriteWindow | undefined, chargedBytes: number, now: number, bytes = 0): void {
  requireValue(value); validateWriteWindow(value);
  requireValue(integer(chargedBytes) && chargedBytes >= value.baselineChargedBytes && integer(now) && integer(bytes));
  requireValue(value.closedAt === undefined && now >= value.openedAt && now < value.expiresAt, 'Write window is closed or expired.');
  requireValue(value.operations < value.maxOperations && chargedBytes - value.baselineChargedBytes < value.maxBytes
    && bytes <= value.maxBytes - (chargedBytes - value.baselineChargedBytes), 'Write window allowance is exhausted.');
}
export function writeWindowStatus(value: WriteWindow, chargedBytes: number, now: number) {
  validateWriteWindow(value);
  requireValue(integer(chargedBytes) && chargedBytes >= value.baselineChargedBytes && chargedBytes - value.baselineChargedBytes <= value.maxBytes);
  const usedBytes = chargedBytes - value.baselineChargedBytes;
  return { schema: value.schema, id: value.id, openedAt: value.openedAt, expiresAt: value.expiresAt,
    maxBytes: value.maxBytes, usedBytes, remainingBytes: value.maxBytes - usedBytes,
    maxOperations: value.maxOperations, operations: value.operations,
    closed: value.closedAt !== undefined, expired: now >= value.expiresAt,
    admitsNewOperations: value.closedAt === undefined && now >= value.openedAt && now < value.expiresAt && value.operations < value.maxOperations && usedBytes < value.maxBytes,
    pendingOperationsExpire: false, automaticReopen: false };
}
