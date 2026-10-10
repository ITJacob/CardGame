// 名册生成：把「构造 RosterContext → 抽英雄 → 自动编队」收敛成一处，供出战流程与重新生成复用。
import { CONSTITUTIONS } from './constitution'
import { generateHeroes, type RosterContext } from './herogen'
import { autoFormation, type PlacedHero } from './formation'
import { availableCardSet, type Profile } from './progression'
import { Mulberry32RandomSource } from '../kernel/shared/random-source'
import type { Catalog } from '../kernel/catalog/types'

const constitutionIds = CONSTITUTIONS.map((c) => c.id)

/** 本会话的下一个随机种子（战斗/名册共用；不作为战斗内随机源） */
export function randomSeed(): number {
  return (Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0
}

export function buildRosterContext(catalog: Catalog, profile: Profile, seed: number): RosterContext {
  return {
    catalog,
    random: new Mulberry32RandomSource(seed),
    unlockedClasses: profile.unlockedClasses,
    unlockedCards: [...availableCardSet(profile, catalog)],
    constitutionIds,
  }
}

/** 生成一队（默认 5 人）并自动编队到给定阵营。同 seed + 同解锁集 → 同一批英雄。 */
export function generateRoster(
  catalog: Catalog,
  profile: Profile,
  seed: number,
  faction: string,
  idPrefix: string,
  count = 5,
): PlacedHero[] {
  return autoFormation(generateHeroes(buildRosterContext(catalog, profile, seed), count, idPrefix), faction)
}
