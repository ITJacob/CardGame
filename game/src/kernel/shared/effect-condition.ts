// 效果生效条件的判定（共享内核 §四）。P2a 只实现高频子集，
// 未实现的 kind 记 warning 并返回真（保持可跑，不静默错误）。
// chance 是唯一抽样点（R3 登记 + R4 单次抽样）。

import type { Phase } from '../ids'
import type { Cmp, Condition } from './types'
import type { RandomSource, RandomUsageRegistry } from './random-source'

export interface ConditionUnit {
  readonly id: string
  readonly faction: string
  readonly hp: number
  readonly hpMax: number
  readonly tags: readonly string[]
  readonly isDead: boolean
  statusStacks(defId: string): number
  stat(key: string): number
}

export interface ConditionContext {
  readonly random: RandomSource
  readonly registry: RandomUsageRegistry
  readonly warn: (msg: string) => void
  readonly phase: Phase
  readonly caster: ConditionUnit | null
  resolveUnit?: (id: string) => ConditionUnit | null
  /** 状态定义的类别（has_category / status_category 用） */
  defCategory?: (defId: string) => readonly string[] | undefined
  /** 全场单位（field_status_count / dead_count 用） */
  allUnits?: () => readonly ConditionUnit[]
  /** 池资源读数（resource_compare 用） */
  resourceOf?: (unit: ConditionUnit, key: string) => number
}

function compare(actual: number, cmp: Cmp, bound: number): boolean {
  switch (cmp) {
    case '>': return actual > bound
    case '>=': return actual >= bound
    case '<': return actual < bound
    case '<=': return actual <= bound
    default: return actual === bound
  }
}

function prefixOf(cond: Condition): string {
  const id = cond.id ?? cond.statusId
  return Array.isArray(id) ? String(id[0] ?? '') : String(id ?? '')
}

export function evaluateCondition(cond: Condition, target: ConditionUnit | null, ctx: ConditionContext): boolean {
  switch (cond.kind) {
    case 'any_of':
      return (cond.conditions ?? []).some((c) => evaluateCondition(c, target, ctx))
    case 'chance': {
      const p = cond.p ?? 0
      ctx.registry.record('chance', { p })
      return ctx.random.chance(p)
    }
    case 'has_status':
    case 'target_has_tag':
      if (cond.kind === 'target_has_tag') {
        return target != null && target.tags.includes(String(cond.tag ?? ''))
      }
      return target != null && target.statusStacks(prefixOf(cond)) >= (cond.n ?? 1)
    case 'target_dead':
      return target != null && target.isDead
    case 'hp_percent':
      return target != null && compare((target.hp / Math.max(1, target.hpMax)) * 100, cond.cmp ?? '<=', cond.n ?? 0)
    case 'phase_is':
      return (cond.phases ?? []).includes(ctx.phase)
    case 'caster_status_exists':
      return ctx.caster != null && ctx.caster.statusStacks(prefixOf(cond)) > 0
    case 'has_category':
    case 'status_category': {
      const cats = cond.categories ?? (cond.category ? [cond.category] : [])
      const subject = cond.side === 'self' ? ctx.caster : target
      if (!subject) return false
      const ids = cond.id ? (Array.isArray(cond.id) ? cond.id : [cond.id]) : undefined
      return ids
        ? ids.some((id) => (ctx.defCategory?.(id) ?? []).some((c) => cats.includes(c)))
        : cats.length === 0
    }
    case 'field_status_count': {
      const id = prefixOf(cond)
      const count = (ctx.allUnits?.() ?? []).filter((u) => u.statusStacks(id) > 0).length
      return compare(count, cond.cmp ?? '>=', cond.n ?? 1)
    }
    case 'dead_count': {
      const dead = (ctx.allUnits?.() ?? []).filter((u) => u.isDead).length
      return compare(dead, cond.cmp ?? '>=', cond.n ?? 1)
    }
    case 'resource_compare': {
      const subject = cond.side === 'self' ? ctx.caster : target
      if (!subject) return false
      return compare(ctx.resourceOf?.(subject, String(cond.key ?? 'hp')) ?? 0, cond.cmp ?? '>=', cond.n ?? 0)
    }
    case 'target_faction_is':
    case 'unit_faction':
      return target != null && target.faction === String(cond.faction ?? cond.value ?? '')
    case 'stat_compare':
    case 'rank_gap': {
      const a = ctx.resolveUnit?.(String(cond.aUnit ?? ''))
      const b = ctx.resolveUnit?.(String(cond.bUnit ?? ''))
      if (!a || !b) {
        ctx.warn(`条件 ${cond.kind} 无法解析单位（aUnit=${cond.aUnit} bUnit=${cond.bUnit}）`)
        return false
      }
      const key = cond.kind === 'rank_gap' ? 'rank' : String(cond.key ?? '')
      return compare(a.stat(key) - b.stat(key), cond.cmp ?? '>', cond.n ?? 0)
    }
    default:
      ctx.warn(`未实现条件 kind=${cond.kind}（P2a 视为真）`)
      return true
  }
}
