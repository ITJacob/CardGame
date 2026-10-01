# -*- coding: utf-8 -*-
"""
编目三件套分析报告生成器：召唤物 / 区域 / 界域。

口径与网页端统计分析页（site/js/views/entities.js）一致：
  - 编目层 = 各途径 *.skills.json 顶层三池（unitDefs / zoneDefs / domainDefs，
    Def 编目独立化批 2026-10-01 落地）；
  - 卡面用法 = 全库卡递归遍历（spawn / domain 原语、target.request 选靶约束、
    filter.unitType 乘区、target_unit_type / target_is_summoned 谓词、
    卡级 zone / domain 字段）；
  - 状态定义（*.statuses.json）不在本报告口径，见状态定义面（build 未单列，
    网页端统计）。

产物：docs/analysis/ENTITIES_ANALYSIS.md
复用：python docs/tools/build_entity_analysis.py
"""
import json, glob, os, collections, datetime

JSON_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "json")
MANIFEST = os.path.join(JSON_DIR, "manifest.json")

PRIMITIVE_TYPES = {
    "damage", "heal", "mount_status", "modify_stat", "modify_resource", "move",
    "spawn", "dispel", "drain", "domain", "translocate", "modify_damage",
    "target_override", "transfer_status", "write_rule_slot", "modify_rule_slot",
    "snapshot", "restore_snapshot", "echo_last_skill", "gauge_shuffle",
    "status_shuffle", "modify_skill", "modify_status", "modify_targetability",
    "reveal", "grant_immunity", "take_control",
    "set_luminance", "advance_clock",   # 光照度对（2026-09-21 落地，schema 声明 29）
}
DYNAMIC_TEMPLATES = {"killed_unit", "primary_target", "holder"}


def load_order_name():
    order, pname = [], {}
    if os.path.exists(MANIFEST):
        m = json.load(open(MANIFEST, encoding="utf-8"))
        for p in m.get("pathways", []):
            order.append(p["id"])
            pname[p["id"]] = p.get("name", p["id"])
    return order, pname


def walk(node, cb):
    """递归访问全部节点；cb 命中效果原语节点与算子节点（与网页端 walkCardEffects
    同口径：算子 = 带 op 且包 steps/then/else 的节点——if 的条件谓词挂在算子上）。"""
    if isinstance(node, dict):
        if isinstance(node.get("type"), str) and node["type"] in PRIMITIVE_TYPES:
            cb(node)
        elif isinstance(node.get("op"), str) and (node.get("steps") or node.get("then") or node.get("else")):
            cb(node)
        for v in node.values():
            walk(v, cb)
    elif isinstance(node, list):
        for v in node:
            walk(v, cb)


def spawn_kind(n):
    if n.get("reviveOf"):
        return "复活（不产生新单位）"
    if n.get("unitId"):
        return "具名单位引用"
    if n.get("template"):
        return "动态模板" if n["template"] in DYNAMIC_TEMPLATES else "固定蓝本模板"
    if n.get("zone") or n.get("def"):
        return "区域蓝本引用"
    return "其他"


def pct(a, b):
    return "%.1f%%" % (100.0 * a / b) if b else "—"


def as_list(v):
    """标量归一成单元素列表（数组原样返回）——JS 侧 [].concat 的对应物。"""
    return v if isinstance(v, list) else [v]


