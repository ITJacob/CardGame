# -*- coding: utf-8 -*-
"""玩法轨体检器（格②）—— 独立于 score.py 的 100 分体系，只读不改数据。

用法:
    python docs/tools/playable_scan.py                    # 全库 22 途径简表
    python docs/tools/playable_scan.py --pw warrior       # 单途径详表
    python docs/tools/playable_scan.py --self-test        # 锚点自检 + 复制不变量测试
    python docs/tools/playable_scan.py --json             # 机器可读输出

六项指标（全部从 JSON AST 实算）：
    1 ast_shapes      卡级 effect 树形状去重数（两档并列，见下）
    2 intra_pairs     途径内卡级指纹最近对（主口径 = 同 kind 两两余弦距离）
    3 tgt_dedup       同轴主动卡 target 签名去重比（几何归一 + filter 键归一）
    4 supply          资源/通道供给三列：引擎供给 / 卡面写入 / 卡面读取（产层 = 0 报警）
    5 dual_branch     if 节点 then/else 均非空**且两边原语类型集不同**的卡占比
    6 cost_ratio      代价卡占比 + **效果节点层** note 去重比

① 两档并列（team-lead 拍板，不为凑锚改口径）：
    A 骨架签名去重 = 选靶 mode + 首段原语 + 条件谓词种类集 + 尾段原语 + fallbackSort
    B 原语组合种类 = 卡内 effect 原语类型的多重集

纪律：
  · 本脚本的输出**不进 score.py 的 100 分**，只写 docs/meta/rounds/<途径>.md 与 REDESIGN_LOG。
  · 验收线一律用**全库分位**，不用单途径标杆（见文末 THRESHOLDS 的纪律注释）。
  · 只读：不修改 docs/ 下任何数据文件。
"""
import argparse, glob, io, json, os, re, sys
from collections import Counter, defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
JSON_DIR = os.path.join(os.path.dirname(HERE), "json")
sys.path.insert(0, HERE)

import score                                   # noqa: E402  指纹与卡级统计同源，保证口径一致
from status_loader import iter_status_defs     # noqa: E402


# ---------- 加载 ----------

def load_skills():
    out = {}
    for f in sorted(glob.glob(os.path.join(JSON_DIR, "*.skills.json"))):
        d = json.load(io.open(f, encoding="utf-8"))
        out[d["pathwayId"]] = d
    return out


def walk(n):
    if isinstance(n, dict):
        yield n
        for v in n.values():
            for x in walk(v):
                yield x
    elif isinstance(n, list):
        for v in n:
            for x in walk(v):
                yield x


# ---------- 指标 1：AST 形状去重 ----------
# 两档并列输出（team-lead 2026-10-18 拍板：玩法策划的 5 是人工按玩法模式判的，
# 不是按原语组合数；两个口径都留，人读时才知道差在哪，不为凑锚改口径）：
#   A. skeleton_dedup 骨架签名去重 = target.mode + 首段原语 + 条件谓词种类集 + 尾段原语
#      （+ 选靶 fallbackSort；filter 键按几何语义归一，见 GEO_GROUP）
#   B. prim_combo     原语组合种类 = 卡内 effect 原语类型的多重集去重


def _prim_seq(card):
    return [n["type"] for n in walk(card.get("effects") or []) if isinstance(n.get("type"), str)]


def _cond_kinds(card):
    return tuple(sorted({n["kind"] for n in walk(card.get("effects") or [])
                         if isinstance(n.get("kind"), str)}))


def card_skeleton(card):
    """骨架签名：选靶模式 + 首段原语 + 条件谓词种类集 + 尾段原语 + fallbackSort。"""
    p = _prim_seq(card)
    req = (card.get("target") or {}).get("request") or {}
    return (req.get("mode"), p[0] if p else None, _cond_kinds(card), p[-1] if p else None,
            (card.get("target") or {}).get("fallbackSort"))


def skeleton_dedup(cards):
    return len({card_skeleton(c) for c in cards if _prim_seq(c) or _cond_kinds(c)})



def _prim_family(card):
    c = Counter()
    for n in walk(card.get("effects") or []):
        t = n.get("type")
        if isinstance(t, str):
            fam = PRIM_FAMILY.get(t, "其他")
            c[fam] += 1
    if not c:
        return None
    return c.most_common(1)[0][0]


def _has_nonempty_else(card):
    for n in walk(card.get("effects") or []):
        if n.get("op") == "if" and _nonempty(n.get("else")):
            return True
    return False


def _object_class(card):
    """作用对象类别：self / single_enemy / single_ally / area / global。"""
    t = card.get("target") or {}
    req = t.get("request") or {}
    fac = req.get("faction")
    geo = _geo_group(req.get("scope"))
    if geo == "all":
        return "global"
    if fac == "self" or (fac is None and not req):
        return "self"
    if geo in ("line", "cross", "radius") or (req.get("pickCount") or 1) > 1:
        return "area"
    if fac == "enemy":
        return "single_enemy"
    if fac in ("ally", "any"):
        return "single_ally" if fac == "ally" else "area"
    return "self"


def card_triplet(card):
    """① 主口径形状键 = (主导原语族, 是否有非空 else, 作用对象类别)。"""
    f = _prim_family(card)
    if f is None:
        return None
    return (f, _has_nonempty_else(card), _object_class(card))


def triplet_dedup(cards):
    n = len({card_triplet(c) for c in cards if card_triplet(c)})
    nz = len([c for c in cards if _prim_seq(c) or _cond_kinds(c)])
    return {
        "templates": n,
        "cards": len(cards),
        "need": None if not cards else round(len(cards) / 6.0, 2),
        "pass": None if not cards else (n >= len(cards) / 6.0),
        "nonempty": nz,
    }


def _effect_type_multiset(card):
    c = Counter()
    for n in walk(card.get("effects") or []):
        t = n.get("type")
        if isinstance(t, str):
            c["E:" + t] += 1
    return c


def card_ast_shape(card):
    c = _effect_type_multiset(card)
    if c:
        return tuple(sorted(("%s×%d" % (k, v)) for k, v in c.items()))
    ops = []
    for n in (card.get("effects") or []):
        if isinstance(n, dict) and isinstance(n.get("op"), str):
            ops.append("O:" + n["op"])
    return tuple(ops) if ops else None


def ast_shape_dedup(cards):
    """B 档：原语组合种类（多重集口径）。"""
    return len({card_ast_shape(c) for c in cards if card_ast_shape(c)})


def ast_shape_family(card):
    """粗粒度形状族（报告用）：主导原语 = 出现次数最多的 effect 类型。"""
    c = _effect_type_multiset(card)
    if not c:
        return "op-only"
    return c.most_common(1)[0][0]


def ast_shape_hist(cards):
    """形状 -> 卡名列表（用于定位"几种模式来回用"）。"""
    h = defaultdict(list)
    for c in cards:
        s = card_ast_shape(c)
        if s:
            h[s].append(c.get("name"))
    fam = defaultdict(list)
    for c in cards:
        fam[ast_shape_family(c)].append(c.get("name"))
    sk = defaultdict(list)
    for c in cards:
        if _prim_seq(c) or _cond_kinds(c):
            sk[card_skeleton(c)].append(c.get("name"))
    return {
        "distinct_shapes": sorted(((len(v), v, k) for k, v in h.items()), key=lambda x: (-x[0], str(x[2]))),
        "families": {k: len(v) for k, v in sorted(fam.items(), key=lambda kv: -len(kv[1]))},
        "family_count": len(fam),
        "skeleton_clusters": sorted(((len(v), v) for v in sk.values()), key=lambda x: -x[0])[:6],
    }


# ---------- 指标 2：途径内卡级指纹最近对 ----------

def intra_pairs(cards, pid, top=10):
    """同途径内两两卡的指纹距离，升序取 Top N（主口径 = 同 kind 对；all 列为不限 kind）。"""
    cfs = [(c, score.fingerprint([c], STATUS_BY_ID)) for c in cards]
    same, allp = [], []
    for i in range(len(cfs)):
        for j in range(i + 1, len(cfs)):
            d = round(max(0.0, score.cos_dist(cfs[i][1], cfs[j][1])), 4)
            allp.append((d, cfs[i][0].get("name"), cfs[j][0].get("name")))
            if cfs[i][0].get("kind") == cfs[j][0].get("kind"):
                same.append((d, cfs[i][0].get("name"), cfs[j][0].get("name")))
    same.sort(key=lambda x: x[0])
    allp.sort(key=lambda x: x[0])
    ds = [x[0] for x in same]
    return {
        "pairs": len(same),
        "min": round(min(ds), 4) if ds else None,
        "mean": round(sum(ds) / len(ds), 4) if ds else None,
        "top": same[:top],
        "n_lt_020": sum(1 for d in ds if d < 0.20),
        "min_all_kinds": round(allp[0][0], 4) if allp else None,
        "top_all_kinds": allp[:top],
    }


