// 条件谓词语义：ally/enemy 存在性聚合、gender_is / gauge_above / gauge_rank / tag_chain /
// variant_is，以及 dispelled_count（chain/battle）与 consumed_count 的结算账本。
import { describe, expect, it } from 'vitest'
import { createCombat } from '../src/kernel'
import { buildCatalog } from '../src/data/catalogBuild'
import type { PathwayFile } from '../src/data/schema.types'
import type { CombatFacade } from '../src/kernel/combat/types'
import type { StatusDef } from '../src/kernel/catalog/types'
import type { CombatUnit } from '../src/kernel/roster/unit'
import { evaluateCondition, type ConditionContext } from '../src/kernel/shared/effect-condition'
import { Mulberry32RandomSource, RandomUsageRegistry } from '../src/kernel/shared/random-source'
import { makeUnit } from './helpers/fixture'

const BUFF: StatusDef = {
  id: 'probe_buff', name: '增益', category: ['buff'], dispelable: true, duration: null, maxStacks: 3, stackPolicy: 'stack',
}

const ctxOf = (caster: CombatUnit | null, all: CombatUnit[] = []): ConditionContext => ({
  random: new Mulberry32RandomSource(1),
  registry: new RandomUsageRegistry(),
  warn: () => {},
  phase: 'day',
  caster,
  allUnits: () => all,
  resolveUnit: (id) => all.find((u) => u.id === id) ?? null,
})

describe('条件谓词：side ally/enemy 与单位读数', () => {
  it('has_status 的 ally/enemy 按同侧存在性聚合（相对 host/caster）', () => {
    const caster = makeUnit('a0', 'A', {}, [BUFF])
    const ally = makeUnit('a1', 'A', {}, [BUFF])
    const foe = makeUnit('b0', 'B', {}, [BUFF])
    ally.statuses.mount('probe_buff', { sourceId: 's1', stacks: 2 })
    const all = [caster, ally, foe]
    const cond = { kind: 'has_status' as const, id: 'probe_buff', cmp: '>=' as const, n: 2 }
    expect(evaluateCondition({ ...cond, side: 'ally' }, foe, ctxOf(caster, all))).toBe(true)
    expect(evaluateCondition({ ...cond, side: 'enemy' }, foe, ctxOf(caster, all))).toBe(false)
    expect(evaluateCondition({ ...cond, side: 'self' }, foe, ctxOf(caster, all))).toBe(false)
  })

  it('gender_is 读指定方性别', () => {
    const male = makeUnit('m', 'A', {}, [], 'male')
    const female = makeUnit('f', 'B', {}, [], 'female')
    expect(evaluateCondition({ kind: 'gender_is', side: 'target', gender: 'male' }, male, ctxOf(male))).toBe(true)
    expect(evaluateCondition({ kind: 'gender_is', side: 'target', gender: 'male' }, female, ctxOf(male))).toBe(false)
  })

  it('gauge_above 读行动条进度', () => {
    const u = makeUnit('u', 'A')
    u.gauge.current = 70
    expect(evaluateCondition({ kind: 'gauge_above', side: 'target', n: 70 }, u, ctxOf(u))).toBe(true)
    expect(evaluateCondition({ kind: 'gauge_above', side: 'target', cmp: '>', n: 70 }, u, ctxOf(u))).toBe(false)
  })

  it('gauge_rank 按全场进度排名（1 = 最靠前）', () => {
    const a = makeUnit('a', 'A')
    const b = makeUnit('b', 'A')
    const c = makeUnit('c', 'B')
    a.gauge.current = 100
    b.gauge.current = 50
    c.gauge.current = 75
    const all = [a, b, c]
    expect(evaluateCondition({ kind: 'gauge_rank', n: 1 }, a, ctxOf(a, all))).toBe(true)
    expect(evaluateCondition({ kind: 'gauge_rank', n: 1 }, b, ctxOf(a, all))).toBe(false)
    expect(evaluateCondition({ kind: 'gauge_rank', cmp: '<=', n: 2 }, c, ctxOf(a, all))).toBe(true)
  })

  it('tag_chain 读施法者同标签连击计数', () => {
    const u = makeUnit('u', 'A')
    const ctx = { ...ctxOf(u), tagChainCount: (tag: string) => (tag === '圣咏' ? 3 : 0) }
    expect(evaluateCondition({ kind: 'tag_chain', tag: '圣咏', cmp: '>=', n: 2 }, null, ctx)).toBe(true)
    expect(evaluateCondition({ kind: 'tag_chain', tag: '污秽', cmp: '>=', n: 2 }, null, ctx)).toBe(false)
  })

  it('variant_is 读状态数据槽里的变体档', () => {
    const u = makeUnit('u', 'A', {}, [BUFF])
    u.statuses.mount('probe_buff', { sourceId: 's1', params: { variant: 'sleep' } })
    expect(evaluateCondition({ kind: 'variant_is', id: 'sleep' }, u, ctxOf(u))).toBe(true)
    expect(evaluateCondition({ kind: 'variant_is', id: 'finale' }, u, ctxOf(u))).toBe(false)
  })

  it('dispelled_count / consumed_count 从结算账本读数', () => {
    const u = makeUnit('u', 'A')
    const ctx: ConditionContext = {
      ...ctxOf(u),
      dispelledCount: (scope) => (scope === 'battle' ? 5 : 2),
      consumedCount: (id) => (id === 'spell_lore' ? 3 : 0),
    }
    expect(evaluateCondition({ kind: 'dispelled_count', cmp: '>=', n: 2 }, null, ctx)).toBe(true)
    expect(evaluateCondition({ kind: 'dispelled_count', scope: 'battle', cmp: '>=', n: 1 }, null, ctx)).toBe(true)
    expect(evaluateCondition({ kind: 'consumed_count', statusId: 'spell_lore', cmp: '>=', n: 3 }, null, ctx)).toBe(true)
    expect(evaluateCondition({ kind: 'consumed_count', statusId: 'spell_lore', cmp: '>=', n: 4 }, null, ctx)).toBe(false)
  })
})

