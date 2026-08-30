/**
 * Combat：整场战斗的聚合根（§1 / §3）。
 *
 * 为什么不是 Unit 做聚合根（§1 的架构判断）：
 * 核心不变量——坍缩后队列无空洞、同一时刻只有一个单位在行动、转向后目标仍是合法坐标——
 * 全都横跨多个单位。若 Unit 各自成聚合，这些不变量没有任何聚合内能保证。
 *
 *   上下文是逻辑边界，聚合是事务边界，二者不必重合。
 *
 * 一致性范围（§3.1）：
 *   一次「结算步骤」内的全部变更 —— 强一致（失败则整体回滚到步骤开始前的快照）
 *   一个 tick 内的全部推进       —— 强一致
 *   战斗 ↔ Catalog              —— 启动时快照（INV-C3）
 *   战斗 → 外部（UI / 回放）     —— 最终一致（领域事件异步广播）
 */

import type { ActionId, CombatId, DefId, FactionId, InstanceId, LaneId, OpportunityId, UnitId, ZoneId } from '../shared/ids.js';
import { SequentialIdGenerator, type IdGenerator } from '../shared/ids.js';
import type { BattleState, TriggerEvent } from '../shared/enums.js';
import { ok, err, type Result } from '../shared/result.js';
import { EventBus, type DomainEvent } from '../shared/events.js';
import type { EffectRef, StatusGrant, UnitDef } from '../catalog/model.js';
import type { Catalog } from '../catalog/catalog.js';
import { Mulberry32RandomSource, RandomUsageRegistry, type RandomSource } from '../random/random-source.js';

import { BattlefieldShape, DEFAULT_BATTLEFIELD, type BattlefieldConfig } from '../battle/battlefield.js';
import { Battle } from '../battle/battle.js';
import { Placement } from '../battle/placement.js';
import type { Coordinate } from '../battle/coordinate.js';
import type { Zone } from '../battle/zone.js';

import { Unit } from '../roster/unit.js';
import { UnitRegistry } from '../roster/registry.js';
import type { StatusInstance } from '../roster/status.js';
import type { BehaviorSlot } from '../roster/behavior-slot.js';
import { passiveSlotsOf } from '../roster/unit.js';

import { BattleClock } from '../scheduling/clock.js';
import { resolveOrder, DEFAULT_ALTERNATE_PATTERN } from '../scheduling/initiative.js';
import { createOpportunity, type ActionOpportunity } from '../scheduling/opportunity.js';
import { availableBehaviors } from '../scheduling/filter.js';

import type { EffectContext, EffectRuntime, DispelFilter } from '../effect/context.js';
import { executeEffectList } from '../effect/executor.js';

import type { CombatHost } from '../execution/host.js';
import type { Action } from '../execution/action.js';
import type { ResolvedTarget } from '../execution/target.js';
import { fireTriggeredAction, triggerZone } from '../execution/pipeline.js';
import { commitBehavior, completeChannel, type CommitOptions } from '../execution/commit.js';

/** 触发链的最大深度：INV-E4 防环的最后一道保险。 */
const MAX_TRIGGER_DEPTH = 8;
/** 区域触发的重入保护：区域效果可能导致新的占位变化，从而再次触发区域。 */
const MAX_ZONE_DEPTH = 4;

export interface RosterEntry {
  readonly unitDefId: DefId;
  readonly faction: FactionId;
  readonly lane: LaneId;
  /** 指定单位 id（回放 / 测试用）；不指定则自动生成。 */
  readonly id?: UnitId;
}

export interface CombatConfig {
  readonly id: CombatId;
  /** R2：种子在战斗创建时确定并写入战斗记录。 */
  readonly seed: number;
  readonly catalog: Catalog;
  readonly roster: readonly RosterEntry[];
  readonly battlefield?: BattlefieldConfig;
  /** 安全阀：防止两个不死单位互相耗到天荒地老。 */
  readonly maxTicks?: number;
}

export interface CombatDecision {
  readonly slot: BehaviorSlot;
  readonly selection?: readonly number[];
}

