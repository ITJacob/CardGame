/**
 * 属性三层模型（§5.2）。
 *
 *   AttributeSet ──公式──► BaseProfile ──┐
 *                                        ├──► EffectiveProfile（有效值）
 *      modifiers（修正集合）──────────────┘
 *                       ▲
 *                       │ 写入 / 回滚
 *                 StatProvenance（溯源账本）
 *
 * 把"修正"独立成层，是为了让任何属性都能被持续修正并按来源撤销，
 * 而不需要在属性本身里塞撤销逻辑。
 *
 * 抗性不是一个特殊属性：它走与攻防完全相同的三层与同一套 StatProvenance，
 * 只是按元素分槽（六个元素 → 六个槽）。
 */

import type { InstanceId } from '../shared/ids.js';
import type { Element, StatKey } from '../shared/enums.js';
import { isResistanceStat, resistanceElementOf, RESISTANCE_ELEMENTS } from '../shared/enums.js';
import type { FormulaConfig, BaseProfile } from '../catalog/balance.js';

export type ResistanceMap = Readonly<Record<Element, number>>;

export function zeroResistances(): ResistanceMap {
  const out = {} as Record<Element, number>;
  for (const e of RESISTANCE_ELEMENTS) out[e] = 0;
  return out;
}

/** 一条属性修正。修正只记"增量"，撤销靠恢复 slot 的旧值（INV-P2）。 */
export interface ModifierEntry {
  readonly stat: StatKey;
  readonly sourceId: InstanceId;
  readonly delta: number;
}

/**
 * 修正层：Map<stat, Map<sourceId, delta>>。
 *
 * 这么存是为了让"同来源重复写同一属性"也能精确回滚——
 * 直接记一个总和的话，revertBySource 只能"减去写入量"，
 * 而多条修正叠加时它与"恢复到写入前的值"并不相等（INV-P2）。
 */
export class ModifierLayer {
  private readonly byStat = new Map<StatKey, Map<InstanceId, number>>();

  /** 写入（覆盖）某个 (stat, sourceId) 槽，返回被覆盖掉的旧值。 */
  set(stat: StatKey, sourceId: InstanceId, delta: number): number | null {
    let slot = this.byStat.get(stat);
    if (!slot) {
      slot = new Map();
      this.byStat.set(stat, slot);
    }
    const prev = slot.has(sourceId) ? (slot.get(sourceId) as number) : null;
    slot.set(sourceId, delta);
    return prev;
  }

  /** 移除某个 (stat, sourceId) 槽，返回被移除的值。 */
  delete(stat: StatKey, sourceId: InstanceId): number | null {
    const slot = this.byStat.get(stat);
    if (!slot || !slot.has(sourceId)) return null;
    const prev = slot.get(sourceId) as number;
    slot.delete(sourceId);
    if (slot.size === 0) this.byStat.delete(stat);
    return prev;
  }

  /** 恢复某个槽到给定旧值；oldValue 为 null 表示原本不存在，直接删除。 */
  restore(stat: StatKey, sourceId: InstanceId, oldValue: number | null): void {
    if (oldValue === null) this.delete(stat, sourceId);
    else this.set(stat, sourceId, oldValue);
  }

  deltaOf(stat: StatKey): number {
    const slot = this.byStat.get(stat);
    if (!slot) return 0;
    let sum = 0;
    for (const d of slot.values()) sum += d;
    return sum;
  }

  entries(): readonly ModifierEntry[] {
    const out: ModifierEntry[] = [];
    for (const [stat, slot] of this.byStat) {
      for (const [sourceId, delta] of slot) out.push({ stat, sourceId, delta });
    }
    return out;
  }

  sources(): readonly InstanceId[] {
    const s = new Set<InstanceId>();
    for (const slot of this.byStat.values()) for (const id of slot.keys()) s.add(id);
    return [...s];
  }

