// 技能配装：把 8 槽（4 主动 + 4 被动）的合法性规则抽成纯函数，视图只做渲染与事件。
// 规则口径与 generateHeroes 一致：职业池（ClassDef.knownSkills）∩ 已解锁卡，且同侧不重复、不超槽位。
import { classSkills, type Hero } from './herogen'
import { availableCardSet, type Profile } from './progression'
import type { Catalog } from '../kernel/catalog/types'

export type SlotKind = 'active' | 'passive'

export interface SkillPool {
  active: string[]
  passive: string[]
}

/** 每英雄槽位上限：4 主动 + 4 被动 = 8（GENERATION_BRIEF §0/§1.5） */
export const SLOT_LIMIT: Record<SlotKind, number> = { active: 4, passive: 4 }

export const SLOT_LABEL: Record<SlotKind, string> = { active: '主动', passive: '被动' }

/** 该英雄可装备的卡池：职业已知卡 ∩ 已解锁卡，按主动/被动分区 */
export function skillPoolOf(catalog: Catalog, hero: Hero, profile: Profile): SkillPool {
  const unlocked = new Set(availableCardSet(profile, catalog))
  return classSkills(catalog, hero.classId, unlocked)
}

function idsOf(hero: Hero, kind: SlotKind): readonly string[] {
  return kind === 'active' ? hero.activeSkillIds : hero.passiveSkillIds
}

function withIds(hero: Hero, kind: SlotKind, ids: string[]): Hero {
  return kind === 'active' ? { ...hero, activeSkillIds: ids } : { ...hero, passiveSkillIds: ids }
}

/**
 * 装备技能：仅当该卡在本池内、未重复、且未超槽位时才追加到末尾。
 * 不满足则原样返回（引用不变，调用方可用 `===` 判断未生效）。
 */
export function equipSkill(hero: Hero, kind: SlotKind, cardId: string, pool: SkillPool): Hero {
  const ids = idsOf(hero, kind)
  if (!pool[kind].includes(cardId)) return hero
  if (ids.includes(cardId)) return hero
  if (ids.length >= SLOT_LIMIT[kind]) return hero
  return withIds(hero, kind, [...ids, cardId])
}

export function unequipSkill(hero: Hero, kind: SlotKind, index: number): Hero {
  const ids = idsOf(hero, kind)
  if (index < 0 || index >= ids.length) return hero
  return withIds(hero, kind, ids.filter((_, i) => i !== index))
}

/** 槽位调序：主动槽的次序就是内核的释放轮转次序（runtime.chooseBehavior），故需要它 */
export function moveSlot(hero: Hero, kind: SlotKind, from: number, to: number): Hero {
  const ids = [...idsOf(hero, kind)]
  if (from < 0 || from >= ids.length || to < 0 || to >= ids.length || from === to) return hero
  const [moved] = ids.splice(from, 1)
  ids.splice(to, 0, moved as string)
  return withIds(hero, kind, ids)
}
