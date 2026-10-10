// 数据接入层：JSON 原始 AST → 内核 Catalog。
// 纯函数：不触 I/O、不触 DOM；由 loader（浏览器 fetch）或校验脚本（node fs）喂入原始对象。
//
// 编译动作：
//   1. 每张卡 → SkillDef（kind=active）/ BehaviorTemplate（kind=passive）
//   2. 卡内顶层效果节点 → 驻留为 EffectDef，并生成 EffectRef（含 condition/target 透传）
//   3. card.statusDefs → StatusDef；途径级 unitDefs/zoneDefs/domainDefs → 各自池
//   4. 途径 → ClassDef（knownSkills = 该途径全部卡 id）
//   5. 引用校验：触发器事件必须 ∈ 14 闭集；效果类型必须 ∈ 29 原语 ∪ 3 算子；
//      mount_status/modify_status.statusId 必须可解析（外部 common 状态由 opts 注入）

import type {
  BehaviorTemplate, Catalog, ClassDef, DomainDef, EffectDef, EffectNode, PhaseHook,
  SkillDef, StatusDef, TriggerDef, UnitDef, ZoneDef,
} from '../kernel/catalog/types'
import type { EffectRef, TargetSpec } from '../kernel/shared/types'
import type { PathwayFile, RawCard } from './schema.types'

/** 29 个效果原语（权威源 = schema effect.oneOf） */
export const EFFECT_TYPES: readonly string[] = [
  'damage', 'heal', 'mount_status', 'modify_stat', 'modify_resource', 'move', 'spawn',
  'dispel', 'drain', 'domain', 'translocate', 'snapshot', 'restore_snapshot',
  'modify_damage', 'target_override', 'transfer_status', 'echo_last_skill',
  'gauge_shuffle', 'status_shuffle', 'modify_skill', 'modify_status',
  'modify_targetability', 'reveal', 'grant_immunity', 'take_control',
  'write_rule_slot', 'modify_rule_slot', 'set_luminance', 'advance_clock',
]
const EFFECT_TYPE_SET = new Set(EFFECT_TYPES)

/** 3 个结构算子 */
const OPERATORS = new Set(['sequence', 'repeat', 'if'])

/** 14 个触发点封闭集（执行参数 §2.1） */
export const TRIGGER_EVENTS: readonly string[] = [
  'on_apply', 'on_remove', 'on_tick', 'on_turn_start', 'on_battle_start', 'on_spawn',
  'on_death', 'on_kill', 'on_attack', 'on_active_skill', 'on_deal_damage',
  'on_take_damage', 'on_status_gain', 'on_phase_change',
]
const TRIGGER_EVENT_SET = new Set(TRIGGER_EVENTS)

export interface BuildCounts {
  cards: number
  effectDefs: number
  skillDefs: number
  behaviorTemplates: number
  statusDefs: number
  zoneDefs: number
  domainDefs: number
  unitDefs: number
  classDefs: number
}

export interface BuildReport {
  counts: BuildCounts
  warnings: string[]
}

export interface BuildResult {
  catalog: Catalog
  report: BuildReport
}

export interface BuildOptions {
  /** 全局状态定义（各 *.statuses.json 与 common.statuses.json）：先注册进池，再处理途径 */
  globalStatusDefs?: readonly StatusDef[]
}

function register<T extends { id: string }>(
  map: Map<string, T>, id: string, value: T, warnings: string[], kind: string,
): void {
  if (map.has(id)) {
    warnings.push(`重复 ${kind} id：${id}`)
    return
  }
  map.set(id, value)
}

function isEffectNode(v: unknown): v is EffectNode {
  return typeof v === 'object' && v !== null && ('type' in v || 'op' in v)
}

/** 深度优先遍历效果树（含算子嵌套），对每个节点调用 visit */
function walkEffectNodes(node: EffectNode, visit: (n: EffectNode) => void): void {
  visit(node)
  const n = node as unknown as Record<string, unknown>
  for (const key of ['steps', 'then', 'else', 'returnPayload', 'fallback'] as const) {
    const v = n[key]
    if (Array.isArray(v)) for (const child of v) if (isEffectNode(child)) walkEffectNodes(child, visit)
  }
}

/** 把一张卡的顶层效果驻留为 EffectDef 并生成 EffectRef[] */
function internEffects(
  cardId: string, effects: readonly EffectNode[] | undefined,
  effectDefs: Map<string, EffectDef>, warnings: string[],
): EffectRef[] {
  const refs: EffectRef[] = []
  ;(effects ?? []).forEach((node, i) => {
    const id = `${cardId}#e${i}`
    effectDefs.set(id, { id, node })
    const withCond = node as { condition?: EffectRef['condition']; target?: EffectRef['target'] }
    const ref: EffectRef = { ref: id }
    if (withCond.condition) ref.condition = withCond.condition
    if (withCond.target) ref.target = withCond.target
    refs.push(ref)

    walkEffectNodes(node, (n) => {
      const rec = n as unknown as Record<string, unknown>
      if (typeof rec.type === 'string') {
        if (!EFFECT_TYPE_SET.has(rec.type)) warnings.push(`${id}：未知效果类型 ${rec.type}`)
      } else if (typeof rec.op === 'string' && !OPERATORS.has(rec.op)) {
        warnings.push(`${id}：未知算子 ${rec.op}`)
      }
    })
  })
  return refs
}

