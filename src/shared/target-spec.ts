/**
 * TargetSpec（§10.1）。
 *
 * 四个维度正交可组合——这是技能表达力的主要来源：
 * request（查什么） × mode（点/区域） × consumption（怎么消费） × selectionMode（谁选）。
 */

import type { DefId } from './ids.js';
import type { Anchor, Consumption, FactionSelector, LaneRef, Scope, SelectionMode, SortRule, Spread, TargetMode } from './enums.js';
import { ok, err, type Result } from './result.js';

export interface TargetRequest {
  /** 扫描阵营。敌方默认取对位阵营。 */
  readonly faction: FactionSelector;
  /** 扫描路线。`auto` 会在 I 节点之前被预处理为具体值（A13）。 */
  readonly laneRef: LaneRef;
  /** 锚点坐标的解析方式。 */
  readonly anchor: Anchor;
  /** anchor == 'absolute' 时的固定下标。 */
  readonly fixedIndex?: number;
  /** 圈定候选坐标的范围。注意：`radius` 已从取值域删除（A15）。 */
  readonly scope: Scope;
  /** Auto 模式下的最终排序。 */
  readonly sort: SortRule;
  /** 从锚点向外扩散的方式。 */
  readonly spread: Spread;
  /** 最终选取的目标数量。 */
  readonly pickCount: number;
}

export interface TargetSpec {
  readonly request: TargetRequest;
  readonly mode: TargetMode;
  readonly consumption: Consumption;
  readonly selectionMode: SelectionMode;
  /** Manual 模式必填的确定性兜底（INV-E6）。 */
  readonly fallbackSort?: SortRule;
  /**
   * consumption == 'zone' 时必填：要放置的 ZoneDef。
   * M 节点按 ZoneDef.id + 由 effects 翻译出的 ZoneGrant 注册区域（§7.3）。
   */
  readonly zoneDefId?: DefId;
}

export function defaultTargetRequest(): TargetRequest {
  return {
    faction: 'enemy',
    laneRef: 'same_lane',
    anchor: 'front_line',
    scope: 'single_point',
    sort: 'index_asc',
    spread: 'none',
    pickCount: 1,
  };
}

/** 把 laneRef: 'auto' 预处理为具体值（A13 / B3）。 */
export function resolveAutoLaneRef(spec: TargetSpec, resolvedLaneRef: Exclude<LaneRef, 'auto'>): TargetSpec {
  if (spec.request.laneRef !== 'auto') return spec;
  return { ...spec, request: { ...spec.request, laneRef: resolvedLaneRef } };
}

/**
 * 目标规格的自洽校验（INV-E6 / §10.1）。
 * - mode == unit 时 consumption 强制 instant
 * - mode == area 时 consumption 必填（本模型里已是必填字段，此处校验非空）
 * - selectionMode == manual 时 fallbackSort 必填
 */
export function validateTargetSpec(spec: TargetSpec, where: string): Result<TargetSpec> {
  if (spec.mode === 'unit' && spec.consumption !== 'instant') {
    return err('CATALOG_INVALID_TARGET_SPEC', `${where}: mode=unit 时 consumption 必须为 instant`);
  }
  if (spec.selectionMode === 'manual' && spec.fallbackSort === undefined) {
    return err('CATALOG_INVALID_TARGET_SPEC', `${where}: selectionMode=manual 必须定义 fallbackSort（INV-E6）`);
  }
  if (spec.request.anchor === 'absolute' && spec.request.fixedIndex === undefined) {
    return err('CATALOG_INVALID_TARGET_SPEC', `${where}: anchor=absolute 必须配 fixedIndex`);
  }
  if (spec.request.pickCount < 1) {
    return err('CATALOG_INVALID_TARGET_SPEC', `${where}: pickCount 必须 >= 1`);
  }
  return ok(spec);
}
