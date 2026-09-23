# AI 边框图存放处（v3）

边框 = 一张 AI 出的「黑底卡牌框」图，站点用 `mix-blend-mode: screen` 叠到全出血卡面上复用。
一张框可复用于同档（稀有度 / 途径）所有卡，**无需逐卡出框**——这同时解决了「生图阶段框稳不住」和「矢量框生硬」两个问题。

## 怎么批量出图（别的平台也能用）

`PROMPTS.md` 是全部 47 条**完整** prompt，由 `python docs/tools/build_frame_prompts.py` 从 JSON 生成（**勿手改**；改 JSON 后重跑）。其中**前三档 common/uncommon/rare 为自包含完整 prompt**（风格基准见 `PROMPTS_REFERENCE.md`，不套用共用约束）；**44 张职业框 epic/legendary = 共用约束 + 途径主题层**。
把任意一条 prompt 复制到 豆包 / 即梦 / Midjourney / Stable Diffusion 等平台即可出图：

- **比例**：竖图，建议 `1024×1536`（与卡面 3:4 对齐）。
- **底**：必须**纯黑底、无任何水印 / 签名 / 平台 logo**；中心保持纯黑（screen 时黑底变透明、框线提亮叠加）。
- **margin**：框线应**贴近卡边**（共用约束已强制 minimal margin）；若平台默认四周留白多，出图后裁掉外圈留白再叠。
- **风格**：手绘金属质感笔触（与油画风卡面同语汇）；职业框的共用约束已强制细线贴边/黑底/留空，主题层只描述材质与职业母题/配色；前三档为自包含 prompt，本身已含全部约束。

材质分层（数据源 `manifest.artFrame` / 各途径 `artFrameEpic`/`artFrameLegendary` 已定，平台无需另调）：

- 全局三档 `frame-common/uncommon/rare.png`：**非金递进、纯通用、无上下徽记、四角饰纹极简**——所有途径共用。
  - 普通 common = 冷钢银单细线，四角极小几何切角；
  - 精良 uncommon = 青铜绿锈双线 + 四角连续小角托（与线相连、不碎裂）；
  - 稀有 rare = 暖金**三线**（双主线 + 一条更细内描线，三线挤在同一窄带内）+ 四角小符文（暖金区别于精良的绿铜，线数 1/2/3 递进与精良拉开结构区分）。
- 途径特色两档 `frame-<pathwayId>-epic/legendary.png`：自带**金线**（传说 legendary 金线最适配）+ 四角母题 + 顶/底徽记 + 途径配色（如 thief=渡鸦+黄铜齿轮+煤气灯、assassin=碎镜+黑巫火+血红荆棘、sleepless=守夜灯笼+新月+星图）。

## 站点接入（实现侧）

- `card.js`：卡面全出血渲染（无框）；边框作为覆层 `<img>` 绝对定位，`mix-blend-mode: screen` 叠加。
- 撤掉旧的 `.cs-bezel` 厚金属带与 `border-image` 纹样切分（v1 方案，diffusion 做不好无缝/四角对位，已弃）。
- 画面侧生图 prompt 同步改为「铺满整卡、无框」。
- **压圈暗边（标准处理）**：卡面之上、框线之下叠一层内阴影，把贴边一圈亮卡面压暗，使框线始终浮在最顶不被盖过、中心内容不糊。固定值：`box-shadow: inset 0 0 100px 38px rgba(0,0,0,.8)`（扩散 100px / 实心 38px / 不透明度 .8）。若边角卡面信息被压没，可退到 `inset 0 0 60px 22px rgba(0,0,0,.6)`。

## 两个坑（出图前必读）

1. **水印 / 签名 / 平台 logo**：豆包、即梦、WORKBUDDY 出图工具等都常在右下角盖「XX AI 生成」字样，会落在边框角饰/黑区里、被 screen 直接印到卡面（落在纯黑中心区不压框线，但仍是脏标记）。**出图后必须裁掉或换无痕平台重出**；接入前也可把右下角矩形区域涂成纯黑无损去除。
2. **黑底不纯（实测几乎必然发生）**：扩散模型出的「纯黑底」实测是 `#050402` 一类的近黑灰，**实测 `frame-common.png` 有 96.88% 的像素非纯黑、中心区最亮到 21**。screen 叠加会把整张卡面整体提灰发雾。prompt 只能缓解、无法保证，所以**出图后必须跑压黑**：

   ```bash
   python docs/tools/normalize_frame.py site/assets/frames/frame-common.png   # 压黑并原地覆盖
   python docs/tools/normalize_frame.py --check site/assets/frames/*.png      # 只体检不改写
   ```

   纯标准库实现（不依赖 Pillow），阈值默认 24：亮度 ≤24 归零、24–48 线性压缩（软过渡，避免灰雾边界出现硬边圆环），>48 的框线本体零损伤。实测压黑后中心区最亮 21→0、灰雾 96.88%→0.20%，框线占比 2.78% 保持不变。
3. **框带过宽**：同一脚本的 `--check` 会报出「框带深度占卡宽百分比」（目标 **<4%**）与四边外缘留白。实测旧版 `frame-common.png` 为 **12.79%**（左右深 64/67px、上下深 113/73px）——超标约 3 倍。注意其中一截是**灰雾外溢造成的视觉增宽**：压黑后同一张图降到 12.30%、上边深度 113→70px，所以**先压黑再量框宽**，否则会把灰雾误算成框线。

同名覆盖即换图。要改框，改 `docs/json/manifest.json` 的 `artFrameFormat`/`artFrame` 或各途径 `*.skills.json` 的 `artFrameEpic`/`artFrameLegendary`，重跑 `build_frame_prompts.py`。
