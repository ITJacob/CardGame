// 编队上下文：单位与挂载（编队上下文.md / 编队参数.md）。
// 三层：AttributeSet（源，战内不可变）→ BaseProfile（派生一次）→ EffectiveProfile（应用 ModifierLayer）。

import type { Element, FactionId, Gender, InstanceId, PoolKey, Reach, StatKey, UnitId } from '../ids'
import type { EffectRef } from '../shared/types'
import type { Coordinate } from '../battle/types'

/** 源属性：力/敏/智 + 位格 rank；战内不可变 */
export interface AttributeSet {
  strength: number
  agility: number
  intelligence: number
  rank: number
}

/** 逐元素抗性 8 槽（走 BaseProfile + ModifierLayer，按 sourceId 撤销；基线全 0） */
export type ResistanceSet = {
  [K in Exclude<Element, 'none'>]: number
}

/** 由属性点派生一次、战斗内不可变（编队参数 §2.1） */
export interface BaseProfile {
  hpMax: number
  energyMax: number
  energyRegen: number
  gaugeRate: number
  gaugeThreshold: number
  attack: number
  defense: number
  rank: number
  resistances: ResistanceSet
}

/** 派生 + 缓存；脏时重算 */
export type EffectiveProfile = BaseProfile

export type ModifierOp = 'delta' | 'set' | 'mul' | 'to_at_least' | 'to_at_most'

/** 审计视图条目：某来源对某属性的净增量 */
export interface ModifierEntry {
  stat: StatKey
  /** = 实例 ID（非类型 ID） */
  sourceId: string
  value: number
}

/**
 * 修正层：按 (stat, sourceId) 存「净增量」槽，天然与顺序无关，便于按来源整组回滚。
 * set/mul/to_at_least/to_at_most 在写入前折算成等价 delta，故运行时只存 delta。
 */
export interface ModifierLayer {
  set(stat: StatKey, sourceId: string, value: number): number | null
  restore(stat: StatKey, sourceId: string, prev: number | null): void
  deltaOf(stat: StatKey): number
  sources(): string[]
  entriesOf(stat: StatKey): ModifierEntry[]
}

/** 溯源账本条目：某来源对某属性的一次写入 */
export interface ProvenanceEntry {
  readonly stat: StatKey
  readonly sourceId: string
  readonly appliedDelta: number
  readonly previousDelta: number | null
  /** null = 永久；数字 = 剩余 tick */
  remaining: number | null
}

/** 溯源账本（INV-P1..P4）：写入/撤销按 sourceId 一一对应 */
export interface StatProvenance {
  apply(stat: StatKey, value: number, sourceId: string): ProvenanceEntry
  applyTimed(stat: StatKey, value: number, sourceId: string, duration: number): ProvenanceEntry
  /** 恢复到写入前的值，而非「减去写入量」（INV-P2） */
  revertBySource(sourceId: string): readonly ProvenanceEntry[]
  revertAll(): void
  /** tick 第 6 步：递减带时限条目，到期者回滚 */
  tick(): readonly ProvenanceEntry[]
  entriesOf(stat: StatKey): readonly ProvenanceEntry[]
}

/** 进度型资源：严格越阈（>）触发 */
export interface Gauge {
  current: number
  rate: number
  threshold: number
  overflowPolicy: 'keep' | 'reset'
  advance(): { crossed: boolean; overflow: number; before: number; after: number }
  settleOverflow(): void
  consume(amount: number): number
  applyDelta(dimension: 'current' | 'rate' | 'threshold', delta: number): number
  setValue(dimension: 'current' | 'rate' | 'threshold', value: number): number
}

/** 池型资源：hp/energy/shield/armor/lost/lust */
export interface Pool {
  current: number
  min: number
  max: number
  regen: number
  readonly isEmpty: boolean
  applyDelta(delta: number): number
  absorb(amount: number): number
  setValue(value: number): number
  regenerate(): number
  setMax(max: number): void
}

export interface ShieldLayer {
  amount: number
  remaining: number
  charges: number | null
}

export interface StatusGrant {
  duration?: number
  stacks?: number
  params?: Record<string, number>
  sourceId: string
  binding?: { guardTarget?: string; redirectTarget?: string }
  sourcePathway?: string
}

export interface StatusInstance {
  instanceId: InstanceId
  defId: string
  grant: StatusGrant
  remaining: number
  currentStacks: number
}

/** 状态容器：只管挂载/叠加/到期/卸载的数据面，不触发副作用（副作用由效果层编排） */
export interface StatusSet {
  /** 挂载；reject 策略且已存在时返回 null（本次被拒） */
  mount(defId: string, grant: StatusGrant): StatusInstance | null
  unmount(instanceId: string, reason: string): StatusInstance | null
  /** tick 第 6 步；返回本 tick 到期卸载的实例 */
  tick(): StatusInstance[]
  all(): readonly StatusInstance[]
  byDef(defId: string): readonly StatusInstance[]
  stacksOf(defId: string): number
  has(defId: string): boolean
  clear(): void
}

/** 可提交的主动行为槽（含引擎内置普攻）。效果与目标规格由 catalog 按 defId 解析。 */
export interface BehaviorSlot {
  readonly instanceId: InstanceId
  /** SkillDef id，或内置普攻的保留 id */
  readonly defId: string
  readonly kind: 'skill' | 'basic_attack'
  readonly reach: Reach
  readonly cost: { energy: number; gauge: number; cooldown: number }
  cooldownRemaining: number
}

export interface SkillSlot {
  skillDefId: string
}

/** 引导通道（编队上下文 §八）：点火时已解析并冻结目标 */
export interface Channel {
  sourceInstanceId: InstanceId
  remaining: number
  resolvedTargets: string[]
  pendingEffects: EffectRef[]
  interruptible: boolean
}

/** 聚合内实体（Unit 不是聚合根） */
export interface Unit {
  id: UnitId
  faction: FactionId
  gender?: Gender
  attributes: AttributeSet
  baseProfile: BaseProfile
  modifiers: ModifierLayer
  effectiveProfile: EffectiveProfile
  gauges: Map<string, Gauge>
  pools: Map<PoolKey, Pool>
  statuses: StatusSet
  behaviorSlots: BehaviorSlot[]
  skillSlots: SkillSlot[]
  channel: Channel | null
  cooldowns: Map<string, number>
  /** Coordinate 只读投影，由 Placement 单向同步 */
  position: Coordinate | null
  provenance: StatProvenance
  /** translocate 跨层离场标志（效果上下文 §二） */
  detached?: boolean
}

export interface UnitRegistry {
  get(id: UnitId): Unit | undefined
  all(): Unit[]
}

export interface ProfileQuery {
  effective(unit: Unit, stat: StatKey): number
  /** 仅同场战斗内有效（编队参数 §1.4） */
  compareRank(a: Unit, b: Unit): number
}
