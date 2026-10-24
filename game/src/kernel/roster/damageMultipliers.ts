// H4 过滤/动态/条件伤害乘区（编队参数 §1.1b）：damage_mul / damage_taken_mul / ally_damage_mul
// 的事件级求值。数值仍走「同类取最优」：增益取最大、减益取最小，两者再相乘一次。
// filter 的求值主体按方向分：
//   damage_mul（持有者出伤）  opponent = 受击方
//   damage_taken_mul（持有者承伤）opponent = 来源方
//   ally_damage_mul（友军出伤光环）按出伤方阵营收集，filter 仍按 damage_mul 的对手方求值
// 受击方专用的键（unitType / gender / targetHpPercent / targetConcealed）恒看 event.defender；
// tags / hasStatus / hasCategory / statCompare / faction / gaugeAbove / isSummon 看 opponent。
import type { Element, StatKey } from '../ids'
import type { CombatUnit } from './unit'
import type { StatusInstance, StatusGrant } from './types'
import type { StatusDefLookup } from './status'
import type { ModifierSet } from '../catalog/types'

export interface DamageMulEvent {
  readonly element: Element
  readonly attacker: CombatUnit | null
  readonly defender: CombatUnit
  /** 按 id 查单位：承伤光环（filter.casterOwned）需要取受击方的召唤者 */
  readonly unitById?: (id: string) => CombatUnit | undefined
  /** 全场单位：友军出伤光环 / alive_allies / field_status_count 需要 */
  readonly allUnits?: () => readonly CombatUnit[]
  /** 当前战场相位：phase_is 条件需要 */
  readonly phase?: string
}

type MulKey = 'damage_mul' | 'damage_taken_mul' | 'ally_damage_mul'

interface MulEntry {
  value?: number
  dynamic?: unknown
  valueFromParams?: string
  filter?: Record<string, unknown>
  condition?: Record<string, unknown>
}

/**
 * 某个持有者的某类常驻乘区；event 缺省时 filter/condition 不生效（保留旧的无条件语义，供测试/兼容）。
 * auraSource：承伤光环的施予者（受击方的召唤者）。只取带 filter.casterOwned 的条目，
 * 与自身条目一起走「同类取最优」，不额外叠乘。
 * allies：友军出伤光环的收集范围（damage_mul 专用）。
 */
export function statusDamageMul(
  holder: CombatUnit,
  key: 'damage_mul' | 'damage_taken_mul',
  event: DamageMulEvent | undefined,
  lookup: StatusDefLookup,
  auraSource?: CombatUnit,
  allies?: readonly CombatUnit[],
): number {
  let gain = 1
  let loss = 1
  const collect = (unit: CombatUnit, entryKey: MulKey, filterKey: 'damage_mul' | 'damage_taken_mul', auraOnly: boolean): void => {
    for (const inst of unit.statuses.all()) {
      const def = lookup.statusDef(inst.defId)
      for (const entry of entriesOf(def?.modifiers, entryKey)) {
        if (auraOnly && entry.filter?.casterOwned !== true) continue
        if (event && entry.condition && !matchesCondition(entry.condition, unit, inst, event)) continue
        if (event && entry.filter && !matchesFilter(entry.filter, filterKey, unit, inst, event)) continue
        const value = entryValue(entry, unit, inst, lookup)
        if (value === null) continue
        const eff = entry.dynamic !== undefined || entry.valueFromParams !== undefined
          ? value
          : 1 + (value - 1) * inst.currentStacks
        if (eff >= 1) gain = Math.max(gain, eff)
        else loss = Math.min(loss, eff)
      }
    }
  }
  collect(holder, key, key, false)
  if (auraSource && auraSource !== holder) collect(auraSource, key, key, true)
  if (key === 'damage_mul' && allies) {
    for (const ally of allies) {
      if (ally.isDead || ally.detached || ally.faction !== holder.faction) continue
      collect(ally, 'ally_damage_mul', 'damage_mul', false)
    }
  }
  return gain * loss
}

