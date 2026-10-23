"""reader A1 重构：退役 5 / 新增 5 / 改写 15。一次性脚本，跑完即弃。"""
import io
import json

P = 'docs/json/reader.skills.json'
d = json.loads(io.open(P, encoding='utf-8').read())
cards = d['cards']
by = {c['id']: c for c in cards}

RETIRE = [
    'skill_reader_s5_mimic_arcana',   # 模仿·秘术导师
    'skill_reader_s4_mimic_prophet',  # 模仿·预言家
    'skill_reader_s2_mimic_cherub',   # 模仿·智天使
    'skill_reader_s7_weapon_mastery', # 武器精通
    'skill_reader_s0_astral_stairs',  # 星界阶梯
]
for cid in RETIRE:
    assert cid in by, cid
cards[:] = [c for c in cards if c['id'] not in RETIRE]
by = {c['id']: c for c in cards}


def walk_lists(node):
    """yield 每个可能含效果节点的 list（effects/steps/then/else）"""
    if isinstance(node, dict):
        for k in ('effects', 'steps', 'then', 'else'):
            v = node.get(k)
            if isinstance(v, list):
                yield v
                for item in v:
                    yield from walk_lists(item)
    elif isinstance(node, list):
        for item in node:
            yield from walk_lists(item)


def strip_rider(c):
    """撤「下一式-1费」模仿习得段：modify_skill 节点 + describe 句"""
    removed = 0
    for lst in walk_lists({'effects': c.get('effects'), 'steps': c.get('triggers')}):
        before = len(lst)
        lst[:] = [n for n in lst if not (isinstance(n, dict) and n.get('type') == 'modify_skill')]
        removed += before - len(lst)
    for t in c.get('triggers') or []:
        for lst in walk_lists(t):
            before = len(lst)
            lst[:] = [n for n in lst if not (isinstance(n, dict) and n.get('type') == 'modify_skill')]
            removed += before - len(lst)
    if '模仿习得' in (c.get('describe') or ''):
        parts = [p for p in c['describe'].split('；') if '模仿习得' not in p]
        c['describe'] = '；'.join(parts)
    return removed


RIDER_CARDS = ['skill_reader_s9_comprehension', 'skill_reader_s9_knowledge_reserve',
               'skill_reader_s8_ritual_expertise', 'skill_reader_s3_law_breach',
               'skill_reader_s2_wisdom_authority', 'skill_reader_s2_optimal_choice',
               'skill_reader_s3_law_authority', 'skill_reader_s5_streamlined_cast',
               'skill_reader_s4_prophecy']
for cid in RIDER_CARDS:
    n = strip_rider(by[cid])
    assert n >= 1, (cid, n)

READ_NOTE = 'A1 读维（2026-10-23）：维度键并入 read 实例 slots（编队参数 §1.1b 合并语义）'


def read_mount(dims, duration=25, target=None):
    m = {'type': 'mount_status', 'statusId': 'read', 'duration': duration,
         'params': {k: 1 for k in dims}, 'note': READ_NOTE}
    if target:
        m['target'] = target
    return m


def seq_steps(c):
    return next(n['steps'] for n in c['effects'] if n.get('op') == 'sequence')


def has_read(c):
    return '已读' in (c.get('describe') or '')

# ---- 产读卡改写 ----
c = by['skill_reader_s8_logic_deduction']
seq_steps(c).append(read_mount(['d_skill'], 25))
c['describe'] = '使一名敌人易伤 20tick，造成 2 点精神伤害，并解析它（刷新技能快照 30tick），读懂它的招式配置（已读·技能 25tick）。；先读透再落笔。'

c = by['skill_reader_s6_analyze']
seq_steps(c).append(read_mount(['d_energy'], 25))
c['describe'] = c['describe'].replace('并解析它（刷新技能快照 30tick）。',
                                      '并解析它（刷新技能快照 30tick），摸清它的能量回路（已读·能量 25tick）。')

c = by['skill_reader_s3_discern']
m = read_mount(['d_skill'], 25, target='all_enemies')
seq_steps(c).append(m)
c['describe'] = c['describe'].replace('全体敌人易伤 25tick、防御 -3（25tick）。',
                                      '全体敌人易伤 25tick、防御 -3（25tick），招式配置全体被读懂（已读·技能 25tick）。')

