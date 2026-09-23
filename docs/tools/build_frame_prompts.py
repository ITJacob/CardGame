"""导出全部边框图 prompt 清单到 site/assets/frames/PROMPTS.md，供批量出图。

数据源（权威）：manifest.json 的 artFrame（全局三档）+ 各途径 *.skills.json 顶层的
artFrameEpic / artFrameLegendary。边框 prompt 改版后重跑本脚本即可，勿手改产物。

用法：python docs/tools/build_frame_prompts.py
"""

import io
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
OUT = ROOT / "site" / "assets" / "frames" / "PROMPTS.md"

HEADER = """# 边框图 prompt 清单

产物，由 `python docs/tools/build_frame_prompts.py` 生成，**勿手改**；改了 JSON 里的边框 prompt 后重跑。

共 {n} 张：全局三档 + 22 途径 × epic/legendary。出图要求：3:4 竖版、纯黑底、中心留空
（prompt 已含 `completely empty center, solid black background`），成品按标题文件名存本目录。

"""


def main() -> None:
    manifest = json.loads((ROOT / "docs/json/manifest.json").read_text(encoding="utf-8"))

    entries: list[tuple[str, str]] = []
    for rarity in ("common", "uncommon", "rare"):
        entries.append((f"frame-{rarity}.webp", manifest["artFrame"][rarity]))

    for pw in manifest["pathways"]:
        skills = json.loads((ROOT / "docs/json" / pw["file"]).read_text(encoding="utf-8"))
        entries.append((f"frame-{pw['id']}-epic.webp", skills["artFrameEpic"]))
        entries.append((f"frame-{pw['id']}-legendary.webp", skills["artFrameLegendary"]))

    parts = [HEADER.format(n=len(entries))]
    for fname, prompt in entries:
        parts.append(f"## {fname}\n\n```\n{prompt}\n```\n\n")

    with io.open(OUT, "w", encoding="utf-8", newline="\n") as f:
        f.write("".join(parts))
    print(f"{OUT.relative_to(ROOT)}: {len(entries)} 条")


if __name__ == "__main__":
    main()
