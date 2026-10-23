# -*- coding: utf-8 -*-
"""玩法蓝图机器预填（批 D1）。用法:
    python docs/tools/prefill_blueprint.py <pid>           # dry-run：打印推断摘要，不写文件
    python docs/tools/prefill_blueprint.py <pid> --write   # 写入 docs/meta/rounds/<pid>.md

预填原则（WORKFLOW.md「全库回溯计划」）：
- 锚点 / 产出消费 / 跨轴钩子 / 跨系钩子 / 签名键承诺 / 角色配比 / 风格边界
  从 skills.json + score.py 内部数据反填，reason 逐条记录供人工复核；
- 命题与玩家决策点 机器只留占位「（待主人拍）」——必须人写（blueprint_score 视占位为空，占位白拿不到分）；
- trap 机器候选仅按「身份动作 + 风险段」形状推断，风险段语义须人工核对；
- 幂等保护：rounds 文件已有「## 玩法蓝图」章 → 报错拒绝，不覆盖人写内容；
- 只写 docs/meta/rounds/*.md；skills.json 只读（role 回填由人工在逐卡审稿时做）。
"""
import datetime
import io
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
DOCS = os.path.dirname(HERE)
sys.path.insert(0, HERE)
import score  # noqa: E402
import blueprint_score as bps  # noqa: E402

ROUNDS_DIR = os.path.join(DOCS, "meta", "rounds")

PLACEHOLDER = "（待主人拍）"
CLEAR_TODO = "（清除路径待人写）"
USE_TODO = "（用途待人写）"

# 全局通用机制推断：卡面特征 -> GLOBAL_MECHANISMS 词（风格边界表预填用，最多取 4 个）
MECH_HINTS = [
    ("召唤", lambda types, c: "spawn" in types),
    ("治疗", lambda types, c: "heal" in types),
    ("驱散", lambda types, c: "dispel" in types),
    ("位移", lambda types, c: types & {"move", "translocate"}),
    ("基础增益", lambda types, c: "modify_stat" in types),
    ("资源", lambda types, c: "modify_resource" in types),
    ("装备", lambda types, c: c.get("kind") == "weapon" or "modify_weapon" in types),
    ("界域", lambda types, c: "domain" in types),
    ("相位", lambda types, c: types & {"advance_clock", "set_luminance"} or c.get("phaseHooks")),
    ("吟唱", lambda types, c: c.get("castTime")),
]

TECH_PRIMS = {"dispel", "take_control", "target_override"}
GENERIC_PRIMS = {"damage", "mount_status", "modify_stat"}


def load_context():
    pathways = score.load_skills()
    score.load_weapon_index(pathways)
    status_by_id, status_owner = {}, {}
    for pid, _label, sd in score.iter_status_defs():
        status_by_id[sd["id"]] = sd
        status_owner[sd["id"]] = pid
    def_index = {}
    for d in pathways.values():
        for z in d.get("zoneDefs") or []:
            def_index[z["id"]] = z
        for m in d.get("domainDefs") or []:
            def_index[m["id"]] = m
    manifest = json.load(io.open(os.path.join(score.JSON_DIR, "manifest.json"), encoding="utf-8"))
    pw_names = {p["id"]: p.get("name", p["id"]) for p in manifest.get("pathways", [])}
    identity_dims = bps.load_identity_dims()
    # 签名键判读上下文与 score.py L1436-1443 全参数口径对齐（含 flag 读侧状态索引，
    # 否则 flag:cast_time_set / flag:statPerStack 经状态 def 的载体会漏判）
    all_unit_types = score.load_unit_types(pathways)
    lineage_ids = {sid for sid, sd in status_by_id.items() if "lineageStack" in sd}
    casttime_ids = {sid for sid, sd in status_by_id.items()
                    if any(bm.get("op") == "cast_time_set" for bm in (sd.get("behaviorModifiers") or [])
                           if isinstance(bm, dict))}
    grow_ids = {sid for sid, sd in status_by_id.items() if sd.get("statPerStack")}
    sig_ctx = (all_unit_types, lineage_ids, {"cast_time_set": casttime_ids, "statPerStack": grow_ids})
    return pathways, status_by_id, status_owner, def_index, pw_names, identity_dims, sig_ctx


