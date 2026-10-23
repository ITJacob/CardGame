// 单位：聚合内的实体（不是聚合根）。装配属性/资源/状态/修正层。
import type { Element, FactionId, Gender, InstanceId, PoolKey, StatKey, UnitId } from '../ids'
import type { Coordinate } from '../battle/types'
import type { StatusDef, TriggerDef, WeaponDef } from '../catalog/types'
import { StatModifiers } from './attributes'
import { computeEffective, deriveBaseProfile } from './profile'
import { StatProvenance } from './provenance'
import { Gauge, Pool } from './resources'
import { CombatStatusSet, type StatusDefLookup } from './status'
import type { AttributeSet, BaseProfile, BehaviorSlot, Channel, EffectiveProfile, SkillSlot, StatusSet, Unit, WeaponInstance } from './types'
import { rawModifier } from './statusModifiers'

export interface UnitDeps {
  statusDefs: StatusDefLookup
  nextStatusId: () => InstanceId
}

/** 免疫记录（grant_immunity）：按状态类别拦截挂载，可带次数/时限 */
export interface ImmunityRecord {
  categories: readonly string[]
  charges: number | null
  remaining: number | null
}

/** 选靶口径：指定型（mode=unit）/ 区块型（mode=area）；both = 两者都挡 */
export type TargetKind = 'targeted' | 'area' | 'both'

/** 不可被选中的施加方：any=任何人；enemy/ally 按施法方阵营（modify_targetability.direction） */
export type TargetSide = 'any' | 'enemy' | 'ally'

/** 临时可选中性覆写记录（modify_targetability） */
export interface TargetabilityRecord {
  untargetable: boolean
  remaining: number | null
  /** 缺省 targeted（旧数据无 direction 时的保守口径） */
  kind?: TargetKind
  side?: TargetSide
}

export class CombatUnit implements Unit {
  readonly baseProfile: BaseProfile
  readonly modifiers = new StatModifiers()
  readonly statuses: StatusSet
  readonly provenance: StatProvenance
  readonly gauges = new Map<string, Gauge>()
  readonly pools = new Map<PoolKey, Pool>()
  readonly skillSlots: SkillSlot[] = []
  readonly behaviorSlots: BehaviorSlot[] = []
  readonly cooldowns = new Map<string, number>()
  readonly tags: readonly string[]
  readonly immunities: ImmunityRecord[] = []
  /** 被动卡：hook 事件触发卡面 effects（BehaviorTemplate） */
  readonly passives: { defId: string; triggers: readonly TriggerDef[] }[] = []
  /** 临时增减伤修正（modify_damage）：scope → 桶增量 */
  readonly damageMods: { scope: 'dealt' | 'taken'; delta: number; remaining: number | null }[] = []
  /** 临时可选中性覆写（modify_targetability） */
  readonly manualUntargetable: TargetabilityRecord[] = []

  position: Coordinate | null = null
  channel: Channel | null = null
  detached = false
  /** take_control：被夺取时的原阵营（用于回归） */
  originalFaction: FactionId | null = null
  /** 召唤物类别（unitDef.unitType / spawn def） */
  unitType: string | null = null
  /** 单位蓝本 id（spawn 时记录，供 caster_has_summon.unitId / summon_is 谓词） */
  unitDefId: string | null = null
  /** 召唤者（spawn 时记录，供 caster_has_summon 谓词） */
  summonerId: UnitId | null = null
  /** 入场途径（ClassDef.id）；职业自带资源/规则按它分发 */
  pathwayId: string | null = null
  /** 当前装备武器（单槽；null = 徒手） */
  weapon: WeaponInstance | null = null
  /** 本回合已获得的战意层数（每自身回合重置；上限 3） */
  warSpiritGain = 0
  /** target_override：下一次选靶的覆盖（消费后清空） */
  pendingTargetOverride: { anchor?: string; faction?: string; sort?: string } | null = null

  private readonly statusDefs: StatusDefLookup

  constructor(
    readonly id: UnitId,
    public faction: FactionId,
    readonly attributes: AttributeSet,
    readonly gender: Gender,
    deps: UnitDeps,
    tags: readonly string[] = [],
  ) {
    this.tags = tags
    this.statusDefs = deps.statusDefs
    this.baseProfile = deriveBaseProfile(attributes)
    this.statuses = new CombatStatusSet(deps.statusDefs, deps.nextStatusId)
    this.provenance = new StatProvenance(this.modifiers, () => this.syncPools())
    this.initPools()
  }

