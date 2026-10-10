import { describe, expect, it } from 'vitest'
import { applyDamageResult, resolveDamage } from '../src/kernel/effect/damage-chain'
import { makeUnit } from './helpers/fixture'

function dmg(raw: number, over: Partial<Parameters<typeof resolveDamage>[0]> = {}): ReturnType<typeof resolveDamage> {
  const defender = makeUnit('d', 'B', { strength: 3 }) // hp 60
  return resolveDamage({ raw, element: 'physical', attacker: null, defender, ...over })
}

describe('伤害链', () => {
  it('无减伤时原样通过', () => {
    expect(dmg(10).final).toBe(10)
  })

  it('护盾先吸收（本层 LIFO）', () => {
    const defender = makeUnit('d', 'B', { strength: 3 })
    defender.pool('shield').applyDelta(4)
    const r = resolveDamage({ raw: 10, element: 'physical', attacker: null, defender })
    expect(r.absorbed.shield).toBe(4)
    expect(r.final).toBe(6)
  })

  it('护甲在护盾之后', () => {
    const defender = makeUnit('d', 'B', { strength: 3 })
    defender.pool('shield').applyDelta(3)
    defender.pool('armor').applyDelta(2)
    const r = resolveDamage({ raw: 10, element: 'physical', attacker: null, defender })
    expect(r.absorbed).toEqual({ shield: 3, armor: 2 })
    expect(r.final).toBe(5)
  })

  it('抗性为乘性', () => {
    const defender = makeUnit('d', 'B', { strength: 3 })
    defender.modifiers.set('resist:physical', 'test', 0.5)
    const r = resolveDamage({ raw: 10, element: 'physical', attacker: null, defender })
    expect(r.final).toBe(5)
  })

  it('防御为线性减法', () => {
    const defender = makeUnit('d', 'B', { strength: 3 })
    defender.modifiers.set('defense', 'test', 3)
    const r = resolveDamage({ raw: 10, element: 'physical', attacker: null, defender })
    expect(r.final).toBe(7)
  })

  it('lethal 跳过全部减伤', () => {
    const defender = makeUnit('d', 'B', { strength: 3 })
    defender.pool('shield').applyDelta(99)
    const r = resolveDamage({ raw: 10, element: 'physical', attacker: null, defender, lethal: true })
    expect(r.final).toBe(10)
    expect(r.absorbed.shield).toBe(0)
  })

  it('applyDamageResult 扣减护盾与生命', () => {
    const defender = makeUnit('d', 'B', { strength: 3 })
    defender.pool('shield').applyDelta(4)
    const lost = applyDamageResult(defender, dmg(10, { defender }))
    expect(lost).toBe(6)
    expect(defender.pool('shield').current).toBe(0)
    expect(defender.hp).toBe(54)
  })
})
