// 英雄展示：名册预览（新游戏 / 在线大厅）与整备页小图共用的展示块。
import { escapeHtml } from './chrome'
import { avatarEmoji, cardFaceHtml, hydrateArt, setHtmlWithPooledFaces } from './cardFace'
import { icon } from './icons'
import { emblemHtml } from './emblem'
import { hideCardPop } from '../hover'
import { orientationOf, type Orientation } from '../battle/projection'
import { SLOT_LABEL, type SlotKind } from '../../meta/loadout'
import { constitutionById } from '../../meta/constitution'
import { laneLabel } from '../../meta/formation'
import type { Attributes3, Hero } from '../../meta/herogen'
import type { Coordinate } from '../../kernel/battle/types'
import type { Catalog } from '../../kernel/catalog/types'

export type HeroLike = Hero & { coordinate?: Coordinate }

/**
 * 立绘路径。key 口径 = herogen.ts 的 COMBOS（s 0..3, a 0..3-s, i 3-s-a）× 性别，
 * 正好 10 组 × 2 = 20 张，与 assets/heroes/PROMPTS.md 的清单一一对应。
 * 与 cardArtUrl 同为 ./assets/… 相对路径（dev 由 Vite 中间件把仓库 assets/ 挂到根路径，
 * prod 由部署把 assets/ 铺在 /CardGame/assets/）。
 */
const HERO_ART_BASE = './assets/heroes/'

/** 立绘文件名（不含档位后缀）：力敏智 × 性别，10 组 × 2 = 20 张 */
function heroArtKey(combo: Attributes3, gender: 'male' | 'female'): string {
  return `hero_s${combo.strength}a${combo.agility}i${combo.intelligence}_${gender}`
}

/** 立绘默认源（最大档）：不支持 srcset 时的兜底 */
export function heroArtUrl(combo: Attributes3, gender: 'male' | 'female'): string {
  return `${HERO_ART_BASE}${heroArtKey(combo, gender)}@1152w.webp`
}

/** 四档 srcset（200/400/800/1152w），口径同 cardArtSrcset；1152 是母版原尺寸档，供大屏高 DPR */
export function heroArtSrcset(combo: Attributes3, gender: 'male' | 'female'): string {
  const k = heroArtKey(combo, gender)
  return [200, 400, 800, 1152].map((w) => `${HERO_ART_BASE}${k}@${w}w.webp ${w}w`).join(', ')
}

/**
 * 立绘块：<img data-hero-art> 直接铺满，无 emoji 垫底（20 张立绘已齐全，不留降级占位）。
 * 加载失败由 hydrateHeroArt 摘掉 img，落在 .hero-portrait 自带的渐变底 + 描边上（空框，不出 emoji）。
 * 尺寸一律由外层容器给（.hs-art 的立绘框 / .hs-cell / .tile .avatar / .chip-avatar），
 * 这里只管外观。
 *
 * 故意不加 loading="lazy"：dev 中间件对缺文件会 next() 落到 Vite 的 SPA fallback，
 * 回一张 200 的 HTML；而 lazy 图遇到这种响应既不派发 load 也不派发 error，降级链就废了
 * （技能卡图那边已有同样的记录）。英雄每页最多 5 张，直出没有代价。
 *
 * @param overlay 叠在图上的东西（竖屏展示台的左右箭头）。放在这一层里是为了让它们相对
 *                「立绘框」定位，而不是相对格子——立绘比格子小或被居中时箭头才不会飘开。
 * @param sizes  立绘的 CSS 显示宽度（浏览器 × DPR 选 srcset 档）。默认按展示台主立绘估：
 *               竖屏占满页宽（min(100vw,75vh) 与 .hs-art 的 3:4 收边同口径），横屏主立绘
 *               不显示、只剩格子小图，320px 兜底。
 */
