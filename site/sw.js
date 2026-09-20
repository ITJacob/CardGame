// 仅用于满足浏览器「可安装」判定（Chrome 要求已注册的 SW 带 fetch 监听器）。
// 不缓存任何资源：fetch 监听器不调 respondWith，请求一律走浏览器默认网络路径。
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('fetch', () => {});
