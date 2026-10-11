// 现有卡池：解锁职业 / 锁定卡牌。左职业列表，右该职业卡面网格。
// 交互：点卡面 = 放大居中看大图（大图上 hover 出详情）；hover 时右上角浮出锁标，点锁标
// 才是锁定/解锁。详情浮层（hover 卡面 450ms）保留。
import { subBarHtml, escapeHtml } from '../components/chrome'
import { icon } from '../components/icons'
import { cardDetailHtml, cardFaceHtml, hydrateArt } from '../components/cardFace'
import { enableHoverCard, hideCardPop } from '../hover'
import { hideCardZoom, openCardZoom } from '../zoom'
import { getCatalog } from '../catalog'
import { loadProfile, saveProfile } from '../profile'
import { availableCardSet, toggleCardUnlock, toggleClassUnlock } from '../../meta/progression'
import type { Catalog } from '../../kernel/catalog/types'

export function renderCards(host: HTMLElement, arg: string): void {
  host.innerHTML = `${subBarHtml('现有卡池')}<main class="placeholder"><p>正在加载卡池…</p></main>`
  getCatalog()
    .then((catalog) => draw(host, catalog, arg))
    .catch((e: unknown) => {
      host.innerHTML = `${subBarHtml('现有卡池')}<main class="placeholder"><h1>加载失败</h1><p>${escapeHtml(String(e))}</p></main>`
    })
}

function draw(host: HTMLElement, catalog: Catalog, selected: string): void {
  hideCardPop() // 重绘不产生鼠标事件，浮层要手动收
  hideCardZoom() // 放大视图挂在 body 上，重绘不会带走它（路由变化也自会收，这里是兜底）
  const profile = loadProfile()
  const available = availableCardSet(profile, catalog)
  const classIds = [...catalog.classDefs.keys()].sort()
  const current = classIds.includes(selected) ? selected : (profile.unlockedClasses[0] ?? classIds[0] ?? '')

  // 职业列表项 = kit 的「选中提示按钮」.cg-select：is-on 是「正在看这个」，环上的绿勾是「已解锁」。
  // 环里的 ✓ 用精灵的 cg-check，不再自己画一个 CSS 对勾。
  const classRows = classIds
    .map((id) => {
      const unlocked = profile.unlockedClasses.includes(id)
      const def = catalog.classDefs.get(id)
      const n = def?.knownSkills.length ?? 0
      return `<button type="button" class="cg-select cls-row${id === current ? ' is-on' : ''}${unlocked ? ' is-unlocked' : ''}" data-cls="${escapeHtml(id)}" title="${escapeHtml(def?.name ?? id)}">
        <span class="cg-select__ring">${icon('cg-check')}</span>
        <span class="cls-name">${escapeHtml(def?.name ?? id)}</span>
        <span class="cls-n">${n}</span>
      </button>`
    })
    .join('')

  const def = catalog.classDefs.get(current)
  const cards = (def?.knownSkills ?? [])
    .map((cardId) => {
      const skill = catalog.skillDefs.get(cardId)
      const tpl = catalog.behaviorTemplates.get(cardId)
      const name = skill?.name ?? tpl?.name ?? cardId
      const rarity = skill?.rarity ?? tpl?.rarity ?? 'common'
      const cardKind = tpl && !skill ? ('passive' as const) : ('active' as const)
      const on = available.has(cardId)
      // 卡面即按钮：点它是「放大看」，不是「解锁」。解锁改由 hover 时浮出的右上角锁标负责
      // ——两个点击目标不能嵌套（button 里塞 button 是非法结构，解析器会拆），所以在外面
      // 留一个零外观的定位壳 .card-cell 让锁标与卡面做兄弟。
      // 不给 title：原生 tooltip 会跟详情浮层打架。
      return `<div class="card-cell">
        ${cardFaceHtml({
          cardId,
          name,
          rarity,
          pathwayId: skill?.pathwayId ?? tpl?.pathwayId,
          kind: cardKind,
          cost: skill?.cost?.energy,
          size: 'full',
          as: 'button',
          attrs: `data-open="${escapeHtml(cardId)}"`,
          dim: !on,
        })}
        <button type="button" class="card-lock" data-lock="${escapeHtml(cardId)}" aria-pressed="${!on}" aria-label="锁定">
          <span aria-hidden="true">${on ? '🔓' : '🔒'}</span>
        </button>
      </div>`
    })
    .join('')

  host.innerHTML = `
    ${subBarHtml('现有卡池')}
    <main class="pool-page">
      <aside class="cls-list cg-scroll">${classRows}</aside>
      <section class="pool-main cg-card cg-card--static">
        <div class="pool-head">
          <h2 class="cg-card__title">${escapeHtml(def?.name ?? current)}</h2>
          <button type="button" class="cg-btn cg-btn--sm ${profile.unlockedClasses.includes(current) ? 'cg-btn--danger' : 'cg-btn--primary'}" id="btn-toggle-cls">
            ${profile.unlockedClasses.includes(current) ? '锁定该职业' : '解锁该职业'}
          </button>
        </div>
        <p class="hint" id="pool-hint">${hintHtml(profile, def?.knownSkills ?? [], classIds, available)}</p>
        <div class="pool-grid">${cards}</div>
      </section>
    </main>`

  hydrateArt(host)
  enableHoverCard(host, {
    resolve: (el) => el.closest<HTMLElement>('.card-face'),
    render: (face) => (face.dataset.card ? cardDetailHtml(catalog, face.dataset.card) : null),
  })

  host.querySelectorAll<HTMLElement>('[data-cls]').forEach((el) => {
    el.addEventListener('click', () => {
      location.hash = `#/cards/${el.dataset.cls ?? ''}`
    })
  })

  host.querySelector<HTMLButtonElement>('#btn-toggle-cls')?.addEventListener('click', () => {
    saveProfile(toggleClassUnlock(loadProfile(), catalog, current))
    sync(host, catalog, current)
  })

  // 点卡面 = 放大居中看大图（解锁是锁标的事，见 openZoom 上方注释）
  host.querySelectorAll<HTMLElement>('.pool-grid [data-open]').forEach((el) => {
    el.addEventListener('click', () => openZoom(catalog, el.dataset.open ?? ''))
  })

  host.querySelectorAll<HTMLElement>('.pool-grid [data-lock]').forEach((el) => {
    el.addEventListener('click', () => {
      saveProfile(toggleCardUnlock(loadProfile(), catalog, el.dataset.lock ?? ''))
      sync(host, catalog, current)
    })
  })
}

