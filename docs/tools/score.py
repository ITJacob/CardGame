# -*- coding: utf-8 -*-
"""职业设计评分器。用法: python docs/tools/score.py

口径权威见 docs/meta/SCORING.md（本脚本是唯一计分实现）。
产物：
  - docs/analysis/scorecard.md  人读计分卡（勿手改）
  - docs/analysis/scores.json   网页端评分页数据源（口径单一来源，前端不重算）
只读脚本，不改任何数据文件。
"""
import json, io, os, sys, glob, math, datetime

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


def card_def_refs(card, def_index):
    """卡片 spawn/domain 出的区域(zoneDef)/界域(domainDef) def 对象；读层判定跟随其载荷
    （与 card_mounts 跟挂载状态 def 同理，SCORING.md 口径「condition/filter/触发器引用身份状态」）。"""
    out, seen = [], set()
    for n in walk(card.get("effects")):
        if n.get("type") == "spawn" and isinstance(n.get("zone"), str):
            i = n["zone"]
        elif n.get("type") == "domain" and isinstance(n.get("def"), str):
            i = n["def"]
        else:
            continue
        if i in def_index and i not in seen:
            seen.add(i)
            out.append(def_index[i])
    return out


# ---------- 作用面：状态面 + 全局通道（SCORING 2.0，2026-10-16） ----------
# 「间接作用」的载体：通道 = 战场级共享变量，跨轴/跨途径可见。
# 写入原语 / 读取谓词见 SCORING.md §二 通道表。作用面 item 统一字符串：
#   "status:<sid>"（状态面）或通道名（phase/luminance/order/fate_value/death_tally/secrecy/zone/summon/rank）。
CHANNELS = ("phase", "luminance", "order", "fate_value", "death_tally", "secrecy", "zone", "summon", "rank")
# 耦合通道（跨轴 / 跨系 / 消费计数专用）：剔除 zone / summon 这两个库内结构性脚手架
# （写卡极多，纳入会让"有召唤/有区域"人人拿满耦合分）；它们仍计入轴的产出面供「收束」判定。
COUPLING_CHANNELS = ("phase", "luminance", "order", "fate_value", "death_tally", "secrecy", "rank")


def channel_writes(objs):
    """一组 AST 容器（卡 + 挂载状态 def + spawn/domain 出的区域/界域 def）写入了哪些通道。"""
    ch = set()
    for o in objs:
        for n in walk(o):
            t = n.get("type")
            if t == "advance_clock":
                ch.add("phase")
            elif t == "set_luminance":
                ch.add("luminance")
            elif t == "modify_resource":
                r = n.get("resource")
                if r in ("secrecy", "order", "fate_value", "death_tally"):
                    ch.add(r)
            elif t == "domain":
                ch.add("zone")
            elif t == "spawn":
                ch.add("zone" if n.get("zone") else "summon")
    return ch


def channel_reads(objs):
    """读取了哪些通道。覆盖：phase_is / phaseHooks、dimHooks(dim:X)、dead_count、
    zone_active、caster_has_summon·target_is_summoned、rank_gap、resource_compare(量表键)。"""
    ch = set()
    for o in objs:
        for n in walk(o):
            k = n.get("kind")
            if k == "phase_is":
                ch.add("phase")
            elif k == "dead_count":
                ch.add("death_tally")
            elif k in ("zone_active", "zone"):
                ch.add("zone")
            elif k in ("caster_has_summon", "target_is_summoned"):
                ch.add("summon")
            elif k == "rank_gap":
                ch.add("rank")
            elif k == "resource_compare" and n.get("key") in ("secrecy", "order", "fate_value"):
                ch.add(n["key"])
            if isinstance(n.get("phases"), list):        # phaseHooks / phase_is
                ch.add("phase")
            d = n.get("dim")                              # dimHooks
            if isinstance(d, str) and d in ("luminance", "secrecy", "order", "fate_value", "death_tally"):
                ch.add(d)
    return ch


def card_status_refs(card):
    """卡面 effects 引用的状态 id 集（读侧，含 mount/modify/dispel 的 statusId 与 condition 的 id/hasStatus）。"""
    out = set()
    for n in walk(card.get("effects")):
        for k in ("statusId",):
            v = n.get(k)
            if isinstance(v, str):
                out.add(v)
            elif isinstance(v, list):
                out.update(x for x in v if isinstance(x, str))
        if n.get("kind") in ("has_status", "caster_status_exists", "status_category") and isinstance(n.get("id"), str):
            out.add(n["id"])
        for k in ("hasStatus", "targetHasStatus"):
            v = n.get(k)
            if isinstance(v, str):
                out.add(v)
            elif isinstance(v, list):
                out.update(x for x in v if isinstance(x, str))
    return out


def surface_of(card, status_by_id, def_index):
    """卡的作用面 (writes, reads)：状态面 ∪ 通道面。objs = 卡 + 挂载状态 def + spawn/domain def。"""
    mounted = [status_by_id.get(m) for m in card_mounts(card)]
    objs = [card] + [m for m in mounted if m] + card_def_refs(card, def_index)
    writes = {"status:" + m for m in card_mounts(card)} | channel_writes(objs)
    reads = {"status:" + s for s in card_status_refs(card)} | channel_reads(objs)
    # 挂载/区域 def 自身对状态的引用也算读（payoff 经专属状态读层）
    for o in ([m for m in mounted if m] + card_def_refs(card, def_index)):
        for n in walk(o):
            v = n.get("statusId")
            if isinstance(v, str):
                reads.add("status:" + v)
    return writes, reads


# 修改意见按扣分类别生成，路径内可执行、不做职业间横向对比（呈现层的硬要求）
FIX = {
    "no_layer_engine": "给身份状态补层数引擎（stackThreshold / maxStacks / thresholdTrigger 至少其一）",
    "pool_no_tiers": "给该 Pool 配 thresholdTrigger(metric) 档位状态（照恶欲值躁动/失控/爆炸四档先例）",
    "no_identity": "给轴定身份：补 statusId，或给 enabler 卡加 modify_resource 产能段",
    "dangling_sid": "把 statusId 改指真实 statusDef，或在途径 statuses.json 里建该定义",
    "enabler_only1": "再补 1 张产层卡，或给在列 enabler 卡面补挂身份段",
    "enabler_unverified": "逐张补挂身份状态/产能段，或从 axes.enablers 移除不产层的卡",
    "enabler_empty": "给轴补 2 张以上产层卡并在 axes.enablers 登记",
    "vacuum": "补读层 payoff 卡（卡面须有读层引用）；若为合法纯产层轴，走真空甄别（payoffVacuumAccepted + note 理由）",
    "payoff_notes": "给这些卡补读层段（has_status 条件 / resource_compare 阈值 / 耗层 stacksDelta），把 notes 级升 landed",
    "scale": "把轴卡数向途径轴均卡数收敛（补卡或并轴）",
    "connect": "给 payoff 补第二种读层方式（乘区/条件分支/耗层/存在性/通道读）",
    "min_axis": "优先重设计该最低分轴（轴表按分升序，第一行即它）",
    "crossaxis": "挑 1–2 张本途径 payoff 卡，加读他轴身份层数的条件/放大段",
    "crosspath": "挂 1 个枢纽状态（查 crossPathway 白名单缺什么）或给已有卡加跨系读取段",
    "aratio": "补主动或被动卡，把主被动比调进 [1.5, 3.0]",
    "flagship": "补/撤旗舰卡至 4 张",
    "landed": "待内核裁定该 frameworkFlag；短期用卡面 note 写的退化方案表达",
    "signature": "按身份卡补签名键卡（见 途径设计身份.md §二），每键 ≥2 卡实证",
    "uniqueness": "降低 mount_status+damage 通用骨架占比，把轴 payoff 换成签名键机制（最近邻见 STYLE_DISTANCE.md）",
    "config": "让四轴各走不同形状（产出面/通道或原语分化），避免四轴同一套骨架",
}
FIX_NOTE = "（注）核对这几张卡的卡面：补挂身份段，或从 axes 元数据移除"


