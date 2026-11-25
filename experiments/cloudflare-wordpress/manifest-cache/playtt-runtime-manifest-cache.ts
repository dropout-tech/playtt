export interface PlayttManifestIdentity {
  revision: string;
  manifestKey: string;
  persistedAt: string;
}

function sameIdentity(a: PlayttManifestIdentity, b: PlayttManifestIdentity): boolean {
  return a.revision === b.revision && a.manifestKey === b.manifestKey && a.persistedAt === b.persistedAt;
}

function freezeJson(value: unknown): void {
  if (value && typeof value === 'object') {
    for (const child of Object.values(value)) freezeJson(child);
    Object.freeze(value);
  }
}

// One metadata-only entry owned by one PHP runtime, never a source of truth.
// Callers still obtain the current pointer under the canonical lease. Only a
// validated R2 manifest or a fully persisted new manifest may be remembered.
export class PlayttRuntimeManifestCache<T extends PlayttManifestIdentity> {
  private entry?: { root: string; value: T };
  constructor(private readonly maxBytes = 256 * 1024) {
    if (!Number.isSafeInteger(maxBytes) || maxBytes < 0) throw new Error('Manifest cache budget is invalid.');
  }

  get(root: string, pointer: PlayttManifestIdentity): T | undefined {
    return this.entry?.root === root && sameIdentity(this.entry.value, pointer) ? this.entry.value : undefined;
  }

  remember(root: string, pointer: PlayttManifestIdentity, manifest: T): boolean {
    this.entry = undefined;
    if (!/^sites\/[a-z0-9_-]{1,128}$/i.test(root) || !sameIdentity(pointer, manifest)
      || !manifest.manifestKey.startsWith(root + '/')) throw new Error('Manifest cache identity is invalid.');
    const serialized = JSON.stringify(manifest);
    if (new TextEncoder().encode(serialized).byteLength > this.maxBytes) return false;
    const value = JSON.parse(serialized) as T;
    freezeJson(value);
    this.entry = { root, value };
    return true;
  }
}
