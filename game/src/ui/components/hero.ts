// 英雄行：名册预览 / 在线大厅 / 整备页共用的展示块（原先在 newgame、online 各写了一份）。
import { escapeHtml } from './chrome'
import { avatarEmoji, cardFaceHtml } from './cardFace'
import type { Attributes3, Hero } from '../../meta/herogen'
import type { SlotKind } from '../../meta/loadout'
import type { Coordinate } from '../../kernel/battle/types'
import type { Catalog } from '../../kernel/catalog/types'

export type HeroLike = Hero & { coordinate?: Coordinate }

/**
 * 立绘路径。key 口径 = herogen.ts 的 COMBOS（s 0..3, a 0..3-s, i 3-s-a）× 性别，
 * 正好 10 组 × 2 = 20 张，与 site/assets/heroes/PROMPTS.md 的清单一一对应。
 * 与 cardArtUrl 同为 ./site/… 相对路径（dev 由 Vite 中间件把仓库 site/ 挂到根路径，
 * prod 由部署把 site/ 铺在与游戏同层）。
 */
export function heroArtUrl(combo: Attributes3, gender: 'male' | 'female'): string {
  return `./site/assets/heroes/hero_s${combo.strength}a${combo.agility}i${combo.intelligence}_${gender}.png`
}

/**
 * 立绘块（两层）：emoji 垫底、<img data-hero-art> 盖上。加载失败由 hydrateHeroArt 摘掉 img
 * 露回 emoji——20 张齐全时这层看不见，缺图时也不会留个白框。
 * 名册卡与整备页小图共用这一层，尺寸一律由外层容器给（.hero-card / .tile .avatar / .chip-avatar）。
 *
 * 故意不加 loading="lazy"：dev 中间件对缺文件会 next() 落到 Vite 的 SPA fallback，
 * 回一张 200 的 HTML；而 lazy 图遇到这种响应既不派发 load 也不派发 error，降级链就废了
 * （技能卡图那边已有同样的记录）。英雄每页最多 5 张，直出没有代价。
 */
export function heroPortraitHtml(hero: HeroLike): string {
  const emoji = avatarEmoji(hero.constitutionId, hero.gender)
  return `<span class="hero-portrait">
    <span class="hero-portrait__emoji" aria-hidden="true">${emoji}</span>
    <img class="hero-portrait__img" src="${heroArtUrl(hero.combo, hero.gender)}" alt="" data-hero-art>
  </span>`
}

/** 名册行：英雄卡（竖版立绘 + 名条）+ 技能卡面（kind 决定看主动还是被动） */
export function heroRowHtml(hero: HeroLike, catalog: Catalog, kind: SlotKind = 'active'): string {
  const ids = kind === 'active' ? hero.activeSkillIds : hero.passiveSkillIds
  const cards = ids
    .map((id) => {
      const def = catalog.skillDefs.get(id)
      const tpl = catalog.behaviorTemplates.get(id)
      return cardFaceHtml({
        cardId: id,
        name: def?.name ?? tpl?.name ?? id,
        rarity: def?.rarity ?? tpl?.rarity,
        pathwayId: def?.pathwayId ?? tpl?.pathwayId,
        kind,
        cost: def?.cost?.energy,
        size: 'compact',
      })
    })
    .join('')
  const combo = `${hero.combo.strength}力 / ${hero.combo.agility}敏 / ${hero.combo.intelligence}智`
  const coord = hero.coordinate ? ` · ${escapeHtml(hero.coordinate.lane)}#${hero.coordinate.index}` : ''
  // 名条分两行写死断点（职业·体质 / 力敏智·站位），卡宽 120 时各自刚好一行，
  // 交给浏览器自动折行会在「力敏智」中间断开
  const sub1 = `${escapeHtml(hero.classId)} · ${escapeHtml(hero.constitutionId)}`
  // 行外壳 = kit 的区域框 .cg-panel（横排变体 .cg-panel--row 在 kit-bridge 里定义）；
  // 英雄块 = 游戏独有的 .hero-card（竖版卡，与 .card-face / .tile 同类视觉）
  return `<div class="cg-panel cg-panel--row hero-row">
    <figure class="hero-card">
      ${heroPortraitHtml(hero)}
      <figcaption class="hero-card__plate">
        <b>${escapeHtml(hero.name)}</b>
        <small>${sub1}</small>
        <small>${combo}${coord}</small>
      </figcaption>
    </figure>
    <div class="hero-cards">${cards || '<span class="cards-none">—</span>'}</div>
  </div>`
}

/** 立绘失败 → 摘掉 img，露出垫底的 emoji（降级链同 cardFace 的 .no-art，只是不挂在 .card-face 上） */
export function hydrateHeroArt(root: HTMLElement): void {
  root.querySelectorAll<HTMLImageElement>('img[data-hero-art]').forEach((img) => {
    const fail = (): void => {
      img.hidden = true
    }
    if (img.complete && img.naturalWidth === 0) fail()
    img.addEventListener('error', fail, { once: true })
  })
}