# ---------- 风格签名（2026-10-01 差异化专项；口径 SCORING.md §三，键表与 docs/meta/途径设计身份.md §一 同表） ----------

PATHWAY_SIGNATURES = {
    "apprentice": ["prim:translocate", "prim:echo_last_skill", "prim:restore_snapshot"],
    "monster": ["prim:restore_snapshot", "prim:advance_clock", "res:fate_value"],
    "arbiter": ["flag:seal_effect", "flag:cost_mod", "res:order"],
    "lawyer": ["prim:gauge_shuffle", "prim:status_shuffle", "prim:modify_rule_slot"],
    "thief": ["prim:take_control", "prim:modify_targetability", "prim:target_override"],
    "reader": ["prim:reveal", "sref:mimic", "prim:snapshot"],
    "chanter": ["prim:grant_immunity", "prim:write_rule_slot", "trig:on_phase_change"],
    "sleepless": ["trig:on_phase_change", "prim:advance_clock", "res:secrecy"],
    "warrior": ["elem:holy", "flag:filter.unitType", "sref:guardianship"],
    "assassin": ["prim:translocate", "elem:ice", "elem:dark"],
    "hunter": ["prim:target_override", "flag:gender_is", "sref:massing"],
    "spectator": ["stat:rank", "flag:template", "sref:insight"],
    "seer": ["sref:puppet_string", "prim:write_rule_slot", "prim:translocate"],
    "sailor": ["elem:ice", "elem:lightning", "sref:rage"],
    "supplicant": ["sref:grazed_soul", "stat:hp_max", "sref:flesh_undying"],
    "corpse_collector": ["flag:filter.unitType", "trig:on_kill", "prim:drain"],
    "prisoner": ["sref:curse_link", "unitType:ITEM", "sref:lineage_stack"],
    "criminal": ["res:lust", "elem:dark", "flag:companionBuff"],
    "savant": ["prim:modify_rule_slot", "sref:law_edit", "unitType:CONSTRUCT"],
    "pryer": ["flag:valueFrom", "flag:cast_time_set", "sref:info_form"],
    "planter": ["flag:statPerStack", "unitType:PLANT", "sref:blight"],
    "apothecary": ["sref:moon_cycle", "unitType:BEAST", "sref:prepared_draught"],
}


def _filter_unit_type_nodes(effects):
    """filter 语义里的 unitType（区别于 unitDefs 池定义的 unitType）。
    键名口径：旧键 unitType 与 2026-10-01 归一键 type（target_unit_type 谓词）双认——
    归一裁定（召唤物批）后存量卡用 type，计数器须与归一对齐。"""
    return [n for n in walk(effects)
            if ("unitType" in n or (n.get("kind") == "target_unit_type" and "type" in n))
            and "base" not in n and not str(n.get("id", "")).startswith("unit_")]


def signature_card_hit(card, key, unit_type_of=None, lineage_ids=None, flag_status_index=None):
    """单卡是否实证某签名键（unit_type_of: unitId -> unitType 解析，供 unitType:X 键经 spawn 取证；
    lineage_ids: 带 lineageStack 字段的状态 id 集，供 sref:lineage_stack 读侧取证，2026-10-02 批次九对齐；
    flag_status_index: flag 键 -> 具有该特征的状态 id 集（读侧取证通用索引）——
    cast_time_set（批次十：behaviorModifiers 挂状态面，卷轴技法）/
    statPerStack（批次十一：成长引擎挂状态面，催化成长），卡经 mount/引用即计）。"""
    kind, _, arg = key.partition(":")
    if kind == "prim":
        return arg in card_effect_types(card)
    if kind == "elem":
        return any(n.get("element") == arg for n in walk(card.get("effects")))
    if kind == "res":
        if card_refs_resource(card, arg):
            return True
        # 量表读取侧实证：dimHooks(dim:X) 实证 res:X、phaseHooks 实证 res:phase
        # （board 级量表不以 modify_resource 表达）
        if any(h.get("dim") == arg for h in (card.get("dimHooks") or [])):
            return True
        return arg == "phase" and bool(card.get("phaseHooks"))
    if kind == "stat":
        if any(n.get("type") == "modify_stat" and n.get("stat") == arg
               for n in walk(card.get("effects"))):
            return True
        # 位格洞察读侧口径（2026-10-02 批次六对齐）：stat_compare(key=rank) 与 rank_gap 谓词
        # 同为位格使用——洞察途径读位格而非改位格，原口径只认 modify_stat 致签名键永零。
        if arg == "rank":
            return any((n.get("kind") == "stat_compare" and n.get("key") == "rank")
                       or n.get("kind") == "rank_gap"
                       for n in walk(card.get("effects")))
        return False
    if kind == "trig":
        evs = {t.get("event") for t in (card.get("triggers") or []) if isinstance(t, dict)}
        # passive 触发点挂 hook 字段（与 triggers 数组同口径，2026-10-02 批次九对齐）；
        # hook 自 2026-10-04 起为数组，逐项并入事件集（兼容标量）
        _hk = card.get("hook")
        if isinstance(_hk, str):
            evs.add(_hk)
        else:
            evs.update(_hk or [])
        return arg in evs or any(n.get("event") == arg for n in walk(card.get("effects")))
    if kind == "sref":
        # 谱系栈读侧口径（2026-10-02 批次九对齐）：卡引用任何带 lineageStack 字段的状态（狼人化/灵体化/
        # 异类之王/演出回放）即计使用——原口径按 statusId=="lineage_stack" 取证，该 id 非状态，键永零。
        if arg == "lineage_stack" and lineage_ids:
            return any(card_refs_status(card, s) for s in lineage_ids)
        return card_refs_status(card, arg)
    if kind == "unitType":
        # 归一键口径（2026-10-02 批次十对齐）：旧键 unitType 标量与 target_unit_type 谓词的
        # type 数组双认——原只认标量，归一后的谓词写法永不计数（与批次五 filter.unitType 修复同源）。
        for n in _filter_unit_type_nodes(card.get("effects")):
            if n.get("unitType") == arg or (isinstance(n.get("type"), list) and arg in n["type"]):
                return True
        # 经 spawn unitId 解析（召唤物类型归属）
        if unit_type_of:
            for n in walk(card.get("effects")):
                if n.get("type") == "spawn" and unit_type_of.get(n.get("unitId")) == arg:
                    return True
        return False
    if kind == "flag":
        if arg == "filter.unitType":
            return bool(_filter_unit_type_nodes(card.get("effects")))
        if flag_status_index and arg in flag_status_index:
            ids = flag_status_index[arg]
            # 状态面读侧口径：机制键（cast_time_set 行为算子 / statPerStack 成长引擎）的权威承载
            # 在状态 def，卡经 mount/引用该状态即计使用。
            if any(card_refs_status(card, sid) for sid in ids):
                return True
            if arg == "cast_time_set":
                # 亦认 modify_skill 的 castTimeDelta/setInstant（技能实例级省时）。
                for n in walk(card.get("effects")):
                    if n.get("type") == "modify_skill" and (
                            n.get("castTimeDelta") is not None or n.get("setInstant") is True):
                        return True
            return False
        return arg in json.dumps(card, ensure_ascii=False)
    return False