# ---------- 指标 3：同轴主动卡选靶签名去重 ----------

# 选靶几何语义分组（team-lead 拍板：filter 键归一，防止换皮刷分 —— 与本人体检 B-1 手法 2 同源）
GEO_GROUP = {
    "point": "single", "none": "single",
    "front_1": "line", "front_2": "line", "front_3": "line", "behind_1": "line",
    "behind_2": "line", "behind_3": "line", "whole_lane": "line", "chain": "line",
    "cross_lane": "cross", "cross_lane_row": "cross",
    "diamond_1": "radius", "diamond_2": "radius", "diamond_3": "radius", "diamond": "radius",
    "board": "all",
}


def _geo_group(scope):
    if not scope:
        return "default"
    if scope in GEO_GROUP:
        return GEO_GROUP[scope]
    for k, v in GEO_GROUP.items():
        if str(scope).startswith(k):
            return v
    return "other"


# ---------- 指标 1 新口径（production-manager 2026-10-18 裁定）：形状三元组 ----------
# 形状键 = (主导原语族, 是否有非空 else 分支, 作用对象类别)
#   主导原语族：29 个原语归 7 个语义族（造成伤害 / 挂状态 / 改属性 / 改资源 / 位移 / 召唤 / 控制）
#   是否有非空 else：布尔（与⑤同口径：空 else 不算）
#   作用对象类别：self / single_enemy / single_ally / area / global 五档
# 验收线改**相对值**：模板数 ≥ 卡数 / 6（33 卡 → ≥5.5）。
#   理由：绝对数依赖口径，比例才可跨途径比较；"≥卡数/6" = 平均每个模板 ≤6 张卡，
#   超过就说明有模板在批量复制。不再强求复现人工判的 5。
PRIM_FAMILY = {
    "damage": "造成伤害", "drain": "造成伤害",
    "heal": "治疗", "restore_snapshot": "治疗",
    "mount_status": "挂状态", "modify_status": "挂状态", "transfer_status": "挂状态",
    "status_shuffle": "挂状态", "grant_immunity": "挂状态",
    "modify_stat": "改属性",
    "modify_resource": "改资源", "gauge_shuffle": "改资源",
    "set_luminance": "改资源", "advance_clock": "改资源",
    "move": "位移", "translocate": "位移",
    "spawn": "召唤", "domain": "召唤",
    "dispel": "控制", "target_override": "控制", "take_control": "控制",
    "modify_targetability": "控制", "modify_skill": "控制",
    "write_rule_slot": "控制", "modify_rule_slot": "控制",
}


# filter 键语义归一组（防刷：换个键名 / 多写一个过滤键都不该算"选靶不同"）
FILTER_FAMILY = (
    (("status", "hasstatus", "statusid"), "状态"),
    (("unittype", "role", "tag"), "单位属性"),
    (("hp", "gauge", "armor", "shield", "stat"), "数值阈值"),
    (("position", "distance", "lane", "row", "col", "zone"), "位置"),
)


def _filter_families(flt):
    out = set()
    for k in (flt or {}):
        kl = str(k).lower()
        fam = "其他"
        for keys, name in FILTER_FAMILY:
            if any(x in kl for x in keys):
                fam = name
                break
        out.add(fam)
    return tuple(sorted(out))


# 主口径（production-manager 2026-10-18 裁定 = 2）：
#   **排除** fallbackSort（超时回退排序，玩家不可感知）
#   **保留** filter 键（决定"这张卡能选谁"，玩家可感知；只记语义族不记值）
# ⚠ 脆弱性标注：战士武艺轴 8 张主动卡 → 7 张 request 全同 + ㉒银白细剑多一个
#   filter{unitType:[DEMON]} = 2 组。**㉒ 若被打回删除 → 去重数掉到 1（7/7 全同）**。
# ⚠ 引擎侧硬发现（待办.md）：`request.filter`（UnitFilter）**全库未求值** —— 选靶候选池
#   从不消费 filter。故 ③=2 记录的是**名义差异**：引擎接通前，filter 不产生真实选靶差别。
#   （同时也意味着它当前无法被用来刷分，与本人 B-1 手法 2 的防刷结论不冲突。）
STRICT_TGT_KEYS = ("selectionMode", "mode", "faction", "geo", "anchor", "sort",
                   "pickCount", "spread", "excludeSelf", "excludeAnchor", "filterFams")
LOOSE_TGT_KEYS = tuple(list(STRICT_TGT_KEYS) + ["fallbackSort"])


def target_signature(card, loose=False, with_filter=True):
    """选靶签名。几何 scope 一律按 GEO_GROUP 归一（单体/线性/十字/半径/全场）；
    filter 只记**语义族**（状态/单位属性/数值阈值/位置/其他），不记键名与取值。"""
    t = card.get("target") or {}
    req = t.get("request") or {}
    sig = {
        "selectionMode": t.get("selectionMode"),
        "mode": req.get("mode"),
        "faction": req.get("faction"),
        "geo": _geo_group(req.get("scope")),
        "anchor": req.get("anchor"),
        "sort": req.get("sort"),
        "pickCount": req.get("pickCount"),
        "spread": req.get("spread"),
        "excludeSelf": req.get("excludeSelf"),
        "excludeAnchor": req.get("excludeAnchor"),
        "fallbackSort": t.get("fallbackSort"),
        "filterFams": _filter_families(req.get("filter")),
    }
    keys = LOOSE_TGT_KEYS if loose else STRICT_TGT_KEYS
    if not with_filter:
        keys = tuple(k for k in keys if k != "filterFams")
    return json.dumps({k: v for k, v in sig.items() if k in keys},
                      ensure_ascii=False, sort_keys=True)


def axis_target_dedup(cards, axes):
    out = {}
    for aid in axes:
        act = [c for c in cards if c.get("axis") == aid and c.get("kind") == "active"]
        # 主口径（程有序裁定）：**保留 filter 语义族**（决定"能选谁"，玩家可感知）
        # + **排除 fallbackSort**（超时回退排序，玩家不可感知）
        main = defaultdict(list)
        nofilt = defaultdict(list)
        for c in act:
            main[target_signature(c, with_filter=True)].append(c.get("name"))
            nofilt[target_signature(c, with_filter=False)].append(c.get("name"))
        # 脆弱性：删掉哪些"唯一区分卡"会让去重数掉档（战士 ㉒银白细剑：删 → 2 掉到 1，7/7 全同）
        base = len(main)
        fragile = sorted({v[0] for v in main.values() if len(v) == 1}
                         ) if base > 1 else []
        drop_to = len({s for s, v in main.items() if len(v) > 1}) if base > 1 else None
        out[aid] = {
            "active": len(act),
            "distinct": len(main),
            "distinct_nofilter": len(nofilt),
            "dedup_ratio": round(len(main) / len(act), 3) if act else None,
            "fragile_cards": fragile,
            "distinct_if_fragile_removed": drop_to,
            "clusters": sorted(((len(v), v) for v in main.values()), key=lambda x: -x[0])[:3],
        }
    return out


# ---------- 指标 4：资源/通道供给三列（引擎供给 / 卡面写入 / 卡面读取）----------
# 【口径修正 2026-10-18 · team-lead 拍板】
# 战意 / 死亡簿 **不是幽灵资源，数据也不是空的**：供给侧 100% 在引擎层
# （职业机制 classMechanics、场面派生量、状态 def 自述），卡面**写入手段 = 0**。
# 玩法轨的判据因此不是"有没有人写"，而是"玩家有没有操作面"：资源引擎供得上、
# 但玩家打不出也攒不了、只能被动被支付 → 报警。
# 禁止表述："幽灵资源 / 数据缺失 / 没人写它"。正确表述见 verdict 文案。

