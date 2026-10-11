// 整备：出战前配置技能槽（4 主动 + 4 被动）与阵型（2 路 × 4 格）。人机/在线共用一套。
// 编辑写回出战草稿（ui/draft），开战/建房时照常从草稿读名册——内核与在线 wire 零改动。
//
// 版式照「新游戏」页（components/hero.ts 的 .hero-showcase）：左边＝布局场景，右边＝角色信息 /
// 技能 / 操作按钮；竖屏同一套 DOM 折成一列三行（尺寸与网格见 app.css 整备段）。
// 右栏与脚直接借用展示台的 .hs-side / .hs-head / .hs-meta / .hs-foot / .hs-status——
// 名条金色 15px、右栏 justify-content:center 的垂直居中、横屏那排 30px 按钮，都是那套类给的，
// 自造一份 .prep-meta/.prep-foot 只会跟它慢慢走岔（app.css 里那几条横屏规则已按 [data-orient] 放宽）。
// 一屏不出整页滚动，21 + 13 张卡池收进弹窗、由弹窗自己滚。
//
// 弹窗挂在 host 内、进页面时由 draw() 画进去、开合时由 openPicker/closePicker 就地插/摘
// （不挂 document.body、不像 zoom.ts 那样另起一套）：① drag.ts 的落点判定是 host.contains(raw)、
// hover.ts 的卡面详情也只在 host 内找 .card-face，挂到 body 上这两样会静默失效；
// ② 挂在 host 内、且不进整页重画，装卡后弹窗保持打开、卡池滚动位置也留在原地。
//
// 进页面之后**只有 draw() 会整页重画一次**，此后装卡/卸卡/调序/换人/换页签一律走 refresh()
// 就地改那几格——整页重画会把几十张大图换成新 <img> 重新解码，点一下闪一下（见 refresh 的说明）。
import { escapeHtml, subBarHtml } from '../components/chrome'
import { cardDetailHtml, cardFaceHtml, hydrateArt } from '../components/cardFace'
import { heroPortraitHtml, hydrateHeroArt } from '../components/hero'
import { icon } from '../components/icons'
import type { CardFaceOpts } from '../components/cardFace'
import { enableDrag } from '../drag'
import { enableHoverCard, hideCardPop } from '../hover'
import { getCatalog } from '../catalog'
import { loadProfile } from '../profile'
import { getDraft, patchOwnHero, setOwn, type RosterDraft } from '../draft'
import { constitutionById } from '../../meta/constitution'
import {
  DEFAULT_LANES,
  laneLabel,
  moveHeroTo,
  swapHeroes,
  validateFormation,
  type PlacedHero,
} from '../../meta/formation'
import {
  SLOT_LABEL,
  SLOT_LIMIT,
  equipSkill,
  moveSlot,
  skillPoolOf,
  unequipSkill,
  type SlotKind,
} from '../../meta/loadout'
import { orientationOf } from '../battle/projection'
import { LANE_CAPACITY, LANE_COUNT } from '../../kernel/battle/types'
import type { Hero } from '../../meta/herogen'
import type { Profile } from '../../meta/progression'
import type { Catalog } from '../../kernel/catalog/types'

const LANES: readonly string[] = DEFAULT_LANES
/** 两侧的固定次序：槽位、卡池标签、弹窗页签都按它走 */
const KINDS: readonly SlotKind[] = ['active', 'passive']

/** 拖拽载荷：阵型里拖英雄 / 技能槽之间同侧调序（主动进主动槽、被动进被动槽，两类不相通） */
type DragPayload = { kind: 'hero'; id: string } | { kind: 'slot'; at: string }

/** 技能弹窗开着时记着「编哪个英雄的哪一侧」；draw() 只看它非空就把弹窗拼进模板 */
interface PickerState {
  /** 从哪一侧的格子点开的（关掉后焦点还回那一格） */
  kind: SlotKind
  /** 弹窗里卡池正看哪一侧 */
  tab: SlotKind
}

// ---------- 模块级钩子（每次进页只该有一份，来回进出不能越积越多）----------

let orientHooked = false

/**
 * 朝向变化只翻 `data-orient`、不整页重绘——两个朝向共用一份 DOM，只是换一套 grid 落位与
 * 一档尺寸，重绘会白丢 hover 与焦点，还会把弹窗里卡池的滚动位置顶回去。监听只挂一次
 * （照 battle.ts 的 hookResize）：每次进入本页挂一个 `{once: true}` 的话，来回进出会越积越多。
 */
function hookOrient(): void {
  if (orientHooked) return
  orientHooked = true
  window.addEventListener('resize', () => {
    const o = orientationOf(window.innerWidth, window.innerHeight)
    document.querySelectorAll<HTMLElement>('.prep-page').forEach((el) => {
      if (el.dataset.orient !== o) el.dataset.orient = o
    })
  })
}

/** Esc 关弹窗。挂 window 上，所以每次 mount 先摘掉上一次的（闭包拿着上一次的 picker 状态） */
let escHandler: ((e: KeyboardEvent) => void) | null = null

/** host 上那份点击/键盘委托的句柄：同样每次 mount 先 abort 上一次的（理由见 onClick 那段） */
let wireAbort: AbortController | null = null