def signature_counts(cards, keys, unit_type_of=None, lineage_ids=None, flag_status_index=None):
    """key -> 实证卡数"""
    return {k: sum(1 for c in cards if signature_card_hit(c, k, unit_type_of, lineage_ids, flag_status_index))
            for k in keys}


# ---------- 途径指纹与风格距离（STYLE_DISTANCE.md 同源口径） ----------

def _cond_kinds(node):
    """效果树内全部谓词 kind（condition/conditions 键递归；通用下钻跳过这两键防重复计数）。"""
    out = []

    def visit(n):
        if isinstance(n, dict):
            c = n.get("condition")
            if isinstance(c, dict):
                out.append(c.get("kind"))
                visit(c)
            for x in n.get("conditions") or []:
                if isinstance(x, dict):
                    out.append(x.get("kind"))
                    visit(x)
            for k, v in n.items():
                if k not in ("condition", "conditions"):
                    visit(v)
        elif isinstance(n, list):
            for v in n:
                visit(v)

    visit(node)
    return out


# param：效果原语的**枚举型**参数键值（数值不入——SCORING 原则 4）。
PARAM_FIELDS = {
    "modify_stat": ("stat", "mode", "sourceRef"),
    "modify_resource": ("resource", "mode"),
    "drain": ("resource",),
    "mount_status": ("stackMode",),
    "spawn": ("position", "consumption", "template", "kind"),
    "move": ("op",),
    "domain": ("op",),
    "dispel": ("dispelTarget",),
    "transfer_status": ("mode", "to", "from", "statusesFrom"),
    "take_control": ("actionPolicy", "onExpire"),
    "target_override": ("anchor", "faction", "sort"),
    "translocate": ("op",),
    "modify_rule_slot": ("field", "mode"),
    "write_rule_slot": ("field",),
    "modify_damage": ("scope",),
    "modify_targetability": ("direction",),
    "reveal": ("scope",),
    "echo_last_skill": ("snapshot",),
    "status_shuffle": ("mode", "sort"),
}
MODIFY_SKILL_OPS = ("castTimeDelta", "setInstant", "costDelta", "clearCooldown", "cooldownDelta")

# condarg：条件谓词的枚举参数。私有 statusId 不取（途径私有命名跨途径不可比）。
CONDARG_FIELDS = ("cmp", "side", "key", "stat", "unitType", "type", "phase",
                  "aUnit", "bUnit", "of", "select", "tag", "value",
                  "unitIdx", "template", "position")

# sshape：状态**形态**（替代私有 statusId 身份）。键为共享词表的结构特征。
SSHAPE_FLAGS = (
    ("charges", "charges"),
    ("stackThreshold", "stack_threshold"), ("thresholdTrigger", "threshold_trigger"),
    ("statPerStack", "stat_per_stack"), ("formGroup", "form_group"),
    ("phases", "phases"), ("cycleTicks", "cycle"), ("ramp", "ramp"),
    ("lethalProtect", "lethal_protect"), ("contagious", "contagious"),
    ("transferOnDeath", "transfer_on_death"), ("reviveBlocked", "revive_blocked"),
    ("immune", "immune"), ("silent_immune", "silent_immune"),
    ("suppress", "suppress"), ("redirectRule", "redirect"),
    ("damageTransfer", "damage_transfer"), ("slots", "slots"),
    ("fields", "fields"), ("nextPhase", "next_phase"),
)


def _cond_args(node):
    """条件树内的枚举参数键值（kind:field=value）；私有 statusId 类字段不入（跨途径不可比）。"""
    out = set()

    def visit(n):
        if isinstance(n, dict):
            if isinstance(n.get("kind"), str):
                k = n["kind"]
                for f in CONDARG_FIELDS:
                    v = n.get(f)
                    if isinstance(v, (str, int, float)) and not isinstance(v, bool):
                        out.add("%s:%s=%s" % (k, f, v))
                pv = n.get("phases")
                if isinstance(pv, list):
                    for x in pv:
                        if isinstance(x, str):
                            out.add("%s:phases=%s" % (k, x))
            c = n.get("condition")
            if isinstance(c, dict):
                visit(c)
            for x in n.get("conditions") or []:
                if isinstance(x, dict):
                    visit(x)
            for kk, vv in n.items():
                if kk not in ("condition", "conditions"):
                    visit(vv)
        elif isinstance(n, list):
            for v in n:
                visit(v)

    visit(node)
    return out


def _status_shape(sd):
    """状态 def 的形态键集：结构 flags + 修正名 + 自带效果原语 + 时长形态。私有 id 不入。"""
    out = set()
    for k, label in SSHAPE_FLAGS:
        if sd.get(k):
            out.add(label)
    ms = sd.get("maxStacks")
    if isinstance(ms, int) and ms > 1:
        out.add("stacks")
    for c in (sd.get("category") or []):
        if isinstance(c, str):
            out.add("cat:" + c)
    dur = sd.get("duration")
    unit = sd.get("durationUnit")
    if dur is None:
        out.add("dur:persistent")
    elif unit == "self_turn":
        out.add("dur:self_turn")
    else:
        out.add("dur:tick")
    for bm in (sd.get("behaviorModifiers") or []):
        if isinstance(bm, dict) and isinstance(bm.get("op"), str):
            out.add("behavior:" + bm["op"])
    for lock in (sd.get("disallowActions") or []):
        if isinstance(lock, str):
            out.add("lock:" + lock)
    for key in ("modifiers", "statMods"):
        mods = sd.get(key)
        if isinstance(mods, dict):
            for k in mods:
                out.add("mods:" + k)
    # on_apply 载荷 = 状态挂载时施加的效果（原 def 级 effects 的迁移落点）
    for n in walk([t.get("effects") for t in (sd.get("triggers") or [])
                   if isinstance(t, dict) and t.get("event") == "on_apply"]):
        t = n.get("type")
        if isinstance(t, str):
            out.add("via:" + t)
        if t == "modify_stat" and isinstance(n.get("stat"), str):
            out.add("via_stat:" + n["stat"])
    if sd.get("crossPathway"):
        out.add("crosspathway")
    return out


# ---------- 全链路指纹（SCORING 2.2，2026-10-17）----------
# 差异化②不再只看原语：施法链路（选靶 → 条件 → 效果 → 状态 → 时序）每一环入向量，
# 分族独立 L2 归一后等权求距离。
FAMILIES = ("prim", "elem", "cond", "condarg", "param", "reach",
            "tgt", "hook", "sshape", "cost", "temporal")


