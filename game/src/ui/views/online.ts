// 在线对战大厅（P7）：生成名册 → 建房/加入/快速匹配 → 等对手 → 进 #/battle。
// 传输走 Firestore（firebaseChannel）；数据版本不符一律拒绝开局（§3.4 铁律 2）。
import { subBarHtml, escapeHtml } from '../components/chrome'
import { avatarEmoji, cardFaceHtml, hydrateArt } from '../components/cardFace'
import { getCatalog } from '../catalog'
import { setSession, type UnitMeta } from '../session'
import { loadProfile } from '../profile'
import { CONSTITUTIONS } from '../../meta/constitution'
import { generateHeroes } from '../../meta/herogen'
import { autoFormation, validateFormation, type PlacedHero } from '../../meta/formation'
import { availableCardSet, type Profile } from '../../meta/progression'
import { Mulberry32RandomSource } from '../../kernel/shared/random-source'
import { createCombat } from '../../kernel'
import { createFirebaseMatch, type FirebaseMatch } from '../../meta/match/firebaseChannel'
import { buildOnlineCombatSetup, factionOfSide } from '../../meta/match/buildOnlineSetup'
import type { Side } from '../../meta/match/types'
import type { Catalog } from '../../kernel/catalog/types'
import { dataVersion, shortHash } from '../../data/version'

const constitutionIds = CONSTITUTIONS.map((c) => c.id)

let conn: FirebaseMatch | null = null
/** 每次进入本页 +1：异步续跑前比对，避免「已离开还在跳转」 */
let navToken = 0

function connection(): FirebaseMatch {
  conn ??= createFirebaseMatch()
  return conn
}

function newRoster(catalog: Catalog, profile: Profile): PlacedHero[] {
  const seed = (Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0
  const ctx = {
    catalog,
    random: new Mulberry32RandomSource(seed),
    unlockedClasses: profile.unlockedClasses,
    unlockedCards: [...availableCardSet(profile, catalog)],
    constitutionIds,
  }
  return autoFormation(generateHeroes(ctx, 5, 'hero'), 'A')
}

export function renderOnline(host: HTMLElement): void {
  const token = ++navToken
  host.innerHTML = `${subBarHtml('在线对战')}<main class="placeholder"><p>正在加载卡池与生成英雄…</p></main>`
  getCatalog()
    .then((catalog) => {
      if (token !== navToken) return
      const profile = loadProfile()
      renderLobby(host, token, catalog, profile, newRoster(catalog, profile))
    })
    .catch((e: unknown) => {
      if (token !== navToken) return
      host.innerHTML = `${subBarHtml('在线对战')}<main class="placeholder"><h1>加载失败</h1><p>${escapeHtml(String(e))}</p></main>`
    })
}

function renderLobby(host: HTMLElement, token: number, catalog: Catalog, profile: Profile, roster: PlacedHero[]): void {
  const rows = roster
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

  const errors = validateFormation(roster)

  host.innerHTML = `
    ${subBarHtml('在线对战')}
    <main class="newgame">
      <p class="hint">档案 ${escapeHtml(profile.username || profile.uuid.slice(0, 8))} · 数据 ${shortHash(dataVersion.dataHash)}${dataVersion.stale ? '（数据已漂移，双方须同版本）' : ''}</p>
      <h2>我方阵容（${roster.length}）</h2>
      <div class="hero-list">${rows}</div>
      ${errors.length > 0 ? `<p class="warn">编队问题：${escapeHtml(errors.join(' / '))}</p>` : '<p class="ok">编队合法</p>'}
      <div class="row-actions">
        <button type="button" class="btn" id="btn-quick">快速匹配</button>
        <button type="button" class="btn primary" id="btn-create">创建房间</button>
      </div>
      <div class="field"><span>房间码</span><input id="inp-code" maxlength="6" placeholder="输入对手的 6 位房间码" autocomplete="off" /></div>
      <button type="button" class="btn" id="btn-join">加入房间</button>
      <p class="hint" id="online-status">联机对战自动推进，遇决策点暂停等双方选定；对手掉线会在超时后中止。</p>
      <p class="hint">双方卡池数据版本必须一致（${shortHash(dataVersion.dataHash)}）；不一致会拒绝开局。</p>
    </main>`

  hydrateArt(host)

  const status = (msg: string, cls = ''): void => {
    const el = document.getElementById('online-status')
    if (!el) return
    el.textContent = msg
    el.className = `hint ${cls}`
  }
  const busy = (on: boolean): void => {
    for (const id of ['btn-quick', 'btn-create', 'btn-join']) {
      const b = document.getElementById(id) as HTMLButtonElement | null
      if (b) b.disabled = on
    }
  }
  const codeInput = document.getElementById('inp-code') as HTMLInputElement | null

  const fail = (e: unknown): void => {
    status(`失败：${e instanceof Error ? e.message : String(e)}`, 'warn')
    busy(false)
  }
  // 上线前按座位改 id + 阵营：双方名册是同构生成的，hero_1 会撞车（内核要求 unitId 全局唯一）
  const wireRoster = (side: Side): PlacedHero[] =>
    roster.map((h, i) => ({
      ...h,
      id: `${factionOfSide(side)}_h${i + 1}`,
      coordinate: { ...h.coordinate, faction: factionOfSide(side) },
    }))

  const create = (): void => {
    busy(true)
    status('创建房间中…')
    const seed = (Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0
    connection()
      .createRoom({ roster: wireRoster('host'), seed, dataHash: dataVersion.dataHash })
      .then((ref) => waitRoom(host, token, catalog, profile, 'host', ref.code))
      .catch(fail)
  }

  const join = (code: string): void => {
    if (code.trim().length < 4) {
      status('请输入 6 位房间码', 'warn')
      return
    }
    busy(true)
    status('加入房间中…')
    connection()
      .joinRoom({ code, roster: wireRoster('guest'), dataHash: dataVersion.dataHash })
      .then((ref) => waitRoom(host, token, catalog, profile, 'guest', ref.code))
      .catch(fail)
  }

  const quick = (): void => {
    busy(true)
    status('匹配中…')
    connection()
      .findWaitingRoom()
      .then((code) => {
        if (code) join(code)
        else create()
      })
      .catch(fail)
  }

  document.getElementById('btn-create')?.addEventListener('click', create)
  document.getElementById('btn-quick')?.addEventListener('click', quick)
  document.getElementById('btn-join')?.addEventListener('click', () => join(codeInput?.value ?? ''))
  codeInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') join(codeInput.value)
  })
}

