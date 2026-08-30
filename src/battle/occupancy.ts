/**
 * 占位关系变化的 diff 模型（§4.5）。
 *
 * 进入判定用 before / after 两张战场快照做 diff：
 * 凡在 after 中处于某坐标、且在 before 中不处于该坐标者，判定为进入。
 * 坍缩导致的落入视同进入；同坐标换人（A 死 B 补位）也判定为进入。
 */

import type { UnitId } from '../shared/ids.js';
import type { Coordinate } from './coordinate.js';

/** 单位在某坐标上的进 / 出记录。 */
export interface OccupancyEntry {
  readonly unitId: UnitId;
  readonly coord: Coordinate;
}

/** 单位坐标迁移记录，用于刷新 Unit.position 投影（INV-B4 / INV-B5）。 */
export interface ProjectionMove {
  readonly unitId: UnitId;
  readonly from: Coordinate | null;
  readonly to: Coordinate | null;
}

export interface OccupancyDiff {
  readonly entered: readonly OccupancyEntry[];
  readonly left: readonly OccupancyEntry[];
  readonly moves: readonly ProjectionMove[];
}

export const EMPTY_DIFF: OccupancyDiff = { entered: [], left: [], moves: [] };

/**
 * 计算 before / after 两张快照的占位 diff。
 *
 * 以"单位"为视角而非"格子"为视角——这样同坐标换人会同时产出
 * A 离开 (f,l,0) 与 B 进入 (f,l,0)，正好匹配 Zone 的语义。
 */
export function diffOccupancy(
  before: ReadonlyMap<UnitId, Coordinate>,
  after: ReadonlyMap<UnitId, Coordinate>,
): OccupancyDiff {
  const entered: OccupancyEntry[] = [];
  const left: OccupancyEntry[] = [];
  const moves: ProjectionMove[] = [];
  const units = new Set<UnitId>([...before.keys(), ...after.keys()]);

  for (const unitId of units) {
    const b = before.get(unitId) ?? null;
    const a = after.get(unitId) ?? null;
    if (a !== null && (b === null || !sameCoordinate(b, a))) entered.push({ unitId, coord: a });
    if (b !== null && (a === null || !sameCoordinate(b, a))) left.push({ unitId, coord: b });
    if (b !== a) moves.push({ unitId, from: b, to: a });
  }

  // 保持确定性：按 (faction, lane, index, unitId) 排序，避免依赖 Map 迭代顺序。
  const cmp = (x: OccupancyEntry, y: OccupancyEntry): number =>
    compareCoord(x.coord, y.coord) || compareId(x.unitId, y.unitId);
  entered.sort(cmp);
  left.sort(cmp);
  moves.sort((x, y) => compareMove(x, y));

  return { entered, left, moves };
}

function sameCoordinate(a: Coordinate, b: Coordinate): boolean {
  return a.faction === b.faction && a.lane === b.lane && a.index === b.index;
}

export function compareCoord(a: Coordinate, b: Coordinate): number {
  return (
    compareId(a.faction, b.faction) || compareId(a.lane, b.lane) || a.index - b.index
  );
}

function compareId(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

function compareMove(a: ProjectionMove, b: ProjectionMove): number {
  const key = (m: ProjectionMove): string =>
    `${m.unitId}|${m.from ? `${m.from.faction}/${m.from.lane}/${m.from.index}` : '-'}|${
      m.to ? `${m.to.faction}/${m.to.lane}/${m.to.index}` : '-'
    }`;
  return compareId(key(a), key(b));
}

export function hasChanges(diff: OccupancyDiff): boolean {
  return diff.entered.length > 0 || diff.left.length > 0 || diff.moves.length > 0;
}
