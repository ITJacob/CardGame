// 武器牌：打出即装备、单槽替换、耐久、战吼、触发器、disarm / modify_weapon、initialEquip、has_equipped。
import { describe, expect, it } from 'vitest'
import { createCombat } from '../src/kernel'
import { buildCatalog } from '../src/data/catalogBuild'
import type { PathwayFile } from '../src/data/schema.types'
import type { CombatFacade } from '../src/kernel/combat/types'
import type { StatusDef, WeaponDef } from '../src/kernel/catalog/types'
import { availableBehaviors } from '../src/kernel/scheduling/filter'
import { evaluateCondition, type ConditionContext } from '../src/kernel/shared/effect-condition'
import { Mulberry32RandomSource, RandomUsageRegistry } from '../src/kernel/shared/random-source'
import { makeUnit } from './helpers/fixture'

const PROBE_BUFF: StatusDef = {
  id: 'probe_buff', name: '探针增益', category: ['buff'], dispelable: true, duration: null,
}

const PROBE_FORCE_BASIC: StatusDef = {
  id: 'probe_force_basic', name: '拔刀', category: ['buff'], dispelable: false,
  duration: 1, durationUnit: 'self_turn',
  behaviorModifiers: [{ op: 'force', behaviors: ['basic_attack'] }],
}

const WEAPON_BASE = {
  axis: 'a', flagship: false, lore: '', flavor: '', describe: '', tentative: false,
  rarity: 'common' as const, sequence: 9, sequenceName: 's9', kind: 'weapon' as const,
  cost: { energy: 0, cooldown: 100, castTime: null }, effects: [] as never[],
}

const CARD_BASE = {
  ...WEAPON_BASE, kind: 'active' as const,
  reach: 'melee' as const,
  target: {
    request: { faction: 'enemy' as const, anchor: 'enemy_front', sort: 'index_asc' as const, pickCount: 1 },
    selectionMode: 'auto' as const,
  },
}

const COMBAT_TEST: PathwayFile = {
  pathwayId: 'warrior', pathwayName: '战士', sourceFile: 'probe', sourceVersion: 'test',
  cards: [
    {
      ...WEAPON_BASE, id: 'probe_weapon_a', name: '武器甲',
      weapon: { slot: 'weapon', attack: 3, durability: 2, tags: ['sword'] },
    },
    {
      ...WEAPON_BASE, id: 'probe_weapon_b', name: '武器乙',
      weapon: { slot: 'weapon', attack: 1, durability: 1, tags: ['sword'] },
    },
    {
      ...WEAPON_BASE, id: 'probe_weapon_trigger', name: '带触发武器',
      weapon: {
        slot: 'weapon', attack: 0, durability: 3,
        triggers: [{ event: 'on_attack', effects: [{ type: 'mount_status', statusId: 'probe_buff', target: 'self' }] }],
      },
      statusDefs: [PROBE_BUFF],
    },
    {
      ...WEAPON_BASE, id: 'probe_weapon_battlecry', name: '战吼武器',
      effects: [{ type: 'mount_status', statusId: 'probe_buff', target: 'self' }],
      weapon: { slot: 'weapon', attack: 1, durability: 2 },
      statusDefs: [PROBE_BUFF],
    },
    {
      ...CARD_BASE, id: 'probe_disarm', name: '缴械卡',
      effects: [{ type: 'disarm', target: 'self' }],
    },
    {
      ...CARD_BASE, id: 'probe_modify_weapon', name: '改武器', cost: { energy: 0, cooldown: 0, castTime: null },
      effects: [{ type: 'modify_weapon', target: 'self', durabilityDelta: -1 }],
    },
    {
      id: 'probe_on_equip', name: '装备触发', kind: 'passive', sequence: 9, sequenceName: 's9',
      rarity: 'common', axis: 'a', flagship: false, lore: '', flavor: '', describe: '', tentative: false,
      hook: ['on_weapon_equip'],
      effects: [{ type: 'mount_status', statusId: 'probe_buff', target: 'self' }],
      statusDefs: [PROBE_BUFF],
    },
    {
      id: 'probe_initial_equip', name: '开局装备', kind: 'passive', sequence: 9, sequenceName: 's9',
      rarity: 'common', axis: 'a', flagship: false, lore: '', flavor: '', describe: '', tentative: false,
      hook: ['on_battle_start'],
      effects: [],
      initialEquip: 'probe_weapon_a',
    },
  ],
}

