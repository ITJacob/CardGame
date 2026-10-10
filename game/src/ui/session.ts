// 当前对局会话：把内核门面 + 名册元数据挂在模块级，供各视图共享。
import type { FactionId } from '../kernel/ids'
import type { Catalog } from '../kernel/catalog/types'
import type { CombatSetup } from '../kernel/combat/types'
import type { CombatRuntimeHandle } from '../kernel/combat/runtime'
import type { PlacedHero } from '../meta/formation'
import type { MatchChannel, MatchRunner } from '../meta/match'

export interface UnitMeta {
  name: string
  side: 'own' | 'enemy'
  constitutionId: string
  classId: string
  gender: 'male' | 'female'
}

/** 联机对局附加态（离线人机为 undefined） */
export interface OnlineSession {
  channel: MatchChannel
  /** 本侧阵营：host = 'A'，guest = 'B'（见 buildOnlineSetup §3.2） */
  myFaction: FactionId
  /** 由 battle 视图按需创建并接管（同一次会话只建一次） */
  runner?: MatchRunner
  /** 结束后的指纹比对结果 */
  verify?: { mine: string; theirs: string | null; ok: boolean }
}

export interface BattleSession {
  catalog: Catalog
  facade: CombatRuntimeHandle
  setup: CombatSetup
  own: PlacedHero[]
  enemy: PlacedHero[]
  unitMeta: Map<string, UnitMeta>
  /** 是否已把本局写入战绩（避免重渲染重复落库） */
  recorded?: boolean
  /** 本侧阵营（缺省 = setup.factions[0]）；联机时 guest 为 'B' */
  myFaction?: FactionId
  online?: OnlineSession
}

let current: BattleSession | null = null

export function setSession(s: BattleSession): void {
  current = s
}

export function getSession(): BattleSession | null {
  return current
}

export function clearSession(): void {
  current = null
}

export function unitMetaOf(session: BattleSession, unitId: string): UnitMeta | undefined {
  return session.unitMeta.get(unitId)
}
