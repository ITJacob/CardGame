# AI 边框图存放处

边框与画面是**两张独立图**，站点叠合展示（边框黑底 + CSS `mix-blend-mode: screen`）。

命名：
- 全局三档：`frame-common.webp` / `frame-uncommon.webp` / `frame-rare.webp`（prompt 在 `docs/json/manifest.json` 的 `artFrame`）
- 途径特殊化两档：`frame-<pathwayId>-epic.webp` / `frame-<pathwayId>-legendary.webp`（prompt 在各途径 `*.skills.json` 顶层的 `artFrameEpic` / `artFrameLegendary`）

出图要求：3:4 竖版、纯黑底、中心留空（prompt 已含 `completely empty center, solid black background`）。同名覆盖即换框。

批量出图：`PROMPTS.md` 是全部 47 条边框 prompt 的导出清单（`python docs/tools/build_frame_prompts.py` 生成，勿手改）。
