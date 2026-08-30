/**
 * 共享内核里被多处引用的小类型聚合入口。
 * 单独成文件是为了让各上下文只依赖 shared，不互相依赖。
 */

export type {
  CombatId,
  UnitId,
  InstanceId,
  DefId,
  FactionId,
  LaneId,
  ZoneId,
  ActionId,
  OpportunityId,
} from './ids.js';

export type { JsonValue, Params } from './json.js';
export type { DomainError, ErrorCode, Result } from './result.js';

export type {
  Element,
  DamageCategory,
  Reach,
  TriggerEvent,
  StatusCategory,
  StackPolicy,
  SortRule,
  BehaviorTrigger,
  SelectionMode,
  TargetMode,
  Consumption,
  FactionSelector,
  LaneRef,
  Anchor,
  Scope,
  Spread,
  EffectType,
  ZoneKind,
  ZoneTrigger,
  Affects,
  BehaviorModifierOp,
  RedirectTo,
  SourceFilter,
  StatKey,
  PoolKey,
  GaugeDimension,
  ResourceKey,
  UnitState,
  ActionState,
  BattleState,
} from './enums.js';
