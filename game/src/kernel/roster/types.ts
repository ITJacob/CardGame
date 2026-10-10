// 编队上下文：单位与挂载（编队上下文.md / 编队参数.md）。
// 三层：AttributeSet（源，战内不可变）→ BaseProfile（派生一次）→ EffectiveProfile（应用 ModifierLayer）。

import type { Element, FactionId, Gender, InstanceId, PoolKey, StatKey, UnitId } from '../ids'
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

export interface ModifierEntry {
  stat: StatKey
  op: ModifierOp
  value: number
  /** = 实例 ID（非类型 ID） */
  sourceId: string
  /** null = 永久；带值由账本自带计时，到期 revertBySource */
  remaining: number | null
}

export interface ModifierLayer {
  entries: ModifierEntry[]
}

/** 溯源账本（INV-P1..P4）：写入/撤销按 sourceId 一一对应 */
export interface StatProvenance {
  apply(stat: StatKey, value: number, sourceId: string): void
  applyTimed(stat: StatKey, value: number, sourceId: string, duration: number): void
  /** 恢复到写入前的值，而非「减去写入量」（INV-P2） */
  revertBySource(sourceId: string): void
  revertAll(): void
  entriesOf(stat: StatKey): ModifierEntry[]
}

/** 进度型资源：严格越阈（>）触发 */
export interface Gauge {
  current: number
  rate: number
  threshold: number
  overflowPolicy: 'Keep' | 'Zero'
}

/** 池型资源：hp/energy/shield/armor/lost/lust */
export interface Pool {
  current: number
  min: number
  max: number
  regen: number
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

export interface BehaviorOverrides {
  cost?: { energy?: number; cooldown?: number; castTime?: number }
  cooldown?: number
  targetSpecOverride?: unknown
  effects?: EffectRef[]
  reach?: string
}

export interface BehaviorSlot {
  instanceId: InstanceId
  templateId: string
  reach: 'Melee' | 'Thrown' | 'Spell' | 'None'
  overrides: BehaviorOverrides
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
  statuses: StatusInstance[]
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
