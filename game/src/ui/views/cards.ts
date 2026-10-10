// 现有卡池：解锁职业 / 解锁卡牌。左职业列表，右该职业卡面网格。
import { subBarHtml, escapeHtml } from '../components/chrome'
import { cardDetailHtml, cardFaceHtml, hydrateArt } from '../components/cardFace'
import { enableHoverCard, hideCardPop } from '../hover'
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
  const profile = loadProfile()
  const available = availableCardSet(profile, catalog)
  const classIds = [...catalog.classDefs.keys()].sort()
  const current = classIds.includes(selected) ? selected : (profile.unlockedClasses[0] ?? classIds[0] ?? '')

  const classRows = classIds
    .map((id) => {
      const unlocked = profile.unlockedClasses.includes(id)
      const def = catalog.classDefs.get(id)
      const n = def?.knownSkills.length ?? 0
      return `<button type="button" class="cls-row${id === current ? ' active' : ''}${unlocked ? ' unlocked' : ''}" data-cls="${escapeHtml(id)}">
        <span class="cls-dot">${unlocked ? '●' : '○'}</span>
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
      // 卡面本身就是按钮：外面不再套一层带 padding/背景的面板框，也不在卡下重复名字与
      // 「被动 · common / 已解锁」——名字在卡面信息条上，其余细节在 hover 浮层里。
      // 状态只剩右上角一个锁标 + 整张卡置灰。不给 title：原生 tooltip 会跟浮层打架。
      return cardFaceHtml({
        cardId,
        name,
        rarity,
        pathwayId: skill?.pathwayId ?? tpl?.pathwayId,
        kind: cardKind,
        cost: skill?.cost?.energy,
        size: 'full',
        as: 'button',
        attrs: `aria-pressed="${on}"`,
        corner: on ? '' : '🔒',
        dim: !on,
      })
    })
    .join('')

  host.innerHTML = `
    ${subBarHtml('现有卡池')}
    <main class="pool-page">
      <aside class="cls-list">${classRows}</aside>
      <section class="pool-main">
        <div class="pool-head">
          <h2>${escapeHtml(def?.name ?? current)}</h2>
          <button type="button" class="btn ${profile.unlockedClasses.includes(current) ? 'danger' : 'primary'}" id="btn-toggle-cls">
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

  // 卡面即按钮，整页只有它带 data-card（外层已无包裹元素），点一次翻一次。
  host.querySelectorAll<HTMLElement>('.pool-grid [data-card]').forEach((el) => {
    el.addEventListener('click', () => {
      saveProfile(toggleCardUnlock(loadProfile(), catalog, el.dataset.card ?? ''))
      sync(host, catalog, current)
    })
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

  host.querySelectorAll<HTMLElement>('.pool-grid [data-card]').forEach((el) => {
    applyLockState(el, available.has(el.dataset.card ?? ''))
  })

  host.querySelectorAll<HTMLElement>('.cls-row[data-cls]').forEach((el) => {
    const on = profile.unlockedClasses.includes(el.dataset.cls ?? '')
    el.classList.toggle('unlocked', on)
    const dot = el.querySelector('.cls-dot')
    if (dot) dot.textContent = on ? '●' : '○'
  })

  const btnCls = host.querySelector<HTMLButtonElement>('#btn-toggle-cls')
  if (btnCls) {
    const on = profile.unlockedClasses.includes(current)
    btnCls.textContent = on ? '锁定该职业' : '解锁该职业'
    btnCls.className = `btn ${on ? 'danger' : 'primary'}`
  }

  const hint = host.querySelector<HTMLElement>('#pool-hint')
  if (hint) hint.innerHTML = hintHtml(profile, catalog.classDefs.get(current)?.knownSkills ?? [], classIds, available)
}

/** 未解锁 = 置灰 + 右上角 🔒；已解锁 = 原样。三处状态必须同进同退（测试按这条断言） */
function applyLockState(btn: HTMLElement, unlocked: boolean): void {
  btn.setAttribute('aria-pressed', String(unlocked))
  btn.classList.toggle('dim', !unlocked)
  const corner = btn.querySelector('.card-corner')
  if (unlocked) corner?.remove()
  else if (!corner) btn.insertAdjacentHTML('beforeend', '<span class="card-corner">🔒</span>')
}

function hintHtml(profile: ReturnType<typeof loadProfile>, known: string[], classIds: string[], available: Set<string>): string {
  const usable = known.filter((c) => available.has(c)).length
  const mode = profile.unlockedCards.length === 0 ? '（卡牌解锁：全部，点选按张锁定）' : '（卡牌解锁：显式白名单）'
  return `已解锁职业 ${profile.unlockedClasses.length}/${classIds.length} · 本职业可用卡 ${usable}/${known.length} ${mode}`
}
