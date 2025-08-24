const CACHE = 'hockey-app-v1';
const ASSETS = ['./','./index.html','./manifest.json','./ilves-logo.jpg'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c =>
      c.addAll(ASSETS.map(u => new URL(u, self.registration.scope).toString()))
    )
  );
});
self.addEventListener('fetch', e => {
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});
