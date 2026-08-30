/**
 * 执行流水线 I → R → M → O（§7.3 / §13）。
 *
 *   I-1 候选池          → CandidatePool（带 stateVersion）
 *                        Manual 且候选数 > pickCount → 等待玩家选择（否则不打断）
 *   I-2 收缩            → committedTargets（Auto 按 sort；Manual 按输入或 fallbackSort）
 *   R  转向 + 结算计划  → finalTargets / settlementPlan / redirectLog
 *   M  消费分流         → instant | zone | summon
 *   O  逐目标条件过滤   → 执行 effect
 */

import type { ActionId, DefId, FactionId, InstanceId, UnitId } from '../shared/ids.js';
import type { SourceFilter, TriggerEvent } from '../shared/enums.js';
import { ok, err, type Result } from '../shared/result.js';
import type { EffectRef, ZoneGrantTemplate } from '../catalog/model.js';
import type { Unit } from '../roster/unit.js';
import type { Coordinate } from '../battle/coordinate.js';
import { createZone, type Zone, type ZoneGrant } from '../battle/zone.js';
import type { EffectContext, SourceKind } from '../effect/context.js';
import { executeEffectList } from '../effect/executor.js';
import type { CombatHost } from './host.js';
import { Action, type Ignition } from './action.js';
import type { ResolvedTarget } from './target.js';
import { targetKey } from './target.js';
import { resolveCandidatePool, shrinkCandidates, type TargetResolutionDeps } from './pipeline-i.js';
import { resolveRedirectNode } from './pipeline-r.js';
import { isDisabled } from '../roster/behavior-constraints.js';

/** 近战对撞的效果 id 约定：由 Catalog 提供，走同一条伤害链（§7.5.1）。 */
export const MELEE_CLASH_EFFECT_ID: DefId = 'melee_clash_damage';

function targetDeps(host: CombatHost): TargetResolutionDeps {
  return {
    battle: host.battle,
    shape: host.shape,
    unit: (id: UnitId) => host.unit(id),
    units: () => host.allUnits(),
  };
}

function sourceFilterOf(reach: 'melee' | 'ranged' | 'none', cause: TriggerEvent | null): SourceFilter {
  if (cause !== null) return 'skill';
  return reach === 'none' ? 'skill' : reach;
}

// ————————————————————————————————————————————————
// I 节点
// ————————————————————————————————————————————————

/**
 * I 节点：解析并冻结 committedTargets。
 * 引导类行为在点火时就冻结目标（§5.7：Channel.resolvedTargets 点火时已解析并冻结）。
 */
export function resolveTargets(
  host: CombatHost,
  action: Action,
  caster: Unit,
  selection?: readonly number[],
): Result<readonly ResolvedTarget[]> {
  const spec = action.init.targetSpec;
  if (!spec) {
    action.committedTargets = [];
    return ok([]);
  }

  const pool = resolveCandidatePool(spec, caster, targetDeps(host));
  if (!pool.ok) return pool;

  // INV-E9：若战场在候选池构建后又变过，重算一次（此处紧邻使用，一般命中同一版本）。
  let used = pool.value;
  if (used.stateVersion !== host.battle.stateVersion) {
    const again = resolveCandidatePool(spec, caster, targetDeps(host));
    if (!again.ok) return again;
    used = again.value;
  }

  action.candidatePool = used;
  const committed = shrinkCandidates(used, caster, targetDeps(host), selection);
  action.committedTargets = committed;

  host.bus.emit({ type: 'TargetsResolved', actionId: action.id, targets: committed });
  return ok(committed);
}

// ————————————————————————————————————————————————
// R 节点
// ————————————————————————————————————————————————

function resolveRedirect(host: CombatHost, action: Action, caster: Unit): void {
  const cause = action.init.ignition.kind === 'event_trigger' ? action.init.ignition.cause : null;
  const outcome = resolveRedirectNode(
    caster,
    action.committedTargets,
    action.effects,
    sourceFilterOf(action.reach, cause),
    cause !== null,
    { unit: (id) => host.unit(id), units: () => host.allUnits(), formulas: host.formulas },
  );
  action.finalTargets = outcome.finalTargets;
  action.settlementPlan = outcome.settlementPlan;
  action.redirectLog.push(...outcome.redirectLog);

  for (const step of outcome.redirectLog) {
    host.bus.emit({ type: 'ActionRedirected', actionId: action.id, step });
  }
}

// ————————————————————————————————————————————————
// M 节点：消费分流
// ————————————————————————————————————————————————

function consumptionTargets(host: CombatHost, action: Action): readonly ResolvedTarget[] {
  switch (action.consumption) {
    case 'instant':
      return action.finalTargets.filter((t) => t.occupantId !== null);
    case 'summon':
      return action.finalTargets.filter((t) => t.occupantId === null);
    case 'zone':
      return action.finalTargets;
    default:
      return action.finalTargets.filter((t) => t.occupantId !== null);
  }
}

