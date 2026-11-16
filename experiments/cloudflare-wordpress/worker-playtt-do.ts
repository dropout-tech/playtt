import { DurableObjectRevisionCoordinator, WordPressStateCoordinator } from './state-coordinator.js';
import { createCloudflareRuntime, type RuntimeEnv } from './worker.js';
import { enablePlayttPhaseDiagnostics } from './phase-trace.js';
import { playttProbeAccess } from './playtt-probe-access.js';

interface PlayttEnv extends RuntimeEnv {
  WORDPRESS_STATE: DurableObjectNamespace;
  PLAYTT_EXECUTION: DurableObjectNamespace;
  PLAYTT_PROBE_GATE?: string;
}

export { WordPressStateCoordinator };

// Keep the upstream revision/lease protocol in its own coordinator. PHP runs
// inside a separate SQLite DO, where the remote boot prerequisite succeeded.
// No scheduled publishing or production-domain routes are enabled in this probe.
const runtime = createCloudflareRuntime<PlayttEnv>((env, site) =>
  new DurableObjectRevisionCoordinator(env.WORDPRESS_STATE.getByName(site.id), site.id));

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
    const response = await env.PLAYTT_EXECUTION.getByName('playtt-cms-v1').fetch(request);
    const result = new Response(response.body, response);
    result.headers.set('X-Robots-Tag', 'noindex, nofollow');
    return result;
  }
};