c = by['skill_reader_s4_prophecy']
steps = seq_steps(c)
steps.insert(3, {**read_mount(['d_tempo'], 25), 'target': 'secondary_target',
                 'note': '预言=读节奏：读懂敌方主目标的行动时机（A1 2026-10-23）'})
c['describe'] = c['describe'].replace('敌方主目标行动条 -20。', '敌方主目标行动条 -20，并读懂它的行动节奏（已读·节奏 25tick）。')

c = by['skill_reader_s8_observe']
for t in c['triggers']:
    t['effects'].append({**read_mount(['d_skill'], 25), 'note': '挨打/命中即抄录招式配置（A1 2026-10-23）'})
c['describe'] = c['describe'].replace('解析本次交互的对方单位（快照其最近一次施放的技能，30tick）。',
                                      '解析本次交互的对方单位（快照其最近一次施放的技能，30tick），并抄录其招式配置（已读·技能 25tick）。')

# ---- arcana 读能消费 ----
c = by['skill_reader_s9_ritual_magic']
c['effects'].append({
    'op': 'if',
    'condition': {'kind': 'recorded_has', 'side': 'target', 'statusId': 'read', 'id': 'd_energy'},
    'then': [{'type': 'damage', 'element': 'mental', 'value': 1,
              'note': '读能放大：目标能量虚实已被测算，仪式追加 1 点精神伤害（A1 2026-10-23）'}],
    'else': [],
})
c['describe'] = '对一名敌人造成 2 点精神伤害；若其已被读能量（已读·能量），追加 1 点精神伤害。；先读透再落笔。'

c = by['skill_reader_s7_ritual_master']
seq_steps(c).append({
    'op': 'if',
    'condition': {'kind': 'recorded_has', 'side': 'target', 'statusId': 'read', 'id': 'd_energy'},
    'then': [{'type': 'modify_resource', 'resource': 'energy', 'value': 1, 'mode': 'delta', 'target': 'self',
              'note': '仪式回馈：读懂能量空窗，仪式余裕回能 1（A1 2026-10-23）'}],
    'else': [],
})
c['describe'] = c['describe'].replace('自身获得 4 点护盾（15tick）。', '自身获得 4 点护盾（15tick）；若目标已被读能量，自身能量 +1。')

c = by['skill_reader_s4_astral_arcana']
seq_steps(c).append(read_mount(['d_energy'], 25, target='all_enemies'))
c['describe'] = c['describe'].replace('全体敌人受到 3 点精神伤害，并失去 2 点能量（下限 0）。',
                                      '全体敌人受到 3 点精神伤害、失去 2 点能量（下限 0），能量回路全体被摸清（已读·能量 25tick）。')

# ---- foresight 读节奏消费 ----
c = by['skill_reader_s7_combat_master']
seq_steps(c).append({
    'op': 'if',
    'condition': {'kind': 'recorded_has', 'side': 'target', 'statusId': 'read', 'id': 'd_tempo'},
    'then': [{'type': 'modify_resource', 'resource': 'gauge.current', 'value': -30, 'mode': 'delta',
              'note': '打在节骨眼上：目标节奏已被读懂，追加击退 30（A1 2026-10-23）'}],
    'else': [],
})
c['describe'] = c['describe'].replace('击退其行动条 50。', '击退其行动条 50；若其节奏已被读懂（已读·节奏），追加击退 30。')

c = by['skill_reader_s4_astral_sanctum']
seq_steps(c).append(read_mount(['d_tempo'], 15, target='all_enemies'))
c['describe'] = c['describe'].replace('「秘术 / 预知」标签卡效果 ×1.3。',
                                      '「秘术 / 预知」标签卡效果 ×1.3；展开时全体敌人节奏被读懂（已读·节奏 15tick）。')

# ---- S0 权柄：全知=信息自来 ----
c = by['skill_reader_s0_omniscience']
c['effects'].append({**read_mount(['d_energy', 'd_skill', 'd_tempo'], 25, target='all_enemies'),
                     'note': '全知 = 不用读：开战即全维已读（三维 25tick；持续刷新靠白塔全知状态的 on_deal_damage 触发器）'})
c['describe'] = c['describe'].replace('全体敌人视同已被解析，',
                                      '全体敌人视同已被解析、三维（能量/技能/节奏）开战即已读，')

