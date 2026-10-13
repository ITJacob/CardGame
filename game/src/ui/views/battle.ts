// 战斗界面：棋盘（双朝向投影）+ 日志 + 决策点选靶 + 推进。
// 两种驱动：
//   离线人机 —— 用户点「推进一 tick / 自动播放」，决策直接 submitDecision；
//   联机 lockstep —— MatchRunner 自动推进，本侧决策走 MatchRunner.publish，
//                    对侧决策只等待（绝不本地回退，P7_PLAN §3.4 铁律 1）。
import { escapeHtml, subBarHtml } from '../components/chrome'
import { cardDetailHtml, cardFaceHtml, hydrateArt } from '../components/cardFace'
import { heroAvatarHtml, hydrateHeroArt } from '../components/hero'
import { icon } from '../components/icons'
import { enableHoverCard, hideCardPop } from '../hover'
import { enablePan } from '../pan'
import { getSession } from '../session'
import { gridSpec, laneIndexer, orientationOf, type Orientation } from '../battle/projection'
import { LANE_CAPACITY } from '../../kernel/battle/types'
import type { Coordinate } from '../../kernel/battle/types'
import { DEFAULT_LANES, laneLabel } from '../../meta/formation'
import { constitutionById } from '../../meta/constitution'
import type { DomainEvent } from '../../kernel/combat/types'
import type { CombatStats, CombatView, UnitViewLite } from '../../kernel/combat/types'
import type { DecisionInput, DecisionRequest } from '../../kernel/execution/types'
import type { FactionId } from '../../kernel/ids'
import type { MatchRecord } from '../../meta/matchLog'
import { fingerprintOf } from '../../kernel/combat/fingerprint'
import { MatchRunner } from '../../meta/match/runner'

type CombatOutcome = 'side_a' | 'side_b' | 'draw' | 'aborted'
/** 非操作时机的查看目标：点单位看身份+状态，点空格看格位；己方落底部条、敌方落右上浮层 */
type Inspect = { kind: 'unit'; id: string } | { kind: 'slot'; coord: string }
import type { BattleSession, UnitMeta } from '../session'
import { createLocalStorageMatchStore } from '../../meta/matchLog'

