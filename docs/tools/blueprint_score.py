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

SECTIONS = {
    "命题": ["一句话命题", "可操作变量", "变量代价/输面"],
    "风格边界": ["主签名维度", "使用的全局通用机制", "红线来源"],
    "轴玩法": ["轴", "名称", "锚点(kind:id)", "产出→消费→清除", "玩家决策点", "签名键承诺(键:卡位)", "计划卡数", "角色配比"],
    "跨轴钩子": ["卡位", "读轴", "概念", "facet", "用途"],
    "跨系钩子": ["枢纽状态", "写入卡位", "读取卡位", "participants"],
    "角色配比": ["角色", "张数", "卡位"],
}

STATES = ("草案", "已拍板", "回溯补登")


# ---------- 解析 ----------


def _split_row(line):
    """管道表格行 -> 去空白单元格列表。"""
    return [c.strip() for c in line.strip().strip("|").split("|")]


def _is_sep(cells):
    return all(set(c) <= set("-: ") and c for c in cells)


def parse_blueprint(path):
    """状态机解析 rounds 文件的玩法蓝图章。返回 {state, date, score_line, sections: {节名: [行 dict]}}；
    无蓝图章返回 None。表头不匹配记 header_errors。"""
    lines = io.open(path, encoding="utf-8").read().splitlines()
    start = None
    for i, ln in enumerate(lines):
        if ln.startswith("## 玩法蓝图"):
            start = i
            break
    if start is None:
        return None
    title = lines[start]
    meta = {"state": None, "date": None}
    if "（" in title and "）" in title:
        seg = title[title.index("（") + 1:title.rindex("）")]
        parts = [p.strip() for p in seg.split("·")]
        if parts and parts[0] in STATES:
            meta["state"] = parts[0]
        if len(parts) > 1:
            meta["date"] = parts[1]

    sections, header_errors = {}, []
    cur = None
    i = start + 1
    while i < len(lines):
        ln = lines[i]
        if ln.startswith("## ") and not ln.startswith("###"):
            break
        if ln.startswith("### "):
            cur = ln[4:].strip()
            # 节名允许带行内说明：### 命题 | 一句话命题 | ...（表头写在节标题行）或下两行表格
            rest = cur
            for name in SECTIONS:
                if cur == name or cur.startswith(name + " ") or cur.startswith(name + "|"):
                    cur = name
                    rest = ln[4 + len(name):]
                    break
            if cur in SECTIONS and cur not in sections:
                sections[cur] = {"rows": [], "header_ok": None}
                if "|" in rest:   # 表头与节标题同行
                    hdr = _split_row(rest)
                    sections[cur]["header_ok"] = hdr[:len(SECTIONS[cur])] == SECTIONS[cur]
                    if not sections[cur]["header_ok"]:
                        header_errors.append(cur)
            elif cur not in SECTIONS:
                cur = None
            i += 1
            continue
        if cur and ln.strip().startswith("|"):
            cells = _split_row(ln)
            if _is_sep(cells):
                i += 1
                continue
            sec = sections[cur]
            if sec["header_ok"] is None:
                sec["header_ok"] = cells[:len(SECTIONS[cur])] == SECTIONS[cur]
                if not sec["header_ok"]:
                    header_errors.append(cur)
                i += 1
                continue
            if any(cells):
                row = dict(zip(SECTIONS[cur], cells))
                sec["rows"].append(row)
        i += 1
    return {"meta": meta, "sections": sections, "header_errors": header_errors}


def _cells(text):
    """单元格内半角逗号列表。"""
    return [x.strip() for x in (text or "").split(",") if x.strip()]


def _parse_sig_commit(text):
    """签名键承诺单元格 -> {键: [卡位]}。格式 `prim:translocate:卡A,卡B;elem:ice:卡C`。"""
    out = {}
    for seg in (text or "").split(";"):
        seg = seg.strip()
        if not seg or ":" not in seg:
            continue
        key, _, slots = seg.rpartition(":")
        out[key.strip()] = _cells(slots)
    return out


def _parse_axis_roles(text):
    """轴角色配比列 -> {角色: 数量}。格式 `core×2,generic×1`。"""
    out = {}
    for seg in _cells(text):
        if "×" in seg:
            r, _, n = seg.partition("×")
            if r.strip() and n.strip().isdigit():
                out[r.strip()] = int(n.strip())
    return out


def _is_declared_none(rows, first_col):
    """显式声明无：只一行且首格为「无」。"""
    return len(rows) == 1 and rows[0].get(first_col) in ("无", "—")


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


