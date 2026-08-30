/**
 * 九种效果的执行体（§8.1）。
 *
 * | # | type            | 职责                      | 归属上下文                  |
 * |---|-----------------|--------------------------|----------------------------|
 * | 1 | damage          | 造成伤害                  | 效果 → DamageChain          |
 * | 2 | heal            | 治疗语义地恢复池型资源     | 编队                        |
 * | 3 | mount_status    | 挂载状态                  | 编队（StatusDef + Grant）   |
 * | 4 | modify_stat     | 写入无宿主属性修正         | 编队（StatProvenance）      |
 * | 5 | modify_resource | 直接增减池 / 进度资源      | 编队                        |
 * | 6 | move            | 位移                      | 战场（必须经 Placement）    |
 * | 7 | spawn           | 生成单位                  | 战场 + 编队                 |
 * | 8 | dispel          | 驱散（清状态 / 拆区域）    | 编队 · 战场                 |
 * | 9 | drain           | 吸血（先伤后回，内部闭环） | 效果内部                    |
 */

import type { DefId, UnitId } from '../shared/ids.js';
import type { Element, PoolKey, StatKey } from '../shared/enums.js';
import { num, str, bool, type JsonValue } from '../shared/json.js';
import { ok, err, type Result } from '../shared/result.js';
import type { EffectRef, StatusGrant } from '../catalog/model.js';
import type { Unit } from '../roster/unit.js';
import type { ResolvedTarget } from '../execution/target.js';
import { effectParams, type EffectContext, type EffectOutcome } from './context.js';
import { resolveDamage, applyDamageResult } from './damage-chain.js';

export type EffectHandler = (
  ctx: EffectContext,
  ref: EffectRef,
  target: ResolvedTarget,
) => Result<EffectOutcome>;

/**
 * 目标是否还能挨这一下。
 *
 * ⚠️ 不能用 `unit.isAlive` 判断——它内部含 `hp > 0`，
 * 于是"血被打到 0 的那一击"会因为 isAlive 已经是 false 而错过死亡处理。
 * 这里只看状态：只有尚未进入 dying / removed 的单位才吃伤害。
 */
function isHittable(unit: Unit | undefined): unit is Unit {
  return unit !== undefined && unit.state !== 'dying' && unit.state !== 'removed';
}

// ————————————————————————————————————————————————
// 1. damage
// ————————————————————————————————————————————————

function computeRaw(p: Readonly<Record<string, JsonValue>>, caster: Unit, formulas: { skillDamagePerEnergy: number }): number {
  const ratio = num(p, 'ratio', 1);
  switch (str(p, 'source', 'attack')) {
    case 'value':
      return num(p, 'value', 0);
    case 'skill_formula': {
      const energy = num(p, 'energy', caster.energy);
      return ratio * formulas.skillDamagePerEnergy * energy;
    }
    case 'attack':
    default:
      return caster.attack * ratio;
  }
}

const handleDamage: EffectHandler = (ctx, ref, target) => {
  const rt = ctx.runtime;
  const def = rt.catalog.requireEffect(ref.ref);
  const p = effectParams(def.params, ref.params);
  const element = ((ref.params?.element as Element) ?? def.element ?? 'none') as Element;

  const defender = rt.unit(target.occupantId ?? '');
  if (!isHittable(defender) || defender.hp <= 0) {
    // INV-T5：第一段打死后第二段打空（打到空坐标），不重选。
    return ok({ skipped: true, reason: 'no_live_occupant' });
  }

  const raw = computeRaw(p, ctx.caster, rt.formulas);
  const result = resolveDamage(
    {
      raw,
      element,
      attacker: ctx.caster,
      defender,
      bypassArmor: def.meta?.bypassArmor ?? false,
      // INV-D4：状态来源的伤害默认不进通用乘区。
      enterGeneralMultiplier: def.meta?.enterGeneralMultiplier ?? ctx.sourceKind !== 'status',
    },
    undefined,
    rt.formulas,
  );

  const hpDelta = applyDamageResult(defender, result);

  rt.bus.emit({
    type: 'DamageDealt',
    actionId: ctx.actionId,
    sourceUnitId: ctx.caster.id,
    targetUnitId: defender.id,
    element,
    raw: result.raw,
    final: result.final,
    breakdown: result.breakdown,
  });
  rt.bus.emit({
    type: 'ResourceChanged',
    actionId: ctx.actionId,
    unitId: defender.id,
    key: 'hp',
    delta: hpDelta,
    value: defender.hp,
  });

  // 受击 / 造成伤害触发（INV-E4 的防环由 runtime 的深度控制保证）。
  rt.fireEventTriggers(defender, 'on_take_damage', ctx, [target]);
  rt.fireEventTriggers(ctx.caster, 'on_deal_damage', ctx, [target]);

  // 死亡判定（O 节点之后统一处理，保证亡语在伤害结算完成后触发）。
  if (defender.hp <= 0) rt.handleDeath(defender);

  return ok({
    element,
    raw: result.raw,
    final: result.final,
    hpDelta,
    absorbed: result.absorbed,
    targetHp: defender.hp,
  });
};