/** 放大居中看大图；详情在大图上 hover 才出（.zoom-stage:hover 控制） */
function openZoom(catalog: Catalog, cardId: string): void {
  const skill = catalog.skillDefs.get(cardId)
  const tpl = catalog.behaviorTemplates.get(cardId)
  if (!skill && !tpl) return
  const detail = cardDetailHtml(catalog, cardId)
  if (!detail) return
  hideCardPop() // 卡片浮层跟放大视图不该同时在
  openCardZoom({
    cardHtml: cardFaceHtml({
      cardId,
      name: skill?.name ?? tpl?.name ?? cardId,
      rarity: skill?.rarity ?? tpl?.rarity,
      pathwayId: skill?.pathwayId ?? tpl?.pathwayId,
      kind: tpl && !skill ? 'passive' : 'active',
      cost: skill?.cost?.energy,
      size: 'zoom',
    }),
    detailHtml: detail,
  })
}

/**
 * 只改状态、不动结构。
 *
 * 解锁动作以前走 draw()——整页 innerHTML 重建会把 34 张卡图全换成新建的 <img>；新 img 没有
 * 已解码位图，而卡图是 1152×1536 的大图（实测重建后逐张 decode 要几百毫秒），Chrome 又只留
 * 得住最近几张的解码结果，于是解码跟不上的那几张会先画成空卡再补上图 —— 肉眼就是「部分
 * 卡图闪一下」。原地改 className / 角标 / 文案，img 节点不重建，闪就不存在了。
 */
function sync(host: HTMLElement, catalog: Catalog, current: string): void {
  const profile = loadProfile()
  const available = availableCardSet(profile, catalog)
  const classIds = [...catalog.classDefs.keys()].sort()

  host.querySelectorAll<HTMLElement>('.pool-grid .card-cell').forEach((cell) => {
    const unlocked = available.has(cell.querySelector<HTMLElement>('[data-open]')?.dataset.open ?? '')
    cell.querySelector('.card-face')?.classList.toggle('dim', !unlocked)
    const lock = cell.querySelector<HTMLButtonElement>('.card-lock')
    if (lock) {
      lock.setAttribute('aria-pressed', String(!unlocked))
      lock.innerHTML = `<span aria-hidden="true">${unlocked ? '🔓' : '🔒'}</span>`
    }
  })

  host.querySelectorAll<HTMLElement>('.cls-row[data-cls]').forEach((el) => {
    el.classList.toggle('is-unlocked', profile.unlockedClasses.includes(el.dataset.cls ?? ''))
  })

  const btnCls = host.querySelector<HTMLButtonElement>('#btn-toggle-cls')
  if (btnCls) {
    const on = profile.unlockedClasses.includes(current)
    btnCls.textContent = on ? '锁定该职业' : '解锁该职业'
    btnCls.className = `cg-btn cg-btn--sm ${on ? 'cg-btn--danger' : 'cg-btn--primary'}`
  }

  const hint = host.querySelector<HTMLElement>('#pool-hint')
  if (hint) hint.innerHTML = hintHtml(profile, catalog.classDefs.get(current)?.knownSkills ?? [], classIds, available)
}

function hintHtml(profile: ReturnType<typeof loadProfile>, known: string[], classIds: string[], available: Set<string>): string {
  const usable = known.filter((c) => available.has(c)).length
  const mode = profile.unlockedCards.length === 0 ? '（卡牌解锁：全部，点选按张锁定）' : '（卡牌解锁：显式白名单）'
  return `已解锁职业 ${profile.unlockedClasses.length}/${classIds.length} · 本职业可用卡 ${usable}/${known.length} ${mode}`
}
