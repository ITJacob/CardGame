// 伤害链（效果上下文 §三）。顺序固定：①护盾 ②护甲 ③抗性 ④防御 ⑤乘区 ⑥下限。
// 纯函数：只读不改；由 applyDamageResult 真正扣减。
// 全程小数不取整，末 round2 收口。伤害结算零随机。

import type { Element } from '../ids'
import { round2 } from '../shared/result'
import type { CombatUnit } from '../roster/unit'

const RESIST_MIN = -0.5
const RESIST_MAX = 0.75

export interface DamageInput {
  raw: number
  element: Element
  attacker: CombatUnit | null
  defender: CombatUnit
  /** 直连死亡：跳过全部减伤 */
  lethal?: boolean
  /** 跳过的段：'shield' | 'armor' | 'resist' */
  pierce?: readonly string[]
  /** 0~1：按比例破甲 */
  armorPierceRatio?: number
  /** DoT 旁路：只过 ③ 抗性（INV-D4） */
  dot?: boolean
  minDamage?: number
}

export interface DamageStage {
  stage: string
  before: number
  after: number
}

export interface DamageResult {
  raw: number
  final: number
  absorbed: { shield: number; armor: number }
  breakdown: DamageStage[]
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v))
}

export function resolveDamage(input: DamageInput): DamageResult {
  const { raw, element, attacker, defender } = input
  const breakdown: DamageStage[] = []
  const absorbed = { shield: 0, armor: 0 }
  const pierced = new Set(input.pierce ?? [])
  const push = (stage: string, before: number, after: number): void => {
    breakdown.push({ stage, before: round2(before), after: round2(after) })
  }

  if (input.lethal) {
    push('lethal', raw, raw)
    return { raw, final: round2(Math.max(0, raw)), absorbed, breakdown }
  }

  let cur = raw

  // ① 护盾（LIFO；P2a 单层）
  if (!pierced.has('shield') && !input.dot) {
    const before = cur
    const used = Math.min(defender.pool('shield').current, cur)
    absorbed.shield = round2(used)
    cur -= used
    push('shield', before, cur)
  }

  // ② 护甲
  if (!pierced.has('armor') && !input.dot) {
    const before = cur
    const ratio = clamp(input.armorPierceRatio ?? 0, 0, 1)
    const effectiveArmor = defender.pool('armor').current * (1 - ratio)
    const used = Math.min(effectiveArmor, cur)
    absorbed.armor = round2(used)
    cur -= used
    push('armor', before, cur)
  }

  // ③ 抗性（DoT 也过这一段）
  if (!pierced.has('resist')) {
    const before = cur
    const r = clamp(defender.resistanceOf(element), RESIST_MIN, RESIST_MAX)
    cur *= 1 - r
    push('resistance', before, cur)
  }

  // ④ 防御（线性；DoT 旁路）
  if (!input.dot) {
    const before = cur
    cur -= defender.effectiveProfile.defense
    push('defense', before, cur)
  }

  // ⑤ 乘区（状态增减伤；同类先加后乘一次）
  if (!input.dot) {
    const before = cur
    const bucket = defender.damageTakenBucket + (attacker?.damageDealtBucket ?? 0)
    cur *= Math.max(0, 1 + bucket)
    push('multiplier', before, cur)
  }

  // ⑥ 下限钳制
  const before = cur
  cur = Math.max(input.minDamage ?? 0, cur)
  push('floor', before, cur)

  return { raw, final: round2(Math.max(0, cur)), absorbed, breakdown }
}

/** 应用伤害：先扣已被吸收的护盾/护甲，再扣生命。返回实际生命损失。 */
export function applyDamageResult(defender: CombatUnit, result: DamageResult): number {
  if (result.absorbed.shield > 0) defender.pool('shield').applyDelta(-result.absorbed.shield)
  if (result.absorbed.armor > 0) defender.pool('armor').applyDelta(-result.absorbed.armor)
  const hpBefore = defender.pool('hp').current
  defender.pool('hp').applyDelta(-result.final)
  return round2(hpBefore - defender.pool('hp').current)
}
