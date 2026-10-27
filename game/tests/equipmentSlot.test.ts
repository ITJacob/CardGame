// 装备牌（2026-10-26 武器泛化 equipment）：两槽独立、同槽顶替、护甲池制、
// 同槽公用 CD（下线后计）、recover_equipment、disarm / modify_weapon、initialEquip、has_equipped、护甲有形门槛。
import { describe, expect, it } from 'vitest'
import { createCombat } from '../src/kernel'
import { buildCatalog } from '../src/data/catalogBuild'
import type { PathwayFile } from '../src/data/schema.types'
import type { CombatFacade } from '../src/kernel/combat/types'
import type { EquipmentDef, StatusDef } from '../src/kernel/catalog/types'
import { availableBehaviors } from '../src/kernel/scheduling/filter'
import { evaluateCondition, type ConditionContext } from '../src/kernel/shared/effect-condition'
import { Mulberry32RandomSource, RandomUsageRegistry } from '../src/kernel/shared/random-source'
import { resolveDamage } from '../src/kernel/effect/damage-chain'
import { handleModifyResource } from '../src/kernel/effect/handlers'
import { registryOf, stubContext } from './helpers/context'
import { makeUnit } from './helpers/fixture'

const PROBE_BUFF: StatusDef = {
  id: 'probe_buff', name: '探针增益', category: ['buff'], dispelable: true, duration: null,
}

const PROBE_FORCE_BASIC: StatusDef = {
  id: 'probe_force_basic', name: '拔刀', category: ['buff'], dispelable: false,
  duration: 1, durationUnit: 'self_turn',
  behaviorModifiers: [{ op: 'force', behaviors: ['basic_attack'] }],
}

const EQUIP_BASE = {
  axis: 'a', flagship: false, lore: '', flavor: '', describe: '', tentative: false,
  rarity: 'common' as const, sequence: 9, sequenceName: 's9', kind: 'equipment' as const,
  cost: { energy: 0, cooldown: 100, castTime: null }, effects: [] as never[],
}