function unit(
  unitId: string,
  faction: 'A' | 'B',
  index: number,
  s: { skills?: string[]; passives?: string[]; strength?: number; agility?: number } = {},
) {
  return {
    unitId, pathwayId: 'warrior',
    coordinate: { faction, lane: 'lane0' as const, index },
    attributeSet: { strength: s.strength ?? 6, agility: s.agility ?? 1, intelligence: 1, rank: 0 },
    gender: 'male' as const, anchor: index,
    activeSlots: (s.skills ?? []).map((skillDefId) => ({ skillDefId })),
    passiveSlots: (s.passives ?? []).map((defId) => ({ defId })),
    initialStatuses: [],
  }
}

function setup(skills: string[], passives: string[] = []) {
  return {
    seed: 7,
    catalog: buildCatalog([COMBAT_TEST]).catalog,
    board: { clock: { base: 0 }, domainGrants: [] },
    factions: [
      { id: 'A' as const, name: '甲', units: [unit('A_u0', 'A', 0, { skills, passives, agility: 30 })] },
      { id: 'B' as const, name: '乙', units: [unit('B_u0', 'B', 0, { strength: 999, agility: 1 })] },
    ],
    inputs: { decisions: new Map() },
  } as never
}

function run(c: CombatFacade, ticks: number): void {
  for (let i = 0; i < ticks && !c.ended(); i += 1) c.step()
}

const weaponOf = (c: CombatFacade, unitId: string) =>
  c.state().units.find((x) => x.id === unitId)?.weapon

describe('武器牌：装备与替换', () => {
  it('打出武器牌即装备；后打出的摧毁前一把', () => {
    const c = createCombat(setup(['probe_weapon_a', 'probe_weapon_b']))
    run(c, 2)
    expect(weaponOf(c, 'A_u0')?.defId).toBe('probe_weapon_a')
    expect(weaponOf(c, 'A_u0')?.durability).toBe(2)
  })

  it('战吼在装备后结算（能挂状态）', () => {
    const c = createCombat(setup(['probe_weapon_battlecry']))
    run(c, 1)
    const u = c.state().units.find((x) => x.id === 'A_u0')!
    expect(u.weapon?.defId).toBe('probe_weapon_battlecry')
    expect(u.statuses.some((s) => s.defId === 'probe_buff')).toBe(true)
  })

  it('装备触发 on_weapon_equip：被动挂上状态', () => {
    const c = createCombat(setup(['probe_weapon_a'], ['probe_on_equip']))
    run(c, 1)
    const u = c.state().units.find((x) => x.id === 'A_u0')!
    expect(u.weapon?.defId).toBe('probe_weapon_a')
    expect(u.statuses.some((s) => s.defId === 'probe_buff')).toBe(true)
  })

  it('initialEquip：开局即装备，无需打出', () => {
    const c = createCombat(setup([], ['probe_initial_equip']))
    expect(weaponOf(c, 'A_u0')?.defId).toBe('probe_weapon_a')
  })
})

describe('武器牌：耐久与触发器', () => {
  it('普攻消耗 1 耐久；归零在步末摧毁', () => {
    const c = createCombat(setup(['probe_weapon_b']))
    run(c, 1)
    expect(weaponOf(c, 'A_u0')?.durability).toBe(1)
    run(c, 1)   // 第 2 tick：无可用技能 → 普攻 → 耐久 0 → 步末摧毁
    expect(weaponOf(c, 'A_u0')).toBeNull()
  })

  it('武器触发器随装备生效：on_attack 挂状态', () => {
    const c = createCombat(setup(['probe_weapon_trigger']))
    run(c, 1)   // 装备
    run(c, 1)   // 普攻
    const u = c.state().units.find((x) => x.id === 'A_u0')!
    expect(u.statuses.some((s) => s.defId === 'probe_buff')).toBe(true)
  })

  it('modify_weapon 改耐久', () => {
    const c = createCombat(setup(['probe_weapon_a', 'probe_modify_weapon']))
    run(c, 3)   // mod(空) → equip → mod(-1)
    expect(weaponOf(c, 'A_u0')?.durability).toBe(1)
  })

  it('disarm 卸下并摧毁武器', () => {
    const c = createCombat(setup(['probe_weapon_a', 'probe_disarm']))
    run(c, 4)
    expect(weaponOf(c, 'A_u0')).toBeNull()
  })
})