# 场面派生量（SCORING §二·一 通道表）：引擎/场面规则供给，卡面不写也有值
BOARD_DERIVED = {
    "death_tally": "场面派生量：敌方单位死亡计数（击杀事件供给，非卡面写入）",
    "phase": "场面派生量：回合相位（时钟推进 / 回合结构供给）",
    "luminance": "场面量表：环境光照（场景与回合规则推进）",
    "secrecy": "场面量表：隐秘度（引擎按行为累计）",
    "order": "场面量表：秩序度（引擎按行为累计）",
    "fate_value": "场面量表：命运值（引擎按行为累计）",
    "rank": "位格：单位固有属性，只读",
}
# 读谓词 -> 通道键（读侧识别用）
READ_PRED = {"dead_count": "death_tally", "phase_is": "phase", "rank_gap": "rank"}
# 写侧原语（这些节点即使带 statusId/resource 也算写，不算读）
WRITE_PRIMS = {"modify_resource", "modify_status", "mount_status",
               "set_luminance", "advance_clock", "set_resource"}
# 通用基础量白名单：由引擎按规则供给的通用资源（能量每回合回复、护甲/护盾/生命是基础属性、
# 行动条是回合资源、位格是单位固有属性）。它们"卡面产层 = 0"是**正常设计**，不报警，
# 否则全库会被 energy/armor/gauge 刷满假报警。
BASELINE_KEYS = {"energy", "armor", "shield", "hp", "hp_max", "gauge.current", "gauge.max",
                 "lost", "rank", "action", "charge"}
# 状态 def 自述供给的关键词（软证据，人读时可核）
SUPPLY_WORDS = ("获得", "积", "每回合", "自动", "默认携带", "默认拥有", "自带")


def iter_card_effects(card):
    """卡的全部效果节点：**主 effects 链 + triggers[].effects**（被动/钩子写入层）。
    ⚠ 只扫 card['effects'] 会漏掉被动卡的触发器写入（如战士「兵械通晓」on_kill 产战意），
    这正是上一版把"战意产层 = 0"误判为"无人生产"的原因。"""
    for n in walk(card.get("effects") or []):
        yield ("effects", n)
    for tr in card.get("triggers") or []:
        tag = "trigger:" + str(tr.get("event") or "?")
        for n in walk(tr.get("effects") or []):
            yield (tag, n)


def _write_kind(n, key):
    """节点 n 是否写入 key；返回 'prod'（增产）/ 'consume'（消耗）/ None。"""
    t = n.get("type")
    if not isinstance(t, str):
        return None
    if t == "modify_resource" and n.get("resource") == key:
        v = n.get("value")
        if n.get("mode") == "consume" or n.get("consume") or n.get("consumeCharge") \
           or (isinstance(v, (int, float)) and v < 0):
            return "consume"
        return "prod"
    if t in ("mount_status", "modify_status") and n.get("statusId") == key:
        st = n.get("stacks")
        if (isinstance(st, (int, float)) and st < 0) or (n.get("stacksDelta") or 0) < 0 \
           or n.get("stackMode") == "consume" or n.get("consumeCharge") or n.get("consume"):
            return "consume"
        return "prod"
    if t == "set_luminance" and key == "luminance":
        return "prod"
    if t == "advance_clock" and key == "phase":
        return "prod"
    return None


def _reads_key(n, key):
    """节点 n 是否读取 key；返回读法标签 / None。"""
    if isinstance(n.get("type"), str) and n.get("type") in WRITE_PRIMS:
        return None
    k = n.get("kind")
    if isinstance(k, str) and k in READ_PRED and READ_PRED[k] == key:
        return "谓词:" + k
    for f in ("id", "statusId", "resource", "field", "stat", "dim"):
        if n.get(f) == key:
            return "引用:" + f
    return None


def engine_supply(key, data, status_by_id):
    """引擎 / 场面侧供给证据（三层）：classMechanics 职业机制、通道表场面派生量、状态 def 自述。"""
    ev = []
    for cm in data.get("classMechanics") or []:
        if cm.get("statusId") == key or cm.get("id") == key:
            ev.append("classMechanics[%s]：%s" % (cm.get("id"), (cm.get("summary") or "").strip()))
    if key in BOARD_DERIVED:
        ev.append("通道表 · " + BOARD_DERIVED[key])
    sd = status_by_id.get(key) or {}
    txt = " ".join(str(sd.get(f) or "") for f in ("note", "summary", "details", "describe"))
    if txt and any(w in txt for w in SUPPLY_WORDS):
        ev.append("状态def自述：%s" % txt.strip()[:120])
    return ev


def supply_table(cards, data, keys, status_by_id):
    """三列供给表：engine_supply（引擎）/ write（卡面写入）/ read（卡面读取）。"""
    out = {}
    for k in keys:
        engine = engine_supply(k, data, status_by_id)
        prod_cards, cons_cards, read_cards = [], [], []
        origins = Counter()
        read_kinds = Counter()
        for c in cards:
            is_prod = is_cons = False
            hits = []
            for origin, n in iter_card_effects(c):
                w = _write_kind(n, k)
                if w == "prod":
                    is_prod = True
                    origins[origin.split(":")[0]] += 1
                elif w == "consume":
                    is_cons = True
                r = _reads_key(n, k)
                if r:
                    hits.append(r)
            if c.get("phaseHooks") and k == "phase":
                hits.append("卡级:phaseHooks")
            for h in c.get("dimHooks") or []:
                if (h.get("dim") if isinstance(h, dict) else h) == k:
                    hits.append("卡级:dimHooks")
            if is_prod:
                prod_cards.append(c)
            elif is_cons:
                cons_cards.append(c)
            if hits:
                read_cards.append(c)
                for r in set(hits):
                    read_kinds[r] += 1
        act = [c for c in prod_cards if c.get("kind") == "active"]
        write = {
            "produce_cards": len(prod_cards),
            "produce_active": len(act),
            "produce_passive": len(prod_cards) - len(act),
            "produce_via_effects": origins.get("effects", 0),
            "produce_via_trigger": origins.get("trigger", 0),
            "producer_names": [c.get("name") for c in prod_cards][:20],
            "consume_cards": len(cons_cards),
            "consumer_names": [c.get("name") for c in cons_cards][:20],
            "active_prod_ratio": round(len(act) / len(prod_cards), 3) if prod_cards else None,
        }
        read = {"cards": len(read_cards), "names": [c.get("name") for c in read_cards][:20],
                "kinds": dict(read_kinds)}
        baseline = k in BASELINE_KEYS
        used = bool(read_cards or cons_cards or prod_cards)
        if not used:
            verdict = "未使用（不判）"
        elif not engine and not prod_cards and cons_cards:
            verdict = "幽灵资源：既无引擎供给也无卡面产方，只有消费方"
        elif baseline:
            verdict = "通用基础量（引擎按规则供给，卡面产层非必需）→ 不报警"
        elif not prod_cards:
            verdict = "⚠ 卡面产层 = 0：供给 100% 在引擎层，玩家无积攒手段"
        elif not act:
            verdict = "⚠ 主动产层 = 0：产方全为被动触发，玩家无法主动经营该资源"
        elif not read_cards and not cons_cards:
            verdict = "写了没人读：卡面有产层但无读取/消费方"
        elif len(act) == len(prod_cards):
            verdict = "ok（产方全为主动，玩家可控）"
        else:
            verdict = "ok（主动 + 被动双产层）"
        out[k] = {
            "engine_supply": engine,
            "engine_supply_count": len(engine),
            "write": write,
            "read": read,
            "baseline": baseline,
            "verdict": verdict,
            "alarm": bool(used) and (not baseline) and (not prod_cards or not act),
        }
    return out


def identity_mount_stats(cards, axes):
    """四轴身份状态的挂载者（对照用：身份状态本就是主动卡挂载，不参与产层报警）。"""
    out = {}
    for aid, ax in axes.items():
        sid = ax.get("statusId")
        if not sid:
            continue
        prod, cons = [], []
        for c in cards:
            is_prod = is_cons = False
            for _o, n in iter_card_effects(c):
                w = _write_kind(n, sid)
                if w == "prod":
                    is_prod = True
                elif w == "consume":
                    is_cons = True
            if is_prod:
                prod.append(c)
            elif is_cons:
                cons.append(c)
        out[aid + "/" + sid] = {
            "producers": len(prod),
            "active_producers": sum(1 for c in prod if c.get("kind") == "active"),
            "consumers": len(cons),
            "names": [c.get("name") for c in prod][:12],
        }
    return out


