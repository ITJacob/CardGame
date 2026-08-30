/**
 * 示例编目：把 02_详细设计 + 03_参数层 的骨架用一份最小可跑的配置填出来。
 *
 * 定位说明：
 * - 这里的**数值**全部是占位，标记与 03_参数层 §4 回填清单一致（多数仍待评审）；
 * - 这里的**结构**是干货：术语展开、Definition + Grant、九种效果、区域载荷清单都能跑通。
 * - 目的是给核心逻辑层当夹具，也给后续"数值重新标定"提供一个可替换的落点。
 */

import type { RawCatalog } from '../catalog/catalog.js';
import type { EffectDef, StatusDef, TermDef } from '../catalog/model.js';
import type { TargetSpec } from '../shared/target-spec.js';

// ————————————————————————————————————————————————
// 目标规格
// ————————————————————————————————————————————————

/** 敌方同路最前排单体（普攻的默认形态）。 */
const ENEMY_FRONT: TargetSpec = {
  request: {
    faction: 'enemy',
    laneRef: 'same_lane',
    anchor: 'front_line',
    scope: 'single_point',
    sort: 'index_asc',
    spread: 'none',
    pickCount: 1,
  },
  mode: 'unit',
  consumption: 'instant',
  selectionMode: 'auto',
};

/** 敌方全体（跨路，各路最前排）。 */
const ENEMY_ALL_FRONT: TargetSpec = {
  request: {
    faction: 'enemy',
    laneRef: 'all_lanes',
    anchor: 'front_line',
    scope: 'single_point',
    sort: 'index_asc',
    spread: 'none',
    pickCount: 4,
  },
  mode: 'unit',
  consumption: 'instant',
  selectionMode: 'auto',
};

/** 旋风斩（A15：radius 已删，改用 adjacent + spread）。 */
const WHIRLWIND_AREA: TargetSpec = {
  request: {
    faction: 'enemy',
    laneRef: 'same_lane',
    anchor: 'front_line',
    scope: 'adjacent',
    sort: 'index_asc',
    spread: 'lane_line',
    pickCount: 4,
  },
  mode: 'area',
  consumption: 'instant',
  selectionMode: 'auto',
};

/** 自身（挂增益）。 */
const SELF: TargetSpec = {
  request: {
    faction: 'self',
    laneRef: 'same_lane',
    anchor: 'self',
    scope: 'single_point',
    sort: 'index_asc',
    spread: 'none',
    pickCount: 1,
  },
  mode: 'unit',
  consumption: 'instant',
  selectionMode: 'auto',
};

/** Manual 示例：必须带 fallbackSort（INV-E6）。 */
const MANUAL_ENEMY: TargetSpec = {
  request: {
    faction: 'enemy',
    laneRef: 'same_lane',
    anchor: 'front_line',
    scope: 'whole_lane',
    sort: 'hp_asc',
    spread: 'none',
    pickCount: 1,
  },
  mode: 'unit',
  consumption: 'instant',
  selectionMode: 'manual',
  fallbackSort: 'hp_asc',
};

/** 陷阱落点（区域消费，需 zoneDefId）。 */
const TRAP_AREA: TargetSpec = {
  request: {
    faction: 'enemy',
    laneRef: 'same_lane',
    anchor: 'front_line',
    scope: 'single_point',
    sort: 'index_asc',
    spread: 'none',
    pickCount: 1,
  },
  mode: 'area',
  consumption: 'zone',
  selectionMode: 'auto',
  zoneDefId: 'zone_fire_trap',
};

// ————————————————————————————————————————————————
// 效果
// ————————————————————————————————————————————————

