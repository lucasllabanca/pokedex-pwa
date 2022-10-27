const STATIC_ASSETS_KEY = 'app-pokedex-v1';

const assetsToCache = [
    'app/fonts/Poppins/Poppins-Regular.ttf',
    'app/css/pokedex.css',
    'app/css/pokemon.css',
    'app/js/cache.js',
    'app/js/pokedex.js',
    'app/js/pokemon.js',
    'app/imgs/favicon.ico',
    'index.html',
    '/'
];

async function cacheStaticAssets() {
    const cache = await caches.open(STATIC_ASSETS_KEY);
    return cache.addAll(assetsToCache);
}

async function fetchCacheFirst(request) {

    const cache = await caches.open(STATIC_ASSETS_KEY);
    const cachedResponse = await cache.match(request);

    if (cachedResponse)
        return cachedResponse;

    const response = await fetch(request);

    if (!response || response.status !== 200 || response.type !== 'basic')
        return response;

    await cache.put(request, response.clone());

    return response;
}

self.addEventListener('install', (event) => {
    console.log('[Service Worker] installing service worker');
    event.waitUntil(cacheStaticAssets());
    self.skipWaiting();
});

self.addEventListener('activate', () => {
    console.log('[Service Worker] Activating service worker!');
    return self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    if (event.request.method != 'GET') return;
    console.log('[Service Worker] Fetch event worker', event.request.url);
    event.respondWith(fetchCacheFirst(event.request));
});
