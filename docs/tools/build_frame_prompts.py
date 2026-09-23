"""导出全部边框图 prompt 清单到 site/assets/frames/PROMPTS.md，供批量出图。

数据源（权威）：manifest.json 的 artFrameFormat（全局共用约束）+ artFrame（全局三档主题层）
+ 各途径 *.skills.json 顶层的 artFrameEpic / artFrameLegendary（途径主题层）。
每条输出 = artFrameFormat + 主题层，与画面 prompt 的 artFormat + artStyle + art 三段拼装对称。
产物是**直接出完整边框图**的 prompt 清单——出图即一张可复用的黑底框图，由站点以 screen 混合叠到全出血卡面复用；框线须细且贴边（风格基准见同目录 PROMPTS_REFERENCE.md）。
边框 prompt 改版后重跑本脚本即可，勿手改产物。

用法：python docs/tools/build_frame_prompts.py
"""

import io
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
OUT = ROOT / "site" / "assets" / "frames" / "PROMPTS.md"

HEADER = """# 边框图 prompt 清单

产物，由 `python docs/tools/build_frame_prompts.py` 生成，**勿手改**；改了 JSON 里的边框 prompt 后重跑。

共 {n} 张：全局三档 + 22 途径 × epic/legendary。
- **前三档（common / uncommon / rare）**：每条是**自包含完整 prompt**，直接照搬 `PROMPTS_REFERENCE.md` 的认可风格，出图时**不套用下方共用约束**（共用约束含通用描边/filigree，会污染细线贴边效果）。
- **44 张职业框（epic / legendary）**：每条 = 共用约束 + 途径主题层，逗号拼接。

**直接出框（非纹样）**：每条 prompt 让 AI 出「一张完整的黑底卡牌边框图」，在豆包 / 即梦 / Midjourney / Stable Diffusion 等平台直接批量出图即可。
- 推荐竖图比例（如 1024x1536）；出图须为**纯黑底、无任何水印 / 签名 / 平台 logo**，中心保持纯黑。
- 框线应**贴近卡边**（margin 小）；若平台默认留白多，出图后裁掉外圈留白再叠。
- 出图后以 `mix-blend-mode: screen` 叠到全出血卡面复用——黑底被 screen 吃透透出卡面、框线提亮叠加，一张框可复用于同档所有卡。
材质分层（数据源已定，平台无需另调）：前三档为非金递进——普通=冷钢银单线 / 精良=青铜绿锈双线+连续角托 / 稀有=暖金双线+小符文；职业 epic/legendary 由各主题层自带金线（传说档金线最适配）。

职业框共用约束（44 条 epic/legendary 的开头完全相同，由 `manifest.artFrameFormat` 单点维护）：

```
{fmt}
```

"""


def main() -> None:
    manifest = json.loads((ROOT / "docs/json/manifest.json").read_text(encoding="utf-8"))
    fmt = manifest["artFrameFormat"]
    paths = ROOT / "docs/json"

    entries: list[tuple[str, str, bool]] = []
    for rarity in ("common", "uncommon", "rare"):
        # 前三档为自包含完整 prompt，不套用 artFrameFormat
        entries.append((f"frame-{rarity}.png", manifest["artFrame"][rarity], True))

    for pw in manifest["pathways"]:
        skills = json.loads((paths / pw["file"]).read_text(encoding="utf-8"))
        entries.append((f"frame-{pw['id']}-epic.png", skills["artFrameEpic"], False))
        entries.append((f"frame-{pw['id']}-legendary.png", skills["artFrameLegendary"], False))

    parts = [HEADER.format(n=len(entries), fmt=fmt)]
    for fname, material, is_self_contained in entries:
        # 自包含（前三档）直接出完整 prompt；职业框 = 共用约束 + 主题层
        prompt = material if is_self_contained else ", ".join(p for p in (fmt, material) if p)
        parts.append(f"## {fname}\n\n```\n{prompt}\n```\n\n")

    with io.open(OUT, "w", encoding="utf-8", newline="\n") as f:
        f.write("".join(parts))
    print(f"{OUT.relative_to(ROOT)}: {len(entries)} 条")


if __name__ == "__main__":
    main()
