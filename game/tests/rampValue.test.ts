// valueFrom:ramp（编队参数 §1.1b ramp 行）：on_tick 触发按 ramp 序列递进，配 minIntervalTicks 控制节奏。
import { describe, expect, it } from 'vitest'
import { createCombat } from '../src/kernel'
import { buildCatalog } from '../src/data/catalogBuild'
import type { PathwayFile } from '../src/data/schema.types'
import type { CombatFacade } from '../src/kernel/combat/types'

const PATH: PathwayFile = {
  pathwayId: 'probe_ramp',
  pathwayName: '递增探针',
  sourceFile: 'probe',
  sourceVersion: 'test',
  cards: [
    {
      id: 'probe_defs', name: '状态池', kind: 'passive', sequence: 1, sequenceName: 's1', rarity: 'common',
      axis: 'a', flagship: false, lore: '', flavor: '', describe: '', tentative: false,
      cost: { energy: 0, cooldown: 100, castTime: null }, hook: [], effects: [],
      statusDefs: [
        {
          id: 'probe_ramp', name: '递增', category: ['debuff'], dispelable: true, duration: 20, maxStacks: 1,
          ramp: [1, 1, 2, 2],
          triggers: [{
            event: 'on_tick',
            minIntervalTicks: 5,
            effects: [{
              type: 'damage', element: 'poison', target: 'self',
              valueFrom: { kind: 'ramp' },
            }],
          }],
        },
        {
          id: 'probe_noaction', name: '不行动', category: ['buff'], dispelable: false, duration: null, maxStacks: 1,
          triggers: [{
            event: 'on_apply',
            effects: [{ type: 'modify_resource', resource: 'gauge.threshold', value: 9999, mode: 'set', target: 'self' }],
          }],
        },
      ],
    },
  ],
} as never

function unit(unitId: string, faction: 'A' | 'B', index: number, statuses: string[] = []) {
  return {
    unitId,
    coordinate: { faction, lane: 'lane0' as const, index },
    attributeSet: { strength: 1, agility: 1, intelligence: 1, rank: 0 },
    gender: 'male' as const,
    anchor: index,
    activeSlots: [],
    passiveSlots: [],
    initialStatuses: statuses.map((defId) => ({ defId })),
  }
}

function setup(bStatuses: string[]) {
  return {
    seed: 7,
    catalog: buildCatalog([PATH]).catalog,
    board: { clock: { base: 0 }, domainGrants: [] },
    factions: [
      { id: 'A' as const, name: '甲', units: [unit('A_u0', 'A', 0, ['probe_noaction'])] },
      { id: 'B' as const, name: '乙', units: [unit('B_u0', 'B', 0, bStatuses)] },
    ],
    inputs: { decisions: new Map() },
  } as never
}

function run(c: CombatFacade, ticks: number): void {
  for (let i = 0; i < ticks && !c.ended(); i += 1) c.step()
}

describe('valueFrom:ramp', () => {
  it('按 ramp 序列递进，minIntervalTicks 控制触发节奏', () => {
    const c = createCombat(setup(['probe_ramp']))
    // tick 1 → 1，tick 6 → 1，tick 11 → 2（合计 4）
    run(c, 11)
    expect(c.state().units.find((u) => u.id === 'B_u0')!.hp).toBe(36)
  })

  it('ramp 走完后钳在末项', () => {
    const c = createCombat(setup(['probe_ramp']))
    // 四个触发点 1/6/11/16：1+1+2+2 = 6
    run(c, 16)
    expect(c.state().units.find((u) => u.id === 'B_u0')!.hp).toBe(34)
  })
})
