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
from status_loader import iter_status_defs, load_common_ids

UNIT_INDEX = None


def unit_index():
    """unitId -> unitDef（懒加载；召唤卡的指纹要跟随召唤物蓝本的攻击载荷）。"""
    global UNIT_INDEX
    if UNIT_INDEX is None:
        UNIT_INDEX = {}
        for f in sorted(glob.glob(os.path.join(JSON_DIR, "*.skills.json"))):
            d = json.load(io.open(f, encoding="utf-8"))
            for u in d.get("unitDefs") or []:
                UNIT_INDEX[u["id"]] = u
    return UNIT_INDEX


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


def card_effects(card):
    """卡的全部效果节点：effects 链 + triggers[].effects（被动/触发载荷）。
    2026-10-20 起与主动效果同口径——只读 effects 会让被动卡的指纹/作用面退化成一个挂载节点。"""
    effs = list(card.get("effects") or [])
    for tr in card.get("triggers") or []:
        if isinstance(tr, dict):
            effs.extend(tr.get("effects") or [])
    return effs


def card_effect_types(card):
    return {n["type"] for n in walk(card_effects(card)) if "type" in n and isinstance(n.get("type"), str)}


def card_condition_kinds(card):
    return {n["kind"] for n in walk(card_effects(card)) if n.get("kind") == n.get("kind") and "kind" in n and isinstance(n.get("kind"), str)}


def card_refs_status(card, sid):
    """卡面 AST 是否引用状态 sid（mount/modify/transfer/dispel 的 statusId、condition/filter 的 id/hasStatus）。"""
    for n in walk(card_effects(card)):
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
    for n in walk(card_effects(card)):
        if n.get("type") == "modify_resource" and n.get("resource") == res:
            return True
        if n.get("kind") == "resource_compare" and n.get("key") == res:
            return True
    return False


def card_mounts(card):
    return {n.get("statusId") for n in walk(card_effects(card))
            if n.get("type") == "mount_status" and isinstance(n.get("statusId"), str)}


def card_def_refs(card, def_index):
    """卡片 spawn/domain 出的区域(zoneDef)/界域(domainDef) def 对象；读层判定跟随其载荷
    （与 card_mounts 跟挂载状态 def 同理，SCORING.md 口径「condition/filter/触发器引用身份状态」）。"""
    out, seen = [], set()
    for n in walk(card_effects(card)):
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
            # 消费型写入也是读：资源必须先存在才能被减去
            if n.get("type") == "modify_resource":
                r = n.get("resource")
                v = n.get("value")
                if r in ("secrecy", "order", "fate_value", "death_tally") and (
                        n.get("mode") == "consume" or (isinstance(v, (int, float)) and v < 0)):
                    ch.add(r)
            if isinstance(n.get("phases"), list):        # phaseHooks / phase_is
                ch.add("phase")
            d = n.get("dim")                              # dimHooks
            if isinstance(d, str) and d in ("luminance", "secrecy", "order", "fate_value", "death_tally"):
                ch.add(d)
    return ch


def obj_status_refs(obj):
    """任一 AST 容器读入的状态 id（条件谓词 / modify_status / dispel / transfer_status 的 statusId 与 hasStatus）。
    mount_status 只写不读——挂个状态不等于读取本轴产出面（防「产层冒充读层」）。"""
    out = set()
    for n in walk(obj):
        if n.get("type") != "mount_status":
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


def equipped_status_refs(card, status_by_id):
    """has_equipped 条件读取的装备状态：按 slot 命中（缺省 = 任意 equipSlot）。
    条件不点名具体武器，读到的是该槽位全部装备定义——新增武器自动纳入。"""
    out = set()
    for n in walk(card_effects(card)):
        if n.get("kind") != "has_equipped":
            continue
        slot = n.get("slot")
        out |= {i for i, s in status_by_id.items()
                if s.get("equipSlot") and (not slot or s.get("equipSlot") == slot)}
    return out


def card_status_refs(card):
    return obj_status_refs(card_effects(card))


def surface_of(card, status_by_id, def_index):
    """卡的作用面 (writes, reads)：状态面 ∪ 通道面。objs = 卡 + 挂载状态 def + spawn/domain def。"""
    mounted = [status_by_id.get(m) for m in card_mounts(card)]
    objs = [card] + [m for m in mounted if m] + card_def_refs(card, def_index)
    writes = {"status:" + m for m in card_mounts(card)} | channel_writes(objs)
    reads = {"status:" + s for s in card_status_refs(card)} | channel_reads(objs)
    reads |= {"status:" + s for s in equipped_status_refs(card, status_by_id)}
    # 挂载/区域 def 自身对状态的引用也算读（payoff 经专属状态读层）
    for o in ([m for m in mounted if m] + card_def_refs(card, def_index)):
        reads |= {"status:" + s for s in obj_status_refs(o)}
    return writes, reads


# ---------- 机制条目 facet：全局概念按「怎么对待」拆分（SCORING 2.5） ----------
# 全局概念（武器槽 / 相位 / 资源 / 原语）不属于任何轴；轴只占有自己在概念上实现的
# 机制条目。跨轴耦合按「同条目命中」计，不按概念本身计。

GLOBAL_ANCHOR_KINDS = ("equipment", "channel", "resource", "primitive")


def _slot_statuses(anchor_id, status_by_id):
    return {i for i, s in status_by_id.items() if s.get("equipSlot") == anchor_id}


def _card_objs(card, status_by_id, def_index):
    mounted = [status_by_id.get(m) for m in card_mounts(card)]
    return [card] + [m for m in mounted if m] + card_def_refs(card, def_index)


def card_facets(card, anchor, status_by_id, def_index):
    """卡面在某个全局概念锚点上实际使用的机制条目集合。

    词表（SCORING.md §二·三）：
      equipment : equip / durability_consume / durability_replenish /
                  read_equipped / dump / steal
      channel   : write / read / cycle
      resource  : produce / consume / threshold
      primitive : use
    """
    if not isinstance(anchor, dict):
        return set()
    kind, aid = anchor.get("kind"), anchor.get("id")
    if kind not in GLOBAL_ANCHOR_KINDS or not aid:
        return set()
    facets = set()
    objs = _card_objs(card, status_by_id, def_index)
    if kind == "equipment":
        slot_ids = _slot_statuses(aid, status_by_id)
        mounted = card_mounts(card) & slot_ids
        if mounted:
            facets.add("equip")
        if (card_status_refs(card) | equipped_status_refs(card, status_by_id)) & slot_ids:
            facets.add("read_equipped")
        for sid in mounted:
            sd = status_by_id.get(sid) or {}
            if (isinstance(sd.get("charges"), int) and sd["charges"] > 0) or any(
                    isinstance(t, dict) and t.get("consumeCharge")
                    for t in (sd.get("triggers") or [])):
                facets.add("durability_consume")
        for o in objs:
            for n in walk(o):
                if n.get("restoreCharges"):
                    facets.add("durability_replenish")
                if n.get("type") == "modify_status" and n.get("slot") == aid:
                    if n.get("charges") == 0 or n.get("consumeCharges") == "all":
                        facets.add("dump")
                    if isinstance(n.get("chargesDelta"), (int, float)) and n["chargesDelta"] < 0:
                        facets.add("durability_consume")
                if n.get("type") in ("transfer_status", "take_control", "dispel"):
                    sids = n.get("statusId") or n.get("statusIds") or []
                    if isinstance(sids, str):
                        sids = [sids]
                    if (isinstance(sids, list) and set(sids) & slot_ids) or n.get("slot") == aid:
                        facets.add("steal")
    elif kind == "channel":
        if aid in channel_writes(objs):
            facets.add("write")
        if aid in channel_reads(objs):
            facets.add("read")
        if any(isinstance(s, dict) and any(s.get(k) for k in ("formGroup", "phases", "cycleTicks"))
               for s in (status_by_id.get(m) for m in card_mounts(card)) if s):
            facets.add("cycle")
    elif kind == "resource":
        for n in walk(card_effects(card)):
            if n.get("type") == "modify_resource" and n.get("resource") == aid:
                v = n.get("value")
                if n.get("mode") == "consume" or (isinstance(v, (int, float)) and v < 0):
                    facets.add("consume")
                else:
                    facets.add("produce")
            if n.get("kind") == "resource_compare" and n.get("key") == aid:
                facets.add("threshold")
    elif kind == "primitive":
        if aid in card_effect_types(card):
            facets.add("use")
    return facets


