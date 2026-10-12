const CACHE = 'passport-v2-egypt';
const SHELL = ['/', '/index.html', '/style.css', '/app.js', '/lib/content.js', '/lib/state.js', '/lib/engine.js', '/lib/games.js', '/lib/egypt-games.js', '/lib/i18n.js', '/lib/views.js', '/lib/icons.js', '/manifest.webmanifest', '/assets/icon.svg', '/assets/icon-192.png', '/assets/icon-512.png', '/assets/italy.webp', '/assets/egypt.webp', '/assets/yiting.webp', '/assets/yiting-red.webp', '/assets/yiting-winter.webp', '/assets/marco.webp', '/assets/yiting-egypt.webp', '/assets/yiting-burgundy.webp', '/assets/yiting-evening.webp', '/assets/marco-desert.webp', '/assets/marco-striped.webp', '/assets/marco-polo.webp'];
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting())));
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim())));
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== location.origin || url.pathname.startsWith('/api/')) return;
  event.respondWith(fetch(event.request).then(response => {
    if (response.ok) { const copy = response.clone(); caches.open(CACHE).then(cache => cache.put(event.request, copy)); }
    return response;
  }).catch(() => caches.match(event.request).then(response => response || (event.request.mode === 'navigate' ? caches.match('/') : Response.error()))));
});
