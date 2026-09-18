# -*- coding: utf-8 -*-
"""
职业 × 构筑轴 技能设计风格分析报告生成器。

每个职业（途径）输出一个独立文档： docs/analysis/analysis_by_profession/<pathwayId>.md
文档内含：
  - 职业总览：4 条构筑轴的规模与风格标签一览
  - 每条构筑轴详解：
      * 规模（技能数 / 主动·被动 / 稀有度分布）
      * 效果原语(type)构成 + 算子(op)构成
      * modify_stat 改了哪些属性
      * modify_resource 改了哪些资源
      * 挂载状态类型(category)统计（含可驱散/不可驱散拆分）
      * 设计风格总结（数据驱动指纹：进攻/防御/控制/运营/续航）
      * 代表技能（flagship 卡名 + 描述）

数据源：docs/json/*.skills.json（递归遍历全部效果节点）
复用：python docs/tools/build_axis_analysis.py
"""
import json, glob, os, collections, datetime, re

# 本脚本位于 docs/tools/，技能池数据在 docs/json/，产物写到 docs/analysis/
JSON_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "json")
OUT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "analysis", "analysis_by_profession")

EFFECT_TYPES = {
    "damage", "dispel", "domain", "drain", "echo_last_skill", "gauge_shuffle",
    "heal", "if", "modify_damage", "modify_resource", "modify_stat", "mount_status",
    "move", "repeat", "restore_snapshot", "sequence", "snapshot", "spawn",
    "status_shuffle", "target_override", "transfer_status", "translocate",
}
PRIM_ORDER = ["mount_status", "damage", "modify_stat", "modify_resource", "dispel",
              "spawn", "heal", "move", "domain", "drain", "modify_damage",
              "transfer_status", "echo_last_skill", "snapshot", "restore_snapshot",
              "gauge_shuffle", "status_shuffle", "translocate", "target_override"]
OP_ORDER = ["sequence", "if", "repeat", "target_override", "push_back", "overlay",
            "pull_forward", "swap_ally", "insert_tail_cross_lane"]
OPERATOR_OPS = set(OP_ORDER)

STAT_PATTERN = re.compile(
    r"^(attack|defense|armor|rank|hp_max|energy_max|energy_regen|gauge\.rate|"
    r"gauge\.threshold|summon_cap|resist:(\*|[a-z]+|\$[A-Za-z]+))$")
RES_ENUM = {"hp", "energy", "shield", "armor", "lost", "gauge.current"}

# 状态 category 的"类型"取值域
STATUS_CATS = ["buff", "debuff", "control", "conceal", "retarget", "stance", "aura",
               "seal", "contract", "link", "fear", "reactive"]

# 稀有度中文化
RARITY_CN = {"common": "普通", "uncommon": "精良", "rare": "稀有", "epic": "史诗",
             "legendary": "传说", "": "—"}

# 风格指纹：原语/资源/状态类别 -> 5 个维度
STYLE_DIMS = ["进攻", "防御", "控制", "运营", "续航"]
PRIM_TO_DIM = {
    "damage": "进攻", "drain": "进攻", "modify_damage": "进攻", "translocate": "进攻",
    "move": "控制", "dispel": "控制", "transfer_status": "控制",
    "status_shuffle": "控制", "target_override": "控制",
    "heal": "续航",
}
STAT_TO_DIM = {
    "attack": "进攻", "defense": "防御", "armor": "防御", "hp_max": "防御",
}
RES_TO_DIM = {
    "energy": "运营", "gauge.current": "运营", "lost": "运营",
    "hp": "续航", "shield": "续航", "armor": "续航",
}
CAT_TO_DIM = {
    "control": "控制", "debuff": "控制", "retarget": "控制", "conceal": "控制",
    "seal": "控制", "link": "控制", "fear": "控制",
    "buff": "防御", "stance": "防御", "aura": "运营",
}


def walk(node, effs, ops):
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


