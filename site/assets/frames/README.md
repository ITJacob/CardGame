# AI 边框图存放处

画面与纹样是**两张独立图**：画面铺满整张卡，纹样叠在上面做装饰。**框体本身不是出图**——它是 CSS 画的（`.cs-bezel`）。

命名（括号内是**主题层**的 JSON 落点；画法约束不落各档，见下）：

- 全局三档：`frame-common.webp` / `frame-uncommon.webp` / `frame-rare.webp`（`docs/json/manifest.json` 的 `artFrame`，中性配色——主题色交给途径特化档，避免与卡面色板打架）
- 途径特殊化两档：`frame-<pathwayId>-epic.webp` / `frame-<pathwayId>-legendary.webp`（各途径 `*.skills.json` 顶层的 `artFrameEpic` / `artFrameLegendary`）

## 为什么出的是「纹样」而不是「框」

早先让模型直接画一个框，结果三连翻车：写实铁框 → 油画画框 → 装裱画框。**只要 prompt 里出现 frame / border / bezel，模型就会围绕画心做构图，画出来必然是画框**，无论怎么强调「这是卡游 UI」。

所以现在分工彻底切开：

| | 归谁 | 说明 |
|---|---|---|
| 纹样画什么 | AI | 正方形**无缝纹样**（tileable），黑底 |
| 框多宽、什么形 | CSS | `.cs-bezel` 画不透明厚带，`--frame-band` 单点；纹样被同一套 mask 裁成四边等宽带 |

出图只要做到「纹样铺满、无缝、中心纯黑」。约束里显式否定了 `picture frame / bezel / border`；`artFrameEpic` / `artFrameLegendary` 也禁写 `apex / edge / corner` 这类构图定位词。

## 两个调色旋钮（都在 `site/css/app.css` 的 `.cs-artwrap`）

- `--frame-band`：框宽，默认 34px。改它，框体和纹样层同时跟着变。
- `--bz`：框体主色，按稀有度自动取（`.card-sheet.r-*` 覆盖；common 走 `--common`）。

纹样层 `opacity: .55`：它跟框体是 `screen` 混合，只会**提亮**，所以纹样读起来是金属上的浮雕而非发光贴纸；调高就往「发光金线」走。

纯黑底是混合前提：`screen` 把纯黑当透明，底色一旦被刷成灰/蓝，整条框带会被提亮偏色。

同名覆盖即换图。批量出图：`PROMPTS.md` 是全部 47 条**完整** prompt（= 共用约束 + 主题层）的导出清单（`python docs/tools/build_frame_prompts.py` 生成，勿手改）。
