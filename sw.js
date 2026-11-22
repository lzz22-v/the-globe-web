const CACHE_NAME = 'theglobe-pwa-v2';

const APP_SHELL = [
  '/',
  '/index.html',
  '/rooms.html',
  '/personagens.html',
  '/profile.html',
  '/chat.html',
  '/manifest.json',
  '/src/css/global.css',
  '/src/css/brand.css',
  '/src/css/scrollbars.css',
  '/src/css/responsive.css',
  '/src/css/rooms.css',
  '/src/css/personagens.css',
  '/src/css/profile.css',
  '/src/css/chat.css'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.allSettled(APP_SHELL.map((url) => cache.add(url)))
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
        }
        return networkResponse;
      })
      .catch(() => caches.match(request))
  );
});