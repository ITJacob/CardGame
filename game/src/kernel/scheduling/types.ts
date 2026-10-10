// 调度上下文：时间与机会（调度上下文.md / 调度参数.md）。
// 铁律：推进与授予严格分离；机会不累积（未消耗记 wasted，INV-S4）。

import type { UnitId } from '../ids'

/** 行动机会：资格载体，独立于成本（调度上下文 §三） */
export interface ActionOpportunity {
  unitId: UnitId
  /** 授予时刻 */
  tickIndex: number
  /** 消耗它的 Action；未消耗记 'wasted' */
  consumedBy: string | 'wasted'
}

export interface ChannelSlot {
  remaining: number
}

export interface CooldownSlot {
  /** 起点 = 提交时刻 */
  remaining: number
}

export interface GaugeCrossed {
  unitId: UnitId
  /** 严格越过阈值（>），非 ≥（INV-S1） */
  gaugeKey: string
}

/** 先手裁决（调度上下文 §四）：己方←sort(by(lane,index))；敌方同；交替合并（INV-S2） */
export interface InitiativePolicy {
  resolveOrder(crossed: readonly GaugeCrossed[]): ActionOpportunity[]
}

/** 调度器：tick 原子推进（8 阶段）+ 授予机会 */
export interface Scheduler {
  /** 单 tick 原子推进：clock→Gauge→Pool→Channel→Cooldown→Status→Zone/Domain→授予 */
  tick(): ActionOpportunity[]
}
