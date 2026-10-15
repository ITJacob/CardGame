// 触发器载荷 target 求值（执行参数 §2.3 载荷主体表 / 共享内核参数 §一 EffectRef.target）：
// 触发器效果上的 target 简写按「宿主 / 作用者 / 受害方 / 攻击方 / 被击杀者」求值，
// 群体与几何简写按宿主阵营展开——不再一律落在触发器宿主身上（旧行为）。
import { describe, expect, it } from 'vitest'
import { createCombat } from '../src/kernel'
import { buildCatalog } from '../src/data/catalogBuild'
import type { PathwayFile } from '../src/data/schema.types'
import type { CombatFacade } from '../src/kernel/combat/types'

const MARK = (id: string, name: string) => ({
  id, name, category: ['buff'], dispelable: false, duration: null, maxStacks: 1,
})

/** 甲：u0 持有 probe_marks（由乙的 probe_brand 施加）；乙：u1 施法并普攻 */
const BRAND: PathwayFile = {
  pathwayId: 'probe_payload_brand',
  pathwayName: '载荷探针·施加',
  sourceFile: 'probe',
  sourceVersion: 'test',
  cards: [
    {
      id: 'probe_strike', name: '轻击', kind: 'active', sequence: 2, sequenceName: 's2', rarity: 'common',
      axis: 'a', flagship: false, lore: '', flavor: '', describe: '', tentative: false,
      cost: { energy: 0, cooldown: 0, castTime: null }, reach: 'melee',
      target: { request: { faction: 'enemy', anchor: 'enemy_front', sort: 'index_asc', pickCount: 1 }, selectionMode: 'auto' },
      effects: [{ type: 'damage', value: 1, element: 'physical' }],
    },
    {
      id: 'probe_brand', name: '烙印', kind: 'active', sequence: 1, sequenceName: 's1', rarity: 'common',
      axis: 'a', flagship: false, lore: '', flavor: '', describe: '', tentative: false,
      cost: { energy: 0, cooldown: 0, castTime: null }, reach: 'spell',
      target: { request: { faction: 'enemy', anchor: 'enemy_front', sort: 'index_asc', pickCount: 1 }, selectionMode: 'auto' },
      effects: [{ type: 'mount_status', statusId: 'probe_marks', duration: null }],
      statusDefs: [
        {
          ...MARK('probe_marks', '烙印'),
          triggers: [
            { event: 'on_take_damage', effects: [{ type: 'mount_status', statusId: 'probe_hit_by', target: 'attacker', duration: null }] },
            { event: 'on_deal_damage', effects: [{ type: 'mount_status', statusId: 'probe_dealt_to', target: 'target', duration: null }] },
            { event: 'on_deal_damage', effects: [{ type: 'mount_status', statusId: 'probe_applier', target: 'caster', duration: null }] },
            { event: 'on_tick', effects: [{ type: 'mount_status', statusId: 'probe_tick_self', duration: null }] },
          ],
        },
        MARK('probe_hit_by', '挨打标记'),
        MARK('probe_dealt_to', '出手标记'),
        MARK('probe_applier', '施加者标记'),
        MARK('probe_tick_self', '无 target 标记'),
      ],
    },
  ],
}

/** 乙：u0 处决者（一击必杀）；u1 友军。甲：u2 靶子；u3 友军 */
const REAPER: PathwayFile = {
  pathwayId: 'probe_payload_reap',
  pathwayName: '载荷探针·击杀',
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
      id: 'probe_rites', name: '收割仪式', kind: 'passive', sequence: 1, sequenceName: 's1', rarity: 'common',
      axis: 'a', flagship: false, lore: '', flavor: '', describe: '', tentative: false,
      hook: ['on_battle_start'],
      effects: [{ type: 'mount_status', statusId: 'probe_reaper', duration: null, target: 'self' }],
      statusDefs: [
        {
          ...MARK('probe_reaper', '收割者'),
          triggers: [
            { event: 'on_kill', effects: [{ type: 'mount_status', statusId: 'probe_kill_ally', target: 'all_allies', duration: null }] },
          ],
        },
        MARK('probe_kill_ally', '击杀扩散'),
      ],
    },
    {
      id: 'probe_beacon', name: '信标', kind: 'passive', sequence: 2, sequenceName: 's2', rarity: 'common',
      axis: 'a', flagship: false, lore: '', flavor: '', describe: '', tentative: false,
      hook: ['on_battle_start'],
      effects: [{ type: 'mount_status', statusId: 'probe_beacon_s', duration: null, target: 'self' }],
      statusDefs: [
        {
          ...MARK('probe_beacon_s', '信标体'),
          triggers: [
            { event: 'on_tick', effects: [{ type: 'mount_status', statusId: 'probe_spread', target: 'allies_except_self', duration: null }] },
          ],
        },
        MARK('probe_spread', '扩散体'),
      ],
    },
  ],
}

