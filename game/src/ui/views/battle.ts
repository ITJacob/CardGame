// 战斗界面：棋盘（双朝向投影）+ 日志 + 决策点选靶 + 推进。
// 两种驱动：
//   离线人机 —— 用户点「推进一 tick / 自动播放」，决策直接 submitDecision；
//   联机 lockstep —— MatchRunner 自动推进，本侧决策走 MatchRunner.publish，
//                    对侧决策只等待（绝不本地回退，P7_PLAN §3.4 铁律 1）。
import { escapeHtml, subBarHtml } from '../components/chrome'
import { avatarEmoji, cardDetailHtml, cardFaceHtml, hydrateArt } from '../components/cardFace'
import { enableHoverCard, hideCardPop } from '../hover'
import { getSession } from '../session'
import { gridSpec, laneIndexer, orientationOf, type Orientation } from '../battle/projection'
import type { DomainEvent } from '../../kernel/combat/types'
import type { CombatStats, CombatView, UnitViewLite } from '../../kernel/combat/types'
import type { DecisionInput, DecisionRequest } from '../../kernel/execution/types'
import type { FactionId } from '../../kernel/ids'
import type { MatchRecord } from '../../meta/matchLog'
import { fingerprintOf } from '../../kernel/combat/fingerprint'
import { MatchRunner } from '../../meta/match/runner'

type CombatOutcome = 'side_a' | 'side_b' | 'draw' | 'aborted'
import type { BattleSession } from '../session'
import { createLocalStorageMatchStore } from '../../meta/matchLog'

let autoTimer: number | null = null
/** 前台战斗视图的重画钩子（离开视图即置空），供模块级 resize 监听转发 */
let activeRefresh: (() => void) | null = null
let resizeHooked = false
/** 联机每 tick 的观战节拍（毫秒）；0 会让整局在一帧内跑完 */
const ONLINE_STEP_MS = 450
const FINGERPRINT_WAIT_MS = 20000
const matchStore = createLocalStorageMatchStore()

/**
 * 本视图是否仍在前台。路由没有卸载钩子，所以异步回调（resize 转发、
 * 联机 MatchRunner.onUpdate、自动播放定时器）在本视图被顶掉后仍会触发；
 * 它们必须先问这一句，否则会把战斗画面重绘到当前视图上。
 */
function onBattleRoute(): boolean {
  return location.hash.startsWith('#/battle')
}

/**
 * 朝向变化要重画棋盘。监听只挂一次、转发给当前视图（`activeRefresh`）——
 * 若改成每次进入战斗页挂一个 `{once: true}`，来回进出会越积越多，
 * 且旧闭包会拿着旧会话在下次 resize 时重画。
 */
function hookResize(): void {
  if (resizeHooked) return
  resizeHooked = true
  window.addEventListener('resize', () => {
    if (!onBattleRoute()) return
    activeRefresh?.()
  })
}

