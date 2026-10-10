// P2a 测试夹具：内联一个小 PathwayFile，经 buildCatalog 编译成 Catalog，
// 再构造 AI vs AI 的 CombatSetup。
import { buildCatalog } from '../../src/data/catalogBuild'
import type { PathwayFile, RawCard } from '../../src/data/schema.types'
import type { EffectNode } from '../../src/kernel/catalog/types'
import type { Catalog, StatusDef } from '../../src/kernel/catalog/types'
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
    {
      id: 'fix_yank',
      name: '拖拽',
      kind: 'active',
      sequence: 3,
      sequenceName: 's3',
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
      effects: [{ type: 'move', op: 'pull_forward', distance: 1 }],
    },
    {
      id: 'fix_purge',
      name: '净化',
      kind: 'active',
      sequence: 3,
      sequenceName: 's3',
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
      effects: [{ type: 'dispel', category: ['buff'], count: 1 }],
    },
    {
      id: 'fix_siphon',
      name: '汲取',
      kind: 'active',
      sequence: 3,
      sequenceName: 's3',
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
      effects: [{ type: 'drain', resource: 'hp', ratio: 0.2, healRatio: 1 }],
    },
    {
      id: 'fix_summon',
      name: '召唤',
      kind: 'active',
      sequence: 3,
      sequenceName: 's3',
      rarity: 'common',
      axis: 'a',
      flagship: false,
      lore: '',
      flavor: '',
      describe: '',
      tentative: false,
      cost: { energy: 0, cooldown: 0, castTime: null },
      reach: 'spell',
      // summon 分流：落位由 spawn 处理器找空位
      target: { request: { faction: 'self', anchor: 'caster', pickCount: 1 }, selectionMode: 'auto', consumption: 'summon' },
      effects: [{ type: 'spawn', unitId: 'fix_skeleton' }],
    },
    {
      id: 'fix_ward',
      name: '守御',
      kind: 'active',
      sequence: 3,
      sequenceName: 's3',
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
      effects: [{ type: 'grant_immunity', against: ['debuff'], charges: 1, duration: 10 }],
    },
    p2b2('fix_bright', '白昼', 'spell', [{ type: 'set_luminance', value: 8, duration: 10, dispelable: true }]),
    p2b2('fix_hasten', '加速', 'spell', [{ type: 'advance_clock', ticks: 3 }]),
    p2b2('fix_recall', '存档', 'spell', [{ type: 'snapshot', fields: ['hp', 'gauge'], target: 'self' }], 'self'),
    p2b2('fix_rewind', '回溯', 'spell', [{ type: 'restore_snapshot', fields: ['hp', 'gauge'], target: 'self' }], 'self'),
    p2b2('fix_echo', '回响', 'spell', [{ type: 'echo_last_skill', potency: 0.5 }]),
    p2b2('fix_scramble', '扰乱', 'spell', [{ type: 'gauge_shuffle', resource: 'gauge.current' }]),
    p2b2('fix_rotate', '轮转', 'spell', [{ type: 'status_shuffle', mode: 'rotate', count: 1 }]),
    p2b2('fix_sap', '削弱', 'spell', [{ type: 'modify_skill', skillRef: { selector: 'target' }, costDelta: { energy: 1 } }]),
    passive('fix_passive', '坚韧', [{ type: 'modify_stat', stat: 'resist:physical', mode: 'delta', value: 10, duration: null, target: 'self' }]),
    p2b2('fix_domain', '血月', 'spell', [], 'self', 'domain'),
    p2b2('fix_zone', '火场', 'spell', [], 'self', 'zone'),
  ],
  unitDefs: [{ id: 'fix_skeleton', name: '骸骨', unitType: 'UNDEAD', base: { hp: 40, atk: 3 }, tags: [] }],
  zoneDefs: [
    {
      id: 'fix_zone',
      kind: 'hazard',
      trigger: 'on_occupy_tick',
      affects: 'any',
      duration: 6,
      effects: [{ type: 'damage', value: 1, element: 'fire' }],
    },
  ],
  domainDefs: [{ id: 'fix_domain', tier: 'overlay', dispelable: true, duration: 12, durationUnit: 'tick' }],
}

/** 被动卡简写：hook 事件触发卡面 effects */
function passive(id: string, name: string, effects: unknown[], hook: string[] = ['on_battle_start']): RawCard {
  return {
    id, name, kind: 'passive', sequence: 1, sequenceName: 's1', rarity: 'common', axis: 'a',
    flagship: false, lore: '', flavor: '', describe: '', tentative: false, hook,
    effects: effects as EffectNode[],
  }
}

/** P2b-2 卡面简写 */
function p2b2(
  id: string,
  name: string,
  reach: 'none' | 'melee' | 'thrown' | 'spell',
  effects: unknown[],
  faction: 'enemy' | 'self' = 'enemy',
  consumption?: 'zone' | 'domain' | 'summon' | 'instant',
): RawCard {
  return {
    id,
    name,
    kind: 'active',
    sequence: 2,
    sequenceName: 's2',
    rarity: 'common',
    axis: 'a',
    flagship: false,
    lore: '',
    flavor: '',
    describe: '',
    tentative: false,
    cost: { energy: 0, cooldown: 0, castTime: null },
    reach,
    target: {
      request: { faction, anchor: faction === 'self' ? 'caster' : 'enemy_front', sort: 'index_asc', pickCount: faction === 'self' ? 1 : 2 },
      selectionMode: 'auto',
      ...(consumption ? { consumption } : {}),
    },
    effects: effects as EffectNode[],
  }
}

export function buildFixtureCatalog(): Catalog {
  return buildCatalog([FIXTURE]).catalog
}

/** 直接造一个单位（用于单测属性/资源/伤害链/状态修饰） */
export function makeUnit(
  id: string,
  faction = 'A',
  attr: { strength?: number; agility?: number; intelligence?: number } = {},
  defs: StatusDef[] = [],
): CombatUnit {
  const map = new Map(defs.map((d) => [d.id, d]))
  return new CombatUnit(
    id,
    faction,
    { strength: attr.strength ?? 1, agility: attr.agility ?? 1, intelligence: attr.intelligence ?? 1, rank: 0 },
    'male',
    { statusDefs: { statusDef: (sid) => map.get(sid) }, nextStatusId: (() => { let n = 0; return () => `st#${++n}` })() },
  )
}

export interface SetupOptions {
  seed?: number
  unitsPerSide?: number
  skills?: string[]
  passives?: string[]
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
      passiveSlots: opts.passives ? opts.passives.map((d) => ({ defId: d })) : [{ defId: 'fix_passive' }],
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
