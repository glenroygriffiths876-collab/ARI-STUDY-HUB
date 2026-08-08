const VERSION = 'ariana-study-hub-v11-20260808';
const CORE_CACHE = `${VERSION}-core`;
const MEDIA_CACHE = `${VERSION}-media`;
const CORE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png'
];
const OPTIONAL_EXTERNAL = [
  'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js'
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const core = await caches.open(CORE_CACHE);
    await core.addAll(CORE);
    const media = await caches.open(MEDIA_CACHE);
    await Promise.all(OPTIONAL_EXTERNAL.map(async url => {
      try {
        const req = new Request(url, { mode: 'no-cors' });
        const res = await fetch(req);
        if (res) await media.put(req, res);
      } catch (_) {}
    }));
  })());
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keep = new Set([CORE_CACHE, MEDIA_CACHE]);
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => !keep.has(k)).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // YouTube embeds need the network and are deliberately not cached.
  if (url.hostname.includes('youtube.com') || url.hostname.includes('youtube-nocookie.com') || url.hostname.includes('googlevideo.com')) return;

  // Same-origin application files: cache first, then network, then index fallback.
  if (url.origin === self.location.origin) {
    event.respondWith((async () => {
      const cached = await caches.match(req);
      if (cached) return cached;
      try {
        const res = await fetch(req);
        if (res && res.ok) {
          const cache = await caches.open(CORE_CACHE);
          cache.put(req, res.clone()).catch(() => {});
        }
        return res;
      } catch (_) {
        return (await caches.match('./index.html')) || Response.error();
      }
    })());
    return;
  }

  // Wikimedia and jsDelivr enrichment: runtime cache where browser/CORS permits.
  if (url.hostname.includes('wikimedia.org') || url.hostname.includes('jsdelivr.net')) {
    event.respondWith((async () => {
      const cached = await caches.match(req);
      if (cached) return cached;
      try {
        const res = await fetch(req);
        const cache = await caches.open(MEDIA_CACHE);
        cache.put(req, res.clone()).catch(() => {});
        return res;
      } catch (_) {
        return cached || Response.error();
      }
    })());
  }
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil((async () => {
    const target = new URL('./index.html#study', self.location.origin).href;
    const windows = await clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of windows) {
      if ('navigate' in client) await client.navigate(target);
      if ('focus' in client) return client.focus();
    }
    if (clients.openWindow) return clients.openWindow(target);
  })());
});
