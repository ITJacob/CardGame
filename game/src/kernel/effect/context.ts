// 效果结算的运行时上下文与工具。
import type { Phase } from '../ids'
import type { DomainEvent } from '../combat/types'
import type { EffectNode } from '../catalog/types'
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
  /** 记录未实现原语（计入 unsupported 计数） */
  readonly unsupported: (kind: string, detail?: string) => void
  /** 遥测：造成伤害（用于 CombatStats） */
  readonly reportDamage?: (dealer: string, amount: number) => void
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
