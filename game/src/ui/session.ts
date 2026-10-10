// 当前对局会话：把内核门面 + 名册元数据挂在模块级，供各视图共享。
import type { Catalog } from '../kernel/catalog/types'
import type { CombatSetup } from '../kernel/combat/types'
import type { CombatRuntimeHandle } from '../kernel/combat/runtime'
import type { PlacedHero } from '../meta/formation'

export interface UnitMeta {
  name: string
  side: 'own' | 'enemy'
  constitutionId: string
  classId: string
  gender: 'male' | 'female'
}

export interface BattleSession {
  catalog: Catalog
  facade: CombatRuntimeHandle
  setup: CombatSetup
  own: PlacedHero[]
  enemy: PlacedHero[]
  unitMeta: Map<string, UnitMeta>
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
