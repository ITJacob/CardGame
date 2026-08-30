/**
 * Battle：空间容器（§4.1 / §4.6）。
 *
 * 持有全部坐标空间与区域挂载物。
 * 纪律：Slot.occupant 与 Unit.position 的写权限收口在 Placement（INV-B5），
 * 本类只提供读写原语，不自行发起占位变更。
 */

import type { FactionId, LaneId, UnitId, ZoneId } from '../shared/ids.js';
import type { BattleState } from '../shared/enums.js';
import { invariant } from '../shared/result.js';
import type { Coordinate, Occupant } from './coordinate.js';
import { coordKey } from './coordinate.js';
import { BattlefieldShape } from './battlefield.js';
import { checkLane } from './collapse.js';
import type { Zone } from './zone.js';

export interface BattleSnapshot {
  readonly slots: readonly (readonly (readonly Occupant[])[])[];
  readonly zones: readonly Zone[];
  readonly stateVersion: number;
}

export class Battle {
  private slots: Occupant[][][];
  private readonly zones: Map<ZoneId, Zone>;
  private readonly zonesByCoord: Map<string, ZoneId[]>;
  private version = 0;

  state: BattleState = 'created';
  tickIndex = 0;

  constructor(readonly shape: BattlefieldShape) {
    const { factions, lanes, capacity } = shape;
    this.slots = factions.map(() => lanes.map(() => new Array<Occupant>(capacity).fill(null)));
    this.zones = new Map();
    this.zonesByCoord = new Map();
  }

  get stateVersion(): number {
    return this.version;
  }

  bumpVersion(): void {
    this.version += 1;
  }

  // ——— 坐标校验与查询 ———

  isValidCoord(c: Coordinate): boolean {
    return (
      this.shape.hasFaction(c.faction) &&
      this.shape.hasLane(c.lane) &&
      Number.isInteger(c.index) &&
      c.index >= 0 &&
      c.index < this.shape.capacity
    );
  }

  laneSlots(faction: FactionId, lane: LaneId): readonly Occupant[] {
    const f = this.shape.factionIndexOf(faction);
    const l = this.shape.laneIndexOf(lane);
    return this.slots[f]?.[l] ?? [];
  }

  occupantAt(c: Coordinate): Occupant {
    invariant(this.isValidCoord(c), 'INVALID_COORDINATE', `非法坐标 ${coordKey(c)}`);
    const f = this.shape.factionIndexOf(c.faction);
    const l = this.shape.laneIndexOf(c.lane);
    return this.slots[f]?.[l]?.[c.index] ?? null;
  }

  /** 反查单位所在坐标；不在场上返回 null。 */
  coordOf(unitId: UnitId): Coordinate | null {
    for (let f = 0; f < this.shape.factions.length; f += 1) {
      const faction = this.shape.factions[f] as FactionId;
      for (let l = 0; l < this.shape.lanes.length; l += 1) {
        const lane = this.shape.lanes[l] as LaneId;
        const slots = this.slots[f]?.[l] ?? [];
        for (let i = 0; i < slots.length; i += 1) {
          if (slots[i] === unitId) return { faction, lane, index: i };
        }
      }
    }
    return null;
  }

  isLaneFull(faction: FactionId, lane: LaneId): boolean {
    return !this.laneSlots(faction, lane).includes(null);
  }

  /** 当前全部占位关系，供 diff 使用。 */
  occupancyMap(): Map<UnitId, Coordinate> {
    const m = new Map<UnitId, Coordinate>();
    for (let f = 0; f < this.shape.factions.length; f += 1) {
      const faction = this.shape.factions[f] as FactionId;
      for (let l = 0; l < this.shape.lanes.length; l += 1) {
        const lane = this.shape.lanes[l] as LaneId;
        const slots = this.slots[f]?.[l] ?? [];
        for (let i = 0; i < slots.length; i += 1) {
          const occ = slots[i] ?? null;
          if (occ !== null) m.set(occ, { faction, lane, index: i });
        }
      }
    }
    return m;
  }

  // ——— 内部写入原语（仅 Placement 可调用） ———

  /** 取出 slots 的可变深拷贝，供 mutator 自由修改。 */
  draftSlots(): Occupant[][][] {
    return this.slots.map((f) => f.map((l) => [...l]));
  }

  /** 提交 draft，并做容量 / 紧凑度校验（INV-B1 / INV-B2）。 */
  commitSlots(next: Occupant[][][]): void {
    for (const faction of next) {
      for (const lane of faction) {
        const report = checkLane(lane, this.shape.capacity);
        invariant(report.capacityOk, 'INV-B1', '队列占用数超过容量');
        invariant(report.compact, 'INV-B2', '队列出现内部空洞（坍缩未生效）');
      }
    }
    this.slots = next;
  }

  writeSlot(c: Coordinate, occupant: Occupant): void {
    const f = this.shape.factionIndexOf(c.faction);
    const l = this.shape.laneIndexOf(c.lane);
    const lane = this.slots[f]?.[l];
    invariant(lane !== undefined && c.index < lane.length, 'INVALID_COORDINATE', `非法坐标 ${coordKey(c)}`);
    lane[c.index] = occupant;
  }

  // ——— Zone ———

  zonesAt(c: Coordinate): readonly Zone[] {
    const ids = this.zonesByCoord.get(coordKey(c));
    if (!ids) return [];
    const out: Zone[] = [];
    for (const id of ids) {
      const z = this.zones.get(id);
      if (z) out.push(z);
    }
    return out;
  }

  allZones(): readonly Zone[] {
    return [...this.zones.values()];
  }

  /** 同坐标允许多个 Zone 共存；以放入顺序稳定排序。 */
  addZone(zone: Zone): void {
    invariant(!this.zones.has(zone.id), 'INV-B6', `Zone ${zone.id} 重复注册`);
    this.zones.set(zone.id, zone);
    const key = coordKey(zone.coord);
    const ids = this.zonesByCoord.get(key);
    if (ids) ids.push(zone.id);
    else this.zonesByCoord.set(key, [zone.id]);
  }

  removeZone(zoneId: ZoneId): Zone | null {
    const zone = this.zones.get(zoneId) ?? null;
    if (!zone) return null;
    this.zones.delete(zoneId);
    const key = coordKey(zone.coord);
    const ids = this.zonesByCoord.get(key);
    if (ids) {
      const next = ids.filter((id) => id !== zoneId);
      if (next.length > 0) this.zonesByCoord.set(key, next);
      else this.zonesByCoord.delete(key);
    }
    return zone;
  }

  // ——— 快照 / 回滚 ———

  snapshot(): BattleSnapshot {
    return {
      slots: this.slots.map((f) => f.map((l) => [...l])),
      zones: [...this.zones.values()].map((z) => ({ ...z })),
      stateVersion: this.version,
    };
  }

  restore(s: BattleSnapshot): void {
    this.slots = s.slots.map((f) => f.map((l) => [...l]));
    this.zones.clear();
    this.zonesByCoord.clear();
    for (const z of s.zones) {
      this.zones.set(z.id, { ...z });
      const key = coordKey(z.coord);
      const ids = this.zonesByCoord.get(key);
      if (ids) ids.push(z.id);
      else this.zonesByCoord.set(key, [z.id]);
    }
    this.version = s.stateVersion;
  }
}
