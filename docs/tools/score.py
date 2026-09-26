# -*- coding: utf-8 -*-
"""职业设计评分器。用法: python docs/tools/score.py

口径权威见 docs/meta/SCORING.md（本脚本是唯一计分实现）。
产物：
  - docs/analysis/scorecard.md  人读计分卡（勿手改）
  - docs/analysis/scores.json   网页端评分页数据源（口径单一来源，前端不重算）
只读脚本，不改任何数据文件。
"""
import json, io, os, sys, glob, datetime

HERE = os.path.dirname(os.path.abspath(__file__))          # docs/tools/
JSON_DIR = os.path.join(os.path.dirname(HERE), "json")      # docs/json/
ANALYSIS_DIR = os.path.join(os.path.dirname(HERE), "analysis")

sys.path.insert(0, HERE)
from status_loader import iter_status_defs


# ---------- 加载 ----------

def load_skills():
    """pathwayId -> {meta, axes, cards}"""
    out = {}
    for f in sorted(glob.glob(os.path.join(JSON_DIR, "*.skills.json"))):
        d = json.load(io.open(f, encoding="utf-8"))
        out[d["pathwayId"]] = d
    return out


def walk(node):
    """递归产出所有 dict（供引用扫描）。"""
    if isinstance(node, dict):
        yield node
        for v in node.values():
            for x in walk(v):
                yield x
    elif isinstance(node, list):
        for v in node:
            for x in walk(v):
                yield x


def card_effect_types(card):
    return {n["type"] for n in walk(card.get("effects")) if "type" in n and isinstance(n.get("type"), str)}


def card_condition_kinds(card):
    return {n["kind"] for n in walk(card.get("effects")) if n.get("kind") == n.get("kind") and "kind" in n and isinstance(n.get("kind"), str)}


def card_refs_status(card, sid):
    """卡面 AST 是否引用状态 sid（mount/modify/transfer/dispel 的 statusId、condition/filter 的 id/hasStatus）。"""
    for n in walk(card.get("effects")):
        for k in ("statusId",):
            v = n.get(k)
            if v == sid or (isinstance(v, list) and sid in v):
                return True
        if n.get("id") == sid and n.get("kind") in (
            "has_status", "caster_status_exists", "status_category"):
            return True
        if n.get("hasStatus") == sid or (isinstance(n.get("hasStatus"), list) and sid in n.get("hasStatus", [])):
            return True
    # 挂载的状态定义自身引用（payoff 经专属状态读层，如恐惧权柄→dread_authority→pacified）
    return False


def refs_in_obj(obj, sid):
    for n in walk(obj):
        v = n.get("statusId")
        if v == sid or (isinstance(v, list) and sid in v):
            return True
        if n.get("id") == sid and "kind" in n:
            return True
        hs = n.get("hasStatus")
        if hs == sid or (isinstance(hs, list) and sid in hs):
            return True
        ths = n.get("targetHasStatus")
        if ths == sid or (isinstance(ths, list) and sid in ths):
            return True
    return False


def card_refs_resource(card, res):
    for n in walk(card.get("effects")):
        if n.get("type") == "modify_resource" and n.get("resource") == res:
            return True
        if n.get("kind") == "resource_compare" and n.get("key") == res:
            return True
    return False


def card_mounts(card):
    return {n.get("statusId") for n in walk(card.get("effects"))
            if n.get("type") == "mount_status" and isinstance(n.get("statusId"), str)}


# ---------- 主计分 ----------

