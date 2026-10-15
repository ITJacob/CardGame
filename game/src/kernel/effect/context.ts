// 效果结算的运行时上下文与工具。
import type { Phase } from '../ids'
import type { DomainEvent } from '../combat/types'
import type { EffGrantImmunity, EffSpawn, EffectNode } from '../catalog/types'
import type { IdGenerator } from '../shared/id-generator'
import type { RandomSource, RandomUsageRegistry } from '../shared/random-source'
import type { StatusGrant } from '../roster/types'
import type { Registry } from '../roster/registry'
import type { CombatUnit, TargetabilityRecord } from '../roster/unit'
import type { TriggerPayload } from './payload'

/** 行动机会的括号载荷（调度上下文 §三 INV-S6）：on_turn_start / on_turn_end 触发时挂进上下文 */
export interface OpportunityPayload {
  /** 机会标识 = `${unitId}@${tickIndex}`——INV-S3 保证同 tick 每单位至多一次机会，故唯一 */
  readonly opportunityId: string
  /** on_turn_start 恒为 null；on_turn_end 为消耗它的 Action id，或 'wasted' */
  readonly consumedBy: string | null
}

export interface EffectContext {
  readonly units: Registry
  readonly random: RandomSource
  readonly registry: RandomUsageRegistry
  readonly ids: IdGenerator
  readonly phase: Phase
  readonly caster: CombatUnit | null
  /** 当前 Action 的 id（写入 EffectApplied） */
  readonly actionId: string
  /** 机会括号载荷：仅 on_turn_start / on_turn_end 触发链上存在（其余触发点与主动行为均为 undefined） */
  readonly opportunity?: OpportunityPayload
  /** 触发器载荷语境：仅触发链上存在（执行参数 §2.3）。存在时，效果节点上的 target 简写按它求值 */
  readonly payload?: TriggerPayload
  readonly warn: (msg: string) => void
  readonly emit: (e: DomainEvent) => void
  /** 挂载状态并触发 on_apply 等副作用（由 runtime 实现，避免循环依赖） */
  readonly mountStatus: (host: CombatUnit, statusId: string, grant: Omit<StatusGrant, 'sourceId'>) => void
  /** 按 EffectDef id 解析内联效果节点 */
  readonly effectNode: (defId: string) => EffectNode | undefined
  /** 状态定义的类别（供 dispel/reveal 过滤） */
  readonly defCategory: (defId: string) => readonly string[] | undefined
  /** 记录未实现原语（计入 unsupported 计数） */
  readonly unsupported: (kind: string, detail?: string) => void
  /** 遥测：造成伤害（用于 CombatStats） */
  readonly reportDamage?: (dealer: string, amount: number) => void
  /** 伤害落地钩子（触发 on_deal_damage / on_take_damage） */
  readonly onDamage?: (attacker: CombatUnit | null, defender: CombatUnit, amount: number) => void
  /** 需要触碰战场/注册表的操作（由 runtime 实现） */
  readonly ops: EffectOps
}

/** 原语中需要改动战场或新建单位的操作集合 */
export interface EffectOps {
  move(unit: CombatUnit, op: string, distance: number, caster: CombatUnit | null): void
  spawn(caster: CombatUnit | null, node: EffSpawn, near: CombatUnit | null): void
  translocate(unit: CombatUnit, duration: number, payload: readonly EffectNode[]): void
  takeControl(unit: CombatUnit, duration: number, caster: CombatUnit): void
  grantImmunity(unit: CombatUnit, node: EffGrantImmunity): void
  damageMod(unit: CombatUnit, scope: 'dealt' | 'taken', delta: number, remaining: number | null): void
  targetability(unit: CombatUnit, rec: TargetabilityRecord): void
  // ---- P2b-2 ----
  setLuminance(value: number | null, delta: number | null, duration: number | null, dispelable: boolean): void
  advanceClock(ticks: number): void
  applyDomain(op: string, defId: string | undefined, duration: number, caster: CombatUnit | null): void
  placeZone(caster: CombatUnit | null, defId: string | undefined, duration: number, targets: readonly CombatUnit[]): void
  snapshotUnit(unit: CombatUnit, fields: readonly string[]): void
  restoreUnit(unit: CombatUnit, fields: readonly string[]): void
  echoLastSkill(unit: CombatUnit, potency: number): void
  shuffleGauges(units: readonly CombatUnit[], resource: string): void
  shuffleStatuses(units: readonly CombatUnit[], count: number): void
  modifySkillOf(unit: CombatUnit, node: EffectNode): void
  applyTargetOverride(unit: CombatUnit, spec: { anchor?: string; faction?: string; sort?: string }): void
  writeRuleSlot(node: EffectNode, caster: CombatUnit | null): void
  modifyRuleSlot(node: EffectNode, caster: CombatUnit | null): void
  /** 战场级量表（secrecy / order / fate_value） */
  boardMeter(key: string, value: number, set: boolean): void
}

/** 用 EffectRef.params 覆写节点上的同名参数 */
export function withParams(node: EffectNode, params?: Record<string, unknown>): EffectNode {
  if (!params || Object.keys(params).length === 0) return node
  return { ...(node as unknown as Record<string, unknown>), ...params } as unknown as EffectNode
}

/** 取 EffectNode 的 condition / target（算子节点没有） */
export function nodeCondition(node: EffectNode): unknown {
  return (node as { condition?: unknown }).condition
}

export function numeric(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}