export function heroPortraitHtml(hero: HeroLike, overlay = '', sizes = '(orientation: portrait) min(100vw, 75vh), 320px'): string {
  return `<span class="hero-portrait">
    <img class="hero-portrait__img" src="${heroArtUrl(hero.combo, hero.gender)}" srcset="${heroArtSrcset(hero.combo, hero.gender)}" sizes="${sizes}" alt="" data-hero-art>
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
  return `<button type="button" class="hs-thumb${on ? ' is-on' : ''}" data-hs-pick="${i}" aria-label="${escapeHtml(hero.name)}"${on ? ' aria-current="true"' : ''}>${heroPortraitHtml(hero, '', '45px')}</button>`
}

/** 名册里的一格：只露立绘。名字不往格子里写——右侧名条已经写着选中那位是谁，
 *  横屏那一排还得把高度全让给美术（格子按 3:4 铺满条高，多一行名字就少 22px 图高）。
 *  sizes 按格子实测定：宽 = min(条高×3/4, 条宽) ≈ min(75vh−120px, 38vw)（1366×768 实渲 459、
 *  1920×1080 封顶 551）——写小了浏览器选低档会糊，宁可略估大。竖屏格子是 45px 缩略图。 */
function cellHtml(hero: HeroLike, i: number, on: boolean): string {
  return `<button type="button" class="hs-cell${on ? ' is-on' : ''}" data-hs-pick="${i}" aria-label="${escapeHtml(hero.name)}"${on ? ' aria-current="true"' : ''}>
    ${heroPortraitHtml(hero, '', '(orientation: landscape) min(38vw, calc(75vh - 120px)), 45px')}
  </button>`
}

/** 左右箭头。竖屏浮在主立绘两侧、横屏浮在名册条两端，两处都用同一份标记（事件委托按 data-hs-step 认） */
function stepArrows(i: number, n: number): string {
  const off = n <= 1
  return `<button type="button" class="hs-arrow hs-arrow--prev" data-hs-step="-1" aria-label="上一名英雄"${i === 0 || off ? ' disabled' : ''}>${icon('cg-back')}</button>
    <button type="button" class="hs-arrow hs-arrow--next" data-hs-step="1" aria-label="下一名英雄"${i >= n - 1 || off ? ' disabled' : ''}>${icon('cg-back')}</button>`
}

/** 信息栏：名条（左）与主动/被动切换（右）同一行，下面整宽摆技能缩略图。
 *  名条「职业 · 力敏智 · 站位」挤一行写——竖屏的格子高度要尽量留给技能卡。 */
function sideHtml(hero: HeroLike, catalog: Catalog, kind: SlotKind): string {
  // 职业取 classDefs 里的中文途径名，站位走 laneLabel（lane0/1 → 1路/2路）、序号 1 起数
  const className = catalog.classDefs.get(hero.classId)?.name ?? hero.classId
  const constitution = constitutionById(hero.constitutionId)?.name ?? hero.constitutionId
  const coord = hero.coordinate
    ? ` · ${escapeHtml(laneLabel(hero.coordinate.lane))}${hero.coordinate.index + 1}`
    : ''
  return `<div class="hs-side">
    <div class="hs-head">
      <div class="hs-meta">
        <b>${escapeHtml(hero.name)}</b>
        <small>${emblemHtml(hero.classId)}${escapeHtml(className)} · ${escapeHtml(constitution)} · ${hero.combo.strength}力 / ${hero.combo.agility}敏 / ${hero.combo.intelligence}智${coord}</small>
      </div>
      <div class="hs-switch" role="group" aria-label="名册里显示哪一类技能">
        ${switchBtn('active', kind)}
        ${switchBtn('passive', kind)}
      </div>
    </div>
    <div class="hs-cards">
      ${cardGroupHtml(hero, catalog, 'active', kind)}
      ${cardGroupHtml(hero, catalog, 'passive', kind)}
    </div>
  </div>`
}

/**
 * 一类技能一组。**两类都渲染进 DOM**，显示哪一类交给 CSS 按朝向定：
 * 竖屏只显示当前选中的那类（切换按钮管），横屏没有切换按钮、两类一起摊开。
 * 之所以不按朝向在 JS 里少渲染一组：旋转只翻 data-orient、不重绘（见 hookOrientation），
 * 少渲染的那组在转屏后不会自己长出来。
 */
function cardGroupHtml(hero: HeroLike, catalog: Catalog, k: SlotKind, cur: SlotKind): string {
  const ids = k === 'active' ? hero.activeSkillIds : hero.passiveSkillIds
  const cards = ids
    .map((id) => {
      const def = catalog.skillDefs.get(id)
      const tpl = catalog.behaviorTemplates.get(id)
      return cardFaceHtml({
        cardId: id,
        name: def?.name ?? tpl?.name ?? id,
        rarity: def?.rarity ?? tpl?.rarity,
        pathwayId: def?.pathwayId ?? tpl?.pathwayId,
        kind: k,
        cost: def?.cost?.energy,
        as: 'button',
        // 实渲宽 ≤128px（.hs-group__row 按行平分、横屏按右栏高倒推、上限 128），不是 compact 默认的 60px
        sizes: '128px',
      })
    })
    .join('')
  return `<div class="hs-group${k === cur ? ' is-on' : ''}" data-kind="${k}">
      <span class="hs-group__tag">${SLOT_LABEL[k]}</span>
      <div class="hs-group__row">${cards || '<span class="cards-none">—</span>'}</div>
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
  /** 当前展示的下标（+1 / -1 的起点；夹取也在这里做，按钮的 disabled 只是视觉） */
  index: number
  /** 名册：翻页时要给它翻选中态、主立绘/右栏重建也要按它取人 */
  heroes: HeroLike[]
  /** 卡池：右栏技能卡重建要用 */
  catalog: Catalog
  /** 当前看主动还是被动（两类卡常驻 DOM，切页签只翻类名） */
  kind: SlotKind
  /** 只负责记录页面级状态（下次整页渲染取）；翻页/切页签的重绘已由本组件内部就地消化 */
  onIndex(index: number): void
  onKind(kind: SlotKind): void
}