export function renderBattle(host: HTMLElement): void {
  stopAuto()
  // 先摘掉旧钩子：下面无会话的早退分支会让它指向上一局，之后 resize 会重画旧棋盘
  activeRefresh = null
  const session = getSession()
  if (!session) {
    host.innerHTML = `${subBarHtml('对局')}<main class="placeholder"><h1>没有进行中的对局</h1><p><a href="#/">返回主菜单</a></p></main>`
    return
  }

  const s = session
  /** 联机时本侧决策的兑现句柄（由 MatchRunner.chooseLocally 挂上） */
  let pendingResolve: ((d: DecisionInput) => void) | null = null
  /** 已在本地选定、等 MatchRunner 把决策同步过去（此时禁用按钮，避免重复点） */
  let submitted = false

  const refresh = (): void => {
    const view = s.facade.state()
    const pending = s.facade.pendingDecision()
    const ended = s.facade.ended()
    if (ended && !s.recorded) {
      s.recorded = true
      if (s.online) void finishOnline(s).then(refresh)
      else matchStore.append(recordOf(s, ended.outcome, ended.stats))
    }
    // 已离开战斗页就只保留副作用（上面落战绩），不再画 DOM：
    // resize 转发与联机 MatchRunner 的 onUpdate 都会在本视图被顶掉后继续触发，
    // 若照画就会把棋盘重绘到当前视图上（整备页/大厅被战斗画面盖掉）。
    if (!onBattleRoute()) return
    hideCardPop() // 同上：重绘不产生鼠标事件
    const runner = s.online?.runner
    const myTurn = pending != null && casterFaction(s, pending.caster) === myFactionOf(s)
    /** 本侧该决策且未提交 → 板面高亮 tile 可点选 */
    const canPick = pending != null && (!s.online || myTurn) && !submitted
    host.innerHTML = `
      ${subBarHtml(s.online ? '联机对局' : '对局')}
      <div class="battle" data-orient="${currentOrientation()}">
        <div class="board-wrap">${boardHtml(s, view, pending?.candidates.map((c) => c.occupant) ?? [], canPick)}</div>
        <div class="battle-side">
          ${statusBarHtml(s, view, pending != null, ended != null)}
          ${runner?.lastError ? `<p class="warn">联机中断：${escapeHtml(errMsg(runner.lastError))}</p>` : ''}
          ${runner?.waiting ? '<p class="wait-note">等待对手决策…</p>' : ''}
          ${rosterPanelHtml(s)}
          <div class="log" id="battle-log">${logHtml(s.facade.drainEvents())}</div>
        </div>
      </div>
      ${pending && (!s.online || myTurn) ? decisionBarHtml(s, pending, submitted) : ''}
      ${ended ? endedHtml(s, ended.outcome) : ''}`
    hydrateArt(host)
    wire(s, refresh, submit, canPick)
  }

  const submit = (picks: DecisionInput): void => {
    if (s.online) {
      const resolve = pendingResolve
      pendingResolve = null
      submitted = true
      resolve?.(picks)
    } else {
      s.facade.submitDecision(picks)
    }
    refresh()
  }

  // 联机：驱动循环只建一次（同一会话内多视图重入不重复起跑）
  if (s.online && !s.online.runner) {
    const runner = new MatchRunner({
      facade: s.facade,
      channel: s.online.channel,
      myFaction: s.online.myFaction,
      chooseLocally: () => new Promise<DecisionInput>((resolve) => {
        pendingResolve = resolve
        submitted = false
        refresh()
      }),
      onUpdate: refresh,
      stepDelayMs: ONLINE_STEP_MS,
    })
    s.online.runner = runner
    runner.start()
  }

  refresh()
  activeRefresh = refresh
  hookResize()

  // 悬停浮层只挂一次：refresh 每 tick 都会重画，挂进去等于每帧重绑。
  // 事件委托在 host 上，重画整块 DOM 也不影响它（同 wireDrag 的思路）。
  enableHoverCard(host, {
    resolve: (el) => el.closest<HTMLElement>('.card-face'),
    render: (face) => (face.dataset.card ? cardDetailHtml(s.catalog, face.dataset.card) : null),
  })
}

function myFactionOf(s: BattleSession): FactionId {
  return s.myFaction ?? s.setup.factions[0].id
}

function foeFactionOf(s: BattleSession): FactionId {
  const mine = myFactionOf(s)
  return s.setup.factions.find((f) => f.id !== mine)?.id ?? s.setup.factions[1].id
}

/** 结算用 outcome 是按 factions[0]/[1] 编号的，换算成本侧的「胜」 */
function winOutcomeOf(s: BattleSession): CombatOutcome {
  return myFactionOf(s) === s.setup.factions[0].id ? 'side_a' : 'side_b'
}

function casterFaction(s: BattleSession, unitId: string): FactionId | undefined {
  return s.facade.state().units.find((u) => u.id === unitId)?.faction
}

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

/** 结束：交换事件指纹（§3.4 铁律 4），一致才落正常战绩，否则记 aborted */
async function finishOnline(s: BattleSession): Promise<void> {
  const ended = s.facade.ended()
  const online = s.online
  if (!ended || !online) return
  const mine = fingerprintOf(ended.events)
  await online.channel.publishFingerprint(mine).catch(() => undefined)
  const theirs = await online.channel.receiveFingerprint(FINGERPRINT_WAIT_MS)
  const ok = theirs === mine
  online.verify = { mine, theirs, ok }
  matchStore.append(ok ? recordOf(s, ended.outcome, ended.stats) : recordOf(s, 'aborted', ended.stats))
}

