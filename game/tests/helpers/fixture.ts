// P2a 测试夹具：内联一个小 PathwayFile，经 buildCatalog 编译成 Catalog，
// 再构造 AI vs AI 的 CombatSetup。
import { buildCatalog } from '../../src/data/catalogBuild'
import type { PathwayFile } from '../../src/data/schema.types'
import type { Catalog } from '../../src/kernel/catalog/types'
import type { CombatFacade, CombatSetup } from '../../src/kernel/combat/types'
import type { DecisionInput } from '../../src/kernel/execution/types'
import { CombatUnit } from '../../src/kernel/roster/unit'

export const FIXTURE: PathwayFile = {
  pathwayId: 'fixture',
  pathwayName: '测试途径',
  sourceFile: 'fixture',
  sourceVersion: 'p2a',
  cards: [
    {
      id: 'fix_strike',
      name: '打击',
      kind: 'active',
      sequence: 9,
      sequenceName: 's9',
      rarity: 'common',
      axis: 'a',
      flagship: false,
      lore: '',
      flavor: '',
      describe: '',
      tentative: false,
      cost: { energy: 0, cooldown: 0, castTime: null },
      reach: 'melee',
      target: { request: { faction: 'enemy', anchor: 'enemy_front', sort: 'index_asc', pickCount: 1 }, selectionMode: 'auto' },
      effects: [{ type: 'damage', value: 6, element: 'physical' }],
    },
    {
      id: 'fix_hex',
      name: '侵蚀',
      kind: 'active',
      sequence: 8,
      sequenceName: 's8',
      rarity: 'common',
      axis: 'a',
      flagship: false,
      lore: '',
      flavor: '',
      describe: '',
      tentative: false,
      cost: { energy: 0, cooldown: 0, castTime: null },
      reach: 'spell',
      target: { request: { faction: 'enemy', anchor: 'enemy_front', sort: 'index_asc', pickCount: 1 }, selectionMode: 'auto' },
      effects: [{ type: 'mount_status', statusId: 'fix_poison', duration: 4, stacks: 1 }],
      statusDefs: [
        {
          id: 'fix_poison',
          name: '侵蚀',
          category: ['debuff'],
          dispelable: true,
          duration: 4,
          maxStacks: 3,
          stackPolicy: 'stack',
          triggers: [{ event: 'on_tick', effects: [{ type: 'damage', value: 2, element: 'poison' }] }],
        },
      ],
    },
    {
      id: 'fix_bless',
      name: '庇佑',
      kind: 'active',
      sequence: 7,
      sequenceName: 's7',
      rarity: 'common',
      axis: 'a',
      flagship: false,
      lore: '',
      flavor: '',
      describe: '',
      tentative: false,
      cost: { energy: 0, cooldown: 0, castTime: null },
      reach: 'spell',
      target: { request: { faction: 'self', anchor: 'caster', pickCount: 1 }, selectionMode: 'auto' },
      effects: [{ type: 'heal', value: 4 }],
    },
    {
      id: 'fix_crush',
      name: '碾碎',
      kind: 'active',
      sequence: 6,
      sequenceName: 's6',
      rarity: 'common',
      axis: 'a',
      flagship: false,
      lore: '',
      flavor: '',
      describe: '',
      tentative: false,
      cost: { energy: 0, cooldown: 0, castTime: null },
      reach: 'melee',
      target: { request: { faction: 'enemy', anchor: 'enemy_front', sort: 'index_asc', pickCount: 1 }, selectionMode: 'auto' },
      effects: [{ type: 'modify_stat', stat: 'defense', mode: 'delta', value: -3, duration: 5 }],
    },
    {
      id: 'fix_gamble',
      name: '赌注',
      kind: 'active',
      sequence: 5,
      sequenceName: 's5',
      rarity: 'common',
      axis: 'a',
      flagship: false,
      lore: '',
      flavor: '',
      describe: '',
      tentative: false,
      cost: { energy: 0, cooldown: 0, castTime: null },
      reach: 'spell',
      target: { request: { faction: 'enemy', anchor: 'enemy_front', sort: 'index_asc', pickCount: 1 }, selectionMode: 'auto' },
      // 概率生效（R3 登记 / R4 单次抽样）——用于验证 seed 真正驱动 RNG
      effects: [{ type: 'damage', value: 10, element: 'mental', condition: { kind: 'chance', p: 0.5 } }],
    },
    {
      id: 'fix_mark',
      name: '锁定',
      kind: 'active',
      sequence: 4,
      sequenceName: 's4',
      rarity: 'common',
      axis: 'a',
      flagship: false,
      lore: '',
      flavor: '',
      describe: '',
      tentative: false,
      cost: { energy: 0, cooldown: 0, castTime: null },
      reach: 'spell',
      // Manual + 全场候选：用于验证内核在决策点挂起、submitDecision 续跑
      target: { request: { faction: 'enemy', scope: 'board', sort: 'index_asc', pickCount: 1 }, selectionMode: 'manual' },
      effects: [{ type: 'damage', value: 3, element: 'dark' }],
    },
  ],
  unitDefs: [],
  zoneDefs: [],
  domainDefs: [],
}

export function buildFixtureCatalog(): Catalog {
  return buildCatalog([FIXTURE]).catalog
}

/** 直接造一个单位（用于单测属性/资源/伤害链） */
export function makeUnit(
  id: string,
  faction = 'A',
  attr: { strength?: number; agility?: number; intelligence?: number } = {},
): CombatUnit {
  return new CombatUnit(
    id,
    faction,
    { strength: attr.strength ?? 1, agility: attr.agility ?? 1, intelligence: attr.intelligence ?? 1, rank: 0 },
    'male',
    { statusDefs: { statusDef: () => undefined }, nextStatusId: (() => { let n = 0; return () => `st#${++n}` })() },
  )
}

export interface SetupOptions {
  seed?: number
  unitsPerSide?: number
  skills?: string[]
  strength?: number
  agility?: number
  intelligence?: number
}

export function buildAiVsAiSetup(opts: SetupOptions = {}): CombatSetup {
  const catalog = buildFixtureCatalog()
  const skills = opts.skills ?? ['fix_strike', 'fix_hex']
  const perSide = opts.unitsPerSide ?? 2
  const attr = { strength: opts.strength ?? 1, agility: opts.agility ?? 1, intelligence: opts.intelligence ?? 1 }

  const makeUnits = (faction: string) =>
    Array.from({ length: perSide }, (_, i) => ({
      unitId: `${faction}_u${i}`,
      coordinate: { faction, lane: 'lane0', index: i },
      attributeSet: { ...attr, rank: 0 },
      gender: 'male' as const,
      anchor: 0,
      activeSlots: skills.map((s) => ({ skillDefId: s })),
      initialStatuses: [],
    }))

  return {
    seed: opts.seed ?? 12345,
    catalog,
    board: { clock: { base: 0 }, domainGrants: [] },
    factions: [
      { id: 'A', name: '甲', units: makeUnits('A') },
      { id: 'B', name: '乙', units: makeUnits('B') },
    ],
    inputs: { decisions: new Map() },
  }
}

/** 无头跑到结束：Manual 决策由确定性 AI 取前 pickCount 个候选喂回。 */
export function runToEnd(facade: CombatFacade, maxSteps = 100000): void {
  let steps = 0
  while (!facade.ended() && steps < maxSteps) {
    steps += 1
    const pending = facade.pendingDecision()
    if (pending) {
      const picks: DecisionInput = pending.candidates.slice(0, pending.pickCount)
      facade.submitDecision(picks)
      continue
    }
    facade.step()
  }
}
