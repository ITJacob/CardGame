/**
 * Placement：唯一的占位出口（A1 / §4.3）。
 *
 * 它是战场上唯一有权写 Slot.occupant 与 Unit.position 的组件。
 * 所有占位变更统一走这套模板：
 *
 *   1. snapshot ← 当前 Battle 空间结构
 *   2. next ← 执行变更
 *   3. next ← collapse(next)                     // INV-B3
 *   4. next ← syncProjections(next)              // INV-B4 / INV-B5
 *   5. if !invariantCheck(next) then return snapshot, Failure(reason)
 *   6. occupancyDiff ← diff(snapshot, next)
 *   7. emit(OccupancyChanged(diff))              // Zone 的唯一触发入口
 *   8. return next, Success
 *
 * 第 7 步让击退、召唤、死亡补位、跨路移动全部自动获得区域触发能力，
 * 无需逐个特判——Zone 不监听"移动"这个动作，只监听"占用关系变化"这个事实。
 */

import type { FactionId, LaneId, UnitId } from '../shared/ids.js';
import { ok, err, type Result } from '../shared/result.js';
import type { EventBus } from '../shared/events.js';
import type { Coordinate, Occupant } from './coordinate.js';
import { coordKey } from './coordinate.js';
import type { BattlefieldShape } from './battlefield.js';
import { collapseLane } from './collapse.js';
import type { Battle } from './battle.js';
import { diffOccupancy, hasChanges, type OccupancyDiff, type ProjectionMove } from './occupancy.js';
import { EMPTY_DIFF } from './occupancy.js';

/** 投影同步回调：由聚合根注入，把坐标变化单向写入 Unit.position（INV-B5）。 */
export type ProjectionSync = (moves: readonly ProjectionMove[]) => void;

/** mutator 能看到的战场草稿。写权限仅存在于此，且不绕过 collapse。 */
export interface SpaceDraft {
  readonly shape: BattlefieldShape;
  occupantAt(c: Coordinate): Occupant;
  setSlot(c: Coordinate, occupant: Occupant): void;
  laneSlots(faction: FactionId, lane: LaneId): readonly Occupant[];
  isLaneFull(faction: FactionId, lane: LaneId): boolean;
}

class DraftImpl implements SpaceDraft {
  constructor(
    readonly shape: BattlefieldShape,
    private slots: Occupant[][][],
  ) {}

  laneSlots(faction: FactionId, lane: LaneId): readonly Occupant[] {
    const f = this.shape.factionIndexOf(faction);
    const l = this.shape.laneIndexOf(lane);
    return this.slots[f]?.[l] ?? [];
  }

  isLaneFull(faction: FactionId, lane: LaneId): boolean {
    return !this.laneSlots(faction, lane).includes(null);
  }

  occupantAt(c: Coordinate): Occupant {
    const f = this.shape.factionIndexOf(c.faction);
    const l = this.shape.laneIndexOf(c.lane);
    return this.slots[f]?.[l]?.[c.index] ?? null;
  }

  setSlot(c: Coordinate, occupant: Occupant): void {
    const f = this.shape.factionIndexOf(c.faction);
    const l = this.shape.laneIndexOf(c.lane);
    const lane = this.slots[f]?.[l];
    if (!lane || c.index < 0 || c.index >= lane.length) {
      throw new RangeError(`非法坐标 ${coordKey(c)}`);
    }
    lane[c.index] = occupant;
  }

  /** 全路坍缩后交出结果数组。 */
  collapsed(): Occupant[][][] {
    return this.slots.map((faction) => faction.map((lane) => collapseLane(lane)));
  }
}

export class Placement {
  constructor(
    private readonly battle: Battle,
    private readonly bus: EventBus,
    private readonly syncProjection: ProjectionSync,
  ) {}

  // ——— 四个基本操作 ———

  /** 插入：目标 lane 未满、坐标合法、单位未在场上。 */
  insert(unitId: UnitId, c: Coordinate): Result<OccupancyDiff> {
    if (!this.battle.isValidCoord(c)) {
      return err('INVALID_COORDINATE', `非法坐标 ${coordKey(c)}`);
    }
    if (this.battle.coordOf(unitId) !== null) {
      return err('UNIT_ALREADY_PLACED', `单位 ${unitId} 已在场上`);
    }
    if (this.battle.occupantAt(c) !== null && this.battle.isLaneFull(c.faction, c.lane)) {
      return err('LANE_FULL', `路线 ${c.faction}/${c.lane} 已满`);
    }
    return this.run((draft) => {
      if (draft.isLaneFull(c.faction, c.lane)) {
        throw new LaneFullError(coordKey(c));
      }
      // 插到队尾：找该路第一个空位写入，坍缩后自然落到正确位置。
      const slots = draft.laneSlots(c.faction, c.lane);
      for (let i = 0; i < slots.length; i += 1) {
        if (slots[i] === null) {
          draft.setSlot({ faction: c.faction, lane: c.lane, index: i }, unitId);
          return;
        }
      }
      throw new LaneFullError(coordKey(c));
    });
  }

