# -*- coding: utf-8 -*-
"""旧拼写 / 重复编码 lint（只读，不修改数据）。

用法:
    python docs/tools/lint_deprecated.py

检查 2026-10-17 收口后已废弃的写法，防止回潮：
- 条件伪谓词：status_category / remove_reason / target_faction_is / unit_faction
- modifier 旧键：targetOverride / energyCostMul / energyCostAdd / castTimeSet /
  status_duration_bonus / onDealDamageBonus / pierceConceal / detect /
  concealReveal / reveal / concealInvalidForCaster
- 结构旧编码：modify_resource.op、swap 缺 between、spawn kind:zone / def、
  spawn.template 指向已登记 unitDef、domainGrant 重复 Def 字段
- hp_percent 的旧 op/value 写法

退出码 1 = 发现旧写法；0 = 干净。
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
JSON_DIR = ROOT / "docs" / "json"

DEPRECATED_CONDITIONS = {
    "status_category": "has_category",
    "remove_reason": "on_remove trigger.reason",
    "target_faction_is": "faction_is",
    "unit_faction": "faction_is / zoneEffect{side,payload}",
}

DEPRECATED_MODIFIERS = {
    "targetOverride": "BehaviorModifier op:target_override",
    "energyCostMul": "BehaviorModifier op:energy_cost_mul",
    "energyCostAdd": "BehaviorModifier op:energy_cost_add",
    "castTimeSet": "BehaviorModifier op:cast_time_set",
    "status_duration_bonus": "durationModifier",
    "onDealDamageBonus": "on_deal_damage trigger",
    "pierceConceal": "see_through",
    "detect": "see_through",
    "concealReveal": "see_through",
    "reveal": "see_through（作为 modifier 键时）",
    "concealInvalidForCaster": "concealPiercedForCaster",
}

GRANT_DEF_FIELDS = {"tier", "durationUnit", "dispelable", "rulePatches"}

findings: list[str] = []
unit_ids: set[str] = set()


def load(path: Path):
    with path.open(encoding="utf-8") as f:
        return json.load(f)


def add(path: Path, where: str, msg: str) -> None:
    findings.append(f"{path.relative_to(ROOT)}:{where}: {msg}")


def check_modifiers(path: Path, where: str, mods) -> None:
    if isinstance(mods, dict):
        for key in mods:
            if key in DEPRECATED_MODIFIERS:
                add(path, where, f"modifier '{key}' 已废弃 → {DEPRECATED_MODIFIERS[key]}")
    elif isinstance(mods, list):
        for item in mods:
            key = item if isinstance(item, str) else item.get("kind") if isinstance(item, dict) else None
            if key in DEPRECATED_MODIFIERS:
                add(path, where, f"modifier '{key}' 已废弃 → {DEPRECATED_MODIFIERS[key]}")


def check_condition(path: Path, where: str, cond: dict) -> None:
    kind = cond.get("kind")
    if kind in DEPRECATED_CONDITIONS:
        add(path, where, f"condition '{kind}' 已废弃 → {DEPRECATED_CONDITIONS[kind]}")
    if kind == "hp_percent" and ("op" in cond or "value" in cond):
        add(path, where, "hp_percent 使用旧 op/value，改用 cmp/n")


def walk(path: Path, node, where: str = "", parent_key: str | None = None, in_condition: bool = False) -> None:
    if isinstance(node, dict):
        if parent_key == "conditions":
            in_condition = True
        kind = node.get("kind")
        if in_condition and isinstance(kind, str):
            check_condition(path, where, node)

        t = node.get("type")
        if t == "modify_resource":
            if "op" in node:
                add(path, where, "modify_resource.op 已废弃；swap 统一 mode:swap + between")
            if node.get("mode") == "swap" and "between" not in node:
                add(path, where, "modify_resource(mode:swap) 缺 between")
        if t == "spawn":
            if node.get("kind") == "zone":
                add(path, where, "spawn kind:zone 已废弃；区域统一 consumption:zone + zone")
            if "def" in node and "zone" not in node:
                add(path, where, "spawn.def 已废弃；区域用 zone，静态单位用 unitId")
            tmpl = node.get("template")
            if isinstance(tmpl, str) and tmpl in unit_ids:
                add(path, where, f"spawn.template 指向已登记 unitDef '{tmpl}'；静态单位改 unitId")

        if "modifiers" in node:
            check_modifiers(path, where + ".modifiers", node["modifiers"])

        tt = node.get("thresholdTrigger")
        if isinstance(tt, dict) and "stacks" in tt:
            add(path, where, "thresholdTrigger 含 stacks；叠层阈值改 stackThreshold")

        grant = node.get("domain")
        if isinstance(grant, dict) and parent_key == "cards":
            dup = sorted(GRANT_DEF_FIELDS & set(grant))
            if dup:
                add(path, where, f"domainGrant 重复 Def 字段 {dup}；只写实例覆写")

        for key, value in node.items():
            child_in_cond = in_condition or key == "condition" or parent_key == "conditions"
            walk(path, value, f"{where}/{key}", key, child_in_cond)
    elif isinstance(node, list):
        for i, value in enumerate(node):
            walk(path, value, f"{where}[{i}]", parent_key, in_condition)


def main() -> int:
    files = sorted(JSON_DIR.glob("*.skills.json"))
    for path in files:
        data = load(path)
        for unit in data.get("unitDefs", []):
            if isinstance(unit, dict) and isinstance(unit.get("id"), str):
                unit_ids.add(unit["id"])

    for path in sorted(JSON_DIR.glob("*.json")):
        if path.name == "manifest.json":
            continue
        data = load(path)
        if "cards" in data:
            for card in data["cards"]:
                walk(path, card, f"card:{card.get('id', '?')}", "cards")
            for zone in data.get("zoneDefs", []):
                walk(path, zone, f"zone:{zone.get('id', '?')}")
            for domain in data.get("domainDefs", []):
                walk(path, domain, f"domain:{domain.get('id', '?')}")
            for unit in data.get("unitDefs", []):
                walk(path, unit, f"unit:{unit.get('id', '?')}")
        for status in data.get("statusDefs", []):
            walk(path, status, f"status:{status.get('id', '?')}")

    if findings:
        for f in findings:
            print(f)
        print(f"\nFAIL：{len(findings)} 处旧拼写/重复编码")
        return 1
    print("OK：未发现旧拼写/重复编码")
    return 0


if __name__ == "__main__":
    sys.exit(main())
