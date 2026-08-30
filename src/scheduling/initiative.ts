/**
 * InitiativePolicy：先手序列（§6.3）。
 *
 * resolveOrder(crossed):
 *     己方序列 ← sort(crossed.where(己方), by (lane, index))
 *     敌方序列 ← sort(crossed.where(敌方), by (lane, index))
 *     return 交替合并(己方序列, 敌方序列)
 *
 * INV-S2：序列必须按双方各自排序后交替合并得出，不得按战场位置分层合并。
 * > 原设计踩过这个坑：初版按 index 分层实现，给分兵方不公平先手（22:14），
 * > 修正为交替合并后对称性恢复。此处固化为不变量，防止回归。
 */

import type { FactionId, LaneId, UnitId } from '../shared/ids.js';
import { invariant } from '../shared/result.js';

export interface OrderableUnit {
  readonly unitId: UnitId;
  readonly faction: FactionId;
  readonly lane: LaneId;
  readonly index: number;
}

/** 默认交替模式 [己, 敌, 敌, 己]（参数层 §1.6）。值为 factionOrder 的下标。 */
export const DEFAULT_ALTERNATE_PATTERN: readonly number[] = [0, 1, 1, 0];

export interface InitiativeOptions {
  /** 阵营的优先顺序，pattern 里的值即它的下标。 */
  readonly factionOrder: readonly FactionId[];
  readonly pattern?: readonly number[];
}

export function resolveOrder(
  crossed: readonly OrderableUnit[],
  options: InitiativeOptions,
): readonly UnitId[] {
  const { factionOrder } = options;
  const pattern = options.pattern ?? DEFAULT_ALTERNATE_PATTERN;
  invariant(pattern.length > 0, 'INV-S2', '交替模式不可为空');

  const queues: OrderableUnit[][] = factionOrder.map((f) =>
    crossed
      .filter((u) => u.faction === f)
      .slice()
      .sort((a, b) => compareLane(a.lane, b.lane) || a.index - b.index || compareId(a.unitId, b.unitId)),
  );

  const out: UnitId[] = [];
  let i = 0;
  let remaining = queues.reduce((n, q) => n + q.length, 0);

  while (remaining > 0) {
    const preferred = pattern[i % pattern.length] ?? 0;
    let queue = queues[preferred];
    if (!queue || queue.length === 0) {
      // 首选队列空了，退化到任意非空队列（保持确定性：按下标顺序取第一个非空的）。
      const fallbackIndex = queues.findIndex((q) => q.length > 0);
      invariant(fallbackIndex >= 0, 'INV-S2', '先手序列推进失败：无可用队列但有剩余单位');
      queue = queues[fallbackIndex] as OrderableUnit[];
    }
    const next = queue.shift() as OrderableUnit;
    out.push(next.unitId);
    remaining -= 1;
    i += 1;
  }

  return out;
}

function compareLane(a: LaneId, b: LaneId): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

function compareId(a: UnitId, b: UnitId): number {
  return a < b ? -1 : a > b ? 1 : 0;
}
