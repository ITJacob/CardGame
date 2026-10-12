// 在线对战大厅（P7）：生成名册 → 整备（可选）→ 建房/加入/快速匹配 → 等对手 → 进 #/battle。
// 传输走 Firestore（firebaseChannel）；数据版本不符一律拒绝开局（§3.4 铁律 2）。
import { subBarHtml, escapeHtml } from '../components/chrome'
import { icon } from '../components/icons'
import { cardDetailHtml, hydrateArt } from '../components/cardFace'
import { heroShowcaseHtml, hydrateHeroArt, wireHeroShowcase } from '../components/hero'
import { orientationOf } from '../battle/projection'
import { enableCardPop, hideCardPop } from '../hover'
import { getCatalog } from '../catalog'
import { setSession, type UnitMeta } from '../session'
import { loadProfile } from '../profile'
import { ensureDraft, getDraft, rerollDraft } from '../draft'
import { validateFormation, type PlacedHero } from '../../meta/formation'
import type { SlotKind } from '../../meta/loadout'
import { createCombat } from '../../kernel'
import { createFirebaseMatch, type FirebaseMatch } from '../../meta/match/firebaseChannel'
import { buildOnlineCombatSetup, factionOfSide } from '../../meta/match/buildOnlineSetup'
import type { Side } from '../../meta/match/types'
import type { Catalog } from '../../kernel/catalog/types'
import type { Profile } from '../../meta/progression'
import { dataVersion, shortHash } from '../../data/version'

let conn: FirebaseMatch | null = null
/** 每次进入本页 +1：异步续跑前比对，避免「已离开还在跳转」 */
let navToken = 0
/** 展示台上正看第几个英雄；重新生成名册后归零 */
let heroIndex = 0
/** 右侧技能缩略图看主动还是被动 */
let skillView: SlotKind = 'active'

function connection(): FirebaseMatch {
  conn ??= createFirebaseMatch()
  return conn
}

export function renderOnline(host: HTMLElement): void {
  const token = ++navToken
  host.innerHTML = `${subBarHtml('在线对战')}<main class="placeholder"><p>正在加载卡池与生成英雄…</p></main>`
  getCatalog()
    .then((catalog) => {
      if (token !== navToken) return
      const profile = loadProfile()
      ensureDraft('online', catalog, profile)
      renderLobby(host, token, catalog, profile)
    })
    .catch((e: unknown) => {
      if (token !== navToken) return
      host.innerHTML = `${subBarHtml('在线对战')}<main class="placeholder"><h1>加载失败</h1><p>${escapeHtml(String(e))}</p></main>`
    })
}

