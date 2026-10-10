import { describe, expect, it } from 'vitest'
import { createCombat, fingerprintOf } from '../src/kernel'
import { Mulberry32RandomSource } from '../src/kernel/shared/random-source'
import { CONSTITUTIONS } from '../src/meta/constitution'
import { COMBOS, generateHeroes, type Hero, type RosterContext } from '../src/meta/herogen'
import { autoFormation, fromLaneLists, moveHeroTo, swapHeroes, toLaneLists, validateFormation } from '../src/meta/formation'
import { equipSkill, moveSlot, skillPoolOf, unequipSkill } from '../src/meta/loadout'
import { buildCombatSetup } from '../src/meta/buildSetup'
import { availableCardSet, createMemoryStore, newProfile, toggleCardUnlock, toggleClassUnlock, unlockClass } from '../src/meta/progression'
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

  it('卡池解锁：职业闸 + 卡牌闸（首次改动物化为显式白名单）', () => {
    const catalog = buildFixtureCatalog()
    let p = newProfile('fixture')
    const all = availableCardSet(p, catalog)
    expect(all.size).toBeGreaterThan(0)

    const one = [...all][0] as string
    p = toggleCardUnlock(p, catalog, one)
    expect(p.unlockedCards).toHaveLength(all.size - 1)
    expect(availableCardSet(p, catalog).has(one)).toBe(false)

    p = toggleCardUnlock(p, catalog, one)
    expect(availableCardSet(p, catalog).has(one)).toBe(true)

    // 锁掉整个职业 → 该职业卡全部不可用
    p = toggleClassUnlock(p, catalog, 'fixture')
    expect(p.unlockedClasses).toEqual([])
    expect(availableCardSet(p, catalog).size).toBe(0)
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

describe('整备：阵型有序表', () => {
  it('toLaneLists（按 index 升序）与 fromLaneLists 互逆且前缀紧凑', () => {
    const placed = autoFormation(generateHeroes(ctx(5, ['fixture']), 5, 'H'), 'A')
    const lists = toLaneLists(placed)
    expect(lists).toHaveLength(2)
    expect(lists[0]!.map((h) => h.id)).toEqual(['H_1', 'H_2', 'H_3', 'H_4'])
    expect(lists[1]!.map((h) => h.id)).toEqual(['H_5'])

    const back = fromLaneLists(lists, 'A')
    expect(validateFormation(back)).toEqual([])
    expect(back.map((h) => `${h.coordinate.lane}#${h.coordinate.index}:${h.id}`).sort()).toEqual(
      placed.map((h) => `${h.coordinate.lane}#${h.coordinate.index}:${h.id}`).sort(),
    )
  })

  it('swapHeroes：交换两英雄格位后仍前缀紧凑（摆位编辑的核心不变量）', () => {
    const placed = autoFormation(generateHeroes(ctx(6, ['fixture']), 5, 'H'), 'A')
    const next = swapHeroes(placed, 'H_1', 'H_5')
    expect(validateFormation(next)).toEqual([])
    expect(next.find((h) => h.id === 'H_1')?.coordinate).toEqual({ faction: 'A', lane: 'lane1', index: 0 })
    expect(next.find((h) => h.id === 'H_5')?.coordinate).toEqual({ faction: 'A', lane: 'lane0', index: 0 })
    // 越界/自身：原样返回（引用不变，视图据此判断「未生效」）
    expect(swapHeroes(placed, 'H_1', 'H_1')).toBe(placed)
    expect(swapHeroes(placed, 'H_1', '不存在')).toBe(placed)
  })

  it('moveHeroTo：跨路移入落到队尾，同路即路内重排，路满则拒绝', () => {
    const placed = autoFormation(generateHeroes(ctx(7, ['fixture']), 5, 'H'), 'A')
    // lane1 只有 1 人，任何空格下标都夹到队尾（前缀紧凑 ⇒ 空洞只可能在队尾）
    const moved = moveHeroTo(placed, 'H_1', 'lane1', 3)
    expect(validateFormation(moved)).toEqual([])
    expect(moved).toHaveLength(5)
    expect(moved.find((h) => h.id === 'H_1')?.coordinate).toEqual({ faction: 'A', lane: 'lane1', index: 1 })
    expect(moved.find((h) => h.id === 'H_5')?.coordinate).toEqual({ faction: 'A', lane: 'lane1', index: 0 })
    // 同路拖到末位 = 路内重排，人数与格位集合都不变
    const reordered = moveHeroTo(placed, 'H_1', 'lane0', 3)
    expect(validateFormation(reordered)).toEqual([])
    expect(reordered.find((h) => h.id === 'H_1')?.coordinate).toEqual({ faction: 'A', lane: 'lane0', index: 3 })
    // 跨路搬进已满的路会把别人挤掉 → 拒绝，原样返回
    expect(moveHeroTo(placed, 'H_5', 'lane0', 0)).toBe(placed)
    expect(moveHeroTo(placed, '不存在', 'lane1', 0)).toBe(placed)
  })
})

describe('整备：技能槽', () => {
  const catalog = buildFixtureCatalog()
  const profile = newProfile('fixture')
  const base: Hero = {
    id: 'h1',
    name: 'h1',
    gender: 'male',
    combo: { strength: 1, agility: 1, intelligence: 1 },
    constitutionId: 'robust',
    classId: 'fixture',
    activeSkillIds: [],
    passiveSkillIds: [],
  }

  it('卡池 = 职业已知卡 ∩ 已解锁，按主动/被动分区', () => {
    const pool = skillPoolOf(catalog, base, profile)
    const known = new Set(catalog.classDefs.get('fixture')!.knownSkills)
    for (const id of pool.active) {
      expect(known.has(id)).toBe(true)
      expect(catalog.skillDefs.has(id)).toBe(true)
    }
    for (const id of pool.passive) {
      expect(known.has(id)).toBe(true)
      expect(catalog.behaviorTemplates.has(id)).toBe(true)
    }
  })

  it('装备受「池内 / 不重复 / 不超 4 槽」约束，卸下与调序保持不变量', () => {
    const pool = skillPoolOf(catalog, base, profile)
    const ids = pool.active
    expect(ids.length).toBeGreaterThanOrEqual(5)
    const [a, b, c, d, e] = [ids[0]!, ids[1]!, ids[2]!, ids[3]!, ids[4]!]

    let h = base
    for (const id of [a, b, c, d]) h = equipSkill(h, 'active', id, pool)
    expect(h.activeSkillIds).toEqual([a, b, c, d])

    expect(equipSkill(h, 'active', a, pool)).toBe(h) // 重复
    expect(equipSkill(h, 'active', e, pool)).toBe(h) // 满槽
    expect(equipSkill(h, 'active', 'not_a_card', pool)).toBe(h) // 池外
    expect(h.activeSkillIds).toHaveLength(4)

    expect(moveSlot(h, 'active', 0, 3).activeSkillIds).toEqual([b, c, d, a])
    expect(unequipSkill(moveSlot(h, 'active', 0, 3), 'active', 1).activeSkillIds).toEqual([b, d, a])

    expect(unequipSkill(h, 'active', 9)).toBe(h) // 越界
    expect(moveSlot(h, 'active', 0, 9)).toBe(h)
    expect(moveSlot(h, 'active', 2, 2)).toBe(h)
  })
})
