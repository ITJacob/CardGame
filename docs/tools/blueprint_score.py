# -*- coding: utf-8 -*-
"""玩法蓝图评分器。用法: python docs/tools/blueprint_score.py

玩法蓝图 = 途径级一次性产物（`docs/meta/rounds/<途径>.md` 前置「## 玩法蓝图」章），
在设计阶段先定玩法再补卡；本脚本评**声明质量**（rubric 0–100）并对已落地途径做**兑现率**对账。
蓝图评分永不进 score.py 100 分（玩法轨隔离铁律，WORKFLOW.md「机制期玩法轨工作流」）。

机读约定（与 WORKFLOW.md「玩法蓝图」节同文）：
- 只认 `## 玩法蓝图（<草案|已拍板|回溯补登> · <日期> · 蓝图评分 <xx>/100）` 之下各 `###` 节的管道表格；
  下一个 `##` 即蓝图章结束。
- 每节表头逐字固定（见 SECTIONS）；单元格内列表用半角逗号，禁 `|` 与换行；节缺失 = 该维 0 分。
- 锚点写 `kind:id`（kind ∈ ANCHOR_KINDS，与 SCORING §二·零 同表）；
  签名键承诺写 `键:卡位,卡位;键:卡位`（分号隔键，键表 = score.py PATHWAY_SIGNATURES）；
  轴角色配比列写 `core×2,generic×1`；角色配比表逐角色一行，可加 `flagship` 行（卡位须 ⊆ core∪trap）。
- 「显式声明无」= 该节只一行且首格为「无」（跨轴/跨系钩子允许）。

产物（勿手改）：
  - docs/analysis/blueprint_score.md       蓝图评分榜 + 逐途径 rubric 明细
  - docs/analysis/blueprint_fulfillment.md 兑现率对账（人读）
  - docs/analysis/blueprint_fulfillment.json 兑现率对账（机读）
  - docs/analysis/blueprints.json         站点机读面（声明 + 实证 join + 逐行兑现）
无蓝图的途径记入「未建蓝图」清单并跳过（不报错，支撑分批回溯）。
"""
import datetime
import glob
import io
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
DOCS = os.path.dirname(HERE)
sys.path.insert(0, HERE)
import score  # noqa: E402  复用 load_skills / PATHWAY_SIGNATURES / signature_counts / facet 工具
import validate  # noqa: E402  复用 RESOURCES 等枚举正源
from blueprint_parse import (  # noqa: E402  解析层已抽离（score.py 反向复用同一解析器）
    SECTIONS, STATES, parse_blueprint, parse_pc_chain,
    _cells, _is_declared_none, _parse_axis_roles, _parse_sig_commit, _split_row,
)

META_DIR = os.path.join(DOCS, "meta")
ROUNDS_DIR = os.path.join(META_DIR, "rounds")
ANALYSIS_DIR = os.path.join(DOCS, "analysis")
IDENTITY_MD = os.path.join(META_DIR, "途径设计身份.md")

ROLES = ("core", "starter", "bridge", "generic", "trap", "tech")
# 锚点 kind 14 值（SCORING §二·零 全四类锚点清单同表）
ANCHOR_KINDS = ("status", "status_family", "resource", "equipment", "zone",
                "primitive", "trigger", "geometry", "action_economy", "channel",
                "rule_slot", "dimension", "element", "form_cycle")
# facet 词表（SCORING §二·三 同表 + 蓝图专用 status 行：status 锚点轴之间的读层钩子
# 走跨轴耦合口径①「读他轴私有状态」，不属四概念 facet，蓝图表允许声明以便兑现率对账）
FACET_VOCAB = {
    "equipment": ("equip", "durability_consume", "durability_replenish", "read_equipped", "dump", "steal"),
    "channel": ("write", "read", "cycle"),
    "resource": ("produce", "consume", "threshold"),
    "primitive": ("use",),
    "status": ("mount", "read", "consume"),
}
# 全局通用机制词表（风格边界表声明用；表外项只警告不扣分——词表随设计演进扩充）
GLOBAL_MECHANISMS = ("武器", "装备", "相位", "资源", "过牌", "基础增益", "位移", "召唤",
                     "治疗", "护盾", "驱散", "吟唱", "量表", "场地", "界域", "能量")
# 决策点黑名单（WORKFLOW 格③打回标准同表）：写这些等于没写
# 含 prefill_blueprint.py 占位串——占位 = 未人写，不得白拿命题/决策点分
DECISION_BLACKLIST = {"", "打谁", "有能量就打", "无", "—", "-",
                      "（待主人拍）", "（待人写）", "（待定）"}


# ---------- 声明校验 ----------


def load_identity_dims():
    """途径中文名 -> 身份卡主签名维度文本（途径设计身份.md §一 表）。"""
    out = {}
    in_table = False
    for ln in io.open(IDENTITY_MD, encoding="utf-8"):
        if ln.startswith("## 一、"):
            in_table = True
            continue
        if in_table and ln.startswith("## "):
            break
        if in_table and ln.strip().startswith("|") and "---" not in ln and "途径" not in ln:
            cells = _split_row(ln)
            if len(cells) >= 2:
                out[cells[0]] = cells[1]
    return out


