// Self-unregistering service worker to clear orphaned dev caches and prevent 206 partial response errors
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      self.registration.unregister(),
      caches.keys().then((keys) => Promise.all(keys.map((key) => caches.delete(key)))),
    ])
  );
});

self.addEventListener('fetch', (event) => {
  // Completely pass through all requests to avoid caching 206 Partial Content
  event.respondWith(fetch(event.request));
});