def reconcile(pid, bp, parsed, pathways, status_by_id, def_index):
    """蓝图声明 vs 实际卡池（仅途径已有卡时有意义）。返回 {项: (兑现, 总数, 明细)}。"""
    d = pathways.get(pid) or {}
    cards = d.get("cards") or []
    if not cards:
        return None
    card_by_name = {c["name"]: c for c in cards}
    axes_def = d.get("axes") or {}
    out = {}

    # 锚点兑现：蓝图锚点 == skills axes 声明（anchor 或 statusId 简写）
    hit, tot, miss = 0, 0, []
    for ar in parsed["axes_rows"]:
        spec = ar.get("锚点(kind:id)") or ""
        if ":" not in spec:
            continue
        tot += 1
        kind, _, aid = spec.partition(":")
        aid_ax = ar.get("轴")
        ax = axes_def.get(aid_ax) or {}
        actual = ax.get("anchor") or ({"kind": "status", "id": ax.get("statusId")} if ax.get("statusId") else {})
        if actual.get("kind") == kind and actual.get("id") == aid:
            hit += 1
        else:
            miss.append("%s(蓝图%s ≠ 实际%s:%s)" % (aid_ax, spec, actual.get("kind"), actual.get("id")))
    out["锚点"] = (hit, tot, miss)

    # 签名键兑现：承诺键 signature_counts ≥2
    sig_keys = score.PATHWAY_SIGNATURES.get(pid, [])
    counts = score.signature_counts(cards, sig_keys, unit_type_of=score.load_unit_types(pathways))
    commit = parsed.get("sig_commit") or {}
    hit = sum(1 for k in commit if counts.get(k, 0) >= 2)
    out["签名键"] = (hit, len(commit), ["%s(实证%d)" % (k, counts.get(k, 0)) for k in commit if counts.get(k, 0) < 2])

    # 角色配比兑现：实际 role 计数 vs 声明；flagship 行对卡面 flagship 字段（不是 role）
    declared = parsed.get("role_counts") or {}
    if declared:
        actual = {}
        for c in cards:
            if c.get("role"):
                actual[c["role"]] = actual.get(c["role"], 0) + 1
        actual["flagship"] = sum(1 for c in cards if c.get("flagship"))
        hit = sum(1 for r, n in declared.items() if actual.get(r, 0) >= n)
        out["角色配比"] = (hit, len(declared),
                         ["%s(声明%d/实际%d)" % (r, n, actual.get(r, 0))
                          for r, n in declared.items() if actual.get(r, 0) < n])

    # 跨轴钩子兑现：声明卡位卡面命中读轴 facet
    sec = bp["sections"]
    xa = [r for r in (sec.get("跨轴钩子", {}).get("rows") or []) if r.get("卡位") not in (None, "无", "—")]
    if xa:
        axis_facets = {}
        for aid, ax in axes_def.items():
            if not isinstance(ax, dict):
                continue
            anchor = ax.get("anchor") or ({"kind": "status", "id": ax.get("statusId")} if ax.get("statusId") else None)
            axis_cards = [c for c in cards if c.get("axis") == aid]
            axis_facets[aid] = score.axis_mechanism_facets(axis_cards, anchor, status_by_id, def_index)
        hit, miss = 0, []
        for r in xa:
            if r.get("概念") == "status":
                # status 行：兑现 = 声明卡位引用读轴锚点状态（跨轴耦合口径①）
                tgt_ax = axes_def.get(r.get("读轴")) or {}
                tgt_sid = tgt_ax.get("statusId") or (tgt_ax.get("anchor") or {}).get("id")
                ok = bool(tgt_sid) and any(
                    score.card_refs_status(card_by_name[s0], tgt_sid)
                    for s0 in _cells(r.get("卡位")) if s0 in card_by_name)
            else:
                tgt = axis_facets.get(r.get("读轴")) or set()
                ok = False
                for slot in _cells(r.get("卡位")):
                    c = card_by_name.get(slot)
                    if c and tgt and score.card_mechanism_facets(c, tgt, status_by_id, def_index):
                        ok = True
                        break
            if ok:
                hit += 1
            else:
                miss.append("%s→%s" % (r.get("卡位"), r.get("读轴")))
        out["跨轴钩子"] = (hit, len(xa), miss)

    # 跨系枢纽兑现：hub crossPathway + 写入/读取卡位真实且实证
    xp = [r for r in (sec.get("跨系钩子", {}).get("rows") or []) if r.get("枢纽状态") not in (None, "无", "—")]
    if xp:
        hit, miss = 0, []
        for r in xp:
            hub = r.get("枢纽状态")
            sd = status_by_id.get(hub) or {}
            writers = [s0 for s0 in _cells(r.get("写入卡位")) if s0 in card_by_name]
            w_ok = any(score.card_refs_status(card_by_name[s0], hub) for s0 in writers)
            if sd.get("crossPathway") and w_ok:
                hit += 1
            else:
                miss.append("%s(crossPathway=%s,写入实证=%s)" % (hub, bool(sd.get("crossPathway")), w_ok))
        out["跨系钩子"] = (hit, len(xp), miss)
    return out


# ---------- 产物 ----------


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

    rows, fulfill, no_bp = [], {}, []
    for path in sorted(glob.glob(os.path.join(score.JSON_DIR, "*.skills.json"))):
        pid = json.load(io.open(path, encoding="utf-8"))["pathwayId"]
        bp_path = os.path.join(ROUNDS_DIR, pid + ".md")
        bp = parse_blueprint(bp_path) if os.path.exists(bp_path) else None
        if not bp:
            no_bp.append(pid)
            continue
        total, parts, deds, parsed = score_blueprint(
            pid, bp, pathways, status_ids, identity_dims, pw_names.get(pid, pid))
        rows.append({"id": pid, "name": pw_names.get(pid, pid), "total": total,
                     "state": bp["meta"].get("state"), "parts": parts, "deds": deds})
        rec = reconcile(pid, bp, parsed, pathways, status_by_id, def_index)
        if rec:
            fulfill[pid] = {"name": pw_names.get(pid, pid), "items": rec}

    rows.sort(key=lambda r: r["total"])
    write_score_md(rows, no_bp)
    write_fulfillment(fulfill)
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
        for item, (hit, tot, miss) in rec["items"].items():
            pct = round(100 * hit / tot) if tot else 0
            L.append("| %s | %d/%d（%d%%） | %s |" % (item, hit, tot, pct, "；".join(miss) or "—"))
            data[pid][item] = {"hit": hit, "total": tot, "miss": miss}
        L.append("")
    io.open(os.path.join(ANALYSIS_DIR, "blueprint_fulfillment.md"), "w", encoding="utf-8").write("\n".join(L))
    io.open(os.path.join(ANALYSIS_DIR, "blueprint_fulfillment.json"), "w", encoding="utf-8").write(
        json.dumps({"generated": str(datetime.date.today()), "pathways": data}, ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main()
