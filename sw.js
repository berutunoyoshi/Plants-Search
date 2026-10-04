// データや辞書を更新したら VERSION を変えてください
const VERSION = 'ylist-20210514-v8';
const CORE = ['./', 'index.html', 'data.json?v=8', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png'];

self.addEventListener('install', e => {
  // cache:'reload' でブラウザのHTTPキャッシュを経由せず、必ずサーバーから最新を取得
  e.waitUntil(caches.open(VERSION)
    .then(c => Promise.all(CORE.map(u => fetch(new Request(u, { cache: 'reload' })).then(r => c.put(u, r)))))
    .then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  // ページ本体はネットワーク優先（オンラインなら常に最新、オフライン時だけキャッシュ）
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req, { cache: 'no-cache' }).then(res => {
      const copy = res.clone(); caches.open(VERSION).then(c => c.put('index.html', copy)); return res;
    }).catch(() => caches.match('index.html')));
    return;
  }
  // それ以外（data.json・アイコン・フォント）はキャッシュ優先
  e.respondWith(caches.match(req).then(hit => hit ||
    fetch(req).then(res => {
      if (res && (res.ok || res.type === 'opaque')) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
      return res;
    })));
});
