// 效果上下文：结算（效果上下文.md / 效果参数.md）。
// 伤害链顺序固定：护盾(LIFO)→护甲→抗性→防御→乘区→下限；全程小数不取整。

import type { Element } from '../ids'
import type { EffectType } from '../catalog/types'
import type { Unit } from '../roster/types'
import type { EffDamage } from '../catalog/types'

/** 由 EffectDef + EffectRef.params 组合出的结算体（效果上下文 §二） */
export interface Effect {
  defId: string
  type: EffectType
  /** 伤害类必填，其余 none（INV-EL2：挂在 effect 层） */
  element: Element
  params: EffDamage & Record<string, unknown>
}

export type MitigationStageKind =
  | 'shield' | 'armor' | 'resistance' | 'defense' | 'multiplier' | 'floor'

export interface MitigationStage {
  kind: MitigationStageKind
  apply(cur: number, attacker: Unit, defender: Unit): number
}

/** 有序减伤管道；顺序固定，配置只决定组成 */
export interface DamageChain {
  stages: MitigationStage[]
}

/** 可复现的伤害明细（INV-D2） */
export interface DamageResult {
  raw: number
  stageBreakdown: { stage: MitigationStageKind; value: number }[]
  final: number
}

export interface EffectExecutor {
  /** 逐目标：condition 判定 → 执行 → 发 EffectApplied */
  execute(effect: Effect, target: Unit): void
}
