// 战斗聚合根与对外契约（README §〇/§一/§三）。
// 入场 CombatSetup → 出场 CombatEnded；内核是纯函数：结果 = f(初始状态, 输入序列, seed)。

import type { FactionId, Gender, Phase, UnitId } from '../ids'
import type { CatalogSnapshot } from '../catalog/types'
import type { Coordinate, DomainGrant, OccupancyChanged } from '../battle/types'
import type { StatusGrant, Unit } from '../roster/types'
import type { ActionOpportunity } from '../scheduling/types'
import type {
  DecisionInput, DecisionRequest, RedirectStep, ResolvedTarget,
} from '../execution/types'
import type { EffectRef } from '../shared/types'

/** 主动技能槽的初始装配 */
export interface SkillGrantInit {
  skillDefId: string
}

/** 单个单位的初始装配 */
export interface UnitSetup {
  defId?: string
  unitId?: UnitId
  coordinate: Coordinate
  attributeSet: { strength: number; agility: number; intelligence: number; rank?: number }
  gender: Gender
  anchor: number
  activeSlots?: SkillGrantInit[]
  passiveSlots?: { defId: string }[]
  initialStatuses?: StatusGrant[]
  pools?: Partial<Record<'hp' | 'energy' | 'shield' | 'armor' | 'lost' | 'lust', number>>
  gauge?: { current?: number }
}

export interface FactionSetup {
  id: FactionId
  name: string
  units: UnitSetup[]
}

export interface ClockInit {
  /** 起始 clock 的基准值（窗口内按 seed 抖动，R3 登记 / R4 单次） */
  base: number
}

export interface LuminanceInit {
  value?: number
  delta?: number
}

/** 入口契约 */
export interface CombatSetup {
  seed: number
  catalog: CatalogSnapshot
  board: {
    clock: ClockInit
    domainGrants: DomainGrant[]
    illuminance?: LuminanceInit
  }
  factions: [FactionSetup, FactionSetup]
  inputs: InputSequence
}

/** 外部输入序列：所有人工决策都是它的一个元素（AI 与人只是两种产生器） */
export interface InputSequence {
  decisions: Map<string, DecisionInput>
  [k: string]: unknown
}

/** 可复现的随机源快照 */
export interface RandomSnapshot {
  seed: number
  state: readonly number[]
}

export interface CombatStats {
  ticks: number
  turns: number
  damageDealt: Record<FactionId, number>
  healingDone: Record<FactionId, number>
  unitsLost: Record<FactionId, number>
}

export interface CombatSnapshot {
  battle: unknown
  units: Unit[]
}

/** 出口契约 */
export interface CombatEnded {
  outcome: 'side_a' | 'side_b' | 'draw' | 'aborted'
  winnerFactionId?: FactionId
  events: readonly DomainEvent[]
  finalState: CombatSnapshot
  randomSnapshot: RandomSnapshot
  stats: CombatStats
}

export interface StepReport {
  tick: number
  opportunities: ActionOpportunity[]
  pending: DecisionRequest | null
  ended: boolean
}

/** 只读投影，供 UI 渲染（战斗 → 外部最终一致） */
export interface CombatView {
  tick: number
  phase: Phase
  units: readonly UnitViewLite[]
  pending: DecisionRequest | null
  finished: boolean
}

export interface UnitViewLite {
  id: UnitId
  faction: FactionId
  coordinate: Coordinate | null
  hp: number
  hpMax: number
  energy: number
  gauge: number
  statuses: { defId: string; stacks: number }[]
}

/** 运行门面：UI 只认这个（见 DESIGN.md §三） */
export interface CombatFacade {
  state(): CombatView
  drainEvents(): readonly DomainEvent[]
  /** 内核暂停点：Manual 目标选择 */
  pendingDecision(): DecisionRequest | null
  /** 喂回输入，内核续跑 */
  submitDecision(d: DecisionInput): void
  /** 推进一个 tick（或直到下一个决策点） */
  step(): StepReport
  ended(): CombatEnded | null
  setup(): Readonly<CombatSetup>
}

// ---------- 领域事件（战斗 → 外部，最终一致） ----------
export type DomainEvent =
  | { type: 'TickAdvanced'; tickIndex: number }
  | { type: 'GaugeCrossed'; unitId: UnitId; gaugeKey: string }
  | { type: 'ActionOpportunityGranted'; opportunity: ActionOpportunity }
  | { type: 'BehaviorCommitted'; actionId: string; caster: UnitId; cost: unknown }
  | { type: 'ChannelStarted'; channel: unknown }
  | { type: 'ChannelInterrupted'; channel: unknown }
  | { type: 'ChannelCompleted'; channel: unknown }
  | { type: 'TargetsResolved'; actionId: string; targets: ResolvedTarget[] }
  | { type: 'ActionRedirected'; actionId: string; step: RedirectStep }
  | { type: 'EffectApplied'; actionId: string; effectRef: EffectRef; target: ResolvedTarget }
  | { type: 'OccupancyChanged'; diff: OccupancyChanged }
  | { type: 'StatusMounted'; instanceId: string; defId: string }
  | { type: 'StatusRefreshed'; instanceId: string; defId: string }
  | { type: 'StatusExpired'; instanceId: string; defId: string }
  | { type: 'StatusDispelled'; instanceId: string; defId: string }
  | { type: 'ZonePlaced'; zoneId: string; coord: Coordinate }
  | { type: 'ZoneTriggered'; zoneId: string; coord: Coordinate }
  | { type: 'ZoneExpired'; zoneId: string; coord: Coordinate }
  | { type: 'DomainPlaced'; defId: string; tier: string }
  | { type: 'DomainCovered'; defId: string; tier: string }
  | { type: 'DomainExpired'; defId: string; tier: string }
  | { type: 'UnitTranslocated'; unitId: UnitId }
  | { type: 'UnitReturned'; unitId: UnitId }
  | { type: 'UnitSpawned'; unitId: UnitId }
  | { type: 'UnitDied'; unitId: UnitId }