def axis_anchor(ax):
    a = ax.get("anchor")
    if isinstance(a, dict) and a.get("kind"):
        return a.get("kind"), a.get("id")
    if ax.get("statusId"):
        return "status", ax.get("statusId")
    return None, None


def axis_private_statuses(pid, d, common_ids, status_by_id):
    """轴 -> 私有状态集（镜像 score.py status_axis_owner 口径的途径内局部版）：
    轴身份 statusId + 该轴卡挂载占多数的非 common / 非装备槽状态。"""
    axes = d.get("axes") or {}
    cards = d.get("cards") or []
    class_ids = {m.get("statusId") for m in (d.get("classMechanics") or []) if isinstance(m, dict)}
    ident = {ax.get("statusId"): aid for aid, ax in axes.items() if isinstance(ax, dict) and ax.get("statusId")}
    mount_cnt = {}
    for c in cards:
        for s in score.card_mounts(c):
            mount_cnt.setdefault(s, {}).setdefault(c.get("axis"), 0)
            mount_cnt[s][c.get("axis")] += 1
    out = {aid: set() for aid in axes}
    for s, cnt in mount_cnt.items():
        if s in common_ids or s in class_ids:
            continue
        owner = ident.get(s) or max(cnt, key=lambda a: cnt[a])
        if owner in out:
            out[owner].add(s)
    return out


def infer_roles(pid, d, status_by_id, def_index, sig_ctx):
    """逐卡 role 推断：ROLE_RULES 有序首命中。返回 {卡名: (role, reason)}，无命中 role=None。"""
    cards = d.get("cards") or []
    axes = d.get("axes") or {}
    sig_keys = score.PATHWAY_SIGNATURES.get(pid, [])
    axes_reg = set()
    for ax in axes.values():
        if isinstance(ax, dict):
            axes_reg.update(ax.get("enablers") or [])
            axes_reg.update(ax.get("payoffs") or [])
    common_ids = score.load_common_ids()
    private = axis_private_statuses(pid, d, common_ids, status_by_id)
    facets = {}
    for aid, ax in axes.items():
        if not isinstance(ax, dict):
            continue
        kind, aid2 = axis_anchor(ax)
        anchor = {"kind": kind, "id": aid2} if kind else None
        axis_cards = [c for c in cards if c.get("axis") == aid]
        facets[aid] = score.axis_mechanism_facets(axis_cards, anchor, status_by_id, def_index)
    vecs = score.card_vectors(cards, status_by_id)
    dup_members = set()
    for i in range(len(cards)):
        for j in range(i + 1, len(cards)):
            if score.cos_dist(vecs[i], vecs[j]) < 0.20:
                dup_members.add(cards[i]["name"])
                dup_members.add(cards[j]["name"])
    anchor_of = {aid: axis_anchor(ax) for aid, ax in axes.items() if isinstance(ax, dict)}

    out = {}
    for c in cards:
        nm = c["name"]
        types = score.card_effect_types(c)
        role, reason = None, "无命中"
        if c.get("flagship"):
            role, reason = "core", "旗舰"
        elif nm in axes_reg:
            role, reason = "core", "轴登记"
        else:
            hit_keys = [k for k in sig_keys if score.signature_card_hit(c, k, *sig_ctx)]
            if hit_keys:
                role, reason = "core", "签名键:%s" % hit_keys[0]
        if role is None and (c.get("sequence") or 0) >= 8 and c.get("rarity") == "common" and len(types) <= 2:
            role, reason = "starter", "低序列低复杂度"
        if role is None:
            cross = []
            for aid in facets:
                if aid == c.get("axis"):
                    continue
                if any(score.card_refs_status(c, s) for s in private.get(aid, ())):
                    cross.append(aid)
                elif facets[aid] and score.card_mechanism_facets(c, facets[aid], status_by_id, def_index):
                    cross.append(aid)
            if cross:
                role, reason = "bridge", "跨轴读取:%s" % cross[0]
        if role is None and nm in dup_members:
            role, reason = "generic", "近重复对"
        if role is None and types and types <= GENERIC_PRIMS:
            role, reason = "generic", "泛用骨架"
        if role is None and score.card_has_risk_segment(c):
            kind, anch = anchor_of.get(c.get("axis"), (None, None))
            if kind == "status" and anch:
                ident = score.card_refs_status(c, anch)
            elif kind == "channel" and anch:
                _w, _r = score.surface_of(c, status_by_id, def_index)
                ident = anch in (_w | _r)
            else:
                ident = False
            if ident:
                role, reason = "trap", "core同族带风险段（语义待人核）"
        if role is None and (types & TECH_PRIMS or
                             any(isinstance(n, dict) and "filter" in n for n in score.walk(score.card_effects(c)))):
            role, reason = "tech", "对策形状"
        out[nm] = (role, reason)
    return out