def _anchor_ok(spec, status_ids):
    """锚点可解析：kind ∈ 14 枚举 + id 存在性（能查的查）。"""
    if ":" not in (spec or ""):
        return False, "锚点缺 kind:id"
    kind, _, aid = spec.partition(":")
    if kind not in ANCHOR_KINDS:
        return False, "锚点 kind '%s' 不在 14 枚举" % kind
    if kind == "status" and aid not in status_ids:
        return False, "锚点状态 '%s' 无 statusDef" % aid
    if kind == "channel" and aid not in score.CHANNELS:
        return False, "锚点通道 '%s' 不在全局通道表" % aid
    if kind == "resource" and aid not in validate.RESOURCES:
        return False, "锚点资源 '%s' 不在资源枚举" % aid
    if kind == "element" and aid not in validate.ELEMENTS:
        return False, "锚点元素 '%s' 不在元素枚举" % aid
    if kind == "primitive" and aid not in validate.PRIMS:
        return False, "锚点原语 '%s' 不在原语枚举" % aid
    return True, ""


# ---------- rubric ----------


def score_blueprint(pid, bp, pathways, status_ids, identity_dims, pw_name):
    """七维 rubric（0–100）：命题 10 / 风格边界 15 / 轴循环 25 / 决策点 10 /
    签名键 15 / 角色配比 15 / 钩子 10。返回 (总分, 分明细, 失分清单, 解析件)。"""
    sec = bp["sections"]
    deds = []
    parts = {}
    parsed = {}

    # —— 命题 10 ——
    rows = sec.get("命题", {}).get("rows") or []
    r0 = rows[0] if rows else {}
    p = 0
    if _real(r0.get("一句话命题")):
        p += 4
    if _real(r0.get("可操作变量")):
        p += 3
    if _real(r0.get("变量代价/输面")):
        p += 3
    if p < 10:
        deds.append(("命题", "命题三格不齐（命题/可操作变量/代价输面）", p, 10))
    parts["命题"] = p

    # —— 风格边界 15 ——
    rows = sec.get("风格边界", {}).get("rows") or []
    r0 = rows[0] if rows else {}
    s = 0
    main_dim = (r0.get("主签名维度") or "").strip()
    if main_dim:
        s += 2
        ref = identity_dims.get(pw_name, "")
        hit = any(len(t) >= 2 and t in ref for t in _char_tokens(main_dim)) or \
            any(len(t) >= 2 and t in main_dim for t in _char_tokens(ref))
        if hit:
            s += 3
        else:
            deds.append(("风格边界", "主签名维度「%s」与身份卡（途径设计身份.md §一：%s）对账不上" % (main_dim, ref), s, 5))
    else:
        deds.append(("风格边界", "主签名维度未声明", 0, 5))
    mechs = _cells(r0.get("使用的全局通用机制"))
    if mechs:
        s += 3
        alien = [m for m in mechs if m not in GLOBAL_MECHANISMS]
        if not alien:
            s += 2
        else:
            deds.append(("风格边界", "全局通用机制词表外：%s（词表见 blueprint_score.py GLOBAL_MECHANISMS）" % ",".join(alien), s, 5))
    else:
        deds.append(("风格边界", "使用的全局通用机制未声明", s, 5))
    # 各轴锚点不与他途径主签名独占冲突
    own_keys = set(score.PATHWAY_SIGNATURES.get(pid, []))
    conflict = []
    for ar in (sec.get("轴玩法", {}).get("rows") or []):
        spec = ar.get("锚点(kind:id)") or ""
        if ":" not in spec:
            continue
        kind, _, aid = spec.partition(":")
        sig_like = {"primitive": "prim:", "element": "elem:", "resource": "res:", "channel": "res:"}.get(kind)
        if sig_like:
            key = sig_like + aid
            owners = [p2 for p2, ks in score.PATHWAY_SIGNATURES.items() if key in ks and p2 != pid]
            if owners and key not in own_keys:
                conflict.append("%s→%s(属%s)" % (ar.get("轴"), key, ",".join(owners)))
    if not conflict:
        s += 5
    else:
        s += max(0, 5 - 3 * len(conflict))
        deds.append(("风格边界", "轴锚点与他途径主签名独占冲突：%s" % "；".join(conflict), s, 5))
    parts["风格边界"] = s

    # —— 轴玩法（轴循环 25 + 决策点 10 + 签名键 15 同源解析）——
    arows = sec.get("轴玩法", {}).get("rows") or []
    axes_def = (pathways.get(pid) or {}).get("axes") or {}
    loop_p = 0.0
    anchor_p = 0.0
    for ar in arows:
        flow = ar.get("产出→消费→清除") or ""
        if flow.count("→") >= 2 and all(x.strip() for x in flow.split("→")):
            loop_p += 1
        ok, why = _anchor_ok(ar.get("锚点(kind:id)"), status_ids)
        if ok:
            anchor_p += 1
        elif spec_nonempty(ar):
            deds.append(("轴循环", "轴 %s：%s" % (ar.get("轴"), why), 0, 0))
    n_ax = len(arows)
    loop_score = round(10 * loop_p / n_ax) if n_ax else 0
    anchor_score = round(10 * anchor_p / n_ax) if n_ax else 0
    plan_counts = []
    for ar in arows:
        v = (ar.get("计划卡数") or "").strip()
        plan_counts.append(int(v) if v.isdigit() else None)
    mix_total = None
    mix_rows = sec.get("角色配比", {}).get("rows") or []
    if mix_rows:
        # flagship 行是 core/trap 卡位的子集标记，不计入总卡数
        mix_total = sum(int(r.get("张数") or 0) for r in mix_rows
                        if (r.get("张数") or "").isdigit() and r.get("角色") != "flagship")
    count_ok = (None not in plan_counts and mix_total is not None
                and sum(plan_counts) == mix_total)
    parts["轴循环"] = loop_score + anchor_score + (5 if count_ok else 0)
    if not count_ok:
        deds.append(("轴循环", "计划卡数合计(%s) ≠ 角色配比合计(%s)"
                     % (sum(x for x in plan_counts if x), mix_total), 0, 5))

    # 决策点 10：每轴 ≥1 非黑名单 + 过黑名单率 ≥80%
    dp_rows = [(ar.get("轴"), (ar.get("玩家决策点") or "").strip()) for ar in arows]
    nonblack = [(a, t) for a, t in dp_rows if t and t not in DECISION_BLACKLIST]
    per_axis_ok = sum(1 for a, t in nonblack)
    dp1 = round(6 * per_axis_ok / n_ax) if n_ax else 0
    ratio = (len(nonblack) / len(dp_rows)) if dp_rows else 0
    dp2 = 4 if ratio >= 0.8 else round(4 * ratio / 0.8)
    parts["决策点"] = dp1 + dp2
    if dp1 + dp2 < 10:
        bad = [a for a, t in dp_rows if not t or t in DECISION_BLACKLIST]
        deds.append(("决策点", "黑名单/空决策点轴：%s（黑名单=打谁/有能量就打/无/—）" % ",".join(bad), dp1 + dp2, 10))

    # 签名键 15：逐键承诺 ≥2 卡位 3 分；卡位全部真实卡名再 2 分；封顶 15
    sig_keys = score.PATHWAY_SIGNATURES.get(pid, [])
    card_names = {c["name"] for c in (pathways.get(pid) or {}).get("cards") or []}
    commit = {}
    for ar in arows:
        for k, slots in _parse_sig_commit(ar.get("签名键承诺(键:卡位)")).items():
            commit.setdefault(k, []).extend(slots)
    parsed["sig_commit"] = commit
    sp = 0
    for k in sig_keys:
        slots = commit.get(k) or []
        if len(slots) >= 2:
            sp += 3
            if all(s0 in card_names for s0 in slots):
                sp += 2
            else:
                deds.append(("签名键", "键 %s 承诺卡位含非真实卡名：%s"
                             % (k, ",".join(s0 for s0 in slots if s0 not in card_names)), sp, 15))
        else:
            deds.append(("签名键", "键 %s 承诺卡位 %d 张（须 ≥2）" % (k, len(slots)), sp, 15))
    unknown = [k for k in commit if k not in sig_keys]
    if unknown:
        deds.append(("签名键", "承诺键不在本途径签名键表：%s" % ",".join(unknown), sp, 15))
    parts["签名键"] = min(15, sp)

    # —— 角色配比 15 ——
    mix = {r.get("角色"): r for r in mix_rows}
    role_counts = {k: int(v.get("张数") or 0) for k, v in mix.items() if (v.get("张数") or "").isdigit()}
    mp = 3 if count_ok else 0
    # 每轴 core≥1（轴玩法表角色配比列）
    if n_ax:
        core_ok = sum(1 for ar in arows if _parse_axis_roles(ar.get("角色配比")).get("core", 0) >= 1)
        mp += round(4 * core_ok / n_ax)
        if core_ok < n_ax:
            deds.append(("角色配比", "缺 core 的轴：%s"
                         % ",".join(ar.get("轴") for ar in arows
                                    if _parse_axis_roles(ar.get("角色配比")).get("core", 0) < 1), mp, 15))
    other5 = [r for r in ROLES if r != "core"]
    miss5 = [r for r in other5 if role_counts.get(r, 0) < 1]
    mp += 4 if not miss5 else round(4 * (len(other5) - len(miss5)) / len(other5))
    if miss5:
        deds.append(("角色配比", "途径级缺角色：%s（五角色途径各 ≥1）" % ",".join(miss5), mp, 15))
    total_mix = sum(role_counts.get(r, 0) for r in ROLES) or 1
    cap_ok = role_counts.get("generic", 0) <= 0.25 * total_mix and role_counts.get("trap", 0) <= 0.20 * total_mix
    mp += 2 if cap_ok else 0
    if not cap_ok:
        deds.append(("角色配比", "generic %.0f%% / trap %.0f%% 超上限（25%%/20%%）"
                     % (100 * role_counts.get("generic", 0) / total_mix,
                        100 * role_counts.get("trap", 0) / total_mix), mp, 15))
    flag_row = mix.get("flagship")
    core_trap_slots = set(_cells((mix.get("core") or {}).get("卡位"))) | set(_cells((mix.get("trap") or {}).get("卡位")))
    flag_slots = _cells(flag_row.get("卡位")) if flag_row else []
    if len(flag_slots) == 4 and all(s0 in core_trap_slots for s0 in flag_slots):
        mp += 2
    else:
        deds.append(("角色配比", "旗舰须恰 4 张且 ∈ core∪trap 卡位（当前 %d 张）" % len(flag_slots), mp, 15))
    bad_roles = [r for r in mix if r not in ROLES and r != "flagship"]
    if bad_roles:
        deds.append(("角色配比", "角色列含六值外行：%s" % ",".join(bad_roles), mp, 15))
    parts["角色配比"] = mp
    parsed["role_counts"] = role_counts

    # —— 钩子 10 ——
    xa = sec.get("跨轴钩子", {}).get("rows") or []
    xp = sec.get("跨系钩子", {}).get("rows") or []
    hp = 0
    if xa and not _is_declared_none(xa, "卡位"):
        bad_facet = [r for r in xa
                     if (r.get("概念") not in FACET_VOCAB
                         or r.get("facet") not in FACET_VOCAB.get(r.get("概念"), ()))]
        if not bad_facet:
            hp += 4
        else:
            deds.append(("钩子", "跨轴钩子 facet 词表外：%s"
                         % "；".join("%s:%s" % (r.get("概念"), r.get("facet")) for r in bad_facet), hp, 10))
        if len(xa) >= 3:
            hp += 3
        else:
            deds.append(("钩子", "跨轴钩子 %d 条（须 ≥3，或显式声明无）" % len(xa), hp, 10))
    elif _is_declared_none(xa, "卡位"):
        hp += 3   # 显式声明无：只给结构分，facet 4 分不可得
    if xp and not _is_declared_none(xp, "枢纽状态"):
        full = all((r.get("枢纽状态") and r.get("写入卡位") and r.get("读取卡位") and r.get("participants"))
                   for r in xp)
        hp += 3 if full else 1
        if not full:
            deds.append(("钩子", "跨系枢纽四格不齐（枢纽状态/写入卡位/读取卡位/participants）", hp, 10))
    elif _is_declared_none(xp, "枢纽状态"):
        hp += 3
    parts["钩子"] = hp

    for he in bp.get("header_errors") or []:
        deds.append(("格式", "「%s」节表头与固定表头不一致（须逐字匹配，见 WORKFLOW.md 玩法蓝图节）" % he, 0, 0))

    total = sum(parts.values())
    parsed["axes_rows"] = arows
    return total, parts, deds, parsed


