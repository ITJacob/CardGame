// 新游戏：生成名册（力敏智 × 体质 × 职业 × 技能）→ 预览 → 开战。
import { subBarHtml, escapeHtml } from '../components/chrome'
import { avatarEmoji, cardFaceHtml, hydrateArt } from '../components/cardFace'
import { getCatalog } from '../catalog'
import { setSession, type UnitMeta } from '../session'
import { CONSTITUTIONS } from '../../meta/constitution'
import { generateHeroes } from '../../meta/herogen'
import { autoFormation, validateFormation, type PlacedHero } from '../../meta/formation'
import { buildCombatSetup } from '../../meta/buildSetup'
import { createLocalStorageStore, newProfile, type Profile } from '../../meta/progression'
import { Mulberry32RandomSource } from '../../kernel/shared/random-source'
import { createCombat } from '../../kernel'
import type { Catalog } from '../../kernel/catalog/types'

const store = createLocalStorageStore()
const constitutionIds = CONSTITUTIONS.map((c) => c.id)

function loadProfile(): Profile {
  const existing = store.load()
  if (existing) return existing
  const fresh = newProfile('sleepless')
  store.save(fresh)
  return fresh
}

export function renderNewGame(host: HTMLElement): void {
  host.innerHTML = `${subBarHtml('新游戏')}<main class="placeholder"><p>正在加载卡池与生成英雄…</p></main>`
  getCatalog()
    .then((catalog) => {
      const profile = loadProfile()
      const seed = (Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0
      const ctxOf = (s: number) => ({
        catalog,
        random: new Mulberry32RandomSource(s),
        unlockedClasses: profile.unlockedClasses,
        unlockedCards: profile.unlockedCards.length > 0 ? profile.unlockedCards : undefined, // 空 = 全解锁
        constitutionIds,
      })
      const own = autoFormation(generateHeroes(ctxOf(seed), 5, 'A'), 'A')
      const enemy = autoFormation(generateHeroes(ctxOf((seed + 1) >>> 0), 5, 'B'), 'B')
      render(host, catalog, profile, seed, own, enemy)
    })
    .catch((e: unknown) => {
      host.innerHTML = `${subBarHtml('新游戏')}<main class="placeholder"><h1>加载失败</h1><p>${escapeHtml(String(e))}</p></main>`
    })
}

function render(host: HTMLElement, catalog: Catalog, profile: Profile, seed: number, own: PlacedHero[], enemy: PlacedHero[]): void {
  const rows = own
    .map((h) => {
      const cards = h.activeSkillIds
        .map((id) => cardFaceHtml({ cardId: id, name: catalog.skillDefs.get(id)?.name ?? id, rarity: catalog.skillDefs.get(id)?.rarity, compact: true }))
        .join('')
      const combo = `${h.combo.strength}力 / ${h.combo.agility}敏 / ${h.combo.intelligence}智`
      return `<div class="hero-row">
        <span class="hero-avatar">${avatarEmoji(h.constitutionId, h.gender)}</span>
        <span class="hero-info">
          <b>${escapeHtml(h.name)}</b>
          <small>${escapeHtml(h.classId)} · ${escapeHtml(h.constitutionId)} · ${combo} · ${h.coordinate.lane}#${h.coordinate.index}</small>
        </span>
        <div class="hero-cards">${cards}</div>
      </div>`
    })
    .join('')

  const errors = validateFormation(own)
  host.innerHTML = `
    ${subBarHtml('新游戏')}
    <main class="newgame">
      <p class="hint">档案 ${escapeHtml(profile.uuid.slice(0, 8))} · 解锁职业 ${escapeHtml(profile.unlockedClasses.join('、'))} · seed ${seed}</p>
      <h2>我方英雄（${own.length}）</h2>
      <div class="hero-list">${rows}</div>
      ${errors.length > 0 ? `<p class="warn">编队问题：${escapeHtml(errors.join(' / '))}</p>` : '<p class="ok">编队合法</p>'}
      <button type="button" class="btn primary" id="btn-fight">开始战斗</button>
    </main>`

  hydrateArt(host)
  document.getElementById('btn-fight')?.addEventListener('click', () => {
    const setup = buildCombatSetup({ seed, catalog, own, enemy })
    const facade = createCombat(setup)
    const unitMeta = new Map<string, UnitMeta>()
    for (const h of own) unitMeta.set(h.id, { name: h.name, side: 'own', constitutionId: h.constitutionId, classId: h.classId, gender: h.gender })
    for (const h of enemy) unitMeta.set(h.id, { name: h.name, side: 'enemy', constitutionId: h.constitutionId, classId: h.classId, gender: h.gender })
    setSession({ catalog, facade, setup, own, enemy, unitMeta })
    location.hash = '#/battle'
  })
}