def infer_mechs(cards):
    found = []
    for word, test in MECH_HINTS:
        if any(test(score.card_effect_types(c), c) for c in cards):
            found.append(word)
    return found[:4]


def infer_blueprint(pid, d, roles, pathways, status_by_id, status_owner, def_index, pw_name, identity_dims, sig_ctx):
    cards = d.get("cards") or []
    axes = d.get("axes") or {}
    sig_keys = score.PATHWAY_SIGNATURES.get(pid, [])
    card_names = {c["name"] for c in cards}

    # 签名键承诺：实证卡名（按载体所在轴归位）；缺口占位提醒
    sig_carriers = {}
    for k in sig_keys:
        carriers = [c["name"] for c in cards if score.signature_card_hit(c, k, *sig_ctx)]
        sig_carriers[k] = carriers
    sig_cell_by_axis = {aid: [] for aid in axes}
    for k, carriers in sig_carriers.items():
        slots = list(carriers[:3])
        if len(carriers) == 1:
            slots.append("（待补强1卡）")
        elif not carriers:
            slots.append("（待补强2卡）")
        home = None
        if carriers:
            cnt = {}
            for c in cards:
                if c["name"] in carriers:
                    cnt[c.get("axis")] = cnt.get(c.get("axis"), 0) + 1
            home = max(cnt, key=lambda a: cnt[a]) if cnt else None
        home = home if home in sig_cell_by_axis else (sorted(axes)[0] if axes else None)
        if home is not None:
            sig_cell_by_axis[home].append("%s:%s" % (k, ",".join(slots)))

    axis_rows = []
    for aid in sorted(axes):
        ax = axes[aid]
        if not isinstance(ax, dict):
            continue
        kind, anch = axis_anchor(ax)
        spec = "%s:%s" % (kind, anch) if kind else "（待定）"
        en = [n for n in (ax.get("enablers") or []) if n in card_names]
        po = [n for n in (ax.get("payoffs") or []) if n in card_names]
        flow = "%s 产层→%s 消费/读层→%s" % ("/".join(en) or "（待补enabler）",
                                          "/".join(po) or "（待补payoff）", CLEAR_TODO)
        axis_cards = [c for c in cards if c.get("axis") == aid]
        mix = {}
        for c in axis_cards:
            r = roles.get(c["name"], (None,))[0] or "（待定）"
            mix[r] = mix.get(r, 0) + 1
        mix_cell = ",".join("%s×%d" % (r, n) for r, n in sorted(mix.items()))
        axis_rows.append([aid, ax.get("name") or aid, spec, flow, PLACEHOLDER,
                          ";".join(sig_cell_by_axis.get(aid) or []), str(len(axis_cards)), mix_cell])

    # 跨轴钩子：读本途径他轴锚点状态 / 命中他轴 facet 的实证（cap 6）
    xa_rows = []
    facets = {}
    for aid, ax in axes.items():
        if not isinstance(ax, dict):
            continue
        kind, anch = axis_anchor(ax)
        anchor = {"kind": kind, "id": anch} if kind else None
        facets[aid] = score.axis_mechanism_facets([c for c in cards if c.get("axis") == aid],
                                                  anchor, status_by_id, def_index)
    for c in cards:
        if len(xa_rows) >= 6:
            break
        for aid in sorted(axes):
            if aid == c.get("axis") or len(xa_rows) >= 6:
                continue
            # status 行只认锚点状态（与 blueprint_score.reconcile 口径对齐；
            # 读他轴非锚点私有状态属实证耦合但兑现口径不覆盖，不预填）
            akind, aanch = axis_anchor(axes[aid]) if isinstance(axes[aid], dict) else (None, None)
            if akind == "status" and aanch and score.card_refs_status(c, aanch):
                xa_rows.append([c["name"], aid, "status", "read", USE_TODO])
                continue
            hits = score.card_mechanism_facets(c, facets.get(aid) or set(), status_by_id, def_index)
            if hits:
                concept, facet, _item = sorted(hits)[0]
                if concept in bps.FACET_VOCAB and facet in bps.FACET_VOCAB[concept]:
                    xa_rows.append([c["name"], aid, concept, facet, USE_TODO])
    if not xa_rows:
        xa_rows = [["无", "", "", "", ""]]

    # 跨系钩子：本途径 crossPathway 枢纽（写入=本途径挂载卡；读取=他途径实证卡或占位）
    xp_rows = []
    for sid, sd in sorted(status_by_id.items()):
        if not sd.get("crossPathway") or status_owner.get(sid) != pid:
            continue
        writers = [c["name"] for c in cards if sid in score.card_mounts(c)]
        readers = []
        for pid2, d2 in sorted(pathways.items()):
            if pid2 == pid:
                continue
            for c2 in d2.get("cards") or []:
                if score.card_refs_status(c2, sid):
                    readers.append(c2["name"])
        part = sd.get("participants")
        if not part:
            rpids = sorted({pid2 for pid2, d2 in pathways.items() if pid2 != pid and
                            any(score.card_refs_status(c2, sid) for c2 in d2.get("cards") or [])})
            part = [pid] + rpids
        xp_rows.append([sid, ",".join(writers) or "（无写入卡，待接线）",
                        ",".join(readers[:3]) or "（待他途径补读取卡）", ",".join(part)])
    if not xp_rows:
        xp_rows = [["无", "", "", ""]]

    # 角色配比表
    mix_rows = []
    by_role = {}
    for c in cards:
        r = roles.get(c["name"], (None,))[0] or "（待定）"
        by_role.setdefault(r, []).append(c["name"])
    for r in list(bps.ROLES) + ["（待定）"]:
        names = by_role.get(r)
        if names:
            mix_rows.append([r, str(len(names)), ",".join(names)])
    flags = [c["name"] for c in cards if c.get("flagship")]
    if flags:
        mix_rows.append(["flagship", str(len(flags)), ",".join(flags)])

    main_dim = (identity_dims.get(pw_name) or "").strip() or "（待人写）"
    style_row = [main_dim, ",".join(infer_mechs(cards)) or "（待人写）",
                 "途径设计身份.md %s身份卡（红线逐字待人核）" % pw_name]

    return {
        "state": "回溯补登",
        "date": str(datetime.date.today()),
        "proposition": [PLACEHOLDER, PLACEHOLDER, PLACEHOLDER],
        "style": style_row,
        "axes": axis_rows,
        "cross_axis": xa_rows,
        "cross_pathway": xp_rows,
        "mix": mix_rows,
    }