def spec_nonempty(ar):
    return bool((ar.get("锚点(kind:id)") or "").strip())


def _real(text):
    """占位视为空（prefill 占位串不得白拿命题分）。"""
    t = (text or "").strip()
    return "" if t in DECISION_BLACKLIST else t


def _char_tokens(text):
    """中文词干粗切：按标点/括号/空白断词，供主签名维度对账。"""
    import re
    return [t for t in re.split(r"[（）()：:，,/、\s]+", text or "") if t]


# ---------- 兑现率对账 ----------


def _is_placeholder_name(name):
    """设计阶段占位串（「（待补强1卡）」「（无写入卡，待接线）」）：保留原文、不链空。"""
    return name.startswith(("（", "("))


def _card_ref(name, card_by_name):
    """卡位名 -> 站点可消费的引用：真实卡给 id；占位给 placeholder；错名给 missing。"""
    ref = {"name": name}
    card = card_by_name.get(name)
    if card:
        ref["id"] = card["id"]
    elif _is_placeholder_name(name):
        ref["id"] = None
        ref["placeholder"] = True
    else:
        ref["id"] = None
        ref["missing"] = True
    return ref


def _card_refs(text, card_by_name):
    """逗号分隔卡位串 -> 引用列表（跳过「无 / —」）。"""
    return [_card_ref(n, card_by_name) for n in _cells(text) if n not in ("无", "—", "-")]


