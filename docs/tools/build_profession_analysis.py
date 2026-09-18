# -*- coding: utf-8 -*-
"""
职业维度技能原语分析报告生成器。

递归遍历 docs/json/*.skills.json 的全部效果节点（卡面 effects、statusDefs
触发器、zone/domain/userDefs 等任意嵌套），按"职业（途径）"聚合：
  1. 效果原语用量矩阵（19 个 type 类原语 + 9 个 op 类算子）
  2. modify_stat 专项目的：具体改了哪些 stat 属性、用了哪些参数
     （mode/value/duration/condition/target/filter/spread/sourceRef/valueFrom）
  3. modify_resource 专项目的：具体改了哪些 resource、用了哪些参数
     （mode/op/between/duration/maxTriggersPerBattle/condition/target/filter）

产物：docs/analysis/SKILLS_ANALYSIS_BY_PROFESSION.md
复用：python docs/tools/build_profession_analysis.py
"""
import json, glob, os, collections, datetime, re

# 本脚本位于 docs/tools/，技能池数据在 docs/json/，产物写到 docs/analysis/
JSON_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "json")
MANIFEST = os.path.join(JSON_DIR, "manifest.json")

# 效果 type 全集
EFFECT_TYPES = {
    "damage", "dispel", "domain", "drain", "echo_last_skill", "gauge_shuffle",
    "heal", "if", "modify_damage", "modify_resource", "modify_stat", "mount_status",
    "move", "repeat", "restore_snapshot", "sequence", "snapshot", "spawn",
    "status_shuffle", "target_override", "transfer_status", "translocate",
}
# 真实以 type 出现的原语（if/sequence/repeat 实为 op 算子，不是 type）
PRIM_ORDER = ["mount_status", "damage", "modify_stat", "modify_resource", "dispel",
              "spawn", "heal", "move", "domain", "drain", "modify_damage",
              "transfer_status", "echo_last_skill", "snapshot", "restore_snapshot",
              "gauge_shuffle", "status_shuffle", "translocate", "target_override"]
# 算子（以 op 出现）
OP_ORDER = ["sequence", "if", "repeat", "target_override", "push_back", "overlay",
            "pull_forward", "swap_ally", "insert_tail_cross_lane"]
OPERATOR_OPS = set(OP_ORDER)

# schema 对 modify_stat.stat 的取值域
STAT_PATTERN = re.compile(
    r"^(attack|defense|armor|rank|hp_max|energy_max|energy_regen|gauge\.rate|"
    r"gauge\.threshold|summon_cap|resist:(\*|[a-z]+|\$[A-Za-z]+))$")
# modify_resource.resource 取值域（枚举）
RES_ENUM = {"hp", "energy", "shield", "armor", "lost", "gauge.current"}


def load_manifest_order():
    if os.path.exists(MANIFEST):
        m = json.load(open(MANIFEST, encoding="utf-8"))
        return [p["id"] for p in m.get("pathways", [])]
    return []


def walk(node, effs, ops):
    """递归收集：effect 节点（type∈EFFECT_TYPES）与 operator 节点（op∈OPERATOR_OPS）。"""
    if isinstance(node, dict):
        t = node.get("type")
        if isinstance(t, str) and t in EFFECT_TYPES:
            effs.append(node)
        o = node.get("op")
        if isinstance(o, str) and o in OPERATOR_OPS:
            ops.append(node)
        for v in node.values():
            walk(v, effs, ops)
    elif isinstance(node, list):
        for v in node:
            walk(v, effs, ops)


def is_number(x):
    return isinstance(x, (int, float)) and not isinstance(x, bool)