const effects: readonly EffectDef[] = [
  // 1. damage
  {
    id: 'dmg_physical_attack',
    type: 'damage',
    element: 'physical',
    params: { source: 'attack', ratio: 1 },
    displayName: '物理普攻',
  },
  {
    // 近战对撞的效果约定 id：走同一条伤害链，可被转向 / 减伤 / 条件过滤（§7.5.1）。
    id: 'melee_clash_damage',
    type: 'damage',
    element: 'physical',
    params: { source: 'attack', ratio: 1 },
    displayName: '近战对撞',
  },
  { id: 'dmg_fireball', type: 'damage', element: 'fire', params: { source: 'value', value: 5 } },
  { id: 'dmg_whirlwind', type: 'damage', element: 'physical', params: { source: 'value', value: 6 } },
  { id: 'dmg_flamestorm', type: 'damage', element: 'fire', params: { source: 'value', value: 4 } },
  {
    id: 'dmg_poison_dot',
    type: 'damage',
    element: 'poison',
    // DoT 穿透护甲（吸收型阶段被跳过）。
    params: { source: 'value', value: 1 },
    meta: { bypassArmor: true },
  },
  { id: 'dmg_burn_dot', type: 'damage', element: 'fire', params: { source: 'value', value: 2 } },
  { id: 'dmg_thorns', type: 'damage', element: 'physical', params: { source: 'value', value: 1 } },

  // 2. heal（A22：治疗语义，只作用于生命类池）
  { id: 'heal_regen', type: 'heal', element: 'none', params: { value: 2, pool: 'hp' } },

  // 3. mount_status
  { id: 'apply_burn', type: 'mount_status', element: 'none', params: { status_id: 'burn', duration: 3 } },
  { id: 'apply_poison', type: 'mount_status', element: 'none', params: { status_id: 'poison', duration: 5 } },
  { id: 'apply_vulnerable', type: 'mount_status', element: 'none', params: { status_id: 'vulnerable', duration: 4 } },
  { id: 'apply_fortify', type: 'mount_status', element: 'none', params: { status_id: 'fortify', duration: 4 } },
  { id: 'apply_shield', type: 'mount_status', element: 'none', params: { status_id: 'shield', duration: 6 } },
  { id: 'apply_stun', type: 'mount_status', element: 'none', params: { status_id: 'stun', duration: 5 } },
  { id: 'apply_guard_stance', type: 'mount_status', element: 'none', params: { status_id: 'guard_stance', duration: 6 } },
  { id: 'apply_guard', type: 'mount_status', element: 'none', params: { status_id: 'guard', duration: 6 } },

  // 4. modify_stat（A21：无宿主、不可驱散）
  { id: 'break_armor', type: 'modify_stat', params: { stat: 'armor', delta: -5, duration: 4 } },
  { id: 'buff_attack', type: 'modify_stat', params: { stat: 'attack', delta: 3, duration: 4 } },
  { id: 'debuff_fire_resist', type: 'modify_stat', params: { stat: 'resist:fire', delta: -0.2, duration: 3 } },

  // 5. modify_resource（A22 / A24）
  { id: 'gain_armor_2', type: 'modify_resource', params: { resource: 'armor', value: 2, mode: 'delta' } },
  { id: 'shatter_armor', type: 'modify_resource', params: { resource: 'armor', value: -3, mode: 'delta' } },
  { id: 'knockback', type: 'modify_resource', params: { resource: 'gauge.current', value: -50, mode: 'delta' } },
  { id: 'pay_hp_3', type: 'modify_resource', params: { resource: 'hp', value: -3, mode: 'delta' } },

  // 6. move / 7. spawn
  { id: 'swap_back', type: 'move', params: { op: 'swap_neighbor', direction: 1 } },
  { id: 'summon_wolf', type: 'spawn', params: { unit_def: 'unit_wolf' } },

  // 8. dispel（A23）
  { id: 'dispel_unit', type: 'dispel', params: { target: 'unit', dispelable: true } },
  { id: 'dispel_trap', type: 'dispel', params: { target: 'coordinate' } },

  // 9. drain（A17：跨效果传值，效果内部闭环）
  { id: 'drain_life', type: 'drain', element: 'physical', params: { source: 'attack', ratio: 1, healRatio: 0.5 } },
];

// ————————————————————————————————————————————————
// 术语（§8.4，编目期展开）
// ————————————————————————————————————————————————

const terms: readonly TermDef[] = [
  {
    id: 'wind_fury',
    displayName: '风怒',
    category: 'attack_shape',
    description: '连续对同一目标造成 {count} 次伤害',
    overridable: ['count'],
    tags: ['multi_hit'],
    composition: {
      kind: 'repeat',
      count: 2,
      shareTarget: true,
      body: [{ ref: 'dmg_physical_attack', params: { ratio: 1 } }],
    },
  },
  {
    id: 'ignite',
    displayName: '引燃',
    category: 'rider',
    description: '造成一次火焰伤害并附加灼烧',
    overridable: [],
    tags: ['fire'],
    composition: {
      kind: 'sequence',
      of: [
        { ref: 'dmg_fireball' },
        { ref: 'apply_burn' },
      ],
    },
  },
  {
    id: 'execute',
    displayName: '斩杀',
    category: 'attack_shape',
    description: '造成一次伤害；若目标生命低于 {threshold} 则附加灼烧',
    overridable: [],
    tags: ['finisher'],
    composition: {
      kind: 'sequence',
      of: [
        { ref: 'dmg_physical_attack' },
        {
          kind: 'if',
          cond: { kind: 'target_hp_below', ratio: 0.3 },
          then: [{ ref: 'apply_burn' }],
        },
      ],
    },
  },
];