def _names_in_order(names, text):
    """parse_pc_chain 返回集合；展示按其在原文中的出现位置定序（产物确定性）。"""
    return sorted(names, key=lambda n: (text.find(n), -len(n), n))


def build_card_index(pathways):
    """全库卡名索引：跨系钩子的写入/读取卡位常来自其他途径，不能只在本途径查。"""
    idx = {}
    for pid in sorted(pathways):
        for c in pathways[pid].get("cards") or []:
            idx.setdefault(c["name"], []).append(
                {"name": c["name"], "id": c["id"], "pathway": pid})
    return idx


def _cross_ref(name, current_pid, card_index, prefer_pids=()):
    """跨系卡位 -> 引用；优先本途径，再按 participants 顺序，最后按 pid 字典序。"""
    ref = {"name": name}
    cands = card_index.get(name) or []
    if cands:
        pick = None
        for pid in (current_pid,) + tuple(prefer_pids):
            pick = next((c for c in cands if c["pathway"] == pid), None)
            if pick:
                break
        pick = pick or cands[0]
        ref.update(pick)
    elif _is_placeholder_name(name):
        ref["id"] = None
        ref["placeholder"] = True
    else:
        ref["id"] = None
        ref["missing"] = True
    return ref


def _cross_refs(text, current_pid, card_index, prefer_pids=()):
    return [_cross_ref(n, current_pid, card_index, prefer_pids)
            for n in _cells(text) if n not in ("无", "—", "-")]


def signature_context(pathways, status_by_id):
    """signature_counts 的全参口径（与 score.py 主流程一致）。"""
    lineage_ids = {sid for sid, sd in status_by_id.items() if "lineageStack" in sd}
    casttime_ids = {sid for sid, sd in status_by_id.items()
                    if any(bm.get("op") == "cast_time_set" for bm in (sd.get("behaviorModifiers") or [])
                           if isinstance(bm, dict))}
    grow_ids = {sid for sid, sd in status_by_id.items() if sd.get("statPerStack")}
    return {"unit_type_of": score.load_unit_types(pathways),
            "lineage_ids": lineage_ids,
            "flag_status_index": {"cast_time_set": casttime_ids, "statPerStack": grow_ids}}


