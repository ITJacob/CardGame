// 战士战意：职业自带资源、受击/死亡产层、层数 consume 语义。
import { describe, expect, it } from 'vitest'
import { createCombat } from '../src/kernel'
import { buildCatalog } from '../src/data/catalogBuild'
import type { PathwayFile } from '../src/data/schema.types'
import type { CombatFacade } from '../src/kernel/combat/types'
import type { StatusDef } from '../src/kernel/catalog/types'
import { makeUnit } from './helpers/fixture'

const WAR_SPIRIT: StatusDef = {
  id: 'war_spirit', name: '战意', category: ['buff'], dispelable: false,
  duration: null, maxStacks: 10, stackPolicy: 'stack',
}

const PROBE_AURA: StatusDef = {
  id: 'probe_aura', name: '战意光环', category: ['buff'], dispelable: false,
  duration: 1, durationUnit: 'self_turn', maxStacks: 1, stackPolicy: 'refresh',
}

const WAR_TEST: PathwayFile = {
  pathwayId: 'warrior',
  pathwayName: '战士',
  sourceFile: 'probe',
  sourceVersion: 'test',
  classMechanics: [{
    id: 'war_spirit', name: '战意', statusId: 'war_spirit',
    summary: '受击获得（每自身回合上限）；击杀产层由被动卡附加且绕过回合上限。',
  }],
  cards: [
    {
      id: 'probe_smash', name: '重击', kind: 'active', sequence: 9, sequenceName: 's9', rarity: 'common',
      axis: 'a', flagship: false, lore: '', flavor: '', describe: '', tentative: false,
      cost: { energy: 0, cooldown: 0, castTime: null }, reach: 'melee',
      target: { request: { faction: 'enemy', anchor: 'enemy_front', sort: 'index_asc', pickCount: 1 }, selectionMode: 'auto' },
      effects: [{ type: 'damage', value: 999, element: 'physical' }],
    },
    {
      id: 'probe_tap', name: '轻触', kind: 'active', sequence: 8, sequenceName: 's8', rarity: 'common',
      axis: 'a', flagship: false, lore: '', flavor: '', describe: '', tentative: false,
      cost: { energy: 0, cooldown: 0, castTime: null }, reach: 'melee',
      target: { request: { faction: 'enemy', anchor: 'enemy_front', sort: 'index_asc', pickCount: 1 }, selectionMode: 'auto' },
      effects: [{ type: 'damage', value: 1, element: 'physical' }],
    },
    {
      id: 'probe_mind', name: '战意载体', kind: 'passive', sequence: 7, sequenceName: 's7', rarity: 'common',
      axis: 'a', flagship: false, lore: '', flavor: '', describe: '', tentative: false,
      hook: ['on_battle_start'], effects: [], statusDefs: [WAR_SPIRIT],
      triggers: [{
        event: 'on_kill',
        effects: [{
          type: 'mount_status', statusId: 'war_spirit', stacks: 5, stackMode: 'add',
          target: 'self', ignoreWarSpiritCap: true,
        }],
      }],
    },
    {
      id: 'probe_barrage', name: '五连击', kind: 'active', sequence: 6, sequenceName: 's6', rarity: 'common',
      axis: 'a', flagship: false, lore: '', flavor: '', describe: '', tentative: false,
      cost: { energy: 0, cooldown: 0, castTime: null }, reach: 'melee',
      target: { request: { faction: 'enemy', anchor: 'enemy_front', sort: 'index_asc', pickCount: 1 }, selectionMode: 'auto' },
      effects: [
        { type: 'damage', value: 1, element: 'physical' },
        { type: 'damage', value: 1, element: 'physical' },
        { type: 'damage', value: 1, element: 'physical' },
        { type: 'damage', value: 1, element: 'physical' },
        { type: 'damage', value: 1, element: 'physical' },
      ],
    },
    {
      id: 'probe_read', name: '读档探针', kind: 'passive', sequence: 5, sequenceName: 's5', rarity: 'common',
      axis: 'a', flagship: false, lore: '', flavor: '', describe: '', tentative: false,
      effects: [], statusDefs: [PROBE_AURA],
      triggers: [{
        event: 'on_turn_start',
        effects: [{
          op: 'if',
          condition: { kind: 'has_status', side: 'self', id: 'war_spirit', cmp: '>=', n: 1 },
          then: [{ type: 'mount_status', statusId: 'probe_aura', duration: 1, durationUnit: 'self_turn', refresh: true, target: 'self' }],
          else: [],
        }],
      }],
    },
  ],
}

