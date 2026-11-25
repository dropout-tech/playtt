import { isWordPressLogoutMutation } from './playtt-request-mutation.js';
import { PLAYTT_EDITOR_LOCK_FLAG, versionPlayttEditorAssets } from './playtt-editor-lock.js';
import { withPlayttStorageCapacity, playttCapacityStub, playttCapacityLimit, playttWriteWindowAdmission, PlayttCapacityError, playttCapacityResponse, type PlayttCapacityEnv } from './playtt-storage-capacity.js';
import { isWriteToken } from './playtt-write-drain.js';
import { backupPinInput } from './playtt-backup-pins.js';
import { RECOVERY_PREFIX, routeRecoveryRequest } from './playtt-recovery-uploads.js';
export { PlayttStorageBudget } from './playtt-storage-capacity.js';
import { DurableObjectRevisionCoordinator, WordPressStateCoordinator } from './state-coordinator.js';
import { createCloudflareRuntime, drainPlayttPublication, isAuthorizedOperator, retirePlayttIdleRuntimes, serveWordPressStaticAsset, serveWordPressUpload, serveWordPressWpContent, type RuntimeEnv } from './worker.js';
import { servePublicPublication } from './public-reader.js';
import { PlayttPublicationAlarm } from './playtt-publication-alarm.js';
import { enablePlayttPhaseDiagnostics } from './phase-trace.js';
import { protectPlayttCms } from './playtt-cms-access.js';
import { playttProbeAccess } from './playtt-probe-access.js';
import { parseSiteContexts, resolveSiteContextFromRequest } from './site-context.js';
import { preparePlayttMaintenanceRequest } from './playtt-maintenance.js';
import { runPlayttScheduledMaintenance } from './playtt-maintenance-schedule.js';
import { routeWorkerRequest } from './request-routing.js';

interface PlayttEnv extends RuntimeEnv, PlayttCapacityEnv {
  WORDPRESS_STATE: DurableObjectNamespace;
  PLAYTT_EXECUTION: DurableObjectNamespace;
  PLAYTT_PROBE_GATE?: string;
  PLAYTT_CMS_MODE?: string;
  PLAYTT_STATE_PARTITION?: string;
  PLAYTT_AUTO_PUBLISH?: string;
  PLAYTT_MAINTENANCE_CRON?: string;
  PLAYTT_CORE_EDITOR_LOCK?: string;
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
    this.env = withPlayttStorageCapacity(env);
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
          else if (action === 'resume' || action === 'retry') { await playttWriteWindowAdmission(this.env); await this.publisher.wake(true); }
          else return new Response('Invalid publication action', { status: 400 });
        }
        else if (request.method !== 'GET') return new Response('Method not allowed', { status: 405 });
        return Response.json(await this.publisher.status(), { headers: { 'Cache-Control': 'no-store' } });
      }
      // Recheck inside the serial queue: work queued before the deadline cannot
      // begin PHP later. Fence controls remain reachable; runtime authenticates
      // these exact operator routes before any mutation or PHP boot.
      const fenceControl = routeWorkerRequest(request).kind === 'operator-fence';
      if (!fenceControl) await playttWriteWindowAdmission(this.env);
      const mutation = !['GET','HEAD','OPTIONS'].includes(request.method)
        || isWordPressLogoutMutation(request)
        || (url.pathname.startsWith('/wp-admin/') && !!url.searchParams.get('action'));
      // Prearm recovery before a mutation: a crash after coordinator commit
      // cannot strand its already-persisted R2 outbox entry.
      // Maintenance validates operator credentials/body before any publication
      // work. A committed maintenance result may still enqueue native effects.
      const maintenance = url.searchParams.get('phase') === 'operator-auto-draft-maintenance';
      if (enabled && mutation && !maintenance && !fenceControl) await this.publisher.wake();
      const result = await runtime.fetch(request, this.env);
      if (enabled && result.headers.has('x-wp-codebox-publication-job')) await this.publisher.wake();
      await retirePlayttIdleRuntimes();
      return result;
    }).catch(error => {
      if (error instanceof PlayttCapacityError) return playttCapacityResponse(error);
      throw error;
    });
    this.tail = response.then(() => undefined, () => undefined);
    return response;
  }

  alarm(): Promise<void> {
    const action = this.tail.then(async () => {
      try { await playttWriteWindowAdmission(this.env); }
      catch (error) { if (error instanceof PlayttCapacityError && error.reason === 'window') return; throw error; }
      if (this.env.PLAYTT_AUTO_PUBLISH === 'true') await this.publisher.tick();
      await retirePlayttIdleRuntimes();
    });
    this.tail = action.then(() => undefined, () => undefined);
    return action;
  }
}

