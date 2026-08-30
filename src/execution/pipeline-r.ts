/**
 * R 节点：动作期干预（B2 落地 / §7.3）。
 *
 * 职责明确为两件事：**解析转向** + **生成逐目标结算计划**。它不执行结算。
 *
 *   for each original in committedTargets:
 *       candidates ← original 自身的 RedirectRule
 *                  ∪ 存活友军中保护范围命中 original 的 RedirectRule
 *       winner ← priority 最高者
 *       final ← resolveTarget(winner)
 *       单跳：final 不再二次触发其自身 RedirectRule（visited 防环）
 *       if 涉及伤害: settlementPlan[original] ← computeDamage(final 自己的护甲与减伤)
 *
 * 不变量：
 * - INV-E1：转向单跳，用 visited 集防环。
 * - INV-E2：伤害随转向走（用最终目标的防御）；状态类效果留原目标。
 * - INV-E3：群攻是 N 条独立结算链，不是"一次算总再分摊"。
 */

import type { InstanceId, UnitId } from '../shared/ids.js';
import type { SourceFilter } from '../shared/enums.js';
import type { EffectRef } from '../catalog/model.js';
import type { RedirectRule } from '../catalog/model.js';
import type { Unit } from '../roster/unit.js';
import type { Coordinate } from '../battle/coordinate.js';
import type { DamageResult } from '../effect/damage-chain.js';
import { resolveDamage } from '../effect/damage-chain.js';
import type { ResolvedTarget } from './target.js';
import { targetKey } from './target.js';

export interface RedirectStep {
  readonly from: ResolvedTarget;
  readonly to: ResolvedTarget;
  readonly sourceId: InstanceId;
  readonly priority: number;
}

export interface RNodeOutcome {
  readonly finalTargets: readonly ResolvedTarget[];
  readonly redirectLog: readonly RedirectStep[];
  /** key = `${targetKey}:${effectRefId}` */
  readonly settlementPlan: ReadonlyMap<string, DamageResult>;
}

export interface RNodeDeps {
  readonly unit: (id: UnitId) => Unit | undefined;
  readonly units: () => readonly Unit[];
  readonly formulas: Parameters<typeof resolveDamage>[2];
}

interface RuleCandidate {
  readonly protector: Unit;
  readonly rule: RedirectRule;
  readonly sourceId: InstanceId;
}

function sourceMatches(filter: SourceFilter, source: SourceFilter): boolean {
  return filter === 'any' || filter === source;
}

/** 守卫姿态：同路且 index 大于自己（即身后）的全部单位。 */
function protectsByCoordRelation(protector: Unit, original: Coordinate | null): boolean {
  if (!original || !protector.position) return false;
  return protector.position.lane === original.lane && original.index > protector.position.index;
}

function protectedUnitIdOf(protector: Unit, sourceId: InstanceId): UnitId | null {
  const inst = protector.statuses.get(sourceId);
  return inst?.binding?.guardTarget ?? null;
}

/** 解析转向后的最终坐标。 */
function resolveFinalCoord(
  rule: RedirectRule,
  protector: Unit,
  caster: Unit,
  deps: RNodeDeps,
): Coordinate | null {
  switch (rule.to) {
    case 'self':
      return protector.position;
    case 'attacker':
      return caster.position;
    case 'transfer_target': {
      const inst = protector.statuses.all().find((s) => s.binding?.transferTarget);
      const targetId = inst?.binding?.transferTarget;
      if (!targetId) return protector.position;
      return deps.unit(targetId)?.position ?? protector.position;
    }
    default:
      return protector.position;
  }
}

