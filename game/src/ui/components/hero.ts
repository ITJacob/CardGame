// 英雄展示：名册预览（新游戏 / 在线大厅）与整备页小图共用的展示块。
import { escapeHtml } from './chrome'
import { avatarEmoji, cardFaceHtml } from './cardFace'
import { icon } from './icons'
import { orientationOf, type Orientation } from '../battle/projection'
import { SLOT_LABEL, type SlotKind } from '../../meta/loadout'
import type { Attributes3, Hero } from '../../meta/herogen'
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
 * 尺寸一律由外层容器给（.hs-art / .hs-thumb / .tile .avatar / .chip-avatar），这里只管外观。
 *
 * 故意不加 loading="lazy"：dev 中间件对缺文件会 next() 落到 Vite 的 SPA fallback，
 * 回一张 200 的 HTML；而 lazy 图遇到这种响应既不派发 load 也不派发 error，降级链就废了
 * （技能卡图那边已有同样的记录）。英雄每页最多 5 张，直出没有代价。
 *
 * @param overlay 叠在图上的东西（展示台的左右箭头）。放在这一层里是为了让它们相对
 *                「立绘框」定位，而不是相对格子——立绘比格子小或被居中时箭头才不会飘开。
 */
export function heroPortraitHtml(hero: HeroLike, overlay = ''): string {
  const emoji = avatarEmoji(hero.constitutionId, hero.gender)
  return `<span class="hero-portrait">
    <span class="hero-portrait__emoji" aria-hidden="true">${emoji}</span>
    <img class="hero-portrait__img" src="${heroArtUrl(hero.combo, hero.gender)}" alt="" data-hero-art>
    ${overlay}
  </span>`
}

/* ============================================================================
 * 一屏一英雄的展示台（#/new 与 #/online 共用）
 *
 * 布局交给 CSS：`data-orient` 一套 grid-template-areas 管两个朝向，DOM 不分叉。
 * 高度的约束在 `.viewport-page`（一屏、不整页滚动），本组件的 `flex: 1` 正好吃掉剩余。
 * ========================================================================== */

export interface ShowcaseOpts {
  /** 当前展示第几个英雄（越界自动夹回合法范围） */
  index: number
  /** 右侧技能缩略图看主动还是被动 */
  kind: SlotKind
  orient: Orientation
  /** 动作区（各屏自己的按钮/状态行），直接落进 grid 的 foot 区 */
  foot: string
}

export function heroShowcaseHtml(heroes: HeroLike[], catalog: Catalog, opts: ShowcaseOpts): string {
  const n = heroes.length
  const i = n === 0 ? 0 : Math.min(Math.max(opts.index, 0), n - 1)
  const hero = heroes[i]
  const main = hero
    ? showcaseArtHtml(hero, i, n) + showcaseSideHtml(hero, catalog, opts.kind)
    : '<p class="hint hs-empty">名册为空</p>'
  // 缩略图条 =「小图标切换」；只有一名英雄时整条收掉（没有可切的）
  const thumbs = heroes.map((h, k) => thumbHtml(h, k, k === i)).join('')
  return `<section class="hero-showcase" data-orient="${opts.orient}">
    ${main}
    <div class="hs-thumbs">
      ${n > 1 ? `<span class="hs-count">${i + 1} / ${n}</span>` : ''}
      ${thumbs}
    </div>
    <div class="hs-foot">${opts.foot}</div>
  </section>`
}

/** 立绘 + 两侧箭头。箭头浮在立绘左右边缘上、不占布局宽度（竖屏每一 px 宽都要留给美术） */
function showcaseArtHtml(hero: HeroLike, i: number, n: number): string {
  const arrows = `
    <button type="button" class="hs-arrow hs-arrow--prev" data-hs-step="-1" aria-label="上一名英雄"${i === 0 ? ' disabled' : ''}>${icon('cg-back')}</button>
    <button type="button" class="hs-arrow hs-arrow--next" data-hs-step="1" aria-label="下一名英雄"${i >= n - 1 ? ' disabled' : ''}>${icon('cg-back')}</button>`
  return `<figure class="hs-art">${heroPortraitHtml(hero, arrows)}</figure>`
}

