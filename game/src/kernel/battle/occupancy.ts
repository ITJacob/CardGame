// 占位 diff（移植自 7e6d01f:src/battle/occupancy.ts）。
// 以「单位」为视角：after 有而 before 无（或位置不同）= 进入；反之为离开。
// 输出确定性排序（faction/lane/index/unitId）。

import type { UnitId } from '../ids'
import type { OccupancyChanged } from './types'
import { compareCoord } from './coordinate'
import type { Coordinate } from './types'

export interface OccupancyEntry {
  readonly unitId: UnitId
  readonly coord: Coordinate
}

export interface OccupancyDiff {
  readonly entered: readonly OccupancyEntry[]
  readonly left: readonly OccupancyEntry[]
  readonly moves: readonly { unitId: UnitId; from: Coordinate; to: Coordinate }[]
}

export const EMPTY_DIFF: OccupancyDiff = { entered: [], left: [], moves: [] }

function sortEntries(entries: OccupancyEntry[]): OccupancyEntry[] {
  return [...entries].sort((a, b) => {
    const c = compareCoord(a.coord, b.coord)
    if (c !== 0) return c
    return a.unitId < b.unitId ? -1 : a.unitId > b.unitId ? 1 : 0
  })
}

export function diffOccupancy(before: readonly OccupancyEntry[], after: readonly OccupancyEntry[]): OccupancyDiff {
  const beforeMap = new Map(before.map((e) => [e.unitId, e.coord]))
  const afterMap = new Map(after.map((e) => [e.unitId, e.coord]))

  const entered: OccupancyEntry[] = []
  const left: OccupancyEntry[] = []
  const moves: { unitId: UnitId; from: Coordinate; to: Coordinate }[] = []

  for (const [unitId, to] of afterMap) {
    const from = beforeMap.get(unitId)
    if (!from) entered.push({ unitId, coord: to })
    else if (compareCoord(from, to) !== 0) movedPush(moves, unitId, from, to)
  }
  for (const [unitId, from] of beforeMap) {
    if (!afterMap.has(unitId)) left.push({ unitId, coord: from })
  }

  return { entered: sortEntries(entered), left: sortEntries(left), moves }
}

function movedPush(
  moves: { unitId: UnitId; from: Coordinate; to: Coordinate }[],
  unitId: UnitId,
  from: Coordinate,
  to: Coordinate,
): void {
  moves.push({ unitId, from, to })
}

export function hasChanges(diff: OccupancyDiff): boolean {
  return diff.entered.length > 0 || diff.left.length > 0 || diff.moves.length > 0
}

/** 转成 IDL 的 OccupancyChanged 形状（enter/exit），供 Zone 监听。 */
export function toOccupancyChanged(diff: OccupancyDiff): OccupancyChanged {
  return {
    enter: diff.entered.map((e) => ({ unitId: e.unitId, coord: e.coord })),
    exit: diff.left.map((e) => ({ unitId: e.unitId, coord: e.coord })),
  }
}
