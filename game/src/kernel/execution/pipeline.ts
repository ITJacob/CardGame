// 执行流水线 I→R→M→O（执行上下文 §四）。
// P2a：consumption 仅 instant 实做；R 无转向规则（finalTargets=committedTargets）；
// Manual 且候选>pickCount 时挂起，返回 continueWith 供 UI/AI 喂回选择。
import type { FactionId, LaneId } from '../ids'
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
  /** 有序路 id（几何用；战场参数 §二） */
  lanes: readonly LaneId[]
  laneCapacity: number
  /** 结算完成后回调（runtime 用它在 zone/domain 分流时登记实例） */
  onAction?(info: { caster: CombatUnit; consumption: Consumption; targets: readonly ResolvedTarget[]; zoneGrant?: { def: string; duration?: number }; domainGrant?: { def: string; duration?: number } }): void
}

export interface BehaviorSource {
  sourceRef: string
  effects: readonly EffectNode[]
  targetSpec: TargetSpec
  consumption: Consumption
  /** consumption=zone / domain 时的卡面授予（由 runtime 消费） */
  zoneGrant?: { def: string; duration?: number }
  domainGrant?: { def: string; duration?: number }
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
  const mode = request.mode ?? 'unit'
  const pickRaw = request.pickCount
  const manual = source.targetSpec.selectionMode === 'manual'

  const candidates = resolveCandidates(request, {
    units: deps.units,
    self: caster,
    enemyFaction: deps.enemyOf(caster.faction),
    lanes: deps.lanes,
    laneCapacity: deps.laneCapacity,
    unsupported: deps.unsupported,
  })

  // 命中数：area 恒为区域内全取；unit 取 pickCount（整数=N，'all'=池内全部），缺省 1
  const pickCount = mode === 'area' || pickRaw === 'all'
    ? candidates.length
    : (typeof pickRaw === 'number' && Number.isFinite(pickRaw) && pickRaw > 0 ? Math.trunc(pickRaw) : 1)

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

  // 主体锚点：日志/排查靠它把后续 TargetsResolved/EffectApplied 串回「谁出手、用的什么」
  deps.emit({ type: 'BehaviorCommitted', actionId, caster: caster.id, cost: source.consumption, sourceRef: source.sourceRef })
  deps.emit({ type: 'TargetsResolved', actionId, targets: action.finalTargets })

  // M：consumption 分流（zone/domain 由 runtime 经 onAction 登记，不走 O）
  deps.onAction?.({ caster, consumption: source.consumption, targets: action.finalTargets, zoneGrant: source.zoneGrant, domainGrant: source.domainGrant })
  if (source.consumption === 'zone' || source.consumption === 'domain') {
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
