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
    "luminance": (0, 10),
    "death_tally": (0, 10),
}

# 触发点：语义封闭集 13 个（ddd 执行参数 §2.1）。schema triggerEvent 结构层额外放行
# on_status_gain，语义层强制 frameworkFlag 登记（SCHEMA.md §8）——两处不一致是有意为之。
PHASES = {"midnight","dawn","day","dusk","night"}
EVENTS = {"on_apply","on_remove","on_tick","on_turn_start","on_battle_start","on_spawn","on_death","on_kill","on_attack","on_take_damage","on_deal_damage","on_active_skill","on_phase_change","on_status_gain"}

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
# 修饰键正典集：词典 modifierKey 栏目（2026-10-02 治理批新建）。
# 开放结构不变，但新键须先登记词条——未登记键给非阻断告警，与别名收敛同一出口。
def _load_modifier_canon():
    p = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'meta', 'glossary.json')
    try:
        g = json.load(io.open(p, encoding='utf-8'))
        return set(((g.get('categories') or {}).get('modifierKey') or {}).get('terms') or {})
    except Exception:
        return set()
MODIFIER_CANON = _load_modifier_canon()

def check_mod_keys(mods, cid, warns):
    if isinstance(mods, dict):
        mkeys = list(mods.keys())
    elif isinstance(mods, list):
        mkeys = [it if isinstance(it, str) else it.get('kind') for it in mods if isinstance(it, (str, dict))]
    else:
        return
    for k in mkeys:
        if not k:
            continue
        if k in MODIFIER_ALIASES:
            warns.append("%s: modifier '%s' 建议收敛为 '%s'" % (cid, k, MODIFIER_ALIASES[k]))
        elif MODIFIER_CANON and k not in MODIFIER_CANON:
            warns.append("%s: modifier '%s' 未登记（先补词典 modifierKey 词条）" % (cid, k))
# ---- 描述↔元素一致性 Gate（2026-10-07 新增）----
# 背景：describe 里的元素措辞曾与效果结构的 element 字段脱节——例如描述写「2 点精神伤害」
#   而结构里 damage.element 是 dark。结构为权威源，描述须与之一致。
# 规则：describe 内「N 点<中文元素>伤害」（以及界域 prose 的 damage(<element>, N)）声称的每个
#   元素，都必须出现在该卡能造成的伤害元素集合里——集合含经 statusId / unitId / template /
#   def / zone 引用解析到的定义（unitDef/zoneDef/domainDef/statusDef，递归至 3 层）。
#   · 不符 → 报错（阻断 Gate）。
#   · 结构内解析不到任何 damage，或含 '$' 动态元素 → 只告警（池外内联 / 未编码，无法核验）。
#   · 叙事字段（flavor/lore/note/conversionNotes/designNote/envRulesText）与编目三池定义 → 一律告警。
_ELEM_ZH = {
    "fire": ("火焰", "烈焰"),
    "ice": ("冰霜", "冰冻", "寒冰"),
    "poison": ("剧毒", "毒素", "中毒"),
    "lightning": ("闪电", "雷电", "雷霆"),
    "mental": ("精神", "心灵", "意志"),
    "physical": ("物理",),
    "holy": ("神圣", "圣光", "光明"),
    "dark": ("暗黑", "黑暗", "暗影", "暗焰", "暗伤"),
    "none": ("无属性",),
}
_ZH2ELEM = {}
for _el, _zhs in _ELEM_ZH.items():
    for _z in _zhs:
        _ZH2ELEM.setdefault(_z, set()).add(_el)
_CLAIM_RE = re.compile(r"\d+\s*点\s*([一-龥]{1,3}?)\s*伤害")
_PROSE_RE = re.compile(r"damage\(\s*([a-z_]+)\s*,")
# 只对规范字段设卡：describe / envRulesText 不符即报错；flavor 属叙事，不符只告警。
# 其余字段（note / conversionNotes / designNote / 升级档 note 等）是设计过程注解，含历史值与
# 有意保留的变迁记录，不参与扫描，避免永久噪音。
_STRICT_FIELDS = ("describe", "envRulesText")
_NARRATIVE_FIELDS = ("flavor",)


def _walk(o):
    if isinstance(o, dict):
        yield o
        for v in o.values(): yield from _walk(v)
    elif isinstance(o, list):
        for v in o: yield from _walk(v)


def _strings(o, key=None):
    """产出 (最近的字典键, 字符串值)。用于区分 describe（阻断）与叙事字段（告警）。"""
    if isinstance(o, dict):
        for k, v in o.items(): yield from _strings(v, k)
    elif isinstance(o, list):
        for v in o: yield from _strings(v, key)
    elif isinstance(o, str):
        yield key, o


