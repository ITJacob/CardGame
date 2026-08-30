/**
 * I 节点：目标解释（§7.3）。
 *
 * 拆为两段：
 *   I-1 候选池  —— 解析 request → CandidatePool（带 stateVersion）
 *   I-2 收缩    —— 按 selectionMode 从候选池里挑出 committedTargets
 *
 * 关键点：
 * - 产出物是**坐标**，occupant 仅是该坐标在解析时刻的租客，可以为 null
 *   （空坐标是合法目标——召唤依赖此）。
 * - 候选为空时返回空集合，上层跳过而非抛异常。
 * - laneRef: 'auto' 必须在此之前已被预处理为具体值（A13）。
 */

import type { FactionId, LaneId, UnitId } from '../shared/ids.js';
import type { Anchor, LaneRef, Reach, Scope, SortRule, Spread } from '../shared/enums.js';
import { ok, err, type Result } from '../shared/result.js';
import type { TargetSpec } from '../shared/target-spec.js';
import { resolveAutoLaneRef } from '../shared/target-spec.js';
import type { Coordinate } from '../battle/coordinate.js';
import type { Battle } from '../battle/battle.js';
import type { BattlefieldShape } from '../battle/battlefield.js';
import type { Unit } from '../roster/unit.js';
import type { CandidatePool, ResolvedTarget } from './target.js';
import { targetKey } from './target.js';

export interface TargetResolutionDeps {
  readonly battle: Battle;
  readonly shape: BattlefieldShape;
  readonly unit: (id: UnitId) => Unit | undefined;
  readonly units: () => readonly Unit[];
}

/** 扫描哪些阵营。 */
function scanFaction(spec: TargetSpec, caster: Unit, shape: BattlefieldShape): FactionId {
  switch (spec.request.faction) {
    case 'self':
    case 'ally':
    case 'self_or_ally':
      return caster.faction;
    case 'enemy':
    default:
      return shape.oppositeFaction(caster.faction);
  }
}

function scanLanes(spec: TargetSpec, caster: Unit, shape: BattlefieldShape): readonly LaneId[] {
  const all = shape.lanes;
  const own = caster.position?.lane ?? all[0]!;
  switch (spec.request.laneRef) {
    case 'cross_lane':
      return all.filter((l) => l !== own);
    case 'all_lanes':
      return all;
    case 'same_lane':
    case 'auto': // A13：auto 应已在此前被预处理；这里退化为 same_lane 兜底。
    default:
      return [own];
  }
}

function anchorIndex(
  anchor: Anchor,
  spec: TargetSpec,
  caster: Unit,
  faction: FactionId,
  lane: LaneId,
  deps: TargetResolutionDeps,
): number | null {
  const capacity = deps.shape.capacity;
  const casterIndex = caster.position?.index ?? 0;

  switch (anchor) {
    case 'front_line':
      return deps.shape.frontIndex;
    case 'self':
      return casterIndex;
    case 'front_of_self':
      return casterIndex - 1;
    case 'behind_self':
      return casterIndex + 1;
    case 'cross_same_index':
      return casterIndex;
    case 'absolute':
      return spec.request.fixedIndex ?? 0;
    case 'first_empty': {
      const slots = deps.battle.laneSlots(faction, lane);
      for (let i = 0; i < slots.length; i += 1) if (slots[i] === null) return i;
      return null;
    }
    case 'taunt_source': {
      // 嘲讽来源：目标阵营里第一个带 force 约束的单位所在下标。
      const taunter = deps
        .units()
        .find((u) => u.faction === faction && u.isAlive && u.constraints.forced.size > 0);
      const pos = taunter?.position;
      return pos ? pos.index : null;
    }
    default:
      return 0;
  }
}

function scopeIndices(scope: Scope, anchor: number, capacity: number): readonly number[] {
  switch (scope) {
    case 'whole_lane':
      return Array.from({ length: capacity }, (_, i) => i);
    case 'adjacent':
      return [anchor - 1, anchor, anchor + 1].filter((i) => i >= 0 && i < capacity);
    case 'single_point':
    default:
      return anchor >= 0 && anchor < capacity ? [anchor] : [];
  }
}

function spreadCoords(
  spread: Spread,
  coords: readonly Coordinate[],
  factions: readonly FactionId[],
  lanes: readonly LaneId[],
  capacity: number,
): readonly Coordinate[] {
  if (spread === 'none') return coords;

  const out: Coordinate[] = [];
  const push = (c: Coordinate): void => {
    if (c.index < 0 || c.index >= capacity) return;
    if (out.some((x) => x.faction === c.faction && x.lane === c.lane && x.index === c.index)) return;
    out.push(c);
  };

  for (const c of coords) {
    push(c);
    switch (spread) {
      case 'lane_line':
        for (let i = 0; i < capacity; i += 1) push({ ...c, index: i });
        break;
      case 'splash_adjacent':
        push({ ...c, index: c.index - 1 });
        push({ ...c, index: c.index + 1 });
        break;
      case 'splash_behind':
        push({ ...c, index: c.index + 1 });
        break;
      case 'cross_same_index':
        for (const l of lanes) if (l !== c.lane) push({ ...c, lane: l });
        break;
      default:
        break;
    }
  }
  void factions;
  return out;
}

