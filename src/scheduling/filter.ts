/**
 * OpportunityFilter：可选行为列表（§6.4）。
 *
 * 过滤顺序固定，结果确定：
 *   1. trigger == active
 *   2. 未被 disable / force 约束排除（决策期约束，disable 优先于 force）
 *   3. cooldownRemaining == 0
 *   4. 无进行中的引导
 *   5. cost.payable(unit)  ← 含 energy_cost_mul / energy_cost_add 修正后的最终成本
 */

import type { BehaviorCost } from '../catalog/model.js';
import type { BehaviorSlot } from '../roster/behavior-slot.js';
import { isSelectable } from '../roster/behavior-constraints.js';
import type { Unit } from '../roster/unit.js';

export interface EffectiveCost extends BehaviorCost {}

/** 应用耗能修正后的最终成本（参数层 §1.4：mul 乘积 / add 求和）。 */
export function effectiveCost(unit: Unit, slot: BehaviorSlot): EffectiveCost {
  const c = unit.constraints;
  return {
    gaugeAmount: slot.cost.gaugeAmount,
    energyAmount: slot.cost.energyAmount * c.energyCostMul + c.energyCostAdd,
  };
}

export function costPayable(unit: Unit, cost: EffectiveCost): boolean {
  return unit.gauge.current >= cost.gaugeAmount && unit.energy >= cost.energyAmount;
}

export function availableBehaviors(unit: Unit): readonly BehaviorSlot[] {
  if (!unit.isAlive || unit.position === null) return [];
  const constraints = unit.constraints;
  return unit.behaviorSlots.filter(
    (b) =>
      b.trigger === 'active' &&
      isSelectable(b.key, constraints) &&
      unit.cooldownOf(b) === 0 &&
      unit.channel === null &&
      costPayable(unit, effectiveCost(unit, b)),
  );
}
