// P2a 效果原语处理：damage / heal / mount_status / modify_stat / modify_resource。
// 其余原语由 executor 走 unsupported 分支（跳过 + 计数），不在此实现。
import type { PoolKey } from '../ids'
import { round2 } from '../shared/result'
import type { EffDamage, EffHeal, EffModifyResource, EffModifyStat, EffMountStatus } from '../catalog/types'
import type { EffectContext } from './context'
import { numeric } from './context'
import { applyDamageResult, resolveDamage } from './damage-chain'
import type { CombatUnit } from '../roster/unit'

const POOL_KEYS: readonly PoolKey[] = ['hp', 'energy', 'shield', 'armor', 'lost', 'lust']

/** 解析 valueFrom 引用（P2b-1 支持 targetStat / statusStacks / maxStatThisBattle） */
function resolveValueFrom(
  ref: unknown,
  unit: CombatUnit | null,
  stat: string | undefined,
  ctx: EffectContext,
): number {
  const key = typeof ref === 'string' ? ref : (ref && typeof ref === 'object' ? String((ref as { kind?: string }).kind ?? '') : '')
  if (!unit) return 0
  switch (key) {
    case 'targetStat':
      return stat ? unit.stat(stat) : 0
    case 'statusStacks': {
      const sid = String((ref as { statusId?: string })?.statusId ?? '')
      return sid ? unit.statusStacks(sid) : 0
    }
    case 'maxStatThisBattle':
      return stat ? unit.stat(stat) : 0
    default:
      ctx.unsupported('valueFrom', key || 'unknown')
      return 0
  }
}

export function handleDamage(node: EffDamage, target: CombatUnit | null, ctx: EffectContext): void {
  if (!target || target.isDead) return
  const attacker = ctx.caster
  const base =
    typeof node.value === 'number'
      ? node.value
      : node.valueFrom !== undefined
        ? resolveValueFrom(node.valueFrom, attacker, undefined, ctx)
        : (attacker?.effectiveProfile.attack ?? 0)
  const raw = round2(base * (node.mul ?? 1))
  const element = node.element ?? 'physical'
  const result = resolveDamage({
    raw,
    element,
    attacker,
    defender: target,
    lethal: node.lethal,
    pierce: node.pierce,
    armorPierceRatio: numeric(node.armorPierceRatio, 0),
  })
  applyDamageResult(target, result)
  ctx.reportDamage?.(attacker?.faction ?? '', result.final)
  ctx.onDamage?.(attacker ?? null, target, result.final)
}

export function handleHeal(node: EffHeal, target: CombatUnit | null, _ctx: EffectContext): void {
  if (!target || target.isDead) return
  const hp = target.pool('hp')
  const amount = numeric(node.value, 0)
  switch (node.mode) {
    case 'setHp':
      hp.setValue(amount)
      break
    case 'hpMaxRatio':
      hp.setValue(round2(target.hpMax * numeric(node.healToRatio, amount)))
      break
    case 'to_ratio':
      hp.setValue(round2(target.hpMax * numeric(node.healToRatio, 1)))
      break
    default:
      hp.applyDelta(amount)
  }
}

export function handleMountStatus(node: EffMountStatus, target: CombatUnit | null, ctx: EffectContext): void {
  if (!target || target.isDead) return
  ctx.mountStatus(target, node.statusId, {
    duration: node.duration ?? undefined,
    stacks: typeof node.stacks === 'number' ? node.stacks : undefined,
    params: node.params as Record<string, number> | undefined,
  })
}

export function handleModifyStat(node: EffModifyStat, target: CombatUnit | null, ctx: EffectContext): void {
  if (!target || target.isDead) return
  const stat = node.stat
  const value = typeof node.value === 'number' ? node.value : resolveValueFrom(node.valueFrom, target, stat, ctx)
  const current = target.stat(stat)
  let delta: number
  switch (node.mode) {
    case 'set': delta = value - current; break
    case 'mul': delta = current * (value - 1); break
    case 'to_at_least': delta = Math.max(0, value - current); break
    case 'to_at_most': delta = Math.min(0, value - current); break
    default: delta = value
  }
  const sourceId = ctx.ids.next('mod')
  if (node.duration == null) target.provenance.apply(stat, round2(delta), sourceId)
  else target.provenance.applyTimed(stat, round2(delta), sourceId, node.duration)
}

export function handleModifyResource(node: EffModifyResource, target: CombatUnit | null, ctx: EffectContext): void {
  if (!target || target.isDead) return
  const res = String(node.resource)
  const value = numeric(node.value, 0)

  if (res === 'gauge.current' || res === 'gauge.rate' || res === 'gauge.threshold') {
    const dim = res.slice('gauge.'.length) as 'current' | 'rate' | 'threshold'
    if (node.mode === 'set') target.gauge.setValue(dim, value)
    else target.gauge.applyDelta(dim, value)
    return
  }
  if (res === 'secrecy' || res === 'order' || res === 'fate_value') {
    ctx.ops.boardMeter(res, value, node.mode === 'set')
    return
  }
  if (!POOL_KEYS.includes(res as PoolKey)) {
    ctx.unsupported('modify_resource', `未知资源 ${res}`)
    return
  }
  const pool = target.pool(res as PoolKey)
  if (node.mode === 'set') pool.setValue(value)
  else pool.applyDelta(value)
}