/**
 * 事件委托绑三类点击：箭头（data-hs-step）、名册格（data-hs-pick）、主动/被动（data-skill-view）。
 * 挂在 section 上而不是每个按钮上，重绘一次只挂一次。
 *
 * 箭头的两套语义按朝向分：竖屏名册条装得下（5 个小图标），箭头＝翻英雄；
 * 横屏名册是条横向长条、装不下（滚动条藏了），箭头＝滚条，选中交给点格子。
 *
 * 翻英雄 / 切页签都**就地补丁**（见 patchShowcase），不整页重绘：整页重绘会把名册条 5–10 张
 * 1152×1536 立绘全换成新 <img>——字节走缓存，但每个新元素都要重新解码，点一下全员闪一遍。
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
    let cur = h.index
    let kind = h.kind
    /** 翻英雄：视图只存状态，重绘由本组件内部消化（patchShowcase） */
    const setIndex = (next: number): void => {
      if (next < 0 || next >= total) return
      cur = next
      h.onIndex(next)
      patchShowcase(sec, h.heroes, h.catalog, cur, kind)
    }
    /** 切主动/被动：两类卡常驻 DOM（见 cardGroupHtml），只翻 is-on，一张卡都不动 */
    const setKind = (k: SlotKind): void => {
      kind = k
      h.onKind(k)
      sec.querySelectorAll<HTMLElement>('.hs-group').forEach((g) => g.classList.toggle('is-on', g.dataset.kind === k))
      sec.querySelectorAll<HTMLElement>('[data-skill-view]').forEach((b) => b.classList.toggle('is-on', b.dataset.skillView === k))
    }
    sec.addEventListener('click', (e) => {
      const el = e.target as HTMLElement
      const step = el.closest<HTMLButtonElement>('[data-hs-step]')
      if (step) {
        if (sec.dataset.orient === 'landscape' && track) {
          scrollTrackByOne(track, Number(step.dataset.hsStep))
          return
        }
        setIndex(cur + Number(step.dataset.hsStep))
        return
      }
      const pick = el.closest<HTMLButtonElement>('[data-hs-pick]')
      if (pick) {
        setIndex(Number(pick.dataset.hsPick))
        return
      }
      const k = el.closest<HTMLButtonElement>('[data-skill-view]')
      if (k) setKind(k.dataset.skillView === 'passive' ? 'passive' : 'active')
    })
  })
}

/**
 * 翻英雄的就地补丁：名册条/缩略图只翻选中态（is-on + aria-current）——立绘 <img> 节点一个不换；
 * 主立绘重建用的是同一份 URL，浏览器的解码位直接复用，不闪。主立绘与右栏内容换人必换，就地
 * 重建（右栏 8 张技能卡的边框是共享小图，解码位同样在）。技能卡两组常驻 DOM，不在此动。
 * 锚在被换掉的卡面/立绘上的详情浮层先收。
 */
function patchShowcase(sec: HTMLElement, heroes: HeroLike[], catalog: Catalog, i: number, kind: SlotKind): void {
  const n = heroes.length
  const hero = heroes[i]
  sec.querySelectorAll<HTMLElement>('[data-hs-pick]').forEach((el) => {
    const on = Number(el.dataset.hsPick) === i
    el.classList.toggle('is-on', on)
    if (on) el.setAttribute('aria-current', 'true')
    else el.removeAttribute('aria-current')
  })
  const count = sec.querySelector('.hs-count')
  if (count) count.textContent = n > 1 ? `${i + 1} / ${n}` : ''
  const art = sec.querySelector('.hs-art')
  if (art) art.innerHTML = hero ? heroPortraitHtml(hero, stepArrows(i, n)) : '<p class="hint hs-empty">名册为空</p>'
  const side = sec.querySelector<HTMLElement>('.hs-side')
  if (side && hero) {
    const shell = document.createElement('div')
    shell.innerHTML = sideHtml(hero, catalog, kind)
    // 右栏整体重建，但卡面走节点池：翻英雄来回切时 <img> 不销毁重建，不闪
    setHtmlWithPooledFaces(side, (shell.firstElementChild as HTMLElement).innerHTML, (slot) =>
      sideFaceKey(slot, catalog),
    )
  }
  hydrateHeroArt(sec)
  hydrateArt(sec)
  hideCardPop()
}