def _card_families(card, status_by_id=None):
    """单卡在各链路族上的**键集**：原语 / 元素 / 谓词 / 谓词参数 / 效果参数 / 射程 /
    选靶（卡级坐标 + filter + 效果级作用对象）/ 触发点 / 状态形态 / 消耗形态 / 时序形态。"""
    fam = {f: set() for f in FAMILIES}
    fam["prim"] |= card_effect_types(card)

    for n in walk(card.get("effects")):
        if isinstance(n.get("element"), str):
            fam["elem"].add(n["element"])
        t = n.get("type")
        is_hp_cost = (t == "modify_resource" and n.get("resource") == "hp"
                      and n.get("target") == "self" and n.get("mode") == "delta"
                      and isinstance(n.get("value"), (int, float)) and n.get("value") < 0)
        for f in (PARAM_FIELDS.get(t, ()) if isinstance(t, str) else ()):
            if is_hp_cost and f == "resource":
                continue
            v = n.get(f)
            if isinstance(v, (str, int, float)) and not isinstance(v, bool):
                fam["param"].add("%s=%s" % (f, v))
        if t == "spawn" and isinstance(n.get("unitIdx"), str):
            fam["param"].add("unit=" + n["unitIdx"])
        if t == "modify_skill":
            for op in MODIFY_SKILL_OPS:
                if n.get(op) is not None:
                    fam["param"].add("modop=" + op)
        tv = n.get("target")
        if isinstance(tv, str):
            fam["tgt"].add("eff:" + tv)
        elif isinstance(tv, list):
            for x in tv:
                if isinstance(x, str):
                    fam["tgt"].add("eff:" + x)
        if n.get("durationUnit") == "self_turn":
            fam["temporal"].add("dur:self_turn")
        elif n.get("durationUnit") == "tick":
            fam["temporal"].add("dur:tick")
        if n.get("setInstant"):
            fam["temporal"].add("instant")
        if is_hp_cost:
            fam["cost"].add("hp_cost")

    fam["cond"] |= set(_cond_kinds(card.get("effects")))
    fam["condarg"] |= _cond_args(card.get("effects"))

    spec = card.get("target") or {}
    req = spec.get("request") or {}
    if req.get("faction"):
        fam["tgt"].add("faction=" + req["faction"])
    if req.get("scope"):
        fam["tgt"].add("scope=" + req["scope"])
    if req.get("anchor"):
        fam["tgt"].add("anchor=" + req["anchor"])
    if req.get("mode"):
        fam["tgt"].add("mode=" + req["mode"])
    if spec.get("selectionMode"):
        fam["tgt"].add("sel=" + spec["selectionMode"])
    for k in (req.get("filter") or {}):
        fam["tgt"].add("filter:" + k)

    if isinstance(card.get("reach"), str):
        fam["reach"].add("reach=" + card["reach"])

    cost = card.get("cost") or {}
    if card.get("kind") == "active":
        energy = cost.get("energy")
        if isinstance(energy, int):
            fam["cost"].add("energy:" + ("zero" if energy == 0 else
                                         "low" if energy <= 1 else
                                         "mid" if energy <= 2 else "high"))
        cd = cost.get("cooldown")
        if isinstance(cd, int):
            fam["cost"].add("cooldown:" + ("none" if cd == 0 else
                                           "short" if cd <= 3 else "long"))
        ct = cost.get("castTime")
        if isinstance(ct, int) and ct > 0:
            fam["temporal"].add("cast")

    # on_apply = 状态挂载载荷的固有生命周期事件（原 def 级 effects 的迁移落点），
    # 不体现卡的触发点设计，不计入 hook 族。
    for h in (card.get("hook") or []):
        if isinstance(h, str) and h != "on_apply":
            fam["hook"].add(h)
    for tr in (card.get("triggers") or []):
        if isinstance(tr, dict) and tr.get("event") and tr["event"] != "on_apply":
            fam["hook"].add(tr["event"])
    for m in card_mounts(card):     # 挂状态 = 接入该状态 def 的触发点
        for tr in ((status_by_id or {}).get(m) or {}).get("triggers") or []:
            if isinstance(tr, dict) and tr.get("event") and tr["event"] != "on_apply":
                fam["hook"].add(tr["event"])

    # sshape：引用的状态 → 状态形态（替代私有 statusId 身份）
    for sid in card_status_refs(card):
        sd = (status_by_id or {}).get(sid)
        if sd:
            fam["sshape"] |= _status_shape(sd)
    return fam


def fingerprint(cards, status_by_id=None):
    """全链路指纹（分族）：族 -> {键: 计数}。族表见 SCORING.md §三·一。"""
    fam = {f: {} for f in FAMILIES}
    for c in cards:
        for f, keys in _card_families(c, status_by_id).items():
            for k in keys:
                fam[f][k] = fam[f].get(k, 0) + 1
    return fam


def _l2(vec):
    n = math.sqrt(sum(v * v for v in vec.values()))
    return {k: v / n for k, v in vec.items()} if n else {}


def cos_dist(a, b):
    """全链路距离 = 各链路族余弦距离的均值（族等权，L2 归一后每族各占一票）。"""
    total, cnt = 0.0, 0
    for f in FAMILIES:
        fa, fb = _l2(a.get(f) or {}), _l2(b.get(f) or {})
        keys = set(fa) | set(fb)
        if not keys:
            continue
        dot = sum(fa.get(k, 0) * fb.get(k, 0) for k in keys)
        total += 1.0 - dot
        cnt += 1
    return total / cnt if cnt else 1.0


def load_unit_types(pathways):
    """unitId -> unitType。权威 = ddd 召唤物参数.md §一 36 具名单位归属表（多数单位 JSON 无 Def，仅被 spawn 引用）；
    skills.json 顶层 unitDefs 池中的显式定义叠加覆盖。"""
    out = {("unit_" + k): v for k, v in {
        "skeleton": "UNDEAD", "zombie": "UNDEAD", "ghoul": "UNDEAD", "wraith": "UNDEAD",
        "nature_spirit": "SPIRIT", "grazed_wraith": "SPIRIT", "fallen_kin": "SPIRIT",
        "beast": "BEAST", "bat": "BEAST", "sea_beast": "BEAST", "leviathan": "BEAST", "beastling": "BEAST",
        "vermin": "VERMIN", "vine": "PLANT", "oak_child": "PLANT",
        "golem": "CONSTRUCT", "homunculus": "CONSTRUCT", "doll": "CONSTRUCT", "marionette": "CONSTRUCT",
        "war_soldier": "CONSTRUCT", "tower_construct": "CONSTRUCT", "scroll_construct": "CONSTRUCT",
        "automaton": "MACHINE", "flesh_servant": "FLESH", "demon": "DEMON",
        "elder_thing": "ABERRATION", "abomination": "ABERRATION",
        "mirror_image": "ILLUSION", "imagined": "ILLUSION", "split_identity": "ILLUSION",
        "thoughtform": "ILLUSION", "historical_echo": "ILLUSION", "doppelganger": "ILLUSION",
        "shadow_spawn": "ILLUSION", "relic": "ITEM", "stone_clock": "ITEM",
    }.items()}
    for pid, d in pathways.items():
        for u in (d.get("unitDefs") or []):
            if u.get("unitType"):
                out[u.get("id")] = u.get("unitType")
    return out


# ---------- 主计分 ----------


