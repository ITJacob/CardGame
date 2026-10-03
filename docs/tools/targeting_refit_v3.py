# -*- coding: utf-8 -*-
"""88 轴选靶签名迁移（依据 docs/meta/轴选靶签名设计.md §4）。

把「轴级默认签名」写进各卡 target：几何 scope / anchor / sort / filter / pickCount。
只改选靶层，**不碰任何数值、不改 effects**。

用法:
  python docs/tools/targeting_refit_v3.py --list          列出 88 轴配方与当前命中数
  python docs/tools/targeting_refit_v3.py --dry warrior   干跑（不写盘）
  python docs/tools/targeting_refit_v3.py warrior prisoner  （实跑，可多途径）
  python docs/tools/targeting_refit_v3.py --all            全 22 途径

幂等：已具备该签名的卡跳过；重复跑不会产生额外 diff。
"""
import argparse
import glob
import io
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
DOCS = os.path.dirname(HERE)
JSON_DIR = os.path.join(DOCS, "json")

# ---- 88 轴签名配方 ----
# 键 = (pathwayId, axisId)；值字段：
#   faction  必须匹配该卡现有 faction 才套用（不匹配的卡＝叙事特化，保留原样）
#   scope    几何范围（必填）
#   anchor   原点（可选；缺省则沿用 schema 的 faction 推导）
#   sort     写入 target.fallbackSort
#   filter   合并进 request.filter（同键覆盖）
#   pick     'all' 或整数；不写则按 scope 收敛（point 一律清掉 pickCount）
def S(faction, scope, anchor=None, sort=None, filter=None, pick=None):
    return dict(faction=faction, scope=scope, anchor=anchor, sort=sort,
                filter=filter or {}, pick=pick)

