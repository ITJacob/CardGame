#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
选靶模型二次重构 · 数据迁移引擎（Scope 几何化 + Anchor 净化 + 删 laneRef）
—————————————————————————————————————————————————————————————————————————
对应 docs/meta/选靶重构设计.md §10（推翻 Path A / 2026-09-20 裁定）。

四决策（用户 2026-10-03 拍板）：
  1. 全量迁移（撤销 Path A 的 laneRef 写法）
  2. scope 命名 front_n / behind_n / diamond_n
  3. 不引入 cross_lanes（跨路群体并入 board）
  4. pickCount 取满用字符串哨兵 'all'

战场拓扑（§10.0，关键订正）：上下两路、每路敌我各 4 格头对头向中线塌陷；
index 越小越近中线。几何锚点落在「被施法一侧」——faction:enemy → enemy_front
（敌方同路排首 i=0），faction:ally/self → self（我方施法者）。

迁移范围：仅卡的 unitRequest 形态对象（父键为 request / target 的候选池请求——
即 target.request、effects.*.request、secondaryTargets.*.request）。
**不含** effect 级 `{"type":"target_override",...}`（走 effTargetOverride，anchor 为自由字符串）
与 statusDef behaviorModifiers（独立结构），二者不在此模型枚举约束内，保留原值。

迁移规则（仅补/改 unitRequest 维，不动 effect 数值；conversionNotes 留痕；幂等）：
  · 删除 request.laneRef 字段（几何改由 scope 承载）
  · scope:all + laneRef:same_lane     → scope:whole_lane  + pickCount:'all'（整路）
  · scope:all + laneRef:(all_lanes|cross_lane) → scope:board + pickCount:'all'（群体/全场）
  · scope:all（无 laneRef）           → scope:board + pickCount:'all'
  · scope:single  → 删 scope + 删 anchor:front_line（回落默认 whole_lane+pick1，锚点按 faction 推导；行为不变）
  · scope:none    → 保留 scope:'none'
  · anchor:front_line → 删除（默认 sort:index_asc 给最前排）
  · anchor:taunt_source → 删 anchor + faction:enemy + filter.hasStatus:'taunt' + anchor:enemy_front + scope:board + pickCount:1
  · anchor:any_lowest_hp → 删 anchor + sort:hp_asc + pickCount:1
  · anchor:first_empty   → 删 anchor + faction:any(若空) + filter.emptySlot:true + anchor:enemy_front + scope:board + pickCount:1
  · anchor:empty_ally_slot → 删 anchor + faction:ally + filter.emptySlot:true + anchor:self + scope:board + pickCount:1
  · anchor:spawned_unit / self / caster / last_dead_ally / fixed_cell / enemy_front / specific_unit(<id>) → 保留（新模型合法，含任意字符串）
  · anchor:manual / cross_same_index / front_of_self / behind_self / nearest_any / absolute / index_asc_same_faction / self_faction_hp_desc → 删除并打 frameworkFlags（理论无数据，保险）
  · 其他未知字符串 anchor（如 unit_doppelganger）→ schema 放行，打 frameworkFlags 留痕（不删）
  · sort / filter / spread / selectionMode → 原样保留

用法：
  python targeting_refit_v2.py            # 实跑
  python targeting_refit_v2.py --dry      # 干跑核对
  python targeting_refit_v2.py --list     # 仅列出将被改动的卡
