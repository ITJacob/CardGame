// 英雄生成：力敏智 3 点组合（10 种）× 体质（10 种）× 职业（已解锁）→ 技能槽。
// 纯函数 + 可播种 RNG：同 seed + 同解锁集 → 同一批英雄（可复现，与战斗内核一致）。
import type { RandomSource } from '../kernel/shared/random-source'
import type { Catalog } from '../kernel/catalog/types'

export interface Attributes3 {
  strength: number
  agility: number
  intelligence: number
}

export interface Hero {
  id: string
  name: string
  gender: 'male' | 'female'
  combo: Attributes3
  constitutionId: string
  classId: string
  activeSkillIds: string[]
  passiveSkillIds: string[]
}

/** 力/敏/智 各 ≥0、和为 3 —— 恰 10 种组合 */
export const COMBOS: readonly Attributes3[] = (() => {
  const out: Attributes3[] = []
  for (let s = 0; s <= 3; s += 1) {
    for (let a = 0; a <= 3 - s; a += 1) {
      out.push({ strength: s, agility: a, intelligence: 3 - s - a })
    }
  }
  return out // 10 组
})()

export interface RosterContext {
  catalog: Catalog
  random: RandomSource
  unlockedClasses: readonly string[]
  /** 已解锁卡牌 id；缺省 = 全部已解锁 */
  unlockedCards?: readonly string[]
  constitutionIds: readonly string[]
  activeSlots?: number
  passiveSlots?: number
}

/** 职业技能池：职业已知卡按 active/passive 拆分，可选按「已解锁」过滤（整备卡池同一口径）。 */
export function classSkills(catalog: Catalog, classId: string, unlocked?: ReadonlySet<string>): { active: string[]; passive: string[] } {
  const known = catalog.classDefs.get(classId)?.knownSkills ?? []
  const active: string[] = []
  const passive: string[] = []
  for (const id of known) {
    if (unlocked && !unlocked.has(id)) continue
    if (catalog.skillDefs.has(id)) active.push(id)
    else if (catalog.behaviorTemplates.has(id)) passive.push(id)
  }
  return { active, passive }
}

/** 确定性取样：从数组均匀取 n 个（保序，不重复） */
export function sample<T>(arr: readonly T[], n: number, random: RandomSource): T[] {
  if (arr.length <= n) return [...arr]
  const pool = [...arr]
  const out: T[] = []
  for (let i = 0; i < n; i += 1) {
    const idx = random.int(pool.length)
    out.push(pool.splice(idx, 1)[0] as T)
  }
  return out
}

/** 一张立绘的脸 = 属性三项 + 性别（hero.ts 的 heroArtUrl 就按这两样取图），共 10 × 2 = 20 张 */
export interface HeroFace {
  combo: Attributes3
  gender: 'male' | 'female'
}

export const FACES: readonly HeroFace[] = COMBOS.flatMap((combo) => [
  { combo, gender: 'male' as const },
  { combo, gender: 'female' as const },
])

/**
 * 取 count 张互不重复的脸 —— 同一批英雄里出现两张同脸就会有两张一模一样的立绘。
 * 名册最多 5 人、池子 20 张，正常构造取不满；真取满时超出的部分退回独立随机，
 * 宁可重复也不短出英雄（sample 在 arr.length <= n 时原样返回，这里得自己补齐）。
 */
export function sampleFaces(count: number, random: RandomSource): HeroFace[] {
  const picked = sample(FACES, count, random)
  while (picked.length < count) {
    picked.push({
      combo: COMBOS[random.int(COMBOS.length)] as Attributes3,
      gender: random.int(2) === 0 ? 'male' : 'female',
    })
  }
  return picked
}

export function generateHeroes(ctx: RosterContext, count = 5, idPrefix = 'hero'): Hero[] {
  const unlocked = ctx.unlockedCards ? new Set(ctx.unlockedCards) : undefined
  const activeSlots = ctx.activeSlots ?? 4
  const passiveSlots = ctx.passiveSlots ?? 4
  const classes = ctx.unlockedClasses.length > 0 ? ctx.unlockedClasses : [...ctx.catalog.classDefs.keys()]
  const heroes: Hero[] = []

  const faces = sampleFaces(count, ctx.random)

  for (let i = 0; i < count; i += 1) {
    const face = faces[i] as HeroFace
    const constitutionId = ctx.constitutionIds[ctx.random.int(ctx.constitutionIds.length)] as string
    const classId = classes[ctx.random.int(classes.length)] as string
    const skills = classSkills(ctx.catalog, classId, unlocked)
    heroes.push({
      id: `${idPrefix}_${i + 1}`,
      name: `${classId}_${i + 1}`,
      gender: face.gender,
      combo: face.combo,
      constitutionId,
      classId,
      activeSkillIds: sample(skills.active, activeSlots, ctx.random),
      passiveSkillIds: sample(skills.passive, passiveSlots, ctx.random),
    })
  }
  return heroes
}
