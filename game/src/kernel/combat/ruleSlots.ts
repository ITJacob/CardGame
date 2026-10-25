// 规则槽 Rules[3]（源质维度 §三）：共享棋盘，每槽每个 field 至多一条。
// write 按 field 覆盖；modify 支持 replace / append / remove；豁免跨槽全局生效。
import type { EffectNode } from '../catalog/types'
import type { FactionId } from '../ids'

export type RuleField = 'trigger' | 'punish' | 'exemptions' | 'scope'
export type RuleSlotMode = 'write' | 'replace' | 'append' | 'remove' | 'expire'

export interface RuleSlotEntry {
  field: RuleField
  value: unknown
  ownerFaction?: FactionId
  casterId?: string
  /** trigger.scope = oath_holder 时绑定的单位 */
  scopeUnitId?: string
  expiresAtTick?: number
  chargesRemaining?: number
  sourceId: string
}

export interface RuleSlotMeta {
  ownerFaction?: FactionId
  casterId?: string
  scopeUnitId?: string
  expiresAtTick?: number
  chargesRemaining?: number
  sourceId: string
}

export interface RuleSlotChange {
  slot: number
  field: RuleField
  mode: RuleSlotMode
}

export interface RuleTriggerValue {
  rule?: string
  trigger?: string
  scope?: string
  condition?: string
  duration?: number
  durationUnit?: 'turn' | 'tick'
  charges?: number
}

export type RuleSlotState = RuleSlotEntry[][]

export function createRuleSlots(): RuleSlotState {
  return [[], [], []]
}

export function findRule(state: RuleSlotState, slot: number, field: RuleField): RuleSlotEntry | undefined {
  return state[slot]?.find((e) => e.field === field)
}

export function listOf(v: unknown): unknown[] {
  if (v === undefined || v === null) return []
  return Array.isArray(v) ? v : [v]
}

function entryOf(field: RuleField, value: unknown, meta: RuleSlotMeta): RuleSlotEntry {
  return {
    field,
    value,
    ownerFaction: meta.ownerFaction,
    casterId: meta.casterId,
    scopeUnitId: meta.scopeUnitId,
    expiresAtTick: meta.expiresAtTick,
    chargesRemaining: meta.chargesRemaining,
    sourceId: meta.sourceId,
  }
}

export function writeRule(
  state: RuleSlotState,
  slot: number,
  field: RuleField,
  value: unknown,
  overwrite: boolean,
  meta: RuleSlotMeta,
): RuleSlotChange | null {
  const list = state[slot]
  if (!list) return null
  const idx = list.findIndex((e) => e.field === field)
  if (idx >= 0 && !overwrite) return null
  if (idx >= 0) {
    list[idx] = entryOf(field, value, meta)
    return { slot, field, mode: 'replace' }
  }
  list.push(entryOf(field, value, meta))
  return { slot, field, mode: 'write' }
}

export function modifyRule(
  state: RuleSlotState,
  slot: number,
  field: RuleField,
  mode: 'replace' | 'append' | 'remove',
  value: unknown,
  meta: RuleSlotMeta,
): RuleSlotChange | null {
  const list = state[slot]
  if (!list) return null
  const idx = list.findIndex((e) => e.field === field)
  if (mode === 'remove') {
    if (idx < 0) return null
    list.splice(idx, 1)
    return { slot, field, mode: 'remove' }
  }
  if (mode === 'replace') {
    if (idx >= 0) list[idx] = entryOf(field, value, meta)
    else list.push(entryOf(field, value, meta))
    return { slot, field, mode: 'replace' }
  }
  if (idx >= 0) {
    list[idx]!.value = mergeValues(field, list[idx]!.value, value)
  } else {
    list.push(entryOf(field, value, meta))
  }
  return { slot, field, mode: 'append' }
}

function mergeValues(field: RuleField, existing: unknown, incoming: unknown): unknown {
  if (field === 'punish') return [...listOf(existing), ...listOf(incoming)]
  if (Array.isArray(existing) || Array.isArray(incoming)) return [...listOf(existing), ...listOf(incoming)]
  return [existing, incoming]
}

export function isExpired(entry: RuleSlotEntry, tick: number): boolean {
  return entry.expiresAtTick !== undefined && tick >= entry.expiresAtTick
}

export function expireRules(state: RuleSlotState, tick: number): RuleSlotChange[] {
  const changes: RuleSlotChange[] = []
  for (let slot = 0; slot < state.length; slot += 1) {
    const list = state[slot]!
    for (let i = list.length - 1; i >= 0; i -= 1) {
      const entry = list[i]!
      if (!isExpired(entry, tick)) continue
      list.splice(i, 1)
      changes.push({ slot, field: entry.field, mode: 'expire' })
    }
  }
  return changes
}

export function punishNodes(entry: RuleSlotEntry | undefined): EffectNode[] {
  return listOf(entry?.value) as EffectNode[]
}

export function triggerValue(entry: RuleSlotEntry): RuleTriggerValue {
  return (entry.value ?? {}) as RuleTriggerValue
}

/** 跨槽全局豁免：任一槽的 exemptions 命中该阵营即生效 */
export function isExempt(state: RuleSlotState, faction: FactionId): boolean {
  for (const slot of state) {
    for (const entry of slot) {
      if (entry.field !== 'exemptions') continue
      for (const item of listOf(entry.value)) {
        const side = (item as { side?: string }).side
        if (side === 'all' || side === 'both') return true
        if ((side === 'self' || side === 'ally') && entry.ownerFaction === faction) return true
        if (side === 'enemy' && entry.ownerFaction !== undefined && entry.ownerFaction !== faction) return true
      }
    }
  }
  return false
}

/** no_skill / no_attack 且同槽无 punish → 禁令；带 punish 的规则只罚不禁 */
export function prohibits(
  state: RuleSlotState,
  faction: FactionId,
  kind: 'skill' | 'basic_attack',
  tick: number,
): boolean {
  const wanted = kind === 'skill' ? 'no_skill' : 'no_attack'
  for (let slot = 0; slot < state.length; slot += 1) {
    const trigger = findRule(state, slot, 'trigger')
    if (!trigger || isExpired(trigger, tick)) continue
    if (triggerValue(trigger).rule !== wanted) continue
    if (isExempt(state, faction)) continue
    if (punishNodes(findRule(state, slot, 'punish')).length > 0) continue
    return true
  }
  return false
}
