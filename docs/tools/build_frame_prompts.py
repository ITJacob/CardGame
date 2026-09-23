"""导出全部边框图 prompt 清单到 site/assets/frames/PROMPTS.md，供批量出图。

数据源（权威）：manifest.json 的 artFrameFormat（全局共用约束）+ artFrame（全局三档主题层）
+ 各途径 *.skills.json 顶层的 artFrameEpic / artFrameLegendary（途径主题层）。
每条输出 = artFrameFormat + 主题层，与画面 prompt 的 artFormat + artStyle + art 三段拼装对称。
产物是**无缝纹样**清单——框体几何由站点 CSS 决定，出图不负责成框。
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

共 {n} 张：全局三档 + 22 途径 × epic/legendary。每条 = 共用约束 + 主题层，两者逗号拼接。
出图要求：**正方形无缝纹样**（tileable——不是画一个框；prompt 里已显式否定
picture frame / bezel / border，模型一见「框」就会画成装裱画框）、卡游 UI 素材画法
（干净图形、锐利边缘，非照片质感、非 3D 渲染）、纯黑底。
**框体与框宽完全不归出图管**——站点用 CSS 画框（`.cs-bezel`）并把纹样 mask 成四边等宽带，
出图只要做到「纹样铺满、无缝、中心纯黑」即可。成品按标题文件名存本目录。
共用约束（47 条的开头完全相同，由 `manifest.artFrameFormat` 单点维护）：

```
{fmt}
```

"""


def main() -> None:
    manifest = json.loads((ROOT / "docs/json/manifest.json").read_text(encoding="utf-8"))
    fmt = manifest["artFrameFormat"]
    paths = ROOT / "docs/json"

    entries: list[tuple[str, str]] = []
    for rarity in ("common", "uncommon", "rare"):
        entries.append((f"frame-{rarity}.webp", manifest["artFrame"][rarity]))

    for pw in manifest["pathways"]:
        skills = json.loads((paths / pw["file"]).read_text(encoding="utf-8"))
        entries.append((f"frame-{pw['id']}-epic.webp", skills["artFrameEpic"]))
        entries.append((f"frame-{pw['id']}-legendary.webp", skills["artFrameLegendary"]))

    parts = [HEADER.format(n=len(entries), fmt=fmt)]
    for fname, material in entries:
        prompt = ", ".join(p for p in (fmt, material) if p)
        parts.append(f"## {fname}\n\n```\n{prompt}\n```\n\n")

    with io.open(OUT, "w", encoding="utf-8", newline="\n") as f:
        f.write("".join(parts))
    print(f"{OUT.relative_to(ROOT)}: {len(entries)} 条")


if __name__ == "__main__":
    main()