"""
import json, glob, os, sys

ROOT = 'docs/json'
OUT_JSON = 'docs/analysis/targeting_refit_v2_report.json'
DRY = '--dry' in sys.argv
LIST_ONLY = '--list' in sys.argv

OLD_ANCHOR_REMOVED = {  # 这些旧 anchor 在新模型无对应，直接删并标记
    'manual', 'cross_same_index', 'front_of_self', 'behind_self',
    'nearest_any', 'absolute', 'index_asc_same_faction', 'self_faction_hp_desc',
}
VALID_NEW_ANCHOR = {'self', 'caster', 'enemy_front', 'specific_unit', 'spawned_unit',
                    'last_dead_ally', 'fixed_cell'}


def norm_notes(c):
    n = c.get('conversionNotes')
    if isinstance(n, list):
        return ' ｜ '.join(x for x in n if x)
    return n or ''


def mark_flag(c, code, note):
    flags = c.get('frameworkFlags')
    if not isinstance(flags, list):
        flags = []
    if not any(isinstance(x, dict) and x.get('code') == code for x in flags):
        flags.append({'code': code, 'note': note, 'landed': False})
    c['frameworkFlags'] = flags


def migrate_request(req, c):
    """原地改写一个 unitRequest dict；返回 (changed, changes)。"""
    changes = []
    new = req
    fac = new.get('faction')
    sc = new.get('scope')
    lr = new.get('laneRef')
    an = new.get('anchor')

    # 1) 删 laneRef
    if 'laneRef' in new:
        changes.append(f'删 laneRef={lr}')
        del new['laneRef']

    # 2) scope 映射
    if sc == 'all':
        if lr == 'same_lane':
            new['scope'] = 'whole_lane'; new['pickCount'] = 'all'
            changes.append('scope:all+same_lane → whole_lane+pickCount:all（整路）')
        else:  # all_lanes / cross_lane / auto / 无
            new['scope'] = 'board'; new['pickCount'] = 'all'
            changes.append(f'scope:all(+{lr}) → board+pickCount:all（群体/全场）')
    elif sc == 'single':
        if 'scope' in new:
            del new['scope']; changes.append('删 scope:single（回落默认 whole_lane+pick1）')
        if new.get('anchor') == 'front_line':
            del new['anchor']; changes.append('删 anchor:front_line（默认最前排）')
    elif sc == 'none':
        new['scope'] = 'none'
        changes.append('scope:none 保留')
    # sc 缺失 → 不动（默认）

    # 3) anchor 净化
    an = new.get('anchor')
    if an == 'front_line':
        del new['anchor']; changes.append('删 anchor:front_line（默认最前排）')
    elif an == 'taunt_source':
        del new['anchor']
        new['anchor'] = 'enemy_front'
        new['scope'] = new.get('scope') or 'board'
        new['faction'] = new.get('faction') or 'enemy'
        new['pickCount'] = new.get('pickCount') or 1
        filt = dict(new.get('filter') or {})
        if 'taunt' not in json.dumps(filt, ensure_ascii=False):
            filt['hasStatus'] = filt.get('hasStatus') or 'taunt'
        new['filter'] = filt
        changes.append('anchor:taunt_source → faction:enemy+filter.hasStatus:taunt+anchor:enemy_front+scope:board（顶替嘲讽者）')
    elif an == 'any_lowest_hp':
        del new['anchor']
        new['sort'] = new.get('sort') or 'hp_asc'
        new['pickCount'] = new.get('pickCount') or 1
        changes.append('anchor:any_lowest_hp → sort:hp_asc+pickCount:1（最低血优先）')
    elif an == 'first_empty':
        del new['anchor']
        new['anchor'] = 'enemy_front'
        new['faction'] = new.get('faction') or 'any'
        new['scope'] = new.get('scope') or 'board'
        new['pickCount'] = new.get('pickCount') or 1
        filt = dict(new.get('filter') or {}); filt['emptySlot'] = True
        new['filter'] = filt
        changes.append('anchor:first_empty → faction:any+filter.emptySlot:true+anchor:enemy_front+scope:board（空坐标攻击）')
    elif an == 'empty_ally_slot':
        del new['anchor']
        new['anchor'] = 'self'
        new['faction'] = 'ally'
        new['scope'] = new.get('scope') or 'board'
        new['pickCount'] = new.get('pickCount') or 1
        filt = dict(new.get('filter') or {}); filt['emptySlot'] = True
        new['filter'] = filt
        changes.append('anchor:empty_ally_slot → faction:ally+filter.emptySlot:true+anchor:self+scope:board（己方空格落点）')
    elif an in OLD_ANCHOR_REMOVED:
        del new['anchor']
        changes.append(f'删非法旧 anchor:{an}（打 frameworkFlags）')
        mark_flag(c, f'targeting_v2:removed_anchor:{an}',
                  f'旧 anchor {an} 在 §10 净化后无对应，已删除（其语义由 sort/filter/faction 承载）')
    elif an in VALID_NEW_ANCHOR:
        pass  # 合法，保留
    elif an is not None:
        # 未知字符串 anchor（含 specific_unit(<id>)/unit_doppelganger 等），schema 放行，留痕
        changes.append(f'未知 anchor:{an}（保留并打 frameworkFlags）')
        mark_flag(c, f'targeting_v2:unknown_anchor:{an}',
                  f'未登记 anchor {an}（字符串，schema 放行；建议改 specific_unit(<id>)/fixed_cell 等规范形式）')
    return len(changes) > 0, changes


def collect_requests(node, parent_key, out):
    """递归收集 unitRequest 形态对象：父键为 request / target 的候选池请求。
    排除 effect 级 target_override（父为 list，无 request 父键）。"""
    if isinstance(node, dict):
        keys = set(node.keys())
        if parent_key in ('request', 'target') and 'faction' in keys \
                and (keys & {'scope', 'laneRef', 'anchor', 'spread', 'sort', 'pickCount', 'filter'}):
            out.append(node)
        for k, v in node.items():
            collect_requests(v, k, out)
    elif isinstance(node, list):
        for v in node:
            collect_requests(v, None, out)


def main():
    files = sorted(glob.glob(os.path.join(ROOT, '*.skills.json')))
    stats = {'cards_changed': 0, 'requests_seen': 0, 'laneRef_removed': 0,
             'scope_whole_lane': 0, 'scope_board': 0, 'scope_single_stripped': 0,
             'scope_none': 0, 'anchor_translated': 0, 'anchor_removed_front_line': 0,
             'by_pathway': {}}
    report = []
    for f in files:
        pid = os.path.basename(f).replace('.skills.json', '')
        d = json.load(open(f, encoding='utf-8'))
        dirty = False
        for c in d.get('cards', []):
            reqs = []
            collect_requests(c, None, reqs)
            stats['requests_seen'] += len(reqs)
            card_changes = []
            for req in reqs:
                changed, ch = migrate_request(req, c)
                if not changed:
                    continue
                card_changes.extend(ch)
                stats['laneRef_removed'] += sum('laneRef' in x for x in ch)
                stats['scope_whole_lane'] += sum('whole_lane' in x for x in ch)
                stats['scope_board'] += sum('board' in x for x in ch)
                stats['scope_single_stripped'] += sum('scope:single' in x for x in ch)
                stats['scope_none'] += sum('scope:none' in x for x in ch)
                stats['anchor_translated'] += sum('anchor' in x for x in ch)
                stats['anchor_removed_front_line'] += sum('front_line' in x for x in ch)
            if card_changes:
                stats['cards_changed'] += 1
                stats['by_pathway'][pid] = stats['by_pathway'].get(pid, 0) + 1
                if not DRY and not LIST_ONLY:
                    note = norm_notes(c)
                    c['conversionNotes'] = (note + ' ｜ ' if note else '') + '选靶V2：' + '；'.join(card_changes)
                report.append({'pid': pid, 'id': c['id'], 'name': c.get('name'),
                               'changes': card_changes})
                dirty = True
        if dirty and not DRY and not LIST_ONLY:
            json.dump(d, open(f, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)

    json.dump({'stats': stats, 'cards': report}, open(OUT_JSON, 'w', encoding='utf-8'),
              ensure_ascii=False, indent=2)
    if DRY or LIST_ONLY:
        print(f'[DRY] 将改动 {stats["cards_changed"]} 张卡（扫描到 {stats["requests_seen"]} 个 unitRequest）')
    else:
        print(f'[APPLY] 已改写 {stats["cards_changed"]} 张卡并写回 JSON')
    print('  统计:', json.dumps(stats, ensure_ascii=False))


if __name__ == '__main__':
    main()
