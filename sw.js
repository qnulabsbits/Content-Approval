// One View Service Worker — minimal for PWA install
const CACHE = 'oneview-v1';
const ASSETS = ['/', '/index.html', '/style.css', '/logo.png',
  '/app-core.js', '/app-content.js', '/app-projects.js', '/app-inventory.js',
  '/app-hr.js', '/app-admin.js', '/app-chat.js', '/app-tasks.js',
  '/app-banner.js', '/app-crm.js', '/app-leaves.js', '/app-settings.js',
  '/app-subtasks.js', '/app-requests.js', '/app-init.js'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  // Network first — always get fresh data
  e.respondWith(
    fetch(e.request).catch(() =>
      caches.match(e.request)
    )
  );
});