  private initPools(): void {
    const p = this.effectiveProfile
    this.pools.set('hp', new Pool('hp', p.hpMax, 0, p.hpMax, 0))
    this.pools.set('energy', new Pool('energy', 0, 0, p.energyMax, p.energyRegen))
    this.pools.set('shield', new Pool('shield', 0, 0, 9999, 0))
    this.pools.set('armor', new Pool('armor', 0, 0, 9999, 0))
    this.pools.set('lost', new Pool('lost', 0, 0, 8, 0))
    this.pools.set('lust', new Pool('lust', 0, 0, 10, 0))
    this.gauges.set('action', new Gauge('action', 0, p.gaugeRate, p.gaugeThreshold, 'keep'))
  }

  get effectiveProfile(): EffectiveProfile {
    return computeEffective(this.baseProfile, this.modifiers)
  }

  pool(key: PoolKey): Pool {
    const p = this.pools.get(key)
    if (!p) throw new Error(`未知池：${key}`)
    return p
  }

  get gauge(): Gauge {
    return this.gauges.get('action') as Gauge
  }

  /** 修正层变动后同步受派生影响的池上限与行动条源属性 */
  syncPools(): void {
    const p = this.effectiveProfile
    this.pool('hp').setMax(p.hpMax)
    this.pool('energy').setMax(p.energyMax)
    this.pool('energy').regen = p.energyRegen
    this.gauge.rate = p.gaugeRate
    this.gauge.threshold = Math.max(1, p.gaugeThreshold)
  }

  // ---- ConditionUnit 适配 ----
  get hp(): number {
    return this.pool('hp').current
  }
  get hpMax(): number {
    return this.effectiveProfile.hpMax
  }
  get isDead(): boolean {
    return this.hp <= 0
  }
  statusStacks(defId: string): number {
    return this.statuses.stacksOf(defId)
  }
  hasStatusParam(defId: string, key: string): boolean {
    return this.statuses.byDef(defId).some((i) => i.grant.params != null && key in i.grant.params)
  }
  hasEquipped(slot?: string, defId?: string, tag?: string): boolean {
    const w = this.weapon
    if (!w) return false
    if (slot && w.slot !== slot) return false
    if (defId && w.defId !== defId) return false
    if (tag && !(w.tags ?? []).includes(tag)) return false
    return true
  }
  /** 装备武器：先销毁旧的，再写攻击加值 provenance（sourceId = WeaponInstance） */
  equipWeapon(def: WeaponDef, instanceId: string): WeaponInstance {
    if (this.weapon) this.provenance.revertBySource(this.weapon.instanceId)
    const inst: WeaponInstance = {
      instanceId,
      defId: def.id,
      slot: 'weapon',
      attack: def.attack,
      durability: def.durability,
      tags: def.tags,
    }
    this.weapon = inst
    this.provenance.apply('attack', def.attack, instanceId)
    return inst
  }
  /** 销毁当前武器并撤销其修正 */
  destroyWeapon(): WeaponInstance | null {
    const w = this.weapon
    if (!w) return null
    this.provenance.revertBySource(w.instanceId)
    this.weapon = null
    return w
  }
  stat(key: StatKey): number {
    const p = this.effectiveProfile
    switch (key) {
      case 'attack': return p.attack
      case 'defense': return p.defense
      case 'rank': return p.rank
      case 'hp_max': return p.hpMax
      case 'energy_max': return p.energyMax
      case 'energy_regen': return p.energyRegen
      case 'gauge.rate': return p.gaugeRate
      case 'gauge.threshold': return p.gaugeThreshold
      default:
        if (key.startsWith('resist:')) return p.resistances[key.slice(7) as Exclude<Element, 'none'>] ?? 0
        return 0
    }
  }

  resistanceOf(element: Element): number {
    if (element === 'none') return 0
    return this.effectiveProfile.resistances[element] ?? 0
  }

  // ---- 状态修饰袋（编队参数 §2.4） ----

  /** 某状态修饰键的净增量（乘数语义，(v-1)×层数 求和） */
  modifierDelta(key: string): number {
    let sum = 0
    for (const inst of this.statuses.all()) {
      const v = numericModifierOf(this.statusDefs.statusDef(inst.defId), key)
      if (v !== null) sum += (v - 1) * inst.currentStacks
    }
    return sum
  }

  hasStatusModifier(key: string): boolean {
    return this.statuses.all().some((i) => rawModifier(this.statusDefs.statusDef(i.defId)?.modifiers, key) !== undefined)
  }

  /** 持态型选靶覆写（BehaviorModifier op:target_override）；后挂载者胜出。 */
  activeTargetOverride(): { anchor?: string; faction?: string; sort?: string } | null {
    let out: { anchor?: string; faction?: string; sort?: string } | null = null
    for (const inst of this.statuses.all()) {
      const def = this.statusDefs.statusDef(inst.defId)
      for (const raw of def?.behaviorModifiers ?? []) {
        if (!raw || typeof raw !== 'object') continue
        const bm = raw as { op?: string; anchor?: string; faction?: string; sort?: string }
        if (bm.op === 'target_override') out = { anchor: bm.anchor, faction: bm.faction, sort: bm.sort }
      }
    }
    return out
  }

