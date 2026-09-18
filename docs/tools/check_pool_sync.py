# -*- coding: utf-8 -*-
"""技能稿 md ↔ JSON 骨架对账。

md 是技能内容的源数据（WORKFLOW 协作纪律 2），JSON 由其转换生成。本脚本核对骨架字段：
卡数、卡名、kind（主动/被动）、序列位阶、位阶名、稀有度（由序列派生）、构筑轴。
机制/数值细节以 md 文本为准，不做语义比对。

用法: python docs/tools/check_pool_sync.py   （只读；存在不一致时 exit 1）
"""
import io, json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))          # docs/tools/
DOCS = os.path.dirname(HERE)                                # docs/
JSON_DIR = os.path.join(DOCS, "json")

HEAD = re.compile(r"^####\s*【(主动|被动)】\s*(.+?)\s*$")
SEQ = re.compile(r"^-\s*\*\*序列\*\*\s*(\d+)\s+([^\s·]+)")
KIND = {"主动": "active", "被动": "passive"}

def parse_md(path):
    """从技能稿 md 提取卡面骨架：#### 【主动】名称 符号 轴名 · 标记 + `- **序列** 9 位阶名` 行。

    卡名 = 标题首个空白分隔 token（名称内部可能含无空格「·」，如 午夜诗篇·恍惚）；
    轴名候选 = 名称后的中日韩文字 token（含双轴「净化 / 放牧」与角色标注），
    比对时以本途径 JSON axes 的名字集合过滤（角色标注如「输出地基」自然排除）。
    """
    cards, cur = [], None
    for ln in io.open(path, encoding="utf-8"):
        m = HEAD.match(ln.rstrip("\n"))
        if m:
            if cur: cards.append(cur)
            toks = m.group(2).split()
            axis_names = [t for t in toks[1:] if re.match(r"[一-鿿]", t) and not t.startswith("★")]
            cur = {"kind": KIND[m.group(1)], "name": toks[0],
                   "axisNames": axis_names,
                   "sequence": None, "sequenceName": None}
            continue
        if cur and cur["sequence"] is None:
            s = SEQ.match(ln.strip())
            if s:
                cur["sequence"], cur["sequenceName"] = int(s.group(1)), s.group(2)
    if cur: cards.append(cur)
    return cards

def main():
    m = json.load(io.open(os.path.join(JSON_DIR, "manifest.json"), encoding="utf-8"))
    seq2rarity = {seq: r for r, seqs in m["rarityMap"].items() for seq in seqs}

    errors, total = [], 0
    for p in m["pathways"]:
        pid = p["id"]
        md_path = os.path.normpath(os.path.join(JSON_DIR, p["sourceFile"]))
        d = json.load(io.open(os.path.join(JSON_DIR, p["file"]), encoding="utf-8"))
        md_cards = parse_md(md_path)
        js_cards = d["cards"]
        total += len(js_cards)

        md_by_name = {c["name"]: c for c in md_cards}
        js_by_name = {c["name"]: c for c in js_cards}
        if len(md_by_name) != len(md_cards):
            dupes = sorted({c["name"] for c in md_cards if [x["name"] for x in md_cards].count(c["name"]) > 1})
            errors.append("%s: md 内卡名重复 %s" % (pid, dupes))
        if len(js_by_name) != len(js_cards):
            errors.append("%s: json 内卡名重复" % pid)

        for name in sorted(set(md_by_name) - set(js_by_name)):
            errors.append("%s: md 有 json 无「%s」" % (pid, name))
        for name in sorted(set(js_by_name) - set(md_by_name)):
            errors.append("%s: json 有 md 无「%s」" % (pid, name))

        axes = d.get("axes") or {}
        for name in sorted(set(md_by_name) & set(js_by_name)):
            a, b = md_by_name[name], js_by_name[name]
            for fld, av, bv in (
                ("kind", a["kind"], b.get("kind")),
                ("sequence", a["sequence"], b.get("sequence")),
                ("sequenceName", a["sequenceName"], b.get("sequenceName")),
                ("rarity", seq2rarity.get(a["sequence"]), b.get("rarity")),
            ):
                if av is not None and av != bv:
                    errors.append("%s「%s」%s: md=%s json=%s" % (pid, name, fld, av, bv))
            ax = axes.get(b.get("axis"), {})
            known = {a2.get("name") for a2 in axes.values()}
            md_axes = [t for t in a["axisNames"] if t in known]
            if md_axes and ax.get("name") and ax["name"] not in md_axes:
                errors.append("%s「%s」axis: md=%s json=%s(%s)" % (pid, name, "/".join(md_axes), ax["name"], b.get("axis")))
            if a["sequence"] is None:
                errors.append("%s「%s」md 缺「**序列**」行" % (pid, name))

    print("-" * 60)
    print("pathways: %d | json cards: %d | 骨架不一致: %d" % (len(m["pathways"]), total, len(errors)))
    for e in errors: print("  E:", e)
    return 1 if errors else 0

if __name__ == "__main__":
    sys.exit(main())