function entriesOf(modifiers: ModifierSet | undefined, key: MulKey): MulEntry[] {
  const out: MulEntry[] = []
  const push = (raw: unknown): void => {
    if (typeof raw === 'number' && Number.isFinite(raw)) {
      out.push({ value: raw })
      return
    }
    if (!raw || typeof raw !== 'object') return
    const o = raw as Record<string, unknown>
    if (typeof o.kind === 'string' && o.kind !== key) return
    const value = firstNumber(o.value, o.mul, o.ratio)
    const dynamic = o.dynamic
    const valueFromParams = typeof o.valueFromParams === 'string' ? o.valueFromParams : undefined
    if (value === null && dynamic === undefined && !valueFromParams) return
    // perStackOf 的 filter 是「事件过滤」；perCount 的 filter 是「计哪些状态」，不能当事件过滤
    const dynObj = dynamic && typeof dynamic === 'object' ? dynamic as Record<string, unknown> : null
    const filter = o.filter && typeof o.filter === 'object'
      ? o.filter as Record<string, unknown>
      : dynObj?.perStackOf && dynObj.filter && typeof dynObj.filter === 'object'
        ? dynObj.filter as Record<string, unknown>
        : undefined
    out.push({
      value: value ?? undefined,
      dynamic,
      valueFromParams,
      filter,
      condition: o.condition && typeof o.condition === 'object' ? o.condition as Record<string, unknown> : undefined,
    })
  }
  if (Array.isArray(modifiers)) {
    for (const raw of modifiers) push(raw)
  } else if (modifiers && typeof modifiers === 'object') {
    const raw = (modifiers as Record<string, unknown>)[key]
    if (Array.isArray(raw)) for (const x of raw) push(x)
    else push(raw)
  }
  return out
}

function firstNumber(...vals: unknown[]): number | null {
  for (const v of vals) if (typeof v === 'number' && Number.isFinite(v)) return v
  return null
}

/** 取本条乘区的数值；动态与 valueFromParams 直接给出最终乘数（不再按层数缩放） */
function entryValue(
  entry: MulEntry,
  unit: CombatUnit,
  inst: StatusInstance,
  lookup: StatusDefLookup,
): number | null {
  if (entry.valueFromParams) {
    const v = inst.grant.params?.[entry.valueFromParams]
    return typeof v === 'number' && Number.isFinite(v) ? v : null
  }
  if (entry.dynamic !== undefined) return dynamicValue(entry.dynamic, unit, inst, lookup)
  return entry.value ?? null
}

function dynamicValue(
  dyn: unknown,
  unit: CombatUnit,
  inst: StatusInstance,
  lookup: StatusDefLookup,
): number | null {
  if (typeof dyn === 'string') {
    const s = dyn.replace(/×/g, '*').replace(/\s+/g, '')
    const own = /^1\+([\d.]+)\*(?:stacks|层数)$/.exec(s)
    if (own) return 1 + Number(own[1]) * inst.currentStacks
    const capped = /^1\+([\d.]+)\*min\(([A-Za-z_][\w]*)\.stacks,(\d+)\)$/.exec(s)
    if (capped) return 1 + Number(capped[1]) * Math.min(unit.statusStacks(capped[2]!), Number(capped[3]))
    return null
  }
  if (!dyn || typeof dyn !== 'object') return null
  const o = dyn as Record<string, unknown>
  if (o.perCount && typeof o.perCount === 'object') {
    const p = o.perCount as { value?: unknown; cap?: unknown; filter?: Record<string, unknown> }
    const step = typeof p.value === 'number' ? p.value : 0
    const count = countStatuses(unit, p.filter, lookup)
    const bonus = count * step
    return 1 + (typeof p.cap === 'number' ? Math.min(bonus, p.cap) : bonus)
  }
  if (typeof o.perStackOf === 'string') {
    const step = typeof o.value === 'number' ? o.value : 0
    return 1 + step * unit.statusStacks(o.perStackOf)
  }
  return null
}