export function renderPrep(host: HTMLElement): void {
  const draft = getDraft()
  if (!draft) {
    host.innerHTML = `${subBarHtml('整备', '#/new')}<main class="placeholder">
      <h1>还没有待整备的队伍</h1>
      <p>请先 <a href="#/new">开始新游戏</a> 或进入 <a href="#/online">在线对战</a> 生成名册。</p>
    </main>`
    return
  }
  const back = draft.mode === 'online' ? '#/online' : '#/new'
  host.innerHTML = `${subBarHtml('整备', back)}<main class="placeholder"><p>正在加载卡池…</p></main>`
  getCatalog()
    .then((catalog) => mount(host, back, catalog, loadProfile()))
    .catch((e: unknown) => {
      host.innerHTML = `${subBarHtml('整备', back)}<main class="placeholder"><h1>加载失败</h1><p>${escapeHtml(String(e))}</p></main>`
    })
}

function mount(host: HTMLElement, back: string, catalog: Catalog, profile: Profile): void {
  const first = getDraft()?.own[0]?.id ?? null
  let selectedId: string | null = first
  let notice = ''
  let picker: PickerState | null = null
  /** 右栏现在画的是谁：还是这个人的话只需逐格对账，换人才重建名条与两行摘要 */
  let sideDrawn: string | null = null
  /** 弹窗卡池现在画的是哪一侧：切页签才重建卡池（本来就换一批卡），其余只翻状态 */
  let poolDrawn: SlotKind | null = null

  const currentHero = (): PlacedHero | null =>
    getDraft()?.own.find((h) => h.id === selectedId) ?? null

  /** 整页重画：只在进本页时走一次。此后一切交互都走 refresh()——见它头上的那段说明 */
  const draw = (): void => {
    // 重绘不产生鼠标事件，浮层不会自己收——先手动收起，免得它挂着上一张卡的内容
    hideCardPop()
    const draft = getDraft()
    if (!draft) return
    const own = draft.own
    if (!own.some((h) => h.id === selectedId)) selectedId = own[0]?.id ?? null
    const selected = own.find((h) => h.id === selectedId) ?? null

    host.innerHTML = `
      ${subBarHtml('整备', back)}
      <main class="prep-page viewport-page" data-orient="${orientationOf(window.innerWidth, window.innerHeight)}">
        ${statusHtml(draft)}
        <div class="prep-stage">
          ${fieldHtml(own, selectedId)}
          ${sideHtml(catalog, selected)}
          ${footHtml(back, own, notice)}
        </div>
        ${picker && selected ? pickerHtml(catalog, profile, selected, picker, notice) : ''}
      </main>`
    hydrateArt(host)
    hydrateHeroArt(host)
    sideDrawn = selected?.id ?? null
    poolDrawn = picker && selected ? picker.tab : null
  }

  /**
   * 就地刷新：装卡/卸卡/调序/换人/换页签都走这条，**不重建整页 DOM**。
   *
   * 为什么不再整页重画（draw）：innerHTML 一换，卡池 21 张大图、右栏 8 张、立绘 8 张
   * 全成了新的 `<img>`，浏览器得重新解码（lazy 的还要重排），肉眼就是点一下闪一下；
   * 顺带弹窗里卡池的滚动位置被顶回顶部。而一次「选卡」真正变的只有三处——右栏摘要
   * 里那几格、弹窗两块槽里那几格、卡池每张卡右上角的 ✓ 与置灰。就地改这三处，其余
   * 的 `<img>` 一个都不动；回执文案与页签计数同理，只改文本与类名。
   *
   * 逐格对账的实现在 patchBoard / patchSide / patchPicker 里；它们返回「换没换节点」，
   * 换过才收卡面详情浮层（浮层锚在被换掉的那个节点上，不换就别动它）。
   */
  const refresh = (): void => {
    const draft = getDraft()
    if (!draft) return
    const own = draft.own
    if (!own.some((h) => h.id === selectedId)) selectedId = own[0]?.id ?? null
    const selected = own.find((h) => h.id === selectedId) ?? null
    // 名册里没这个人了（理论上进不来）：弹窗开着就先摘掉，免得它挂着一个不存在的人
    if (!selected) {
      host.querySelector('.prep-picker')?.remove()
      picker = null
      poolDrawn = null
    }

    let swapped = patchBoard(host, own, selectedId)
    if (selected) {
      if (patchSide(host, catalog, selected, sideDrawn)) swapped = true
      sideDrawn = selected.id
      if (picker) {
        if (patchPicker(host, catalog, profile, selected, picker, notice, poolDrawn)) swapped = true
        poolDrawn = picker.tab
      }
    }
    patchFoot(host, statusText(own, notice))
    if (swapped) hideCardPop()
  }

  // ---------- 编辑动作 ----------

  const applyHero = (fn: (h: Hero) => Hero): void => {
    const hero = currentHero()
    if (!hero) return
    const next = fn(hero)
    if (next === hero) {
      notice = '该操作无效：槽位已满或该卡已在槽中'
      refresh()
      return
    }
    patchOwnHero(hero.id, next)
    notice = ''
    refresh()
  }

  /**
   * 整体置换名册：mutator 返回的是原数组即视为未生效（目标路已满 / id 不存在），只提示不落库。
   * 摆位改动一律走这里。选中态**不清**——右栏总得展示一个人（点它＝换右栏展示谁），
   * 而且摆位只改坐标、人还在，接着编他的技能是常态。
   */
  const edit = (mutator: (own: readonly PlacedHero[]) => PlacedHero[]): void => {
    const draft = getDraft()
    if (!draft) return
    const next = mutator(draft.own)
    if (next === draft.own) {
      notice = '这步无效：目标路已满，或该英雄不在场上'
      refresh()
      return
    }
    setOwn(next)
    notice = ''
    refresh()
  }

  /** 点棋盘上的立绘：换右栏展示谁。换位只走拖拽（见 wireDrag 的 drop） */
  const showHero = (id: string): void => {
    if (!getDraft()?.own.some((h) => h.id === id)) return
    selectedId = id
    notice = ''
    refresh() // 棋盘只翻 .sel，一张立绘都不换（换人不是换图）
  }

  /** 点空格：与拖拽落到同一格是同一条路径（meta/formation 的 moveHeroTo），语义不会两套 */
  const onCellClick = (lane: string, index: number): void => {
    if (!selectedId) return
    edit((own) => moveHeroTo(own, selectedId as string, lane, index))
  }

  // ---------- 技能弹窗 ----------

  /**
   * 开弹窗：只往 .prep-page 尾巴上插一个 .prep-picker，整页其余部分一动不动
   * （原先走 draw()，为了开一个弹窗把 8 张立绘也重画了一遍）。位置与 draw() 里一致——
   * .prep-page 的最后一个子元素。
   */
  const openPicker = (kind: SlotKind): void => {
    picker = { kind, tab: kind }
    notice = ''
    const hero = currentHero()
    const page = host.querySelector('.prep-page')
    if (hero && page) page.insertAdjacentHTML('beforeend', pickerHtml(catalog, profile, hero, picker, notice))
    const node = host.querySelector<HTMLElement>('.prep-picker')
    if (node) {
      hydrateArt(node)
      node.focus({ preventScroll: true })
    }
    poolDrawn = picker.tab
    const draft = getDraft()
    if (draft) patchFoot(host, statusText(draft.own, notice))
  }

  /** 关掉：把那个节点摘了就是；焦点还给点开它的那一格，键盘/读屏不至于掉到页首 */
  const closePicker = (): void => {
    if (!picker) return
    const { kind } = picker
    picker = null
    poolDrawn = null
    host.querySelector('.prep-picker')?.remove()
    hideCardPop() // 浮层挂在 body 上，弹窗摘了它不会自己收
    host.querySelector<HTMLElement>(`[data-pp-open="${kind}"]`)?.focus({ preventScroll: true })
  }

  // ---------- 拖拽 ----------
  // 挂一次就够：事件委托在 host 上，回调每次现读草稿，故 draw() 重建 DOM 不影响它。
  // 落点高亮只改 class、不重画，避免拖到一半被换掉的元素吃掉指针捕获。
  // 技能槽搬进弹窗后选择器一个字没变——弹窗也在 host 内，所以这套委托照样认。

  const wireDrag = (): void => {
    enableDrag<DragPayload>(host, {
      grab: (el) => {
        if (el.closest('.slot-op')) return null // 槽上的 ✕ 是按钮，别当拖源
        const tile = el.closest<HTMLElement>('.prep-board .tile[data-hero]')
        const id = tile?.dataset.hero
        if (tile && id) return { payload: { kind: 'hero', id }, source: tile }
        const slot = el.closest<HTMLElement>('.slot.draggable')
        const at = slot?.dataset.slot
        return slot && at ? { payload: { kind: 'slot', at }, source: slot } : null
      },
      resolveDrop: (el, p) => {
        if (p.kind === 'hero') return el.closest<HTMLElement>('.prep-board .tile')
        const slot = el.closest<HTMLElement>('.slot[data-slot]')
        if (!slot) return null
        // 同侧槽才亮：拖着主动卡扫过被动槽时不该给「这儿能放」的错觉
        return split2(p.at)[0] === split2(slot.dataset.slot ?? '')[0] ? slot : null
      },
      drop: (el, p) => {
        if (p.kind === 'hero') {
          const onto = el.dataset.hero
          if (onto) {
            edit((own) => swapHeroes(own, p.id, onto)) // 落到别人身上 → 交换（换位唯一的一条路）
          } else {
            edit((own) => moveHeroTo(own, p.id, el.dataset.lane ?? '', Number(el.dataset.index ?? 0)))
          }
          return
        }
        const [fk, fi] = split2(p.at)
        const [tk, ti] = split2(el.dataset.slot ?? '')
        // 同侧才收：主动卡进不了被动槽（两类卡本来也不相通，这里只是把话说死）
        if (!isSlotKind(fk) || fk !== tk) return
        const hero = getDraft()?.own.find((h) => h.id === selectedId)
        if (!hero) return
        const ids = fk === 'active' ? hero.activeSkillIds : hero.passiveSkillIds
        if (ids.length === 0) return
        const from = Number(fi)
        // 空槽（下标 >= 已有张数）就是「放到最后」，与格子里看得出来的一致
        const to = Math.min(Number(ti), ids.length - 1)
        if (from === to) return
        applyHero((h) => moveSlot(h, fk, from, to))
      },
    })
  }

  // ---------- 事件 ----------
  // 一律委托到 host 上，**一次挂好跨 refresh() 存活**。为什么必须委托：refresh() 会就地
  // 换掉个别 .sk-tile（装/卸卡时那一格真变了），换上去的新节点没有监听器——逐个挂的写法
  // 只能靠整页重画才不脱钩，而整页重画正是闪烁的来源。路由复用同一个 host 元素，所以
  // 前后两次进本页会各挂一份，先摘掉上一次的（AbortController，照 drag.ts/hover.ts 的幂等范式）。

  /**
   * 点击：从最内层往外认。次序要紧——✕ 那颗卸卡键嵌在「整格点开弹窗」的 .sk-tile 里，
   * 先认它才不会顺手把弹窗也打开。
   */
  const onClick = (e: MouseEvent): void => {
    const target = e.target as HTMLElement | null
    const hit = (sel: string): HTMLElement | null => target?.closest<HTMLElement>(sel) ?? null

    const unq = hit('[data-unequip]')
    if (unq) {
      const [kind, idx] = split2(unq.dataset.unequip ?? '')
      applyHero((h) => unequipSkill(h, kind as SlotKind, Number(idx)))
      return
    }
    const eq = hit('[data-equip]')
    if (eq) {
      const hero = currentHero()
      if (!hero) return
      const [kind, cardId] = split2(eq.dataset.equip ?? '')
      const pool = skillPoolOf(catalog, hero, profile)
      applyHero((h) => equipSkill(h, kind as SlotKind, cardId, pool))
      return
    }
    const tab = hit('[data-pp-tab]')
    if (tab) {
      if (!picker) return
      picker = { kind: picker.kind, tab: tab.dataset.ppTab as SlotKind }
      notice = ''
      refresh() // 只有卡池那半块要重建，槽与整页都不动
      return
    }
    const close = hit('[data-pp-close]')
    if (close) {
      // 背景只在点到它自己时才关（弹窗里的点击冒泡上来不算）
      if (close.classList.contains('pp-backdrop') && e.target !== close) return
      closePicker()
      return
    }
    const open = hit('[data-pp-open]')
    if (open) {
      openPicker(open.dataset.ppOpen as SlotKind)
      return
    }
    // 棋盘上的立绘＝请到右栏；空位＝把右栏展示的人挪过去（与拖拽落到那格同一条路径）
    const tile = hit('.prep-board .tile')
    if (!tile) return
    if (tile.dataset.hero) showHero(tile.dataset.hero)
    else onCellClick(tile.dataset.lane ?? '', Number(tile.dataset.index ?? 0))
  }

  /** 键盘 Enter/Space 与点击同效（棋盘上的立绘与空位都是按钮，键盘得能编） */
  const onKey = (e: KeyboardEvent): void => {
    if (e.key !== 'Enter' && e.key !== ' ') return
    const el = (e.target as HTMLElement | null)?.closest<HTMLElement>('.prep-board .tile, [data-pp-open]')
    if (!el) return
    e.preventDefault()
    if (el.dataset.hero) showHero(el.dataset.hero)
    else if (el.dataset.ppOpen) openPicker(el.dataset.ppOpen as SlotKind)
    else onCellClick(el.dataset.lane ?? '', Number(el.dataset.index ?? 0))
  }

  if (escHandler) window.removeEventListener('keydown', escHandler)
  escHandler = (e) => {
    if (e.key === 'Escape' && picker) {
      e.preventDefault()
      closePicker()
    }
  }
  window.addEventListener('keydown', escHandler)
  wireDrag()
  hookOrient()
  wireAbort?.abort()
  const ac = new AbortController()
  wireAbort = ac
  host.addEventListener('click', onClick, { signal: ac.signal })
  host.addEventListener('keydown', onKey, { signal: ac.signal })
  // 委托挂在 host 上，一次即可，能跨 refresh() 的就地换节点存活（同 wireDrag）
  enableHoverCard(host, {
    resolve: (el) => el.closest<HTMLElement>('.card-face'),
    render: (face) => (face.dataset.card ? cardDetailHtml(catalog, face.dataset.card) : null),
  })
  draw()
}

