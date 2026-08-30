/**
 * 领域事件字典（02_详细设计 §10.5）。
 *
 * 事件是战斗向外部（UI / 回放 / 统计）广播的唯一出口，最终一致，不参与战斗一致性。
 * 事件流 + seed + 初始状态 = 精确回放的素材；
 * originTerm 与 element 必须进入事件载荷，否则战报无法解释"这一下为什么这么痛"。
 */

import type { ActionId, DefId, Element, FactionId, InstanceId, JsonValue, OpportunityId, UnitId, EffectType } from './types.js';
import type { Coordinate } from '../battle/coordinate.js';
import type { OccupancyEntry } from '../battle/occupancy.js';
import type { DamageBreakdownEntry } from '../effect/damage-chain.js';

export type { OccupancyEntry, DamageBreakdownEntry };

/** 目标解析结果的最小投影（避免事件层持有运行态实体）。 */
export interface ResolvedTargetRef {
  readonly coord: Coordinate;
  readonly occupantId: UnitId | null;
}

/** 一次转向的审计记录。 */
export interface RedirectStepRef {
  readonly from: ResolvedTargetRef;
  readonly to: ResolvedTargetRef;
  readonly sourceId: InstanceId;
  readonly priority: number;
}

export type StatusChangeReason = 'expired' | 'dispelled' | 'unit_left' | 'consumed';

export type DomainEvent =
  // —— 调度 ——
  | { readonly type: 'TickAdvanced'; readonly tickIndex: number }
  | { readonly type: 'GaugeCrossed'; readonly unitId: UnitId; readonly gaugeKey: string }
  | {
      readonly type: 'ActionOpportunityGranted';
      readonly unitId: UnitId;
      readonly opportunityId: OpportunityId;
      readonly tickIndex: number;
    }
  | {
      readonly type: 'ActionOpportunityWasted';
      readonly unitId: UnitId;
      readonly opportunityId: OpportunityId;
      readonly tickIndex: number;
      readonly reason: string;
    }
  // —— 执行 ——
  | {
      readonly type: 'BehaviorCommitted';
      readonly actionId: ActionId;
      readonly casterId: UnitId;
      readonly behaviorInstanceId: InstanceId;
      readonly gaugeCost: number;
      readonly energyCost: number;
    }
  | { readonly type: 'ChannelStarted'; readonly unitId: UnitId; readonly actionId: ActionId; readonly castTime: number }
  | { readonly type: 'ChannelInterrupted'; readonly unitId: UnitId; readonly actionId: ActionId }
  | { readonly type: 'ChannelCompleted'; readonly unitId: UnitId; readonly actionId: ActionId }
  | { readonly type: 'ActionCreated'; readonly actionId: ActionId; readonly casterId: UnitId; readonly ignition: string }
  | { readonly type: 'TargetsResolved'; readonly actionId: ActionId; readonly targets: readonly ResolvedTargetRef[] }
  | { readonly type: 'ActionRedirected'; readonly actionId: ActionId; readonly step: RedirectStepRef }
  | { readonly type: 'ActionResolved'; readonly actionId: ActionId; readonly state: string }
  // —— 效果 ——
  | {
      readonly type: 'EffectApplied';
      readonly actionId: ActionId;
      readonly effectRef: DefId;
      readonly effectType: EffectType;
      readonly element: Element;
      readonly originTerm: string | null;
      readonly target: ResolvedTargetRef;
      readonly outcome: JsonValue;
    }
  | {
      readonly type: 'DamageDealt';
      readonly actionId: ActionId;
      readonly sourceUnitId: UnitId;
      readonly targetUnitId: UnitId;
      readonly element: Element;
      readonly raw: number;
      readonly final: number;
      readonly breakdown: readonly DamageBreakdownEntry[];
    }
  | { readonly type: 'Healed'; readonly actionId: ActionId; readonly unitId: UnitId; readonly amount: number }
  | {
      readonly type: 'ResourceChanged';
      readonly actionId: ActionId;
      readonly unitId: UnitId;
      readonly key: string;
      readonly delta: number;
      readonly value: number;
    }
  | {
      readonly type: 'StatModified';
      readonly unitId: UnitId;
      readonly stat: string;
      readonly delta: number;
      readonly sourceId: InstanceId;
      readonly remaining: number | null;
    }
  | {
      readonly type: 'StatReverted';
      readonly unitId: UnitId;
      readonly stat: string;
      readonly sourceId: InstanceId;
      readonly reason: string;
    }
  // —— 战场 ——
  | {
      readonly type: 'OccupancyChanged';
      readonly entered: readonly OccupancyEntry[];
      readonly left: readonly OccupancyEntry[];
    }
  | { readonly type: 'ZonePlaced'; readonly zoneId: string; readonly coord: Coordinate; readonly defId: DefId }
  | { readonly type: 'ZoneTriggered'; readonly zoneId: string; readonly coord: Coordinate; readonly unitId: UnitId }
  | { readonly type: 'ZoneRemoved'; readonly zoneId: string; readonly coord: Coordinate; readonly reason: string }
  // —— 编队 ——
  | {
      readonly type: 'StatusMounted';
      readonly instanceId: InstanceId;
      readonly unitId: UnitId;
      readonly defId: DefId;
      readonly stacks: number;
      readonly duration: number;
    }
  | {
      readonly type: 'StatusRefreshed';
      readonly instanceId: InstanceId;
      readonly unitId: UnitId;
      readonly defId: DefId;
      readonly stacks: number;
      readonly duration: number;
    }
  | {
      readonly type: 'StatusRemoved';
      readonly instanceId: InstanceId;
      readonly unitId: UnitId;
      readonly defId: DefId;
      readonly reason: StatusChangeReason;
    }
  | { readonly type: 'UnitSpawned'; readonly unitId: UnitId; readonly coord: Coordinate }
  | { readonly type: 'UnitDied'; readonly unitId: UnitId; readonly coord: Coordinate | null }
  | { readonly type: 'UnitRemoved'; readonly unitId: UnitId }
  // —— 聚合 ——
  | { readonly type: 'CombatStarted'; readonly combatId: string; readonly seed: number }
  | { readonly type: 'CombatFinished'; readonly winner: FactionId | null; readonly tickIndex: number };

export type DomainEventType = DomainEvent['type'];

export type EventHandler = (event: DomainEvent) => void;

/**
 * 事件总线 + 事件日志。
 *
 * 先记录再通知：即使订阅者抛错，日志也已经完整（回放不依赖订阅者的正确性）。
 */
export class EventBus {
  private readonly handlers: EventHandler[] = [];
  private readonly recorded: DomainEvent[] = [];

  subscribe(handler: EventHandler): () => void {
    this.handlers.push(handler);
    return () => {
      const i = this.handlers.indexOf(handler);
      if (i >= 0) this.handlers.splice(i, 1);
    };
  }

  emit(event: DomainEvent): void {
    this.recorded.push(event);
    for (const h of [...this.handlers]) h(event);
  }

  /** 完整事件流，供回放与验证。 */
  get log(): readonly DomainEvent[] {
    return this.recorded;
  }

  clearLog(): void {
    this.recorded.length = 0;
  }
}
