// Numeric cumulative byte volume, not allocation/retention accounting.
// Only a fixed build-time label allowlist is stored; input values never survive.
export function createByteVolumeCounter(labels) {
  if (!Array.isArray(labels) || labels.length > 96 || new Set(labels).size !== labels.length || labels.some(s => typeof s !== 'string' || !/^[a-zA-Z0-9_.:/-]{1,120}$/.test(s))) throw Error('Invalid byte-volume labels');
  const names = [...labels], ids = new Map(names.map((s,i) => [s,i])), counts = new Float64Array(names.length), totals = new Float64Array(names.length), maxima = new Float64Array(names.length);
  let complete = true, rejected = 0;
  function observe(label, value) {
    const id = ids.get(label);
    // Genuine ArrayBuffer views include Buffer/DataView and other realms.
    const valid = ArrayBuffer.isView(value) || value instanceof ArrayBuffer || (typeof SharedArrayBuffer !== 'undefined' && value instanceof SharedArrayBuffer);
    const size = valid ? value.byteLength : NaN;
    if (id === undefined || !Number.isSafeInteger(size) || size < 0 || !Number.isSafeInteger(totals[id] + size) || !Number.isSafeInteger(counts[id] + 1)) {
      complete = false; rejected = Math.min(Number.MAX_SAFE_INTEGER, rejected + 1); return value;
    }
    counts[id]++; totals[id] += size; maxima[id] = Math.max(maxima[id], size); return value;
  }
  function snapshot() { return {schema:'playtt/byte-volume/v1',complete,rejected,rows:names.map((label,i)=>({label,calls:counts[i],bytes:totals[i],maxBytes:maxima[i]}))}; }
  return {observe,snapshot};
}
