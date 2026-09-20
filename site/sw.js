// 数据缓存：stale-while-revalidate
//
// 为什么需要：GitHub Pages 的 cache-control 只有 max-age=600（改不了）。手机上
// 「打开 → 关掉 → 二十分钟后再打开」是最常见的用法，而 10 分钟窗口外的每次重开都要
// 重下约 450 KB（48 个请求、4G 下 4~5 秒）。命中本缓存后同样一次重开只要约 0.2 秒。
//
// 只缓存 docs/ 下的**数据**（卡面/状态 JSON、词条、ddd 设计文档），app shell
// （HTML/CSS/JS）一律走网络：数据和代码的失效节奏不同，shell 一旦也吃缓存，部署后
// 就会出现「旧 JS 配新数据」这种最难查的组合。数据是只读内容，先给缓存里的那份、
// 后台静默换新，用户感知不到；代价是数据更新后最多有一次加载看到上一版。
//
// 注意 scope 只决定本 SW **控制哪些页面**，不限制它**拦截哪些请求**——SW 装在
// site/ 下（scope 为 site/），照样拦得到 ../docs/ 的数据文件。
const CACHE = 'cardgame-data-v1';
// 改数据缓存格式/策略时把版本号 +1，activate 会清掉上一代
const DATA_RE = /\/docs\/(json\/.+\.json|meta\/glossary\.json|ddd\/.+\.md)$/;
const MANIFEST_RE = /\/docs\/json\/manifest\.json$/;

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names
      .filter((n) => n.startsWith('cardgame-data-') && n !== CACHE)
      .map((n) => caches.delete(n)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  // 不在白名单里的请求不调 respondWith，走浏览器默认路径
  if (MANIFEST_RE.test(url.pathname)) { e.respondWith(networkFirst(e)); return; }
  if (DATA_RE.test(url.pathname)) e.respondWith(staleWhileRevalidate(e));
});

// 索引走网络优先：它才 1 KB，且决定「有哪些途径」。吃到旧的索引会让新加的途径
// 整条不出现（连请求都不会发），比某张卡晚一版更容易让人以为丢了数据
async function networkFirst(e) {
  const cache = await caches.open(CACHE);
  try {
    const res = await fetch(e.request);
    if (res.ok) cache.put(e.request, res.clone());
    return res;
  } catch (err) {
    const hit = await cache.match(e.request);
    if (hit) return hit;
    throw err;
  }
}

async function staleWhileRevalidate(e) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(e.request);
  const fresh = fetch(e.request).then((res) => {
    if (res && res.ok) cache.put(e.request, res.clone());
    return res;
  });
  if (cached) {
    // 后台更新也要用 waitUntil 撑住事件：否则 SW 可能在 put 完成前被回收
    e.waitUntil(fresh.catch(() => {}));
    return cached;
  }
  try {
    return await fresh;
  } catch (err) {
    const hit = await cache.match(e.request);
    if (hit) return hit;
    throw err;
  }
}
