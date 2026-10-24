// 次数型状态：触发器 consumeCharge 每次触发扣 1，归零卸载（SCHEMA `charges` + `consumeCharge`）。
import { describe, expect, it } from 'vitest'
import { createCombat } from '../src/kernel'
import { buildCatalog } from '../src/data/catalogBuild'
import type { PathwayFile } from '../src/data/schema.types'
import type { CombatFacade } from '../src/kernel/combat/types'

const PATH: PathwayFile = {
  pathwayId: 'probe_charges',
  pathwayName: '次数探针',
  sourceFile: 'probe',
  sourceVersion: 'test',
  cards: [
    {
      id: 'probe_hit', name: '打击', kind: 'active', sequence: 9, sequenceName: 's9', rarity: 'common',
      axis: 'a', flagship: false, lore: '', flavor: '', describe: '', tentative: false,
      cost: { energy: 0, cooldown: 0, castTime: null }, reach: 'melee',
      target: { selectionMode: 'auto', request: { faction: 'enemy', anchor: 'enemy_front', sort: 'index_asc', pickCount: 1 } },
      effects: [{ type: 'damage', element: 'none', value: 10 }],
    },
    {
      id: 'probe_pool', name: '状态池', kind: 'passive', sequence: 1, sequenceName: 's1', rarity: 'common',
      axis: 'a', flagship: false, lore: '', flavor: '', describe: '', tentative: false,
      cost: { energy: 0, cooldown: 100, castTime: null }, hook: [], effects: [],
      statusDefs: [{
        id: 'probe_guard', name: '薄纸', category: ['buff'], dispelable: true, duration: null,
        charges: 2,
        modifiers: { damage_taken_mul: 0.5 },
        triggers: [{ event: 'on_take_damage', consumeCharge: 1, effects: [] }],
      }],
    },
  ],
} as never

function setup(): CombatFacade {
  const make = (unitId: string, faction: 'A' | 'B', skills: string[], statuses: { defId: string }[]) => ({
    unitId,
    coordinate: { faction, lane: 'lane0' as const, index: 0 },
    attributeSet: { strength: 1, agility: faction === 'A' ? 30 : 1, intelligence: 1, rank: 0 },
    gender: 'male' as const,
    anchor: 0,
    activeSlots: skills.map((skillDefId) => ({ skillDefId })),
    passiveSlots: [],
    initialStatuses: statuses.map((s) => ({ defId: s.defId, sourceId: 'init' })),
  })
  return createCombat({
    seed: 7,
    catalog: buildCatalog([PATH]).catalog,
    board: { clock: { base: 0 }, domainGrants: [] },
    factions: [
      { id: 'A' as const, name: '甲', units: [make('A_u0', 'A', ['probe_hit'], [])] },
      { id: 'B' as const, name: '乙', units: [make('B_u0', 'B', [], [{ defId: 'probe_guard' }])] },
    ],
    inputs: { decisions: new Map() },
  } as never)
}

describe('次数型状态（consumeCharge）', () => {
  it('每次触发扣 1 次，归零后卸载并停止减伤', () => {
    const c = setup()
    for (let i = 0; i < 3; i += 1) c.step()
    const b = c.state().units.find((u) => u.id === 'B_u0')!
    expect(b.hp).toBe(20) // 5 + 5 + 10
    expect(b.statuses.some((s) => s.defId === 'probe_guard')).toBe(false)
  })
})
