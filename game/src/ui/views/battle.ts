// 战斗界面：棋盘（双朝向投影）+ 日志 + 决策点选靶 + 推进。
import { escapeHtml, subBarHtml } from '../components/chrome'
import { avatarEmoji, cardFaceHtml, hydrateArt } from '../components/cardFace'
import { getSession } from '../session'
import { gridSpec, laneIndexer, orientationOf, type Orientation } from '../battle/projection'
import type { DomainEvent } from '../../kernel/combat/types'
import type { CombatView, UnitViewLite } from '../../kernel/combat/types'
import type { BattleSession } from '../session'

let autoTimer: number | null = null

export function renderBattle(host: HTMLElement): void {
  stopAuto()
  const session = getSession()
  if (!session) {
    host.innerHTML = `${subBarHtml('对局')}<main class="placeholder"><h1>没有进行中的对局</h1><p><a href="#/">返回主菜单</a></p></main>`
    return
  }

  const s = session
  const refresh = (): void => {
    const view = s.facade.state()
    const pending = s.facade.pendingDecision()
    const ended = s.facade.ended()
    host.innerHTML = `
      ${subBarHtml('对局')}
      <div class="battle" data-orient="${currentOrientation()}">
        <div class="board-wrap">${boardHtml(s, view, pending?.candidates.map((c) => c.occupant) ?? [])}</div>
        <div class="battle-side">
          ${statusBarHtml(view, pending != null, ended != null)}
          ${rosterPanelHtml(s)}
          <div class="log" id="battle-log">${logHtml(s.facade.drainEvents())}</div>
        </div>
      </div>
      ${pending ? decisionBarHtml(s, pending) : ''}
      ${ended ? endedHtml(ended.outcome) : ''}`
    hydrateArt(host)
    wire(s, refresh)
  }

  refresh()
  window.addEventListener('resize', refresh, { once: true })
}

function currentOrientation(): Orientation {
  return orientationOf(window.innerWidth, window.innerHeight)
}

function boardHtml(s: BattleSession, view: CombatView, candidateIds: (string | null)[]): string {
  const lanes = view.units.map((u) => u.coordinate?.lane).filter((l): l is string => !!l)
  const laneIdx = laneIndexer(lanes.length > 0 ? lanes : ['lane0', 'lane1'])
  const ownFaction = view.units.find((u) => s.unitMeta.get(u.id)?.side === 'own')?.faction ?? 'A'
  const spec = gridSpec(currentOrientation(), ownFaction, laneIdx)
  const cand = new Set(candidateIds.filter((x): x is string => !!x))

  const tiles = view.units
    .filter((u) => u.coordinate)
    .map((u) => {
      const { col, row } = spec.place(u.coordinate!)
      return tileHtml(s, u, col, row, cand.has(u.id))
    })
    .join('')

  return `<div class="board" style="grid-template-columns:repeat(${spec.columns},1fr);grid-template-rows:repeat(${spec.rows},1fr)">${tiles}</div>`
}

function tileHtml(s: BattleSession, u: UnitViewLite, col: number, row: number, targetable: boolean): string {
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
  <div class="tile ${side}${dead ? ' dead' : ''}${targetable ? ' targetable' : ''}" style="grid-column:${col};grid-row:${row}" data-unit="${escapeHtml(u.id)}">
    <div class="avatar">${emoji}</div>
    <div class="tname">${escapeHtml(meta?.name ?? u.id)}<span class="tclass">${escapeHtml(meta?.classId ?? '')}</span></div>
    <div class="bar hp"><i style="width:${hpPct}%"></i><span>${u.hp}/${u.hpMax}</span></div>
    <div class="bar gauge"><i style="width:${gaugePct}%"></i></div>
    <div class="statuses">${statuses}</div>
  </div>`
}

function statusBarHtml(view: CombatView, pending: boolean, ended: boolean): string {
  const phaseName: Record<string, string> = { midnight: '午夜', dawn: '黎明', day: '白昼', dusk: '黄昏', night: '黑夜' }
  return `
  <div class="hud">
    <span class="hud-tick">tick ${view.tick}</span>
    <span class="hud-phase">${phaseName[view.phase] ?? view.phase}</span>
    <span class="hud-count">场上 ${view.units.filter((u) => u.hp > 0).length}</span>
  </div>
  <div class="controls">
    <button type="button" id="btn-step" ${pending || ended ? 'disabled' : ''}>推进一 tick</button>
    <button type="button" id="btn-auto" ${ended ? 'disabled' : ''}>自动播放</button>
  </div>`
}

/** 我方技能卡面（用 web 端卡图，缺失走占位） */
function rosterPanelHtml(s: BattleSession): string {
  const rows = s.own
    .map((h) => {
      const cards = h.activeSkillIds
        .map((id) => {
          const def = s.catalog.skillDefs.get(id)
          return cardFaceHtml({ cardId: id, name: def?.name ?? id, rarity: def?.rarity, compact: true })
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

function decisionBarHtml(s: BattleSession, pending: NonNullable<ReturnType<BattleSession['facade']['pendingDecision']>>): string {
  const cards = pending.candidates
    .map((c) => {
      const meta = c.occupant ? s.unitMeta.get(c.occupant) : undefined
      const name = meta?.name ?? c.occupant ?? '空位'
      const emoji = meta ? avatarEmoji(meta.constitutionId, meta.gender) : '⬜'
      return `<button type="button" class="pick" data-pick="${escapeHtml(c.occupant ?? '')}">
        <span class="pick-face">${emoji}</span><span class="pick-name">${escapeHtml(name)}</span></button>`
    })
    .join('')
  return `
  <div class="decision">
    <div class="decision-title">选择目标（${escapeHtml(pending.caster)} 的技能）</div>
    <div class="picks">${cards}</div>
    <button type="button" class="pick-auto" id="btn-auto-pick">交给 AI（自动选择）</button>
  </div>`
}

function endedHtml(outcome: string): string {
  const text: Record<string, string> = { side_a: '我方胜利', side_b: '敌方胜利', draw: '平局', aborted: '中断' }
  return `<div class="ended"><div class="ended-card"><h2>${text[outcome] ?? outcome}</h2><a class="btn" href="#/">返回主菜单</a></div></div>`
}

function wire(s: BattleSession, refresh: () => void): void {
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
  document.querySelectorAll<HTMLElement>('[data-pick]').forEach((el) => {
    el.addEventListener('click', () => {
      const id = el.dataset.pick ?? ''
      const pending = s.facade.pendingDecision()
      if (!pending) return
      const pick = pending.candidates.filter((c) => c.occupant === id).slice(0, pending.pickCount)
      s.facade.submitDecision(pick.length > 0 ? pick : pending.candidates.slice(0, pending.pickCount))
      refresh()
    })
  })
  document.getElementById('btn-auto-pick')?.addEventListener('click', () => {
    const pending = s.facade.pendingDecision()
    if (!pending) return
    s.facade.submitDecision(pending.candidates.slice(0, pending.pickCount))
    refresh()
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
