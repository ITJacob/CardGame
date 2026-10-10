// StatProvenance 溯源账本（移植自 7e6d01f:src/roster/provenance.ts）。
// 溯源键是实例 ID：同种状态的两个实例各自记账、各自撤销。
// INV-P2：revertBySource 恢复到「该来源写入前的值」，而非「减去写入量」。

import type { InstanceId, StatKey } from '../ids'
import type { ModifierLayer, ProvenanceEntry } from './types'

export type { ProvenanceEntry }

export class StatProvenance {
  private entries: ProvenanceEntry[] = []

  constructor(
    private readonly modifiers: ModifierLayer,
    private readonly onStatChanged: (stat: StatKey) => void,
  ) {}

  apply(stat: StatKey, delta: number, sourceId: InstanceId): ProvenanceEntry {
    return this.write(stat, delta, sourceId, null)
  }

  applyTimed(stat: StatKey, delta: number, sourceId: InstanceId, duration: number): ProvenanceEntry {
    return this.write(stat, delta, sourceId, Math.max(0, Math.floor(duration)))
  }

  private write(stat: StatKey, delta: number, sourceId: InstanceId, remaining: number | null): ProvenanceEntry {
    const slotPrevious = this.modifiers.set(stat, sourceId, delta)
    const existing = this.entries.find((e) => e.stat === stat && e.sourceId === sourceId)
    const previousDelta = existing ? existing.previousDelta : slotPrevious
    const entry: ProvenanceEntry = { stat, sourceId, appliedDelta: delta, previousDelta, remaining }
    this.entries = this.entries.filter((e) => !(e.stat === stat && e.sourceId === sourceId))
    this.entries.push(entry)
    this.onStatChanged(stat)
    return entry
  }

  revertBySource(sourceId: InstanceId): readonly ProvenanceEntry[] {
    const mine = this.entries.filter((e) => e.sourceId === sourceId)
    for (let i = mine.length - 1; i >= 0; i -= 1) {
      const e = mine[i] as ProvenanceEntry
      this.modifiers.restore(e.stat, e.sourceId, e.previousDelta)
      this.onStatChanged(e.stat)
    }
    if (mine.length > 0) this.entries = this.entries.filter((e) => e.sourceId !== sourceId)
    return mine
  }

  revertAll(): void {
    for (const sourceId of this.modifiers.sources()) this.revertBySource(sourceId)
    this.entries = []
  }

  /** tick 第 6 步：递减带时限条目，到期者按来源整组回滚。 */
  tick(): readonly ProvenanceEntry[] {
    const expired = new Set<InstanceId>()
    for (const e of this.entries) {
      if (e.remaining === null) continue
      e.remaining -= 1
      if (e.remaining <= 0) expired.add(e.sourceId)
    }
    if (expired.size === 0) return []
    const out: ProvenanceEntry[] = []
    for (const sourceId of [...expired].sort()) out.push(...this.revertBySource(sourceId))
    return out
  }

  entriesOf(stat: StatKey): readonly ProvenanceEntry[] {
    return this.entries.filter((e) => e.stat === stat)
  }

  get all(): readonly ProvenanceEntry[] {
    return this.entries
  }
}
