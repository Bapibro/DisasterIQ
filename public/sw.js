const CACHE_NAME = 'disasteriq-offline-v4';
const PUBLIC_ROUTES = new Set(['/', '/index.html', '/offline-emergency', '/guide']);
const PUBLIC_ASSETS = new Set([
  '/manifest.webmanifest',
  '/favicon.svg',
  '/icons.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-maskable-512.png',
]);
const CORE_ASSETS = [...PUBLIC_ROUTES, ...PUBLIC_ASSETS];

const isSensitivePath = (pathname) =>
  pathname.startsWith('/api/') ||
  pathname.startsWith('/auth/') ||
  pathname === '/reset-password' ||
  pathname.startsWith('/reset-password/');

const isCacheableAsset = (request, url) => {
  if (url.origin !== self.location.origin) return false;
  if (request.headers.has('authorization') || request.cache === 'no-store') return false;
  if (isSensitivePath(url.pathname)) return false;
  return url.pathname.startsWith('/assets/') || PUBLIC_ASSETS.has(url.pathname);
};

const isSafeResponse = (response) => {
  if (!response.ok || response.type !== 'basic' || response.redirected) return false;
  const cacheControl = response.headers.get('cache-control')?.toLowerCase() ?? '';
  if (/\b(?:no-store|private)\b/.test(cacheControl)) return false;
  const vary = response.headers.get('vary')?.toLowerCase() ?? '';
  if (vary === '*' || vary.split(',').some((value) => ['authorization', 'cookie'].includes(value.trim()))) return false;
  return !response.headers.has('set-cookie');
};

const removeStaleExternalCacheEntries = async () => {
  const cache = await caches.open(CACHE_NAME);
  const requests = await cache.keys();
  await Promise.all(
    requests
      .filter((request) => new URL(request.url).origin !== self.location.origin)
      .map((request) => cache.delete(request)),
  );
};

const cacheAppShell = async () => {
  const cache = await caches.open(CACHE_NAME);
  const response = await fetch(new Request('/', { cache: 'reload', credentials: 'omit' }));
  if (!isSafeResponse(response)) throw new Error('The app shell could not be cached safely.');

  const html = await response.clone().text();
  await cache.put('/', response.clone());
  await cache.put('/index.html', response.clone());

  const bundledAssets = Array.from(html.matchAll(/(?:src|href)=["']([^"']+)["']/g))
    .map((match) => match[1])
    .filter((path) => path.startsWith('/assets/'));
  const assets = Array.from(new Set([...CORE_ASSETS, ...bundledAssets]));

  for (const path of assets) {
    if (path === '/' || path === '/index.html') continue;
    const assetResponse = await fetch(new Request(path, { cache: 'reload', credentials: 'omit' }));
    if (isSafeResponse(assetResponse)) await cache.put(path, assetResponse);
  }
};

self.addEventListener('install', (event) => {
  event.waitUntil(cacheAppShell().then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith('disasteriq-offline-') && key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => removeStaleExternalCacheEntries())
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin || request.headers.has('authorization')) return;
  if (isSensitivePath(url.pathname)) return;

  if (request.mode === 'navigate') {
    if (url.search || !PUBLIC_ROUTES.has(url.pathname)) return;

    event.respondWith(
      fetch(new Request(request, { credentials: 'omit' }))
        .then((response) => {
          if (isSafeResponse(response)) {
            const copy = response.clone();
            event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.put(url.pathname, copy)));
          }
          return response;
        })
        .catch(async () => {
          const cache = await caches.open(CACHE_NAME);
          return (await cache.match(url.pathname)) ||
            (await cache.match('/offline-emergency')) ||
            (await cache.match('/')) ||
            new Response('Offline content is not available on this device yet. Connect once and reload.', {
              status: 503,
              headers: { 'Content-Type': 'text/plain; charset=utf-8' },
            });
        })
    );
    return;
  }

  if (!isCacheableAsset(request, url)) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(new Request(request, { credentials: 'omit' })).then((response) => {
        if (isSafeResponse(response)) {
          const copy = response.clone();
          event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.put(request, copy)));
        }
        return response;
      });
    })
  );
});
