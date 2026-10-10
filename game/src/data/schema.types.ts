// docs/json 的原始 JSON 形状（权威 = docs/json/schema/skills.schema.json，draft 2020-12）。
// 这里只描述「文件级」结构；卡片内部的效果节点等直接复用内核 catalog 类型，避免双写。

import type { CardKind, Element, Gender, Rarity, Reach } from '../kernel/ids'
import type {
  DomainDef, EffectNode, PhaseHook, StatusDef, TriggerDef, UnitDef, ZoneDef,
} from '../kernel/catalog/types'
import type { CountValue, EffectTarget, SortKey, TargetRequest, UnitFilter } from '../kernel/shared/types'

export interface RawCost {
  energy: number
  cooldown: number
  castTime: number | null
  note?: string
}

export interface RawCardTarget {
  request: TargetRequest
  selectionMode: 'manual' | 'auto'
  fallbackSort?: SortKey | Record<string, unknown>
  consumption?: 'summon' | 'domain' | 'zone' | 'instant' | 'translocate'
  mode?: 'unit' | 'area'
  pickCount?: number
  note?: string
}

export interface RawSecondaryTarget {
  request: TargetRequest
  selectionMode?: 'manual' | 'auto'
  fallbackSort?: SortKey | Record<string, unknown>
  note?: string
}

export interface RawAxis {
  symbol: string
  name: string
  statusId?: string
  enablers?: string[]
  payoffs?: string[]
  note?: string
}

export interface RawDomainGrant {
  tier: 'overlay' | 'hero'
  def: string
  duration: number
  durationUnit?: 'turn' | 'tick'
  dispelable: boolean
  rulePatches?: unknown[]
  envRulesText?: string
}

export interface RawZoneGrant {
  def: string
  duration: number
  durationUnit?: 'turn' | 'tick'
  placement?: string
  kind?: string
  affects?: 'ally_of_owner' | 'enemy_of_owner' | 'any'
  envRulesText?: string
}

export interface RawUpgradeLadder {
  ref: string
  tiers: { name: string; note: string; effects?: EffectNode[] }[]
  duplicatePolicy?: string
}

export interface RawVariant {
  id?: string
  name: string
  note: string
  effects?: EffectNode[]
  costOverride?: RawCost
}

/** 一张技能卡（kind=active → SkillDef；kind=passive → BehaviorTemplate） */
export interface RawCard {
  id: string
  name: string
  kind: CardKind
  sequence: number
  sequenceName: string
  rarity: Rarity
  axis: string
  flagship: boolean
  lore: string
  flavor: string
  describe: string
  effects: EffectNode[]
  tentative: boolean
  cost?: RawCost
  reach?: Reach
  target?: RawCardTarget
  /** 被动触发点（14 值闭集） */
  hook?: string[]
  statusDefs?: StatusDef[]
  triggers?: TriggerDef[]
  domain?: RawDomainGrant
  zone?: RawZoneGrant
  upgradeLadder?: RawUpgradeLadder
  variants?: RawVariant[]
  secondaryTargets?: RawSecondaryTarget[]
  tags?: string[]
  gender?: Gender | 'any'
  sharedAcross?: string[]
  conversionNotes?: string | string[]
  frameworkFlags?: { code: string; note: string; landed: boolean }[]
  dimHooks?: { dim: string; comparator: string; threshold: number; mul: number; target?: string }[]
  phaseHooks?: PhaseHook[]
  art?: unknown
}

/** 单个途径文件（docs/json/<pathway>.skills.json） */
export interface PathwayFile {
  pathwayId: string
  pathwayName: string
  sourceFile: string
  sourceVersion: string
  axes?: RawAxis[]
  sampleBuilds?: unknown[]
  designNote?: string
  artStyle?: string
  artFrameEpic?: string
  artFrameLegendary?: string
  cards: RawCard[]
  unitDefs?: UnitDef[]
  zoneDefs?: ZoneDef[]
  domainDefs?: DomainDef[]
}

export interface PathwayEntry {
  id: string
  name: string
  file: string
  cardCount: number
  sourceFile: string
}

/** docs/json/manifest.json */
export interface Manifest {
  schemaVersion: string
  sourceVersion: string
  pathways: PathwayEntry[]
}

/** 独立状态文件：docs/json/<pathway>.statuses.json 与 common.statuses.json */
export interface StatusFile {
  _meta?: unknown
  statusDefs: StatusDef[]
}

/** 导出若干内核类型别名，方便消费方从 data 层取用 */
export type { CountValue, EffectTarget, UnitFilter }
export type { Element }