def reconcile(pid, bp, parsed, pathways, status_by_id, def_index, sig_ctx=None,
               card_index=None, card_by_id=None):
    """蓝图声明 vs 实际卡池（仅途径已有卡时有意义）。

    返回 {项: {hit, total, miss, rows}}；rows 逐行带 ok，供 blueprints.json 直接落盘
    （站点不重新判定）。旧产物消费方只取 hit/total/miss。"""
    d = pathways.get(pid) or {}
    cards = d.get("cards") or []
    if not cards:
        return None
    card_by_name = {c["name"]: c for c in cards}
    axes_def = d.get("axes") or {}
    sec = bp["sections"]
    if sig_ctx is None:
        sig_ctx = signature_context(pathways, status_by_id)
    out = {}

    # 锚点兑现：蓝图锚点 == skills axes 声明（anchor 或 statusId 简写）
    hit, tot, miss, rows = 0, 0, [], []
    for ar in parsed["axes_rows"]:
        spec = ar.get("锚点(kind:id)") or ""
        aid_ax = ar.get("轴")
        ax = axes_def.get(aid_ax)
        ax = ax if isinstance(ax, dict) else {}
        actual = ax.get("anchor") or ({"kind": "status", "id": ax.get("statusId")} if ax.get("statusId") else None)
        declared = None
        if ":" in spec:
            kind, _, aid = spec.partition(":")
            declared = {"kind": kind, "id": aid, "raw": spec}
            tot += 1
            if actual and actual.get("kind") == kind and actual.get("id") == aid:
                hit += 1
            else:
                miss.append("%s(蓝图%s ≠ 实际%s:%s)" % (
                    aid_ax, spec, (actual or {}).get("kind"), (actual or {}).get("id")))
        ok = bool(declared and actual and declared["kind"] == actual.get("kind")
                  and declared["id"] == actual.get("id"))
        rows.append({"axis": aid_ax, "declared": declared, "actual": actual, "ok": ok})
    out["锚点"] = {"hit": hit, "total": tot, "miss": miss, "rows": rows}

    # 签名键兑现：承诺键 signature_counts ≥2
    commit = parsed.get("sig_commit") or {}
    counts = score.signature_counts(cards, list(commit), **sig_ctx)
    hit, miss, rows = 0, [], []
    for key, slots in commit.items():
        empirical = counts.get(key, 0)
        ok = empirical >= 2
        if ok:
            hit += 1
        else:
            miss.append("%s(实证%d)" % (key, empirical))
        rows.append({"key": key, "slots": _card_refs(",".join(slots), card_by_name),
                     "empirical": empirical, "ok": ok})
    out["签名键"] = {"hit": hit, "total": len(commit), "miss": miss, "rows": rows}

    # 角色配比兑现：实际 role 计数 vs 声明；flagship 行对卡面 flagship 字段（不是 role）
    declared = parsed.get("role_counts") or {}
    if declared:
        actual = {}
        for c in cards:
            if c.get("role"):
                actual[c["role"]] = actual.get(c["role"], 0) + 1
        actual["flagship"] = sum(1 for c in cards if c.get("flagship"))
        hit, miss, rows = 0, [], []
        for r, n in declared.items():
            got = actual.get(r, 0)
            ok = got >= n
            if ok:
                hit += 1
            else:
                miss.append("%s(声明%d/实际%d)" % (r, n, got))
            rows.append({"role": r, "declared": n, "actual": got, "ok": ok})
        out["角色配比"] = {"hit": hit, "total": len(declared), "miss": miss, "rows": rows}

    # 跨轴钩子兑现：声明卡位卡面命中读轴 facet
    all_xa = sec.get("跨轴钩子", {}).get("rows") or []
    xa = [r for r in all_xa if r.get("卡位") not in (None, "无", "—")]
    if not xa and all_xa and _is_declared_none(all_xa, "卡位"):
        # 显式声明无：0/0 中性口径（不是缺失）
        out["跨轴钩子"] = {"hit": 0, "total": 0, "miss": [], "rows": []}
    if xa:
        axis_facets = {}
        for aid, ax in axes_def.items():
            if not isinstance(ax, dict):
                continue
            anchor = ax.get("anchor") or ({"kind": "status", "id": ax.get("statusId")} if ax.get("statusId") else None)
            axis_cards = [c for c in cards if c.get("axis") == aid]
            axis_facets[aid] = score.axis_mechanism_facets(axis_cards, anchor, status_by_id, def_index)
        hit, miss, rows = 0, [], []
        for r in xa:
            slot_text = r.get("卡位") or ""
            refs = _card_refs(slot_text, card_by_name)
            reason = ""
            if r.get("概念") == "status":
                # status 行：兑现 = 声明卡位引用读轴锚点状态（跨轴耦合口径①）
                tgt_ax = axes_def.get(r.get("读轴"))
                tgt_ax = tgt_ax if isinstance(tgt_ax, dict) else {}
                tgt_sid = tgt_ax.get("statusId") or (tgt_ax.get("anchor") or {}).get("id")
                ok = bool(tgt_sid) and any(
                    ref.get("id") and score.card_refs_status(card_by_name[ref["name"]], tgt_sid)
                    for ref in refs)
                if not ok:
                    reason = "读轴锚点状态缺失" if not tgt_sid else "卡位未引用读轴锚点状态"
            else:
                tgt = axis_facets.get(r.get("读轴")) or set()
                ok = False
                for ref in refs:
                    card = card_by_name.get(ref["name"])
                    if card and tgt and score.card_mechanism_facets(card, tgt, status_by_id, def_index):
                        ok = True
                        break
                if not ok:
                    reason = "读轴无 facet 实证" if not tgt else "卡位未实证读层"
            if not any(ref.get("id") for ref in refs):
                reason = "卡位为占位" if any(ref.get("placeholder") for ref in refs) else "卡位无真实卡"
            if ok:
                hit += 1
            else:
                miss.append("%s→%s" % (slot_text, r.get("读轴")))
            rows.append({"slot": slot_text, "slots": refs,
                         "slotId": next((ref["id"] for ref in refs if ref.get("id")), None),
                         "axis": r.get("读轴"), "concept": r.get("概念"), "facet": r.get("facet"),
                         "purpose": r.get("用途"), "ok": ok, "reason": reason})
        out["跨轴钩子"] = {"hit": hit, "total": len(xa), "miss": miss, "rows": rows}

    # 跨系枢纽兑现：hub crossPathway + 写入卡位真实且实证
    all_xp = sec.get("跨系钩子", {}).get("rows") or []
    xp = [r for r in all_xp if r.get("枢纽状态") not in (None, "无", "—")]
    if not xp and all_xp and _is_declared_none(all_xp, "枢纽状态"):
        out["跨系钩子"] = {"hit": 0, "total": 0, "miss": [], "rows": []}
    if xp:
        hit, miss, rows = 0, [], []
        for r in xp:
            hub = r.get("枢纽状态")
            sd = status_by_id.get(hub) or {}
            participants = _cells(r.get("participants"))
            if card_index is not None:
                writers = _cross_refs(r.get("写入卡位"), pid, card_index, participants)
                readers = _cross_refs(r.get("读取卡位"), pid, card_index, participants)
            else:
                writers = _card_refs(r.get("写入卡位"), card_by_name)
                readers = _card_refs(r.get("读取卡位"), card_by_name)

            def _refs_hub(refs):
                for ref in refs:
                    card = card_by_name.get(ref["name"]) or (card_by_id or {}).get(ref.get("id"))
                    if card and score.card_refs_status(card, hub):
                        return True
                return False

            w_ok = _refs_hub(writers)
            ok = bool(sd.get("crossPathway")) and w_ok
            reason = ""
            if not sd.get("crossPathway"):
                reason = "枢纽未标 crossPathway"
            elif not w_ok:
                reason = "写入卡位无实证"
            if ok:
                hit += 1
            else:
                miss.append("%s(crossPathway=%s,写入实证=%s)" % (hub, bool(sd.get("crossPathway")), w_ok))
            rows.append({"hub": hub, "hubName": sd.get("name") or hub,
                         "writers": writers, "readers": readers,
                         "participants": _cells(r.get("participants")),
                         "crossPathway": bool(sd.get("crossPathway")), "writeOk": w_ok,
                         "ok": ok, "reason": reason})
        out["跨系钩子"] = {"hit": hit, "total": len(xp), "miss": miss, "rows": rows}
    return out


