# AI 边框图存放处

边框与画面是**两张独立图**，站点叠合展示（边框黑底 + CSS `mix-blend-mode: screen`）。

命名（括号内是**材质层**的 JSON 落点；格式约束不落各档，见下）：

- 全局三档：`frame-common.webp` / `frame-uncommon.webp` / `frame-rare.webp`（`docs/json/manifest.json` 的 `artFrame`，中性配色——主题色交给途径特化档，避免与卡面色板打架）
- 途径特殊化两档：`frame-<pathwayId>-epic.webp` / `frame-<pathwayId>-legendary.webp`（各途径 `*.skills.json` 顶层的 `artFrameEpic` / `artFrameLegendary`）

## 分工：prompt 只管画，几何归 CSS

47 条共用一段约束 `manifest.artFrameFormat`：3:4 竖版、手绘媒介（油画笔触 / 哑光颜料 / 画布颗粒，并显式排除金属光泽、写实与 3D 渲染）、纹样填满外围 1/3、中心留黑、无文字水印。**比例与画风只在这一处改**，各档只写材质与纹样。

材质层一律用颜料语汇（`painted in dulled gold`、`gold-painted filigree`、`muted silver-grey pigment`），不用 `brushed` / `polished` / `matte` / `engraved` / `gilded` / `molten` / `tarnished` 这类金属加工词——它们会把出图直接拉回写实铁框。

**框宽不由出图决定**：AI 画不准精确几何，47 张独立出图必然漂移，所以 `.cs-frame` 用 CSS `mask` 只显示四条边带（宽度见 `app.css` 的 `--frame-band`），四边与全站像素级一致。prompt 侧只负责「纹样够宽」（外围 1/3），够 CSS 裁即可。

纯黑底是叠合前提：`screen` 混合把纯黑当透明，底色一旦被刷成深灰/深蓝，整张卡面会被提亮偏色。比例偏离 3:4 时 `object-fit: cover` 保比例裁切——所以顶部冠饰别做得太贴边，出图有偏差会被裁掉。

同名覆盖即换框。批量出图：`PROMPTS.md` 是全部 47 条**完整** prompt（= 共用格式约束 + 材质层）的导出清单（`python docs/tools/build_frame_prompts.py` 生成，勿手改）。
