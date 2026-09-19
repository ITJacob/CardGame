# -*- coding: utf-8 -*-
"""技能池 JSON 全库校验器。用法: python docs/tools/validate.py

封闭取值域以 docs/json/schema/skills.schema.json 为机器正源（运行时加载，不另抄一份）；
ddd 参数篇 / SCHEMA.md 文本侧与机器正源的漂移由 check_enum_sync.py 对账。
"""
import json, io, sys, glob, os, re

HERE = os.path.dirname(os.path.abspath(__file__))          # docs/tools/
JSON_DIR = os.path.join(os.path.dirname(HERE), "json")      # docs/json/
DEFS = json.load(io.open(os.path.join(JSON_DIR, "schema", "skills.schema.json"),
                         encoding="utf-8"))["$defs"]

try:
    from status_loader import iter_status_defs
except ImportError:
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    from status_loader import iter_status_defs

def _pat_literals(defn):
    """从 ^(a|b|动态段)$ 提取字面量分支；含正则语法的分支属动态段（$ 变量、resist 族），跳过。"""
    pat = defn["pattern"]
    assert pat.startswith("^(") and pat.endswith(")$"), pat
    body, alts, depth, cur, i = pat[2:-2], [], 0, "", 0
    while i < len(body):
        ch = body[i]
        if ch == "\\" and i + 1 < len(body):
            cur += body[i + 1]; i += 2; continue
        if ch == "(": depth += 1
        elif ch == ")": depth -= 1
        if ch == "|" and depth == 0: alts.append(cur); cur = ""
        else: cur += ch
        i += 1
    alts.append(cur)
    return {a for a in alts if not re.search(r"[\[\]()$*+?]", a)}

def _enum(*path):
    node = DEFS
    for k in path: node = node[k]
    return set(node["enum"])

ELEMENTS = _pat_literals(DEFS["element"])
STATS = _pat_literals(DEFS["effModifyStat"]["properties"]["stat"]) | {"resist:*"} | {"resist:" + e for e in ELEMENTS - {"none"}}
SORTS = _enum("sortKey")
REACH = _enum("card", "properties", "reach")
ACTION_LOCKS = _enum("actionLock")
CATS = _enum("statusCategory")
EFFECT_TARGETS = _enum("effectTarget")
RESOURCES = _enum("effModifyResource", "properties", "resource")
MOVE_OPS = _enum("effMove", "properties", "op")
DOMAIN_OPS = _enum("effDomain", "properties", "op")
TRANS_OPS = _enum("effTranslocate", "properties", "op")
SKILL_SELECTORS = _enum("effModifySkill", "properties", "skillRef", "properties", "selector")
TARGET_DIRECTIONS = _enum("effModifyTargetability", "properties", "direction")
TARGET_PIERCE = _enum("effModifyTargetability", "properties", "pierce")
REVEAL_SCOPES = _enum("effReveal", "properties", "scope")
CONTROL_EXPIRE = _enum("effTakeControl", "properties", "onExpire")
CONTROL_POLICY = _enum("effTakeControl", "properties", "actionPolicy")
PRIMS, OPS = set(), set()
for _r in DEFS["effect"]["oneOf"]:
    _props = DEFS[_r["$ref"].split("/")[-1]].get("properties", {})
    if "const" in _props.get("type", {}): PRIMS.add(_props["type"]["const"])
    if "const" in _props.get("op", {}): OPS.add(_props["op"]["const"])

# 全库合法 pathwayId（用于 crossPathway.participants 校验）
ALL_PIDS = set()
for _f in glob.glob(os.path.join(JSON_DIR, "*.skills.json")):
    try: ALL_PIDS.add(json.load(io.open(_f, encoding="utf-8")).get("pathwayId"))
    except Exception: pass
ALL_PIDS.discard(None)

# 维度乘区挂钩（dimHook）的维度值域：与 docs/ddd/params/源质维度与跨系枢纽.md §二 对齐
DIM_RANGES = {
    "secrecy": (0, 10),
    "order": (0, 10),
    "fate_value": (-10, 10),
}

# 触发点：语义封闭集 12 个（ddd 执行参数 §2.1）。schema triggerEvent 结构层额外放行
# on_status_gain，语义层强制 frameworkFlag 登记（SCHEMA.md §8）——两处不一致是有意为之。
EVENTS = {"on_apply","on_remove","on_tick","on_turn_start","on_battle_start","on_spawn","on_death","on_kill","on_attack","on_take_damage","on_deal_damage","on_active_skill"}
RARITY_BY_SEQ = lambda s: "common" if s>=8 else "uncommon" if s>=6 else "rare" if s>=4 else "epic" if s>=2 else "legendary"

