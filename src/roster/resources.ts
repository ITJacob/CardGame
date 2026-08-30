/**
 * 资源：Gauge vs Pool（§5.3，A2 的建模基础）。
 *
 * | 语义       | Gauge：累积到阈值就触发一件事 | Pool：一个可以被增减的量       |
 * | 变更后果   | 越过阈值 → 发事件 + 按策略扣减 | 数值变化；触底 / 触顶可发事件   |
 * | 典型       | 行动条                        | 生命、能量、护盾、护甲          |
 * | 关键性质   | 是"资格"的来源                | 是"成本"与"状态"的载体          |
 *
 * INV-S1：Gauge 触发是严格越过阈值（>，非 ≥）。
 * INV-S5：行动周期 = threshold / rate 是派生值，禁止被直接修正（A24）。
 */

import type { PoolKey } from '../shared/enums.js';
import { round2 } from '../shared/result.js';

/** 资源数值统一收口到两位小数，避免浮点噪声在长战斗里累积（回放可比性）。 */
function snap(value: number): number {
  return round2(value);
}

export type OverflowPolicy = 'keep' | 'reset';

export interface GaugeAdvanceResult {
  readonly crossed: boolean;
  readonly overflow: number;
  readonly before: number;
  readonly after: number;
}

export class Gauge {
  constructor(
    readonly key: string,
    public current: number,
    public rate: number,
    public threshold: number,
    readonly overflowPolicy: OverflowPolicy = 'keep',
  ) {}

  /**
   * 累积一 tick。
   *
   * INV-S1：触发条件是严格越过阈值（>，非 ≥）。
   *
   * ⚠️ 这里**不扣减**进度条——只报告越界。真正的扣减发生在 commit 里
   * （§6.2：`unit.gauge.consume(cost.gaugeAmount)`，默认等于 threshold）。
   * 若在 advance 里就把 current 压成 overflow，那么"成本 = 阈值"将永远付不起，
   * 行动周期也会从 75/31 ≈ 2.4 tick 劣化成"永远差一口气"。
   * 未被消耗的机会由 settleOverflow() 按策略处理（INV-S4：不累积到下一 tick）。
   */
  advance(): GaugeAdvanceResult {
    const before = this.current;
    this.current = snap(before + this.rate);
    if (this.current > this.threshold) {
      const overflow = snap(this.current - this.threshold);
      return { crossed: true, overflow, before, after: this.current };
    }
    return { crossed: false, overflow: 0, before, after: this.current };
  }

  /**
   * 机会未被消耗时按策略处理越界部分（INV-S4）。
   * Keep = 只保留超出阈值的部分（等价于"这一轮白等了"）；
   * Reset = 直接清零。
   */
  settleOverflow(): void {
    if (this.current <= this.threshold) return;
    this.current =
      this.overflowPolicy === 'keep' ? snap(this.current - this.threshold) : 0;
  }

  /** 消耗（A2 的成本校验用）。返回实际扣减量。 */
  consume(amount: number): number {
    const actual = Math.min(amount, this.current);
    this.current = snap(this.current - actual);
    return actual;
  }

  /** 可被效果修改的三个维度（A24），各自带钳制下限。 */
  applyDelta(dimension: 'current' | 'rate' | 'threshold', delta: number): number {
    switch (dimension) {
      case 'current':
        this.current = snap(Math.max(0, this.current + delta));
        return this.current;
      case 'rate':
        this.rate = Math.max(0, this.rate + delta);
        return this.rate;
      case 'threshold':
        this.threshold = Math.max(1, this.threshold + delta);
        return this.threshold;
    }
  }

  setValue(dimension: 'current' | 'rate' | 'threshold', value: number): number {
    switch (dimension) {
      case 'current':
        this.current = snap(Math.max(0, value));
        return this.current;
      case 'rate':
        this.rate = Math.max(0, value);
        return this.rate;
      case 'threshold':
        this.threshold = Math.max(1, value);
        return this.threshold;
    }
  }

  snapshot(): { current: number; rate: number; threshold: number } {
    return { current: this.current, rate: this.rate, threshold: this.threshold };
  }

  restore(s: { current: number; rate: number; threshold: number }): void {
    this.current = s.current;
    this.rate = s.rate;
    this.threshold = s.threshold;
  }
}

export class Pool {
  constructor(
    readonly key: PoolKey,
    public current: number,
    public min: number,
    public max: number,
    public regen: number,
  ) {}

  get isEmpty(): boolean {
    return this.current <= this.min;
  }

  /** 增减并钳制在 [min, max]。返回实际变化量。 */
  applyDelta(delta: number): number {
    const before = this.current;
    this.current = snap(Math.min(this.max, Math.max(this.min, before + delta)));
    return snap(this.current - before);
  }

  /** 吸收型阶段用：最多吸收 amount，返回剩余未吸收量（§8.2）。 */
  absorb(amount: number): number {
    const absorbed = Math.min(this.current, amount);
    this.current -= absorbed;
    return amount - absorbed;
  }

  setValue(value: number): number {
    const before = this.current;
    this.current = snap(Math.min(this.max, Math.max(this.min, value)));
    return snap(this.current - before);
  }

  /** tick 内的自然恢复（第 3 步）。 */
  regenerate(): number {
    return this.applyDelta(this.regen);
  }

  setMax(max: number): void {
    this.max = Math.max(this.min, max);
    if (this.current > this.max) this.current = this.max;
  }

  snapshot(): { current: number; min: number; max: number; regen: number } {
    return { current: this.current, min: this.min, max: this.max, regen: this.regen };
  }

  restore(s: { current: number; min: number; max: number; regen: number }): void {
    this.current = s.current;
    this.min = s.min;
    this.max = s.max;
    this.regen = s.regen;
  }
}