function currentOrientation(): Orientation {
  return orientationOf(window.innerWidth, window.innerHeight)
}

function boardHtml(s: BattleSession, view: CombatView, candidateIds: (string | null)[], canPick: boolean): string {
  const lanes = view.units.map((u) => u.coordinate?.lane).filter((l): l is string => !!l)
  const laneIdx = laneIndexer(lanes.length > 0 ? lanes : ['lane0', 'lane1'])
  const ownFaction = view.units.find((u) => s.unitMeta.get(u.id)?.side === 'own')?.faction ?? 'A'
  const spec = gridSpec(currentOrientation(), ownFaction, laneIdx)
  const cand = new Set(candidateIds.filter((x): x is string => !!x))

  const tiles = view.units
    .filter((u) => u.coordinate)
    .map((u) => {
      const { col, row } = spec.place(u.coordinate!)
      return tileHtml(s, u, col, row, cand.has(u.id), canPick)
    })
    .join('')

  return `<div class="board" style="grid-template-columns:repeat(${spec.columns},1fr);grid-template-rows:repeat(${spec.rows},1fr)">${tiles}</div>`
}

/** targetable = 当前决策的合法目标（视觉高亮）；pickable = 本侧可点选（此时才给抓手光标，避免空承诺） */
function tileHtml(s: BattleSession, u: UnitViewLite, col: number, row: number, targetable: boolean, canPick: boolean): string {
  const meta = s.unitMeta.get(u.id)
  const side = meta?.side ?? (u.id.length > 0 ? 'enemy' : 'own')
  const emoji = meta ? avatarEmoji(meta.constitutionId, meta.gender) : '❓'
  const hpPct = Math.max(0, Math.round((u.hp / Math.max(1, u.hpMax)) * 100))
  const gaugePct = Math.max(0, Math.min(100, Math.round((u.gauge / 75) * 100)))
  const dead = u.hp <= 0
  const statuses = u.statuses
    .slice(0, 3)
    .map((st) => `<span class="chip">${escapeHtml(st.defId)}${st.stacks > 1 ? `×${st.stacks}` : ''}</span>`)
    .join('')
  return `
  <div class="tile ${side}${dead ? ' dead' : ''}${targetable ? ' targetable' : ''}${targetable && canPick ? ' pickable' : ''}" style="grid-column:${col};grid-row:${row}" data-unit="${escapeHtml(u.id)}">
    <div class="avatar">${emoji}</div>
    <div class="tname">${escapeHtml(meta?.name ?? u.id)}<span class="tclass">${escapeHtml(meta?.classId ?? '')}</span></div>
    <div class="bar hp"><i style="width:${hpPct}%"></i><span>${u.hp}/${u.hpMax}</span></div>
    <div class="bar gauge"><i style="width:${gaugePct}%"></i></div>
    <div class="statuses">${statuses}</div>
  </div>`
}

function statusBarHtml(s: BattleSession, view: CombatView, pending: boolean, ended: boolean): string {
  const phaseName: Record<string, string> = { midnight: '午夜', dawn: '黎明', day: '白昼', dusk: '黄昏', night: '黑夜' }
  const controls = s.online
    ? `<button type="button" id="btn-pause">${s.online.runner?.isPaused ? '继续' : '暂停'}</button>
       <span class="hud-count">决策 #${s.online.runner?.decisionSeq ?? 0}</span>`
    : `<button type="button" id="btn-step" ${pending || ended ? 'disabled' : ''}>推进一 tick</button>
       <button type="button" id="btn-auto" ${ended ? 'disabled' : ''}>自动播放</button>`
  return `
  <div class="hud">
    <span class="hud-tick">tick ${view.tick}</span>
    <span class="hud-phase">${phaseName[view.phase] ?? view.phase}</span>
    <span class="hud-count">场上 ${view.units.filter((u) => u.hp > 0).length}</span>
  </div>
  <div class="controls">${controls}</div>`
}

