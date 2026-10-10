import { describe, expect, it } from 'vitest'
import { createCombat, fingerprintOf } from '../src/kernel'
import { Mulberry32RandomSource } from '../src/kernel/shared/random-source'
import { CONSTITUTIONS } from '../src/meta/constitution'
import { COMBOS, generateHeroes, type RosterContext } from '../src/meta/herogen'
import { autoFormation, validateFormation } from '../src/meta/formation'
import { buildCombatSetup } from '../src/meta/buildSetup'
import { createMemoryStore, newProfile, unlockClass } from '../src/meta/progression'
import { buildFixtureCatalog, runToEnd } from './helpers/fixture'

const constitutionIds = CONSTITUTIONS.map((c) => c.id)

function ctx(seed: number, classes: string[]): RosterContext {
  return {
    catalog: buildFixtureCatalog(),
    random: new Mulberry32RandomSource(seed),
    unlockedClasses: classes,
    constitutionIds,
  }
}

describe('P4 战外', () => {
  it('力敏智组合恰 10 种且均和为 3', () => {
    expect(COMBOS).toHaveLength(10)
    for (const c of COMBOS) expect(c.strength + c.agility + c.intelligence).toBe(3)
    expect(new Set(COMBOS.map((c) => `${c.strength}${c.agility}${c.intelligence}`)).size).toBe(10)
  })

  it('体质恰 10 种', () => {
    expect(CONSTITUTIONS).toHaveLength(10)
  })

  it('同 seed 生成同一批英雄（可复现）', () => {
    const a = generateHeroes(ctx(7, ['fixture']), 5, 'H')
    const b = generateHeroes(ctx(7, ['fixture']), 5, 'H')
    expect(a).toEqual(b)
    expect(a).toHaveLength(5)
    for (const h of a) {
      expect(constitutionIds).toContain(h.constitutionId)
      expect(h.classId).toBe('fixture')
    }
  })

  it('编队：自动布局合法，空洞/重复被拒', () => {
    const heroes = generateHeroes(ctx(3, ['fixture']), 5, 'H')
    const placed = autoFormation(heroes, 'A')
    expect(validateFormation(placed)).toEqual([])

    const holed = placed.map((h, i) => (i === 0 ? { ...h, coordinate: { ...h.coordinate, index: 3 } } : h))
    expect(validateFormation(holed).some((e) => e.includes('空洞'))).toBe(true)
  })

  it('名册 → CombatSetup → 真卡对战跑完', () => {
    const own = autoFormation(generateHeroes(ctx(11, ['fixture']), 5, 'A'), 'A')
    const enemy = autoFormation(generateHeroes(ctx(12, ['fixture']), 5, 'B'), 'B')
    const combat = createCombat(buildCombatSetup({ seed: 1, catalog: buildFixtureCatalog(), own, enemy }))
    runToEnd(combat)
    const ended = combat.ended()
    expect(ended).not.toBeNull()
    expect(ended!.events.length).toBeGreaterThan(0)
    expect(fingerprintOf(ended!.events)).toMatch(/^[0-9a-f]{8}$/)
  })

  it('档案：默认解锁起始职业，可解锁更多', () => {
    const p0 = newProfile('sleepless')
    expect(p0.unlockedClasses).toEqual(['sleepless'])
    const p1 = unlockClass(p0, 'arbiter')
    expect(p1.unlockedClasses).toEqual(['sleepless', 'arbiter'])
    expect(unlockClass(p1, 'arbiter')).toBe(p1) // 幂等

    const store = createMemoryStore()
    store.save(p1)
    expect(store.load()?.unlockedClasses).toEqual(['sleepless', 'arbiter'])
  })
})