function countStatuses(unit: CombatUnit, filter: Record<string, unknown> | undefined, lookup: StatusDefLookup): number {
  if (!filter) return unit.statuses.all().length
  let n = 0
  for (const inst of unit.statuses.all()) {
    const cats = lookup.statusDef(inst.defId)?.category ?? []
    const wantCats = listOf(filter.hasCategory).filter((x): x is string => typeof x === 'string')
    if (wantCats.length && !wantCats.some((c) => cats.includes(c))) continue
    const wantIds = listOf(filter.hasStatus).filter((x): x is string => typeof x === 'string')
    if (wantIds.length && !wantIds.includes(inst.defId)) continue
    n += 1
  }
  return n
}

function matchesCondition(
  cond: Record<string, unknown>,
  holder: CombatUnit,
  _inst: StatusInstance,
  event: DamageMulEvent,
): boolean {
  if (cond.metric !== undefined) {
    if (cond.metric === 'alive_allies') {
      const n = aliveAllies(holder, event)
      if (!compare(n, String(cond.cmp ?? '>='), Number(cond.value ?? 0))) return false
    }
    return true
  }
  const kind = typeof cond.kind === 'string' ? cond.kind : ''
  switch (kind) {
    case 'caster_status_exists':
      return typeof cond.id === 'string' && holder.statusStacks(cond.id) > 0
    case 'phase_is': {
      const phases = listOf(cond.phases).filter((x): x is string => typeof x === 'string')
      return !!event.phase && phases.includes(event.phase)
    }
    case 'field_status_count': {
      const id = String(cond.id ?? '')
      const units = event.allUnits?.() ?? []
      const n = id.endsWith('_alive')
        ? units.filter((u) => !u.isDead && u.unitDefId === id.slice(0, -'_alive'.length)).length
        : units.filter((u) => u.statusStacks(id) > 0).length
      return compare(n, String(cond.cmp ?? '>='), Number(cond.n ?? 1))
    }
    default:
      return true
  }
}

function aliveAllies(holder: CombatUnit, event: DamageMulEvent): number {
  return (event.allUnits?.() ?? []).filter((u) => !u.isDead && u.faction === holder.faction).length
}

function listOf(v: unknown): unknown[] {
  return Array.isArray(v) ? v : [v]
}