  /**
   * 持态型行为白名单（BehaviorModifier op:force，执行参数 §一）：force 并集。
   * 返回空数组 = 不限制；非空时只有 defId 或行为 kind 命中白名单的 active 行为可选。
   * 拔刀特权用它把「同一次机会的后续行动」限死为 basic_attack。
   */
  activeForcedBehaviors(): readonly string[] {
    const out: string[] = []
    for (const inst of this.statuses.all()) {
      const def = this.statusDefs.statusDef(inst.defId)
      for (const raw of def?.behaviorModifiers ?? []) {
        if (!raw || typeof raw !== 'object') continue
        const bm = raw as { op?: string; behaviors?: unknown }
        if (bm.op !== 'force' || !Array.isArray(bm.behaviors)) continue
        for (const b of bm.behaviors) {
          if (typeof b === 'string' && !out.includes(b)) out.push(b)
        }
      }
    }
    return out
  }

  hasStatusCategory(category: string): boolean {
    return this.statuses.all().some((i) => (this.statusDefs.statusDef(i.defId)?.category ?? []).includes(category))
  }

  /**
   * 不可被选中（共享内核参数 §四）。
   * kind='targeted'（mode=unit，指定型）/ 'area'（mode=area，区块型）——**scope:all 的绝对封印两者都挡**，
   * 其余（single / same_faction / 无 scope）只挡指定型（「不可被选中」是候选池层面的排除，不对 AoE 生效）。
   * ⚠️ 未接通：direction:outbound（管「能否选中别人」）与 scope:same_faction 的 effectCategories 白名单。
   */
  isUntargetable(kind: 'targeted' | 'area' = 'targeted', casterFaction?: FactionId): boolean {
    // modify_targetability：后写覆盖先写（untargetable:false 即恢复）
    for (let i = this.manualUntargetable.length - 1; i >= 0; i -= 1) {
      const m = this.manualUntargetable[i]!
      const mk = m.kind ?? 'targeted'
      if (mk !== 'both' && mk !== kind) continue
      const side = m.side ?? 'any'
      if (side !== 'any' && casterFaction !== undefined) {
        const casterIsEnemy = casterFaction !== this.faction
        if ((side === 'enemy') !== casterIsEnemy) continue
      }
      return m.untargetable
    }
    for (const inst of this.statuses.all()) {
      const v = rawModifier(this.statusDefs.statusDef(inst.defId)?.modifiers, 'untargetableByTargeted')
      if (v === undefined) continue
      if (v === true) return true
      if (v && typeof v === 'object') {
        const o = v as { direction?: string; scope?: string }
        const dir = o.direction ?? 'both'
        if (dir === 'outbound') continue
        if (kind === 'targeted' || o.scope === 'all') return true
      }
    }
    return false
  }

  /** 状态常驻乘区：同类取最优——增益取最大、减益取最小，两者再相乘一次。 */
  private bestStatusMul(key: string): number {
    let gain = 1
    let loss = 1
    for (const inst of this.statuses.all()) {
      const v = numericModifierOf(this.statusDefs.statusDef(inst.defId), key)
      if (v === null) continue
      const eff = 1 + (v - 1) * inst.currentStacks
      if (eff >= 1) gain = Math.max(gain, eff)
      else loss = Math.min(loss, eff)
    }
    return gain * loss
  }

  get damageTakenMul(): number { return this.bestStatusMul('damage_taken_mul') }

  get damageDealtMul(): number { return this.bestStatusMul('damage_mul') }

  /** 一次性增减伤修正桶（modify_damage）：同事件内先加后乘。 */
  get damageTakenBucket(): number {
    let delta = 0
    for (const m of this.damageMods) if (m.scope === 'taken') delta += m.delta
    return delta
  }

  /** 一次性输出增减伤修正桶。 */
  get damageDealtBucket(): number {
    let delta = 0
    for (const m of this.damageMods) if (m.scope === 'dealt') delta += m.delta
    return delta
  }
}

function numericModifierOf(def: StatusDef | undefined, key: string): number | null {
  const v = rawModifier(def?.modifiers, key)
  if (v === undefined) return null
  if (typeof v === 'number') return v
  if (v && typeof v === 'object') {
    const o = v as { value?: number; mul?: number; ratio?: number }
    return o.value ?? o.mul ?? o.ratio ?? null
  }
  return null
}