function checkTriggers(
  ownerId: string, triggers: readonly TriggerDef[] | undefined, warnings: string[],
): void {
  for (const trg of triggers ?? []) {
    if (!TRIGGER_EVENT_SET.has(trg.event)) warnings.push(`${ownerId}：未知触发事件 ${trg.event}`)
  }
}

function collectStatusRefs(card: RawCard, into: { owner: string; statusId: string }[]): void {
  for (const node of card.effects ?? []) {
    walkEffectNodes(node, (n) => {
      const rec = n as unknown as Record<string, unknown>
      if (typeof rec.statusId === 'string') into.push({ owner: card.id, statusId: rec.statusId })
      else if (Array.isArray(rec.statusId)) {
        for (const s of rec.statusId) if (typeof s === 'string') into.push({ owner: card.id, statusId: s })
      }
    })
  }
}

export function buildCatalog(files: readonly PathwayFile[], opts: BuildOptions = {}): BuildResult {
  const effectDefs = new Map<string, EffectDef>()
  const skillDefs = new Map<string, SkillDef>()
  const behaviorTemplates = new Map<string, BehaviorTemplate>()
  const statusDefs = new Map<string, StatusDef>()
  const zoneDefs = new Map<string, ZoneDef>()
  const domainDefs = new Map<string, DomainDef>()
  const unitDefs = new Map<string, UnitDef>()
  const classDefs = new Map<string, ClassDef>()
  const phaseHooks: PhaseHook[] = []
  const warnings: string[] = []

  // 待校验的状态引用（第一遍收集，全部文件处理完后再判定）
  const statusRefs: { owner: string; statusId: string }[] = []
  let cardCount = 0

  // 先注册全局状态（*.statuses.json + common.statuses.json）
  for (const sd of opts.globalStatusDefs ?? []) register(statusDefs, sd.id, sd, warnings, 'statusDef')

  for (const file of files) {
    const pid = file.pathwayId

    classDefs.set(pid, {
      id: pid,
      name: file.pathwayName,
      knownSkills: file.cards.map((c) => c.id),
    })

    for (const z of file.zoneDefs ?? []) register(zoneDefs, z.id, { ...z, pathwayId: pid }, warnings, 'zoneDef')
    for (const d of file.domainDefs ?? []) register(domainDefs, d.id, { ...d, pathwayId: pid }, warnings, 'domainDef')
    for (const u of file.unitDefs ?? []) register(unitDefs, u.id, { ...u, pathwayId: pid }, warnings, 'unitDef')

    for (const card of file.cards) {
      cardCount++
      phaseHooks.push(...(card.phaseHooks ?? []))
      for (const sd of card.statusDefs ?? []) register(statusDefs, sd.id, sd, warnings, 'statusDef')

      const effects = internEffects(card.id, card.effects, effectDefs, warnings)
      checkTriggers(card.id, card.triggers, warnings)
      collectStatusRefs(card, statusRefs)

      const base = {
        id: card.id,
        sourceCardId: card.id,
        pathwayId: pid,
        name: card.name,
        rarity: card.rarity,
        axis: card.axis,
        tags: card.tags,
        reach: card.reach,
      }

      if (card.kind === 'active') {
        register(skillDefs, card.id, {
          ...base,
          cost: card.cost,
          targetSpec: card.target
            ? (card.target as unknown as TargetSpec)
            : undefined,
          effects,
          triggers: card.triggers,
          authority: card.flagship,
        }, warnings, 'skillDef')
      } else {
        register(behaviorTemplates, card.id, {
          ...base,
          hook: card.hook,
          triggers: card.triggers,
          effects,
        }, warnings, 'behaviorTemplate')
      }
    }
  }

  // 引用校验：statusId 必须可解析
  for (const { owner, statusId } of statusRefs) {
    if (!statusDefs.has(statusId)) warnings.push(`${owner}：引用了未知状态 ${statusId}`)
  }

  const catalog: Catalog = {
    effectDefs, skillDefs, behaviorTemplates, statusDefs, zoneDefs,
    domainDefs, unitDefs, classDefs,
    termDefs: new Map(),
    phaseHooks,
  }

  return {
    catalog,
    report: {
      counts: {
        cards: cardCount,
        effectDefs: effectDefs.size,
        skillDefs: skillDefs.size,
        behaviorTemplates: behaviorTemplates.size,
        statusDefs: statusDefs.size,
        zoneDefs: zoneDefs.size,
        domainDefs: domainDefs.size,
        unitDefs: unitDefs.size,
        classDefs: classDefs.size,
      },
      warnings,
    },
  }
}