def main():
    pathways = load_skills()
    status_by_id = {}
    status_owner = {}
    for pid, label, sd in iter_status_defs():
        status_by_id[sd["id"]] = sd
        status_owner[sd["id"]] = pid
    manifest = json.load(io.open(os.path.join(JSON_DIR, "manifest.json"), encoding="utf-8"))
    rarity_map = manifest.get("rarityMap", {})

    # 依赖全库归一的原始量，先全量收集
    axis_rows = []           # 计分中间态
    pw_crossaxis_refs = {}   # pathwayId -> 本途径他轴身份被读本途径卡引用的次数
    pw_crosspath_reads = {}  # pathwayId -> 读他途径枢纽状态的实证次数
    axis_diversity_raw = {}  # axisKey -> 种类和
    pw_hub_statuses = {}     # pathwayId -> crossPathway 状态数
    for pid, label, sd in iter_status_defs():
        if sd.get("crossPathway"):
            pw_hub_statuses[status_owner.get(sd["id"], "?")] = pw_hub_statuses.get(status_owner.get(sd["id"], "?"), 0) + 1

    for pid, d in pathways.items():
        axes = d.get("axes") or {}
        cards = d.get("cards") or []
        card_by_name = {c["name"]: c for c in cards}
        n_axes = max(1, len(axes))

        for aid, ax in axes.items():
            sid = ax.get("statusId")
            enablers = ax.get("enablers") or []
            payoffs = ax.get("payoffs") or []
            axis_cards = [c for c in cards if c.get("axis") == aid]
            deductions = []

            # —— 身份锚定 ——
            identity_pool = None
            if sid and sid in status_by_id:
                anchor = 8
                sdef = status_by_id[sid]
                if sdef.get("stackThreshold") or sdef.get("thresholdTrigger") or sdef.get("maxStacks") or sdef.get("charges"):
                    anchor += 7
                else:
                    deductions.append(("身份锚定", "-7：身份状态无层数引擎（stackThreshold/thresholdTrigger/maxStacks 皆无）", sid))
            elif not sid:
                # Pool 轴：以 enabler 卡 modify_resource 的资源为身份
                res_votes = {}
                for n in enablers:
                    c = card_by_name.get(n)
                    if not c:
                        continue
                    for node in walk(c.get("effects")):
                        if node.get("type") == "modify_resource" and isinstance(node.get("resource"), str):
                            res_votes[node["resource"]] = res_votes.get(node["resource"], 0) + 1
                identity_pool = max(res_votes, key=res_votes.get) if res_votes else None
                if identity_pool:
                    anchor = 8
                    deductions.append(("身份锚定", "-7：Pool 轴无层数引擎档位（thresholdTrigger(metric) 未挂）", identity_pool))
                else:
                    anchor = 0
                    deductions.append(("身份锚定", "-15：轴无 statusId 且 enabler 无 modify_resource 产能段", aid))
            else:
                anchor = 0
                deductions.append(("身份锚定", "-15：statusId '%s' 悬空" % sid, sid))

            def _is_enabler(c):
                if not c:
                    return False
                if sid:
                    return sid in card_mounts(c)
                return identity_pool and card_refs_resource(c, identity_pool)

            en_verified = [n for n in enablers if _is_enabler(card_by_name.get(n))]
            en_missed = [n for n in enablers if n not in en_verified]
            if len(en_verified) >= 2:
                closure_e = 20
            elif len(en_verified) == 1:
                closure_e = 12
                deductions.append(("产层闭环", "-8：实证 enabler 仅 1 张", ",".join(en_verified)))
            elif enablers:
                closure_e = 5
                deductions.append(("产层闭环", "-15：enablers %d 张均未实证挂载身份" % len(enablers), ",".join(en_missed)))
            else:
                closure_e = 0
                deductions.append(("产层闭环", "-20：enablers 为空", aid))
            if en_missed and en_verified:
                deductions.append(("产层闭环", "注：未实证 %d 张（name 在列但卡面不挂身份）" % len(en_missed), ",".join(en_missed)))

            # —— 读层闭环（实证 vs notes 级） ——
            def _payoff_evidence(c):
                """返回 'landed' | 'notes' | None"""
                if not c:
                    return None
                if sid:
                    if card_refs_status(c, sid):
                        return "landed"
                    for m in card_mounts(c):
                        mdef = status_by_id.get(m)
                        if mdef and refs_in_obj(mdef, sid):
                            return "landed"
                    return "notes"
                if identity_pool:
                    for n in walk(c.get("effects")):
                        if n.get("kind") == "resource_compare" and n.get("key") == identity_pool:
                            return "landed"
                        if n.get("type") == "modify_resource" and n.get("resource") == identity_pool and (n.get("value") or 0) < 0:
                            return "landed"
                    return "notes"
                return None

            landed, notes_level = [], []
            for n in payoffs:
                ev = _payoff_evidence(card_by_name.get(n))
                (landed if ev == "landed" else notes_level if ev == "notes" else []).append(n)
            closure_p = min(25, len(landed) * 9 + len(notes_level) * 4)
            if not payoffs:
                if ax.get("payoffVacuumAccepted"):
                    closure_p = 12
                else:
                    deductions.append(("读层闭环", "-25：真空轴（无 payoff 且未甄别接受）", aid))
            else:
                if notes_level and not landed:
                    deductions.append(("读层闭环", "-%d：payoff %d 张全部 notes 级（卡面无读层引用）" % (25 - closure_p, len(payoffs)), ",".join(notes_level)))
                elif notes_level:
                    deductions.append(("读层闭环", "注：notes 级 %d 张（减半计）" % len(notes_level), ",".join(notes_level)))

            # —— 轴内多样性（归一后置） ——
            prim_kinds, cond_kinds = set(), set()
            for c in axis_cards:
                prim_kinds |= card_effect_types(c)
                cond_kinds |= card_condition_kinds(c)
            div_raw = len(prim_kinds) + len(cond_kinds)
            axis_diversity_raw[(pid, aid)] = div_raw

            # —— 规模均衡 ——
            ideal = len(cards) / n_axes
            ratio = (len(axis_cards) / ideal) if ideal else 0
            if 0.6 <= ratio <= 1.4:
                scale = 10
            else:
                dev = abs(ratio - 1.0) - 0.4
                scale = max(0, round(10 - dev * 10))
                deductions.append(("规模均衡", "-%d：轴卡数 %d vs 理想 %d（比值 %.2f）" % (10 - scale, len(axis_cards), round(ideal), ratio), aid))

            # —— 承接连通 ——
            patterns = set()
            for n in payoffs:
                c = card_by_name.get(n)
                if not c:
                    continue
                mounted = [status_by_id.get(m) for m in card_mounts(c)]
                blob = [c] + [m for m in mounted if m]
                has_mul = any(refs_in_obj(o, sid) and True for o in blob) and any(
                    "damage_mul" in json.dumps(o, ensure_ascii=False) and refs_in_obj(o, sid) for o in blob)
                if has_mul:
                    patterns.add("乘区")
                if any(n2.get("op") == "if" and refs_in_obj(n2, sid) for n2 in walk(c.get("effects"))) or \
                   any(n2.get("kind") in ("resource_compare", "stat_compare") for n2 in walk(c.get("effects"))):
                    patterns.add("条件分支")
                for n2 in walk(c.get("effects")):
                    if n2.get("type") == "modify_status" and n2.get("statusId") == sid and \
                       ((n2.get("stacksDelta") or 0) < 0 or n2.get("stackMode") == "consume"):
                        patterns.add("耗层")
                if any(n2.get("hasStatus") == sid for n2 in walk(c.get("effects"))) or \
                   any(n2.get("kind") == "has_status" and n2.get("id") == sid for n2 in walk(c.get("effects"))):
                    patterns.add("存在性")
            # 跨轴/跨系消费：身份被他轴卡（本途径或他途径，限 crossPathway 白名单）读取
            ext_consumers = 0
            if sid:
                for pid2, d2 in pathways.items():
                    for c2 in d2.get("cards") or []:
                        if pid2 == pid and c2.get("axis") == aid:
                            continue
                        if not card_refs_status(c2, sid):
                            continue
                        if pid2 != pid:
                            sdef = status_by_id.get(sid) or {}
                            part = sdef.get("participants") or []
                            if not (sdef.get("crossPathway") and (not part or pid2 in part)):
                                continue
                            pw_crosspath_reads[pid2] = pw_crosspath_reads.get(pid2, 0) + 1
                        else:
                            pw_crossaxis_refs[pid] = pw_crossaxis_refs.get(pid, 0) + 1
                        ext_consumers += 1
            connect = min(15, len(patterns) * 3 + ext_consumers * 3)
            if not patterns and not ext_consumers and payoffs:
                deductions.append(("承接连通", "-15：payoff 无读层方式多样性且无跨轴消费", ",".join(payoffs)))

            axis_rows.append({
                "pathway": pid, "axis": aid, "name": ax.get("name"), "symbol": ax.get("symbol"),
                "anchor": anchor, "closure_e": closure_e, "closure_p": closure_p,
                "div_raw": div_raw, "scale": scale, "connect": connect,
                "cards": len(axis_cards), "enablers_v": en_verified, "landed": landed, "notes": notes_level,
                "patterns": sorted(patterns), "ext_consumers": ext_consumers,
                "vacuum_accepted": bool(ax.get("payoffVacuumAccepted")),
                "deductions": deductions,
            })

    # 归一：多样性
    max_div = max(axis_diversity_raw.values()) or 1
    for r in axis_rows:
        r["diversity"] = round(15 * r["div_raw"] / max_div, 1)
        r["total"] = round(r["anchor"] + r["closure_e"] + r["closure_p"] + r["diversity"] + r["scale"] + r["connect"], 1)
        r["dims"] = {"身份锚定": r["anchor"], "产层闭环": r["closure_e"], "读层闭环": r["closure_p"],
                     "轴内多样性": r["diversity"], "规模均衡": r["scale"], "承接连通": r["connect"]}

    # ---------- 途径级 ----------
    max_crossaxis = max(pw_crossaxis_refs.values()) if pw_crossaxis_refs else 0
    max_crosspath = max(pw_crosspath_reads.values()) if pw_crosspath_reads else 0
    pw_rows = []
    for pid, d in pathways.items():
        axes = d.get("axes") or {}
        cards = d.get("cards") or []
        arows = [r for r in axis_rows if r["pathway"] == pid]
        axis_scores = [r["total"] for r in arows]
        deductions = []

        mean_axis = sum(axis_scores) / len(axis_scores) if axis_scores else 0
        min_axis = min(axis_scores) if axis_scores else 0
        health = mean_axis * 0.75 + min_axis * 0.25
        if min_axis < 25:
            health -= 10
            deductions.append(("轴健康度", "-10：最低轴 %.0f 分（<25）" % min_axis,
                               min((r for r in arows), key=lambda r: r["total"])["axis"]))
        elif min_axis < 40:
            health -= 5
            deductions.append(("轴健康度", "-5：最低轴 %.0f 分（<40）" % min_axis,
                               min((r for r in arows), key=lambda r: r["total"])["axis"]))
        health = max(0, round(health * 30 / 100, 1))

        crossaxis = round(15 * pw_crossaxis_refs.get(pid, 0) / (max_crossaxis or 1), 1)
        if crossaxis < 7.5:
            deductions.append(("跨轴耦合", "-%s：本途径他轴身份读取 %d 次（全库 max %d）" % (15 - crossaxis, pw_crossaxis_refs.get(pid, 0), max_crossaxis), pid))
        crosspath_norm = (max_crosspath or 0) + max(pw_hub_statuses.values() or [1])
        crosspath = round(15 * (pw_crosspath_reads.get(pid, 0) + pw_hub_statuses.get(pid, 0)) / (crosspath_norm or 1), 1)
        if crosspath < 7.5:
            deductions.append(("跨系联动", "-%s：枢纽状态 %d 个 + combo 读取 %d 次" % (15 - crosspath, pw_hub_statuses.get(pid, 0), pw_crosspath_reads.get(pid, 0)), pid))

        # 结构健康
        struct = 0
        bad_rarity = 0
        for c in cards:
            want = [r for r, seqs in rarity_map.items() if c.get("sequence") in seqs]
            if want and c.get("rarity") not in want:
                bad_rarity += 1
        struct += 6 if bad_rarity == 0 else max(0, 6 - bad_rarity * 2)
        actives = sum(1 for c in cards if c.get("kind") == "active")
        passives = len(cards) - actives
        aratio = actives / passives if passives else 99
        if 1.5 <= aratio <= 3.0:
            struct += 5
        else:
            s5 = max(0, round(5 - abs(aratio - (1.5 if aratio < 1.5 else 3.0))))
            struct += s5
            deductions.append(("结构健康", "-%s：主被动比 %.2f 不在 [1.5, 3.0]" % (5 - s5, aratio), pid))
        n_flag = sum(1 for c in cards if c.get("flagship"))
        struct += max(0, 4 - abs(4 - n_flag))
        if n_flag != 4:
            deductions.append(("结构健康", "-%d：旗舰卡 %d 张（理想 4）" % (abs(4 - n_flag), n_flag), pid))

        # 机制落地
        flags = [f for c in cards for f in (c.get("frameworkFlags") or [])]
        if not flags:
            landed_score = 15
        else:
            landed_n = sum(1 for f in flags if f.get("landed"))
            landed_score = round(15 * landed_n / len(flags), 1)
            for f in flags:
                if not f.get("landed"):
                    deductions.append(("机制落地", "-：frameworkFlags 未落地 %s" % f.get("code", "?"),
                                       f.get("note", "")[:60]))

        # 文本完备
        txt = sum(1 for c in cards if c.get("lore") and c.get("flavor") and c.get("describe"))
        text_score = round(10 * txt / len(cards), 1) if cards else 0

        total = round(health + crossaxis + crosspath + struct + landed_score + text_score, 1)
        pw_rows.append({
            "id": pid, "name": d.get("pathwayName"), "cards": len(cards),
            "total": total,
            "dims": {"轴健康度": health, "跨轴耦合": crossaxis, "跨系联动": crosspath,
                     "结构健康": round(struct, 1), "机制落地": landed_score, "文本完备": text_score},
            "axes": arows, "deductions": deductions,
            "min_axis": min_axis, "mean_axis": round(mean_axis, 1),
        })

    pw_rows.sort(key=lambda r: r["total"])
    write_scorecard(pw_rows)
    write_scores_json(pw_rows)
    print("scored %d pathways / %d axes -> scorecard.md + scores.json" % (len(pw_rows), len(axis_rows)))
    for r in pw_rows:
        print("  %-18s %5.1f  (min axis %.0f)" % (r["id"], r["total"], r["min_axis"]))