# ---------- 站点机读产物 ----------


RUBRIC = {"命题": 10, "风格边界": 15, "轴循环": 25, "决策点": 10,
          "签名键": 15, "角色配比": 15, "钩子": 10}


def build_pathway_payload(pid, name, bp, total, parts, deds, parsed, pathways,
                          status_by_id, def_index, axis_scores, sig_ctx,
                          card_index=None, card_by_id=None):
    """单途径蓝图 -> blueprints.json 的一节（声明 + 实证 join + 逐行兑现）。"""
    d = pathways.get(pid) or {}
    cards = d.get("cards") or []
    card_by_name = {c["name"]: c for c in cards}
    axes_def = d.get("axes") or {}
    sec = bp["sections"]
    rec = reconcile(pid, bp, parsed, pathways, status_by_id, def_index, sig_ctx,
                    card_index, card_by_id)
    rec = rec or {}
    anchor_by_axis = {r["axis"]: r for r in (rec.get("锚点") or {}).get("rows") or []}
    sig_empirical = {r["key"]: r["empirical"] for r in (rec.get("签名键") or {}).get("rows") or []}

    prop = (sec.get("命题", {}).get("rows") or [{}])[0]
    style = (sec.get("风格边界", {}).get("rows") or [{}])[0]

    axes = []
    for ar in parsed["axes_rows"]:
        aid = ar.get("轴")
        ax = axes_def.get(aid)
        ax = ax if isinstance(ax, dict) else {}
        spec = ar.get("锚点(kind:id)") or ""
        anchor = None
        if ":" in spec:
            kind, _, anchor_id = spec.partition(":")
            anchor = {"kind": kind, "id": anchor_id, "raw": spec}
        flow = ar.get("产出→消费→清除") or ""
        segs = flow.split("→")
        produce = segs[0].strip() if len(segs) > 0 else ""
        consume = segs[1].strip() if len(segs) > 1 else ""
        clear = segs[2].strip() if len(segs) > 2 else ""
        prod_names, cons_names = parse_pc_chain(flow, set(card_by_name))
        axis_cards = [c for c in cards if c.get("axis") == aid]
        axis_roles = {}
        for c in axis_cards:
            if c.get("role"):
                axis_roles[c["role"]] = axis_roles.get(c["role"], 0) + 1
        plan_raw = (ar.get("计划卡数") or "").strip()
        signatures = []
        for key, slots in _parse_sig_commit(ar.get("签名键承诺(键:卡位)")).items():
            empirical = sig_empirical.get(key, 0)
            signatures.append({"key": key, "slots": _card_refs(",".join(slots), card_by_name),
                               "empirical": empirical, "ok": empirical >= 2})
        sc = (axis_scores.get(pid) or {}).get(aid) or {}
        anchor_row = anchor_by_axis.get(aid) or {}
        axes.append({
            "id": aid, "name": ax.get("name") or ar.get("名称") or aid,
            "symbol": ax.get("symbol") or "",
            "anchor": anchor,
            "loop": {"produce": produce, "consume": consume, "clear": clear,
                     "produceCards": [_card_ref(n, card_by_name) for n in _names_in_order(prod_names, produce)],
                     "consumeCards": [_card_ref(n, card_by_name) for n in _names_in_order(cons_names, consume)]},
            "decision": (ar.get("玩家决策点") or "").strip(),
            "signatures": signatures,
            "planCards": int(plan_raw) if plan_raw.isdigit() else None,
            "roleMixDeclared": _parse_axis_roles(ar.get("角色配比")),
            "actual": {"cards": len(axis_cards), "roleMix": axis_roles,
                       "anchorMatch": bool(anchor_row.get("ok")),
                       "enablers": sc.get("enablersVerified") or [],
                       "payoffs": sc.get("payoffsLanded") or [],
                       "payoffsNotes": sc.get("payoffsNotes") or [],
                       "axisScore": sc.get("total")},
        })

    role_counts = parsed.get("role_counts") or {}
    mix = {r.get("角色"): r for r in (sec.get("角色配比", {}).get("rows") or [])}
    actual_roles = {}
    for c in cards:
        if c.get("role"):
            actual_roles[c["role"]] = actual_roles.get(c["role"], 0) + 1
    actual_flag = [c for c in cards if c.get("flagship")]
    roles = []
    for role in ROLES:
        decl = role_counts.get(role, 0)
        got = actual_roles.get(role, 0)
        if not decl and not got and role not in mix:
            continue
        roles.append({
            "role": role, "declared": decl,
            "declaredSlots": _card_refs((mix.get(role) or {}).get("卡位"), card_by_name),
            "actual": got,
            "actualSlots": [{"name": c["name"], "id": c["id"]} for c in cards if c.get("role") == role],
        })
    flag_decl_raw = ((mix.get("flagship") or {}).get("张数") or "").strip()
    flag_slots = _card_refs((mix.get("flagship") or {}).get("卡位"), card_by_name)
    flagship = {"declared": int(flag_decl_raw) if flag_decl_raw.isdigit() else len(flag_slots),
                "actual": len(actual_flag), "slots": flag_slots,
                "actualSlots": [{"name": c["name"], "id": c["id"]} for c in actual_flag]}

    fulfillment = {item: {"hit": v["hit"], "total": v["total"], "miss": v["miss"]}
                   for item, v in rec.items()}
    xa_rows = sec.get("跨轴钩子", {}).get("rows") or []
    xp_rows = sec.get("跨系钩子", {}).get("rows") or []
    hooks = {
        "crossAxis": {"declaredNone": _is_declared_none(xa_rows, "卡位"),
                      "missing": "跨轴钩子" not in sec},
        "crossSystem": {"declaredNone": _is_declared_none(xp_rows, "枢纽状态"),
                        "missing": "跨系钩子" not in sec},
    }

    payload = {
        "id": pid, "name": name,
        "state": bp["meta"].get("state"), "date": bp["meta"].get("date"),
        "score": total, "scoreParts": dict(parts),
        "deductions": [{"dim": dim, "why": why} for dim, why, _got, _full in deds],
        "proposition": {"statement": prop.get("一句话命题") or "",
                        "variable": prop.get("可操作变量") or "",
                        "cost": prop.get("变量代价/输面") or ""},
        "style": {"signature": style.get("主签名维度") or "",
                  "mechanisms": _cells(style.get("使用的全局通用机制")),
                  "redline": style.get("红线来源") or ""},
        "axes": axes,
        "crossAxis": (rec.get("跨轴钩子") or {}).get("rows") or [],
        "crossSystem": (rec.get("跨系钩子") or {}).get("rows") or [],
        "roles": roles, "flagship": flagship,
        "hooks": hooks,
        "fulfillment": fulfillment,
    }
    return payload, rec


