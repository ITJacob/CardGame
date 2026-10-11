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
 * 尺寸一律由外层容器给（.hs-art 的立绘框 / .hs-cell / .tile .avatar / .chip-avatar），
 * 这里只管外观。
 *
 * 故意不加 loading="lazy"：dev 中间件对缺文件会 next() 落到 Vite 的 SPA fallback，
 * 回一张 200 的 HTML；而 lazy 图遇到这种响应既不派发 load 也不派发 error，降级链就废了
 * （技能卡图那边已有同样的记录）。英雄每页最多 5 张，直出没有代价。
 *
 * @param overlay 叠在图上的东西（竖屏展示台的左右箭头）。放在这一层里是为了让它们相对
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
 * 两个朝向共用一份 DOM，只靠 data-orient 换一套 grid-template-areas：
 *   竖屏（上下结构）：立绘整宽在上 → 信息技能 → 名册小图条 → 动作条
 *   横屏（铺开）：左侧把整本名册横向铺开当主展示（不再有单独的缩略图条），
 *                右栏上下分给「信息技能」与「操作」，大立绘整块撤掉
 * 高度的约束在 .viewport-page（一屏、不整页滚动），本组件的 flex: 1 正好吃掉剩余。
 * ========================================================================== */

export interface ShowcaseOpts {
  /** 当前展示第几个英雄（越界自动夹回合法范围） */
  index: number
  /** 技能缩略图看主动还是被动 */
  kind: SlotKind
  orient: Orientation
  /** 动作区（各屏自己的按钮/状态行），直接落进 grid 的 foot 区 */
  foot: string
}

export function heroShowcaseHtml(heroes: HeroLike[], catalog: Catalog, opts: ShowcaseOpts): string {
  const n = heroes.length
  const i = n === 0 ? 0 : Math.min(Math.max(opts.index, 0), n - 1)
  const hero = heroes[i]
  return `<section class="hero-showcase" data-orient="${opts.orient}">
    ${artHtml(hero, i, n)}
    ${stripHtml(heroes, i)}
    ${hero ? sideHtml(hero, catalog, opts.kind) : ''}
    <div class="hs-foot">${opts.foot}</div>
  </section>`
}

/** 竖屏的主立绘（横屏整块撤掉）。两侧箭头作为 overlay 塞进立绘框里 */
function artHtml(hero: HeroLike | undefined, i: number, n: number): string {
  if (!hero) return '<figure class="hs-art"><p class="hint hs-empty">名册为空</p></figure>'
  return `<figure class="hs-art">${heroPortraitHtml(hero, stepArrows(i, n))}</figure>`
}

/**
 * 名册条。竖屏是「小图标切换」的缩略图条（+ 当前第几 / 共几）；
 * 横屏是两段式：上面一排大图当主展示（每格带名字、整条横向铺开，装不下时隐藏
 * 滚动条由箭头带头），底下再常驻一排缩略图——大图滚走了也一眼看得到整本名册。
 */
function stripHtml(heroes: HeroLike[], i: number): string {
  const n = heroes.length
  if (n === 0) return '<div class="hs-strip"></div>'
  const cells = heroes.map((h, k) => cellHtml(h, k, k === i)).join('')
  const thumbs = heroes.map((h, k) => thumbCellHtml(h, k, k === i)).join('')
  return `<div class="hs-strip">
    ${n > 1 ? `<span class="hs-count">${i + 1} / ${n}</span>` : ''}
    <div class="hs-track" role="group" aria-label="名册">
      ${cells}
    </div>
    <div class="hs-thumbs" role="group" aria-label="名册缩略图">
      ${thumbs}
    </div>
    ${stepArrows(i, n)}
  </div>`
}

/**
 * 缩略图条里的一格：只有立绘，一眼看全名册、点它直接跳到那个英雄。
 * 点击走的是和名册格同一个 data-hs-pick，事件委托不用分叉。
 */
function thumbCellHtml(hero: HeroLike, i: number, on: boolean): string {
  return `<button type="button" class="hs-thumb${on ? ' is-on' : ''}" data-hs-pick="${i}" aria-label="${escapeHtml(hero.name)}"${on ? ' aria-current="true"' : ''}>${heroPortraitHtml(hero)}</button>`
}

/** 名册里的一格。竖屏只露立绘，横屏在下面补一行名字（那时它就是主展示，得认得出谁是谁） */
function cellHtml(hero: HeroLike, i: number, on: boolean): string {
  return `<button type="button" class="hs-cell${on ? ' is-on' : ''}" data-hs-pick="${i}" aria-label="${escapeHtml(hero.name)}"${on ? ' aria-current="true"' : ''}>
    ${heroPortraitHtml(hero)}
    <span class="hs-cell__name">${escapeHtml(hero.name)}</span>
  </button>`
}

