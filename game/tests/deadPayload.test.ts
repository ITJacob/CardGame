// 亡者载荷：on_kill → killed_unit / on_death → self 的状态挂载落在尸体上（亡骸可寻址，编队上下文 §十）。
import { describe, expect, it } from 'vitest'
import { createCombat } from '../src/kernel'
import { buildCatalog } from '../src/data/catalogBuild'
import type { PathwayFile } from '../src/data/schema.types'
import type { CombatFacade } from '../src/kernel/combat/types'

const MARK = (id: string, name: string) => ({
  id, name, category: ['buff'], dispelable: false, duration: null, maxStacks: 1,
})

const PATH: PathwayFile = {
  pathwayId: 'probe_dead_payload',
  pathwayName: '亡者载荷探针',
  sourceFile: 'probe',
  sourceVersion: 'test',
  cards: [
    {
      id: 'probe_execute', name: '处决', kind: 'active', sequence: 9, sequenceName: 's9', rarity: 'common',
      axis: 'a', flagship: false, lore: '', flavor: '', describe: '', tentative: false,
      cost: { energy: 0, cooldown: 0, castTime: null }, reach: 'melee',
      target: { request: { faction: 'enemy', anchor: 'enemy_front', sort: 'index_asc', pickCount: 1 }, selectionMode: 'auto' },
      effects: [{ type: 'damage', value: 999, element: 'physical' }],
    },
    {
      id: 'probe_rites', name: '封禁仪式', kind: 'passive', sequence: 1, sequenceName: 's1', rarity: 'common',
      axis: 'a', flagship: false, lore: '', flavor: '', describe: '', tentative: false,
      hook: ['on_battle_start'],
      effects: [{ type: 'mount_status', statusId: 'probe_reaper', duration: null, target: 'self' }],
      statusDefs: [
        {
          ...MARK('probe_reaper', '封禁者'),
          triggers: [
            { event: 'on_kill', effects: [{ type: 'mount_status', statusId: 'probe_seal', target: 'killed_unit', duration: null }] },
          ],
        },
        MARK('probe_seal', '禁复活'),
      ],
    },
    {
      id: 'probe_grave', name: '亡语', kind: 'passive', sequence: 1, sequenceName: 's1', rarity: 'common',
      axis: 'a', flagship: false, lore: '', flavor: '', describe: '', tentative: false,
      hook: ['on_battle_start'],
      effects: [{ type: 'mount_status', statusId: 'probe_grave_s', duration: null, target: 'self' }],
      statusDefs: [
        {
          ...MARK('probe_grave_s', '亡语体'),
          triggers: [
            { event: 'on_death', effects: [{ type: 'mount_status', statusId: 'probe_epitaph', duration: null, target: 'self' }] },
          ],
        },
        MARK('probe_epitaph', '墓志铭'),
      ],
    },
  ],
}

interface Slot { skills?: string[]; passives?: string[] }

function unit(unitId: string, faction: 'A' | 'B', index: number, s: Slot = {}) {
  return {
    unitId,
    coordinate: { faction, lane: 'lane0' as const, index },
    attributeSet: { strength: 1, agility: 1, intelligence: 1, rank: 0 },
    gender: 'male' as const,
    anchor: index,
    activeSlots: (s.skills ?? []).map((skillDefId) => ({ skillDefId })),
    passiveSlots: (s.passives ?? []).map((defId) => ({ defId })),
    initialStatuses: [],
  }
}

function setup() {
  return {
    seed: 7,
    catalog: buildCatalog([PATH]).catalog,
    board: { clock: { base: 0 }, domainGrants: [] },
    factions: [
      { id: 'A' as const, name: '甲', units: [unit('A_u0', 'A', 0, { skills: ['probe_execute'], passives: ['probe_rites'] })] },
      { id: 'B' as const, name: '乙', units: [unit('B_u0', 'B', 0, { passives: ['probe_grave'] })] },
    ],
    inputs: { decisions: new Map() },
  } as never
}

function runToDeath(c: CombatFacade): void {
  for (let i = 0; i < 20 && !c.ended(); i += 1) c.step()
}

const corpseHas = (c: CombatFacade, unitId: string, defId: string): boolean => {
  const u = c.state().units.find((x) => x.id === unitId)
  return !!u && u.hp <= 0 && u.statuses.some((s) => s.defId === defId)
}

describe('亡者载荷落在尸体上', () => {
  it('on_kill 的 killed_unit 状态挂载不被 isDead 丢弃', () => {
    const c = createCombat(setup())
    runToDeath(c)
    expect(corpseHas(c, 'B_u0', 'probe_seal')).toBe(true)
  })

  it('on_death 的 self 状态挂载同样保留在亡骸上', () => {
    const c = createCombat(setup())
    runToDeath(c)
    expect(corpseHas(c, 'B_u0', 'probe_epitaph')).toBe(true)
  })
})
