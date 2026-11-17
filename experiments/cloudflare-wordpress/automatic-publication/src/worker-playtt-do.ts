import { DurableObjectRevisionCoordinator, WordPressStateCoordinator } from './state-coordinator.js';
import { createCloudflareRuntime, drainPlayttPublication, serveWordPressStaticAsset, serveWordPressUpload, serveWordPressWpContent, type RuntimeEnv } from './worker.js';
import { servePublicPublication } from './public-reader.js';
import { PlayttPublicationAlarm } from './playtt-publication-alarm.js';
import { enablePlayttPhaseDiagnostics } from './phase-trace.js';
import { protectPlayttCms } from './playtt-cms-access.js';
import { playttProbeAccess } from './playtt-probe-access.js';
import { parseSiteContexts, resolveSiteContextFromRequest } from './site-context.js';

interface PlayttEnv extends RuntimeEnv {
  WORDPRESS_STATE: DurableObjectNamespace;
  PLAYTT_EXECUTION: DurableObjectNamespace;
  PLAYTT_PROBE_GATE?: string;
  PLAYTT_CMS_MODE?: string;
  PLAYTT_STATE_PARTITION?: string;
  PLAYTT_AUTO_PUBLISH?: string;
}

export { WordPressStateCoordinator };

// Keep the upstream revision/lease protocol in its own coordinator. PHP runs
// inside a separate SQLite DO, where the remote boot prerequisite succeeded.
// The publication candidate is opt-in and has no production-domain routes.
const runtime = createCloudflareRuntime<PlayttEnv>((env, site) =>
  new DurableObjectRevisionCoordinator(env.WORDPRESS_STATE.getByName(partitionName(env, site.id)), site.id));

function partitionName(env: PlayttEnv, name: string): string {
  if (!env.PLAYTT_STATE_PARTITION) return name;
  if (env.PLAYTT_STATE_PARTITION !== 'restore-v1') throw new Error('Unknown playtt verification partition.');
  return 'playtt-restore-v1:' + name;
}

export class PlayttWordPressExecution implements DurableObject {
  private tail: Promise<void> = Promise.resolve();
  private publisher: PlayttPublicationAlarm;
  constructor(state: DurableObjectState, private readonly env: PlayttEnv) {
    enablePlayttPhaseDiagnostics();
    this.publisher = new PlayttPublicationAlarm(state.storage, () => {
      const sites = parseSiteContexts(this.env.WORDPRESS_SITE_CONTEXTS);
      if (sites.length !== 1) throw new Error('Playtt publisher requires exactly one configured site.');
      const site = sites[0];
      const coordinator = new DurableObjectRevisionCoordinator(this.env.WORDPRESS_STATE.getByName(partitionName(this.env, site.id)), site.id);
      return drainPlayttPublication(this.env, coordinator, site);
    });
  }

  fetch(request: Request): Promise<Response> {
    const response = this.tail.then(async () => {
      const url = new URL(request.url), enabled = this.env.PLAYTT_AUTO_PUBLISH === 'true';
      if (enabled && url.pathname === '/__playtt-publishing') {
        if (request.headers.get('authorization') !== 'Bearer ' + this.env.WORDPRESS_OPERATOR_TOKEN) return new Response('Unauthorized', { status: 401 });
        if (request.method === 'POST') {
          const body = await request.text();
          let action: string;
          try { if (body.length > 512) throw new Error(); action = body ? JSON.parse(body).action : 'retry'; }
          catch { return new Response('Invalid publication action', { status: 400 }); }
          if (action === 'pause') await this.publisher.pause();
          else if (action === 'resume' || action === 'retry') await this.publisher.wake(true);
          else return new Response('Invalid publication action', { status: 400 });
        }
        else if (request.method !== 'GET') return new Response('Method not allowed', { status: 405 });
        return Response.json(await this.publisher.status(), { headers: { 'Cache-Control': 'no-store' } });
      }
      const mutation = !['GET','HEAD','OPTIONS'].includes(request.method)
        || (url.pathname.startsWith('/wp-admin/') && !!url.searchParams.get('action'));
      // Prearm recovery before a mutation: a crash after coordinator commit
      // cannot strand its already-persisted R2 outbox entry.
      if (enabled && mutation) await this.publisher.wake();
      const result = await runtime.fetch(request, this.env);
      if (enabled && result.headers.has('x-wp-codebox-publication-job')) await this.publisher.wake();
      return result;
    });
    this.tail = response.then(() => undefined, () => undefined);
    return response;
  }