def main():
    pathways = load_skills()
    def_index = {}                       # 区域/界域 def id -> def（读层判定跟随卡 spawn/domain 出的载荷）
    for _d in pathways.values():
        for _z in _d.get("zoneDefs") or []:
            def_index[_z["id"]] = _z
        for _m in _d.get("domainDefs") or []:
            def_index[_m["id"]] = _m
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

    # 全局作用面索引 + 通道读者数（收束闭环 / 跨轴 / 跨系 计分用）
    ALL_SURF = {}                 # (pathwayId, cardName) -> (writes, reads)
    channel_readers = {}          # 通道 -> 全库读取它的卡数
    chan_pathway_writers = {}     # 通道 -> 写入它的途径集
    for _pid, _d in pathways.items():
        for _c in _d.get("cards") or []:
            _w, _r = surface_of(_c, status_by_id, def_index)
            ALL_SURF[(_pid, _c["name"])] = (_w, _r)
            for _ch in _r & set(CHANNELS):
                channel_readers[_ch] = channel_readers.get(_ch, 0) + 1
            for _ch in _w & set(CHANNELS):
                chan_pathway_writers.setdefault(_ch, set()).add(_pid)

    for pid, d in pathways.items():
        axes = d.get("axes") or {}
        cards = d.get("cards") or []
        card_by_name = {c["name"]: c for c in cards}
        surf = {c["name"]: surface_of(c, status_by_id, def_index) for c in cards}
        n_axes = max(1, len(axes))

        for aid, ax in axes.items():
            sid = ax.get("statusId")
            enablers = ax.get("enablers") or []
            payoffs = ax.get("payoffs") or []
            axis_cards = [c for c in cards if c.get("axis") == aid]
            deductions = []

            # 本轴作用面：状态面 ∪ 通道面
            ax_writes, ax_reads = set(), set()
            for c in axis_cards:
                w, r = surf[c["name"]]
                ax_writes |= w
                ax_reads |= r
            ax_channels = ax_writes & set(CHANNELS)          # 本轴写入的全局通道

            # —— 身份锚定（SCORING 2.0：锚点可解析 8 + 身份有机制 7；不再硬要求「层数引擎」）——
            identity_pool = None
            outputs = ({"status:" + sid} if sid else set()) | ax_channels
            if sid and sid in status_by_id:
                anchor = 8
                sdef = status_by_id[sid]
                _ms = sdef.get("maxStacks")
                # on_apply 载荷不是机制，只有承载别的事件触发点才算「身份状态带机制」
                _trg_evt = any(isinstance(t, dict) and t.get("event") not in (None, "on_apply")
                               for t in (sdef.get("triggers") or []))
                has_engine = bool(
                    sdef.get("stackThreshold") or sdef.get("thresholdTrigger")
                    or (isinstance(_ms, int) and _ms > 1) or sdef.get("charges")
                    or _trg_evt or sdef.get("statPerStack")
                    or sdef.get("formGroup") or sdef.get("phases") or sdef.get("cycleTicks")
                    or sdef.get("behaviorModifiers")
                )
                if has_engine:
                    anchor += 7
                else:
                    deductions.append(("身份锚定", "-7：身份状态纯静态载荷（层数引擎 / triggers / statPerStack / 形态 皆无）", sid, FIX["no_layer_engine"]))
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
                    deductions.append(("身份锚定", "-7：Pool 轴无层数引擎档位（thresholdTrigger(metric) 未挂）", identity_pool, FIX["pool_no_tiers"]))
                elif ax_channels:
                    # 通道型身份：轴以某全局通道为身份锚点（如 phase / zone）
                    anchor = 15
                else:
                    anchor = 0
                    deductions.append(("身份锚定", "-15：轴无 statusId 且 enabler 无 modify_resource 产能段", aid, FIX["no_identity"]))
            else:
                anchor = 0
                deductions.append(("身份锚定", "-15：statusId '%s' 悬空" % sid, sid, FIX["dangling_sid"]))

            def _is_enabler(c):
                if not c:
                    return False
                if sid:
                    return ("status:" + sid) in surf[c["name"]][0]
                if identity_pool:
                    return card_refs_resource(c, identity_pool)
                return bool(surf[c["name"]][0] & set(CHANNELS))   # 产层 = 写入本轴身份通道

            en_verified = [n for n in enablers if _is_enabler(card_by_name.get(n))]
            en_missed = [n for n in enablers if n not in en_verified]
            if len(en_verified) >= 2:
                closure_e = 20
            elif len(en_verified) == 1:
                closure_e = 12
                deductions.append(("产层闭环", "-8：实证 enabler 仅 1 张", ",".join(en_verified), FIX["enabler_only1"]))
            elif enablers:
                closure_e = 5
                deductions.append(("产层闭环", "-15：enablers %d 张均未实证挂载身份" % len(enablers), ",".join(en_missed), FIX["enabler_unverified"]))
            else:
                closure_e = 0
                deductions.append(("产层闭环", "-20：enablers 为空", aid, FIX["enabler_empty"]))
            if en_missed and en_verified:
                deductions.append(("产层闭环", "注：未实证 %d 张（name 在列但卡面不挂身份）" % len(en_missed), ",".join(en_missed), FIX_NOTE))

            # —— 收束闭环（SCORING 2.0：直接读身份 / 通道读 / def 内闭环 三面等价） ——
            def _payoff_evidence(c):
                """返回 'landed' | 'notes' | None。
                landed = 卡读本轴产出面（身份状态 或 本轴写入的通道）；notes = 仅自述未读。"""
                if not c:
                    return None
                nm = c["name"]
                if sid:
                    if (surf[nm][1] & outputs) or card_refs_status(c, sid):
                        return "landed"
                    for m in card_mounts(c):
                        mdef = status_by_id.get(m)
                        if mdef and refs_in_obj(mdef, sid):
                            return "landed"
                    for dref in card_def_refs(c, def_index):
                        if refs_in_obj(dref, sid):
                            return "landed"
                    return "notes"
                if identity_pool:
                    for ob in [c.get("effects")] + card_def_refs(c, def_index):
                        for n in walk(ob):
                            if n.get("kind") == "resource_compare" and n.get("key") == identity_pool:
                                return "landed"
                            if n.get("type") == "modify_resource" and n.get("resource") == identity_pool and (n.get("value") or 0) < 0:
                                return "landed"
                    return "notes"
                return "landed" if (surf[nm][1] & outputs) else "notes"

            landed, notes_level = [], []
            for n in payoffs:
                ev = _payoff_evidence(card_by_name.get(n))
                (landed if ev == "landed" else notes_level if ev == "notes" else []).append(n)
            closure_p = min(25, len(landed) * 9 + len(notes_level) * 4)
            if not payoffs:
                # 无 payoff 卡：间接收束（本轴写入通道的下游读者分档）+ def 内闭环兜底
                indirect = 0
                for ch in sorted(ax_channels):
                    rd = channel_readers.get(ch, 0)
                    indirect += 9 if rd >= 6 else 6 if rd >= 3 else 3 if rd >= 1 else 0
                def_internal = 0
                if sid:
                    sd = status_by_id.get(sid) or {}
                    _trgs = sd.get("triggers") or []
                    _has_evt = any(isinstance(t, dict) and t.get("event") not in (None, "on_apply")
                                   for t in _trgs)
                    _has_load = any(isinstance(t, dict) and t.get("event") == "on_apply" and t.get("effects")
                                    for t in _trgs)
                    if _has_evt or any(sd.get(k) for k in ("stackThreshold", "thresholdTrigger",
                                                           "statPerStack", "ramp", "phases", "cycleTicks", "formGroup")):
                        def_internal = 15      # 身份 def 自带动态引擎（自闭环型）
                    elif _has_load or sd.get("modifiers"):
                        def_internal = 10      # 身份 def 自带静态载荷（自足乘区 / 自带 buff 型）
                closure_p = min(25, max(indirect, def_internal))
                if closure_p == 0:
                    deductions.append(("收束闭环", "-25：轴产出无收束（无 payoff / 无通道下游读者 / def 内无闭环）", aid, FIX["vacuum"]))
                else:
                    deductions.append(("收束闭环", "注：间接收束 %d 分（无 payoff 卡，按通道下游读者 / def 内闭环计）" % closure_p, aid, FIX_NOTE))
            else:
                if notes_level and not landed:
                    deductions.append(("收束闭环", "-%d：payoff %d 张全部 notes 级（卡面不读本轴产出面）" % (25 - closure_p, len(payoffs)), ",".join(notes_level), FIX["payoff_notes"]))
                elif notes_level:
                    deductions.append(("收束闭环", "注：notes 级 %d 张（减半计）" % len(notes_level), ",".join(notes_level), FIX["payoff_notes"]))

            # —— 轴内多样性（归一后置）：SCORING 2.2 起 = 全链路词表 ——
            # 原语 + 谓词 + 选靶(scope/anchor) + 触发点 + 状态形态（去重种类和）
            prim_kinds, cond_kinds, chain_kinds = set(), set(), set()
            for c in axis_cards:
                prim_kinds |= card_effect_types(c)
                cond_kinds |= card_condition_kinds(c)
                cf = _card_families(c, status_by_id)
                chain_kinds |= {"tgt:" + k for k in cf["tgt"] if k.startswith(("scope=", "anchor="))}
                chain_kinds |= {"hook:" + k for k in cf["hook"]}
                chain_kinds |= {"sshape:" + k for k in cf["sshape"]}
            div_raw = len(prim_kinds) + len(cond_kinds) + len(chain_kinds)
            axis_diversity_raw[(pid, aid)] = div_raw

            # —— 规模均衡 ——
            ideal = len(cards) / n_axes
            ratio = (len(axis_cards) / ideal) if ideal else 0
            if 0.6 <= ratio <= 1.4:
                scale = 10
            else:
                dev = abs(ratio - 1.0) - 0.4
                scale = max(0, round(10 - dev * 10))
                deductions.append(("规模均衡", "-%d：轴卡数 %d vs 理想 %d（比值 %.2f）" % (10 - scale, len(axis_cards), round(ideal), ratio), aid, FIX["scale"]))

            # —— 承接连通（SCORING 2.2：只算收束方式去重；跨轴/跨系消费由途径级维度承担，避免双计） ——
            patterns = set()
            for n in payoffs:
                c = card_by_name.get(n)
                if not c:
                    continue
                nm = c["name"]
                defrefs = card_def_refs(c, def_index)
                mounted = [status_by_id.get(m) for m in card_mounts(c)]
                blob = [c] + [m for m in mounted if m] + defrefs
                # 收束检索空间：卡面 effects + 挂载状态 def + spawn/domain 出的区域/界域 def
                space = list(walk(c.get("effects"))) + [n2 for dref in defrefs for n2 in walk(dref)]
                has_mul = any(refs_in_obj(o, sid) and True for o in blob) and any(
                    "damage_mul" in json.dumps(o, ensure_ascii=False) and refs_in_obj(o, sid) for o in blob)
                if has_mul:
                    patterns.add("乘区")
                if any(n2.get("op") == "if" and refs_in_obj(n2, sid) for n2 in space) or \
                   any(n2.get("kind") in ("resource_compare", "stat_compare") for n2 in space):
                    patterns.add("条件分支")
                for n2 in space:
                    if n2.get("type") == "modify_status" and n2.get("statusId") == sid and \
                       ((n2.get("stacksDelta") or 0) < 0 or n2.get("stackMode") == "consume"):
                        patterns.add("耗层")
                if any(n2.get("hasStatus") == sid for n2 in space) or \
                   any(n2.get("kind") == "has_status" and n2.get("id") == sid for n2 in space):
                    patterns.add("存在性")
                if surf[nm][1] & set(CHANNELS):
                    patterns.add("通道读")
            # 产出面（状态 ∪ 耦合通道）被他轴 / 他途径消费
            outputs_c = ({"status:" + sid} if sid else set()) | (ax_channels & set(COUPLING_CHANNELS))
            ext_consumers = 0
            for pid2, d2 in pathways.items():
                for c2 in d2.get("cards") or []:
                    if pid2 == pid and c2.get("axis") == aid:
                        continue
                    r2 = ALL_SURF[(pid2, c2["name"])][1] & outputs_c
                    if not r2:
                        continue
                    if pid2 != pid:
                        # 状态面跨途径须 crossPathway 白名单；通道面天然共享，直认
                        if r2 <= ({"status:" + sid} if sid else set()):
                            sdef = status_by_id.get(sid) or {}
                            part = sdef.get("participants") or []
                            if not (sid and sdef.get("crossPathway") and (not part or pid2 in part)):
                                continue
                    else:
                        pw_crossaxis_refs[pid] = pw_crossaxis_refs.get(pid, 0) + 1
                    ext_consumers += 1
            connect = min(15, len(patterns) * 3)
            if not patterns and payoffs:
                deductions.append(("承接连通", "-15：payoff 无收束方式多样性", ",".join(payoffs), FIX["connect"]))

            axis_rows.append({
                "pathway": pid, "axis": aid, "name": ax.get("name"), "symbol": ax.get("symbol"),
                "anchor": anchor, "closure_e": closure_e, "closure_p": closure_p,
                "div_raw": div_raw, "scale": scale, "connect": connect,
                "cards": len(axis_cards), "enablers_v": en_verified, "landed": landed, "notes": notes_level,
                "patterns": sorted(patterns), "ext_consumers": ext_consumers,
                "ax_channels": sorted(ax_channels),
                "shape": sorted(ax_channels | prim_kinds | chain_kinds),
                "vacuum_accepted": bool(ax.get("payoffVacuumAccepted")),
                "deductions": deductions,
            })

    # 归一：多样性
    max_div = max(axis_diversity_raw.values()) or 1
    for r in axis_rows:
        r["diversity"] = round(15 * r["div_raw"] / max_div, 1)
        r["total"] = round(r["anchor"] + r["closure_e"] + r["closure_p"] + r["diversity"] + r["scale"] + r["connect"], 1)
        r["dims"] = {"身份锚定": r["anchor"], "产层闭环": r["closure_e"], "收束闭环": r["closure_p"],
                     "轴内多样性": r["diversity"], "规模均衡": r["scale"], "承接连通": r["connect"]}

    # ---------- 途径级 ----------
    # 跨系读段专项：本途径卡读取他途径枢纽状态（crossPathway:true 即枢纽，不限是否轴身份），
    # 每（卡×枢纽）计 1 次；白名单为空视为开放枢纽
    hub_ids = {sid for sid, sd in status_by_id.items() if sd.get("crossPathway")}
    for pid, d in pathways.items():
        for c in d.get("cards") or []:
            for hid in hub_ids:
                if status_owner.get(hid) == pid:
                    continue
                if not card_refs_status(c, hid):
                    continue
                part = status_by_id[hid].get("participants") or []
                if part and pid not in part:
                    continue
                pw_crosspath_reads[pid] = pw_crosspath_reads.get(pid, 0) + 1

    # 跨系通道耦合（SCORING 2.0）：本途径写入的耦合通道被他途径读取（每 他途径卡×通道 计 1）
    for pid, d in pathways.items():
        for ch, writers in chan_pathway_writers.items():
            if ch not in COUPLING_CHANNELS or pid not in writers:
                continue
            n = 0
            for pid2, d2 in pathways.items():
                if pid2 == pid:
                    continue
                n += sum(1 for c in d2.get("cards") or [] if ch in ALL_SURF[(pid2, c["name"])][1])
            pw_crosspath_reads[pid] = pw_crosspath_reads.get(pid, 0) + n

    # 途径指纹与平均风格距离（2026-10-01 差异化专项）：对他 21 途径的 1-cos 均值，分位计分
    all_unit_types = load_unit_types(pathways)
    lineage_status_ids = {sid for sid, sd in status_by_id.items() if "lineageStack" in sd}
    casttime_status_ids = {sid for sid, sd in status_by_id.items()
                           if any(bm.get("op") == "cast_time_set" for bm in (sd.get("behaviorModifiers") or [])
                                  if isinstance(bm, dict))}
    grow_status_ids = {sid for sid, sd in status_by_id.items() if sd.get("statPerStack")}
    # flag 读侧通用索引（批次十/十一对齐）：机制键的权威承载在状态 def
    flag_status_index = {"cast_time_set": casttime_status_ids, "statPerStack": grow_status_ids}
    fps = {pid: fingerprint(d.get("cards") or [], status_by_id) for pid, d in pathways.items()}
    mean_dists = {}
    nearest = {}
    for pid in pathways:
        others = [p2 for p2 in pathways if p2 != pid]
        if not others:
            mean_dists[pid] = 0.0
            nearest[pid] = (None, 0.0)
            continue
        ds = {p2: cos_dist(fps[pid], fps[p2]) for p2 in others}
        mean_dists[pid] = round(sum(ds.values()) / len(ds), 4)
        nb = min(ds, key=ds.get)
        nearest[pid] = (nb, round(ds[nb], 4))
    _sorted_d = sorted(mean_dists.values())
    _n_pw = len(_sorted_d)

    def _dist_pts(m):
        pct = (sum(1 for v in _sorted_d if v <= m)) / _n_pw if _n_pw else 0
        # SCORING 2.3：六档（原四档把 12 族的距离压得太扁）
        return (15 if pct >= 5 / 6 else 12 if pct >= 4 / 6 else 9 if pct >= 3 / 6
                else 6 if pct >= 2 / 6 else 3 if pct >= 1 / 6 else 0)

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
                               min((r for r in arows), key=lambda r: r["total"])["axis"], FIX["min_axis"]))
        elif min_axis < 40:
            health -= 5
            deductions.append(("轴健康度", "-5：最低轴 %.0f 分（<40）" % min_axis,
                               min((r for r in arows), key=lambda r: r["total"])["axis"], FIX["min_axis"]))
        health = max(0, round(health * 35 / 100, 1))

        # 封顶归一（SCORING 2.0）：通道耦合为重尾分布，用 ÷CAP 而非 ÷max，避免单点离群压平全库
        CAP_CROSSAXIS, CAP_CROSSPATH = 12, 16
        crossaxis = round(15 * min(pw_crossaxis_refs.get(pid, 0), CAP_CROSSAXIS) / CAP_CROSSAXIS, 1)
        if crossaxis < 7.5:
            deductions.append(("跨轴耦合", "-%s：本途径他轴身份读取 %d 次" % (15 - crossaxis, pw_crossaxis_refs.get(pid, 0)), pid, FIX["crossaxis"]))
        crosspath_raw = pw_crosspath_reads.get(pid, 0) + pw_hub_statuses.get(pid, 0) * 4  # 枢纽状态折算 4 次读段
        crosspath = round(15 * min(crosspath_raw, CAP_CROSSPATH) / CAP_CROSSPATH, 1)
        if crosspath < 7.5:
            deductions.append(("跨系联动", "-%s：枢纽状态 %d 个 + combo 读取 %d 次" % (15 - crosspath, pw_hub_statuses.get(pid, 0), pw_crosspath_reads.get(pid, 0)), pid, FIX["crosspath"]))

        # 结构健康（2026-10-16 权重 10→5：全库已满分无区分度，压到 5 保合规底线）
        struct = 0
        bad_rarity = 0
        for c in cards:
            want = [r for r, seqs in rarity_map.items() if c.get("sequence") in seqs]
            if want and c.get("rarity") not in want:
                bad_rarity += 1
        struct += 4 if bad_rarity == 0 else max(0, 4 - bad_rarity)
        actives = sum(1 for c in cards if c.get("kind") == "active")
        passives = len(cards) - actives
        aratio = actives / passives if passives else 99
        if 1.5 <= aratio <= 3.0:
            struct += 3
        else:
            s5 = max(0, round(3 - abs(aratio - (1.5 if aratio < 1.5 else 3.0))))
            struct += s5
            deductions.append(("结构健康", "-%s：主被动比 %.2f 不在 [1.5, 3.0]" % (3 - s5, aratio), pid, FIX["aratio"]))
        n_flag = sum(1 for c in cards if c.get("flagship"))
        struct += max(0, 3 - abs(4 - n_flag))
        if n_flag != 4:
            deductions.append(("结构健康", "-%d：旗舰卡 %d 张（理想 4）" % (abs(4 - n_flag), n_flag), pid, FIX["flagship"]))
        struct = round(struct * 0.5, 1)          # 10 → 5

        # 机制落地（2026-10-16 权重 10→5：全库已满分无区分度）
        flags = [f for c in cards for f in (c.get("frameworkFlags") or [])]
        if not flags:
            landed_score = 5
        else:
            landed_n = sum(1 for f in flags if f.get("landed"))
            landed_score = round(5 * landed_n / len(flags), 1)
            for f in flags:
                if not f.get("landed"):
                    deductions.append(("机制落地", "-：frameworkFlags 未落地 %s" % f.get("code", "?"),
                                       f.get("note", "")[:60], FIX["landed"]))

        # 文本完备（权重 10→5）
        txt = sum(1 for c in cards if c.get("lore") and c.get("flavor") and c.get("describe"))
        text_score = round(5 * txt / len(cards), 1) if cards else 0

        # 强项族（展示用）：族内键种数降序，每族 Top2 键——让十二族口径在页面上可见
        style_strengths = []
        for f in FAMILIES:
            vec = fps[pid].get(f) or {}
            if not vec:
                continue
            top = sorted(vec.items(), key=lambda kv: (-kv[1], kv[0]))[:2]
            style_strengths.append({"family": f, "keys": [k for k, _ in top], "distinct": len(vec)})
        style_strengths.sort(key=lambda x: (-x["distinct"], x["family"]))
        style_strengths = style_strengths[:4]

        # 差异化（SCORING 2.3，权重 35）= 签名键落地 15 + 指纹距离 15 + 构型多样 5
        sig_keys = PATHWAY_SIGNATURES.get(pid, [])
        sig_hits = signature_counts(cards, sig_keys, unit_type_of=all_unit_types,
                                    lineage_ids=lineage_status_ids, flag_status_index=flag_status_index)
        signature_score = min(15, sum(6 if h >= 2 else 3 * h for h in sig_hits.values()))
        dist_pts = _dist_pts(mean_dists[pid])
        shapes = [set(r["shape"]) for r in arows]
        pairs = [(shapes[i], shapes[j]) for i in range(len(shapes)) for j in range(i + 1, len(shapes))]
        jac = (sum((len(a & b) / len(a | b)) if (a | b) else 1.0 for a, b in pairs) / len(pairs)) if pairs else 1.0
        config_div = round(5 * (1 - jac), 1)
        style_score = round(signature_score + dist_pts + config_div, 1)
        if signature_score < 15:
            blanks = [k for k, h in sig_hits.items() if h == 0]
            deductions.append(("差异化", "-%s：签名键零使用 %s" % (15 - signature_score, ",".join(blanks) or "（有键仅 1 卡，未落地）"), pid, FIX["signature"]))
        if dist_pts <= 3:
            deductions.append(("差异化", "-：途径指纹距离垫底（对他 21 途径均距 %.3f）" % mean_dists[pid], pid, FIX["uniqueness"]))
        if config_div < 2.5:
            deductions.append(("差异化", "-：四轴构型雷同（构型多样 %.1f/5，四轴产出面/原语高度重叠）" % config_div, pid, FIX["config"]))

        # SCORING 2.3：三项合规维改为门禁——不计入 100 分，未达标各扣 3
        gates = {"结构健康": struct >= 4.95, "机制落地": landed_score >= 4.95,
                 "文本完备": text_score >= 4.95}
        gate_penalty = 3 * sum(1 for ok in gates.values() if not ok)
        total = round(health + crossaxis + crosspath + style_score - gate_penalty, 1)
        pw_rows.append({
            "id": pid, "name": d.get("pathwayName"), "cards": len(cards),
            "total": total,
            "dims": {"轴健康度": health, "跨轴耦合": crossaxis, "跨系联动": crosspath,
                     "结构健康": round(struct, 1), "机制落地": landed_score, "文本完备": text_score,
                     "差异化": style_score},
            "sigHits": sig_hits, "styleDist": mean_dists[pid],
            "gates": gates, "gatePenalty": gate_penalty,
            "styleStrengths": style_strengths,
            "styleParts": {"signature": signature_score, "fingerprint": dist_pts,
                           "config": config_div},
            "nearest": nearest[pid][0], "nearestDist": nearest[pid][1],
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
    L.append("| # | 途径 | 总分 | 轴健康 | 跨轴 | 跨系 | 结构 | 落地 | 文本 | 差异 | 最低轴 | 卡数 |")
    L.append("|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|")
    for i, r in enumerate(pw_rows, 1):
        d = r["dims"]
        L.append("| %d | **%s** `%s` | **%.1f** | %.1f | %.1f | %.1f | %.1f | %.1f | %.1f | %.1f | %.0f | %d |" % (
            i, r["name"], r["id"], r["total"], d["轴健康度"], d["跨轴耦合"], d["跨系联动"],
            d["结构健康"], d["机制落地"], d["文本完备"], d["差异化"], r["min_axis"], r["cards"]))
    L.append("")

    for r in pw_rows:
        L.append("\n## %s（%s）· %.1f 分\n" % (r["name"], r["id"], r["total"]))
        L.append("| 维度 | 得分 |")
        L.append("|---|---:|")
        for k, v in r["dims"].items():
            L.append("| %s | %.1f |" % (k, v))
        L.append("")
        if r.get("sigHits"):
            L.append("签名键用量（≥2 卡实证 = 落地；键表见 途径设计身份.md §一）：" +
                     "；".join("%s ×%d" % (k, v) for k, v in r["sigHits"].items()) +
                     "；对他途径指纹均距 %.3f" % r.get("styleDist", 0))
            L.append("")
        if r["deductions"]:
            L.append("**途径失分项（含修改意见）**：")
            L.append("")
            for dim, why, ref, fix in r["deductions"]:
                L.append("- `%s` %s（%s）→ %s" % (dim, why, ref, fix))
            L.append("")
        L.append("| 轴 | 总分 | 身份 | 产层 | 收束 | 多样 | 规模 | 连通 | 实证 enabler | 实证 payoff | notes 级 |")
        L.append("|---|---:|---:|---:|---:|---:|---:|---:|---|---|---|")
        for a in sorted(r["axes"], key=lambda x: x["total"]):
            ad = a["dims"]
            L.append("| %s %s `%s` | **%.1f** | %.0f | %.0f | %.0f | %.1f | %.0f | %.0f | %s | %s | %s |" % (
                a["symbol"] or "", a["name"], a["axis"], a["total"], ad["身份锚定"], ad["产层闭环"],
                ad["收束闭环"], ad["轴内多样性"], ad["规模均衡"], ad["承接连通"],
                ",".join(a["enablers_v"]) or "—", ",".join(a["landed"]) or "—", ",".join(a["notes"]) or "—"))
        L.append("")
        for a in sorted(r["axes"], key=lambda x: x["total"]):
            if a["deductions"]:
                L.append("**%s %s 失分项（含修改意见）**：" % (a["symbol"] or "", a["name"]))
                L.append("")
                for dim, why, ref, fix in a["deductions"]:
                    L.append("- `%s` %s（%s）→ %s" % (dim, why, ref, fix))
                L.append("")
    io.open(os.path.join(ANALYSIS_DIR, "scorecard.md"), "w", encoding="utf-8").write("\n".join(L))


def write_scores_json(pw_rows):
    out = {
        "generated": str(datetime.date.today()),
        "standard": "docs/meta/SCORING.md",
        "pathways": [{
            "id": r["id"], "name": r["name"], "total": r["total"], "dims": r["dims"],
            "minAxis": r["min_axis"], "cards": r["cards"],
            "sigHits": r.get("sigHits", {}), "styleDist": r.get("styleDist", 0),
            "gates": r.get("gates", {}), "gatePenalty": r.get("gatePenalty", 0),
            "styleStrengths": r.get("styleStrengths", []),
            "styleParts": r.get("styleParts", {}),
            "nearest": r.get("nearest"), "nearestDist": r.get("nearestDist", 0),
            "deductions": [{"dim": d, "why": w, "ref": x, "fix": f} for d, w, x, f in r["deductions"]],
            "axes": [{
                "id": a["axis"], "name": a["name"], "symbol": a["symbol"], "total": a["total"],
                "dims": a["dims"], "cards": a["cards"],
                "enablersVerified": a["enablers_v"], "payoffsLanded": a["landed"],
                "payoffsNotes": a["notes"], "patterns": a["patterns"],
                "vacuumAccepted": a["vacuum_accepted"],
                "deductions": [{"dim": d, "why": w, "ref": x, "fix": f} for d, w, x, f in a["deductions"]],
            } for a in sorted(r["axes"], key=lambda x: x["total"])],
        } for r in pw_rows],
    }
    io.open(os.path.join(ANALYSIS_DIR, "scores.json"), "w", encoding="utf-8").write(
        json.dumps(out, ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main()