AXIS_SIG = {
    # 占卜家（源堡）——预知抢在时间前 / 秘偶全场提线 / 奇迹全局改写
    ("seer", "foresight"):  S("any",  "board",       sort="gauge_desc"),
    ("seer", "trick"):      S("self", "point"),
    ("seer", "marionette"): S("any",  "board", filter={"hasStatus": "puppet_string"}, pick="all"),
    ("seer", "miracle"):    S("any",  "board", pick="all"),
    # 学徒（门）——门的意义就是不在同一处，全库最该跨路的途径
    ("apprentice", "gate"):   S("any",   "cross_lane", pick="all"),
    ("apprentice", "trick"):  S("enemy", "point"),
    ("apprentice", "record"): S("any",   "point"),
    ("apprentice", "astral"): S("enemy", "board", sort="atk_desc"),
    # 仲裁人（审判者）——辖区一路 / 审讯标记 → 惩戒清算全场被标记者
    ("arbiter", "jurisdiction"): S("any",   "whole_lane", pick="all"),
    ("arbiter", "inquest"):      S("enemy", "point"),
    ("arbiter", "sanction"):     S("enemy", "board", filter={"hasStatus": "marked"}, pick="all"),
    ("arbiter", "decree"):       S("any",   "board", pick="all"),
    # 刺客（魔女）——疫病是全库唯一该以菱形扩散为主体的轴
    ("assassin", "form"):   S("self",  "point"),
    ("assassin", "charm"):  S("enemy", "point"),
    ("assassin", "plague"): S("enemy", "diamond_1", pick="all"),
    ("assassin", "mirror"): S("any",   "point"),
    # 歌颂者（太阳）——圣咏普惠全队 / 审判挑最强者
    ("chanter", "hymn"):     S("ally",  "board", pick="all"),
    ("chanter", "light"):    S("enemy", "whole_lane", pick="all"),
    ("chanter", "notary"):   S("ally",  "point"),
    ("chanter", "judgment"): S("enemy", "board", sort="atk_desc"),
    # 收尸人（死神）——灵视看「灵」（filter）vs 终末收「最残」（sort），两轴靠维度分开
    ("corpse_collector", "spirit_sight"): S("any",   "board", filter={"unitType": "SPIRIT"}, pick="all"),
    ("corpse_collector", "corpse"):       S("any",   "board", filter={"unitType": "UNDEAD"}),
    ("corpse_collector", "undead"):       S("ally",  "board", filter={"unitType": "UNDEAD"}, pick="all"),
    ("corpse_collector", "end"):          S("enemy", "board", sort="hp_asc"),
    # 罪犯（深渊）——污秽洇开 / 领域覆盖一整路
    ("criminal", "vice"):      S("enemy", "board", pick="all"),
    ("criminal", "filth"):     S("enemy", "diamond_1", pick="all"),
    ("criminal", "elements"):  S("enemy", "whole_lane", pick="all"),
    ("criminal", "demon"):     S("self",  "point"),
    # 猎人（红祭司）——收割打最脆的（与歌颂者审判的 atk_desc 互为镜像）
    ("hunter", "harvest"): S("enemy", "board", sort="hp_asc"),
    ("hunter", "flame"):   S("enemy", "behind_2", pick="all"),
    ("hunter", "intrigue"):S("enemy", "point"),
    ("hunter", "massing"): S("ally",  "board", pick="all"),
    # 律师（黑皇帝）——与仲裁人争夺同一块 board 棋盘，签名即叙事
    ("lawyer", "advocacy"):  S("enemy", "point"),
    ("lawyer", "brute"):     S("enemy", "behind_1"),
    ("lawyer", "bribery"):   S("enemy", "whole_lane", pick="all"),
    ("lawyer", "warp_rule"): S("any",   "board", pick="all"),
    # 怪物（命运之轮）——降厄于最强者，收益最大
    ("monster", "inspiration"): S("self",  "point"),
    ("monster", "fortune"):     S("ally",  "board", pick="all"),
    ("monster", "calamity"):    S("enemy", "board", sort="atk_desc"),
    ("monster", "cycle"):       S("any",   "board", pick="all"),
    # 耕种者（母亲）——治疗的手伸向最需要的人
    ("planter", "harvest"): S("ally",  "board", pick="all"),
    ("planter", "healing"): S("ally",  "board", sort="hp_asc"),
    ("planter", "alchemy"): S("self",  "point"),
    ("planter", "blight"):  S("enemy", "whole_lane", pick="all"),
    # 囚犯（被缚者）——诅咒沿链接跳跃，不是半径（提案 E 主战场）
    ("prisoner", "bondage"):    S("enemy", "behind_1"),
    ("prisoner", "curse"):      S("enemy", "chain_2", pick="all"),
    ("prisoner", "aberration"): S("self",  "point"),
    ("prisoner", "item"):       S("any",   "point"),
    # 窥秘人（隐者）——星桥横跨两路（提案 F）
    ("pryer", "scrying"): S("enemy", "point"),
    ("pryer", "combat"):  S("enemy", "behind_1"),
    ("pryer", "scroll"):  S("enemy", "whole_lane", pick="all"),
    ("pryer", "astral"):  S("any",   "cross_lane_row", pick="all"),
    # 阅读者（白塔）——模仿挑最值得偷师的那个
    ("reader", "analysis"):  S("any",   "point"),
    ("reader", "arcana"):    S("enemy", "whole_lane", pick="all"),
    ("reader", "mimic"):     S("any",   "board", sort="atk_desc"),
    ("reader", "foresight"): S("ally",  "board", pick="all"),
    # 水手（暴君）——雷是一跳一跳打的（提案 E）
    ("sailor", "ocean"):     S("self",  "point"),
    ("sailor", "rage"):      S("self",  "point"),
    ("sailor", "storm"):     S("enemy", "chain_2", pick="all"),
    ("sailor", "authority"): S("enemy", "board", pick="all"),
    # 通识者（完美者）
    ("savant", "lore"):          S("any",  "point"),
    ("savant", "craft"):         S("self", "point"),
    ("savant", "astral"):        S("any",  "board", pick="all"),
    ("savant", "civilization"):  S("ally", "board", pick="all"),
    # 不眠者（黑暗）——夜是全局的；隐秘一次只笼罩一个
    ("sleepless", "darkness"):  S("any",          "board", pick="all"),
    ("sleepless", "nightmare"): S("enemy",        "point"),
    ("sleepless", "requiem"):   S("ally",         "board", filter={"unitType": "SPIRIT"}, pick="all"),
    ("sleepless", "secrecy"):   S("self_or_ally", "point"),
    # 观众（空想家）——梦境穿梭不受战场边界约束
    ("spectator", "insight"):    S("any",   "point"),
    ("spectator", "suggestion"): S("enemy", "point"),
    ("spectator", "dream"):      S("enemy", "cross_lane", pick="all"),
    ("spectator", "fantasy"):    S("any",   "board", pick="all"),
    # 秘祈人（混沌海）——牧魂是全库唯一该用 last_dead_ally 锚点的轴
    ("supplicant", "shadow"):      S("self",  "diamond_1"),
    ("supplicant", "flesh"):       S("enemy", "point"),
    ("supplicant", "soul"):        S("any",   "point", anchor="last_dead_ally"),
    ("supplicant", "corruption"):  S("enemy", "whole_lane", pick="all"),
    # 偷盗者（错误）——偷就偷最值钱的那个
    ("thief", "steal"):    S("enemy", "board", sort="atk_desc"),
    ("thief", "deceit"):   S("enemy", "whole_lane", pick="all"),
    ("thief", "parasite"): S("enemy", "behind_1"),
    ("thief", "chrono"):   S("enemy", "behind_2", pick="all"),
    # 战士（黄昏巨人）——守护需 ally_front（提案 A 主战场）
    ("warrior", "martial"):  S("enemy", "behind_2", pick="all"),
    ("warrior", "guard"):    S("ally",  "behind_1", anchor="ally_front"),
    ("warrior", "hunt"):     S("enemy", "board", filter={"unitType": "DEMON"}, pick="all"),
    ("warrior", "twilight"): S("enemy", "whole_lane", pick="all"),
    # 药师（月亮）——兽群＝「我召唤的那些」，filter 把轴名直接写进签名
    ("apothecary", "brew"):    S("ally", "point"),
    ("apothecary", "beasts"):  S("ally", "board", filter={"isSummon": True}, pick="all"),
    ("apothecary", "crimson"): S("enemy", "point"),
    ("apothecary", "moon"):    S("any",   "board", pick="all"),
}