/** 我方技能卡面（用 web 端卡图，缺失走占位） */
function rosterPanelHtml(s: BattleSession): string {
  const rows = s.own
    .map((h) => {
      const cards = h.activeSkillIds
        .map((id) => {
          const def = s.catalog.skillDefs.get(id)
          return cardFaceHtml({
            cardId: id,
            name: def?.name ?? id,
            rarity: def?.rarity,
            pathwayId: def?.pathwayId,
            kind: 'active',
            cost: def?.cost?.energy,
            size: 'compact',
          })
        })
        .join('')
      return `<div class="roster-row">
        <span class="roster-avatar">${avatarEmoji(h.constitutionId, h.gender)}</span>
        <span class="roster-name">${escapeHtml(h.name)}</span>
        <div class="roster-cards">${cards}</div>
      </div>`
    })
    .join('')
  return `<details class="roster"><summary>我方技能（主动 ${s.own.reduce((n, h) => n + h.activeSkillIds.length, 0)} 张）</summary>${rows}</details>`
}

function decisionBarHtml(s: BattleSession, pending: DecisionRequest, disabled = false): string {
  const cards = pending.candidates
    .map((c) => {
      const meta = c.occupant ? s.unitMeta.get(c.occupant) : undefined
      const name = meta?.name ?? c.occupant ?? '空位'
      const emoji = meta ? avatarEmoji(meta.constitutionId, meta.gender) : '⬜'
      return `<button type="button" class="pick" data-pick="${escapeHtml(c.occupant ?? '')}" ${disabled ? 'disabled' : ''}>
        <span class="pick-face">${emoji}</span><span class="pick-name">${escapeHtml(name)}</span></button>`
    })
    .join('')
  return `
  <div class="decision">
    <div class="decision-title">选择目标（${escapeHtml(pending.caster)} 的技能）${disabled ? ' · 已提交，等待同步…' : ''}</div>
    <div class="picks">${cards}</div>
    <button type="button" class="pick-auto" id="btn-auto-pick" ${disabled ? 'disabled' : ''}>交给 AI（自动选择）</button>
  </div>`
}

function endedHtml(s: BattleSession, outcome: string): string {
  const win = winOutcomeOf(s)
  const label = outcome === 'aborted' ? '本局中断' : outcome === win ? '我方胜利' : outcome === 'draw' ? '平局' : '敌方胜利'
  const v = s.online?.verify
  const note = !s.online
    ? ''
    : !v
      ? '<p class="hint">正在与对手比对事件指纹…</p>'
      : v.ok
        ? `<p class="hint ok">指纹一致 ${escapeHtml(v.mine)}</p>`
        : v.theirs === null
          ? '<p class="hint warn">对手未回传指纹，本局未验证（记为中断）</p>'
          : `<p class="hint warn">指纹不一致，本局未验证（记为中断）：我方 ${escapeHtml(v.mine)} / 对手 ${escapeHtml(v.theirs)}</p>`
  const again = s.online
    ? '<a class="btn primary" href="#/online">再来一局</a>'
    : '<a class="btn primary" href="#/new">再来一局</a>'
  return `<div class="ended"><div class="ended-card">
    <h2>${label}</h2>
    ${note}
    ${again}
    <a class="btn" href="#/leaderboard">看排行榜</a>
    <a class="btn" href="#/">返回主菜单</a>
  </div></div>`
}

function recordOf(s: BattleSession, outcome: CombatOutcome, stats: CombatStats): MatchRecord {
  const own = myFactionOf(s)
  const foe = foeFactionOf(s)
  return {
    id: `${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`,
    at: Date.now(),
    seed: s.setup.seed,
    outcome,
    win: outcome === winOutcomeOf(s),
    ticks: stats.ticks,
    unitsLostOwn: stats.unitsLost[own] ?? 0,
    unitsLostEnemy: stats.unitsLost[foe] ?? 0,
    damageDealtOwn: stats.damageDealt[own] ?? 0,
    damageDealtEnemy: stats.damageDealt[foe] ?? 0,
    heroes: s.own.map((h) => ({ name: h.name, classId: h.classId, constitutionId: h.constitutionId })),
  }
}

