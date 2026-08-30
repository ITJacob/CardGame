/**
 * 效果执行的上下文与运行时契约。
 *
 * 效果层需要访问"几乎整个战斗"，但绝不能反向依赖执行 / 调度上下文的具体类，
 * 否则会形成一个谁也拆不开的环。做法：这里只声明一组窄接口（EffectRuntime），
 * 由聚合根 Combat 实现并注入——依赖方向始终是 效果 → 抽象，Combat → 效果。
 */

import type { ActionId, DefId, FactionId, InstanceId, UnitId } from '../shared/ids.js';
import type { TriggerEvent } from '../shared/enums.js';
import type { JsonValue } from '../shared/json.js';
import type { EventBus } from '../shared/events.js';
import type { IdGenerator } from '../shared/ids.js';
import type { EffectRef, StatusGrant, UnitDef } from '../catalog/model.js';
import type { Catalog } from '../catalog/catalog.js';
import type { FormulaConfig } from '../catalog/balance.js';
import type { Unit } from '../roster/unit.js';
import type { StatusInstance } from '../roster/status.js';
import type { Coordinate } from '../battle/coordinate.js';
import type { Battle } from '../battle/battle.js';
import type { Placement } from '../battle/placement.js';
import type { ResolvedTarget } from '../execution/target.js';
import type { RandomSource, RandomUsageRegistry } from '../random/random-source.js';

/** 效果的来源种类。影响 INV-D4（状态伤害不进通用乘区）等判定。 */
export type SourceKind = 'behavior' | 'status' | 'zone' | 'melee_clash';

export interface DispelFilter {
  readonly dispelable?: boolean;
  readonly category?: string;
  readonly count?: number;
}

/**
 * 效果执行所需的运行时能力。由 Combat 聚合根实现。
 */
export interface EffectRuntime {
  readonly catalog: Catalog;
  readonly ids: IdGenerator;
  readonly random: RandomSource;
  readonly randomRegistry: RandomUsageRegistry;
  readonly bus: EventBus;
  readonly formulas: FormulaConfig;
  readonly battle: Battle;
  readonly placement: Placement;

  unit(id: UnitId): Unit | undefined;
  unitAt(coord: Coordinate): Unit | undefined;
  allUnits(): readonly Unit[];

  /** 逐目标执行一串效果（状态载荷 / 区域载荷 / 递归触发都走这里）。 */
  executeEffects(
    effects: readonly EffectRef[],
    caster: Unit,
    targets: readonly ResolvedTarget[],
    ctx: EffectContext,
  ): void;

  /** 挂载状态（含 on_apply 触发与 INV-P5 硬控清姿态）。 */
  mountStatus(
    target: Unit,
    defId: DefId,
    grant: StatusGrant,
    ctx: EffectContext,
  ): StatusInstance | null;

  /** 移除状态（含溯源回滚）。 */
  unmountStatus(target: Unit, instanceId: InstanceId, reason: 'expired' | 'dispelled' | 'unit_left' | 'consumed'): void;

  /** 驱散（INV-P7：只作用于 StatusInstance，不碰属性修正）。 */
  dispelStatuses(target: Unit, filter: DispelFilter): readonly StatusInstance[];

  /**
   * 触发某单位身上的状态触发器与被动行为（(a) 触发型贡献）。
   * INV-E4：on_take_damage 触发的 Action 不再二次触发 on_take_damage。
   */
  fireEventTriggers(
    unit: Unit,
    event: TriggerEvent,
    ctx: EffectContext,
    extraTargets?: readonly ResolvedTarget[],
  ): void;


  /** 生成新单位（spawn 效果）。落位失败返回 null（如路线已满，INV-B7）。 */
  spawnUnit(unitDefId: DefId, faction: FactionId, coord: Coordinate): Unit | null;

  /** 单位死亡处理：亡语 → 离场 → revertAll（INV-P4）。 */
  handleDeath(unit: Unit): void;
}

export interface EffectContext {
  readonly runtime: EffectRuntime;
  readonly actionId: ActionId;
  readonly caster: Unit;
  readonly sourceKind: SourceKind;
  /** 溯源用的来源 id：状态触发时是 StatusInstanceId，行为触发时是行为实例 id。 */
  readonly sourceId: InstanceId;
  /** 嵌套深度，用于 INV-E4 类防环。 */
  readonly depth: number;
  /** 触发来源事件；主动行为提交时为 null。 */
  readonly cause: TriggerEvent | null;
}

export function childContext(ctx: EffectContext, patch: Partial<EffectContext>): EffectContext {
  return { ...ctx, ...patch };
}

/** 效果的落地结果：进事件载荷（EffectApplied.outcome），所以必须是可序列化的。 */
export type EffectOutcome = JsonValue;

/** 效果的入参读取：EffectRef.params 覆写 EffectDef.params（INV-C2）。 */
export function effectParams(defParams: JsonValue | undefined, refParams: JsonValue | undefined): Readonly<Record<string, JsonValue>> {
  const base = (defParams ?? {}) as Record<string, JsonValue>;
  const over = (refParams ?? {}) as Record<string, JsonValue>;
  return { ...base, ...over };
}