# 特殊 anchor（叙事寻址）优先于轴签名，不覆盖
KEEP_ANCHOR = {"spawned_unit", "last_dead_ally", "specific_unit", "fixed_cell"}

NOTE = "选靶签名：{axis}轴 {faction}+{scope}{extra}（轴选靶签名设计 §4）"


def load(path):
    return json.load(io.open(path, encoding="utf-8"))


def save(path, data):
    with io.open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write("\n")


def apply_sig(card, sig, axis_id):
    """套用轴签名。返回 (是否改动, 说明)；不改数值、不改 effects。"""
    t = card.get("target")
    if not t or not isinstance(t, dict):
        return False, "无 target（被动卡）"
    rq = t.get("request")
    if not isinstance(rq, dict):
        return False, "无 request"
    # faction 匹配：sig.faction=='any' 表示**该轴不挑阵营**，任意 faction 都套用；
    # 其余则要求卡自身 faction 与轴签名一致（不一致＝叙事特化，保留原样）
    if sig["faction"] != "any" and rq.get("faction") != sig["faction"]:
        return False, "faction=%s 与轴签名 %s 不符（叙事特化，保留）" % (
            rq.get("faction"), sig["faction"])

    # 自身目标的几何恒为 point：施法者只占一格，套 board/behind_n 是纯噪声。
    # 但轴签名本身就是 self 轴的（如秘祈人阴影 self+diamond_1）要尊重轴设计
    if rq.get("faction") == "self" and sig["faction"] != "self":
        scope = "point"
    else:
        scope = sig["scope"]

    changed = False
    detail = []

    # scope
    if rq.get("scope") != scope:
        rq["scope"] = scope
        changed = True
        detail.append("scope→%s" % scope)

    # anchor（轴显式指定才写；已有的特殊寻址锚点不动）
    if sig.get("anchor"):
        cur = rq.get("anchor")
        if cur in KEEP_ANCHOR:
            detail.append("anchor 保留 %s" % cur)
        elif cur != sig["anchor"]:
            rq["anchor"] = sig["anchor"]
            changed = True
            detail.append("anchor→%s" % sig["anchor"])

    # sort → target.fallbackSort（数据既有约定：337 张落这里，request.sort 仅 3 张）
    if sig.get("sort"):
        if t.get("fallbackSort") != sig["sort"]:
            t["fallbackSort"] = sig["sort"]
            changed = True
            detail.append("sort→%s" % sig["sort"])

    # filter（合并，同键覆盖）
    if sig.get("filter"):
        flt = rq.get("filter") or {}
        for k, v in sig["filter"].items():
            if flt.get(k) != v:
                flt[k] = v
                changed = True
                detail.append("filter.%s→%s" % (k, v))
        if flt:
            rq["filter"] = flt

    # pickCount
    if sig.get("pick"):
        if rq.get("pickCount") != sig["pick"]:
            rq["pickCount"] = sig["pick"]
            changed = True
            detail.append("pick→%s" % sig["pick"])
    elif scope == "point" and "pickCount" in rq:
        # point 只有一格，'all' 无意义
        del rq["pickCount"]
        changed = True
        detail.append("清 pickCount（point）")

    if not changed:
        return False, "已具备该签名"

    # 留痕
    extra = ""
    if sig.get("anchor"):
        extra += " anchor:%s" % sig["anchor"]
    if sig.get("sort"):
        extra += " sort:%s" % sig["sort"]
    if sig.get("filter"):
        extra += " filter:%s" % ",".join(sig["filter"].keys())
    if sig.get("pick"):
        extra += " pick:%s" % sig["pick"]
    cn = card.get("conversionNotes")
    note = NOTE.format(axis=axis_id, faction=rq.get("faction"), scope=scope, extra=extra)
    if isinstance(cn, list):
        if note not in cn:
            cn.append(note)
    elif isinstance(cn, str):
        if note not in cn:
            card["conversionNotes"] = cn.rstrip() + " ｜ " + note
    else:
        card["conversionNotes"] = note

    return True, "、".join(detail)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("pathways", nargs="*", help="途径 id；不给则配合 --all")
    ap.add_argument("--all", action="store_true")
    ap.add_argument("--dry", action="store_true")
    ap.add_argument("--list", action="store_true")
    args = ap.parse_args()

    files = sorted(glob.glob(os.path.join(JSON_DIR, "*.skills.json")))
    if args.list:
        for (pid, aid), sig in AXIS_SIG.items():
            print("%-18s %-14s %-8s %-14s %s" % (
                pid, aid, sig["faction"], sig["scope"],
                " ".join("%s=%s" % (k, v) for k, v in sig.items()
                         if k not in ("faction", "scope") and v)))
        print("\n共 %d 条轴签名配方" % len(AXIS_SIG))
        return 0

    targets = args.pathways
    if args.all or not targets:
        if not args.all and not targets:
            ap.error("请给途径 id 或 --all")
        targets = [os.path.basename(f).split(".")[0] for f in files]

    report = {}
    for path in files:
        pid = os.path.basename(path).split(".")[0]
        if pid not in targets:
            continue
        data = load(path)
        changed_cards = 0
        per_axis = {}
        skipped = {}
        for card in data.get("cards") or []:
            aid = card.get("axis")
            sig = AXIS_SIG.get((pid, aid))
            if not sig:
                continue
            ok, why = apply_sig(card, sig, aid)
            if ok:
                changed_cards += 1
                per_axis[aid] = per_axis.get(aid, 0) + 1
            else:
                skipped.setdefault(aid, {}).setdefault(why, 0)
                skipped[aid][why] = skipped[aid][why] + 1
        if changed_cards:
            if not args.dry:
                save(path, data)
            report[pid] = {"changed": changed_cards, "byAxis": per_axis, "skipped": skipped}
            print("%-18s 改动 %d 张  %s" % (pid, changed_cards, per_axis))
        else:
            print("%-18s 无改动" % pid)

    out = os.path.join(DOCS, "analysis", "targeting_refit_v3_report.json")
    if not args.dry:
        os.makedirs(os.path.dirname(out), exist_ok=True)
        with io.open(out, "w", encoding="utf-8") as f:
            json.dump(report, f, ensure_ascii=False, indent=2)
            f.write("\n")
    print("\n%s：共改动 %d 张（报告 %s）" % (
        "干跑" if args.dry else "已写入",
        sum(v["changed"] for v in report.values()), out))
    return 0


if __name__ == "__main__":
    sys.exit(main())
