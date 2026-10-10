// 战场投影（DESIGN §12）：同一份 Coordinate 按朝向映射到 CSS Grid 的位置。
// 横屏：左我右敌（8 列 × 2 行）；竖屏：下我上敌（2 列 × 8 行）。两者互为转置。
import { LANE_CAPACITY, LANE_COUNT } from '../../kernel/battle/types'
import type { Coordinate } from '../../kernel/battle/types'

export type Orientation = 'landscape' | 'portrait'

export function orientationOf(width: number, height: number): Orientation {
  return height > width ? 'portrait' : 'landscape'
}

export interface GridSpec {
  columns: number
  rows: number
  /** 每格的 grid-column / grid-row（1 基） */
  place(coord: Coordinate): { col: number; row: number }
}

/**
 * @param ownFaction 我方阵营 id（竖屏在下、横屏在左）
 * @param laneIndex (laneId) => 0|1，决定同一阵营内两路的次序
 */
export function gridSpec(orientation: Orientation, ownFaction: string, laneIndexOf: (lane: string) => number): GridSpec {
  const isOwn = (c: Coordinate): boolean => c.faction === ownFaction
  if (orientation === 'landscape') {
    // 列：我方 1..4（index 0 靠中线=最右）；中线；敌方 5..8（index 0 靠中线=最左）
    return {
      columns: LANE_CAPACITY * LANE_COUNT,
      rows: LANE_COUNT,
      place(c) {
        const row = laneIndexOf(c.lane) + 1
        const col = isOwn(c) ? LANE_CAPACITY - c.index : LANE_CAPACITY + 1 + c.index
        return { col, row }
      },
    }
  }
  // 竖屏：行 1..4 敌方（index 0 靠中线=最下，即第 4 行），行 5..8 我方（index 0 靠中线=第 5 行）
  return {
    columns: LANE_COUNT,
    rows: LANE_CAPACITY * LANE_COUNT,
    place(c) {
      const col = laneIndexOf(c.lane) + 1
      const row = isOwn(c) ? LANE_CAPACITY + 1 + c.index : LANE_CAPACITY - c.index
      return { col, row }
    },
  }
}

/** 由战场里出现过的 lane 名生成稳定次序 */
export function laneIndexer(lanes: readonly string[]): (lane: string) => number {
  const sorted = [...new Set(lanes)].sort()
  return (lane) => {
    const i = sorted.indexOf(lane)
    return i < 0 ? 0 : i
  }
}
