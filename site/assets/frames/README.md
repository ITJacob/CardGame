# AI 边框图存放处

边框与画面是**两张独立图**，站点叠合展示（边框黑底 + CSS `mix-blend-mode: screen`）。

命名（括号内是**材质层**的 JSON 落点；格式约束不落各档，见下）：

- 全局三档：`frame-common.webp` / `frame-uncommon.webp` / `frame-rare.webp`（`docs/json/manifest.json` 的 `artFrame`，中性配色——主题色交给途径特化档，避免与卡面色板打架）
- 途径特殊化两档：`frame-<pathwayId>-epic.webp` / `frame-<pathwayId>-legendary.webp`（各途径 `*.skills.json` 顶层的 `artFrameEpic` / `artFrameLegendary`）

全部 47 条共用一段格式约束 `manifest.artFrameFormat`：3:4 竖版、手绘媒介（与卡面 `artStyle` 同为绘画质感，非写实 3D 渲染）、纯黑底、中心留空、四边等宽、无文字水印。**比例与媒介只在这一处改**，各档 prompt 只写材质与纹样。

纯黑底是叠合前提：`screen` 混合把纯黑当透明，底色一旦被刷成深灰/深蓝，整张卡面会被提亮偏色。比例若偏离 3:4，`.cs-frame` 的 `object-fit: cover` 会保比例裁掉多余部分（而不是拉伸变形）——所以顶部冠饰别做得太贴边，出图有偏差时会被裁掉。

同名覆盖即换框。批量出图：`PROMPTS.md` 是全部 47 条**完整** prompt（= 共用格式约束 + 材质层）的导出清单（`python docs/tools/build_frame_prompts.py` 生成，勿手改）。
