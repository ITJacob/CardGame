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
  /** 单位蓝本 id（unitDef.id；普通英雄为 null） */
  readonly unitDefId?: string | null
  readonly summonerId?: string | null
  statusStacks(defId: string): number
  /** 状态实例 grant.params 是否含指定键（recorded_has；H33 slots 存在性读法） */
  hasStatusParam(defId: string, key: string): boolean
  /** 是否持有装备槽实例（has_equipped）；slot 缺省 = 任意装备槽；id/tag 可选精确/标签过滤（weapon_is / weapon_tag） */
  hasEquipped(slot?: string, id?: string, tag?: string): boolean
  /** 持有状态 defId 列表（has_category 扫描用） */
  statusDefIds?(): readonly string[]
  stat(key: string): number
}

/** 触发点主体（执行参数 §2.3）：条件 side 的解析来源 */
export interface ConditionSubjects {
  target?: ConditionUnit | null
  attacker?: ConditionUnit | null
  killed?: ConditionUnit | null
  caster?: ConditionUnit | null
}

/** 触发事件载荷（伤害元素 / 来源类别 / 本次获得的状态） */
export interface ConditionEvent {
  element?: string
  source?: string
  statusId?: string
}

export interface ConditionContext {
  readonly random: RandomSource
  readonly registry: RandomUsageRegistry
  readonly warn: (msg: string) => void
  readonly phase: Phase
  readonly caster: ConditionUnit | null
  /** 触发器宿主（side:'self' 在触发语境 = 持有者，而不是施加者） */
  readonly host?: ConditionUnit | null
  readonly subjects?: ConditionSubjects
  readonly event?: ConditionEvent
  resolveUnit?: (id: string) => ConditionUnit | null
  /** 状态定义的类别（has_category 用） */
  defCategory?: (defId: string) => readonly string[] | undefined
  /** 全场单位（field_status_count / dead_count 用） */
  allUnits?: () => readonly ConditionUnit[]
  /** 池资源读数（resource_compare 用） */
  resourceOf?: (unit: ConditionUnit, key: string) => number
  /** 战场量表读数（meter_compare 用：secrecy / order / fate_value / luminance） */
  meterOf?: (key: string) => number
  /** 场上是否存在指定区域（zone_active；zoneId 为 zoneDef.id） */
  zoneActive?: (zoneId: string) => boolean
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

/**
 * 条件主体解析（共享内核参数 §三）：self = 触发器宿主（无宿主时回退施法者），
 * target = 事件受害方（无则当前效果目标），attacker = 攻击方，caster = 状态施加者。
 * 缺省（无 side / target 字段）= 当前效果目标。
 */
function subjectOf(
  side: string | undefined,
  target: ConditionUnit | null,
  ctx: ConditionContext,
): ConditionUnit | null {
  switch (side) {
    case 'self':
      return ctx.host ?? ctx.caster
    case 'target':
      return ctx.subjects?.target ?? target
    case 'attacker':
      return ctx.subjects?.attacker ?? null
    case 'caster':
      return ctx.subjects?.caster ?? ctx.caster
    case 'killed':
      return ctx.subjects?.killed ?? null
    case 'all':
    case 'both':
      return null
    default:
      return target
  }
}

function subjectSide(cond: Condition): string | undefined {
  return cond.side ?? (typeof cond.target === 'string' ? cond.target : undefined)
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
      const subject = subjectOf(cond.side, target, ctx)
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
        const subject = subjectOf(cond.side, target, ctx)
        return subject != null && subject.statusStacks(prefixOf(cond)) >= (cond.n ?? 1)
      }
    case 'target_dead':
      return target != null && target.isDead
    case 'target_unit_type': {
      const types = cond.unitTypes ?? (cond.type ? (Array.isArray(cond.type) ? cond.type : [cond.type]) : [])
      const subject = subjectOf(cond.side ?? 'target', target, ctx)
      return subject != null && subject.unitType != null && types.includes(subject.unitType)
    }
    case 'caster_has_summon': {
      const c = ctx.caster
      if (!c) return false
      const tag = cond.tag ? String(cond.tag) : undefined
      const ids = cond.unitId ? (Array.isArray(cond.unitId) ? cond.unitId : [cond.unitId]) : undefined
      return (ctx.allUnits?.() ?? []).some((u) =>
        u.summonerId === c.id
        && (!tag || u.tags.includes(tag))
        && (!ids || (u.unitDefId != null && ids.includes(u.unitDefId))))
    }
    case 'target_is_summoned':
      return target != null && target.summonerId != null
    case 'hp_percent': {
      const subject = subjectOf(subjectSide(cond) ?? 'target', target, ctx)
      if (!subject) return false
      const ratio = subject.hp / Math.max(1, subject.hpMax)
      const bound = cond.n ?? 0
      // n ≤ 1 视为比例（0.4 = 40%），否则视为百分数
      return compare(bound <= 1 ? ratio : ratio * 100, cond.cmp ?? '<=', bound)
    }
    case 'hp_percent_compare': {
      const a = subjectOf(cond.aSide ?? 'target', target, ctx)
      const b = subjectOf(cond.bSide ?? 'self', target, ctx)
      if (!a || !b) return false
      const ra = a.hp / Math.max(1, a.hpMax)
      const rb = b.hp / Math.max(1, b.hpMax)
      return compare(ra, cond.cmp ?? '<', rb)
    }
    case 'element_is': {
      const want = cond.element == null ? [] : Array.isArray(cond.element) ? cond.element : [cond.element]
      const actual = ctx.event?.element
      if (!actual) return true // 无事件载荷（非触发语境）时不拦截
      return want.includes(actual)
    }
    case 'damage_source_is': {
      const sources = cond.sources ?? []
      const actual = ctx.event?.source
      if (!actual) return true
      return sources.includes(actual)
    }
    case 'phase_is':
      return (cond.phases ?? []).includes(ctx.phase)
    case 'caster_status_exists':
      return ctx.caster != null && ctx.caster.statusStacks(prefixOf(cond)) > 0
    case 'recorded_has': {
      const subject = subjectOf(cond.side, target, ctx)
      // 本谓词 id 是数据槽键、statusId 才是状态——不能用 prefixOf（它优先取 id）
      return subject != null && subject.hasStatusParam(String(cond.statusId ?? ''), String(cond.id ?? ''))
    }
    case 'has_category': {
      const cats = cond.categories ?? (cond.category ? [cond.category] : [])
      const subject = subjectOf(cond.side, target, ctx)
      if (!subject) return false
      const ids = cond.id ? (Array.isArray(cond.id) ? cond.id : [cond.id]) : undefined
      if (ids) return ids.some((id) => (ctx.defCategory?.(id) ?? []).some((c) => cats.includes(c)))
      // 无 id：判定指定方当前持有的状态类别（has_category side:self/attacker）
      const held = subject.statusDefIds?.() ?? []
      return held.some((id) => (ctx.defCategory?.(id) ?? []).some((c) => cats.includes(c)))
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
      const key = String(cond.key ?? 'hp')
      if (cond.aggregate === 'sum' && (cond.side === 'all' || cond.side === 'both')) {
        const total = (ctx.allUnits?.() ?? [])
          .filter((u) => !u.isDead)
          .reduce((sum, u) => sum + (ctx.resourceOf?.(u, key) ?? 0), 0)
        return compare(total, cond.cmp ?? '>=', cond.n ?? 0)
      }
      const subject = subjectOf(cond.side, target, ctx)
      if (!subject) return false
      return compare(ctx.resourceOf?.(subject, key) ?? 0, cond.cmp ?? '>=', cond.n ?? 0)
    }
    case 'meter_compare': {
      return compare(ctx.meterOf?.(String(cond.key ?? '')) ?? 0, cond.cmp ?? '>=', cond.n ?? 0)
    }
    case 'zone_active':
      return ctx.zoneActive?.(String(cond.zoneId ?? '')) ?? false
    case 'faction_is': {
      const subject = subjectOf(cond.side, target, ctx)
      const ref = ctx.host ?? ctx.caster
      if (!subject || !ref) return false
      const want = String(cond.value ?? cond.faction ?? '')
      if (want === 'enemy') return subject.faction !== ref.faction
      if (want === 'ally') return subject.faction === ref.faction
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
