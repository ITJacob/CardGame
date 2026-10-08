# AI 出图成品存放处

**命名：`<cardId>.png`（如 `skill_sleepless_s9_sleepless_body.png`）。cardId 天然唯一，站点按 id 现拼路径，无需索引、无需跑任何脚本。**

流程：详情页「AI 出图」复制 prompt → 生成 → **标题行那个 id 点一下就复制到剪贴板** → 本地照着重命名成 `<id>.png` → 丢进本目录 → 同名覆盖即换图。

```
site/assets/cards/
  skill_sleepless_s9_sleepless_body.png
  skill_seer_s9_clairvoyance.png
```

## 格式

png / jpg / jpeg / webp / gif / avif / bmp / svg 都行（站点按 png → webp 依次试）。
**HEIC / HEIF 不行** —— iPhone 默认相册格式，Chrome 与安卓一律不渲染；传之前先转成 jpg/png，或在设置里关掉 HEIF。


## 列表页的「有图」徽章

卡片浏览列表页会给**有图的卡**标一枚「有图」徽章，方便一眼看出哪些还缺图。它同样是
「按 id 现拼路径」的：站点对当前页每张卡发一个 **HEAD** 请求问一句在不在（HEAD 不下载
正文，2.7MB 的大图不会被拖下来），命中就点亮徽章。

- **依然无需索引、无需跑任何脚本** —— 丢进本目录即生效。
- 探测结果按 cardId 缓存在 `localStorage`（键 `cg.artmap.v1`），分两类处理：
  - **有图** —— 长期有效，不再重探。
  - **无图** —— **1 小时**后失效。「无图」会随着你出图而变旧，留太久会让已出的图假性地
    没有徽章；过期后刷新页面即重探。
- **刚丢进来的新图想立刻看见**：点筛选栏尾部的「**重探图**」按钮，清掉缓存重
  探一遍；不想点按钮就等 TTL 过期，或在 DevTools 里清一下站点数据。
- 结果只有「有 / 无」两态，不看文件内容也校验不了损坏；渲染坏图的锅归详情页。