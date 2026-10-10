export function initRouteNormalize() {
  const { pathname, search, hash } = window.location;
  if (pathname.length <= 1 || !pathname.endsWith('/')) return;
  const normalized = pathname.replace(/\/+$/, '') || '/';
  window.history.replaceState(window.history.state, '', `${normalized}${search}${hash}`);
}
