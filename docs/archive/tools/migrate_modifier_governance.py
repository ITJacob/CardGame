# -*- coding: utf-8 -*-
"""
修饰键治理迁移脚本（2026-10-02 治理批，裁定见提交信息）。

三类处置：
  A. 同义合并（modifiers 内部改名/归一，正典见 MOD_MERGES）
  B. 错位回迁（modifiers 键本是一等顶层字段，迁回并合并；见 RELOCATE）
  C. 纯登记（不动数据，词典 modifierKey 栏目收录）

注意：damageShare 本批不回迁——两处 direction 值（both/to_self）超出现行
damageTransfer schema 枚举，留待 direction 取值扩展（已在词典 brief 标注）。
"""
import json, glob, os

JSON_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "json")

# A. 同义合并：旧键 -> (新键, 值变换函数)
def v_keep(v): return v
def v_ratio(v):
    if isinstance(v, (int, float)): return {"ratio": v}
    if isinstance(v, dict):
        out = {}
        if "ratio" in out or "ratio" in v: out["ratio"] = v.get("ratio", v.get("value"))
        elif "value" in v: out["ratio"] = v["value"]
        if "note" in v: out["note"] = v["note"]
        return out
    return v
def v_true(v): return True
def v_mul(v):
    if isinstance(v, dict) and "value" in v:
        v = dict(v); v["mul"] = v.pop("value")
    return v

MOD_MERGES = {
    "damageTakenMul": ("damage_taken_mul", v_keep),
    "casterNeverMiss": ("neverMiss", v_true),
    "armorPierceRatio": ("armor_pierce_ratio", v_ratio),
    "armor_pierce": ("armor_pierce_ratio", v_ratio),
    "pierceArmor": ("armor_pierce_ratio", lambda v: {"ratio": 1}),
    "pierce": ("pierce_shield", v_keep),
    "summon_cap": ("summon_cap_override", v_keep),
    "summonCapOverride": ("summon_cap_override", v_keep),
    "allyDamageMul": ("ally_damage_mul", v_mul),
    "ignore_redirect": ("ignore_guard", v_true),
    "ignoreRedirect": ("ignore_guard", v_true),
    "ignoreFrontline": ("ignore_guard", v_true),
    "ignoreGuardIntercept": ("ignore_guard", v_true),
    "seeThroughStealth": ("see_through", v_true),
    "detectConceal": ("see_through", v_true),
    "seeConceal": ("see_through", v_true),
    "reveal_stealth": ("see_through", v_true),
    "element": ("dot_element", v_keep),
    "filter": ("target_filter_override", v_keep),
    "redirect": ("redirect_attack", v_keep),
}
# 这些键被吞并时，值里的 note 字段并入顶层 note（信息不丢）
NOTE_ON_MERGE = {"ignore_redirect", "ignoreRedirect", "ignoreFrontline", "ignoreGuardIntercept",
                 "seeThroughStealth", "detectConceal", "seeConceal", "reveal_stealth"}

FULL_LOCK = ["move", "basic_attack", "skill", "skip", "react", "channel"]

# B. 错位回迁：键 -> (顶层字段, 值变换)
RELOCATE = {
    "behaviorModifiers": ("behaviorModifiers", lambda v: v),
    "immune": ("immune", v_keep),
    "suppress": ("suppress", v_keep),
    "statPerStack": ("statPerStack", v_keep),
    "disable": ("disallowActions", lambda v: list(FULL_LOCK)),
    "disableAllActions": ("disallowActions", lambda v: list(FULL_LOCK)),
    "stun": ("disallowActions", lambda v: list(FULL_LOCK)),
    "disableSkill": ("disallowActions", lambda v: ["skill"]),
    "disableSkills": ("disallowActions", lambda v: ["skill"]),
    "redirect_damage": ("damageTransfer", v_keep),
    "damageRedirect": ("damageTransfer", v_keep),
}
RELOC_NOTE_KEYS = {"lethalProtect", "reviveBlocked", "revive_blocked"}  # 特殊：置 true，note 并入


def norm_to_dict(mods):
    """list 形态归一为 dict：字符串项 -> True；对象项 -> 去 kind 后作值。"""
    if isinstance(mods, dict):
        return dict(mods), False
    out = {}
    for it in mods:
        if isinstance(it, str):
            out[it] = True
        elif isinstance(it, dict) and it.get("kind"):
            v = dict(it); v.pop("kind", None)
            out[it["kind"]] = v
    return out, True


def append_note(st, extra):
    if not extra:
        return
    old = st.get("note")
    st["note"] = (old + "；" if old else "") + extra


def process(st, src, stats):
    mods = st.get("modifiers")
    if mods is None:
        return
    m, was_list = norm_to_dict(mods)
    changed = False
    # B. 回迁（先处理，避免被 A 改名抢先）
    for key in list(m.keys()):
        if key in RELOCATE:
            field, fn = RELOCATE[key]
            val = fn(m.pop(key))
            top = st.get(field)
            if field in ("note",):
                append_note(st, val if isinstance(val, str) else None)
            elif top is None:
                st[field] = val
            elif isinstance(top, list) and isinstance(val, list):
                top.extend(val)
            elif isinstance(top, dict) and isinstance(val, dict):
                top.update(val)
            else:
                raise SystemExit("冲突 %s %s: 顶层 %s 已有值 %r" % (src, st.get("id"), field, top))
            stats["relocate"] += 1
            changed = True
        elif key in RELOC_NOTE_KEYS:
            v = m.pop(key)
            if st.get(key) in (None, False):
                st[key] = True
            if isinstance(v, dict):
                extra = v.get("note")
                for pk, pv in v.items():
                    if pk not in ("value", "note") and pv is not True:
                        extra = (extra + "；" if extra else "") + "%s=%s" % (pk, pv)
                append_note(st, extra)
            stats["relocate"] += 1
            changed = True
    # A. 合并
    for old, (new, fn) in MOD_MERGES.items():
        if old in m:
            v = m.pop(old)
            nv = fn(v)
            if old in NOTE_ON_MERGE and isinstance(v, dict) and v.get("note"):
                append_note(st, v["note"])
            if new in m and m[new] is not True:
                raise SystemExit("冲突 %s %s: 合并键 %s 已存在 %r" % (src, st.get("id"), new, m[new]))
            m[new] = nv
            stats["merge"] += 1
            changed = True
    if changed:
        st["modifiers"] = m
        stats["sd"] += 1


def main():
    stats = {"merge": 0, "relocate": 0, "sd": 0}
    for f in sorted(glob.glob(os.path.join(JSON_DIR, "*.statuses.json"))):
        raw = open(f, encoding="utf-8").read()
        d = json.loads(raw)
        before = dict(stats)
        for st in d.get("statusDefs", []):
            process(st, os.path.basename(f), stats)
        if stats != before:
            out = json.dumps(d, ensure_ascii=False, indent=2) + "\n"
            with open(f, "w", encoding="utf-8") as fh:
                fh.write(out)
            print(os.path.basename(f), {k: stats[k] - before[k] for k in stats})
    print("=== TOTAL ===", stats)


if __name__ == "__main__":
    main()
