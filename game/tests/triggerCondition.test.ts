// TriggerDef.condition / filter 求值：事件载荷（元素/来源）、side 主体、状态获得过滤。
import { describe, expect, it } from 'vitest'
import { createCombat } from '../src/kernel'
import { buildCatalog } from '../src/data/catalogBuild'
import type { PathwayFile } from '../src/data/schema.types'
import type { CombatFacade } from '../src/kernel/combat/types'

const MARK = (id: string, name: string, extra: Record<string, unknown> = {}) => ({
  id, name, category: ['buff'], dispelable: false, duration: null, maxStacks: 1, ...extra,
})

const SKILL = (id: string, effects: unknown[]) => ({
  id, name: id, kind: 'active' as const, sequence: 9, sequenceName: 's9', rarity: 'common' as const,
  axis: 'a', flagship: false, lore: '', flavor: '', describe: '', tentative: false,
  cost: { energy: 0, cooldown: 0, castTime: null }, reach: 'spell' as const,
  target: { selectionMode: 'auto' as const, request: { faction: 'enemy' as const, anchor: 'enemy_front', sort: 'index_asc' as const, pickCount: 1 } },
  effects,
})

const STATUSES = [
  MARK('probe_mark_a', '元素标记'),
  MARK('probe_mark_b', '残血标记'),
  MARK('probe_mark_c', '隐匿攻击者标记'),
  MARK('probe_mark_d', '行为伤害标记'),
  MARK('probe_mark_e', '定罪标记'),
  MARK('probe_mark_f', '错误定罪标记'),
  MARK('probe_mark_g', '心象'),
  MARK('probe_mark_h', '命运标记'),
  MARK('probe_conceal', '隐匿', { category: ['conceal'] }),
  MARK('probe_fortune', '幸运'),
  MARK('probe_other', '杂项'),
  MARK('probe_noop', '占位'),
  {
    ...MARK('probe_fireproof', '防火'),
    triggers: [{
      event: 'on_take_damage',
      condition: { kind: 'element_is', element: 'fire' },
      effects: [{ type: 'mount_status', statusId: 'probe_mark_a', target: 'self', duration: null }],
    }],
  },
  {
    ...MARK('probe_bloodlust', '濒血'),
    triggers: [{
      event: 'on_tick',
      condition: { kind: 'hp_percent', side: 'self', cmp: '<', n: 50 },
      effects: [{ type: 'mount_status', statusId: 'probe_mark_b', target: 'self', duration: null }],
    }],
  },
  {
    ...MARK('probe_vigil', '警觉'),
    triggers: [{
      event: 'on_take_damage',
      condition: { kind: 'has_category', side: 'attacker', categories: ['conceal'] },
      effects: [{ type: 'mount_status', statusId: 'probe_mark_c', target: 'self', duration: null }],
    }],
  },
  {
    ...MARK('probe_sleep', '入梦'),
    triggers: [{
      event: 'on_take_damage',
      condition: { kind: 'damage_source_is', sources: ['behavior'] },
      effects: [{ type: 'mount_status', statusId: 'probe_mark_d', target: 'self', duration: null }],
    }],
  },
  {
    ...MARK('probe_justice', '正义准则'),
    triggers: [{
      event: 'on_attack',
      condition: { kind: 'hp_percent_compare', aSide: 'target', bSide: 'self', cmp: '<' },
      effects: [{ type: 'mount_status', statusId: 'probe_mark_e', target: 'self', duration: null }],
    }],
  },
  {
    ...MARK('probe_justice_wrong', '错误准则'),
    triggers: [{
      event: 'on_attack',
      condition: { kind: 'hp_percent_compare', aSide: 'target', bSide: 'self', cmp: '>' },
      effects: [{ type: 'mount_status', statusId: 'probe_mark_f', target: 'self', duration: null }],
    }],
  },
  {
    ...MARK('probe_insight', '心象'),
    triggers: [{
      event: 'on_active_skill',
      global: true,
      condition: { kind: 'faction_is', side: 'target', value: 'enemy' },
      effects: [{ type: 'mount_status', statusId: 'probe_mark_g', target: 'self', duration: null }],
    }],
  },
  {
    ...MARK('probe_windfall', '幸运回馈'),
    triggers: [{
      event: 'on_status_gain',
      filter: { statusId: 'probe_fortune' },
      effects: [{ type: 'mount_status', statusId: 'probe_mark_h', target: 'self', duration: null }],
    }],
  },
  {
    ...MARK('probe_dot', '持续伤害'),
    triggers: [{
      event: 'on_tick',
      effects: [{ type: 'damage', element: 'poison', value: 1, target: 'self' }],
    }],
  },
  {
    ...MARK('probe_disarm', '缴械'),
    disallowActions: ['basic_attack', 'skill'],
  },
]

const PATH: PathwayFile = {
  pathwayId: 'probe_trigger_condition',
  pathwayName: '触发条件探针',
  sourceFile: 'probe',
  sourceVersion: 'test',
  cards: [
    { ...SKILL('probe_hit_phys', [{ type: 'damage', element: 'physical', value: 1 }]) },
    { ...SKILL('probe_hit_fire', [{ type: 'damage', element: 'fire', value: 1 }]) },
    { ...SKILL('probe_hit_big', [{ type: 'damage', element: 'physical', value: 20 }]) },
    {
      id: 'probe_cast', name: '施法', kind: 'active', sequence: 9, sequenceName: 's9', rarity: 'common',
      axis: 'a', flagship: false, lore: '', flavor: '', describe: '', tentative: false,
      cost: { energy: 0, cooldown: 0, castTime: null }, reach: 'spell',
      target: { selectionMode: 'auto', request: { faction: 'self', anchor: 'caster', pickCount: 1 } },
      effects: [{ type: 'mount_status', statusId: 'probe_noop', duration: null, target: 'self' }],
    },
    { id: 'probe_defs', name: '状态池', kind: 'passive', sequence: 1, sequenceName: 's1', rarity: 'common',
      axis: 'a', flagship: false, lore: '', flavor: '', describe: '', tentative: false,
      cost: { energy: 0, cooldown: 100, castTime: null }, hook: [], effects: [], statusDefs: STATUSES },
  ],
} as never

