// 执行流水线 I→R→M→O（执行上下文 §四）。
// P2a：consumption 仅 instant 实做；R 无转向规则（finalTargets=committedTargets）；
// Manual 且候选>pickCount 时挂起，返回 continueWith 供 UI/AI 喂回选择。
import type { FactionId } from '../ids'
import type { DomainEvent } from '../combat/types'
import type { EffectNode } from '../catalog/types'
import type { Consumption, TargetSpec } from '../shared/types'
import type { EffectContext } from '../effect/context'
import { executeNodes } from '../effect/executor'
import type { Registry } from '../roster/registry'
import type { CombatUnit } from '../roster/unit'
import { resolveCandidates, toResolved } from './target'
import { createAction } from './action'
import type { Action, DecisionRequest, ResolvedTarget } from './types'

export interface PipelineDeps {
  units: Registry
  enemyOf(faction: FactionId): FactionId
  /** 每个 Action 一个 EffectContext（携带 actionId） */
  makeContext(actionId: string, caster: CombatUnit): EffectContext
  /** 按 EffectDef id 解析效果节点 */
  effectNode(defId: string): EffectNode | undefined
  emit(e: DomainEvent): void
  nextActionId(): string
  unsupported(kind: string, detail?: string): void
}

export interface BehaviorSource {
  sourceRef: string
  effects: readonly EffectNode[]
  targetSpec: TargetSpec
  consumption: Consumption
}

export interface AwaitingDecision {
  request: DecisionRequest
  continueWith(picks: readonly ResolvedTarget[]): void
}

/** 启动一次行为；若需玩家决策则返回 AwaitingDecision（否则已同步跑完）。 */
export function runBehavior(
  caster: CombatUnit,
  source: BehaviorSource,
  opportunityId: string | null,
  deps: PipelineDeps,
): AwaitingDecision | null {
  const request = source.targetSpec.request
  const pickRaw = request.pickCount
  const pickCount = typeof pickRaw === 'number' && pickRaw > 0 ? pickRaw : 1
  const manual = source.targetSpec.selectionMode === 'manual'

  const candidates = resolveCandidates(request, {
    units: deps.units,
    self: caster,
    enemyFaction: deps.enemyOf(caster.faction),
  })

  const proceed = (picks: readonly ResolvedTarget[]): void => {
    settle(caster, source, opportunityId, picks, deps)
  }

  if (manual && candidates.length > pickCount) {
    return {
      request: {
        actionId: deps.nextActionId(),
        caster: caster.id,
        candidates,
        pickCount,
        fallbackSort: undefined,
      },
      continueWith: (picks) => proceed(picks.slice(0, pickCount)),
    }
  }

  proceed(candidates.slice(0, pickCount))
  return null
}

function settle(
  caster: CombatUnit,
  source: BehaviorSource,
  opportunityId: string | null,
  committed: readonly ResolvedTarget[],
  deps: PipelineDeps,
): void {
  const actionId = deps.nextActionId()
  const action = createAction({
    id: actionId,
    sourceRef: source.sourceRef,
    caster,
    opportunityId,
    committedTargets: committed,
    consumption: source.consumption,
  }) as Action & { finalTargets: ResolvedTarget[]; outcomes: unknown[] }

  // R：P2a 无转向规则——finalTargets = committedTargets（去重由 resolve 保证）
  action.finalTargets = [...committed]

  deps.emit({ type: 'TargetsResolved', actionId, targets: action.finalTargets })

  // M：consumption 分流（P2a 仅 instant）
  if (source.consumption !== 'instant') {
    deps.unsupported(`consumption:${source.consumption}`)
    return
  }

  // O：逐目标 condition→handler→事件
  const targetUnits = action.finalTargets.map((t) => (t.occupant ? deps.units.get(t.occupant) ?? null : null))
  const ctx = deps.makeContext(actionId, caster)
  for (const node of source.effects) {
    executeNodes([node], targetUnits, ctx)
  }

  for (const t of action.finalTargets) {
    if (!t.occupant) continue
    deps.emit({ type: 'EffectApplied', actionId, effectRef: { ref: source.sourceRef }, target: t })
  }
}

export { toResolved }
