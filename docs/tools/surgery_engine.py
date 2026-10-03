#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
骨架手术引擎（阶段二·五 全途径推广）

背景：阶段二的 22 批都是「加法」——每途径加 4~8 张签名卡，但全库 77% 的存量卡
仍是同一套通用骨架（mount_status / damage / modify_stat），签名增量撼动不了同构底座。
本引擎做的是「换形」：数值基本不动，AST 形状换成该途径自己的写法。

用法：
    python3 docs/tools/surgery_engine.py prisoner assassin      # 对指定途径执行
    python3 docs/tools/surgery_engine.py --dry prisoner         # 只预览不落盘
    python3 docs/tools/surgery_engine.py --list                 # 列出已注册配方

原理：
    1. 筛出「纯通用骨架卡」——卡上所有 effect 原语都属于
       {damage, mount_status, modify_stat, modify_resource, heal, dispel}；
    2. 按语义角色分类（dmg / debuff / buff / heal / dispel / stat / res）；
    3. 查该途径的句式配方，取对应角色的「签名段」注入卡面（append，可指定 pre）；
    4. 同步补一句 describe 后缀，并在 conversionNotes 留痕。

纪律：
    - 只改形状不改数值：不调 value / duration / cost；
    - 每卡只注入一个角色的段，避免灌水；
    - 优先启用该途径独占或低频原语（指纹距离的主要贡献项）；
    - 改完必须过四门禁：validate.py / validate_schema.py / check_enum_sync.py / check_glossary.py