def write_scorecard(pw_rows):
    L = []
    L.append("# 职业设计计分卡（scorecard）\n")
    L.append("> 由 `docs/tools/score.py` 自动生成——**口径变了就改 SCORING.md 重跑，不要手改本文件**。")
    L.append("> 生成时间：%s。评分标准见 `../meta/SCORING.md`；数值 ⚠️D 不参与计分（基线状态）。\n" % datetime.date.today())

    L.append("## 一、途径排行（升序 = 优先重设计）\n")
    L.append("| # | 途径 | 总分 | 轴健康 | 跨轴 | 跨系 | 结构 | 落地 | 文本 | 最低轴 | 卡数 |")
    L.append("|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|")
    for i, r in enumerate(pw_rows, 1):
        d = r["dims"]
        L.append("| %d | **%s** `%s` | **%.1f** | %.1f | %.1f | %.1f | %.1f | %.1f | %.1f | %.0f | %d |" % (
            i, r["name"], r["id"], r["total"], d["轴健康度"], d["跨轴耦合"], d["跨系联动"],
            d["结构健康"], d["机制落地"], d["文本完备"], r["min_axis"], r["cards"]))
    L.append("")

    for r in pw_rows:
        L.append("\n## %s（%s）· %.1f 分\n" % (r["name"], r["id"], r["total"]))
        L.append("| 维度 | 得分 |")
        L.append("|---|---:|")
        for k, v in r["dims"].items():
            L.append("| %s | %.1f |" % (k, v))
        L.append("")
        if r["deductions"]:
            L.append("**途径失分项**：")
            L.append("")
            for dim, why, ref in r["deductions"]:
                L.append("- `%s` %s（%s）" % (dim, why, ref))
            L.append("")
        L.append("| 轴 | 总分 | 身份 | 产层 | 读层 | 多样 | 规模 | 连通 | 实证 enabler | 实证 payoff | notes 级 |")
        L.append("|---|---:|---:|---:|---:|---:|---:|---:|---|---|---|")
        for a in sorted(r["axes"], key=lambda x: x["total"]):
            ad = a["dims"]
            L.append("| %s %s `%s` | **%.1f** | %.0f | %.0f | %.0f | %.1f | %.0f | %.0f | %s | %s | %s |" % (
                a["symbol"] or "", a["name"], a["axis"], a["total"], ad["身份锚定"], ad["产层闭环"],
                ad["读层闭环"], ad["轴内多样性"], ad["规模均衡"], ad["承接连通"],
                ",".join(a["enablers_v"]) or "—", ",".join(a["landed"]) or "—", ",".join(a["notes"]) or "—"))
        L.append("")
        for a in sorted(r["axes"], key=lambda x: x["total"]):
            if a["deductions"]:
                L.append("**%s %s 失分项**：" % (a["symbol"] or "", a["name"]))
                L.append("")
                for dim, why, ref in a["deductions"]:
                    L.append("- `%s` %s（%s）" % (dim, why, ref))
                L.append("")
    io.open(os.path.join(ANALYSIS_DIR, "scorecard.md"), "w", encoding="utf-8").write("\n".join(L))


def write_scores_json(pw_rows):
    out = {
        "generated": str(datetime.date.today()),
        "standard": "docs/meta/SCORING.md",
        "pathways": [{
            "id": r["id"], "name": r["name"], "total": r["total"], "dims": r["dims"],
            "minAxis": r["min_axis"], "cards": r["cards"],
            "deductions": [{"dim": d, "why": w, "ref": x} for d, w, x in r["deductions"]],
            "axes": [{
                "id": a["axis"], "name": a["name"], "symbol": a["symbol"], "total": a["total"],
                "dims": a["dims"], "cards": a["cards"],
                "enablersVerified": a["enablers_v"], "payoffsLanded": a["landed"],
                "payoffsNotes": a["notes"], "patterns": a["patterns"],
                "vacuumAccepted": a["vacuum_accepted"],
                "deductions": [{"dim": d, "why": w, "ref": x} for d, w, x in a["deductions"]],
            } for a in sorted(r["axes"], key=lambda x: x["total"])],
        } for r in pw_rows],
    }
    io.open(os.path.join(ANALYSIS_DIR, "scores.json"), "w", encoding="utf-8").write(
        json.dumps(out, ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main()
