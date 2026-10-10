// 调度上下文：时间与机会（调度上下文.md / 调度参数.md）。
// 铁律：推进与授予严格分离；机会不累积（未消耗记 wasted，INV-S4）。

import type { UnitId } from '../ids'

/** 行动机会：资格载体，独立于成本（调度上下文 §三） */
export interface ActionOpportunity {
  unitId: UnitId
  /** 授予时刻 */
  tickIndex: number
  /** 消耗它的 Action id；'wasted' = 未消耗作废；null = 尚未处理 */
  consumedBy: string | null
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

/** 调度器：tick 原子推进（第 1–7 步）；第 8 步「授予」由 runtime 经 InitiativePolicy 完成 */
export interface Scheduler {
  /** 单 tick 原子推进：clock→Gauge→Pool→Channel→Cooldown→Status→Zone/Domain；返回本 tick 的 GaugeCrossed */
  tick(): GaugeCrossed[]
}