# ---------- 指标 5：局内双分支 ----------
# 双分支（程有序 2026-10-18 裁定，锚 0 作废）：
#   if 节点 **then 与 else 均非空**即算；空 else 不算。
#   理由：空 else 若也算，19 张假分支会把指标虚高到 20/33 = 61% —— 与"名义代价卡"是
#   同一类自欺。另留一档更严对照：两边**原语类型集不同**才算（cards_dual_primdiff）。


def _nonempty(v):
    """then/else 是否真的有内容（空数组 / 空 dict / None 都算没有）。"""
    if v is None:
        return False
    if isinstance(v, (list, tuple, dict)):
        return len(v) > 0
    return True


def _prim_set(v):
    return {n["type"] for n in walk(v) if isinstance(n.get("type"), str)}


def dual_branch_cards(cards, prim_diff=False):
    hit = []
    for c in cards:
        for n in walk(c.get("effects") or []):
            if n.get("op") != "if":
                continue
            if not (_nonempty(n.get("then")) and _nonempty(n.get("else"))):
                continue
            if prim_diff and _prim_set(n.get("then")) == _prim_set(n.get("else")):
                continue
            hit.append(c.get("name"))
            break
    return hit


def if_card_stats(cards):
    with_if, empty_else, both_nonempty = [], [], []
    for c in cards:
        has = False
        hit_both = False
        for n in walk(c.get("effects") or []):
            if n.get("op") != "if":
                continue
            has = True
            if _nonempty(n.get("else")):
                hit_both = True
            else:
                empty_else.append(c.get("name"))
        if has:
            with_if.append(c.get("name"))
        if hit_both:
            both_nonempty.append(c.get("name"))
    return {
        "cards_with_if": len(with_if),
        "cards_if_no_else": len(set(empty_else)),
        "cards_both_nonempty": len(set(both_nonempty)),
        "cards_dual": len(set(dual_branch_cards(cards))),
        "cards_dual_primdiff": len(set(dual_branch_cards(cards, prim_diff=True))),
        "names": sorted(set(dual_branch_cards(cards))),
    }


# ---------- 指标 6：代价卡 + note 去重比 ----------

def is_cost_card(card, broad=False):
    """代价卡 = 打出这张牌要付出点什么。
    narrow（主口径）：自伤 / 血费 / 耗层 / 消耗次数 / 弃牌 / 负面自挂 / 卡级自伤型费用。
    broad（对照口径）：narrow + 主动消耗自有资源（能量 / 行动条 / 护甲 / 护盾）——这类在多数
    途径里是常规费用而非设计代价，故只作对照，不进主口径。"""
    for n in walk(card.get("effects") or []):
        t = n.get("type")
        tgt = n.get("target")
        selfside = tgt in (None, "self", "caster", "holder")
        if t == "damage" and tgt in ("self", "caster", "holder"):
            return True
        if t == "modify_resource" and n.get("resource") in ("hp", "hp_max") \
           and (n.get("value") or 0) < 0 and selfside:
            return True
        if broad and t == "modify_resource" \
           and n.get("resource") in ("energy", "gauge.current", "armor", "shield") \
           and (n.get("value") or 0) < 0 and selfside:
            return True
        if t == "modify_status" and ((n.get("stacksDelta") or 0) < 0 or n.get("stackMode") == "consume"):
            return True
        for k in ("consumeCharge", "consumeStack", "consume", "consumeAll"):
            if n.get(k):
                return True
        if t == "mount_status" and tgt in ("self", "caster"):
            sd = STATUS_BY_ID.get(n.get("statusId")) or {}
            if "debuff" in (sd.get("category") or []) or "debuff" in str(sd.get("category", "")):
                return True
        if t in ("discard", "discard_card", "mill", "exhaust"):
            return True
    cost = card.get("cost") or {}
    if isinstance(cost, dict):
        for k in ("hp", "hpCost", "selfDamage"):
            if cost.get(k):
                return True
    return False


NOTE_MARKERS = (
    (r"骨架手术", "surgery"),
    (r"环节⑤", "redesign"),
    (r"选靶\s*V2|targeting|选靶错配修正|选靶重标", "retarget"),
    (r"签名补批", "signbatch"),
    (r"审计修复", "auditfix"),
    (r"直伤梯度重标|曲线修正", "dmgrescale"),
    (r"私有化|分叉", "privatize"),
    (r"收敛|去重|清理|武器槽|差异化风格迭代|吟唱重标", "converge"),
)
# 机器配方戳记（批量留痕的主体）：**不含**"翻译/语义""毕业线/校准"这类人工语义校注
MACHINE_STAMPS = {"surgery", "redesign", "retarget", "signbatch", "auditfix",
                  "dmgrescale", "privatize", "converge"}


def note_tokens(note):
    """把 conversionNotes 的「｜」流水压成**事项戳记**元组（含角色），用于去重。"""
    toks = []
    for seg in str(note).split("｜"):
        seg = seg.strip()
        if not seg:
            continue
        m = re.search(r"角色\s*=\s*([A-Za-z_\u4e00-\u9fa5]+)", seg)
        hit = [name for pat, name in NOTE_MARKERS if re.search(pat, seg)]
        if m:
            hit.append("role:" + m.group(1))
        if hit:
            toks.append("+".join(sorted(set(hit))))
    return tuple(sorted(set(toks)))


def note_dedup(cards):
    """【副口径】卡级 conversionNotes 去重比。原文是「｜」分隔的戳记流水（骨架手术 / 环节⑤ /
    选靶V2 …），整串去重会得到 33/33 = 1.0 的假象（每串含卡名，必不重复）。
    ⚠ team-lead 2026-10-18 拍板：⑥ 主口径改取**效果节点层**，此函数仅作对照保留。"""
    raw = [str(c.get("conversionNotes") or "").strip() for c in cards]
    raw_nonempty = [n for n in raw if n]
    toks = []
    for n in raw_nonempty:
        t = note_tokens(n)
        if t:
            toks.append(t)
    roles = Counter()
    for n in raw_nonempty:
        m = re.search(r"角色\s*=\s*([A-Za-z_\u4e00-\u9fa5]+)", n)
        roles[m.group(1) if m else "(无角色戳记)"] += 1
    return {
        "cards": len(cards),
        "notes_nonempty": len(raw_nonempty),
        "distinct_raw": len(set(raw_nonempty)),
        "ratio_raw": round(len(set(raw_nonempty)) / len(raw_nonempty), 3) if raw_nonempty else None,
        "distinct_tokens": len(set(toks)),
        "ratio_tokens": round(len(set(toks)) / len(toks), 3) if toks else None,
        "distinct_roles": len(roles),
        "role_hist": roles.most_common(),
        "top_dup_tokens": Counter(toks).most_common(5),
    }


def machine_stamp_dedup(cards):
    """【⑥ 主口径 · 程有序裁定】**机器戳记去重比** = 机器配方戳记去重种数 / 含该戳记的卡数。
    抓的是"AI 批量留痕"：**少数几种批次戳记覆盖几乎全卡池** ⇒ 比值低 ⇒ 批量留痕重。
    （战士 ≈ 7 种 / 33 张 ≈ 0.21；程有序估 3 种 / 29 张 ≈ 0.10 —— 差异在戳记类目表宽度，
    请以本表的 stamp_cover 明细为准，类目表可调。）
    补充判据 `max_cover_share` = 最大单种戳记的覆盖率，是"批量留痕"最直接的证据。"""
    cover = Counter()
    with_stamp = []
    for c in cards:
        note = str(c.get("conversionNotes") or "")
        hit = {name for pat, name in NOTE_MARKERS if re.search(pat, note)} & MACHINE_STAMPS
        if hit:
            with_stamp.append(c.get("name"))
        for h in hit:
            cover[h] += 1
    kinds = len(cover)
    n = len(with_stamp)
    return {
        "stamp_kinds": kinds,
        "stamp_cards": n,
        "ratio": round(kinds / n, 3) if n else None,
        "stamp_cover": cover.most_common(),
        "max_cover_share": round(cover.most_common(1)[0][1] / len(cards), 3)
                           if cover and cards else None,
    }