// ————————————————————————————————————————————————
// 状态（参数层 §2.4；标 ⚠️ 者为本次补齐的 defaultDuration）
// ————————————————————————————————————————————————

const statuses: readonly StatusDef[] = [
  {
    id: 'poison',
    displayName: '中毒',
    category: 'dot',
    defaultDuration: 5,
    maxStacks: 3,
    stackPolicy: 'refresh',
    dispelable: true,
    behaviorModifiers: [],
    payload: [{ ref: 'dmg_poison_dot' }],
    triggers: [{ event: 'on_tick', effects: [] }],
  },
  {
    id: 'regen',
    displayName: '再生',
    category: 'hot',
    defaultDuration: 6,
    maxStacks: 1,
    stackPolicy: 'refresh',
    dispelable: true,
    behaviorModifiers: [],
    payload: [{ ref: 'heal_regen' }],
    triggers: [{ event: 'on_tick', effects: [] }],
    params: {},
  },
  {
    id: 'burn',
    displayName: '灼烧',
    category: 'dot',
    // ⚠️ 灼烧不在原 15 个状态表里，是本次补齐的（03_参数层「已知缺口」）。
    defaultDuration: 3,
    maxStacks: 1,
    stackPolicy: 'refresh',
    dispelable: true,
    behaviorModifiers: [],
    payload: [{ ref: 'dmg_burn_dot' }],
    triggers: [{ event: 'on_tick', effects: [] }],
  },
  {
    id: 'thorns',
    displayName: '反伤',
    category: 'reactive',
    // ⚠️ 补齐：原配置把 duration 写死在效果定义里，StatusDef 没有默认值（INV-C2）。
    defaultDuration: 8,
    maxStacks: 1,
    stackPolicy: 'refresh',
    dispelable: true,
    behaviorModifiers: [],
    triggers: [{ event: 'on_take_damage', sourceFilter: 'melee', effects: [{ ref: 'dmg_thorns' }] }],
  },
  {
    id: 'deathrattle',
    displayName: '亡语',
    category: 'reactive',
    defaultDuration: 0,
    maxStacks: 1,
    stackPolicy: 'refresh',
    dispelable: false,
    behaviorModifiers: [],
    triggers: [{ event: 'on_death', effects: [{ ref: 'dmg_physical_attack' }] }],
  },
  {
    id: 'opening_aura',
    displayName: '开场光环',
    category: 'aura',
    defaultDuration: 0,
    maxStacks: 1,
    stackPolicy: 'refresh',
    dispelable: false,
    behaviorModifiers: [],
    triggers: [{ event: 'on_spawn', effects: [{ ref: 'gain_armor_2' }] }],
  },
  {
    id: 'vulnerable',
    displayName: '易伤',
    category: 'debuff',
    defaultDuration: 4,
    maxStacks: 1,
    stackPolicy: 'refresh',
    dispelable: true,
    behaviorModifiers: [],
    triggers: [],
    // A14：易伤走乘区 ×1.3，由伤害链的乘区型阶段读取。
    params: { damage_taken_mul: 1.3 },
  },
  {
    id: 'fortify',
    displayName: '坚守',
    category: 'buff',
    defaultDuration: 4,
    maxStacks: 1,
    stackPolicy: 'refresh',
    dispelable: true,
    behaviorModifiers: [],
    triggers: [],
    params: { damage_taken_mul: 0.7 },
  },
  {
    id: 'shield',
    displayName: '护盾',
    category: 'buff',
    // §3.6：独立 shield 池，先于 HP 扣减。
    defaultDuration: 6,
    maxStacks: 1,
    stackPolicy: 'refresh',
    dispelable: true,
    behaviorModifiers: [],
    triggers: [
      {
        event: 'on_apply',
        effects: [{ ref: 'gain_armor_2' }, { ref: 'gain_armor_2' }, { ref: 'gain_armor_2' }],
      },
    ],
  },
  {
    id: 'silence',
    displayName: '沉默',
    category: 'control',
    // ⚠️ 补齐 defaultDuration。
    defaultDuration: 8,
    maxStacks: 1,
    stackPolicy: 'refresh',
    dispelable: true,
    behaviorModifiers: [{ op: 'disable', behaviorKey: 'cast_fireball' }],
    triggers: [],
  },
  {
    id: 'taunt',
    displayName: '嘲讽',
    category: 'control',
    // ⚠️ 补齐 defaultDuration。
    defaultDuration: 6,
    maxStacks: 1,
    stackPolicy: 'refresh',
    dispelable: true,
    behaviorModifiers: [
      { op: 'force', behaviorKey: 'basic_attack' },
      { op: 'target_override', value: ENEMY_FRONT },
    ],
    triggers: [],
  },
  {
    id: 'energy_burden',
    displayName: '耗能加重',
    category: 'debuff',
    // ⚠️ 补齐 defaultDuration。
    defaultDuration: 10,
    maxStacks: 1,
    stackPolicy: 'refresh',
    dispelable: true,
    behaviorModifiers: [{ op: 'energy_cost_mul', value: 1.5 }],
    triggers: [],
  },
  {
    id: 'free_cast',
    displayName: '免吟唱',
    category: 'buff',
    // ⚠️ 补齐 defaultDuration。
    defaultDuration: 5,
    maxStacks: 1,
    stackPolicy: 'refresh',
    dispelable: true,
    behaviorModifiers: [{ op: 'cast_time_set', value: 0 }],
    triggers: [],
  },
  {
    id: 'stun',
    displayName: '眩晕',
    category: 'control',
    // §3.7：语义为 disable（禁用行为），而非"剥夺机会"（A2′ 待重评）。
    defaultDuration: 5,
    maxStacks: 1,
    stackPolicy: 'refresh',
    dispelable: false,
    behaviorModifiers: [{ op: 'disable', behaviorKey: '*' }],
    triggers: [],
  },
  {
    id: 'guard',
    displayName: '守护',
    category: 'reactive',
    // ⚠️ 补齐 defaultDuration。protectedSelector.unit_ref 的 unitId 由 StatusGrant.binding 提供。
    defaultDuration: 6,
    maxStacks: 1,
    stackPolicy: 'refresh',
    dispelable: true,
    behaviorModifiers: [],
    triggers: [],
    redirect: {
      op: 'redirect',
      to: 'self',
      protectedSelector: { kind: 'unit_ref' },
      sourceFilter: 'any',
      ratio: 1,
      priority: 10,
    },
  },
  {
    id: 'damage_transfer',
    displayName: '伤害转移',
    category: 'reactive',
    // ⚠️ 补齐 defaultDuration。
    defaultDuration: 5,
    maxStacks: 1,
    stackPolicy: 'refresh',
    dispelable: true,
    behaviorModifiers: [],
    triggers: [],
    redirect: {
      op: 'redirect',
      to: 'attacker',
      sourceFilter: 'any',
      ratio: 1,
      priority: 5,
    },
  },
  {
    id: 'guard_stance',
    displayName: '守卫姿态',
    // INV-P5：category = stance，会被硬控（control）清除。
    category: 'stance',
    defaultDuration: 6,
    maxStacks: 1,
    stackPolicy: 'refresh',
    dispelable: true,
    behaviorModifiers: [],
    triggers: [],
    redirect: {
      op: 'redirect',
      to: 'self',
      protectedSelector: { kind: 'coordinate_relation', relation: 'same_lane_behind' },
      // 守卫姿态只承接远程伤害（§5.9.3）。
      sourceFilter: 'ranged',
      ratio: 1,
      priority: 10,
    },
  },
];

