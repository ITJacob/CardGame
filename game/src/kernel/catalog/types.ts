// 编目上下文：定义态 Def（编目上下文.md / 编目参数.md）。
// Catalog 是独立不可变聚合，战斗启动时快照进战斗内（INV-C3）。
// 三层契约：默认值/上下限只写 Def，实例值只写 Grant（INV-C2）。

import type {
  CardId, DefId, Element, Gender, PathwayId, Phase, Rarity, Reach,
} from '../ids'
import type {
  Condition, Consumption, CountValue, EffectRef, EffectTarget, Scalar,
  SortKey, TargetSpec, UnitFilter, ValueFrom,
} from '../shared/types'

// ============================================================
// 效果原语（29 个，权威源 = schema effect.oneOf）+ 3 个结构算子
// ============================================================

/** 29 个效果原语的类型闭集 */
export type EffectType =
  | 'damage' | 'heal' | 'mount_status' | 'modify_stat' | 'modify_resource'
  | 'move' | 'spawn' | 'dispel' | 'drain' | 'domain' | 'translocate'
  | 'snapshot' | 'restore_snapshot' | 'modify_damage' | 'target_override'
  | 'transfer_status' | 'echo_last_skill' | 'gauge_shuffle' | 'status_shuffle'
  | 'modify_skill' | 'modify_status' | 'modify_targetability' | 'reveal'
  | 'grant_immunity' | 'take_control' | 'write_rule_slot' | 'modify_rule_slot'
  | 'set_luminance' | 'advance_clock'

interface EffBase {
  condition?: Condition
  target?: EffectTarget
  note?: string
}

