# AI 边框图存放处（v3）

边框 = 一张 AI 出的「黑底卡牌框」图，站点用 `mix-blend-mode: screen` 叠到全出血卡面上复用。
一张框可复用于同档（稀有度 / 途径）所有卡，**无需逐卡出框**——这同时解决了「生图阶段框稳不住」和「矢量框生硬」两个问题。

## 怎么批量出图（别的平台也能用）

`PROMPTS.md` 是全部 47 条**完整** prompt（= 共用约束 v3 框模板 + 主题层），由 `python docs/tools/build_frame_prompts.py` 从 JSON 生成（**勿手改**；改 JSON 后重跑）。
把任意一条 prompt 复制到 豆包 / 即梦 / Midjourney / Stable Diffusion 等平台即可出图：

- **比例**：竖图，建议 `1024×1536`（与卡面 3:4 对齐）。
- **底**：必须**纯黑底、无任何水印 / 签名 / 平台 logo**；中心保持纯黑（screen 时黑底变透明、框线提亮叠加）。
- **margin**：框线应**贴近卡边**（共用约束已强制 minimal margin）；若平台默认四周留白多，出图后裁掉外圈留白再叠。
- **风格**：手绘金属质感笔触（与油画风卡面同语汇）；共用约束已强制，主题层只描述材质与职业母题/配色。

材质分层（数据源 `manifest.artFrame` / 各途径 `artFrameEpic`/`artFrameLegendary` 已定，平台无需另调）：

- 全局三档 `frame-common/uncommon/rare.png`：**非金递进、纯通用、无上下徽记、四角饰纹极简**——所有途径共用。
  - 普通 common = 冷钢银单细线，四角极小几何切角；
  - 精良 uncommon = 青铜绿锈双线 + 四角连续小角托（与线相连、不碎裂）；
  - 稀有 rare = 暖金双线 + 四角小符文（暖金区别于精良的绿铜，与传说亮金拉档）。
- 途径特色两档 `frame-<pathwayId>-epic/legendary.png`：自带**金线**（传说 legendary 金线最适配）+ 四角母题 + 顶/底徽记 + 途径配色（如 thief=渡鸦+黄铜齿轮+煤气灯、assassin=碎镜+黑巫火+血红荆棘、sleepless=守夜灯笼+新月+星图）。

## 站点接入（实现侧）

- `card.js`：卡面全出血渲染（无框）；边框作为覆层 `<img>` 绝对定位，`mix-blend-mode: screen` 叠加。
- 撤掉旧的 `.cs-bezel` 厚金属带与 `border-image` 纹样切分（v1 方案，diffusion 做不好无缝/四角对位，已弃）。
- 画面侧生图 prompt 同步改为「铺满整卡、无框」。
- **压圈暗边（标准处理）**：卡面之上、框线之下叠一层内阴影，把贴边一圈亮卡面压暗，使框线始终浮在最顶不被盖过、中心内容不糊。固定值：`box-shadow: inset 0 0 100px 38px rgba(0,0,0,.8)`（扩散 100px / 实心 38px / 不透明度 .8）。若边角卡面信息被压没，可退到 `inset 0 0 60px 22px rgba(0,0,0,.6)`。

## 两个坑（出图前必读）

1. **水印 / 签名 / 平台 logo**：豆包、即梦、WORKBUDDY 出图工具等都常在右下角盖「XX AI 生成」字样，会落在边框角饰/黑区里、被 screen 直接印到卡面（落在纯黑中心区不压框线，但仍是脏标记）。**出图后必须裁掉或换无痕平台重出**；接入前也可把右下角矩形区域涂成纯黑无损去除。
2. **黑底不纯**：若出图黑底被刷成深灰 / 带噪点，screen 后整条框会泛灰雾。处理：在出图 prompt 强化 `solid pure black background`；或出图后把黑底 chroma-key 抠成纯黑再叠。

同名覆盖即换图。要改框，改 `docs/json/manifest.json` 的 `artFrameFormat`/`artFrame` 或各途径 `*.skills.json` 的 `artFrameEpic`/`artFrameLegendary`，重跑 `build_frame_prompts.py`。
