// 修正层与抗性基线。ModifierLayer 按 (stat, sourceId) 存净增量槽。
import type { StatKey } from '../ids'
import type { ModifierEntry, ModifierLayer, ResistanceSet } from './types'

export class StatModifiers implements ModifierLayer {
  private readonly slots = new Map<StatKey, Map<string, number>>()

  set(stat: StatKey, sourceId: string, value: number): number | null {
    let m = this.slots.get(stat)
    if (!m) {
      m = new Map()
      this.slots.set(stat, m)
    }
    const prev = m.has(sourceId) ? (m.get(sourceId) as number) : null
    m.set(sourceId, value)
    return prev
  }

  restore(stat: StatKey, sourceId: string, prev: number | null): void {
    const m = this.slots.get(stat)
    if (!m) return
    if (prev === null) m.delete(sourceId)
    else m.set(sourceId, prev)
  }

  deltaOf(stat: StatKey): number {
    const m = this.slots.get(stat)
    if (!m) return 0
    let sum = 0
    for (const v of m.values()) sum += v
    return sum
  }

  sources(): string[] {
    const set = new Set<string>()
    for (const m of this.slots.values()) for (const k of m.keys()) set.add(k)
    return [...set].sort()
  }

  entriesOf(stat: StatKey): ModifierEntry[] {
    const m = this.slots.get(stat)
    if (!m) return []
    return [...m.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1)).map(([sourceId, value]) => ({ stat, sourceId, value }))
  }
}

/** 八元素抗性基线全 0 */
export function zeroResistances(): ResistanceSet {
  return { fire: 0, ice: 0, poison: 0, lightning: 0, mental: 0, physical: 0, holy: 0, dark: 0 }
}