// ---------- 渲染片段 ----------

/** 页眉一行：模式/seed + 一句操作说明。提示与编队问题归右栏脚部的 .hs-status（离动作近） */
function statusHtml(draft: RosterDraft): string {
  const mode = draft.mode === 'online' ? '在线对战' : '人机对战'
  const text = `${mode} · seed ${draft.seed} · 拖动立绘换位，点技能格编卡`
  return `<p class="prep-status">${escapeHtml(text)}</p>`
}

function className(catalog: Catalog, hero: Hero): string {
  return catalog.classDefs.get(hero.classId)?.name ?? hero.classId
}

function cardName(catalog: Catalog, id: string): string {
  return catalog.skillDefs.get(id)?.name ?? catalog.behaviorTemplates.get(id)?.name ?? id
}

function cardOf(
  catalog: Catalog,
  id: string,
  kind: SlotKind,
  size: 'compact' | 'full',
  extra: Partial<CardFaceOpts> = {},
): string {
  const def = catalog.skillDefs.get(id)
  const tpl = catalog.behaviorTemplates.get(id)
  return cardFaceHtml({
    cardId: id,
    name: cardName(catalog, id),
    rarity: def?.rarity ?? tpl?.rarity,
    pathwayId: def?.pathwayId ?? tpl?.pathwayId,
    kind,
    cost: def?.cost?.energy,
    size,
    ...extra,
  })
}

