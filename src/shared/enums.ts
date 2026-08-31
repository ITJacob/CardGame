/**
 * 共享内核的枚举取值域。
 *
 * 这里只声明"维度名与语义"，具体数值归参数层（03_参数层）。
 * 取值域本身来自 03_参数层 §1。
 */

/** 六元素 + none。纯标签，自身无数值语义（INV-EL1）。 */
export const ELEMENTS = ['fire', 'ice', 'poison', 'shock', 'mental', 'physical', 'water', 'none'] as const;
export type Element = (typeof ELEMENTS)[number];

/** 由 Element 派生的只读标签（INV-EL3）：默认不参与结算，服务于 UI 分组与流派规约。 */
export type DamageCategory = 'physical' | 'magic' | 'true';

/** element → damageCategory 映射表。全系统单点定义（INV-EL3）。 */
export const ELEMENT_TO_DAMAGE_CATEGORY: Readonly<Record<Element, DamageCategory>> = {
  physical: 'physical',
  fire: 'magic',
  ice: 'magic',
  poison: 'magic',
  shock: 'magic',
  mental: 'magic',
  water: 'magic',
  none: 'true',
};

export function damageCategoryOf(element: Element): DamageCategory {
  return ELEMENT_TO_DAMAGE_CATEGORY[element];
}

/** 攻击类行为的交战方式。与站位、与 targetSpec 正交（INV-P6）。 */
export type Reach = 'melee' | 'ranged' | 'none';

/** 状态触发时机。 */
export type TriggerEvent =
  | 'on_apply'
  | 'on_tick'
  | 'on_take_damage'
  | 'on_deal_damage'
  | 'on_death'
  | 'on_spawn'
  | 'on_turn_start'
  | 'on_remove'
  | 'on_battle_start'
  | 'on_kill';

export const TRIGGER_EVENTS: readonly TriggerEvent[] = [
  'on_apply',
  'on_tick',
  'on_take_damage',
  'on_deal_damage',
  'on_death',
  'on_spawn',
  'on_turn_start',
  'on_remove',
  'on_battle_start',
  'on_kill',
];

/** 状态分类。`stance` 受硬控清除规则约束（INV-P5）。 */
export type StatusCategory = 'dot' | 'hot' | 'buff' | 'debuff' | 'control' | 'reactive' | 'aura' | 'stance';

export type StackPolicy = 'refresh' | 'reject' | 'stack';

/** 目标排序规则。Manual 模式的 fallbackSort 复用同一取值域。 */
export type SortRule = 'none' | 'hp_asc' | 'hp_desc' | 'atk_desc' | 'index_asc';

export type BehaviorTrigger = 'active' | 'passive';
export type SelectionMode = 'auto' | 'manual';
export type TargetMode = 'unit' | 'area';
export type Consumption = 'instant' | 'zone' | 'summon';

export type FactionSelector = 'enemy' | 'ally' | 'self' | 'self_or_ally';
export type LaneRef = 'same_lane' | 'cross_lane' | 'all_lanes' | 'auto';

export type Anchor =
  | 'front_line'
  | 'self'
  | 'front_of_self'
  | 'behind_self'
  | 'cross_same_index'
  | 'absolute'
  | 'first_empty'
  | 'taunt_source';

/** 注意：`radius` 已从取值域删除（A15 / §3.2），改用 adjacent + spread 组合。 */
export type Scope = 'single_point' | 'whole_lane' | 'adjacent';

export type Spread = 'none' | 'lane_line' | 'splash_adjacent' | 'splash_behind' | 'cross_same_index';

/** 九种效果类型（v1.5 效果类型族审计后定稿）。 */
export type EffectType =
  | 'damage'
  | 'heal'
  | 'mount_status'
  | 'modify_stat'
  | 'modify_resource'
  | 'move'
  | 'spawn'
  | 'dispel'
  | 'drain';

export const EFFECT_TYPES: readonly EffectType[] = [
  'damage',
  'heal',
  'mount_status',
  'modify_stat',
  'modify_resource',
  'move',
  'spawn',
  'dispel',
  'drain',
];

export type ZoneKind = 'trap' | 'blessing' | 'hazard' | 'mark';
export type ZoneTrigger = 'on_enter' | 'on_exit' | 'on_occupy_tick';
export type Affects = 'enemy_of_owner' | 'ally_of_owner' | 'any';

export type BehaviorModifierOp =
  | 'disable'
  | 'force'
  | 'energy_cost_mul'
  | 'energy_cost_add'
  | 'cast_time_set'
  | 'cooldown_mul'
  | 'target_override';

export type RedirectTo = 'self' | 'attacker' | 'transfer_target';
export type SourceFilter = 'melee' | 'ranged' | 'skill' | 'any';

/** 可被 modify_stat 修正的战斗属性 / 资源上限 / 恢复速率 / 抗性槽。 */
export type StatKey =
  | 'attack'
  | 'defense'
  | 'armor'
  | 'hp_max'
  | 'energy_max'
  | 'energy_regen'
  | 'gauge_rate'
  | 'gauge_threshold'
  | 'resist:fire'
  | 'resist:ice'
  | 'resist:poison'
  | 'resist:shock'
  | 'resist:mental'
  | 'resist:physical'
  | 'resist:water';

export const RESISTANCE_ELEMENTS: readonly Element[] = ['fire', 'ice', 'poison', 'shock', 'mental', 'physical', 'water'];

/**
 * 全部合法 StatKey（A24 固化）。
 *
 * ⛔ 刻意**不含**"行动周期"与"有效攻防"——它们都是派生值（INV-S5），
 * 要改只能改源属性。验证器靠这张表抓"有人偷偷修派生值"。
 */
export const STAT_KEYS: readonly StatKey[] = [
  'attack',
  'defense',
  'armor',
  'hp_max',
  'energy_max',
  'energy_regen',
  'gauge_rate',
  'gauge_threshold',
  'resist:fire',
  'resist:ice',
  'resist:poison',
  'resist:shock',
  'resist:mental',
  'resist:physical',
  'resist:water',
];

export function isStatKey(value: string): value is StatKey {
  return (STAT_KEYS as readonly string[]).includes(value);
}

export function isResistanceStat(stat: StatKey): boolean {
  return stat.startsWith('resist:');
}

export function resistanceElementOf(stat: StatKey): Element {
  return stat.slice('resist:'.length) as Element;
}

/** 池型资源键。 */
export type PoolKey = 'hp' | 'energy' | 'shield' | 'armor';

/** 进度型资源的三个可修改维度（A24）。 */
export type GaugeDimension = 'gauge.current' | 'gauge.rate' | 'gauge.threshold';

export type ResourceKey = PoolKey | GaugeDimension;

/** 单位的行动状态（§5.8）。 */
export type UnitState = 'active' | 'channeling' | 'dying' | 'removed';

/** Action 状态机（§7.4）。 */
export type ActionState = 'created' | 'pending' | 'resolving' | 'resolved';

/** 战斗状态机（§4.6）。 */
export type BattleState = 'created' | 'ready' | 'running' | 'finished';