def pct(n, d):
    return 0.0 if not d else 100.0 * n / d


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    files = sorted(glob.glob(os.path.join(JSON_DIR, "*.skills.json")))
    for f in files:
        d = json.load(open(f, encoding="utf-8"))
        pid = d["pathwayId"]
        pname = d.get("pathwayName", pid)
        axes_def = d.get("axes", {}) or {}
        cards = d.get("cards", [])

        # 按轴聚合
        axis_data = collections.defaultdict(lambda: {
            "prim": collections.Counter(), "op": collections.Counter(),
            "ms_stat": collections.Counter(), "mr_res": collections.Counter(),
            "status_cat": collections.Counter(),
            "status_total": 0, "status_dispel": 0, "status_undispel": 0,
            "cards": 0, "active": 0, "passive": 0,
            "rarity": collections.Counter(), "flagships": [],
            "ms_violation": [],
        })
        # 全局（职业级）
        prof = {"prim": collections.Counter(), "op": collections.Counter(),
                "ms_stat": collections.Counter(), "mr_res": collections.Counter(),
                "status_cat": collections.Counter(), "status_total": 0,
                "status_dispel": 0, "status_undispel": 0,
                "cards": 0, "active": 0, "passive": 0, "rarity": collections.Counter(),
                "ms_violation": []}

        def record(card, bucket):
            ax = card.get("axis", "?")
            b = axis_data[ax]
            effs, ops = [], []
            walk(card, effs, ops)
            b["cards"] += 1
            prof["cards"] += 1
            kind = card.get("kind", "?")
            if kind == "active":
                b["active"] += 1; prof["active"] += 1
            elif kind == "passive":
                b["passive"] += 1; prof["passive"] += 1
            rar = card.get("rarity", "")
            b["rarity"][rar] += 1; prof["rarity"][rar] += 1
            if card.get("flagship"):
                b["flagships"].append((card.get("name", "?"), card.get("describe", ""),
                                       card.get("id", "?")))
            for e in effs:
                et = e.get("type")
                b["prim"][et] += 1; prof["prim"][et] += 1
                if et == "modify_stat":
                    st = e.get("stat")
                    b["ms_stat"][st] += 1; prof["ms_stat"][st] += 1
                    if isinstance(st, str) and not STAT_PATTERN.match(st):
                        b["ms_violation"].append((card.get("id"), st))
                        prof["ms_violation"].append((card.get("id"), st))
                elif et == "modify_resource":
                    rs = e.get("resource")
                    b["mr_res"][rs] += 1; prof["mr_res"][rs] += 1
            for o in ops:
                op = o.get("op")
                b["op"][op] += 1; prof["op"][op] += 1
            # 状态（挂在卡上）
            for s in (card.get("statusDefs") or []):
                b["status_total"] += 1; prof["status_total"] += 1
                if s.get("dispelable"):
                    b["status_dispel"] += 1; prof["status_dispel"] += 1
                else:
                    b["status_undispel"] += 1; prof["status_undispel"] += 1
                for cat in (s.get("category") or []):
                    b["status_cat"][cat] += 1; prof["status_cat"][cat] += 1

        for c in cards:
            record(c, None)

        # 风格指纹（按轴）
        def style_label(bucket):
            score = {k: 0 for k in STYLE_DIMS}
            for et, n in bucket["prim"].items():
                dim = PRIM_TO_DIM.get(et)
                if dim:
                    score[dim] += n
            for st, n in bucket["ms_stat"].items():
                dim = STAT_TO_DIM.get(st)
                if dim:
                    score[dim] += n
            for rs, n in bucket["mr_res"].items():
                dim = RES_TO_DIM.get(rs)
                if dim:
                    score[dim] += n
            for cat, n in bucket["status_cat"].items():
                dim = CAT_TO_DIM.get(cat)
                if dim:
                    score[dim] += n
            tot = sum(score.values())
            ranked = sorted(score.items(), key=lambda x: -x[1])
            if tot == 0:
                return "综合", score
            # 取占比 >= 25% 的维度，至少 1 个，至多 2 个
            tops = [k for k, v in ranked if pct(v, tot) >= 25.0]
            if not tops:
                tops = [ranked[0][0]]
            return "·".join(tops[:2]), score

        DIM_DESC = {
            "进攻": "以直接伤害/削血与伤害乘区为核心手段，强调输出节奏与斩杀",
            "防御": "以叠甲、抬血上限与增益/架势类状态构筑防线，偏向站桩与减伤",
            "控制": "以 debuff、换位、封印、重定向与驱散干扰敌方决策与站位",
            "运营": "以能量、推条（gauge）与迷失资源博弈撬动整场节奏，强调资源调度",
            "续航": "以回血、护盾与再生类状态维持血线，拉长战斗生命周期",
        }

        # 开始写文档
        L = []
        L.append("# %s（%s）· 技能构筑轴分析\n" % (pname, pid))
        L.append("> 数据来源：`docs/json/%s.skills.json`（共 **%d** 张技能卡）。" % (pid, prof["cards"]))
        L.append("> 由 `docs/tools/build_axis_analysis.py` 递归遍历全部效果节点，按「构筑轴(axis)」聚合生成。")
        L.append("> 生成日期：%s\n" % datetime.date.today().isoformat())

        # 职业总览
        L.append("## 一、职业总览：四条构筑轴一览\n")
        L.append("| 构筑轴 | 符号 | 名称 | 技能数 | 主动/被动 | 挂载状态 | 设计风格 |")
        L.append("|---|---|---|---:|---|---:|---|")
        axis_ids = list(axes_def.keys())
        # 若 axes 为空（理论上不会），回退到出现过的 axis
        if not axis_ids:
            axis_ids = sorted(axis_data.keys())
        for ax in axis_ids:
            ad = axis_data.get(ax, None)
            if ad is None:
                L.append("| `%s` | — | — | 0 | — | 0 | — |" % ax)
                continue
            sym = axes_def.get(ax, {}).get("symbol", "")
            nm = axes_def.get(ax, {}).get("name", ax)
            label, _ = style_label(ad)
            L.append("| `%s` | %s | %s | %d | %d/%d | %d | %s |" % (
                ax, sym, nm, ad["cards"], ad["active"], ad["passive"],
                ad["status_total"], label))
        L.append("| **合计** | — | — | **%d** | **%d/%d** | **%d** | — |" % (
            prof["cards"], prof["active"], prof["passive"], prof["status_total"]))
        L.append("")

        # 职业级状态类型总览
        L.append("### 1.1 职业级：挂载状态类型分布\n")
        L.append("> 全职业共挂载 **%d** 个状态（可驱散 %d / 不可驱散 %d）。" % (
            prof["status_total"], prof["status_dispel"], prof["status_undispel"]))
        L.append("| 状态类型 | 次数 | 占状态% |")
        L.append("|---|---:|---:|")
        for cat in STATUS_CATS:
            n = prof["status_cat"].get(cat, 0)
            if n:
                L.append("| %s | %d | %.1f%% |" % (cat, n, pct(n, prof["status_total"])))
        L.append("")

        # 各构筑轴详解
        L.append("## 二、各构筑轴详解\n")
        for ax in axis_ids:
            ad = axis_data.get(ax)
            if ad is None:
                continue
            sym = axes_def.get(ax, {}).get("symbol", "")
            nm = axes_def.get(ax, {}).get("name", ax)
            label, score = style_label(ad)
            prim_tot = sum(ad["prim"][t] for t in PRIM_ORDER)
            L.append("### %s %s（%s）\n" % (sym, nm, ax))
            L.append("**规模**：%d 张技能（主动 %d / 被动 %d）；稀有度分布：%s。" % (
                ad["cards"], ad["active"], ad["passive"],
                "、".join("%s×%d" % (RARITY_CN.get(r, r), n)
                          for r, n in ad["rarity"].most_common())))
            L.append("")

            # 原语构成
            L.append("**效果原语构成**（type，全量递归，共 %d 处）：\n" % prim_tot)
            if prim_tot:
                L.append("| 原语 | 次数 | 占本轴% |")
                L.append("|---|---:|---:|")
                for t in PRIM_ORDER:
                    n = ad["prim"][t]
                    if n:
                        L.append("| `%s` | %d | %.1f%% |" % (t, n, pct(n, prim_tot)))
                L.append("")
            else:
                L.append("_本轴无 type 原语（仅算子）。_\n")

            # 算子构成
            op_tot = sum(ad["op"][t] for t in OP_ORDER)
            if op_tot:
                L.append("**算子构成**（op，共 %d 处）：\n" % op_tot)
                L.append("| 算子 | 次数 |")
                L.append("|---|---:|")
                for t in OP_ORDER:
                    n = ad["op"][t]
                    if n:
                        L.append("| `%s` | %d |" % (t, n))
                L.append("")

            # modify_stat
            if ad["ms_stat"]:
                L.append("**改动的属性（modify_stat，共 %d 处）**：\n" % sum(ad["ms_stat"].values()))
                L.append("| stat 属性键 | 次数 |")
                L.append("|---|---:|")
                for k, n in ad["ms_stat"].most_common():
                    L.append("| `%s` | %d |" % (k, n))
                L.append("")

            # modify_resource
            if ad["mr_res"]:
                L.append("**改动的资源（modify_resource，共 %d 处）**：\n" % sum(ad["mr_res"].values()))
                L.append("| resource 资源键 | 次数 |")
                L.append("|---|---:|")
                for k, n in ad["mr_res"].most_common():
                    L.append("| `%s` | %d |" % (k, n))
                L.append("")

            # 状态类型
            if ad["status_total"]:
                L.append("**挂载状态类型（共 %d 个；可驱散 %d / 不可驱散 %d）**：\n" % (
                    ad["status_total"], ad["status_dispel"], ad["status_undispel"]))
                L.append("| 状态类型 | 次数 | 占本轴状态% |")
                L.append("|---|---:|---:|")
                for cat in STATUS_CATS:
                    n = ad["status_cat"].get(cat, 0)
                    if n:
                        L.append("| %s | %d | %.1f%% |" % (cat, n, pct(n, ad["status_total"])))
                L.append("")

            # 设计风格总结
            top_prim = [t for t, _ in ad["prim"].most_common(3) if t in PRIM_ORDER]
            top_prim_str = "、".join("`%s`(%d)" % (t, ad["prim"][t]) for t in top_prim) or "—"
            top_stat_str = "、".join("`%s`" % k for k, _ in ad["ms_stat"].most_common(3)) or "—"
            top_res_str = "、".join("`%s`" % k for k, _ in ad["mr_res"].most_common(3)) or "—"
            top_cat = [c for c, _ in ad["status_cat"].most_common(4) if c in STATUS_CATS]
            top_cat_str = "、".join(top_cat) or "—"
            # 风格描述句
            dim_sent = "；".join(DIM_DESC[d] for d in label.split("·"))
            L.append("**设计风格总结**：本轴偏【%s】——%s。" % (label, dim_sent))
            L.append("签名原语为 %s；属性杠杆集中在 %s，资源杠杆集中在 %s；"
                     "挂载状态以 %s 类型为主，构成其核心交互骨架。" % (
                         top_prim_str, top_stat_str, top_res_str, top_cat_str))
            # 代表技能
            if ad["flagships"]:
                L.append("代表技能：")
                for fn, fdesc, fid in ad["flagships"][:3]:
                    L.append("- **%s**：%s" % (fn, (fdesc or "").strip()))
                L.append("")

            # 数据质量
            if ad["ms_violation"]:
                L.append("> ⚠️ 数据质量：本轴有 %d 处 `modify_stat` 的 `stat` 键不符合 schema 取值域：%s。"
                         % (len(ad["ms_violation"]),
                            "、".join("`%s`:`%s`" % (cid, st) for cid, st in ad["ms_violation"])))
                L.append("")
            L.append("")

        # 职业级数据质量汇总
        if prof["ms_violation"]:
            L.append("## 三、职业级数据质量提示\n")
            L.append("| 卡 id | 非标准 stat 键 | 建议 |")
            L.append("|---|---|---|")
            for cid, st in prof["ms_violation"]:
                L.append("| `%s` | `%s` | 改用 `modify_damage`（scope: dealt/taken） |" % (cid, st))
            L.append("")

        # 统计口径
        L.append("## 附：统计口径\n")
        L.append("- 数据源：`docs/json/%s.skills.json` 的 `cards[]`，共 %d 张卡。" % (pid, prof["cards"]))
        L.append("- 按 `axis` 字段分桶；`axis` 定义与符号取自文件级 `axes`。")
        L.append("- 效果原语/算子：**递归遍历**每张卡全部效果节点（卡面 `effects`、"
                 "`statusDefs[].triggers[].effects`、区域/界域等任意嵌套），同名多次计数。")
        L.append("- 原语以效果节点 `type` 归类（19 类）；算子以 `op` 归类（9 类）。")
        L.append("- 挂载状态：统计每张卡 `statusDefs[]` 的 `category`（类型）与 `dispelable`（可驱散性）。")
        L.append("- 设计风格标签：由原语/属性/资源/状态类别映射到五大维度"
                 "（进攻/防御/控制/运营/续航）后取占比≥25%的维度，至多 2 个组合而成。")
        L.append("- 生成脚本：`docs/tools/build_axis_analysis.py`（可重复运行）。")

        out = "\n".join(L)
        out_path = os.path.join(OUT_DIR, "%s.md" % pid)
        with open(out_path, "w", encoding="utf-8") as fh:
            fh.write(out)
        print("wrote:", out_path, "| cards:", prof["cards"], "| axes:", len(axis_ids),
              "| statuses:", prof["status_total"])

    print("=== ALL DONE ===")


if __name__ == "__main__":
    main()