  statsOf(sourceId: InstanceId): readonly StatKey[] {
    const out: StatKey[] = [];
    for (const [stat, slot] of this.byStat) if (slot.has(sourceId)) out.push(stat);
    return out;
  }
}

/** 各属性的钳制规则（A18：抗性 [-50%, +75%]；A24：gauge 三维度钳制下限）。 */
export function clampStat(stat: StatKey, value: number, f: FormulaConfig): number {
  if (isResistanceStat(stat)) {
    return Math.min(f.resistanceMax, Math.max(f.resistanceMin, value));
  }
  switch (stat) {
    case 'gauge_threshold':
      return Math.max(1, value);
    case 'gauge_rate':
    case 'energy_regen':
      return Math.max(0, value);
    case 'hp_max':
    case 'energy_max':
      return Math.max(1, value);
    case 'armor':
      return Math.max(0, value);
    default:
      return value;
  }
}

export interface EffectiveProfile {
  readonly hpMax: number;
  readonly energyMax: number;
  readonly energyRegen: number;
  readonly gaugeRate: number;
  readonly gaugeThreshold: number;
  readonly attack: number;
  readonly defense: number;
  readonly armorCapacity: number;
}

/** BaseProfile 中某个 StatKey 对应的基础值。 */
export function baseValueOf(base: BaseProfile, stat: StatKey): number {
  switch (stat) {
    case 'attack':
      return base.attack;
    case 'defense':
      return base.defense;
    case 'armor':
      return base.armorCapacity;
    case 'hp_max':
      return base.hpMax;
    case 'energy_max':
      return base.energyMax;
    case 'energy_regen':
      return base.energyRegen;
    case 'gauge_rate':
      return base.gaugeRate;
    case 'gauge_threshold':
      return base.gaugeThreshold;
    default:
      if (isResistanceStat(stat)) return 0; // 基线全 0（A18）
      return 0;
  }
}

/**
 * 单位的有效属性块：base + modifiers，脏时重算。
 *
 * INV-S5：行动周期 = threshold / rate 是派生值，禁止被 modify_stat 直接修正。
 * 因此 StopKey 里没有"行动周期"这一项——要改周期就改两个源属性之一。
 */
export class StatBlock {
  private cache = new Map<StatKey, number>();
  private effCache: EffectiveProfile | null = null;

  constructor(
    readonly base: BaseProfile,
    readonly modifiers: ModifierLayer,
    private readonly formulas: FormulaConfig,
  ) {}

  get formulasRef(): FormulaConfig {
    return this.formulas;
  }

  get(stat: StatKey): number {
    const hit = this.cache.get(stat);
    if (hit !== undefined) return hit;
    const value = clampStat(stat, baseValueOf(this.base, stat) + this.modifiers.deltaOf(stat), this.formulas);
    this.cache.set(stat, value);
    return value;
  }

  /** 逐元素一槽的抗性（A18 钳制在 clampStat 内）。 */
  resistanceOf(element: Element): number {
    if (element === 'none') return 0;
    return this.get(`resist:${element}` as StatKey);
  }

  profile(): EffectiveProfile {
    if (this.effCache) return this.effCache;
    const p: EffectiveProfile = {
      hpMax: this.get('hp_max'),
      energyMax: this.get('energy_max'),
      energyRegen: this.get('energy_regen'),
      gaugeRate: this.get('gauge_rate'),
      gaugeThreshold: this.get('gauge_threshold'),
      attack: this.get('attack'),
      defense: this.get('defense'),
      armorCapacity: this.get('armor'),
    };
    this.effCache = p;
    return p;
  }

  /** 写入 / 回滚修正后必须调用，否则读到脏缓存。 */
  invalidate(stat?: StatKey): void {
    if (stat === undefined) {
      this.cache.clear();
      this.effCache = null;
      return;
    }
    this.cache.delete(stat);
    this.effCache = null;
  }
}

export function elementResistanceStat(element: Element): StatKey {
  return `resist:${element}` as StatKey;
}

export { resistanceElementOf, isResistanceStat };
