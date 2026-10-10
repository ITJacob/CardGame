// Action：一次行为的结算载体（执行上下文 §三）。
import type { Consumption } from '../shared/types'
import type { CasterSnapshot, Action, ResolvedTarget } from './types'
import type { CombatUnit } from '../roster/unit'

export function casterSnapshotOf(unit: CombatUnit): CasterSnapshot {
  return {
    unitId: unit.id,
    coord: unit.position ?? { faction: unit.faction, lane: '', index: 0 },
  }
}

export function createAction(params: {
  id: string
  sourceRef: string
  caster: CombatUnit
  opportunityId: string | null
  committedTargets: readonly ResolvedTarget[]
  consumption: Consumption
}): Action {
  const action = {
    id: params.id,
    sourceRef: params.sourceRef,
    caster: casterSnapshotOf(params.caster),
    opportunityId: params.opportunityId,
    committedTargets: params.committedTargets,
    behaviorContext: {},
    finalTargets: [] as ResolvedTarget[],
    redirectLog: [],
    settlementPlan: new Map(),
    consumption: params.consumption,
    outcomes: [],
  }
  return action as unknown as Action
}