_NOTE_NUM = re.compile(r"\d+(\.\d+)?")


def node_note_dedup(cards):
    """【⑥ 主口径 · team-lead 拍板】**效果节点层** note 去重比（不是卡级 describe / conversionNotes）。
    取 effects 与 triggers[].effects 里所有节点的 note 字符串：
        ratio     = 不同 note 文案数 / 带 note 的节点数（原文去重）
        ratio_tpl = 数字归一后的**模板**去重比（"战意消耗：2 层"与"战意消耗：3 层"视为同一模板）
    判据：同一段效果话术在 N 个节点上原样复制（战士「战意消耗：N 层」×8）就是模式复用的
    文本证据——这与②的指纹最近对是同一现象的两个观测面。**主判据取 ratio_tpl**：
    只换数字不换句式的复制，在原文口径下会被判成"不重复"，是漏报。"""
    notes = []
    for c in cards:
        for _origin, n in iter_card_effects(c):
            s = n.get("note")
            if isinstance(s, str) and s.strip():
                notes.append((c.get("name"), s.strip()))
    total = len(notes)
    dup = Counter(s for _c, s in notes)
    tpl = Counter(_NOTE_NUM.sub("#", s) for _c, s in notes)
    top = [{"times": n, "tpl": t[:60],
            "cards": sorted({c for c, s2 in notes if _NOTE_NUM.sub("#", s2) == t})[:8]}
           for t, n in tpl.most_common(6) if n > 1]
    return {
        "nodes_with_note": total,
        "cards_with_note": len({c for c, _s in notes}),
        "distinct": len(dup),
        "ratio": round(len(dup) / total, 3) if total else None,
        "distinct_tpl": len(tpl),
        "ratio_tpl": round(len(tpl) / total, 3) if total else None,
        "max_dup_times": (tpl.most_common(1)[0][1] if tpl else 0),
        "max_dup_share": round(tpl.most_common(1)[0][1] / total, 3) if (total and tpl) else None,
        "top_dup": top,
    }


# ---------- 汇总 ----------

def scan_keys(cards, data):
    """要扫的资源 / 通道键 = 卡面实际写入的 modify_resource 键
    ∪ 通道表场面派生量（**仅当本途径有卡读它**，否则是噪音）
    ∪ classMechanics 声明的职业资源
    ∪ 程有序点名的 war_spirit。"""
    keys = {n.get("resource") for c in cards for _o, n in iter_card_effects(c)
            if n.get("type") == "modify_resource" and n.get("resource")}
    read_all = set()
    for c in cards:
        for _o, n in iter_card_effects(c):
            k = n.get("kind")
            if k in READ_PRED:
                read_all.add(READ_PRED[k])
        if c.get("phaseHooks"):
            read_all.add("phase")
        for h in c.get("dimHooks") or []:
            if isinstance(h, dict) and h.get("dim"):
                read_all.add(h["dim"])
    keys |= (read_all & set(BOARD_DERIVED))
    keys |= {cm.get("statusId") for cm in data.get("classMechanics") or [] if cm.get("statusId")}
    return sorted(k for k in keys if k)


def playability_2x2(cards, st, cost_cards):
    """2×2 诊断（2026-10-19）：可操作变量（≥2 张主动写入 + ≥1 读 + 有代价）
    × 集火（某标记被 ≥3 张卡以 ≥2 种方式读取，且施加方 ≤2 张 ⇒ 稀缺）。"""
    cost_names = {c.get("name") for c in cost_cards}
    # 基础量（行动条/血/能量等）不算「可操作变量」——引擎按规则供给，人人都有
    base = {"energy", "armor", "shield", "hp", "hp_max", "gauge.current", "gauge.max",
            "action", "charge"}
    var_keys = []
    for k, v in st.items():
        if k in base:
            continue
        w = v["write"]
        if w["produce_active"] >= 2 and v["read"]["cards"] >= 1:
            var_keys.append({
                "key": k, "active_producers": w["produce_active"],
                "readers": v["read"]["cards"],
                "paid": bool(cost_names & set(w.get("producer_names") or [])),
            })
    has_var = bool(var_keys)

    reads, writes, rtypes = defaultdict(set), defaultdict(set), defaultdict(set)
    for c in cards:
        cid = c.get("id")
        for _origin, n in iter_card_effects(c):
            sid = n.get("statusId")
            if n.get("type") == "mount_status" and isinstance(sid, str):
                writes[sid].add(cid)
            elif n.get("type") in ("modify_status", "dispel", "transfer_status") and isinstance(sid, str):
                reads[sid].add(cid)
                rtypes[sid].add(n["type"])
            if n.get("kind") in ("has_status", "caster_status_exists", "status_category") \
                    and isinstance(n.get("id"), str):
                reads[n["id"]].add(cid)
                rtypes[n["id"]].add(n["kind"])
            for f in ("hasStatus", "targetHasStatus"):
                v = n.get(f)
                for x in ([v] if isinstance(v, str) else (v or [])):
                    if isinstance(x, str):
                        reads[x].add(cid)
                        rtypes[x].add(f)
    focus = sorted(sid for sid in reads
                   if len(reads[sid]) >= 3 and 1 <= len(writes.get(sid, ())) <= 2
                   and len(rtypes[sid]) >= 2)
    has_focus = bool(focus)
    quad = ("理想态" if has_var and has_focus else
            "有变量无集火" if has_var else
            "有集火无变量" if has_focus else "双挂")
    return {"has_variable": has_var, "var_keys": var_keys,
            "has_focus": has_focus, "focus_status": focus[:5],
            "quadrant": quad}


def scan_pathway(pid, data):
    cards = data.get("cards") or []
    axes = data.get("axes") or {}
    res_keys = scan_keys(cards, data)
    cost = [c for c in cards if is_cost_card(c)]
    cost_broad = [c for c in cards if is_cost_card(c, broad=True)]
    shapes = ast_shape_hist(cards)
    st = supply_table(cards, data, res_keys, STATUS_BY_ID)
    alarms = sorted(k for k, v in st.items() if v["alarm"])
    nn = node_note_dedup(cards)
    return {
        "pathway": pid,
        "name": data.get("pathwayName"),
        "cards": len(cards),
        "1_ast_shapes": ast_shape_dedup(cards),
        "1_skeleton_dedup": skeleton_dedup(cards),
        "1_triplet": triplet_dedup(cards),
        "1_family_count": shapes["family_count"],
        "1_families": shapes["families"],
        "1_shape_hist_top": [(n, names[:8]) for n, names, _ in shapes["distinct_shapes"][:5]],
        "2_intra_pairs": intra_pairs(cards, pid),
        "3_tgt_dedup": axis_target_dedup(cards, axes),
        "4_supply": st,
        "4_identity_mounts": identity_mount_stats(cards, axes),
        "4_summary": {
            "keys": len(res_keys),
            "engine_supplied": sum(1 for v in st.values() if v["engine_supply_count"]),
            "alarm_keys": alarms,
            "alarm_count": len(alarms),
            # 「卡面产层数」单列（程有序要求：不看占比看绝对数）
            "produce_counts": {k: v["write"]["produce_cards"] for k, v in st.items()},
            "produce_active_counts": {k: v["write"]["produce_active"] for k, v in st.items()},
            "total_produce_cards": sum(v["write"]["produce_cards"] for v in st.values()),
            # 卡面产层数（**绝对数**，程有序要求单列）：{键: (产层卡数, 其中主动)}
            "cardface_producers": ",".join(
                "%s=%d(主动%d)" % (k, v["write"]["produce_cards"], v["write"]["produce_active"])
                for k, v in sorted(st.items()) if v["write"]["produce_cards"]) or "0",
            "min_active_prod_ratio": min((v["write"]["active_prod_ratio"]
                                          for v in st.values()
                                          if v["write"]["active_prod_ratio"] is not None), default=None),
        },
        "5_dual_branch": if_card_stats(cards),
        "6_cost": {
            "cost_cards": len(cost),
            "cost_cards_broad": len(cost_broad),
            "ratio": round(len(cost) / len(cards), 3) if cards else None,
            "ratio_broad": round(len(cost_broad) / len(cards), 3) if cards else None,
            "names": [c.get("name") for c in cost],
            "note_machine": machine_stamp_dedup(cards),   # ⑥ 主口径
            "note_node": nn,                              # 辅 1：效果节点层
            "note_card_level": note_dedup(cards),         # 辅 2：卡级事项戳记 / 角色戳记
        },
        "7_2x2": playability_2x2(cards, st, cost),
    }