/** 右栏：名条 + 主动/被动切换 + 该英雄的技能缩略图 */
function showcaseSideHtml(hero: HeroLike, catalog: Catalog, kind: SlotKind): string {
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
  // 名条分两行写死断点（职业·体质 / 力敏智·站位），交给浏览器自动折行会在「力敏智」中间断开
  const coord = hero.coordinate ? ` · ${escapeHtml(hero.coordinate.lane)}#${hero.coordinate.index}` : ''
  return `<div class="hs-side">
    <div class="hs-meta">
      <b>${escapeHtml(hero.name)}</b>
      <small>${escapeHtml(hero.classId)} · ${escapeHtml(hero.constitutionId)}</small>
      <small>${hero.combo.strength}力 / ${hero.combo.agility}敏 / ${hero.combo.intelligence}智${coord}</small>
    </div>
    <div class="hs-switch" role="group" aria-label="名册里显示哪一类技能">
      ${switchBtn('active', kind)}
      ${switchBtn('passive', kind)}
    </div>
    <div class="hs-cards">${cards || '<span class="cards-none">—</span>'}</div>
  </div>`
}

/** 技能切换按钮。主动/被动的次序语义不同，标题里各说一句，省得看串。
 *  用 kit 的 .cg-select（环在左、选中填黄铜），这样「当前看的是哪一类」和整页其它选中态是同一套语言。 */
function switchBtn(kind: SlotKind, cur: SlotKind): string {
  const tip =
    kind === 'active' ? '主动技能按槽位顺序在战斗里轮转释放' : '被动技能常驻；同一触发点上有多张时按槽位顺序发动'
  return `<button type="button" class="cg-select hs-switch__btn${kind === cur ? ' is-on' : ''}" data-skill-view="${kind}" title="${tip}">${SLOT_LABEL[kind]}</button>`
}

/** 缩略图切换用的小立绘 */
function thumbHtml(hero: HeroLike, i: number, on: boolean): string {
  return `<button type="button" class="hs-thumb${on ? ' is-on' : ''}" data-hs-pick="${i}" aria-label="${escapeHtml(hero.name)}"${on ? ' aria-current="true"' : ''}>${heroPortraitHtml(hero)}</button>`
}

export interface ShowcaseHandlers {
  /** 当前展示的下标（+1 / -1 要有个起点；夹取也在这里做，按钮的 disabled 只是视觉） */
  index: number
  onIndex(index: number): void
  onKind(kind: SlotKind): void
}

/**
 * 事件委托绑三类点击：箭头（data-hs-step）、缩略图（data-hs-pick）、主动/被动（data-skill-view）。
 * 挂在 section 上而不是每个按钮上，重绘一次只挂一次。
 */
export function wireHeroShowcase(host: HTMLElement, h: ShowcaseHandlers): void {
  hookOrientation()
  host.querySelectorAll<HTMLElement>('.hero-showcase').forEach((sec) => {
    const total = sec.querySelectorAll('[data-hs-pick]').length
    sec.addEventListener('click', (e) => {
      const el = e.target as HTMLElement
      const step = el.closest<HTMLButtonElement>('[data-hs-step]')
      if (step) {
        const next = h.index + Number(step.dataset.hsStep)
        if (next >= 0 && next < total) h.onIndex(next)
        return
      }
      const pick = el.closest<HTMLButtonElement>('[data-hs-pick]')
      if (pick) {
        h.onIndex(Number(pick.dataset.hsPick))
        return
      }
      const kind = el.closest<HTMLButtonElement>('[data-skill-view]')
      if (kind) h.onKind(kind.dataset.skillView === 'passive' ? 'passive' : 'active')
    })
  })
}

let orientHooked = false

/**
 * 朝向变化只翻 `data-orient`，不整页重绘——朝向是纯 CSS 分支（换一套 grid-template-areas），
 * 重绘会白丢 hover 与焦点。监听只挂一次（照 battle.ts 的 hookResize）：每次进入本页挂一个
 * `{once: true}` 的话，来回进出会越积越多。
 */
function hookOrientation(): void {
  if (orientHooked) return
  orientHooked = true
  window.addEventListener('resize', () => {
    const o = orientationOf(window.innerWidth, window.innerHeight)
    document.querySelectorAll<HTMLElement>('.hero-showcase').forEach((el) => {
      if (el.dataset.orient !== o) el.dataset.orient = o
    })
  })
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
