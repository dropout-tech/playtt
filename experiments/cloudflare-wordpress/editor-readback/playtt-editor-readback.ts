// Experimental, disabled by default. No write is retried by this middleware.
export const PLAYTT_EDITOR_READBACK_FLAG = 'draft-readback-v1';

export function isPlayttDraftReadbackRequest(request: Request): boolean {
  const url = new URL(request.url);
  if (request.method !== 'GET' || !/^\/wp-json\/wp\/v2\/pages\/[1-9][0-9]*$/.test(url.pathname)
    || !request.headers.get('x-wp-nonce') || !request.headers.get('cookie')) return false;
  const entries = [...url.searchParams];
  return entries.length >= 2 && entries.length <= 3
    && new Set(entries.map(([key]) => key)).size === entries.length
    && entries.every(([key, value]) => key === 'context' ? value === 'edit'
      : key === '_playtt_readback' ? /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/.test(value)
      : key === '_locale' && value === 'user')
    && url.searchParams.has('context') && url.searchParams.has('_playtt_readback');
}

// Kept as browser source so bundling cannot introduce Worker-only closures.
export const PLAYTT_EDITOR_READBACK_SCRIPT = String.raw`function (config) {
  'use strict';
  const api = window.wp && window.wp.apiFetch;
  if (!api || !Number.isSafeInteger(config.id) || config.id <= 0 || config.origin !== window.location.origin) return;
  const path = '/wp/v2/pages/' + config.id;
  const jsonError = () => ({code: 'invalid_json', message: window.wp.i18n.__('The response is not a valid JSON response.')});
  function eligible(options) {
    if (!['PUT', 'POST'].includes(options.method) || options.parse === false || options.body !== undefined || options.signal?.aborted) return null;
    if (options.namespace !== undefined || options.endpoint !== undefined) return null;
    if (typeof options.path !== 'string') return null;
    const route = new URL(options.path, config.origin);
    if (route.origin !== config.origin || route.pathname !== path || route.hash || route.username || route.password) return null;
    if ([...route.searchParams].some(([key, value]) => key !== '_locale' || value !== 'user')) return null;
    if (options.url !== undefined) {
      const url = new URL(options.url, config.origin);
      if (url.origin !== config.origin || url.pathname !== '/wp-json' + path || url.hash || url.username || url.password
        || [...url.searchParams].some(([key, value]) => key !== '_locale' || value !== 'user')) return null;
    }
    const data = options.data;
    if (!data || typeof data !== 'object' || Array.isArray(data) || typeof data.content !== 'string' || data.content.length > 262144) return null;
    const keys = Object.keys(data);
    if (keys.some(key => !['id', 'content', 'title', 'excerpt', 'status'].includes(key))) return null;
    if (keys.some(key => key === 'id' ? data.id !== config.id : key === 'status' ? data.status !== 'draft' : typeof data[key] !== 'string')) return null;
    const headers = new Headers(options.headers);
    if (headers.has('x-http-method-override') && headers.get('x-http-method-override') !== 'PUT') return null;
    return Object.fromEntries(keys.map(key => [key, data[key]]));
  }
  function matches(record, expected) {
    if (!record || record.id !== config.id || record.type !== 'page' || record.status !== 'draft') return false;
    return Object.entries(expected).every(([key, value]) => ['title', 'content', 'excerpt'].includes(key)
      ? record[key] && record[key].raw === value : record[key] === value);
  }
  api.use(async (options, next) => {
    let expected;
    try { expected = eligible(options); } catch { return next(options); }
    if (!expected) return next(options);
    async function reconcile(originalError) {
      if (options.signal?.aborted) throw originalError;
      const controller = new AbortController();
      const abort = () => controller.abort();
      options.signal?.addEventListener('abort', abort, {once: true});
      let timer;
      try {
        const headers = new Headers(options.headers);
        headers.delete('x-http-method-override');
        headers.delete('content-type');
        const query = '?context=edit&_playtt_readback=' + crypto.randomUUID();
        const read = {path: path + query, url: config.origin + '/wp-json' + path + query,
          method: 'GET', headers: Object.fromEntries(headers), parse: false, cache: 'no-store', credentials: 'same-origin', signal: controller.signal};
        const result = await Promise.race([
          (async () => {
            const response = await next(read);
            if (!(response instanceof Response) || response.status !== 200 || response.redirected
              || response.headers.get('x-playtt-draft-readback') !== 'canonical-v1') return null;
            const version = response.headers.get('x-wp-codebox-canonical-version');
            const revision = response.headers.get('x-wp-codebox-canonical-revision');
            if (!version || !/^[1-9][0-9]*$/.test(version) || !Number.isSafeInteger(Number(version))
              || !revision || !/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/.test(revision)) return null;
            return response.json();
          })(),
          new Promise((_, reject) => {timer = setTimeout(() => {controller.abort(); reject(originalError);}, 10000);})
        ]);
        if (!controller.signal.aborted && matches(result, expected)) return result;
      } catch { /* Keep the original save failure, including when read-back fails. */ }
      finally { clearTimeout(timer); controller.abort(); options.signal?.removeEventListener('abort', abort); }
      throw originalError;
    }
    let response;
    try { response = await next({...options, parse: false}); }
    catch (error) {
      if (error instanceof Response) {
        // A definite HTTP rejection must retain the native error, without reconciliation.
        let parsed; try { parsed = await error.json(); } catch { parsed = jsonError(); }
        throw parsed;
      }
      if (error?.code === 'fetch_error') return reconcile(error);
      throw error;
    }
    if (response.status === 204) return null;
    try { return await response.json(); }
    catch { const error = jsonError(); if (response.status === 200) return reconcile(error); throw error; }
  });
}`;

// Added to the existing runtime-owned mu-plugin, never stored in canonical wp-content.
// The server scopes installation to an existing editable draft page's block editor.
export const PLAYTT_EDITOR_READBACK_POLICY = `
add_action( 'enqueue_block_editor_assets', static function () {
    global $post;
    if ( ! is_admin() || ! $post instanceof WP_Post || 'page' !== $post->post_type || 'draft' !== $post->post_status || ! current_user_can( 'edit_post', $post->ID ) ) return;
    $source = <<<'PLAYTT_READBACK_JS'
${PLAYTT_EDITOR_READBACK_SCRIPT}
PLAYTT_READBACK_JS;
    $origin = wp_parse_url( home_url( '/' ) );
    if ( ! is_array( $origin ) || empty( $origin['scheme'] ) || empty( $origin['host'] ) ) return;
    $origin_url = $origin['scheme'] . '://' . $origin['host'] . ( isset( $origin['port'] ) ? ':' . $origin['port'] : '' );
    wp_add_inline_script( 'wp-api-fetch', '(' . $source . ')(' . wp_json_encode( array( 'id' => (int) $post->ID, 'origin' => $origin_url ) ) . ');', 'after' );
}, PHP_INT_MAX );
`;
