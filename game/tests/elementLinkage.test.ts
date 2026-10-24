// 设计箱①：同元素共鸣（状态端 1/3/4 档）与对立元素相消（伤害 ×0.85 + 削 1 层）。
import { describe, expect, it } from 'vitest'
import { createCombat } from '../src/kernel'
import { buildCatalog } from '../src/data/catalogBuild'
import type { PathwayFile } from '../src/data/schema.types'
import type { CombatFacade } from '../src/kernel/combat/types'

const PATH: PathwayFile = {
  pathwayId: 'probe_elem',
  pathwayName: '元素联动探针',
  sourceFile: 'probe',
  sourceVersion: 'test',
  cards: [
    {
      id: 'probe_fire', name: '火击', kind: 'active', sequence: 9, sequenceName: 's9', rarity: 'common',
      axis: 'a', flagship: false, lore: '', flavor: '', describe: '', tentative: false,
      cost: { energy: 0, cooldown: 0, castTime: null }, reach: 'spell',
      target: { selectionMode: 'auto', request: { faction: 'enemy', anchor: 'enemy_front', sort: 'index_asc', pickCount: 1 } },
      effects: [{ type: 'damage', element: 'fire', value: 10 }],
    },
    {
      id: 'probe_tag', name: '识水', kind: 'active', sequence: 9, sequenceName: 's9', rarity: 'common',
      axis: 'a', flagship: false, lore: '', flavor: '', describe: '', tentative: false,
      cost: { energy: 0, cooldown: 0, castTime: null }, reach: 'spell',
      target: { selectionMode: 'auto', request: { faction: 'enemy', anchor: 'enemy_front', sort: 'index_asc', pickCount: 1 } },
      effects: [{ op: 'if', condition: { kind: 'has_status_tag', side: 'target', tag: 'water', cmp: '>=', n: 1 },
        then: [{ type: 'damage', element: 'ice', value: 2, target: 'target' }], else: [] }],
    },
    {
      id: 'probe_defs', name: '状态池', kind: 'passive', sequence: 1, sequenceName: 's1', rarity: 'common',
      axis: 'a', flagship: false, lore: '', flavor: '', describe: '', tentative: false,
      cost: { energy: 0, cooldown: 100, castTime: null }, hook: [], effects: [],
      statusDefs: [
        { id: 'probe_wet', name: '浸水', category: ['debuff'], dispelable: true, duration: null, maxStacks: 1, tags: ['water'] },
        { id: 'probe_frost', name: '寒霜', category: ['debuff'], dispelable: true, duration: null, maxStacks: 3, element: 'ice' },
        {
          id: 'probe_ember', name: '余烬', category: ['debuff'], dispelable: true, duration: null, maxStacks: 3,
          element: 'fire',
          triggers: [{
            event: 'on_take_damage',
            condition: { kind: 'element_is', element: 'fire' },
            effects: [
              { type: 'modify_status', statusId: 'probe_ember', stacksDelta: 1, target: 'self' },
              { type: 'mount_status', statusId: 'probe_counter', stacks: 1, target: 'self' },
            ],
          }],
        },
        {
          id: 'probe_counter', name: '计数', category: ['debuff'], dispelable: false, duration: null,
          maxStacks: 3, stackPolicy: 'stack', element: 'fire',
          stackThreshold: {
            stacks: 3,
            effects: [
              { type: 'damage', element: 'fire', value: 3, target: 'self' },
              { type: 'dispel', target: 'self', dispelTarget: 'unit', filter: { statusId: 'probe_counter', count: 1 } },
            ],
          },
        },
        {
          id: 'probe_ascend_src', name: '升阶源', category: ['debuff'], dispelable: true, duration: null, maxStacks: 3,
          element: 'fire',
          stackThreshold: {
            stacks: 3,
            effects: [
              { type: 'mount_status', statusId: 'probe_ascended', stacks: 1, target: 'self' },
              { type: 'dispel', target: 'self', dispelTarget: 'unit', filter: { statusId: 'probe_ascend_src', count: 1 } },
            ],
          },
        },
        { id: 'probe_ascended', name: '升阶体', category: ['debuff'], dispelable: true, duration: null, maxStacks: 1, element: 'fire' },
      ],
    },
  ],
} as never

