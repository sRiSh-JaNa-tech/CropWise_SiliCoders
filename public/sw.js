self.addEventListener('install', (event) => {
  console.log('[Service Worker] Install');
});

self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activate');
});

self.addEventListener('fetch', (event) => {
  // Pass-through fetch for now, can be extended to cache API queries and static assets
  event.respondWith(fetch(event.request));
});