export interface EffDamage extends EffBase {
  type: 'damage'
  value?: Scalar
  element?: Element
  mul?: number
  valueFrom?: ValueFrom | Record<string, Scalar>
  spread?: 'splash_adjacent'
  pierce?: string[]
  neverMiss?: boolean
  lethal?: boolean
  damageCategory?: string
  armorPierceRatio?: number | Record<string, Scalar>
}
export interface EffHeal extends EffBase {
  type: 'heal'
  value?: Scalar
  mode?: 'setHp' | 'hpMaxRatio' | 'to_ratio'
  healToRatio?: number
}
export interface EffMountStatus extends EffBase {
  type: 'mount_status'
  statusId: string
  duration?: number | null
  stacks?: number | string
  stackMode?: 'add' | 'consume' | 'override'
  maxStacks?: number
  charges?: number
  value?: Scalar
  params?: Record<string, Scalar>
  filter?: UnitFilter
  refresh?: boolean
  durationDelta?: number
  dispelable?: boolean
  contagious?: boolean
  spread?: 'splash_adjacent'
}
export interface EffModifyStat extends EffBase {
  type: 'modify_stat'
  stat: string
  value?: Scalar
  mode: 'delta' | 'set' | 'mul' | 'to_at_least' | 'to_at_most'
  duration?: number | null
  sourceRef?: 'caster' | 'secondary_target' | 'field_average'
  valueFrom?: ValueFrom | Record<string, Scalar>
  filter?: UnitFilter
  spread?: 'splash_adjacent'
}
export interface EffModifyResource extends EffBase {
  type: 'modify_resource'
  resource: string
  value?: Scalar
  mode?: 'delta' | 'set' | 'swap'
  op?: 'swap'
  between?: EffectTarget[]
  duration?: number
}
export interface EffMove extends EffBase {
  type: 'move'
  op: 'swap_neighbor' | 'insert_tail_cross_lane' | 'swap_ally' | 'param'
    | 'pull_forward' | 'push_back' | 'charge_forward'
  distance?: number
  to?: string | Record<string, Scalar>
  params?: Record<string, Scalar>
}
export interface EffSpawn extends EffBase {
  type: 'spawn'
  unitId?: string
  template?: string
  def?: string
  kind?: string
  variant?: string
  position?: 'tail' | 'at_unit' | 'original'
  count?: CountValue
  hpRatio?: number | string | Record<string, Scalar>
  atkRatio?: number | null
  consumption?: Consumption
  duration?: number
  lifetime?: number
  reviveOf?: 'self' | 'status_holder' | 'last_dead_ally'
  oncePerBattle?: boolean
  inheritSkills?: boolean
  summonCapOverride?: number
}
export interface EffDispel extends EffBase {
  type: 'dispel'
  dispelTarget?: 'unit' | 'domain'
  filter?: UnitFilter
  category?: string[]
  statusId?: string | string[]
  count?: CountValue
  mode?: 'area'
  collect?: string
}
export interface EffDrain extends EffBase {
  type: 'drain'
  resource?: 'hp' | 'energy'
  value?: Scalar
  ratio?: number
  healRatio?: number
  category?: 'buff'
  count?: CountValue
}
export interface EffDomain extends EffBase {
  type: 'domain'
  op: 'overlay' | 'swap' | 'hero'
  def?: string
  duration?: number
  durationUnit?: 'turn' | 'tick'
}
export interface EffTranslocate extends EffBase {
  type: 'translocate'
  op: 'pull_into' | 'banish'
  duration: number
  returnPayload?: EffectNode[]
}
export interface EffModifyDamage extends EffBase {
  type: 'modify_damage'
  scope?: 'taken' | 'dealt'
  mul: number
}
export interface EffTargetOverride extends EffBase {
  type: 'target_override'
  faction?: string
  anchor?: string
  sort?: SortKey
}
export interface EffTransferStatus extends EffBase {
  type: 'transfer_status'
  statusesFrom?: string
  from?: Record<string, Scalar>
  to?: string | Record<string, Scalar>
  mode?: 'copy' | 'rewrite'
  keepDuration?: boolean
  durationMul?: number
  stacksMul?: number
  count?: Scalar
  filter?: UnitFilter
  fallback?: EffectNode[]
}
export interface EffSnapshot extends EffBase {
  type: 'snapshot'
  fields: string[]
  filter?: UnitFilter
}
export interface EffRestoreSnapshot extends EffBase {
  type: 'restore_snapshot'
  fields: string[]
}
export interface EffEchoLastSkill extends EffBase {
  type: 'echo_last_skill'
  potency?: number | string
  snapshot?: string
  rounding?: 'ceil' | 'floor' | 'round'
}
export interface EffGaugeShuffle extends EffBase {
  type: 'gauge_shuffle'
  resource: string
}
export interface EffStatusShuffle extends EffBase {
  type: 'status_shuffle'
  mode?: 'rotate'
  sort?: SortKey
  count?: CountValue
}
export interface EffModifySkill extends EffBase {
  type: 'modify_skill'
  skillRef: Record<string, Scalar>
  clearCooldown?: boolean
  cooldownDelta?: number
  costDelta?: Record<string, Scalar>
  castTimeDelta?: number
  setInstant?: boolean
  targetSpecOverride?: Record<string, Scalar>
}
export interface EffModifyStatus extends EffBase {
  type: 'modify_status'
  statusId: string
  addDuration?: number
  setDuration?: number | null
  maxStacksDelta?: number
  maxStacksSet?: number
  stacksDelta?: number
  dispelableOverride?: boolean
}
export interface EffModifyTargetability extends EffBase {
  type: 'modify_targetability'
  untargetable?: boolean
  direction?: 'all' | 'enemy_targeted' | 'enemy_aoe' | 'ally'
  duration?: number
  pierce?: 'none' | 'source' | 'all'
}
export interface EffReveal extends EffBase {
  type: 'reveal'
  scope?: 'to_source' | 'to_all'
  dispel?: boolean
  pierceTargetability?: boolean
}
export interface EffGrantImmunity extends EffBase {
  type: 'grant_immunity'
  against?: string[]
  element?: Element
  damageType?: string
  charges?: number
  duration?: number
}
export interface EffTakeControl extends EffBase {
  type: 'take_control'
  duration?: number
  onExpire?: 'revert' | 'die' | 'keep'
  actionPolicy?: 'full' | 'attack_only' | 'move_only'
}
export interface EffWriteRuleSlot extends EffBase {
  type: 'write_rule_slot'
  slot?: number
  field?: 'trigger' | 'punish' | 'exemptions' | 'scope'
  value?: unknown
  overwrite?: boolean
}
export interface EffModifyRuleSlot extends EffBase {
  type: 'modify_rule_slot'
  slot?: number
  field?: 'trigger' | 'punish' | 'exemptions' | 'scope'
  value?: unknown
  mode?: 'replace' | 'append' | 'remove'
  filter?: UnitFilter
}
export interface EffAdvanceClock {
  type: 'advance_clock'
  ticks: number
  note?: string
}
export interface EffSetLuminance {
  type: 'set_luminance'
  value?: number
  delta?: number
  duration?: number
  dispelable?: boolean
  note?: string
}

