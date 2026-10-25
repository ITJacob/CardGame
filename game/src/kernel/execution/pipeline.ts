// 执行流水线 I→R→M→O（执行上下文 §四）。
// P2a：consumption 仅 instant 实做；R 无转向规则（finalTargets=committedTargets）；
// Manual 且候选>pickCount 时挂起，返回 continueWith 供 UI/AI 喂回选择。
import type { FactionId, LaneId, UnitId } from '../ids'
import type { DomainEvent } from '../combat/types'
import type { Coordinate } from '../battle/types'
import type { EffectNode, WeaponDef } from '../catalog/types'
import type { Consumption, TargetSpec } from '../shared/types'
import type { EffectContext } from '../effect/context'
import type { TargetScope } from '../effect/target-scope'
import { executeNodes } from '../effect/executor'
import type { Registry } from '../roster/registry'
import type { CombatUnit } from '../roster/unit'
import { cardScope, spreadFrom } from '../effect/target-scope'
import { resolveCandidates, toResolved } from './target'
import { createAction } from './action'
import type { Action, DecisionRequest, ResolvedTarget } from './types'

export interface PipelineDeps {
  units: Registry
  enemyOf(faction: FactionId): FactionId
  /** 每个 Action 一个 EffectContext（携带 actionId；卡片语境的 target 求值见 targetScope；
   *  sourceRef = 发起该 Action 的卡 id，供 dimHooks 维度乘区读取） */
  makeContext(actionId: string, caster: CombatUnit, targetScope?: TargetScope, sourceRef?: string): EffectContext
  /** 按 EffectDef id 解析效果节点 */
  effectNode(defId: string): EffectNode | undefined
  emit(e: DomainEvent): void
  nextActionId(): string
  unsupported(kind: string, detail?: string): void
  /** 有序路 id（几何用；战场参数 §二） */
  lanes: readonly LaneId[]
  laneCapacity: number
  /** 最近阵亡友军坐标（anchor:last_dead_ally） */
  lastDeadCellFor?(faction: FactionId): Coordinate | null
  /** 未过期亡骸（filter.corpse 寻址） */
  corpseOf?(unitId: UnitId): { coord: Coordinate; order: number } | undefined
  /** 选靶完成后、O 之前（runtime 用它在 zone/domain 分流时登记实例） */
  onAction?(info: ActionInfo): void
  /** O 完成后（zone/domain 早退前也调用）；runtime 在此时结算规则槽动作规则 */
  afterSettle?(info: ActionInfo): void
  /** kind=weapon 的卡：扣费成功后、战吼/选靶之前装备 */
  equipWeapon?(caster: CombatUnit, weapon: WeaponDef): void
}

export interface ActionInfo {
  actionId: string
  caster: CombatUnit
  sourceRef: string
  consumption: Consumption
  targets: readonly ResolvedTarget[]
  /** 与 targets 对齐的「本次行动前 HP%」；空位为 null。规则 on_attack 条件用 */
  targetHpPercent: readonly (number | null)[]
  zoneGrant?: { def: string; duration?: number }
  domainGrant?: { def: string; tier?: string; duration?: number }
}

export interface BehaviorSource {
  sourceRef: string
  effects: readonly EffectNode[]
  targetSpec: TargetSpec
  /** 卡的第二组选靶（SkillDef.secondaryTargets）：供 `target: 'secondary_target'` 取值 */
  secondaryTargets?: readonly TargetSpec[]
  consumption: Consumption
  /** consumption=zone / domain 时的卡面授予（由 runtime 消费） */
  zoneGrant?: { def: string; duration?: number }
  domainGrant?: { def: string; tier?: string; duration?: number }
  /** kind=weapon：装备载荷（战吼走 effects） */
  weapon?: WeaponDef
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
    lastDeadCellFor: deps.lastDeadCellFor,
    corpseOf: deps.corpseOf,
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
  // 选靶规格 `spread`（共享内核参数 §一 spread 行）：主目标已定（I-2 收缩之后），自 committedTargets
  // **含原点**向外扩散相邻域；溅射目标不再进候选池、不触发二次排序或玩家选择。
  if (source.targetSpec.request.spread === 'splash_adjacent') {
    const hitUnits = committed
      .map((t) => (t.occupant ? deps.units.get(t.occupant) : undefined))
      .filter((u): u is CombatUnit => u !== undefined)
    action.finalTargets = spreadFrom(hitUnits, deps.units).map(toResolved)
  } else {
    action.finalTargets = [...committed]
  }

