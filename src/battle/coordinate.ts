/**
 * Coordinate：全局唯一、结构稳定的坐标值对象（§4.1）。
 *
 * 关键性质：坐标不随任何单位迁移而改变，可比较、可作字典键。
 * index 0 = 对峙前线，向队尾递增。
 */

import type { FactionId, LaneId, UnitId } from '../shared/ids.js';

export interface Coordinate {
  readonly faction: FactionId;
  readonly lane: LaneId;
  readonly index: number;
}

export function coord(faction: FactionId, lane: LaneId, index: number): Coordinate {
  return { faction, lane, index };
}

/** 稳定字符串键，用于 Map 索引。 */
export function coordKey(c: Coordinate): string {
  return `${c.faction}/${c.lane}/${c.index}`;
}

export function parseCoordKey(key: string): Coordinate {
  const [faction, lane, index] = key.split('/');
  return { faction: faction ?? '', lane: lane ?? '', index: Number(index) };
}

export function equalsCoord(a: Coordinate, b: Coordinate): boolean {
  return a.faction === b.faction && a.lane === b.lane && a.index === b.index;
}

export type Occupant = UnitId | null;
