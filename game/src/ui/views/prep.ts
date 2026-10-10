// 整备：出战前配置技能槽（4 主动 + 4 被动）与阵型（2 路 × 4 格）。人机/在线共用一套。
// 编辑写回出战草稿（ui/draft），开战/建房时照常从草稿读名册——内核与在线 wire 零改动。
import { escapeHtml, subBarHtml } from '../components/chrome'
import { avatarEmoji, cardFaceHtml, hydrateArt } from '../components/cardFace'
import { enableDrag } from '../drag'
import { getCatalog } from '../catalog'
import { loadProfile } from '../profile'
import { getDraft, patchOwnHero, rerollDraft, setOwn } from '../draft'
import {
  DEFAULT_LANES,
  autoFormation,
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
  type SkillPool,
  type SlotKind,
} from '../../meta/loadout'
import { gridSpec, laneIndexer, orientationOf } from '../battle/projection'
import { LANE_CAPACITY, LANE_COUNT } from '../../kernel/battle/types'
import type { Hero } from '../../meta/herogen'
import type { Profile } from '../../meta/progression'
import type { Catalog } from '../../kernel/catalog/types'

const LANES: readonly string[] = DEFAULT_LANES

/** 拖拽载荷：阵型里拖英雄 / 主动槽之间拖技能（被动槽顺序无语义，不做拖源也不收落点） */
type DragPayload = { kind: 'hero'; id: string } | { kind: 'slot'; at: string }

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

  const draw = (): void => {
    const draft = getDraft()
    if (!draft) return
    const own = draft.own
    if (!own.some((h) => h.id === selectedId)) selectedId = own[0]?.id ?? null
    const selected = own.find((h) => h.id === selectedId) ?? null
    const errors = validateFormation(own)

    host.innerHTML = `
      ${subBarHtml('整备', back)}
      <main class="prep">
        <p class="hint">${draft.mode === 'online' ? '在线对战' : '人机对战'} · seed ${draft.seed} · 改完点「完成」返回</p>
        ${formationHtml(own, selectedId)}
        ${errors.length > 0 ? `<p class="hint warn">编队问题：${escapeHtml(errors.join(' / '))}</p>` : ''}
        ${loadoutHtml(catalog, profile, own, selected)}
        <p class="hint ${notice ? 'warn' : ''}" id="prep-notice">${escapeHtml(notice || ' ')}</p>
        <div class="row-actions">
          <a class="btn primary" href="${back}">完成</a>
          <button type="button" class="btn" id="btn-auto">自动排列</button>
          <button type="button" class="btn" id="btn-reroll">重新生成英雄</button>
        </div>
      </main>`
    hydrateArt(host)
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

  // ---------- 拖拽 ----------
  // 挂一次就够：事件委托在 host 上，回调每次现读草稿，故 draw() 重建 DOM 不影响它。
  // 落点高亮只改 class、不重画，避免拖到一半被换掉的元素吃掉指针捕获。

  const wireDrag = (): void => {
    enableDrag<DragPayload>(host, {
      grab: (el) => {
        if (el.closest('.slot-op')) return null // 槽位上的 ◀▶✕ 是按钮，别当拖源
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
        const [kind] = split2(slot.dataset.slot ?? '')
        return kind === 'active' ? slot : null
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
        if (fk !== 'active' || fk !== tk) return
        const hero = getDraft()?.own.find((h) => h.id === selectedId)
        if (!hero || hero.activeSkillIds.length === 0) return
        const from = Number(fi)
        // 空槽（下标 >= 已有张数）就是「放到最后」，与格子里看得出来的一致
        const to = Math.min(Number(ti), hero.activeSkillIds.length - 1)
        if (from === to) return
        applyHero((h) => moveSlot(h, 'active', from, to))
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
    host.querySelectorAll<HTMLElement>('[data-unequip]').forEach((el) =>
      el.addEventListener('click', () => {
        const [kind, idx] = split2(el.dataset.unequip ?? '')
        applyHero((h) => unequipSkill(h, kind as SlotKind, Number(idx)))
      }),
    )
    host.querySelectorAll<HTMLElement>('[data-move]').forEach((el) =>
      el.addEventListener('click', () => {
        const [kind, rest] = split2(el.dataset.move ?? '')
        const [from, dir] = split2(rest)
        applyHero((h) => moveSlot(h, kind as SlotKind, Number(from), Number(from) + Number(dir)))
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

  wireDrag()
  draw()
}

// ---------- 渲染片段 ----------

function cardOf(catalog: Catalog, id: string): string {
  const def = catalog.skillDefs.get(id)
  const tpl = catalog.behaviorTemplates.get(id)
  return cardFaceHtml({ cardId: id, name: def?.name ?? tpl?.name ?? id, rarity: def?.rarity ?? tpl?.rarity, compact: true })
}

function formationHtml(own: readonly PlacedHero[], selectedId: string | null): string {
  const orientation = orientationOf(window.innerWidth, window.innerHeight)
  const portrait = orientation === 'portrait'
  const spec = gridSpec(orientation, 'A', laneIndexer(LANES))
  const cols = portrait ? LANE_COUNT : LANE_CAPACITY
  const rows = portrait ? LANE_CAPACITY : LANE_COUNT
  const rowShift = portrait ? LANE_CAPACITY : 0

  const cells: string[] = []
  for (let li = 0; li < LANE_COUNT; li += 1) {
    const lane = LANES[li] as string
    for (let index = 0; index < LANE_CAPACITY; index += 1) {
      const hero = own.find((h) => h.coordinate.lane === lane && h.coordinate.index === index)
      const p = spec.place({ faction: 'A', lane, index })
      const style = `grid-column:${p.col};grid-row:${p.row - rowShift}`
      if (hero) {
        cells.push(`<div class="tile own${hero.id === selectedId ? ' sel' : ''}" style="${style}" data-hero="${escapeHtml(hero.id)}" title="${escapeHtml(hero.name)}">
          <div class="avatar">${avatarEmoji(hero.constitutionId, hero.gender)}</div>
          <div class="tname">${escapeHtml(hero.name)}<span class="tclass">${escapeHtml(hero.classId)}</span></div>
          <div class="tpos">${escapeHtml(lane)} #${index + 1}</div>
        </div>`)
      } else {
        cells.push(`<div class="tile empty" style="${style}" data-cell="1" data-lane="${escapeHtml(lane)}" data-index="${index}" role="button" tabindex="0" title="把英雄拖到这里（或先点选英雄再点此格）"></div>`)
      }
    }
  }

  return `<section class="prep-sec">
    <h2>阵型 <small class="hint">拖动英雄：落到别人身上交换、落到空格移入（也可以点选）；#1 靠近中线</small></h2>
    <div class="board-wrap"><div class="board prep-board" style="grid-template-columns:repeat(${cols},1fr);grid-template-rows:repeat(${rows},1fr)">${cells.join('')}</div></div>
  </section>`
}

function loadoutHtml(catalog: Catalog, profile: Profile, own: readonly PlacedHero[], selected: PlacedHero | null): string {
  const strip = own
    .map(
      (h) => `<button type="button" class="hero-chip${h.id === selected?.id ? ' on' : ''}" data-select="${escapeHtml(h.id)}">
        <span class="chip-avatar">${avatarEmoji(h.constitutionId, h.gender)}</span>
        <span class="chip-name">${escapeHtml(h.name)}</span>
      </button>`,
    )
    .join('')

  if (!selected) {
    return `<section class="prep-sec"><h2>技能</h2><div class="hero-strip">${strip}</div><p class="hint">先选一名英雄。</p></section>`
  }

  const pool = skillPoolOf(catalog, selected, profile)
  return `<section class="prep-sec">
    <h2>技能 <small class="hint">${escapeHtml(selected.name)} · ${escapeHtml(selected.classId)}</small></h2>
    <div class="hero-strip">${strip}</div>
    ${slotRowHtml(catalog, selected, 'active')}
    ${slotRowHtml(catalog, selected, 'passive')}
    ${poolGridHtml(catalog, selected, pool, 'active')}
    ${poolGridHtml(catalog, selected, pool, 'passive')}
  </section>`
}

function slotRowHtml(catalog: Catalog, hero: PlacedHero, kind: SlotKind): string {
  const ids = kind === 'active' ? hero.activeSkillIds : hero.passiveSkillIds
  const limit = SLOT_LIMIT[kind]
  const tip = kind === 'active' ? '按槽位顺序轮转释放，拖动可调序' : '被动常驻，按触发点发动（顺序无影响）'

  const slots: string[] = []
  for (let i = 0; i < limit; i += 1) {
    const id = ids[i]
    if (!id) {
      slots.push(`<div class="slot empty" data-slot="${kind}:${i}"><span class="slot-num">${i + 1}</span><span class="slot-blank">空</span></div>`)
      continue
    }
    // ◀▶✕ 三格定死。首尾槽少一个箭头，若直接省掉按钮，槽宽会跟着在 2 / 3 个按钮之间跳，
    // ✕ 也会一行一个位置。用一个不可见占位顶住，槽宽与按钮位置就都稳了。
    const arrow = (dir: -1 | 1, show: boolean): string =>
      show
        ? `<button type="button" class="slot-op" data-move="${kind}:${i}:${dir}" title="${dir < 0 ? '前移' : '后移'}">${dir < 0 ? '◀' : '▶'}</button>`
        : `<button type="button" class="slot-op ghost" tabindex="-1" aria-hidden="true">${dir < 0 ? '◀' : '▶'}</button>`
    const ops = [
      arrow(-1, kind === 'active' && i > 0),
      arrow(1, kind === 'active' && i < ids.length - 1),
      `<button type="button" class="slot-op danger" data-unequip="${kind}:${i}" title="卸下">✕</button>`,
    ].join('')
    // 只有主动槽可拖：被动槽的次序在战斗里没有任何意义
    const draggable = kind === 'active' && ids.length > 1

    slots.push(`<div class="slot${draggable ? ' draggable' : ''}" data-slot="${kind}:${i}"><span class="slot-num">${i + 1}</span>${cardOf(catalog, id)}<div class="slot-ops">${ops}</div></div>`)
  }

  return `<div class="slot-block">
    <h3>${SLOT_LABEL[kind]}技能 <small class="hint">${ids.length}/${limit} · ${tip}</small></h3>
    <div class="slot-row">${slots.join('')}</div>
  </div>`
}

function poolGridHtml(catalog: Catalog, hero: PlacedHero, pool: SkillPool, kind: SlotKind): string {
  const equipped = new Set(kind === 'active' ? hero.activeSkillIds : hero.passiveSkillIds)
  const full = equipped.size >= SLOT_LIMIT[kind]

  const cards = pool[kind]
    .map((id) => {
      const on = equipped.has(id)
      const off = !on && full
      const flag = on ? '已装备' : off ? '槽位已满' : ''
      return `<button type="button" class="pool-card${on ? ' on' : ''}${off ? ' off' : ''}" data-equip="${kind}:${escapeHtml(id)}"${off ? ' disabled' : ''}>
        ${cardOf(catalog, id)}
        <span class="pool-flag">${flag}</span>
      </button>`
    })
    .join('')

  const body = pool[kind].length === 0 ? '<p class="hint">该职业此区暂无可用卡。</p>' : `<div class="pool-grid">${cards}</div>`
  return `<div class="slot-block">
    <h3>${SLOT_LABEL[kind]}卡池 <small class="hint">${pool[kind].length} 张</small></h3>
    ${body}
  </div>`
}

/** 'a:b:c' → ['a', 'b:c']（卡 id 不含英文冒号，但这样切更稳） */
function split2(s: string): [string, string] {
  const i = s.indexOf(':')
  return i < 0 ? [s, ''] : [s.slice(0, i), s.slice(i + 1)]
}
