// 区域生命周期（战场参数 §1.1）：duration 递减 → Expired；单位离场 fire on_exit。
import { describe, expect, it } from 'vitest'
import { createCombat } from '../src/kernel'
import { buildCatalog } from '../src/data/catalogBuild'
import type { PathwayFile } from '../src/data/schema.types'
import type { CombatFacade } from '../src/kernel/combat/types'

const BASE = {
  kind: 'active' as const, sequence: 9, sequenceName: 's9', rarity: 'common' as const,
  axis: 'a', flagship: false, lore: '', flavor: '', describe: '', tentative: false,
  reach: 'none' as const,
}

const PATH: PathwayFile = {
  pathwayId: 'probe_zone_life',
  pathwayName: '区域生命周期探针',
  sourceFile: 'probe',
  sourceVersion: 'test',
  cards: [
    {
      ...BASE, id: 'probe_place_zone', name: '布阵',
      cost: { energy: 0, cooldown: 100, castTime: null },
      target: {
        selectionMode: 'auto' as const,
        request: { mode: 'unit' as const, faction: 'self' as const, anchor: 'caster', pickCount: 1 },
        consumption: 'zone' as const,
      },
      zone: { def: 'zone_probe_dur', duration: 2 },
      effects: [],
    },
    {
      ...BASE, id: 'probe_check_zone', name: '读阵',
      cost: { energy: 0, cooldown: 0, castTime: null },
      target: {
        selectionMode: 'auto' as const,
        request: { mode: 'unit' as const, faction: 'self' as const, anchor: 'caster', pickCount: 1 },
      },
      effects: [{
        op: 'if',
        condition: { kind: 'zone_active', zoneId: 'zone_probe_dur' },
        then: [{ type: 'mount_status', statusId: 'probe_mark_on', duration: null, target: 'self' }],
        else: [{ type: 'mount_status', statusId: 'probe_mark_off', duration: null, target: 'self' }],
      }],
    },
    {
      ...BASE, id: 'probe_push', name: '推开',
      cost: { energy: 0, cooldown: 0, castTime: null },
      target: {
        selectionMode: 'auto' as const,
        request: { mode: 'unit' as const, faction: 'self' as const, anchor: 'caster', pickCount: 1 },
      },
      effects: [{ type: 'move', op: 'push_back', distance: 1 }],
    },
    {
      id: 'probe_defs', name: '状态池', kind: 'passive', sequence: 1, sequenceName: 's1', rarity: 'common',
      axis: 'a', flagship: false, lore: '', flavor: '', describe: '', tentative: false,
      cost: { energy: 0, cooldown: 100, castTime: null }, hook: [], effects: [],
      statusDefs: [
        { id: 'probe_mark_on', name: '阵中', category: ['buff'], dispelable: false, duration: null, maxStacks: 1 },
        { id: 'probe_mark_off', name: '阵外', category: ['buff'], dispelable: false, duration: null, maxStacks: 1 },
        { id: 'probe_mark_exit', name: '离阵', category: ['buff'], dispelable: false, duration: null, maxStacks: 1 },
      ],
    },
  ],
  zoneDefs: [
    {
      id: 'zone_probe_dur', kind: 'blessing', trigger: 'on_enter', affects: 'any',
      duration: 2, effects: [],
    },
    {
      id: 'zone_probe_exit', kind: 'mark', trigger: 'on_exit', affects: 'any',
      duration: 10,
      effects: [{ type: 'mount_status', statusId: 'probe_mark_exit', duration: null }],
    },
  ],
} as never

function setup(aSkills: string[]) {
  const make = (unitId: string, faction: 'A' | 'B', index: number, skills: string[]) => ({
    unitId,
    coordinate: { faction, lane: 'lane0' as const, index },
    attributeSet: { strength: 1, agility: 30, intelligence: 1, rank: 0 },
    gender: 'male' as const,
    anchor: index,
    activeSlots: skills.map((skillDefId) => ({ skillDefId })),
    passiveSlots: [],
    initialStatuses: [],
  })
  return {
    seed: 7,
    catalog: buildCatalog([PATH]).catalog,
    board: { clock: { base: 0 }, domainGrants: [] },
    factions: [
      { id: 'A' as const, name: '甲', units: [make('A_u0', 'A', 0, aSkills)] },
      { id: 'B' as const, name: '乙', units: [make('B_u0', 'B', 0, [])] },
    ],
    inputs: { decisions: new Map() },
  } as never
}

function run(c: CombatFacade, ticks: number): void {
  for (let i = 0; i < ticks && !c.ended(); i += 1) c.step()
}

const has = (c: CombatFacade, defId: string): boolean =>
  c.state().units.find((u) => u.id === 'A_u0')!.statuses.some((s) => s.defId === defId)

describe('区域生命周期', () => {
  it('duration 归零后 zone_active 不再成立', () => {
    const c = createCombat(setup(['probe_place_zone', 'probe_check_zone']))
    run(c, 4)
    // tick1 读阵（无）→ tick2 布阵 → tick3 读阵（有）→ tick4 到期后读阵（无）
    expect(has(c, 'probe_mark_on')).toBe(true)
    expect(has(c, 'probe_mark_off')).toBe(true)
  })
})

describe('区域离场触发', () => {
  it('on_exit：离开区域格时结算载荷', () => {
    const defs = JSON.parse(JSON.stringify(PATH)) as unknown as {
      cards: { id: string; zone?: { def: string } }[]
    }
    const place = defs.cards.find((c) => c.id === 'probe_place_zone')!
    place.zone = { def: 'zone_probe_exit' }
    const base = setup(['probe_push', 'probe_place_zone']) as {
      factions: { units: unknown[] }[]
    }
    // 同路放一名友军，让 push_back 产生真实位移（前缀无空洞约束下 param 会被塌缩回原位）
    base.factions[0]!.units.push({
      unitId: 'A_u1', coordinate: { faction: 'A', lane: 'lane0', index: 1 },
      attributeSet: { strength: 1, agility: 1, intelligence: 1, rank: 0 },
      gender: 'male', anchor: 1, activeSlots: [], passiveSlots: [], initialStatuses: [],
    })
    const c = createCombat({
      ...(base as Record<string, unknown>),
      catalog: buildCatalog([defs as never]).catalog,
    } as never)
    run(c, 2)
    expect(has(c, 'probe_mark_exit')).toBe(true)
  })
})
