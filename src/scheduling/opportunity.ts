/**
 * ActionOpportunity：行动机会（A2 落地 / §6.2）。
 *
 * A2 把"行动资格"与"资源成本"拆开，这是拆分的核心收益：
 *   资格校验：是否持有未消耗的机会        → 调度
 *   成本校验：Gauge 扣减量 + Pool 是否足够 → 编队
 *
 * 不变量：
 * - INV-S3：同 tick 内每个单位至多获得一次机会。
 * - INV-S4：机会未被消耗（如无可用行为）时明确记为 wasted，不累积到下一 tick。
 */

import type { ActionId, OpportunityId, UnitId } from '../shared/ids.js';

export interface ActionOpportunity {
  readonly id: OpportunityId;
  readonly unitId: UnitId;
  readonly tickIndex: number;
  /** 被哪个 Action 消耗；未消耗则记录为 wasted。 */
  consumedBy: ActionId | null;
}

export type OpportunityWasteReason = 'no_available_behavior' | 'unit_left' | 'combat_finished';

export function createOpportunity(
  id: OpportunityId,
  unitId: UnitId,
  tickIndex: number,
): ActionOpportunity {
  return { id, unitId, tickIndex, consumedBy: null };
}
