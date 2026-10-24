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
  | 'all_of' | 'any_of' | 'caster_has_summon' | 'caster_status_exists' | 'chance' | 'consumed_count'
  | 'damage_source_is' | 'dead_count' | 'dispelled_count' | 'element_is' | 'faction_is'
  | 'field_status_count' | 'gauge_above' | 'gauge_rank' | 'gender_is' | 'has_category'
  | 'has_equipped'
  | 'has_status' | 'has_status_tag' | 'hp_percent' | 'hp_percent_compare' | 'luminance_compare' | 'meter_compare' | 'not'
  | 'phase_is' | 'rank_gap' | 'recorded_has' | 'resource_compare' | 'stat_compare' | 'tag_chain'
  | 'target_dead' | 'target_has_tag' | 'target_is_summoned' | 'target_unit_type'
  | 'variant_is' | 'zone_active'

/**
 * 效果生效条件（共享内核.md §四）。
 * 注意：schema 把 36 种 kind 建模为「单一对象 + 可选字段」，此处如实投影，
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
  /** 装备槽过滤（has_equipped 用，当前仅 weapon；缺省 = 任意装备槽） */
  slot?: string
  value?: Scalar
  categories?: string[]
  category?: string
  conditions?: Condition[]
  /** not 组合子的单子条件 */
  condition?: Condition
  statusId?: string | string[]
  stacksAtLeast?: number
  unitId?: string | string[]
  unitTypes?: string[]
  type?: string | string[]
  tag?: string | string[]
  element?: string | string[]
  /** damage_source_is：behavior / status */
  sources?: string[]
  /** gender_is：male / female */
  gender?: string
  /** dispelled_count 计数窗口：chain（本次结算，缺省）/ battle（本场累计） */
  scope?: 'chain' | 'battle'
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
  hasStatus?: boolean | string | { id?: string; stacksAtLeast?: number }
  hasCategory?: string | string[]
  hpPercent?: { cmp?: Cmp; n?: number }
  casterHasSummon?: boolean
  /** 是否为召唤物 / 是否由施法者召唤（征召类选靶） */
  isSummon?: boolean
  casterOwned?: boolean
  /** 持提线木偶的目标（占卜家秘偶换位） */
  isPuppet?: boolean
  /** 同阵营或镜像类单位（刺客镜像步） */
  isAllyOrMirror?: boolean
  /** 空格（区域模式下按格判定；单位池无法命中） */
  emptySlot?: boolean
  /** 相对触发器持有者/界域所有者的阵营过滤（filter.side；all/both 不约束） */
  side?: 'ally' | 'enemy' | 'all' | 'both' | 'any'
  /** 触发器事件过滤：仅 on_status_gain 使用——本次获得的状态 id */
  statusId?: string
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
  /**
   * 选靶第一级分流（缺省 unit）。
   * unit=池为单位实体（faction 圈定）：scope 只作池边界，pickCount 定命中数（指定型，不可选中类排除在此生效）；
   * area=池为坐标区块（anchor 原点 + scope 圈定）：命中区域内全部在位单位（AoE），pickCount 不参与。
   */
  mode?: 'unit' | 'area'
  faction: FactionSelector
  scope?: string
  filter?: UnitFilter
  anchor?: string
  fixedIndex?: number
  sort?: SortKey
  sortKey?: string
  spread?: 'none' | 'lane_line' | 'splash_adjacent' | 'splash_behind' | 'cross_same_index'
  excludeSelf?: boolean
  /** 从 anchor+scope 圈出的范围中排除锚点所在格（unit / area 均生效） */
  excludeAnchor?: boolean
  pickCount?: CountValue
  selectionMode?: 'manual' | 'auto'
}

/** 效果作用对象简写（schema $defs/effectTarget） */
export type EffectTarget =
  | 'self' | 'caster' | 'target' | 'primary_target' | 'same_target' | 'secondary_target'
  | 'attacker' | 'holder' | 'status_holder' | 'killed_unit'
  | 'all_allies' | 'allies_except_self' | 'all_enemies' | 'all_other_enemies' | 'all_units' | 'all'
  | 'adjacent_enemy' | 'enemy' | 'occupant_ally' | 'occupant_enemy'
  | 'splash_adjacent' | 'splash_behind' | 'one_own_snare_trap' | 'rule_breaker' | 'board'

/** 目标规格（共享内核.md §二；INV-E6：Manual 必填 fallbackSort） */
export interface TargetSpec {
  request: TargetRequest
  selectionMode: 'manual' | 'auto'
  fallbackSort?: SortKey | Record<string, Scalar>
  consumption?: Consumption
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
