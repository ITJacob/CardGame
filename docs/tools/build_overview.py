# -*- coding: utf-8 -*-
"""生成技能池全库总览（按途径分章）。

用法:
    python docs/tools/build_overview.py

输入: docs/json/*.skills.json + docs/json/manifest.json
输出: docs/analysis/SKILLS_OVERVIEW.md

数据变了就重跑本脚本，不要手改输出文件。
"""
import io, os, glob, json

HERE = os.path.dirname(os.path.abspath(__file__))       # docs/tools/
DOCS = os.path.dirname(HERE)                            # docs/
JSON_DIR = os.path.join(DOCS, "json")                   # docs/json/
OUT = os.path.join(DOCS, "analysis", "SKILLS_OVERVIEW.md")  # docs/analysis/SKILLS_OVERVIEW.md

# ---------- 名称映射 ----------
ELEM = {"fire": "火", "ice": "冰", "poison": "毒", "lightning": "电击", "mental": "精神",
        "physical": "物理", "holy": "圣", "none": "无属性"}
RES = {"hp": "生命", "energy": "能量", "shield": "护盾", "armor": "护甲",
       "lost": "迷失值", "gauge.current": "行动条", "gauge.threshold": "行动条阈值"}
STAT = {"attack": "攻击", "defense": "防御", "armor": "护甲", "rank": "位格",
        "hp_max": "生命上限", "energy_max": "能量上限", "energy_regen": "能量恢复",
        "gauge.rate": "行动条速率", "gauge.threshold": "行动条阈值", "summon_cap": "召唤上限"}
MODE = {"delta": "+", "set": "=", "mul": "×", "to_at_least": "至少", "setHp": "设为",
        "hpMaxRatio": "按上限比例", "to_ratio": "至比例"}
TGT = {"self": "自身", "caster": "施法者", "target": "目标", "primary_target": "主目标",
       "same_target": "同一目标", "secondary_target": "次要目标", "attacker": "攻击者",
       "holder": "持有者", "status_holder": "状态持有者", "killed_unit": "被击杀单位",
       "all_allies": "全体友军", "allies_except_self": "其他友军", "all_enemies": "全体敌人",
       "all_other_enemies": "其他敌人", "all_units": "全体单位", "all": "全场",
       "adjacent_enemy": "相邻敌人", "enemy": "敌人", "occupant_ally": "区域内友军",
       "occupant_enemy": "区域内敌人", "splash_adjacent": "溅射相邻",
       "splash_behind": "溅射身后", "one_own_snare_trap": "自身一个陷阱"}
RARITY = {"common": "普通", "uncommon": "精良", "rare": "稀有", "epic": "史诗", "legendary": "传说"}
SIDE = {"self": "自身", "target": "目标", "ally": "友军", "enemy": "敌人", "both": "双方", "all": "全场"}
EVENT = {"on_apply": "施加时", "on_remove": "移除时", "on_tick": "每 tick", "on_turn_start": "回合开始",
         "on_battle_start": "战斗开始", "on_spawn": "登场时", "on_death": "死亡时", "on_kill": "击杀时",
         "on_attack": "攻击时", "on_take_damage": "受伤时", "on_deal_damage": "造成伤害时",
         "on_active_skill": "施放技能时", "on_status_gain": "获得状态时"}
