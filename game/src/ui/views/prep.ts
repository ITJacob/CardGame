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
// 弹窗挂在 host 内、由 draw() 一起重画（不挂 document.body、不像 zoom.ts 那样另起一套）：
// ① drag.ts 的落点判定是 host.contains(raw)、hover.ts 的卡面详情也只在 host 内找 .card-face，
//    挂到 body 上这两样会静默失效；② 由 draw() 重画意味着点卡池装卡后弹窗保持打开且已刷新。
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
          ${footHtml(back, validateFormation(own), notice)}
        </div>
        ${picker && selected ? pickerHtml(catalog, profile, selected, picker, notice) : ''}
      </main>`
    hydrateArt(host)
    hydrateHeroArt(host)
    wire()
  }

  // ---------- 编辑动作 ----------

  const applyHero = (fn: (h: Hero) => Hero): void => {
    const draft = getDraft()
    if (!draft || !selectedId) return
    const hero = draft.own.find((h) => h.id === selectedId)
    if (!hero) return
    const next = fn(hero)
    if (next === hero) {
      notice = '该操作无效：槽位已满或该卡已在槽中'
      draw()
      return
    }
    patchOwnHero(hero.id, next)
    notice = ''
    draw()
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
      draw()
      return
    }
    setOwn(next)
    notice = ''
    draw()
  }

  /** 点棋盘上的立绘：换右栏展示谁。换位只走拖拽（见 wireDrag 的 drop） */
  const showHero = (id: string): void => {
    if (!getDraft()?.own.some((h) => h.id === id)) return
    selectedId = id
    notice = ''
    draw()
  }

  /** 点空格：与拖拽落到同一格是同一条路径（meta/formation 的 moveHeroTo），语义不会两套 */
  const onCellClick = (lane: string, index: number): void => {
    if (!selectedId) return
    edit((own) => moveHeroTo(own, selectedId as string, lane, index))
  }

  // ---------- 技能弹窗 ----------

  const openPicker = (kind: SlotKind): void => {
    picker = { kind, tab: kind }
    notice = ''
    draw()
    host.querySelector<HTMLElement>('.prep-picker')?.focus({ preventScroll: true })
  }

  /** 关掉只改状态、走同一套重绘；焦点还给点开它的那一格，键盘/读屏不至于掉到页首 */
  const closePicker = (): void => {
    if (!picker) return
    const { kind } = picker
    picker = null
    draw()
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

  /** 键盘 Enter/Space 与点击同效（棋盘上的立绘与空位都是按钮，键盘得能编） */
  const onActivate = (el: HTMLElement, act: () => void): void => {
    el.addEventListener('click', act)
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        act()
      }
    })
  }

  const wire = (): void => {
    // 棋盘上的立绘：点它就是把它请到右栏
    host.querySelectorAll<HTMLElement>('[data-hero]').forEach((el) =>
      onActivate(el, () => showHero(el.dataset.hero ?? '')),
    )
    host.querySelectorAll<HTMLElement>('[data-cell]').forEach((el) =>
      onActivate(el, () => onCellClick(el.dataset.lane ?? '', Number(el.dataset.index ?? 0))),
    )
    // 技能格：整格都是入口（含空槽的 ＋）
    host.querySelectorAll<HTMLElement>('[data-pp-open]').forEach((el) =>
      onActivate(el, () => openPicker(el.dataset.ppOpen as SlotKind)),
    )
    host.querySelectorAll<HTMLElement>('[data-pp-close]').forEach((el) =>
      el.addEventListener('click', (e) => {
        // 背景只在点到它自己时才关（弹窗里的点击冒泡上来不算）
        if (el.classList.contains('pp-backdrop') && e.target !== el) return
        closePicker()
      }),
    )
    host.querySelectorAll<HTMLElement>('[data-pp-tab]').forEach((el) =>
      el.addEventListener('click', () => {
        if (!picker) return
        picker = { kind: picker.kind, tab: el.dataset.ppTab as SlotKind }
        notice = ''
        draw()
      }),
    )
    host.querySelectorAll<HTMLElement>('[data-unequip]').forEach((el) =>
      el.addEventListener('click', (e) => {
        // 摘要格的 ✕ 嵌在「整格点开弹窗」的 .sk-tile 里，不拦住就会顺手把弹窗也打开
        e.stopPropagation()
        const [kind, idx] = split2(el.dataset.unequip ?? '')
        applyHero((h) => unequipSkill(h, kind as SlotKind, Number(idx)))
      }),
    )
    host.querySelectorAll<HTMLElement>('[data-equip]').forEach((el) =>
      el.addEventListener('click', () => {
        const [kind, cardId] = split2(el.dataset.equip ?? '')
        const hero = getDraft()?.own.find((h) => h.id === selectedId)
        if (!hero) return
        const pool = skillPoolOf(catalog, hero, profile)
        applyHero((h) => equipSkill(h, kind as SlotKind, cardId, pool))
      }),
    )
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
  // 委托挂在 host 上，一次即可，能跨 draw() 的整块重绘存活（同 wireDrag）
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
  return `<p class="prep-status" title="${escapeHtml(text)}">${escapeHtml(text)}</p>`
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
      const hero = own.find((h) => h.coordinate.lane === lane && h.coordinate.index === index)
      const at = `--lane:${li};--idx:${index}`
      if (hero) {
        cells.push(`<div class="tile own${hero.id === selectedId ? ' sel' : ''}" style="${at}" data-hero="${escapeHtml(hero.id)}" role="button" tabindex="0" title="${escapeHtml(hero.name)}">${heroPortraitHtml(hero)}</div>`)
      } else {
        cells.push(`<div class="tile empty" style="${at}" data-cell="1" data-lane="${escapeHtml(lane)}" data-index="${index}" role="button" tabindex="0" title="把英雄拖到这里（或点此格，把右栏展示的英雄移过来）"></div>`)
      }
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
  const con = constitutionById(hero.constitutionId)?.name ?? hero.constitutionId
  const coord = `${laneLabel(hero.coordinate.lane)}${hero.coordinate.index + 1}`
  return `<div class="hs-side">
    <div class="hs-head">
      <div class="hs-meta">
        <b>${escapeHtml(hero.name)}</b>
        <small>${escapeHtml(className(catalog, hero))} · ${escapeHtml(con)} · ${hero.combo.strength}力 / ${hero.combo.agility}敏 / ${hero.combo.intelligence}智 · ${escapeHtml(coord)}</small>
      </div>
    </div>
    <div class="prep-skills">${KINDS.map((kind) => skillRowHtml(catalog, hero, kind)).join('')}</div>
  </div>`
}

/**
 * 脚：只剩主按钮。常显的那句「编队合法」按主人要求撤了，脚里只在真有问题时冒一行 warn
 * （无效操作的回执、编队不合法）——上战场前发现编不了队，比常显一句废话有用。
 * 排法照「新游戏」页：主按钮带 cg-btn--block 独占一行，横屏由那套共用规则摊到那排右侧收尾。
 */
function footHtml(back: string, errors: readonly string[], notice: string): string {
  const warn = notice || (errors.length > 0 ? `编队问题：${errors.join(' / ')}` : '')
  return `<div class="hs-foot">
    ${warn ? `<p class="hs-status warn">${escapeHtml(warn)}</p>` : ''}
    <a class="cg-btn cg-btn--primary cg-btn--block" href="${back}">完成</a>
  </div>`
}

function skillRowHtml(catalog: Catalog, hero: PlacedHero, kind: SlotKind): string {
  const ids = kind === 'active' ? hero.activeSkillIds : hero.passiveSkillIds
  const limit = SLOT_LIMIT[kind]

  const tiles: string[] = []
  for (let i = 0; i < limit; i += 1) {
    const id = ids[i]
    const open = `role="button" tabindex="0" data-pp-open="${kind}"`
    if (!id) {
      tiles.push(`<div class="sk-tile empty" ${open} title="第 ${i + 1} 槽 · 空，点它选卡"><span class="sk-num">${i + 1}</span><span class="sk-plus">＋</span></div>`)
      continue
    }
    tiles.push(`<div class="sk-tile" ${open} title="第 ${i + 1} 槽 · ${escapeHtml(cardName(catalog, id))}">
      <span class="sk-num">${i + 1}</span>
      ${cardOf(catalog, id, kind, 'compact')}
      <button type="button" class="cg-btn cg-btn--danger slot-op" data-unequip="${kind}:${i}" title="卸下">✕</button>
    </div>`)
  }

  return `<div class="sk-row">
    <span class="sk-tag">${SLOT_LABEL[kind]}</span>
    <div class="sk-tiles">${tiles.join('')}</div>
    <span class="sk-count">${ids.length}/${limit}</span>
  </div>`
}

/**
 * 技能弹窗：上半是两侧的槽（可拖拽调序），下半是卡池（页签切主动/被动，内部滚动）。
 * 挂在 .prep-page 里而不是 document.body——见文件头那两条理由。
 */
function pickerHtml(catalog: Catalog, profile: Profile, hero: PlacedHero, picker: PickerState, notice: string): string {
  const pool = skillPoolOf(catalog, hero, profile)
  const equipped = new Set(picker.tab === 'active' ? hero.activeSkillIds : hero.passiveSkillIds)
  const full = equipped.size >= SLOT_LIMIT[picker.tab]

  const cards = pool[picker.tab]
    .map((id) => {
      const on = equipped.has(id)
      const off = !on && full
      // 槽满的卡用 aria-disabled + dim（不用 disabled）：disabled 收不到鼠标事件，卡面就 hover 不出
      // 详情浮层了，而槽满的卡恰恰是最想看清楚的。挡操作由 equipSkill 自己兜底（原样返回 → 提示一行）。
      return cardOf(catalog, id, picker.tab, 'full', {
        as: 'button',
        attrs: `data-equip="${picker.tab}:${escapeHtml(id)}"${off ? ' aria-disabled="true"' : ''}`,
        corner: on ? '✓' : '',
        dim: off,
      })
    })
    .join('')

  const tabs = KINDS.map((kind) => {
    const n = (kind === 'active' ? hero.activeSkillIds : hero.passiveSkillIds).length
    return `<button type="button" class="cg-select${kind === picker.tab ? ' is-on' : ''}" data-pp-tab="${kind}">${SLOT_LABEL[kind]}<span class="pp-tab-n">${n}/${SLOT_LIMIT[kind]}</span></button>`
  }).join('')

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
          <p class="pp-notice${notice ? ' warn' : ''}" id="pp-notice">${escapeHtml(notice || ' ')}</p>
          <div class="pp-pool cg-scroll">
            ${pool[picker.tab].length === 0 ? '<p class="hint">该职业此区暂无可用卡。</p>' : `<div class="pool-grid">${cards}</div>`}
          </div>
        </div>
      </div>
    </div>
  </div>`
}