/** 为 zone 消费路径注册区域（A23：载荷是清单，逐条独立判定）。 */
function placeZones(host: CombatHost, action: Action, caster: Unit, coords: readonly ResolvedTarget[]): void {
  const defId = action.init.targetSpec?.zoneDefId;
  if (!defId) return;
  const def = host.catalog.zone(defId);
  if (!def) return;

  for (const t of coords) {
    const sourceId: InstanceId = host.ids.next('zone');
    const grant: ZoneGrant = { ...buildGrant(def.defaultGrant, action.effects), sourceId };
    const zone: Zone = createZone(host.ids.next('zone') as string, t.coord, defId, grant);
    host.battle.addZone(zone);
    host.bus.emit({ type: 'ZonePlaced', zoneId: zone.id, coord: t.coord, defId });

    if (grant.triggerOnExisting) {
      const occupant = t.occupantId === null ? null : host.unit(t.occupantId);
      if (occupant) triggerZone(host, zone, occupant, action.id);
    }
    void caster;
  }
}

function buildGrant(
  template: ZoneGrantTemplate,
  effects: readonly EffectRef[],
): Omit<ZoneGrant, 'sourceId'> {
  return {
    duration: template.duration,
    uses: template.uses,
    affects: template.affects,
    trigger: template.trigger,
    triggerOnExisting: template.triggerOnExisting ?? false,
    // 载荷来自本次行为的 effects（已展开的扁平 EffectRef），与状态载荷对齐（INV-B8）。
    effects: effects.length > 0 ? effects : (template.effects as readonly EffectRef[]),
    ownerSide: template.ownerSide,
  };
}

/** 区域触发：只在 on_enter / triggerOnExisting 时调用；整次触发只消耗一次 uses（INV-B8）。 */
export function triggerZone(host: CombatHost, zone: Zone, unit: Unit, actionId: ActionId): void {
  if (!unit.isAlive) return;
  if (zone.grant.trigger !== 'on_enter') return;
  if (zone.usesRemaining !== null && zone.usesRemaining <= 0) return;

  const owner = zone.grant.ownerSide;
  if (owner !== null) {
    const sameSide = unit.faction === owner;
    if (zone.grant.affects === 'enemy_of_owner' && sameSide) return;
    if (zone.grant.affects === 'ally_of_owner' && !sameSide) return;
  }

  host.bus.emit({ type: 'ZoneTriggered', zoneId: zone.id, coord: zone.coord, unitId: unit.id });
  if (zone.usesRemaining !== null) zone.usesRemaining -= 1;

  const ctx: EffectContext = {
    runtime: host,
    actionId,
    caster: unit,
    sourceKind: 'zone',
    sourceId: zone.id as InstanceId,
    depth: 0,
    cause: null,
  };
  const targets: ResolvedTarget[] = [{ coord: unit.position ?? zone.coord, occupantId: unit.id }];
  executeEffectList(ctx, zone.grant.effects as readonly EffectRef[], targets);

  if (zone.usesRemaining !== null && zone.usesRemaining <= 0) {
    host.battle.removeZone(zone.id);
    host.bus.emit({ type: 'ZoneRemoved', zoneId: zone.id, coord: zone.coord, reason: 'uses_exhausted' });
  }
}

// ————————————————————————————————————————————————
// O 节点
// ————————————————————————————————————————————————

function applyOutcomes(host: CombatHost, action: Action, caster: Unit, targets: readonly ResolvedTarget[]): void {
  const ctx: EffectContext = {
    runtime: host,
    actionId: action.id,
    caster,
    sourceKind: sourceKindOf(action),
    sourceId: action.init.sourceInstanceId,
    depth: 0,
    cause: action.init.ignition.kind === 'event_trigger' ? action.init.ignition.cause : null,
  };
  const outcomes = executeEffectList(ctx, action.effects, targets);
  action.outcomes.push(...outcomes);
}

function sourceKindOf(action: Action): SourceKind {
  if (action.init.ignition.kind === 'event_trigger') {
    return action.init.ignition.cause === null ? 'behavior' : 'status';
  }
  return 'behavior';
}

// ————————————————————————————————————————————————
// 近战同步对撞（§7.5 / INV-E7 / INV-E8）
// ————————————————————————————————————————————————

/**
 * 近战对撞：建模为引擎级结算规则产出的反作用 Action，而不是给每个单位配被动。
 *
 * 触发条件：
 *   reach == melee
 * ∧ 主目标在**主伤害结算前**存在且存活
 * ∧ 主目标未被剥夺还击能力（眩晕 / 同类硬控）
 * ∧ 主目标够得着攻击者 —— B7 已裁定：首批不校验
 *
 * INV-E7：对撞不能中断主攻击——主伤害已经在 O 节点结算完毕，
 * 即使对撞算出攻击者会被打死，主伤害依然生效。
 */
