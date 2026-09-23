# AI 边框图存放处（v3）

边框 = 一张 AI 出的「黑底金线卡牌框」图，站点用 `mix-blend-mode: screen` 叠到全出血卡面上复用。
一张框可复用于同档（稀有度 / 途径）所有卡，**无需逐卡出框**——这同时解决了「生图阶段框稳不住」和「矢量框生硬」两个问题。

## 怎么批量出图（别的平台也能用）

`PROMPTS.md` 是全部 47 条**完整** prompt（= 共用约束 v3 框模板 + 主题层），由 `python docs/tools/build_frame_prompts.py` 从 JSON 生成（**勿手改**；改 JSON 后重跑）。
把任意一条 prompt 复制到 豆包 / 即梦 / Midjourney / Stable Diffusion 等平台即可出图：

- **比例**：竖图，建议 `1024×1536`（与卡面 3:4 对齐）。
- **底**：必须**纯黑底、无任何水印 / 签名 / 平台 logo**；中心保持纯黑（screen 时黑底变透明、金线提亮叠加）。
- **margin**：金线应**贴近卡边**（共用约束已强制 minimal margin）；若平台默认四周留白多，出图后裁掉外圈留白再叠。
- **风格**：手绘鎏金笔触（与油画风卡面同语汇）；共用约束已强制，主题层只描述职业母题与配色。

分类（领会原意图：前三档通用、后两档职业特色）：

- 全局三档 `frame-common/uncommon/rare.png`：中性配色，四角小玫瑰饰、上下徽记留空——所有途径共用。
- 途径特色两档 `frame-<pathwayId>-epic/legendary.png`：四角母题 + 顶/底徽记 + 途径配色（如 thief=渡鸦+黄铜齿轮+煤气灯、assassin=碎镜+黑巫火+血红荆棘、sleepless=守夜灯笼+新月+星图）。

## 站点接入（实现侧）

- `card.js`：卡面全出血渲染（无框）；边框作为覆层 `<img>` 绝对定位，`mix-blend-mode: screen` 叠加。
- 撤掉旧的 `.cs-bezel` 厚金属带与 `border-image` 纹样切分（v1 方案，diffusion 做不好无缝/四角对位，已弃）。
- 画面侧生图 prompt 同步改为「铺满整卡、无框」。

## 两个坑（出图前必读）

1. **水印 / 签名 / 平台 logo**：豆包等常在右下角盖「XX AI 生成」或模型签名，会落在边框角饰里、被 screen 直接印到卡面。**出图后必须裁掉或换无痕平台重出**。
2. **黑底不纯**：若出图黑底被刷成深灰 / 带噪点，screen 后整条框会泛灰雾。处理：在出图 prompt 强化 `solid pure black background`；或出图后把黑底 chroma-key 抠成纯黑再叠。

同名覆盖即换图。要改框，改 `docs/json/manifest.json` 的 `artFrameFormat`/`artFrame` 或各途径 `*.skills.json` 的 `artFrameEpic`/`artFrameLegendary`，重跑 `build_frame_prompts.py`。
