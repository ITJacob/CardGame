// 可播种、可快照的随机源（随机性治理 R1–R6）。
// 移植自 7e6d01f:src/random/random-source.ts（mulberry32），零依赖。
// 唯一抽样入口 next()；chance 是内核中唯一允许的随机使用点（R5）。

export interface RandomState {
  readonly seed: number
  /** 当前内部状态（非初始 seed） */
  readonly s: number
  readonly cursor: number
}

export interface RandomSource {
  readonly seed: number
  next(): number
  int(maxExclusive: number): number
  chance(p: number): boolean
  snapshot(): RandomState
  restore(state: RandomState): void
}

export class Mulberry32RandomSource implements RandomSource {
  private s: number
  private cursor = 0

  constructor(readonly seed: number) {
    this.s = (seed ^ 0x9e3779b9) >>> 0
  }

  next(): number {
    this.cursor += 1
    this.s = (this.s + 0x6d2b79f5) >>> 0
    let t = this.s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  int(maxExclusive: number): number {
    if (maxExclusive <= 0) return 0
    return Math.floor(this.next() * maxExclusive)
  }

  chance(p: number): boolean {
    if (p <= 0) return false
    if (p >= 1) return true
    return this.next() < p
  }

  snapshot(): RandomState {
    return { seed: this.seed, s: this.s, cursor: this.cursor }
  }

  restore(state: RandomState): void {
    this.s = state.s
    this.cursor = state.cursor
  }
}

export interface RandomUsageRecord {
  readonly key: string
  readonly samples: number
  readonly params: Readonly<Record<string, number | string>>
}

/** 登记制（R3）：审计可筛出所有引入随机的点。 */
export class RandomUsageRegistry {
  private readonly records = new Map<string, { samples: number; params: Record<string, number | string> }>()

  record(key: string, params: Readonly<Record<string, number | string>> = {}): void {
    const k = `${key}|${JSON.stringify(params)}`
    const existing = this.records.get(k)
    if (existing) existing.samples += 1
    else this.records.set(k, { samples: 1, params: { ...params } })
  }

  list(): readonly RandomUsageRecord[] {
    return [...this.records.entries()].map(([key, v]) => ({ key, samples: v.samples, params: v.params }))
  }
}