function waitRoom(host: HTMLElement, token: number, catalog: Catalog, profile: Profile, side: Side, code: string): void {
  const tip = side === 'host' ? '把房间码发给对手，等对方加入…' : '已加入，等对手确认开局…'
  host.innerHTML = `
    ${subBarHtml('在线对战')}
    <main class="placeholder">
      <h1 class="room-code">${escapeHtml(code)}</h1>
      <p>${escapeHtml(tip)}</p>
      <p class="hint">数据版本 ${shortHash(dataVersion.dataHash)} · ${escapeHtml(profile.username || '')}</p>
      <p><a href="#/">取消并返回</a></p>
    </main>`

  // 等待期间离开本页（不是去开战）→ 房主撤房，别把废弃房间留给快速匹配
  const onLeave = (): void => {
    if (location.hash === '#/battle') return
    window.removeEventListener('hashchange', onLeave)
    void connection().abandonRoom()
  }
  window.addEventListener('hashchange', onLeave)

  connection()
    .awaitStart()
    .then((info) => {
      if (token !== navToken) return // 已离开本页
      const setup = buildOnlineCombatSetup({
        seed: info.seed,
        catalog,
        hostRoster: info.hostRoster,
        guestRoster: info.guestRoster,
      })
      const facade = createCombat(setup)
      const myFaction = factionOfSide(side)
      const own = side === 'host' ? info.hostRoster : info.guestRoster
      const enemy = side === 'host' ? info.guestRoster : info.hostRoster
      const unitMeta = new Map<string, UnitMeta>()
      for (const h of own) unitMeta.set(h.id, { name: h.name, side: 'own', constitutionId: h.constitutionId, classId: h.classId, gender: h.gender })
      for (const h of enemy) unitMeta.set(h.id, { name: h.name, side: 'enemy', constitutionId: h.constitutionId, classId: h.classId, gender: h.gender })
      setSession({
        catalog,
        facade,
        setup,
        own,
        enemy,
        unitMeta,
        myFaction,
        online: { channel: connection(), myFaction },
      })
      window.removeEventListener('hashchange', onLeave)
      location.hash = '#/battle'
    })
    .catch((e: unknown) => {
      if (token !== navToken) return
      host.innerHTML = `${subBarHtml('在线对战')}<main class="placeholder"><h1>开局失败</h1><p>${escapeHtml(e instanceof Error ? e.message : String(e))}</p><p><a href="#/online">重试</a> · <a href="#/">主菜单</a></p></main>`
    })
}
