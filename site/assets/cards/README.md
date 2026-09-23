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

## 可选：按卡建目录（文件名不可控时）

文件名没法自己定的场景（手机直传 `IMG_0042.jpg`、`微信图片_20260923.png`），可以再建一级 `<cardId>/`，里面文件名随意：

```
site/assets/cards/skill_sleepless_s9_sleepless_body/微信图片_20260923.png
```

静态站列不出目录里有什么，这种情况**必须**跑一次索引脚本（否则网页上还是黑的）：

```
python docs/tools/gen_card_assets.py            # 扫描 → 写 index.json
python docs/tools/gen_card_assets.py --check    # 体检：拼错的目录名 / HEIC / >1.5MB 大图
python docs/tools/gen_card_assets.py --scaffold # 按 cardId 预建空目录
```

自己命名就走上面那条扁平路径，这一步全省了。脚本对扁平文件也认（会标 legacy）。
