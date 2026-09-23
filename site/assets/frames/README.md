# AI 边框图存放处

画面与纹样是**两张独立图**：画面铺满整张卡，纹样**切分**后叠上去。框体本身不是出图——它是 CSS 画的（`.cs-bezel`）。

命名（括号内是**主题层**的 JSON 落点；画法约束不落各档，见下）：

- 全局三档：`frame-common.webp` / `frame-uncommon.webp` / `frame-rare.webp`（`docs/json/manifest.json` 的 `artFrame`，中性配色——主题色交给途径特化档，避免与卡面色板打架）
- 途径特殊化两档：`frame-<pathwayId>-epic.webp` / `frame-<pathwayId>-legendary.webp`（各途径 `*.skills.json` 顶层的 `artFrameEpic` / `artFrameLegendary`）

## 分工：prompt 只管画纹样，框体和切分都归 CSS

早先让模型直接画一个框，三连翻车：写实铁框 → 油画画框 → 装裱画框。**只要 prompt 里出现 frame / border / bezel，模型就会围绕画心做构图，画出来必然是画框**，无论怎么强调「这是卡游 UI」。所以现在让 AI 画**正方形纹样**，格式约束里显式否定那几个词，主题层也禁写 `apex / edge / corner / side` 这类构图定位词。

纹样怎么变成长在卡上的框，由 CSS 决定：

| | 做法 |
|---|---|
| 框体 | `.cs-bezel` 画不透明金属厚带（渐变 + 外沿高光 + 内嵌槽），按稀有度着色 |
| 纹样切分 | `.cs-orn` 用 **`border-image`**：源图四角 → 卡的四角（真角饰），源图中段 → 四边重复成边饰 |
| 框宽 | `--frame-band`（默认 34px），`border-width` 直接给出，精确等宽 |
| 切分位置 | `--orn-slice`（默认 40%），调大 → 四角占源图更多、边饰更碎 |

`border-image` 是关键：早先用「mask 平铺」是错的——纹样在四个角上随机截断，读起来是壁纸而不是框。**框的身份就在四个角上**，源图的象限正好对到卡角。

## 两个坑

**`border-image-source` 必须内联。** 不能写成 `border-image-source: var(--orn-src)`——自定义属性里的相对 `url()` 按**消费它的样式表**的基址解析，写在 `app.css` 里会解析成 `site/css/assets/...` → 404 → 静默不出图。所以 `card.js` 直接把 `border-image-source:url(...)` 内联给出，其余切分参数留在类里。

**用图前必查水印。** 实测豆包出图右下角带「豆包AI生成」。它会落在右下角饰里，经 `screen` 混合直接印到卡面上——**用图前必须裁掉或重出**。

## 调色旋钮（都在 `site/css/app.css` 的 `.cs-artwrap`）

- `--frame-band`：框宽。
- `--bz`：框体主色，按稀有度自动取（`.card-sheet.r-*` 覆盖；common 走 `--common`）。
- `--orn-slice`：纹样切分比例。

纹样层 `opacity: .8`：它跟框体是 `screen` 混合，只会**提亮**，所以纹样读起来是金属上的浮雕而非发光贴纸；调高就往「发光金线」走。纯黑底是前提——`screen` 把纯黑当透明，底色一旦被刷成灰/蓝，整条框带会被提亮偏色。

同名覆盖即换图。批量出图：`PROMPTS.md` 是全部 47 条**完整** prompt（= 共用约束 + 主题层）的导出清单（`python docs/tools/build_frame_prompts.py` 生成，勿手改）。
