/**
 * Collapse 坍缩契约（§4.4）。
 *
 * 取出 slots 中所有非空 occupant，保持相对顺序，从 index 0 起依次填回，其余置 null。
 * - 幂等：对已紧凑的 Lane 调用，结果与原值相等。
 * - 不改变相对顺序（队列语义）。
 */

import type { Occupant } from './coordinate.js';

export function collapseLane(slots: readonly Occupant[]): Occupant[] {
  const occupants = slots.filter((o): o is NonNullable<Occupant> => o !== null);
  const next: Occupant[] = new Array<Occupant>(slots.length).fill(null);
  for (let i = 0; i < occupants.length; i += 1) {
    next[i] = occupants[i] as NonNullable<Occupant>;
  }
  return next;
}

/** 占用下标集合是否是从 0 开始的前缀（INV-B2）。 */
export function isCompact(slots: readonly Occupant[]): boolean {
  let seenEmpty = false;
  for (const o of slots) {
    if (o === null) seenEmpty = true;
    else if (seenEmpty) return false;
  }
  return true;
}

/** 已占用数量（INV-B1 用）。 */
export function occupancyCount(slots: readonly Occupant[]): number {
  let n = 0;
  for (const o of slots) if (o !== null) n += 1;
  return n;
}

export interface LaneInvariantReport {
  readonly capacityOk: boolean;
  readonly compact: boolean;
}

export function checkLane(slots: readonly Occupant[], capacity: number): LaneInvariantReport {
  return {
    capacityOk: occupancyCount(slots) <= capacity,
    compact: isCompact(slots),
  };
}