/**
 * 阵型盘里的一格。单独拎出来是为了让 refresh() 只换真变了的那一两格（挪人/换位），
 * 不必整块重画——重画会把 8 张立绘全换成新 `<img>`，拖一下闪一下。
 */
function cellHtml(
  hero: PlacedHero | undefined,
  li: number,
  index: number,
  lane: string,
  selectedId: string | null,
): string {
  const at = `--lane:${li};--idx:${index}`
  // 名字/说明一律走 aria-label，不用 title：title 会弹浏览器自带的黄框（与游戏自己那套
  // 卡面浮层撞在一起，观感很突兀）。aria-label 只喂读屏，屏幕上什么都不冒。
  if (hero) {
    return `<div class="tile own${hero.id === selectedId ? ' sel' : ''}" style="${at}" data-hero="${escapeHtml(hero.id)}" role="button" tabindex="0" aria-label="${escapeHtml(hero.name)}">${heroPortraitHtml(hero)}</div>`
  }
  // 空位的说明原来只写在 title 里，而状态行在竖屏塞不下这句（实测 360/375/390 都截断），
  // 于是落到格子自己身上：一个「＋」就地说明「点这儿放人」。
  return `<div class="tile empty" style="${at}" data-cell="1" data-lane="${escapeHtml(lane)}" data-index="${index}" role="button" tabindex="0" aria-label="把右栏展示的英雄移到这里"><span class="tile-plus" aria-hidden="true">＋</span></div>`
}

