// 确定性 id 生成器（移植自 7e6d01f:src/shared/ids.ts 的 SequentialIdGenerator）。
// 唯一计数源；可快照/恢复，配合 Placement 回滚。

export interface IdGenerator {
  next(prefix: string): string
  snapshot(): Record<string, number>
  restore(s: Record<string, number>): void
}

export class SequentialIdGenerator implements IdGenerator {
  private counters = new Map<string, number>()

  next(prefix: string): string {
    const n = (this.counters.get(prefix) ?? 0) + 1
    this.counters.set(prefix, n)
    return `${prefix}#${n}`
  }

  snapshot(): Record<string, number> {
    const out: Record<string, number> = {}
    for (const [k, v] of [...this.counters.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1))) out[k] = v
    return out
  }

  restore(s: Record<string, number>): void {
    this.counters = new Map(Object.entries(s))
  }
}