/** 结构算子：sequence / repeat / if */
export interface OpSequence {
  op: 'sequence'
  steps: EffectNode[]
  note?: string
}
export interface OpRepeat {
  op: 'repeat'
  count?: CountValue
  countFrom?: string
  shareTarget?: boolean
  statusId?: string
  steps: EffectNode[]
  note?: string
}
export interface OpIf {
  op: 'if'
  condition: Condition
  then: EffectNode[]
  else?: EffectNode[]
  note?: string
  noteElse?: string
}

export type EffectNode =
  | EffDamage | EffHeal | EffMountStatus | EffModifyStat | EffModifyResource
  | EffMove | EffSpawn | EffDispel | EffDrain | EffDomain | EffTranslocate
  | EffModifyDamage | EffTargetOverride | EffTransferStatus | EffEchoLastSkill
  | EffGaugeShuffle | EffStatusShuffle | EffModifySkill | EffModifyStatus
  | EffModifyTargetability | EffReveal | EffGrantImmunity | EffTakeControl
  | EffWriteRuleSlot | EffModifyRuleSlot | EffSetLuminance | EffAdvanceClock
  | EffSnapshot | EffRestoreSnapshot
  | OpSequence | OpRepeat | OpIf

// ============================================================
// 各 Def
// ============================================================

/** 效果定义（编目期把内联效果节点驻留成 Def，供 EffectRef 引用） */
export interface EffectDef {
  id: DefId
  node: EffectNode
}

/** 触发器定义（执行参数 §2.1） */
export interface TriggerDef {
  event: string
  effects?: EffectNode[]
  condition?: Condition
  consumeCharge?: boolean | number
  consume?: number
  global?: boolean
  reason?: string | string[]
  minIntervalTicks?: number
  filter?: UnitFilter
  target?: EffectTarget | Record<string, Scalar>
  note?: string
}

/** 状态定义（编队参数 §2.2/§2.4） */
export interface StatusDef {
  id: DefId
  name?: string
  category: string[]
  dispelable: boolean
  duration?: number | null
  modifiers?: ModifierSet
  triggers?: TriggerDef[]
  effects?: EffectNode[]
  charges?: number
  maxStacks?: number
  stackPolicy?: 'stack' | 'refresh'
  statPerStack?: Record<string, Scalar>
  behaviorModifiers?: unknown[]
  disallowActions?: string[]
  immune?: unknown
  redirectRule?: Record<string, Scalar>
  damageTransfer?: Record<string, Scalar>
  healReceivedMul?: number
  countMode?: 'cumulative' | 'on_field'
  source_filter?: string
  priority?: number | string
  crossPathway?: boolean
  note?: string
}

export type StatusModifier = Record<string, Scalar>
export type ModifierSet = StatusModifier[] | Record<string, Scalar>

/** 主动技能定义（kind=active 的卡） */
export interface SkillDef {
  id: DefId
  sourceCardId: CardId
  pathwayId: PathwayId
  name: string
  rarity: Rarity
  axis: string
  cost?: { energy: number; cooldown: number; castTime: number | null }
  reach?: Reach
  targetSpec?: TargetSpec
  effects: EffectRef[]
  triggers?: TriggerDef[]
  tags?: string[]
  /** 权柄标记：模仿/复制排除（编目参数 §二） */
  authority?: boolean
  /** consumption=zone 时由卡面携带的区域授予 */
  zoneGrant?: { def: string; duration?: number; durationUnit?: 'turn' | 'tick'; affects?: string }
  /** consumption=domain 时由卡面携带的界域授予 */
  domainGrant?: { def: string; tier?: string; duration?: number; durationUnit?: 'turn' | 'tick' }
}

