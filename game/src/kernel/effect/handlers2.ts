// P2b-1 战力类原语处理：move / spawn / dispel / drain / modify_status /
// transfer_status / modify_damage / grant_immunity / modify_targetability /
// reveal / take_control。需要触碰战场或注册表的走 ctx.ops。
import type {
  EffDisarm, EffDispel, EffDrain, EffGrantImmunity, EffModifyDamage, EffModifyStatus,
  EffModifyTargetability, EffModifyWeapon, EffMove, EffReveal, EffSpawn, EffTakeControl,
  EffTransferStatus, EffTranslocate,
} from '../catalog/types'
import type { EffectContext } from './context'
import { numeric } from './context'
import type { CombatUnit, TargetKind, TargetSide } from '../roster/unit'

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
  ctx.ops.spawn(ctx.caster, node, target, {
    target: target ?? ctx.targetScope?.targets[0] ?? null,
    killed: ctx.targetScope?.killed ?? null,
  })
}

/**
 * dispel（效果参数 §二）：嵌套 filter 与平铺字段同等对待（嵌套优先）。
 * dispelTarget=unit 时优先走召唤物销毁分支（unitId/isOwnSummon/isSummon），
 * 否则按 statusId/category/dispelable/count 清状态；domain 走 tier 解除界域。
 */
export function handleDispel(node: EffDispel, target: CombatUnit | null, ctx: EffectContext): void {
  const f = node.filter ?? {}
  const kind = node.dispelTarget ?? 'unit'
  const rawCount = f.count ?? node.count
  const count = typeof rawCount === 'number' ? rawCount : undefined

  if (kind === 'domain') {
    ctx.ops.dispelDomain(f.tier, count)
    return
  }
  if (kind === 'coordinate') {
    ctx.unsupported('dispel', 'coordinate 目标（拆区域）未实现')
    return
  }

  // 召唤物销毁：unitId / isOwnSummon / isSummon / casterOwned
  if (f.unitId !== undefined || f.isOwnSummon || f.isSummon || f.casterOwned) {
    ctx.ops.dispelSummons(target ?? ctx.caster, {
      unitId: f.unitId,
      ownOnly: !!(f.isOwnSummon || f.casterOwned || f.isSummon),
      count,
    })
    return
  }

  if (!target || target.isDead) return
  const statusIds = f.statusId ?? node.statusId
  const ids = statusIds ? (Array.isArray(statusIds) ? statusIds : [statusIds]) : undefined
  const categories = f.category ?? node.category
  const limit = count ?? Number.MAX_SAFE_INTEGER
  const wantDispelable = typeof f.dispelable === 'boolean' ? f.dispelable : undefined
  let removed = 0
  for (const inst of target.statuses.all()) {
    if (removed >= limit) break
    if (ids && !ids.includes(inst.defId)) continue
    if (categories && !categories.some((c) => (ctx.defCategory?.(inst.defId) ?? []).includes(c))) continue
    if (wantDispelable !== undefined && (ctx.statusDef?.(inst.defId)?.dispelable === true) !== wantDispelable) continue
    target.statuses.unmount(inst.instanceId, 'dispel')
    target.provenance.revertBySource(inst.instanceId)
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

export function handleDisarm(node: EffDisarm, target: CombatUnit | null, ctx: EffectContext): void {
  if (!target || target.isDead) return
  if (node.slot && node.slot !== 'weapon') return
  ctx.ops.destroyWeapon(target, 'disarm')
}

export function handleModifyWeapon(node: EffModifyWeapon, target: CombatUnit | null, ctx: EffectContext): void {
  if (!target || target.isDead) return
  if (node.slot && node.slot !== 'weapon') return
  ctx.ops.modifyWeapon(target, node)
}

export function handleModifyStatus(node: EffModifyStatus, target: CombatUnit | null, _ctx: EffectContext): void {
  if (!target) return
  const insts = node.statusId ? target.statuses.byDef(node.statusId) : []
  for (const inst of insts) {
    // 常驻（remaining = null）不从「延长/缩短」里取值：加时长不改变常驻语义
    if (node.addDuration && inst.remaining !== null) inst.remaining = Math.max(0, inst.remaining + node.addDuration)
    if (node.setDuration !== undefined && node.setDuration !== null) inst.remaining = node.setDuration
    if (node.stacksDelta) inst.currentStacks = Math.max(0, inst.currentStacks + node.stacksDelta)
    if (node.restoreCharges && inst.maxCharges !== null) inst.charges = inst.maxCharges
    if (node.chargesDelta && inst.charges !== null) inst.charges = Math.max(0, inst.charges + node.chargesDelta)
  }
}

export function handleTransferStatus(node: EffTransferStatus, target: CombatUnit | null, ctx: EffectContext): void {
  if (!target || target.isDead) return
  const toId = typeof node.to === 'string' ? node.to : undefined
  const dest = toId ? (ctx.units.get(toId) ?? null) : ctx.caster
  if (!dest) return
  if (node.mode === 'rewrite') {
    ctx.unsupported('transfer_status', 'rewrite 映射表未配置')
    return
  }
  const copy = node.mode === 'copy'
  const cats = node.filter?.hasCategory
  const catList = cats ? (Array.isArray(cats) ? cats : [cats]) : undefined
  for (const instanceId of matchStatuses(target, undefined, catList, ctx)) {
    const inst = target.statuses.all().find((i) => i.instanceId === instanceId)
    if (!inst) continue
    // 常驻（null）原样传递；其余按 keepDuration/durationMul 折算
    const duration =
      inst.remaining === null
        ? null
        : node.keepDuration === false
          ? (node.durationMul ?? 1) * inst.remaining
          : inst.remaining
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

/**
 * modify_targetability → 可选中性覆写记录。
 * direction → (选靶口径 kind, 施加方 side)：all=两口径/任何人；enemy_targeted=指定型/敌方；
 * enemy_aoe=区块型/敌方；ally=两口径/友军；缺省 = 两口径/任何人（「不可被选中」的朴素读法）。
 */
export function handleModifyTargetability(node: EffModifyTargetability, target: CombatUnit | null, ctx: EffectContext): void {
  if (!target) return
  const dir = node.direction
  const kind: TargetKind = dir === 'enemy_targeted' ? 'targeted' : dir === 'enemy_aoe' ? 'area' : 'both'
  const side: TargetSide = dir === 'enemy_targeted' || dir === 'enemy_aoe' ? 'enemy' : dir === 'ally' ? 'ally' : 'any'
  ctx.ops.targetability(target, {
    untargetable: node.untargetable ?? true,
    remaining: node.duration ?? null,
    kind,
    side,
  })
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
