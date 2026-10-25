// 战场上下文：空间与结构（战场上下文.md / 战场参数.md）。
// Placement 是唯一的占位出口；占用恒为「前缀无空洞」。

import type { FactionId, LaneId, Phase, UnitId } from '../ids'
import type { DomainDef, ZoneDef } from '../catalog/types'
import type { EffectRef } from '../shared/types'

// ---------- 常量（战场参数 §二 / 调度参数 §二） ----------
export const LANE_CAPACITY = 4
export const LANE_COUNT = 2
export const FACTION_COUNT = 2
export const TICK_PER_DAY = 72
/** 每施法者召唤位上限基数（编队参数 §1.1b：全局 3；状态/账本可加/覆写） */
export const SUMMON_CAP_BASE = 3
export const TICK_MINUTES = 20
export const GAUGE_THRESHOLD = 75

/** 坐标三元组：全局唯一、不可变、可作字典键（战场上下文 §二） */
export interface Coordinate {
  faction: FactionId
  lane: LaneId
  /** [0,3]；0 恒为对峙前线，向队尾递增 */
  index: number
}

export interface Slot {
  occupant: UnitId | null
}

export interface Lane {
  id: LaneId
  /** 定长 LANE_CAPACITY */
  slots: Slot[]
}

export interface Faction {
  id: FactionId
  lanes: Map<LaneId, Lane>
}

export interface LumOverride {
  value: number
  duration: number
  sourceId: string
}

/** 战场根结构 */
export interface Battle {
  factions: Faction[]
  zones: Zone[]
  domains: DomainInstance[]
  /** int[0,71]，唯一可写源，每 tick +1 环绕 */
  clock: number
  /** int[0,10]，只读派生自 clock（不双写，INV-C2） */
  luminance: number
  phase: Phase
  lumOverride: LumOverride | null
  /** 战场级量表：secrecy / order / fate_value */
  meters: Record<string, number>
}

export type BattlePhase = 'Created' | 'Ready' | 'Running' | 'Finished'

// ---------- Zone 三层（战场参数 §1.1） ----------
export interface ZoneGrant {
  trigger?: 'on_enter' | 'on_exit' | 'on_occupy_tick'
  affects: 'enemy_of_owner' | 'ally_of_owner' | 'any'
  effects: EffectRef[]
  uses?: number
  /** 剩余 tick；-1/缺省 = 常驻 */
  duration?: number
  sourceId: string
  triggerOnExisting?: boolean
  /** 区域所有者阵营（affects 的相对基准） */
  ownerFaction?: FactionId
}

export interface Zone {
  def: ZoneDef
  grant: ZoneGrant
  coord: Coordinate
  status: 'Created' | 'Active' | 'Expired' | 'Removed'
}

// ---------- Domain 三层（战场参数 §1.2） ----------
export type DomainTier = 'base' | 'hero' | 'overlay'

export interface DomainGrant {
  /** 正整数 tick 或 -1（常驻） */
  duration: number
  /** 界域所有者阵营（触发器 filter.side 的相对基准） */
  ownerFaction?: FactionId
  /** 施放者 unitId（宿主存活时优先作触发器 host） */
  casterId?: string
  /** 压制栈排序键，后打出压顶 */
  priority: number
  sourceId: string
  params?: Record<string, unknown>
}

export interface DomainInstance {
  def: DomainDef
  /** 实例层籍：swap 会改层籍而不改 Def；压制栈与驱散按这里判定 */
  tier: DomainTier
  grant: DomainGrant
}

// ---------- Placement：唯一占位出口（战场上下文 §三、四） ----------
export interface OccupancyChanged {
  enter: { unitId: UnitId; coord: Coordinate }[]
  exit: { unitId: UnitId; coord: Coordinate }[]
}

export type OccupancyResult =
  | { ok: true; next: Battle }
  | { ok: false; snapshot: Battle; reason: string }

export interface Placement {
  insert(unit: UnitId, coord: Coordinate): OccupancyResult
  remove(unitId: UnitId): OccupancyResult
  swap(a: Coordinate, b: Coordinate): OccupancyResult
  /** 前置：目标 lane 未满 且 to.faction === from.faction（禁跨中线） */
  relocate(unit: UnitId, to: Coordinate): OccupancyResult
  applyExternal(mutator: (b: Battle) => Battle): OccupancyResult
}

/** 坐标查询（战场上下文 §二、八） */
export interface CoordinateQuery {
  coordOf(unitId: UnitId): Coordinate
  occupantAt(coord: Coordinate): UnitId | null
  isFull(laneId: LaneId): boolean
}
