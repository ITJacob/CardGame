// 亡骸：3 tick 生命周期与 filter.corpse 寻址。
import { describe, expect, it } from 'vitest'
import { createCombat } from '../src/kernel'
import { resolveCandidates } from '../src/kernel/execution/target'
import { buildCatalog } from '../src/data/catalogBuild'
import type { CombatFacade, DomainEvent } from '../src/kernel/combat/types'
import { makeUnit } from './helpers/fixture'
import { registryOf } from './helpers/context'

const BASE_CARD = {
  sequence: 9, sequenceName: 's9', rarity: 'common', axis: 'a', flagship: false,
  lore: '', flavor: '', describe: '', tentative: false, reach: 'none',
}

function active(id: string, effects: unknown[], filter?: Record<string, unknown>): Record<string, unknown> {
  return {
    ...BASE_CARD, id, name: id, kind: 'active', cost: { energy: 0, cooldown: 999, castTime: null },
    target: {
      selectionMode: 'auto',
      request: {
        mode: 'unit', faction: 'enemy', anchor: 'enemy_front', scope: 'whole_lane',
        sort: 'index_asc', pickCount: 1, filter,
      },
    },
    effects,
  }
}

const PATH = {
  pathwayId: 'warrior', pathwayName: '战士', sourceFile: 'probe', sourceVersion: 'test',
  cards: [
    active('kill', [{ type: 'damage', element: 'physical', value: 999 }]),
    active('mark', [{ type: 'mount_status', statusId: 'probe_mark', duration: 10 }], { corpse: true }),
  ],
  domainDefs: [],
  statusDefs: [{ id: 'probe_mark', name: '亡骸标记', category: ['debuff'], dispelable: true, duration: 10 }],
} as never

function setup() {
  return {
    seed: 7,
    catalog: buildCatalog([PATH]).catalog,
    board: { clock: { base: 0 }, domainGrants: [] },
    factions: [
      {
        id: 'A' as const, name: '甲',
        units: [
          {
            unitId: 'A0', pathwayId: 'warrior', coordinate: { faction: 'A' as const, lane: 'lane0' as const, index: 0 },
            attributeSet: { strength: 1, agility: 0, intelligence: 0, rank: 0 },
            gender: 'male' as const, anchor: 0,
            activeSlots: [{ skillDefId: 'kill' }], passiveSlots: [], initialStatuses: [],
            gauge: { current: 74 },
          },
          {
            unitId: 'A1', pathwayId: 'warrior', coordinate: { faction: 'A' as const, lane: 'lane0' as const, index: 1 },
            attributeSet: { strength: 1, agility: 0, intelligence: 0, rank: 0 },
            gender: 'male' as const, anchor: 0,
            activeSlots: [{ skillDefId: 'mark' }], passiveSlots: [], initialStatuses: [],
            gauge: { current: 74 },
          },
        ],
      },
      {
        id: 'B' as const, name: '乙',
        units: [
          {
            unitId: 'B0', pathwayId: 'warrior', coordinate: { faction: 'B' as const, lane: 'lane0' as const, index: 0 },
            attributeSet: { strength: 1, agility: 0, intelligence: 0, rank: 0 },
            gender: 'male' as const, anchor: 0,
            activeSlots: [], passiveSlots: [], initialStatuses: [], gauge: { current: 0 },
          },
          {
            unitId: 'B1', pathwayId: 'warrior', coordinate: { faction: 'B' as const, lane: 'lane0' as const, index: 1 },
            attributeSet: { strength: 20, agility: 0, intelligence: 0, rank: 0 },
            gender: 'male' as const, anchor: 0,
            activeSlots: [], passiveSlots: [], initialStatuses: [], gauge: { current: 0 },
          },
        ],
      },
    ],
    inputs: { decisions: new Map() },
  } as never
}

function statusIds(c: CombatFacade, id: string): string[] {
  return c.state().units.find((u) => u.id === id)?.statuses.map((s) => s.defId) ?? []
}

function step(c: CombatFacade): DomainEvent[] {
  c.step()
  return [...c.drainEvents()]
}

describe('亡骸', () => {
  it('同 tick 击杀后，filter.corpse 可对亡骸挂状态；普通单位不受影响', () => {
    const c = createCombat(setup())
    c.drainEvents()
    step(c)
    expect(statusIds(c, 'B0')).toContain('probe_mark')
    expect(statusIds(c, 'B1')).not.toContain('probe_mark')
  })

  it('3 tick 后发 CorpseExpired', () => {
    const c = createCombat(setup())
    const next = (() => {
      let cursor = 0
      return () => {
        const all = c.drainEvents()
        const out = all.slice(cursor)
        cursor = all.length
        return [...out]
      }
    })()
    next()
    c.step()
    const t1 = next()
    expect(t1.some((e) => e.type === 'UnitDied' && e.unitId === 'B0')).toBe(true)
    c.step()
    expect(next().some((e) => e.type === 'CorpseExpired')).toBe(false)
    c.step()
    expect(next().some((e) => e.type === 'CorpseExpired')).toBe(false)
    c.step()
    expect(next().some((e) => e.type === 'CorpseExpired' && e.unitId === 'B0')).toBe(true)
  })

  it('last_dead_ally + corpse 按最近阵亡排序；普通池排除死者', () => {
    const live = makeUnit('A0', 'A')
    const d1 = makeUnit('D1', 'B')
    const d2 = makeUnit('D2', 'B')
    d1.pool('hp').setValue(0)
    d2.pool('hp').setValue(0)
    const units = registryOf(live, d1, d2)
    const corpses = new Map([
      ['D1', { coord: { faction: 'B' as const, lane: 'lane0', index: 0 }, order: 1 }],
      ['D2', { coord: { faction: 'B' as const, lane: 'lane0', index: 1 }, order: 2 }],
    ])
    const ctx = {
      units,
      self: live,
      enemyFaction: 'B',
      lanes: ['lane0'],
      laneCapacity: 4,
      corpseOf: (id: string) => corpses.get(id),
    }
    const corpsesOnly = resolveCandidates({
      mode: 'unit', faction: 'enemy', anchor: 'last_dead_ally', pickCount: 1, filter: { corpse: true },
    } as never, ctx as never)
    expect(corpsesOnly.map((t) => t.occupant)).toEqual(['D2', 'D1'])
    const normal = resolveCandidates({
      mode: 'unit', faction: 'enemy', anchor: 'enemy_front', pickCount: 1,
    } as never, ctx as never)
    expect(normal).toEqual([])
  })
})
