/**
 * ResolvedTarget：I 节点的产出物（§7.3）。
 *
 * 核心语义：产出物是**坐标**，occupant 仅是该坐标在结算时刻的租客，可以为 null。
 * 空坐标是合法目标——召唤依赖此。
 */

import type { UnitId } from '../shared/ids.js';
import type { Coordinate } from '../battle/coordinate.js';

export interface ResolvedTarget {
  readonly coord: Coordinate;
  /** 该坐标在解析时刻的占用者；null 表示空坐标。 */
  readonly occupantId: UnitId | null;
}

/** 候选池（I-1 的产物）。 */
export interface CandidatePool {
  readonly targets: readonly ResolvedTarget[];
  /** INV-E9：提交时校验战场是否发生变动，不一致则重算候选池。 */
  readonly stateVersion: number;
  readonly pickCount: number;
  readonly selectionMode: 'auto' | 'manual';
  readonly fallbackSort?: string;
}

export function targetKey(t: ResolvedTarget): string {
  return `${t.coord.faction}/${t.coord.lane}/${t.coord.index}`;
}

export function sameTarget(a: ResolvedTarget, b: ResolvedTarget): boolean {
  return (
    a.coord.faction === b.coord.faction &&
    a.coord.lane === b.coord.lane &&
    a.coord.index === b.coord.index
  );
}

export function occupantIds(targets: readonly ResolvedTarget[]): readonly UnitId[] {
  const out: UnitId[] = [];
  for (const t of targets) if (t.occupantId !== null) out.push(t.occupantId);
  return out;
}
