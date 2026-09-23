# AI 出图成品存放处

**按卡建目录，目录名 = cardId，里面的文件名与格式随意**（手机直传的 `IMG_0042.jpg`、`微信图片_20260923.png` 都行）。

```
site/assets/cards/
  skill_sleepless_s9_sleepless_body/
    微信图片_20260923.png       ← 文件名随意，第一张作主图
    2_另一版.webp               ← 数字前缀可指定顺序（1_ 在前）
  skill_seer_s9_clairvoyance.jpg   ← 旧的扁平放法仍认（标 legacy）
  index.json                    ← 脚本生成，勿手改
```

## 为什么必须有 index.json

站点是纯静态（GitHub Pages / `python -m http.server`），**浏览器列不出目录里有什么**。文件名又不可控，前端猜不出来，只能靠索引给路径。所以：

> **传完图必须重跑一次生成脚本**，否则网页上还是黑的（不是没生效，是索引里没有）。

```
python docs/tools/gen_card_assets.py            # 扫描 → 写 index.json
python docs/tools/gen_card_assets.py --check    # 只体检：拼错的目录名 / HEIC / 大图
python docs/tools/gen_card_assets.py --scaffold # 按 cardId 预建全部空目录（手机上传前跑一次）
```

脚本顺手做体检，三类问题会点名：目录名不在 cardId 全集里（手打必错）、浏览器渲染不了的格式、**超过 1.5 MB 的大图**（手机原图常见，Pages 上首屏很痛）。

## 格式红线

| 可用 | png / jpg / jpeg / webp / gif / avif / bmp / svg |
|---|---|
| **不可用** | **HEIC / HEIF**（iPhone 默认相册格式，Chrome 与安卓一律不渲染）、tiff、psd、raw |

iPhone 传图前先在相册里「分享 → 选 JPG」，或在设置里关掉 HEIF；已经传了的会在 `--check` 里被点出来。

## 换图

同名覆盖即可（不用改索引里记的文件名，索引只记文件名，改内容覆盖同名文件就换了）。想换主图：把新的改成数字更小的前缀，或删掉旧的那张再重跑脚本。