describe('武器单位级语义', () => {
  const W: WeaponDef = { id: 'probe_weapon_a', slot: 'weapon', attack: 3, durability: 2 }

  it('装备写攻击加值 provenance；销毁即撤销', () => {
    const u = makeUnit('u', 'A', { strength: 1 })
    const base = u.effectiveProfile.attack
    u.equipWeapon(W, 'w1')
    expect(u.effectiveProfile.attack).toBe(base + 3)
    expect(u.hasEquipped('weapon')).toBe(true)
    u.destroyWeapon()
    expect(u.effectiveProfile.attack).toBe(base)
    expect(u.hasEquipped()).toBe(false)
  })

  it('重复装备刷新耐久', () => {
    const u = makeUnit('u', 'A')
    u.equipWeapon(W, 'w1')
    u.weapon!.durability = 0
    u.equipWeapon(W, 'w2')
    expect(u.weapon?.durability).toBe(2)
  })
})

describe('has_equipped 条件', () => {
  const condCtx = (caster: ReturnType<typeof makeUnit>): ConditionContext => ({
    random: new Mulberry32RandomSource(1),
    registry: new RandomUsageRegistry(),
    warn: () => {},
    phase: 'day',
    caster,
  })

  it('按武器实例判定，不点名具体武器', () => {
    const u = makeUnit('u', 'A', {}, [PROBE_BUFF])
    const ctx = condCtx(u)
    expect(evaluateCondition({ kind: 'has_equipped', side: 'self', slot: 'weapon' }, null, ctx)).toBe(false)
    u.equipWeapon({ id: 'w', slot: 'weapon', attack: 0, durability: 1 }, 'w1')
    expect(evaluateCondition({ kind: 'has_equipped', side: 'self', slot: 'weapon' }, null, ctx)).toBe(true)
    expect(evaluateCondition({ kind: 'has_equipped', side: 'self' }, null, ctx)).toBe(true)
  })

  it('普通状态不算已装备', () => {
    const u = makeUnit('u', 'A', {}, [PROBE_BUFF])
    u.statuses.mount('probe_buff', { sourceId: 's1' })
    expect(evaluateCondition({ kind: 'has_equipped', side: 'self', slot: 'weapon' }, null, condCtx(u))).toBe(false)
  })
})

describe('behaviorModifiers.force', () => {
  it('force=basic_attack 时本机会只放行普攻', () => {
    const u = makeUnit('u', 'A', {}, [PROBE_FORCE_BASIC])
    u.behaviorSlots.push(
      {
        instanceId: 'bs_basic', defId: '__basic_attack__', kind: 'basic_attack', reach: 'melee',
        cost: { energy: 0, gauge: 0, cooldown: 0, opportunity: 1 }, cooldownRemaining: 0,
      },
      {
        instanceId: 'bs_skill', defId: 'probe_weapon_a', kind: 'skill', reach: 'melee',
        cost: { energy: 0, gauge: 0, cooldown: 0, opportunity: 0 }, cooldownRemaining: 0,
      },
    )
    expect(availableBehaviors(u).map((b) => b.kind)).toEqual(['basic_attack', 'skill'])
    expect(u.activeForcedBehaviors()).toEqual([])

    u.statuses.mount('probe_force_basic', { sourceId: 's1' })
    expect(u.activeForcedBehaviors()).toEqual(['basic_attack'])
    expect(availableBehaviors(u, u.activeForcedBehaviors()).map((b) => b.kind)).toEqual(['basic_attack'])
  })
})
