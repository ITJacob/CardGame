/**
 * 执行流水线对聚合根的最小依赖面。
 *
 * 流水线（执行）需要读战场、编队、编目、随机源，但它不能反过来被它们依赖。
 * 于是这里声明一组窄接口，由 Combat 聚合根实现并把自己注入进来。
 */

import type { UnitId } from '../shared/ids.js';
import type { BattlefieldShape } from '../battle/battlefield.js';
import type { UnitRegistry } from '../roster/registry.js';
import type { EffectRuntime } from '../effect/context.js';
import type { ActionOpportunity } from '../scheduling/opportunity.js';
import type { Action } from './action.js';
import type { ActionId } from '../shared/ids.js';

export interface CombatHost extends EffectRuntime {
  readonly shape: BattlefieldShape;
  readonly registry: UnitRegistry;

  /** 该单位当前持有的、未消耗的行动机会（INV-S3）。 */
  currentOpportunity(unitId: UnitId): ActionOpportunity | null;
  consumeOpportunity(opportunity: ActionOpportunity, actionId: ActionId): void;
  /** 机会未被消耗时记为 wasted（INV-S4）。 */
  wasteOpportunity(opportunity: ActionOpportunity, reason: string): void;

  /** 进行中 / 待结算的 Action 登记表。 */
  readonly actions: Map<ActionId, Action>;
}