type Side = 'A' | 'B'
interface Slot { skills?: string[]; passives?: string[]; attributes?: number }

function unit(unitId: string, faction: Side, index: number, s: Slot = {}) {
  const n = s.attributes ?? 1
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

function setup(file: PathwayFile, factions: { A: ReturnType<typeof unit>[]; B: ReturnType<typeof unit>[] }, seed = 7) {
  return {
    seed,
    catalog: buildCatalog([file]).catalog,
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

describe('单指简写按事件主体求值（不再一律落在宿主）', () => {
  // 甲：耐打靶子（力 6 = 90 生命），持有乙施加的 probe_marks；乙：交替烙印与轻击
  const roster = {
    A: [unit('A_u0', 'A', 0, { skills: ['probe_strike'], attributes: 6 })],
    B: [unit('B_u0', 'B', 0, { skills: ['probe_brand', 'probe_strike'] })],
  }

  it('on_take_damage 的 attacker = 造成伤害的一方；on_deal_damage 的 target = 承伤方；caster = 状态的施加者', () => {
    const c = createCombat(setup(BRAND, roster))
    run(c, 12)
    // 烙印已由乙施加到甲身上（卡面落点，不受本次改动影响）
    expect(has(c, 'A_u0', 'probe_marks')).toBe(true)
    // 三个简写全部落在乙身上——甲只是触发器宿主
    expect(has(c, 'B_u0', 'probe_hit_by')).toBe(true)
    expect(has(c, 'B_u0', 'probe_dealt_to')).toBe(true)
    expect(has(c, 'B_u0', 'probe_applier')).toBe(true)
    expect(has(c, 'A_u0', 'probe_hit_by')).toBe(false)
    expect(has(c, 'A_u0', 'probe_dealt_to')).toBe(false)
    expect(has(c, 'A_u0', 'probe_applier')).toBe(false)
  })

  it('触发器效果不写 target 时仍落在宿主身上（继承语义不变）', () => {
    const c = createCombat(setup(BRAND, roster))
    run(c, 12)
    expect(has(c, 'A_u0', 'probe_tick_self')).toBe(true)
    expect(has(c, 'B_u0', 'probe_tick_self')).toBe(false)
  })
})

describe('群体与击杀类简写按宿主阵营展开', () => {
  const roster = {
    A: [unit('A_u0', 'A', 0), unit('A_u1', 'A', 1)],
    B: [
      unit('B_u0', 'B', 0, { skills: ['probe_execute'], passives: ['probe_rites'] }),
      unit('B_u1', 'B', 1, { passives: ['probe_beacon'] }),
    ],
  }

  it('on_kill 的 all_allies = 击杀者阵营全员（不含敌方）', () => {
    const c = createCombat(setup(REAPER, roster))
    run(c, 6)
    expect(has(c, 'B_u0', 'probe_kill_ally')).toBe(true)
    expect(has(c, 'B_u1', 'probe_kill_ally')).toBe(true)
    expect(has(c, 'A_u1', 'probe_kill_ally')).toBe(false)
  })

  it('on_tick 的 allies_except_self = 宿主友军，不含宿主自身', () => {
    const c = createCombat(setup(REAPER, roster))
    run(c, 6)
    // 信标的主人 B_u1 是触发器宿主，扩散落在它的友军 B_u0 上——旧实现会落在 B_u1 自己身上
    expect(has(c, 'B_u0', 'probe_spread')).toBe(true)
    expect(has(c, 'B_u1', 'probe_spread')).toBe(false)
    expect(has(c, 'A_u1', 'probe_spread')).toBe(false)
  })
})