const TALLY: StatusDef = {
  id: 'probe_tally', name: '刻印', category: ['buff'], dispelable: true, duration: null, maxStacks: 10, stackPolicy: 'stack',
}

const BUFF_ALT: StatusDef = {
  id: 'probe_buff2', name: '增益·二', category: ['buff'], dispelable: true, duration: null, maxStacks: 1,
}

const PATH: PathwayFile = {
  pathwayId: 'probe_cond',
  pathwayName: '条件探针',
  sourceFile: 'probe',
  sourceVersion: 'test',
  cards: [
    {
      id: 'probe_consume', name: '尽付', kind: 'active', sequence: 9, sequenceName: 's9', rarity: 'common',
      axis: 'a', flagship: false, lore: '', flavor: '', describe: '', tentative: false,
      cost: { energy: 0, cooldown: 0, castTime: null }, reach: 'spell',
      target: { selectionMode: 'auto', request: { faction: 'enemy', anchor: 'enemy_front', sort: 'index_asc', pickCount: 1 } },
      effects: [
        { type: 'mount_status', statusId: 'probe_tally', stacks: 'all', stackMode: 'consume', target: 'self' },
        {
          op: 'if',
          condition: { kind: 'consumed_count', statusId: 'probe_tally', cmp: '>=', n: 3 },
          then: [{ type: 'damage', element: 'none', value: 5 }],
          else: [{ type: 'damage', element: 'none', value: 1 }],
        },
        { op: 'repeat', count: '$consumed.probe_tally', steps: [{ type: 'damage', element: 'none', value: 1 }] },
      ],
    },
    {
      id: 'probe_consume_obj', name: '折半', kind: 'active', sequence: 9, sequenceName: 's9', rarity: 'common',
      axis: 'a', flagship: false, lore: '', flavor: '', describe: '', tentative: false,
      cost: { energy: 0, cooldown: 0, castTime: null }, reach: 'spell',
      target: { selectionMode: 'auto', request: { faction: 'enemy', anchor: 'enemy_front', sort: 'index_asc', pickCount: 1 } },
      effects: [
        { type: 'mount_status', statusId: 'probe_tally', stacks: 'all', stackMode: 'consume', target: 'self' },
        { op: 'repeat', count: { valueFrom: 'consumedStacks', div: 2, max: 11 }, steps: [{ type: 'damage', element: 'none', value: 1 }] },
      ],
    },
    {
      id: 'probe_break', name: '崩解', kind: 'active', sequence: 9, sequenceName: 's9', rarity: 'common',
      axis: 'a', flagship: false, lore: '', flavor: '', describe: '', tentative: false,
      cost: { energy: 0, cooldown: 0, castTime: null }, reach: 'spell',
      target: { selectionMode: 'auto', request: { faction: 'enemy', anchor: 'enemy_front', sort: 'index_asc', pickCount: 1 } },
      effects: [
        { type: 'dispel', target: 'target', dispelTarget: 'unit', filter: { category: ['buff'] } },
        {
          op: 'if',
          condition: { kind: 'dispelled_count', cmp: '>=', n: 2 },
          then: [{ type: 'damage', element: 'none', value: 4 }],
          else: [{ type: 'damage', element: 'none', value: 1 }],
        },
      ],
    },
    {
      id: 'probe_pool', name: '状态池', kind: 'passive', sequence: 1, sequenceName: 's1', rarity: 'common',
      axis: 'a', flagship: false, lore: '', flavor: '', describe: '', tentative: false,
      cost: { energy: 0, cooldown: 100, castTime: null }, hook: [], effects: [],
      statusDefs: [BUFF, BUFF_ALT, TALLY],
    },
  ],
} as never

