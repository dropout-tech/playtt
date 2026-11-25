// Read-only numeric MEMFS inventory. No file contents or buffer references escape.
// Compressed nodes must be inspected before reading their materializing accessor.
export function collectBackingInventory(root, heapBuffer, compressedPeek) {
  const result = { fileBytes: 0, files: 0, heapAliasedFileBytes: 0, unknownFileBuffers: 0, compressedCoreFiles: 0, compressedCoreBytes: 0, compressedCoreLogicalBytes: 0, categories: {} };
  const detail = { complete: true, visitedNodes: 0, ordinaryViewBytes: 0, ordinaryUsedBytes: 0, invalidUsedBytes: 0, ordinaryArrayElements: 0, uniqueExternalBuffers: 0, uniqueExternalBackingBytes: 0, sharedExternalBuffers: 0, crossCategoryBuffers: 0, heapAliasedViews: 0, maxExternalBufferBytes: 0, byCategory: {}, largestExternalBuffers: [] };
  const seen = new Set(), buffers = new Map();
  function visit(node, path) {
    if (!node || typeof node !== 'object' || seen.has(node)) return;
    if (seen.size >= 16384) { detail.complete = false; return; }
    seen.add(node);
    const kind = node.mode & 0xf000;
    if (kind === 0x4000) {
      if (node.contents && typeof node.contents === 'object') {
        for (const [name, child] of Object.entries(node.contents)) visit(child, path + '/' + name);
      }
      return;
    }
    if (kind !== 0x8000) return;
    const compressed = compressedPeek(node);
    const bytes = compressed ? undefined : node.contents;
    let size;
    if (compressed) {
      size = compressed.compressedBytes;
      result.compressedCoreFiles++;
      result.compressedCoreBytes += size;
      result.compressedCoreLogicalBytes += compressed.logicalBytes;
    } else if (ArrayBuffer.isView(bytes)) size = bytes.byteLength;
    else if (Array.isArray(bytes)) size = bytes.length;
    else if (bytes == null && node.usedBytes === 0) size = 0;
    else { result.unknownFileBuffers++; return; }
    result.fileBytes += size; result.files++;
    const category = path.includes('/wp-content/markdown/') ? 'canonical' : path.includes('/wp-content/uploads/') ? 'uploads' : path.includes('/wp-content/languages/') ? 'languages' : path.includes('/wp-content/') ? 'plugins-and-theme' : path.includes('/wordpress/') ? 'wordpress-core' : path.includes('/tmp/') ? 'temporary' : 'runtime';
    result.categories[category] = (result.categories[category] || 0) + size;
    if (compressed) return;
    if (Number.isSafeInteger(node.usedBytes) && node.usedBytes >= 0 && node.usedBytes <= size) detail.ordinaryUsedBytes += node.usedBytes;
    else detail.invalidUsedBytes++;
    if (Array.isArray(bytes)) { detail.ordinaryArrayElements += bytes.length; return; }
    if (!ArrayBuffer.isView(bytes)) return;
    detail.ordinaryViewBytes += size;
    if (bytes.buffer === heapBuffer) { result.heapAliasedFileBytes += size; detail.heapAliasedViews++; return; }
    let record = buffers.get(bytes.buffer);
    if (!record) {
      if (buffers.size >= 8192) { detail.complete = false; return; }
      record = { bytes: bytes.buffer.byteLength, views: 0, categories: new Set() };
      buffers.set(bytes.buffer, record);
    }
    record.views++; record.categories.add(category);
  }
  visit(root, '');
  detail.visitedNodes = seen.size;
  detail.uniqueExternalBuffers = buffers.size;
  for (const record of buffers.values()) {
    detail.uniqueExternalBackingBytes += record.bytes;
    detail.maxExternalBufferBytes = Math.max(detail.maxExternalBufferBytes, record.bytes);
    if (record.views > 1) detail.sharedExternalBuffers++;
    if (record.categories.size > 1) detail.crossCategoryBuffers++;
    for (const category of record.categories) {
      const group = detail.byCategory[category] ??= { buffers: 0, backingBytes: 0 };
      group.buffers++; group.backingBytes += record.bytes;
    }
    // Fixed-size, numeric/category-only largest-buffer sample. It contains no bytes.
    const item = { bytes: record.bytes, views: record.views, categories: [...record.categories].sort() };
    detail.largestExternalBuffers.push(item);
    detail.largestExternalBuffers.sort((a, b) => b.bytes - a.bytes);
    if (detail.largestExternalBuffers.length > 8) detail.largestExternalBuffers.pop();
  }
  return { ...result, backingInventory: detail };
}