# ---------- 产物 ----------


def load_axis_scores():
    """scores.json 的 (pid, axis) -> 轴级实证（可能尚未生成；站点侧只读展示）。"""
    path = os.path.join(ANALYSIS_DIR, "scores.json")
    if not os.path.exists(path):
        return {}
    data = json.load(io.open(path, encoding="utf-8"))
    return {p["id"]: {a["id"]: a for a in p.get("axes") or []}
            for p in data.get("pathways") or []}


def main():
    pathways = score.load_skills()
    status_by_id = {}
    for _pid, _label, sd in score.iter_status_defs():
        status_by_id[sd["id"]] = sd
    status_ids = set(status_by_id)
    def_index = {}
    for _d in pathways.values():
        for _z in _d.get("zoneDefs") or []:
            def_index[_z["id"]] = _z
        for _m in _d.get("domainDefs") or []:
            def_index[_m["id"]] = _m
    identity_dims = load_identity_dims()
    manifest = json.load(io.open(os.path.join(score.JSON_DIR, "manifest.json"), encoding="utf-8"))
    pw_names = {p["id"]: p.get("name", p["id"]) for p in manifest.get("pathways", [])}
    sig_ctx = signature_context(pathways, status_by_id)
    axis_scores = load_axis_scores()
    card_index = build_card_index(pathways)
    card_by_id = {c["id"]: c for d in pathways.values() for c in d.get("cards") or []}

    paths_by_pid = {}
    for path in glob.glob(os.path.join(score.JSON_DIR, "*.skills.json")):
        pid = json.load(io.open(path, encoding="utf-8"))["pathwayId"]
        paths_by_pid[pid] = path
    # 产物行序固定为 manifest 途径序（站点总览/热图行序一致），未登记项按 id 追加
    order = [p["id"] for p in manifest.get("pathways", []) if p["id"] in paths_by_pid]
    order += sorted(set(paths_by_pid) - set(order))

    rows, fulfill, no_bp, payloads = [], {}, [], []
    for pid in order:
        bp_path = os.path.join(ROUNDS_DIR, pid + ".md")
        bp = parse_blueprint(bp_path) if os.path.exists(bp_path) else None
        if not bp:
            no_bp.append(pid)
            continue
        name = pw_names.get(pid, pid)
        total, parts, deds, parsed = score_blueprint(
            pid, bp, pathways, status_ids, identity_dims, name)
        rows.append({"id": pid, "name": name, "total": total,
                     "state": bp["meta"].get("state"), "parts": parts, "deds": deds})
        payload, rec = build_pathway_payload(
            pid, name, bp, total, parts, deds, parsed, pathways,
            status_by_id, def_index, axis_scores, sig_ctx, card_index, card_by_id)
        payloads.append(payload)
        if rec:
            fulfill[pid] = {"name": name, "items": rec}

    rows.sort(key=lambda r: r["total"])
    write_score_md(rows, no_bp)
    write_fulfillment(fulfill)
    write_blueprints_json(payloads)
    print("blueprint scored: %d 途径有蓝图 / %d 未建" % (len(rows), len(no_bp)))
    for r in rows:
        print("  %-18s %3d/100  %s" % (r["id"], r["total"], r.get("state") or ""))