/** 槽行：序号 + 卡面 + ✕（空槽只剩序号与「空」）。弹窗上下两侧各一行；只有一张时不可拖（没顺序可调） */
function slotRowHtml(catalog: Catalog, hero: PlacedHero, kind: SlotKind): string {
  const ids = kind === 'active' ? hero.activeSkillIds : hero.passiveSkillIds
  const limit = SLOT_LIMIT[kind]
  const tip = kind === 'active' ? '按槽位顺序轮转释放，拖动可调序' : '常驻；同一触发点上有多张时按槽位顺序发动，拖动可调序'

  const slots: string[] = []
  for (let i = 0; i < limit; i += 1) {
    const id = ids[i]
    if (!id) {
      slots.push(`<div class="slot empty" data-slot="${kind}:${i}"><span class="slot-num">${i + 1}</span><span class="slot-blank">空</span></div>`)
      continue
    }
    const draggable = ids.length > 1
    slots.push(`<div class="slot${draggable ? ' draggable' : ''}" data-slot="${kind}:${i}"><span class="slot-num">${i + 1}</span>${cardOf(catalog, id, kind, 'compact')}<div class="slot-ops"><button type="button" class="cg-btn cg-btn--danger slot-op" data-unequip="${kind}:${i}" title="卸下">✕</button></div></div>`)
  }

  return `<div class="slot-block">
    <h3>${SLOT_LABEL[kind]}技能 <small class="hint">${ids.length}/${limit} · ${tip}</small></h3>
    <div class="slot-row">${slots.join('')}</div>
  </div>`
}

/** data-* 里回来的都是字符串，落库前先认一下是不是有效的槽侧 */
function isSlotKind(k: string): k is SlotKind {
  return k === 'active' || k === 'passive'
}

/** 'a:b:c' → ['a', 'b:c']（卡 id 不含英文冒号，但这样切更稳） */
function split2(s: string): [string, string] {
  const i = s.indexOf(':')
  return i < 0 ? [s, ''] : [s.slice(0, i), s.slice(i + 1)]
}
