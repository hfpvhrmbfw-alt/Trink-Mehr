// Service Worker: App-Hülle zuerst aus dem Zwischenspeicher, damit sie sofort und offline startet.
// VERSION bei jeder Änderung an einer Datei aus SHELL hochzählen.
const VERSION = 'v9';
const SHELL = ['./', 'index.html', 'styles.css', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/apple-touch-icon.png',
  'src/main.js', 'src/model.js', 'src/logic.js', 'src/catalog.js', 'src/storage.js', 'src/texts.js', 'src/plants.js', 'src/scene.js', 'src/beet.js', 'src/papier.js'];

// Neue Versionen warten, bis die Seite 'skip' schickt (siehe watchUpdates in main.js). cache:'reload' umgeht den Browser-Zwischenspeicher.
self.addEventListener('install', (e) => e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL.map((u) => new Request(u, { cache: 'reload' }))))));
self.addEventListener('message', (e) => { if (e.data === 'skip') self.skipWaiting(); });
self.addEventListener('activate', (e) => e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then((hit) => hit || fetch(e.request)));
});