/** 被动行为模板（kind=passive 的卡） */
export interface BehaviorTemplate {
  id: DefId
  sourceCardId: CardId
  pathwayId: PathwayId
  name: string
  rarity: Rarity
  axis: string
  /** 触发点闭集（14 值） */
  hook?: string[]
  triggers?: TriggerDef[]
  effects: EffectRef[]
  reach?: Reach
  tags?: string[]
}

export interface RulePatch {
  kind: string
  side?: string
  tag?: string | string[]
  mul?: number
  stat?: string
  effectType?: string
  delta?: number
  note?: string
}

export interface ZoneDef {
  id: DefId
  pathwayId: PathwayId
  kind: string
  trigger: string
  affects: 'ally_of_owner' | 'enemy_of_owner' | 'any'
  effects?: EffectNode[]
  duration?: number | null
  durationUnit?: 'turn' | 'tick'
  interval?: number
  modifiers?: ModifierSet
  note?: string
}

export interface DomainDef {
  id: DefId
  pathwayId: PathwayId
  tier: string
  dispelable: boolean
  duration?: number
  durationUnit?: 'turn' | 'tick'
  triggers?: TriggerDef[]
  rulePatches?: RulePatch[]
  note?: string
}

/** 召唤单位蓝本（召唤物参数；编目落点 = skills.json 顶层 unitDefs） */
export interface UnitDef {
  id: DefId
  pathwayId: PathwayId
  name?: string
  unitType?: string
  base?: number | string | Record<string, Scalar>
  hpRatio?: number | string
  atkRatio?: number | string
  element?: Element
  tags?: string[]
  triggers?: TriggerDef[]
  gender?: Gender | 'any'
  note?: string
}

/** 职业（途径）：kitOps 增/删/改 + 已知技能（编目参数 §二） */
export interface ClassDef {
  id: PathwayId
  name: string
  kitOps?: unknown[]
  knownSkills: CardId[]
}

/** 术语定义（当前 schema 无 term 原语，保留结构以备） */
export interface TermDef {
  id: DefId
  displayName: string
  category: string
  composition: unknown
  overridable?: string[]
}

export interface UpgradeLadderTier {
  name: string
  note: string
  effects?: EffectNode[]
}
export interface UpgradeLadder {
  ref: string
  tiers: UpgradeLadderTier[]
  duplicatePolicy?: string
}

/** 相位钩子（战场参数 §1.3b） */
export interface PhaseHook {
  phases: Phase[]
  mul: number
  target?: 'damage' | 'damage_taken' | 'heal' | 'resource' | 'rule_strength' | 'all'
  filterTags?: string[]
}

// ============================================================
// Catalog 聚合
// ============================================================

/** 全部定义态的唯一居所；不可变、可全局缓存、与战斗运行时解耦 */
export interface Catalog {
  readonly effectDefs: ReadonlyMap<DefId, EffectDef>
  readonly skillDefs: ReadonlyMap<DefId, SkillDef>
  readonly behaviorTemplates: ReadonlyMap<DefId, BehaviorTemplate>
  readonly statusDefs: ReadonlyMap<DefId, StatusDef>
  readonly zoneDefs: ReadonlyMap<DefId, ZoneDef>
  readonly domainDefs: ReadonlyMap<DefId, DomainDef>
  readonly unitDefs: ReadonlyMap<DefId, UnitDef>
  readonly classDefs: ReadonlyMap<PathwayId, ClassDef>
  readonly termDefs: ReadonlyMap<DefId, TermDef>
  readonly phaseHooks: readonly PhaseHook[]
}

/** 战斗启动时快照进战斗内的 Catalog（INV-C3）；当前等于冻结后的 Catalog */
export type CatalogSnapshot = Catalog
