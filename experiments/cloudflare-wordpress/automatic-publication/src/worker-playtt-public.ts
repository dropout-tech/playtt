import { servePublicPublication } from './public-reader.js';
import { MAX_PUBLISHED_REVISION_BYTES, validateCompletePublishedRevision } from './published-reader.js';
import { siteStorageKeys, type SiteContext } from './site-context.js';

export interface PlayttPublicEnv {
  WORDPRESS_STATE_BUCKET: R2Bucket;
  PLAYTT_PUBLIC_HOST: string;
  PLAYTT_PUBLIC_ORIGIN: string;
  PLAYTT_CMS_ORIGIN: string;
  PLAYTT_SITE_ID?: string;
  PLAYTT_PUBLIC_INDEXABLE?: string;
}

function checkedOrigin(value: string): URL {
  const url = new URL(value);
  if (url.origin !== value || url.username || url.password || (url.protocol !== 'https:' && url.hostname !== '127.0.0.1')) throw new Error('Invalid origin');
  return url;
}
function xml(value: string): string { return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;'); }
export function rewritePlayttOrigins(body: string, cms: string, published: string): string {
  // WP emits ordinary URLs in HTML/CSS and slash-escaped URLs in inline JSON.
  return body.replaceAll(cms, published)
    .replaceAll(cms.replaceAll('/', '\\/'), published.replaceAll('/', '\\/'))
    .replaceAll(encodeURIComponent(cms), encodeURIComponent(published))
    .replace(/<link\b[^>]*>/gi, tag => /(?:rel=["']https:\/\/api\.w\.org\/|type=["'](?:application\/json\+oembed|text\/xml\+oembed|application\/rss\+xml|application\/rsd\+xml))/i.test(tag) ? '' : tag);
}
function finish(response: Response, request: Request, env: PlayttPublicEnv): Response {
  const headers = new Headers(response.headers);
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('X-Frame-Options', 'SAMEORIGIN');
  headers.delete('set-cookie');
  if (env.PLAYTT_PUBLIC_INDEXABLE !== 'true') headers.set('X-Robots-Tag', 'noindex, nofollow');
  return new Response(request.method === 'HEAD' ? null : response.body, { status: response.status, headers });
}

// No PHP, coordinator, credential or mutation binding is available to this Worker.
export default {
  async fetch(request: Request, env: PlayttPublicEnv): Promise<Response> {
    const incoming = new URL(request.url);
    if (incoming.hostname !== env.PLAYTT_PUBLIC_HOST) return new Response('Unknown site', { status: 421 });
    if (!['GET', 'HEAD'].includes(request.method)) return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET, HEAD' } });
    let published: URL, cms: URL, site: SiteContext;
    try {
      published = checkedOrigin(env.PLAYTT_PUBLIC_ORIGIN); cms = checkedOrigin(env.PLAYTT_CMS_ORIGIN);
      const id = env.PLAYTT_SITE_ID || 'default';
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) throw new Error();
      site = { id, hostname: cms.hostname, origin: cms.origin };
    } catch { return new Response('Site configuration unavailable', { status: 503 }); }
    const done = (r: Response) => finish(r, request, env);
    if (['phase', 'rest_route', 'preview', 'preview_id', 'preview_nonce'].some(key => incoming.searchParams.has(key))) return done(new Response('Not found', { status: 404 }));
    if (incoming.pathname === '/wp-admin' || incoming.pathname === '/wp-admin/' || incoming.pathname === '/wp-login.php') {
      return done(Response.redirect(new URL('/wp-admin/', cms).href, 302));
    }
    if (incoming.pathname.startsWith('/__') || incoming.pathname.startsWith('/wp-json') || incoming.pathname.startsWith('/wp-admin/') || incoming.pathname.endsWith('.php')) return done(new Response('Not found', { status: 404 }));
    if (incoming.pathname === '/home' || incoming.pathname === '/home/') return done(Response.redirect(published.origin + '/' + incoming.search, 301));
    if (/^\/[a-z][a-z0-9-]*$/.test(incoming.pathname) && !incoming.pathname.includes('.')) return done(Response.redirect(published.origin + incoming.pathname + '/' + incoming.search, 301));
    if (incoming.pathname === '/robots.txt') {
      const body = env.PLAYTT_PUBLIC_INDEXABLE === 'true' ? 'User-agent: *\nAllow: /\nDisallow: /wp-admin/\nDisallow: /wp-json/\nSitemap: ' + published.origin + '/sitemap.xml\n' : 'User-agent: *\nDisallow: /\n';
      return done(new Response(body, { headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'public, max-age=60' } }));
    }
    if (incoming.pathname === '/sitemap.xml' || incoming.pathname === '/wp-sitemap.xml') {
      try {
        const object = await env.WORDPRESS_STATE_BUCKET.get(siteStorageKeys(site).publishedCurrent);
        if (!object || object.size > MAX_PUBLISHED_REVISION_BYTES) throw new Error();
        const publication = validateCompletePublishedRevision(await object.json(), site);
        const urls = publication.routes.filter(r => !r.route.includes('?')).map(r => '<url><loc>' + xml(published.origin + r.route) + '</loc></url>').join('');
        return done(new Response('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + urls + '</urlset>', { headers: { 'content-type': 'application/xml; charset=utf-8', 'cache-control': 'public, max-age=60', 'x-wp-codebox-publication-revision': publication.revision } }));
      } catch { return done(new Response('Publication unavailable', { status: 503 })); }
    }
    // Visitor tracking parameters and incidental cookies never trigger PHP or
    // create a separate publication. Dynamic/preview parameters were rejected.
    incoming.search = '';
    const headers = new Headers(request.headers); headers.delete('cookie'); headers.delete('authorization');
    const response = await servePublicPublication(new Request(incoming, { method: request.method, headers }), env.WORDPRESS_STATE_BUCKET, site);
    if (response.status === 404) return done(new Response('<!doctype html><html lang="zh-TW"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>找不到頁面｜Let’s Play</title><style>body{font-family:system-ui;background:#f4faff;color:#06457b;max-width:48rem;margin:15vh auto;padding:24px}a{color:inherit}</style><h1>這個頁面暫時不在球桌上。</h1><p><a href="/">回到 Let’s Play 首頁</a></p></html>', { status: 404, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } }));
    if (request.method !== 'HEAD' && response.headers.get('content-type')?.includes('text/html')) {
      const html = rewritePlayttOrigins(await response.text(), cms.origin, published.origin);
      const rewritten = new Headers(response.headers);
      rewritten.delete('content-length'); rewritten.delete('etag');
      // API discovery belongs to the private editor, not the static visitor site.
      rewritten.delete('link');
      return done(new Response(html, { status: response.status, headers: rewritten }));
    }
    return done(response);
  }
};
