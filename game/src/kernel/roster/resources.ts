// 资源：Gauge（进度型，严格越阈触发）vs Pool（可增减量）。
// 移植自 7e6d01f:src/roster/resources.ts。数值收口 round2，保证回放可比。
// INV-S1：Gauge 触发严格越阈（>）。INV-S4：未消耗的机会不累积。

import type { PoolKey } from '../ids'
import { round2 } from '../shared/result'

export type OverflowPolicy = 'keep' | 'reset'

export interface GaugeAdvanceResult {
  readonly crossed: boolean
  readonly overflow: number
  readonly before: number
  readonly after: number
}

export class Gauge {
  constructor(
    readonly key: string,
    public current: number,
    public rate: number,
    public threshold: number,
    public overflowPolicy: OverflowPolicy = 'keep',
  ) {}

  /** 累积一 tick；只报告越界，不扣减（扣减发生在 commit）。 */
  advance(): GaugeAdvanceResult {
    const before = this.current
    this.current = round2(before + this.rate)
    if (this.current > this.threshold) {
      return { crossed: true, overflow: round2(this.current - this.threshold), before, after: this.current }
    }
    return { crossed: false, overflow: 0, before, after: this.current }
  }

  /** 机会未被消耗时按策略处理越界部分。 */
  settleOverflow(): void {
    if (this.current <= this.threshold) return
    this.current = this.overflowPolicy === 'keep' ? round2(this.current - this.threshold) : 0
  }

  consume(amount: number): number {
    const actual = Math.min(amount, this.current)
    this.current = round2(this.current - actual)
    return actual
  }

  applyDelta(dimension: 'current' | 'rate' | 'threshold', delta: number): number {
    if (dimension === 'current') this.current = round2(Math.max(0, this.current + delta))
    else if (dimension === 'rate') this.rate = Math.max(0, this.rate + delta)
    else this.threshold = Math.max(1, this.threshold + delta)
    return this[dimension]
  }

  setValue(dimension: 'current' | 'rate' | 'threshold', value: number): number {
    if (dimension === 'current') this.current = round2(Math.max(0, value))
    else if (dimension === 'rate') this.rate = Math.max(0, value)
    else this.threshold = Math.max(1, value)
    return this[dimension]
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
    return this.current <= this.min
  }

  applyDelta(delta: number): number {
    const before = this.current
    this.current = round2(Math.min(this.max, Math.max(this.min, before + delta)))
    return round2(this.current - before)
  }

  /** 吸收型阶段用：最多吸收 amount，返回剩余未吸收量。 */
  absorb(amount: number): number {
    const absorbed = Math.min(this.current, amount)
    this.current = round2(this.current - absorbed)
    return amount - absorbed
  }

  setValue(value: number): number {
    const before = this.current
    this.current = round2(Math.min(this.max, Math.max(this.min, value)))
    return round2(this.current - before)
  }

  regenerate(): number {
    return this.applyDelta(this.regen)
  }

  setMax(max: number): void {
    this.max = Math.max(this.min, max)
    if (this.current > this.max) this.current = round2(this.max)
  }
}
