// 目标解析（执行上下文 §四 I 节点）。
// P2a 几何：faction → 同路（缺省）→ 排序 → ResolvedTarget。scope/anchor 为子集。
import type { FactionId } from '../ids'
import type { Coordinate } from '../battle/types'
import type { ResolvedTarget } from './types'
import type { SortKey, TargetRequest } from '../shared/types'
import type { Registry } from '../roster/registry'
import type { CombatUnit } from '../roster/unit'

export interface TargetContext {
  units: Registry
  self: CombatUnit
  enemyFaction: FactionId
}

function laneOf(u: CombatUnit): string | null {
  return u.position?.lane ?? null
}

function indexOf(u: CombatUnit): number {
  return u.position?.index ?? Number.MAX_SAFE_INTEGER
}

function sortCandidates(list: CombatUnit[], sort: SortKey): CombatUnit[] {
  const out = [...list]
  const cmp = (a: CombatUnit, b: CombatUnit): number => {
    switch (sort) {
      case 'index_desc':
        return indexOf(b) - indexOf(a) || tie(a, b)
      case 'hp_asc':
        return a.hp - b.hp || indexOf(a) - indexOf(b) || tie(a, b)
      case 'hp_desc':
        return b.hp - a.hp || indexOf(a) - indexOf(b) || tie(a, b)
      case 'none':
        return tie(a, b)
      default:
        return indexOf(a) - indexOf(b) || tie(a, b)
    }
  }
  return out.sort(cmp)
}

function tie(a: CombatUnit, b: CombatUnit): number {
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0
}

/** 同路过滤是否生效：普攻等缺省锚点 = 敌方同路最前排 */
function wantsSameLane(request: TargetRequest): boolean {
  if (!request.anchor) return true
  return request.anchor === 'enemy_front' || request.anchor === 'ally_front' || request.anchor === 'caster'
}

export function resolveCandidates(request: TargetRequest, ctx: TargetContext): ResolvedTarget[] {
  const self = ctx.self
  let pool: CombatUnit[]
  switch (request.faction) {
    case 'self':
      pool = [self]
      break
    case 'enemy':
      pool = ctx.units.aliveIn(ctx.enemyFaction)
      break
    case 'ally':
    case 'self_or_ally':
      pool = ctx.units.aliveIn(self.faction)
      break
    case 'none':
      pool = []
      break
    default:
      pool = [...ctx.units.aliveIn(self.faction), ...ctx.units.aliveIn(ctx.enemyFaction)]
  }

  const sameLane = wantsSameLane(request)
  if (sameLane && self.position) {
    const lane = laneOf(self)
    const lanePool = pool.filter((u) => laneOf(u) === lane)
    // 本路无候选 → 回退全场（普攻缺省行为）
    if (lanePool.length > 0) pool = lanePool
  }

  pool = pool.filter((u) => !u.isDead && !u.detached && u.position != null)
  if (request.excludeSelf) pool = pool.filter((u) => u.id !== self.id)
  pool = sortCandidates(pool, request.sort ?? 'index_asc')

  return pool.map((u) => toResolved(u))
}

export function toResolved(u: CombatUnit): ResolvedTarget {
  const coord: Coordinate = u.position ?? { faction: u.faction, lane: '', index: 0 }
  return { coord, occupant: u.id }
}