/**
 * 决策器：决定持有机会的单位用什么行为、打谁。
 *
 * 抽成接口是因为"谁在决策"有三种场景（玩家 / AI / 状态触发的自动点火），
 * 而 A9 要求 Manual 模式必须有确定性兜底，无玩家在场时才不会退化成未定义行为。
 */
export interface CombatDecider {
  decide(combat: Combat, unit: Unit, candidates: readonly BehaviorSlot[]): CombatDecision | null;
}

/** 默认决策器：永远取第一个可选行为（确定性，用于回放与无 AI 场景）。 */
export class FirstAvailableDecider implements CombatDecider {
  decide(_combat: Combat, _unit: Unit, candidates: readonly BehaviorSlot[]): CombatDecision | null {
    return candidates.length > 0 ? { slot: candidates[0] as BehaviorSlot } : null;
  }
}

/**
 * 轮换决策器：按机会次数轮流使用可选行为。
 *
 * 它仍然完全确定（计数只依赖推进顺序），但比 FirstAvailable 更能压到编目的
 * 各个角落——技能、引导、区域、状态挂载都会被跑到，适合冒烟与回归验证。
 */
export class RotatingDecider implements CombatDecider {
  private readonly cursor = new Map<UnitId, number>();

  decide(_combat: Combat, unit: Unit, candidates: readonly BehaviorSlot[]): CombatDecision | null {
    if (candidates.length === 0) return null;
    const n = this.cursor.get(unit.id) ?? 0;
    this.cursor.set(unit.id, n + 1);
    return { slot: candidates[n % candidates.length] as BehaviorSlot };
  }
}

export class Combat implements CombatHost, EffectRuntime {
  readonly battle: Battle;
  readonly shape: BattlefieldShape;
  readonly placement: Placement;
  readonly registry = new UnitRegistry();
  readonly clock = new BattleClock();
  readonly bus = new EventBus();
  readonly ids: IdGenerator = new SequentialIdGenerator();
  readonly random: RandomSource;
  readonly randomRegistry = new RandomUsageRegistry();
  readonly actions = new Map<ActionId, Action>();

  decider: CombatDecider = new FirstAvailableDecider();

  private readonly opportunities = new Map<UnitId, ActionOpportunity>();
  private zoneDepth = 0;
  private triggerDepth = 0;
  private finishing = false;

  constructor(
    readonly id: CombatId,
    readonly seed: number,
    readonly catalog: Catalog,
    private readonly maxTicks: number = 500,
  ) {
    this.random = new Mulberry32RandomSource(seed);
    this.shape = new BattlefieldShape(DEFAULT_BATTLEFIELD);
    this.battle = new Battle(this.shape);
    this.placement = new Placement(this.battle, this.bus, (moves) => this.registry.syncProjections(moves));
    this.bus.subscribe((e) => this.onDomainEvent(e));
  }

  // ————————————————————————————————————————————————
  // 创建
  // ————————————————————————————————————————————————

  static create(config: CombatConfig): Result<Combat> {
    const combat = new Combat(config.id, config.seed, config.catalog, config.maxTicks ?? 500);
    if (config.battlefield) {
      // shape 在构造时已定型，这里只做一致性校验，避免"配置与结构不符"的静默错误。
      const expected = new BattlefieldShape(config.battlefield);
      if (expected.capacity !== combat.shape.capacity) {
        return err('INVALID_COORDINATE', '战场配置与已建结构不一致');
      }
    }
    for (const entry of config.roster) {
      const r = combat.addUnit(entry.unitDefId, entry.faction, entry.lane, entry.id);
      if (!r.ok) return r;
    }
    combat.battle.state = 'ready';
    combat.bus.emit({ type: 'CombatStarted', combatId: combat.id, seed: combat.seed });
    return ok(combat);
  }

