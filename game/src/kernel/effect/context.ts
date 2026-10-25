// 效果结算的运行时上下文与工具。
import type { Element, FactionId, Phase } from '../ids'
import type { DomainEvent } from '../combat/types'
import type { EffGrantImmunity, EffModifyWeapon, EffSpawn, EffectNode, StatusDef } from '../catalog/types'
import type { IdGenerator } from '../shared/id-generator'
import type { RandomSource, RandomUsageRegistry } from '../shared/random-source'
import type { StatusGrant } from '../roster/types'
import type { Registry } from '../roster/registry'
import type { CombatUnit, TargetabilityRecord } from '../roster/unit'
import type { TargetScope } from './target-scope'

/** 行动机会的括号载荷（调度上下文 §三 INV-S6）：on_turn_start / on_turn_end 触发时挂进上下文 */
export interface OpportunityPayload {
  /** 机会标识 = `${unitId}@${tickIndex}`——INV-S3 保证同 tick 每单位至多一次机会，故唯一 */
  readonly opportunityId: string
  /** on_turn_start 恒为 null；on_turn_end 为消耗它的 Action id，或 'wasted' */
  readonly consumedBy: string | null
}

/** 单次结算账本：一个 Action / 一条触发链一份，供 dispelled_count / consumed_count 与动态段数读取。
 *  跨结算的累计读数（如「本场已有驱散」）走 battleDispelled。 */
export interface ResolutionLedger {
  dispelled: number
  readonly consumed: Map<string, number>
}

export function createLedger(): ResolutionLedger {
  return { dispelled: 0, consumed: new Map() }
}

export interface EffectContext {
  readonly units: Registry
  readonly random: RandomSource
  readonly registry: RandomUsageRegistry
  readonly ids: IdGenerator
  readonly phase: Phase
  readonly caster: CombatUnit | null
  /** 当前 Action 的 id（写入 EffectApplied） */
  readonly actionId: string
  /** 机会括号载荷：仅 on_turn_start / on_turn_end 触发链上存在（其余触发点与主动行为均为 undefined） */
  readonly opportunity?: OpportunityPayload
  /** 本次结算账本（本次驱散数 / 本次消耗层数）；由 pipeline 每个 Action、runtime 每条触发链创建 */
  readonly ledger?: ResolutionLedger
  /** 本场累计驱散数（dispelled_count scope:'battle'） */
  readonly battleDispelled?: () => number
  /** 记录本次结算驱散的数量（unit 状态 / 召唤物 / 界域统一入账） */
  readonly noteDispel?: (count: number) => void
  /** 效果级 target 的求值语境（执行参数 §2.1b / §2.1c）：触发链 = 载荷，卡片行为 = 施法者 + 选靶。
   *  存在时，效果节点上的 target 简写按它求值；不存在（zone / echo / translocate）则沿用外层落点 */
  readonly targetScope?: TargetScope
  readonly warn: (msg: string) => void
  readonly emit: (e: DomainEvent) => void
  /** 挂载状态并触发 on_apply 等副作用（由 runtime 实现，避免循环依赖） */
  readonly mountStatus: (host: CombatUnit, statusId: string, grant: Omit<StatusGrant, 'sourceId'>) => void
  /** 按 EffectDef id 解析内联效果节点 */
  readonly effectNode: (defId: string) => EffectNode | undefined
  /** 状态定义的类别（供 dispel/reveal 过滤） */
  readonly defCategory: (defId: string) => readonly string[] | undefined
  /** 状态定义查询（modify_status 按装备槽选靶等） */
  readonly statusDef: (defId: string) => StatusDef | undefined
  /** 记录未实现原语（计入 unsupported 计数） */
  readonly unsupported: (kind: string, detail?: string) => void
  /** 遥测：造成伤害（用于 CombatStats） */
  readonly reportDamage?: (dealer: string, amount: number) => void
  /** 伤害落地钩子（触发 on_deal_damage / on_take_damage）；info 供 element_is / damage_source_is 条件 */
  readonly onDamage?: (
    attacker: CombatUnit | null,
    defender: CombatUnit,
    amount: number,
    info?: { element: Element; source: 'behavior' | 'status' },
  ) => void
  /** 需要触碰战场/注册表的操作（由 runtime 实现） */
  readonly ops: EffectOps
  /** 当前行动卡的 dimHooks 维度乘区系数（缺省 1；damage / heal / all） */
  readonly dimMul?: (target: 'damage' | 'heal') => number
  /** 现行界域 RulePatch 的被动读取面（战场参数 §1.2 / INV-D6） */
  readonly domainRule?: {
    effectBlocked?: (type: string) => boolean
    damageMul?: (faction: FactionId | undefined) => number
    healMul?: (faction: FactionId | undefined) => number
    shieldBlocked?: (faction: FactionId | undefined) => boolean
  }
  /** 发起本次结算的来源卡 id（普攻为 __basic_attack__；weaponDamage 判据用） */
  readonly actionRef?: string
  /** 本次结算是否属于「会消耗装备武器耐久的攻击」（普攻/攻击类主动 + 武器在槽） */
  readonly weaponDamage?: boolean
  /** 伤害来源类别（damage_source_is）：攻击行为 = behavior，其余（触发/DoT）= status */
  readonly damageSource?: 'behavior' | 'status'
  /** valueFrom:ramp 的当前档值（由触发它的状态实例递进给出） */
  readonly rampValue?: number
  /** zone_active 谓词：场上是否存在指定 zoneDef 的 Active 实例 */
  readonly zoneActive?: (zoneId: string) => boolean
  /** 叠层阈值复评（modify_status 改层后调用） */
  readonly checkStackThreshold?: (host: CombatUnit, statusId: string) => void
  /** 同 tag 连击计数（tag_chain） */
  readonly tagChainCount?: (tag: string) => number
  /** 状态 tags 查询（has_status_tag 谓词） */
  readonly statusTags?: (statusId: string) => readonly string[] | undefined
  /** 元素相消：受伤方身上削 1 层对立元素状态；返回 true 表示本次伤害按克制系数 ×0.85 */
  readonly elementCounter?: (defender: CombatUnit, element: Element) => boolean
  /** 触发语境主体：效果级 condition 的 side 解析（载荷内 target/attacker 等） */
  readonly host?: CombatUnit | null
  readonly subjects?: {
    target?: CombatUnit | null
    attacker?: CombatUnit | null
    killed?: CombatUnit | null
    caster?: CombatUnit | null
  }
  readonly event?: { element?: string; source?: string; statusId?: string }
}

