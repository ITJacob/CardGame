// 效果结算的运行时上下文与工具。
import type { Phase } from '../ids'
import type { DomainEvent } from '../combat/types'
import type { EffGrantImmunity, EffSpawn, EffectNode } from '../catalog/types'
import type { IdGenerator } from '../shared/id-generator'
import type { RandomSource, RandomUsageRegistry } from '../shared/random-source'
import type { StatusGrant } from '../roster/types'
import type { Registry } from '../roster/registry'
import type { CombatUnit } from '../roster/unit'

export interface EffectContext {
  readonly units: Registry
  readonly random: RandomSource
  readonly registry: RandomUsageRegistry
  readonly ids: IdGenerator
  readonly phase: Phase
  readonly caster: CombatUnit | null
  /** 当前 Action 的 id（写入 EffectApplied） */
  readonly actionId: string
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
  targetability(unit: CombatUnit, untargetable: boolean, remaining: number | null): void
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