function matchesFilter(
  filter: Record<string, unknown>,
  key: 'damage_mul' | 'damage_taken_mul',
  holder: CombatUnit,
  inst: StatusInstance,
  event: DamageMulEvent,
): boolean {
  const taken = key === 'damage_taken_mul'
  const victim = event.defender
  const opponent = taken ? event.attacker : event.defender
  const grant = inst.grant as StatusGrant & { binding?: { recordedTarget?: string } }
  const casterId = grant.casterId

  if (filter.anyOf !== undefined) {
    const list = listOf(filter.anyOf).filter((x): x is Record<string, unknown> => !!x && typeof x === 'object')
    if (!list.some((f) => matchesFilter(f, key, holder, inst, event))) return false
  }
  if (filter.element !== undefined && !matchElement(filter.element, event.element, inst)) return false
  if (filter.tags !== undefined) {
    const tags = listOf(filter.tags).filter((t): t is string => typeof t === 'string')
    if (!opponent || !tags.some((t) => opponent.tags.includes(t))) return false
  }
  if (filter.unitType !== undefined) {
    const types = listOf(filter.unitType).filter((t): t is string => typeof t === 'string')
    if (!victim.unitType || !types.includes(victim.unitType)) return false
  }
  if (filter.targetUnitType !== undefined) {
    const types = listOf(filter.targetUnitType).filter((t): t is string => typeof t === 'string')
    if (!victim.unitType || !types.includes(victim.unitType)) return false
  }
  if (filter.sourceUnitType !== undefined) {
    const types = listOf(filter.sourceUnitType).filter((t): t is string => typeof t === 'string')
    if (!event.attacker?.unitType || !types.includes(event.attacker.unitType)) return false
  }
  if (filter.hasStatus !== undefined && !hasAnyStatus(opponent, filter.hasStatus)) return false
  if (filter.targetHasStatus !== undefined && !hasAnyStatus(opponent, filter.targetHasStatus)) return false
  if (filter.hasAnyStatus !== undefined) {
    const any = (opponent?.statuses.all().length ?? 0) > 0
    if (any !== Boolean(filter.hasAnyStatus)) return false
  }
  if (filter.hasCategory !== undefined && !hasAnyCategory(opponent, filter.hasCategory)) return false
  if (filter.targetHasCategory !== undefined && !hasAnyCategory(opponent, filter.targetHasCategory)) return false
  if (filter.statCompare !== undefined) {
    const spec = filter.statCompare as { key?: string; cmp?: string }
    if (!spec?.key || !opponent) return false
    const stat = spec.key as StatKey
    if (!compare(opponent.stat(stat), spec.cmp, holder.stat(stat))) return false
  }
  if (filter.faction !== undefined) {
    const want = listOf(filter.faction).filter((f): f is string => typeof f === 'string')
    if (!opponent) return false
    const same = opponent.faction === holder.faction
    if (!want.some((f) => (f === 'enemy' ? !same : f === 'ally' ? same : true))) return false
  }
  if (filter.gender !== undefined) {
    const g = taken ? holder.gender : victim.gender
    if (filter.gender !== 'any' && filter.gender !== g) return false
  }
  if (filter.gaugeAbove !== undefined) {
    const pct = opponent ? (opponent.gauge.current / Math.max(1, opponent.gauge.threshold)) * 100 : 0
    if (!(pct >= Number(filter.gaugeAbove))) return false
  }
  if (filter.targetHpPercentLe !== undefined) {
    if (!(victim.hp / Math.max(1, victim.hpMax) * 100 <= Number(filter.targetHpPercentLe))) return false
  }
  if (filter.targetHpPercentBelow !== undefined) {
    if (!(victim.hp / Math.max(1, victim.hpMax) * 100 < Number(filter.targetHpPercentBelow))) return false
  }
  if (filter.targetConcealed !== undefined) {
    if (victim.hasStatusCategory('conceal') !== Boolean(filter.targetConcealed)) return false
  }
  if (filter.isSummon !== undefined) {
    if ((opponent?.summonerId != null) !== Boolean(filter.isSummon)) return false
  }
  if (filter.caster !== undefined) {
    const want = filter.caster === 'status_caster' ? casterId : String(filter.caster)
    if (!want || event.attacker?.id !== want) return false
  }
  if (filter.casterIsStatusSource !== undefined) {
    if ((event.attacker?.id === casterId) !== Boolean(filter.casterIsStatusSource)) return false
  }
  if (filter.casterOwned !== undefined) {
    const owned = taken ? victim.summonerId === casterId : opponent?.summonerId === casterId
    if (owned !== Boolean(filter.casterOwned)) return false
  }
  if (filter.recordedTargetOnly !== undefined) {
    const recorded = grant.binding?.recordedTarget
    if ((!!recorded && opponent?.id === recorded) !== Boolean(filter.recordedTargetOnly)) return false
  }
  if (filter.pathway !== undefined) {
    if (holder.pathwayId !== String(filter.pathway)) return false
  }
  return true
}

function matchElement(spec: unknown, element: Element, inst: StatusInstance): boolean {
  for (const raw of listOf(spec)) {
    if (typeof raw !== 'string') continue
    if (raw === '$variant.element') {
      const v = inst.grant.params?.variant ?? inst.grant.params?.element
      if (typeof v === 'string' && v === element) return true
      continue
    }
    if (raw === element) return true
  }
  return false
}

function hasAnyStatus(unit: CombatUnit | null, spec: unknown): boolean {
  if (!unit) return false
  const ids = listOf(spec).filter((x): x is string => typeof x === 'string')
  return ids.some((id) => unit.statusStacks(id) > 0)
}

function hasAnyCategory(unit: CombatUnit | null, spec: unknown): boolean {
  if (!unit) return false
  const cats = listOf(spec).filter((x): x is string => typeof x === 'string')
  return cats.some((c) => unit.hasStatusCategory(c))
}

function compare(actual: number, op: string | undefined, bound: number): boolean {
  switch (op) {
    case '>': return actual > bound
    case '>=': return actual >= bound
    case '<': return actual < bound
    case '<=': return actual <= bound
    default: return actual === bound
  }
}