# 状态修正键 → 中文（未命中的用原键名）
MODCN = {
    "damage_taken_mul": "受到伤害", "damageTakenMul": "受到伤害", "damageTakenBonus": "受到伤害",
    "damage_mul": "造成伤害", "damageMul": "造成伤害", "damageDealtMul": "造成伤害",
    "damageBonus": "造成伤害", "damageDealtMulPerStack": "每层造成伤害",
    "heal_output_mul": "治疗输出", "heal_received_mul": "受到治疗", "healReceivedMul": "受到治疗", "healInvert": "治疗反转",
    "gaugeRateMul": "行动条速率", "gauge_rate_up": "行动条速率", "gaugeReductionImmune": "免疫行动条削减",
    "moveImmune": "免疫位移", "movePierceImmune": "穿透位移免疫",
    "lethalProtect": "免死保护", "reviveBlocked": "禁止复活", "revive_blocked": "禁止复活",
    "untargetableByTargeted": "不可被单体选中", "untargetable": "不可选中", "untargetableByAll": "不可被选中",
    "detectConceal": "识破隐匿", "seeThroughStealth": "看穿潜行", "seeConceal": "识破隐匿",
    "pierceConceal": "穿透隐匿", "concealReveal": "显形", "reveal": "显形", "revealToSource": "对来源显形",
    "reveal_stealth": "显形", "revealConcealment": "显形",
    "targetOverride": "改写目标", "targetPriority": "目标优先", "targetPriorityLowest": "目标降权",
    "targetAnchor": "目标锚点", "candidateWeight": "候选权重",
    "durationModifier": "持续时间修正", "buffUndispellable": "增益不可驱散",
    "outgoingDispelOverride": "对外驱散覆写", "dispelOverride": "驱散覆写", "dispelParams": "驱散参数",
    "outgoingDamageParams": "对外伤害参数", "immune": "免疫", "thorns": "反伤",
    "damageRedirect": "伤害转向", "damageShare": "伤害分摊", "damageTransfer": "伤害转移",
    "lifesteal": "吸血", "lifestealRatio": "吸血比例", "splashRatio": "溅射比例",
    "summonCapOverride": "召唤上限", "statPerStack": "每层属性", "statMods": "属性修正",
    "buffBlocked": "禁止增益", "disableSkills": "禁用技能", "disableAllActions": "禁用全部行动",
    "contagious": "可传染", "silent_immune": "沉默免疫", "transferOnDeath": "死亡时转移",
    "energyCostAdd": "能量消耗", "energyCostMin": "能量下限", "drainHealBonus": "吸取回复",
    "allyDamageMul": "友军伤害", "fortuneGainMul": "幸运获取", "deathSettlement": "死亡结算",
    "regionValueBoost": "区域数值增强", "perStack": "每层", "rankCheck": "位格判定",
    "behaviorModifiers": "行为修正", "behaviorOverride": "行为覆写", "action_nullify": "行动无效化",
    "contractDispelLock": "契约驱散锁", "runtimeDispelLock": "运行时驱散锁",
    "runtimeDispelOverride": "运行时驱散覆写", "dispelableOverride": "可否驱散覆写",
    "ignoreRedirect": "忽略转向", "ignoreUntargetable": "忽略不可选中", "ignoreGuardIntercept": "忽略守护拦截",
    "incomingMiss": " incoming 落空", "nextAttack": "下次攻击", "onDealDamageBonus": "造成伤害加成",
    "onHit": "命中时", "stackCapOverride": "层数上限", "thresholdTrigger": "阈值触发",
    "suppress": "压制", "redirectRule": "转向规则", "linkedFrom": "链接自", "formGroup": "形态组",
}


def render_modifiers(m):
    """状态修正 → 紧凑中文。dict（映射表）与 list（数组）两种形态都支持。"""
    if isinstance(m, dict):
        items = list(m.items())
    elif isinstance(m, list):
        items = []
        for x in m:
            if isinstance(x, str):
                items.append((x, True))
            elif isinstance(x, dict):
                items.append((x.get("kind"), x))
    else:
        return ""
    out = []
    for k, v in items[:5]:
        kn = MODCN.get(k, k)
        if isinstance(v, bool):
            out.append(kn if v else "非" + kn)
        elif isinstance(v, (int, float)):
            out.append("%s ×%s" % (kn, v) if _is_mul(k) else "%s %s" % (kn, v))
        elif isinstance(v, dict):
            val = v.get("value")
            if val is None:
                val = v.get("ratio")
            if val is None:
                val = v.get("mul")
            s = kn
            if val is not None:
                s += " ×%s" % val if _is_mul(k) else " %s" % val
            f = v.get("filter")
            if isinstance(f, dict) and f:
                s += "（%s）" % "、".join("%s=%s" % (kk, vv) for kk, vv in list(f.items())[:2])
            out.append(s)
        elif isinstance(v, str):
            out.append("%s %s" % (kn, v))
        elif isinstance(v, list):
            out.append(kn)
        else:
            out.append(kn)
    if len(items) > 5:
        out.append("等 %d 项" % len(items))
    return "；".join(out)


def _is_mul(k):
    return any(t in k for t in ("mul", "Mul", "ratio", "Ratio", "Bonus", "bonus"))


def stat_cn(s):
    if s in STAT:
        return STAT[s]
    if s.startswith("resist:"):
        r = s.split(":", 1)[1]
        return "全抗性" if r == "*" else "%s抗" % ELEM.get(r, r)
    return s


def res_cn(r):
    return RES.get(r, r)


def dur(d):
    return "" if d is None else "%st" % d