// ————————————————————————————————————————————————
// 2. heal（A22：治疗语义，未来吃治疗加成 / 减益）
// ————————————————————————————————————————————————

const handleHeal: EffectHandler = (ctx, ref, target) => {
  const rt = ctx.runtime;
  const def = rt.catalog.requireEffect(ref.ref);
  const p = effectParams(def.params, ref.params);
  const targetUnit = rt.unit(target.occupantId ?? '');
  if (!targetUnit || !targetUnit.isAlive) return ok({ skipped: true, reason: 'no_live_occupant' });

  const amount = num(p, 'value', 0);
  const poolKey = (str(p, 'pool', 'hp') as PoolKey) ?? 'hp';
  const delta = targetUnit.pool(poolKey).applyDelta(amount);

  rt.bus.emit({ type: 'Healed', actionId: ctx.actionId, unitId: targetUnit.id, amount: delta });
  rt.bus.emit({
    type: 'ResourceChanged',
    actionId: ctx.actionId,
    unitId: targetUnit.id,
    key: poolKey,
    delta,
    value: targetUnit.pool(poolKey).current,
  });
  return ok({ pool: poolKey, amount: delta });
};

// ————————————————————————————————————————————————
// 3. mount_status
// ————————————————————————————————————————————————

const handleMountStatus: EffectHandler = (ctx, ref, target) => {
  const rt = ctx.runtime;
  const def = rt.catalog.requireEffect(ref.ref);
  const p = effectParams(def.params, ref.params);
  const statusId = str(p, 'status_id', '') as DefId;
  if (statusId === '') return err('EFFECT_FAILED', `mount_status 缺少 status_id（effect: ${def.id}）`);

  const targetUnit = rt.unit(target.occupantId ?? '');
  if (!targetUnit || !targetUnit.isAlive) return ok({ skipped: true, reason: 'no_live_occupant' });

  const { status_id: _id, duration: dur, stacks: st, ...rest } = p;
  const grant: StatusGrant = {
    ...(typeof dur === 'number' ? { duration: dur } : {}),
    ...(typeof st === 'number' ? { stacks: st } : {}),
    params: rest,
  };
  const inst = rt.mountStatus(targetUnit, statusId, grant, ctx);
  return ok({ statusId, instanceId: inst?.instanceId ?? null, mounted: inst !== null });
};

// ————————————————————————————————————————————————
// 4. modify_stat（A21：无宿主、不可驱散、带 duration 者由账本计时）
// ————————————————————————————————————————————————

const handleModifyStat: EffectHandler = (ctx, ref, target) => {
  const rt = ctx.runtime;
  const def = rt.catalog.requireEffect(ref.ref);
  const p = effectParams(def.params, ref.params);
  const statRaw = str(p, 'stat', '');
  if (statRaw === '') return err('EFFECT_FAILED', `modify_stat 缺少 stat（effect: ${def.id}）`);
  const stat = statRaw as StatKey;

  const targetUnit = rt.unit(target.occupantId ?? '');
  if (!targetUnit) return ok({ skipped: true, reason: 'no_occupant' });

  const delta = num(p, 'delta', 0);
  const durationRaw = p['duration'];
  const duration = typeof durationRaw === 'number' ? durationRaw : null;

  // 状态触发沿用状态实例 id 作为溯源键；行为触发则新开一个来源 id（INV-P1）。
  const sourceId = ctx.sourceKind === 'status' ? ctx.sourceId : rt.ids.next('pmod');
  const entry =
    duration === null
      ? targetUnit.provenance.apply(stat, delta, sourceId)
      : targetUnit.provenance.applyTimed(stat, delta, sourceId, duration);

  targetUnit.invalidateConstraints();
  rt.bus.emit({
    type: 'StatModified',
    unitId: targetUnit.id,
    stat,
    delta,
    sourceId,
    remaining: entry.remaining,
  });
  return ok({ stat, delta, value: targetUnit.stats.get(stat), remaining: entry.remaining });
};

