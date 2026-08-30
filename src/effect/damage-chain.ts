/**
 * DamageChain：有序的减伤阶段管道（§8.2）。
 *
 * 建模为管道而不是硬编码两步，是因为"护盾 / 护甲 / 防御 / 抗性 / 易伤"是五笔独立的账，
 * 硬编码会让每加一种机制都要改结算函数。
 *
 * 阶段类型：
 *   吸收型  —— 优先扣减一个消耗性资源池（护盾 / 护甲）
 *   减免型  —— 线性加减（防御；可为负 → 增伤）
 *   抗性型  —— 按防守方对本次伤害元素的抗性做修正（逐元素取槽）
 *   乘区型  —— 乘性修正（易伤 / 坚守；与抗性同乘区加算后统一乘一次）
 *   穿透标记 —— 跳过后续若干阶段（DoT 穿透护甲）
 *   下限钳制 —— 最终结果的下限
 *
 * 不变量：
 * - INV-D1：阶段顺序固定且配置可见，不允许在代码里散落修改。
 * - INV-D2：结算全程无随机；DamageResult 必须可由输入完全复现。
 * - INV-D3：伤害链是纯函数——不改任何状态，只产出 DamageResult；
 *           状态变更由 O 节点依据结果执行。
 * - INV-D4：状态来源的伤害默认不进通用乘区；如需进入必须显式开关。
 */

import type { Element } from '../shared/enums.js';
import type { PoolKey } from '../shared/enums.js';
import type { FormulaConfig } from '../catalog/balance.js';
import type { Unit } from '../roster/unit.js';
import { round2 } from '../shared/result.js';

export type MitigationStageKind = 'absorb' | 'mitigation' | 'resistance' | 'multiplier' | 'pierce' | 'floor';

export type MitigationStageSpec =
  | { readonly kind: 'absorb'; readonly pool: PoolKey }
  | { readonly kind: 'mitigation' }
  | { readonly kind: 'resistance' }
  | { readonly kind: 'multiplier' }
  | { readonly kind: 'pierce'; readonly skipKinds: readonly MitigationStageKind[] }
  | { readonly kind: 'floor' };

/** 默认阶段顺序（配置可见，INV-D1）。 */
export const DEFAULT_DAMAGE_CHAIN: readonly MitigationStageSpec[] = [
  { kind: 'absorb', pool: 'shield' },
  { kind: 'absorb', pool: 'armor' },
  { kind: 'mitigation' },
  { kind: 'resistance' },
  { kind: 'multiplier' },
  { kind: 'floor' },
];

export interface DamageBreakdownEntry {
  readonly stage: string;
  readonly before: number;
  readonly after: number;
}

/** 纯函数的产出：只描述"该扣多少"，不扣任何东西。 */
export interface DamageResult {
  readonly raw: number;
  readonly final: number;
  readonly element: Element;
  /** O 节点据此扣减吸收池。 */
  readonly absorbed: { readonly shield: number; readonly armor: number };
  readonly breakdown: readonly DamageBreakdownEntry[];
}

export interface DamageInput {
  readonly raw: number;
  readonly element: Element;
  readonly attacker: Unit;
  readonly defender: Unit;
  /** 跳过吸收型阶段（DoT 穿透护甲）。 */
  readonly bypassArmor: boolean;
  /**
   * INV-D4：状态来源的伤害默认不进通用乘区。
   * false 时乘区型阶段只吃抗性，不吃易伤 / 坚守等状态乘区。
   */
  readonly enterGeneralMultiplier: boolean;
}

/** 从状态本体的参数里收集乘区贡献（易伤 1.3 / 坚守 0.7 → delta 0.3 / -0.3）。 */
function statusMultiplierDelta(unit: Unit, key: 'damage_taken_mul' | 'damage_dealt_mul'): number {
  let delta = 0;
  for (const inst of unit.statuses.all()) {
    const def = unit.statusDef(inst.defId);
    const raw = def?.params?.[key];
    if (typeof raw === 'number' && Number.isFinite(raw)) {
      delta += (raw - 1) * inst.currentStacks;
    }
  }
  return delta;
}

