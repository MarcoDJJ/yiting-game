const CACHE = 'passport-v4-living-adventures';
const SHELL = ['/', '/index.html', '/style.css', '/app.js', '/lib/content.js', '/lib/game-briefs.js', '/lib/revised-games.js', '/lib/game-presentation.js', '/lib/visuals.js', '/lib/motion-frames.js', '/lib/revamp-i18n.js', '/lib/state.js', '/lib/engine.js', '/lib/games.js', '/lib/egypt-games.js', '/lib/i18n.js', '/lib/views.js', '/lib/icons.js', '/manifest.webmanifest', '/assets/icon.svg', '/assets/icon-192.png', '/assets/icon-512.png', '/assets/italy.webp', '/assets/egypt.webp', '/assets/scenes-italy.webp', '/assets/scenes-egypt.webp', '/assets/food-props.webp', '/assets/yiting-motion.webp', '/assets/marco-motion.webp', '/assets/travel-props.webp', '/assets/yiting.webp', '/assets/yiting-red.webp', '/assets/yiting-winter.webp', '/assets/marco.webp', '/assets/marco-winter.webp', '/assets/marco-dinner.webp', '/assets/yiting-egypt.webp', '/assets/yiting-burgundy.webp', '/assets/yiting-evening.webp', '/assets/marco-desert.webp', '/assets/marco-striped.webp', '/assets/marco-polo.webp'];
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