function sortTargets(
  targets: readonly ResolvedTarget[],
  sort: SortRule,
  deps: TargetResolutionDeps,
): readonly ResolvedTarget[] {
  if (sort === 'none') return targets;
  const key = (t: ResolvedTarget): number => {
    const u = t.occupantId === null ? null : (deps.unit(t.occupantId) ?? null);
    switch (sort) {
      case 'hp_asc':
        return u ? u.hp : Number.POSITIVE_INFINITY;
      case 'hp_desc':
        return u ? -u.hp : Number.POSITIVE_INFINITY;
      case 'atk_desc':
        return u ? -u.attack : Number.POSITIVE_INFINITY;
      case 'index_asc':
      default:
        return t.coord.index;
    }
  };
  return [...targets].sort((a, b) => {
    const d = key(a) - key(b);
    if (d !== 0) return d;
    // 稳定兜底：按 (faction, lane, index) 保证确定性。
    return (
      a.coord.faction.localeCompare(b.coord.faction) ||
      a.coord.lane.localeCompare(b.coord.lane) ||
      a.coord.index - b.coord.index
    );
  });
}

/**
 * 施法者上下文预处理（A13 / B3）。
 *
 * laneRef: 'auto' 需要读取施法者自身的射程属性才能解析，若放在流水线里做，
 * 会让 calculateTargets 依赖施法者上下文、不再是纯函数。
 * 因此在 I 节点之前先把它解析成具体值，流水线保持纯函数、可独立测试与缓存。
 */
export function preprocessCasterContext(spec: TargetSpec, reach: Reach): TargetSpec {
  if (spec.request.laneRef !== 'auto') return spec;
  const resolved: Exclude<LaneRef, 'auto'> = reach === 'ranged' ? 'all_lanes' : 'same_lane';
  return resolveAutoLaneRef(spec, resolved);
}

/** I-1：产出候选池。 */
export function resolveCandidatePool(
  spec: TargetSpec,
  caster: Unit,
  deps: TargetResolutionDeps,
): Result<CandidatePool> {
  if (caster.position === null) {
    return err('INVALID_COORDINATE', `施法者 ${caster.id} 不在场上，无法解析目标`);
  }
  const { shape, battle } = deps;
  const faction = scanFaction(spec, caster, shape);
  const lanes = scanLanes(spec, caster, shape);
  const capacity = shape.capacity;

  const coords: Coordinate[] = [];
  for (const lane of lanes) {
    const anchor = anchorIndex(spec.request.anchor, spec, caster, faction, lane, deps);
    if (anchor === null) continue;
    for (const index of scopeIndices(spec.request.scope, anchor, capacity)) {
      coords.push({ faction, lane, index });
    }
  }

  const spreaded = spreadCoords(spec.request.spread, coords, shape.factions, shape.lanes, capacity);

  const targets: ResolvedTarget[] = spreaded
    .filter((c) => battle.isValidCoord(c))
    // 召唤需要空坐标，所以不过滤空位；但要过滤掉"超出当前队列末尾 + 1"的无效格。
    .map((c) => ({ coord: c, occupantId: battle.occupantAt(c) }));

  const sorted = sortTargets(targets, spec.request.sort, deps);

  return ok({
    targets: sorted,
    stateVersion: battle.stateVersion,
    pickCount: spec.request.pickCount,
    selectionMode: spec.selectionMode,
    ...(spec.fallbackSort !== undefined ? { fallbackSort: spec.fallbackSort } : {}),
  });
}

/**
 * I-2：收缩。
 *
 * - Auto：按 sort 排序 → 截 pickCount
 * - Manual：候选数 ≤ pickCount 全取（不打断玩家）；
 *   候选数 > pickCount 且无玩家输入 → 走 fallbackSort（INV-E6）
 *
 * @param selection 玩家选中的下标集合（Manual + 有玩家时提供）
 */
export function shrinkCandidates(
  pool: CandidatePool,
  caster: Unit,
  deps: TargetResolutionDeps,
  selection?: readonly number[],
  effectiveSort?: SortRule,
): readonly ResolvedTarget[] {
  const sort = effectiveSort ?? (pool.fallbackSort as SortRule | undefined) ?? 'index_asc';
  const ordered =
    pool.selectionMode === 'auto' ? pool.targets : sortTargets(pool.targets, sort, deps);
  void caster;

  if (pool.selectionMode === 'manual' && selection && selection.length > 0) {
    const picked = selection
      .filter((i) => i >= 0 && i < ordered.length)
      .slice(0, pool.pickCount)
      .map((i) => ordered[i] as ResolvedTarget);
    if (picked.length > 0) return dedupe(picked);
  }

  if (ordered.length <= pool.pickCount) return dedupe(ordered);
  return dedupe(ordered.slice(0, pool.pickCount));
}

function dedupe(targets: readonly ResolvedTarget[]): readonly ResolvedTarget[] {
  const seen = new Set<string>();
  const out: ResolvedTarget[] = [];
  for (const t of targets) {
    const k = targetKey(t);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(t);
  }
  return out;
}