# ---- 模仿系：recorded_has 定档 + 反噬 ----
c = by['skill_reader_s6_mimic_novice']
assert c['effects'][1].get('condition', {}).get('kind') == 'chance'
c['effects'][1] = {
    'op': 'if',
    'condition': {'kind': 'recorded_has', 'side': 'target', 'statusId': 'read', 'id': 'd_skill'},
    'then': [{'type': 'mount_status', 'statusId': 'mimic', 'duration': 15, 'params': {'potency': 0.5},
              'fallback': {'type': 'damage', 'element': 'mental', 'value': 2},
              'note': '读懂招式后模仿：50% 效力'}],
    'else': [
        {'type': 'mount_status', 'statusId': 'mimic', 'duration': 15, 'params': {'potency': 0.2},
         'fallback': {'type': 'damage', 'element': 'mental', 'value': 2},
         'note': '未读硬模仿：仅 20% 效力'},
        {'type': 'modify_resource', 'resource': 'energy', 'value': -1, 'mode': 'delta', 'target': 'self',
         'note': '投入反噬：读错方向自噬能量 1（A1 2026-10-23，确定性替代原 50% chance）'},
    ],
}
c['describe'] = ('模仿一名已解析敌人最近一次施放的技能：若其已被读技能（已读·技能），50% 效力；'
                 '未读硬模仿仅 20% 效力且自身能量 -1（读错方向，投入反噬）。快照为空时改为 2 点精神伤害。；先读透再落笔。')
c['conversionNotes'] += ' ｜ 2026-10-23 A1 重构：chance 50% 退役（随机性治理登记册销账），改 recorded_has(d_skill) 确定性定档 + 未读自噬 1 能。'

c = by['skill_reader_s1_mimic_omniscience']
c['effects'][1] = {
    'op': 'if',
    'condition': {'kind': 'recorded_has', 'side': 'target', 'statusId': 'read', 'id': 'd_skill'},
    'then': [{'type': 'mount_status', 'statusId': 'mimic', 'duration': 15,
              'params': {'potency': 1.0, 'skipAuthority': True},
              'fallback': {'type': 'damage', 'element': 'mental', 'value': 6},
              'note': '读懂招式后完美模仿：100% 效力，权柄除外（重放跳过 authority:true 条目）'}],
    'else': [
        {'type': 'mount_status', 'statusId': 'mimic', 'duration': 15,
         'params': {'potency': 0.6, 'skipAuthority': True},
         'fallback': {'type': 'damage', 'element': 'mental', 'value': 6},
         'note': '未读硬模仿：仅 60% 效力'},
        {'type': 'modify_resource', 'resource': 'energy', 'value': -2, 'mode': 'delta', 'target': 'self',
         'note': '投入反噬：读错方向自噬能量 2（A1 2026-10-23）'},
    ],
}
c['describe'] = ('完美模仿一名已解析敌人最近一次施放的技能：若其已被读技能（已读·技能），100% 效力（权柄类不被复制）；'
                 '未读硬模仿仅 60% 效力且自身能量 -2（读错方向，投入反噬）。快照为空时改为 6 点精神伤害。；若目标已解析，解析透彻，追加 2 点精神伤害。；先读透再落笔。')
c['conversionNotes'] += ' ｜ 2026-10-23 A1 重构：100% 不再无条件，recorded_has(d_skill) 定档，未读降 60% + 自噬 2 能。'