function setup(bStatuses: { defId: string; stacks?: number }[]) {
  const make = (unitId: string, faction: 'A' | 'B', skills: string[], st: { defId: string; stacks?: number }[]) => ({
    unitId,
    coordinate: { faction, lane: 'lane0' as const, index: 0 },
    attributeSet: { strength: 1, agility: 30, intelligence: 1, rank: 0 },
    gender: 'male' as const,
    anchor: 0,
    activeSlots: skills.map((skillDefId) => ({ skillDefId })),
    passiveSlots: [],
    initialStatuses: st.map((s) => ({ defId: s.defId, stacks: s.stacks, sourceId: 'init' })),
  })
  return {
    seed: 7,
    catalog: buildCatalog([PATH]).catalog,
    board: { clock: { base: 0 }, domainGrants: [] },
    factions: [
      { id: 'A' as const, name: '甲', units: [make('A_u0', 'A', ['probe_fire'], [])] },
      { id: 'B' as const, name: '乙', units: [make('B_u0', 'B', [], bStatuses)] },
    ],
    inputs: { decisions: new Map() },
  } as never
}

function afterOneHit(c: CombatFacade): { hp: number; stacks: (id: string) => number } {
  c.step()
  const b = c.state().units.find((u) => u.id === 'B_u0')!
  return { hp: b.hp, stacks: (id) => b.statuses.find((s) => s.defId === id)?.stacks ?? 0 }
}

describe('元素联动', () => {
  it('相消：火伤命中冰状态 → 削 1 层且本次伤害 ×0.85', () => {
    const r = afterOneHit(createCombat(setup([{ defId: 'probe_frost', stacks: 2 }])))
    expect(r.stacks('probe_frost')).toBe(1)
    expect(r.hp).toBe(31.5)
  })

  it('标签联动：has_status_tag 按状态 tag 判定', () => {
    const c = createCombat({
      ...(setup([{ defId: 'probe_wet' }]) as Record<string, unknown>),
      factions: [
        { id: 'A', name: '甲', units: [{
          unitId: 'A_u0', coordinate: { faction: 'A', lane: 'lane0', index: 0 },
          attributeSet: { strength: 1, agility: 30, intelligence: 1, rank: 0 }, gender: 'male', anchor: 0,
          activeSlots: [{ skillDefId: 'probe_tag' }], passiveSlots: [], initialStatuses: [],
        }] },
        { id: 'B', name: '乙', units: [{
          unitId: 'B_u0', coordinate: { faction: 'B', lane: 'lane0', index: 0 },
          attributeSet: { strength: 1, agility: 1, intelligence: 1, rank: 0 }, gender: 'male', anchor: 0,
          activeSlots: [], passiveSlots: [], initialStatuses: [{ defId: 'probe_wet', sourceId: 'init' }],
        }] },
      ],
    } as never)
    c.step()
    expect(c.state().units.find((u) => u.id === 'B_u0')!.hp).toBe(38)
  })

  it('共鸣：同元素伤害给对应状态 +1 层', () => {
    const r = afterOneHit(createCombat(setup([{ defId: 'probe_ember', stacks: 1 }])))
    expect(r.stacks('probe_ember')).toBe(2)
  })

  it('共鸣 3 档：计数达 3 触发燃尽', () => {
    const c = createCombat(setup([{ defId: 'probe_ember', stacks: 1 }]))
    for (let i = 0; i < 3; i += 1) c.step()
    expect(c.state().units.find((u) => u.id === 'B_u0')!.hp).toBe(7) // 40 - 3×10 - 燃尽 3
  })

  it('共鸣 4 档：满层升阶并移除原状态', () => {
    const c = createCombat(setup([{ defId: 'probe_ascend_src', stacks: 3 }]))
    c.step()
    const b = c.state().units.find((u) => u.id === 'B_u0')!
    expect(b.statuses.some((x) => x.defId === 'probe_ascend_src')).toBe(false)
    expect(b.statuses.some((x) => x.defId === 'probe_ascended')).toBe(true)
  })
})