def _damage_elems_of(node, refs, depth=0):
    """结构内可直接 / 经引用解析到的伤害元素集合；以及是否含 '$' 动态元素（不可完全核验）。"""
    elems, wild = set(), False
    for n in _walk(node):
        if not isinstance(n, dict):
            continue
        if n.get("type") == "damage":
            el = n.get("element")
            if isinstance(el, str):
                if el.startswith("$"): wild = True
                else: elems.add(el)
        if depth >= 3:
            continue
        for key in ("statusId", "unitId", "template", "def", "zone"):
            v = n.get(key)
            if isinstance(v, dict): v = v.get("def")
            if not isinstance(v, str): continue
            table = refs["status"] if key == "statusId" else refs["defs"]
            if v in table:
                e2, w2 = _damage_elems_of(table[v], refs, depth + 1)
                elems |= e2; wild = wild or w2
    return elems, wild


def _claim_elems(text):
    claims = set()
    for _w in _CLAIM_RE.findall(text or ""):
        for _el in _ZH2ELEM.get(_w, ()):
            claims.add((_w, _el))
    for _el in _PROSE_RE.findall(text or ""):
        if _el in ELEMENTS: claims.add((_el, _el))
    return claims


def _documented(words, notes):
    """空结构下，声称的元素能否在卡面注解（note）里找到佐证。"""
    if not notes:
        return False
    for _w in words:
        if _w in notes:
            return True
        for _el in _ZH2ELEM.get(_w, ()):
            if _el in notes:
                return True
    return False


def _check_desc_elems(node, cid, refs, errors, warns):
    elems, wild = _damage_elems_of(node, refs)
    notes = " ".join(txt for k, txt in _strings(node) if k == "note")
    for key, txt in _strings(node):
        if key not in _STRICT_FIELDS and key not in _NARRATIVE_FIELDS:
            continue
        claims = _claim_elems(txt)
        if not claims: continue
        bad = sorted({w for w, el in claims if el not in elems})
        if not bad: continue
        msg = "%s: %s 声称「%s」伤害，结构可解析元素为 %s" % (
            cid, key, "/".join(bad), ",".join(sorted(elems)) or "空")
        if key in _NARRATIVE_FIELDS:
            warns.append(msg); continue
        if wild:
            warns.append(msg + "（含 $ 动态元素，暂不可核验）")
        elif not elems:
            # 池外单位为常态（ENTITIES_ANALYSIS：单卡单位内联在 spawn 段、无 unitDef）：
            # 空结构下若声称的元素能在卡面注解（note）里找到佐证，即视为已按约定内联，不再告警。
            if not _documented(bad, notes):
                warns.append(msg + "（结构内无可核验 damage，暂不可核验）")
        else:
            errors.append(msg)

