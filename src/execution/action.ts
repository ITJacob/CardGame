/**
 * Action 实体与 ActionSource 薄接口（A5 / §7.1 / §7.2）。
 *
 * ActionSource 统一发生在流水线入口，不碰各自生命周期——
 * 行为、状态、技能三者不共享生命周期管理，只共享这个契约与产物类型（Action）。
 * 未来加装备 / 地形 / 光环触发，流水线零改动。
 */

import type { ActionId, InstanceId, OpportunityId, UnitId } from '../shared/ids.js';
import type { ActionState, Consumption, Reach, TriggerEvent } from '../shared/enums.js';
import type { EffectRef } from '../catalog/model.js';
import type { TargetSpec } from '../shared/target-spec.js';
import type { DamageResult } from '../effect/damage-chain.js';
import type { EffectExecution } from '../effect/executor.js';
import type { CandidatePool, ResolvedTarget } from './target.js';
import type { RedirectStep } from './pipeline-r.js';

export type Ignition =
  | { readonly kind: 'commit'; readonly opportunityId: OpportunityId }
  | { readonly kind: 'event_trigger'; readonly cause: TriggerEvent | null };

export interface ActionSource {
  /** 审计标识：行为键 / 状态 id / 技能 id。 */
  readonly sourceRef: string;
  readonly sourceInstanceId: InstanceId;
  readonly ignition: Ignition;
  readonly targetSpec: TargetSpec | null;
  readonly effects: readonly EffectRef[];
  readonly reach: Reach;
}

export interface ActionInit extends ActionSource {
  readonly id: ActionId;
  readonly casterId: UnitId;
  readonly consumption: Consumption;
  readonly castTime: number;
}

export class Action {
  /** I 节点产出，此后不再修改（INV-E5：干净快照，干预只做增量改写）。 */
  committedTargets: readonly ResolvedTarget[] = [];
  candidatePool: CandidatePool | null = null;

  /** R 节点产出。 */
  finalTargets: readonly ResolvedTarget[] = [];
  readonly redirectLog: RedirectStep[] = [];
  settlementPlan: ReadonlyMap<string, DamageResult> = new Map();

  /** O 节点产出。 */
  readonly outcomes: EffectExecution[] = [];

  state: ActionState = 'created';
  /** 引导剩余 tick；> 0 时处于 Pending。 */
  remainingCast: number;

  constructor(readonly init: ActionInit) {
    this.remainingCast = init.castTime;
  }

  get id(): ActionId {
    return this.init.id;
  }

  get casterId(): UnitId {
    return this.init.casterId;
  }

  get effects(): readonly EffectRef[] {
    return this.init.effects;
  }

  get reach(): Reach {
    return this.init.reach;
  }

  get consumption(): Consumption {
    return this.init.consumption;
  }

  get isTriggered(): boolean {
    return this.init.ignition.kind === 'event_trigger';
  }

  get opportunityId(): OpportunityId | null {
    return this.init.ignition.kind === 'commit' ? this.init.ignition.opportunityId : null;
  }
}