# ---------- 阈值：首轮线 → 次轮线 → 目标线（三轮拉伸计划）----------
#
# 【纪律 1】验收线一律用**全库分位**，不用单途径标杆。
#   反面记录（写在此处以防伪）：sleepless 的 0.277 曾被当作"卡级最近对"的标杆。
#   实测那是 **sleepless ↔ spectator 的途径间距离**，与"途径内卡级最近对"不是同一个量
#   （22 途径上两者 r = 0.135，基本正交 —— 途径间远的途径，内部照样可以自我复制；
#   战士就是典型：途径间 0.315 全库第 2，途径内最近对 0.0395 全库倒数）。
#   ⇒ 任何单个途径的数都不得充当验收线。下表全部由 22 途径实算分位推出。
#
# 【纪律 2】这三列是**起跑线不是毕业线**：首轮线按"全库中位附近"定（约半数途径能过），
#   次轮线抬到 P60–P75，目标线才是设计意图线。改一轮卡抬一档，不许一步到位。
#
# 【纪律 3】六项**永不进 score.py 的 100 分**，只写 docs/meta/rounds/<途径>.md 与 REDESIGN_LOG。
# 说明：前四项首轮线 = 已拍板的起跑线；⑥note 因口径改到节点层而按分位重定（见 THRESHOLD_NOTES）。
THRESHOLDS = [
    # 指标, 首轮线, 次轮线, 目标线, 全库中位(实算), 口径与理由
    ("② 途径内卡级最近对 min", None, None, None, 0.000,
     "**首轮只记基线，不设达标线**（程有序裁定）：0/22 达标的线会诱导『为过线而改数字』，"
     "那正是本流程要防的刷分。**从第二条途径起用 p50 作线**。辅助线：途径内均距 ≥0.62"),
    ("② 途径内卡级均距（辅助）", 0.62, 0.64, 0.66, 0.611,
     "辅助线，不单独判达标；战士 0.6326 已过"),
    ("③ 最低轴选靶签名去重比", 0.30, 0.40, 0.50, 0.286,
     "几何归一 + filter 归族后的结构签名去重比（排除 fallbackSort、保留 filter 语义族），"
     "取该途径最差的一轴。**战士 martial 轴 = 0.25（2/8）**；"
     "⚠ 脆弱：㉒银白细剑若被打回删除 → 掉到 0.125（1/8，全库最低）"),
    ("⑤ 双分支卡占比", 0.10, 0.20, 0.30, 0.000,
     "then/else **均非空**即算（程有序裁定 = 2）；空 else 不算（否则 19 张假分支虚高到 61%）。"
     "另留对照列 cards_dual_primdiff = 两边原语类型集不同"),
    ("⑥ 代价卡占比（窄口径）", 0.15, 0.25, 0.30, 0.000,
     "自伤 / 血费 / 耗层 / 弃牌 / 负面自挂；不含常规能量与行动条消耗"),
    ("⑥ 机器戳记最大覆盖率（越低越好）", 0.85, 0.75, 0.50, 0.786,
     "**主判据 = max_cover_share**：单一批次戳记覆盖了多少比例的卡（战士 0.909 = 全库第 3 差）。"
     "这是『AI 批量留痕』的直接证据，且与主人的体感同向"),
    ("⑥ 机器戳记去重比（对照，有尺度缺陷）", None, None, None, 0.105,
     "⚠ 不可用作业收线：= 戳记种数 / 含戳记卡数，**分母是卡数 ⇒ 卡池越大分越低**"
     "（lawyer 46 卡 0.087、sleepless 34 卡 0.375，方向与『留痕重不重』相反）。仅作对照登记"),
    ("① 三元组模板数", None, None, None, None,
     "**相对线**：模板数 ≥ 卡数 / 6（33 卡 → ≥5.5）。卡数不同则线不同，见逐途径 PASS/✗"),
]
# ① 与 ④ 不设阈值：① 两档并列仅作定位用（人工判玩法模式，不作门槛）；
# ④ 是三列事实表 + 报警（产层 = 0 即报警），不是可拉伸的数值指标。

THRESHOLD_NOTES = {
    "⑤ 双分支卡占比":
        "⚠ 跳档线：首轮 10% ≈ 全库 P95（中位 0%、P75 2.5%、P90 5.9%），22 途径仅 1 个能过"
        "（sleepless 29%）。若首轮意图是『多数途径先动起来』→ 建议降到 5%（P90，4/22 能过）；"
        "若只作战士专项验收线 → 保持 10%。",
    "⑥ 代价卡占比（窄口径）":
        "⚠ 跳档线：首轮 15% ≈ 全库 P95+（中位 0%、P75 5.3%、P90 8.8%），22 途径仅 supplicant"
        "（82%，离群）能过。建议降到 8%（≈P90，3/22）。",
    "⑥ 机器戳记最大覆盖率（越低越好）":
        "⚠ **口径修正**：程有序给的『机器戳记去重比 = 戳记种数 / 含戳记卡数』有**尺度缺陷** —— "
        "分母是卡数，卡池越大分越低（lawyer 46 卡 → 0.087；sleepless 34 卡 → 0.375），"
        "且方向与『留痕重不重』**相反**（战士 0.242 是全库第 1 高，却正是 AI 痕迹最重的那条）。\n"
        "改用 **max_cover_share = 单一批次戳记覆盖卡池比例**（越高越差）："
        "全库中位 0.786、P75 0.861；**战士 0.909 = 全库第 3 差**（仅 lawyer 0.978 / supplicant 0.970 更差），"
        "sleepless 0.118 是唯一近乎人工手写的。这一项与主人的体感同向，建议作⑥的主判据。",
    "⑥ 机器戳记去重比（对照，有尺度缺陷）":
        "保留仅为对照与可追溯，不作验收线。若要修掉尺度缺陷，建议改成『戳记种数 / 卡数』的补数或 "
        "直接用 max_cover_share。",
    "② 途径内卡级最近对 min":
        "注：②min 与⑥note 的斯皮尔曼 r = +0.316、与③ r = −0.328 —— 三项并不共线，"
        "是三个不同的观测面，不要互相替代。",
    "③ 最低轴选靶签名去重比":
        "注：③ 与②lt020 的 r = −0.002（正交）——『选靶单一』与『卡面大量近似对』是两件独立的事，"
        "两条线都要跑。",
}

# ---------- 自检：锚点 + 复制不变量 ----------

# 说明：1 与 6 各有两档口径（细/粗），锚点自检两档都跑，主口径按能复现锚点者定。
# 来源：production-manager（程有序）给的战士已知实测值。
ANCHOR = {
    "1_ast_shapes": 5,          # 程有序给的锚（细形状）
    "1_family_count": 5,        # 粗形状族，同为 5 则两项一致
    "2_min": 0.0395,
    "2_top1": ("格斗术·连击", "近身缠斗"),
    "3_martial_distinct": 2,
    "5_dual_branch": 2,   # 程有序裁定：else 非空即算（锚 0 作废）
    "6_cost_cards": 3,
    "6_note_machine_kinds": 8,  # ⑥ 主口径：机器戳记种数（战士实测）
    "6_note_groups": 21,    # 副口径：卡级 conversionNotes 事项戳记去重组数（战士实测 20/33）
    "6_note_roles": 6,          # 我在数据里数到的角色戳记种数
    "4_war_spirit_engine": 1,   # 引擎供给证据 ≥1 条（classMechanics + 状态def自述）
    "4_war_spirit_prod": 1,     # 卡面产层 = 1（兵械通晓 · triggers:on_kill）
    "4_war_spirit_active_prod": 0,   # 主动卡产层 = 0 ⇒ 报警
    "4_war_spirit_consume": 8,  # 卡面消耗 = 8 张主动
    "4_death_tally_prod": 0,    # 死亡簿卡面产层 = 0（场面派生量）
    "4_death_tally_read": 7,    # 死亡簿卡面读取 = 7（dead_count）
}

