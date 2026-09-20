# -*- coding: utf-8 -*-
"""词典对账：封闭枚举值域 ↔ docs/meta/glossary.json 词条。

正源 = docs/json/schema/skills.schema.json（经 validate.py 加载，不另抄一份）。
站点渲染时按 glossary 查中文名，查不到即显示橙色「未收录」并在控制台告警；
新增枚举值后跑本脚本，即得需要补录的词条清单。

对账两项：① 每个取值域的值都有词条 ② 每个栏目都写了 desc（这一维是什么）。
用法: python docs/tools/check_glossary.py   （只读；任一项不达标 exit 1）
"""
import glob
import io
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
DOCS = os.path.dirname(HERE)
sys.path.insert(0, HERE)
import validate  # noqa: E402  复用其从 schema 加载的枚举正源

GLOSSARY = os.path.join(DOCS, "meta", "glossary.json")

# ① validate.py 已从 schema 正源提取的枚举 → glossary 类别
FROM_VALIDATE = {
    "primitive": validate.PRIMS,
    "operator": validate.OPS,
    "element": validate.ELEMENTS,
    "stat": validate.STATS,
    "sortKey": validate.SORTS,
    "reach": validate.REACH,
    "actionLock": validate.ACTION_LOCKS,
    "statusCategory": validate.CATS,
    "effectTarget": validate.EFFECT_TARGETS,
    "resource": validate.RESOURCES,
    "moveOp": validate.MOVE_OPS,
    "domainOp": validate.DOMAIN_OPS,
    "translocateOp": validate.TRANS_OPS,
    "skillSelector": validate.SKILL_SELECTORS,
    "targetabilityDirection": validate.TARGET_DIRECTIONS,
    "revealScope": validate.REVEAL_SCOPES,
    "onExpire": validate.CONTROL_EXPIRE,
    "actionPolicy": validate.CONTROL_POLICY,
}

# ② schema $defs 下其余 enum → glossary 类别。
# 键 = $defs 相对路径去掉 properties 段；None = 站点不渲染该字段，无需词典。
ENUM_TO_CAT = {
    "card.kind": "cardKind",
    "card.rarity": "rarity",
    "card.reach": "reach",
    "card.gender": "gender",
    "cardTarget.selectionMode": "selectionMode",
    "cardTarget.consumption": "consumption",
    "secondaryTarget.selectionMode": "selectionMode",
    "unitRequest.faction": "faction",
    "unitRequest.scope": "scope",
    "unitRequest.anchor": "anchor",
    "unitRequest.spread": "spread",
    "unitRequest.laneRef": "laneRef",
    "unitDef.reach": "reach",
    "unitDef.gender": "gender",
    "dimHook.dim": "dim",
    "dimHook.comparator": "cmp",
    "dimHook.target": "dimTarget",
    "condition.kind": "conditionKind",
    "condition.side": "side",
    "condition.cmp": "cmp",
    "effDamage.spread": "spread",
    "effHeal.mode": "healMode",
    "effMountStatus.stackMode": "stackMode",
    "effMountStatus.spread": "spread",
    "effModifyStat.mode": "statMode",
    "effModifyStat.sourceRef": "sourceRef",
    "effModifyStat.spread": "spread",
    "effModifyResource.resource": "resource",
    "effModifyResource.mode": "resourceMode",
    "effModifyResource.op": "resourceMode",
    "effMove.op": "moveOp",
    "effSpawn.position": "spawnPosition",
    "effSpawn.consumption": "consumption",
    "effSpawn.reviveOf": "reviveOf",
    "effDispel.dispelTarget": "dispelTarget",
    "effDispel.mode": "dispelMode",
    "effDispel.category": "statusCategory",
    "effDrain.resource": "resource",
    "effDrain.category": "statusCategory",
    "effDomain.op": "domainOp",
    "effDomain.durationUnit": "durationUnit",
    "effTranslocate.op": "translocateOp",
    "effModifyDamage.scope": "modifyDamageScope",
    "effTransferStatus.mode": "transferMode",
    "effEchoLastSkill.rounding": "rounding",
    "effStatusShuffle.mode": "shuffleMode",
    "effModifySkill.skillRef.selector": "skillSelector",
    "effModifySkill.skillRef.ofSkill": None,
    "effModifySkill.targetSpecOverride": None,
    "effModifySkill.targetSpecOverride.selectionMode": "selectionMode",
    "effModifyTargetability.direction": "targetabilityDirection",
    # 与 effDamage.pierce 同名不同义（此处是「谁能看穿不可选取」），站点不渲染其值
    "effModifyTargetability.pierce": None,
    "effReveal.scope": "revealScope",
    "effTakeControl.onExpire": "onExpire",
    "effTakeControl.actionPolicy": "actionPolicy",
    "effWriteRuleSlot.field": "ruleSlotField",
    "effModifyRuleSlot.field": "ruleSlotField",
    "effModifyRuleSlot.mode": "ruleSlotMode",
    "statusDef.stackPolicy": "stackPolicy",
    "statusDef.countMode": "countMode",
    "statusDef.damageTransfer.direction": "transferDirection",
    "statusDef.damageTransfer.split": "split",
    "domainDef.tier": "domainTier",
    "domainDef.durationUnit": "durationUnit",
    "domainGrant.tier": "domainTier",
    "domainGrant.durationUnit": "durationUnit",
    "zoneDef.kind": "zoneKind",
    "zoneDef.trigger": "zoneTrigger",
    "zoneDef.affects": "zoneAffects",
    "zoneGrant.affects": "zoneAffects",
    "zoneDef.durationUnit": "durationUnit",
    "zoneGrant.durationUnit": "durationUnit",
    # $defs 顶层的独立枚举（与 validate.py 已覆盖的部分重叠，合并不冲突）
    "actionLock": "actionLock",
    "effectTarget": "effectTarget",
    "sortKey": "sortKey",
    "statusCategory": "statusCategory",
    "triggerEvent": "triggerEvent",
}

