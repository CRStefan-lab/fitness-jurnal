// Service Worker — network-first pentru HTML (updates vizibile imediat)
// cache-first pentru restul (viteză)
const CACHE = 'fitness-v105-english';
const PRECACHE = ['./', './index.html', './manifest.json', './generator.js', './privacy.html', './i18n-en.js',
  './fonts/barlow-400-latin-ext.woff2',
  './fonts/barlow-400-latin.woff2',
  './fonts/barlow-600-latin-ext.woff2',
  './fonts/barlow-600-latin.woff2',
  './fonts/barlow-700-latin-ext.woff2',
  './fonts/barlow-700-latin.woff2',
  './fonts/barlowc-600-latin-ext.woff2',
  './fonts/barlowc-600-latin.woff2',
  './fonts/barlowc-700-latin-ext.woff2',
  './fonts/barlowc-700-latin.woff2',
  './icons/icon-192.png', './icons/favicon-32.png', './icons/apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      // cache:'reload' ocolește HTTP cache-ul GitHub Pages (max-age 10 min) → precache mereu proaspăt
      .then(c => c.addAll(PRECACHE.map(u => new Request(u, { cache: 'reload' }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('fitness-') && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  // Doar resursele proprii — nimic cross-origin în cache (răspunsuri opace)
  if (url.origin !== self.location.origin) return;

  // Network-first pentru HTML și navigation requests — updates vizibile imediat când ești online
  const isHtml = e.request.mode === 'navigate'
    || url.pathname === '/' || url.pathname.endsWith('/')
    || url.pathname.endsWith('.html')
    || e.request.headers.get('accept')?.includes('text/html');

  if (isHtml) {
    e.respondWith(
      fetch(e.request, { cache: 'no-store' })
        .then(resp => {
          // cache doar răspunsuri bune (nu 404/5xx sau pagina unui portal WiFi)
          if (resp.ok && resp.type === 'basic') {
            const copy = resp.clone();
            caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
          }
          return resp;
        })
        .catch(() => caches.match(e.request).then(r => r || caches.match('./index.html')))
    );
    return;
  }

  // Cache-first pentru manifest, JS, CSS, imagini
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request).then(resp => {
      if (resp.ok && resp.type === 'basic') {
        const copy = resp.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
      }
      return resp;
    }).catch(() => Response.error()))
  );
});
