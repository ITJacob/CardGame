/**
 * EffectCondition：组合式谓词（§10.3）。
 *
 * 判定上下文是**单个最终目标**——所以"群攻只烧残血"这类效果天然成立。
 *
 * B1 约束：`chance` 是唯一允许引入随机的条件，且必须满足随机治理规则（R1–R6）。
 */

import type { DefId, UnitId } from './ids.js';
import type { Element, JsonValue } from './types.js';
import type { RandomSource } from '../random/random-source.js';
import type { RandomUsageRegistry } from '../random/random-source.js';

export type EffectCondition =
  | { readonly kind: 'always' }
  | { readonly kind: 'chance'; readonly p: number }
  | { readonly kind: 'target_hp_below'; readonly ratio: number }
  | { readonly kind: 'target_hp_above'; readonly ratio: number }
  | { readonly kind: 'caster_has_status'; readonly statusId: DefId }
  | { readonly kind: 'target_has_status'; readonly statusId: DefId }
  | { readonly kind: 'element_is'; readonly element: Element }
  | { readonly kind: 'element_in'; readonly elements: readonly Element[] }
  | { readonly kind: 'not'; readonly of: EffectCondition }
  | { readonly kind: 'and'; readonly of: readonly EffectCondition[] }
  | { readonly kind: 'or'; readonly of: readonly EffectCondition[] };

export const ALWAYS: EffectCondition = { kind: 'always' };

/** 谓词判定所需的目标最小视图——避免共享内核反向依赖编队上下文。 */
export interface ConditionSubject {
  readonly id: UnitId;
  readonly hp: number;
  readonly hpMax: number;
  readonly attack: number;
  hasStatus(defId: DefId): boolean;
}

export interface ConditionContext {
  readonly caster: ConditionSubject | null;
  readonly target: ConditionSubject | null;
  /** 本次效果的元素（供元素谓词判定）。 */
  readonly element: Element;
  readonly random: RandomSource;
  readonly randomRegistry: RandomUsageRegistry;
  /** 用于 R3 登记的键（一般是效果 id 或术语路径）。 */
  readonly registryKey: string;
}

export function evaluateCondition(cond: EffectCondition | undefined, ctx: ConditionContext): boolean {
  if (!cond) return true;
  switch (cond.kind) {
    case 'always':
      return true;
    case 'chance': {
      // R4：单次抽样，就在这里读一次，绝不进结算链。
      ctx.randomRegistry.record(ctx.registryKey, { kind: 'chance', p: cond.p });
      return ctx.random.chance(cond.p);
    }
    case 'target_hp_below':
      return subjectHpRatio(ctx.target) < cond.ratio;
    case 'target_hp_above':
      return subjectHpRatio(ctx.target) > cond.ratio;
    case 'caster_has_status':
      return ctx.caster?.hasStatus(cond.statusId) ?? false;
    case 'target_has_status':
      return ctx.target?.hasStatus(cond.statusId) ?? false;
    case 'element_is':
      return ctx.element === cond.element;
    case 'element_in':
      return cond.elements.includes(ctx.element);
    case 'not':
      return !evaluateCondition(cond.of, ctx);
    case 'and':
      return cond.of.every((c) => evaluateCondition(c, ctx));
    case 'or':
      return cond.of.some((c) => evaluateCondition(c, ctx));
    default:
      return true;
  }
}

function subjectHpRatio(s: ConditionSubject | null): number {
  if (!s || s.hpMax <= 0) return 0;
  return s.hp / s.hpMax;
}

/** 条件是否引入随机（R3 审计用）。 */
export function conditionUsesRandom(cond: EffectCondition | undefined): boolean {
  if (!cond) return false;
  switch (cond.kind) {
    case 'chance':
      return true;
    case 'not':
      return conditionUsesRandom(cond.of);
    case 'and':
    case 'or':
      return cond.of.some(conditionUsesRandom);
    default:
      return false;
  }
}

export function conditionToJson(cond: EffectCondition): JsonValue {
  return JSON.parse(JSON.stringify(cond)) as JsonValue;
}