/**
 * 阵型盘＝左边那块「布局场景」。格子里只有英雄立绘本身、没有外框也没有名字/职业/站位文字
 * （信息归右栏名条），空位留一个细虚线框示意「这里能放人」。
 * 落位不在这里算：瓦片只带 `--lane / --idx`，两套 grid 模板写在 CSS 里按 data-orient 切，
 * 所以旋转只翻那个属性、不重绘（映射与 projection.ts 逐字一致：竖屏 lane 管列、idx 管行且
 * idx 0 在最上；横屏反过来、且 idx 0 在最右＝靠中线）。
 */
function fieldHtml(own: readonly PlacedHero[], selectedId: string | null): string {
  const cells: string[] = []
  for (let li = 0; li < LANE_COUNT; li += 1) {
    const lane = LANES[li] as string
    for (let index = 0; index < LANE_CAPACITY; index += 1) {
      cells.push(cellHtml(own.find((h) => h.coordinate.lane === lane && h.coordinate.index === index), li, index, lane, selectedId))
    }
  }
  return `<section class="prep-field"><div class="board-wrap"><div class="board prep-board">${cells.join('')}</div></div></section>`
}

/**
 * 右栏：名条 + 主动/被动两行技能槽。类名一律用展示台那套（.hs-side/.hs-head/.hs-meta）：
 * 名字金色 15px、小字 11.5px 暗色、整栏 justify-content:center 的垂直居中，全由它们给。
 * 展示台名条右侧还有主动/被动切换，整备页两行都常驻、不需要它，所以没那个 .hs-switch。
 */
function sideHtml(catalog: Catalog, hero: PlacedHero | null): string {
  if (!hero) return '<div class="hs-side"><p class="hint">名册为空，没有可编的英雄。</p></div>'
  return `<div class="hs-side">${sideInnerHtml(catalog, hero)}</div>`
}

/** 名条第二行：职业 · 体质 · 力/敏/智 · 站位。会随挪人变，所以单独拎出来给 refresh() 补文本 */
function metaText(catalog: Catalog, hero: PlacedHero): string {
  const con = constitutionById(hero.constitutionId)?.name ?? hero.constitutionId
  const coord = `${laneLabel(hero.coordinate.lane)}${hero.coordinate.index + 1}`
  return `${className(catalog, hero)} · ${con} · ${hero.combo.strength}力 / ${hero.combo.agility}敏 / ${hero.combo.intelligence}智 · ${coord}`
}

function sideInnerHtml(catalog: Catalog, hero: PlacedHero): string {
  return `<div class="hs-head">
      <div class="hs-meta">
        <b>${escapeHtml(hero.name)}</b>
        <small>${escapeHtml(metaText(catalog, hero))}</small>
      </div>
    </div>
    <div class="prep-skills">${KINDS.map((kind) => skillRowHtml(catalog, hero, kind)).join('')}</div>`
}

/**
 * 脚：只剩主按钮。常显的那句「编队合法」按主人要求撤了，只在真有问题时冒一行 warn
 * （无效操作的回执、编队不合法）——上战场前发现编不了队，比常显一句废话有用。
 * 排法照「新游戏」页：主按钮带 cg-btn--block 独占一行，横屏由那套共用规则摊到那排右侧收尾。
 *
 * 状态行**常驻**（没问题时是空的）：横屏的脚占多高，右栏 .hs-side 就有多高，而技能卡是按
 * 右栏高度倒推的——脚一高一矮，三页来回切时整块技能区就换一档大小、位置也跟着跳。
 * 脚的总高现在由 app.css 横屏那条共用规则钉死（三页同一个 min-height），这条只负责
 * 「状态行别缩掉」；空着时的高度由 CSS 给（竖屏则整行撤掉，那点高度让给棋盘），
 * 所以标签之间**不能留空白**，竖屏那条规则用的是 :empty。
 */
function footHtml(back: string, own: readonly PlacedHero[], notice: string): string {
  const warn = statusText(own, notice)
  return `<div class="hs-foot">
    <p class="hs-status${warn ? ' warn' : ''}">${warn ? escapeHtml(warn) : ''}</p>
    <a class="cg-btn cg-btn--primary cg-btn--block" href="${back}">完成</a>
  </div>`
}

/** 脚上那行字：无效操作的回执优先，其次编队问题，都没有就是空串（空着一行由 CSS 撑高） */
function statusText(own: readonly PlacedHero[], notice: string): string {
  const errors = validateFormation(own)
  return notice || (errors.length > 0 ? `编队问题：${errors.join(' / ')}` : '')
}

/** 只改那行字与 .warn：文本没变就一个节点都不动（空串时元素仍空着，竖屏的 :empty 才认得出） */
function patchFoot(host: HTMLElement, warn: string): void {
  const el = host.querySelector<HTMLElement>('.hs-foot .hs-status')
  if (!el) return
  if (el.textContent !== warn) el.textContent = warn
  el.classList.toggle('warn', !!warn)
}

/** 摘要行里的一格：整格是弹窗入口（含空槽的 ＋），右上角的 ✕ 卸下这张。槽位/卡名的说明走
 *  aria-label（原来那两颗 title 悬停会弹原生黄框，跟卡面浮层叠在一起很吵） */