export default {
  async scheduled(controller: ScheduledController, env: PlayttEnv): Promise<void> {
    const report=await runPlayttScheduledMaintenance(controller,env,request=>
      env.PLAYTT_EXECUTION.getByName(partitionName(env,'playtt-cms-v1')).fetch(request));
    console.log(JSON.stringify(report));
  },
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
    if (new URL(request.url).pathname.startsWith(RECOVERY_PREFIX)) {
      return routeRecoveryRequest(request, env, {
        siteId: site.id,
        authorized: () => isAuthorizedOperator(request, env, site),
        renewFence: token => new DurableObjectRevisionCoordinator(env.WORDPRESS_STATE.getByName(partitionName(env, site.id)), site.id).renewFence(token, 600_000),
        budget: () => playttCapacityStub(env),
      });
    }
    if (new URL(request.url).pathname === '/__playtt-reference-roots') {
      const headers = { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow', 'X-Playtt-Probe-State': thisPartition(env) };
      if (!await isAuthorizedOperator(request, env, site)) return new Response('Unauthorized', { status: 401, headers });
      if (request.method !== 'GET') return new Response('Method not allowed', { status: 405, headers });
      try {
        if (site.id !== 'default' || playttCapacityLimit(env) === null) return new Response('Reference inventory is disabled', { status: 404, headers });
        const coordinator = new DurableObjectRevisionCoordinator(env.WORDPRESS_STATE.getByName(partitionName(env, site.id)), site.id);
        return Response.json(await coordinator.referenceRoots(), { headers });
      } catch { return new Response('Reference inventory unavailable', { status: 503, headers }); }
    }
    if (new URL(request.url).pathname === '/__playtt-backup-pins') {
      const headers = { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow', 'X-Playtt-Probe-State': thisPartition(env) };
      if (!await isAuthorizedOperator(request, env, site)) return new Response('Unauthorized', { status: 401, headers });
      try {
        if (playttCapacityLimit(env) === null || site.id !== 'default') return new Response('Backup pins are disabled', { status: 404, headers });
        const coordinator = new DurableObjectRevisionCoordinator(env.WORDPRESS_STATE.getByName(partitionName(env, site.id)), site.id);
        if (request.method === 'GET') return Response.json(await coordinator.backupPins(), { headers });
        if (request.method !== 'POST') return new Response('Method not allowed', { status: 405, headers });
        const reader = request.body?.getReader();
        if (!reader) return new Response('Invalid backup pin', { status: 400, headers });
        const chunks: Uint8Array[] = []; let bytes = 0;
        try {
          while (true) {
            const result = await reader.read(); if (result.done) break;
            bytes += result.value.byteLength;
            if (bytes > 8192) { await reader.cancel(); return new Response('Backup pin request too large', { status: 413, headers }); }
            chunks.push(result.value);
          }
        } finally { reader.releaseLock(); }
        const raw = new Uint8Array(bytes); let offset = 0;
        for (const chunk of chunks) { raw.set(chunk, offset); offset += chunk.length; }
        const input = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(raw));
        if (typeof input.fenceToken !== 'string') return new Response('Invalid backup pin', { status: 400, headers });
        const pin = backupPinInput(input.pin);
        return Response.json(await coordinator.pinBackup(pin, input.fenceToken), { headers });
      } catch { return new Response('Backup pin registration unavailable', { status: 409, headers }); }
    }
    if (new URL(request.url).pathname === '/__playtt-capacity') {
      if (!await isAuthorizedOperator(request, env, site)) return new Response('Unauthorized', { status: 401 });
      try {
        if (playttCapacityLimit(env) === null) return new Response('Capacity guard is disabled', { status: 404 });
        let response: Response;
        if (request.method === 'GET') response = await playttCapacityStub(env).fetch('https://playtt-capacity.invalid/status');
        else if (request.method === 'POST') {
          const raw = await request.text();
          if (raw.length > 1024) return new Response('Invalid capacity action', { status: 400 });
          let input: { action?: string; fenceToken?: string; drainToken?: string; legacyWritersDrained?: boolean; windowToken?: string; previousWindowToken?: string | null; durationSeconds?: number; maxBytes?: number; maxOperations?: number };
          try { input = JSON.parse(raw); } catch { return new Response('Invalid capacity action', { status: 400 }); }
          if (!['initialize', 'initialize-write-tracking', 'acquire-write-drain', 'release-write-drain','arm-write-window','close-write-window'].includes(input.action || '')
            || (input.action !== 'close-write-window' && typeof input.fenceToken !== 'string')) return new Response('Invalid capacity action', { status: 400 });
          const coordinator = new DurableObjectRevisionCoordinator(env.WORDPRESS_STATE.getByName(partitionName(env, site.id)), site.id);
          // Closing only revokes admission and leaves in-flight tickets intact;
          // it must remain possible while a native request owns the lease.
          if (input.action !== 'close-write-window') await coordinator.renewFence(input.fenceToken!, 600_000);
          const actions: Record<string, string> = { initialize: '/initialize', 'initialize-write-tracking': '/tracking/initialize', 'acquire-write-drain': '/tracking/acquire', 'release-write-drain': '/tracking/release', 'arm-write-window':'/window/arm', 'close-write-window':'/window/close' };
          // Migration is an explicit operator assertion, not an inference from
          // lease expiry: legacy writers have no durable tickets to inspect.
          if (input.action === 'initialize-write-tracking' && input.legacyWritersDrained !== true) return new Response('Confirm legacy writers have drained before enabling tracking', { status: 400 });
          if (input.action!.endsWith('write-drain') && !isWriteToken(input.drainToken)) return new Response('Invalid write drain token', { status: 400 });
          if (input.action!.endsWith('write-window') && !isWriteToken(input.windowToken)) return new Response('Invalid write window token', { status: 400 });
          const payload = input.action === 'arm-write-window' ? { token: input.windowToken, previousToken: input.previousWindowToken, drainToken: input.drainToken, durationSeconds: input.durationSeconds, maxBytes: input.maxBytes, maxOperations: input.maxOperations }
            : { token: input.action === 'close-write-window' ? input.windowToken : input.drainToken };
          response = await playttCapacityStub(env).fetch('https://playtt-capacity.invalid' + actions[input.action!], {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
          });
        } else return new Response('Method not allowed', { status: 405 });
        const result = new Response(response.body, response);
        result.headers.set('Cache-Control', 'no-store'); result.headers.set('X-Robots-Tag', 'noindex, nofollow');
        result.headers.set('X-Playtt-Probe-State', thisPartition(env));
        return result;
      } catch (error) {
        if (error instanceof PlayttCapacityError) return playttCapacityResponse(error);
        return new Response('Capacity operation unavailable', { status: 409, headers: { 'Cache-Control': 'no-store' } });
      }
    }
    env = withPlayttStorageCapacity(env);
    // Consume the small operator input in the receiving Worker. Passing the
    // incoming network stream to a DO that can reject before reading it leaves
    // its lifetime coupled to an already returned response in local workerd.
    if (new URL(request.url).searchParams.get('phase') === 'operator-auto-draft-maintenance') {
      const prepared = await preparePlayttMaintenanceRequest(request, () => isAuthorizedOperator(request, env, site));
      if (prepared instanceof Response) return prepared;
      request = prepared;
    }
    // Immutable verified core assets need neither PHP nor serialized mutation work.
    // Keep these R2 range/cache reads outside the DO to avoid queuing 100+ editor assets.
    const editorLockBackport = env.PLAYTT_CORE_EDITOR_LOCK === PLAYTT_EDITOR_LOCK_FLAG;
    let asset = await serveWordPressStaticAsset(request, env.WORDPRESS_STATE_BUCKET, editorLockBackport);
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
    const versioned = versionPlayttEditorAssets(request, response, editorLockBackport);
    const result = new Response(versioned.body, versioned);
    result.headers.set('X-Robots-Tag', 'noindex, nofollow');
    result.headers.set('X-Content-Type-Options', 'nosniff');
    result.headers.set('Referrer-Policy', 'same-origin');
    result.headers.set('X-Playtt-Probe-State', thisPartition(env));
    return result;
  }
};

function thisPartition(env: PlayttEnv): string { return env.PLAYTT_STATE_PARTITION || 'primary'; }