def render(bp):
    L = []
    L.append("## 玩法蓝图（%s · %s · 蓝图评分 待评）" % (bp["state"], bp["date"]))
    L.append("")
    L.append("### 命题")
    L.append("| 一句话命题 | 可操作变量 | 变量代价/输面 |")
    L.append("|---|---|---|")
    L.append("| %s | %s | %s |" % tuple(bp["proposition"]))
    L.append("")
    L.append("### 风格边界")
    L.append("| 主签名维度 | 使用的全局通用机制 | 红线来源 |")
    L.append("|---|---|---|")
    L.append("| %s | %s | %s |" % tuple(bp["style"]))
    L.append("")
    L.append("### 轴玩法")
    L.append("| 轴 | 名称 | 锚点(kind:id) | 产出→消费→清除 | 玩家决策点 | 签名键承诺(键:卡位) | 计划卡数 | 角色配比 |")
    L.append("|---|---|---|---|---|---|---|---|")
    for r in bp["axes"]:
        L.append("| %s |" % " | ".join(r))
    L.append("")
    L.append("### 跨轴钩子")
    L.append("| 卡位 | 读轴 | 概念 | facet | 用途 |")
    L.append("|---|---|---|---|---|")
    for r in bp["cross_axis"]:
        L.append("| %s |" % " | ".join(r))
    L.append("")
    L.append("### 跨系钩子")
    L.append("| 枢纽状态 | 写入卡位 | 读取卡位 | participants |")
    L.append("|---|---|---|---|")
    for r in bp["cross_pathway"]:
        L.append("| %s |" % " | ".join(r))
    L.append("")
    L.append("### 角色配比")
    L.append("| 角色 | 张数 | 卡位 |")
    L.append("|---|---|---|")
    for r in bp["mix"]:
        L.append("| %s |" % " | ".join(r))
    L.append("")
    return "\n".join(L)


