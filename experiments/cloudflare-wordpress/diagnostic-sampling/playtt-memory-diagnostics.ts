import type { PHP } from '@php-wasm/universal';

const sampled = new WeakSet<PHP>();

export function collectPlayttFileMemory(root: any, heapBuffer?: ArrayBufferLike) {
  const result = { fileBytes: 0, files: 0, heapAliasedFileBytes: 0, unknownFileBuffers: 0, categories: {} as Record<string, number> };
  const seen = new Set<object>();
  function visit(node: any, path: string): void {
    if (!node || typeof node !== 'object' || seen.has(node)) return;
    seen.add(node);
    const kind = node.mode & 0xf000;
    if (kind === 0x4000) {
      // Only directory entries are recursive. Never enumerate file bytes,
      // including arrays or typed arrays from another JavaScript realm.
      if (node.contents && typeof node.contents === 'object') {
        for (const [name, child] of Object.entries(node.contents)) visit(child, path + '/' + name);
      }
      return;
    }
    if (kind !== 0x8000) return;
    const bytes = node.contents;
    let size: number;
    if (ArrayBuffer.isView(bytes)) size = bytes.byteLength;
    else if (Array.isArray(bytes)) size = bytes.length;
    else if (bytes == null && node.usedBytes === 0) size = 0;
    else { result.unknownFileBuffers++; return; }
    result.fileBytes += size; result.files++;
    if (ArrayBuffer.isView(bytes) && bytes.buffer === heapBuffer) result.heapAliasedFileBytes += size;
    const category = path.includes('/wp-content/markdown/') ? 'canonical' : path.includes('/wp-content/uploads/') ? 'uploads' : path.includes('/wp-content/languages/') ? 'languages' : path.includes('/wp-content/') ? 'plugins-and-theme' : path.includes('/wordpress/') ? 'wordpress-core' : path.includes('/tmp/') ? 'temporary' : 'runtime';
    result.categories[category] = (result.categories[category] || 0) + size;
  }
  visit(root, '');
  return result;
}

export function playttRuntimeMemoryEvidence(php: PHP, stage: string) {
  const key = Object.getOwnPropertySymbols(php).find(symbol => symbol.description === '__private__dont__use');
  const module = key ? (php as unknown as Record<symbol, any>)[key] : undefined;
  const fileScanPerformed = !!module?.FS?.root && (!sampled.has(php) || stage === 'after-persist');
  const files = fileScanPerformed ? collectPlayttFileMemory(module.FS.root, module.HEAPU8?.buffer) : {};
  if (fileScanPerformed) sampled.add(php);
  // No stale file totals on unsampled requests; heap stays available each time.
  return { heapBytes: module?.HEAPU8?.byteLength || 0, fileScanPerformed, ...files };
}
