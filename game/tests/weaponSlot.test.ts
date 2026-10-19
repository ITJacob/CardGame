// 武器槽：charges 生命周期、同槽替换、耐久补充、被动装备拦截。
import { describe, expect, it } from 'vitest'
import { createCombat } from '../src/kernel'
import { buildCatalog } from '../src/data/catalogBuild'
import type { PathwayFile } from '../src/data/schema.types'
import type { CombatFacade } from '../src/kernel/combat/types'
import type { StatusDef } from '../src/kernel/catalog/types'
import { handleModifyStatus } from '../src/kernel/effect/handlers2'
import { availableBehaviors } from '../src/kernel/scheduling/filter'
import { evaluateCondition, type ConditionContext } from '../src/kernel/shared/effect-condition'
import { Mulberry32RandomSource, RandomUsageRegistry } from '../src/kernel/shared/random-source'
import { stubContext, registryOf } from './helpers/context'
import { makeUnit } from './helpers/fixture'

const WEAPON_A: StatusDef = {
  id: 'probe_weapon_a', name: '武器甲', category: ['buff'], dispelable: true,
  duration: null, charges: 2, equipSlot: 'weapon',
  triggers: [{ event: 'on_attack', consumeCharge: true }],
}

const WEAPON_B: StatusDef = {
  id: 'probe_weapon_b', name: '武器乙', category: ['buff'], dispelable: true,
  duration: null, charges: 1, equipSlot: 'weapon',
}

const PROBE_BUFF: StatusDef = {
  id: 'probe_buff', name: '探针增益', category: ['buff'], dispelable: true, duration: null,
}

const PROBE_FORCE_BASIC: StatusDef = {
  id: 'probe_force_basic', name: '拔刀', category: ['buff'], dispelable: false,
  duration: 1, durationUnit: 'self_turn',
  behaviorModifiers: [{ op: 'force', behaviors: ['basic_attack'] }],
}

const CARD_BASE = {
  axis: 'a', flagship: false, lore: '', flavor: '', describe: '', tentative: false,
  rarity: 'common' as const, sequence: 9, sequenceName: 's9', kind: 'active' as const,
  cost: { energy: 0, cooldown: 100, castTime: null }, reach: 'melee' as const,
  target: {
    request: { faction: 'enemy' as const, anchor: 'enemy_front', sort: 'index_asc' as const, pickCount: 1 },
    selectionMode: 'auto' as const,
  },
}

const COMBAT_TEST: PathwayFile = {
  pathwayId: 'warrior', pathwayName: '战士', sourceFile: 'probe', sourceVersion: 'test',
  cards: [
    {
      ...CARD_BASE, id: 'probe_equip_both', name: '双装',
      effects: [
        { type: 'mount_status', statusId: 'probe_weapon_a', target: 'self' },
        { type: 'mount_status', statusId: 'probe_weapon_b', target: 'self' },
      ],
      statusDefs: [WEAPON_A, WEAPON_B],
    },
    {
      ...CARD_BASE, id: 'probe_equip_a', name: '装甲',
      effects: [{ type: 'mount_status', statusId: 'probe_weapon_a', target: 'self' }],
    },
    {
      ...CARD_BASE, id: 'probe_refresh', name: '重装',
      effects: [
        { type: 'mount_status', statusId: 'probe_weapon_a', target: 'self' },
        { type: 'modify_status', slot: 'weapon', target: 'self', chargesDelta: -1 },
        { type: 'mount_status', statusId: 'probe_weapon_a', target: 'self' },
      ],
    },
    {
      ...CARD_BASE, id: 'probe_free_buff', name: '免费增益',
      cost: { energy: 0, cooldown: 100, castTime: null, opportunity: 0 },
      effects: [{ type: 'mount_status', statusId: 'probe_buff', target: 'self' }],
      statusDefs: [PROBE_BUFF],
    },
  ],
}

const BAD_PASSIVE_TEST: PathwayFile = {
  pathwayId: 'warrior', pathwayName: '战士', sourceFile: 'probe', sourceVersion: 'test',
  cards: [
    {
      id: 'probe_bad_equip', name: '被动装备', kind: 'passive', sequence: 9, sequenceName: 's9',
      rarity: 'common', axis: 'a', flagship: false, lore: '', flavor: '', describe: '', tentative: false,
      hook: ['on_battle_start'],
      effects: [{ type: 'mount_status', statusId: 'probe_weapon_a', target: 'self' }],
      statusDefs: [WEAPON_A],
    },
  ],
}

function unit(unitId: string, faction: 'A' | 'B', index: number, s: { skills?: string[]; strength?: number; agility?: number } = {}) {
  return {
    unitId, pathwayId: 'warrior',
    coordinate: { faction, lane: 'lane0' as const, index },
    attributeSet: { strength: s.strength ?? 6, agility: s.agility ?? 1, intelligence: 1, rank: 0 },
    gender: 'male' as const, anchor: index,
    activeSlots: (s.skills ?? []).map((skillDefId) => ({ skillDefId })),
    passiveSlots: [],
    initialStatuses: [],
  }
}

