const CACHE_NAME = 'matchmaker-v1';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './logo.svg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache).catch(err => {
        console.warn('PWA caching failed, logo.png may be missing.', err);
      }))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});
