// reviveOf：复活复用死亡单位本体（不新建），受 revive_blocked / oncePerBattle 约束。
import { describe, expect, it } from 'vitest'
import { createCombat } from '../src/kernel'
import { buildCatalog } from '../src/data/catalogBuild'
import type { PathwayFile } from '../src/data/schema.types'
import type { CombatFacade } from '../src/kernel/combat/types'

const SKILL = (id: string, effects: unknown[]) => ({
  id, name: id, kind: 'active' as const, sequence: 9, sequenceName: 's9', rarity: 'common' as const,
  axis: 'a', flagship: false, lore: '', flavor: '', describe: '', tentative: false,
  cost: { energy: 0, cooldown: 0, castTime: null }, reach: 'spell' as const,
  target: {
    selectionMode: 'auto' as const,
    request: { faction: 'enemy' as const, anchor: 'enemy_front', sort: 'index_asc' as const, pickCount: 1 },
  },
  effects,
})

const PATH: PathwayFile = {
  pathwayId: 'probe_revive',
  pathwayName: '复活探针',
  sourceFile: 'probe',
  sourceVersion: 'test',
  cards: [
    SKILL('probe_execute', [{ type: 'damage', element: 'physical', value: 999 }]),
    SKILL('probe_revive_ally', [{ type: 'spawn', reviveOf: 'last_dead_ally', hpRatio: 0.4, position: 'original' }]),
    {
      id: 'probe_rebirth', name: '不死之身', kind: 'passive' as const, sequence: 1, sequenceName: 's1', rarity: 'common' as const,
      axis: 'a', flagship: false, lore: '', flavor: '', describe: '', tentative: false,
      cost: { energy: 0, cooldown: 100, castTime: null }, hook: ['on_death'],
      effects: [{ type: 'spawn', reviveOf: 'self', hpRatio: 0.4, position: 'original', oncePerBattle: true }],
      statusDefs: [
        {
          id: 'probe_revive_blocked', name: '禁复活', category: ['seal'], dispelable: false,
          duration: null, maxStacks: 1, reviveBlocked: true,
        },
      ],
    },
  ],
} as never

interface Slot {
  skills?: string[]
  passives?: string[]
  strength?: number
  agility?: number
  statuses?: string[]
}

function unit(unitId: string, faction: 'A' | 'B', index: number, s: Slot = {}) {
  return {
    unitId,
    coordinate: { faction, lane: 'lane0' as const, index },
    attributeSet: { strength: s.strength ?? 1, agility: s.agility ?? 1, intelligence: 1, rank: 0 },
    gender: 'male' as const,
    anchor: index,
    activeSlots: (s.skills ?? []).map((skillDefId) => ({ skillDefId })),
    passiveSlots: (s.passives ?? []).map((defId) => ({ defId })),
    initialStatuses: (s.statuses ?? []).map((defId) => ({ defId })),
  }
}

function setup(a: ReturnType<typeof unit>[], b: ReturnType<typeof unit>[]) {
  return {
    seed: 7,
    catalog: buildCatalog([PATH]).catalog,
    board: { clock: { base: 0 }, domainGrants: [] },
    factions: [
      { id: 'A' as const, name: '甲', units: a },
      { id: 'B' as const, name: '乙', units: b },
    ],
    inputs: { decisions: new Map() },
  } as never
}

function run(c: CombatFacade, ticks: number): unknown[] {
  for (let i = 0; i < ticks && !c.ended(); i += 1) c.step()
  return [...c.drainEvents()]
}

const unitOf = (c: CombatFacade, id: string) => c.state().units.find((u) => u.id === id)!
const revivedCount = (events: unknown[]): number =>
  events.filter((e) => (e as { type?: string }).type === 'UnitRevived').length

describe('reviveOf:self（on_death 载荷）', () => {
  const killer = () => [unit('A_u0', 'A', 0, { skills: ['probe_execute'], agility: 30 })]

  it('复活原单位：保留坐标，按 hpRatio 回血', () => {
    const c = createCombat(setup(killer(), [unit('B_u0', 'B', 0, { passives: ['probe_rebirth'] })]))
    const events = run(c, 1)
    const b = unitOf(c, 'B_u0')
    expect(b.hp).toBe(16) // hpMax 40 × 0.4
    expect(b.coordinate).toEqual({ faction: 'B', lane: 'lane0', index: 0 })
    expect(revivedCount(events)).toBe(1)
  })

  it('oncePerBattle：第二次死亡不再复活', () => {
    const c = createCombat(setup(killer(), [unit('B_u0', 'B', 0, { passives: ['probe_rebirth'] })]))
    const events = run(c, 3)
    expect(revivedCount(events)).toBe(1)
    expect(unitOf(c, 'B_u0').hp).toBe(0)
  })

  it('revive_blocked：禁复活时直接走死亡结算', () => {
    const c = createCombat(setup(killer(), [unit('B_u0', 'B', 0, {
      passives: ['probe_rebirth'], statuses: ['probe_revive_blocked'],
    })]))
    const events = run(c, 1)
    expect(unitOf(c, 'B_u0').hp).toBe(0)
    expect(revivedCount(events)).toBe(0)
  })
})

describe('reviveOf:last_dead_ally（主动卡）', () => {
  it('复活该阵营最近阵亡单位', () => {
    const c = createCombat(setup(
      [
        unit('A_u0', 'A', 1, { skills: ['probe_revive_ally'], agility: 30 }),
        unit('A_u1', 'A', 0, { strength: 0 }),
      ],
      [unit('B_u0', 'B', 0, { skills: ['probe_execute'] })],
    ))
    run(c, 8)
    const a1 = unitOf(c, 'A_u1')
    expect(a1.hp).toBe(12) // hpMax 30 × 0.4
    expect(a1.coordinate).toEqual({ faction: 'A', lane: 'lane0', index: 0 })
  })
})