# ③ schema 未用 enum 约束（自由字符串）、但站点会渲染的字段 → 只能按数据实扫。
# 值 = glossary 类别；键 = 定位规则，见 scan_data()。
DATA_SCAN_CATS = {"damagePierce", "unitType", "rulePatchKind"}

UNREGISTERED = object()   # 哨兵：schema 里出现但 ENUM_TO_CAT 未登记


def schema_enums(defs):
    """遍历 $defs，返回 {去掉 properties 段的点分路径: [枚举值]}。"""
    found = {}

    def walk(node, path):
        if isinstance(node, dict):
            if isinstance(node.get("enum"), list):
                found[".".join(p for p in path if p != "properties")] = list(node["enum"])
            for k, v in node.items():
                walk(v, path + [k])
        elif isinstance(node, list):
            for v in node:
                walk(v, path)

    walk(defs, [])
    return found


def covered_by_pattern(key, patterns):
    """与 site/js/term.js 的 lookup() 同规则：match 以 * 结尾时按前缀匹配。"""
    return any(p.get("match", "").endswith("*") and key.startswith(p["match"][:-1])
               for p in patterns)


def scan_data(json_dir):
    """按数据实扫 schema 未约束的字段，返回 {类别: {值}}。

    仅覆盖 DATA_SCAN_CATS：damage 节点的 pierce、任意层级的 unitType、
    domainDef.rulePatches 各项的 kind。
    """
    found = {cat: set() for cat in DATA_SCAN_CATS}

    def walk(node):
        if isinstance(node, dict):
            if node.get("type") == "damage" and "pierce" in node:
                vals = node["pierce"] if isinstance(node["pierce"], list) else [node["pierce"]]
                found["damagePierce"].update(str(v) for v in vals)
            if isinstance(node.get("unitType"), str):
                found["unitType"].add(node["unitType"])
            if isinstance(node.get("rulePatches"), list):
                for rp in node["rulePatches"]:
                    if isinstance(rp, dict) and isinstance(rp.get("kind"), str):
                        found["rulePatchKind"].add(rp["kind"])
            for v in node.values():
                walk(v)
        elif isinstance(node, list):
            for v in node:
                walk(v)

    for path in sorted(glob.glob(os.path.join(json_dir, "*.json"))):
        if os.path.basename(path) == "manifest.json":
            continue
        try:
            walk(json.load(io.open(path, encoding="utf-8")))
        except (ValueError, OSError):
            continue
    return {cat: sorted(vals) for cat, vals in found.items()}


