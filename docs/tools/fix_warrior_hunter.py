#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
修复 warrior / hunter 的 target_override 误植（2026-10-03 审计发现的确认级 BUG）

BUG：
  warrior 把 target_override(anchor=self) 注入到「打敌人的进攻卡」上 → 战士打自己。
  hunter  把 target_override(anchor=self_faction_hp_desc / incited) 注入到伤害卡上
          → 伤害误中己方（友军中血量最高者 / 同阵营最高血量者）。

修复（只换签名段，不动数值 / 选靶 / 费用；保留 conversionNotes 留痕）：
  warrior：target_override(anchor=self)  →  modify_targetability 嘲讽（替承真义：把指向同伴的
           攻击揽到自己身上，本卡伤害仍正常打敌方）。与 assassin 已通过的嘲讽写法同形。
  hunter ：target_override(anchor in {self_faction_hp_desc, incited})  →  modify_rule_slot
           团队计价（把这道击杀记进团队账本，友军分润；彻底去掉误伤友军的改指）。
  hunter 的 target_override(anchor in {taunt_source, first_empty}) 是「指向敌人 / 空位」的
           良性改指，不是 BUG，保留不动。

用法：
  python3 docs/tools/fix_warrior_hunter.py [--dry]
"""

import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
PY = sys.executable


def load(p):
    return json.load(open(p, encoding='utf-8'))


def save(p, d):
    with open(p, 'w', encoding='utf-8') as f:
        json.dump(d, f, ensure_ascii=False, indent=2)
        f.write('\n')


# ---- 递归替换 effects 里匹配的 target_override 节点 ----
def replace_nodes(o, pred, factory, changed):
    if isinstance(o, dict):
        if o.get('type') == 'target_override' and pred(o):
            changed.append(o)
            return factory(o)
        out = {}
        for k, v in o.items():
            out[k] = replace_nodes(v, pred, factory, changed)
        return out
    if isinstance(o, list):
        return [replace_nodes(v, pred, factory, changed) for v in o]
    return o


# ---- warrior：嘲讽（替承） ----
def warrior_taunt(_node):
    return {
        'type': 'modify_targetability',
        'target': 'self',
        'untargetable': True,
        'direction': 'enemy_targeted',
        'duration': 3,
        'note': '替承：把指向同伴的攻击揽到自己身上（不闪不避，本卡伤害仍正常落敌）',
    }


WARRIOR_SFX = {
    '；替承：这一击改落到守者身上（不闪不避）。':
        '；替承：把指向同伴的攻击揽到自己身上（不闪不避）。',
    '；张开守护：把指向同伴的东西揽过来。':
        '；替承：把指向同伴的攻击揽到自己身上（不闪不避）。',
    '；守者先受，才有余裕缝合。':
        '；替承：把指向同伴的攻击揽到自己身上（不闪不避）。',
    '；替承之后再清理。':
        '；替承：把指向同伴的攻击揽到自己身上（不闪不避）。',
}


# ---- hunter：团队计价（改指友军的误伤 BUG 修复） ----
def hunter_bounty(_node):
    return {
        'type': 'modify_rule_slot',
        'slot': 1,
        'field': 'punish',
        'mode': 'append',
        'value': {
            'type': 'modify_resource',
            'resource': 'energy',
            'value': 1,
            'mode': 'delta',
            'target': 'all_allies',
        },
        'note': '团队计价：把这道击杀记进团队账本，友军分润 1 能量（修复误伤友军的改指）',
    }


HUNTER_SFX = {
    '；指挥调防：这一击改指友军中血最厚者。':
        '；团队计价：集众记账，友军分润（不再误伤友军）。',
}


def fix_warrior(dry):
    p = os.path.join(ROOT, 'docs', 'json', 'warrior.skills.json')
    d = load(p)
    changed = []
    for c in d['cards']:
        before = len(changed)
        c['effects'] = replace_nodes(
            c.get('effects'),
            lambda n: n.get('anchor') == 'self',
            warrior_taunt,
            changed,
        )
        if len(changed) > before:
            # 修正 describe 后缀（玩家可读文本须与机制一致）
            desc = c.get('describe') or ''
            for wrong, right in WARRIOR_SFX.items():
                if desc.endswith(wrong):
                    desc = desc[: -len(wrong)] + right
                    c['describe'] = desc
                    break
            old = c.get('conversionNotes', '')
            if isinstance(old, list):
                old = ' ｜ '.join(str(x) for x in old)
            c['conversionNotes'] = (old + ' ｜ ' if old else '') + \
                '2026-10-03 审计修复：target_override(self)→modify_targetability 嘲讽（替承真义）'
    if not dry:
        save(p, d)
    return len(changed)


def fix_hunter(dry):
    p = os.path.join(ROOT, 'docs', 'json', 'hunter.skills.json')
    d = load(p)
    changed = []
    friendly = {'self_faction_hp_desc', 'incited'}

    def pred(n):
        return n.get('anchor') in friendly

    for c in d['cards']:
        before = len(changed)
        c['effects'] = replace_nodes(c.get('effects'), pred, hunter_bounty, changed)
        if len(changed) > before:
            desc = c.get('describe') or ''
            for wrong, right in HUNTER_SFX.items():
                if desc.endswith(wrong):
                    desc = desc[: -len(wrong)] + right
                    c['describe'] = desc
                    break
            old = c.get('conversionNotes', '')
            if isinstance(old, list):
                old = ' ｜ '.join(str(x) for x in old)
            c['conversionNotes'] = (old + ' ｜ ' if old else '') + \
                '2026-10-03 审计修复：target_override(友军/同阵营)→modify_rule_slot 团队计价（去误伤）'
    if not dry:
        save(p, d)
    return len(changed)


def count_override(pid, anchor=None):
    d = load(os.path.join(ROOT, 'docs', 'json', f'{pid}.skills.json'))
    n = 0
    for c in d['cards']:
        def walk(o):
            nonlocal n
            if isinstance(o, dict):
                if o.get('type') == 'target_override' and (anchor is None or o.get('anchor') == anchor):
                    n += 1
                for v in o.values():
                    walk(v)
            elif isinstance(o, list):
                for v in o:
                    walk(v)
        walk(c.get('effects'))
    return n


def main():
    dry = '--dry' in sys.argv
    print('== dry run ==' if dry else '== apply ==')
    w = fix_warrior(dry)
    h = fix_hunter(dry)
    print(f'warrior: 替换 {w} 个 target_override(self)')
    print(f'hunter : 替换 {h} 个 target_override(友军/同阵营)')
    print('--- 残留（应为 0 或非友军良性改指）---')
    print('warrior  剩余 target_override:', count_override('warrior'))
    print('hunter   剩余 target_override(self_faction_hp_desc):', count_override('hunter', 'self_faction_hp_desc'))
    print('hunter   剩余 target_override(incited):', count_override('hunter', 'incited'))
    print('hunter   剩余 target_override(taunt_source/first_empty, 良性保留):',
          count_override('hunter', 'taunt_source') + count_override('hunter', 'first_empty'))


if __name__ == '__main__':
    main()
