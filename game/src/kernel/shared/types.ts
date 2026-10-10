// 共享内核值对象（共享内核.md / 共享内核参数.md）。
// 这些类型不依赖任何上下文，被编目、执行、效果共同引用。

import type { DefId, Gender, Phase } from '../ids'

/** 标量：数值 / 变量名（valueFrom 引用）/ 布尔 / 空 */
export type Scalar = number | string | boolean | null

/** 计数：正整数，或指向 valueFrom 的引用；"all" 表全部 */
export type CountValue = number | 'all' | string

/** 排序键（共享内核参数 §一）。扩展键：status:<id>:asc|desc */
export type SortKey =
  | 'none'
  | 'hp_asc' | 'hp_desc'
  | 'atk_asc' | 'atk_desc'
  | 'index_asc' | 'index_desc'
  | 'energy_desc' | 'armor_desc'
  | 'buff_count_desc' | 'debuff_count_desc'
  | 'gauge_asc' | 'gauge_desc'
  | 'stat_max_desc'
  | `status:${string}:${'asc' | 'desc'}`

export type Cmp = '>' | '>=' | '<' | '<=' | '=='
export type ConditionSide = 'self' | 'target' | 'ally' | 'enemy' | 'both' | 'all' | 'attacker'

/** 条件 kind 闭集（schema $defs/condition.kind） */
export type ConditionKind =
  | 'any_of' | 'caster_has_summon' | 'caster_status_exists' | 'chance' | 'consumed_count'
  | 'damage_source_is' | 'dead_count' | 'dispelled_count' | 'element_is' | 'field_status_count'
  | 'gauge_rank' | 'has_category' | 'has_status' | 'hp_percent' | 'hp_percent_compare'
  | 'luminance_compare' | 'phase_is' | 'rank_gap' | 'remove_reason' | 'resource_compare'
  | 'stat_compare' | 'status_category' | 'tag_chain' | 'target_dead' | 'target_faction_is'
  | 'target_has_tag' | 'target_is_summoned' | 'target_unit_type' | 'unit_faction'
  | 'variant_is' | 'zone_active'

/**
 * 效果生效条件（共享内核.md §四）。
 * 注意：schema 把 30 种 kind 建模为「单一对象 + 可选字段」，此处如实投影，
 * 未逐 kind 拆判别式联合（那是 P2 编译期的收紧工作）。
 */
export interface Condition {
  kind: ConditionKind
  side?: ConditionSide
  cmp?: Cmp
  n?: number
  /** chance（唯一允许随机的条件，R3 登记 / R4 单次抽样） */
  p?: number
  id?: string | string[]
  value?: Scalar
  categories?: string[]
  category?: string
  conditions?: Condition[]
  statusId?: string | string[]
  stacksAtLeast?: number
  unitId?: string | string[]
  unitTypes?: string[]
  type?: string | string[]
  tag?: string | string[]
  element?: string | string[]
  faction?: string
  aUnit?: string
  bUnit?: string
  aSide?: string
  bSide?: string
  key?: string
  aggregate?: 'sum'
  op?: string
  target?: string
  zoneId?: string
  phases?: Phase[]
  note?: string
}

/** 单位过滤（共享内核参数 §一）。开放字段以 schema $defs/unitFilter 为准 */
export interface UnitFilter {
  unitType?: string | string[]
  tags?: string[]
  hasStatus?: boolean | { id?: string; stacksAtLeast?: number }
  hasCategory?: string | string[]
  hpPercent?: { cmp?: Cmp; n?: number }
  casterHasSummon?: boolean
  adjacency?: Record<string, Scalar>
  unitId?: string | string[]
  element?: string | string[]
  rankBelowCaster?: boolean
  rankAboveCaster?: boolean
  rankMax?: number
  rankMin?: number
  gender?: Gender | 'any'
  anyOf?: UnitFilter[]
}

export type FactionSelector = 'self' | 'ally' | 'enemy' | 'any' | 'none' | 'self_or_ally'

/** 目标请求（共享内核参数 §一）。laneRef 已于 2026-10-03 删除——勿实现 */
export interface TargetRequest {
  faction: FactionSelector
  scope?: string
  filter?: UnitFilter
  anchor?: string
  fixedIndex?: number
  sort?: SortKey
  sortKey?: string
  spread?: 'none' | 'lane_line' | 'splash_adjacent' | 'splash_behind' | 'cross_same_index'
  excludeSelf?: boolean
  pickCount?: CountValue
  selectionMode?: 'manual' | 'auto'
}

/** 效果作用对象简写（schema $defs/effectTarget） */
export type EffectTarget =
  | 'self' | 'caster' | 'target' | 'primary_target' | 'same_target' | 'secondary_target'
  | 'attacker' | 'holder' | 'status_holder' | 'killed_unit'
  | 'all_allies' | 'allies_except_self' | 'all_enemies' | 'all_other_enemies' | 'all_units' | 'all'
  | 'adjacent_enemy' | 'enemy' | 'occupant_ally' | 'occupant_enemy'
  | 'splash_adjacent' | 'splash_behind' | 'one_own_snare_trap' | 'board'

/** 目标规格（共享内核.md §二；INV-E6：Manual 必填 fallbackSort） */
export interface TargetSpec {
  request: TargetRequest
  selectionMode: 'manual' | 'auto'
  fallbackSort?: SortKey | Record<string, Scalar>
  consumption?: Consumption
  mode?: 'unit' | 'area'
  pickCount?: number
  note?: string
}

/** 效果消费分流（执行参数 §一） */
export type Consumption = 'instant' | 'zone' | 'summon' | 'domain' | 'translocate'

/**
 * 效果引用（共享内核.md §三）。
 * params 覆写 EffectDef 的默认参数；originTerm 为编目期展开后留下的只读烙印。
 */
export interface EffectRef {
  ref: DefId
  params?: Record<string, Scalar | Scalar[] | Record<string, Scalar>>
  condition?: Condition
  target?: EffectTarget
  originTerm?: DefId
}

/** 术语引用（尚未展开）——当前 schema 无 term 原语，展开为透传 */
export interface TermRef {
  term: DefId
  overrides?: Record<string, Scalar>
  sourcePathway?: string
}

/** valueFrom 取值域（效果参数 §一） */
export type ValueFrom =
  | 'statusStacks' | 'targetStat' | 'maxStatThisBattle'
  | 'battleStats' | 'lastEffectReturn' | 'dispelledAmount'
