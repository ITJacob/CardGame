"""导出全部技能卡画面 prompt 清单到 assets/cards/PROMPTS.md，供批量出图。

数据源（权威）：manifest.json 的 artFormat（全局画幅约束，置最前）
+ 各途径 *.skills.json 顶层的 artStyle（途径画风层）+ 卡级 art.subject / art.elements / art.mood。
拼装口径与 site 卡详情页「复制画面 prompt」完全一致（site/js/views/card.js 的 artPrompt），
逗号拼接为一条自包含完整 prompt；产物落点 source/cards/<cardId>.png。
改了 JSON 里的美术字段后重跑本脚本即可，勿手改产物。

用法：python tools/build_card_prompts.py
"""

import io
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent  # tools/ -> 仓库根
OUT = ROOT / "assets" / "cards" / "PROMPTS.md"

HEADER = """# 技能卡画面 prompt 清单

产物，由 `python tools/build_card_prompts.py` 生成，**勿手改**；改了 JSON 里的美术字段后重跑。

共 {n} 张（22 途径）。每条 = `manifest.artFormat`（全局画幅）+ 途径 `artStyle` + 卡级 `art.subject/elements/mood`，
逗号拼接为**自包含完整 prompt**，复制到出图平台即可；拼装口径与 site 卡详情页「复制画面 prompt」一致。
出图后命名 `<cardId>.png` 放进 `source/cards/`，跑 `python tools/build_art_variants.py` 出三档派生。

全局画幅约束（每条 prompt 的开头完全相同，由 `manifest.artFormat` 单点维护）：

```
{fmt}
```

"""


def main() -> None:
    manifest = json.loads((ROOT / "docs/json/manifest.json").read_text(encoding="utf-8"))
    fmt = manifest["artFormat"]
    paths = ROOT / "docs/json"

    parts = [HEADER.format(n=sum(p["cardCount"] for p in manifest["pathways"]), fmt=fmt)]
    total = 0
    for pw in manifest["pathways"]:
        skills = json.loads((paths / pw["file"]).read_text(encoding="utf-8"))
        style = skills.get("artStyle", "")
        parts.append(f"# 途径：{pw['name']}（{pw['id']}，{pw['cardCount']} 卡）\n\n")
        for c in skills["cards"]:
            a = c.get("art") or {}
            prompt = ", ".join(p for p in (fmt, style, a.get("subject"), *(a.get("elements") or []), a.get("mood")) if p)
            parts.append(f"## {c['id']}.png\n\n{c['name']} · {c['rarity']}\n\n```\n{prompt}\n```\n\n")
            total += 1

    with io.open(OUT, "w", encoding="utf-8", newline="\n") as f:
        f.write("".join(parts))
    print(f"{OUT.relative_to(ROOT)}: {total} 条")


if __name__ == "__main__":
    main()
