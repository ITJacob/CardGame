// 名册 → CombatSetup：把「英雄（力敏智 × 体质 × 职业 × 技能）」映射成内核入场契约。
import type { Catalog } from '../kernel/catalog/types'
import type { CombatSetup, FactionSetup, UnitSetup } from '../kernel/combat/types'
import { constitutionById } from './constitution'
import type { PlacedHero } from './formation'

export interface BuildSetupOptions {
  seed: number
  catalog: Catalog
  own: readonly PlacedHero[]
  enemy: readonly PlacedHero[]
  ownFaction?: string
  enemyFaction?: string
  /** 起始 clock 基准（塔层/Boss 决定；缺省 0） */
  clockBase?: number
}

export function heroToUnitSetup(hero: PlacedHero): UnitSetup {
  const con = constitutionById(hero.constitutionId)
  return {
    unitId: hero.id,
    coordinate: hero.coordinate,
    attributeSet: {
      strength: hero.combo.strength,
      agility: hero.combo.agility,
      intelligence: hero.combo.intelligence,
      rank: 0,
    },
    gender: 'male',
    anchor: 0,
    activeSlots: hero.activeSkillIds.map((skillDefId) => ({ skillDefId })),
    passiveSlots: hero.passiveSkillIds.map((defId) => ({ defId })),
    initialModifiers: con ? con.modifiers.map((m) => ({ ...m })) : [],
    initialStatuses: [],
  }
}

export function buildCombatSetup(opts: BuildSetupOptions): CombatSetup {
  const ownFaction = opts.ownFaction ?? 'A'
  const enemyFaction = opts.enemyFaction ?? 'B'
  const faction = (id: string, name: string, heroes: readonly PlacedHero[]): FactionSetup => ({
    id,
    name,
    units: heroes.map((h) => heroToUnitSetup({ ...h, coordinate: { ...h.coordinate, faction: id } })),
  })
  return {
    seed: opts.seed,
    catalog: opts.catalog,
    board: { clock: { base: opts.clockBase ?? 0 }, domainGrants: [] },
    factions: [faction(ownFaction, '我方', opts.own), faction(enemyFaction, '敌方', opts.enemy)],
    inputs: { decisions: new Map() },
  }
}
