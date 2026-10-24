// P2a 效果原语处理：damage / heal / mount_status / modify_stat / modify_resource。
// 其余原语由 executor 走 unsupported 分支（跳过 + 计数），不在此实现。
import type { PoolKey } from '../ids'
import { round2 } from '../shared/result'
import type { EffDamage, EffHeal, EffModifyResource, EffModifyStat, EffMountStatus } from '../catalog/types'
import type { EffectContext } from './context'
import { numeric } from './context'
import { applyDamageResult, resolveDamage } from './damage-chain'
import type { CombatUnit } from '../roster/unit'
import { resolveEffectTargets } from './target-scope'

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
    case 'ramp':
      if (ctx.rampValue === undefined) {
        ctx.unsupported('valueFrom', 'ramp 无触发状态语境')
        return 0
      }
      return ctx.rampValue
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
        : (attacker?.attackPower() ?? 0)
  const element = node.element ?? 'physical'
  // 元素相消：对立元素伤害命中持有对立元素状态的目标 → 削 1 层，本次伤害 ×0.85
  const countered = ctx.elementCounter?.(target, element) ?? false
  const raw = round2(base * (node.mul ?? 1) * (countered ? 0.85 : 1))
  // 持有者出伤参数（outgoingDamageParams）：pierce 并集、破甲比例取高；受 weaponDamage 门控
  const outgoing = attacker?.outgoingDamageParams(ctx.weaponDamage === true) ?? null
  const pierce = new Set(node.pierce ?? [])
  if (outgoing) for (const p of outgoing.pierce) pierce.add(p)
  const result = resolveDamage({
    raw,
    element,
    attacker,
    defender: target,
    lethal: node.lethal,
    pierce: [...pierce],
    armorPierceRatio: Math.max(numeric(node.armorPierceRatio, 0), outgoing?.armorPierceRatio ?? 0),
    dimMul: ctx.dimMul?.('damage') ?? 1,
    unitById: (id) => ctx.units.get(id),
    allUnits: () => ctx.units.all(),
    phase: ctx.phase,
  })
  applyDamageResult(target, result)
  ctx.reportDamage?.(attacker?.faction ?? '', result.final)
  ctx.onDamage?.(attacker ?? null, target, result.final, {
    element,
    source: ctx.damageSource ?? 'behavior',
  })
}

export function handleHeal(node: EffHeal, target: CombatUnit | null, ctx: EffectContext): void {
  if (!target || target.isDead) return
  const hp = target.pool('hp')
  const amount = round2(numeric(node.value, 0) * (ctx.dimMul?.('heal') ?? 1))
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
  // 亡骸可寻址（编队上下文 §十，2026-10-02 拍板）：on_kill/on_death 的
  // killed_unit / self 载荷允许落在尸体上（revive_blocked 等击杀标记）。
  if (!target) return
  // recordedTarget 绑定：把本次 Action 的目标实例 id 记进状态，供 H4 filter.recordedTargetOnly 读取。
  // binding 的值是书写简写（target / primary_target / self），不是单位 id；卡片语境下
  // target 常是 self（状态挂在施法者身上），真实目标在 targetScope.targets 里
  const bindKey = node.binding?.recordedTarget
  let recordedTarget: string | undefined
  if (bindKey === 'self' || bindKey === 'holder' || bindKey === 'status_holder') {
    recordedTarget = ctx.caster?.id ?? target.id
  } else if (bindKey === 'secondary_target') {
    recordedTarget = ctx.targetScope?.secondary[0]?.id
  } else if (bindKey) {
    recordedTarget = ctx.targetScope?.targets[0]?.id ?? target.id
  }
  const binding = node.binding
    ? { ...node.binding, ...(recordedTarget ? { recordedTarget } : {}) }
    : undefined
  ctx.mountStatus(target, node.statusId, {
    duration: node.duration ?? undefined,
    durationUnit: node.durationUnit,
    stacks: typeof node.stacks === 'number' ? node.stacks : node.stacks === 'all' ? 'all' : undefined,
    stackMode: node.stackMode,
    charges: typeof node.charges === 'number' ? node.charges : undefined,
    params: node.params as Record<string, number | string | boolean> | undefined,
    binding,
    ignoreWarSpiritCap: node.ignoreWarSpiritCap,
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
  else target.provenance.applyTimed(stat, round2(delta), sourceId, node.duration, node.durationUnit)
}

export function handleModifyResource(node: EffModifyResource, target: CombatUnit | null, ctx: EffectContext): void {
  const res = String(node.resource)
  const value = numeric(node.value, 0)

  if (node.mode === 'swap') {
    const scope = ctx.targetScope
    const pair = node.between
    if (!scope || !pair || pair.length < 2) {
      ctx.unsupported('modify_resource', 'swap 缺 between[2] 或 targetScope')
      return
    }
    const a = resolveEffectTargets(pair[0]!, scope, ctx.units)[0]
    const b = resolveEffectTargets(pair[1]!, scope, ctx.units)[0]
    if (!a || !b || a.isDead || b.isDead || a === b) return
    if (res === 'gauge.current') {
      const av = a.gauge.current
      const bv = b.gauge.current
      a.gauge.setValue('current', bv)
      b.gauge.setValue('current', av)
      return
    }
    if (res === 'secrecy' || res === 'order' || res === 'fate_value') {
      ctx.unsupported('modify_resource', `swap 不支持战场量表 ${res}`)
      return
    }
    if (!POOL_KEYS.includes(res as PoolKey)) {
      ctx.unsupported('modify_resource', `未知资源 ${res}`)
      return
    }
    const pa = a.pool(res as PoolKey)
    const pb = b.pool(res as PoolKey)
    const av = pa.current
    const bv = pb.current
    pa.setValue(bv)
    pb.setValue(av)
    return
  }

  if (!target || target.isDead) return

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
