/* URL fragments never reach the server. Preserve historic React HashRouter links. */
(() => {
  const routes = { '/': '', '/class': 'class/', '/partner': 'partner/' };
  function followLegacyLink() {
    const raw = window.location.hash.slice(1);
    if (!raw.startsWith('/')) return;
    const queryAt = raw.indexOf('?');
    const oldPath = queryAt < 0 ? raw : raw.slice(0, queryAt);
    const oldQuery = queryAt < 0 ? '' : raw.slice(queryAt + 1);
    const key = oldPath === '/' ? '/' : oldPath.replace(/\/+$/, '');
    if (!Object.hasOwn(routes, key)) return;
    const base = new URL(window.letsPlayBase || '/', window.location.origin);
    const destination = new URL(routes[key], base);
    destination.search = oldQuery ? '?' + oldQuery : window.location.search;
    if (destination.pathname !== window.location.pathname || destination.search !== window.location.search) {
      window.location.replace(destination.href);
    } else {
      window.history.replaceState(null, '', destination.href);
    }
  }
  window.addEventListener('hashchange', followLegacyLink);
  followLegacyLink();
})();
