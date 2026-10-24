// ZoneDef.valueBoost：所有者己方站在区域内时 stat × mul；离开/到期自动撤销。
import { describe, expect, it } from 'vitest'
import { createCombat } from '../src/kernel'
import { buildCatalog } from '../src/data/catalogBuild'
import type { PathwayFile } from '../src/data/schema.types'
import type { CombatFacade } from '../src/kernel/combat/types'

const PATH: PathwayFile = {
  pathwayId: 'probe_zone_boost',
  pathwayName: '区域倍率探针',
  sourceFile: 'probe',
  sourceVersion: 'test',
  cards: [
    {
      id: 'probe_place', name: '布阵', kind: 'active', sequence: 9, sequenceName: 's9', rarity: 'common',
      axis: 'a', flagship: false, lore: '', flavor: '', describe: '', tentative: false,
      cost: { energy: 0, cooldown: 100, castTime: null }, reach: 'none',
      target: {
        selectionMode: 'auto' as const,
        request: { mode: 'unit' as const, faction: 'self' as const, anchor: 'caster', pickCount: 1 },
        consumption: 'zone' as const,
      },
      zone: { def: 'zone_boost', duration: 2 },
      effects: [],
    },
  ],
  zoneDefs: [{
    id: 'zone_boost', kind: 'blessing', trigger: 'on_enter', affects: 'any',
    duration: 2,
    valueBoost: [{ stat: 'attack', mul: 1.5 }],
    effects: [],
  }],
} as never

function setup(aSkills: string[]) {
  const make = (unitId: string, faction: 'A' | 'B', index: number, strength: number, skills: string[]) => ({
    unitId,
    coordinate: { faction, lane: 'lane0' as const, index },
    attributeSet: { strength, agility: 30, intelligence: 1, rank: 0 },
    gender: 'male' as const,
    anchor: index,
    activeSlots: skills.map((skillDefId) => ({ skillDefId })),
    passiveSlots: [],
    initialStatuses: [],
  })
  return {
    seed: 7,
    catalog: buildCatalog([PATH]).catalog,
    board: { clock: { base: 0 }, domainGrants: [] },
    factions: [
      { id: 'A' as const, name: '甲', units: [make('A_u0', 'A', 0, 1, aSkills)] },
      { id: 'B' as const, name: '乙', units: [make('B_u0', 'B', 0, 10, [])] },
    ],
    inputs: { decisions: new Map() },
  } as never
}

function run(c: CombatFacade, ticks: number): void {
  for (let i = 0; i < ticks && !c.ended(); i += 1) c.step()
}

const bHp = (c: CombatFacade): number => c.state().units.find((u) => u.id === 'B_u0')!.hp

describe('ZoneDef.valueBoost', () => {
  it('站区内攻击 ×1.5，区域到期后恢复', () => {
    const c = createCombat(setup(['probe_place']))
    run(c, 3)
    // tick1 布阵；tick2 攻击 3（2×1.5）；tick3 区域到期，攻击 2
    expect(bHp(c)).toBe(125)
  })

  it('无区域时攻击不增幅', () => {
    const c = createCombat(setup([]))
    run(c, 3)
    expect(bHp(c)).toBe(124) // 3 次普攻 ×2
  })
})