  /** 移除：单位必须在场上。 */
  remove(unitId: UnitId): Result<OccupancyDiff> {
    const at = this.battle.coordOf(unitId);
    if (at === null) return err('UNIT_NOT_ON_FIELD', `单位 ${unitId} 不在场上`);
    return this.run((draft) => {
      draft.setSlot(at, null);
    });
  }

  /** 交换：两者均在场。 */
  swap(a: UnitId, b: UnitId): Result<OccupancyDiff> {
    const ca = this.battle.coordOf(a);
    const cb = this.battle.coordOf(b);
    if (ca === null || cb === null) return err('UNIT_NOT_ON_FIELD', '交换要求双方均在场');
    return this.run((draft) => {
      draft.setSlot(ca, b);
      draft.setSlot(cb, a);
    });
  }

  /**
   * 迁移到另一坐标（目标 lane 未满）。
   *
   * 队列语义：落点由"该路第一个空位"决定，之后统一坍缩——
   * 因此同路内迁移是个 no-op（不能插队），跨路迁移则落到队尾。
   */
  relocate(unitId: UnitId, c: Coordinate): Result<OccupancyDiff> {
    const from = this.battle.coordOf(unitId);
    if (from === null) return err('UNIT_NOT_ON_FIELD', `单位 ${unitId} 不在场上`);
    if (!this.battle.isValidCoord(c)) return err('INVALID_COORDINATE', `非法坐标 ${coordKey(c)}`);
    // G8（全局硬约束）：己方单位不得越中线进入敌方半场。relocate 是 move 的唯一落点出口，
    // 禁止 to.faction 与 from.faction 不同，从根上挡住跨阵营位移（突进/跳跃类技能走近战攻击进程，不调 move）。
    if (c.faction !== from.faction) {
      return err('CROSS_FACTION_RELOCATE', `禁止跨阵营迁移：单位 ${unitId} 属 ${from.faction}，目标 ${c.faction}`);
    }
    return this.run((draft) => {
      draft.setSlot(from, null);
      const slots = draft.laneSlots(c.faction, c.lane);
      for (let i = 0; i < slots.length; i += 1) {
        if (slots[i] === null) {
          draft.setSlot({ faction: c.faction, lane: c.lane, index: i }, unitId);
          return;
        }
      }
      throw new LaneFullError(coordKey(c));
    });
  }

  /**
   * 逃生舱：任意占位变更（召唤、击退补位、跨路跳跃……）都走这里。
   * mutator 内任意修改 draft，之后统一坍缩 + 校验 + 发事件。
   */
  applyExternal(mutator: (draft: SpaceDraft) => void): Result<OccupancyDiff> {
    return this.run(mutator);
  }

  // ——— 统一执行模板 ———

  private run(mutator: (draft: SpaceDraft) => void): Result<OccupancyDiff> {
    const snapshot = this.battle.snapshot();
    const before = this.battle.occupancyMap();

    try {
      const draft = new DraftImpl(this.battle.shape, this.battle.draftSlots());
      mutator(draft);
      const collapsed = draft.collapsed();

      // 提交前先按坍缩结果推演 after，用于 diff 与投影同步。
      const after = occupancyMapOf(this.battle.shape, collapsed);

      // INV-B1 / B2 / B7：容量由数组长度保证；坍缩保证无空洞；
      // 满员插入由各操作前置或 LaneFullError 拦截（不静默丢弃，返回失败原因）。
      this.battle.commitSlots(collapsed);
      this.battle.bumpVersion();

      const diff = diffOccupancy(before, after);
      this.syncProjection(diff.moves);
      if (hasChanges(diff)) {
        this.bus.emit({ type: 'OccupancyChanged', entered: diff.entered, left: diff.left });
      }
      return ok(diff);
    } catch (e) {
      this.battle.restore(snapshot);
      if (e instanceof LaneFullError) {
        return err('LANE_FULL', `路线已满：${e.key}`);
      }
      if (e instanceof RangeError) {
        return err('INVALID_COORDINATE', e.message);
      }
      throw e;
    }
  }
}

class LaneFullError extends Error {
  constructor(readonly key: string) {
    super(`路线已满：${key}`);
    this.name = 'LaneFullError';
  }
}

function occupancyMapOf(
  shape: BattlefieldShape,
  slots: readonly (readonly (readonly Occupant[])[])[],
): Map<UnitId, Coordinate> {
  const m = new Map<UnitId, Coordinate>();
  for (let f = 0; f < shape.factions.length; f += 1) {
    const faction = shape.factions[f] as FactionId;
    for (let l = 0; l < shape.lanes.length; l += 1) {
      const lane = shape.lanes[l] as LaneId;
      const row = slots[f]?.[l] ?? [];
      for (let i = 0; i < row.length; i += 1) {
        const occ = row[i] ?? null;
        if (occ !== null) m.set(occ, { faction, lane, index: i });
      }
    }
  }
  return m;
}

export { EMPTY_DIFF };
