/**
 * 参数层数值口径（03_参数层 §2）。
 *
 * 集中在这里的意义：INV-C2 要求数值单点定义，且 INV-C3 要求战斗启动时把它们
 * 连同 Def 一起快照进战斗实例。改这里不影响进行中的战斗。
 */

import type { AttributeSet } from './model.js';

export interface FormulaConfig {
  // —— 单位与派生（§2.1）——
  readonly hpBase: number;
  readonly hpPerStrength: number;
  readonly energyMax: number;
  readonly energyRegenBase: number;
  readonly energyRegenPerIntellect: number;
  readonly gaugeRateBase: number;
  readonly gaugeRatePerAgility: number;
  readonly gaugeThreshold: number;
  readonly attackBase: number;
  readonly attackPerStrength: number;
  readonly defenseBase: number;
  readonly armorBase: number;

  // —— 调度（§2.2）——
  /** 主动行为的默认精力成本。默认纪律：等于 gaugeThreshold（A2）。 */
  readonly activeGaugeCost: number;

  // —— 伤害链（§2.6 / §2.7 / A14 / A18）——
  /** 下限钳制：最终伤害的最低保底。 */
  readonly minDamage: number;
  /** 抗性钳制 [-50%, +75%]（A18）。 */
  readonly resistanceMin: number;
  readonly resistanceMax: number;
  /** 易伤 ×1.3（A14）。 */
  readonly vulnerabilityMultiplier: number;
  /** 坚守 ×0.7。 */
  readonly fortifyMultiplier: number;
  /** 技能伤害基准：1.2 × 能量（§2.1）。 */
  readonly skillDamagePerEnergy: number;

  // —— 击退（§2.3 / A24）——
  /** 击退收益 50/n tick；n 的含义见参数层回填清单第 31 项，此处取"所在路单位数"。 */
  readonly knockbackAmount: number;
}

export const DEFAULT_FORMULAS: FormulaConfig = {
  hpBase: 30,
  hpPerStrength: 10,
  energyMax: 50,
  energyRegenBase: 0.2,
  energyRegenPerIntellect: 0.2,
  gaugeRateBase: 15,
  gaugeRatePerAgility: 8,
  gaugeThreshold: 75,
  attackBase: 2,
  attackPerStrength: 1,
  defenseBase: 0,
  armorBase: 0,

  activeGaugeCost: 75,

  minDamage: 0,
  resistanceMin: -0.5,
  resistanceMax: 0.75,
  vulnerabilityMultiplier: 1.3,
  fortifyMultiplier: 0.7,
  skillDamagePerEnergy: 1.2,

  knockbackAmount: 50,
};

/** AttributeSet → BaseProfile 的派生（§2.1）。战斗内只算一次并缓存。 */
export interface BaseProfile {
  readonly hpMax: number;
  readonly energyMax: number;
  readonly energyRegen: number;
  readonly gaugeRate: number;
  readonly gaugeThreshold: number;
  readonly attack: number;
  readonly defense: number;
  readonly armorCapacity: number;
}

export function deriveBaseProfile(attrs: AttributeSet, f: FormulaConfig): BaseProfile {
  return {
    hpMax: f.hpBase + f.hpPerStrength * attrs.strength,
    energyMax: f.energyMax,
    energyRegen: f.energyRegenBase + f.energyRegenPerIntellect * attrs.intellect,
    gaugeRate: f.gaugeRateBase + f.gaugeRatePerAgility * attrs.agility,
    gaugeThreshold: f.gaugeThreshold,
    attack: f.attackBase + f.attackPerStrength * attrs.strength,
    defense: f.defenseBase,
    armorCapacity: f.armorBase,
  };
}

/** 行动周期 = threshold / rate（INV-S5：派生值，禁止被直接修正）。 */
export function actionCycleOf(base: BaseProfile): number {
  return base.gaugeThreshold / base.gaugeRate;
}
