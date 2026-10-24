// 界域触发器：on_tick / on_attack 全局监听，filter.side 相对界域所有者。
import { describe, expect, it } from 'vitest'
import { createCombat } from '../src/kernel'
import { buildCatalog } from '../src/data/catalogBuild'
import type { PathwayFile } from '../src/data/schema.types'
import type { CombatFacade } from '../src/kernel/combat/types'

const CARD = {
  id: 'probe_field', name: '试炼场', kind: 'active' as const, sequence: 9, sequenceName: 's9',
  rarity: 'common' as const, axis: 'a', flagship: false, lore: '', flavor: '', describe: '', tentative: false,
  cost: { energy: 0, cooldown: 100, castTime: null },
  reach: 'none' as const,
  target: { selectionMode: 'auto' as const, request: { mode: 'unit' as const, faction: 'self' as const, anchor: 'caster', pickCount: 1 }, consumption: 'domain' as const },
  effects: [],
  domain: { def: 'probe_domain', duration: 10 },
}

const PATH: PathwayFile = {
  pathwayId: 'warrior', pathwayName: '战士', sourceFile: 'probe', sourceVersion: 'test',
  cards: [CARD],
  domainDefs: [{
    id: 'probe_domain', tier: 'overlay', dispelable: true, duration: 10, durationUnit: 'tick',
    triggers: [
      { event: 'on_tick', effects: [{ type: 'damage', element: 'fire', value: 1, target: 'all_enemies' }] },
      {
        event: 'on_attack', filter: { side: 'enemy' },
        effects: [{ type: 'mount_status', statusId: 'probe_daze', duration: 10, target: 'self' }],
      },
    ],
  }],
} as never

function setup() {
  return {
    seed: 7,
    catalog: buildCatalog([PATH]).catalog,
    board: { clock: { base: 0 }, domainGrants: [] },
    factions: [
      {
        id: 'A' as const, name: '甲',
        units: [{
          unitId: 'A_u0', pathwayId: 'warrior', coordinate: { faction: 'A' as const, lane: 'lane0' as const, index: 0 },
          attributeSet: { strength: 2, agility: 30, intelligence: 1, rank: 0 },
          gender: 'male' as const, anchor: 0,
          activeSlots: [{ skillDefId: 'probe_field' }], passiveSlots: [], initialStatuses: [],
        }],
      },
      {
        id: 'B' as const, name: '乙',
        units: [{
          unitId: 'B_u0', pathwayId: 'warrior', coordinate: { faction: 'B' as const, lane: 'lane0' as const, index: 0 },
          attributeSet: { strength: 2, agility: 1, intelligence: 1, rank: 0 },
          gender: 'male' as const, anchor: 0,
          activeSlots: [], passiveSlots: [], initialStatuses: [],
        }],
      },
    ],
    inputs: { decisions: new Map() },
  } as never
}

function runTicks(c: CombatFacade, n: number): void {
  for (let i = 0; i < n && !c.ended(); i += 1) c.step()
}

describe('界域触发器', () => {
  it('on_tick 群体载荷：敌方每 tick 受火伤', () => {
    const c = createCombat(setup())
    runTicks(c, 2)
    const b0 = c.state().units.find((u) => u.id === 'B_u0')!
    expect(b0.hp).toBeLessThan(b0.hpMax)
    const hp1 = b0.hp
    runTicks(c, 2)
    const b1 = c.state().units.find((u) => u.id === 'B_u0')!
    expect(b1.hp).toBeLessThan(hp1)
  })

  it('on_attack + filter.side:enemy：敌方攻击者被挂状态', () => {
    const c = createCombat(setup())
    let saw = false
    for (let i = 0; i < 30 && !c.ended(); i += 1) {
      c.step()
      const b = c.state().units.find((u) => u.id === 'B_u0')
      if (b?.statuses.some((s) => s.defId === 'probe_daze')) { saw = true; break }
    }
    expect(saw).toBe(true)
  })
})