# 未复现的锚点 → 说明差异来源，供程有序裁定以哪边为准
ANCHOR_NOTE = {
    "锚1 AST形状去重数(细)": "① 已按程有序裁定换成**三元组口径**（主导原语族 + 是否有非空 else + 作用对象类别），验收线改相对值『模板数 ≥ 卡数/6』；人工判的 5 不再作为锚。旧的三个自动口径（原语组合 29 / 骨架签名 28 / 形状族 8）仍并列输出作定位。",
    "锚1 形状族去重数(粗)": "同上。",
    "锚3 martial主动选靶去重数(strict)": "已按程有序裁定：**排除 fallbackSort**（超时回退，玩家不可感知）、**保留 filter 语义族**（决定能选谁，玩家可感知）→ 战士武艺轴 = 2（7 张全同 + ㉒银白细剑多 unitType=[DEMON]）。⚠ 脆弱：㉒ 若被打回删除 → 掉到 1（7/7 全同）。⚠ 引擎侧：`request.filter` 全库未求值（待办.md），故这 2 组当前是**名义差异**。",
    "锚5 双分支卡数": "已按程有序裁定：then/else **均非空**即算（锚 0 作废，实测 2 = 伪装 / 神罚）。空 else 若也算会虚高到 20/33 = 61%。对照列 cards_dual_primdiff（两边原语类型集不同）= 0。",
    "锚6 note事项戳记去重组数": "⑥ 主口径已换**机器戳记去重比**（机器配方戳记去重种数 / 含该戳记的卡数）；旧锚 3 组为卡级 conversionNotes 口径，仅作对照。",
    "锚1 三元组模板数(相对线)": "相对线 = 模板数 ≥ 卡数/6（战士 33 卡 → ≥5.5）。",
    "锚6 note角色戳记种数": "数据里实际有 6 种角色戳记（buff 12 / dmg 11 / 无戳记 4 / debuff 4 / stat 1 / heal 1），比你列的 4 种多 2。",
}


def self_test(pws):
    rep, ok = [], True

    def chk(tag, got, want, fatal=True, ge=False):
        nonlocal ok
        good = (got is not None and got >= want) if ge else (got == want)
        if fatal:
            ok = ok and good
        rep.append((("PASS" if good else "FAIL"), tag,
                    "got=%s" % (got,), ("want>=%s" % (want,)) if ge else ("want=%s" % (want,)),
                    ANCHOR_NOTE.get(tag, "")))

    d = pws["warrior"]
    r = scan_pathway("warrior", d)
    chk("锚1 AST形状去重数(细)", r["1_ast_shapes"], ANCHOR["1_ast_shapes"], fatal=False)
    chk("锚1 形状族去重数(粗)", r["1_family_count"], ANCHOR["1_family_count"], fatal=False)
    chk("锚2 最近对最小值", r["2_intra_pairs"]["min"], ANCHOR["2_min"])
    pair1 = r["2_intra_pairs"]["top"][0]
    chk("锚2 最近对卡名", (pair1[1], pair1[2]), ANCHOR["2_top1"])
    chk("锚3 martial主动选靶去重数(strict)", r["3_tgt_dedup"]["martial"]["distinct"], ANCHOR["3_martial_distinct"])
    chk("锚5 双分支卡数", r["5_dual_branch"]["cards_dual"], ANCHOR["5_dual_branch"])
    chk("锚6 代价卡数", r["6_cost"]["cost_cards"], ANCHOR["6_cost_cards"])
    nd = r["6_cost"]["note_card_level"]
    chk("锚6 机器戳记种数", r["6_cost"]["note_machine"]["stamp_kinds"], ANCHOR["6_note_machine_kinds"])
    chk("锚6 note事项戳记去重组数", nd["distinct_tokens"], ANCHOR["6_note_groups"], fatal=False)
    chk("锚6 note角色戳记种数", nd["distinct_roles"], ANCHOR["6_note_roles"], fatal=False)
    # ④ 三列供给（team-lead 修正后的口径）
    st = r["4_supply"]
    ws = st.get("war_spirit") or {}
    dt = st.get("death_tally") or {}
    chk("锚4 战意·引擎供给证据条数", ws.get("engine_supply_count"), ANCHOR["4_war_spirit_engine"], ge=True)
    chk("锚4 战意·卡面产层卡数", (ws.get("write") or {}).get("produce_cards"), ANCHOR["4_war_spirit_prod"])
    chk("锚4 战意·消耗卡数", (ws.get("write") or {}).get("consume_cards"), ANCHOR["4_war_spirit_consume"])
    chk("锚4 战意·主动卡产层数", (ws.get("write") or {}).get("produce_active"), ANCHOR["4_war_spirit_active_prod"])
    chk("锚4 死亡簿·卡面产层", (dt.get("write") or {}).get("produce_cards"), ANCHOR["4_death_tally_prod"])
    chk("锚4 死亡簿·卡面读取", (dt.get("read") or {}).get("cards"), ANCHOR["4_death_tally_read"])

    # 复制不变量：指标 2 必须随复制变化（现有"途径间均距"就是死在这上面）
    base = r["2_intra_pairs"]
    dup_rep = []
    for k in (2, 3, 5):
        d2 = json.loads(json.dumps(d))
        d2["cards"] = d2["cards"] * k
        r2 = scan_pathway("warrior", d2)
        ip = r2["2_intra_pairs"]
        dup_rep.append((k, len(d2["cards"]), ip["min"], ip["mean"], ip["n_lt_020"], r2["1_ast_shapes"]))
    changed = any(abs(x[3] - base["mean"]) > 1e-6 for x in dup_rep)
    ok = ok and changed
    rep.append((("PASS" if changed else "FAIL"), "不变量 指标2随复制变化",
                "means=%s" % [x[3] for x in dup_rep], "want=至少一个与 %.4f 不同" % base["mean"], ""))
    extra = {
        "skeleton_dedup": r["1_skeleton_dedup"],
        "ast_shapes": r["1_ast_shapes"],
        "war_spirit": ws,
        "death_tally": dt,
        "node_note": r["6_cost"]["note_node"],
        "dual_detail": r["5_dual_branch"],
        "triplet": r["1_triplet"],
        "machine": r["6_cost"]["note_machine"],
    }
    return ok, rep, dup_rep, extra


# ---------- 阈值表输出 ----------

def _q(vals, q):
    vals = sorted(v for v in vals if v is not None)
    if not vals:
        return None
    i = min(len(vals) - 1, max(0, int(round(q * (len(vals) - 1)))))
    return vals[i]


# 越低越好的指标（打印与判达标时取反）
LOWER_BETTER = {"⑥ 机器戳记最大覆盖率（越低越好）"}


def metric_values(rows):
    """从全库扫描结果抽出五项可验收量的逐途径值（用于分位）。"""
    def lowratio(r):
        v = [x["dedup_ratio"] for x in r["3_tgt_dedup"].values() if x["dedup_ratio"] is not None]
        return min(v) if v else None
    return {
        "② 途径内卡级最近对 min": [r["2_intra_pairs"]["min"] for r in rows],
        "② 途径内卡级均距（辅助）": [r["2_intra_pairs"]["mean"] for r in rows],
        "③ 最低轴选靶签名去重比": [lowratio(r) for r in rows],
        "⑤ 双分支卡占比": [(r["5_dual_branch"]["cards_dual"] / r["cards"]) if r["cards"] else None for r in rows],
        "⑥ 代价卡占比（窄口径）": [r["6_cost"]["ratio"] for r in rows],
        "⑥ 机器戳记最大覆盖率（越低越好）": [(r["6_cost"]["note_machine"] or {}).get("max_cover_share") for r in rows],
        "⑥ 机器戳记去重比（对照，有尺度缺陷）": [(r["6_cost"]["note_machine"] or {}).get("ratio") for r in rows],
        "① 三元组模板数": [r["1_triplet"]["templates"] for r in rows],
    }