def axis_mechanism_facets(axis_cards, anchor, status_by_id, def_index):
    """轴锚定的全局概念上实际占用的机制条目 (kind, id, facet)。

    只算锚点概念：轴没有把某个概念声明为身份，就不占有它的机制条目
    （避免「用过相位 = 独霸相位」）。resource / primitive 同理。
    """
    if not isinstance(anchor, dict) or anchor.get("kind") not in GLOBAL_ANCHOR_KINDS \
            or not anchor.get("id"):
        return set()
    kind, aid = anchor["kind"], anchor["id"]
    out = set()
    for c in axis_cards:
        for f in card_facets(c, anchor, status_by_id, def_index):
            out.add((kind, aid, f))
    return out


def card_mechanism_facets(card, axis_facets, status_by_id, def_index):
    """卡面命中轴 facet 集合的条目（同概念同条目才算）。"""
    concepts = {(k, i) for (k, i, _f) in axis_facets}
    got = set()
    for k, i in concepts:
        for f in card_facets(card, {"kind": k, "id": i}, status_by_id, def_index):
            got.add((k, i, f))
    return got & axis_facets


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
    "crossaxis": "挑 1–2 张本途径 payoff 卡，加读他轴私有机制产出或复用同一条全局概念 facet 的条件/放大段",
    "crosspath": "挂 1 个枢纽状态（查 crossPathway 白名单缺什么）或给已有卡加跨系读取段",
    "aratio": "补主动或被动卡，把主被动比调进 [1.5, 3.0]",
    "flagship": "补/撤旗舰卡至 4 张",
    "landed": "待内核裁定该 frameworkFlag；短期用卡面 note 写的退化方案表达",
    "signature": "按身份卡补签名键卡（见 途径设计身份.md §二），每键 ≥2 卡实证",
    "uniqueness": "降低 mount_status+damage 通用骨架占比，把轴 payoff 换成签名键机制（最近邻见 STYLE_DISTANCE.md）",
    "config": "让四轴各走不同形状（产出面/通道或原语分化），避免四轴同一套骨架",
    "dedup": "把同形状卡改成分化写法（读层/选靶/触发点/状态形态至少一项不同）；整组复制会被本项直接抓住",
    "role_conflict": "改 role（卡实为承重件）或移出 axes.enablers/payoffs 登记（口径 SCORING §一·附）",
    "role_semantic": "补身份动作 / 跨界读取 / 风险段，或把 role 改回真实定位（口径 SCORING §一·附）",
    "style_oob": "人工复核：属共享语义分叉 / 全局通用机制则保留，否则收回本途径主签名维度内",
}
FIX_NOTE = "（注）核对这几张卡的卡面：补挂身份段，或从 axes 元数据移除"
FIX_ROLE_MISJUDGE = "如属误判请改 role 而非改卡（SCORING §一·附）"


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
        return any(n.get("element") == arg for n in walk(card_effects(card)))
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
               for n in walk(card_effects(card))):
            return True
        # 位格洞察读侧口径（2026-10-02 批次六对齐）：stat_compare(key=rank) 与 rank_gap 谓词
        # 同为位格使用——洞察途径读位格而非改位格，原口径只认 modify_stat 致签名键永零。
        if arg == "rank":
            return any((n.get("kind") == "stat_compare" and n.get("key") == "rank")
                       or n.get("kind") == "rank_gap"
                       for n in walk(card_effects(card)))
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
        return arg in evs or any(n.get("event") == arg for n in walk(card_effects(card)))
    if kind == "sref":
        # 谱系栈读侧口径（2026-10-02 批次九对齐）：卡引用任何带 lineageStack 字段的状态（狼人化/灵体化/
        # 异类之王/演出回放）即计使用——原口径按 statusId=="lineage_stack" 取证，该 id 非状态，键永零。
        if arg == "lineage_stack" and lineage_ids:
            return any(card_refs_status(card, s) for s in lineage_ids)
        return card_refs_status(card, arg)
    if kind == "unitType":
        # 归一键口径（2026-10-02 批次十对齐）：旧键 unitType 标量与 target_unit_type 谓词的
        # type 数组双认——原只认标量，归一后的谓词写法永不计数（与批次五 filter.unitType 修复同源）。
        for n in _filter_unit_type_nodes(card_effects(card)):
            if n.get("unitType") == arg or (isinstance(n.get("type"), list) and arg in n["type"]):
                return True
        # 经 spawn unitId 解析（召唤物类型归属）
        if unit_type_of:
            for n in walk(card_effects(card)):
                if n.get("type") == "spawn" and unit_type_of.get(n.get("unitId")) == arg:
                    return True
        return False
    if kind == "flag":
        if arg == "filter.unitType":
            return bool(_filter_unit_type_nodes(card_effects(card)))
        if flag_status_index and arg in flag_status_index:
            ids = flag_status_index[arg]
            # 状态面读侧口径：机制键（cast_time_set 行为算子 / statPerStack 成长引擎）的权威承载
            # 在状态 def，卡经 mount/引用该状态即计使用。
            if any(card_refs_status(card, sid) for sid in ids):
                return True
            if arg == "cast_time_set":
                # 亦认 modify_skill 的 castTimeDelta/setInstant（技能实例级省时）。
                for n in walk(card_effects(card)):
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
            "tgt", "hook", "sshape", "cost", "temporal", "unit")
# 召唤物自身的设定在召唤类技能里应是主载荷：unit 族 2× 权重（SCORING 2.8）。
FAMILY_WEIGHTS = {"unit": 2.0}


def _ratio_tier(v):
    if not isinstance(v, (int, float)):
        return None
    return "low" if v < 0.5 else "mid" if v <= 0.8 else "high"


def spawned_unit_defs(card):
    """卡面 spawn 引用的 unitDef（含 repeat 内的 spawn）。"""
    out, seen = [], set()
    idx = unit_index()
    for n in walk(card_effects(card)):
        if n.get("type") != "spawn":
            continue
        uid = n.get("unitId") or n.get("template") or n.get("unitIdx")
        if isinstance(uid, str) and uid in idx and uid not in seen:
            seen.add(uid)
            out.append(idx[uid])
    return out


