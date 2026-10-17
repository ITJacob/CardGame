// P2a global 触发器：状态/被动上的 global:true 监听事件源，
// 触发器级 condition 按事件源求值（执行参数 §2.1b 全局监听规则）。
import { describe, expect, it } from 'vitest'
import { createCombat } from '../src/kernel'
import { buildCatalog } from '../src/data/catalogBuild'
import type { PathwayFile } from '../src/data/schema.types'
import type { CombatFacade } from '../src/kernel/combat/types'

const MARK = (id: string, name: string) => ({
  id, name, category: ['buff'], dispelable: false, duration: null, maxStacks: 1,
})

/** 甲：u0 施放主动技能；乙：u0 持 probe_mind（开局挂 probe_insight） */
const GLOBAL_PROBE: PathwayFile = {
  pathwayId: 'probe_global',
  pathwayName: '全局触发探针',
  sourceFile: 'probe',
  sourceVersion: 'test',
  cards: [
    {
      id: 'probe_ping', name: '探针轻触', kind: 'active', sequence: 1, sequenceName: 's1', rarity: 'common',
      axis: 'a', flagship: false, lore: '', flavor: '', describe: '', tentative: false,
      cost: { energy: 0, cooldown: 0, castTime: null }, reach: 'spell',
      target: { request: { faction: 'enemy', anchor: 'enemy_front', sort: 'index_asc', pickCount: 1 }, selectionMode: 'auto' },
      effects: [{ type: 'mount_status', statusId: 'probe_soothed', duration: null, target: 'target' }],
    },
    {
      id: 'probe_mind', name: '心象探针', kind: 'passive', sequence: 2, sequenceName: 's2', rarity: 'common',
      axis: 'a', flagship: false, lore: '', flavor: '', describe: '', tentative: false,
      hook: ['on_battle_start'],
      effects: [{ type: 'mount_status', statusId: 'probe_insight', duration: null, target: 'self' }],
      statusDefs: [
        {
          ...MARK('probe_insight', '心象探针'),
          triggers: [
            {
              event: 'on_active_skill',
              global: true,
              condition: { kind: 'faction_is', side: 'target', value: 'enemy' },
              effects: [{ type: 'mount_status', statusId: 'probe_stack', duration: null, target: 'self' }],
            },
          ],
        },
        MARK('probe_stack', '心象层'),
        MARK('probe_soothed', '安抚'),
      ],
    },
  ],
}

type Side = 'A' | 'B'
interface Slot { skills?: string[]; passives?: string[]; attributes?: number }

function unit(unitId: string, faction: Side, index: number, s: Slot = {}) {
  const n = s.attributes ?? 6
  return {
    unitId,
    coordinate: { faction, lane: 'lane0' as const, index },
    attributeSet: { strength: n, agility: 1, intelligence: 1, rank: 0 },
    gender: 'male' as const,
    anchor: index,
    activeSlots: (s.skills ?? []).map((skillDefId) => ({ skillDefId })),
    passiveSlots: (s.passives ?? []).map((defId) => ({ defId })),
    initialStatuses: [],
  }
}

function setup(factions: { A: ReturnType<typeof unit>[]; B: ReturnType<typeof unit>[] }) {
  return {
    seed: 7,
    catalog: buildCatalog([GLOBAL_PROBE]).catalog,
    board: { clock: { base: 0 }, domainGrants: [] },
    factions: [
      { id: 'A' as const, name: '甲', units: factions.A },
      { id: 'B' as const, name: '乙', units: factions.B },
    ],
    inputs: { decisions: new Map() },
  } as never
}

function run(c: CombatFacade, ticks: number): void {
  for (let i = 0; i < ticks && !c.ended(); i += 1) c.step()
}

const has = (c: CombatFacade, unitId: string, defId: string): boolean => {
  const u = c.state().units.find((x) => x.id === unitId)
  return !!u && u.statuses.some((s) => s.defId === defId)
}

describe('global 触发器按事件源派发', () => {
  it('敌方施放主动技能时，监听者自身的心象 +1', () => {
    const c = createCombat(setup({
      A: [unit('A_u0', 'A', 0, { skills: ['probe_ping'] })],
      B: [unit('B_u0', 'B', 0, { passives: ['probe_mind'] })],
    }))
    run(c, 12)
    expect(has(c, 'B_u0', 'probe_stack')).toBe(true)
    expect(has(c, 'A_u0', 'probe_stack')).toBe(false)
  })

  it('自己施法不触发“敌方施法”分支', () => {
    const c = createCombat(setup({
      A: [unit('A_u0', 'A', 0, { skills: ['probe_ping'], passives: ['probe_mind'] })],
      B: [unit('B_u0', 'B', 0)],
    }))
    run(c, 12)
    expect(has(c, 'A_u0', 'probe_stack')).toBe(false)
  })
})
