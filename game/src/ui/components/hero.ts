// 英雄行：名册预览 / 在线大厅 / 整备页共用的展示块（原先在 newgame、online 各写了一份）。
import { escapeHtml } from './chrome'
import { avatarEmoji, cardFaceHtml } from './cardFace'
import type { Hero } from '../../meta/herogen'
import type { Coordinate } from '../../kernel/battle/types'
import type { Catalog } from '../../kernel/catalog/types'

export type HeroLike = Hero & { coordinate?: Coordinate }

/** 名册行：头像 + 名/职业/体质/力敏智（+ 站位）+ 主动技能卡面 */
export function heroRowHtml(hero: HeroLike, catalog: Catalog): string {
  const cards = hero.activeSkillIds
    .map((id) => cardFaceHtml({ cardId: id, name: catalog.skillDefs.get(id)?.name ?? id, rarity: catalog.skillDefs.get(id)?.rarity, compact: true }))
    .join('')
  const combo = `${hero.combo.strength}力 / ${hero.combo.agility}敏 / ${hero.combo.intelligence}智`
  const coord = hero.coordinate ? ` · ${escapeHtml(hero.coordinate.lane)}#${hero.coordinate.index}` : ''
  return `<div class="hero-row">
    <span class="hero-avatar">${avatarEmoji(hero.constitutionId, hero.gender)}</span>
    <span class="hero-info">
      <b>${escapeHtml(hero.name)}</b>
      <small>${escapeHtml(hero.classId)} · ${escapeHtml(hero.constitutionId)} · ${combo}${coord}</small>
    </span>
    <div class="hero-cards">${cards}</div>
  </div>`
}
