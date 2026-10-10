import { describe, expect, it } from 'vitest'
import type { StatusDef } from '../src/kernel/catalog/types'
import {
  handleDispel, handleDrain, handleModifyStatus, handleReveal, handleTransferStatus,
} from '../src/kernel/effect/handlers2'
import { resolveDamage } from '../src/kernel/effect/damage-chain'
import { registryOf, stubContext } from './helpers/context'
import { makeUnit } from './helpers/fixture'

const BUFF: StatusDef = { id: 'buff_a', category: ['buff'], dispelable: true, duration: 5, maxStacks: 1 }
const CONCEAL: StatusDef = { id: 'veil', category: ['conceal'], dispelable: true, duration: 5, maxStacks: 1 }

describe('P2b-1 原语', () => {
  it('dispel 按类别移除状态', () => {
    const u = makeUnit('t', 'B')
    u.statuses.mount('buff_a', { duration: 5, sourceId: 's1' })
    const ctx = stubContext(registryOf(u), null, [BUFF])
    handleDispel({ type: 'dispel', category: ['buff'], count: 1 }, u, ctx)
    expect(u.statuses.has('buff_a')).toBe(false)
  })

  it('drain 抽血并回补施法者', () => {
    const caster = makeUnit('c', 'A')
    const target = makeUnit('t', 'B', { strength: 3 }) // hp 60
    target.pool('hp').applyDelta(-20) // 40
    const ctx = stubContext(registryOf(caster, target), caster, [])
    handleDrain({ type: 'drain', resource: 'hp', ratio: 0.5, healRatio: 1 }, target, ctx)
    expect(target.hp).toBe(20)
    expect(caster.hp).toBeGreaterThan(30) // 被治疗
  })

  it('modify_status 延长时限', () => {
    const u = makeUnit('t', 'B')
    u.statuses.mount('buff_a', { duration: 3, sourceId: 's1' })
    const ctx = stubContext(registryOf(u), null, [BUFF])
    handleModifyStatus({ type: 'modify_status', statusId: 'buff_a', addDuration: 2 } as never, u, ctx)
    expect(u.statuses.byDef('buff_a')[0]!.remaining).toBe(5)
  })

  it('transfer_status 复制到目标', () => {
    const src = makeUnit('s', 'A')
    const dst = makeUnit('d', 'B')
    src.statuses.mount('buff_a', { duration: 4, sourceId: 's1' })
    const ctx = stubContext(registryOf(src, dst), src, [BUFF])
    handleTransferStatus({ type: 'transfer_status', to: 'd', mode: 'copy' } as never, src, ctx)
    expect(dst.statuses.has('buff_a')).toBe(true)
    expect(src.statuses.has('buff_a')).toBe(true) // copy 保留源
  })

  it('reveal 移除隐匿类状态', () => {
    const u = makeUnit('t', 'B')
    u.statuses.mount('veil', { duration: 5, sourceId: 's1' })
    const ctx = stubContext(registryOf(u), null, [CONCEAL])
    handleReveal({ type: 'reveal' } as never, u, ctx)
    expect(u.statuses.has('veil')).toBe(false)
  })

  it('状态修饰袋驱动伤害链⑤段（脆弱 → 受伤 ×1.2）', () => {
    const frail: StatusDef = {
      id: 'frail', category: ['debuff'], dispelable: true, duration: 5, maxStacks: 1,
      modifiers: { damage_taken_mul: 1.2 },
    }
    const u = makeUnit('t', 'B', { strength: 3 }, [frail])
    u.statuses.mount('frail', { duration: 5, sourceId: 's1' })
    expect(u.damageTakenBucket).toBeCloseTo(0.2, 6)
    const r = resolveDamage({ raw: 10, element: 'physical', attacker: null, defender: u })
    expect(r.final).toBe(12)
  })
})
