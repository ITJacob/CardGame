/**
 * 战场结构：阵营、路线、每路容量（§4.1 / 参数层 §2.3）。
 *
 * 结构本身是配置，战斗内不可变；可变的是各 Slot 的占用情况（归 Battle 持有）。
 * 默认取参数层 §2.3 的标定值：2 阵营 × 2 路 × 每路 4 格。
 */

import type { FactionId, LaneId } from '../shared/ids.js';
import { invariant } from '../shared/result.js';

export interface BattlefieldConfig {
  /** 有序阵营列表。索引即内部下标。 */
  readonly factions: readonly FactionId[];
  /** 有序路线列表。索引即内部下标。 */
  readonly lanes: readonly LaneId[];
  /** 每条路的格位数。 */
  readonly capacity: number;
}

export const DEFAULT_BATTLEFIELD: BattlefieldConfig = {
  factions: ['blue', 'red'],
  lanes: ['top', 'bottom'],
  capacity: 4,
};

export class BattlefieldShape {
  private readonly factionIdx: ReadonlyMap<FactionId, number>;
  private readonly laneIdx: ReadonlyMap<LaneId, number>;

  constructor(readonly config: BattlefieldConfig) {
    invariant(config.factions.length >= 2, 'INV-B0', '阵营数至少为 2');
    invariant(config.lanes.length >= 1, 'INV-B0', '路线数至少为 1');
    invariant(config.capacity >= 1, 'INV-B0', '每路容量至少为 1');
    this.factionIdx = new Map(config.factions.map((f, i) => [f, i]));
    this.laneIdx = new Map(config.lanes.map((l, i) => [l, i]));
  }

  get factions(): readonly FactionId[] {
    return this.config.factions;
  }

  get lanes(): readonly LaneId[] {
    return this.config.lanes;
  }

  get capacity(): number {
    return this.config.capacity;
  }

  /** index 0 的语义：对峙前线。 */
  get frontIndex(): number {
    return 0;
  }

  hasFaction(id: FactionId): boolean {
    return this.factionIdx.has(id);
  }

  hasLane(id: LaneId): boolean {
    return this.laneIdx.has(id);
  }

  factionIndexOf(id: FactionId): number {
    const i = this.factionIdx.get(id);
    invariant(i !== undefined, 'INVALID_COORDINATE', `未知阵营：${id}`);
    return i;
  }

  laneIndexOf(id: LaneId): number {
    const i = this.laneIdx.get(id);
    invariant(i !== undefined, 'INVALID_COORDINATE', `未知路线：${id}`);
    return i;
  }

  /** 对位阵营。当前仅 2 阵营时有明确语义（参数层 §2.3）。 */
  oppositeFaction(id: FactionId): FactionId {
    const others = this.config.factions.filter((f) => f !== id);
    invariant(others.length === 1, 'INVALID_COORDINATE', `无法为 ${id} 确定对位阵营（阵营数 != 2）`);
    return others[0] as FactionId;
  }
}
