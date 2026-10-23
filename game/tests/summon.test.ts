// 召唤物谓词：spawn 记录蓝本身份，caster_has_summon 按 tag/unitId 过滤，target_is_summoned 分道。
import { describe, expect, it } from 'vitest'
import { createCombat } from '../src/kernel'
import { evaluateCondition, type ConditionContext, type ConditionUnit } from '../src/kernel/shared/effect-condition'
import { Mulberry32RandomSource, RandomUsageRegistry } from '../src/kernel/shared/random-source'
import { buildAiVsAiSetup, makeUnit } from './helpers/fixture'

type Probe = ReturnType<typeof makeUnit>

function asSummon(u: Probe, unitDefId: string, unitType: string, summonerId: string): Probe {
  u.unitDefId = unitDefId
  u.unitType = unitType
  u.summonerId = summonerId
  return u
}

function ctxOf(caster: Probe, units: readonly ConditionUnit[]): ConditionContext {
  return {
    random: new Mulberry32RandomSource(1),
    registry: new RandomUsageRegistry(),
    warn: () => {},
    phase: 'day',
    caster,
    allUnits: () => units,
  }
}

describe('spawn 记录蓝本身份', () => {
  it('召唤物带 unitDefId / unitType / summonerId，普通单位为 null', () => {
    const c = createCombat(buildAiVsAiSetup({ skills: ['fix_summon'], unitsPerSide: 1 }))
    for (let i = 0; i < 8 && !c.ended(); i += 1) c.step()
    const units = c.state().units
    const owner = units.find((u) => u.id === 'A_u0')!
    const summon = units.find((u) => u.summonerId === 'A_u0')!
    expect(summon.unitDefId).toBe('fix_skeleton')
    expect(summon.unitType).toBe('UNDEAD')
    expect(owner.unitDefId).toBeNull()
    expect(owner.summonerId).toBeNull()
  })
})

describe('召唤物谓词', () => {
  it('caster_has_summon 按 tag 过滤', () => {
    const caster = makeUnit('c', 'A')
    const tagged = asSummon(makeUnit('s1', 'A'), 'unit_beast', 'BEAST', 'c')
    const other = asSummon(makeUnit('s2', 'A'), 'unit_skeleton', 'UNDEAD', 'c')
    Object.defineProperty(tagged, 'tags', { value: ['beast'] })
    const ctx = ctxOf(caster, [caster, tagged, other])
    expect(evaluateCondition({ kind: 'caster_has_summon' }, null, ctx)).toBe(true)
    expect(evaluateCondition({ kind: 'caster_has_summon', tag: 'beast' }, null, ctx)).toBe(true)
    expect(evaluateCondition({ kind: 'caster_has_summon', tag: 'undead' }, null, ctx)).toBe(false)
  })

  it('caster_has_summon 按 unitId 过滤（字符串 / 数组）', () => {
    const caster = makeUnit('c', 'A')
    const s1 = asSummon(makeUnit('s1', 'A'), 'unit_beast', 'BEAST', 'c')
    const s2 = asSummon(makeUnit('s2', 'A'), 'unit_skeleton', 'UNDEAD', 'c')
    const ctx = ctxOf(caster, [caster, s1, s2])
    expect(evaluateCondition({ kind: 'caster_has_summon', unitId: 'unit_beast' }, null, ctx)).toBe(true)
    expect(evaluateCondition({ kind: 'caster_has_summon', unitId: ['unit_ghoul', 'unit_skeleton'] }, null, ctx)).toBe(true)
    expect(evaluateCondition({ kind: 'caster_has_summon', unitId: 'unit_ghoul' }, null, ctx)).toBe(false)
  })

  it('caster_has_summon 只认自己的召唤物', () => {
    const caster = makeUnit('c', 'A')
    const enemySummon = asSummon(makeUnit('e1', 'B'), 'unit_beast', 'BEAST', 'enemy')
    const ctx = ctxOf(caster, [caster, enemySummon])
    expect(evaluateCondition({ kind: 'caster_has_summon' }, null, ctx)).toBe(false)
  })

  it('target_is_summoned 按召唤者身份分道', () => {
    const caster = makeUnit('c', 'A')
    const hero = makeUnit('t1', 'B')
    const summon = asSummon(makeUnit('t2', 'B'), 'unit_skeleton', 'UNDEAD', 'enemy')
    const ctx = ctxOf(caster, [caster, hero, summon])
    expect(evaluateCondition({ kind: 'target_is_summoned' }, hero, ctx)).toBe(false)
    expect(evaluateCondition({ kind: 'target_is_summoned' }, summon, ctx)).toBe(true)
    expect(evaluateCondition({ kind: 'target_is_summoned' }, null, ctx)).toBe(false)
  })
})