function setup(skill: string, aStatuses: { defId: string; stacks?: number }[], bStatuses: { defId: string; stacks?: number }[]): CombatFacade {
  const make = (unitId: string, faction: 'A' | 'B', skills: string[], st: { defId: string; stacks?: number }[]) => ({
    unitId,
    coordinate: { faction, lane: 'lane0' as const, index: 0 },
    attributeSet: { strength: 1, agility: faction === 'A' ? 30 : 1, intelligence: 1, rank: 0 },
    gender: 'male' as const,
    anchor: 0,
    activeSlots: skills.map((skillDefId) => ({ skillDefId })),
    passiveSlots: [],
    initialStatuses: st.map((s) => ({ defId: s.defId, stacks: s.stacks, sourceId: 'init' })),
  })
  return createCombat({
    seed: 7,
    catalog: buildCatalog([PATH]).catalog,
    board: { clock: { base: 0 }, domainGrants: [] },
    factions: [
      { id: 'A' as const, name: '甲', units: [make('A_u0', 'A', [skill], aStatuses)] },
      { id: 'B' as const, name: '乙', units: [make('B_u0', 'B', [], bStatuses)] },
    ],
    inputs: { decisions: new Map() },
  } as never)
}

const hpOf = (c: CombatFacade, id: string): number => c.state().units.find((u) => u.id === id)!.hp

describe('结算账本（consumed_count / dispelled_count）', () => {
  it('consume(all) 扣光全部层数，consumed_count 与 $consumed 读到实际层数', () => {
    const c = setup('probe_consume', [{ defId: 'probe_tally', stacks: 3 }], [])
    c.step()
    // 门槛 5 + 逐层 3
    expect(hpOf(c, 'B_u0')).toBe(32)
    expect(c.state().units.find((u) => u.id === 'A_u0')!.statuses.some((s) => s.defId === 'probe_tally')).toBe(false)
  })

  it('consumedStacks 对象形态按 div 换算段数', () => {
    const c = setup('probe_consume_obj', [{ defId: 'probe_tally', stacks: 6 }], [])
    c.step()
    expect(hpOf(c, 'B_u0')).toBe(37) // 6 / 2 = 3 段
  })

  it('dispelled_count 读本次驱散数：两个增益 → 高分支', () => {
    const c = setup('probe_break', [], [{ defId: 'probe_buff' }, { defId: 'probe_buff2' }])
    c.step()
    expect(hpOf(c, 'B_u0')).toBe(36)
  })

  it('dispelled_count 每次结算重置：仅一个增益 → 低分支', () => {
    const c = setup('probe_break', [], [{ defId: 'probe_buff' }])
    c.step()
    expect(hpOf(c, 'B_u0')).toBe(39)
  })
})
