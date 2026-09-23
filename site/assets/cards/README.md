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