type Side = 'A' | 'B'
function unit(unitId: string, faction: Side, index: number, s: { skills?: string[]; passives?: string[]; attributes?: number; agility?: number } = {}) {
  const n = s.attributes ?? 6
  return {
    unitId, pathwayId: 'warrior',
    coordinate: { faction, lane: 'lane0' as const, index },
    attributeSet: { strength: n, agility: s.agility ?? 1, intelligence: 1, rank: 0 },
    gender: 'male' as const, anchor: index,
    activeSlots: (s.skills ?? []).map((skillDefId) => ({ skillDefId })),
    passiveSlots: (s.passives ?? []).map((defId) => ({ defId })),
    initialStatuses: [],
  }
}

function setup(factions: { A: ReturnType<typeof unit>[]; B: ReturnType<typeof unit>[] }) {
  return {
    seed: 7,
    catalog: buildCatalog([WAR_TEST]).catalog,
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

const stacks = (c: CombatFacade, unitId: string): number => {
  const u = c.state().units.find((x) => x.id === unitId)
  return u?.statuses.find((s) => s.defId === 'war_spirit')?.stacks ?? 0
}

const hasStatus = (c: CombatFacade, unitId: string, defId: string): boolean => {
  const u = c.state().units.find((x) => x.id === unitId)
  return u?.statuses.some((s) => s.defId === defId) ?? false
}

describe('战意：职业资源与产层', () => {
  it('classMechanics 进入 catalog', () => {
    const catalog = buildCatalog([WAR_TEST]).catalog
    expect(catalog.classDefs.get('warrior')?.mechanics?.[0]?.id).toBe('war_spirit')
  })

  it('敌方死亡默认不产战意（击杀产层由被动卡附加）', () => {
    const c = createCombat(setup({
      A: [unit('A_u0', 'A', 0, { skills: ['probe_smash'] })],
      B: [unit('B_u0', 'B', 0)],
    }))
    run(c, 12)
    expect(stacks(c, 'A_u0')).toBe(0)
  })

  it('被动击杀产层不受每回合 +3 上限限制', () => {
    const c = createCombat(setup({
      A: [unit('A_u0', 'A', 0, { skills: ['probe_smash'], passives: ['probe_mind'] })],
      B: [unit('B_u0', 'B', 0)],
    }))
    run(c, 12)
    expect(stacks(c, 'A_u0')).toBe(5)
  })

  it('受击给实际承伤的 warrior 产战意', () => {
    const c = createCombat(setup({
      A: [unit('A_u0', 'A', 0, { passives: ['probe_mind'] })],
      B: [unit('B_u0', 'B', 0, { skills: ['probe_tap'] })],
    }))
    run(c, 12)
    expect(stacks(c, 'A_u0')).toBeGreaterThan(0)
  })

  it('受击产层每自身回合最多 +3，总量上限 10', () => {
    const c = createCombat(setup({
      A: [unit('A_u0', 'A', 0, { attributes: 999 })],
      B: [unit('B_u0', 'B', 0, { skills: ['probe_barrage'], agility: 30 })],
    }))
    let guard = 0
    while (stacks(c, 'A_u0') === 0 && guard++ < 200) c.step()
    expect(stacks(c, 'A_u0')).toBe(3)
    run(c, 400)
    expect(stacks(c, 'A_u0')).toBe(10)
  })

  it('被动 on_turn_start 读战意：挂光环且不消耗层数', () => {
    const c = createCombat(setup({
      A: [unit('A_u0', 'A', 0, { passives: ['probe_read'], attributes: 20 })],
      B: [unit('B_u0', 'B', 0, { skills: ['probe_tap'], agility: 30 })],
    }))
    let guard = 0
    let before = 0
    while (!hasStatus(c, 'A_u0', 'probe_aura') && guard++ < 200) {
      before = stacks(c, 'A_u0')
      c.step()
    }
    expect(hasStatus(c, 'A_u0', 'probe_aura')).toBe(true)
    expect(stacks(c, 'A_u0')).toBeGreaterThanOrEqual(before)
  })
})

describe('战意层数消耗', () => {
  it('stackMode consume 扣层并在归零时卸载', () => {
    const u = makeUnit('u', 'A', {}, [WAR_SPIRIT])
    u.statuses.mount('war_spirit', { stacks: 3, sourceId: 's1' })
    u.statuses.mount('war_spirit', { stacks: -2, stackMode: 'consume', sourceId: 's2' })
    expect(u.statusStacks('war_spirit')).toBe(1)
    u.statuses.mount('war_spirit', { stacks: -1, stackMode: 'consume', sourceId: 's3' })
    expect(u.statusStacks('war_spirit')).toBe(0)
  })
})
