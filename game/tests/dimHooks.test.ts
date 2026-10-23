// 维度乘区：dimHooks 按 board 维度阈值参与结算（luminance 覆写栈接通）。
import { describe, expect, it } from 'vitest'
import { createCombat } from '../src/kernel'
import { buildCatalog } from '../src/data/catalogBuild'
import type { PathwayFile } from '../src/data/schema.types'
import type { CombatFacade } from '../src/kernel/combat/types'

const CARD_BASE = {
  kind: 'active' as const, axis: 'a', flagship: false, lore: '', flavor: '', describe: '', tentative: false,
  rarity: 'common' as const, sequence: 9, sequenceName: 's9',
  cost: { energy: 0, cooldown: 100, castTime: null },
  reach: 'spell' as const,
}

const TARGET_ENEMY = {
  request: { faction: 'enemy' as const, anchor: 'enemy_front', sort: 'index_asc' as const, pickCount: 1 },
  selectionMode: 'auto' as const,
}

type Hook = { dim: string; comparator: string; threshold: number; mul: number; target: string }

function pathway(hooks: Hook[]): PathwayFile {
  return {
    pathwayId: 'warrior', pathwayName: '战士', sourceFile: 'probe', sourceVersion: 'test',
    cards: [
      {
        ...CARD_BASE, id: 'probe_holy_bolt', name: '圣光弹', target: TARGET_ENEMY,
        dimHooks: hooks,
        // 同一张卡先点亮白昼再打（dim 读的是本次结算时的 board 值）
        effects: [
          { type: 'set_luminance', value: 8, duration: 60 },
          { type: 'damage', element: 'holy', value: 4, target: 'target' },
        ],
      },
    ],
  } as never
}

const single = (threshold: number, mul: number): Hook[] =>
  [{ dim: 'luminance', comparator: '>=', threshold, mul, target: 'damage' }]

function setup(hooks: Hook[]) {
  return {
    seed: 7,
    catalog: buildCatalog([pathway(hooks)]).catalog,
    board: { clock: { base: 0 }, domainGrants: [] },
    factions: [
      {
        id: 'A' as const, name: '甲',
        units: [{
          unitId: 'A_u0', pathwayId: 'warrior', coordinate: { faction: 'A' as const, lane: 'lane0' as const, index: 0 },
          attributeSet: { strength: 2, agility: 30, intelligence: 1, rank: 0 },
          gender: 'male' as const, anchor: 0,
          activeSlots: [{ skillDefId: 'probe_holy_bolt' }],
          passiveSlots: [], initialStatuses: [],
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

function hpAfterBolt(hooks: Hook[]): number {
  const c: CombatFacade = createCombat(setup(hooks))
  // 白昼先落（A 首动），随后圣光弹命中；B 无技能，HP 只可能因圣光弹下降
  for (let i = 0; i < 60 && !c.ended(); i += 1) {
    c.step()
    const b = c.state().units.find((u) => u.id === 'B_u0')
    if (!b) break
    if (b.hp < b.hpMax) return b.hp
  }
  return c.state().units.find((u) => u.id === 'B_u0')!.hp
}

describe('dimHooks 维度乘区', () => {
  it('光照达阈值时伤害乘 mul（阈值未达则不乘）', () => {
    const met = hpAfterBolt(single(8, 2))
    const unmet = hpAfterBolt(single(9, 2))
    expect(met).toBeLessThan(unmet)
  })

  it('同维度多档只取最贴合一档（微光档不自叠白昼档）', () => {
    const tiered = hpAfterBolt([...single(5, 1.1), ...single(8, 1.5)])
    const daytime = hpAfterBolt(single(8, 1.5))
    expect(tiered).toBe(daytime)
  })
})
