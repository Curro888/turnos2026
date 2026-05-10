const CACHE_NAME = 'turnos2026-v3';

self.addEventListener('install', e => {
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Siempre red primero — nunca servir caché del index.html
self.addEventListener('fetch', e => {
  if (e.request.url.includes('firebase') || e.request.url.includes('gstatic')) {
    return;
  }
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});
