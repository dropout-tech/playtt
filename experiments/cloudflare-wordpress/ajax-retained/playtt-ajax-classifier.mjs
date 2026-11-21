// Diagnostic metadata only. Never return field values, cookie, nonce or a raw body.
export async function boundedText(body, limit) {
  if (!body) return { complete: true, text: '', bytes: 0 };
  const reader = body.getReader(), parts = [];
  let bytes = 0;
  try {
    while (true) {
      const next = await reader.read();
      if (next.done) {
        const out = new Uint8Array(bytes); let at = 0;
        for (const part of parts) { out.set(part, at); at += part.length; }
        return { complete: true, text: new TextDecoder().decode(out), bytes };
      }
      bytes += next.value.length;
      if (bytes > limit) { void reader.cancel().catch(() => {}); return { complete: false, bytes }; }
      parts.push(next.value);
    }
  } finally { reader.releaseLock(); }
}

export async function classifyAjax(request) {
  const type = request.headers.get('content-type') || '';
  const encoding = type.startsWith('application/x-www-form-urlencoded') ? 'urlencoded' : type.startsWith('multipart/form-data;') ? 'multipart' : 'unsupported';
  if (encoding === 'unsupported') return { action: 'unsupported-content-type', encoding };
  const read = await boundedText(request.clone().body, 8192);
  if (!read.complete) return { action: 'over-bound', encoding };
  let form;
  try { form = encoding === 'urlencoded' ? new URLSearchParams(read.text) : await new Response(read.text, { headers: { 'content-type': type } }).formData(); }
  catch { return { action: 'parse-failed', encoding }; }
  const actions = form.getAll('action'), raw = actions.length === 1 ? actions[0] : '';
  const action = actions.length === 0 ? 'missing' : actions.length !== 1 ? 'duplicate' : typeof raw !== 'string' ? 'invalid-action-type' : ['heartbeat', 'wp-remove-post-lock', 'autosave'].includes(raw) ? raw : 'other';
  return { action, encoding, formBytes: read.bytes, hasPostId: form.has('post_ID'), hasActiveLock: form.has('active_post_lock') };
}
