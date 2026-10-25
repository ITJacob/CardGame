// spawn 残留：original 落位 / reach / gender / lifetime / one_own_snare_trap。
import { describe, expect, it } from 'vitest'
import { createCombat } from '../src/kernel'
import { buildCatalog } from '../src/data/catalogBuild'
import type { CombatFacade, DomainEvent } from '../src/kernel/combat/types'

const BASE = {
  sequence: 9, sequenceName: 's9', rarity: 'common', axis: 'a', flagship: false,
  lore: '', flavor: '', describe: '', tentative: false, reach: 'none',
}

function active(id: string, faction: 'enemy' | 'self', effects: unknown[]): Record<string, unknown> {
  return {
    ...BASE, id, name: id, kind: 'active', cost: { energy: 0, cooldown: 999, castTime: null },
    target: {
      selectionMode: 'auto',
      request: {
        mode: 'unit', faction, anchor: faction === 'self' ? 'caster' : 'enemy_front',
        scope: faction === 'self' ? 'point' : 'whole_lane', sort: 'index_asc', pickCount: 1,
      },
    },
    effects,
  }
}

const PATH = {
  pathwayId: 'warrior', pathwayName: '战士', sourceFile: 'probe', sourceVersion: 'test',
  cards: [
    active('spawn_orig', 'enemy', [{ type: 'spawn', unitId: 'unit_probe', template: 'primary_target', position: 'original' }]),
    active('spawn_life', 'self', [{ type: 'spawn', unitId: 'unit_probe', position: 'tail', lifetime: 1 }]),
    active('spawn_snare', 'self', [
      { type: 'spawn', unitId: 'unit_snare_trap', position: 'tail' },
      { type: 'damage', element: 'physical', value: 999, lethal: true, target: 'one_own_snare_trap' },
    ]),
  ],
  domainDefs: [],
  unitDefs: [
    {
      id: 'unit_probe', name: '探针', unitType: 'CONSTRUCT', gender: 'female',
      base: { hp: 10, atk: 1, reach: 'thrown' },
    },
    {
      id: 'unit_snare_trap', name: '捕兽夹', unitType: 'CONSTRUCT', tags: ['snare_trap'],
      base: { hp: 1, atk: 0, reach: 'melee' },
    },
  ],
} as never

function setup(skill: string) {
  return {
    seed: 7,
    catalog: buildCatalog([PATH]).catalog,
    board: { clock: { base: 0 }, domainGrants: [] },
    factions: [
      {
        id: 'A' as const, name: '甲',
        units: [{
          unitId: 'A_u0', pathwayId: 'warrior', coordinate: { faction: 'A' as const, lane: 'lane0' as const, index: 0 },
          attributeSet: { strength: 1, agility: 0, intelligence: 0, rank: 0 },
          gender: 'male' as const, anchor: 0,
          activeSlots: [{ skillDefId: skill }], passiveSlots: [], initialStatuses: [],
          gauge: { current: 74 },
        }],
      },
      {
        id: 'B' as const, name: '乙',
        units: [{
          unitId: 'B_u0', pathwayId: 'warrior', coordinate: { faction: 'B' as const, lane: 'lane0' as const, index: 1 },
          attributeSet: { strength: 20, agility: 0, intelligence: 0, rank: 0 },
          gender: 'male' as const, anchor: 0,
          activeSlots: [], passiveSlots: [], initialStatuses: [], gauge: { current: 0 },
        }],
      },
    ],
    inputs: { decisions: new Map() },
  } as never
}

function step(c: CombatFacade): DomainEvent[] {
  c.step()
  return [...c.drainEvents()]
}

function spawned(c: CombatFacade): ReturnType<CombatFacade['state']>['units'][number] | undefined {
  return c.state().units.find((u) => u.unitDefId === 'unit_probe' && u.summonerId === 'A_u0')
}

describe('spawn 残留', () => {
  it('position:original 落在同 lane/index；reach/gender 从 unitDef 读取', () => {
    const c = createCombat(setup('spawn_orig'))
    c.drainEvents()
    step(c)
    const u = spawned(c)
    expect(u?.coordinate).toEqual({ faction: 'A', lane: 'lane0', index: 1 })
    expect(u?.gender).toBe('female')
    expect(u?.basicReach).toBe('thrown')
  })

  it('lifetime 到期走消散路径', () => {
    const c = createCombat(setup('spawn_life'))
    c.drainEvents()
    const first = step(c)
    const created = first.find((e) => e.type === 'UnitSpawned')
    expect(created && created.type === 'UnitSpawned' ? created.unitId : undefined).toBeDefined()
    const second = step(c)
    expect(second.some((e) => e.type === 'UnitDispersed' && e.reason === 'lifetime')).toBe(true)
    expect(spawned(c)).toBeUndefined()
  })

  it('one_own_snare_trap：先生成捕兽夹再点名击杀', () => {
    const c = createCombat(setup('spawn_snare'))
    c.drainEvents()
    const ev = step(c)
    const spawnedId = ev.find((e) => e.type === 'UnitSpawned')?.unitId
    const died = ev.find((e) => e.type === 'UnitDied')
    expect(spawnedId).toBeDefined()
    expect(died && died.type === 'UnitDied' ? died.unitId : undefined).toBe(spawnedId)
  })
})
