/* Filma12HD — Service Worker · Krijuar nga Erion Nezha */
const VER = 'f12hd-v1';
const SHELL = [
  'index.html', 'film.html',
  'css/style.css', 'js/app.js', 'js/film.js',
  'manifest.json', 'icon-192.png', 'icon-512.png', 'favicon-32.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(VER).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(ks =>
      Promise.all(ks.filter(k => k !== VER).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  // Mos prek videot dhe embed-et — gjithmonë rrjet
  if (/\.(mp4|mkv|m3u8|ts)(\?|#|$)/i.test(u.pathname)) return;
  if (u.hostname.includes('vidmoly') || u.hostname.includes('abyssplayer') ||
      u.hostname.includes('filemoon') || u.hostname.includes('dropbox') ||
      u.hostname.includes('box.ca') || u.hostname.includes('bysedikamoum')) return;
  // Katalogu: rrjet i pari, cache si rezervë (të dhëna të freskëta)
  if (u.pathname.endsWith('movies.json')) {
    e.respondWith(
      fetch(e.request).then(r => {
        const cp = r.clone();
        caches.open(VER).then(c => c.put(e.request, cp));
        return r;
      }).catch(() => caches.match(e.request))
    );
    return;
  }
  // Shell: cache i pari, rrjet si rezervë
  if (e.request.method === 'GET' && u.origin === location.origin) {
    e.respondWith(
      caches.match(e.request).then(hit => hit || fetch(e.request).then(r => {
        const cp = r.clone();
        caches.open(VER).then(c => c.put(e.request, cp));
        return r;
      }))
    );
  }
});