/** 原语中需要改动战场或新建单位的操作集合 */
export interface EffectOps {
  /** 卸下并摧毁武器 */
  destroyWeapon(unit: CombatUnit, reason: string): void
  /** 改耐久 / 攻击加值 */
  modifyWeapon(unit: CombatUnit, node: EffModifyWeapon): void
  move(unit: CombatUnit, op: string, distance: number, caster: CombatUnit | null): void
  spawn(
    caster: CombatUnit | null,
    node: EffSpawn,
    near: CombatUnit | null,
    sources?: { target?: CombatUnit | null; killed?: CombatUnit | null },
  ): void
  translocate(unit: CombatUnit, duration: number, payload: readonly EffectNode[]): void
  takeControl(unit: CombatUnit, duration: number, caster: CombatUnit): void
  grantImmunity(unit: CombatUnit, node: EffGrantImmunity): void
  damageMod(unit: CombatUnit, scope: 'dealt' | 'taken', delta: number, remaining: number | null): void
  targetability(unit: CombatUnit, rec: TargetabilityRecord): void
  // ---- P2b-2 ----
  setLuminance(value: number | null, delta: number | null, duration: number | null, dispelable: boolean): void
  advanceClock(ticks: number): void
  applyDomain(op: string, defId: string | undefined, duration: number | undefined, caster: CombatUnit | null): void
  placeZone(caster: CombatUnit | null, defId: string | undefined, duration: number, targets: readonly CombatUnit[]): void
  snapshotUnit(unit: CombatUnit, fields: readonly string[]): void
  restoreUnit(unit: CombatUnit, fields: readonly string[]): void
  echoLastSkill(unit: CombatUnit, potency: number): void
  shuffleGauges(units: readonly CombatUnit[], resource: string): void
  shuffleStatuses(units: readonly CombatUnit[], count: number): void
  modifySkillOf(unit: CombatUnit, node: EffectNode): void
  applyTargetOverride(unit: CombatUnit, spec: { anchor?: string; faction?: string; sort?: string; unitId?: string }): void
  writeRuleSlot(node: EffectNode, caster: CombatUnit | null, target: CombatUnit | null): void
  modifyRuleSlot(node: EffectNode, caster: CombatUnit | null, target: CombatUnit | null): void
  /** 战场级量表（secrecy / order / fate_value） */
  boardMeter(key: string, value: number, set: boolean): void
  /** 战场级量表读数（meter_compare 谓词） */
  meterOf(key: string): number
  /** dispel 选择器：销毁召唤物（不走死亡链）；返回销毁数量（dispelled_count 入账） */
  dispelSummons(owner: CombatUnit | null, sel: DispelSummonSelector): number
  /** dispel 选择器：解除界域（只动 dispelable，tier 可选 filter）；返回解除数量 */
  dispelDomain(tier?: string, count?: number): number
}

export interface DispelSummonSelector {
  unitId?: string | string[]
  /** true = 只限 owner 召唤的 */
  ownOnly?: boolean
  count?: number
}

/** 用 EffectRef.params 覆写节点上的同名参数 */
export function withParams(node: EffectNode, params?: Record<string, unknown>): EffectNode {
  if (!params || Object.keys(params).length === 0) return node
  return { ...(node as unknown as Record<string, unknown>), ...params } as unknown as EffectNode
}

/** 取 EffectNode 的 condition / target（算子节点没有） */
export function nodeCondition(node: EffectNode): unknown {
  return (node as { condition?: unknown }).condition
}

export function numeric(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}
