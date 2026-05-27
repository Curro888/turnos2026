const CACHE_NAME = 'turnos2026-v6';
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

// ===== NOTIFICACIONES PUSH =====
self.addEventListener('push', e => {
    let data = { title: 'Turnos 2026', body: 'Tienes una nueva notificación', icon: './Bulldog.png' };
    if (e.data) {
        try { data = { ...data, ...e.data.json() }; } catch { data.body = e.data.text(); }
    }
    e.waitUntil(
        self.registration.showNotification(data.title, {
            body: data.body,
            icon: data.icon || './Bulldog.png',
            badge: './Bulldog.png',
            vibrate: [200, 100, 200],
            data: { url: data.url || './' }
        })
    );
});

self.addEventListener('notificationclick', e => {
    e.notification.close();
    e.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
            if (list.length > 0) return list[0].focus();
            return clients.openWindow(e.notification.data.url || './');
        })
    );
});

// ===== FIREBASE MESSAGING BACKGROUND =====
importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-messaging.js');

firebase.initializeApp({
    apiKey: "AIzaSyBJ1WtRyZxxLtJnrZZtaKxgIO3JgJwo_Ik",
    authDomain: "calendarioturnos-6d35c.firebaseapp.com",
    databaseURL: "https://calendarioturnos-6d35c-default-rtdb.firebaseio.com",
    projectId: "calendarioturnos-6d35c",
    storageBucket: "calendarioturnos-6d35c.firebasestorage.app",
    messagingSenderId: "892183334973",
    appId: "1:892183334973:web:837233c49e8b1249369a54"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(payload => {
    const { title = 'Turnos 2026', body = 'Nueva notificación' } = payload.notification || {};
    self.registration.showNotification(title, {
        body,
        icon: './Bulldog.png',
        badge: './Bulldog.png',
        vibrate: [200, 100, 200]
    });
});
