// 现有卡池：解锁职业 / 解锁卡牌。左职业列表，右该职业卡面网格。
import { subBarHtml, escapeHtml } from '../components/chrome'
import { cardFaceHtml, hydrateArt } from '../components/cardFace'
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
      const kind = skill ? '主动' : tpl ? '被动' : '?'
      const on = available.has(cardId)
      return `<button type="button" class="pool-card${on ? ' on' : ' off'}" data-card="${escapeHtml(cardId)}" title="${escapeHtml(cardId)}">
        ${cardFaceHtml({ cardId, name, rarity, compact: true })}
        <span class="pool-meta"><b>${escapeHtml(name)}</b><small>${kind} · ${rarity}</small></span>
        <span class="pool-flag">${on ? '已解锁' : '未解锁'}</span>
      </button>`
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
        <p class="hint">已解锁职业 ${profile.unlockedClasses.length}/${classIds.length} · 本职业可用卡 ${(def?.knownSkills ?? []).filter((c) => available.has(c)).length}/${(def?.knownSkills ?? []).length}
          ${profile.unlockedCards.length === 0 ? '（卡牌解锁：全部，点选按张锁定）' : '（卡牌解锁：显式白名单）'}</p>
        <div class="pool-grid">${cards}</div>
      </section>
    </main>`

  hydrateArt(host)

  host.querySelectorAll<HTMLElement>('[data-cls]').forEach((el) => {
    el.addEventListener('click', () => {
      location.hash = `#/cards/${el.dataset.cls ?? ''}`
    })
  })

  host.querySelector<HTMLButtonElement>('#btn-toggle-cls')?.addEventListener('click', () => {
    saveProfile(toggleClassUnlock(loadProfile(), catalog, current))
    draw(host, catalog, current)
  })

  host.querySelectorAll<HTMLElement>('[data-card]').forEach((el) => {
    el.addEventListener('click', () => {
      saveProfile(toggleCardUnlock(loadProfile(), catalog, el.dataset.card ?? ''))
      draw(host, catalog, current)
    })
  })
}