def main():
    m = json.load(io.open(os.path.join(JSON_DIR,'manifest.json'), encoding='utf-8'))
    expect = {p["id"]: p["cardCount"] for p in m["pathways"]}
    # rarity↔sequence 唯一机器可读基准为 manifest.rarityMap（文本正源 SCHEMA.md §3.1），不再硬编码
    _rev = {}
    for _rar, _seqs in m["rarityMap"].items():
        for _s in _seqs: _rev[_s] = _rar
    RARITY_BY_SEQ = _rev.get

    globs = set()
    files = sorted(glob.glob(os.path.join(JSON_DIR,'*.skills.json')))
    for f in files:
        d = json.load(io.open(f, encoding='utf-8'))
        for c in d.get("cards",[]):
            for sd in c.get("statusDefs") or []: globs.add(sd["id"])
    # 状态定义权威源为 *.statuses.json（含 common）
    for f in sorted(glob.glob(os.path.join(JSON_DIR,'*.statuses.json'))):
        try:
            d = json.load(io.open(f, encoding='utf-8'))
            for sd in d.get("statusDefs") or []: globs.add(sd["id"])
        except Exception:
            pass
    ALLSTATUS = globs

    # 描述↔元素一致性 Gate 的引用索引（statusId / def / zone / unitId 解析用）
    _refs = {"status": {}, "defs": {}}
    for _pid, _lbl, _sd in iter_status_defs():
        if isinstance(_sd, dict) and _sd.get("id"):
            _refs["status"][_sd["id"]] = _sd
    for _f in files:
        try: _dd = json.load(io.open(_f, encoding="utf-8"))
        except Exception: continue
        for _pool in ("unitDefs", "zoneDefs", "domainDefs"):
            for _x in _dd.get(_pool) or []:
                if isinstance(_x, dict) and _x.get("id"):
                    _refs["defs"].setdefault(_x["id"], _x)
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
            check_mod_keys(sd.get("modifiers"), "%s sd %s" % (cid, sd.get("id")), pre_warns)

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

    # Def 编目池（2026-10-01 独立化批）：顶层 unitDefs/zoneDefs/domainDefs 的触发器与 id 唯一性
    for f in files:
        pid = os.path.basename(f).replace('.skills.json', '')
        try:
            _pd = json.load(io.open(f, encoding='utf-8'))
        except Exception:
            continue
        seen = {}
        for pool_key, ref in (('unitDefs','unitDef'), ('zoneDefs','zoneDef'), ('domainDefs','domainDef')):
            for _d in _pd.get(pool_key) or []:
                _id = _d.get('id')
                if not _id:
                    pre_errors.append('%s pool %s: 缺 id' % (pid, pool_key)); continue
                if _id in seen:
                    pre_errors.append('%s pool %s: id %s 与 %s 重复' % (pid, pool_key, _id, seen[_id]))
                seen[_id] = ref
                trigs(_d.get('triggers'), pid+' '+pool_key+':'+_id, pool_key+':'+_id, [], pre_errors, pre_warns)
                for _e in _d.get('effects') or []:
                    _pl = _e.get('payload') if isinstance(_e, dict) and 'payload' in _e else _e
                    walk(_pl if isinstance(_pl, list) else [_pl], pid+' '+pool_key+':'+_id, pool_key+':'+_id, [], pre_errors, pre_warns)

    for f in files:
        d = json.load(io.open(f, encoding='utf-8'))
        pid = d.get("pathwayId", os.path.basename(f))
        errors, warns = [], []
        # 编目三池的 modifiers（unitDef/zoneDef 带修正集合）与状态池同一治理闸
        for _pool in ('unitDefs', 'zoneDefs', 'domainDefs'):
            for _e in d.get(_pool) or []:
                check_mod_keys(_e.get('modifiers'), "%s %s:%s" % (pid, _pool, _e.get('id', '?')), warns)
                _check_desc_elems(_e, "%s %s:%s" % (pid, _pool, _e.get('id', '?')), _refs, errors, warns)
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
                    errors.append("%s: 违反 INV-E6：selectionMode=manual 必须定义 fallbackSort（当前为 null/缺失）"%cid)
            elif c.get("kind")=="passive":
                # hook 自 2026-10-04 起为数组（与 triggers[].event 同源 triggerEvent）；
                # 仍兼容标量以便历史数据排查
                hk = c.get("hook")
                hk_list = [hk] if isinstance(hk, str) else (hk or [])
                if not hk_list: errors.append("%s: passive 缺 hook"%cid)
                for _h in hk_list:
                    if _h not in EVENTS: errors.append("%s: bad hook %s"%(cid,_h))
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
                check_mod_keys(sd.get("modifiers"), "%s sd %s" % (cid, sd.get("id")), warns)
                walk(sd.get("effects"), cid, "sd:"+sd.get("id","?"), flags, errors, warns)
                trigs(sd.get("triggers"), cid, "sd:"+sd.get("id","?"), flags, errors, warns)
                walk((sd.get("thresholdTrigger") or {}).get("effects"), cid, "sd:"+sd.get("id","?")+".tt", flags, errors, warns)
            flat = json.dumps(c.get("effects",[]), ensure_ascii=False)
            if ('"domain"' in flat or '"translocate"' in flat) and '"lost"' not in flat:
                errors.append("%s: domain/translocate without lost rent"%cid)
            # 维度乘区挂钩 Gate：dim 须为已注册维度、threshold 在值域内、mul>0；mul 越界给非阻断告警
            for h in (c.get("dimHooks") or []):
                dim = h.get("dim")
                if dim not in DIM_RANGES:
                    errors.append("%s: dimHooks.dim '%s' 非法（须为 secrecy/order/fate_value/luminance/death_tally）"%(cid, dim))
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
            # 相位乘区挂钩 Gate：phases 非空且合法、mul>0；mul 越界给非阻断告警
            for h in (c.get("phaseHooks") or []):
                ph = h.get("phases")
                if not isinstance(ph, list) or not ph:
                    errors.append("%s: phaseHooks.phases 须为非空数组" % cid); continue
                bad = [x for x in ph if x not in PHASES]
                if bad:
                    errors.append("%s: phaseHooks.phases 非法值 %s（须为 %s）" % (cid, bad, "/".join(sorted(PHASES)))); continue
                mu2 = h.get("mul")
                if not isinstance(mu2, (int, float)) or mu2 <= 0:
                    errors.append("%s: phaseHooks mul %s 须为正" % (cid, mu2))
                elif mu2 < 0.8 or mu2 > 1.5:
                    if not h.get("note"):
                        warns.append("%s: phaseHooks mul %s 越出 0.8–1.5 且无 note 说明" % (cid, mu2))
            # 描述↔元素一致性：describe 声称的元素须与结构可解析的伤害元素一致（2026-10-07）
            _check_desc_elems(c, cid, _refs, errors, warns)
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
