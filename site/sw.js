// 数据缓存：按「改了之后要不要立刻看见」分两档
//
// 为什么需要：GitHub Pages 的 cache-control 只有 max-age=600（改不了）。手机上
// 「打开 → 关掉 → 二十分钟后再打开」是最常见的用法，而 10 分钟窗口外的每次重开都要
// 重下约 450 KB（48 个请求、4G 下 4~5 秒）。命中本缓存后同样一次重开只要约 0.2 秒。
//
// 只缓存 docs/ 下的**数据**，app shell（HTML/CSS/JS）一律走网络：数据和代码的失效
// 节奏不同，shell 一旦也吃缓存，部署后就会出现「旧 JS 配新数据」这种最难查的组合。
//
//   · 卡面 / 状态 JSON、词条 → stale-while-revalidate。它们是**产物**，只在批量生成时
//     整体换一次，先给缓存里的那份、后台静默换新，用户感知不到。
//   · ddd 设计文档、manifest 索引 → network-first。这两个是**正在被写的东西**：文档
//     改完刷新却还是上一版，会让人以为改动没生效；索引吃到旧的会让新加的途径整条
//     不出现（连请求都不会发）。它们都很小，且不在卡片列表的关键路径上（ddd 文档
//     只在领域模型页拉），值得用一次往返换「刷新即所见」。
//
// 注意 scope 只决定本 SW **控制哪些页面**，不限制它**拦截哪些请求**——SW 装在
// site/ 下（scope 为 site/），照样拦得到 ../docs/ 的数据文件。
const CACHE = 'cardgame-data-v3';
// 改数据缓存格式/策略时把版本号 +1，activate 会清掉上一代
const DATA_RE = /\/docs\/(json\/.+\.json|meta\/glossary\.json)$/;
// AI 出图成品（画面 cards/ 与边框 frames/）：产物属性同卡面 JSON（批量换代、同名覆盖），
// 走 SWR；缺席的 404 不进缓存
const ART_RE = /\/site\/assets\/(cards|frames)\/.+\.webp$/;
// 上面的 DATA_RE 包含索引与设计文档，先行摘出来（下面那条判定在前，先命中的赢）
const NETWORK_FIRST_RE = /\/docs\/(json\/manifest\.json|ddd\/.+\.md)$/;

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
  if (NETWORK_FIRST_RE.test(url.pathname)) { e.respondWith(networkFirst(e)); return; }
  if (DATA_RE.test(url.pathname) || ART_RE.test(url.pathname)) e.respondWith(staleWhileRevalidate(e));
});

// 索引与设计文档走网络优先。索引才 1 KB 且决定「有哪些途径」，吃到旧的会让新加的
// 途径整条不出现（连请求都不会发），比某张卡晚一版更容易让人以为丢了数据；设计文档
// 是正在被写的东西，缓存里那份晚一版，改文档的人会以为改动没生效
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
