// 新游戏：生成名册 → 预览 → 整备（可选）→ 开战。
import { subBarHtml, escapeHtml } from '../components/chrome'
import { cardDetailHtml, hydrateArt } from '../components/cardFace'
import { heroShowcaseHtml, hydrateHeroArt, wireHeroShowcase } from '../components/hero'
import { orientationOf } from '../battle/projection'
import { enableHoverCard, hideCardPop } from '../hover'
import { getCatalog } from '../catalog'
import { setSession, type UnitMeta } from '../session'
import { ensureDraft, getDraft, rerollDraft } from '../draft'
import { validateFormation } from '../../meta/formation'
import type { SlotKind } from '../../meta/loadout'
import { buildCombatSetup } from '../../meta/buildSetup'
import { loadProfile } from '../profile'
import { createCombat } from '../../kernel'
import type { Catalog } from '../../kernel/catalog/types'
import type { Profile } from '../../meta/progression'

/** 名册右侧那排技能缩略图看主动还是被动：页面级显示偏好，重渲染与来回切页都保持 */
let skillView: SlotKind = 'active'
/** 展示台上正看第几个英雄。重新生成名册后归零（人换了，下标就没意义了） */
let heroIndex = 0

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
  const errors = validateFormation(own)

  // 整屏骨架：.viewport-page 把这一页钉在视口里（不整页滚动），展示台 flex:1 吃掉剩余高度
  host.innerHTML = `
    ${subBarHtml('新游戏')}
    <main class="viewport-page">
      <p class="hint profile-line">档案 ${escapeHtml(profile.uuid.slice(0, 8))} · 解锁职业 ${escapeHtml(profile.unlockedClasses.join('、'))} · seed ${draft.seed}</p>
      ${heroShowcaseHtml(own, catalog, {
        index: heroIndex,
        kind: skillView,
        orient: orientationOf(window.innerWidth, window.innerHeight),
        foot: `
      ${errors.length > 0 ? `<p class="warn hs-status">编队问题：${escapeHtml(errors.join(' / '))}</p>` : '<p class="ok hs-status">编队合法</p>'}
      <div class="row-actions">
        <a class="cg-btn" href="#/prep">整备 · 技能 / 阵型</a>
        <button type="button" class="cg-btn" id="btn-reroll">重新生成</button>
      </div>
      <button type="button" class="cg-btn cg-btn--primary cg-btn--block" id="btn-fight">开始战斗</button>`,
      })}
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
  // 展示台的三种点击（箭头 / 缩略图 / 主动被动）都走这里；改的是页面级状态，重绘整页
  wireHeroShowcase(host, {
    index: heroIndex,
    onIndex: (i) => {
      heroIndex = i
      render(host, catalog, profile)
    },
    onKind: (k) => {
      skillView = k
      render(host, catalog, profile)
    },
  })
  host.querySelector('#btn-reroll')?.addEventListener('click', () => {
    rerollDraft(catalog, profile)
    heroIndex = 0
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
