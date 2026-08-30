/**
 * EffectExecutor：O 节点的效果分发（§7.3 / §13）。
 *
 *   for each effect in effects:
 *     for each target in pathTargets:
 *       if !condition.evaluate(target): continue      // 逐目标判定（可"群攻只烧残血"）
 *       outcome ← executeEffect(effect, target)
 *       outcomes.append(outcome)
 *       emit(EffectApplied)
 */

import type { Element } from '../shared/enums.js';
import { ok, err, type Result } from '../shared/result.js';
import { evaluateCondition, type ConditionContext } from '../shared/effect-condition.js';
import type { EffectRef } from '../catalog/model.js';
import type { Unit } from '../roster/unit.js';
import type { ResolvedTarget } from '../execution/target.js';
import { EFFECT_HANDLERS } from './handlers.js';
import type { EffectContext, EffectOutcome } from './context.js';

/** 单向效果执行的结果：null = 条件未通过或目标不适用，未产生任何变更。 */
export type EffectExecution = EffectOutcome | null;

function conditionContextOf(ctx: EffectContext, targetUnit: Unit | null, element: Element): ConditionContext {
  return {
    caster: ctx.caster,
    target: targetUnit,
    element,
    random: ctx.runtime.random,
    randomRegistry: ctx.runtime.randomRegistry,
    registryKey: ctx.sourceId,
  };
}

export function elementOf(ctx: EffectContext, ref: EffectRef): Element {
  const def = ctx.runtime.catalog.effect(ref.ref);
  return ((ref.params?.element as Element) ?? def?.element ?? 'none') as Element;
}

/** 执行单条效果到单个目标。 */
export function executeEffectRef(
  ctx: EffectContext,
  ref: EffectRef,
  target: ResolvedTarget,
): Result<EffectExecution> {
  const def = ctx.runtime.catalog.effect(ref.ref);
  if (!def) return err('CATALOG_UNRESOLVED_REF', `效果 ${ref.ref} 不存在`);

  const handler = EFFECT_HANDLERS[def.type];
  if (!handler) return err('NOT_IMPLEMENTED', `效果类型 ${def.type} 尚无执行体`);

  const element = elementOf(ctx, ref);
  const targetUnit = target.occupantId === null ? null : (ctx.runtime.unit(target.occupantId) ?? null);

  // 逐目标判定（可表达"群攻只烧残血"）。
  if (!evaluateCondition(ref.condition, conditionContextOf(ctx, targetUnit, element))) {
    return ok(null);
  }

  const outcome = handler(ctx, ref, target);
  if (!outcome.ok) return outcome;

  ctx.runtime.bus.emit({
    type: 'EffectApplied',
    actionId: ctx.actionId,
    effectRef: ref.ref,
    effectType: def.type,
    element,
    originTerm: ref.originTerm ?? null,
    target: { coord: target.coord, occupantId: target.occupantId },
    outcome: outcome.value,
  });

  return ok(outcome.value);
}

/**
 * 逐效果 × 逐目标执行一串效果。
 *
 * 顺序是 effect-major（先效果后目标），与 §7.3 的 O 节点伪码一致，
 * 这样"先打两下再挂状态"这类语序在配置里就是数组的自然顺序。
 */
export function executeEffectList(
  ctx: EffectContext,
  effects: readonly EffectRef[],
  targets: readonly ResolvedTarget[],
): readonly EffectExecution[] {
  const out: EffectExecution[] = [];
  for (const ref of effects) {
    for (const t of targets) {
      const r = executeEffectRef(ctx, ref, t);
      if (r.ok) out.push(r.value);
    }
  }
  return out;
}