  private addUnit(unitDefId: DefId, faction: FactionId, lane: LaneId, id?: UnitId): Result<Unit> {
    const def = this.catalog.unit(unitDefId);
    if (!def) return err('CATALOG_UNRESOLVED_REF', `单位蓝本 ${unitDefId} 不存在`);
    if (!this.shape.hasFaction(faction)) return err('INVALID_COORDINATE', `未知阵营 ${faction}`);
    if (!this.shape.hasLane(lane)) return err('INVALID_COORDINATE', `未知路线 ${lane}`);

    const unit = Unit.create({
      id: id ?? this.ids.next('unit'),
      faction,
      unitDef: def,
      catalog: this.catalog,
      ids: this.ids,
    });
    this.registry.add(unit);

    // 插入队尾：Placement 会把它落到该路第一个空位并坍缩。
    const inserted = this.placement.insert(unit.id, {
      faction,
      lane,
      index: this.shape.capacity - 1,
    });
    if (!inserted.ok) {
      this.registry.drop(unit.id);
      return inserted;
    }
    this.bus.emit({ type: 'UnitSpawned', unitId: unit.id, coord: unit.position as Coordinate });
    this.fireEventTriggers(unit, 'on_spawn', this.rootContext(unit.id));
    return ok(unit);
  }

  get state(): BattleState {
    return this.battle.state;
  }

  get tickIndex(): number {
    return this.clock.tickIndex;
  }

  get isFinished(): boolean {
    return this.battle.state === 'finished';
  }

  // ————————————————————————————————————————————————
  // EffectRuntime / CombatHost 实现
  // ————————————————————————————————————————————————

  get formulas(): Catalog['formulas'] {
    return this.catalog.formulas;
  }

  unit(id: UnitId): Unit | undefined {
    return this.registry.get(id);
  }

  unitAt(coord: Coordinate): Unit | undefined {
    const occupant = this.battle.occupantAt(coord);
    return occupant === null ? undefined : this.registry.get(occupant);
  }

  allUnits(): readonly Unit[] {
    return this.registry.all();
  }

  currentOpportunity(unitId: UnitId): ActionOpportunity | null {
    const op = this.opportunities.get(unitId);
    return op && op.consumedBy === null ? op : null;
  }

  consumeOpportunity(opportunity: ActionOpportunity, actionId: ActionId): void {
    opportunity.consumedBy = actionId;
    this.opportunities.set(opportunity.unitId, opportunity);
  }

  wasteOpportunity(opportunity: ActionOpportunity, reason: string): void {
    this.bus.emit({
      type: 'ActionOpportunityWasted',
      unitId: opportunity.unitId,
      opportunityId: opportunity.id,
      tickIndex: opportunity.tickIndex,
      reason,
    });
    // INV-S4：未消耗的机会不累积到下一 tick——越界部分按策略处理。
    this.registry.get(opportunity.unitId)?.gauge.settleOverflow();
    this.opportunities.delete(opportunity.unitId);
  }

  executeEffects(
    effects: readonly EffectRef[],
    caster: Unit,
    targets: readonly ResolvedTarget[],
    ctx: EffectContext,
  ): void {
    executeEffectList(ctx, effects, targets);
    void caster;
  }

  mountStatus(target: Unit, defId: DefId, grant: StatusGrant, ctx: EffectContext): StatusInstance | null {
    const def = this.catalog.status(defId);
    if (!def) return null;

    const res = target.statuses.mount(def, grant, this.ids);
    target.invalidateConstraints();

    // INV-P5：硬控（control）命中时清除目标身上全部 stance 状态。
    // 用"分类驱动"批量行为，而不是在眩晕里枚举要清除哪些状态。
    if (def.category === 'control') {
      for (const stance of target.statuses.removeByCategory('stance')) {
        this.unmountStatus(target, stance.instanceId, 'dispelled');
      }
    }

    this.bus.emit(
      res.outcome === 'refreshed'
        ? {
            type: 'StatusRefreshed',
            instanceId: res.instance.instanceId,
            unitId: target.id,
            defId,
            stacks: res.instance.currentStacks,
            duration: res.instance.remaining,
          }
        : {
            type: 'StatusMounted',
            instanceId: res.instance.instanceId,
            unitId: target.id,
            defId,
            stacks: res.instance.currentStacks,
            duration: res.instance.remaining,
          },
    );

    if (res.outcome !== 'rejected') {
      this.fireStatusTriggers(target, defId, 'on_apply', ctx);
    }
    return res.outcome === 'rejected' ? null : res.instance;
  }

