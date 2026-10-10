// 坐标工具（移植自 7e6d01f:src/battle/coordinate.ts）。
import type { FactionId, LaneId, UnitId } from '../ids'
import type { Coordinate } from './types'

export type Occupant = UnitId | null

export function coord(faction: FactionId, lane: LaneId, index: number): Coordinate {
  return { faction, lane, index }
}

/** 稳定字典键：faction/lane/index */
export function coordKey(c: Coordinate): string {
  return `${c.faction}/${c.lane}/${c.index}`
}

export function parseCoordKey(key: string): Coordinate {
  const [faction = '', lane = '', index = '0'] = key.split('/')
  return { faction, lane, index: Number(index) }
}

export function equalsCoord(a: Coordinate, b: Coordinate): boolean {
  return a.faction === b.faction && a.lane === b.lane && a.index === b.index
}

/** 确定性排序：faction → lane → index（lane 按字符串升序） */
export function compareCoord(a: Coordinate, b: Coordinate): number {
  if (a.faction !== b.faction) return a.faction < b.faction ? -1 : 1
  if (a.lane !== b.lane) return a.lane < b.lane ? -1 : 1
  return a.index - b.index
}
