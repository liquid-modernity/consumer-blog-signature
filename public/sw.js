const CACHE = 'gaga-pakrpp-starlight-native-v0.1.19';
const CORE = ['/', '/saved', '/offline.html', '/manifest.webmanifest', '/favicon.svg'];
const CORE_PATHS = new Set(CORE);

function isSameOrigin(request) {
  return new URL(request.url).origin === self.location.origin;
}

function canCache(response) {
  return response.ok && response.type === 'basic';
}

async function putInCache(request, response) {
  if (!canCache(response)) return response;
  const cache = await caches.open(CACHE);
  await cache.put(request, response.clone());
  return response;
}

async function networkFirst(request) {
  const cache = await caches.open(CACHE);
  try {
    const response = await fetch(request);
    return await putInCache(request, response);
  } catch {
    return (await cache.match(request)) || caches.match('/offline.html');
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((response) => putInCache(request, response))
    .catch(() => undefined);

  if (cached) {
    void network;
    return cached;
  }

  const response = await network;
  return response || caches.match('/offline.html');
}

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(CORE)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (!isSameOrigin(event.request)) return;

  const url = new URL(event.request.url);
  const isStaticAsset = url.pathname.startsWith('/_astro/');
  const isCorePath = CORE_PATHS.has(url.pathname);
  const isPublicAsset = ['style', 'script', 'font', 'image'].includes(event.request.destination);

  if (event.request.mode === 'navigate') {
    event.respondWith(networkFirst(event.request));
    return;
  }

  if (isStaticAsset || isCorePath || isPublicAsset) {
    event.respondWith(staleWhileRevalidate(event.request));
  }
});