function renderLobby(host: HTMLElement, token: number, catalog: Catalog, profile: Profile): void {
  const roster = getDraft()?.own ?? []
  const errors = validateFormation(roster)
  // 重绘会重建输入框（切英雄 / 重新生成都会重绘），先把已敲的房间码捞出来再填回去
  const typedCode = (document.getElementById('inp-code') as HTMLInputElement | null)?.value ?? ''
  // 编队状态与联机提示：横屏挪到页眉那行去（页眉横着空一大截），脚因此从三行收成两行
  // ——右栏高 = 舞台高 − 脚高，技能卡又按右栏高倒推，脚一矮右栏就高、整块技能区跟着换一档，
  // 与整备页来回切时会上下跳（见 app.css 横屏 .hs-foot 那条；#/new 的「编队合法」同此处理）。
  // 竖屏页眉塞不下这两句，仍旧留在脚里，所以两处各画一份、按朝向显示其中一份；
  // 标记只能走 class 不能走 id（同句两份）。
  const notes = `${errors.length > 0 ? `<span class="hs-status warn">编队问题：${escapeHtml(errors.join(' / '))}</span>` : '<span class="hs-status ok">编队合法</span>'}
        <span class="hint js-online-status">联机自动推进 · 决策点等双方选定</span>`

  host.innerHTML = `
    ${subBarHtml('在线对战')}
    <main class="viewport-page">
      <p class="hint profile-line">档案 ${escapeHtml(profile.username || profile.uuid.slice(0, 8))} · 数据 ${shortHash(dataVersion.dataHash)}${dataVersion.stale ? '（数据已漂移，双方须同版本）' : ''}<span class="hs-top">${notes}</span></p>
      ${heroShowcaseHtml(roster, catalog, {
        index: heroIndex,
        kind: skillView,
        orient: orientationOf(window.innerWidth, window.innerHeight),
        foot: `
      <div class="hs-notes">${notes}</div>
      <div class="row-actions">
        <a class="cg-btn" href="#/prep">整备</a>
        <button type="button" class="cg-btn" id="btn-reroll">重新生成</button>
        <button type="button" class="cg-btn" id="btn-quick">快速匹配</button>
        <button type="button" class="cg-btn cg-btn--primary" id="btn-create">创建房间</button>
      </div>
      <div class="row-actions">
        <input class="cg-input" id="inp-code" maxlength="6" placeholder="对手的 6 位房间码" aria-label="房间码" autocomplete="off" />
        <button type="button" class="cg-btn" id="btn-join">加入房间</button>
      </div>`,
      })}
    </main>`

  hydrateArt(host)
  hydrateHeroArt(host)
  // 重绘不产生鼠标事件，先手动收；enableCardPop 幂等（WeakMap 自动摘旧）。
  // 详情 PC 走 hover、纯触摸走点按。
  hideCardPop()
  enableCardPop(host, {
    resolve: (el) => el.closest<HTMLElement>('.card-face'),
    render: (face) => (face.dataset.card ? cardDetailHtml(catalog, face.dataset.card) : null),
  })

  // 这句话横竖两处各有一份（见上面 notes 的说明），两处一起改；
  // 只 toggle warn，不重写 className——那份标记本身也是靠 class 认的。
  const status = (msg: string, cls = ''): void => {
    document.querySelectorAll<HTMLElement>('.js-online-status').forEach((el) => {
      el.textContent = msg
      el.classList.toggle('warn', cls === 'warn')
    })
  }
  const busy = (on: boolean): void => {
    for (const id of ['btn-quick', 'btn-create', 'btn-join']) {
      const b = document.getElementById(id) as HTMLButtonElement | null
      if (b) b.disabled = on
    }
  }
  const codeInput = document.getElementById('inp-code') as HTMLInputElement | null
  if (codeInput && typedCode) codeInput.value = typedCode

  const fail = (e: unknown): void => {
    status(`失败：${e instanceof Error ? e.message : String(e)}`, 'warn')
    busy(false)
  }
  // 上线前按座位改 id + 阵营：双方名册是同构生成的，hero_1 会撞车（内核要求 unitId 全局唯一）
  // 每次都从草稿现读，确保先在 #/prep 整备过再建房/加入时带上编辑结果
  const wireRoster = (side: Side): PlacedHero[] =>
    (getDraft()?.own ?? []).map((h, i) => ({
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

  // 展示台的三种点击（箭头 / 缩略图 / 主动被动）都走这里；改的是页面级状态，重绘整页
  wireHeroShowcase(host, {
    index: heroIndex,
    onIndex: (i) => {
      heroIndex = i
      renderLobby(host, token, catalog, profile)
    },
    onKind: (k) => {
      skillView = k
      renderLobby(host, token, catalog, profile)
    },
  })
  document.getElementById('btn-reroll')?.addEventListener('click', () => {
    rerollDraft(catalog, profile)
    heroIndex = 0
    renderLobby(host, token, catalog, profile)
  })
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
      <article class="cg-panel cg-panel--featured wait-card">
        <div class="cg-panel__head">
          ${icon('cg-sigil-moon')}
          <div>
            <h1 class="room-code">${escapeHtml(code)}</h1>
            <div class="cg-panel__meta">房间码 · 发给对手</div>
          </div>
        </div>
        <div class="cg-panel__body">
          <p>${escapeHtml(tip)}</p>
          <p class="hint">数据版本 ${shortHash(dataVersion.dataHash)} · ${escapeHtml(profile.username || '')}</p>
        </div>
        <div class="cg-panel__foot"><a class="cg-btn cg-btn--sm" href="#/">取消并返回</a></div>
      </article>
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
      for (const h of own) unitMeta.set(h.id, { name: h.name, side: 'own', constitutionId: h.constitutionId, classId: h.classId, gender: h.gender, combo: h.combo })
      for (const h of enemy) unitMeta.set(h.id, { name: h.name, side: 'enemy', constitutionId: h.constitutionId, classId: h.classId, gender: h.gender, combo: h.combo })
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
