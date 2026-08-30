/**
 * 主动行为的提交与点火（A2 / §6.2 / §7.4）。
 *
 * 两条独立校验（这是 A2 拆分的核心收益）：
 *   资格校验：是否持有未消耗的机会     → 调度上下文
 *   成本校验：Gauge 扣减量 + Pool 是否足够 → 编队上下文
 *
 * 纪律：提交即承诺——引导被打断只作废效果，不退资源（§5.7）。
 */

import type { ActionId, InstanceId } from '../shared/ids.js';
import { ok, err, type Result } from '../shared/result.js';
import type { Unit } from '../roster/unit.js';
import type { BehaviorSlot } from '../roster/behavior-slot.js';
import { effectiveCost, costPayable } from '../scheduling/filter.js';
import type { CombatHost } from './host.js';
import { Action } from './action.js';
import { resolveTargets, settleAction } from './pipeline.js';
import { preprocessCasterContext } from './pipeline-i.js';

export interface CommitOptions {
  /** Manual 目标规格下玩家选中的候选下标。 */
  readonly selection?: readonly number[];
  /** 覆盖目标规格（如嘲讽的 target_override 已由约束层处理，这里留给外部强制指定）。 */
  readonly targetSpecOverride?: Action['init']['targetSpec'];
}

export function commitBehavior(
  host: CombatHost,
  unit: Unit,
  slot: BehaviorSlot,
  options: CommitOptions = {},
): Result<Action> {
  // 1. 资格校验（调度）
  const opportunity = host.currentOpportunity(unit.id);
  if (!opportunity) return err('NO_OPPORTUNITY', `单位 ${unit.id} 当前没有行动机会`);
  if (opportunity.consumedBy !== null) {
    return err('OPPORTUNITY_CONSUMED', `机会 ${opportunity.id} 已被消耗`);
  }

  // 2. 成本校验（编队）
  const cost = effectiveCost(unit, slot);
  if (!costPayable(unit, cost)) {
    return err('COST_NOT_PAYABLE', `单位 ${unit.id} 资源不足：需要 ${JSON.stringify(cost)}`);
  }

  // 3. 扣费
  unit.gauge.consume(cost.gaugeAmount);
  unit.pool('energy').applyDelta(-cost.energyAmount);
  host.consumeOpportunity(opportunity, host.ids.next('action') as ActionId);

  const constraints = unit.constraints;
  unit.startCooldown(slot, constraints.cooldownMul);

  // 4. 目标规格：target_override 覆盖；再做 laneRef: auto 预处理（A13）。
  const rawSpec = options.targetSpecOverride ?? constraints.targetOverride ?? slot.targetSpec;
  const targetSpec = rawSpec ? preprocessCasterContext(rawSpec, slot.reach) : null;
  const castTime = constraints.castTimeSet ?? slot.castTime;

  const action = new Action({
    id: host.ids.next('action') as ActionId,
    sourceRef: slot.key,
    sourceInstanceId: slot.instanceId as InstanceId,
    ignition: { kind: 'commit', opportunityId: opportunity.id },
    targetSpec,
    effects: slot.effects,
    reach: slot.reach,
    casterId: unit.id,
    consumption: targetSpec?.consumption ?? 'instant',
    castTime,
  });
  host.actions.set(action.id, action);

  host.bus.emit({
    type: 'BehaviorCommitted',
    actionId: action.id,
    casterId: unit.id,
    behaviorInstanceId: slot.instanceId,
    gaugeCost: cost.gaugeAmount,
    energyCost: cost.energyAmount,
  });
  host.bus.emit({ type: 'ActionCreated', actionId: action.id, casterId: unit.id, ignition: 'commit' });

  // 5. I 节点：点火时即解析并冻结目标（§5.7 引导场景要求冻结）。
  const targets = resolveTargets(host, action, unit, options.selection);
  if (!targets.ok) {
    // 提交即承诺：资源不退，但动作必须有终态，否则回放里会留下悬空的 Action。
    action.state = 'resolved';
    host.bus.emit({ type: 'ActionResolved', actionId: action.id, state: 'failed' });
    return targets;
  }

  if (targets.value.length === 0) {
    // 候选为空：跳过而非抛异常（原已拍板）。机会已消耗，记为 wasted。
    action.state = 'resolved';
    host.bus.emit({ type: 'ActionResolved', actionId: action.id, state: 'resolved' });
    return ok(action);
  }

  if (castTime > 0) {
    // 引导：提交即已占机会、已扣资源；目标已冻结。
    unit.state = 'channeling';
    unit.channel = {
      actionId: action.id,
      sourceInstanceId: slot.instanceId,
      remaining: castTime,
      interruptible: true,
    };
    action.state = 'pending';
    host.bus.emit({ type: 'ChannelStarted', unitId: unit.id, actionId: action.id, castTime });
    return ok(action);
  }

  const settled = settleAction(host, action);
  if (!settled.ok) return settled;
  return ok(action);
}

/** 引导完成（tick 第 4 步归零时调用）。 */
export function completeChannel(host: CombatHost, unit: Unit, actionId: ActionId): Result<void> {
  const action = host.actions.get(actionId);
  if (!action) return err('ACTION_NOT_PENDING', `Action ${actionId} 不存在`);
  unit.channel = null;
  unit.state = 'active';
  host.bus.emit({ type: 'ChannelCompleted', unitId: unit.id, actionId });
  return settleAction(host, action);
}

/** 引导被打断：只作废效果，不退资源。 */
export function interruptChannel(host: CombatHost, unit: Unit): Result<void> {
  const channel = unit.channel;
  if (!channel) return err('ACTION_NOT_PENDING', `单位 ${unit.id} 没有进行中的引导`);
  unit.channel = null;
  unit.state = 'active';
  const action = host.actions.get(channel.actionId);
  if (action) action.state = 'resolved';
  host.bus.emit({ type: 'ChannelInterrupted', unitId: unit.id, actionId: channel.actionId });
  return ok(undefined);
}
