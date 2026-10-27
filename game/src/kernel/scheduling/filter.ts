// 机会过滤（执行参数 §3）：固定顺序，结果确定。
// P2a：behaviorSlots 已是「主动行为」，故第 1 步 trigger==active 隐含成立；
// 第 2 步 !isRedirectDisabled 未建模（P2b）。其余四步照做。
import type { CombatUnit } from '../roster/unit'
import type { BehaviorSlot } from '../roster/types'

export function availableBehaviors(
  unit: CombatUnit,
  force: readonly string[] = [],
  energyCost: (slot: BehaviorSlot) => number = (b) => b.cost.energy,
): BehaviorSlot[] {
  return unit.behaviorSlots.filter((b) => {
    if (b.cooldownRemaining !== 0) return false
    // 装备牌：其装备实例仍在线时不可重打（CD 于下线后才开始计，见编队上下文 §六·一）
    if (b.equipInstanceId != null && unit.equipment.some((e) => e.instanceId === b.equipInstanceId)) return false
    // force 白名单既接受技能 defId，也接受行为 kind（basic_attack / skill）
    if (force.length > 0 && !force.includes(b.defId) && !force.includes(b.kind)) return false
    if (unit.channel !== null) return false
    if (unit.pool('energy').current < energyCost(b)) return false
    if (unit.gauge.current < b.cost.gauge) return false
    return true
  })
}