const CARD_BASE = {
  ...EQUIP_BASE, kind: 'active' as const,
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
      ...EQUIP_BASE, id: 'probe_weapon_a', name: '武器甲',
      equipment: { slot: 'weapon', attack: 3, durability: 2, tags: ['sword'] },
    },
    {
      ...EQUIP_BASE, id: 'probe_weapon_b', name: '武器乙',
      equipment: { slot: 'weapon', attack: 1, durability: 1, tags: ['sword'] },
    },
    {
      ...EQUIP_BASE, id: 'probe_weapon_x', name: '武器丙（高能耗）',
      cost: { energy: 10, cooldown: 100, castTime: null },
      equipment: { slot: 'weapon', attack: 9, durability: 2 },
    },
    {
      ...EQUIP_BASE, id: 'probe_weapon_trigger', name: '带触发武器',
      equipment: {
        slot: 'weapon', attack: 0, durability: 3,
        triggers: [{ event: 'on_attack', effects: [{ type: 'mount_status', statusId: 'probe_buff', target: 'self' }] }],
      },
      statusDefs: [PROBE_BUFF],
    },
    {
      ...EQUIP_BASE, id: 'probe_weapon_battlecry', name: '战吼武器',
      effects: [{ type: 'mount_status', statusId: 'probe_buff', target: 'self' }],
      equipment: { slot: 'weapon', attack: 1, durability: 2 },
      statusDefs: [PROBE_BUFF],
    },
    {
      ...EQUIP_BASE, id: 'probe_armor', name: '护具甲',
      equipment: { slot: 'armor', armor: 2, tags: ['plate'] },
    },
    {
      ...CARD_BASE, id: 'probe_disarm', name: '缴械卡', cost: { energy: 0, cooldown: 0, castTime: null },
      effects: [{ type: 'disarm', target: 'self' }],
    },
    {
      ...CARD_BASE, id: 'probe_disarm_armor', name: '拆护具卡', cost: { energy: 0, cooldown: 0, castTime: null },
      effects: [{ type: 'disarm', slot: 'armor', target: 'self' }],
    },
    {
      ...CARD_BASE, id: 'probe_modify_weapon', name: '改武器', cost: { energy: 0, cooldown: 0, castTime: null },
      effects: [{ type: 'modify_weapon', target: 'self', durabilityDelta: -1 }],
    },
    {
      ...CARD_BASE, id: 'probe_recover', name: '回收装备',
      cost: { energy: 0, cooldown: 0, castTime: null, opportunity: 0 },
      effects: [{ type: 'recover_equipment', slot: 'weapon', cooldownMul: 0.3, target: 'self' }],
    },
    {
      ...CARD_BASE, id: 'probe_zap', name: '电击', cost: { energy: 0, cooldown: 0, castTime: null },
      effects: [{ type: 'damage', element: 'physical', value: 3, target: 'target' }],
    },
    {
      id: 'probe_on_equip', name: '装备触发', kind: 'passive', sequence: 9, sequenceName: 's9',
      rarity: 'common', axis: 'a', flagship: false, lore: '', flavor: '', describe: '', tentative: false,
      hook: ['on_equipment_equip'],
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

function setup(skills: string[], passives: string[] = [], opts: { bSkills?: string[]; bStrength?: number } = {}) {
  return {
    seed: 7,
    catalog: buildCatalog([COMBAT_TEST]).catalog,
    board: { clock: { base: 0 }, domainGrants: [] },
    factions: [
      { id: 'A' as const, name: '甲', units: [unit('A_u0', 'A', 0, { skills, passives, agility: 30 })] },
      { id: 'B' as const, name: '乙', units: [unit('B_u0', 'B', 0, { skills: opts.bSkills ?? [], strength: opts.bStrength ?? 999 })] },
    ],
    inputs: { decisions: new Map() },
  } as never
}

function run(c: CombatFacade, ticks: number): void {
  for (let i = 0; i < ticks && !c.ended(); i += 1) c.step()
}

const unitView = (c: CombatFacade, unitId: string) => c.state().units.find((x) => x.id === unitId)
const weaponOf = (c: CombatFacade, unitId: string) =>
  unitView(c, unitId)?.equipment.find((e) => e.slot === 'weapon')
const armorOf = (c: CombatFacade, unitId: string) =>
  unitView(c, unitId)?.equipment.find((e) => e.slot === 'armor')

describe('装备牌：装备与替换', () => {
  it('打出装备牌即装备', () => {
    const c = createCombat(setup(['probe_weapon_a', 'probe_weapon_b']))
    run(c, 2)
    expect(weaponOf(c, 'A_u0')?.defId).toBe('probe_weapon_a')
    expect(weaponOf(c, 'A_u0')?.durability).toBe(2)
  })

  it('战吼在装备后结算（能挂状态）', () => {
    const c = createCombat(setup(['probe_weapon_battlecry']))
    run(c, 1)
    const u = unitView(c, 'A_u0')!
    expect(u.equipment.find((e) => e.slot === 'weapon')?.defId).toBe('probe_weapon_battlecry')
    expect(u.statuses.some((s) => s.defId === 'probe_buff')).toBe(true)
  })

  it('装备触发 on_equipment_equip：被动挂上状态', () => {
    const c = createCombat(setup(['probe_weapon_a'], ['probe_on_equip']))
    run(c, 1)
    const u = unitView(c, 'A_u0')!
    expect(u.equipment.find((e) => e.slot === 'weapon')?.defId).toBe('probe_weapon_a')
    expect(u.statuses.some((s) => s.defId === 'probe_buff')).toBe(true)
  })

  it('initialEquip：开局即装备，无需打出', () => {
    const c = createCombat(setup([], ['probe_initial_equip']))
    expect(weaponOf(c, 'A_u0')?.defId).toBe('probe_weapon_a')
  })
})

describe('装备牌：耐久与触发器', () => {
  it('普攻消耗 1 耐久；归零在步末下线', () => {
    const c = createCombat(setup(['probe_weapon_b']))
    run(c, 1)
    expect(weaponOf(c, 'A_u0')?.durability).toBe(1)
    run(c, 1)   // 第 2 tick：无可用技能 → 普攻 → 耐久 0 → 步末下线
    expect(weaponOf(c, 'A_u0')).toBeUndefined()
  })

  it('武器触发器随装备生效：on_attack 挂状态', () => {
    const c = createCombat(setup(['probe_weapon_trigger']))
    run(c, 1)   // 装备
    run(c, 1)   // 普攻
    const u = unitView(c, 'A_u0')!
    expect(u.statuses.some((s) => s.defId === 'probe_buff')).toBe(true)
  })

  it('modify_weapon 改耐久', () => {
    const c = createCombat(setup(['probe_weapon_a', 'probe_modify_weapon']))
    run(c, 3)   // mod(空) → equip → mod(-1)
    expect(weaponOf(c, 'A_u0')?.durability).toBe(1)
  })

  it('disarm 卸下武器', () => {
    const c = createCombat(setup(['probe_weapon_a', 'probe_disarm']))
    run(c, 4)
    expect(weaponOf(c, 'A_u0')).toBeUndefined()
    const events = c.drainEvents()
    const disarmed = events.find(
      (e) => e.type === 'EquipmentDestroyed' && e.slot === 'weapon' && e.reason === 'disarm',
    )
    expect(disarmed).toBeDefined()
  })
})

describe('护具：护甲池生命周期', () => {
  const PLATE: EquipmentDef = { id: 'probe_plate', slot: 'armor', armor: 5 }

  it('装备护具建护甲池（容量=初始值）；卸下清零', () => {
    const u = makeUnit('u', 'A')
    u.equipEquipment(PLATE, 'e1')
    expect(u.pool('armor').current).toBe(5)
    expect(u.pool('armor').max).toBe(5)
    expect(u.hasEquipped('armor')).toBe(true)
    u.removeEquipment('armor')
    expect(u.pool('armor').current).toBe(0)
    expect(u.pool('armor').max).toBe(0)
    expect(u.hasEquipped('armor')).toBe(false)
  })

  it('chargeArmor：正值充池抬水位；负值削池', () => {
    const u = makeUnit('u', 'A')
    u.equipEquipment(PLATE, 'e1')
    u.pool('armor').applyDelta(-3)   // 2/5
    u.chargeArmor(6)                 // 充 6 → 8，水位抬到 8
    expect(u.pool('armor').current).toBe(8)
    expect(u.pool('armor').max).toBe(8)
    u.chargeArmor(-8)
    expect(u.pool('armor').current).toBe(0)
  })

  it('两槽独立：武器与护具并存，换武器不动护甲池', () => {
    const u = makeUnit('u', 'A')
    u.equipEquipment(PLATE, 'e1')
    u.equipEquipment({ id: 'probe_blade', slot: 'weapon', attack: 2, durability: 3 }, 'w1')
    expect(u.equipment).toHaveLength(2)
    u.equipEquipment({ id: 'probe_axe', slot: 'weapon', attack: 1, durability: 1 }, 'w2')
    expect(u.equipment).toHaveLength(2)
    expect(u.pool('armor').current).toBe(5)
  })

  it('护甲池被打空：护具步末下线（reason=depleted）', () => {
    const c = createCombat(setup(['probe_armor'], [], { bSkills: ['probe_zap'], bStrength: 10 }))
    run(c, 30)
    const events = c.drainEvents()
    const depleted = events.find((e) => e.type === 'EquipmentDestroyed' && e.slot === 'armor')
    expect(depleted).toBeDefined()
    expect((depleted as { reason: string }).reason).toBe('depleted')
    expect(armorOf(c, 'A_u0')).toBeUndefined()
    expect(unitView(c, 'A_u0')!.hp).toBeGreaterThan(0)
  })

  it('disarm 护具：装备下线（卸下即清零由单位级语义保证）', () => {
    const c = createCombat(setup(['probe_armor', 'probe_disarm_armor'], [], { bStrength: 1 }))
    run(c, 4)
    expect(armorOf(c, 'A_u0')).toBeUndefined()
    const events = c.drainEvents()
    const disarmed = events.find(
      (e) => e.type === 'EquipmentDestroyed' && e.slot === 'armor' && e.reason === 'disarm',
    )
    expect(disarmed).toBeDefined()
  })
})

describe('护甲有形门槛（伤害链）', () => {
  const defenderWith = (armor: number, shield: number) => {
    const d = makeUnit('d', 'B', { strength: 3 })
    if (armor > 0) d.equipEquipment({ id: 'plate', slot: 'armor', armor }, 'e1')
    d.pool('shield').applyDelta(shield)
    return d
  }

  it('有形伤害被护甲吸收', () => {
    const d = defenderWith(5, 0)
    const r = resolveDamage({ raw: 10, element: 'physical', attacker: null, defender: d })
    expect(r.absorbed.armor).toBe(5)
    expect(r.final).toBe(5)
  })

  it.each(['mental', 'holy', 'dark'] as const)('无形元素（%s）绕过护甲，但护盾仍生效', (element) => {
    const d = defenderWith(5, 4)
    const r = resolveDamage({ raw: 10, element, attacker: null, defender: d })
    expect(r.absorbed.armor).toBe(0)
    expect(r.absorbed.shield).toBe(4)
    expect(r.final).toBe(6)
  })

  it('DoT 同时绕过护甲与护盾', () => {
    const d = defenderWith(5, 4)
    const r = resolveDamage({ raw: 10, element: 'physical', attacker: null, defender: d, dot: true })
    expect(r.absorbed).toEqual({ shield: 0, armor: 0 })
    expect(r.final).toBe(10)
  })
})

describe('护甲强化规则（2026-10-26 引擎兜底，零数据迁移）', () => {
  const ARMOR_NODE = { type: 'modify_resource', resource: 'armor', value: 3 } as never

  it('有护具：正值充池并抬容量水位', () => {
    const u = makeUnit('u', 'A')
    u.equipEquipment({ id: 'plate', slot: 'armor', armor: 5 }, 'e1')
    u.pool('armor').applyDelta(-5)   // 0/5
    handleModifyResource(ARMOR_NODE, u, stubContext(registryOf(u), null, []))
    expect(u.pool('armor').current).toBe(3)
    expect(u.pool('armor').max).toBe(5)
  })

  it('无护具：正值改充护盾池', () => {
    const u = makeUnit('u', 'A')
    handleModifyResource(ARMOR_NODE, u, stubContext(registryOf(u), null, []))
    expect(u.pool('shield').current).toBe(3)
    expect(u.pool('armor').current).toBe(0)
  })

  it('有护具：负值削池；无护具：负值空操作', () => {
    const u = makeUnit('u', 'A')
    u.equipEquipment({ id: 'plate', slot: 'armor', armor: 5 }, 'e1')
    handleModifyResource({ type: 'modify_resource', resource: 'armor', value: -2 } as never, u, stubContext(registryOf(u), null, []))
    expect(u.pool('armor').current).toBe(3)
    const bare = makeUnit('v', 'A')
    handleModifyResource({ type: 'modify_resource', resource: 'armor', value: -2 } as never, bare, stubContext(registryOf(bare), null, []))
    expect(bare.pool('armor').current).toBe(0)
    expect(bare.pool('shield').current).toBe(0)
  })
})

describe('装备牌：同槽公用 CD 与 recover_equipment', () => {
  it('武器下线后同槽装备牌全部进入公用 CD（未打出的丙也点亮）', () => {
    // 乙耐久 1：tick1 装备 → tick2 普攻耐久归零下线 → 同槽公用 CD（基数=乙卡面 100）
    // 丙能耗 10 打不出、也从没打出过——它上 CD 纯粹是「同槽公用」的证明。
    const c = createCombat(setup(['probe_weapon_b', 'probe_weapon_x']))
    run(c, 2)
    expect(weaponOf(c, 'A_u0')).toBeUndefined()
    run(c, 18)  // CD 100 远未转完：乙不能重打、丙也不能首打
    expect(weaponOf(c, 'A_u0')).toBeUndefined()
  })

  it('recover_equipment：主动回收下线，同槽 CD 按 0.3 缩减快速再起', () => {
    const c = createCombat(setup(['probe_weapon_a', 'probe_recover']))
    run(c, 3)   // 装备甲 → 回收（opp 0）→ 下线，同槽 CD = 100×0.3 = 30
    expect(weaponOf(c, 'A_u0')).toBeUndefined()
    run(c, 42)  // CD 30 已过：装备甲重新上身（若不缩减需 100 tick）
    const events = c.drainEvents()
    const destroyedIdx = events.findIndex(
      (e) => e.type === 'EquipmentDestroyed' && e.slot === 'weapon' && e.reason === 'recovered',
    )
    expect(destroyedIdx).toBeGreaterThanOrEqual(0)
    const reEquipped = events.findIndex(
      (e, i) => i > destroyedIdx && e.type === 'EquipmentEquipped' && e.defId === 'probe_weapon_a',
    )
    expect(reEquipped).toBeGreaterThan(destroyedIdx)
  })
})

describe('装备单位级语义', () => {
  const W: EquipmentDef = { id: 'probe_weapon_a', slot: 'weapon', attack: 3, durability: 2 }

  it('装备写攻击加值 provenance；下线即撤销', () => {
    const u = makeUnit('u', 'A', { strength: 1 })
    const base = u.effectiveProfile.attack
    u.equipEquipment(W, 'w1')
    expect(u.effectiveProfile.attack).toBe(base + 3)
    expect(u.hasEquipped('weapon')).toBe(true)
    u.removeEquipment('weapon')
    expect(u.effectiveProfile.attack).toBe(base)
    expect(u.hasEquipped()).toBe(false)
  })

  it('重复装备刷新耐久', () => {
    const u = makeUnit('u', 'A')
    u.equipEquipment(W, 'w1')
    u.equipment.find((e) => e.slot === 'weapon')!.durability = 0
    u.equipEquipment(W, 'w2')
    expect(u.equipment.find((e) => e.slot === 'weapon')?.durability).toBe(2)
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

  it('按装备实例判定，不点名具体装备', () => {
    const u = makeUnit('u', 'A', {}, [PROBE_BUFF])
    const ctx = condCtx(u)
    expect(evaluateCondition({ kind: 'has_equipped', side: 'self', slot: 'weapon' }, null, ctx)).toBe(false)
    u.equipEquipment({ id: 'w', slot: 'weapon', attack: 0, durability: 1 }, 'w1')
    expect(evaluateCondition({ kind: 'has_equipped', side: 'self', slot: 'weapon' }, null, ctx)).toBe(true)
    expect(evaluateCondition({ kind: 'has_equipped', side: 'self' }, null, ctx)).toBe(true)
  })

  it('id / tag 精确过滤（weapon_is / weapon_tag）', () => {
    const u = makeUnit('u', 'A', {}, [PROBE_BUFF])
    const ctx = condCtx(u)
    u.equipEquipment({ id: 'probe_blade', slot: 'weapon', attack: 1, durability: 2, tags: ['sword', 'blade'] }, 'w1')
    expect(evaluateCondition({ kind: 'has_equipped', side: 'self', id: 'probe_blade' }, null, ctx)).toBe(true)
    expect(evaluateCondition({ kind: 'has_equipped', side: 'self', id: 'probe_axe' }, null, ctx)).toBe(false)
    expect(evaluateCondition({ kind: 'has_equipped', side: 'self', tag: 'sword' }, null, ctx)).toBe(true)
    expect(evaluateCondition({ kind: 'has_equipped', side: 'self', tag: 'holy' }, null, ctx)).toBe(false)
    expect(evaluateCondition({ kind: 'has_equipped', side: 'self', slot: 'weapon', tag: 'blade' }, null, ctx)).toBe(true)
    expect(evaluateCondition({ kind: 'has_equipped', side: 'self', slot: 'armor' }, null, ctx)).toBe(false)
  })

  it('slot=armor 按护具判定', () => {
    const u = makeUnit('u', 'A', {}, [PROBE_BUFF])
    const ctx = condCtx(u)
    expect(evaluateCondition({ kind: 'has_equipped', side: 'self', slot: 'armor' }, null, ctx)).toBe(false)
    u.equipEquipment({ id: 'plate', slot: 'armor', armor: 3 }, 'e1')
    expect(evaluateCondition({ kind: 'has_equipped', side: 'self', slot: 'armor' }, null, ctx)).toBe(true)
    expect(evaluateCondition({ kind: 'has_equipped', side: 'self', slot: 'weapon' }, null, ctx)).toBe(false)
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