# ---- 新增 5 卡 ----
NEW = [
    {
        'id': 'skill_reader_s7_energy_reading', 'name': '测算', 'kind': 'active',
        'sequence': 7, 'sequenceName': '守知者', 'rarity': 'uncommon', 'axis': 'analysis',
        'flagship': False,
        'lore': '序列7 守知者 —— "守知：对能量流动与灵性虚实的精确把握"',
        'flavor': '它的呼吸乱了半拍——那不是疲惫，是能量见底的征兆。你记下了这个数。',
        'describe': '测算一名敌人的能量虚实：挂载「已读·能量」25tick；若其当前能量 ≤3，追加 2 点精神伤害。；先读透再落笔。',
        'cost': {'energy': 2, 'cooldown': 10, 'castTime': 0}, 'reach': 'spell',
        'target': {'selectionMode': 'manual',
                   'request': {'mode': 'unit', 'faction': 'enemy', 'scope': 'point'},
                   'fallbackSort': 'atk_desc'},
        'effects': [
            {'type': 'reveal', 'target': 'target', 'scope': 'to_source', 'note': '先解析：读透目标的底牌，再谈数值'},
            read_mount(['d_energy'], 25),
            {'op': 'if',
             'condition': {'kind': 'resource_compare', 'side': 'target', 'key': 'energy', 'cmp': '<=', 'n': 3},
             'then': [{'type': 'damage', 'element': 'mental', 'value': 2,
                       'note': '能量空虚被坐实：追加 2 点精神伤害'}],
             'else': []},
        ],
        'tentative': False,
        'conversionNotes': '2026-10-23 A1 重构新增：d_energy 主动产读卡（读维三维之能量维）。',
        'art': {'subject': 'a scholar gauging the ebb of an enemy\'s spiritual energy like reading a gauge',
                'elements': ['flickering energy dial', 'annotated ledger', 'waning aura'],
                'mood': 'measured, clinical, quietly triumphant'},
        'role': 'core',
    },
    {
        'id': 'skill_reader_s6_dissect_moves', 'name': '拆招', 'kind': 'active',
        'sequence': 6, 'sequenceName': '博学者', 'rarity': 'uncommon', 'axis': 'analysis',
        'flagship': False,
        'lore': '序列6 博学者 —— "『模仿』的前置：先把对方的招式拆开看懂"',
        'flavor': '起手、运力、收势——同一招看三遍，它就再也骗不到你了。',
        'describe': '拆解一名敌人的招式配置：挂载「已读·技能」25tick、解析 1 层（30tick），并快照其最近施放。；先读透再落笔。',
        'cost': {'energy': 2, 'cooldown': 10, 'castTime': 0}, 'reach': 'spell',
        'target': {'selectionMode': 'manual',
                   'request': {'mode': 'unit', 'faction': 'enemy', 'scope': 'point'},
                   'fallbackSort': 'atk_desc'},
        'effects': [
            {'type': 'reveal', 'target': 'target', 'scope': 'to_source', 'note': '先解析：读透目标的底牌，再谈数值'},
            {'type': 'snapshot', 'fields': ['hp', 'pools'], 'target': 'target', 'note': '抄录目标当前状态'},
            read_mount(['d_skill'], 25),
            {'type': 'mount_status', 'statusId': 'observed', 'stacks': 1, 'stackMode': 'add', 'duration': 30,
             'note': '拆招兼解析：observed 1 层'},
        ],
        'tentative': False,
        'conversionNotes': '2026-10-23 A1 重构新增：d_skill 主动产读卡（读维三维之技能维，mimic 轴前置）。',
        'art': {'subject': 'a scholar dissecting an enemy\'s technique into annotated motion diagrams',
                'elements': ['exploded motion diagram', 'marginal notes', 'pinned blade trajectory'],
                'mood': 'analytical, deconstructive, absorbed'},
        'role': 'core',
    },
    {
        'id': 'skill_reader_s5_read_tempo', 'name': '读势', 'kind': 'active',
        'sequence': 5, 'sequenceName': '秘术导师', 'rarity': 'rare', 'axis': 'foresight',
        'flagship': False,
        'lore': '序列5 秘术导师 —— "星界视角下，行动的节奏如钟摆般可读"',
        'flavor': '它快要动了——你数着它灵性鼓点的间隙，像数着一座将响的钟。',
        'describe': '读一名敌人的行动节奏：挂载「已读·节奏」25tick；若其行动条 ≥70，击退 20。；读懂节奏的人，先动。',
        'cost': {'energy': 3, 'cooldown': 15, 'castTime': 0}, 'reach': 'spell',
        'target': {'selectionMode': 'manual',
                   'request': {'mode': 'unit', 'faction': 'enemy', 'scope': 'point'},
                   'fallbackSort': 'gauge_desc'},
        'effects': [
            read_mount(['d_tempo'], 25),
            {'op': 'if',
             'condition': {'kind': 'gauge_above', 'side': 'target', 'n': 70},
             'then': [{'type': 'modify_resource', 'resource': 'gauge.current', 'value': -20, 'mode': 'delta',
                       'note': '读懂它将动：先发击退 20'}],
             'else': []},
        ],
        'tentative': False,
        'conversionNotes': '2026-10-23 A1 重构新增：d_tempo 主动产读卡（读维三维之节奏维；冷却谓词候选延期，用 gauge_above 落地）。',
        'art': {'subject': 'a mystic reading an enemy\'s action tempo as a swinging pendulum of light',
                'elements': ['luminous pendulum', 'slowed motion blur', 'hourglass shards'],
                'mood': 'patient, anticipatory, precise'},
        'role': 'core',
    },
    {
        'id': 'skill_reader_s3_arcana_disclosure', 'name': '秘术·洞烛', 'kind': 'active',
        'sequence': 3, 'sequenceName': '洞悉者', 'rarity': 'epic', 'axis': 'arcana',
        'flagship': False,
        'lore': '序列3 洞悉者 —— "仪式不再盲放：看懂能量空窗，一击即溃"',
        'flavor': '仪式最古老的一条训诫：不要对满溢的杯子灌注。等它空——或者，先确认它空。',
        'describe': ('仪式放量：若目标已被读能量（已读·能量），造成 6 点精神伤害并自身能量 +2；'
                     '未读硬灌仅 3 点精神伤害且自身能量 -1（读错方向，投入反噬）。；先读透再落笔。'),
        'cost': {'energy': 4, 'cooldown': 20, 'castTime': 0}, 'reach': 'spell',
        'target': {'selectionMode': 'manual',
                   'request': {'mode': 'unit', 'faction': 'enemy', 'scope': 'whole_lane', 'pickCount': 1},
                   'fallbackSort': 'hp_desc'},
        'effects': [
            {'type': 'reveal', 'target': 'target', 'scope': 'to_source', 'note': '先解析：读透目标的底牌，再谈数值'},
            {'op': 'if',
             'condition': {'kind': 'recorded_has', 'side': 'target', 'statusId': 'read', 'id': 'd_energy'},
             'then': [
                 {'type': 'damage', 'element': 'mental', 'value': 6, 'note': '仪式全效：读懂能量空窗放量'},
                 {'type': 'modify_resource', 'resource': 'energy', 'value': 2, 'mode': 'delta', 'target': 'self',
                  'note': '仪式余裕回能 2'},
             ],
             'else': [
                 {'type': 'damage', 'element': 'mental', 'value': 3, 'note': '未读硬灌：降档'},
                 {'type': 'modify_resource', 'resource': 'energy', 'value': -1, 'mode': 'delta', 'target': 'self',
                  'note': '投入反噬：读错方向自噬能量 1（A1 2026-10-23）'},
             ]},
        ],
        'tentative': False,
        'conversionNotes': '2026-10-23 A1 重构新增：arcana 轴读 d_energy 兑现 payoff（读对全效 / 未读降档+自噬）。',
        'art': {'subject': 'a ritualist pouring a precise surge of mental fire into an enemy\'s energy void',
                'elements': ['focused ritual bolt', 'empty vessel imagery', 'ignited sigil circle'],
                'mood': 'decisive, ritualistic, severe'},
        'role': 'core',
    },
    {
        'id': 'skill_reader_s2_mimic_deconstruct', 'name': '模仿·解构', 'kind': 'active',
        'sequence': 2, 'sequenceName': '智天使', 'rarity': 'epic', 'axis': 'mimic',
        'flagship': False,
        'lore': '序列2 智天使 —— "解构先于复刻：看懂的招式才是自己的"',
        'flavor': '你把它最得意的那一招拆成了三段笔记。合上笔记时，那招已经是你的了。',
        'describe': ('解构复刻一名已解析敌人：若其已被读技能（已读·技能），以 90% 效力模仿其最近施放；'
                     '未读硬模仿效力仅 30% 且自身能量 -2（读错方向，投入反噬）。快照为空时改为 5 点精神伤害。；先读透再落笔。'),
        'cost': {'energy': 3, 'cooldown': 15, 'castTime': 0}, 'reach': 'none',
        'target': {'selectionMode': 'manual',
                   'request': {'mode': 'unit', 'faction': 'enemy',
                               'filter': {'hasStatus': 'observed'}, 'scope': 'board', 'pickCount': 1},
                   'fallbackSort': 'atk_desc'},
        'effects': [
            {'type': 'reveal', 'target': 'target', 'scope': 'to_source', 'note': '先解析：读透目标的底牌，再谈数值'},
            {'op': 'if',
             'condition': {'kind': 'recorded_has', 'side': 'target', 'statusId': 'read', 'id': 'd_skill'},
             'then': [{'type': 'mount_status', 'statusId': 'mimic', 'duration': 15, 'params': {'potency': 0.9},
                       'fallback': {'type': 'damage', 'element': 'mental', 'value': 5},
                       'note': '读懂招式后解构复刻：90% 效力'}],
             'else': [
                 {'type': 'mount_status', 'statusId': 'mimic', 'duration': 15, 'params': {'potency': 0.3},
                  'fallback': {'type': 'damage', 'element': 'mental', 'value': 5},
                  'note': '未读硬模仿：仅 30% 效力'},
                 {'type': 'modify_resource', 'resource': 'energy', 'value': -2, 'mode': 'delta', 'target': 'self',
                  'note': '投入反噬：读错方向自噬能量 2（A1 2026-10-23）'},
             ]},
        ],
        'tentative': False,
        'conversionNotes': '2026-10-23 A1 重构新增：mimic 轴高档兑现——固定 potency 梯度（导师/预言家/智天使）退役后，复刻完成度由 recorded_has(d_skill) 定档。',
        'art': {'subject': 'a scholar unfolding an enemy\'s signature technique as three pages of notes, then closing them into his own hand',
                'elements': ['three floating annotated pages', 'reassembled spectral technique', 'ink and light'],
                'mood': 'masterful, deconstructive, assured'},
        'role': 'core',
    },
]
cards.extend(NEW)

