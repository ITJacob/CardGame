// P2b-1 战力类原语处理：move / spawn / dispel / drain / modify_status /
// transfer_status / modify_damage / grant_immunity / modify_targetability /
// reveal / take_control。需要触碰战场或注册表的走 ctx.ops。
import type {
  EffDispel, EffDrain, EffGrantImmunity, EffModifyDamage, EffModifyStatus,
  EffModifyTargetability, EffMove, EffReveal, EffSpawn, EffTakeControl, EffTransferStatus, EffTranslocate,
} from '../catalog/types'
import type { EffectContext } from './context'
import { numeric } from './context'
import type { CombatUnit } from '../roster/unit'

type StatusIdSel = string | string[] | undefined

/** 按 statusId / 类别收集匹配的状态实例 id（确定性：按状态挂载序） */
export function matchStatuses(
  unit: CombatUnit,
  statusId: StatusIdSel,
  categories: readonly string[] | undefined,
  ctx: EffectContext,
): string[] {
  const ids = statusId ? (Array.isArray(statusId) ? statusId : [statusId]) : undefined
  return unit.statuses
    .all()
    .filter((i) => {
      if (ids && !ids.includes(i.defId)) return false
      if (categories && !categories.some((c) => (ctx.defCategory?.(i.defId) ?? []).includes(c))) return false
      return true
    })
    .map((i) => i.instanceId)
}

export function handleMove(node: EffMove, target: CombatUnit | null, ctx: EffectContext): void {
  if (!target || target.isDead) return
  ctx.ops.move(target, node.op, numeric(node.distance, 1), ctx.caster)
}

export function handleSpawn(node: EffSpawn, target: CombatUnit | null, ctx: EffectContext): void {
  ctx.ops.spawn(ctx.caster, node, target)
}

export function handleDispel(node: EffDispel, target: CombatUnit | null, ctx: EffectContext): void {
  if (!target || target.isDead) return
  let removed = 0
  const limit = typeof node.count === 'number' ? node.count : Number.MAX_SAFE_INTEGER
  for (const instanceId of matchStatuses(target, node.statusId, node.category, ctx)) {
    if (removed >= limit) break
    target.statuses.unmount(instanceId, 'dispel')
    target.provenance.revertBySource(instanceId)
    removed += 1
  }
}

export function handleDrain(node: EffDrain, target: CombatUnit | null, ctx: EffectContext): void {
  if (!target || target.isDead) return
  const caster = ctx.caster
  const resource = node.resource ?? 'hp'
  const pool = resource === 'energy' ? target.pool('energy') : target.pool('hp')
  const raw = typeof node.value === 'number' ? node.value : (node.ratio ?? 0) * pool.current
  const drawn = Math.abs(pool.applyDelta(-Math.abs(raw)))
  const gain = drawn * (node.healRatio ?? 1)
  if (caster && !caster.isDead && gain > 0) {
    const c = resource === 'energy' ? caster.pool('energy') : caster.pool('hp')
    c.applyDelta(gain)
  }
  if (resource === 'hp') ctx.reportDamage?.(caster?.faction ?? '', drawn)
}

export function handleModifyStatus(node: EffModifyStatus, target: CombatUnit | null, _ctx: EffectContext): void {
  if (!target) return
  for (const inst of target.statuses.byDef(node.statusId)) {
    if (node.addDuration) inst.remaining = Math.max(0, inst.remaining + node.addDuration)
    if (node.setDuration !== undefined && node.setDuration !== null) inst.remaining = node.setDuration
    if (node.stacksDelta) inst.currentStacks = Math.max(0, inst.currentStacks + node.stacksDelta)
  }
}

export function handleTransferStatus(node: EffTransferStatus, target: CombatUnit | null, ctx: EffectContext): void {
  if (!target || target.isDead) return
  const toId = typeof node.to === 'string' ? node.to : undefined
  const dest = toId ? (ctx.units.get(toId) ?? null) : ctx.caster
  if (!dest) return
  const copy = node.mode === 'copy'
  const cats = node.filter?.hasCategory
  const catList = cats ? (Array.isArray(cats) ? cats : [cats]) : undefined
  for (const instanceId of matchStatuses(target, undefined, catList, ctx)) {
    const inst = target.statuses.all().find((i) => i.instanceId === instanceId)
    if (!inst) continue
    const duration = node.keepDuration === false ? (node.durationMul ?? 1) * inst.remaining : inst.remaining
    const stacks = Math.max(1, Math.round((node.stacksMul ?? 1) * inst.currentStacks))
    ctx.mountStatus(dest, inst.defId, { duration, stacks })
    if (!copy) {
      target.statuses.unmount(instanceId, 'transferred')
      target.provenance.revertBySource(instanceId)
    }
  }
}

export function handleModifyDamage(node: EffModifyDamage, target: CombatUnit | null, ctx: EffectContext): void {
  if (!target) return
  ctx.ops.damageMod(target, node.scope ?? 'taken', (node.mul ?? 1) - 1, null)
}

export function handleGrantImmunity(node: EffGrantImmunity, target: CombatUnit | null, ctx: EffectContext): void {
  if (!target) return
  ctx.ops.grantImmunity(target, node)
}

export function handleModifyTargetability(node: EffModifyTargetability, target: CombatUnit | null, ctx: EffectContext): void {
  if (!target) return
  ctx.ops.targetability(target, node.untargetable ?? true, node.duration ?? null)
}

export function handleReveal(_node: EffReveal, target: CombatUnit | null, ctx: EffectContext): void {
  if (!target) return
  // P2b-1：揭示 = 移除隐匿类状态（dispel 语义）
  for (const instanceId of matchStatuses(target, undefined, ['conceal'], ctx)) {
    target.statuses.unmount(instanceId, 'reveal')
    target.provenance.revertBySource(instanceId)
  }
}

export function handleTakeControl(node: EffTakeControl, target: CombatUnit | null, ctx: EffectContext): void {
  if (!target || target.isDead || !ctx.caster) return
  ctx.ops.takeControl(target, node.duration ?? 1, ctx.caster)
}

export function handleTranslocate(node: EffTranslocate, target: CombatUnit | null, ctx: EffectContext): void {
  if (!target || target.isDead) return
  ctx.ops.translocate(target, node.duration ?? 1, node.returnPayload ?? [])
}