function summaryTileHtml(catalog: Catalog, kind: SlotKind, i: number, id: string | undefined): string {
  const open = `role="button" tabindex="0" data-pp-open="${kind}"`
  if (!id) {
    return `<div class="sk-tile empty" ${open} aria-label="第 ${i + 1} 槽 · 空，点它选卡"><span class="sk-num">${i + 1}</span><span class="sk-plus">＋</span></div>`
  }
  return `<div class="sk-tile" ${open} aria-label="第 ${i + 1} 槽 · ${escapeHtml(cardName(catalog, id))}，点它编卡">
      <span class="sk-num">${i + 1}</span>
      ${cardOf(catalog, id, kind, 'compact')}
      <button type="button" class="cg-btn cg-btn--danger slot-op" data-unequip="${kind}:${i}" aria-label="卸下">✕</button>
    </div>`
}

function skillRowHtml(catalog: Catalog, hero: PlacedHero, kind: SlotKind): string {
  const ids = kind === 'active' ? hero.activeSkillIds : hero.passiveSkillIds
  const tiles: string[] = []
  for (let i = 0; i < SLOT_LIMIT[kind]; i += 1) tiles.push(summaryTileHtml(catalog, kind, i, ids[i]))

  // 行末不再挂「已装/上限」的计数：那一列要从行的可用宽里扣，横屏本就吃紧，
  // 扣掉的那一档正是技能卡被缩小的原因。要看装了几张，弹窗页签上写着。
  // data-kind：refresh() 据此找行（弹窗那边的槽行也挂着同一个属性）。
  return `<div class="sk-row" data-kind="${kind}">
    <span class="sk-tag">${SLOT_LABEL[kind]}</span>
    <div class="sk-tiles">${tiles.join('')}</div>
  </div>`
}

/**
 * 技能弹窗：上半是两侧的槽（可拖拽调序），下半是卡池（页签切主动/被动，内部滚动）。
 * 挂在 .prep-page 里而不是 document.body——见文件头那两条理由。
 */
function pickerHtml(catalog: Catalog, profile: Profile, hero: PlacedHero, picker: PickerState, notice: string): string {
  const tabs = KINDS.map(
    (kind) =>
      `<button type="button" class="cg-select${kind === picker.tab ? ' is-on' : ''}" data-pp-tab="${kind}">${SLOT_LABEL[kind]}<span class="pp-tab-n">${countOf(hero, kind)}/${SLOT_LIMIT[kind]}</span></button>`,
  ).join('')

  return `<div class="prep-picker" role="dialog" aria-modal="true" aria-label="技能编成" tabindex="-1">
    <div class="pp-backdrop" data-pp-close></div>
    <div class="pp-dialog">
      <div class="pp-head">
        <h3>技能 <small>${escapeHtml(hero.name)} · ${escapeHtml(className(catalog, hero))}</small></h3>
        <button type="button" class="cg-close" data-pp-close aria-label="关闭">${icon('cg-close')}</button>
      </div>
      <div class="pp-body">
        <div class="pp-slots">
          ${KINDS.map((kind) => slotRowHtml(catalog, hero, kind)).join('')}
        </div>
        <div class="pp-pool-wrap">
          <div class="pp-tabs">${tabs}</div>
          <p class="pp-notice${notice ? ' warn' : ''}" id="pp-notice">${escapeHtml(notice || slotTip(picker.tab))}</p>
          <div class="pp-pool cg-scroll">${poolHtml(catalog, profile, hero, picker.tab)}</div>
        </div>
      </div>
    </div>
  </div>`
}

function countOf(hero: PlacedHero, kind: SlotKind): number {
  return (kind === 'active' ? hero.activeSkillIds : hero.passiveSkillIds).length
}

/**
 * 卡池那半块：整侧没卡就一句提示，否则是 .pool-grid 那一板。
 * 切页签要整块换（本来就换一批卡），所以单独拎出来给 refresh() 复用；
 * 装/卸卡只翻每张卡的 ✓ 与置灰，走 patchPool，不碰这里的 HTML。
 */
function poolHtml(catalog: Catalog, profile: Profile, hero: PlacedHero, tab: SlotKind): string {
  const ids = skillPoolOf(catalog, hero, profile)[tab]
  if (ids.length === 0) return '<p class="hint">该职业此区暂无可用卡。</p>'
  const equipped = new Set(tab === 'active' ? hero.activeSkillIds : hero.passiveSkillIds)
  const full = equipped.size >= SLOT_LIMIT[tab]
  const cards = ids.map((id) => {
    const on = equipped.has(id)
    const off = !on && full
    // 槽满的卡用 aria-disabled + dim（不用 disabled）：disabled 收不到鼠标事件，卡面就 hover 不出
    // 详情浮层了，而槽满的卡恰恰是最想看清楚的。挡操作由 equipSkill 自己兜底（原样返回 → 提示一行）。
    return cardOf(catalog, id, tab, 'full', {
      as: 'button',
      attrs: `data-equip="${tab}:${escapeHtml(id)}"${off ? ' aria-disabled="true"' : ''}`,
      corner: on ? '✓' : '',
      dim: off,
    })
  }).join('')
  return `<div class="pool-grid">${cards}</div>`
}

