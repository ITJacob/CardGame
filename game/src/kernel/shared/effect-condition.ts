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
  readonly unitType?: string | null
  readonly summonerId?: string | null
  statusStacks(defId: string): number
  /** 状态实例 grant.params 是否含指定键（recorded_has；H33 slots 存在性读法） */
  hasStatusParam(defId: string, key: string): boolean
  /** 是否持有装备槽实例（has_equipped）；slot 缺省 = 任意装备槽；id/tag 可选精确/标签过滤（weapon_is / weapon_tag） */
  hasEquipped(slot?: string, id?: string, tag?: string): boolean
  stat(key: string): number
}

export interface ConditionContext {
  readonly random: RandomSource
  readonly registry: RandomUsageRegistry
  readonly warn: (msg: string) => void
  readonly phase: Phase
  readonly caster: ConditionUnit | null
  resolveUnit?: (id: string) => ConditionUnit | null
  /** 状态定义的类别（has_category 用） */
  defCategory?: (defId: string) => readonly string[] | undefined
  /** 全场单位（field_status_count / dead_count 用） */
  allUnits?: () => readonly ConditionUnit[]
  /** 池资源读数（resource_compare 用） */
  resourceOf?: (unit: ConditionUnit, key: string) => number
  /** 战场量表读数（meter_compare 用：secrecy / order / fate_value / luminance） */
  meterOf?: (key: string) => number
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
    case 'all_of':
      return (cond.conditions ?? []).every((c) => evaluateCondition(c, target, ctx))
    case 'not':
      return cond.condition ? !evaluateCondition(cond.condition, target, ctx) : true
    case 'chance': {
      const p = cond.p ?? 0
      ctx.registry.record('chance', { p })
      return ctx.random.chance(p)
    }
    case 'has_equipped': {
      const subject = cond.side === 'self' ? ctx.caster : target
      return subject != null && subject.hasEquipped(
        typeof cond.slot === 'string' ? cond.slot : undefined,
        typeof cond.id === 'string' ? cond.id : undefined,
        typeof cond.tag === 'string' ? cond.tag : undefined)
    }
    case 'has_status':
    case 'target_has_tag':
      if (cond.kind === 'target_has_tag') {
        return target != null && target.tags.includes(String(cond.tag ?? ''))
      }
      {
        const subject = cond.side === 'self' ? ctx.caster : target
        return subject != null && subject.statusStacks(prefixOf(cond)) >= (cond.n ?? 1)
      }
    case 'target_dead':
      return target != null && target.isDead
    case 'target_unit_type': {
      const types = cond.unitTypes ?? (cond.type ? (Array.isArray(cond.type) ? cond.type : [cond.type]) : [])
      return target != null && target.unitType != null && types.includes(target.unitType)
    }
    case 'caster_has_summon': {
      const c = ctx.caster
      if (!c) return false
      const tag = cond.tag ? String(cond.tag) : undefined
      return (ctx.allUnits?.() ?? []).some((u) => u.summonerId === c.id && (!tag || u.tags.includes(tag)))
    }
    case 'hp_percent':
      return target != null && compare((target.hp / Math.max(1, target.hpMax)) * 100, cond.cmp ?? '<=', cond.n ?? 0)
    case 'phase_is':
      return (cond.phases ?? []).includes(ctx.phase)
    case 'caster_status_exists':
      return ctx.caster != null && ctx.caster.statusStacks(prefixOf(cond)) > 0
    case 'recorded_has': {
      const subject = cond.side === 'self' ? ctx.caster : target
      // 本谓词 id 是数据槽键、statusId 才是状态——不能用 prefixOf（它优先取 id）
      return subject != null && subject.hasStatusParam(String(cond.statusId ?? ''), String(cond.id ?? ''))
    }
    case 'has_category': {
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
    case 'meter_compare': {
      return compare(ctx.meterOf?.(String(cond.key ?? '')) ?? 0, cond.cmp ?? '>=', cond.n ?? 0)
    }
    case 'faction_is': {
      const subject = cond.side === 'self' ? ctx.caster : target
      if (!subject || !ctx.caster) return false
      const want = String(cond.value ?? cond.faction ?? '')
      if (want === 'enemy') return subject.faction !== ctx.caster.faction
      if (want === 'ally') return subject.faction === ctx.caster.faction
      return subject.faction === want
    }
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