export function resolveRedirectNode(
  caster: Unit,
  committed: readonly ResolvedTarget[],
  effects: readonly EffectRef[],
  source: SourceFilter,
  causeIsStatus: boolean,
  deps: RNodeDeps,
): RNodeOutcome {
  const redirectLog: RedirectStep[] = [];
  const settlementPlan = new Map<string, DamageResult>();
  const visited = new Set<string>();
  const finals: ResolvedTarget[] = [];

  for (const original of committed) {
    const originalUnit = original.occupantId === null ? null : (deps.unit(original.occupantId) ?? null);

    const candidates: RuleCandidate[] = [];

    if (originalUnit) {
      for (const { sourceId, rule } of originalUnit.redirectRules()) {
        // 自身规则只在"把伤害转走"时有意义（transfer_target / attacker）。
        if (rule.to === 'self') continue;
        if (!sourceMatches(rule.sourceFilter, source)) continue;
        candidates.push({ protector: originalUnit, rule, sourceId });
      }
    }

    // 友军保护规则（守护 / 守卫姿态）
    for (const ally of deps.units()) {
      if (!ally.isAlive || ally.id === originalUnit?.id) continue;
      if (originalUnit && ally.faction !== originalUnit.faction) continue;
      for (const { sourceId, rule } of ally.redirectRules()) {
        if (rule.to !== 'self') continue;
        if (!sourceMatches(rule.sourceFilter, source)) continue;
        const sel = rule.protectedSelector;
        if (!sel) continue;
        if (sel.kind === 'unit_ref') {
          if (protectedUnitIdOf(ally, sourceId) !== (original.occupantId ?? null)) continue;
        } else if (sel.relation === 'same_lane_behind') {
          if (!protectsByCoordRelation(ally, original.coord)) continue;
        }
        candidates.push({ protector: ally, rule, sourceId });
      }
    }

    visited.add(targetKey(original));

    let finalTarget: ResolvedTarget = original;
    if (candidates.length > 0) {
      // 同优先级按 sourceId 字典序，保证确定性。
      const winner = [...candidates].sort(
        (a, b) => b.rule.priority - a.rule.priority || a.sourceId.localeCompare(b.sourceId),
      )[0]!;
      const coord = resolveFinalCoord(winner.rule, winner.protector, caster, deps);
      if (coord) {
        const key = `${coord.faction}/${coord.lane}/${coord.index}`;
        if (!visited.has(key)) {
          const finalOccupant = winner.protector.id === (original.occupantId ?? null)
            ? original.occupantId
            : winner.protector.id;
          finalTarget = { coord, occupantId: finalOccupant };
          redirectLog.push({
            from: original,
            to: finalTarget,
            sourceId: winner.sourceId,
            priority: winner.rule.priority,
          });
          visited.add(key);
        }
      }
    }

    finals.push(finalTarget);

    // INV-E3：每个 original 都是一条独立结算链，各自用自己的最终目标重算。
    for (const ref of effects) {
      if (!isDamageLike(ref)) continue;
      const plan = computePlan(caster, finalTarget, ref, causeIsStatus, deps);
      if (plan) settlementPlan.set(`${targetKey(finalTarget)}:${ref.ref}`, plan);
    }
  }

  // 去重（群攻可能多条链落到同一最终目标）。
  const seen = new Set<string>();
  const uniqueFinals: ResolvedTarget[] = [];
  for (const t of finals) {
    const k = targetKey(t);
    if (seen.has(k)) continue;
    seen.add(k);
    uniqueFinals.push(t);
  }

  return { finalTargets: uniqueFinals, redirectLog, settlementPlan };
}

function isDamageLike(ref: EffectRef): boolean {
  return ref.ref.includes('damage') || ref.ref.includes('drain');
}

function computePlan(
  caster: Unit,
  finalTarget: ResolvedTarget,
  ref: EffectRef,
  causeIsStatus: boolean,
  deps: RNodeDeps,
): DamageResult | null {
  const defender = finalTarget.occupantId === null ? null : (deps.unit(finalTarget.occupantId) ?? null);
  if (!defender || !defender.isAlive) return null;
  const element = ((ref.params?.element as never) ?? 'none') as DamageResult['element'];
  const ratio = typeof ref.params?.['ratio'] === 'number' ? (ref.params['ratio'] as number) : 1;
  return resolveDamage(
    {
      raw: caster.attack * ratio,
      element,
      attacker: caster,
      defender,
      bypassArmor: false,
      enterGeneralMultiplier: !causeIsStatus,
    },
    undefined,
    deps.formulas,
  );
}
