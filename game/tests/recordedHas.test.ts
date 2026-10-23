// recorded_has 条件：状态实例 grant.params 键存在判定（H33 slots 存在性读法；阅读者「已读」三维兑现门）。
import { describe, expect, it } from 'vitest'
import type { StatusDef } from '../src/kernel/catalog/types'
import { evaluateCondition, type ConditionContext } from '../src/kernel/shared/effect-condition'
import { Mulberry32RandomSource, RandomUsageRegistry } from '../src/kernel/shared/random-source'
import { makeUnit } from './helpers/fixture'

const READ: StatusDef = {
  id: 'read', name: '已读', category: ['debuff'], dispelable: true, duration: 25,
}

const ctxOf = (caster: ReturnType<typeof makeUnit>): ConditionContext => ({
  random: new Mulberry32RandomSource(1),
  registry: new RandomUsageRegistry(),
  warn: () => {},
  phase: 'day',
  caster,
})

describe('recorded_has 条件', () => {
  it('grant.params 含维度键才成立；未挂载或缺键不成立', () => {
    const u = makeUnit('u', 'A', {}, [READ])
    const ctx = ctxOf(u)
    const cond = { kind: 'recorded_has' as const, side: 'self' as const, statusId: 'read', id: 'd_energy' }
    expect(evaluateCondition(cond, null, ctx)).toBe(false)
    u.statuses.mount('read', { sourceId: 's1' })
    expect(evaluateCondition(cond, null, ctx)).toBe(false)
    u.statuses.mount('read', { sourceId: 's2', params: { d_energy: 1 } })
    expect(evaluateCondition(cond, null, ctx)).toBe(true)
    expect(evaluateCondition({ ...cond, id: 'd_skill' }, null, ctx)).toBe(false)
  })

  it('side 缺省读 target', () => {
    const caster = makeUnit('c', 'A', {}, [READ])
    const target = makeUnit('t', 'B', {}, [READ])
    target.statuses.mount('read', { sourceId: 's1', params: { d_tempo: 1 } })
    const cond = { kind: 'recorded_has' as const, statusId: 'read', id: 'd_tempo' }
    expect(evaluateCondition(cond, target, ctxOf(caster))).toBe(true)
    expect(evaluateCondition(cond, caster, ctxOf(caster))).toBe(false)
  })
})