def _card_families(card, status_by_id=None):
    """单卡在各链路族上的**键集**：原语 / 元素 / 谓词 / 谓词参数 / 效果参数 / 射程 /
    选靶（卡级坐标 + filter + 效果级作用对象）/ 触发点 / 状态形态 / 消耗形态 / 时序形态。
    召唤卡的效果空间额外包含所召唤 unitDef 的触发载荷（攻击效果属于卡面机制）。"""
    fam = {f: set() for f in FAMILIES}
    spawned = spawned_unit_defs(card)
    unit_effects = [e for u in spawned for tr in (u.get("triggers") or [])
                    if isinstance(tr, dict) for e in (tr.get("effects") or [])]
    mounted = [status_by_id.get(m) for m in card_mounts(card)
               if status_by_id and status_by_id.get(m)]
    mounted_effects = [e for sd in mounted for tr in (sd.get("triggers") or [])
                       if isinstance(tr, dict) for e in (tr.get("effects") or [])]
    space = card_effects(card) + unit_effects + mounted_effects
    fam["prim"] |= card_effect_types(card)
    fam["prim"] |= {n.get("type") for n in walk(unit_effects + mounted_effects)
                    if isinstance(n.get("type"), str)}

    for n in walk(space):
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
        if t == "spawn":
            uid = n.get("unitId") or n.get("template") or n.get("unitIdx")
            if isinstance(uid, str):
                fam["param"].add("unit=" + uid)
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

    fam["cond"] |= set(_cond_kinds(space))
    fam["condarg"] |= _cond_args(space)

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

    # 召唤物蓝本：元素 / tag / 单位键（卡面产出的一部分）
    for u in spawned:
        if isinstance(u.get("element"), str):
            fam["elem"].add(u["element"])
            fam["unit"].add("elem:" + u["element"])
        for tg in u.get("tags") or []:
            fam["param"].add("unitTag=" + tg)
            fam["unit"].add("tag:" + tg)
        fam["param"].add("unit=" + u["id"])
        if isinstance(u.get("unitType"), str):
            fam["unit"].add("type:" + u["unitType"])
        base = u.get("base") if isinstance(u.get("base"), dict) else {}
        reach = base.get("reach") or u.get("reach")
        if isinstance(reach, str):
            fam["unit"].add("reach:" + reach)
        hp = u.get("hpRatio") if u.get("hpRatio") is not None else base.get("hpRatio")
        atk = u.get("atkRatio") if u.get("atkRatio") is not None else base.get("atkRatio")
        ht, at = _ratio_tier(hp), _ratio_tier(atk)
        if ht:
            fam["unit"].add("hp:" + ht)
        if at:
            fam["unit"].add("atk:" + at)
        for tr in u.get("triggers") or []:
            if not isinstance(tr, dict):
                continue
            ev = tr.get("event")
            prims = sorted({e.get("type") for e in walk(tr.get("effects") or [])
                            if isinstance(e.get("type"), str)})
            for p in prims:
                fam["unit"].add("trig:%s:%s" % (ev, p))
            if not prims and isinstance(ev, str):
                fam["unit"].add("trig:" + ev)

    # sshape：引用的状态 → 状态形态（替代私有 statusId 身份；含召唤物蓝本的载荷）
    status_refs = set(card_status_refs(card))
    for u in spawned:
        status_refs |= obj_status_refs(u)
    for sid in status_refs:
        sd = (status_by_id or {}).get(sid)
        if sd:
            fam["sshape"] |= _status_shape(sd)
    for sd in mounted:
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


def cos_dist_by_family(a, b):
    """分族余弦距离：族 -> 距离（双侧皆空的族不出现于结果）。L2 归一后每族一票。"""
    out = {}
    for f in FAMILIES:
        fa, fb = _l2(a.get(f) or {}), _l2(b.get(f) or {})
        keys = set(fa) | set(fb)
        if not keys:
            continue
        dot = sum(fa.get(k, 0) * fb.get(k, 0) for k in keys)
        out[f] = 1.0 - dot
    return out


def cos_dist(a, b):
    """全链路距离 = 各链路族余弦距离的加权均值（L2 归一后每族一票；unit 族 2×）。"""
    by_fam = cos_dist_by_family(a, b)
    total, wsum = 0.0, 0.0
    for f, d in by_fam.items():
        w = FAMILY_WEIGHTS.get(f, 1.0)
        total += w * d
        wsum += w
    return total / wsum if wsum else 1.0


def card_vectors(cards, status_by_id=None):
    """卡级指纹向量（与途径指纹同族同口径）。"""
    return [{f: {k: 1 for k in keys} for f, keys in _card_families(c, status_by_id).items()}
            for c in cards]


def intra_dedup(cards, status_by_id=None, low=0.20, cap=0.15):
    """途径内去重复用（差异化第 4 项）：卡级指纹两两距离 < 0.20 的对数占比。
    返回 (low_ratio, points 0–11)，占比越低分越高；cap=15% 判零分。
    对整组复制敏感（×N 后 low_ratio 暴涨），补上「途径间距离」测不出的自我复制。
    角色豁免（SCORING §一·附）：双方均 generic / 双方均 starter 的对不计入——
    入门对与刻意补位对的相似是设计意图；防整组隐身靠 generic ≤25% 配比上限。"""
    vecs = card_vectors(cards, status_by_id)
    roles = [c.get("role") for c in cards]
    n = len(vecs)
    pairs = n * (n - 1) // 2
    if pairs == 0:
        return 0.0, 11.0
    low_n = 0
    for i in range(n):
        for j in range(i + 1, n):
            if roles[i] and roles[i] == roles[j] and roles[i] in ("generic", "starter"):
                continue
            if cos_dist(vecs[i], vecs[j]) < low:
                low_n += 1
    ratio = low_n / pairs
    return ratio, round(11 * max(0.0, 1 - ratio / cap), 1)


def card_has_risk_segment(card):
    """trap 风险段（SCORING §一·附）：chance 条件 / 含失败分支的双分支条件 /
    自伤（damage 或负向 modify_stat 落 self）。满足其一即「有输面」。"""
    for n in walk(card_effects(card)):
        if not isinstance(n, dict):
            continue
        if n.get("kind") == "chance":
            return True
        if n.get("op") == "if":
            els = [x for x in (n.get("else") or []) if isinstance(x, dict)]
            if els:
                return True
        if n.get("type") == "damage" and n.get("target") == "self":
            return True
        if n.get("type") == "modify_stat" and n.get("target") == "self" and (n.get("value") or 0) < 0:
            return True
    return False


def apply_role_fix_overlay(deds, card_by_name):
    """失分清单 fix 覆写（SCORING §一·附）：ref 指向已声明豁免角色（generic/starter/tech）
    的卡时，「改卡面」类建议可能误伤设计意图，fix 前冠改 role 提示。原地改写四元组列表。"""
    for i, (dim, why, ref, fix) in enumerate(deds):
        if fix.startswith(FIX_ROLE_MISJUDGE) or fix in (FIX["role_conflict"], FIX["role_semantic"]):
            continue
        names = [x.strip() for x in str(ref).split(",")]
        if any((card_by_name.get(nm) or {}).get("role") in ("generic", "starter", "tech")
               for nm in names):
            deds[i] = (dim, why, ref, FIX_ROLE_MISJUDGE + "；原建议：" + fix)


