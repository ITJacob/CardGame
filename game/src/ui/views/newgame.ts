// 新游戏：生成名册 → 预览 → 整备（可选）→ 开战。
import { subBarHtml, escapeHtml } from '../components/chrome'
import { hydrateArt } from '../components/cardFace'
import { heroRowHtml } from '../components/hero'
import { getCatalog } from '../catalog'
import { setSession, type UnitMeta } from '../session'
import { ensureDraft, getDraft, rerollDraft } from '../draft'
import { validateFormation } from '../../meta/formation'
import { buildCombatSetup } from '../../meta/buildSetup'
import { loadProfile } from '../profile'
import { createCombat } from '../../kernel'
import type { Catalog } from '../../kernel/catalog/types'
import type { Profile } from '../../meta/progression'

export function renderNewGame(host: HTMLElement): void {
  host.innerHTML = `${subBarHtml('新游戏')}<main class="placeholder"><p>正在加载卡池与生成英雄…</p></main>`
  getCatalog()
    .then((catalog) => {
      const profile = loadProfile()
      ensureDraft('offline', catalog, profile)
      render(host, catalog, profile)
    })
    .catch((e: unknown) => {
      host.innerHTML = `${subBarHtml('新游戏')}<main class="placeholder"><h1>加载失败</h1><p>${escapeHtml(String(e))}</p></main>`
    })
}

function render(host: HTMLElement, catalog: Catalog, profile: Profile): void {
  const draft = getDraft()
  if (!draft) return
  const { own } = draft
  const rows = own.map((h) => heroRowHtml(h, catalog)).join('')
  const errors = validateFormation(own)

  host.innerHTML = `
    ${subBarHtml('新游戏')}
    <main class="newgame">
      <p class="hint">档案 ${escapeHtml(profile.uuid.slice(0, 8))} · 解锁职业 ${escapeHtml(profile.unlockedClasses.join('、'))} · seed ${draft.seed}</p>
      <h2>我方英雄（${own.length}）</h2>
      <div class="hero-list">${rows}</div>
      ${errors.length > 0 ? `<p class="warn">编队问题：${escapeHtml(errors.join(' / '))}</p>` : '<p class="ok">编队合法</p>'}
      <div class="row-actions">
        <a class="btn" href="#/prep">整备 · 技能 / 阵型</a>
        <button type="button" class="btn" id="btn-reroll">重新生成英雄</button>
      </div>
      <button type="button" class="btn primary" id="btn-fight">开始战斗</button>
    </main>`

  hydrateArt(host)
  host.querySelector('#btn-reroll')?.addEventListener('click', () => {
    rerollDraft(catalog, profile)
    render(host, catalog, profile)
  })
  host.querySelector('#btn-fight')?.addEventListener('click', () => {
    const d = getDraft()
    if (!d) return
    const setup = buildCombatSetup({ seed: d.seed, catalog, own: d.own, enemy: d.enemy })
    const facade = createCombat(setup)
    const unitMeta = new Map<string, UnitMeta>()
    for (const h of d.own) unitMeta.set(h.id, { name: h.name, side: 'own', constitutionId: h.constitutionId, classId: h.classId, gender: h.gender })
    for (const h of d.enemy) unitMeta.set(h.id, { name: h.name, side: 'enemy', constitutionId: h.constitutionId, classId: h.classId, gender: h.gender })
    setSession({ catalog, facade, setup, own: d.own, enemy: d.enemy, unitMeta })
    location.hash = '#/battle'
  })
}
