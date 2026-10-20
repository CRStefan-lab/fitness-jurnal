// Service Worker — rețea-întâi pentru HTML și pentru scripturile proprii (index.html, generator.js și i18n-en.js
// rămân mereu din aceeași versiune), cu limită de 3 s pe semnal slab; cache-first pentru fonturi și imagini.
const CACHE = 'fitness-v121-pista-activa';
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

// Rețea întâi; dacă rețeaua nu răspunde în 3 s, copia din cache (dacă există). Răspunsurile bune se pun în cache.
function netFirst(req, cacheMode, fallbackUrl) {
  return new Promise(resolve => {
    let done = false;
    const fromCache = () => caches.match(req).then(r => r || (fallbackUrl ? caches.match(fallbackUrl) : undefined));
    const timer = setTimeout(() => { fromCache().then(r => { if (r && !done) { done = true; resolve(r); } }); }, 3000);
    fetch(req, { cache: cacheMode })
      .then(resp => {
        // cache doar răspunsuri bune (nu 404/5xx sau pagina unui portal WiFi)
        if (resp.ok && resp.type === 'basic') {
          const copy = resp.clone();
          caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
        }
        if (!done) { done = true; clearTimeout(timer); resolve(resp); }
      })
      .catch(() => fromCache().then(r => { if (!done) { done = true; clearTimeout(timer); resolve(r || Response.error()); } }));
  });
}

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

  if (isHtml) { e.respondWith(netFirst(e.request, 'no-store', './index.html')); return; }
  if (url.pathname.endsWith('.js')) { e.respondWith(netFirst(e.request, 'no-cache', null)); return; }

  // Cache-first pentru manifest, fonturi, imagini
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