def insert_into_rounds(pid, pw_name, text):
    path = os.path.join(ROUNDS_DIR, pid + ".md")
    if os.path.exists(path):
        body = io.open(path, encoding="utf-8").read()
        if "## 玩法蓝图" in body:
            raise SystemExit("拒绝：%s 已有「## 玩法蓝图」章（幂等保护，不覆盖人写内容）" % path)
        lines = body.splitlines()
        idx = next((i for i, ln in enumerate(lines) if ln.startswith("# ")), None)
        if idx is None:
            raise SystemExit("拒绝：%s 找不到一级标题，无法定位插入点" % path)
        lines = lines[:idx + 1] + ["", text] + lines[idx + 1:]
        io.open(path, "w", encoding="utf-8", newline="\n").write("\n".join(lines))
    else:
        head = "# %s %s 重设计日志\n\n" % (pw_name, pid)
        io.open(path, "w", encoding="utf-8", newline="\n").write(head + text + "\n")
    return path


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    if not args:
        raise SystemExit(__doc__)
    pid = args[0]
    write = "--write" in sys.argv
    pathways, status_by_id, status_owner, def_index, pw_names, identity_dims, sig_ctx = load_context()
    d = pathways.get(pid)
    if not d:
        raise SystemExit("未知途径：%s" % pid)
    pw_name = pw_names.get(pid, pid)

    roles = infer_roles(pid, d, status_by_id, def_index, sig_ctx)
    bp = infer_blueprint(pid, d, roles, pathways, status_by_id, status_owner, def_index, pw_name, identity_dims, sig_ctx)

    print("== role 推断（%s，%d 卡）==" % (pid, len(roles)))
    stat = {}
    for nm, (r, why) in sorted(roles.items(), key=lambda kv: (kv[1][0] or "zzz", kv[0])):
        stat[r or "（待定）"] = stat.get(r or "（待定）", 0) + 1
        print("  %-4s %-14s %s" % (r or "（待定）", nm, why))
    print("  合计：%s" % ", ".join("%s×%d" % (k, v) for k, v in sorted(stat.items())))
    n_todo = stat.get("（待定）", 0)
    if n_todo:
        print("  ⚠ %d 卡无规则命中（留人工）" % n_todo)
    print()
    print("== 蓝图预填 ==")
    text = render(bp)
    print(text)
    if write:
        path = insert_into_rounds(pid, pw_name, text)
        print("已写入 %s（命题/决策点/清除路径/用途 为占位，须人写后跑 blueprint_score.py 复核）" % path)
    else:
        print("（dry-run；加 --write 写入 rounds/%s.md）" % pid)


if __name__ == "__main__":
    main()