// ————————————————————————————————————————————————
// 5. modify_resource（A22 / A24：直接资源操作，绕过一切修正）
// ————————————————————————————————————————————————

function isGaugeKey(key: string): key is 'gauge.current' | 'gauge.rate' | 'gauge.threshold' {
  return key === 'gauge.current' || key === 'gauge.rate' || key === 'gauge.threshold';
}

const handleModifyResource: EffectHandler = (ctx, ref, target) => {
  const rt = ctx.runtime;
  const def = rt.catalog.requireEffect(ref.ref);
  const p = effectParams(def.params, ref.params);
  const resource = str(p, 'resource', '');
  if (resource === '') return err('EFFECT_FAILED', `modify_resource 缺少 resource（effect: ${def.id}）`);

  const targetUnit = rt.unit(target.occupantId ?? '');
  if (!targetUnit) return ok({ skipped: true, reason: 'no_occupant' });

  const mode = str(p, 'mode', 'delta');
  const value = num(p, 'value', 0);

  let delta = 0;
  let current: number;

  if (isGaugeKey(resource)) {
    const dim = resource.slice('gauge.'.length) as 'current' | 'rate' | 'threshold';
    const before = targetUnit.gauge[dim];
    current =
      mode === 'set' ? targetUnit.gauge.setValue(dim, value) : targetUnit.gauge.applyDelta(dim, value);
    delta = current - before;
  } else {
    const pool = targetUnit.pool(resource as PoolKey);
    const before = pool.current;
    delta = mode === 'set' ? pool.setValue(value) : pool.applyDelta(value);
    current = pool.current;
  }

  rt.bus.emit({
    type: 'ResourceChanged',
    actionId: ctx.actionId,
    unitId: targetUnit.id,
    key: resource,
    delta,
    value: current,
  });
  return ok({ resource, delta, value: current });
};

// ————————————————————————————————————————————————
// 6. move（必须经 Placement —— 战场唯一占位出口）
// ————————————————————————————————————————————————

const handleMove: EffectHandler = (ctx, ref, target) => {
  const rt = ctx.runtime;
  const def = rt.catalog.requireEffect(ref.ref);
  const p = effectParams(def.params, ref.params);
  const op = str(p, 'op', 'param');
  const unitId = (target.occupantId ?? null) as UnitId | null;
  if (unitId === null) return ok({ skipped: true, reason: 'empty_coordinate' });

  const from = rt.battle.coordOf(unitId);
  if (from === null) return ok({ skipped: true, reason: 'unit_not_on_field' });

  let result: Result<unknown>;

  switch (op) {
    case 'swap_neighbor': {
      const dir = num(p, 'direction', 1) >= 0 ? 1 : -1;
      const neighborIndex = from.index + dir;
      const neighbor = rt.battle.occupantAt({ ...from, index: neighborIndex });
      if (neighborIndex < 0 || neighborIndex >= rt.battle.shape.capacity || neighbor === null) {
        return ok({ skipped: true, reason: 'no_neighbor' });
      }
      result = rt.placement.swap(unitId, neighbor);
      break;
    }
    case 'insert_tail_cross_lane': {
      const lane = str(p, 'lane', '');
      if (lane === '') return err('EFFECT_FAILED', `move.insert_tail_cross_lane 缺少 lane（effect: ${def.id}）`);
      result = rt.placement.relocate(unitId, { faction: from.faction, lane, index: rt.battle.shape.capacity - 1 });
      break;
    }
    default: {
      const to = {
        faction: str(p, 'faction', from.faction),
        lane: str(p, 'lane', from.lane),
        index: Math.floor(num(p, 'index', from.index)),
      };
      result = rt.placement.relocate(unitId, to);
      break;
    }
  }

  if (!result.ok) return ok({ skipped: true, reason: result.error.code });
  return ok({ op, unitId, from: { faction: from.faction, lane: from.lane, index: from.index } });
};

// ————————————————————————————————————————————————
// 7. spawn（落位到空坐标）
// ————————————————————————————————————————————————

const handleSpawn: EffectHandler = (ctx, ref, target) => {
  const rt = ctx.runtime;
  const def = rt.catalog.requireEffect(ref.ref);
  const p = effectParams(def.params, ref.params);
  const unitDefId = str(p, 'unit_def', '') as DefId;
  if (unitDefId === '') return err('EFFECT_FAILED', `spawn 缺少 unit_def（effect: ${def.id}）`);

  // 召唤物占格、有血量、可被攻击 → summon + spawn；纯坐标效果 → zone（A23）。
  if (target.occupantId !== null) return ok({ skipped: true, reason: 'coordinate_occupied' });

  const faction = str(p, 'faction', ctx.caster.faction);
  const unit = rt.spawnUnit(unitDefId, faction, target.coord);
  if (unit === null) return ok({ skipped: true, reason: 'placement_failed' });
  rt.fireEventTriggers(unit, 'on_spawn', ctx, [target]);
  return ok({
    unitId: unit.id,
    coord: { faction: target.coord.faction, lane: target.coord.lane, index: target.coord.index },
  });
};