/**
 * 槽行：序号 + 卡面 + ✕（空槽只剩序号与「＋」）。弹窗里主动/被动各一行；只有一张时不可拖（没顺序可调）。
 * 外观与整备页的摘要行（skillRowHtml）**逐条同值**：同一套 .sk-row / .sk-tag / .sk-tiles / .sk-tile /
 * .sk-num / .sk-plus，连 ✕ 那颗叠在卡右上角的卸卡键都是同一个 .slot-op。两处只在「按下整格干什么」上分家：
 * 摘要行整格是入口（data-pp-open 点开弹窗），这里整格用来拖（.draggable + data-slot）。改外观请改 .sk-* 那一份。
 */
/** 弹窗槽行里的一格：整格可拖（只有一张时不拖——没顺序可调），右上角的 ✕ 卸下这张 */
function slotTileHtml(catalog: Catalog, kind: SlotKind, i: number, id: string | undefined, draggable: boolean): string {
  if (!id) {
    return `<div class="sk-tile slot empty" data-slot="${kind}:${i}"><span class="sk-num">${i + 1}</span><span class="sk-plus">＋</span></div>`
  }
  return `<div class="sk-tile slot${draggable ? ' draggable' : ''}" data-slot="${kind}:${i}">
      <span class="sk-num">${i + 1}</span>
      ${cardOf(catalog, id, kind, 'compact')}
      <button type="button" class="cg-btn cg-btn--danger slot-op" data-unequip="${kind}:${i}" aria-label="卸下">✕</button>
    </div>`
}

/**
 * 槽位顺序的说明。原先挂在「主动 / 被动」那个小标签的 title 上（悬停弹原生黄框），
 * 现在落到弹窗的提示行（.pp-notice）里——那一行平时就空着占位，正好当说明栏，
 * 出警告时警告顶掉它（警告比说明要紧）。
 */
function slotTip(kind: SlotKind): string {
  return kind === 'active'
    ? '按槽位顺序轮转释放，拖动可调序'
    : '同触发点多张时按槽位顺序发动，拖动可调序'
}

function slotRowHtml(catalog: Catalog, hero: PlacedHero, kind: SlotKind): string {
  const ids = kind === 'active' ? hero.activeSkillIds : hero.passiveSkillIds
  const draggable = ids.length > 1

  const slots: string[] = []
  for (let i = 0; i < SLOT_LIMIT[kind]; i += 1) slots.push(slotTileHtml(catalog, kind, i, ids[i], draggable))

  // 行里不再挂「已装/上限 · 说明」那行小字：标签归位成摘要行那种左侧小标签（说明挪到下面的
  // 提示行，见 slotTip），计数在下面的页签上（主动 3/4），省下的那一行在横屏弹窗里正好够两排槽都摊开。
  // data-kind：refresh() 据此找行（右栏的摘要行也挂着同一个属性）。
  return `<div class="sk-row slot-block" data-kind="${kind}">
    <span class="sk-tag">${SLOT_LABEL[kind]}</span>
    <div class="sk-tiles slot-row">${slots.join('')}</div>
  </div>`
}

/** data-* 里回来的都是字符串，落库前先认一下是不是有效的槽侧 */
function isSlotKind(k: string): k is SlotKind {
  return k === 'active' || k === 'passive'
}

/* ============================================================================
 * 就地刷新（refresh 用的那几件）：只对账真变了的那几格，尽量不动别的节点
 *
 * 一条铁律：**能靠类名/文本表达的状态就别换节点**。换节点等于换掉它那张 `<img>`，
 * 浏览器要重新解码，肉眼就是闪一下——棋盘的 .sel、卡池的 ✓/置灰都只翻类名。
 * 真换了节点（那一格换了张卡）才返回 true，好让调用方收起卡面详情浮层：
 * 浮层锚在被换掉的那个节点上，不换就不该动它。
 * ========================================================================== */

/**
 * 逐格对账一行槽：卡面 id 与可拖状态都没变的格子整颗留着。右栏的摘要行与弹窗的槽行共用
 * 这一份（两边的格子只差属性，HTML 由调用方给）。新换上去的节点不必重挂监听——事件在
 * host 上委托（见 mount 里的 onClick/onKey）。
 */
function patchRow(
  row: Element | null,
  ids: readonly string[],
  limit: number,
  canDrag: boolean,
  html: (i: number, id: string | undefined) => string,
): boolean {
  if (!row || row.children.length !== limit) return false
  const tiles = [...row.children] as HTMLElement[]
  let swapped = false
  for (let i = 0; i < limit; i += 1) {
    const el = tiles[i] as HTMLElement
    const shown = el.querySelector('.card-face')?.getAttribute('data-card') ?? ''
    const wantDrag = canDrag && !!ids[i]
    if (shown === (ids[i] ?? '') && el.classList.contains('draggable') === wantDrag) continue
    const box = document.createElement('div')
    box.innerHTML = html(i, ids[i])
    const next = box.firstElementChild as HTMLElement
    el.replaceWith(next)
    hydrateArt(next)
    swapped = true
  }
  return swapped
}

/**
 * 棋盘的逐格对账，两条路径共用：换右栏展示谁时只有 .sel 翻身（一张立绘都不换，换人不是换图）；
 * 挪人/换位时只有真变了的那两格换节点（重画整块会把 8 张立绘全换成新图，拖一下闪一下，
 * 而拖完那一下指针正好还压在原地上）。
 */
