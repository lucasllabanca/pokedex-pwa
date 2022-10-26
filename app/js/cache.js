export class Cache {

    #cacheKey = '';

    constructor(cacheKey) {
        this.#cacheKey = cacheKey;
    }

    async addToCache(requestUrl, response) {
        const cache = await caches.open(this.#cacheKey);
        cache.put(requestUrl, response);
    }

    async fetchFromCache(requestUrl) {
        const cache = await caches.open(this.#cacheKey);
        const cachedResponse = await cache.match(requestUrl);
        if (cachedResponse) console.log('from cache');
        return cachedResponse || null;
    }

}
