const CACHE_NAME = 'turnos2026-v4';
const SHELL = [
    './',
    './index.html',
    './manifest.json',
    './Bulldog.png',
    './notif.mp3'
];

self.addEventListener('install', e => {
    e.waitUntil(
        caches.open(CACHE_NAME).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', e => {
    e.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        ).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', e => {
    const url = e.request.url;

    // Firebase y externos: solo red, nunca cachear
    if (url.includes('firebase') || url.includes('gstatic') || url.includes('googleapis')) {
        return;
    }

    // Recursos propios: Network-first, fallback a caché
    e.respondWith(
        fetch(e.request).then(response => {
            if (response && response.status === 200) {
                const clone = response.clone();
                caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
            }
            return response;
        }).catch(() => caches.match(e.request))
    );
});