  unmountStatus(
    target: Unit,
    instanceId: InstanceId,
    reason: 'expired' | 'dispelled' | 'unit_left' | 'consumed',
  ): void {
    const inst = target.statuses.get(instanceId);
    if (!inst) return;
    const def = this.catalog.status(inst.defId);

    if (def) this.fireStatusTriggers(target, inst.defId, 'on_remove', this.rootContext(instanceId));

    // INV-P2：按来源回滚，恢复到该来源写入前的值。
    target.provenance.revertBySource(instanceId, reason);
    target.statuses.unmount(instanceId);
    target.invalidateConstraints();

    this.bus.emit({
      type: 'StatusRemoved',
      instanceId,
      unitId: target.id,
      defId: inst.defId,
      reason,
    });
  }

  /** INV-P7：只作用于 StatusInstance，绝不碰 modify_stat 写入的属性修正。 */
  dispelStatuses(target: Unit, filter: DispelFilter): readonly StatusInstance[] {
    const candidates = target.statuses.all().filter((inst) => {
      const def = this.catalog.status(inst.defId);
      if (!def) return false;
      if (filter.dispelable !== undefined && def.dispelable !== filter.dispelable) return false;
      if (filter.category !== undefined && def.category !== filter.category) return false;
      if (filter.dispelable === undefined && filter.category === undefined && !def.dispelable) return false;
      return true;
    });
    const limited = filter.count === undefined ? candidates : candidates.slice(0, filter.count);
    for (const inst of limited) this.unmountStatus(target, inst.instanceId, 'dispelled');
    return limited;
  }

  /**
   * 触发某单位身上的状态触发器与被动行为（(a) 触发型贡献）。
   * INV-E4：on_take_damage 触发的 Action 不再二次触发 on_take_damage。
   */
  fireEventTriggers(
    unit: Unit,
    event: TriggerEvent,
    ctx: EffectContext,
    extraTargets?: readonly ResolvedTarget[],
  ): void {
    if (!unit.isAlive) return;
    // INV-E4 防环：同一次伤害链内不再二次触发 on_take_damage。
    if (event === 'on_take_damage' && ctx.cause === 'on_take_damage') return;
    if (ctx.depth >= MAX_TRIGGER_DEPTH) return;

    const targets: readonly ResolvedTarget[] =
      extraTargets ?? (unit.position ? [{ coord: unit.position, occupantId: unit.id }] : []);
    if (targets.length === 0) return;

    const next: EffectContext = { ...ctx, depth: ctx.depth + 1, cause: event };
    this.triggerDepth += 1;
    try {
      // 状态触发器
      for (const inst of [...unit.statuses.all()]) {
        const def = this.catalog.status(inst.defId);
        if (!def) continue;
        const trs = def.triggers.filter((t) => t.event === event);
        for (const tr of trs) {
          const effects = tr.effects.length > 0 ? tr.effects : (def.payload ?? []);
          if (effects.length === 0) continue;
          this.dispatchTriggeredAction(unit, effects, targets, event, inst.instanceId, next);
        }
      }
      // 被动行为（passiveHook）
      for (const slot of passiveSlotsOf(unit, event)) {
        if (slot.effects.length === 0) continue;
        this.dispatchTriggeredAction(unit, slot.effects, targets, event, slot.instanceId, next);
      }
    } finally {
      this.triggerDepth -= 1;
    }
  }

  private fireStatusTriggers(target: Unit, defId: DefId, event: TriggerEvent, ctx: EffectContext): void {
    const def = this.catalog.status(defId);
    if (!def) return;
    const trs = def.triggers.filter((t) => t.event === event);
    for (const tr of trs) {
      const effects = tr.effects.length > 0 ? tr.effects : (def.payload ?? []);
      if (effects.length === 0) continue;
      const targets: ResolvedTarget[] = target.position
        ? [{ coord: target.position, occupantId: target.id }]
        : [];
      this.dispatchTriggeredAction(
        target,
        effects,
        targets,
        event,
        target.statuses.ofDef(defId)?.instanceId ?? (defId as InstanceId),
        { ...ctx, depth: ctx.depth + 1 },
      );
    }
  }

  private dispatchTriggeredAction(
    caster: Unit,
    effects: readonly EffectRef[],
    targets: readonly ResolvedTarget[],
    cause: TriggerEvent,
    sourceId: InstanceId,
    ctx: EffectContext,
  ): void {
    fireTriggeredAction(this, caster, effects, targets, cause, sourceId, ctx.depth);
  }

