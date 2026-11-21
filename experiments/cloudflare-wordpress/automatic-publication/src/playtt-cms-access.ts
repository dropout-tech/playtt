import { timingSafeEqual } from 'node:crypto';
const maintenance = new Set(['r2-state','operator-fence-status','operator-fence-acquire','operator-fence-renew','operator-fence-release','operator-restore','operator-publish']);
function authorized(request: Request, secret: string): boolean {
  if (!secret) return false;
  const actual = new TextEncoder().encode(request.headers.get('authorization') || '');
  const expected = new TextEncoder().encode('Bearer ' + secret);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
// This boundary is used when the ordinary WordPress login replaces the temporary
// probe gate. Diagnostics must never become public merely by removing that gate.
export function protectPlayttCms(request: Request, secret: string): Response | null {
  const url = new URL(request.url);
  const denied = () => new Response('Not found', { status: 404, headers: { 'Cache-Control': 'no-store' } });
  let path: string;
  try { path = decodeURIComponent(url.pathname); } catch { return denied(); }
  if (path.includes('\\') || path.includes('%') || path.split('/').includes('..')) return denied();
  if (path === '/v1' || path.startsWith('/v1/') || ['/xmlrpc.php','/wp-cron.php','/wp-config.php'].includes(path)
    || path.startsWith('/wp-content/markdown/') || path === '/wp-content/db.php'
    || (path.startsWith('/wp-content/') && /\.(?:php|sqlite|db|zip)$/i.test(path))
    || path.split('/').some(part => part.startsWith('.'))) return denied();
  if (url.searchParams.has('phase')) {
    if (!maintenance.has(url.searchParams.get('phase') || '') || !authorized(request, secret)) return denied();
  }
  if (url.searchParams.has('coordinator')) return denied();
  if (path.startsWith('/__')) {
    if (path !== '/__playtt-publishing' || !authorized(request, secret)) return denied();
  }
  return null;
}
