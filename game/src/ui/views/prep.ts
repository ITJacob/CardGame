// 整备：出战前配置技能槽（4 主动 + 4 被动）与阵型（2 路 × 4 格）。人机/在线共用一套。
// 编辑写回出战草稿（ui/draft），开战/建房时照常从草稿读名册——内核与在线 wire 零改动。
//
// 版式 = 一屏 + 弹窗（尺寸与落位见 app.css 的整备段）：页面钉在视口里、不出整页滚动——
// 阵型盘 / 英雄条 / 8 个技能槽摘要 / 动作行各占一格；21 + 13 张卡池收进弹窗，弹窗内部自己滚。
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
import { getDraft, patchOwnHero, rerollDraft, setOwn, type RosterDraft } from '../draft'
import {
  DEFAULT_LANES,
  autoFormation,
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
    const errors = validateFormation(own)

    host.innerHTML = `
      ${subBarHtml('整备', back)}
      <main class="prep-page viewport-page" data-orient="${orientationOf(window.innerWidth, window.innerHeight)}">
        ${statusHtml(draft, errors, notice)}
        <div class="prep-stage">
          ${fieldHtml(catalog, own, selectedId)}
          <div class="prep-side">
            ${heroStripHtml(own, selectedId)}
            ${skillSummaryHtml(catalog, selected)}
          </div>
        </div>
        <div class="row-actions">
          <a class="cg-btn cg-btn--primary" href="${back}">完成</a>
          <button type="button" class="cg-btn" id="btn-auto">自动排列</button>
          <button type="button" class="cg-btn" id="btn-reroll">重新生成英雄</button>
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
   * 摆位改动一律走这里，成功即清掉选中态——光标承诺的动作做完就收手。
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
    selectedId = null
    notice = ''
    draw()
  }

  const onHeroClick = (id: string): void => {
    notice = ''
    if (!selectedId) {
      selectedId = id
      draw()
      return
    }
    if (selectedId === id) {
      selectedId = null
      draw()
      return
    }
    const from = selectedId
    edit((own) => swapHeroes(own, from, id))
  }

  /** 点空格：与拖拽落到同一格是同一条路径（meta/formation 的 moveHeroTo），语义不会两套 */
  const onCellClick = (lane: string, index: number): void => {
    if (!selectedId) {
      notice = '先拖一名英雄到格子上，或点一名英雄再点空格'
      draw()
      return
    }
    const id = selectedId
    edit((own) => moveHeroTo(own, id, lane, index))
  }

  const autoArrange = (): void => {
    const draft = getDraft()
    if (!draft) return
    setOwn(autoFormation(draft.own, 'A'))
    selectedId = draft.own[0]?.id ?? null
    notice = ''
    draw()
  }

  const reroll = (): void => {
    const d = rerollDraft(catalog, profile)
    selectedId = d.own[0]?.id ?? null
    notice = ''
    draw()
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
            edit((own) => swapHeroes(own, p.id, onto)) // 落到别人身上 → 交换
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

  const wire = (): void => {
    host.querySelectorAll<HTMLElement>('[data-select]').forEach((el) =>
      el.addEventListener('click', () => {
        selectedId = el.dataset.select ?? null
        notice = ''
        draw()
      }),
    )
    host.querySelectorAll<HTMLElement>('[data-hero]').forEach((el) =>
      el.addEventListener('click', () => onHeroClick(el.dataset.hero ?? '')),
    )
    host.querySelectorAll<HTMLElement>('[data-cell]').forEach((el) => {
      const act = (): void => onCellClick(el.dataset.lane ?? '', Number(el.dataset.index ?? 0))
      el.addEventListener('click', act)
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          act()
        }
      })
    })
    // 技能格：整格都是入口（含空槽的 ＋），点键盘 Enter/Space 同效
    host.querySelectorAll<HTMLElement>('[data-pp-open]').forEach((el) => {
      const act = (): void => openPicker(el.dataset.ppOpen as SlotKind)
      el.addEventListener('click', act)
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          act()
        }
      })
    })
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
    host.querySelector('#btn-auto')?.addEventListener('click', autoArrange)
    host.querySelector('#btn-reroll')?.addEventListener('click', reroll)
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

/** 页眉一行：模式/seed 打底，有提示（或编队问题）就换成提示并转警示色。一行截断，不占第二行高度 */
function statusHtml(draft: RosterDraft, errors: readonly string[], notice: string): string {
  const info = `${draft.mode === 'online' ? '在线对战' : '人机对战'} · seed ${draft.seed} · 点技能格编卡，完成后返回`
  const text = notice || (errors.length > 0 ? `编队问题：${errors.join(' / ')}` : info)
  const warn = notice !== '' || errors.length > 0
  return `<p class="prep-status${warn ? ' warn' : ''}" id="prep-notice" title="${escapeHtml(text)}">${escapeHtml(text)}</p>`
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
 * 阵型盘。落位不在这里算：瓦片只带 `--lane / --idx`，两套 grid 模板写在 CSS 里按 data-orient 切，
 * 所以旋转只翻那个属性、不重绘（原来这里调 gridSpec 现算内联 grid-column/row，旋转后会错到重进页面为止）。
 * 映射与 projection.ts 逐字一致：竖屏 lane 管列、idx 管行（idx 0 在最上）；横屏反过来、且 idx 0 在最右（靠中线）。
 */
function fieldHtml(catalog: Catalog, own: readonly PlacedHero[], selectedId: string | null): string {
  const cells: string[] = []
  for (let li = 0; li < LANE_COUNT; li += 1) {
    const lane = LANES[li] as string
    for (let index = 0; index < LANE_CAPACITY; index += 1) {
      const hero = own.find((h) => h.coordinate.lane === lane && h.coordinate.index === index)
      const at = `--lane:${li};--idx:${index}`
      if (hero) {
        cells.push(`<div class="tile own${hero.id === selectedId ? ' sel' : ''}" style="${at}" data-hero="${escapeHtml(hero.id)}" title="${escapeHtml(hero.name)}">
          <div class="avatar">${heroPortraitHtml(hero)}</div>
          <div class="tname">${escapeHtml(hero.name)}<span class="tclass">${escapeHtml(className(catalog, hero))}</span></div>
          <div class="tpos">${escapeHtml(laneLabel(lane))} ${index + 1}</div>
        </div>`)
      } else {
        cells.push(`<div class="tile empty" style="${at}" data-cell="1" data-lane="${escapeHtml(lane)}" data-index="${index}" role="button" tabindex="0" title="把英雄拖到这里（或先点选英雄再点此格）"></div>`)
      }
    }
  }

  return `<section class="prep-field">
    <h2 class="prep-field__title">阵型 <small>拖动英雄：落到别人身上交换、落到空格移入（也可点选）· 1 号位靠中线</small></h2>
    <div class="board-wrap"><div class="board prep-board">${cells.join('')}</div></div>
  </section>`
}

/** 英雄条：5 个立绘小格，点谁就把技能摘要切到谁（名字在摘要标题里，格子上不重复写） */
function heroStripHtml(own: readonly PlacedHero[], selectedId: string | null): string {
  const chips = own
    .map(
      (h) => `<button type="button" class="cg-select hero-chip${h.id === selectedId ? ' is-on' : ''}" data-select="${escapeHtml(h.id)}" title="${escapeHtml(h.name)}" aria-label="${escapeHtml(h.name)}">
        <span class="chip-avatar">${heroPortraitHtml(h)}</span>
      </button>`,
    )
    .join('')
  return `<div class="prep-heroes" role="group" aria-label="名册">${chips}</div>`
}

/** 技能摘要：主动 / 被动各一行 4 格。整格点开弹窗编这一侧，格子上的 ✕ 卸下这张 */
function skillSummaryHtml(catalog: Catalog, selected: PlacedHero | null): string {
  if (!selected) return '<div class="prep-skills"><p class="hint">名册为空，没有可编的英雄。</p></div>'
  return `<div class="prep-skills">
    <div class="prep-skills__head">
      <b>${escapeHtml(selected.name)}</b><small>${escapeHtml(className(catalog, selected))}</small>
      <span class="hint">点格子编卡</span>
    </div>
    ${KINDS.map((kind) => skillRowHtml(catalog, selected, kind)).join('')}
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