  alarm(): Promise<void> {
    const action = this.tail.then(async () => {
      if (this.env.PLAYTT_AUTO_PUBLISH === 'true') await this.publisher.tick();
    });
    this.tail = action.then(() => undefined, () => undefined);
    return action;
  }
}

export default {
  async fetch(request: Request, env: PlayttEnv): Promise<Response> {
    if (env.PLAYTT_CMS_MODE === 'production') {
      const denied = protectPlayttCms(request, env.WORDPRESS_OPERATOR_TOKEN || '');
      if (denied) return denied;
    }
    if (env.PLAYTT_PROBE_GATE === 'true') {
      const access = await playttProbeAccess(request, env.WORDPRESS_OPERATOR_TOKEN || '');
      if (access instanceof Response) return access;
      request = access;
    }
    if (!env.WORDPRESS_ADMIN_PASSWORD || !env.WORDPRESS_AUTH_SECRET ||
        !env.WORDPRESS_ADMIN_CLAIM_SECRET || !env.WORDPRESS_OPERATOR_TOKEN) {
      return new Response('Probe is not configured', { status: 503, headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' } });
    }
    let site;
    try { site = resolveSiteContextFromRequest(request, parseSiteContexts(env.WORDPRESS_SITE_CONTEXTS)); }
    catch { return new Response('Unknown site hostname.', { status: 421 }); }
    // Immutable verified core assets need neither PHP nor serialized mutation work.
    // Keep these R2 range/cache reads outside the DO to avoid queuing 100+ editor assets.
    let asset = await serveWordPressStaticAsset(request, env.WORDPRESS_STATE_BUCKET);
    if (env.PLAYTT_AUTO_PUBLISH === 'true' && new URL(request.url).pathname.startsWith('/__playtt-published/')) {
      const url = new URL(request.url);
      url.pathname = url.pathname.slice('/__playtt-published'.length);
      const headers = new Headers(request.headers);
      headers.delete('cookie'); headers.delete('authorization');
      asset = await servePublicPublication(new Request(url, { method: request.method, headers }), env.WORDPRESS_STATE_BUCKET, site);
    }
    // Theme files and media are also immutable within a committed revision.
    // The upstream handlers validate paths, manifest membership and content hashes.
    if (!asset && new URL(request.url).pathname.startsWith('/wp-content/')) {
      const coordinator = new DurableObjectRevisionCoordinator(env.WORDPRESS_STATE.getByName(partitionName(env, site.id)), site.id);
      asset = await serveWordPressWpContent(request, env.WORDPRESS_STATE_BUCKET, coordinator, site)
        || await serveWordPressUpload(request, env.WORDPRESS_STATE_BUCKET, coordinator, site);
    }
    const response = asset || await env.PLAYTT_EXECUTION.getByName(partitionName(env, 'playtt-cms-v1')).fetch(request);
    const result = new Response(response.body, response);
    result.headers.set('X-Robots-Tag', 'noindex, nofollow');
    result.headers.set('X-Content-Type-Options', 'nosniff');
    result.headers.set('Referrer-Policy', 'same-origin');
    result.headers.set('X-Playtt-Probe-State', thisPartition(env));
    return result;
  }
};

function thisPartition(env: PlayttEnv): string { return env.PLAYTT_STATE_PARTITION || 'primary'; }