class Renderer:
    """把 effects AST 渲染成单行中文摘要。"""

    def __init__(self, status_names):
        self.snames = status_names

    def sname(self, sid):
        if sid == "$self":
            return "自身状态"
        return self.snames.get(sid, sid)

    def cond(self, c):
        if not isinstance(c, dict):
            return "?"
        k = c.get("kind")
        side = SIDE.get(c.get("side"), c.get("side"))
        n = c.get("n")
        cmp_ = c.get("cmp") or "≥"
        i = c.get("id")
        if isinstance(i, list):
            i = "/".join(self.sname(x) for x in i)
        elif i:
            i = self.sname(i)
        p = c.get("p")
        if k == "has_status":
            return "%s有 %s%s%s" % (side or "目标", i, cmp_, n if n is not None else "")
        if k == "chance":
            return "%d%%概率" % round((p or 0) * 100)
        if k == "hp_percent":
            return "%s生命%s%d%%" % (side or "目标", cmp_, n)
        if k == "hp_percent_compare":
            return "生命百分比比较"
        if k == "target_is_summoned":
            return "目标是召唤物"
        if k == "caster_has_summon":
            return "自身有召唤物"
        if k == "target_has_tag":
            t = c.get("tag")
            return "目标带「%s」标签" % ("/".join(t) if isinstance(t, list) else t)
        if k == "target_unit_type":
            t = c.get("type")
            return "目标类型 %s" % ("/".join(t) if isinstance(t, list) else t)
        if k == "has_category":
            return "带 %s 类状态" % "/".join(c.get("categories") or [])
        if k == "stat_compare":
            return "属性比较 %s" % c.get("key", "")
        if k == "resource_compare":
            return "%s%s%s%s" % (side or "目标", c.get("key", "?"), cmp_, n if n is not None else "")
        if k == "element_is":
            return "元素为 %s" % ELEM.get(c.get("element"), c.get("element"))
        if k == "field_status_count":
            return "场上状态计数%s%s" % (cmp_, n if n is not None else "")
        if k == "any_of":
            return "满足任一"
        if k == "variant_is":
            return "变体为 %s" % c.get("value")
        if k == "target_dead":
            return "目标已死亡"
        if k == "zone_active":
            return "区域生效中"
        if k == "unit_faction":
            return "阵营为 %s" % c.get("faction")
        if k == "remove_reason":
            return "移除原因 %s" % (c.get("reason") or "")
        return str(k)

    def node(self, e):
        if not isinstance(e, dict):
            return "?"
        if e.get("type") is None:
            op = e.get("op")
            if op == "sequence":
                return " → ".join(self.node(x) for x in e.get("steps") or [])
            if op == "repeat":
                c = e.get("count")
                c = c if isinstance(c, (int, float, str)) else "按状态"
                return "重复%s次（%s）" % (c, " → ".join(self.node(x) for x in e.get("steps") or []))
            if op == "if":
                s = "若[%s]则（%s）" % (self.cond(e.get("condition")),
                                   " → ".join(self.node(x) for x in e.get("then") or []))
                if e.get("else"):
                    s += "否则（%s）" % " → ".join(self.node(x) for x in e["else"])
                return s
            return str(op)
        t = e["type"]
        v = e.get("value")
        tg = TGT.get(e.get("target"), e.get("target")) if e.get("target") else None
        suf = "→%s" % tg if tg and e.get("target") != "target" else ""

        if t == "damage":
            s = "伤害 %s" % v
            el = ELEM.get(e.get("element"), e.get("element"))
            if el and el != "无属性":
                s += "（%s）" % el
            if e.get("mul"):
                s += "×%s" % e["mul"]
            if e.get("spread") == "splash_adjacent":
                s += "（溅射相邻）"
            if e.get("lethal"):
                s += "（可致死）"
        elif t == "heal":
            s = "治疗 %s" % v
            if e.get("mode") in ("setHp", "hpMaxRatio", "to_ratio"):
                s = "生命%s%s" % (MODE.get(e["mode"], ""), v)
        elif t == "mount_status":
            s = "挂载 %s" % self.sname(e.get("statusId"))
            d = dur(e.get("duration"))
            if d:
                s += "（%s）" % d
            if e.get("stacks") is not None:
                sm = e.get("stackMode")
                st = e["stacks"]
                if sm == "consume":
                    s += " 消耗%s层" % (abs(st) if isinstance(st, (int, float)) else st)
                elif sm == "add":
                    s += " 叠加%s层" % st
                elif sm == "override":
                    s += " 层数设为%s" % st
                else:
                    s += " 层数%s" % st
            if e.get("charges") is not None:
                s += " 次数%s" % e["charges"]
        elif t == "modify_stat":
            m = MODE.get(e.get("mode"), "")
            s = "%s %s%s" % (stat_cn(e.get("stat")), m, v)
            d = dur(e.get("duration"))
            if d:
                s += "（%s）" % d
        elif t == "modify_resource":
            m = MODE.get(e.get("mode"), "+")
            if e.get("mode") == "swap":
                s = "交换%s" % res_cn(e.get("resource"))
            else:
                s = "%s %s%s" % (res_cn(e.get("resource")), m, v)
            if e.get("duration"):
                s += "（%st）" % e["duration"]
        elif t == "move":
            s = "位移·%s" % e.get("op")
            if e.get("distance") is not None:
                s += " %s" % e["distance"]
        elif t == "spawn":
            u = e.get("unitId") or e.get("unit") or e.get("template") or e.get("def") or "单位"
            s = "召唤 %s" % u
            if e.get("reviveOf"):
                s = "复活 %s" % {"self": "自身", "status_holder": "状态持有者",
                                 "last_dead_ally": "最后阵亡友军"}.get(e["reviveOf"], e["reviveOf"])
            if e.get("count"):
                s += " ×%s" % e["count"]
            if isinstance(e.get("hpRatio"), (int, float)):
                s += "（生命%d%%）" % round(e["hpRatio"] * 100)
        elif t == "dispel":
            s = "驱散"
            if e.get("filter", {}).get("category"):
                s += " %s" % "/".join(e["filter"]["category"])
            if e.get("count"):
                s += " ×%s" % e["count"]
            if e.get("dispelTarget") == "domain":
                s += "（界域）"
        elif t == "drain":
            s = "吸取%s %s" % (res_cn(e.get("resource")), v)
            if e.get("healRatio"):
                s += "（回复%d%%）" % round(e["healRatio"] * 100)
        elif t == "domain":
            s = "展开界域 %s" % e.get("def")
            if e.get("duration"):
                s += "（%s%s）" % (e["duration"], "回合" if e.get("durationUnit") == "turn" else "tick")
        elif t == "modify_damage":
            s = "%s伤害 ×%s" % ("受到" if e.get("scope") == "taken" else "造成", e.get("mul"))
        elif t == "transfer_status":
            s = "转移状态 %s" % (e.get("mode") or "")
        elif t == "target_override":
            s = "改写目标 %s" % (e.get("anchor") or e.get("sort") or "")
        elif t == "echo_last_skill":
            s = "重放上次技能（%s）" % e.get("potency")
        elif t == "snapshot":
            s = "快照 %s" % "/".join(e.get("fields") or [])
        elif t == "restore_snapshot":
            s = "恢复快照"
        elif t == "gauge_shuffle":
            s = "重排行动条"
        elif t == "status_shuffle":
            s = "重排状态"
        else:
            s = str(t)
        if e.get("condition"):
            s += "（当%s）" % self.cond(e["condition"])
        return s + (" " + suf if suf else "")

    def render(self, effs):
        return " → ".join(self.node(e) for e in effs or [])


