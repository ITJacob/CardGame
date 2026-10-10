// P2b-2 界域与规则类原语处理：set_luminance / advance_clock / domain / snapshot /
// restore_snapshot / echo_last_skill / gauge_shuffle / status_shuffle / modify_skill /
// target_override / write_rule_slot / modify_rule_slot。
import type {
  EffAdvanceClock, EffDomain, EffEchoLastSkill, EffGaugeShuffle, EffModifySkill, EffModifyRuleSlot,
  EffRestoreSnapshot, EffSetLuminance, EffSnapshot, EffStatusShuffle, EffTargetOverride, EffWriteRuleSlot,
} from '../catalog/types'
import type { EffectContext } from './context'
import { numeric } from './context'
import type { CombatUnit } from '../roster/unit'

export function handleSetLuminance(node: EffSetLuminance, _t: CombatUnit | null, ctx: EffectContext): void {
  ctx.ops.setLuminance(
    typeof node.value === 'number' ? node.value : null,
    typeof node.delta === 'number' ? node.delta : null,
    node.duration ?? null,
    node.dispelable ?? true,
  )
}

export function handleAdvanceClock(node: EffAdvanceClock, _t: CombatUnit | null, ctx: EffectContext): void {
  ctx.ops.advanceClock(numeric(node.ticks, 1))
}

export function handleDomain(node: EffDomain, _t: CombatUnit | null, ctx: EffectContext): void {
  ctx.ops.applyDomain(node.op, node.def, node.duration ?? -1, ctx.caster)
}

export function handleSnapshot(node: EffSnapshot, target: CombatUnit | null, ctx: EffectContext): void {
  if (!target) return
  ctx.ops.snapshotUnit(target, node.fields ?? [])
}

export function handleRestoreSnapshot(node: EffRestoreSnapshot, target: CombatUnit | null, ctx: EffectContext): void {
  if (!target) return
  ctx.ops.restoreUnit(target, node.fields ?? [])
}

export function handleEchoLastSkill(node: EffEchoLastSkill, target: CombatUnit | null, ctx: EffectContext): void {
  const unit = target ?? ctx.caster
  if (!unit) return
  const potency = typeof node.potency === 'number' ? node.potency : 1
  ctx.ops.echoLastSkill(unit, potency)
}

export function handleGaugeShuffle(node: EffGaugeShuffle, target: CombatUnit | null, ctx: EffectContext): void {
  const units = collectForSplash(target, ctx)
  if (units.length === 0) return
  ctx.ops.shuffleGauges(units, String(node.resource ?? 'gauge.current'))
}

export function handleStatusShuffle(node: EffStatusShuffle, target: CombatUnit | null, ctx: EffectContext): void {
  const units = collectForSplash(target, ctx)
  if (units.length === 0) return
  ctx.ops.shuffleStatuses(units, typeof node.count === 'number' ? node.count : 1)
}

export function handleModifySkill(node: EffModifySkill, target: CombatUnit | null, ctx: EffectContext): void {
  if (!target) return
  ctx.ops.modifySkillOf(target, node)
}

export function handleTargetOverride(node: EffTargetOverride, target: CombatUnit | null, ctx: EffectContext): void {
  if (!target) return
  ctx.ops.applyTargetOverride(target, { anchor: node.anchor, faction: node.faction, sort: node.sort })
}

export function handleWriteRuleSlot(node: EffWriteRuleSlot, _t: CombatUnit | null, ctx: EffectContext): void {
  ctx.ops.writeRuleSlot(node, ctx.caster)
}

export function handleModifyRuleSlot(node: EffModifyRuleSlot, _t: CombatUnit | null, ctx: EffectContext): void {
  ctx.ops.modifyRuleSlot(node, ctx.caster)
}

/** splash/splash_adjacent 的目标集合：目标所在路的前后邻接（P2b-2 取「目标 + 同路相邻一格」） */
function collectForSplash(target: CombatUnit | null, ctx: EffectContext): CombatUnit[] {
  if (!target?.position) return []
  const lane = target.position.lane
  const idx = target.position.index
  return ctx.units
    .all()
    .filter((u) => !u.isDead && !u.detached && u.position?.lane === lane && Math.abs(u.position.index - idx) <= 1)
    .sort((a, b) => (a.position?.index ?? 0) - (b.position?.index ?? 0))
}