/**
 * 结算伤害（纯函数）。
 *
 * 抗性阶段与乘区阶段的关系（A14 / §3.10 / §2.7）：
 * 抗性是一个独立阶段（可见于 breakdown、单独钳制 [-50%, +75%]），
 * 但它的贡献会被累加进同一个"乘区桶"，最后统一乘一次——
 * 这样既满足"抗性型插在减免型之后、乘区型之前"，又满足"同乘区加算后统一乘一次"。
 */
export function resolveDamage(
  input: DamageInput,
  chain: readonly MitigationStageSpec[] = DEFAULT_DAMAGE_CHAIN,
  formulas?: FormulaConfig,
): DamageResult {
  const { defender, attacker, element } = input;
  const breakdown: DamageBreakdownEntry[] = [];
  let cur = Math.max(0, input.raw);
  const raw = cur;

  let absorbedShield = 0;
  let absorbedArmor = 0;
  const skipped = new Set<MitigationStageKind>();

  // 通用乘区桶：抗性 + 易伤 / 坚守，加算后统一乘一次。
  let multiplierBucket = 0;

  for (const stage of chain) {
    if (skipped.has(stage.kind)) continue;

    switch (stage.kind) {
      case 'absorb': {
        if (input.bypassArmor) {
          breakdown.push({ stage: `absorb:${stage.pool}(pierced)`, before: cur, after: cur });
          break;
        }
        const available = defender.pool(stage.pool).current;
        const used = Math.min(available, cur);
        if (stage.pool === 'shield') absorbedShield = used;
        if (stage.pool === 'armor') absorbedArmor = used;
        const after = cur - used;
        breakdown.push({ stage: `absorb:${stage.pool}`, before: cur, after });
        cur = after;
        break;
      }

      case 'mitigation': {
        // 减免型：线性加减。防御可为负 → 增伤。
        const after = cur - defender.defense;
        breakdown.push({ stage: 'mitigation', before: cur, after });
        cur = after;
        break;
      }

      case 'resistance': {
        const res = defender.resistanceOf(element);
        const clamped = clampResistance(res, formulas);
        // 抗性 30% → delta -0.3；负抗 -20% → delta +0.2。
        multiplierBucket += -clamped;
        breakdown.push({ stage: `resistance:${element}`, before: cur, after: cur });
        break;
      }

      case 'multiplier': {
        // INV-D4：状态来源的伤害不进"通用乘区"——这里指的是易伤 / 坚守这类
        // 由状态提供的乘区；抗性仍照常生效（它已在上一阶段进了同一个桶）。
        const generalDelta = input.enterGeneralMultiplier
          ? statusMultiplierDelta(defender, 'damage_taken_mul') +
            statusMultiplierDelta(attacker, 'damage_dealt_mul')
          : 0;
        multiplierBucket += generalDelta;
        const factor = Math.max(0, 1 + multiplierBucket);
        const after = cur * factor;
        breakdown.push({
          stage: input.enterGeneralMultiplier ? 'multiplier' : 'multiplier(resistance_only)',
          before: cur,
          after,
        });
        cur = after;
        break;
      }

      case 'pierce': {
        for (const k of stage.skipKinds) skipped.add(k);
        breakdown.push({ stage: 'pierce', before: cur, after: cur });
        break;
      }

      case 'floor': {
        const min = formulas?.minDamage ?? 0;
        const after = Math.max(min, cur);
        breakdown.push({ stage: 'floor', before: cur, after });
        cur = after;
        break;
      }
    }
  }

  return {
    raw,
    final: round2(Math.max(0, cur)),
    element,
    absorbed: { shield: absorbedShield, armor: absorbedArmor },
    breakdown,
  };
}

function clampResistance(v: number, f?: FormulaConfig): number {
  const min = f?.resistanceMin ?? -0.5;
  const max = f?.resistanceMax ?? 0.75;
  return Math.min(max, Math.max(min, v));
}

/** 把 DamageResult 落到单位上（O 节点专用；伤害链本身不改状态，INV-D3）。 */
export function applyDamageResult(defender: Unit, result: DamageResult): number {
  if (result.absorbed.shield > 0) defender.pool('shield').absorb(result.absorbed.shield);
  if (result.absorbed.armor > 0) defender.pool('armor').absorb(result.absorbed.armor);
  return defender.pool('hp').applyDelta(-result.final);
}
