// 队列坍缩（移植自 7e6d01f:src/battle/collapse.ts）。
// 契约：取非空 occupant、保序、从 index 0 依次填回、余置 null。幂等、保序。
// 占用恒为前缀 {0..k-1}（无内部空洞）。

import type { Occupant } from './coordinate'

export function collapseLane(slots: readonly Occupant[]): Occupant[] {
  const occupied = slots.filter((o): o is string => o != null)
  const out: Occupant[] = new Array(slots.length).fill(null)
  for (let i = 0; i < occupied.length && i < out.length; i += 1) out[i] = occupied[i] as string
  return out
}

export function isCompact(slots: readonly Occupant[]): boolean {
  let seenEmpty = false
  for (const o of slots) {
    if (o == null) seenEmpty = true
    else if (seenEmpty) return false
  }
  return true
}

export function occupancyCount(slots: readonly Occupant[]): number {
  let n = 0
  for (const o of slots) if (o != null) n += 1
  return n
}
