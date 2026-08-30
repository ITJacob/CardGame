/**
 * UnitRegistry：编队的单位注册表 + 坐标投影同步。
 *
 * Unit.position 是只读投影（INV-B5）：只有这里（由 Placement 回调驱动）能写它，
 * 其他任何模块读多写零。
 */

import type { FactionId, UnitId } from '../shared/ids.js';
import type { Coordinate } from '../battle/coordinate.js';
import type { ProjectionMove } from '../battle/occupancy.js';
import type { Unit } from './unit.js';

export class UnitRegistry {
  private readonly units = new Map<UnitId, Unit>();

  add(unit: Unit): void {
    this.units.set(unit.id, unit);
  }

  get(id: UnitId): Unit | undefined {
    return this.units.get(id);
  }

  require(id: UnitId): Unit {
    const u = this.units.get(id);
    if (!u) throw new Error(`单位不存在：${id}`);
    return u;
  }

  has(id: UnitId): boolean {
    return this.units.has(id);
  }

  all(): readonly Unit[] {
    return [...this.units.values()];
  }

  byFaction(faction: FactionId): readonly Unit[] {
    return this.all().filter((u) => u.faction === faction);
  }

  alive(): readonly Unit[] {
    return this.all().filter((u) => u.isAlive);
  }

  aliveOf(faction: FactionId): readonly Unit[] {
    return this.alive().filter((u) => u.faction === faction);
  }

  /** 从注册表摘除（死亡离场）。修正的撤销由 StatProvenance.revertAll 负责（INV-P4）。 */
  drop(id: UnitId): Unit | null {
    const u = this.units.get(id) ?? null;
    if (u) this.units.delete(id);
    return u;
  }

  /**
   * 刷新坐标投影（Placement 的第 4 步）。
   * @param moves Placement 计算出的坐标迁移集合
   */
  syncProjections(moves: readonly ProjectionMove[]): void {
    for (const m of moves) {
      const unit = this.units.get(m.unitId);
      if (!unit) continue;
      unit.position = m.to ? ({ ...m.to } as Coordinate) : null;
    }
  }
}