  spawnUnit(unitDefId: DefId, faction: FactionId, coord: Coordinate): Unit | null {
    const def: UnitDef | undefined = this.catalog.unit(unitDefId);
    if (!def) return null;
    const unit = Unit.create({
      id: this.ids.next('unit'),
      faction,
      unitDef: def,
      catalog: this.catalog,
      ids: this.ids,
    });
    this.registry.add(unit);
    const r = this.placement.insert(unit.id, coord);
    if (!r.ok) {
      this.registry.drop(unit.id);
      return null;
    }
    this.bus.emit({ type: 'UnitSpawned', unitId: unit.id, coord });
    return unit;
  }

  /** 单位死亡：亡语 → 离场 → 坍缩 → revertAll（§13 / INV-P4）。 */
  handleDeath(unit: Unit): void {
    if (unit.state === 'dying' || unit.state === 'removed') return;
    unit.state = 'dying';
    this.bus.emit({ type: 'UnitDied', unitId: unit.id, coord: unit.position });

    this.fireEventTriggers(unit, 'on_death', this.rootContext(unit.id));

    const at = unit.position;
    if (at !== null) this.placement.remove(unit.id);

    // 先撤销本单位写出的全部属性修正（INV-P4：否则修正会泄漏）。
    for (const inst of [...unit.statuses.all()]) {
      this.unmountStatus(unit, inst.instanceId, 'unit_left');
    }
    unit.provenance.revertAll('unit_left');
    unit.invalidateConstraints();

    unit.state = 'removed';
    this.registry.drop(unit.id);
    this.bus.emit({ type: 'UnitRemoved', unitId: unit.id });

    this.checkFinished();
  }

  /** 系统级（非行为驱动）的效果上下文：以目标单位自身作为施法方。 */
  private rootContext(sourceId: InstanceId, caster?: Unit): EffectContext {
    const self = caster ?? this.registry.all()[0];
    return {
      runtime: this,
      actionId: 'system' as ActionId,
      caster: self as Unit,
      sourceKind: 'status',
      sourceId,
      depth: 0,
      cause: null,
    };
  }

  // ————————————————————————————————————————————————
  // tick 推进
  // ————————————————————————————————————————————————

  /** 推进一个原子步，并依次授予 / 消耗机会。 */
  tick(): Result<void> {
    if (this.isFinished) return ok(undefined);
    if (this.battle.state === 'ready') this.battle.state = 'running';
    if (this.maxTicks > 0 && this.clock.tickIndex >= this.maxTicks) {
      this.finish(null);
      return ok(undefined);
    }

    this.opportunities.clear();

    const crossed = this.clock.tick({
      units: () => this.registry.all(),
      battle: this.battle,
      bus: this.bus,
      onGaugeAdvance: (unit, result) => {
        if (result.crossed) this.bus.emit({ type: 'GaugeCrossed', unitId: unit.id, gaugeKey: unit.gauge.key });
      },
      onStatusTick: (unit) => this.fireEventTriggers(unit, 'on_tick', this.rootContext(unit.id as InstanceId)),
      onChannelTick: (unit) => {
        const ch = unit.channel;
        if (ch) completeChannel(this, unit, ch.actionId);
      },
      onStatusExpired: (unit, inst) => this.unmountStatus(unit, inst.instanceId, 'expired'),
      onStatReverted: (unit, reverted) => {
        for (const r of reverted) {
          this.bus.emit({
            type: 'StatReverted',
            unitId: unit.id,
            stat: r.stat,
            sourceId: r.sourceId,
            reason: r.reason,
          });
        }
      },
      onZoneExpired: (zone) => {
        this.battle.removeZone(zone.id);
        this.bus.emit({ type: 'ZoneRemoved', zoneId: zone.id, coord: zone.coord, reason: 'duration_expired' });
      },
    });

    // 第 8 步：收集 GaugeCrossed → 排序 → 依次授予机会。
    const order = resolveOrder(
      crossed
        .filter((u) => u.isAlive && u.position !== null)
        .map((u) => ({
          unitId: u.id,
          faction: u.faction,
          lane: u.position?.lane ?? (this.shape.lanes[0] as LaneId),
          index: u.position?.index ?? 0,
        })),
      { factionOrder: this.shape.factions, pattern: DEFAULT_ALTERNATE_PATTERN },
    );

    for (const unitId of order) {
      if (this.isFinished) break;
      const unit = this.registry.get(unitId);
      if (!unit || !unit.isAlive || unit.position === null) continue;
      // INV-S3：同 tick 内每单位至多一次机会。
      if (this.opportunities.has(unitId)) continue;
      this.grantOpportunity(unit);
    }

    this.checkFinished();
    return ok(undefined);
  }

