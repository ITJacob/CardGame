# -*- coding: utf-8 -*-
"""枚举一致性对账：ddd 参数篇 / SCHEMA.md（文本侧）↔ schema $defs / validate.py（机器侧）。

机器侧单一正源 = docs/json/schema/skills.schema.json（validate.py 运行时加载，不再自抄）。
本脚本盯的是文本侧与机器侧之间的漂移（atk_asc 类事故：ddd 已登记、schema/校验器漏同步）。

用法: python docs/tools/check_enum_sync.py   （只读；存在未登记漂移时 exit 1）
"""
import io, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))          # docs/tools/
DOCS = os.path.dirname(HERE)                                # docs/
sys.path.insert(0, HERE)
import validate  # noqa: E402  复用其 schema 加载结果与 EVENTS

BACKTICKS = re.compile(r"`([^`]+)`")

# 有意分歧登记：文本侧与机器侧允许存在的差集，须注明理由
KNOWN = {
    ("triggerEvent", "on_status_gain"): "schema 结构层放行；语义层强制 frameworkFlag 登记（SCHEMA.md §8）",
    ("sortKey", "status:<id>:asc"): "ddd 参数化状态排序族（共享内核参数 §sort），字面量枚举不含",
    ("sortKey", "status:<id>:desc"): "ddd 参数化状态排序族（共享内核参数 §sort），字面量枚举不含",
}

def read(rel):
    return io.open(os.path.join(DOCS, rel), encoding="utf-8").read()

def section(txt, anchor, stop_re=r"\n###?\s"):
    """取 anchor 所在行之后到下一个同级标题之间的文本。"""
    i = txt.index(anchor)
    m = re.search(stop_re, txt[i + len(anchor):])
    return txt[i:i + len(anchor) + (m.start() if m else len(txt))]

def backtick_row(txt, anchor):
    """anchor 之后第一个含反引号标记的文本行/表格行，取全部反引号 token。"""
    i = txt.index(anchor)
    for ln in txt[i:].splitlines()[1:]:
        toks = BACKTICKS.findall(ln)
        if toks: return set(toks)
        if ln.strip() and not ln.startswith(("|", ">", "**")): break
    return set()

def ddd_triggers():
    sec = section(read("ddd/params/执行参数.md"), "### 2.1 触发点")
    out = set()
    for ln in sec.splitlines():
        m = re.match(r"\|\s*`([^`]+)`\s*\|", ln)
        if m: out.add(m.group(1))
    return out

def ddd_sorts():
    for ln in read("ddd/params/共享内核参数.md").splitlines():
        if ln.startswith("| sort |"):
            cell = ln.split("|")[2]
            return {t.strip().strip("`") for t in cell.split("/") if t.strip()}
    raise AssertionError("共享内核参数.md 缺 sort 行")

def schema_md_enums():
    txt = read("meta/SCHEMA.md")
    sorts = backtick_row(txt, "**sortKey 封闭枚举**")
    targets = backtick_row(txt, "**effect 级 target 锚点**")
    elements = {t for t in backtick_row(txt, "### 5.4 元素") if not t.startswith("$")}
    cats = backtick_row(txt, "### 5.2 原语")  # 占位，下面单独取 category 行
    # category 在 §6 表格行：| `category` | enum[] | `buff` `debuff` ... |
    cats = set()
    for ln in section(txt, "## 6. 状态", r"\n##\s").splitlines():
        if ln.startswith("| `category`"):
            cats = set(BACKTICKS.findall(ln)) - {"category"}
            break
    # §5.2 原语表第一列（含 `snapshot` / `restore_snapshot` 合并行，取整格全部 token）
    prims = set()
    for ln in section(txt, "### 5.2 原语").splitlines():
        m = re.match(r"\|\s*(`[^|]+`)\s*\|", ln)
        if m: prims.update(BACKTICKS.findall(m.group(1)))
    return {"sortKey": sorts, "effectTarget": targets, "element": elements,
            "statusCategory": cats, "primitive": prims}

def compare(name, text_side, machine_side, text_label, machine_label, errors):
    only_text = sorted(text_side - machine_side)
    only_machine = sorted(machine_side - text_side)
    unexplained = [v for v in only_text + only_machine if (name, v) not in KNOWN]
    if unexplained:
        errors.append(name)
        print("DRIFT %s:" % name)
        for v in only_text:
            tag = "（已登记分歧）" if (name, v) in KNOWN else ""
            print("  仅 %s: %s %s" % (text_label, v, tag))
        for v in only_machine:
            tag = "（已登记分歧）" if (name, v) in KNOWN else ""
            print("  仅 %s: %s %s" % (machine_label, v, tag))
    else:
        known = [v for v in only_text + only_machine]
        suffix = "（登记分歧 %d 项）" % len(known) if known else ""
        print("OK    %s (%d)%s" % (name, len(machine_side & text_side), suffix))

def main():
    errors = []
    sm = schema_md_enums()

    compare("triggerEvent", ddd_triggers(), validate.EVENTS, "ddd 执行参数 §2.1", "validate.EVENTS", errors)
    compare("triggerEvent", ddd_triggers(), set(validate.DEFS["triggerEvent"]["enum"]), "ddd 执行参数 §2.1", "schema", errors)
    compare("sortKey", ddd_sorts(), validate.SORTS, "ddd 共享内核参数", "schema sortKey", errors)
    compare("sortKey", sm["sortKey"], validate.SORTS, "SCHEMA.md §4", "schema sortKey", errors)
    compare("effectTarget", sm["effectTarget"], validate.EFFECT_TARGETS, "SCHEMA.md §4", "schema effectTarget", errors)
    compare("element", sm["element"], validate.ELEMENTS, "SCHEMA.md §5.4", "schema element", errors)
    compare("statusCategory", sm["statusCategory"], validate.CATS, "SCHEMA.md §6", "schema statusCategory", errors)
    compare("primitive", sm["primitive"], validate.PRIMS, "SCHEMA.md §5.2", "schema effect.oneOf", errors)

    print("-" * 60)
    if errors:
        print("漂移枚举 %d 组: %s" % (len(set(errors)), ", ".join(sorted(set(errors)))))
        print("处置：先在 ddd/params 对应参数篇登记，再改 schema，最后改数据（SCHEMA.md §9）。")
        return 1
    print("全部枚举组一致（有意分歧见 KNOWN 登记）")
    return 0

if __name__ == "__main__":
    sys.exit(main())