// ————————————————————————————————————————————————
// 8. dispel（A23 / INV-P7）
// ————————————————————————————————————————————————

const handleDispel: EffectHandler = (ctx, ref, target) => {
  const rt = ctx.runtime;
  const def = rt.catalog.requireEffect(ref.ref);
  const p = effectParams(def.params, ref.params);
  const scope = str(p, 'target', 'unit');

  if (scope === 'coordinate') {
    // 拆陷阱：移除该坐标上的 Zone。
    const zones = rt.battle.zonesAt(target.coord);
    for (const z of zones) {
      rt.battle.removeZone(z.id);
      rt.bus.emit({ type: 'ZoneRemoved', zoneId: z.id, coord: z.coord, reason: 'dispelled' });
    }
    return ok({ scope, removedZones: zones.map((z) => z.id) });
  }

  const targetUnit = rt.unit(target.occupantId ?? '');
  if (!targetUnit) return ok({ skipped: true, reason: 'no_occupant' });

  const filter = {
    ...(typeof p['dispelable'] === 'boolean' ? { dispelable: bool(p, 'dispelable', true) } : {}),
    ...(typeof p['category'] === 'string' ? { category: str(p, 'category', '') } : {}),
    ...(typeof p['count'] === 'number' ? { count: Math.floor(num(p, 'count', 0)) } : {}),
  };
  const removed = rt.dispelStatuses(targetUnit, filter);
  return ok({ scope, removed: removed.map((s) => s.instanceId) });
};

// ————————————————————————————————————————————————
// 9. drain（A17：跨效果传值不进术语，由效果内部闭环）
// ————————————————————————————————————————————————

const handleDrain: EffectHandler = (ctx, ref, target) => {
  const rt = ctx.runtime;
  const def = rt.catalog.requireEffect(ref.ref);
  const p = effectParams(def.params, ref.params);
  const element = ((ref.params?.element as Element) ?? def.element ?? 'none') as Element;

  const defender = rt.unit(target.occupantId ?? '');
  if (!isHittable(defender) || defender.hp <= 0) return ok({ skipped: true, reason: 'no_live_occupant' });

  // 先算伤害
  const raw = computeRaw(p, ctx.caster, rt.formulas);
  const result = resolveDamage(
    {
      raw,
      element,
      attacker: ctx.caster,
      defender,
      bypassArmor: def.meta?.bypassArmor ?? false,
      enterGeneralMultiplier: def.meta?.enterGeneralMultiplier ?? ctx.sourceKind !== 'status',
    },
    undefined,
    rt.formulas,
  );
  const hpBefore = defender.hp;
  applyDamageResult(defender, result);
  const actualDamage = hpBefore - defender.hp;

  // 再按实际结算结果回血——只发一条 EffectApplied（A17）。
  const healRatio = num(p, 'healRatio', 1);
  const healed = ctx.caster.pool('hp').applyDelta(actualDamage * healRatio);

  rt.bus.emit({
    type: 'DamageDealt',
    actionId: ctx.actionId,
    sourceUnitId: ctx.caster.id,
    targetUnitId: defender.id,
    element,
    raw: result.raw,
    final: result.final,
    breakdown: result.breakdown,
  });
  rt.bus.emit({ type: 'Healed', actionId: ctx.actionId, unitId: ctx.caster.id, amount: healed });

  rt.fireEventTriggers(defender, 'on_take_damage', ctx, [target]);
  rt.fireEventTriggers(ctx.caster, 'on_deal_damage', ctx, [target]);
  if (defender.hp <= 0) rt.handleDeath(defender);

  return ok({ element, damage: actualDamage, healed });
};

// ————————————————————————————————————————————————

export const EFFECT_HANDLERS: Readonly<Record<string, EffectHandler>> = {
  damage: handleDamage,
  heal: handleHeal,
  mount_status: handleMountStatus,
  modify_stat: handleModifyStat,
  modify_resource: handleModifyResource,
  move: handleMove,
  spawn: handleSpawn,
  dispel: handleDispel,
  drain: handleDrain,
};
