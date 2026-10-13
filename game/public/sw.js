// 数据与美术缓存：按「改了之后要不要立刻看见」分两档
//
// 为什么需要：GitHub Pages 的 cache-control 只有 max-age=600（改不了）。game 端的大头不是
// 数据而是**图**——20 张立绘（1152×1536）、20 张透明底头像、832 张卡图按张懒加载；10 分钟
// 窗口外每次重开都要重下用过的那批，弱网下要等好几秒。命中本缓存后同样一次重开只要 app shell
// 那点字节，图与数据全走本地。
//
// 只缓存 docs/json 的**数据**与 assets 下的**图**，app shell（HTML/CSS/JS，含 ui-kit 精灵）
// 一律走网络：数据和代码的失效节奏不同，shell 一旦也吃缓存，部署后就会出现「旧 JS 配新数据」
// 这种最难查的组合。（shell 缓存＝离线开打，属二期，见 DESIGN.md §十二。）
//
//   · 卡池/状态 JSON、立绘/头像/卡图/边框 → stale-while-revalidate。它们是**产物**，只在
//     批量生成时整体换代，先给缓存里的那份、后台静默换新，用户感知不到；同名替换图片同样
//     由这条自动处理（最多一次加载看到上一版），不用手动 bump 版本。
//   · manifest.json → network-first。索引才 1 KB 且决定「有哪些途径」，吃到旧的会让新加的
//     途径整条不出现（连请求都不会发），值得用一次往返换「刷新即所见」。
//
// 注意 scope 只决定本 SW **控制哪些页面**，不限制它**拦截哪些请求**——SW 装在 /CardGame/ 下
// （scope 为 /CardGame/），照样拦得到同层的 ./docs/ 与 ./assets/。
const CACHE = 'cardgame-game-v1';
// 改缓存策略/格式时把版本号 +1，activate 会清掉上一代
const DATA_RE = /\/docs\/json\/.+\.json$/;
// 立绘 heroes / 透明底头像 avatars / 卡图 cards / 边框 frames：产物属性同上（批量换代、同名
// 覆盖），走 SWR；缺席的 404 不进缓存（只写 res.ok）。扩展名放开浏览器渲染得了的那几种
const ART_RE = /\/assets\/(heroes|avatars|cards|frames)\/.+\.(webp|png|jpe?g|gif|avif|svg)$/;
// manifest 索引先行摘出来走网络优先（判定在前，先命中的赢）
const NETWORK_FIRST_RE = /\/docs\/json\/manifest\.json$/;

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names
      .filter((n) => n.startsWith('cardgame-game-') && n !== CACHE)
      .map((n) => caches.delete(n)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  // 不在白名单里的请求（app shell、图标等）不调 respondWith，走浏览器默认路径
  if (NETWORK_FIRST_RE.test(url.pathname)) { e.respondWith(networkFirst(e)); return; }
  if (DATA_RE.test(url.pathname) || ART_RE.test(url.pathname)) e.respondWith(staleWhileRevalidate(e));
});

// 索引走网络优先：吃到旧的会让新途径整条不出现，比某张卡晚一版更容易让人以为丢了数据
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
