// commit：资格校验（机会）→ 成本校验（gauge/energy）→ 扣减 → 进入流水线（执行上下文 §六）。
// 顺序：先资格后成本；扣减失败不产生部分扣减。
import type { ActionOpportunity } from '../scheduling/types'
import type { BehaviorSlot } from '../roster/types'
import type { CombatUnit } from '../roster/unit'
import { err, ok, type Result } from '../shared/result'
import { runBehavior, type AwaitingDecision, type BehaviorSource, type PipelineDeps } from './pipeline'

export function costPayable(unit: CombatUnit, slot: BehaviorSlot): boolean {
  return unit.pool('energy').current >= slot.cost.energy && unit.gauge.current >= slot.cost.gauge
}

export function commitBehavior(
  unit: CombatUnit,
  slot: BehaviorSlot,
  opportunity: ActionOpportunity,
  source: BehaviorSource,
  deps: PipelineDeps,
): Result<AwaitingDecision | null> {
  if (opportunity.consumedBy !== null) return err('NO_OPPORTUNITY', '机会已被消费')
  if (!costPayable(unit, slot)) return err('COST_UNPAYABLE', '资源不足以支付成本')

  // opportunity=0：不消耗行动机会、不扣行动条成本——本次机会仍可继续行动
  const free = (slot.cost.opportunity ?? 1) === 0
  if (!free) {
    unit.gauge.consume(slot.cost.gauge)
    opportunity.consumedBy = 'committed'
  }
  unit.pool('energy').applyDelta(-slot.cost.energy)
  if (slot.cost.cooldown > 0) slot.cooldownRemaining = slot.cost.cooldown

  // 武器牌：扣费后立即装备——即使随后选靶失败/挂起，武器也已打出
  if (source.weapon) deps.equipWeapon?.(unit, source.weapon)

  return ok(runBehavior(unit, source, free ? null : opportunity.consumedBy, deps))
}
