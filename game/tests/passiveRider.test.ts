// 被动触发器载荷内的效果级 condition：side:target 应读事件受害方，效果 target:'target' 应打受害方。
import { describe, expect, it } from 'vitest'
import { createCombat } from '../src/kernel'
import { buildCatalog } from '../src/data/catalogBuild'
import type { PathwayFile } from '../src/data/schema.types'
import type { CombatFacade } from '../src/kernel/combat/types'

const PATH: PathwayFile = {
  pathwayId: 'probe_rider',
  pathwayName: '被动载荷探针',
  sourceFile: 'probe',
  sourceVersion: 'test',
  cards: [
    {
      id: 'probe_strike', name: '轻击', kind: 'active', sequence: 9, sequenceName: 's9', rarity: 'common',
      axis: 'a', flagship: false, lore: '', flavor: '', describe: '', tentative: false,
      cost: { energy: 0, cooldown: 0, castTime: null }, reach: 'melee',
      target: { selectionMode: 'auto', request: { faction: 'enemy', anchor: 'enemy_front', sort: 'index_asc', pickCount: 1 } },
      effects: [{ type: 'damage', element: 'physical', value: 1 }],
    },
    {
      id: 'probe_rider', name: '读层', kind: 'passive', sequence: 1, sequenceName: 's1', rarity: 'common',
      axis: 'a', flagship: false, lore: '', flavor: '', describe: '', tentative: false,
      cost: { energy: 0, cooldown: 100, castTime: null }, hook: [],
      effects: [],
      triggers: [{
        event: 'on_deal_damage',
        effects: [{
          op: 'if',
          condition: { kind: 'has_status', side: 'target', id: 'probe_marked', cmp: '>=', n: 1 },
          then: [{ type: 'damage', element: 'mental', value: 2, target: 'target' }],
          else: [],
        }],
      }],
      statusDefs: [{ id: 'probe_marked', name: '标记', category: ['debuff'], dispelable: true, duration: null, maxStacks: 1 }],
    },
  ],
} as never

function setup(marked: boolean) {
  const make = (unitId: string, faction: 'A' | 'B', skills: string[], passives: string[], st: string[]) => ({
    unitId,
    coordinate: { faction, lane: 'lane0' as const, index: 0 },
    attributeSet: { strength: 10, agility: 30, intelligence: 1, rank: 0 },
    gender: 'male' as const,
    anchor: 0,
    activeSlots: skills.map((skillDefId) => ({ skillDefId })),
    passiveSlots: passives.map((defId) => ({ defId })),
    initialStatuses: st.map((defId) => ({ defId })),
  })
  return {
    seed: 7,
    catalog: buildCatalog([PATH]).catalog,
    board: { clock: { base: 0 }, domainGrants: [] },
    factions: [
      { id: 'A' as const, name: '甲', units: [make('A_u0', 'A', ['probe_strike'], ['probe_rider'], [])] },
      { id: 'B' as const, name: '乙', units: [make('B_u0', 'B', [], [], marked ? ['probe_marked'] : [])] },
    ],
    inputs: { decisions: new Map() },
  } as never
}

function hpAfterOneHit(c: CombatFacade): number {
  c.step()
  return c.state().units.find((x) => x.id === 'B_u0')!.hp
}

describe('被动触发载荷的效果级条件', () => {
  it('side:target 读受害方；命中带标记目标追加伤害', () => {
    expect(hpAfterOneHit(createCombat(setup(true)))).toBe(127) // 130 - 1 - 2
  })

  it('目标无标记时不追加', () => {
    expect(hpAfterOneHit(createCombat(setup(false)))).toBe(129)
  })
})
