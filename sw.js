const CACHE = 'josi-v1';
const ASSETS = ['/', '/index.html', '/styles.css', '/app.js', '/news.json', '/manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request).then(resp => {
      if (e.request.url.includes('news.json')) {
        // Network first for data
        return fetch(e.request).catch(() => r);
      }
      return resp;
    }))
  );
});