export function resolveMeleeClash(
  host: CombatHost,
  action: Action,
  caster: Unit,
  primaryWasAlive: boolean,
): void {
  if (action.reach !== 'melee' || !primaryWasAlive) return;

  const primary = action.committedTargets[0];
  if (!primary || primary.occupantId === null) return;

  const defender = host.unit(primary.occupantId);
  if (!defender || !defender.isAlive) return;

  // 被剥夺还击能力（disable '*'）→ 自动不触发对撞，无需特判。
  if (isDisabled('*', defender.constraints)) return;
  if (defender.position === null) return;

  const clashEffect = host.catalog.effect(MELEE_CLASH_EFFECT_ID);
  if (!clashEffect) return;

  const casterCoord = caster.position;
  if (!casterCoord) return;

  const clash = new Action({
    id: host.ids.next('action') as ActionId,
    sourceRef: 'melee_clash',
    sourceInstanceId: defender.id as InstanceId,
    ignition: { kind: 'event_trigger', cause: null },
    targetSpec: null,
    effects: [{ ref: MELEE_CLASH_EFFECT_ID }],
    reach: 'melee',
    casterId: defender.id,
    consumption: 'instant',
    castTime: 0,
  });
  clash.committedTargets = [{ coord: casterCoord, occupantId: caster.id }];
  clash.finalTargets = clash.committedTargets;
  host.actions.set(clash.id, clash);

  host.bus.emit({ type: 'ActionCreated', actionId: clash.id, casterId: defender.id, ignition: 'event_trigger' });
  applyOutcomes(host, clash, defender, clash.finalTargets);
  clash.state = 'resolved';
  host.bus.emit({ type: 'ActionResolved', actionId: clash.id, state: 'resolved' });
}

// ————————————————————————————————————————————————
// 主流程
// ————————————————————————————————————————————————

/** R → M → O（+ 近战对撞）。引导完成或即时行为都走这里。 */
export function settleAction(host: CombatHost, action: Action): Result<void> {
  const caster = host.unit(action.casterId);
  if (!caster) return err('UNIT_NOT_FOUND', `施法者 ${action.casterId} 不存在`);

  action.state = 'resolving';
  resolveRedirect(host, action, caster);

  const targets = consumptionTargets(host, action);
  if (action.consumption === 'zone') {
    placeZones(host, action, caster, targets);
  } else {
    // 记录主目标在主伤害结算前的存活状态——对撞是"同一刻"发生的事。
    const primaryWasAlive = isTargetAlive(host, action.committedTargets[0]);
    applyOutcomes(host, action, caster, targets);
    resolveMeleeClash(host, action, caster, primaryWasAlive);
  }

  action.state = 'resolved';
  host.bus.emit({ type: 'ActionResolved', actionId: action.id, state: 'resolved' });
  return ok(undefined);
}

function isTargetAlive(host: CombatHost, t: ResolvedTarget | undefined): boolean {
  if (!t || t.occupantId === null) return false;
  return host.unit(t.occupantId)?.isAlive ?? false;
}

/**
 * 事件触发型 Action（不消耗机会、不扣资源，跳过 I 节点——目标已由触发方给定）。
 */
export function fireTriggeredAction(
  host: CombatHost,
  caster: Unit,
  effects: readonly EffectRef[],
  targets: readonly ResolvedTarget[],
  cause: TriggerEvent,
  sourceId: InstanceId,
  depth: number,
): void {
  const action = new Action({
    id: host.ids.next('action') as ActionId,
    sourceRef: `trigger:${cause}`,
    sourceInstanceId: sourceId,
    ignition: { kind: 'event_trigger', cause },
    targetSpec: null,
    effects,
    reach: 'none',
    casterId: caster.id,
    consumption: 'instant',
    castTime: 0,
  });
  action.committedTargets = targets;
  host.actions.set(action.id, action);
  host.bus.emit({ type: 'ActionCreated', actionId: action.id, casterId: caster.id, ignition: 'event_trigger' });

  action.state = 'resolving';
  action.finalTargets = targets.filter((t) => t.occupantId !== null);
  const ctx: EffectContext = {
    runtime: host,
    actionId: action.id,
    caster,
    sourceKind: 'status',
    sourceId,
    depth,
    cause,
  };
  action.outcomes.push(...executeEffectList(ctx, effects, targets));
  action.state = 'resolved';
  host.bus.emit({ type: 'ActionResolved', actionId: action.id, state: 'resolved' });
}

/** 构造一个 Action（供 commit 与事件触发共用）。 */
export function makeAction(args: {
  id: ActionId;
  sourceRef: string;
  sourceInstanceId: InstanceId;
  ignition: Ignition;
  targetSpec: Action['init']['targetSpec'];
  effects: readonly EffectRef[];
  reach: Action['init']['reach'];
  casterId: UnitId;
  consumption: Action['init']['consumption'];
  castTime: number;
}): Action {
  return new Action(args);
}

export type { Coordinate, FactionId };