"""

import json
import os
import sys
import collections

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, HERE)
import score  # noqa: E402

GEN = {'damage', 'mount_status', 'modify_stat', 'modify_resource', 'heal', 'dispel'}
SELFY = {'self', 'caster', 'all_allies', 'allies_except_self', 'all', 'board'}


# ---------------------------------------------------------------- 基础遍历

def nodes(o, out=None):
    """收集卡面里所有带 type 的 effect 节点（穿透 op: sequence / if）"""
    if out is None:
        out = []
    if isinstance(o, dict):
        if 'op' in o:
            for k in ('steps', 'then', 'else', 'effects'):
                if k in o:
                    nodes(o[k], out)
            return out
        if isinstance(o.get('type'), str):
            out.append(o)
            for v in o.values():
                if isinstance(v, (dict, list)):
                    nodes(v, out)
        else:
            for v in o.values():
                if isinstance(v, (dict, list)):
                    nodes(v, out)
    elif isinstance(o, list):
        for v in o:
            nodes(v, out)
    return out


def is_generic(c):
    ts = score.card_effect_types(c)
    return bool(ts) and set(ts) <= GEN


def ctx_of(c):
    ns = nodes(c.get('effects'))
    return {
        'nodes': ns,
        'types': {n.get('type') for n in ns},
        'seq': c.get('sequence'),
        'axis': c.get('axis'),
        'kind': c.get('kind'),
        'debuffs': [n['statusId'] for n in ns
                    if n.get('type') == 'mount_status' and n.get('target') not in SELFY],
        'buffs': [n['statusId'] for n in ns
                  if n.get('type') == 'mount_status' and n.get('target') in SELFY],
        'any_status': [n['statusId'] for n in ns if n.get('type') == 'mount_status'],
    }


def role_of(c):
    x = ctx_of(c)
    ts = x['types']
    mt = [n.get('target') for n in x['nodes'] if n.get('type') == 'mount_status']
    if mt and all(t is None for t in mt):
        # 没写 target 时靠 describe 判自身还是对敌
        desc = c.get('describe') or ''
        mt = ['self'] if any(k in desc for k in ('自身', '自己', '自己获得', '自身获得',
                                                 '我方', '全体友军', '友军')) else ['target']
    isbuff = bool(mt) and all(t in SELFY for t in mt)
    if 'damage' in ts:
        return 'dmg'
    if 'mount_status' in ts:
        return 'buff' if isbuff else 'debuff'
    if 'heal' in ts:
        return 'heal'
    if 'dispel' in ts:
        return 'dispel'
    if 'modify_stat' in ts:
        return 'stat'
    if 'modify_resource' in ts:
        return 'res'
    return None


# ---------------------------------------------------------------- 段构造器

def _e(d, **kw):
    e = dict(d)
    e.update({k: v for k, v in kw.items() if v is not None})
    return e


def mstat(sid, target='target', **kw):
    return _e({'type': 'modify_status', 'statusId': sid, 'target': target}, **kw)


def mres(resource, value, target='self', mode='delta', **kw):
    return _e({'type': 'modify_resource', 'resource': resource, 'value': value,
               'mode': mode, 'target': target}, **kw)


def tst(**kw):
    return _e({'type': 'transfer_status'}, **kw)


def tloc(op, duration=1, target='target', **kw):
    return _e({'type': 'translocate', 'op': op, 'duration': duration, 'target': target}, **kw)


def mtarget(target='self', **kw):
    return _e({'type': 'modify_targetability', 'target': target}, **kw)


def lum(value, **kw):
    return _e({'type': 'set_luminance', 'value': value}, **kw)


def clock(ticks=1, **kw):
    return _e({'type': 'advance_clock', 'ticks': ticks}, **kw)


def ctrl(target='target', duration=1, **kw):
    return _e({'type': 'take_control', 'target': target, 'duration': duration}, **kw)


def over(anchor='any_lowest_hp', **kw):
    return _e({'type': 'target_override', 'anchor': anchor}, **kw)


def rev(target='all_enemies', scope='to_source', **kw):
    return _e({'type': 'reveal', 'target': target, 'scope': scope}, **kw)


def snap(fields, target='self', **kw):
    return _e({'type': 'snapshot', 'fields': fields, 'target': target}, **kw)


def drn(resource='hp', value=1, **kw):
    return _e({'type': 'drain', 'resource': resource, 'value': value}, **kw)


def spw(**kw):
    return _e({'type': 'spawn'}, **kw)


def mskill(sel='self_last', of=None, target=None, **kw):
    ref = {'selector': sel}
    if of:
        ref['ofSkill'] = of
    if target:
        ref['target'] = target
    return _e({'type': 'modify_skill', 'skillRef': ref}, **kw)


def wslot(slot=1, field='punish', value=None, **kw):
    return _e({'type': 'write_rule_slot', 'slot': slot, 'field': field,
               'value': value if value is not None else {'rule': 'custom'}}, **kw)


def mv(op, target='target', **kw):
    return _e({'type': 'move', 'op': op, 'target': target}, **kw)


def mrslot(slot=1, field='punish', mode='append', **kw):
    return _e({'type': 'modify_rule_slot', 'slot': slot, 'field': field, 'mode': mode}, **kw)


def imm(target='self', **kw):
    return _e({'type': 'grant_immunity', 'target': target}, **kw)


def ms(**kw):
    return _e({'type': 'modify_stat'}, **kw)


def cond(kind, **kw):
    return _e({'type': 'damage', 'value': 0, 'element': 'none',
               'condition': dict(kind=kind, **kw)}, )


def iff(c, then, els=None):
    e = {'op': 'if', 'condition': c, 'then': then}
    if els:
        e['else'] = els
    return e


def seq(*steps, **kw):
    e = {'op': 'sequence', 'steps': list(steps)}
    e.update(kw)
    return e


# ---------------------------------------------------------------- 途径配方
# 每个配方：tag（句式名）/ sfx（describe 后缀）/ fn（角色 → 签名段）
# 段尽量用该途径独占或低频原语，避免新的同质化。

RECIPES = {}

# ============ 囚犯 prisoner（被缚者）——诅咒反照 ============
RECIPES['prisoner'] = {
    'tag': '诅咒反照',
    'sfx': {
        'debuff': '；咒出必自承——同一道诅咒会以半份强度反照回施术者身上。',
        'dmg': '；落在身上的诅咒会继续长大一层。',
        'buff': '；每撬动一次异类之力，迷失值 +1，并顺势把自身一道诅咒转嫁出去。',
        'stat': '；异类化的每一步都记在迷失账上，并顺势转嫁一道诅咒。',
        'heal': '；把自己的诅咒转嫁出去，伤口才合得上。',
        'dispel': '；顺手剪断自身的一道诅咒链接。',
        'res': '；异类化：迷失值 +1，并顺势转嫁一道诅咒。',
    },
    'fn': {
        'debuff': lambda c, x: [tst(mode='copy', **{'from': {'side': 'target'}}, to='self', count=1,
                                    stacksMul=0.5,
                                    note='诅咒反照：咒出必自承半份（异类之王的代价，不豁免）')],
        'dmg': lambda c, x: [mstat(x['debuffs'][0] if x['debuffs'] else 'mind_taint', 'target',
                                   addDuration=5,
                                   note='诅咒是会长大的：这道咒又深了一层')],
        'buff': lambda c, x: [mres('lost', 1, 'self',
                                   note='异类化：撬动异类之力，迷失值 +1'),
                              tst(mode='copy', **{'from': {'side': 'self'}}, to='target',
                                  statusesFrom='self', count=1,
                                  filter={'hasCategory': ['debuff']}, fallback=[],
                                  note='异类的馈赠：自身一道诅咒顺势转嫁出去')],
        'stat': lambda c, x: [mres('lost', 1, 'self', note='异类化：迷失值 +1'),
                              tst(mode='copy', **{'from': {'side': 'self'}}, to='target',
                                  statusesFrom='self', count=1,
                                  filter={'hasCategory': ['debuff']}, fallback=[],
                                  note='异类的馈赠：自身一道诅咒顺势转嫁出去')],
        'heal': lambda c, x: [tst(mode='copy', **{'from': {'side': 'self'}}, to='target', count=1,
                                  filter={'hasCategory': ['debuff']},
                                  note='诅咒转嫁：自身所受诅咒原样奉还')],
        'dispel': lambda c, x: [mstat('curse_link', 'self', setDuration=0,
                                      note='剪断自身一道诅咒链接')],
        'res': lambda c, x: [mres('lost', 1, 'self', note='异类化：迷失值 +1'),
                             tst(mode='copy', **{'from': {'side': 'self'}}, to='target',
                                 statusesFrom='self', count=1,
                                 filter={'hasCategory': ['debuff']}, fallback=[],
                                 note='异类的馈赠：自身一道诅咒顺势转嫁出去')],
    },
}

# ============ 刺客 assassin（魔女）——镜形状三选一 ============
RECIPES['assassin'] = {
    'tag': '镜形状',
    'sfx': {
        'dmg': '；出手即把目标拽进镜面一瞬，再原样放回。',
        'debuff': '；得手后留下替身承接指向。',
        'buff': '；增益自镜中取用——藏入镜面，再踏出。',
        'stat': '；身形在镜中一隐一现。',
        'heal': '；以替身承伤，真身退入镜后。',
        'dispel': '；从镜中脱身，顺手抹去痕迹。',
        'res': '；镜面开合之间完成换位。',
    },
    'fn': {
        'dmg': lambda c, x: [tloc('pull_into', duration=1, target='target',
                                  note='镜中拉入：目标被拽入镜面一瞬（穿梭形状）'),
                             mres('lost', 1, 'self', note='镜穿梭的租金：迷失值 +1')],
        'debuff': lambda c, x: [mtarget('self', untargetable=True, duration=3,
                                        direction='enemy_targeted',
                                        note='镜替身：以替身承接下来的指向')],
        'buff': lambda c, x: [tloc('banish', duration=1, target='self',
                                   note='镜像放逐：短暂藏入镜中再踏出（禁裸站桩 buff）'),
                              mres('lost', 1, 'self', note='镜穿梭的租金：迷失值 +1')],
        'stat': lambda c, x: [tloc('banish', duration=1, target='self',
                                   note='镜中一隐：身形短暂脱离战场'),
                              mres('lost', 1, 'self', note='镜穿梭的租金：迷失值 +1')],
        'heal': lambda c, x: [mtarget('self', untargetable=True, duration=3,
                                      note='替身承伤：真身退入镜后')],
        'dispel': lambda c, x: [tloc('banish', duration=1, target='self',
                                     note='从镜中脱身'),
                                mres('lost', 1, 'self', note='镜穿梭的租金：迷失值 +1')],
        'res': lambda c, x: [tloc('banish', duration=1, target='self',
                                  note='镜面开合：换位'),
                             mres('lost', 1, 'self', note='镜穿梭的租金：迷失值 +1')],
    },
}

# ============ 不眠者 sleepless（黑暗）——相位形状 ============
RECIPES['sleepless'] = {
    'tag': '相位形状',
    'sfx': {
        'dmg': '；这一击把战场往深夜又推了一格。',
        'debuff': '；黑暗加深：光照度再降一档。',
        'buff': '；增益以夜色为凭——光照度压暗一档。',
        'stat': '；夜越长，这份力量越实。',
        'heal': '；在夜色的掩护下合伤。',
        'dispel': '；驱散黑暗的同时，光照回升一档。',
        'res': '；时间被往深夜推了一格。',
    },
    'fn': {
        'dmg': lambda c, x: [clock(1, note='拖入深夜：时间推进一格（相位驱动）')],
        'debuff': lambda c, x: [lum(2, duration=15, dispelable=False,
                                    note='黑暗加深：写战场覆写层为暗夜档（≤2，暗夜主场不可驱散）')],
        'buff': lambda c, x: [lum(2, duration=15, dispelable=False,
                                  note='夜幕：写战场覆写层为暗夜档，增益以夜色为凭')],
        'stat': lambda c, x: [lum(2, duration=15, dispelable=False, note='夜色为凭：压至暗夜档')],
        'heal': lambda c, x: [lum(2, duration=15, dispelable=False, note='夜色掩护：压至暗夜档')],
        'dispel': lambda c, x: [lum(8, duration=10, dispelable=False,
                                    note='驱散黑暗的代价：战场覆写层被推至白昼档（≥8，强段必配正午弱项）')],
        'res': lambda c, x: [clock(1, note='推进一格时间')],
    },
}

# ============ 偷盗者 thief（错误）——持有形状 ============
RECIPES['thief'] = {
    'tag': '持有形状',
    'sfx': {
        'dmg': '；这一击改指最虚的那个——偷袭不挑硬骨头。',
        'debuff': '；短暂借身操控，片刻即归还。',
        'buff': '；增益是借来的：从目标身上抄一份，用完归还。',
        'stat': '；这份力量也是借来的。',
        'heal': '；从别人身上借一点生机。',
        'dispel': '；抹掉的同时把那件东西改名归我。',
        'res': '；目标由我指定——最虚的那个。',
    },
    'fn': {
        'dmg': lambda c, x: [over('any_lowest_hp',
                                  note='偷袭：这一击改指生命百分比最低者（持有即改写指向）')],
        'debuff': lambda c, x: [ctrl('target', 1, actionPolicy='attack_only',
                                     onExpire='revert',
                                     note='短期借身：操控片刻即归还（不走裸眩晕）')],
        'buff': lambda c, x: [tst(mode='copy', **{'from': {'side': 'target'}}, to='self', count=1,
                                  filter={'hasCategory': ['buff']},
                                  note='借来：抄走目标一项增益，有借有还')],
        'stat': lambda c, x: [tst(mode='copy', **{'from': {'side': 'target'}}, to='self', count=1,
                                  filter={'hasCategory': ['buff']}, note='借来的力量')],
        'heal': lambda c, x: [tst(mode='copy', **{'from': {'side': 'target'}}, to='self', count=1,
                                  filter={'hasCategory': ['buff']}, note='借一点生机')],
        'dispel': lambda c, x: [tst(mode='rewrite', **{'from': {'side': 'target'}}, to='self', count=1,
                                    note='把对方的东西直接改名归我')],
        'res': lambda c, x: [over('any_lowest_hp', note='指定最虚者')],
    },
}

# ============ 收尸人 corpse_collector（死神）——死亡过程形状 ============
RECIPES['corpse_collector'] = {
    'tag': '死亡过程',
    'sfx': {
        'dmg': '；若这一击取了性命，亡者当场被扶起为役。',
        'debuff': '；衰败的躯体被抽走一分生机。',
        'buff': '；灵视张开：亡者的位置无所遁形。',
        'stat': '；力量从衰败里榨出来。',
        'heal': '；生机是从别处抽来的。',
        'dispel': '；死亡印记随之加深一层。',
        'res': '；从衰败中汲取一分。',
    },
    'fn': {
        'dmg': lambda c, x: [iff({'kind': 'target_dead'},
                                 [spw(template='killed_unit', unitId='unit_skeleton', kind='undead',
                                      position='tail',
                                      note='击杀即扶起：亡者当场被役使（死亡过程三段链）')])],
        'debuff': lambda c, x: [drn('hp', 1, ratio=0.5, target='target',
                                    note='亡者汲取：从衰败的躯体里抽走一分生机')],
        'buff': lambda c, x: [rev('all_enemies', 'to_source',
                                  note='灵视：亡者与灵体的位置无所遁形')],
        'stat': lambda c, x: [drn('hp', 1, ratio=0.5, target='target',
                                  note='榨取衰败')],
        'heal': lambda c, x: [drn('hp', 1, ratio=0.5, target='target',
                                  note='生机取自他处')],
        'dispel': lambda c, x: [mstat('death_sentence', 'target', addDuration=5,
                                      stacksDelta=1,
                                      note='死亡印记加深（向死亡而非即死）')],
        'res': lambda c, x: [drn('hp', 1, ratio=0.5, target='target',
                                 note='自衰败中汲取')],
    },
}


# ============ 罪犯 criminal（深渊）——欲望池形状 ============
# 恶欲值只涨于「放纵」；深渊是向下的力，所以每一下都在拉扯站位
RECIPES['criminal'] = {
    'tag': '欲望池',
    'sfx': {
        'dmg': '；伤口浇灌欲望，深渊顺势把人往下拽。',
        'debuff': '；欲望随伤害上涨，对方被拖近一步。',
        'buff': '；放纵自身：欲壑 +1，身体被欲望推着往前扑。',
        'stat': '；放纵自身：欲壑 +1，身体被欲望推着往前扑。',
        'heal': '；把猎物拽近，从它身上取回一点。',
        'dispel': '；深渊把碍事的东西推开。',
        'res': '；放纵：欲壑 +1。',
    },
    'fn': {
        'dmg': lambda c, x: [mres('lust', 1, 'target', note='放纵：受伤也在浇灌欲望'),
                             mv('pull_forward', target='target', note='深渊拖拽（向下的力）')],
        'debuff': lambda c, x: [mres('lust', 1, 'target', note='放纵：欲望随腐朽上涨'),
                                mv('pull_forward', target='target', note='深渊拖拽')],
        'buff': lambda c, x: [mres('lust', 1, 'self', note='放纵自身：欲壑 +1'),
                              mv('charge_forward', target='self', note='扑食：欲望驱动身体前压')],
        'stat': lambda c, x: [mres('lust', 1, 'self', note='放纵自身：欲壑 +1'),
                              mv('charge_forward', target='self', note='扑食：欲望驱动身体前压')],
        'heal': lambda c, x: [mv('pull_forward', target='target', note='把猎物拽近'),
                              mres('lust', 1, 'self', note='放纵：欲壑 +1')],
        'dispel': lambda c, x: [mv('push_back', target='target', note='深渊把碍事的东西推开'),
                                mres('lust', 1, 'target', note='放纵：欲壑 +1')],
        'res': lambda c, x: [mres('lust', 1, 'self', note='放纵：欲壑 +1'),
                             mv('charge_forward', target='self', note='扑食前压')],
    },
}

# ============ 观众 spectator（空想家）——位格前提形状 ============
# 一切以「先看穿」为前提：)temporary 名称持ち優先，其次把话写成规则
def _spectator_dmg(c, x):
    sid = (x['debuffs'] or x['any_status'] or [None])[0]
    if sid:
        return [mstat(sid, 'target', dispelableOverride=True,
                      note='看穿：在你眼里，它的依凭不过是一层薄纸（位格洞察的副产物）')]
    return [wslot(slot=1, field='trigger', value={'rule': 'rank_gap>=2'},
                  overwrite=False,
                  note='书写成真（无可读状态时）：把位格差写进规则槽的触发条件')]


RECIPES['spectator'] = {
    'tag': '位格前提',
    'sfx': {
        'dmg': '；先看穿再出手——目标的依凭自此薄如一层纸。',
        'debuff': '；看穿之后才谈动摇。',
        'buff': '；凡有言必被知：把一句话写进规则的作用域。',
        'stat': '；凡有言必被知：把一句话写进规则的作用域。',
        'heal': '；看穿它的强处，才有余裕缝合自己。',
        'dispel': '；看穿即抹去。',
        'res': '；写下一句话，让它成为规则的一部分。',
    },
    'fn': {
        'dmg': _spectator_dmg,
        'debuff': _spectator_dmg,
        'buff': lambda c, x: [wslot(slot=2, field='scope', value={'rank': 'self'},
                                    note='凡有言必被知：把一句话写进规则作用域（想象具现）')],
        'stat': lambda c, x: [wslot(slot=2, field='scope', value={'rank': 'self'},
                                    note='凡有言必被知：写进规则作用域')],
        'heal': _spectator_dmg,
        'dispel': _spectator_dmg,
        'res': lambda c, x: [wslot(slot=2, field='scope', value={'rank': 'self'},
                                   note='写下一句话，让它成为规则的一部分')],
    },
}

# ============ 阅读者 reader（白塔）——先解析后放大 ============
# 输出先 reveal/snapshot 解析，增益走「模仿习得」折扣
RECIPES['reader'] = {
    'tag': '先解析后放大',
    'sfx': {
        'dmg': '；先读透再落笔。',
        'debuff': '；先把它的状态抄录下来，再谈动摇。',
        'buff': '；模仿习得：抄来的招式使起来更省力。',
        'stat': '；模仿习得：下一式少读一段。',
        'heal': '；先读数，再缝合。',
        'dispel': '；先看清，再抹去。',
        'res': '；模仿习得：下一式更省力。',
    },
    'fn': {
        'dmg': lambda c, x: {'pre': [rev('target', 'to_source',
                                         note='先解析：读透目标的底牌，再谈数值')]},
        'debuff': lambda c, x: {'pre': [snap(['hp', 'pools'], 'target',
                                             note='先解析：抄录目标当前状态')]},
        'buff': lambda c, x: [mskill('self_last', costDelta={'energy': -1},
                                     note='模仿习得：抄来的招式使起来更省力')],
        'stat': lambda c, x: [mskill('self_last', costDelta={'energy': -1},
                                     note='模仿习得：下一式少读一段')],
        'heal': lambda c, x: {'pre': [snap(['hp'], 'target', note='先读数，再缝合')]},
        'dispel': lambda c, x: {'pre': [rev('target', 'to_source', note='先看清，再抹去')]},
        'res': lambda c, x: [mskill('self_last', costDelta={'energy': -1},
                                    note='模仿习得：下一式更省力')],
    },
}

# ============ 窥秘人 pryer（隐者）——参照缩放 / 卷轴读条 ============
RECIPES['pryer'] = {
    'tag': '参照缩放',
    'sfx': {
        'dmg': '；卷轴预读：下一式读得更快。',
        'debuff': '；隐秘知识反噬：对方的读条被拉长一截。',
        'buff': '；学识化作本能：下一式转瞬发。',
        'stat': '；学识化作本能：下一式转瞬发。',
        'heal': '；熟读之下，缝合也更快。',
        'dispel': '；对方施法的节奏被学识拖慢。',
        'res': '；学识化作本能：下一式转瞬发。',
    },
    'fn': {
        'dmg': lambda c, x: [mskill('self_last', castTimeDelta=-1,
                                    note='卷轴预读：下一式读得更快（cast_time_set 语义）')],
        'debuff': lambda c, x: [mskill('target', 'active', 'target', castTimeDelta=1,
                                       note='隐秘知识反噬：对方的读条被拉长一截')],
        'buff': lambda c, x: [mskill('self_last', setInstant=True,
                                     note='学识化作本能：下一式转瞬发')],
        'stat': lambda c, x: [mskill('self_last', setInstant=True,
                                     note='学识化作本能：下一式转瞬发')],
        'heal': lambda c, x: [mskill('self_last', castTimeDelta=-1,
                                     note='熟读之下，缝合也更快')],
        'dispel': lambda c, x: [mskill('target', 'active', 'target', castTimeDelta=1,
                                       note='对方施法的节奏被学识拖慢')],
        'res': lambda c, x: [mskill('self_last', setInstant=True,
                                    note='学识化作本能：下一式转瞬发')],
    },
}

# ============ 猎人 hunter（红祭司）——团队计价形状 ============
RECIPES['hunter'] = {
    'tag': '团队计价',
    'sfx': {
        'dmg': '；指挥调防：这一击改指友军中血最厚者。',
        'debuff': '；羞辱调防：目标被迫改指挑衅者。',
        'buff': '；战阵调度：把自己插回阵列尾部。',
        'stat': '；战阵调度：换到更合适的位置。',
        'heal': '；先护住阵中人——治疗优先落在血最厚的同伴身上。',
        'dispel': '；换位换防：挪一步再清理。',
        'res': '；战阵调度：把自己插回阵列尾部。',
    },
    'fn': {
        'dmg': lambda c, x: [over('self_faction_hp_desc',
                                  note='指挥调防：这一击改指友军中生命最高者（集众语义）',
                                  **{'sort': 'hp_desc'})],
        'debuff': lambda c, x: [over('taunt_source', note='羞辱调防：被迫改指挑衅者')],
        'buff': lambda c, x: [mv('insert_tail_cross_lane', target='self',
                                 note='战阵调度：把自己插回阵列尾部')],
        'stat': lambda c, x: [mv('swap_ally', target='self', note='换位换防')],
        'heal': lambda c, x: [over('self_faction_hp_desc', sort='hp_desc',
                                   note='先护住阵中人')],
        'dispel': lambda c, x: [mv('swap_ally', target='self', note='换位换防：挪一步再清理')],
        'res': lambda c, x: [mv('insert_tail_cross_lane', target='self',
                                note='战阵调度：把自己插回阵列尾部')],
    },
}


def rsnap(fields, target='self', **kw):
    return _e({'type': 'restore_snapshot', 'fields': fields, 'target': target}, **kw)


def echo(potency=0.5, **kw):
    return _e({'type': 'echo_last_skill', 'potency': potency}, **kw)


def _chance(pct, note):
    return {'kind': 'chance', 'pct': pct, 'note': note}


# ============ 怪物 monster（命运之轮）——判定形状 ============
# 全库唯一可批量用概率的途径：命运的每一次偏转都是一次投掷
RECIPES['monster'] = {
    'tag': '判定形状',
    'sfx': {
        'dmg': '；命运重掷：半数概率让这次伤害的分毫归位。',
        'debuff': '；厄运偏斜：半数概率把自己刚失去的抹平。',
        'buff': '；命运轮盘转过一格：行动条回到先前的位置。',
        'stat': '；命运轮盘转过一格。',
        'heal': '；伤尚未落定：半数概率把伤口退回去。',
        'dispel': '；轮盘倒转一格。',
        'res': '；命运轮盘转过一格。',
    },
    'fn': {
        'dmg': lambda c, x: [iff(_chance(50, '命运 weighed：本次伤害是否成立'),
                                 [rsnap(['hp'], 'target',
                                         note='命运回溯：让这次伤害的分毫归位（厄运/幸运判定）')])],
        'debuff': lambda c, x: [iff(_chance(50, '厄运偏斜判定'),
                                    [rsnap(['hp'], 'self',
                                            note='厄运偏斜：把自己刚失去的抹平')])],
        'buff': lambda c, x: [rsnap(['gauge'], 'self',
                                    note='命运轮盘：行动条回到先前的位置')],
        'stat': lambda c, x: [rsnap(['gauge'], 'self', note='命运轮盘转过一格')],
        'heal': lambda c, x: [iff(_chance(50, '伤口是否还在'),
                                  [rsnap(['hp'], 'self', note='伤尚未落定：把伤口退回去')])],
        'dispel': lambda c, x: [rsnap(['pools'], 'target', note='轮盘倒转一格')],
        'res': lambda c, x: [rsnap(['gauge'], 'self', note='命运轮盘转过一格')],
    },
}

# ============ 学徒 apprentice（门）——时空税形状 ============
RECIPES['apprentice'] = {
    'tag': '时空税',
    'sfx': {
        'dmg': '；裂隙张开：目标被放逐一瞬（空间操作须付迷失租金）。',
        'debuff': '；门在脚下开裂一瞬，再把人放回原位。',
        'buff': '；时空税：这份收益以「回放上一式半份」的方式付出（禁裸站桩）。',
        'stat': '；时空税：回放上一式的半份。',
        'heal': '；在时间的褶皱里重复了一次上一次的动作。',
        'dispel': '；把碍事的东西放进裂隙，再关上门。',
        'res': '；时空税：回放上一式的半份。',
    },
    'fn': {
        'dmg': lambda c, x: [tloc('banish', duration=1, target='target',
                                  note='裂隙放逐：目标被送入空间裂缝一瞬'),
                             mres('lost', 1, 'self', note='空间操作的租金：迷失值 +1')],
        'debuff': lambda c, x: [tloc('banish', duration=1, target='target',
                                     note='门在脚下开裂一瞬'),
                                mres('lost', 1, 'self', note='空间操作的租金：迷失值 +1')],
        'buff': lambda c, x: [echo(0.5, note='时空税：以回放上一式半份的形式支付（禁裸站桩 buff）')],
        'stat': lambda c, x: [echo(0.5, note='时空税：回放上一式的半份')],
        'heal': lambda c, x: [echo(0.5, note='在时间的褶皱里重复了一次上一次的动作')],
        'dispel': lambda c, x: [tloc('banish', duration=1, target='target',
                                     note='把碍事的东西放进裂隙'),
                                mres('lost', 1, 'self', note='迷失租金 +1')],
        'res': lambda c, x: [echo(0.5, note='时空税：回放上一式的半份')],
    },
}

# ============ 占卜家 seer（愚者）——提线形状 ============
RECIPES['seer'] = {
    'tag': '提线形状',
    'sfx': {
        'dmg': '；灵体之线牵引：这一击之后，它被牵着走了一步。',
        'debuff': '；提线木偶：动作由执线者说了算。',
        'buff': '；嫁接：把自己的好处接到既有的条款后面，不改原文。',
        'stat': '；提线：牵一步。',
        'heal': '；线上的木偶替你挡了一下。',
        'dispel': '；剪断之前，先牵住它。',
        'res': '；嫁接：往既有条款后追加一段。',
    },
    'fn': {
        'dmg': lambda c, x: [ctrl('target', 1, actionPolicy='move_only', onExpire='revert',
                                  note='灵体之线：牵引一步即松开')],
        'debuff': lambda c, x: [ctrl('target', 1, actionPolicy='full', onExpire='revert',
                                     note='提线木偶：动作由执线者说了算')],
        'buff': lambda c, x: [mrslot(slot=1, field='punish', mode='append',
                                     value={'type': 'modify_resource', 'resource': 'energy',
                                            'value': 1, 'mode': 'delta', 'target': 'self'},
                                     note='嫁接：往既有惩罚条款后追加一段，不改原文')],
        'stat': lambda c, x: [ctrl('target', 1, actionPolicy='move_only', onExpire='revert',
                                   note='提线：牵一步')],
        'heal': lambda c, x: [ctrl('enemy', 1, actionPolicy='attack_only', onExpire='revert',
                                   note='线上的木偶替你挡了一下')],
        'dispel': lambda c, x: [ctrl('target', 1, actionPolicy='move_only', onExpire='revert',
                                     note='剪断之前，先牵住它')],
        'res': lambda c, x: [mrslot(slot=1, field='punish', mode='append',
                                    value={'type': 'modify_resource', 'resource': 'energy',
                                           'value': 1, 'mode': 'delta', 'target': 'self'},
                                    note='嫁接：往既有条款后追加一段')],
    },
}

# ============ 仲裁人 arbiter（审判者）——立规形状 ============
RECIPES['arbiter'] = {
    'tag': '立规',
    'sfx': {
        'dmg': '；审判：把目标从豁免名单里划掉。',
        'debuff': '；判决如此：它不再享有豁免。',
        'buff': '；立规：写下这一条豁免条款。',
        'stat': '；改判：从豁免名单里剔除。',
        'heal': '；裁定：豁免名册由审判者书写。',
        'dispel': '；撤销豁免，然后才谈清理。',
        'res': '；立规：写下豁免条款。',
    },
    'fn': {
        'dmg': lambda c, x: [mrslot(slot=1, field='exemptions', mode='remove',
                                    value={'side': 'target'},
                                    note='审判：把目标从豁免名单里划掉')],
        'debuff': lambda c, x: [mrslot(slot=1, field='exemptions', mode='remove',
                                       value={'side': 'target'},
                                       note='判决：它不再享有豁免')],
        'buff': lambda c, x: [wslot(slot=1, field='exemptions', value={'side': 'self'},
                                    overwrite=False,
                                    note='立规：写下这一条豁免条款')],
        'stat': lambda c, x: [mrslot(slot=1, field='exemptions', mode='remove',
                                     value={'side': 'target'}, note='改判：剔除豁免')],
        'heal': lambda c, x: [wslot(slot=1, field='exemptions', value={'side': 'self'},
                                    overwrite=False, note='裁定：豁免由审判者书写')],
        'dispel': lambda c, x: [mrslot(slot=1, field='exemptions', mode='remove',
                                       value={'side': 'target'}, note='撤销豁免再清理')],
        'res': lambda c, x: [wslot(slot=1, field='exemptions', value={'side': 'self'},
                                  overwrite=False, note='立规：写下豁免条款')],
    },
}

# ============ 药师 apothecary（月亮）——预服形状 ============
RECIPES['apothecary'] = {
    'tag': '预服',
    'sfx': {
        'dmg': '；药剂残渣犹在：短时免疫一次侵扰（当场只喝半剂）。',
        'debuff': '；预服在前：抗性已经铺好。',
        'buff': '；分药：这份收益也能给别人来一口，只是剂量减半。',
        'stat': '；分药：剂量减半。',
        'heal': '；先服一半，剩下的留给同伴。',
        'dispel': '；预服护体，再把脏东西清掉。',
        'res': '；分药：剂量减半。',
    },
    'fn': {
        'dmg': lambda c, x: [imm('self', charges=1, duration=5,
                                 note='药剂残渣护体：当场只喝半剂，余量留给下一次')],
        'debuff': lambda c, x: [imm('self', charges=1, duration=5,
                                    note='预服在前：抗性已经铺好')],
        'buff': lambda c, x: [tst(mode='copy', **{'from': {'side': 'self'}}, to='all_allies',
                                  count=1, durationMul=0.5,
                                  note='分药：药剂也能给别人来一口，只是剂量减半')],
        'stat': lambda c, x: [tst(mode='copy', **{'from': {'side': 'self'}}, to='all_allies',
                                  count=1, durationMul=0.5, note='分药：剂量减半')],
        'heal': lambda c, x: [imm('self', charges=1, duration=5, note='先服一半'),
                              tst(mode='copy', **{'from': {'side': 'self'}}, to='all_allies',
                                  count=1, durationMul=0.5, note='剩下的留给同伴')],
        'dispel': lambda c, x: [imm('self', charges=1, duration=5,
                                    note='预服护体，再把脏东西清掉')],
        'res': lambda c, x: [tst(mode='copy', **{'from': {'side': 'self'}}, to='all_allies',
                                 count=1, durationMul=0.5, note='分药：剂量减半')],
    },
}


def mdmg(mul, scope='taken', target='target', **kw):
    return _e({'type': 'modify_damage', 'mul': mul, 'scope': scope, 'target': target}, **kw)


# ============ 战士 warrior（黄昏巨人）——武技链形状 ============
# 零吟唱红线；防御不走隐身闪避，走「替承」——把落到同伴身上的东西揽过来
RECIPES['warrior'] = {
    'tag': '武技链',
    'sfx': {
        'dmg': '；替承：这一击改落到守者身上（不闪不避）。',
        'debuff': '；张开守护：把指向同伴的东西揽过来。',
        'buff': '；铁躯：硬吃一次，武技链的第一环是站住。',
        'stat': '；铁躯：硬吃一次。',
        'heal': '；守者先受，才有余裕缝合。',
        'dispel': '；替承之后再清理。',
        'res': '；铁躯：硬吃一次。',
    },
    'fn': {
        'dmg': lambda c, x: [over('self', note='替承：这一击改落到守者身上（黄昏巨人式防御）')],
        'debuff': lambda c, x: [over('self', note='张开守护：把指向同伴的东西揽过来')],
        'buff': lambda c, x: [imm('self', charges=1, duration=5,
                                  note='铁躯：硬吃一次，不走隐身闪避')],
        'stat': lambda c, x: [imm('self', charges=1, duration=5, note='铁躯：硬吃一次')],
        'heal': lambda c, x: [over('self', note='守者先受，才有余裕缝合')],
        'dispel': lambda c, x: [over('self', note='替承之后再清理')],
        'res': lambda c, x: [imm('self', charges=1, duration=5, note='铁躯：硬吃一次')],
    },
}

# ============ 耕种者 planter（母亲）——孕育形状 ============
# 增益拒绝瞬发全额：先埋下东西，让它自己长
RECIPES['planter'] = {
    'tag': '孕育',
    'sfx': {
        'dmg': '；虫子从土里翻出来啃它一口。',
        'debuff': '；藤蔓从脚边长出，缠住不放。',
        'buff': '；先埋下种子：这份收益要花时间才长成（拒绝瞬发全额）。',
        'stat': '；埋下一粒种子，让它自己长。',
        'heal': '；泥土自己会合上伤口——慢，但稳。',
        'dispel': '；荒芜与丰饶同来：清算之后必有新生。',
        'res': '；埋下一粒种子。',
    },
    'fn': {
        'dmg': lambda c, x: [spw(unitId='unit_vermin', count=1, position='at_unit',
                                 target='target', consumption='summon',
                                 note='驱策虫豸：从土里翻出来咬一口（PLANT/VERMIN 操纵）')],
        'debuff': lambda c, x: [spw(unitId='unit_vine', count=1, position='at_unit',
                                    target='target', consumption='summon',
                                    note='藤蔓缠足：扎根即失效，耕种者军团的活地板')],
        'buff': lambda c, x: [spw(unitId='unit_beastling', count=1, position='tail',
                                  consumption='summon',
                                  note='孕育：先埋下种子，收益随时间生长（拒绝瞬发全额）')],
        'stat': lambda c, x: [spw(unitId='unit_vine', count=1, position='tail',
                                  consumption='summon', note='埋下一粒种子，让它自己长')],
        'heal': lambda c, x: [spw(unitId='unit_oak_child', count=1, position='tail',
                                  consumption='summon',
                                  note='泥土会自己合上伤口——慢，但稳')],
        'dispel': lambda c, x: [spw(unitId='unit_vermin', count=1, position='tail',
                                    consumption='summon',
                                    note='荒芜与丰饶同来：清算之后必有新生')],
        'res': lambda c, x: [spw(unitId='unit_vine', count=1, position='tail',
                                 consumption='summon', note='埋下一粒种子')],
    },
}

# ============ 水手 sailor（暴君）——轮转 / 天灾推挤形状 ============
RECIPES['sailor'] = {
    'tag': '轮转',
    'sfx': {
        'dmg': '；浪头把它推开一档——风、雷、雨轮着来。',
        'debuff': '；风暴推挤：站位被打乱。',
        'buff': '；踏浪：在风暴里换到更远的位置。',
        'stat': '；踏浪：换到阵列尾梢。',
        'heal': '；把自己推出风暴中心再缝合。',
        'dispel': '；一阵大风先把脏东西吹散。',
        'res': '；踏浪：换到阵列尾梢。',
    },
    'fn': {
        'dmg': lambda c, x: [mv('push_back', target='target', distance=1,
                                note='风暴推挤：浪头把它推开一档（天灾的位移代价）')],
        'debuff': lambda c, x: [mv('push_back', target='target', distance=1,
                                   note='风暴推挤：站位被打乱')],
        'buff': lambda c, x: [mv('insert_tail_cross_lane', target='self',
                                 note='踏浪：在风暴里换到更远的位置')],
        'stat': lambda c, x: [mv('insert_tail_cross_lane', target='self',
                                 note='踏浪：换到阵列尾梢')],
        'heal': lambda c, x: [mv('insert_tail_cross_lane', target='self',
                                 note='先把自己推出风暴中心，再缝合')],
        'dispel': lambda c, x: [mv('push_back', target='target', distance=1,
                                   note='一阵大风先把脏东西吹散')],
        'res': lambda c, x: [mv('insert_tail_cross_lane', target='self',
                                note='踏浪：换到阵列尾梢')],
    },
}

# ============ 通识者 savant（完美者）——文明 / 规律改写形状 ============
# 规律改写只限物理语义：重力 / 材质 / 距离；增益按造物在场缩放
RECIPES['savant'] = {
    'tag': '文明',
    'sfx': {
        'dmg': '；规律改写：这一段的作用域被换成受重力约束的物理场。',
        'debuff': '；材质被重新定义过， Mohs 硬度不再站在它那边。',
        'buff': '；出厂一台造物：这份收益挂在新下线的机械身上。',
        'stat': '；出厂一台造物。',
        'heal': '；返厂维修：把自己拆解重装一遍。',
        'dispel': '；规律改写：距离重新标定。',
        'res': '；出厂一台造物。',
    },
    'fn': {
        'dmg': lambda c, x: [mrslot(slot=1, field='scope', mode='replace',
                                    value={'physical': 'gravity_weighted'},
                                    note='规律改写（物理语义）：作用域换成受重力约束的场')],
        'debuff': lambda c, x: [mrslot(slot=1, field='scope', mode='replace',
                                       value={'physical': 'material_redefined'},
                                       note='规律改写（物理语义）：材质被重新定义')],
        'buff': lambda c, x: [spw(unitId='unit_automaton', count=1, position='tail',
                                  consumption='summon',
                                  note='出厂一台造物：收益随文明规模缩放')],
        'stat': lambda c, x: [spw(unitId='unit_automaton', count=1, position='tail',
                                  consumption='summon', note='出厂一台造物')],
        'heal': lambda c, x: [spw(unitId='unit_homunculus', count=1, position='tail',
                                  consumption='summon', note='返厂维修：拆解重装一遍')],
        'dispel': lambda c, x: [mrslot(slot=1, field='scope', mode='replace',
                                       value={'physical': 'distance_recalibrated'},
                                       note='规律改写（物理语义）：距离重新标定')],
        'res': lambda c, x: [spw(unitId='unit_automaton', count=1, position='tail',
                                 consumption='summon', note='出厂一台造物')],
    },
}

# ============ 歌颂者 chanter（太阳）——仪式 / 公证形状 ============
# 净化不走裸 dispel，走 grant_immunity；太阳是黑夜的对极，战场光照由它抬起来
RECIPES['chanter'] = {
    'tag': '仪式',
    'sfx': {
        'dmg': '；祈光：把这块战场抬到白昼档。',
        'debuff': '；白昼之下，阴影无处藏身。',
        'buff': '；公证：先净化，再给一次免疫——光明不靠驱散来赢。',
        'stat': '；白昼：让光照盖过这里。',
        'heal': '；公证裁定：这道缝合有契约背书。',
        'dispel': '；净化不是抹掉，是让脏东西挨不到你。',
        'res': '；白昼：让光照盖过这里。',
    },
    'fn': {
        'dmg': lambda c, x: [lum(8, duration=10, dispelable=True,
                                 note='祈光：把战场覆写层抬到白昼档（≥8，与黑夜互为正反）')],
        'debuff': lambda c, x: [lum(8, duration=10, dispelable=True,
                                    note='白昼之下，阴影无处藏身')],
        'buff': lambda c, x: [imm('all_allies', charges=1, duration=5,
                                  note='公证：先净化再给一次免疫（不走裸 dispel）')],
        'stat': lambda c, x: [lum(8, duration=10, dispelable=True,
                                  note='白昼：让光照盖过这里')],
        'heal': lambda c, x: [imm('all_allies', charges=1, duration=5,
                                  note='公证裁定：这道缝合有契约背书')],
        'dispel': lambda c, x: [imm('all_allies', charges=1, duration=5,
                                    note='净化不是抹掉，是让脏东西挨不到你')],
        'res': lambda c, x: [lum(8, duration=10, dispelable=True,
                                 note='白昼：让光照盖过这里')],
    },
}


# ---------------------------------------------------------------- 执行

def run(pid, dry=False):
    path = os.path.join(ROOT, 'docs', 'json', f'{pid}.skills.json')
    d = json.load(open(path, encoding='utf-8'))
    rec = RECIPES[pid]
    changed, roles = [], collections.Counter()
    for c in d['cards']:
        if not is_generic(c):
            continue
        r = role_of(c)
        if r is None or r not in rec['fn']:
            continue
        segs = rec['fn'][r](c, ctx_of(c))
        if not segs:
            continue
        pre = segs.get('pre') if isinstance(segs, dict) else None
        post = segs.get('post') if isinstance(segs, dict) else segs
        if pre:
            c['effects'] = list(pre) + list(c.get('effects') or [])
        if post:
            c['effects'] = list(c.get('effects') or []) + list(post)
        sfx = rec['sfx'].get(r)
        if sfx and not (c.get('describe') or '').endswith(sfx):
            c['describe'] = (c.get('describe') or '') + sfx
        old = c.get('conversionNotes', '')
        if isinstance(old, list):
            old = ' ｜ '.join(str(x) for x in old)
        note = f"2026-10-03 骨架手术：{rec['tag']}换形（角色={r}）"
        c['conversionNotes'] = (old + ' ｜ ' if old else '') + note
        changed.append((c['id'], r))
        roles[r] += 1
    if not dry:
        with open(path, 'w', encoding='utf-8') as f:
            json.dump(d, f, ensure_ascii=False, indent=2)
            f.write('\n')
    print(f"[{pid}] {rec['tag']}: 换形 {len(changed)} 张  {dict(roles)}")
    return len(changed)


def main():
    args = [a for a in sys.argv[1:]]
    dry = '--dry' in args
    args = [a for a in args if not a.startswith('--')]
    if '--list' in sys.argv:
        print('已注册配方:', ', '.join(sorted(RECIPES)))
        return
    if not args:
        print(__doc__)
        return
    tot = 0
    for pid in args:
        if pid not in RECIPES:
            print(f"[skip] {pid} 无配方")
            continue
        tot += run(pid, dry=dry)
    print(f"合计换形 {tot} 张")


if __name__ == '__main__':
    main()
