// 新游戏：生成名册 → 预览 → 整备（可选）→ 开战。
import { subBarHtml, escapeHtml } from '../components/chrome'
import { cardDetailHtml, hydrateArt } from '../components/cardFace'
import { heroRowHtml, hydrateHeroArt } from '../components/hero'
import { enableHoverCard, hideCardPop } from '../hover'
import { getCatalog } from '../catalog'
import { setSession, type UnitMeta } from '../session'
import { ensureDraft, getDraft, rerollDraft } from '../draft'
import { validateFormation } from '../../meta/formation'
import { SLOT_LABEL, type SlotKind } from '../../meta/loadout'
import { buildCombatSetup } from '../../meta/buildSetup'
import { loadProfile } from '../profile'
import { createCombat } from '../../kernel'
import type { Catalog } from '../../kernel/catalog/types'
import type { Profile } from '../../meta/progression'

/** 名册行右侧那排技能图标看主动还是被动：页面级显示偏好，重渲染与来回切页都保持 */
let skillView: SlotKind = 'active'

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
  const rows = own.map((h) => heroRowHtml(h, catalog, skillView)).join('')
  const errors = validateFormation(own)

  host.innerHTML = `
    ${subBarHtml('新游戏')}
    <main class="newgame">
      <p class="hint">档案 ${escapeHtml(profile.uuid.slice(0, 8))} · 解锁职业 ${escapeHtml(profile.unlockedClasses.join('、'))} · seed ${draft.seed}</p>
      <div class="list-head">
        <h2>我方英雄（${own.length}）</h2>
        <div class="skill-switch" role="group" aria-label="名册里显示哪一类技能">
          ${switchBtn('active')}
          ${switchBtn('passive')}
        </div>
      </div>
      <div class="hero-list">${rows}</div>
      ${errors.length > 0 ? `<p class="warn">编队问题：${escapeHtml(errors.join(' / '))}</p>` : '<p class="ok">编队合法</p>'}
      <div class="row-actions">
        <a class="cg-btn" href="#/prep">整备 · 技能 / 阵型</a>
        <button type="button" class="cg-btn" id="btn-reroll">重新生成英雄</button>
      </div>
      <button type="button" class="cg-btn cg-btn--primary cg-btn--block" id="btn-fight">开始战斗</button>
    </main>`

  hydrateArt(host)
  hydrateHeroArt(host)
  // 重绘不产生鼠标事件，先手动收；enableHoverCard 幂等（WeakMap 自动摘旧），
  // 所以跟随 render 反复调用不会越积越多。
  hideCardPop()
  enableHoverCard(host, {
    resolve: (el) => el.closest<HTMLElement>('.card-face'),
    render: (face) => (face.dataset.card ? cardDetailHtml(catalog, face.dataset.card) : null),
  })
  host.querySelectorAll<HTMLElement>('[data-skill-view]').forEach((el) =>
    el.addEventListener('click', () => {
      skillView = el.dataset.skillView === 'passive' ? 'passive' : 'active'
      render(host, catalog, profile)
    }),
  )
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

/** 名册的技能切换按钮。主动/被动的次序语义不同，标题里各说一句，省得看串。
 *  用 kit 的 .cg-select（环在左、选中填黄铜），这样「当前看的是哪一类」和整页其它选中态是同一套语言。 */
function switchBtn(kind: SlotKind): string {
  const tip =
    kind === 'active' ? '主动技能按槽位顺序在战斗里轮转释放' : '被动技能常驻；同一触发点上有多张时按槽位顺序发动'
  return `<button type="button" class="cg-select switch-btn${skillView === kind ? ' is-on' : ''}" data-skill-view="${kind}" title="${tip}">${SLOT_LABEL[kind]}</button>`
}