def main():
    files = sorted(glob.glob(os.path.join(JSON_DIR, "*.skills.json")))
    order, pname = load_order_name()

    units, zones, domains = [], [], []
    cards = []
    for f in files:
        d = json.load(open(f, encoding="utf-8"))
        pid = d["pathwayId"]
        for u in d.get("unitDefs", []):
            units.append((pid, u))
        for z in d.get("zoneDefs", []):
            zones.append((pid, z))
        for x in d.get("domainDefs", []):
            domains.append((pid, x))
        cards.extend((pid, c) for c in d.get("cards", []))

    pool_unit_ids = {u["id"] for _, u in units}
    pool_zone_ids = {z["id"] for _, z in zones}
    pool_domain_ids = {x["id"] for _, x in domains}

    # ---- 卡面遍历：spawn 引用 / 承载分道 / domain 原语 / zone·domain 卡级字段 ----
    spawn_kind_cnt = collections.Counter()
    spawn_kind_by_p = collections.defaultdict(collections.Counter)
    named_refs = collections.Counter()
    named_refs_by_p = collections.defaultdict(collections.Counter)
    outside_refs = collections.Counter()
    counter = collections.Counter()          # unitType → 次数（三承载合并）
    counter_by_p = collections.defaultdict(collections.Counter)
    hits = {"filter": 0, "req": 0, "cond": 0, "summoned": 0}
    dom_op = collections.Counter()
    dom_op_by_p = collections.defaultdict(collections.Counter)
    dom_field_by_p = collections.Counter()
    n_dom_field = n_dom_field_ref = 0
    zone_field = 0
    zone_spawn = collections.Counter()

    for pid, c in cards:
        def on_node(n):
            if n.get("type") == "spawn":
                k = spawn_kind(n)
                spawn_kind_cnt[k] += 1
                spawn_kind_by_p[pid][k] += 1
                uid = n.get("unitId")
                if uid:
                    named_refs[uid] += 1
                    named_refs_by_p[pid][uid] += 1
                    if uid not in pool_unit_ids:
                        outside_refs[uid] += 1
            for t in (as_list(n["filter"]["unitType"])
                      if isinstance(n.get("filter"), dict) and n["filter"].get("unitType")
                      else []):
                hits["filter"] += 1
                counter[t] += 1
                counter_by_p[pid][t] += 1
            cond = n.get("condition")
            if isinstance(cond, dict) and cond.get("kind") == "target_unit_type":
                ts = as_list(cond.get("unitType") or cond.get("unitTypes")
                             or cond.get("type") or cond.get("value") or [])
                if ts:
                    hits["cond"] += 1
                for t in ts:
                    counter[t] += 1
                    counter_by_p[pid][t] += 1
            if isinstance(cond, dict) and cond.get("kind") == "target_is_summoned":
                hits["summoned"] += 1
            if n.get("type") == "domain":
                op = n.get("op", "?")
                dom_op[op] += 1
                dom_op_by_p[pid][op] += 1
        walk(c, on_node)

        req_types = []
        t = c.get("target") or {}
        if isinstance(t.get("request"), dict) and t["request"].get("filter", {}).get("unitType"):
            req_types += as_list(t["request"]["filter"]["unitType"])
        for st in c.get("secondaryTargets") or []:
            if isinstance(st.get("request"), dict) and st["request"].get("filter", {}).get("unitType"):
                req_types += as_list(st["request"]["filter"]["unitType"])
        if req_types:
            hits["req"] += 1
        for t2 in req_types:
            counter[t2] += 1
            counter_by_p[pid][t2] += 1

        if c.get("domain"):
            n_dom_field += 1
            dom_field_by_p[pid] += 1
            if c["domain"].get("def") in pool_domain_ids:
                n_dom_field_ref += 1
        if c.get("zone"):
            zone_field += 1

    # spawn 的 zone / def 键（区域蓝本出场）单独数——walk 内已判类型，这里用一次
    # 轻量递归复扫（只数 spawn 两类键，代价可忽略）
    def scan_zone_spawn(n, pid):
        if isinstance(n, dict):
            if n.get("type") == "spawn":
                zid = n.get("zone") or (n.get("def") if n.get("def") in pool_zone_ids else None)
                if zid:
                    zone_spawn[zid] += 1
            for v in n.values():
                scan_zone_spawn(v, pid)
        elif isinstance(n, list):
            for v in n:
                scan_zone_spawn(v, pid)

    for pid, c in cards:
        scan_zone_spawn(c, pid)

    today = datetime.date.today().isoformat()
    L = []
    L.append("# 编目三件套分析报告（召唤物 / 区域 / 界域）\n")
    L.append("> 数据来源：`docs/json/*.skills.json` 顶层三池（unitDefs / zoneDefs / domainDefs）"
             " + 全库卡面递归遍历，由 `docs/tools/build_entity_analysis.py` 生成。")
    L.append("> 口径与网页端统计分析页的「召唤物 / 区域 / 界域」三个子页一致；"
             "状态定义（*.statuses.json）不在本报告口径。")
    L.append("> 生成日期：%s\n" % today)

    # ================= 一、召唤物 =================
    L.append("## 一、召唤物（unitDefs 池 + 卡面 spawn 引用）\n")
    L.append("池内蓝本 **%d** 条（覆盖 %d 途径）；卡面具名单位引用 **%d** 种，"
             "其中池外引用（卡面内联、无 unitDef）**%d** 种 / %d 次——池只收编「同途径多卡"
             "共享」的蓝本，单卡单位属性内联在 spawn 段（hpRatio / atkRatio × H1 基线），"
             "**池外引用是常态而非缺漏**。具名单位全集（36）与基线档见 ddd《召唤物参数》。\n" % (
                 len(units), len({p for p, _ in units}), len(named_refs),
                 len(outside_refs), sum(outside_refs.values())))

    L.append("### 1.1 池内蓝本清单\n")
    L.append("| 单位 | 名称 | unitType | 途径 | 特征 |")
    L.append("|---|---|---|---|---|")
    for pid, u in units:
        feats = []
        if u.get("triggers"):
            feats.append("触发载荷")
        if u.get("tags"):
            feats.append("tags")
        if u.get("element"):
            feats.append("元素")
        if (u.get("base") or {}).get("reach"):
            feats.append("reach " + u["base"]["reach"])
        ratio = u.get("hpRatio", (u.get("base") or {}).get("hpRatio"))
        if ratio is not None:
            feats.append("hpRatio %s" % ratio)
        if not feats:
            feats.append("白板")
        L.append("| `%s` | %s | %s | %s | %s |" % (
            u.get("id", "?"), u.get("name", "—"), u.get("unitType", "—（未登记）"),
            pname.get(pid, pid), "、".join(feats)))
    L.append("")
    n_typed = sum(1 for _, u in units if u.get("unitType"))
    L.append("> unitType 登记率：**%d/%d**——未登记单位的种类归属见《召唤物参数》§一归属表。\n" % (
        n_typed, len(units)))

    L.append("### 1.2 spawn 引用形态（卡面，按节点计）\n")
    L.append("| 形态 | 次数 |")
    L.append("|---|---:|")
    for k, v in spawn_kind_cnt.most_common():
        L.append("| %s | %d |" % (k, v))
    L.append("")

    L.append("### 1.3 具名单位引用清单（spawn unitId 去重）\n")
    L.append("| 单位 | 引用次数 | 首引途径 | 池内 |")
    L.append("|---|---:|---|---|")
    first_p = {}
    for pid, cnt in named_refs_by_p.items():
        for uid, _ in cnt.items():
            first_p.setdefault(uid, pid)
    for uid, v in named_refs.most_common():
        L.append("| `%s` | %d | %s | %s |" % (
            uid, v, pname.get(first_p.get(uid, ""), first_p.get(uid, "—")),
            "✓" if uid in pool_unit_ids else "池外（卡面内联）"))
    L.append("")

    L.append("### 1.4 按 unitType 分道的承载（卡面）\n")
    L.append("三路承载合并：效果节点 filter.unitType 乘区 **%d** 处（登记口径，当前数据零使用——"
             "晨曦领域的类型约束写在域 envRulesText 文本里，结构不可统计）、target.request 选靶"
             "约束 **%d** 张卡、target_unit_type 条件谓词 **%d** 处；另有 target_is_summoned "
             "笼统召唤物谓词 **%d** 处（此表按类型拆，不含它）。filter 不区分敌我"
             "（克制 / 加益只由效果方向决定）。\n" % (hits["filter"], hits["req"], hits["cond"], hits["summoned"]))
    L.append("| unitType | 次数 |")
    L.append("|---|---:|")
    for k, v in counter.most_common():
        L.append("| `%s` | %d |" % (k, v))
    L.append("")

    # ================= 二、区域 =================
    L.append("## 二、区域（zoneDefs 池 + 卡面 zone 用法）\n")
    L.append("池内蓝本 **%d** 条（覆盖 %d 途径）；卡级 zone 字段（注册）**%d** 张；"
             "spawn 召唤区域 **%d** 次 / %d 种。Zone 是纯坐标效果、不占格，"
             "与召唤物的判别权威在 ddd《战场参数》§一；与 statusDef 同族但**不是** "
             "statusDef（驱散不作用于 zone 标量）。\n" % (
                 len(zones), len({p for p, _ in zones}), zone_field,
                 sum(zone_spawn.values()), len(zone_spawn)))

    L.append("### 2.1 池内蓝本清单\n")
    L.append("| 区域 | kind | 作用方 | 触发 | duration | 途径 |")
    L.append("|---|---|---|---|---|---|")
    for pid, z in zones:
        L.append("| `%s` | `%s` | `%s` | `%s` | %s | %s |" % (
            z.get("id", "?"), z.get("kind", "—"), z.get("affects", "—"),
            z.get("trigger", "—"), z.get("duration", "—"), pname.get(pid, pid)))
    L.append("")

    zkind = collections.Counter(z.get("kind") for _, z in zones)
    zaffects = collections.Counter(z.get("affects") for _, z in zones)
    ztrigger = collections.Counter(z.get("trigger") for _, z in zones)
    zunit = collections.Counter(z.get("durationUnit", "tick（缺省）")
                                for _, z in zones if z.get("duration") is not None)
    L.append("### 2.2 结构维度分布\n")
    L.append("| 维度 | 取值 | 次数 |")
    L.append("|---|---|---:|")
    for k, v in zkind.most_common():
        L.append("| kind | `%s` | %d |" % (k, v))
    for k, v in zaffects.most_common():
        L.append("| affects | `%s` | %d |" % (k, v))
    for k, v in ztrigger.most_common():
        L.append("| trigger | `%s` | %d |" % (k, v))
    for k, v in zunit.most_common():
        L.append("| durationUnit | `%s` | %d |" % (k, v))
    L.append("")

    zprim = collections.Counter()
    for _, z in zones:
        walk(z, lambda n: zprim.update([n.get("type")]) if n.get("type") in PRIMITIVE_TYPES else None)
    L.append("### 2.3 区域载荷原语（zoneDefs 内效果节点）\n")
    L.append("| 原语 | 次数 |")
    L.append("|---|---:|")
    for k, v in zprim.most_common():
        L.append("| `%s` | %d |" % (k, v))
    L.append("")

    # ================= 三、界域 =================
    L.append("## 三、界域（domainDefs 池 + 卡面 domain 用法）\n")
    L.append("池内蓝本 **%d** 条（覆盖 %d 途径）；卡面 domain 原语 **%d** 次；"
             "卡级 domain 字段 **%d** 张（引用池 def **%d** 张——卡级字段是「引用 + 展示副本」，"
             "权威定义在池）。界域 = 战场级规则改写包（声明式补丁 + 战场级触发器），"
             "三件套压制栈（base / hero / overlay）见 ddd 共享内核。\n" % (
                 len(domains), len({p for p, _ in domains}), sum(dom_op.values()),
                 n_dom_field, n_dom_field_ref))

    L.append("### 3.1 池内蓝本清单\n")
    L.append("| 界域 | tier | duration | durationUnit | 可驱散 | rulePatches | 域内触发器 | 途径 |")
    L.append("|---|---|---|---|---|---:|---:|---|")
    for pid, x in domains:
        L.append("| `%s` | `%s` | %s | %s | %s | %d | %d | %s |" % (
            x.get("id", "?"), x.get("tier", "—"), x.get("duration", "—"),
            x.get("durationUnit", "—"), "否" if x.get("dispelable") is False else "是",
            len(x.get("rulePatches") or []), len(x.get("triggers") or []),
            pname.get(pid, pid)))
    L.append("")

    dtier = collections.Counter(x.get("tier") for _, x in domains)
    dunit = collections.Counter(x.get("durationUnit", "tick（缺省）")
                                for _, x in domains if x.get("duration") is not None)
    ddispel = collections.Counter("不可驱散" if x.get("dispelable") is False else "可驱散"
                                  for _, x in domains)
    drpk = collections.Counter(rp.get("kind", "?")
                               for _, x in domains for rp in (x.get("rulePatches") or []))
    dtrig = collections.Counter(t.get("event", "?")
                                for _, x in domains for t in (x.get("triggers") or []))
    dprim = collections.Counter()
    for _, x in domains:
        walk(x, lambda n: dprim.update([n.get("type")]) if n.get("type") in PRIMITIVE_TYPES else None)

    L.append("### 3.2 结构维度分布\n")
    L.append("| 维度 | 取值 | 次数 |")
    L.append("|---|---|---:|")
    for k, v in dtier.most_common():
        L.append("| tier | `%s` | %d |" % (k, v))
    for k, v in ddispel.most_common():
        L.append("| dispelable | %s | %d |" % (k, v))
    for k, v in dunit.most_common():
        L.append("| durationUnit | `%s` | %d |" % (k, v))
    L.append("")

    L.append("### 3.3 rulePatches 规则补丁 kind 分布\n")
    L.append("| kind | 条数 |")
    L.append("|---|---:|")
    for k, v in drpk.most_common():
        L.append("| `%s` | %d |" % (k, v))
    L.append("")

    L.append("### 3.4 域内触发点与载荷原语\n")
    L.append("| 触发点 | 条数 |")
    L.append("|---|---:|")
    for k, v in dtrig.most_common():
        L.append("| `%s` | %d |" % (k, v))
    if not dtrig:
        L.append("| （无） | 0 |")
    L.append("")
    L.append("| 载荷原语 | 次数 |")
    L.append("|---|---:|")
    for k, v in dprim.most_common():
        L.append("| `%s` | %d |" % (k, v))
    L.append("")

    L.append("### 3.5 卡面 domain 原语 op 分布\n")
    L.append("| op | 次数 |")
    L.append("|---|---:|")
    for k, v in dom_op.most_common():
        L.append("| `%s` | %d |" % (k, v))
    L.append("")

    L.append("### 附：统计口径\n")
    L.append("- 编目层：`*.skills.json` 顶层 `unitDefs` / `zoneDefs` / `domainDefs` 三池。")
    L.append("- 卡面层：递归遍历全部卡的效果节点（含任意嵌套），计数规则与网页端 "
             "`walkCardEffects` 一致。")
    L.append("- 跨途径复用：具名单位以**全球池**判定池内/池外（unit_beast 定义在药师、"
             "可被多途径引用）。")
    L.append("- 生成脚本：`docs/tools/build_entity_analysis.py`（可重复运行，只读 JSON）。")

    out = "\n".join(L)
    out_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                            "analysis", "ENTITIES_ANALYSIS.md")
    with open(out_path, "w", encoding="utf-8") as fh:
        fh.write(out)

    print("=== VALIDATION ===")
    print("pools: units=%d zones=%d domains=%d" % (len(units), len(zones), len(domains)))
    print("spawn kinds:", dict(spawn_kind_cnt))
    print("named refs:", len(named_refs), "outside pool:", len(outside_refs))
    print("counter:", dict(counter), "filter/req/cond/summoned:",
          hits["filter"], hits["req"], hits["cond"], hits["summoned"])
    print("domain ops:", dict(dom_op), "field cards:", n_dom_field, "ref in pool:", n_dom_field_ref)
    print("zone spawn:", dict(zone_spawn))
    print("wrote:", out_path)


if __name__ == "__main__":
    main()