/** 右栏卡面的池键：与 cardGroupHtml 里那张卡面的渲染参数逐字一致（data-card + 所在组），
 *  键即身份，空槽无卡面、天然跳过。 */
function sideFaceKey(slot: HTMLElement, catalog: Catalog): string | undefined {
  const id = slot.dataset.card ?? ''
  const k = slot.closest<HTMLElement>('[data-kind]')?.dataset.kind
  if (!id || (k !== 'active' && k !== 'passive')) return undefined
  const def = catalog.skillDefs.get(id)
  const tpl = catalog.behaviorTemplates.get(id)
  return cardFaceHtml({
    cardId: id,
    name: def?.name ?? tpl?.name ?? id,
    rarity: def?.rarity ?? tpl?.rarity,
    pathwayId: def?.pathwayId ?? tpl?.pathwayId,
    kind: k,
    cost: def?.cost?.energy,
    as: 'button',
    sizes: '128px',
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

/** 英雄图失败 → 摘掉 img：立绘落在渐变底空框上，头像露回垫底的 emoji。
 *  加载成功则给头像外层挂 .is-loaded——头像图是透明底，不撤 emoji 会透过图的空隙露出来
 *  （立绘已无 emoji 垫底，不需要这一步）。 */
export function hydrateHeroArt(root: HTMLElement): void {
  root.querySelectorAll<HTMLImageElement>('img[data-hero-art]').forEach((img) => {
    const fail = (): void => {
      img.hidden = true
    }
    const ok = (): void => {
      img.closest('.hero-avatar')?.classList.add('is-loaded')
    }
    if (img.complete && img.naturalWidth === 0) fail()
    else if (img.complete) ok()
    img.addEventListener('error', fail, { once: true })
    img.addEventListener('load', ok, { once: true })
  })
}

/* ============================================================================
 * 无背景头像（战斗棋盘格 / 侧栏名册 / 选靶按钮）
 *
 * 图是立绘派生的 1024×1024 透明底抠图（source/avatars/…__idle.png → assets/avatars/）。
 * 只出 200/400/800 三档、不再加第四档：用它的格子都很小（≤56px，DPR3 也才 168px），
 * 200w 一档就够；srcset 三档照写，浏览器按 sizes 自取。降级链与立绘同一套
 * （emoji 垫底、img 盖上、失败由 hydrateHeroArt 摘掉 img——同一个 data-hero-art 钩子）。
 * ========================================================================== */

const HERO_AVATAR_BASE = './assets/avatars/'

/** 头像文件名（不含档位后缀）：与立绘同 key，多一个 __idle（透明底那版；__idle_src 是带底原图） */
function heroAvatarKey(combo: Attributes3, gender: 'male' | 'female'): string {
  return `${heroArtKey(combo, gender)}__idle`
}

/** 头像默认源（最小档）：头像用点都是小图，不支持 srcset 时 200w 兜住 */
export function heroAvatarUrl(combo: Attributes3, gender: 'male' | 'female'): string {
  return `${HERO_AVATAR_BASE}${heroAvatarKey(combo, gender)}@200w.webp`
}

/** 三档 srcset（200/400/800w） */
export function heroAvatarSrcset(combo: Attributes3, gender: 'male' | 'female'): string {
  const k = heroAvatarKey(combo, gender)
  return [200, 400, 800].map((w) => `${HERO_AVATAR_BASE}${k}@${w}w.webp ${w}w`).join(', ')
}

/** 头像需要的最小信息：UnitMeta 与 Hero/PlacedHero 都满足 */
export type AvatarLike = Pick<Hero, 'combo' | 'gender' | 'constitutionId'>

/**
 * 头像块（两层）：emoji 垫底、<img data-hero-art> 盖上。尺寸一律由外层容器给
 * （.tile .avatar / .roster-avatar / .pick-face），这里只管外观；图是透明底方图，
 * contain 全显不裁（CSS 见 .hero-avatar）。
 * withEmoji=false：不画 emoji 垫底（信息栏/操作栏的大头像——位图缺失就留白，不用 emoji 凑数）。
 *
 * @param sizes 头像的 CSS 显示宽度。默认 56px（棋盘格档）；56×DPR3=168 < 200，
 *              所以实际永远选中 200w 档——这正是头像不出第四档的理由。
 */
export function heroAvatarHtml(hero: AvatarLike, sizes = '56px', withEmoji = true): string {
  const emoji = withEmoji ? `<span class="hero-avatar__emoji" aria-hidden="true">${avatarEmoji(hero.constitutionId, hero.gender)}</span>` : ''
  return `<span class="hero-avatar">${emoji}
    <img class="hero-avatar__img" src="${heroAvatarUrl(hero.combo, hero.gender)}" srcset="${heroAvatarSrcset(hero.combo, hero.gender)}" sizes="${sizes}" alt="" data-hero-art>
  </span>`
}