function wire(s: BattleSession, refresh: () => void, submit: (picks: DecisionInput) => void, canPick: boolean): void {
  const step = document.getElementById('btn-step')
  step?.addEventListener('click', () => {
    stepOnce(s)
    refresh()
  })
  const auto = document.getElementById('btn-auto')
  auto?.addEventListener('click', () => {
    if (autoTimer != null) {
      stopAuto()
      refresh()
      return
    }
    autoTimer = window.setInterval(() => {
      // 人已离开战斗页：停表，别在后台把整局推完（会记下一场没人看过的胜负）
      if (!onBattleRoute()) {
        stopAuto()
        return
      }
      if (s.facade.ended() || s.facade.pendingDecision()) {
        stopAuto()
        refresh()
        return
      }
      stepOnce(s)
      refresh()
    }, 450)
    refresh()
  })
  document.getElementById('btn-pause')?.addEventListener('click', () => {
    const runner = s.online?.runner
    if (!runner) return
    if (runner.isPaused) runner.resume()
    else runner.pause()
    refresh()
  })
  // 选一个 occupant 为目标：候选中取它（取不到则退回前 pickCount 个），与下方按钮面板同一条路径
  const pickTarget = (id: string): void => {
    const pending = s.facade.pendingDecision()
    if (!pending) return
    const pick = pending.candidates.filter((c) => c.occupant === id).slice(0, pending.pickCount)
    submit(pick.length > 0 ? pick : pending.candidates.slice(0, pending.pickCount))
  }

  document.querySelectorAll<HTMLElement>('[data-pick]').forEach((el) => {
    el.addEventListener('click', () => pickTarget(el.dataset.pick ?? ''))
  })
  // 板面上的高亮 tile 同样可点（光标已承诺可点，就别让它落空）
  // canPick：仅在本侧该决策时挂上——联机时对侧决策只观战，绝不本地代选（§3.4 铁律 1）
  if (canPick) {
    document.querySelectorAll<HTMLElement>('.tile.pickable[data-unit]').forEach((el) => {
      const id = el.dataset.unit ?? ''
      el.setAttribute('role', 'button')
      el.tabIndex = 0
      el.addEventListener('click', () => pickTarget(id))
      el.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter' && e.key !== ' ') return
        e.preventDefault()
        pickTarget(id)
      })
    })
  }
  document.getElementById('btn-auto-pick')?.addEventListener('click', () => {
    const pending = s.facade.pendingDecision()
    if (!pending) return
    submit(pending.candidates.slice(0, pending.pickCount))
  })
}

function stepOnce(s: BattleSession): void {
  if (s.facade.ended() || s.facade.pendingDecision()) return
  s.facade.step()
}

function stopAuto(): void {
  if (autoTimer != null) {
    window.clearInterval(autoTimer)
    autoTimer = null
  }
}

function logHtml(events: readonly DomainEvent[]): string {
  const lines = events.slice(-60).reverse().map((e) => `<div class="log-line">${describe(e)}</div>`)
  return lines.length > 0 ? lines.join('') : '<div class="log-line dim">（尚无事件）</div>'
}

function describe(e: DomainEvent): string {
  switch (e.type) {
    case 'TickAdvanced': return `— tick ${e.tickIndex} —`
    case 'GaugeCrossed': return `${e.unitId} 行动条满`
    case 'ActionOpportunityGranted': return `${e.opportunity.unitId} 获得行动机会`
    case 'TargetsResolved': return `结算目标 ×${e.targets.length}`
    case 'EffectApplied': return `效应用于 ${e.target.occupant ?? '空位'}`
    case 'StatusMounted': return `挂载状态 ${e.defId}`
    case 'StatusExpired': return `状态到期 ${e.defId}`
    case 'UnitSpawned': return `召唤 ${e.unitId}`
    case 'UnitDied': return `${e.unitId} 阵亡`
    case 'UnitTranslocated': return `${e.unitId} 被放逐`
    case 'UnitReturned': return `${e.unitId} 回归`
    case 'DomainPlaced': return `界域展开 ${e.defId}`
    case 'ZonePlaced': return `区域布下`
    default: return e.type
  }
}
