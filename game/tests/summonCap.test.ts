// 召唤位上限（H39）：全局基数 3、状态加成按层、绝对覆写取高、超限最老消散、count 展开。
import { describe, expect, it } from 'vitest'
import { createCombat } from '../src/kernel'
import { buildCatalog } from '../src/data/catalogBuild'
import type { PathwayFile } from '../src/data/schema.types'
import type { CombatFacade } from '../src/kernel/combat/types'
import type { StatusDef } from '../src/kernel/catalog/types'
import { makeUnit } from './helpers/fixture'

const LEGION: StatusDef = {
  id: 'probe_legion', name: '军团', category: ['buff'], dispelable: true, duration: 100,
  modifiers: { summon_cap_bonus: 2 },
}

const OVERRIDE: StatusDef = {
  id: 'probe_override', name: '覆写', category: ['buff'], dispelable: true, duration: null,
  modifiers: { summon_cap_override: 2 },
}

/** 维持费型：能量不足时自行折断（军团委特权卡的引擎演练） */
const UPKEEP = {
  id: 'probe_upkeep', name: '号令', category: ['buff'], dispelable: true, duration: 100,
  modifiers: { summon_cap_bonus: 2 },
  triggers: [{
    event: 'on_tick',
    effects: [{
      op: 'if',
      condition: { kind: 'resource_compare', side: 'self', key: 'energy', cmp: '>=', n: 0.4 },
      then: [{ type: 'modify_resource', resource: 'energy', value: -0.4, mode: 'delta', target: 'self' }],
      else: [{ type: 'dispel', statusId: 'probe_upkeep', target: 'self' }],
    }],
  }],
} as unknown as StatusDef

const CARD_BASE = {
  kind: 'active' as const, axis: 'a', flagship: false, lore: '', flavor: '', describe: '', tentative: false,
  rarity: 'common' as const, sequence: 9, sequenceName: 's9',
  cost: { energy: 0, cooldown: 0, castTime: null },
  reach: 'spell' as const,
  target: { request: { faction: 'self' as const, anchor: 'caster', pickCount: 1 }, selectionMode: 'auto' as const },
}

function pathway(opts: { count?: number; withFlag?: boolean; flagDuration?: number; upkeep?: boolean }): PathwayFile {
  const cards: unknown[] = [
    {
      ...CARD_BASE, id: 'probe_raise', name: '唤起',
      effects: [{ type: 'spawn', unitId: 'probe_skeleton', count: opts.count ?? 1, position: 'tail' }],
    },
  ]
  if (opts.withFlag || opts.upkeep) {
    const status = opts.upkeep ? UPKEEP : LEGION
    cards.push({
      ...CARD_BASE, id: 'probe_flag', name: '号令', cost: { energy: 0, cooldown: 100, castTime: null },
      effects: [{ type: 'mount_status', statusId: status.id, duration: opts.flagDuration ?? 100, target: 'self' }],
      statusDefs: [status],
    })
  }
  return {
    pathwayId: 'corpse_collector', pathwayName: '收尸人', sourceFile: 'probe', sourceVersion: 'test',
    cards,
    unitDefs: [{ id: 'probe_skeleton', name: '骨架', unitType: 'UNDEAD', base: { hp: 12, atk: 3 } }],
  } as never
}

function setup(opts: Parameters<typeof pathway>[0] & { int?: number }) {
  return {
    seed: 7,
    catalog: buildCatalog([pathway(opts)]).catalog,
    board: { clock: { base: 0 }, domainGrants: [] },
    factions: [
      {
        id: 'A' as const, name: '甲',
        units: [{
          unitId: 'A_u0', pathwayId: 'corpse_collector', coordinate: { faction: 'A' as const, lane: 'lane0' as const, index: 0 },
          attributeSet: { strength: 2, agility: 30, intelligence: opts.int ?? 1, rank: 0 },
          gender: 'male' as const, anchor: 0,
          activeSlots: opts.withFlag || opts.upkeep
            ? [{ skillDefId: 'probe_flag' }, { skillDefId: 'probe_raise' }]
            : [{ skillDefId: 'probe_raise' }],
          passiveSlots: [], initialStatuses: [],
        }],
      },
      {
        id: 'B' as const, name: '乙',
        units: [{
          unitId: 'B_u0', pathwayId: 'corpse_collector', coordinate: { faction: 'B' as const, lane: 'lane0' as const, index: 0 },
          attributeSet: { strength: 2, agility: 1, intelligence: 1, rank: 0 },
          gender: 'male' as const, anchor: 0,
          activeSlots: [], passiveSlots: [], initialStatuses: [],
        }],
      },
    ],
    inputs: { decisions: new Map() },
  } as never
}

function summons(c: CombatFacade): string[] {
  return c.state().units.filter((u) => u.summonerId === 'A_u0').map((u) => u.id)
}

function runTicks(c: CombatFacade, n: number): void {
  for (let i = 0; i < n && !c.ended(); i += 1) c.step()
}

describe('召唤位上限', () => {
  it('基数 3：连续召唤第 4 只时最老消散', () => {
    const c = createCombat(setup({ count: 1 }))
    runTicks(c, 30)
    const live = summons(c)
    expect(live.length).toBe(3)
  })

  it('spawn.count 展开：count=2 一次落两具', () => {
    const c = createCombat(setup({ count: 2 }))
    runTicks(c, 1)
    expect(summons(c).length).toBe(2)
  })

  it('状态 summon_cap_bonus 抬升上限（+2 → 5 只）', () => {
    const c = createCombat(setup({ count: 1, withFlag: true }))
    runTicks(c, 60)
    expect(summons(c).length).toBe(5)
  })

  it('维持费断供：号令自行折断，超限部分消散', () => {
    // intelligence 0 → 能量再生 0.2/tick，付不起 0.4 维持费
    const c = createCombat(setup({ count: 1, upkeep: true, int: 0 }))
    runTicks(c, 60)
    const a = c.state().units.find((u) => u.id === 'A_u0')!
    expect(a.statuses.some((s) => s.defId === 'probe_upkeep')).toBe(false)
    expect(summons(c).length).toBe(3)
  })

  it('加成到期后超限部分消散，回落基数', () => {
    const c = createCombat(setup({ count: 1, withFlag: true, flagDuration: 3 }))
    runTicks(c, 60)
    expect(summons(c).length).toBe(3)
  })
})

describe('召唤位上限的读数', () => {
  it('bonus 来自状态层与账本；override 与基数取高', () => {
    const u = makeUnit('u', 'A', {}, [LEGION, OVERRIDE])
    expect(u.effectiveSummonCap(3)).toBe(3)
    u.statuses.mount('probe_legion', { sourceId: 's1' })
    expect(u.effectiveSummonCap(3)).toBe(5)
    u.provenance.apply('summon_cap', 1, 'src')
    expect(u.effectiveSummonCap(3)).toBe(6)
    // 绝对覆写 2 低于 6，不压
    u.statuses.mount('probe_override', { sourceId: 's2' })
    expect(u.effectiveSummonCap(3)).toBe(6)
    expect(u.stat('summon_cap')).toBe(6)
  })
})
