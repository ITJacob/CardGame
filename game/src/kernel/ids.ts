// 基础标识与封闭枚举（权威源：docs/ddd/params/*、docs/json/schema/skills.schema.json）。
// 枚举一律以 schema 为机器权威；本文件只是它们的 TS 投影。

export type PathwayId = string
export type CardId = string
export type DefId = string
export type UnitId = string
export type FactionId = string
export type LaneId = string
export type InstanceId = string

/** 八元素 + none（共享内核参数 §二；闭集裁定 2026-09-13） */
export type Element =
  | 'fire' | 'ice' | 'poison' | 'lightning'
  | 'mental' | 'physical' | 'holy' | 'dark' | 'none'

/** 一轮之内的五个时段（战场参数 §1.3b）；由 board.clock 查表派生 */
export type Phase = 'midnight' | 'dawn' | 'day' | 'dusk' | 'night'

export type Gender = 'male' | 'female'

/** Pool 键（编队参数 §2.2 / 效果参数 modify_resource.resource 子集） */
export type PoolKey = 'hp' | 'energy' | 'shield' | 'armor' | 'lost' | 'lust'

/** 战场级量表（modify_resource.resource 另外三值） */
export type BoardMeter = 'gauge.current' | 'secrecy' | 'order' | 'fate_value'

/**
 * 可被 modify_stat 的属性键（效果参数 §一）。
 * 开放串：attack/defense/armor/rank/summon_cap/hp_max/energy_max/energy_regen/
 * gauge.rate/gauge.threshold/resist:<element>/resist:*
 */
export type StatKey = string

/** 攻击形态，与 targetSpec 正交（编队参数 §1.2；INV-P6） */
export type Reach = 'none' | 'melee' | 'thrown' | 'spell'

export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'

/** 卡的种类：active → SkillDef；passive → BehaviorTemplate */
export type CardKind = 'active' | 'passive'
