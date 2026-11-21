import { DurableObjectRevisionCoordinator, WordPressStateCoordinator } from './state-coordinator.js';
import { createCloudflareRuntime, serveWordPressStaticAsset, type RuntimeEnv } from './worker.js';
import { enablePlayttPhaseDiagnostics } from './phase-trace.js';
import { playttProbeAccess } from './playtt-probe-access.js';
import { parseSiteContexts, resolveSiteContextFromRequest } from './site-context.js';

interface PlayttEnv extends RuntimeEnv {
  WORDPRESS_STATE: DurableObjectNamespace;
  PLAYTT_EXECUTION: DurableObjectNamespace;
  PLAYTT_PROBE_GATE?: string;
  PLAYTT_STATE_PARTITION?: string;
}

export { WordPressStateCoordinator };

// Keep the upstream revision/lease protocol in its own coordinator. PHP runs
// inside a separate SQLite DO, where the remote boot prerequisite succeeded.
// No scheduled publishing or production-domain routes are enabled in this probe.
const runtime = createCloudflareRuntime<PlayttEnv>((env, site) =>
  new DurableObjectRevisionCoordinator(env.WORDPRESS_STATE.getByName(partitionName(env, site.id)), site.id));

function partitionName(env: PlayttEnv, name: string): string {
  if (!env.PLAYTT_STATE_PARTITION) return name;
  if (env.PLAYTT_STATE_PARTITION !== 'restore-v1') throw new Error('Unknown playtt verification partition.');
  return 'playtt-restore-v1:' + name;
}

export class PlayttWordPressExecution implements DurableObject {
  private tail: Promise<void> = Promise.resolve();
  constructor(_state: DurableObjectState, private readonly env: PlayttEnv) {
    enablePlayttPhaseDiagnostics();
  }

  fetch(request: Request): Promise<Response> {
    const response = this.tail.then(() => runtime.fetch(request, this.env));
    this.tail = response.then(() => undefined, () => undefined);
    return response;
  }
}

export default {
  async fetch(request: Request, env: PlayttEnv): Promise<Response> {
    if (env.PLAYTT_PROBE_GATE === 'true') {
      const access = await playttProbeAccess(request, env.WORDPRESS_OPERATOR_TOKEN || '');
      if (access instanceof Response) return access;
      request = access;
    }
    if (!env.WORDPRESS_ADMIN_PASSWORD || !env.WORDPRESS_AUTH_SECRET ||
        !env.WORDPRESS_ADMIN_CLAIM_SECRET || !env.WORDPRESS_OPERATOR_TOKEN) {
      return new Response('Probe is not configured', { status: 503, headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' } });
    }
    try { resolveSiteContextFromRequest(request, parseSiteContexts(env.WORDPRESS_SITE_CONTEXTS)); }
    catch { return new Response('Unknown site hostname.', { status: 421 }); }
    // Immutable verified core assets need neither PHP nor serialized mutation work.
    // Keep these R2 range/cache reads outside the DO to avoid queuing 100+ editor assets.
    const asset = await serveWordPressStaticAsset(request, env.WORDPRESS_STATE_BUCKET);
    const response = asset || await env.PLAYTT_EXECUTION.getByName(partitionName(env, 'playtt-cms-v1')).fetch(request);
    const result = new Response(response.body, response);
    result.headers.set('X-Robots-Tag', 'noindex, nofollow');
    result.headers.set('X-Playtt-Probe-State', thisPartition(env));
    return result;
  }
};

function thisPartition(env: PlayttEnv): string { return env.PLAYTT_STATE_PARTITION || 'primary'; }