  private grantOpportunity(unit: Unit): void {
    const op = createOpportunity(this.ids.next('opportunity') as OpportunityId, unit.id, this.clock.tickIndex);
    this.opportunities.set(unit.id, op);
    this.bus.emit({
      type: 'ActionOpportunityGranted',
      unitId: unit.id,
      opportunityId: op.id,
      tickIndex: op.tickIndex,
    });

    const candidates = availableBehaviors(unit);
    const decision = this.decider.decide(this, unit, candidates);
    if (!decision) {
      // INV-S4：未消耗即记为 wasted，不累积到下一 tick。
      this.wasteOpportunity(op, candidates.length === 0 ? 'no_available_behavior' : 'decider_abstained');
      return;
    }
    const r = this.submit(unit.id, decision.slot.instanceId, { selection: decision.selection });
    if (!r.ok) this.wasteOpportunity(op, r.error.code);
  }

  /** 玩家 / AI 主动提交行为。 */
  submit(unitId: UnitId, behaviorInstanceId: InstanceId, options: CommitOptions = {}): Result<Action> {
    const unit = this.registry.get(unitId);
    if (!unit) return err('UNIT_NOT_FOUND', `单位 ${unitId} 不存在`);
    const slot = unit.behaviorSlots.find((b) => b.instanceId === behaviorInstanceId);
    if (!slot) return err('BEHAVIOR_NOT_AVAILABLE', `单位 ${unitId} 没有行为 ${behaviorInstanceId}`);
    return commitBehavior(this, unit, slot, options);
  }

  // ————————————————————————————————————————————————
  // 事件回响：Zone 的唯一触发入口
  // ————————————————————————————————————————————————

  private onDomainEvent(e: DomainEvent): void {
    if (e.type !== 'OccupancyChanged') return;
    // Zone 不监听"移动"这个动作，只监听"占用关系变化"这个事实（§4.3 第 7 步）。
    if (this.zoneDepth >= MAX_ZONE_DEPTH) return;
    this.zoneDepth += 1;
    try {
      for (const entry of e.entered) {
        const unit = this.registry.get(entry.unitId);
        if (!unit || !unit.isAlive) continue;
        for (const zone of this.battle.zonesAt(entry.coord)) {
          triggerZone(this, zone, unit, 'zone' as ActionId);
        }
      }
    } finally {
      this.zoneDepth -= 1;
    }
  }

  private checkFinished(): void {
    if (this.finishing || this.isFinished) return;
    const alive = new Set(this.registry.alive().map((u) => u.faction));
    if (alive.size <= 1) {
      const winner = alive.size === 1 ? ([...alive][0] as FactionId) : null;
      this.finish(winner);
    }
  }

  private finish(winner: FactionId | null): void {
    this.finishing = true;
    this.battle.state = 'finished';
    this.bus.emit({ type: 'CombatFinished', winner, tickIndex: this.clock.tickIndex });
  }

  /** 所有区域（测试与调试用）。 */
  zones(): readonly Zone[] {
    return this.battle.allZones();
  }

  zoneById(id: ZoneId): Zone | undefined {
    return this.battle.allZones().find((z) => z.id === id);
  }
}

/**
 * 依赖方向说明：Combat（聚合根）→ execution / effect / scheduling / roster / battle，
 * 而这些模块只依赖 shared 与各自定义的窄接口（EffectRuntime / CombatHost），
 * 不反向依赖 Combat。因此不存在模块循环，也不需要任何惰性解析。
 */