def main():
    glossary = json.load(io.open(GLOSSARY, encoding="utf-8"))
    cats = glossary["categories"]

    values_by_cat = {}   # cat -> {值: 来源}

    def add(cat, values, src):
        bucket = values_by_cat.setdefault(cat, {})
        for v in values:
            bucket.setdefault(str(v), src)

    for cat, values in FROM_VALIDATE.items():
        add(cat, values, "validate.py")

    for cat, values in scan_data(validate.JSON_DIR).items():
        add(cat, values, "数据实扫")

    unmapped = []
    for path, values in schema_enums(validate.DEFS).items():
        cat = ENUM_TO_CAT.get(path, UNREGISTERED)
        if cat is UNREGISTERED:
            unmapped.append(path)
        elif cat is not None:
            add(cat, values, f"$defs/{path}")

    missing, unchecked = [], []
    for cat, values in sorted(values_by_cat.items()):
        g = cats.get(cat)
        if not g:
            missing.append((cat, "（glossary 缺整个类别）", "validate.py"))
            continue
        terms = set(g.get("terms") or {})
        patterns = g.get("patterns") or []
        for v, src in values.items():
            if v not in terms and not covered_by_pattern(v, patterns):
                missing.append((cat, v, src))

    total_terms = sum(len(c.get("terms") or {}) for c in cats.values())
    print(f"glossary v{glossary.get('version')} · {len(cats)} 类 {total_terms} 词条")
    print(f"值域来源：validate.py {len(FROM_VALIDATE)} 组 + schema $defs {len(ENUM_TO_CAT)} 处")
    print(f"参与对账类别：{len(values_by_cat)}\n")

    for cat in sorted(cats):
        if cat not in values_by_cat:
            unchecked.append(cat)

    # 每个栏目必须有一句「这一维是什么」的描述（不是出处）：站点把它渲染在栏目标题下，
    # 缺了就退化成只有 key/中文/解释的裸表，读者看不出这一维在整体里管什么。
    nondesc = sorted(c for c in cats if not (cats[c].get("desc") or "").strip())

    if missing:
        print(f"缺词条 {len(missing)} 条（需补 docs/meta/glossary.json）：")
        for cat, v, src in missing:
            print(f"  [{cat}] {v}    ← {src}")
    else:
        print("缺词条：无")

    if unmapped:
        print(f"\n未登记的 schema 枚举 {len(unmapped)} 处（请补 ENUM_TO_CAT）：")
        for path in sorted(unmapped):
            print(f"  $defs/{path}")

    if unchecked:
        print(f"\n无 schema 值域来源的类别 {len(unchecked)} 个（来源在文档侧，人工核对）：")
        print("  " + "、".join(f"{c}({len(cats[c].get('terms') or {})})" for c in unchecked))

    if nondesc:
        print(f"\n缺栏目描述 desc 的类别 {len(nondesc)} 个（每类必须写「这一维是什么」，不是出处）：")
        print("  " + "、".join(nondesc))

    print("-" * 60)
    if missing or unmapped or nondesc:
        if nondesc:
            print(f"处置：给上述类别补 desc 字段（站点渲染在栏目标题下，术语词典页可见）")
        if missing:
            print(f"处置：补齐 glossary 词条（先按编辑纪律确认 schema/SCHEMA.md 已登记）")
        if unmapped:
            print(f"处置：把上述 $defs 路径登记进本脚本 ENUM_TO_CAT")
        return 1
    print(f"词典与值域一致：{len(cats)} 类全部有词条与 desc")
    return 0


if __name__ == "__main__":
    sys.exit(main())
