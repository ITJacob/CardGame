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

- **依然无需索引、无需跑任何脚本** —— 丢进本目录即生效，刷新页面就能看到标记。
- 探测结果按 cardId 缓存在模块级 Map 里（有/无都缓存），生命周期＝页面加载期。所以加图、
  换图后**刷新页面**即重新探测；而在不刷新页面的一次会话内（列表↔详情页之间来回点）不会重探。
- 结果只有「有 / 无」两态，不看文件内容也校验不了损坏；渲染坏图的锅归详情页。
