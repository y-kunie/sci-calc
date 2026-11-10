// 関数電卓: オフライン用キャッシュ (鋼材断面リストと同じ方針)
// 通信があれば常にネットから取り直して保存する (更新が自動で届く)。通信が無ければ保存したものを返す。
const CACHE = 'sci-calc-v1';

self.addEventListener('install', () => { self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(self.clients.claim()); });

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  let url;
  try { url = new URL(req.url); } catch (_) { return; }
  if (url.origin !== self.location.origin) return;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      // no-cache: ブラウザの手元キャッシュを使う前に必ずサーバーへ更新確認する
      const res = await fetch(req.url, { cache: 'no-cache' });
      if (res && res.ok) cache.put(req, res.clone());
      return res;
    } catch (err) {
      const hit = await cache.match(req, { ignoreSearch: true });
      if (hit) return hit;
      if (req.mode === 'navigate') {
        const keys = await cache.keys();
        for (const k of keys) {
          const r = await cache.match(k);
          if (r && (r.headers.get('content-type') || '').includes('text/html')) return r;
        }
      }
      throw err;
    }
  })());
});
