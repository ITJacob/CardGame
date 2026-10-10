// 执行上下文：动作与流水线（执行上下文.md / 执行参数.md）。
// Pipeline：I 目标解释 → R 动作期干预 → M 消费分流 → O 结果应用。

import type { UnitId } from '../ids'
import type { Coordinate } from '../battle/types'
import type { Consumption, EffectRef, SortKey, TargetSpec } from '../shared/types'
import type { BehaviorSlot, Unit } from '../roster/types'

export interface Cost {
  energy: number
  cooldown: number
  castTime: number | null
}

/** 点火方式（执行上下文 §二） */
export type Ignition =
  | { kind: 'Commit'; cost: Cost }
  | { kind: 'EventTrigger' }

export interface ActionSource {
  ignition: Ignition
  targetSpec: TargetSpec | null
  effects: EffectRef[]
}

/** 施法方快照（committedTargets 的防御依据） */
export interface CasterSnapshot {
  unitId: UnitId
  coord: Coordinate
  behaviorSlot?: BehaviorSlot
}

export interface ResolvedTarget {
  coord: Coordinate
  /** 该坐标当前租客，可为 null（空坐标合法） */
  occupant: UnitId | null
}

export interface RedirectRule {
  to: 'self' | 'attacker' | 'transfer_target' | 'first_empty'
  priority: number
  protectedSelector?: { kind: 'unit_ref' | 'coordinate_relation'; relation?: 'same_lane_behind' }
  sourceFilter?: 'melee' | 'thrown' | 'spell' | 'skill' | 'any'
}

export interface RedirectStep {
  from: ResolvedTarget
  to: ResolvedTarget
  rule: RedirectRule
  priority: number
}

export interface SettlementPlanItem {
  target: ResolvedTarget
  effects: EffectRef[]
  damageTakenMul?: number
}

export interface Outcome {
  effectRef: EffectRef
  target: ResolvedTarget
  detail?: Record<string, number | string>
}

/** 决策期约束聚合的产物（执行上下文 §三） */
export interface BehaviorContext {
  forcedTargets?: ResolvedTarget[]
  disabled?: boolean
  overrides?: Record<string, unknown>
}

export interface Action {
  readonly id: string
  readonly sourceRef: string
  readonly caster: CasterSnapshot
  /** EventTrigger 时为 null */
  readonly opportunityId: string | null
  /** I 产出，此后不可改（INV-E5） */
  readonly committedTargets: readonly ResolvedTarget[]
  readonly behaviorContext: BehaviorContext
  finalTargets: ResolvedTarget[]
  redirectLog: RedirectStep[]
  settlementPlan: Map<string, SettlementPlanItem>
  readonly consumption: Consumption
  outcomes: Outcome[]
}

/** I-1 候选池（执行上下文 §四） */
export interface CandidatePool {
  targets: ResolvedTarget[]
  /** 提交时校验（INV-E9） */
  stateVersion: number
  pickCount: number | 'all'
  selectionMode: 'auto' | 'manual'
  fallbackSort?: SortKey
}

/**
 * 可暂停的流水线状态。
 * 内核在 I-2 遇 Manual（候选 > pickCount 且玩家在场）时进入 Awaiting，
 * 由 UI 喂回 picks 后 continue 续跑；无玩家/AI/超时走 fallbackSort。
 * 这是「纯函数 + 输入序列」的落地接口（见 DESIGN.md §三）。
 */
export type PipelineState =
  | { phase: 'I'; pool: CandidatePool }
  | { phase: 'Awaiting'; pool: CandidatePool; continue: (picks: ResolvedTarget[]) => PipelineState }
  | { phase: 'R'; action: Action }
  | { phase: 'M'; action: Action }
  | { phase: 'O'; action: Action }

/** 供 UI 渲染的决策请求 */
export interface DecisionRequest {
  actionId: string
  caster: UnitId
  candidates: ResolvedTarget[]
  pickCount: number
  fallbackSort?: SortKey
}

export type DecisionInput = ResolvedTarget[]

/** 单位投影（只读） */
export type UnitView = Pick<Unit, 'id' | 'faction' | 'position' | 'detached'>
