/**
 * 声明式约束的聚合（§5.5 的 (b) 类贡献）。
 *
 * 聚合规则（参数层 §1.4，已定）：
 *   disable 并集 / force 并集 / mul 乘积 / add 求和 /
 *   cast_time_set 取最小 / cooldown_mul 乘积 / target_override 覆盖
 *   disable 优先于 force
 */

import type { BehaviorModifierOp } from '../shared/enums.js';
import type { TargetSpec } from '../shared/target-spec.js';

export interface BehaviorModifierInput {
  readonly op: BehaviorModifierOp;
  readonly behaviorKey?: string;
  /** target_override 携带完整 TargetSpec；其余算子用 number / string。 */
  readonly value?: number | string | TargetSpec;
}

export interface BehaviorConstraints {
  /** 被禁用的行为键集合；包含 '*' 表示全部禁用。 */
  readonly disabled: ReadonlySet<string>;
  readonly forced: ReadonlySet<string>;
  readonly energyCostMul: number;
  readonly energyCostAdd: number;
  readonly castTimeSet: number | null;
  readonly cooldownMul: number;
  readonly targetOverride: TargetSpec | null;
}

export const NO_CONSTRAINTS: BehaviorConstraints = {
  disabled: new Set(),
  forced: new Set(),
  energyCostMul: 1,
  energyCostAdd: 0,
  castTimeSet: null,
  cooldownMul: 1,
  targetOverride: null,
};

export function aggregateBehaviorModifiers(inputs: Iterable<BehaviorModifierInput>): BehaviorConstraints {
  const disabled = new Set<string>();
  const forced = new Set<string>();
  let energyCostMul = 1;
  let energyCostAdd = 0;
  let castTimeSet: number | null = null;
  let cooldownMul = 1;
  let targetOverride: TargetSpec | null = null;

  for (const m of inputs) {
    const key = m.behaviorKey ?? '*';
    switch (m.op) {
      case 'disable':
        disabled.add(key);
        break;
      case 'force':
        forced.add(key);
        break;
      case 'energy_cost_mul':
        energyCostMul *= typeof m.value === 'number' ? m.value : 1;
        break;
      case 'energy_cost_add':
        energyCostAdd += typeof m.value === 'number' ? m.value : 0;
        break;
      case 'cast_time_set': {
        const v = typeof m.value === 'number' ? m.value : Number(m.value);
        if (Number.isFinite(v)) castTimeSet = castTimeSet === null ? v : Math.min(castTimeSet, v);
        break;
      }
      case 'cooldown_mul':
        cooldownMul *= typeof m.value === 'number' ? m.value : 1;
        break;
      case 'target_override':
        if (typeof m.value === 'object' && m.value !== null) {
          targetOverride = m.value as TargetSpec;
        }
        break;
    }
  }

  return { disabled, forced, energyCostMul, energyCostAdd, castTimeSet, cooldownMul, targetOverride };
}

/** disable 优先于 force。 */
export function isDisabled(key: string, c: BehaviorConstraints): boolean {
  return c.disabled.has('*') || c.disabled.has(key);
}

export function isForced(key: string, c: BehaviorConstraints): boolean {
  return c.forced.has('*') || c.forced.has(key);
}

/** force 集合非空时，只有被 force 的行为可选（且未被 disable）。 */
export function isSelectable(key: string, c: BehaviorConstraints): boolean {
  if (isDisabled(key, c)) return false;
  if (c.forced.size === 0) return true;
  return isForced(key, c);
}
