// zone_active 条件：场上存在指定 zoneDef 的 Active 区域时成立。
import { describe, expect, it } from 'vitest'
import { createCombat } from '../src/kernel'
import { buildCatalog } from '../src/data/catalogBuild'
import type { PathwayFile } from '../src/data/schema.types'
import type { CombatFacade } from '../src/kernel/combat/types'

const BASE = {
  kind: 'active' as const, sequence: 9, sequenceName: 's9', rarity: 'common' as const,
  axis: 'a', flagship: false, lore: '', flavor: '', describe: '', tentative: false,
  cost: { energy: 0, cooldown: 0, castTime: null }, reach: 'none' as const,
}

const PATH: PathwayFile = {
  pathwayId: 'probe_zone',
  pathwayName: '区域探针',
  sourceFile: 'probe',
  sourceVersion: 'test',
  cards: [
    {
      ...BASE, id: 'probe_place_zone', name: '布阵',
      target: {
        selectionMode: 'auto' as const,
        request: { mode: 'unit' as const, faction: 'self' as const, anchor: 'caster', pickCount: 1 },
        consumption: 'zone' as const,
      },
      zone: { def: 'zone_probe', duration: 20 },
      effects: [],
    },
    {
      ...BASE, id: 'probe_check_zone', name: '读阵',
      target: {
        selectionMode: 'auto' as const,
        request: { mode: 'unit' as const, faction: 'self' as const, anchor: 'caster', pickCount: 1 },
      },
      effects: [{
        op: 'if',
        condition: { kind: 'zone_active', zoneId: 'zone_probe' },
        then: [{ type: 'mount_status', statusId: 'probe_zone_mark', duration: null, target: 'self' }],
        else: [],
      }],
    },
    {
      id: 'probe_defs', name: '状态池', kind: 'passive', sequence: 1, sequenceName: 's1', rarity: 'common',
      axis: 'a', flagship: false, lore: '', flavor: '', describe: '', tentative: false,
      cost: { energy: 0, cooldown: 0, castTime: null }, hook: [], effects: [],
      statusDefs: [{ id: 'probe_zone_mark', name: '阵中', category: ['buff'], dispelable: false, duration: null, maxStacks: 1 }],
    },
  ],
  zoneDefs: [{
    id: 'zone_probe', kind: 'blessing', trigger: 'on_occupy_tick', affects: 'ally_of_owner',
    duration: 20, effects: [],
  }],
} as never

function setup(aSkills: string[]) {
  const make = (unitId: string, faction: 'A' | 'B', index: number, skills: string[]) => ({
    unitId,
    coordinate: { faction, lane: 'lane0' as const, index },
    attributeSet: { strength: 1, agility: 30, intelligence: 1, rank: 0 },
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
      { id: 'A' as const, name: '甲', units: [make('A_u0', 'A', 0, aSkills)] },
      { id: 'B' as const, name: '乙', units: [make('B_u0', 'B', 0, [])] },
    ],
    inputs: { decisions: new Map() },
  } as never
}

function run(c: CombatFacade, ticks: number): void {
  for (let i = 0; i < ticks && !c.ended(); i += 1) c.step()
}

const hasMark = (c: CombatFacade): boolean =>
  c.state().units.find((u) => u.id === 'A_u0')!.statuses.some((s) => s.defId === 'probe_zone_mark')

describe('zone_active 条件', () => {
  it('先布阵再读阵：条件成立', () => {
    const c = createCombat(setup(['probe_place_zone', 'probe_check_zone']))
    run(c, 4)
    expect(hasMark(c)).toBe(true)
  })

  it('未布阵时条件不成立', () => {
    const c = createCombat(setup(['probe_check_zone']))
    run(c, 3)
    expect(hasMark(c)).toBe(false)
  })
})