/** 战场时钟的 rAF 句柄（模块级：重进视图时取消旧闭包的循环，防止旧会话被继续推进） */
let clockRaf: number | null = null
/** 前台战斗视图的重画钩子（离开视图即置空），供模块级 resize 监听转发 */
let activeRefresh: (() => void) | null = null
let resizeHooked = false
/** 联机每 tick 的观战节拍（毫秒）；0 会让整局在一帧内跑完 */
const ONLINE_STEP_MS = 450
/** 离线自动的 tick 间隔（与旧 setInterval 同速）：一圈时钟扫过 = 一个 tick 的动画窗 */
const AUTO_TICK_MS = 450
/** 决策提交后留一拍让结果落地（HP 跳动/状态变化被看见），再续时钟 */
const RESULT_HOLD_MS = 350
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
  stopClock()
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
  /** 浮层抽屉开合：refresh 每 tick 整页重画，靠这两个闭包把状态带回模板（否则每 tick 自动关） */
  let logOpen = false
  let rosterOpen = false
  /** 非操作时机的查看目标（同抽屉范式：refresh 每 tick 重画，状态记闭包、由模板带回） */
  let inspect: Inspect | null = null
  /** 自动推进开关（离线）。时钟启动后不退出：决策点只是冻结，提交后续走 */
  let autoOn = false
  /** 上一个已见的 tick：refresh 也可能由非 tick 事件（查看面板开关等）触发，靠它识别真推进 */
  let lastTick = -1
  /** 当前 tick 动画窗的起点（performance.now() 时间轴） */
  let tickStart = 0

  const refresh = (): void => {
    const view = s.facade.state()
    const pending = s.facade.pendingDecision()
    const ended = s.facade.ended()
    // 查看目标被移除（放逐/消散）就收起面板
    if (inspect?.kind === 'unit' && !view.units.some((u) => u.id === (inspect as { id: string }).id)) inspect = null
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
    // tick 变了 = 真推进了一格：时钟动画窗从这里重新起扫
    if (view.tick !== lastTick) {
      lastTick = view.tick
      tickStart = performance.now()
    }
    const myTurn = pending != null && casterFaction(s, pending.caster) === myFactionOf(s)
    /** 本侧该决策且未提交 → 板面高亮 tile 可点选 */
    const canPick = pending != null && (!s.online || myTurn) && !submitted
    const showDecision = pending != null && (!s.online || myTurn)
    /** 非操作时机（含联机观战）点开信息面板；决策条在显示时让位 */
    const canInspect = !showDecision && ended == null
    // 整页重画会把棋盘滚回原点、抽屉一并关掉——先把这两样状态摘出来，画完再落回去
    const wrap0 = host.querySelector<HTMLElement>('.board-wrap')
    const scrollLeft = wrap0?.scrollLeft ?? 0
    const scrollTop = wrap0?.scrollTop ?? 0
    host.innerHTML = `
      ${subBarHtml(s.online ? '联机对局' : '对局')}
      <div class="battle" data-orient="${currentOrientation()}">
        <div class="board-wrap">${boardHtml(s, view, pending?.candidates.map((c) => c.occupant) ?? [], canPick, canInspect, pending?.caster ?? null)}</div>
        ${hudHtml(s, view, pending != null, ended != null, logOpen, rosterOpen, autoOn)}
        ${drawerHtml('roster', '我方技能', rosterHtml(s), rosterOpen)}
        ${drawerHtml('log', '战斗日志', `<div class="cg-scroll log" id="battle-log">${logHtml(s, s.facade.drainEvents())}</div>`, logOpen)}
      </div>
      ${showDecision ? decisionBarHtml(s, pending, submitted) : inspect ? inspectPanelHtml(s, view, inspect) : ''}
      ${ended ? endedHtml(s, ended.outcome) : ''}`
    hydrateArt(host)
    hydrateHeroArt(host)
    const wrap = host.querySelector<HTMLElement>('.board-wrap')
    if (wrap) {
      wrap.scrollLeft = scrollLeft
      wrap.scrollTop = scrollTop
      enablePan(host, { viewport: wrap })
    }
    wire(s, refresh, submit, canPick, canInspect, toggleInspect, toggleAuto)
    wireDrawers()
    // 时钟只在「自动开着（离线）/ 联机 runner 在跑」时走；手动模式它就是一枚静止的装饰
    if (autoOn || s.online) clockStart()
  }

  /** 点同一个目标再点一次 = 收起；传 null 直接收起（面板 ✕） */
  const toggleInspect = (next: Inspect | null): void => {
    const same =
      next != null &&
      ((inspect?.kind === 'unit' && next.kind === 'unit' && inspect.id === next.id) ||
        (inspect?.kind === 'slot' && next.kind === 'slot' && inspect.coord === next.coord))
    inspect = same ? null : next
    refresh()
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
    // 决策落地留一拍再续时钟，让用户看见结果（联机节奏归 MatchRunner，不在这里留）
    if (autoOn) tickStart = performance.now() + RESULT_HOLD_MS
  }

  /** 自动开关：启动时钟即「一直自动」，决策点冻结而非退出 */
  const toggleAuto = (): void => {
    autoOn = !autoOn
    if (autoOn) {
      tickStart = performance.now()
      clockStart()
    }
    refresh()
  }

  /**
   * 战场时钟循环：一圈扫过 = 一个 tick 的动画窗（状态生效/能量增减等系统表现在这扇窗里落地）。
   * 到窗尾：离线 stepOnce 推进一格；联机由 MatchRunner 自己推进，这里只把圈绕回去。
   * 决策点/联机暂停 → 冻结（is-paused），rAF 挂着空转，恢复后从原进度续走。
   */
  const clockLoop = (now: number): void => {
    clockRaf = null
    // 离开战斗页：停钟，别在后台把整局推完（会记下一场没人看过的胜负）
    if (!onBattleRoute() || (!autoOn && !s.online)) return
    if (s.facade.ended()) return
    const clockEl = host.querySelector<HTMLElement>('.battle-clock')
    if (s.facade.pendingDecision() || s.online?.runner?.isPaused) {
      clockEl?.classList.add('is-paused')
      clockRaf = requestAnimationFrame(clockLoop)
      return
    }
    clockEl?.classList.remove('is-paused')
    const span = s.online ? ONLINE_STEP_MS : AUTO_TICK_MS
    const p = Math.max(0, Math.min(100, ((now - tickStart) / span) * 100))
    clockEl?.style.setProperty('--p', String(p))
    if (p >= 100) {
      tickStart = now
      if (!s.online) {
        stepOnce(s)
        refresh()
        return // refresh 末尾已 clockStart，这里不再续帧，免得同一帧挂两条循环
      }
    }
    clockRaf = requestAnimationFrame(clockLoop)
  }
  const clockStart = (): void => {
    if (clockRaf == null) clockRaf = requestAnimationFrame(clockLoop)
  }

  /**
   * 抽屉开关：只翻那一个容器的 .is-open + 按钮的 aria-pressed，不整页重画
   * （refresh 每 tick 会重画，但开关状态记在闭包里，重画时由模板带回来）。
   */
  const wireDrawers = (): void => {
    const toggle = (id: 'log' | 'roster', open: boolean): void => {
      host.querySelector(`.battle-drawer--${id}`)?.classList.toggle('is-open', open)
      document.getElementById(`btn-${id}`)?.setAttribute('aria-pressed', String(open))
    }
    document.getElementById('btn-log')?.addEventListener('click', () => {
      logOpen = !logOpen
      toggle('log', logOpen)
    })
    document.getElementById('btn-roster')?.addEventListener('click', () => {
      rosterOpen = !rosterOpen
      toggle('roster', rosterOpen)
    })
    host.querySelectorAll<HTMLElement>('[data-drawer-close]').forEach((el) => {
      el.addEventListener('click', () => {
        const id = el.dataset.drawerClose === 'roster' ? 'roster' : 'log'
        if (id === 'log') logOpen = false
        else rosterOpen = false
        toggle(id, false)
      })
    })
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

function coordKey(c: Coordinate): string {
  return `${c.faction}|${c.lane}|${c.index}`
}

function boardHtml(s: BattleSession, view: CombatView, candidateIds: (string | null)[], canPick: boolean, canInspect: boolean, actingId: string | null): string {
  // lane 清单取「内核默认两路 ∪ 场上实见」的并集：一路被打空（甚至全员放逐）时空格仍要渲染
  const seen = view.units.map((u) => u.coordinate?.lane).filter((l): l is string => !!l)
  const laneList = [...new Set<string>([...DEFAULT_LANES, ...seen])].sort()
  const laneIdx = laneIndexer(laneList)
  const ownFaction = view.units.find((u) => s.unitMeta.get(u.id)?.side === 'own')?.faction ?? 'A'
  const foeFaction = s.setup.factions.find((f) => f.id !== ownFaction)?.id ?? 'B'
  const orient = currentOrientation()
  const spec = gridSpec(orient, ownFaction, laneIdx)
  const cand = new Set(candidateIds.filter((x): x is string => !!x))

  const occupied = new Map<string, UnitViewLite>()
  for (const u of view.units) if (u.coordinate) occupied.set(coordKey(u.coordinate), u)

  const cells: string[] = []
  for (const faction of [ownFaction, foeFaction]) {
    for (const lane of laneList) {
      for (let index = 0; index < LANE_CAPACITY; index += 1) {
        const coord: Coordinate = { faction, lane, index }
        const u = occupied.get(coordKey(coord))
        const { col, row } = spec.place(coord)
        cells.push(u ? tileHtml(s, u, col, row, cand.has(u.id), canPick, u.id === actingId) : slotHtml(coord, col, row, faction === ownFaction))
      }
    }
  }
  // 中线分割线：占中线轨道、纵贯/横穿另一轴
  const mid =
    orient === 'landscape'
      ? `<div class="board-mid" style="grid-column:${spec.midTrack};grid-row:1 / -1"></div>`
      : `<div class="board-mid" style="grid-row:${spec.midTrack};grid-column:1 / -1"></div>`

  // minmax 的最小格宽：宽裕时 1fr 铺满，被压到 112px 仍放不下就整体溢出 → 触发拖拽平移；
  // 中线轨道窄且 fr 小，挤压时优先让位
  const cell = 'minmax(112px, 1fr)'
  const gapTrack = 'minmax(28px, 0.25fr)'
  const template =
    orient === 'landscape'
      ? `grid-template-columns:repeat(${LANE_CAPACITY}, ${cell}) ${gapTrack} repeat(${LANE_CAPACITY}, ${cell}); grid-template-rows:repeat(${spec.rows}, ${cell})`
      : `grid-template-columns:repeat(${spec.columns}, ${cell}); grid-template-rows:repeat(${LANE_CAPACITY}, ${cell}) ${gapTrack} repeat(${LANE_CAPACITY}, ${cell})`
  // can-inspect 只控光标与空格 hover，不改变渲染
  return `<div class="board${canInspect ? ' can-inspect' : ''}" style="${template}">${mid}${cells.join('')}</div>`
}

/** 空格：虚线框占位，非操作时机可点看格位信息（接线见 wire）。
   .slot 只摆网格壳（与 .unit 同一模板），虚线框是内层 .slot-box——它落在 card 区，
   大小与英雄卡面一致。 */
function slotHtml(coord: Coordinate, col: number, row: number, own: boolean): string {
  return `<div class="slot${own ? ' own' : ''}" style="grid-column:${col};grid-row:${row}" data-coord="${escapeHtml(coordKey(coord))}"><div class="slot-box"></div></div>`
}

/** 状态名走中文词典：catalog.statusDefs 的 name 可选，故回退裸 id（与 prepare/hero 的取名范式一致） */
function statusName(s: BattleSession, defId: string): string {
  return s.catalog.statusDefs.get(defId)?.name ?? defId
}

/** 职业名走中文词典：classDefs 的 name 必有；缺 meta（召唤物）就没职业可写 */
function classNameOf(s: BattleSession, meta: UnitMeta | undefined): string {
  return meta ? s.catalog.classDefs.get(meta.classId)?.name ?? meta.classId : ''
}

/**
 * 状态 chip。short=true（战场棋子上）：只显示状态名首字 + 层数，buff 淡绿底、debuff 淡红底，
 * 全名与详情在点开的信息栏里看（信息栏走 short=false）。
 */
function chipHtml(s: BattleSession, st: { defId: string; stacks: number }, short = false): string {
  const def = s.catalog.statusDefs.get(st.defId)
  const name = def?.name ?? st.defId
  const cat = def?.category ?? []
  const pol = cat.includes('buff') ? ' buff' : cat.includes('debuff') ? ' debuff' : ''
  const text = short ? ([...name][0] ?? name) : name
  return `<span class="chip${pol}">${escapeHtml(text)}${st.stacks > 1 ? `×${st.stacks}` : ''}</span>`
}

/**
 * 战场单位卡。大头像铺满整张卡、血条压在卡底、行动条做成左上角圆形扇叶；
 * 状态标签渲染在**卡外**单边一条（横屏卡上方、竖屏卡左侧，首字缩写，放不下截断）；
 * 名字/职业默认隐去，hover / 选中(targetable) / 聚焦 时随卡一起完整呈现。
 * targetable = 当前决策的合法目标（视觉高亮）；pickable = 本侧可点选（此时才给抓手光标，避免空承诺）。
 * acting = 当前轮到行动的单位：卡面放大突出。
 */
function tileHtml(s: BattleSession, u: UnitViewLite, col: number, row: number, targetable: boolean, canPick: boolean, acting: boolean): string {
  const meta = s.unitMeta.get(u.id)
  const side = meta?.side ?? (u.id.length > 0 ? 'enemy' : 'own')
  // 召唤物等没有名册元数据的单位：留在 emoji 档（heroAvatarHtml 的垫底层就是这个）。
  // 满铺头像实渲尺寸比老 .tile 大得多（格子 ≥112px、cover 后按格宽算），sizes 给大档，别再按 56px 估
  const avatar = meta ? heroAvatarHtml(meta, '(orientation: landscape) min(22vw, 48vh), 50vw') : '❓'
  const hpPct = Math.max(0, Math.round((u.hp / Math.max(1, u.hpMax)) * 100))
  const gaugePct = Math.max(0, Math.min(100, Math.round((u.gauge / 75) * 100)))
  const dead = u.hp <= 0
  const chips = u.statuses.map((st) => chipHtml(s, st, true))
  const cls = ['unit', side, dead ? 'dead' : '', targetable ? 'targetable' : '', targetable && canPick ? 'pickable' : '', acting ? 'acting' : '']
    .filter(Boolean)
    .join(' ')
  const clsname = classNameOf(s, meta)
  return `
  <div class="${cls}" style="grid-column:${col};grid-row:${row}" data-unit="${escapeHtml(u.id)}">
    <div class="unit-chips">${chips.join('')}</div>
    <div class="unit-card">
      <span class="unit-art">${avatar}</span>
      <div class="unit-gauge" style="--p:${gaugePct}"></div>
      <div class="unit-name">${escapeHtml(meta?.name ?? u.id)}${clsname ? `<span class="unit-class">${escapeHtml(clsname)}</span>` : ''}</div>
      <div class="cg-progress bar hp">
        <div class="cg-progress__track"><div class="cg-progress__bar cg-progress__bar--warn" style="width:${hpPct}%"></div></div>
        <span class="bar-num">${u.hp}/${u.hpMax}</span>
      </div>
    </div>
  </div>`
}

/**
 * 顶部悬浮 HUD：tick/阶段/场上数 + 控件 + 「日志」「名册」两个抽屉开关。
 * 整块浮在棋盘之上（.battle-hud），不再占右栏。联机的中断/等待提示也并进这条。
 */
function hudHtml(s: BattleSession, view: CombatView, pending: boolean, ended: boolean, logOpen: boolean, rosterOpen: boolean, autoOn: boolean): string {
  const phaseName: Record<string, string> = { midnight: '午夜', dawn: '黎明', day: '白昼', dusk: '黄昏', night: '黑夜' }
  const runner = s.online?.runner
  const controls = s.online
    ? `<button type="button" class="cg-btn cg-btn--sm" id="btn-pause">${runner?.isPaused ? '继续' : '暂停'}</button>
       <span class="hud-count">决策 #${runner?.decisionSeq ?? 0}</span>`
    : `<button type="button" class="cg-btn cg-btn--sm" id="btn-step" ${pending || ended ? 'disabled' : ''}>推进一 tick</button>
       <button type="button" class="cg-btn cg-btn--sm" id="btn-auto" aria-pressed="${autoOn}" ${ended ? 'disabled' : ''}>${autoOn ? '停止自动' : '自动播放'}</button>`
  const warn = runner?.lastError
    ? `<p class="warn hud-warn">联机中断：${escapeHtml(errMsg(runner.lastError))}</p>`
    : runner?.waiting
      ? '<p class="wait-note hud-warn">等待对手决策…</p>'
      : ''
  return `
  <div class="battle-hud">
    <div class="hud">
      <span class="battle-clock" aria-hidden="true"></span>
      <span class="hud-tick">tick ${view.tick}</span>
      <span class="hud-phase">${phaseName[view.phase] ?? view.phase}</span>
      <span class="hud-count">场上 ${view.units.filter((u) => u.hp > 0).length}</span>
    </div>
    <div class="controls">${controls}</div>
    <div class="hud-tabs">
      <button type="button" class="cg-btn cg-btn--sm" id="btn-log" aria-pressed="${logOpen}" aria-controls="battle-log">日志</button>
      <button type="button" class="cg-btn cg-btn--sm" id="btn-roster" aria-pressed="${rosterOpen}">名册</button>
    </div>
  </div>${warn}`
}

/** 右侧悬浮抽屉外壳：标题栏（含关闭键）+ 内容。开合只翻 .is-open（见 wireDrawers）。 */
function drawerHtml(id: string, title: string, inner: string, open: boolean): string {
  return `<aside class="battle-drawer battle-drawer--${id}${open ? ' is-open' : ''}">
    <div class="cg-panel drawer-panel">
      <div class="cg-panel__head">
        <span class="cg-panel__title">${title}</span>
        <button type="button" class="cg-close" data-drawer-close="${id}" aria-label="关闭">${icon('cg-close')}</button>
      </div>
      <div class="drawer-body">${inner}</div>
    </div>
  </aside>`
}

/** 名册抽屉内容：我方技能卡面（用 web 端卡图，缺失走占位）。外壳由 drawerHtml 给。 */
function rosterHtml(s: BattleSession): string {
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
        <span class="roster-avatar">${heroAvatarHtml(h, '30px')}</span>
        <span class="roster-name">${escapeHtml(h.name)}</span>
        <div class="roster-cards">${cards}</div>
      </div>`
    })
    .join('')
  return `<p class="drawer-meta">主动 ${s.own.reduce((n, h) => n + h.activeSkillIds.length, 0)} 张</p>${rows}`
}

/**
 * 操作者身份块：大头像 + 名称 + 职业·体质·力敏智。
 * 决策条与信息面板共用——名称/体质这些非实时信息不常显在棋子上，要看就聚到这里。
 */
function actorBlockHtml(s: BattleSession, name: string, meta: UnitMeta | undefined): string {
  const sub = meta
    ? `${classNameOf(s, meta)} · ${constitutionById(meta.constitutionId)?.name ?? meta.constitutionId} · ${meta.combo.strength}力/${meta.combo.agility}敏/${meta.combo.intelligence}智`
    : ''
  const avatar = meta ? `<span class="actor-avatar">${heroAvatarHtml(meta, '72px')}</span>` : ''
  return `<div class="actor">${avatar}<div class="actor-id">
    <div class="actor-name">${escapeHtml(name)}</div>
    ${sub ? `<div class="actor-sub">${escapeHtml(sub)}</div>` : ''}
  </div></div>`
}

function decisionBarHtml(s: BattleSession, pending: DecisionRequest, disabled = false): string {
  const cards = pending.candidates
    .map((c) => {
      const meta = c.occupant ? s.unitMeta.get(c.occupant) : undefined
      const name = meta?.name ?? c.occupant ?? '空位'
      const face = meta ? heroAvatarHtml(meta, '26px') : '⬜'
      return `<button type="button" class="cg-btn cg-btn--sm pick" data-pick="${escapeHtml(c.occupant ?? '')}" ${disabled ? 'disabled' : ''}>
        <span class="pick-face">${face}</span><span class="pick-name">${escapeHtml(name)}</span></button>`
    })
    .join('')
  const meta = s.unitMeta.get(pending.caster)
  return `
  <div class="cg-panel decision">
    ${actorBlockHtml(s, meta?.name ?? pending.caster, meta)}
    <div class="decision-main">
      <div class="decision-title">选择目标${disabled ? ' · 已提交，等待同步…' : ''}</div>
      <div class="picks">${cards}</div>
      <button type="button" class="cg-btn cg-btn--sm cg-btn--block pick-auto" id="btn-auto-pick" ${disabled ? 'disabled' : ''}>交给 AI（自动选择）</button>
    </div>
  </div>`
}

/** 格位描述：「1路 · 第2排 · 我方」 */
function coordText(s: BattleSession, c: { faction: string; lane: string; index: number }): string {
  return `${laneLabel(c.lane)} · 第${c.index + 1}排 · ${c.faction === myFactionOf(s) ? '我方' : '敌方'}`
}

/**
 * 非操作时机的信息面板：己方单位/空格 → 底部条（与操作栏同一槽位，decision--inspect）；
 * 敌方 → 右上浮层。内容为身份 + 实时状态（HP/能量/格位/状态列表），不含技能（在名册抽屉）。
 */
function inspectPanelHtml(s: BattleSession, view: CombatView, sel: Inspect): string {
  const close = `<button type="button" class="cg-close inspect-close" id="btn-inspect-close" aria-label="关闭">${icon('cg-close')}</button>`
  if (sel.kind === 'slot') {
    const [faction, lane, indexStr] = sel.coord.split('|')
    const inner = `${actorBlockHtml(s, '空位', undefined)}
      <div class="inspect-body"><span class="inspect-stat">${escapeHtml(coordText(s, { faction, lane, index: Number(indexStr) }))}</span></div>`
    return faction === myFactionOf(s)
      ? `<div class="cg-panel decision decision--inspect">${inner}${close}</div>`
      : `<aside class="cg-panel inspect-foe">${inner}${close}</aside>`
  }
  const u = view.units.find((x) => x.id === sel.id)
  if (!u) return ''
  const meta = s.unitMeta.get(u.id)
  const own = meta ? meta.side === 'own' : u.faction === myFactionOf(s)
  const chips = u.statuses.map((st) => chipHtml(s, st)).join('')
  const stats = [
    `HP ${u.hp}/${u.hpMax}`,
    `能量 ${u.energy}`,
    u.coordinate ? escapeHtml(coordText(s, u.coordinate)) : '离场',
  ]
  const inner = `${actorBlockHtml(s, meta?.name ?? u.id, meta)}
    <div class="inspect-body">
      ${stats.map((t) => `<span class="inspect-stat">${t}</span>`).join('')}
      ${chips ? `<span class="inspect-chips">${chips}</span>` : ''}
    </div>`
  return own
    ? `<div class="cg-panel decision decision--inspect">${inner}${close}</div>`
    : `<aside class="cg-panel inspect-foe">${inner}${close}</aside>`
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
    ? '<a class="cg-btn cg-btn--primary" href="#/online">再来一局</a>'
    : '<a class="cg-btn cg-btn--primary" href="#/new">再来一局</a>'
  // 结算 = kit 的模态（`.cg-modal.is-open` 才显示）。`.ended/.ended-card` 只留作测试钩子。
  return `<div class="cg-modal is-open ended" role="dialog" aria-modal="true">
    <div class="cg-modal__backdrop"></div>
    <div class="cg-modal__dialog ended-card">
      <div class="cg-modal__head"><h2 class="cg-modal__title">${label}</h2></div>
      <div class="cg-modal__body">${note || '<p>本局结束。</p>'}</div>
      <div class="cg-modal__foot">
        ${again}
        <a class="cg-btn" href="#/leaderboard">看排行榜</a>
        <a class="cg-btn cg-btn--ghost" href="#/">返回主菜单</a>
      </div>
    </div>
  </div>`
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

function wire(s: BattleSession, refresh: () => void, submit: (picks: DecisionInput) => void, canPick: boolean, canInspect: boolean, toggleInspect: (next: Inspect | null) => void, toggleAuto: () => void): void {
  const step = document.getElementById('btn-step')
  step?.addEventListener('click', () => {
    stepOnce(s)
    refresh()
  })
  document.getElementById('btn-auto')?.addEventListener('click', toggleAuto)
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
    document.querySelectorAll<HTMLElement>('.unit.pickable[data-unit]').forEach((el) => {
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
  // 非操作时机：点单位/空格查看信息（操作时机这些位置是选靶，见上方 pickable 接线；
  // 「已提交待同步」也算操作时机——此时点开也显示不出来，决策条在占位）
  if (canInspect) {
    document.querySelectorAll<HTMLElement>('.unit[data-unit]').forEach((el) => {
      el.addEventListener('click', () => toggleInspect({ kind: 'unit', id: el.dataset.unit ?? '' }))
    })
    document.querySelectorAll<HTMLElement>('.slot[data-coord]').forEach((el) => {
      el.addEventListener('click', () => toggleInspect({ kind: 'slot', coord: el.dataset.coord ?? '' }))
    })
  }
  document.getElementById('btn-inspect-close')?.addEventListener('click', () => toggleInspect(null))
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

function stopClock(): void {
  if (clockRaf != null) {
    window.cancelAnimationFrame(clockRaf)
    clockRaf = null
  }
}

function logHtml(s: BattleSession, events: readonly DomainEvent[]): string {
  const lines = events.slice(-60).reverse().map((e) => `<div class="log-line">${describe(s, e)}</div>`)
  return lines.length > 0 ? lines.join('') : '<div class="log-line dim">（尚无事件）</div>'
}

/** 日志里的单位名走名册：召唤物没有 meta，回退裸 id（与卡面同一套降级） */
function unitNameOf(s: BattleSession, id: string): string {
  return s.unitMeta.get(id)?.name ?? id
}

function describe(s: BattleSession, e: DomainEvent): string {
  switch (e.type) {
    case 'TickAdvanced': return `— tick ${e.tickIndex} —`
    case 'GaugeCrossed': return `${unitNameOf(s, e.unitId)} 行动条满`
    case 'ActionOpportunityGranted': return `${unitNameOf(s, e.opportunity.unitId)} 获得行动机会`
    case 'TargetsResolved': return `结算目标 ×${e.targets.length}`
    case 'EffectApplied': return `效应用于 ${e.target.occupant ? unitNameOf(s, e.target.occupant) : '空位'}`
    case 'StatusMounted': return `挂载状态 ${statusName(s, e.defId)}`
    case 'StatusExpired': return `状态到期 ${statusName(s, e.defId)}`
    case 'UnitSpawned': return `召唤 ${unitNameOf(s, e.unitId)}`
    case 'UnitDied': return `${unitNameOf(s, e.unitId)} 阵亡`
    case 'UnitTranslocated': return `${unitNameOf(s, e.unitId)} 被放逐`
    case 'UnitReturned': return `${unitNameOf(s, e.unitId)} 回归`
    case 'DomainPlaced': return `界域展开 ${e.defId}`
    case 'ZonePlaced': return `区域布下`
    default: return e.type
  }
}