// ————————————————————————————————————————————————
// 行为模板 / 技能 / 区域 / 职业 / 单位
// ————————————————————————————————————————————————

export const sampleCatalog: RawCatalog = {
  effects,
  terms,
  statuses,

  behaviorTemplates: [
    {
      id: 'tpl_basic_attack',
      key: 'basic_attack',
      displayName: '普攻',
      trigger: 'active',
      reach: 'melee',
      cost: { gaugeAmount: 75, energyAmount: 0 },
      castTime: 0,
      cooldown: 0,
      targetSpec: ENEMY_FRONT,
      effects: [{ ref: 'dmg_physical_attack' }],
    },
    {
      id: 'tpl_power_strike',
      key: 'power_strike',
      displayName: '重击（风怒）',
      trigger: 'active',
      reach: 'melee',
      cost: { gaugeAmount: 75, energyAmount: 3 },
      castTime: 0,
      cooldown: 2,
      targetSpec: ENEMY_FRONT,
      // 术语：Repeat 展开为两段同目标伤害（A12：只撞一次、只触发一次受击）。
      effects: [{ termRef: 'wind_fury', overrides: { count: 2 } }],
    },
    {
      id: 'tpl_defend',
      key: 'defend',
      displayName: '坚守',
      trigger: 'active',
      reach: 'none',
      cost: { gaugeAmount: 75, energyAmount: 0 },
      castTime: 0,
      cooldown: 3,
      targetSpec: SELF,
      effects: [{ ref: 'apply_fortify' }, { ref: 'apply_shield' }],
    },
    {
      id: 'tpl_fireball',
      key: 'cast_fireball',
      displayName: '火球术',
      trigger: 'active',
      reach: 'ranged',
      cost: { gaugeAmount: 75, energyAmount: 2 },
      castTime: 0,
      cooldown: 3,
      targetSpec: MANUAL_ENEMY,
      effects: [
        { ref: 'dmg_fireball' },
        // B1 / R5：概率只用于"是否附加状态"这类非伤害维度，且走 RandomSource。
        { ref: 'apply_burn', condition: { kind: 'chance', p: 0.5 } },
      ],
    },
    {
      id: 'tpl_flamestorm',
      key: 'cast_flamestorm',
      displayName: '烈焰风暴',
      trigger: 'active',
      reach: 'ranged',
      cost: { gaugeAmount: 75, energyAmount: 4 },
      castTime: 1,
      cooldown: 5,
      targetSpec: ENEMY_ALL_FRONT,
      effects: [{ termRef: 'ignite' }],
    },
    {
      id: 'tpl_guard_stance',
      key: 'guard_stance_action',
      displayName: '进入守卫姿态',
      trigger: 'active',
      reach: 'none',
      cost: { gaugeAmount: 75, energyAmount: 1 },
      castTime: 0,
      cooldown: 4,
      targetSpec: SELF,
      effects: [{ ref: 'apply_guard_stance' }],
    },
    {
      id: 'tpl_trap',
      key: 'set_trap',
      displayName: '布置火焰陷阱',
      trigger: 'active',
      reach: 'none',
      cost: { gaugeAmount: 75, energyAmount: 2 },
      castTime: 0,
      cooldown: 6,
      targetSpec: TRAP_AREA,
      effects: [{ ref: 'dmg_flamestorm' }],
    },
  ],

  skills: [
    // A19 · 模板优先
    {
      id: 'skill_fireball',
      displayName: '火球术',
      templateRef: 'tpl_fireball',
      init: { cost: { gaugeAmount: 75, energyAmount: 2 }, cooldown: 3 },
    },
    // A19 · 逃生舱：templateRef 为空，自带完整行为定义
    {
      id: 'skill_whirlwind',
      displayName: '旋风斩',
      templateRef: null,
      init: {
        key: 'whirlwind',
        reach: 'melee',
        cost: { gaugeAmount: 75, energyAmount: 3 },
        castTime: 0,
        cooldown: 4,
        targetSpec: WHIRLWIND_AREA,
      },
      effects: [
        { ref: 'dmg_whirlwind' },
        { ref: 'apply_burn', condition: { kind: 'target_hp_below', ratio: 0.3 } },
      ],
    },
  ],

  zones: [
    {
      id: 'zone_fire_trap',
      kind: 'trap',
      maxDuration: 10,
      displayName: '火焰陷阱',
      defaultGrant: {
        duration: 6,
        uses: 1,
        affects: 'enemy_of_owner',
        trigger: 'on_enter',
        triggerOnExisting: false,
        // A23：载荷是清单，逐条独立判定。
        effects: [{ ref: 'dmg_flamestorm' }, { ref: 'apply_burn' }],
        ownerSide: null,
      },
    },
  ],

  classes: [
    {
      id: 'class_warrior',
      defaultKit: undefined,
      kitOps: [{ op: 'add', slot: { templateId: 'tpl_guard_stance' } }],
      knownSkills: ['skill_whirlwind'],
    },
    {
      id: 'class_mage',
      kitOps: [{ op: 'add', slot: { templateId: 'tpl_trap' } }],
      knownSkills: ['skill_fireball'],
    },
  ],

  units: [
    {
      id: 'unit_warrior',
      displayName: '战士',
      classId: 'class_warrior',
      attributes: { strength: 3, agility: 2, intellect: 1 },
    },
    {
      id: 'unit_mage',
      displayName: '法师',
      classId: 'class_mage',
      attributes: { strength: 1, agility: 2, intellect: 4 },
    },
    {
      id: 'unit_wolf',
      displayName: '召唤狼',
      classId: null,
      attributes: { strength: 1, agility: 3, intellect: 0 },
    },
  ],

  // 全局默认套件：未声明 kit 的职业自动继承（§5.6）。四个行为——对应"眩晕禁用全部四个行为"。
  defaultKit: [
    { templateId: 'tpl_basic_attack' },
    { templateId: 'tpl_power_strike' },
    { templateId: 'tpl_defend' },
    { templateId: 'tpl_flamestorm' },
  ],
};
