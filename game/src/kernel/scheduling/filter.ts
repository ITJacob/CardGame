// 机会过滤（执行参数 §3）：固定顺序，结果确定。
// P2a：behaviorSlots 已是「主动行为」，故第 1 步 trigger==active 隐含成立；
// 第 2 步 !isRedirectDisabled 未建模（P2b）。其余四步照做。
import type { CombatUnit } from '../roster/unit'
import type { BehaviorSlot } from '../roster/types'

export function availableBehaviors(unit: CombatUnit, force: readonly string[] = []): BehaviorSlot[] {
  return unit.behaviorSlots.filter((b) => {
    if (b.cooldownRemaining !== 0) return false
    if (force.length > 0 && !force.includes(b.defId)) return false
    if (unit.channel !== null) return false
    if (unit.pool('energy').current < b.cost.energy) return false
    if (unit.gauge.current < b.cost.gauge) return false
    return true
  })
}
