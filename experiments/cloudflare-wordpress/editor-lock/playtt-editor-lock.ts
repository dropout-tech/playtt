// Minimal backport of WordPress/gutenberg#79997 to the pinned core artifact.
// Opt-in private deployment only; original R2 bytes and canonical data stay intact.
export const PLAYTT_EDITOR_LOCK_FLAG = 'gutenberg-79997-v1';
export const PLAYTT_EDITOR_LOCK_PATH = '/wp-includes/js/dist/editor.min.js';
export const PLAYTT_EDITOR_LOCK_ORIGINAL_SHA = '638befed63bb6937fe54b6f1ec79174c4ec20bef7b5de6ab0948acc9aad2130c';
export const PLAYTT_EDITOR_LOCK_ORIGINAL_SIZE = 1574731;
export const PLAYTT_EDITOR_LOCK_PATCH_SHA = 'ec1e9dc9cdc33309b2b6843bd26a3bec6dffe5e7fc1db0f05f49024e56b9012e';
export const PLAYTT_EDITOR_LOCK_QUERY = 'playtt-core-editor';
const before = 'window.removeEventListener("beforeunload",S)}},[]),!i||n)return null;';
const after = 'window.removeEventListener("beforeunload",S)}},[t,i,d,c,u,r,o]),!i||n)return null;';

async function sha256(bytes: Uint8Array<ArrayBuffer>): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
}

export async function patchPlayttEditorLock(bytes: Uint8Array<ArrayBuffer>): Promise<Uint8Array<ArrayBuffer>> {
  if (bytes.byteLength !== PLAYTT_EDITOR_LOCK_ORIGINAL_SIZE || await sha256(bytes) !== PLAYTT_EDITOR_LOCK_ORIGINAL_SHA) {
    throw new Error('Unsupported core editor artifact for lock backport.');
  }
  const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  const at = text.indexOf(before);
  if (at < 0 || text.indexOf(before, at + before.length) !== -1) throw new Error('Ambiguous editor lock effect.');
  const patched = new TextEncoder().encode(text.slice(0, at) + after + text.slice(at + before.length));
  if (await sha256(patched) !== PLAYTT_EDITOR_LOCK_PATCH_SHA) throw new Error('Editor lock backport integrity failure.');
  return patched;
}

// A new edge cache key alone does not invalidate the browser's immutable cache.
// Only same-origin exact core editor script/preload URLs get a version query.
export function playttEditorVersionedUrl(value: string, requestUrl: string): string | null {
  let url: URL;
  try { url = new URL(value, requestUrl); } catch { return null; }
  if (url.origin !== new URL(requestUrl).origin || url.pathname !== PLAYTT_EDITOR_LOCK_PATH || url.username || url.password) return null;
  url.searchParams.set(PLAYTT_EDITOR_LOCK_QUERY, PLAYTT_EDITOR_LOCK_PATCH_SHA);
  return url.href;
}

export function versionPlayttEditorAssets(request: Request, response: Response, enabled: boolean): Response {
  if (!enabled || request.method !== 'GET' || response.status !== 200
    || !['/wp-admin/post.php', '/wp-admin/post-new.php'].includes(new URL(request.url).pathname)
    || !/^text\/html(?:;|$)/i.test(response.headers.get('content-type') || '')) return response;
  const handler = (attribute: string) => ({ element(element: Element) {
    const value = element.getAttribute(attribute);
    const url = value === null ? null : playttEditorVersionedUrl(value, request.url);
    if (!url) return;
    element.setAttribute(attribute, url);
    if (element.hasAttribute('integrity')) {
      const binary = PLAYTT_EDITOR_LOCK_PATCH_SHA.match(/../g)!.map(hex => String.fromCharCode(parseInt(hex, 16))).join('');
      element.setAttribute('integrity', 'sha256-' + btoa(binary));
    }
  } });
  const result = new Response(response.body, response);
  result.headers.delete('content-length');
  result.headers.delete('etag');
  result.headers.set('x-playtt-core-editor-lock', PLAYTT_EDITOR_LOCK_FLAG);
  return new HTMLRewriter().on('script[src]', handler('src'))
    .on('link[rel="preload"][as="script"][href]', handler('href')).transform(result);
}
