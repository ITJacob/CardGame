// 效果执行器（O 节点）：遍历效果树，处理 3 个结构算子并分发原语处理函数。
// 未实现的原语走 unsupported（跳过 + 计数），不抛异常。
import type { EffectNode, OpIf, OpRepeat, OpSequence } from '../catalog/types'
import type { Condition } from '../shared/types'
import { evaluateCondition, type ConditionContext } from '../shared/effect-condition'
import type { EffectContext } from './context'
import * as H from './handlers'
import * as H2 from './handlers2'
import * as H3 from './handlers3'
import type { CombatUnit } from '../roster/unit'

type Handler = (node: EffectNode, target: CombatUnit | null, ctx: EffectContext) => void

const HANDLERS: Record<string, Handler> = {
  damage: H.handleDamage as unknown as Handler,
  heal: H.handleHeal as unknown as Handler,
  mount_status: H.handleMountStatus as unknown as Handler,
  modify_stat: H.handleModifyStat as unknown as Handler,
  modify_resource: H.handleModifyResource as unknown as Handler,
  // P2b-1
  move: H2.handleMove as unknown as Handler,
  spawn: H2.handleSpawn as unknown as Handler,
  dispel: H2.handleDispel as unknown as Handler,
  drain: H2.handleDrain as unknown as Handler,
  modify_status: H2.handleModifyStatus as unknown as Handler,
  transfer_status: H2.handleTransferStatus as unknown as Handler,
  modify_damage: H2.handleModifyDamage as unknown as Handler,
  grant_immunity: H2.handleGrantImmunity as unknown as Handler,
  modify_targetability: H2.handleModifyTargetability as unknown as Handler,
  reveal: H2.handleReveal as unknown as Handler,
  take_control: H2.handleTakeControl as unknown as Handler,
  translocate: H2.handleTranslocate as unknown as Handler,
  // P2b-2
  set_luminance: H3.handleSetLuminance as unknown as Handler,
  advance_clock: H3.handleAdvanceClock as unknown as Handler,
  domain: H3.handleDomain as unknown as Handler,
  snapshot: H3.handleSnapshot as unknown as Handler,
  restore_snapshot: H3.handleRestoreSnapshot as unknown as Handler,
  echo_last_skill: H3.handleEchoLastSkill as unknown as Handler,
  gauge_shuffle: H3.handleGaugeShuffle as unknown as Handler,
  status_shuffle: H3.handleStatusShuffle as unknown as Handler,
  modify_skill: H3.handleModifySkill as unknown as Handler,
  target_override: H3.handleTargetOverride as unknown as Handler,
  write_rule_slot: H3.handleWriteRuleSlot as unknown as Handler,
  modify_rule_slot: H3.handleModifyRuleSlot as unknown as Handler,
}

function conditionContext(ctx: EffectContext): ConditionContext {
  return {
    random: ctx.random,
    registry: ctx.registry,
    warn: ctx.warn,
    phase: ctx.phase,
    caster: ctx.caster,
    resolveUnit: (id: string) => ctx.units.get(id) ?? null,
    defCategory: ctx.defCategory,
    allUnits: () => ctx.units.all(),
    resourceOf: (u, key) => {
      const real = ctx.units.get(u.id)
      try {
        return real?.pool(key as never).current ?? 0
      } catch {
        return 0
      }
    },
  }
}

function countOf(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.max(0, Math.floor(value))
  return 1
}

export function executeNodes(nodes: readonly EffectNode[], targets: readonly (CombatUnit | null)[], ctx: EffectContext): void {
  for (const node of nodes) executeNode(node, targets, ctx)
}

function executeNode(node: EffectNode, targets: readonly (CombatUnit | null)[], ctx: EffectContext): void {
  const op = (node as { op?: string }).op
  if (op === 'sequence') {
    executeNodes((node as OpSequence).steps, targets, ctx)
    return
  }
  if (op === 'repeat') {
    const n = countOf((node as OpRepeat).count)
    for (let i = 0; i < n; i += 1) executeNodes((node as OpRepeat).steps, targets, ctx)
    return
  }
  if (op === 'if') {
    const n = node as OpIf
    const cc = conditionContext(ctx)
    const probe = targets.find((t) => t != null) ?? null
    if (evaluateCondition(n.condition, probe, cc)) executeNodes(n.then ?? [], targets, ctx)
    else executeNodes(n.else ?? [], targets, ctx)
    return
  }

  const type = (node as { type?: string }).type
  const handler = type ? HANDLERS[type] : undefined
  if (!handler) {
    ctx.unsupported(type ?? '未知节点')
    return
  }
  const cond = (node as { condition?: Condition }).condition
  const cc = conditionContext(ctx)
  for (const target of targets) {
    if (cond && !evaluateCondition(cond, target, cc)) continue
    handler(node, target, ctx)
  }
}