function setup(skills: string[]) {
  return {
    seed: 7,
    catalog: buildCatalog([COMBAT_TEST]).catalog,
    board: { clock: { base: 0 }, domainGrants: [] },
    factions: [
      { id: 'A' as const, name: '甲', units: [unit('A_u0', 'A', 0, { skills, agility: 30 })] },
      { id: 'B' as const, name: '乙', units: [unit('B_u0', 'B', 0, { strength: 999, agility: 1 })] },
    ],
    inputs: { decisions: new Map() },
  } as never
}

function run(c: CombatFacade, ticks: number): void {
  for (let i = 0; i < ticks && !c.ended(); i += 1) c.step()
}

const weapon = (c: CombatFacade, unitId: string, defId: string) => {
  const u = c.state().units.find((x) => x.id === unitId)
  return u?.statuses.find((s) => s.defId === defId)
}

describe('武器槽：同槽互斥与耐久', () => {
  it('后装备的武器替换前一把', () => {
    const c = createCombat(setup(['probe_equip_both']))
    run(c, 1)
    expect(weapon(c, 'A_u0', 'probe_weapon_a')).toBeUndefined()
    expect(weapon(c, 'A_u0', 'probe_weapon_b')?.charges).toBe(1)
  })

  it('同 defId 重装刷新耐久', () => {
    const c = createCombat(setup(['probe_refresh']))
    run(c, 1)
    expect(weapon(c, 'A_u0', 'probe_weapon_a')?.charges).toBe(2)
  })

  it('opportunity=0：不闭合机会，同一机会继续执行下一个技能', () => {
    // tickCount=1 → 先选 activeSlots[1]（免费增益），随后同一机会继续执行 activeSlots[0]（装备）
    const c = createCombat(setup(['probe_equip_a', 'probe_free_buff']))
    run(c, 1)
    const u = c.state().units.find((x) => x.id === 'A_u0')!
    expect(u.statuses.some((s) => s.defId === 'probe_buff')).toBe(true)
    expect(weapon(c, 'A_u0', 'probe_weapon_a')).toBeDefined()
  })

  it('opportunity 缺省为 1：装备后机会闭合，同 tick 不再行动', () => {
    const c = createCombat(setup(['probe_equip_a']))
    const b0 = c.state().units.find((x) => x.id === 'B_u0')!.hp
    run(c, 1)
    expect(weapon(c, 'A_u0', 'probe_weapon_a')).toBeDefined()
    expect(c.state().units.find((x) => x.id === 'B_u0')!.hp).toBe(b0)
  })

  it('普攻消耗耐久，归零卸载；主动施放本身不扣耐久', () => {
    const c = createCombat(setup(['probe_equip_a']))
    let guard = 0
    while (!weapon(c, 'A_u0', 'probe_weapon_a') && guard++ < 200) c.step()
    expect(weapon(c, 'A_u0', 'probe_weapon_a')?.charges).toBe(2)
    guard = 0
    while (weapon(c, 'A_u0', 'probe_weapon_a') && guard++ < 200) c.step()
    expect(weapon(c, 'A_u0', 'probe_weapon_a')).toBeUndefined()
  })
})

describe('耐久补充', () => {
  it('modify_status 按装备槽补满次数；无武器时无操作', () => {
    const u = makeUnit('u', 'A', {}, [WEAPON_A])
    u.statuses.mount('probe_weapon_a', { sourceId: 's1' })
    const inst = u.statuses.all()[0]
    expect(inst?.charges).toBe(2)
    if (inst) inst.charges = 1
    const ctx = stubContext(registryOf(u), u, [WEAPON_A])
    handleModifyStatus({ type: 'modify_status', slot: 'weapon', target: 'self', restoreCharges: true }, u, ctx)
    expect(inst?.charges).toBe(2)

    const empty = makeUnit('empty', 'A', {}, [WEAPON_A])
    handleModifyStatus({ type: 'modify_status', slot: 'weapon', target: 'self', restoreCharges: true }, empty, ctx)
    expect(empty.statuses.all()).toHaveLength(0)
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

  it('按 equipSlot 判定，不点名具体武器', () => {
    const u = makeUnit('u', 'A', {}, [WEAPON_A, PROBE_BUFF])
    const ctx = condCtx(u)
    expect(evaluateCondition({ kind: 'has_equipped', side: 'self', slot: 'weapon' }, null, ctx)).toBe(false)
    u.statuses.mount('probe_weapon_a', { sourceId: 's1' })
    expect(evaluateCondition({ kind: 'has_equipped', side: 'self', slot: 'weapon' }, null, ctx)).toBe(true)
    // slot 缺省 = 任意装备槽
    expect(evaluateCondition({ kind: 'has_equipped', side: 'self' }, null, ctx)).toBe(true)
  })

  it('非装备状态不算已装备', () => {
    const u = makeUnit('u', 'A', {}, [PROBE_BUFF])
    const ctx = condCtx(u)
    u.statuses.mount('probe_buff', { sourceId: 's1' })
    expect(evaluateCondition({ kind: 'has_equipped', side: 'self', slot: 'weapon' }, null, ctx)).toBe(false)
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
        instanceId: 'bs_skill', defId: 'probe_equip_a', kind: 'skill', reach: 'melee',
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

describe('被动装备拦截', () => {
  it('被动卡挂载 equipSlot 状态时 catalogBuild 报 warning', () => {
    const { report } = buildCatalog([BAD_PASSIVE_TEST])
    expect(report.warnings.some((w) => w.includes('被动卡不得直接装备'))).toBe(true)
  })
})