# ---- axes 元数据 ----
ax = d['axes']
ax['analysis']['enablers'] = ['逻辑推演', '解析', '测算', '拆招', '洞悉']
ax['analysis']['payoffs'] = ['推理大师', '模仿·解构', '秘术·洞烛']
ax['analysis']['note'] = ('2026-10-23 A1 重构：解析轴=产读轴——observed 从唯一前置降为可读维度之一（读状态面），'
                          '新增 read{d_energy（测算/解析）/d_skill（逻辑推演/拆招/洞悉）} 产出；消费方跨轴（mimic 读 d_skill、arcana 读 d_energy）。')
ax['arcana']['enablers'] = ['仪式魔法专家', '省略步骤', '星界秘术']
ax['arcana']['payoffs'] = ['秘术·洞烛', '仪式魔法', '仪式魔法大师']
ax['arcana']['note'] = ('2026-10-23 A1 重构：仪式系读 read{d_energy} 放大——秘术·洞烛读对全效+回能，未读降档+自噬；'
                        '星界秘术兼作 d_energy 产读（全体）。')
ax['mimic']['enablers'] = ['观察', '拆招']
ax['mimic']['payoffs'] = ['模仿·初解', '模仿·解构', '模仿·全知之眼']
ax['mimic']['note'] = ('2026-10-23 A1 重构：固定 potency 梯度（秘术导师/预言家/智天使 20%→90%）退役；'
                       '复刻完成度改由 recorded_has(read, d_skill) 定档，未读降档+自噬能量（读错方向，投入反噬）。')
ax['foresight']['enablers'] = ['预言', '读势', '智慧权柄']
ax['foresight']['payoffs'] = ['格斗大师', '星界秘域', '局势推演']
ax['foresight']['note'] = ('2026-10-23 A1 重构：预知=读节奏——read{d_tempo}（预言/读势/星界秘域产）+ gauge 谓词兑现；'
                           '冷却谓词（cooldown_compare）留候选延期。')

# ---- 构筑预设 ----
sb = d['sampleBuilds']
a = next(x for x in sb if x['name'].startswith('A'))
a['passives'] = ['过目不忘', '仪式魔法专家', '省略步骤', '理解力']
a['playstyle'] = '前排学者：仪式专家×1.2、省略步骤连发；仪式系读能（测算/星界秘术）后放大'
cbuild = next(x for x in sb if x['name'].startswith('C'))
cbuild['actives'] = ['模仿·初解', '模仿·解构', '知识储备', '星界秘术']
cbuild['playstyle'] = '观察/拆招读招，读懂后复刻高档（未读自噬）；星界秘术压能配洞烛放量'

io.open(P, 'w', encoding='utf-8', newline='\n').write(json.dumps(d, ensure_ascii=False, indent=2) + '\n')
print('cards:', len(cards))