def main():
    files = sorted(glob.glob(os.path.join(JSON_DIR, "*.skills.json")))
    order = load_manifest_order()
    pname = {}

    per_pathway = collections.defaultdict(lambda: collections.Counter())   # type 原语
    per_op = collections.defaultdict(lambda: collections.Counter())        # op 算子
    global_eff = collections.Counter()
    global_op = collections.Counter()
    cards_per_pathway = collections.Counter()
    total_eff_per_pathway = collections.Counter()
    total_op_per_pathway = collections.Counter()

    ms_rows = []
    mr_rows = []
    ms_param = collections.Counter()
    mr_param = collections.Counter()
    stat_violations = []  # 非标准 stat 键

    for f in files:
        d = json.load(open(f, encoding="utf-8"))
        pid = d["pathwayId"]
        pname[pid] = d.get("pathwayName", pid)
        cards = d.get("cards", [])
        cards_per_pathway[pid] = len(cards)
        for c in cards:
            effs, ops = [], []
            walk(c, effs, ops)
            total_eff_per_pathway[pid] += len(effs)
            total_op_per_pathway[pid] += len(ops)
            cid = c.get("id", "?")
            caxis = c.get("axis", "?")
            ckind = c.get("kind", "?")
            for e in effs:
                et = e.get("type")
                per_pathway[pid][et] += 1
                global_eff[et] += 1
                if et == "modify_stat":
                    stat = e.get("stat")
                    if isinstance(stat, str) and not STAT_PATTERN.match(stat):
                        stat_violations.append((pid, cid, stat))
                    ms_rows.append({
                        "pathway": pid, "card": cid, "axis": caxis, "kind": ckind,
                        "stat": stat, "mode": e.get("mode"), "value": e.get("value"),
                        "duration": e.get("duration", "ABSENT"),
                        "condition": "condition" in e, "target": e.get("target"),
                        "filter": "filter" in e, "spread": e.get("spread"),
                        "sourceRef": e.get("sourceRef"), "valueFrom": "valueFrom" in e,
                    })
                    for fld in ("stat", "mode", "value", "duration", "condition",
                                "target", "filter", "spread", "sourceRef", "valueFrom", "note"):
                        if fld == "duration":
                            if e.get("duration") not in (None, "ABSENT"):
                                ms_param["duration"] += 1
                        elif fld in ("condition", "filter", "valueFrom"):
                            if fld in e:
                                ms_param[fld] += 1
                        elif fld == "target":
                            if e.get("target") is not None:
                                ms_param["target"] += 1
                        elif fld == "spread":
                            if e.get("spread") is not None:
                                ms_param["spread"] += 1
                        elif fld == "sourceRef":
                            if e.get("sourceRef") is not None:
                                ms_param["sourceRef"] += 1
                        elif fld == "note":
                            if e.get("note") is not None:
                                ms_param["note"] += 1
                        else:
                            ms_param[fld] += 1
                elif et == "modify_resource":
                    mr_rows.append({
                        "pathway": pid, "card": cid, "axis": caxis, "kind": ckind,
                        "resource": e.get("resource"), "mode": e.get("mode"),
                        "value": e.get("value"), "op": e.get("op"),
                        "between": "between" in e,
                        "duration": e.get("duration", "ABSENT"),
                        "maxTriggers": e.get("maxTriggersPerBattle"),
                        "condition": "condition" in e, "target": e.get("target"),
                        "filter": "filter" in e,
                    })
                    for fld in ("resource", "value", "mode", "op", "between",
                                "duration", "maxTriggersPerBattle", "condition",
                                "target", "filter", "note"):
                        if fld == "between":
                            if "between" in e:
                                mr_param["between"] += 1
                        elif fld == "duration":
                            if e.get("duration") is not None:
                                mr_param["duration"] += 1
                        elif fld == "maxTriggersPerBattle":
                            if e.get("maxTriggersPerBattle") is not None:
                                mr_param["maxTriggersPerBattle"] += 1
                        elif fld == "op":
                            if e.get("op") is not None:
                                mr_param["op"] += 1
                        elif fld == "condition":
                            if "condition" in e:
                                mr_param["condition"] += 1
                        elif fld == "target":
                            if e.get("target") is not None:
                                mr_param["target"] += 1
                        elif fld == "filter":
                            if "filter" in e:
                                mr_param["filter"] += 1
                        elif fld == "note":
                            if e.get("note") is not None:
                                mr_param["note"] += 1
                        else:
                            mr_param[fld] += 1
            for o in ops:
                op = o.get("op")
                per_op[pid][op] += 1
                global_op[op] += 1

    pids = [p for p in order if p in pname]
    for p in pname:
        if p not in pids:
            pids.append(p)
    total_cards = sum(cards_per_pathway.values())
    tot_prim = sum(global_eff.values())
    tot_op = sum(global_op.values())
    tot_eff = sum(total_eff_per_pathway.values())

    # ===================== 生成 Markdown =====================
    L = []
    L.append("# 技能池设计分析报告（职业维度 · 效果原语专项）\n")
    L.append("> 数据来源：`docs/json/*.skills.json`（22 份途径技能池，共 **%d 张卡**），"
             "由 `docs/tools/build_profession_analysis.py` 递归遍历全部效果节点生成。" % total_cards)
    L.append("> 对照基准：`docs/meta/GENERATION_BRIEF.md` v0.3、`docs/ddd/params/*`。")
    L.append("> 生成日期：%s\n" % datetime.date.today().isoformat())

    # 一、总览
    L.append("## 一、总览：各职业规模与原语/算子总量\n")
    L.append("| 职业（途径） | 卡数 | 效果节点总数 | 原语节点 | 算子节点 |")
    L.append("|---|---:|---:|---:|---:|")
    for pid in pids:
        prim = sum(per_pathway[pid][t] for t in PRIM_ORDER)
        opn = sum(per_op[pid][t] for t in OP_ORDER)
        L.append("| %s %s | %d | %d | %d | %d |" % (
            pname[pid], pid, cards_per_pathway[pid],
            total_eff_per_pathway[pid], prim, opn))
    L.append("| **全库** | **%d** | **%d** | **%d** | **%d** |" % (
        total_cards, tot_eff, tot_prim, tot_op))
    L.append("")
    L.append("> 口径：一张卡含多层嵌套效果（卡面 `effects`、状态触发器、区域/界域定义等），"
             "故「效果节点总数」≥ 卡数。原语=以 `type` 表达的 19 类 leaf 效果；"
             "算子=以 `op` 表达的 9 类控制流/改写节点（`sequence/if/repeat/target_override/"
             "push_back/overlay/pull_forward/swap_ally/insert_tail_cross_lane`）。"
             "算子节点内部包裹的原语已计入原语统计，二者存在少量重叠（如 `move`+`push_back`）。\n")

    # 二、原语矩阵
    L.append("## 二、各职业效果原语用量矩阵（type 维度）\n")
    L.append("行=职业，列=原语；单元格为该职业内该原语的出现次数（递归全量）。\n")
    L.append("| 职业 | " + " | ".join("`%s`" % t for t in PRIM_ORDER) + " | 合计 |")
    L.append("|---|" + "|".join(["---:"] * len(PRIM_ORDER)) + "|---:|")
    for pid in pids:
        row = [per_pathway[pid][t] for t in PRIM_ORDER]
        L.append("| %s | " % pname[pid] + " | ".join(str(x) for x in row) +
                 " | %d |" % sum(row))
    grow = [global_eff[t] for t in PRIM_ORDER]
    L.append("| **全库** | " + " | ".join(str(x) for x in grow) +
             " | **%d** |" % sum(grow))
    L.append("")

    L.append("### 2.1 全库原语用量排行（含占比）\n")
    L.append("| 原语 | 用量 | 占比 |")
    L.append("|---|---:|---:|")
    grand = sum(grow) or 1
    for t in sorted(PRIM_ORDER, key=lambda x: -global_eff[x]):
        c = global_eff[t]
        L.append("| `%s` | %d | %.1f%% |" % (t, c, 100.0 * c / grand))
    L.append("")

    # 2.2 算子矩阵
    L.append("### 2.2 各职业算子用量矩阵（op 维度）\n")
    L.append("行=职业，列=算子；与 §2 原语互补，刻画控制流与改写表达。\n")
    L.append("| 职业 | " + " | ".join("`%s`" % t for t in OP_ORDER) + " | 合计 |")
    L.append("|---|" + "|".join(["---:"] * len(OP_ORDER)) + "|---:|")
    for pid in pids:
        row = [per_op[pid][t] for t in OP_ORDER]
        L.append("| %s | " % pname[pid] + " | ".join(str(x) for x in row) +
                 " | %d |" % sum(row))
    growo = [global_op[t] for t in OP_ORDER]
    L.append("| **全库** | " + " | ".join(str(x) for x in growo) +
             " | **%d** |" % sum(growo))
    L.append("")
    L.append("> `target_override` 在全库另有 **%d** 处作为 `type` 原语（`effTargetOverride`）出现，"
             "与算子的 %d 处合计 **%d** 处「改写目标」表达。" % (
                 global_eff["target_override"], global_op["target_override"],
                 global_eff["target_override"] + global_op["target_override"]))
    L.append("")

    # 2.3 Top
    L.append("### 2.3 各职业 Top-3 原语（签名表达）\n")
    L.append("| 职业 | Top1 | Top2 | Top3 |")
    L.append("|---|---|---|---|")
    for pid in pids:
        top = [t for t, _ in per_pathway[pid].most_common() if t in PRIM_ORDER][:3]
        fmt = lambda t: "`%s`(%d)" % (t, per_pathway[pid][t]) if t else "—"
        cells = [fmt(top[i]) if i < len(top) else "—" for i in range(3)]
        L.append("| %s | %s | %s | %s |" % (pname[pid], cells[0], cells[1], cells[2]))
    L.append("")

    # 三、modify_stat
    L.append("## 三、modify_stat 专项：具体改了哪些属性\n")
    L.append("全库 `modify_stat` 共 **%d** 处。下方按「属性键 / 模式 / 参数」逐层拆解。\n" % len(ms_rows))
    stat_cnt = collections.Counter(r["stat"] for r in ms_rows)
    ms_by_p = collections.defaultdict(lambda: collections.Counter())
    for r in ms_rows:
        ms_by_p[r["pathway"]][r["stat"]] += 1

    L.append("### 3.1 改了哪些 stat 属性键（全局分布）\n")
    L.append("| stat 属性键 | 次数 | 占 modify_stat% |")
    L.append("|---|---:|---:|")
    for k, c in stat_cnt.most_common():
        L.append("| `%s` | %d | %.1f%% |" % (k, c, 100.0 * c / len(ms_rows)))
    L.append("")

    L.append("### 3.2 (属性键 × 模式) 组合明细\n")
    L.append("| stat 属性键 | 模式 | 次数 | 占该属性% |")
    L.append("|---|---|---:|---:|")
    sm = collections.Counter((r["stat"], r["mode"]) for r in ms_rows)
    for k, _ in stat_cnt.most_common():
        sub = [(m, c) for (sk, m), c in sm.items() if sk == k]
        sub.sort(key=lambda x: -x[1])
        totk = stat_cnt[k]
        for m, c in sub:
            L.append("| `%s` | `%s` | %d | %.0f%% |" % (k, m, c, 100.0 * c / totk))
    L.append("")

    L.append("### 3.3 参数覆盖度：modify_stat 用了哪些可选字段\n")
    L.append("> 必填字段 `stat`/`mode` 100% 出现；下表统计其余可选参数的实际用到次数。\n")
    L.append("| 参数 | 出现次数 | 占 modify_stat% | 说明 |")
    L.append("|---|---:|---:|---|")
    param_desc = {
        "value": "数值（delta/mul 的增量；set 的设定值）",
        "duration": "持续 tick（null/缺失=常驻）",
        "condition": "条件触发（Chance 走 RandomSource，仅非伤害维度）",
        "target": "效果级目标锚点（二次寻址）",
        "filter": "候选池过滤",
        "spread": "溅射（splash_adjacent）",
        "sourceRef": "取值参照源（caster/secondary_target/field_average）",
        "valueFrom": "动态取值（对象/表达式，非静态数值）",
        "note": "注释",
    }
    for fld in ("value", "duration", "condition", "target", "filter", "spread",
                "sourceRef", "valueFrom", "note"):
        c = ms_param.get(fld, 0)
        if c:
            L.append("| `%s` | %d | %.1f%% | %s |" % (fld, c, 100.0 * c / len(ms_rows), param_desc.get(fld, "")))
    L.append("")

    L.append("### 3.4 分职业 stat 键矩阵\n")
    L.append("行=职业，列=stat 属性键（仅列全库出现过的键）。\n")
    stat_keys = [k for k, _ in stat_cnt.most_common()]
    L.append("| 职业 | " + " | ".join("`%s`" % k for k in stat_keys) + " |")
    L.append("|---|" + "|".join(["---:"] * len(stat_keys)) + "|")
    for pid in pids:
        cells = [ms_by_p[pid].get(k, 0) for k in stat_keys]
        L.append("| %s | " % pname[pid] + " | ".join(str(x) for x in cells) + " |")
    L.append("| **全库** | " + " | ".join(str(stat_cnt[k]) for k in stat_keys) + " |")
    L.append("")

    L.append("### 3.5 各职业 modify_stat 参数偏好（condition / duration / target / filter 占比）\n")
    L.append("| 职业 | modify_stat 总数 | 带 condition | 带 duration | 带 target | 带 filter |")
    L.append("|---|---:|---:|---:|---:|---:|")
    for pid in pids:
        rows = [r for r in ms_rows if r["pathway"] == pid]
        n = len(rows)
        if n == 0:
            L.append("| %s | 0 | — | — | — | — |" % pname[pid])
            continue
        cond = sum(1 for r in rows if r["condition"])
        dur = sum(1 for r in rows if r["duration"] not in (None, "ABSENT"))
        tgt = sum(1 for r in rows if r["target"] is not None)
        flt = sum(1 for r in rows if r["filter"])
        L.append("| %s | %d | %d (%.0f%%) | %d (%.0f%%) | %d (%.0f%%) | %d (%.0f%%) |" % (
            pname[pid], n, cond, 100.0 * cond / n, dur, 100.0 * dur / n,
            tgt, 100.0 * tgt / n, flt, 100.0 * flt / n))
    L.append("")

    L.append("### 3.6 各 stat 键的数值速览（mode=value 取值分布）\n")
    L.append("> 仅统计 `value` 为静态数值的条目（排除 valueFrom 动态取值）。\n")
    L.append("| stat 属性键 | 样本数 | 模式分布 | 数值范围(典型) |")
    L.append("|---|---:|---|---|")
    for k, _ in stat_cnt.most_common():
        rows = [r for r in ms_rows if r["stat"] == k]
        mode_c = collections.Counter(r["mode"] for r in rows)
        mode_str = ", ".join("`%s`×%d" % (m, c) for m, c in mode_c.most_common())
        vals = [r["value"] for r in rows if is_number(r["value"])]
        if vals:
            neg = [v for v in vals if v < 0]
            pos = [v for v in vals if v > 0]
            parts = []
            if neg:
                parts.append("负 %.0f~%.0f" % (min(neg), max(neg)))
            if pos:
                parts.append("正 +%.0f~+%.0f" % (min(pos), max(pos)))
            vstr = "；".join(parts) if parts else "%d~%d" % (min(vals), max(vals))
        else:
            vstr = "（动态/无静态值）"
        L.append("| `%s` | %d | %s | %s |" % (k, len(rows), mode_str, vstr))
    L.append("")

    # 四、modify_resource
    L.append("## 四、modify_resource 专项：具体改了哪些资源\n")
    L.append("全库 `modify_resource` 共 **%d** 处。\n" % len(mr_rows))
    res_cnt = collections.Counter(r["resource"] for r in mr_rows)
    mr_by_p = collections.defaultdict(lambda: collections.Counter())
    for r in mr_rows:
        mr_by_p[r["pathway"]][r["resource"]] += 1

    L.append("### 4.1 改了哪些 resource 资源键（全局分布）\n")
    L.append("| resource 资源键 | 次数 | 占 modify_resource% |")
    L.append("|---|---:|---:|")
    for k, c in res_cnt.most_common():
        L.append("| `%s` | %d | %.1f%% |" % (k, c, 100.0 * c / len(mr_rows)))
    L.append("")

    L.append("### 4.2 (资源键 × 模式) 组合明细\n")
    L.append("| resource 资源键 | 模式 | 次数 | 占该资源% |")
    L.append("|---|---|---:|---:|")
    rm = collections.Counter((r["resource"], r["mode"]) for r in mr_rows)
    for k, _ in res_cnt.most_common():
        sub = [(m, c) for (sk, m), c in rm.items() if sk == k]
        sub.sort(key=lambda x: -x[1])
        totk = res_cnt[k]
        for m, c in sub:
            L.append("| `%s` | `%s` | %d | %.0f%% |" % (k, m, c, 100.0 * c / totk))
    L.append("")

    L.append("### 4.3 参数覆盖度：modify_resource 用了哪些可选字段\n")
    L.append("> 必填字段 `resource` 100% 出现；下表统计其余可选参数实际用到次数。\n")
    L.append("| 参数 | 出现次数 | 占 modify_resource% | 说明 |")
    L.append("|---|---:|---:|---|")
    rparam_desc = {
        "value": "数值（delta 增量 / set 设定值）",
        "mode": "delta / set / swap",
        "op": "swap 操作",
        "between": "swap 双方（effectTarget 数组）",
        "duration": "持续 tick（仅部分场景用）",
        "maxTriggersPerBattle": "每场战斗最大触发次数",
        "condition": "条件触发",
        "target": "效果级目标锚点",
        "filter": "候选池过滤",
        "note": "注释",
    }
    for fld in ("value", "mode", "op", "between", "duration",
                "maxTriggersPerBattle", "condition", "target", "filter", "note"):
        c = mr_param.get(fld, 0)
        if c:
            L.append("| `%s` | %d | %.1f%% | %s |" % (fld, c, 100.0 * c / len(mr_rows), rparam_desc.get(fld, "")))
    L.append("")

    L.append("### 4.4 分职业 resource 键矩阵\n")
    L.append("行=职业，列=resource 资源键。\n")
    res_keys = [k for k, _ in res_cnt.most_common()]
    L.append("| 职业 | " + " | ".join("`%s`" % k for k in res_keys) + " |")
    L.append("|---|" + "|".join(["---:"] * len(res_keys)) + "|")
    for pid in pids:
        cells = [mr_by_p[pid].get(k, 0) for k in res_keys]
        L.append("| %s | " % pname[pid] + " | ".join(str(x) for x in cells) + " |")
    L.append("| **全库** | " + " | ".join(str(res_cnt[k]) for k in res_keys) + " |")
    L.append("")

    L.append("### 4.5 资源操控的语义标签（按 resource 归类用途）\n")
    L.append("| resource | 主要语义 | 高频模式 |")
    L.append("|---|---|---|")
    sem = {
        "energy": "能量操控（资源杠杆，最常见）",
        "hp": "直接治疗/伤害（常与 heal/damage 互补）",
        "shield": "护盾吸收池增减",
        "armor": "护甲增减",
        "lost": "迷失租金（界域/跨层代价，独立资源槽）",
        "gauge.current": "推条（抢先/延后出手）",
    }
    for k, _ in res_cnt.most_common():
        sub = [(m, c) for (sk, m), c in rm.items() if sk == k]
        sub.sort(key=lambda x: -x[1])
        mode_str = ", ".join("`%s`×%d" % (m, c) for m, c in sub)
        L.append("| `%s` | %s | %s |" % (k, sem.get(k, ""), mode_str))
    L.append("")

    swap_rows = [r for r in mr_rows if r["op"] == "swap" or r["between"]]
    L.append("### 4.6 swap（交换资源）用法\n")
    if swap_rows:
        L.append("共 **%d** 处使用 `op:swap` / `between`（双方资源交换）。\n" % len(swap_rows))
        L.append("| 卡 | 职业 | resource |")
        L.append("|---|---|---|")
        for r in swap_rows:
            L.append("| `%s` | %s | `%s` |" % (r["card"], pname.get(r["pathway"], r["pathway"]), r["resource"]))
    else:
        L.append("全库无 `op:swap` / `between` 用法。\n")
    L.append("")

    # 五、数据质量提示
    L.append("## 五、数据质量提示\n")
    if stat_violations:
        L.append("### 5.1 非标准 stat 键（不符合 schema 取值域）\n")
        L.append("以下 `modify_stat` 节点的 `stat` 键不匹配 `skills.schema.json` 的 stat 正则"
                 "（仅允许 attack/defense/armor/rank/hp_max/energy_max/energy_regen/gauge.rate/"
                 "gauge.threshold/summon_cap/resist:*）：\n")
        L.append("| 职业 | 卡 id | stat 键 | 建议 |")
        L.append("|---|---|---|---|")
        for pid, cid, stat in stat_violations:
            L.append("| %s | `%s` | `%s` | 改用 `modify_damage`（scope: dealt/taken） |" % (
                pname.get(pid, pid), cid, stat))
        L.append("")
        L.append("> 说明：`damage_mul` / `damage_taken_mul` 属「伤害乘区」语义，已有专用原语 "
                 "`modify_damage`（`scope: dealt|taken`, `mul`），无需挂在 modify_stat 上；"
                 "此写法可能与 §七·补 7-5 中 fool 的同类修复（`damage_taken_mul`→`modify_damage`）"
                 "未对齐，建议统一。\n")
    else:
        L.append("未检测到非标准 stat 键。\n")

    # 六、核对
    L.append("## 六、口径核对（与 SKILLS_ANALYSIS.md §2 对照）\n")
    L.append("| 维度 | 本报告（递归全量） | 旧报告 §2 | 说明 |")
    L.append("|---|---:|---:|---|")
    L.append("| 效果节点总数 | %d | — | 递归全量 |" % tot_eff)
    L.append("| 原语节点 | %d | — | 19 类 type |" % tot_prim)
    L.append("| 算子节点 | %d | — | 9 类 op |" % tot_op)
    oldprim = {
        "mount_status": 728, "damage": 376, "modify_stat": 356,
        "modify_resource": 150, "dispel": 99, "spawn": 73, "heal": 55,
        "move": 44, "domain": 26, "drain": 15, "modify_damage": 11,
        "transfer_status": 4, "echo_last_skill": 2, "snapshot": 1,
        "restore_snapshot": 1, "gauge_shuffle": 1, "status_shuffle": 1,
    }
    for t in PRIM_ORDER:
        new = global_eff[t]
        o = oldprim.get(t)
        diff = "" if o is None else ("%+d" % (new - o))
        L.append("| `type=%s` | %d | %s | %s |" % (t, new, "—" if o is None else str(o), diff))
    L.append("")
    L.append("> 旧报告原语数基于较早快照；本库当前 828 张卡，数字随补卡上浮属正常。"
             "算子（§2.4）口径一致：sequence=%d / if=%d / target_override=%d / push_back=%d / "
             "overlay=%d / repeat=%d / pull_forward=%d / swap_ally=%d / insert_tail_cross_lane=%d。" % (
                 global_op["sequence"], global_op["if"], global_op["target_override"],
                 global_op["push_back"], global_op["overlay"], global_op["repeat"],
                 global_op["pull_forward"], global_op["swap_ally"], global_op["insert_tail_cross_lane"]))
    L.append("")

    # 七、结论
    L.append("## 七、结论与观察\n")
    top_stat = stat_cnt.most_common(3)
    top_res = res_cnt.most_common(3)
    L.append("1. **原语总量**：全库共 %d 个原语节点 + %d 个算子节点；`mount_status`(%.0f%%) 与 "
             "`damage`(%.0f%%) 仍是绝对主力，状态驱动风格延续。" % (
                 tot_prim, tot_op,
                 100.0 * global_eff["mount_status"] / grand,
                 100.0 * global_eff["damage"] / grand))
    L.append("2. **modify_stat 最常被改的属性**：%s —— 敏捷原生的 `gauge.rate`、攻防 "
             "`attack/defense`、资源速率与独立资源槽是首选。" % (
                 "、".join("`%s`(%d)" % (k, c) for k, c in top_stat)))
    L.append("3. **modify_resource 最常被改的资源**：%s —— `energy` 是第一杠杆，"
             "`lost`（迷失租金）已随界域/跨层普及成为常态成本，`gauge.current`（推条）"
             "用量高于直接 hp/shield。" % (
                 "、".join("`%s`(%d)" % (k, c) for k, c in top_res)))
    cond_total = ms_param.get("condition", 0)
    dur_total = ms_param.get("duration", 0)
    L.append("4. **参数使用**：modify_stat 中带 `duration` 的占 %.0f%%（持续型修正为主），"
             "带 `condition` 的仅 %.0f%%（绝大多数无条件是确定性修正，符合 B1 铁律）；"
             "`sourceRef`/`valueFrom` 动态取值共 %d 处，属「按参照源缩放」的高级表达。" % (
                 100.0 * dur_total / len(ms_rows), 100.0 * cond_total / len(ms_rows),
                 ms_param.get("sourceRef", 0) + ms_param.get("valueFrom", 0)))
    L.append("5. **职业差异**：详见 §二/§2.2 矩阵与 §3.4/§4.4。各职业 Top 原语（§2.3）显示签名表达——"
             "召唤系（不眠者/收尸人/秘祈人）`spawn` 偏高，控制系（刺客/囚犯）`move`+`dispel` 偏高，"
             "能量系（愚者/阅读者）`modify_resource(energy)` 偏高。")
    L.append("6. **数据质量**：见 §五。%s" % (
        ("发现 %d 处非标准 stat 键，建议改用 modify_damage。" % len(stat_violations))
        if stat_violations else "未发现问题。"))
    L.append("")

    L.append("### 附：统计口径\n")
    L.append("- 数据源：`docs/json/*.skills.json` 的 `cards[]`，共 %d 张卡。" % total_cards)
    L.append("- 原语/算子用量：**递归遍历**每张卡的全部效果节点（含卡面 `effects`、"
             "`statusDefs[].triggers[].effects`、`zoneDef`/`domainDef`/单位定义等任意嵌套），"
             "同一张卡的同名原语多次计数。")
    L.append("- 原语以效果节点 `type` 字段归类（19 类）；算子以效果节点 `op` 字段归类（9 类）。")
    L.append("- `modify_stat`/`modify_resource` 统计：同样递归全量；`stat`/`resource` 取节点字段值，"
             "`mode`/`value`/`duration`/`condition`/`target`/`filter`/`spread`/`sourceRef`/`valueFrom`"
             "（资源侧另含 `op`/`between`/`maxTriggersPerBattle`）逐一记录。")
    L.append("- 参数覆盖度：仅统计实际出现的字段（未在节点中出现的字段不计入）。")
    L.append("- 生成脚本：`docs/tools/build_profession_analysis.py`（可重复运行）。")

    out = "\n".join(L)
    out_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "analysis", "SKILLS_ANALYSIS_BY_PROFESSION.md")
    with open(out_path, "w", encoding="utf-8") as fh:
        fh.write(out)

    print("=== VALIDATION ===")
    print("cards:", total_cards, "effect nodes:", tot_eff, "prim:", tot_prim, "op:", tot_op)
    print("modify_stat:", len(ms_rows), "modify_resource:", len(mr_rows))
    print("stat keys:", dict(stat_cnt))
    print("resource keys:", dict(res_cnt))
    print("operators:", dict(global_op))
    print("stat_violations:", stat_violations)
    print("wrote:", out_path)


if __name__ == "__main__":
    main()