/** 左右箭头。竖屏浮在主立绘两侧、横屏浮在名册条两端，两处都用同一份标记（事件委托按 data-hs-step 认） */
function stepArrows(i: number, n: number): string {
  const off = n <= 1
  return `<button type="button" class="hs-arrow hs-arrow--prev" data-hs-step="-1" aria-label="上一名英雄"${i === 0 || off ? ' disabled' : ''}>${icon('cg-back')}</button>
    <button type="button" class="hs-arrow hs-arrow--next" data-hs-step="1" aria-label="下一名英雄"${i >= n - 1 || off ? ' disabled' : ''}>${icon('cg-back')}</button>`
}

/** 信息栏：名条（左）与主动/被动切换（右）同一行，下面整宽摆该英雄的技能缩略图 */
function sideHtml(hero: HeroLike, catalog: Catalog, kind: SlotKind): string {
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
    <div class="hs-head">
      <div class="hs-meta">
        <b>${escapeHtml(hero.name)}</b>
        <small>${escapeHtml(hero.classId)} · ${escapeHtml(hero.constitutionId)}</small>
        <small>${hero.combo.strength}力 / ${hero.combo.agility}敏 / ${hero.combo.intelligence}智${coord}</small>
      </div>
      <div class="hs-switch" role="group" aria-label="名册里显示哪一类技能">
        ${switchBtn('active', kind)}
        ${switchBtn('passive', kind)}
      </div>
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

export interface ShowcaseHandlers {
  /** 当前展示的下标（+1 / -1 要有个起点；夹取也在这里做，按钮的 disabled 只是视觉） */
  index: number
  onIndex(index: number): void
  onKind(kind: SlotKind): void
}

/**
 * 事件委托绑三类点击：箭头（data-hs-step）、名册格（data-hs-pick）、主动/被动（data-skill-view）。
 * 挂在 section 上而不是每个按钮上，重绘一次只挂一次。
 *
 * 箭头的两套语义按朝向分：竖屏名册条装得下（5 个小图标），箭头＝翻英雄；
 * 横屏名册是条横向长条、装不下（滚动条藏了），箭头＝滚条，选中交给点格子。
 */
export function wireHeroShowcase(host: HTMLElement, h: ShowcaseHandlers): void {
  hookOrientation()
  host.querySelectorAll<HTMLElement>('.hero-showcase').forEach((sec) => {
    const track = sec.querySelector<HTMLElement>('.hs-track')
    if (track) {
      // 重绘后滚动位置归零，把选中的那格滚回视野（横屏名册铺不下时靠这一步）
      if (track.scrollWidth > track.clientWidth) {
        sec.querySelector('.hs-cell.is-on')?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
      }
      track.addEventListener('scroll', () => syncStripArrows(sec), { passive: true })
      syncStripArrows(sec)
    }
    // 只数大图那排：横屏底下还多一排缩略图，同一个人挂了两个 data-hs-pick，数重了会上限翻倍
    const total = sec.querySelectorAll('.hs-track [data-hs-pick]').length
    sec.addEventListener('click', (e) => {
      const el = e.target as HTMLElement
      const step = el.closest<HTMLButtonElement>('[data-hs-step]')
      if (step) {
        if (sec.dataset.orient === 'landscape' && track) {
          scrollTrackByOne(track, Number(step.dataset.hsStep))
          return
        }
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

/** 横屏名册条的箭头是「藏起来的滚动条」的把手：按一格宽（含间隙）滚一段 */
function scrollTrackByOne(track: HTMLElement, dir: number): void {
  const cell = track.querySelector<HTMLElement>('.hs-cell')
  const gap = parseFloat(getComputedStyle(track).columnGap) || 0
  const step = cell ? cell.getBoundingClientRect().width + gap : track.clientWidth
  track.scrollBy({ left: dir * step, behavior: 'smooth' })
}

/**
 * 名册条两端箭头按「还能不能往那边滚」置灰 —— 竖屏那条根本不滚（scrollWidth === clientWidth），
 * 两个箭头恒为禁用；竖屏真正在用的是浮在立绘上的那对，它们的 disabled 由渲染时的下标决定。
 * 横屏滚到头时那条正好把箭头置灰，所以滚动条藏起来也不会让人以为还能翻。
 */
function syncStripArrows(sec: HTMLElement): void {
  const track = sec.querySelector<HTMLElement>('.hs-track')
  const prev = sec.querySelector<HTMLButtonElement>('.hs-strip .hs-arrow--prev')
  const next = sec.querySelector<HTMLButtonElement>('.hs-strip .hs-arrow--next')
  if (!track || !prev || !next) return
  const max = track.scrollWidth - track.clientWidth
  prev.disabled = track.scrollLeft <= 1
  next.disabled = track.scrollLeft >= max - 1
}

let orientHooked = false

/**
 * 朝向变化只翻 `data-orient`，不整页重绘——两个朝向共用一份 DOM，只是换一套
 * grid-template-areas，重绘会白丢 hover 与焦点。监听只挂一次（照 battle.ts 的
 * hookResize）：每次进入本页挂一个 `{once: true}` 的话，来回进出会越积越多。
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