function patchBoard(host: HTMLElement, own: readonly PlacedHero[], selectedId: string | null): boolean {
  const board = host.querySelector('.prep-board')
  if (!board || board.children.length !== LANE_COUNT * LANE_CAPACITY) return false
  const cells = [...board.children] as HTMLElement[]
  let swapped = false
  let k = 0
  for (let li = 0; li < LANE_COUNT; li += 1) {
    const lane = LANES[li] as string
    for (let index = 0; index < LANE_CAPACITY; index += 1) {
      const el = cells[k] as HTMLElement
      k += 1
      const hero = own.find((h) => h.coordinate.lane === lane && h.coordinate.index === index)
      if ((el.dataset.hero ?? '') === (hero?.id ?? '')) {
        el.classList.toggle('sel', !!hero && hero.id === selectedId)
        continue
      }
      const box = document.createElement('div')
      box.innerHTML = cellHtml(hero, li, index, lane, selectedId)
      const next = box.firstElementChild as HTMLElement
      el.replaceWith(next)
      hydrateHeroArt(next)
      swapped = true
    }
  }
  return swapped
}

/**
 * 右栏：还是同一个人就只对账两行摘要 + 补名条里那行会变的字（站位随挪人变）；
 * 换了人才整块重建（换的是别人的卡，本来就都得换）。返回「换过节点没有」。
 */
function patchSide(host: HTMLElement, catalog: Catalog, hero: PlacedHero, drawnId: string | null): boolean {
  const side = host.querySelector<HTMLElement>('.hs-side')
  if (!side) return false
  if (drawnId !== hero.id) {
    side.innerHTML = sideInnerHtml(catalog, hero)
    hydrateArt(side)
    return true
  }
  const small = side.querySelector('.hs-head small')
  const meta = metaText(catalog, hero)
  if (small && small.textContent !== meta) small.textContent = meta
  let swapped = false
  for (const kind of KINDS) {
    const ids = kind === 'active' ? hero.activeSkillIds : hero.passiveSkillIds
    const row = side.querySelector(`.sk-row[data-kind="${kind}"] .sk-tiles`)
    if (patchRow(row, ids, SLOT_LIMIT[kind], false, (i, id) => summaryTileHtml(catalog, kind, i, id))) swapped = true
  }
  return swapped
}

/**
 * 弹窗：槽那两块逐格对账；页签计数与提示行只改文本/类名；卡池按页签说事——
 * 切了页签整块重建（本来就换一批卡），否则只翻每张卡的 ✓ 与置灰。
 */
function patchPicker(
  host: HTMLElement,
  catalog: Catalog,
  profile: Profile,
  hero: PlacedHero,
  picker: PickerState,
  notice: string,
  poolDrawn: SlotKind | null,
): boolean {
  const root = host.querySelector<HTMLElement>('.prep-picker')
  if (!root) return false
  let swapped = false

  for (const kind of KINDS) {
    const ids = kind === 'active' ? hero.activeSkillIds : hero.passiveSkillIds
    const canDrag = ids.length > 1
    const row = root.querySelector(`.pp-slots .sk-row[data-kind="${kind}"] .slot-row`)
    if (patchRow(row, ids, SLOT_LIMIT[kind], canDrag, (i, id) => slotTileHtml(catalog, kind, i, id, canDrag))) swapped = true
  }

  root.querySelectorAll<HTMLElement>('.pp-tabs [data-pp-tab]').forEach((el) => {
    const kind = el.dataset.ppTab as SlotKind
    el.classList.toggle('is-on', kind === picker.tab)
    const n = el.querySelector('.pp-tab-n')
    const text = `${countOf(hero, kind)}/${SLOT_LIMIT[kind]}`
    if (n && n.textContent !== text) n.textContent = text
  })

  // 平时这一行放的是当前页签的槽位说明（slotTip），有警告时警告顶掉它——两种写法都占着这一行，
  // 高度因此稳稳的，卡池不会被推得一跳一跳。
  const note = root.querySelector<HTMLElement>('.pp-notice')
  if (note) {
    const want = notice || slotTip(picker.tab)
    if (note.textContent !== want) note.textContent = want
    note.classList.toggle('warn', !!notice)
  }

  if (poolDrawn !== picker.tab) {
    const wrap = root.querySelector<HTMLElement>('.pp-pool')
    if (wrap) {
      wrap.innerHTML = poolHtml(catalog, profile, hero, picker.tab)
      hydrateArt(wrap)
      swapped = true
    }
  } else {
    patchPoolStates(host, hero, picker.tab)
  }
  return swapped
}

/**
 * 卡池每张卡的状态：✓ 角标与置灰/aria-disabled。卡面节点一个都不换——装不装这张卡
 * 只影响它的角标与透明度，`<img>` 保持原样就不会闪（这一条正是「选卡不闪」的大头：
 * 池子里 21 张都是 1152×1536 的大图）。
 */
function patchPoolStates(host: HTMLElement, hero: PlacedHero, tab: SlotKind): void {
  const grid = host.querySelector('.pp-pool .pool-grid')
  if (!grid) return
  const equipped = new Set(tab === 'active' ? hero.activeSkillIds : hero.passiveSkillIds)
  const full = equipped.size >= SLOT_LIMIT[tab]
  grid.querySelectorAll<HTMLElement>('.card-face').forEach((face) => {
    const on = equipped.has(face.dataset.card ?? '')
    const off = !on && full
    face.classList.toggle('dim', off)
    if (off) face.setAttribute('aria-disabled', 'true')
    else face.removeAttribute('aria-disabled')
    const corner = face.querySelector('.card-corner')
    if (on && !corner) face.insertAdjacentHTML('beforeend', '<span class="card-corner">✓</span>')
    else if (!on && corner) corner.remove()
  })
}

/** 'a:b:c' → ['a', 'b:c']（卡 id 不含英文冒号，但这样切更稳） */
function split2(s: string): [string, string] {
  const i = s.indexOf(':')
  return i < 0 ? [s, ''] : [s.slice(0, i), s.slice(i + 1)]
}