interface Slot { skills?: string[]; statuses?: string[]; attributes?: number; agility?: number }

function unit(unitId: string, faction: 'A' | 'B', index: number, s: Slot = {}) {
  return {
    unitId,
    coordinate: { faction, lane: 'lane0' as const, index },
    attributeSet: { strength: s.attributes ?? 1, agility: s.agility ?? 1, intelligence: 1, rank: 0 },
    gender: 'male' as const,
    anchor: index,
    activeSlots: (s.skills ?? []).map((skillDefId) => ({ skillDefId })),
    passiveSlots: [],
    initialStatuses: (s.statuses ?? []).map((defId) => ({ defId })),
  }
}

function setup(opts: { a: Slot; b: Slot }) {
  return {
    seed: 7,
    catalog: buildCatalog([PATH]).catalog,
    board: { clock: { base: 0 }, domainGrants: [] },
    factions: [
      { id: 'A' as const, name: '甲', units: [unit('A_u0', 'A', 0, opts.a)] },
      { id: 'B' as const, name: '乙', units: [unit('B_u0', 'B', 0, opts.b)] },
    ],
    inputs: { decisions: new Map() },
  } as never
}

function run(opts: { a: Slot; b: Slot }, ticks: number): { c: CombatFacade; has: (unitId: string, defId: string) => boolean } {
  const c = createCombat(setup(opts))
  for (let i = 0; i < ticks && !c.ended(); i += 1) c.step()
  return {
    c,
    has: (unitId, defId) => {
      const u = c.state().units.find((x) => x.id === unitId)
      return !!u && u.statuses.some((s) => s.defId === defId)
    },
  }
}

describe('condition：事件载荷', () => {
  it('element_is 只对匹配元素的伤害 fire', () => {
    expect(run({ a: { skills: ['probe_hit_phys'], agility: 30 }, b: { statuses: ['probe_fireproof'] } }, 3).has('B_u0', 'probe_mark_a')).toBe(false)
    expect(run({ a: { skills: ['probe_hit_fire'], agility: 30 }, b: { statuses: ['probe_fireproof'] } }, 3).has('B_u0', 'probe_mark_a')).toBe(true)
  })

  it('hp_percent side:self 按持有者生命比例判定（n<1 视为比例）', () => {
    const low = run({ a: { skills: ['probe_hit_big'], agility: 30 }, b: { statuses: ['probe_bloodlust'], attributes: 0 } }, 4)
    expect(low.has('B_u0', 'probe_mark_b')).toBe(true)
    const high = run({ a: { skills: ['probe_hit_big'], agility: 30 }, b: { statuses: ['probe_bloodlust'], attributes: 10 } }, 4)
    expect(high.has('B_u0', 'probe_mark_b')).toBe(false)
  })

  it('has_category side:attacker 读取攻击者状态类别', () => {
    expect(run({ a: { skills: ['probe_hit_phys'], statuses: ['probe_conceal'], agility: 30 }, b: { statuses: ['probe_vigil'] } }, 3).has('B_u0', 'probe_mark_c')).toBe(true)
    expect(run({ a: { skills: ['probe_hit_phys'], agility: 30 }, b: { statuses: ['probe_vigil'] } }, 3).has('B_u0', 'probe_mark_c')).toBe(false)
  })

  it('damage_source_is：行为伤害 fire，状态来源伤害不 fire', () => {
    expect(run({ a: { skills: ['probe_hit_phys'], agility: 30 }, b: { statuses: ['probe_sleep'] } }, 3).has('B_u0', 'probe_mark_d')).toBe(true)
    // 1 tick：B 的 on_tick 状态伤害先结算，A 敏捷 1 尚未出手（不引入行为伤害）
    const statusOnly = run({
      a: { statuses: ['probe_disarm'] },
      b: { statuses: ['probe_sleep', 'probe_dot'] },
    }, 1)
    expect(statusOnly.has('B_u0', 'probe_mark_d')).toBe(false)
  })
})

describe('condition：side 主体', () => {
  it('hp_percent_compare 的 target = 本次攻击命中目标', () => {
    const hit = run({ a: { skills: ['probe_hit_phys'], statuses: ['probe_justice'], agility: 30 }, b: {} }, 2)
    expect(hit.has('A_u0', 'probe_mark_e')).toBe(true)
    const wrong = run({ a: { skills: ['probe_hit_phys'], statuses: ['probe_justice_wrong'], agility: 30 }, b: {} }, 2)
    expect(wrong.has('A_u0', 'probe_mark_f')).toBe(false)
  })

  it('全局监听 faction_is：事件源相对持有者判敌我', () => {
    const { has } = run({
      a: { statuses: ['probe_insight'], attributes: 1 },
      b: { skills: ['probe_cast'], agility: 30 },
    }, 6)
    expect(has('A_u0', 'probe_mark_g')).toBe(true)
  })
})

describe('filter：触发事件过滤', () => {
  it('on_status_gain 的 statusId 只放行指定状态', () => {
    expect(run({ a: {}, b: { statuses: ['probe_windfall', 'probe_fortune'] } }, 1).has('B_u0', 'probe_mark_h')).toBe(true)
    expect(run({ a: {}, b: { statuses: ['probe_windfall', 'probe_other'] } }, 1).has('B_u0', 'probe_mark_h')).toBe(false)
  })
})
