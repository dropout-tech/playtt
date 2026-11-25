import type { MarkdownPointer } from './revision-coordinator.js';

export const REFERENCE_ROOTS_SCHEMA = 'playtt/coordinator-reference-roots/v1';
export const MAX_REFERENCE_RECEIPTS = 2048;
const RECORD_KEY = 'wordpress-state-coordinator', PREFIX = 'wordpress-state-commit/', PAGE = 128;
const UUID = /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/;
type ReadStorage = Pick<DurableObjectStorage, 'get' | 'list'>;
export class PlayttReferenceRootsError extends Error {
  readonly status = 503;
  constructor() { super('Coordinator reference inventory is unavailable or exceeds its bounds.'); }
}
function requireRoot(value: unknown): asserts value { if (!value) throw new PlayttReferenceRootsError(); }
function pointer(value: unknown): MarkdownPointer {
  requireRoot(value && typeof value === 'object');
  const p = value as MarkdownPointer;
  requireRoot(typeof p.revision === 'string' && UUID.test(p.revision)
    && p.manifestKey === `sites/default/markdown/revisions/${p.revision}.json`
    && typeof p.persistedAt === 'string' && /(?:Z|[+-]\d\d:\d\d)$/.test(p.persistedAt)
    && Number.isFinite(Date.parse(p.persistedAt)));
  return { revision: p.revision, manifestKey: p.manifestKey, persistedAt: p.persistedAt };
}
const same = (a: MarkdownPointer, b: MarkdownPointer) => a.revision === b.revision && a.manifestKey === b.manifestKey && a.persistedAt === b.persistedAt;

// Called on the coordinator's existing serial queue. No lazy initialization,
// lease expiry cleanup, R2 reads/writes or mutation of returned storage values.
export async function readCoordinatorReferenceRoots(storage: ReadStorage, siteId: string, now = Date.now()) {
  requireRoot(siteId === 'default' && Number.isFinite(now));
  const raw = await storage.get<any>(RECORD_KEY);
  requireRoot(raw?.initialized === true && (raw.siteId ?? 'default') === siteId
    && Number.isSafeInteger(raw.version) && raw.version >= 0);
  const current = raw.pointer === null ? null : pointer(raw.pointer);
  requireRoot(raw.version === 0 ? current === null : current !== null);
  const receipts: { version: number; pointer: MarkdownPointer }[] = [];
  let after: string | undefined;
  for (;;) {
    const rows = await storage.list<unknown>({ prefix: PREFIX, limit: PAGE, ...(after ? { startAfter: after } : {}) });
    requireRoot(rows instanceof Map && rows.size <= PAGE);
    for (const [key, value] of rows) {
      requireRoot(typeof key === 'string' && key.startsWith(PREFIX) && (!after || key > after));
      const suffix = key.slice(PREFIX.length), version = Number(suffix);
      requireRoot(/^[1-9][0-9]*$/.test(suffix) && Number.isSafeInteger(version));
      receipts.push({ version, pointer: pointer(value) });
      requireRoot(receipts.length <= MAX_REFERENCE_RECEIPTS);
      after = key;
    }
    if (rows.size < PAGE) break;
  }
  receipts.sort((a, b) => a.version - b.version);
  requireRoot(new Set(receipts.map(r => r.version)).size === receipts.length);
  if (current) requireRoot(receipts.some(r => r.version === raw.version && same(r.pointer, current)));
  const lease = raw.lease === undefined ? null : (() => {
    const l = raw.lease;
    requireRoot(l && UUID.test(l.token) && Number.isSafeInteger(l.version) && l.version >= 0 && Number.isFinite(l.expiresAt));
    return { version: l.version, base: l.base === null ? null : pointer(l.base), expiresAt: l.expiresAt, active: l.expiresAt > now };
  })();
  const fence = raw.fence === undefined ? null : (() => {
    const f = raw.fence;
    requireRoot(f && UUID.test(f.token) && Number.isFinite(f.expiresAt));
    return { expiresAt: f.expiresAt, active: f.expiresAt > now };
  })();
  const report = { schema: REFERENCE_ROOTS_SCHEMA, siteId, version: raw.version as number, pointer: current,
    lease, fence, commitReceipts: receipts, completeCommitListing: true,
    scope: 'Current pointer, lease base including expired leases, and all stored commit receipts on one coordinator queue; not a complete external-writer or application-root proof',
    safeToApply: false, maximumReceipts: MAX_REFERENCE_RECEIPTS };
  requireRoot(new TextEncoder().encode(JSON.stringify(report)).length <= 512 * 1024);
  return report;
}