def print_thresholds(rows):
    mv = metric_values(rows)
    fm = (lambda x: ("%.3f" % x) if isinstance(x, float) else str(x))
    print("=== 阈值：三轮拉伸计划（首轮线 → 次轮线 → 目标线）===")
    print("【纪律】验收线一律用**全库分位**，不用单途径标杆。")
    print("  反面记录：sleepless 0.277 是它到 spectator 的**途径间**距离，不是途径内卡级最近对；")
    print("  两量在 22 途径上 r = 0.135（正交）—— 途径间远的途径，内部照样自我复制。")
    print("  战士即为典型：途径间 0.315（全库第 2）／途径内最近对 0.0395（全库倒数）。")
    print()
    print("| 指标 | 首轮线 | 次轮线 | 目标线 | 全库中位 | 全库P75 | 达首轮 | 达目标 |")
    print("|---|---:|---:|---:|---:|---:|---:|---:|")
    for name, r1, r2, tgt, _med, _why in THRESHOLDS:
        vals = mv.get(name) or []
        med, p75 = _q(vals, 0.5), _q(vals, 0.75)
        if r1 is None:
            print("| %s | — | — | — | %s | %s | 只记基线 | 只记基线 |" % (
                name, fm(med) if med is not None else "-", fm(p75) if p75 is not None else "-"))
            continue
        le = name in LOWER_BETTER
        n1 = sum(1 for v in vals if v is not None and (v <= r1 if le else v >= r1))
        nt = sum(1 for v in vals if v is not None and (v <= tgt if le else v >= tgt))
        print("| %s | %s | %s | %s | %s | %s | %d/%d | %d/%d |" % (
            name, fm(r1), fm(r2), fm(tgt), fm(med) if med is not None else "-",
            fm(p75) if p75 is not None else "-", n1, len(vals), nt, len(vals)))
    print()
    print("① 与 ④ 不设阈值：① 两档并列仅作定位（人工判玩法模式）；")
    print("④ 是「引擎供给 / 卡面写入 / 卡面读取」三列事实表 + 「卡面产层 = 0」报警，不是可拉伸数值。")
    print()
    print("--- ④ 引擎供给报警汇总（卡面产层 = 0 / 主动产层 = 0）---")
    for r in rows:
        s = r["4_summary"]
        if s["alarm_count"]:
            print("  %-12s keys=%d 引擎供给=%d 报警键=%s" % (
                r["pathway"], s["keys"], s["engine_supplied"], ",".join(s["alarm_keys"])))
    return 0


# ---------- main ----------

STATUS_BY_ID = {}


def main():
    global STATUS_BY_ID
    for pid, label, sd in iter_status_defs():
        STATUS_BY_ID[sd["id"]] = sd

    ap = argparse.ArgumentParser()
    ap.add_argument("--pw", help="只扫该途径")
    ap.add_argument("--self-test", action="store_true", help="锚点自检 + 复制不变量测试")
    ap.add_argument("--json", action="store_true", help="机器可读输出")
    ap.add_argument("--thresholds", action="store_true", help="只输出三轮拉伸阈值表 + ④报警汇总")
    args = ap.parse_args()

    pws = load_skills()

    if args.self_test:
        ok, rep, dup, extra = self_test(pws)
        print("=== 锚点自检（战士 = 锚）===")
        for st, tag, got, want, note in rep:
            print("  [%s] %-30s %s | %s" % (st, tag, got, want))
            if note:
                print("         ↳ %s" % note)
        print("  复制不变量明细 (倍数, 卡数, min, mean, <0.20对数, ast_shapes):")
        for x in dup:
            print("     x%d cards=%-4d min=%.4f mean=%.4f lt020=%d ast=%d" % x)
        print("  ① 三元组主口径：模板数=%d / 需≥%.1f → %s ｜ 对照：原语组合=%d 骨架签名=%d" % (
            extra["triplet"]["templates"], extra["triplet"]["need"] or 0,
            "PASS" if extra["triplet"]["pass"] else "FAIL",
            extra["ast_shapes"], extra["skeleton_dedup"]))
        print("  ⑥ 机器戳记：%d 种 / %d 张 = %.3f ｜ 覆盖：%s" % (
            extra["machine"]["stamp_kinds"], extra["machine"]["stamp_cards"],
            extra["machine"]["ratio"] or 0,
            ",".join("%s×%d" % (k, v) for k, v in extra["machine"]["stamp_cover"][:4])))
        print("  ⑤ 分支明细：%s" % {k: v for k, v in extra["dual_detail"].items() if k != "names"})
        print("  ⑥ 效果节点层 note：节点数=%d ｜ 原文去重=%d (%.3f) ｜ 模板去重(数字归一)=%d (%.3f)" % (
            extra["node_note"]["nodes_with_note"], extra["node_note"]["distinct"],
            extra["node_note"]["ratio"] or 0, extra["node_note"]["distinct_tpl"],
            extra["node_note"]["ratio_tpl"] or 0))
        for t in extra["node_note"]["top_dup"][:3]:
            print("       ×%d 「%s」 %s" % (t["times"], t["tpl"], ",".join(t["cards"])))
        print("  ④ 三列供给（战意 / 死亡簿）：")
        for k, v in (("war_spirit", extra["war_spirit"]), ("death_tally", extra["death_tally"])):
            if not v:
                print("     %s：未扫到" % k)
                continue
            print("     %s" % k)
            for e in v["engine_supply"]:
                print("       引擎供给 · %s" % e)
            w, rd = v["write"], v["read"]
            print("       卡面写入 · 产层卡=%d（主动 %d / 被动 %d；effects %d 处 / triggers %d 处）"
                  " 消耗卡=%d" % (w["produce_cards"], w["produce_active"], w["produce_passive"],
                                  w["produce_via_effects"], w["produce_via_trigger"], w["consume_cards"]))
            print("       卡面读取 · %d 张（%s）" % (rd["cards"], ",".join(list(rd["kinds"])[:5])))
            print("       判定 · %s%s" % (v["verdict"], "  【报警】" if v["alarm"] else ""))
        print("SELF_TEST:", "PASS" if ok else "FAIL")
        return 0 if ok else 1

    if args.pw:
        r = scan_pathway(args.pw, pws[args.pw])
        print(json.dumps(r, ensure_ascii=False, indent=2))
        return 0

    rows = []
    for pid, d in pws.items():
        r = scan_pathway(pid, d)
        rows.append(r)
    rows.sort(key=lambda r: r["2_intra_pairs"]["min"] or 9)

    if args.json:
        print(json.dumps(rows, ensure_ascii=False))
        return 0

    if args.thresholds:
        return print_thresholds(rows)

    print("| 途径 | 卡数 | ①三元组模板/需≥ | ②最近对min | ②均距 | ②<0.20对 | ③最低轴选靶去重 | "
          "④键数/报警/卡面产层 | ⑤双分支% | ⑥代价% | ⑥机器戳记 | 2×2 |")
    print("|---|---:|---:|---:|---:|---:|---|---:|---:|---:|---:|---|")
    for r in rows:
        ip = r["2_intra_pairs"]
        td = min((v["dedup_ratio"] for v in r["3_tgt_dedup"].values() if v["dedup_ratio"] is not None), default=None)
        s = r["4_summary"]
        tp = r["1_triplet"]
        ms = r["6_cost"]["note_machine"]
        print("| %s | %d | %d/%.1f%s | %.4f | %.4f | %d | %s | %d/%d/%s | %.0f%% | %.0f%% | %s | %s |" % (
            r["pathway"], r["cards"], tp["templates"], tp["need"] or 0,
            "" if tp["pass"] else "✗",
            ip["min"] or 0, ip["mean"] or 0, ip["n_lt_020"],
            ("%.2f" % td) if td is not None else "-", s["keys"], s["alarm_count"],
            s["cardface_producers"],
            (r["5_dual_branch"]["cards_dual"] / r["cards"] * 100) if r["cards"] else 0,
            (r["6_cost"]["ratio"] or 0) * 100,
            ("%.3f" % ms["ratio"]) if ms.get("ratio") is not None else "-",
            r["7_2x2"]["quadrant"]))
    print()
    print("=== 2×2 诊断（可操作变量 × 集火）——按改造方向分组 ===")
    order = {"有集火无变量": "最便宜：补 1 张写入卡", "有变量无集火": "中：给变量加稀缺标记",
             "双挂": "最贵：引入新变量", "理想态": "只做精细化"}
    for quad in ("有集火无变量", "有变量无集火", "双挂", "理想态"):
        ids = [r for r in rows if r["7_2x2"]["quadrant"] == quad]
        if ids:
            print("  %s（%d）：%s" % (quad, len(ids), "、".join(r["pathway"] for r in ids)))
            print("     → %s" % order[quad])
    print()
    print_thresholds(rows)
    return 0


if __name__ == "__main__":
    sys.exit(main())
