/**
 * Zone：绑定坐标的持续效果（§4.1 / §4.5）。
 *
 * 关键性质（INV-B6）：Zone 以坐标为唯一键，生命周期不依赖任何 UnitId。
 * 不新增"区域状态"概念——陷阱 / 祝福地面 = Zone（坐标版的状态）（A23）。
 */

import type { DefId, InstanceId, FactionId, ZoneId } from '../shared/ids.js';
import type { Affects, ZoneTrigger } from '../shared/enums.js';
import type { EffectRef } from '../catalog/model.js';
import type { Coordinate } from './coordinate.js';

/**
 * 本次放置的参数包。
 *
 * A23：载荷是 EffectRef[] 清单（多条、逐条独立判定），与状态载荷对齐（INV-B8）。
 * 整次触发只消耗一次 uses。
 */
export interface ZoneGrant {
  /** 存活时长（tick）；null = 永不超时。 */
  readonly duration: number | null;
  /** 可触发次数；null = 无限。 */
  readonly uses: number | null;
  readonly affects: Affects;
  readonly trigger: ZoneTrigger;
  /** 放置时是否结算已在场的单位（默认 false）。 */
  readonly triggerOnExisting: boolean;
  readonly effects: readonly EffectRef[];
  readonly ownerSide: FactionId | null;
  readonly sourceId: InstanceId;
}

export interface Zone {
  readonly id: ZoneId;
  readonly coord: Coordinate;
  readonly defId: DefId;
  readonly grant: ZoneGrant;
  /** 剩余时长，null = 不限。 */
  remaining: number | null;
  /** 剩余触发次数，null = 不限。 */
  usesRemaining: number | null;
}

export function createZone(
  id: ZoneId,
  coord: Coordinate,
  defId: DefId,
  grant: ZoneGrant,
): Zone {
  return {
    id,
    coord,
    defId,
    grant,
    remaining: grant.duration,
    usesRemaining: grant.uses,
  };
}

/** 本次触发是否对被触发单位生效（阵营过滤）。 */
export function zoneAffectsUnit(zone: Zone, unitFaction: FactionId): boolean {
  const owner = zone.grant.ownerSide;
  if (owner === null) return true;
  switch (zone.grant.affects) {
    case 'any':
      return true;
    case 'ally_of_owner':
      return unitFaction === owner;
    case 'enemy_of_owner':
      return unitFaction !== owner;
    default:
      return true;
  }
}
