const STATIC_ASSETS_KEY = 'app-pokedex-v14';

const assetsToCache = [
    'https://cdn.jsdelivr.net/npm/dexie@3.0.3/dist/dexie.mjs',
    'app/fonts/Poppins/Poppins-Regular.ttf',
    'app/css/alert.css',
    'app/css/pokedex.css',
    'app/css/pokemon.css',
    'app/js/alert.js',
    'app/js/indexeddb.js',
    'app/js/pokedex.js',
    'app/js/pokemon.js',
    'app/imgs/favicon.ico',
    'app/imgs/icon-256x256.png',
    'app/imgs/add.png',
    'app/imgs/delete-32x32.png',
    'app/imgs/search.svg',
    'app/imgs/error.svg',
    'app/imgs/info.svg',
    'app/imgs/question.svg',
    'app/imgs/success.svg',
    'app/imgs/warning.svg',
    'index.html',
    '/'
];

function removeOldCache(key) {
    if (key === STATIC_ASSETS_KEY) return;
    console.log(`[Service Worker] Removing old cache: ${key}`);
    return caches.delete(key);
}

async function cacheCleanup() {
    const keys = await caches.keys();
    return Promise.all(keys.map(removeOldCache));
}

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
    //console.log('[Service Worker] installing service worker');
    event.waitUntil(cacheStaticAssets());
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    //console.log('[Service Worker] Activating service worker!', event);
    event.waitUntil(cacheCleanup());
    return self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    if (event.request.method != 'GET') return;
    //console.log('[Service Worker] Fetch event worker', event.request.url);
    event.respondWith(fetchCacheFirst(event.request));
});