  // 主体锚点：日志/排查靠它把后续 TargetsResolved/EffectApplied 串回「谁出手、用的什么」
  deps.emit({ type: 'BehaviorCommitted', actionId, caster: caster.id, cost: source.consumption, sourceRef: source.sourceRef })
  deps.emit({ type: 'TargetsResolved', actionId, targets: action.finalTargets })

  const targetUnits = action.finalTargets.map((t) => (t.occupant ? deps.units.get(t.occupant) ?? null : null))
  const info: ActionInfo = {
    actionId,
    caster,
    sourceRef: source.sourceRef,
    consumption: source.consumption,
    targets: action.finalTargets,
    targetHpPercent: targetUnits.map((u) => (u && !u.isDead ? u.pool('hp').current / u.hpMax : null)),
    zoneGrant: source.zoneGrant,
    domainGrant: source.domainGrant,
  }

  // M：consumption 分流（zone/domain 由 runtime 经 onAction 登记，不走 O）
  deps.onAction?.(info)
  if (source.consumption === 'zone' || source.consumption === 'domain') {
    deps.afterSettle?.(info)
    return
  }
  // 卡片语境（执行参数 §2.1c）：效果节点自带的 target 简写以「施法者 + 本次选靶命中集合」求值；
  // 不带 target 的节点仍落在下面传入的 targetUnits（选靶）上。
  const hit = targetUnits.filter((u): u is CombatUnit => u != null)
  // 第二组选靶（JSON `secondaryTargets`）→ 卡片语境 `secondary`（执行参数 §2.1c）：
  // 逐组按各自 request 解析（与主选靶同口径：area 全取、unit 取 pickCount），取命中**并集**；
  // 未填该字段的卡为空 → `secondary_target` 回退主选靶（向后兼容）。
  const secondary: CombatUnit[] = []
  const seenSecondary = new Set<string>()
  for (const spec of source.secondaryTargets ?? []) {
    const reqS = spec.request
    const cands = resolveCandidates(reqS, {
      units: deps.units,
      self: caster,
      enemyFaction: deps.enemyOf(caster.faction),
      lanes: deps.lanes,
      laneCapacity: deps.laneCapacity,
      unsupported: deps.unsupported,
      lastDeadCellFor: deps.lastDeadCellFor,
      corpseOf: deps.corpseOf,
    })
    const pickRawS = reqS.pickCount
    const n = (reqS.mode ?? 'unit') === 'area' || pickRawS === 'all'
      ? cands.length
      : (typeof pickRawS === 'number' && Number.isFinite(pickRawS) && pickRawS > 0 ? Math.trunc(pickRawS) : 1)
    for (const t of cands.slice(0, n)) {
      const u = t.occupant ? deps.units.get(t.occupant) : undefined
      if (u && !seenSecondary.has(u.id)) {
        seenSecondary.add(u.id)
        secondary.push(u)
      }
    }
  }
  const ctx = deps.makeContext(
    actionId, caster,
    cardScope(caster, hit, deps.enemyOf(caster.faction), secondary),
    source.sourceRef,
  )
  for (const node of source.effects) {
    executeNodes([node], targetUnits, ctx)
  }

  for (const t of action.finalTargets) {
    if (!t.occupant) continue
    deps.emit({ type: 'EffectApplied', actionId, effectRef: { ref: source.sourceRef }, target: t })
  }
  deps.afterSettle?.(info)
}

export { toResolved }