def load_unit_types(pathways):
    """unitId -> unitType。权威 = ddd 召唤物参数.md §一 37 具名单位归属表（多数单位 JSON 无 Def，仅被 spawn 引用）；
    skills.json 顶层 unitDefs 池中的显式定义叠加覆盖。"""
    out = {("unit_" + k): v for k, v in {
        "skeleton": "UNDEAD", "zombie": "UNDEAD", "ghoul": "UNDEAD", "wraith": "UNDEAD",
        "nature_spirit": "SPIRIT", "nature_spirit_swarm": "SPIRIT",
        "grazed_wraith": "SPIRIT", "fallen_kin": "SPIRIT",
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
    pw_crosspath_consumers = {}  # pathwayId -> set(消费本途径的他途径 id)（2.10 消费方多样性）
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

    # 私有机制产出归属：状态 -> 途径内占多数的轴（排除 common 与装备槽状态）。
    # 全局概念（武器槽等）不归任何轴，只按 facet 计耦合。
    common_ids = load_common_ids()
    status_axis_owner = {}
    for _pid, _d in pathways.items():
        _axes = _d.get("axes") or {}
        _ident = {a.get("statusId"): aid for aid, a in _axes.items()
                  if isinstance(a, dict) and a.get("statusId")}
        _class_ids = {m.get("statusId") for m in (_d.get("classMechanics") or [])
                      if isinstance(m, dict) and m.get("statusId")}
        _mount_cnt = {}
        for _c in _d.get("cards") or []:
            for _s in card_mounts(_c):
                _mount_cnt.setdefault(_s, {}).setdefault(_c.get("axis"), 0)
                _mount_cnt[_s][_c.get("axis")] += 1
        for _s, _cnt in _mount_cnt.items():
            if _s in common_ids or _s in _class_ids:
                continue
            _sd = status_by_id.get(_s) or {}
            if _sd.get("equipSlot"):
                continue
            if _s in _ident:
                _owner = _ident[_s]
            else:
                _owner = max(_cnt, key=lambda a: (_cnt[a], a == _ident.get(_s)))
            status_axis_owner[(_pid, _s)] = _owner

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
            # 轴身份锚点（SCORING §二·零）：anchor 优先；statusId 为 kind=status 的兼容简写
            anchor_spec = ax.get("anchor") or ({"kind": "status", "id": ax["statusId"]} if ax.get("statusId") else None)
            a_kind = anchor_spec.get("kind") if isinstance(anchor_spec, dict) else None
            a_id = anchor_spec.get("id") if isinstance(anchor_spec, dict) else None
            identity_items = set()
            identity_channel = None
            if a_kind == "status" and a_id:
                sid = a_id
            elif a_kind and a_kind != "status":
                sid = None
            slot_ids = set()
            if a_kind == "equipment" and a_id:
                slot_ids = {i for i, s in status_by_id.items() if s.get("equipSlot") == a_id}
                identity_items = {"status:" + i for i in slot_ids}
            elif a_kind == "channel" and a_id:
                identity_channel = a_id
                identity_items = {a_id}
            elif a_kind == "primitive" and a_id:
                identity_items = {"prim:" + a_id}
            elif a_kind == "resource" and a_id:
                identity_pool = a_id
            outputs = ({"status:" + sid} if sid else set()) | identity_items | ax_channels
            if a_kind in ("resource", "channel", "equipment", "primitive") and a_id:
                anchor = 8
                ok = False
                if a_kind == "channel":
                    ok = a_id in ax_writes
                elif a_kind == "equipment":
                    def _mounts_slot(c):
                        for n in walk(card_effects(c)):
                            if n.get("type") == "mount_status" and n.get("statusId") in slot_ids:
                                return True
                        return False
                    ops = [c for c in axis_cards if _mounts_slot(c)]
                    ok = len(ops) >= 2 and any((status_by_id[i] or {}).get("charges") for i in slot_ids)
                elif a_kind == "primitive":
                    ok = sum(1 for c in axis_cards if a_id in card_effect_types(c)) >= 2
                elif a_kind == "resource":
                    ok = any((s.get("thresholdTrigger") or {}).get("metric") == a_id
                             for s in status_by_id.values())
                if ok:
                    anchor += 7
                else:
                    deductions.append(("身份锚定", "-7：锚点 %s:%s 机制闭环不足（操作/读取卡 <2 或无机制面）"
                                       % (a_kind, a_id), aid, FIX["no_layer_engine"]))
            elif sid and sid in status_by_id:
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
                    for node in walk(card_effects(c)):
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
                if a_kind == "primitive" and a_id:
                    return a_id in card_effect_types(c)
                if identity_items:
                    return bool(surf[c["name"]][0] & identity_items)
                if sid:
                    return ("status:" + sid) in surf[c["name"]][0]
                if identity_pool:
                    return card_refs_resource(c, identity_pool)
                return bool(surf[c["name"]][0] & set(CHANNELS))   # 产层 = 写入本轴身份通道

            # 角色冲突（SCORING §一·附）：generic/tech 被登记进 enablers 不算实证——
            # 承重件必须声明 core/trap，否则实证体系可被泛用卡刷满
            en_conflict = [n for n in enablers
                           if (card_by_name.get(n) or {}).get("role") in ("generic", "tech")]
            if en_conflict:
                deductions.append(("产层闭环", "注：角色冲突 %d 张（generic/tech 不得登记 enablers，不计实证）"
                                   % len(en_conflict), ",".join(en_conflict), FIX["role_conflict"]))
            en_pool = [n for n in enablers if n not in en_conflict]
            en_verified = [n for n in en_pool if _is_enabler(card_by_name.get(n))]
            en_missed = [n for n in en_pool if n not in en_verified]
            if len(en_verified) >= 2:
                closure_e = 20
            elif len(en_verified) == 1:
                closure_e = 12
                deductions.append(("产层闭环", "-8：实证 enabler 仅 1 张", ",".join(en_verified), FIX["enabler_only1"]))
            elif en_pool:
                closure_e = 5
                deductions.append(("产层闭环", "-15：enablers %d 张均未实证挂载身份" % len(en_pool), ",".join(en_missed), FIX["enabler_unverified"]))
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
                if a_kind == "primitive" and a_id:
                    return "landed" if a_id in card_effect_types(c) else "notes"
                if identity_items:
                    return "landed" if (surf[nm][1] & identity_items) else "notes"
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
                    for ob in [card_effects(c)] + card_def_refs(c, def_index):
                        for n in walk(ob):
                            if n.get("kind") == "resource_compare" and n.get("key") == identity_pool:
                                return "landed"
                            if n.get("type") == "modify_resource" and n.get("resource") == identity_pool and (n.get("value") or 0) < 0:
                                return "landed"
                    return "notes"
                return "landed" if (surf[nm][1] & outputs) else "notes"

            po_conflict = [n for n in payoffs
                           if (card_by_name.get(n) or {}).get("role") in ("generic", "tech")]
            if po_conflict:
                deductions.append(("收束闭环", "注：角色冲突 %d 张（generic/tech 不得登记 payoffs，不计实证）"
                                   % len(po_conflict), ",".join(po_conflict), FIX["role_conflict"]))
            po_pool = [n for n in payoffs if n not in po_conflict]
            landed, notes_level = [], []
            for n in po_pool:
                ev = _payoff_evidence(card_by_name.get(n))
                (landed if ev == "landed" else notes_level if ev == "notes" else []).append(n)
            closure_p = min(25, len(landed) * 9 + len(notes_level) * 4)
            if not po_pool:
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
                    deductions.append(("收束闭环", "-%d：payoff %d 张全部 notes 级（卡面不读本轴产出面）" % (25 - closure_p, len(po_pool)), ",".join(notes_level), FIX["payoff_notes"]))
                elif notes_level:
                    deductions.append(("收束闭环", "注：notes 级 %d 张（减半计）" % len(notes_level), ",".join(notes_level), FIX["payoff_notes"]))

            # —— 轴内多样性（2026-10-19 密度口径）：全链路词表去重形态 ÷ 卡数 ——
            # 原语 + 谓词（仅 then/else 均非空的双分支条件，上限 6）+ 选靶 + 触发点 + 状态形态。
            # 密度化消除「堆卡/空 if 刷种类」的规模代理；空 else 不计分支。
            prim_kinds, cond_kinds, chain_kinds = set(), set(), set()
            for c in axis_cards:
                prim_kinds |= card_effect_types(c)
                for n in walk(card_effects(c)):
                    if n.get("op") != "if":
                        continue
                    then = [x for x in (n.get("then") or []) if isinstance(x, dict)]
                    els = [x for x in (n.get("else") or []) if isinstance(x, dict)]
                    if then and els:
                        for cn in walk(n.get("condition")):
                            if isinstance(cn.get("kind"), str):
                                cond_kinds.add(cn["kind"])
                cf = _card_families(c, status_by_id)
                chain_kinds |= {"tgt:" + k for k in cf["tgt"] if k.startswith(("scope=", "anchor="))}
                chain_kinds |= {"hook:" + k for k in cf["hook"]}
                chain_kinds |= {"sshape:" + k for k in cf["sshape"]}
            n_axis_cards = len(axis_cards)
            div_raw = ((len(prim_kinds) + min(len(cond_kinds), 6) + len(chain_kinds)) / n_axis_cards) \
                if n_axis_cards else 0
            axis_diversity_raw[(pid, aid)] = div_raw

            # —— 规模均衡（2.10：轴可声明 sizeIntent [min,max] 按声明区间判，未声明沿用均值区间） ——
            size_intent = ax.get("sizeIntent")
            if isinstance(size_intent, list) and len(size_intent) == 2:
                lo, hi = size_intent
                if lo <= len(axis_cards) <= hi:
                    scale = 10
                else:
                    over = (lo - len(axis_cards)) if len(axis_cards) < lo else (len(axis_cards) - hi)
                    scale = max(0, 10 - over)
                    deductions.append(("规模均衡", "-%d：轴卡数 %d 越出声明区间 [%d,%d]" % (10 - scale, len(axis_cards), lo, hi), aid, FIX["scale"]))
            else:
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
                space = list(walk(card_effects(c))) + [n2 for dref in defrefs for n2 in walk(dref)]
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
            # 产出面：本轴私有机制（占多数的私有状态）+ 全局概念 facet（SCORING 2.5）
            private_items = {("status:" + s) for (p2, s), o in status_axis_owner.items()
                             if p2 == pid and o == aid}
            if a_kind == "status" and sid:
                private_items.add("status:" + sid)
            axis_facets = axis_mechanism_facets(axis_cards, anchor_spec, status_by_id, def_index)
            channel_outputs = ax_channels & set(COUPLING_CHANNELS)
            ext_consumers = 0
            for pid2, d2 in pathways.items():
                for c2 in d2.get("cards") or []:
                    if pid2 == pid and c2.get("axis") == aid:
                        continue
                    reads2 = ALL_SURF[(pid2, c2["name"])][1]
                    hit_status = reads2 & private_items
                    hit_facet = bool(axis_facets and card_mechanism_facets(
                        c2, axis_facets, status_by_id, def_index))
                    hit_channel = bool(reads2 & channel_outputs)
                    if not (hit_status or hit_facet or hit_channel):
                        continue
                    if pid2 != pid:
                        # 私有状态跨途径须 crossPathway 白名单；facet / 通道天然共享
                        if hit_status and not (hit_facet or hit_channel):
                            ok = False
                            for item in hit_status:
                                s = item.split(":", 1)[1]
                                sdef = status_by_id.get(s) or {}
                                part = sdef.get("participants") or []
                                if sdef.get("crossPathway") and (not part or pid2 in part):
                                    ok = True
                                    break
                            if not ok:
                                continue
                        pw_crosspath_consumers.setdefault(pid, set()).add(pid2)
                    else:
                        pw_crossaxis_refs[pid] = pw_crossaxis_refs.get(pid, 0) + 1
                    ext_consumers += 1
            connect = min(15, len(patterns) * 3)
            if not patterns and payoffs:
                deductions.append(("承接连通", "-15：payoff 无收束方式多样性", ",".join(payoffs), FIX["connect"]))

            apply_role_fix_overlay(deductions, card_by_name)
            axis_rows.append({
                "pathway": pid, "axis": aid, "name": ax.get("name"), "symbol": ax.get("symbol"),
                "anchor": anchor, "closure_e": closure_e, "closure_p": closure_p,
                "div_raw": div_raw, "scale": scale, "connect": connect,
                "cards": len(axis_cards), "enablers_v": en_verified, "landed": landed, "notes": notes_level,
                "patterns": sorted(patterns), "ext_consumers": ext_consumers,
                "facets": ["%s:%s:%s" % f for f in sorted(axis_facets)],
                "ax_channels": sorted(ax_channels),
                "shape": sorted(ax_channels | prim_kinds | chain_kinds),
                "vacuum_accepted": bool(ax.get("payoffVacuumAccepted")),
                "deductions": deductions,
                # 内部字段（不进 scores.json）：角色语义检查用——锚点 / 私有产出面 / facet 原值
                "anchor_kind": a_kind or ("status" if sid else None),
                "anchor_id": (a_id if a_kind else sid),
                "private_items": private_items,
                "facets_raw": axis_facets,
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
                owner = status_owner.get(hid)
                if owner:
                    pw_crosspath_consumers.setdefault(owner, set()).add(pid)

    # 跨系通道耦合（SCORING 2.0）：本途径写入的耦合通道被他途径读取（每 他途径卡×通道 计 1）
    for pid, d in pathways.items():
        for ch, writers in chan_pathway_writers.items():
            if ch not in COUPLING_CHANNELS or pid not in writers:
                continue
            n = 0
            for pid2, d2 in pathways.items():
                if pid2 == pid:
                    continue
                hits = sum(1 for c in d2.get("cards") or [] if ch in ALL_SURF[(pid2, c["name"])][1])
                if hits:
                    pw_crosspath_consumers.setdefault(pid, set()).add(pid2)
                n += hits
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
    # generic 卡不入途径间指纹向量（SCORING §一·附）：声明后其刻意平庸不再稀释差异化；
    # 防刷靠 generic ≤25% 配比上限（蓝图 rubric 判）；trap 属 core 同族，照常计入
    fps = {pid: fingerprint([c for c in (d.get("cards") or []) if c.get("role") != "generic"], status_by_id)
           for pid, d in pathways.items()}
    mean_dists = {}
    mean_fam_dists = {}   # pid -> {族: 对他 21 途径该族均距}（2.11 核心族下限用）
    nearest = {}
    for pid in pathways:
        others = [p2 for p2 in pathways if p2 != pid]
        if not others:
            mean_dists[pid] = 0.0
            mean_fam_dists[pid] = {}
            nearest[pid] = (None, 0.0)
            continue
        ds = {p2: cos_dist(fps[pid], fps[p2]) for p2 in others}
        mean_dists[pid] = round(sum(ds.values()) / len(ds), 4)
        fam_acc = {}
        for p2 in others:
            for f, d2 in cos_dist_by_family(fps[pid], fps[p2]).items():
                fam_acc.setdefault(f, []).append(d2)
        mean_fam_dists[pid] = {f: sum(v) / len(v) for f, v in fam_acc.items()}
        nb = min(ds, key=ds.get)
        nearest[pid] = (nb, round(ds[nb], 4))
    _sorted_d = sorted(mean_dists.values())
    _n_pw = len(_sorted_d)

    _DIST_TIERS = [(0.30, 12), (0.26, 10), (0.22, 8), (0.18, 5), (0.14, 3)]

    def _dist_pts(m):
        # 绝对阈值（2026-10-19）：全库分位制会让「全库一起优化」排名不动、单卡微改跨档套利；
        # 绝对线随全库整体提升可涨分，阶段线记录于 SCORING.md。
        for th, pts in _DIST_TIERS:
            if m >= th:
                return pts
        return 0

    def _dist_pts_lower(pts):
        # 降一档（2.11 核心族下限触发时用）：12→10→8→5→3→0
        ladder = [12, 10, 8, 5, 3, 0]
        return ladder[min(ladder.index(pts) + 1, len(ladder) - 1)] if pts in ladder else 0

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
        CAP_CROSSAXIS, CAP_CROSSPATH = 8, 16
        crossaxis = round(15 * min(pw_crossaxis_refs.get(pid, 0), CAP_CROSSAXIS) / CAP_CROSSAXIS, 1)
        if crossaxis < 7.5:
            deductions.append(("跨轴耦合", "-%s：本途径他轴机制命中 %d 次" % (15 - crossaxis, pw_crossaxis_refs.get(pid, 0)), pid, FIX["crossaxis"]))
        # 跨系联动（2.10 消费方多样性）：枢纽×2 + 消费本途径的他途径去重×4 + 读取实证(CAP4)，
        # 治悬崖（0 枢纽≈0 分）与单途径刷次数（同一途径读 N 次只算 1 个消费方）
        hubs_n = pw_hub_statuses.get(pid, 0)
        consumers_n = len(pw_crosspath_consumers.get(pid, ()))
        reads_n = pw_crosspath_reads.get(pid, 0)
        crosspath_raw = hubs_n * 2 + consumers_n * 4 + min(reads_n, 4)
        crosspath = round(15 * min(crosspath_raw, CAP_CROSSPATH) / CAP_CROSSPATH, 1)
        if crosspath < 7.5:
            deductions.append(("跨系联动", "-%s：枢纽状态 %d 个×2 / 消费方 %d 途径×4 / 读取 %d 次(CAP4)" % (
                15 - crosspath, hubs_n, consumers_n, reads_n), pid, FIX["crosspath"]))

        # 结构健康（SCORING §一·附 角色口径落地后重切：稀有 3 + 主被动比 3 + 旗舰 2 + 角色合规 2 = 10，×0.5 = 5）
        struct = 0
        bad_rarity = 0
        for c in cards:
            want = [r for r, seqs in rarity_map.items() if c.get("sequence") in seqs]
            if want and c.get("rarity") not in want:
                bad_rarity += 1
        struct += 3 if bad_rarity == 0 else max(0, 3 - 2 * bad_rarity)
        actives = sum(1 for c in cards if c.get("kind") == "active")
        passives = len(cards) - actives
        aratio = actives / passives if passives else 99
        if 1.5 <= aratio <= 3.0:
            struct += 3
        else:
            adist = abs(aratio - (1.5 if aratio < 1.5 else 3.0))
            s5 = round(3 * max(0.0, 1 - adist / 1.5), 1)   # 线性衰减，去 round 死区
            struct += s5
            deductions.append(("结构健康", "-%s：主被动比 %.2f 不在 [1.5, 3.0]" % (round(3 - s5, 1), aratio), pid, FIX["aratio"]))
        n_flag = sum(1 for c in cards if c.get("flagship"))
        struct += 2 if n_flag == 4 else 0              # 布尔判据，不再渐减白送
        if n_flag != 4:
            deductions.append(("结构健康", "-2：旗舰卡 %d 张（须恰好 4）" % n_flag, pid, FIX["flagship"]))
        # 角色合规（2 分，每张/每轴扣 1 封顶 2；途径已有 role 声明后才启用——opt-in 原则）
        role_dist = {}
        for c in cards:
            if c.get("role"):
                role_dist[c["role"]] = role_dist.get(c["role"], 0) + 1
        if role_dist:
            axes_reg = set()
            for ax2 in axes.values():
                if isinstance(ax2, dict):
                    axes_reg.update(ax2.get("enablers") or [])
                    axes_reg.update(ax2.get("payoffs") or [])
            own_sig_keys = PATHWAY_SIGNATURES.get(pid, [])
            role_bad = []
            for c in cards:
                r = c.get("role")
                if not r:
                    continue
                if r == "starter" and c.get("rarity") != "common":
                    role_bad.append("%s(starter≠common)" % c["name"])
                if r == "generic" and (c.get("flagship") or c["name"] in axes_reg
                                       or any(signature_card_hit(c, k, all_unit_types,
                                                                 lineage_status_ids, flag_status_index)
                                              for k in own_sig_keys)):
                    role_bad.append("%s(generic被登记/带签名键/旗舰)" % c["name"])
                if c.get("flagship") and r not in ("core", "trap"):
                    role_bad.append("%s(旗舰声明%s)" % (c["name"], r))
            for aid in axes:
                if not any(c.get("axis") == aid and c.get("role") == "core" for c in cards):
                    role_bad.append("轴%s缺core" % aid)
            struct += max(0, 2 - min(2, len(role_bad)))
            if role_bad:
                deductions.append(("结构健康", "-%d：角色合规 %d 处（%s）"
                                   % (min(2, len(role_bad)), len(role_bad), "；".join(role_bad[:6])),
                                  pid, FIX["role_semantic"]))
        else:
            struct += 2
        struct = round(struct * 0.5, 1)          # 10 → 5

        # —— 角色语义注级（SCORING §一·附；注级 = 不扣分，进失分清单供人工复核）——
        if role_dist:
            anchor_of = {r2["axis"]: (r2.get("anchor_kind"), r2.get("anchor_id")) for r2 in arows}
            for c in cards:
                r = c.get("role")
                if r not in ("core", "bridge", "trap"):
                    continue
                nm = c["name"]
                w, rd = ALL_SURF[(pid, nm)]

                def _identity_action(c=c, nm=nm, w=w, rd=rd):
                    if nm in axes_reg:
                        return True
                    if any(signature_card_hit(c, k, all_unit_types, lineage_status_ids, flag_status_index)
                           for k in own_sig_keys):
                        return True
                    akind, anchid = anchor_of.get(c.get("axis"), (None, None))
                    if akind == "status" and anchid and ("status:" + anchid) in w:
                        return True
                    if akind == "channel" and anchid and anchid in (w | rd):
                        return True
                    return False

                if r in ("core", "trap") and not _identity_action():
                    deductions.append(("角色语义", "注：%s 卡无身份动作（未登记 axes / 未挂锚点 / 非签名键载体）" % r,
                                       nm, FIX["role_semantic"]))
                if r == "trap" and not card_has_risk_segment(c):
                    deductions.append(("角色语义", "注：trap 卡无风险段（chance / 失败分支 / 自伤 皆无）",
                                       nm, FIX["role_semantic"]))
                if r == "bridge":
                    cross = False
                    for r2 in arows:
                        if r2["axis"] == c.get("axis"):
                            continue
                        if rd & r2.get("private_items", set()):
                            cross = True
                            break
                        fraw = r2.get("facets_raw")
                        if fraw and card_mechanism_facets(c, fraw, status_by_id, def_index):
                            cross = True
                            break
                    if not cross:
                        for hid in hub_ids:
                            if status_owner.get(hid) == pid or not card_refs_status(c, hid):
                                continue
                            part = status_by_id[hid].get("participants") or []
                            if not part or pid in part:
                                cross = True
                                break
                    if not cross:
                        for ch in rd & set(CHANNELS):
                            if any(w2 != pid for w2 in (chan_pathway_writers.get(ch) or ())):
                                cross = True
                                break
                    if not cross:
                        deductions.append(("角色语义", "注：bridge 卡无跨界读取（他轴私有面/facet/他途径枢纽通道 皆未命中）",
                                           nm, FIX["role_semantic"]))

        # —— 风格越界（只读诊断，不进 100 分——原则 8 指标生命周期首个实例）——
        # 卡命中他途径主签名键即列出；键被 ≥3 途径共享的视为事实通用分叉，不计。
        _key_owners = {}
        for _p2, _ks in PATHWAY_SIGNATURES.items():
            for _k in _ks:
                _key_owners.setdefault(_k, set()).add(_p2)
        oob_hits = []
        for c in cards:
            hits = sorted({k for k, owners in _key_owners.items()
                           if pid not in owners and len(owners) <= 2
                           and signature_card_hit(c, k, all_unit_types, lineage_status_ids, flag_status_index)})
            if hits:
                oob_hits.append("%s(%s)" % (c["name"], ",".join(hits)))
        if oob_hits:
            deductions.append(("风格越界", "注：%d 张命中他途径主签名键（只读诊断，不进 100 分；共享语义分叉/全局通用机制须人工甄别）"
                               % len(oob_hits), "；".join(oob_hits[:6]), FIX["style_oob"]))

        # 机制落地（2026-10-16 权重 10→5：全库已满分无区分度）
        flags = [f for c in cards for f in (c.get("frameworkFlags") or [])]
        if not flags:
            landed_score = 4.0       # 无缺口的底账不可验证，不再白送满分
            deductions.append(("机制落地", "注：无 frameworkFlags 登记（无缺口可核，按 4.0 计）", pid, FIX["landed"]))
        else:
            landed_n = sum(1 for f in flags if f.get("landed"))
            landed_score = round(5 * landed_n / len(flags), 1)
            for f in flags:
                if not f.get("landed"):
                    deductions.append(("机制落地", "-：frameworkFlags 未落地 %s" % f.get("code", "?"),
                                       f.get("note", "")[:60], FIX["landed"]))

        # 文本完备（2026-10-19：非空 → 内容判据）——最短长度 + 途径内 describe 去重
        txt = 0
        seen_desc = set()
        for c in cards:
            desc = (c.get("describe") or "").strip()
            if c.get("lore") and c.get("flavor") and len(desc) >= 20 and desc not in seen_desc:
                txt += 1
            seen_desc.add(desc)
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

        # 差异化（2026-10-19 重切，权重 35）= 签名键落地 7 + 途径间指纹 12 + 构型多样 5 + 途径内去重 11
        sig_keys = PATHWAY_SIGNATURES.get(pid, [])
        sig_hits = signature_counts(cards, sig_keys, unit_type_of=all_unit_types,
                                    lineage_ids=lineage_status_ids, flag_status_index=flag_status_index)
        signature_score = min(7, sum(3 if h >= 2 else 1.5 * h for h in sig_hits.values()))
        dist_pts = _dist_pts(mean_dists[pid])
        # 核心族下限（2.11）：prim/hook/sshape 三族至少两族均距 ≥0.15，否则降一档——
        # 外围族（cost/reach/temporal 等）只能加分不能保底，防「玩法雷同靠外围族凑距离」
        CORE_FAM_FLOOR = ("prim", "hook", "sshape")
        fam_ok = sum(1 for f in CORE_FAM_FLOOR if mean_fam_dists[pid].get(f, 0) >= 0.15)
        family_floor_pass = fam_ok >= 2
        if not family_floor_pass and dist_pts > 0:
            lowered = _dist_pts_lower(dist_pts)
            deductions.append(("差异化", "-%s：核心族距离不足（prim/hook/sshape 仅 %d 族均距 ≥0.15，%.1f→%.1f 降一档）"
                               % (dist_pts - lowered, fam_ok, dist_pts, lowered), pid, FIX["uniqueness"]))
            dist_pts = lowered
        dedup_ratio, dedup_pts = intra_dedup(cards, status_by_id)
        shapes = [set(r["shape"]) for r in arows]
        pairs = [(shapes[i], shapes[j]) for i in range(len(shapes)) for j in range(i + 1, len(shapes))]
        jac = (sum((len(a & b) / len(a | b)) if (a | b) else 1.0 for a, b in pairs) / len(pairs)) if pairs else 1.0
        config_div = round(5 * (1 - jac), 1)
        style_score = round(signature_score + dist_pts + config_div + dedup_pts, 1)
        if signature_score < 7:
            blanks = [k for k, h in sig_hits.items() if h == 0]
            deductions.append(("差异化", "-%s：签名键零使用 %s" % (round(7 - signature_score, 1), ",".join(blanks) or "（有键仅 1 卡，未落地）"), pid, FIX["signature"]))
        if dist_pts <= 3:
            deductions.append(("差异化", "-：途径间指纹距离垫底（对他 21 途径均距 %.3f）" % mean_dists[pid], pid, FIX["uniqueness"]))
        if config_div < 2.5:
            deductions.append(("差异化", "-：四轴构型雷同（构型多样 %.1f/5，四轴产出面/原语高度重叠）" % config_div, pid, FIX["config"]))
        if dedup_pts < 8:
            deductions.append(("差异化", "-%s：途径内低相似对 %.1f%%（卡级指纹 <0.20 的对数占比，整组复制或模板复用）"
                               % (round(11 - dedup_pts, 1), dedup_ratio * 100), pid, FIX["dedup"]))

        # SCORING 2.3：三项合规维改为门禁——不计入 100 分，未达标各扣 3
        gates = {"结构健康": struct >= 4.95,
                 "机制落地": (not flags) or landed_score >= 4.95,
                 "文本完备": text_score >= 4.95}
        gate_penalty = 3 * sum(1 for ok in gates.values() if not ok)
        # 单维失分标记（2.11）：单维失分 ≥10 且 ≥ 总失分 45% → ⚠单维，进人工裁定队列而非直接重设计。
        # （绝对量门槛滤掉高分的「剩余失分自然集中」噪声；45% 覆盖战士跨系 14.1/29.2≈48% 这类单维洞）
        DIM_MAX = {"轴健康度": 35, "跨轴耦合": 15, "跨系联动": 15, "差异化": 35}
        dim_losses = {k: round(m - {"轴健康度": health, "跨轴耦合": crossaxis,
                                    "跨系联动": crosspath, "差异化": style_score}[k], 1)
                      for k, m in DIM_MAX.items()}
        total_loss = sum(dim_losses.values())
        worst_dim = max(dim_losses, key=dim_losses.get)
        single_dim_warn = worst_dim if (dim_losses[worst_dim] >= 10
                                        and dim_losses[worst_dim] >= 0.45 * total_loss) else None

        total = round(health + crossaxis + crosspath + style_score - gate_penalty, 1)
        apply_role_fix_overlay(deductions, card_by_name)
        pw_rows.append({
            "id": pid, "name": d.get("pathwayName"), "cards": len(cards),
            "total": total,
            "dims": {"轴健康度": health, "跨轴耦合": crossaxis, "跨系联动": crosspath,
                     "结构健康": round(struct, 1), "机制落地": landed_score, "文本完备": text_score,
                     "差异化": style_score},
            "roleDist": role_dist,
            "sigHits": sig_hits, "styleDist": mean_dists[pid],
            "gates": gates, "gatePenalty": gate_penalty,
            "styleStrengths": style_strengths,
            "styleParts": {"signature": signature_score, "fingerprint": dist_pts,
                           "config": config_div, "dedup": dedup_pts,
                           "dedupRatio": round(dedup_ratio, 4),
                           "familyFloor": family_floor_pass,
                           "familyDists": {f: round(v, 4) for f, v in mean_fam_dists[pid].items()}},
            "singleDimWarn": single_dim_warn,
            "nearest": nearest[pid][0], "nearestDist": nearest[pid][1],
            "axes": arows, "deductions": deductions,
            "min_axis": min_axis, "mean_axis": round(mean_axis, 1),
        })

    pw_rows.sort(key=lambda r: r["total"])
    variance = write_variance(pw_rows, axis_rows)
    write_scorecard(pw_rows)
    write_scores_json(pw_rows, variance)
    print("scored %d pathways / %d axes -> scorecard.md + scores.json" % (len(pw_rows), len(axis_rows)))
    for r in pw_rows:
        print("  %-18s %5.1f  (min axis %.0f)" % (r["id"], r["total"], r["min_axis"]))


def write_scorecard(pw_rows):
    L = []
    L.append("# 职业设计计分卡（scorecard）\n")
    L.append("> 由 `docs/tools/score.py` 自动生成——**口径变了就改 SCORING.md 重跑，不要手改本文件**。")
    L.append("> 生成时间：%s。评分标准见 `../meta/SCORING.md`；数值 ⚠️D 不参与计分（基线状态）。\n" % datetime.date.today())

    L.append("## 一、途径排行（升序 = 优先重设计）\n")
    L.append("| # | 途径 | 总分 | 轴健康 | 跨轴 | 跨系 | 结构 | 落地 | 文本 | 差异 | 最低轴 | 卡数 | 标记 |")
    L.append("|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|")
    for i, r in enumerate(pw_rows, 1):
        d = r["dims"]
        L.append("| %d | **%s** `%s` | **%.1f** | %.1f | %.1f | %.1f | %.1f | %.1f | %.1f | %.1f | %.0f | %d | %s |" % (
            i, r["name"], r["id"], r["total"], d["轴健康度"], d["跨轴耦合"], d["跨系联动"],
            d["结构健康"], d["机制落地"], d["文本完备"], d["差异化"], r["min_axis"], r["cards"],
            ("⚠单维·" + r["singleDimWarn"]) if r.get("singleDimWarn") else ""))
    L.append("")
    L.append("> ⚠单维 = 单维失分 ≥10 且 ≥ 总失分 45%：先进人工裁定队列（确认是缺陷还是途径定位），不直接触发重设计（2.11）。")
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
        if r.get("roleDist"):
            ROLE_ORDER = ("core", "starter", "bridge", "generic", "trap", "tech")
            L.append("角色分布（SCORING §一·附）：" +
                     " · ".join("%s ×%d" % (k, r["roleDist"][k]) for k in ROLE_ORDER if r["roleDist"].get(k)))
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


def write_scores_json(pw_rows, variance=None):
    out = {
        "generated": str(datetime.date.today()),
        "standard": "docs/meta/SCORING.md",
        "dimVariance": variance or {},
        "pathways": [{
            "id": r["id"], "name": r["name"], "total": r["total"], "dims": r["dims"],
            "minAxis": r["min_axis"], "cards": r["cards"],
            "roleDist": r.get("roleDist") or {},
            "sigHits": r.get("sigHits", {}), "styleDist": r.get("styleDist", 0),
            "gates": r.get("gates", {}), "gatePenalty": r.get("gatePenalty", 0),
            "styleStrengths": r.get("styleStrengths", []),
            "styleParts": r.get("styleParts", {}),
            "singleDimWarn": r.get("singleDimWarn"),
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


def _variance_stats(values):
    n = len(values)
    if not n:
        return {"count": 0, "mean": 0, "variance": 0, "min": 0, "max": 0}
    mean = sum(values) / n
    var = sum((v - mean) ** 2 for v in values) / n
    return {"count": n, "mean": round(mean, 2), "variance": round(var, 2),
            "min": round(min(values), 1), "max": round(max(values), 1)}


def write_variance(pw_rows, axis_rows):
    """各维度全库方差表（2.11 原则 8 指标生命周期）：方差过低的维已无区分度，
    标记「候选降门禁/降权」，把 2.3 的人工判断变成机器提醒。产物落 analysis/variance.md。"""
    PW_DIMS = ("轴健康度", "跨轴耦合", "跨系联动", "差异化")
    AX_DIMS = ("身份锚定", "产层闭环", "收束闭环", "轴内多样性", "规模均衡", "承接连通")
    LOW_VAR = 1.0
    groups = [("途径级（22 途径）", PW_DIMS,
               {k: [r["dims"][k] for r in pw_rows] for k in PW_DIMS}),
              ("轴级（88 轴）", AX_DIMS,
               {k: [a["dims"][k] for a in axis_rows] for k in AX_DIMS})]
    L = ["# 维度方差表（variance）\n",
         "> 由 `docs/tools/score.py` 自动生成——原则 8（指标生命周期）：方差 <%.1f 的维度已无区分度，"
         "标「候选降门禁/降权」，人工复核后走口径变更流程（先改 SCORING.md）。生成时间：%s。\n"
         % (LOW_VAR, datetime.date.today())]
    data = {}
    for title, dims, cols in groups:
        L.append("## %s\n" % title)
        L.append("| 维度 | n | 均值 | 方差 | 最小 | 最大 | 标记 |")
        L.append("|---|---:|---:|---:|---:|---:|---|")
        for k in dims:
            st = _variance_stats(cols[k])
            flag = "候选降门禁/降权" if st["variance"] < LOW_VAR else ""
            L.append("| %s | %d | %.2f | %.2f | %.1f | %.1f | %s |" % (
                k, st["count"], st["mean"], st["variance"], st["min"], st["max"], flag))
            data[k] = dict(st, lowVariance=bool(flag))
        L.append("")
    io.open(os.path.join(ANALYSIS_DIR, "variance.md"), "w", encoding="utf-8").write("\n".join(L))
    return data


if __name__ == "__main__":
    main()