# 命名治理：modifiers 为开放结构，同义异写严重。别名 -> 规范拼写（非阻断，仅告警引导收敛）
MODIFIER_ALIASES = {
    "damageTakenMul": "damage_taken_mul",
    "damageMul": "damage_mul",
    "damageDealtMul": "damage_mul",
    "damageDealtMulFilter": "damage_mul",
    "damage_mul_2": "damage_mul",
    "healReceivedMul": "heal_received_mul",
    "healInvert": "heal_invert",
    "untargetable": "untargetableByTargeted",
    "untargetableByAll": "untargetableByTargeted",
    "dispelOverride": "dispelableOverride",
    "dispelableOverwrite": "dispelableOverride",
    "runtimeDispelOverride": "dispelableOverride",
}
def main():
    m = json.load(io.open(os.path.join(JSON_DIR,'manifest.json'), encoding='utf-8'))
    CLOSED = set(m["statusIds"].values())
    expect = {p["id"]: p["cardCount"] for p in m["pathways"]}

    globs = set()
    files = sorted(glob.glob(os.path.join(JSON_DIR,'*.skills.json')))
    for f in files:
        d = json.load(io.open(f, encoding='utf-8'))
        for c in d.get("cards",[]):
            for sd in c.get("statusDefs") or []: globs.add(sd["id"])
    # 抽离后：状态定义权威源为 *.statuses.json（含 common）
    for f in sorted(glob.glob(os.path.join(JSON_DIR,'*.statuses.json'))):
        try:
            d = json.load(io.open(f, encoding='utf-8'))
            for sd in d.get("statusDefs") or []: globs.add(sd["id"])
        except Exception:
            pass
    ALLSTATUS = CLOSED | globs
    pre_errors, pre_warns = [], []   # 状态定义层 + 轴校验的前置收集（原代码引用了未定义的 errors/warns，属死代码 bug）

    # 状态定义层校验：*.statuses.json 中 statusDef 的 category / crossPathway.participants
    # （抽离前这部分在卡内联 statusDefs 上做，抽离后改到此处，避免校验真空）
    for f in sorted(glob.glob(os.path.join(JSON_DIR,'*.statuses.json'))):
        pid = os.path.basename(f).replace('.statuses.json','')
        try:
            d = json.load(io.open(f, encoding='utf-8'))
        except Exception:
            pre_errors.append("%s: 解析失败" % os.path.basename(f)); continue
        for sd in d.get("statusDefs") or []:
            cid = "%s:%s" % (pid, sd.get("id"))
            for cat in sd.get("category",[]) or []:
                if cat not in CATS: pre_errors.append("%s sd %s: bad category %s"%(cid,sd.get("id"),cat))
            if sd.get("crossPathway") is True:
                parts = sd.get("participants")
                if not isinstance(parts,list) or not parts:
                    pre_errors.append("%s sd %s: crossPathway=true 但 participants 为空/缺失"%(cid,sd.get("id")))
                else:
                    for p in parts:
                        if p not in ALL_PIDS:
                            pre_errors.append("%s sd %s: participants 含非法 pathwayId '%s'"%(cid,sd.get("id"),p))
            elif sd.get("participants"):
                pre_warns.append("%s sd %s: 有 participants 但未标 crossPathway=true"%(cid,sd.get("id")))

    # 构筑轴身份状态可解析性 Gate（2026-09-20 新增）
    # axes.<axis>.statusId 属 schema 可选字段，此前无任何校验，长期积累悬空引用。
    # 约定：未填（None）= 该轴无身份状态，合法；一旦填写必须能在全库 statusDef 中解析到。
    for f in files:
        pid = os.path.basename(f).replace('.skills.json', '')
        try:
            _d = json.load(io.open(f, encoding='utf-8'))
        except Exception:
            continue
        for aid, ax in (_d.get("axes") or {}).items():
            sid = ax.get("statusId")
            if sid is None:
                continue
            if sid not in ALLSTATUS:
                pre_errors.append("%s axis %s: statusId '%s' 无法解析到任何 statusDef（悬空引用）" % (pid, aid, sid))


    errors_all, warns_all = [], []
    errors_all += pre_errors
    warns_all += pre_warns
    flagged_gaps = []  # frameworkFlags 已登记的缺口（非标准 event/fallbackSort），不再逐条 warn
    total_cards = 0

    def walk(effs, cid, path, flags, errors, warns):
        for i, e in enumerate(effs or []):
            p = "%s.%d" % (path, i)
            t = e.get("type")
            if t is None:
                op = e.get("op")
                if op not in OPS: errors.append("%s %s: bad operator %s" % (cid,p,op)); continue
                if op in ("sequence","repeat"): walk(e.get("steps"), cid, p, flags, errors, warns)
                else:
                    walk(e.get("then"), cid, p+".then", flags, errors, warns)
                    walk(e.get("else"), cid, p+".else", flags, errors, warns)
                continue
            if t not in PRIMS: errors.append("%s %s: bad primitive %s" % (cid,p,t)); continue
            if t=="modify_skill":
                sr = e.get("skillRef") or {}
                if sr.get("selector") not in SKILL_SELECTORS:
                    errors.append("%s %s: bad modify_skill.skillRef.selector %s" % (cid,p,sr.get("selector")))
            if t=="modify_status":
                if not e.get("statusId"): errors.append("%s %s: modify_status missing statusId" % (cid,p))
                if e.get("target") not in EFFECT_TARGETS: errors.append("%s %s: bad modify_status.target %s" % (cid,p,e.get("target")))
            if t=="modify_targetability":
                if e.get("target") not in EFFECT_TARGETS: errors.append("%s %s: bad modify_targetability.target %s" % (cid,p,e.get("target")))
                if e.get("direction") is not None and e["direction"] not in TARGET_DIRECTIONS:
                    errors.append("%s %s: bad modify_targetability.direction %s" % (cid,p,e["direction"]))
                if e.get("pierce") is not None and e["pierce"] not in TARGET_PIERCE:
                    errors.append("%s %s: bad modify_targetability.pierce %s" % (cid,p,e["pierce"]))
            if t=="reveal":
                if e.get("target") not in EFFECT_TARGETS: errors.append("%s %s: bad reveal.target %s" % (cid,p,e.get("target")))
                if e.get("scope") is not None and e["scope"] not in REVEAL_SCOPES:
                    errors.append("%s %s: bad reveal.scope %s" % (cid,p,e["scope"]))
            if t=="grant_immunity":
                if e.get("target") not in EFFECT_TARGETS: errors.append("%s %s: bad grant_immunity.target %s" % (cid,p,e.get("target")))
                for cat in e.get("against") or []:
                    if cat not in CATS: errors.append("%s %s: bad grant_immunity.against %s" % (cid,p,cat))
                el = e.get("element")
                if el is not None and el not in ELEMENTS and not str(el).startswith("$"):
                    errors.append("%s %s: bad grant_immunity.element %s" % (cid,p,el))
            if t=="take_control":
                if e.get("target") not in EFFECT_TARGETS: errors.append("%s %s: bad take_control.target %s" % (cid,p,e.get("target")))
                if e.get("onExpire") is not None and e["onExpire"] not in CONTROL_EXPIRE:
                    errors.append("%s %s: bad take_control.onExpire %s" % (cid,p,e["onExpire"]))
                if e.get("actionPolicy") is not None and e["actionPolicy"] not in CONTROL_POLICY:
                    errors.append("%s %s: bad take_control.actionPolicy %s" % (cid,p,e["actionPolicy"]))
            el = e.get("element")
            if el is not None and el not in ELEMENTS and not str(el).startswith("$"):
                errors.append("%s %s: bad element %s"%(cid,p,el))
            if t=="modify_stat":
                st = e.get("stat")
                if st not in STATS and not str(st).startswith("resist:$"):
                    errors.append("%s %s: bad stat %s"%(cid,p,st))
            if t=="modify_resource" and e.get("resource") not in RESOURCES:
                errors.append("%s %s: bad resource %s"%(cid,p,e.get("resource")))
            if t=="mount_status":
                sid = e.get("statusId")
                if not sid: errors.append("%s %s: mount_status missing statusId"%(cid,p))
                elif sid != "$self" and sid not in ALLSTATUS:
                    errors.append("%s %s: unknown statusId %s"%(cid,p,sid))
            if t=="move" and e.get("op") not in MOVE_OPS: errors.append("%s %s: bad move.op %s"%(cid,p,e.get("op")))
            if t=="domain" and e.get("op") not in DOMAIN_OPS: errors.append("%s %s: bad domain.op %s"%(cid,p,e.get("op")))
            if t=="translocate" and e.get("op") not in TRANS_OPS: errors.append("%s %s: bad translocate.op %s"%(cid,p,e.get("op")))
            if t=="dispel":
                for cat in e.get("filter",{}).get("category",[]) or []:
                    if cat not in CATS: errors.append("%s %s: bad dispel category %s"%(cid,p,cat))

    def trigs(trs, cid, path, flags, errors, warns):
        for i,tr in enumerate(trs or []):
            ev = tr.get("event")
            if ev not in EVENTS:
                if flags: flagged_gaps.append("%s %s.%d: nonstandard event %s"%(cid,path,i,ev))
                else: errors.append("%s %s.%d: bad event %s"%(cid,path,i,ev))
            walk(tr.get("effects"), cid, "%s.t%d"%(path,i), flags, errors, warns)

    for f in files:
        d = json.load(io.open(f, encoding='utf-8'))
        pid = d.get("pathwayId", os.path.basename(f))
        errors, warns = [], []
        cards = d.get("cards", [])
        total_cards += len(cards)
        if pid in expect and len(cards) != expect[pid]:
            errors.append("card count %d != manifest %d" % (len(cards), expect[pid]))
        ids = set()
        names = {}  # 卡名 -> kind，供 sampleBuilds 交叉校验
        for c in cards:
            cid = c.get("id","?")
            if cid in ids: errors.append("dup id %s"%cid)
            ids.add(cid)
            nm = c.get("name")
            if nm is not None: names[nm] = c.get("kind")
            flags = c.get("frameworkFlags") or []
            for fld in ("id","name","kind","sequence","sequenceName","rarity","axis","lore","flavor","describe","effects"):
                if fld not in c: errors.append("%s: missing %s"%(cid,fld))
            if "rarity" in c and "sequence" in c and c["rarity"] != RARITY_BY_SEQ(c["sequence"]):
                errors.append("%s: rarity mismatch (seq %s, %s)"%(cid,c["sequence"],c["rarity"]))
            if c.get("kind")=="active":
                if "cost" not in c or "reach" not in c or "target" not in c:
                    errors.append("%s: active incomplete"%cid)
                elif c["reach"] not in REACH: errors.append("%s: bad reach"%cid)
                fs = (c.get("target") or {}).get("fallbackSort")
                if fs and fs not in SORTS:
                    if flags: flagged_gaps.append("%s: nonstandard fallbackSort %s"%(cid,fs))
                    else: errors.append("%s: bad fallbackSort %s"%(cid,fs))
                if (c.get("target") or {}).get("selectionMode")=="manual" and not fs:
                    warns.append("%s: manual but fallbackSort null"%cid)
            elif c.get("kind")=="passive":
                if c.get("hook") not in EVENTS: errors.append("%s: bad hook %s"%(cid,c.get("hook")))
            else: errors.append("%s: bad kind"%cid)
            walk(c.get("effects"), cid, "eff", flags, errors, warns)
            for t in (c.get("upgradeLadder") or {}).get("tiers",[]): walk(t.get("effects"), cid, "lad", flags, errors, warns)
            for v in c.get("variants") or []: walk(v.get("effects"), cid, "var", flags, errors, warns)
            trigs(c.get("triggers"), cid, "card", flags, errors, warns)
            for sd in c.get("statusDefs") or []:
                for cat in sd.get("category",[]) or []:
                    if cat not in CATS: errors.append("%s sd %s: bad category %s"%(cid,sd.get("id"),cat))
                # crossPathway 枢纽白名单：crossPathway=true 必须带非空且合法的 participants
                if sd.get("crossPathway") is True:
                    parts = sd.get("participants")
                    if not isinstance(parts, list) or not parts:
                        errors.append("%s sd %s: crossPathway=true 但 participants 为空/缺失"%(cid, sd.get("id")))
                    else:
                        for p in parts:
                            if p not in ALL_PIDS:
                                errors.append("%s sd %s: participants 含非法 pathwayId '%s'"%(cid, sd.get("id"), p))
                elif sd.get("participants"):
                    warns.append("%s sd %s: 有 participants 但未标 crossPathway=true"%(cid, sd.get("id")))
                for a in sd.get("disallowActions") or []:
                    if a not in ACTION_LOCKS: errors.append("%s sd %s: bad disallowActions %s"%(cid,sd.get("id"),a))
                # 命名治理：modifiers 开放结构内的同义异写，告警引导收敛到规范拼写
                mods = sd.get("modifiers")
                mkeys = list(mods.keys()) if isinstance(mods, dict) else \
                        [k for it in (mods or []) if isinstance(it, dict) for k in it]
                for k in mkeys:
                    if k in MODIFIER_ALIASES:
                        warns.append("%s sd %s: modifier '%s' 建议收敛为 '%s'"%(cid, sd.get("id"), k, MODIFIER_ALIASES[k]))
                walk(sd.get("effects"), cid, "sd:"+sd.get("id","?"), flags, errors, warns)
                trigs(sd.get("triggers"), cid, "sd:"+sd.get("id","?"), flags, errors, warns)
                walk((sd.get("thresholdTrigger") or {}).get("effects"), cid, "sd:"+sd.get("id","?")+".tt", flags, errors, warns)
            if c.get("domainDef"): trigs(c["domainDef"].get("triggers"), cid, "dd", flags, errors, warns)
            flat = json.dumps(c.get("effects",[]), ensure_ascii=False)
            if ('"domain"' in flat or '"translocate"' in flat) and '"lost"' not in flat:
                errors.append("%s: domain/translocate without lost rent"%cid)
            # 维度乘区挂钩 Gate：dim 须为已注册维度、threshold 在值域内、mul>0；mul 越界给非阻断告警
            for h in (c.get("dimHooks") or []):
                dim = h.get("dim")
                if dim not in DIM_RANGES:
                    errors.append("%s: dimHooks.dim '%s' 非法（须为 secrecy/order/fate_value）"%(cid, dim))
                    continue
                lo, hi = DIM_RANGES[dim]
                th = h.get("threshold")
                if not isinstance(th, (int, float)) or th < lo or th > hi:
                    errors.append("%s: dimHooks threshold %s 越出 %s 值域 [%s,%s]"%(cid, th, dim, lo, hi))
                mu = h.get("mul")
                if not isinstance(mu, (int, float)) or mu <= 0:
                    errors.append("%s: dimHooks mul %s 须为正"%(cid, mu))
                elif mu < 0.8 or mu > 1.5:
                    # 越界但有 note 兜底（如已登记的 D2 占位 fate_value≤−5 ×2.0）视为有意，不再告警
                    if not h.get("note"):
                        warns.append("%s: dimHooks mul %s 越出建议区间 0.8–1.5（平衡期需 note 说明）"%(cid, mu))
        # ---- sampleBuilds 交叉校验：示例卡组可信化 ----
        # 每个 Build 须 4 主动 + 4 被动，所列卡名必须存在于本文件 cards[]，
        # 且 actives 只能指 kind=active 的卡、passives 只能指 kind=passive 的卡。
        # 目的：让 sampleBuilds 从「会漂的设计说明」变为「被 Gate 兜住的示例卡组」。
        sb = d.get("sampleBuilds")
        if sb is not None:
            for bi, b in enumerate(sb):
                bn = b.get("name","?")
                for slot, exp_kind in (("actives","active"),("passives","passive")):
                    arr = b.get(slot) or []
                    if len(arr) != 4:
                        errors.append("sampleBuilds[%d] '%s': %s 应有 4 张，实际 %d 张"%(bi,bn,slot,len(arr)))
                    for nm in arr:
                        cd = names.get(nm)
                        if cd is None:
                            errors.append("sampleBuilds[%d] '%s': %s 卡名 '%s' 不在本文件 cards[]"%(bi,bn,slot,nm))
                        elif cd != exp_kind:
                            errors.append("sampleBuilds[%d] '%s': %s 卡名 '%s' 是 kind=%s，非预期 %s"%(bi,bn,slot,nm,cd,exp_kind))
        for e in errors: print("  E:", pid, e)
        for w in warns: print("  W:", pid, w)
        errors_all += [pid+": "+e for e in errors]
        warns_all += warns

    for e in pre_errors: print("  E:", e)
    for w in pre_warns: print("  W:", w)
    print("-"*60)
    print("TOTAL cards:", total_cards, "| errors:", len(errors_all), "| warns:", len(warns_all))
    if flagged_gaps:
        print("已登记缺口（frameworkFlags）%d 项，不再逐条告警：" % len(flagged_gaps))
        for g in flagged_gaps: print("  F:", g)
    return 1 if errors_all else 0

if __name__ == "__main__":
    sys.exit(main())