def write_score_md(rows, no_bp):
    L = ["# 玩法蓝图评分（blueprint score）\n",
         "> 由 `docs/tools/blueprint_score.py` 自动生成——勿手改。rubric：命题 10 / 风格边界 15 / "
         "轴循环 25 / 决策点 10 / 签名键 15 / 角色配比 15 / 钩子 10；"
         "**蓝图评分永不进 score.py 100 分**（玩法轨隔离）。生成时间：%s。\n" % datetime.date.today(),
         "| # | 途径 | 蓝图分 | 状态 | 命题 | 风格边界 | 轴循环 | 决策点 | 签名键 | 角色配比 | 钩子 |",
         "|---:|---|---:|---|---:|---:|---:|---:|---:|---:|---:|"]
    DIMS = ("命题", "风格边界", "轴循环", "决策点", "签名键", "角色配比", "钩子")
    for i, r in enumerate(rows, 1):
        L.append("| %d | **%s** `%s` | **%d** | %s | %s |" % (
            i, r["name"], r["id"], r["total"], r.get("state") or "—",
            " | ".join(str(r["parts"][d0]) for d0 in DIMS)))
    L.append("")
    for r in rows:
        if not r["deds"]:
            continue
        L.append("\n## %s（%s）· %d 分\n" % (r["name"], r["id"], r["total"]))
        for dim, why, got, full in r["deds"]:
            L.append("- `%s` %s" % (dim, why))
        L.append("")
    if no_bp:
        L.append("\n## 未建蓝图（%d 条，回溯计划见 WORKFLOW.md「全库回溯计划」）\n" % len(no_bp))
        L.append("、".join("`%s`" % p for p in no_bp))
        L.append("")
    io.open(os.path.join(ANALYSIS_DIR, "blueprint_score.md"), "w", encoding="utf-8").write("\n".join(L))


def write_fulfillment(fulfill):
    L = ["# 玩法蓝图兑现率对账（blueprint fulfillment）\n",
         "> 由 `docs/tools/blueprint_score.py` 自动生成——勿手改。蓝图声明 vs 实际卡池；"
         "仅已有卡的途径参与。生成时间：%s。\n" % datetime.date.today()]
    data = {}
    for pid, rec in sorted(fulfill.items()):
        L.append("## %s（%s）\n" % (rec["name"], pid))
        L.append("| 对账项 | 兑现 | 未兑现明细 |")
        L.append("|---|---|---|")
        data[pid] = {}
        for item, it in rec["items"].items():
            hit, tot, miss = it["hit"], it["total"], it["miss"]
            pct = ("%d%%" % round(100 * hit / tot)) if tot else "—"
            L.append("| %s | %d/%d（%s） | %s |" % (item, hit, tot, pct, "；".join(miss) or "—"))
            data[pid][item] = {"hit": hit, "total": tot, "miss": miss}
        L.append("")
    io.open(os.path.join(ANALYSIS_DIR, "blueprint_fulfillment.md"), "w", encoding="utf-8").write("\n".join(L))
    io.open(os.path.join(ANALYSIS_DIR, "blueprint_fulfillment.json"), "w", encoding="utf-8").write(
        json.dumps({"generated": str(datetime.date.today()), "pathways": data}, ensure_ascii=False, indent=1))


def write_blueprints_json(payloads):
    """站点机读面：声明 + 实证 join + 逐行兑现（rounds/*.md 仍是声明正源，本文件是派生产物）。"""
    data = {"generated": str(datetime.date.today()),
            "standard": "docs/meta/WORKFLOW.md#玩法蓝图",
            "rubric": RUBRIC,
            "pathways": payloads}
    io.open(os.path.join(ANALYSIS_DIR, "blueprints.json"), "w", encoding="utf-8").write(
        json.dumps(data, ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main()