def main():
    files = sorted(glob.glob(os.path.join(JSON_DIR, "*.skills.json")))
    docs = [json.load(io.open(f, encoding="utf-8")) for f in files]

    # 全局状态 id → 中文名：权威源为 *.statuses.json（含 common）
    snames = {}
    for f in sorted(glob.glob(os.path.join(JSON_DIR, "*.statuses.json"))):
        d = json.load(io.open(f, encoding="utf-8"))
        for sd in d.get("statusDefs") or []:
            snames.setdefault(sd["id"], sd.get("name"))
    for d in docs:
        for c in d["cards"]:
            for sd in c.get("statusDefs") or []:
                snames.setdefault(sd["id"], sd["name"])
    R = Renderer(snames)

    total_cards = sum(len(d["cards"]) for d in docs)
    n_tentative = sum(1 for d in docs for c in d["cards"] if c.get("tentative"))

    L = []
    w = L.append
    w("# 技能池全库总览")
    w("")
    w("> 由 `docs/tools/build_overview.py` 从 `docs/json/*.skills.json` 自动生成——**数据变了就重跑脚本，不要手改本文件**。")
    w("> 生成范围：%d 条途径 / %d 张卡。内容为设计稿现状，**全部数值处于 `tentative` 待拍板状态**。" % (len(docs), total_cards))
    w("")

    # ---- 图例 ----
    w("## 图例与判据")
    w("")
    w("**支持进度**（这张卡的机制在 DDD 对战内核里的落地情况，取自 `frameworkFlags`）：")
    w("")
    w("| 标记 | 含义 |")
    w("|---|---|")
    w("| ✅ 已支持 | 无 `frameworkFlags`，用到的机制都在内核封闭集内 |")
    w("| ⚠️ 缺口 N | 登记了 N 项 `frameworkFlags` 且 `landed: false`，即用到内核尚未支持的机制 |")
    w("| ✅ 已落地 | 该卡曾登记缺口但已置 `landed: true`——机制已落入 DDD 内核（不再计入未落地缺口） |")
    w("")
    w("**拍板项**（数值/口径是否还需要裁定）：")
    w("")
    w("| 标记 | 含义 |")
    w("|---|---|")
    w("| 待拍板 | `tentative: true`——当前 %d/%d 张为 true，即全库数值尚未拍板，这是基线状态而非个别问题 |" % (n_tentative, total_cards))
    w("| 存疑 | 有 `conversionNotes`——md 转 JSON 时口径存疑或做了语义迁移，需人工确认 |")
    w("")
    w("**其他字段**：`设定` = 原著出处（lore）；`风味` = 第二人称描述文本（flavor）；")
    w("`机制` = 由 effects AST 渲染的中文摘要（省略了 note 与次要参数，完整结构查 JSON）。")
    w("")

    # ---- 汇总表 ----
    w("## 途径汇总")
    w("")
    w("| 途径 | ID | 卡数 | 主动/被动 | ⚠️缺口卡 | 存疑卡 | 旗舰 | 构筑轴 |")
    w("|---|---|---:|---:|---:|---:|---:|---|")
    tot = dict(cards=0, act=0, pas=0, flag=0, note=0, fs=0)
    for d in docs:
        cs = d["cards"]
        nf = sum(1 for c in cs if any(not f.get("landed") for f in (c.get("frameworkFlags") or [])))
        nn = sum(1 for c in cs if c.get("conversionNotes"))
        nact = sum(1 for c in cs if c["kind"] == "active")
        nfs = sum(1 for c in cs if c.get("flagship"))
        tot["cards"] += len(cs); tot["act"] += nact; tot["pas"] += len(cs) - nact
        tot["flag"] += nf; tot["note"] += nn; tot["fs"] += nfs
        axes = " / ".join("%s%s" % (a["symbol"], a["name"]) for a in d["axes"].values())
        w("| **%s** | `%s` | %d | %d/%d | %d | %d | %d | %s |"
          % (d["pathwayName"], d["pathwayId"], len(cs), nact, len(cs) - nact, nf, nn, nfs, axes))
    w("| **合计** | | **%d** | **%d/%d** | **%d** | **%d** | **%d** | |"
      % (tot["cards"], tot["act"], tot["pas"], tot["flag"], tot["note"], tot["fs"]))
    w("")

    # ---- 分章 ----
    for i, d in enumerate(docs, 1):
        cs = d["cards"]
        axes = " / ".join("%s %s" % (a["symbol"], a["name"]) for a in d["axes"].values())
        nf = sum(1 for c in cs if any(not f.get("landed") for f in (c.get("frameworkFlags") or [])))
        nn = sum(1 for c in cs if c.get("conversionNotes"))
        w("---")
        w("")
        w("## %d. %s（%s）" % (i, d["pathwayName"], d["pathwayId"]))
        w("")
        w("**%d 张卡** · 主动 %d / 被动 %d · ⚠️待落地缺口 %d 张 · 口径存疑 %d 张" %
          (len(cs), sum(1 for c in cs if c["kind"] == "active"),
           sum(1 for c in cs if c["kind"] == "passive"), nf, nn))
        w("")
        w("构筑轴：%s" % axes)
        w("")
        w("源：`%s`" % d["sourceFile"])
        w("")

        # 按序列分组
        seqs = {}
        for c in cs:
            seqs.setdefault(c["sequence"], []).append(c)
        for seq in sorted(seqs, reverse=True):
            group = seqs[seq]
            names = sorted({c.get("sequenceName", "") for c in group})
            w("### 序列 %d　%s" % (seq, "／".join(names)))
            w("")
            for c in sorted(group, key=lambda x: (not x.get("flagship"), x["id"])):
                tags = []
                tags.append(RARITY.get(c["rarity"], c["rarity"]))
                tags.append(c["kind"] == "active" and "主动" or "被动")
                if c.get("flagship"):
                    tags.append("旗舰")
                a = d["axes"].get(c.get("axis"), {})
                if a:
                    tags.append("%s%s" % (a.get("symbol", ""), a.get("name", c["axis"])))
                w("#### %s　`%s`" % (c["name"], c["id"]))
                w("")
                w("- **类型**：%s" % " / ".join(tags))
                if c["kind"] == "active" and c.get("cost"):
                    ct = c["cost"]
                    cast = "无吟唱" if ct.get("castTime") is None else ("瞬发" if ct.get("castTime") == 0 else "吟唱 %s" % ct["castTime"])
                    w("- **消耗**：能量 %s · 冷却 %s · %s · 距离 %s" %
                      (ct.get("energy"), ct.get("cooldown"), cast,
                       {"none": "无", "melee": "近战", "ranged": "远程"}.get(c.get("reach"), c.get("reach"))))
                else:
                    w("- **触发**：`%s`" % c.get("hook"))
                w("- **效果**：%s" % c.get("describe", ""))
                w("- **机制**：`%s`" % R.render(c.get("effects")))
                if c.get("statusDefs"):
                    w("- **引入状态**：")
                    for sd in c["statusDefs"]:
                        head = "%s（%s%s）" % (sd["name"], "/".join(sd.get("category") or []),
                                             "，%s" % dur(sd.get("duration")) if sd.get("duration") else "")
                        parts = []
                        mods = render_modifiers(sd.get("modifiers"))
                        if mods:
                            parts.append(mods)
                        eff = R.render(sd.get("effects"))
                        if eff:
                            parts.append("效果：%s" % eff)
                        for t in sd.get("triggers") or []:
                            te = R.render(t.get("effects"))
                            parts.append("%s：%s" % (EVENT.get(t.get("event"), t.get("event")), te or "—"))
                        w("  - %s%s" % (head, ("：%s" % "；".join(parts)) if parts else ""))
                if c.get("domainDef"):
                    dd = c["domainDef"]
                    w("- **界域**：%s（%s，%s%s）" % (dd.get("id"), dd.get("tier"),
                                                dd.get("duration"), "回合" if dd.get("durationUnit") == "turn" else "tick"))
                if c.get("unitDefs"):
                    w("- **引入单位**：%s" % "；".join("%s（%s）" % (u.get("name"), u.get("id")) for u in c["unitDefs"]))
                if c.get("zoneDef") and isinstance(c["zoneDef"], dict):
                    w("- **区域**：%s（%s）" % (c["zoneDef"].get("id"), c["zoneDef"].get("kind")))
                if c.get("tags"):
                    w("- **标签**：%s" % " / ".join(c["tags"]))
                if c.get("gender") and c["gender"] != "any":
                    w("- **性别限制**：%s" % c["gender"])
                if c.get("sharedAcross"):
                    w("- **跨途径共享**：%s" % " / ".join(c["sharedAcross"]))

                # 进度与拍板（按 landed 区分：只有未落地的才算缺口）
                fl = c.get("frameworkFlags") or []
                unlanded = [f for f in fl if not f.get("landed")]
                landed = [f for f in fl if f.get("landed")]
                if unlanded:
                    items = "；".join("`%s` %s" % (f["code"], f["note"]) for f in unlanded)
                    w("- **⚠️ 支持进度**：%d 项缺口未落地 —— %s" % (len(unlanded), items))
                elif landed:
                    items = "；".join("`%s` %s" % (f["code"], f["note"]) for f in landed)
                    w("- **✅ 支持进度**：%d 项历史缺口已落入 DDD 内核 —— %s" % (len(landed), items))
                else:
                    w("- **✅ 支持进度**：机制均在内核封闭集内，无登记缺口")
                cn = c.get("conversionNotes")
                marks = []
                if c.get("tentative"):
                    marks.append("**待拍板**（数值）")
                if cn:
                    txt = cn if isinstance(cn, str) else "；".join(cn)
                    marks.append("**存疑**：%s" % txt)
                w("- **拍板项**：%s" % (" / ".join(marks) if marks else "无"))

                w("- **设定**：%s" % c.get("lore", ""))
                w("- **风味**：%s" % c.get("flavor", ""))
                w("")

    io.open(OUT, "w", encoding="utf-8", newline="\n").write("\n".join(L))
    print("已生成 %s（%d 字符，%d 行）" % (OUT, len("\n".join(L)), len(L)))


if __name__ == "__main__":
    main()
