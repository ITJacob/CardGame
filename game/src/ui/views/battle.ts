// 战斗界面：棋盘（双朝向投影）+ 日志 + 决策点选靶 + 推进。
// 两种驱动：
//   离线人机 —— 用户点「推进一 tick / 自动播放」，决策直接 submitDecision；
//   联机 lockstep —— MatchRunner 自动推进，本侧决策走 MatchRunner.publish，
//                    对侧决策只等待（绝不本地回退，P7_PLAN §3.4 铁律 1）。
import { escapeHtml, subBarHtml } from '../components/chrome'
import { cardDetailHtml, cardFaceHtml, hydrateArt } from '../components/cardFace'
import { emblemHtml } from '../components/emblem'
import { heroAvatarHtml, hydrateHeroArt } from '../components/hero'
import { icon } from '../components/icons'
import { enableHoverCard, hideCardPop } from '../hover'
import { enablePan } from '../pan'
import { getSession } from '../session'
import { gridSpec, laneIndexer, orientationOf, type Orientation } from '../battle/projection'
import { LANE_CAPACITY, TICK_MINUTES, TICK_PER_DAY } from '../../kernel/battle/types'
import type { Coordinate } from '../../kernel/battle/types'
import { BASIC_ATTACK_ID } from '../../kernel/combat/basicAttack'
import { phaseOf } from '../../kernel/scheduling/scheduler'
import type { UnitId } from '../../kernel/ids'
import { dataVersion, shortHash } from '../../data/version'
import { DEFAULT_LANES, laneLabel } from '../../meta/formation'
import { constitutionById } from '../../meta/constitution'
import type { DomainEvent } from '../../kernel/combat/types'
import type { CombatEnded, CombatStats, CombatView, UnitViewLite } from '../../kernel/combat/types'
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
/** 上一次 renderBattle 挂的棋盘/浮层事件委托：host 是跨视图复用的 #app，重进时先摘，免得泄漏到别的视图 */
let battleWireAbort: AbortController | null = null
/** HUD 的阶段中文名（patchHud 也要用，提为模块级） */
const PHASE_NAME: Record<string, string> = { midnight: '午夜', dawn: '黎明', day: '白昼', dusk: '黄昏', night: '黑夜' }
/** 相位轨图标的横向位置：一天 TICK_PER_DAY tick → 0..100% */
const phasePos = (tick: number): number => Math.round(((((tick % TICK_PER_DAY) + TICK_PER_DAY) % TICK_PER_DAY) / TICK_PER_DAY) * 10000) / 100
/** 昼相（黎明/白昼/黄昏）挂太阳，夜相（午夜/黑夜）挂月亮 */
const dayPhase = (phase: string): boolean => phase === 'dawn' || phase === 'day' || phase === 'dusk'
/** 文本原地改：变了才写，避免无意义的 DOM 写 */
function setText(el: Element | null, text: string): void {
  if (el && el.textContent !== text) el.textContent = text
}
/** 前台战斗视图的重画钩子（离开视图即置空），供模块级 resize 监听转发 */
let activeRefresh: (() => void) | null = null
let resizeHooked = false
/** 联机每 tick 的观战节拍（毫秒）；0 会让整局在一帧内跑完 */
const ONLINE_STEP_MS = 450
/** 离线自动的 tick 间隔（与旧 setInterval 同速）：一个 tick 的动画窗 */
const AUTO_TICK_MS = 450
/** 战场时钟一圈的 tick 数：1 tick = TICK_MINUTES(20) 分钟，3 tick = 60 分钟正好扫满一圈钟面，
    与相位刻度（相位轨一天 TICK_PER_DAY tick）同源对齐 */
const CLOCK_REV_TICKS = 60 / TICK_MINUTES
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
  // 摘掉上一次的事件委托（host 是跨视图复用的 #app，不摘会泄漏到别的视图）
  battleWireAbort?.abort()
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
  /** 行动扇叶插值窗（前瞻式）：gaugeFrom 恒存本窗起点的**真实** gauge 值，gaugeTo 存
      按上窗实际增率外推的窗终值。行动条常规匀速积累，外推即实时值——扇形满格那一刻
      就是出手时刻（回顾式会落后真实值一整扇窗，看着像「没满就执行」）；from>to
      （打满清零/衰减）由 rAF 直接落 to 不走倒扫；增率突变（增益/减益）在 tick 边界
      自然校正一次小跳变。 */
  const gaugeFrom = new Map<string, number>()
  const gaugeTo = new Map<string, number>()
  /** —— 增量渲染状态：refresh 只补丁、不整页重建，这些签名决定哪些子树要动 ——
      （为什么改：旧 refresh 每 tick 整页 innerHTML 重建，把全部单位头像 <img> 换成新节点——
        字节走缓存，但每个新元素都要重新解码；自动播放 450ms 一刷就是持续闪。同案记录见
        cards.ts 的 sync()。） */
  let shellReady = false
  let boardSig = ''
  let overlaySig = ''
  let queueSig = ''
  /** 行动队列的行池：id → 行元素，跨 tick 常驻。队列是前瞻投影，成员每 tick 都在换手
      （同一个人可能这 tick 排第 3、下 tick 掉出去、再下 tick 又回来）——行随手建随手删，
      就等于把头像 <img> 反复重新解码，看上去就是闪。离队的行只摘不销毁，留在这儿备用。
      池子按场次存活（fullRender 时重置），上限就是场上单位数。 */
  const queueRows = new Map<string, HTMLElement>()
  let hudWarnSig = ''
  let logRendered = 0

  /** AI 选靶启发：优先「非本方」候选（打得到敌人），凑不齐 pickCount 再按序补。 */
  const pickForAi = (pending: DecisionRequest): DecisionInput => {
    const mine = casterFaction(s, pending.caster)
    const foesFirst = [...pending.candidates].sort((a, b) => {
      const fa = a.occupant ? casterFaction(s, a.occupant) : undefined
      const fb = b.occupant ? casterFaction(s, b.occupant) : undefined
      return Number(fa === mine) - Number(fb === mine)
    })
    return foesFirst.slice(0, pending.pickCount)
  }

  /** 离线人机：对方阵营的 Manual 选靶由 AI 自动结算，不弹给玩家替对面操作
      （AI 与人只是两种 InputSequence 产生器，DESIGN.md §5.4）。一次连消对面连续触发的
      多个决策（同 tick 多单位行动），守卫防异常死循环；drain 完剩 pending 一定是玩家的。 */
  const drainFoeDecisions = (): void => {
    if (s.online) return
    for (let guard = 0; guard < 50; guard += 1) {
      const pending = s.facade.pendingDecision()
      if (!pending || casterFaction(s, pending.caster) === myFactionOf(s)) return
      s.facade.submitDecision(pickForAi(pending))
    }
  }

  const refresh = (): void => {
    drainFoeDecisions()
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
    // tick 变了 = 真推进了一格：时钟动画窗从这里重新起扫，同时捕获各扇叶的前瞻插值窗
    if (view.tick !== lastTick) {
      const alive = new Set<string>()
      for (const u of view.units) {
        const pct = Math.max(0, Math.min(100, Math.round((u.gauge / 75) * 100)))
        // 增率从「上一窗真实值」推（gaugeFrom 恒存实际值；若误用 gaugeTo 的外推值，
        // 上一窗被钳过的话会把钳值当真实增量、下一窗外推全错）
        const prevActual = gaugeFrom.get(u.id)
        gaugeFrom.set(u.id, pct)
        gaugeTo.set(u.id, prevActual == null ? pct : Math.max(0, Math.min(100, pct + (pct - prevActual))))
        alive.add(u.id)
      }
      // 消散/放逐的单位从两张表删掉，防 Map 随战局膨胀
      for (const id of [...gaugeFrom.keys()]) {
        if (!alive.has(id)) {
          gaugeFrom.delete(id)
          gaugeTo.delete(id)
        }
      }
      lastTick = view.tick
      tickStart = performance.now()
    }
    const myTurn = pending != null && casterFaction(s, pending.caster) === myFactionOf(s)
    /** 本侧该决策且未提交 → 板面高亮 tile 可点选 */
    const canPick = pending != null && (!s.online || myTurn) && !submitted
    const showDecision = pending != null && (!s.online || myTurn)
    /** 非操作时机（含联机观战）点开信息面板；决策条在显示时让位 */
    const canInspect = !showDecision && ended == null

    if (!shellReady) {
      fullRender(view, pending, ended, canPick, canInspect, showDecision)
      shellReady = true
      // 竖屏进场：把对阵中线拨到屏幕正中；只拨这一次，之后拖动/平移归用户
      if (currentOrientation() === 'portrait') {
        const wrap = host.querySelector<HTMLElement>('.board-wrap')
        if (wrap) centerPortraitMidline(wrap)
      }
    } else {
      patch(view, pending, ended, canPick, canInspect, showDecision)
    }
    // 统一动画轴常开：手动模式也走（每点一下「推进」，扇叶/日月在下一扇窗内扫过）
    animStart()
  }

  /** 首次：整页骨架（棋盘 + HUD + 两抽屉 + 浮层槽）。此后一切变化走 patch，不再整页重建。 */
  const fullRender = (view: CombatView, pending: DecisionRequest | null, ended: CombatEnded | null, canPick: boolean, canInspect: boolean, showDecision: boolean): void => {
    hideCardPop()
    host.innerHTML = `
      <div class="battle" data-orient="${currentOrientation()}">
        <div class="board-wrap">${boardHtml(s, view, pending, canPick, canInspect, pending?.caster ?? null)}</div>
        ${actionQueueHtml(s, actionQueue(s, view, pending?.caster ?? null), pending?.caster ?? null)}
        ${hudHtml(s, view, pending != null, ended != null, logOpen, rosterOpen, autoOn)}
        ${drawerHtml('roster', '我方技能', rosterHtml(s), rosterOpen)}
        ${drawerHtml('log', '战斗日志', `<div class="cg-scroll log" id="battle-log">${logHtml(s, s.facade.drainEvents())}</div>`, logOpen, '<button type="button" class="cg-btn cg-btn--sm" id="btn-log-copy" title="复制全量日志（含两军装配与种子）">复制</button>')}
      </div>
      <div class="battle-overlay">${overlayHtml(view, pending, ended, showDecision)}</div>
      <div class="cg-modal cg-modal--sm" id="leave-modal" role="dialog" aria-modal="true" aria-labelledby="leave-modal-title">
        <div class="cg-modal__backdrop" data-leave-cancel></div>
        <div class="cg-modal__dialog">
          <div class="cg-modal__head"><h2 class="cg-modal__title" id="leave-modal-title">离开对局？</h2></div>
          <div class="cg-modal__body">${s.online ? '联机对局仍在进行，离开即视为放弃本局。' : '对局进度保留在本机，离开后可从「新游戏」继续。'}</div>
          <div class="cg-modal__foot">
            <button type="button" class="cg-btn cg-btn--ghost" data-leave-cancel>取消</button>
            <button type="button" class="cg-btn cg-btn--danger" id="btn-leave-confirm">离开</button>
          </div>
        </div>
      </div>`
    hydrateArt(host)
    hydrateHeroArt(host)
    logRendered = s.facade.drainEvents().length
    boardSig = sigOfBoard(view)
    overlaySig = sigOfOverlay(pending, ended, showDecision)
    queueSig = sigOfQueue(actionQueue(s, view, pending?.caster ?? null), pending?.caster ?? null)
    // 行池跟着这一屏的骨架走：首帧的行认下来接着用，上一局的残留一概丢掉
    queueRows.clear()
    for (const row of host.querySelectorAll<HTMLElement>('#action-queue .action-queue__row')) {
      if (row.dataset.unit) queueRows.set(row.dataset.unit, row)
    }
    hudWarnSig = sigOfHudWarn()
    const wrap = host.querySelector<HTMLElement>('.board-wrap')
    if (wrap) enablePan(host, { viewport: wrap })
    wireShell()
    wireDelegated()
    wireDrawers()
  }

  /** 增量补丁：棋盘签名没变就逐格补丁（头像 <img> 不动），变了才重建棋盘；HUD 文本原地改；
      日志只 append 新行；决策/信息/结算浮层按签名插拔。整页 DOM 不随 tick 重建。 */
  const patch = (view: CombatView, pending: DecisionRequest | null, ended: CombatEnded | null, canPick: boolean, canInspect: boolean, showDecision: boolean): void => {
    const battleEl = host.querySelector<HTMLElement>('.battle')
    if (!battleEl) return
    const orient = currentOrientation()
    const orientChanged = battleEl.dataset.orient !== orient
    if (orientChanged) battleEl.dataset.orient = orient
    battleEl.querySelector('.board')?.classList.toggle('can-inspect', canInspect)

    const sig = sigOfBoard(view)
    if (sig !== boardSig) {
      // 结构变了（单位增删/换位/换朝向）：重建棋盘。wrap 节点不动，但 innerHTML 换内容的
      // 瞬间 scrollHeight 先塌成 0，浏览器会把 scrollTop/Left 钳回 0（死亡/消散时棋盘重绘
      // 就把玩家拖好的视野刷到顶）——所以滚动位要先存后还
      boardSig = sig
      hideCardPop()
      const wrap = battleEl.querySelector<HTMLElement>('.board-wrap')
      if (wrap) {
        const sl = wrap.scrollLeft
        const st = wrap.scrollTop
        wrap.innerHTML = boardHtml(s, view, pending, canPick, canInspect, pending?.caster ?? null)
        wrap.scrollLeft = sl
        wrap.scrollTop = st
        hydrateHeroArt(wrap)
        // 旋转成竖屏：棋盘刚按新朝向重建，滚动位还停在旧朝向的位置，重新把中线拨正
        if (orientChanged && orient === 'portrait') centerPortraitMidline(wrap)
      }
    } else {
      patchUnits(battleEl, view, pending, canPick)
    }

    patchHud(view, pending, ended)
    patchQueue(view, pending)
    patchLog()

    const osig = sigOfOverlay(pending, ended, showDecision)
    if (osig !== overlaySig) {
      overlaySig = osig
      hideCardPop()
      const slot = host.querySelector<HTMLElement>('.battle-overlay')
      if (slot) {
        slot.innerHTML = overlayHtml(view, pending, ended, showDecision)
        hydrateHeroArt(slot)
      }
    } else if (inspect) {
      // 查看面板开着、无需重建：就地刷实时段（HP/能量/格位/状态），身份块（头像/名）不动——
      // 否则开着面板自动播时，面板随 tick 整块重建、头像 <img> 每 450ms 闪一下
      patchInspect(view)
    }
  }

  /** 查看面板（单位）开着时的逐 tick 就地刷新：只重写 .inspect-stat 文本与状态 chips，
      头像/名条/体质那一整块身份块保持原节点（<img> 零重建）。单位被移出/消散由 refresh
      顶部的 inspect 失效逻辑收起面板，这里查不到单位就什么都不做。 */
  const patchInspect = (view: CombatView): void => {
    if (!inspect || inspect.kind !== 'unit') return
    const body = host.querySelector<HTMLElement>('.battle-overlay .inspect-body')
    if (!body) return
    const u = view.units.find((x) => x.id === (inspect as { id: string }).id)
    if (!u) return
    const stats = [`HP ${u.hp}/${u.hpMax}`, `能量 ${u.energy}`, u.coordinate ? coordText(u.coordinate) : '离场']
    const statEls = [...body.querySelectorAll<HTMLElement>('.inspect-stat')]
    statEls.forEach((el, i) => {
      if (stats[i] != null) setText(el, stats[i])
    })
    const chipsSig = u.statuses.map((st) => `${st.defId}:${st.stacks}`).join(',')
    if (body.dataset.chips !== chipsSig) {
      body.dataset.chips = chipsSig
      const chipsHtml = u.statuses.map((st) => chipHtml(s, st)).join('')
      const box = body.querySelector<HTMLElement>('.inspect-chips')
      if (box) box.innerHTML = chipsHtml
      else if (chipsHtml) body.insertAdjacentHTML('beforeend', `<span class="inspect-chips">${chipsHtml}</span>`)
    }
  }

  /** 行动队列签名：行顺序（id:side）+ 正在行动者。顺序/成员没变就不重写 DOM——
      否则每 tick 重建头像 <img> 会闪（同 patchUnits 的克制）。 */
  const sigOfQueue = (queue: readonly UnitViewLite[], actingId: string | null): string =>
    `${actingId ?? ''}|${queue.map((u) => `${u.id}:${s.unitMeta.get(u.id)?.side ?? '?'}`).join(',')}`

  /** 行动队列增量：**复用行节点**，只翻类名与顺序，绝不整块重写。队列顺序每隔一两 tick 就会
      变（gauge 一涨，ticksToAct 的桶就挪），整块 innerHTML 重写等于每 tick 把 3 个头像
      <img> 全换新——字节走缓存，但每个新元素都要重新解码，看上去就是闪（同 patchUnits 对
      头像的克制）。重排用 append 移动既有节点：移动不销毁元素，解码位留着。
      正在行动者（决策冻结中的 caster）由 actionQueue 钉在队首；它出手后 gauge 清零，
      下一 tick 自然掉出队列。 */
  const patchQueue = (view: CombatView, pending: DecisionRequest | null): void => {
    const el = host.querySelector<HTMLElement>('#action-queue')
    if (!el) return
    const actingId = pending?.caster ?? null
    const queue = actionQueue(s, view, actingId)
    const sig = sigOfQueue(queue, actingId)
    if (sig === queueSig) return
    queueSig = sig
    const mine = myFactionOf(s)
    const keep: HTMLElement[] = []
    for (const u of queue) {
      let row = queueRows.get(u.id)
      if (!row) {
        row = document.createElement('div')
        row.className = 'action-queue__row'
        row.dataset.unit = u.id
        row.innerHTML = queueAvatarHtml(s.unitMeta.get(u.id))
        hydrateHeroArt(row)
        queueRows.set(u.id, row)
      }
      // 逐类 toggle 而不是整体赋 className：is-acting 那条脉冲靠类名触发，重写一遍
      // 属性会让动画从头再来（明明还是同一个人在行动，环却重新亮一次）。
      row.classList.toggle('own', u.faction === mine)
      row.classList.toggle('enemy', u.faction !== mine)
      row.classList.toggle('is-acting', u.id === actingId)
      keep.push(row)
    }
    // append 的是节点本身（移动，不销毁）：顺序一次摆对；掉出队列的行只摘不销毁，
    // 留在池子里——同一个人下次再入队时还是那张 <img>，不重新解码。
    el.append(...keep)
    for (const row of queueRows.values()) if (!keep.includes(row)) row.remove()
  }

  /** 棋盘结构签名：朝向 + 我方阵营 + 路清单 + 单位(id@坐标)。候选/行动/可点只影响类名，
      走逐格补丁、不进签名——否则每个行动 tick 都重建棋盘，补丁就失去意义。 */
  const sigOfBoard = (view: CombatView): string => {
    const seen = view.units.map((u) => u.coordinate?.lane).filter((l): l is string => !!l)
    const laneList = [...new Set<string>([...DEFAULT_LANES, ...seen])].sort()
    const ownFaction = view.units.find((u) => s.unitMeta.get(u.id)?.side === 'own')?.faction ?? 'A'
    const cells = view.units
      .filter((u) => u.coordinate)
      .map((u) => `${u.id}@${coordKey(u.coordinate as Coordinate)}`)
      .sort()
    return `${currentOrientation()}|${ownFaction}|${laneList.join('.')}|${cells.join(',')}`
  }

  /** 逐格补丁：血条宽度/数字、行动扇叶 --p、状态 chips（签名变了才重写）、
      dead/targetable/pickable/acting 类与可点属性。头像 <img> 节点一概不动。 */
  const patchUnits = (battleEl: HTMLElement, view: CombatView, pending: DecisionRequest | null, canPick: boolean): void => {
    const cand = new Set((pending?.candidates ?? []).map((c) => c.occupant).filter((x): x is string => !!x))
    const acting = pending?.caster ?? null
    const byId = new Map(view.units.map((u) => [u.id, u]))
    battleEl.querySelectorAll<HTMLElement>('.unit[data-unit]').forEach((el) => {
      const u = byId.get(el.dataset.unit ?? '')
      if (!u) return
      const targetable = cand.has(u.id)
      const pickable = targetable && canPick
      el.classList.toggle('dead', u.hp <= 0)
      el.classList.toggle('targetable', targetable)
      el.classList.toggle('pickable', pickable)
      el.classList.toggle('acting', u.id === acting)
      if (pickable) {
        el.setAttribute('role', 'button')
        el.tabIndex = 0
      } else {
        el.removeAttribute('role')
        el.removeAttribute('tabindex')
      }
      const card = el.querySelector<HTMLElement>('.unit-card')
      if (!card) return
      const bar = card.querySelector<HTMLElement>('.cg-progress__bar')
      if (bar) bar.style.width = `${Math.max(0, Math.round((u.hp / Math.max(1, u.hpMax)) * 100))}%`
      const num = card.querySelector<HTMLElement>('.bar-num')
      const hpText = `${u.hp}/${u.hpMax}`
      if (num && num.textContent !== hpText) num.textContent = hpText
      // 行动扇叶 --p 归统一 rAF 时间轴逐帧插值（同 tickStart 时间轴，与总盘同步），此处不碰
      const chipsSig = u.statuses.map((st) => `${st.defId}:${st.stacks}`).join(',')
      if (el.dataset.chips !== chipsSig) {
        el.dataset.chips = chipsSig
        const box = el.querySelector<HTMLElement>('.unit-chips')
        if (box) box.innerHTML = u.statuses.map((st) => chipHtml(s, st, true)).join('')
      }
    })
    // 空格的落点高亮只随决策变、不进棋盘签名：与单位卡同一轮补丁
    const candCoords = new Set((pending?.candidates ?? []).map((c) => coordKey(c.coord)))
    battleEl.querySelectorAll<HTMLElement>('.slot[data-coord]').forEach((el) => {
      const on = canPick && candCoords.has(el.dataset.coord ?? '')
      el.classList.toggle('targetable', on)
      el.classList.toggle('pickable', on)
    })
  }

  /** HUD 原地改：tick/阶段/场上数文本、按钮 disabled/文案/aria。时钟元素不碰（rAF 每帧自刷）。 */
  const patchHud = (view: CombatView, pending: DecisionRequest | null, ended: CombatEnded | null): void => {
    const hud = host.querySelector<HTMLElement>('.battle-hud')
    if (!hud) return
    setText(hud.querySelector('.hud-tick'), `tick ${view.tick}`)
    setText(hud.querySelector('.hud-phase'), PHASE_NAME[view.phase] ?? view.phase)
    // 相位图标的平移/换图归统一 rAF 时间轴（连续战场时间逐帧驱动），此处只改阶段名
    setText(hud.querySelector('.hud > .hud-count'), `场上 ${view.units.filter((u) => u.hp > 0).length}`)
    const runner = s.online?.runner
    const pauseBtn = hud.querySelector<HTMLButtonElement>('#btn-pause')
    if (pauseBtn) setText(pauseBtn, runner?.isPaused ? '继续' : '暂停')
    setText(hud.querySelector('.controls > .hud-count'), runner ? `决策 #${runner.decisionSeq}` : '')
    const stepBtn = hud.querySelector<HTMLButtonElement>('#btn-step')
    if (stepBtn) stepBtn.disabled = pending != null || ended != null
    const autoBtn = hud.querySelector<HTMLButtonElement>('#btn-auto')
    if (autoBtn) {
      autoBtn.disabled = ended != null
      autoBtn.setAttribute('aria-pressed', String(autoOn))
      setText(autoBtn, autoOn ? '停止自动' : '自动播放')
    }
    // 联机中断/等待提示：签名变了才重写这一小行
    const warnSig = sigOfHudWarn()
    if (warnSig !== hudWarnSig) {
      hudWarnSig = warnSig
      const slot = host.querySelector<HTMLElement>('.hud-warn-slot')
      if (slot) slot.innerHTML = hudWarnHtml()
    }
  }

  /** 日志增量：drainEvents 是累计全量（runtime.ts），只把新事件插到顶部（最新在上），裁剪到 60 行 */
  const patchLog = (): void => {
    const box = host.querySelector<HTMLElement>('#battle-log')
    if (!box) return
    const events = s.facade.drainEvents()
    const fresh = events.slice(logRendered)
    logRendered = events.length
    if (fresh.length === 0) return
    box.querySelector('.log-line.dim')?.remove()
    box.insertAdjacentHTML('afterbegin', fresh.map((e) => `<div class="log-line">${describe(s, e)}</div>`).reverse().join(''))
    while (box.children.length > 60) box.lastElementChild?.remove()
  }

  /** 浮层内容：决策条 / 查看面板 / 结算，按当前状态取其一（都挂在 .battle-overlay 槽里） */
  const overlayHtml = (view: CombatView, pending: DecisionRequest | null, ended: CombatEnded | null, showDecision: boolean): string => {
    if (showDecision && pending) return decisionBarHtml(s, pending, submitted)
    if (inspect) return inspectPanelHtml(s, view, inspect)
    if (ended) return endedHtml(s, ended.outcome)
    return ''
  }

  /** 浮层签名：类型 + 内容关键键。决策条随候选/提交态重建；查看面板按目标身份建一次，
      开着时的实时刷新走 patchInspect（不带 tick——否则每 tick 整块重建、头像重绘闪）；
      结算随指纹校验状态重建；常态稳在 'none'，tick 不碰浮层。 */
  const sigOfOverlay = (pending: DecisionRequest | null, ended: CombatEnded | null, showDecision: boolean): string => {
    if (showDecision && pending) {
      return `decision|${pending.caster}|${pending.candidates.map((c) => c.occupant ?? '').join(',')}|${pending.pickCount}|${submitted}`
    }
    if (inspect) return `inspect|${inspect.kind}|${inspect.kind === 'unit' ? inspect.id : inspect.coord}`
    if (ended) {
      const v = s.online?.verify
      return `ended|${ended.outcome}|${!v ? 'wait' : v.ok ? 'ok' : v.theirs === null ? 'miss' : 'bad'}`
    }
    return 'none'
  }

  const sigOfHudWarn = (): string => {
    const runner = s.online?.runner
    return `${runner?.lastError ? `e:${errMsg(runner.lastError)}` : ''}|${runner?.waiting ? 'w' : ''}`
  }

  const hudWarnHtml = (): string => {
    const runner = s.online?.runner
    if (runner?.lastError) return `<p class="warn hud-warn">联机中断：${escapeHtml(errMsg(runner.lastError))}</p>`
    if (runner?.waiting) return '<p class="wait-note hud-warn">等待对手决策…</p>'
    return ''
  }

  /** 骨架控件只挂一次（HUD 节点常驻，补丁不重建它们）：推进 / 自动 / 联机暂停 / 离开 */
  const wireShell = (): void => {
    const leaveModal = document.getElementById('leave-modal')
    document.getElementById('btn-leave')?.addEventListener('click', () => leaveModal?.classList.add('is-open'))
    leaveModal?.querySelectorAll('[data-leave-cancel]').forEach((el) =>
      el.addEventListener('click', () => leaveModal.classList.remove('is-open')),
    )
    // 从哪来回哪去：联机局回联机大厅、离线局回新游戏页（不回首页）
    document.getElementById('btn-leave-confirm')?.addEventListener('click', () => {
      location.hash = s.online ? '#/online' : '#/new'
    })
    document.getElementById('btn-step')?.addEventListener('click', () => {
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
  }

  /**
   * 棋盘/浮层交互走事件委托，一次挂好、补丁/重建都不再重绑（同 prep.ts 的委托范式）。
   * 挂在 .battle 与 .battle-overlay 容器上而非 host：整页换掉时监听器随节点一起失效，
   * 不会泄漏到别的视图；重进本视图另由 battleWireAbort 兜一层。
   */
  const wireDelegated = (): void => {
    const ac = new AbortController()
    battleWireAbort = ac
    const root = host.querySelector<HTMLElement>('.battle')
    const overlayEl = host.querySelector<HTMLElement>('.battle-overlay')
    if (!root || !overlayEl) return

    // 选一个目标：key 可能是租客 id（点单位卡）也可能是坐标（点空格——spawn/move 的候选 occupant 是 null）。
    // 候选中取它（取不到则退回前 pickCount 个），与「交给 AI」同一条 submit 路径
    const pickTarget = (key: string): void => {
      const pending = s.facade.pendingDecision()
      if (!pending) return
      const byOccupant = pending.candidates.filter((c) => c.occupant === key)
      const byCoord = pending.candidates.filter((c) => coordKey(c.coord) === key)
      const pick = (byOccupant.length > 0 ? byOccupant : byCoord).slice(0, pending.pickCount)
      submit(pick.length > 0 ? pick : pending.candidates.slice(0, pending.pickCount))
    }
    const autoPick = (): void => {
      const pending = s.facade.pendingDecision()
      if (!pending) return
      submit(pending.candidates.slice(0, pending.pickCount))
    }
    /** 非操作时机（含联机观战、已提交待同步）才可查看信息 */
    const canInspectNow = (): boolean => {
      const pending = s.facade.pendingDecision()
      if (pending && (!s.online || casterFaction(s, pending.caster) === myFactionOf(s))) return false
      return s.facade.ended() == null
    }

    const onClick = (e: MouseEvent): void => {
      const el = e.target as HTMLElement
      if (el.closest('#btn-auto-pick')) {
        autoPick()
        return
      }
      const pk = el.closest<HTMLElement>('[data-pick]')
      if (pk && !pk.hasAttribute('disabled')) {
        pickTarget(pk.dataset.pick ?? '')
        return
      }
      // 板面上的高亮 tile 可点（光标已承诺可点，就别让它落空）；否则非操作时机点开信息。
      // pickable 类名每 tick 已补丁，最新状态就在 DOM 上，点击时不用再算 canPick。
      const unit = el.closest<HTMLElement>('.unit[data-unit]')
      if (unit && root.contains(unit)) {
        if (unit.classList.contains('pickable')) {
          pickTarget(unit.dataset.unit ?? '')
        } else if (canInspectNow()) {
          toggleInspect({ kind: 'unit', id: unit.dataset.unit ?? '' })
        }
        return
      }
      const slot = el.closest<HTMLElement>('.slot[data-coord]')
      if (slot && root.contains(slot)) {
        // 是合法落点就当选靶（决策期）；否则非操作时机点开格位信息
        if (slot.classList.contains('pickable')) {
          pickTarget(slot.dataset.coord ?? '')
        } else if (canInspectNow()) {
          toggleInspect({ kind: 'slot', coord: slot.dataset.coord ?? '' })
        }
        return
      }
      // 空白处点击：收起信息面板与抽屉（平移结束的尾随 click 已被 pan.ts 吃掉，到不了这里；
      // 抽屉/HUD/面板/模态内部点击不算空白，由各自的控件消化）
      if (el.closest('.battle-drawer, .battle-hud, .decision, .inspect-foe, .cg-modal')) return
      if (inspect != null) toggleInspect(null)
      closeDrawers()
    }
    const onKey = (e: KeyboardEvent): void => {
      if (e.key !== 'Enter' && e.key !== ' ') return
      const unit = (e.target as HTMLElement).closest<HTMLElement>('.unit.pickable[data-unit]')
      if (!unit) return
      e.preventDefault()
      pickTarget(unit.dataset.unit ?? '')
    }
    root.addEventListener('click', onClick, { signal: ac.signal })
    root.addEventListener('keydown', onKey, { signal: ac.signal })
    overlayEl.addEventListener('click', onClick, { signal: ac.signal })
  }

  /** 点同一个目标再点一次 = 收起；传 null 直接收起（空白处点击兜底） */
  const toggleInspect = (next: Inspect | null): void => {
    const same =
      next != null &&
      ((inspect?.kind === 'unit' && next.kind === 'unit' && inspect.id === next.id) ||
        (inspect?.kind === 'slot' && next.kind === 'slot' && inspect.coord === next.coord))
    inspect = same ? null : next
    refresh()
  }

  /** 空白点击收起两抽屉（与 wireDrawers 的 toggle 同一条类名/aria 通道） */
  const closeDrawers = (): void => {
    if (!logOpen && !rosterOpen) return
    logOpen = false
    rosterOpen = false
    host.querySelector('.battle-drawer--log')?.classList.remove('is-open')
    host.querySelector('.battle-drawer--roster')?.classList.remove('is-open')
    document.getElementById('btn-log')?.setAttribute('aria-pressed', 'false')
    document.getElementById('btn-roster')?.setAttribute('aria-pressed', 'false')
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
    if (autoOn) tickStart = performance.now()
    refresh()
  }

  /**
   * 战场统一动画时间轴：一条 rAF 维护所有「始终在动且要互相同步」的动画——
   * 总进度盘 --p、各单位行动扇叶 --p（窗内 from→to 插值）、相位轨日/月平移与换图标。
   * 全部吃同一个 tickStart/span 时间轴：同起同停、严格同步（旧写法扇叶靠 CSS
   * transition：值在 tick 边界才变、过渡每窗被打断重起，永远落后总盘一拍，肉眼即「不同步」）。
   * 到窗尾：离线自动 stepOnce 推进一格，联机由 MatchRunner 自己推进。
   * 决策点/联机暂停 → 整轴冻结（is-paused），rAF 空转，恢复后从原进度续走。
   * 手动模式也走轴：每点一下「推进」，扇叶/日月在下一扇窗内扫过。结算后停轴。
   */
  const animLoop = (now: number): void => {
    clockRaf = null
    // 离开战斗页：停轴，别在后台把整局推完（会记下一场没人看过的胜负）
    if (!onBattleRoute()) return
    if (s.facade.ended()) return
    const clockEl = host.querySelector<HTMLElement>('.battle-clock')
    if (s.facade.pendingDecision() || s.online?.runner?.isPaused) {
      clockEl?.classList.add('is-paused')
      clockRaf = requestAnimationFrame(animLoop)
      return
    }
    clockEl?.classList.remove('is-paused')
    const span = s.online ? ONLINE_STEP_MS : AUTO_TICK_MS
    const frac = Math.max(0, Math.min(1, (now - tickStart) / span))
    // 1) 战场总进度盘：一圈 = CLOCK_REV_TICKS 个 tick，每窗扫 1/REV 圈
    const p = (((lastTick % CLOCK_REV_TICKS) + frac) / CLOCK_REV_TICKS) * 100
    clockEl?.style.setProperty('--p', String(p))
    // 2) 各单位行动扇叶：同一 frac 在各自前瞻窗 from→to 间插值（from=当前值、to=外推下一值）；
    //    from>to（打满清零/衰减）直接落 to，不倒扫
    host.querySelectorAll<HTMLElement>('.unit-gauge[data-unit]').forEach((el) => {
      const from = gaugeFrom.get(el.dataset.unit ?? '') ?? 0
      const to = gaugeTo.get(el.dataset.unit ?? '') ?? from
      el.style.setProperty('--p', String(to < from ? to : from + (to - from) * frac))
    })
    // 3) 相位轨：连续战场时间 lastTick+frac 逐帧平移；昼夜边界正好落在整数 tick 上
    const ct = lastTick + frac
    const ico = host.querySelector<HTMLElement>('.phase-ico')
    if (ico) ico.style.left = `${phasePos(ct)}%`
    const nightNow = !dayPhase(phaseOf(Math.floor(ct)))
    host.querySelector('.phase-track')?.classList.toggle('is-night', nightNow)
    const use = host.querySelector<SVGUseElement>('.phase-track use')
    const href = nightNow ? '#cg-sigil-moon' : '#cg-sigil-sun'
    if (use && use.getAttribute('href') !== href) use.setAttribute('href', href)
    if (frac >= 1 && !s.online && autoOn) {
      stepOnce(s)
      refresh()
      return // refresh 末尾已 animStart，这里不再续帧，免得同一帧挂两条循环
    }
    clockRaf = requestAnimationFrame(animLoop)
  }
  const animStart = (): void => {
    if (clockRaf == null) clockRaf = requestAnimationFrame(animLoop)
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
    // 复制全量日志（含两军装配/种子/数据版本），给 AI 排查用；屏上 60 行与此不同源
    document.getElementById('btn-log-copy')?.addEventListener('click', async (ev) => {
      const btn = ev.currentTarget as HTMLButtonElement
      const ok = await copyText(buildLogReport(s))
      btn.textContent = ok ? '已复制 ✓' : '复制失败'
      btn.disabled = true
      window.setTimeout(() => {
        btn.textContent = '复制'
        btn.disabled = false
      }, 1500)
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

/** 竖屏：把对阵中线拨到视口正中——棋盘内容上下对称（上下各 4 行 + 25vh 对称留白），滚动取中即可 */
function centerPortraitMidline(wrap: HTMLElement): void {
  wrap.scrollTop = (wrap.scrollHeight - wrap.clientHeight) / 2
}

function coordKey(c: Coordinate): string {
  return `${c.faction}|${c.lane}|${c.index}`
}

function boardHtml(s: BattleSession, view: CombatView, pending: DecisionRequest | null, canPick: boolean, canInspect: boolean, actingId: string | null): string {
  // lane 清单取「内核默认两路 ∪ 场上实见」的并集：一路被打空（甚至全员放逐）时空格仍要渲染
  const seen = view.units.map((u) => u.coordinate?.lane).filter((l): l is string => !!l)
  const laneList = [...new Set<string>([...DEFAULT_LANES, ...seen])].sort()
  const laneIdx = laneIndexer(laneList)
  const ownFaction = view.units.find((u) => s.unitMeta.get(u.id)?.side === 'own')?.faction ?? 'A'
  const foeFaction = s.setup.factions.find((f) => f.id !== ownFaction)?.id ?? 'B'
  const orient = currentOrientation()
  const spec = gridSpec(orient, ownFaction, laneIdx)
  // 合法目标两套索引：按租客（高亮单位卡）与按坐标（空格也是合法落点——spawn/move 的 occupant 就是 null）
  const cand = new Set((pending?.candidates ?? []).map((c) => c.occupant).filter((x): x is string => !!x))
  const candCoords = new Set((pending?.candidates ?? []).map((c) => coordKey(c.coord)))

  const occupied = new Map<string, UnitViewLite>()
  for (const u of view.units) if (u.coordinate) occupied.set(coordKey(u.coordinate), u)

  const cells: string[] = []
  for (const faction of [ownFaction, foeFaction]) {
    for (const lane of laneList) {
      for (let index = 0; index < LANE_CAPACITY; index += 1) {
        const coord: Coordinate = { faction, lane, index }
        const key = coordKey(coord)
        const u = occupied.get(key)
        const { col, row } = spec.place(coord)
        // 竖屏 chips 条贴在卡面外侧：左路(lane-l)在卡左、右路(lane-r)在卡右（类由 CSS 消费）
        const laneCls = orient === 'portrait' ? (col === 1 ? ' lane-l' : ' lane-r') : ''
        cells.push(
          u
            ? tileHtml(s, u, col, row, cand.has(u.id), canPick, u.id === actingId, laneCls)
            : slotHtml(coord, col, row, faction === ownFaction, canPick && candCoords.has(key), laneCls),
        )
      }
    }
  }
  // 中线分割线：占中线轨道、纵贯/横穿另一轴
  const mid =
    orient === 'landscape'
      ? `<div class="board-mid" style="grid-column:${spec.midTrack};grid-row:1 / -1"></div>`
      : `<div class="board-mid" style="grid-row:${spec.midTrack};grid-column:1 / -1"></div>`

  // 格宽走 CSS 变量：--cell 是 app.css 按视口算出的方卡边长（横屏 --row-cell 多出 36px 是顶置
  // chips 行；竖屏 chips 改卡外侧竖条，--row-cell 反而比 --cell 小 28px，同路行距随之收窄），
  // 卡面保持方正、整块棋盘居中留白；被压到 minmax 下限仍放不下就整体溢出 → 触发拖拽平移。
  const sqCell = 'minmax(112px, var(--cell, 1fr))'
  const sqRow = 'minmax(148px, var(--row-cell, 1fr))'
  const sqRowP = 'minmax(84px, var(--row-cell, 1fr))'
  const sqGap = 'var(--gap-track, 28px)'
  const template =
    orient === 'landscape'
      ? `grid-template-columns:repeat(${LANE_CAPACITY}, ${sqCell}) ${sqGap} repeat(${LANE_CAPACITY}, ${sqCell}); grid-template-rows:repeat(${spec.rows}, ${sqRow})`
      : `grid-template-columns:repeat(${spec.columns}, ${sqCell}); grid-template-rows:repeat(${LANE_CAPACITY}, ${sqRowP}) ${sqGap} repeat(${LANE_CAPACITY}, ${sqRowP})`
  // can-inspect 只控光标与空格 hover，不改变渲染
  return `<div class="board${canInspect ? ' can-inspect' : ''}" style="${template}">${mid}${cells.join('')}</div>`
}

/** 空格：虚线框占位，非操作时机可点看格位信息（接线见 wire）；是合法落点时高亮可点。
   .slot 只摆网格壳（与 .unit 同一模板），虚线框是内层 .slot-box——它落在 card 区，
   大小与英雄卡面一致。 */
function slotHtml(coord: Coordinate, col: number, row: number, own: boolean, pickable: boolean, laneCls = ''): string {
  return `<div class="slot${own ? ' own' : ''}${laneCls}${pickable ? ' targetable pickable' : ''}" style="grid-column:${col};grid-row:${row}" data-coord="${escapeHtml(coordKey(coord))}"><div class="slot-box"></div></div>`
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
function chipHtml(s: BattleSession, st: { defId: string; stacks: number; charges: number | null; maxCharges: number | null }, short = false): string {
  const def = s.catalog.statusDefs.get(st.defId)
  const name = def?.name ?? st.defId
  const cat = def?.category ?? []
  const pol = cat.includes('buff') ? ' buff' : cat.includes('debuff') ? ' debuff' : ''
  const text = short ? ([...name][0] ?? name) : name
  const chargeText = st.charges !== null ? `${st.charges}${st.maxCharges !== null ? '/' + st.maxCharges : ''}` : ''
  return `<span class="chip${pol}">${escapeHtml(text)}${st.stacks > 1 ? `×${st.stacks}` : ''}${chargeText ? ` ${chargeText}` : ''}</span>`
}

/**
 * 战场单位卡。大头像铺满整张卡、血条压在卡底、行动条做成左上角圆形扇叶；
 * 状态标签渲染在**卡外**单边（横屏卡上方一行；竖屏贴卡外侧竖条——左路在卡左、
 * 右路在卡右，laneCls 带 lane-l/lane-r，首字缩写，放不下截断）；
 * 名字/职业默认隐去，hover / 选中(targetable) / 聚焦 时随卡一起完整呈现。
 * targetable = 当前决策的合法目标（视觉高亮）；pickable = 本侧可点选（此时才给抓手光标，避免空承诺）。
 * acting = 当前轮到行动的单位：卡面放大突出。
 */
function tileHtml(s: BattleSession, u: UnitViewLite, col: number, row: number, targetable: boolean, canPick: boolean, acting: boolean, laneCls = ''): string {
  const meta = s.unitMeta.get(u.id)
  const side = meta?.side ?? (u.id.length > 0 ? 'enemy' : 'own')
  // 召唤物等没有名册元数据的单位：留在 emoji 档（heroAvatarHtml 的垫底层就是这个）。
  // 满铺头像实渲尺寸比老 .tile 大得多（格子 ≥112px、cover 后按格宽算），sizes 给大档，别再按 56px 估
  const avatar = meta ? heroAvatarHtml(meta, '(orientation: landscape) min(22vw, 48vh), 50vw') : '❓'
  const hpPct = Math.max(0, Math.round((u.hp / Math.max(1, u.hpMax)) * 100))
  const gaugePct = Math.max(0, Math.min(100, Math.round((u.gauge / 75) * 100)))
  const dead = u.hp <= 0
  const chips = u.statuses.map((st) => chipHtml(s, st, true))
  const cls = ['unit', side, laneCls.trim(), dead ? 'dead' : '', targetable ? 'targetable' : '', targetable && canPick ? 'pickable' : '', acting ? 'acting' : '']
    .filter(Boolean)
    .join(' ')
  const clsname = classNameOf(s, meta)
  return `
  <div class="${cls}" style="grid-column:${col};grid-row:${row}" data-unit="${escapeHtml(u.id)}">
    <div class="unit-chips">${chips.join('')}</div>
    <div class="unit-card">
      <span class="unit-art">${avatar}</span>
      <div class="unit-gauge" style="--p:${gaugePct}" data-unit="${escapeHtml(u.id)}"></div>
      <div class="unit-name">${escapeHtml(meta?.name ?? u.id)}${clsname ? `<span class="unit-class">${escapeHtml(clsname)}</span>` : ''}</div>
      <div class="unit-hp">${meta ? emblemHtml(meta.classId) : ''}<div class="cg-progress bar hp">
        <div class="cg-progress__track"><div class="cg-progress__bar cg-progress__bar--warn" style="width:${hpPct}%"></div></div>
        <span class="bar-num">${u.hp}/${u.hpMax}</span>
      </div></div>
    </div>
  </div>`
}

/**
 * 顶部悬浮 HUD：tick/阶段/场上数 + 控件 + 「日志」「名册」两个抽屉开关。
 * 整块浮在棋盘之上（.battle-hud），不再占右栏。联机的中断/等待提示也并进这条。
 */
function hudHtml(s: BattleSession, view: CombatView, pending: boolean, ended: boolean, logOpen: boolean, rosterOpen: boolean, autoOn: boolean): string {
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
    <button type="button" class="cg-btn cg-btn--ghost cg-btn--sm" id="btn-leave" title="离开对局">${icon('cg-back')}返回</button>
    <div class="hud">
      <span class="battle-clock" aria-hidden="true"></span>
      <span class="hud-tick">tick ${view.tick}</span>
      <span class="phase-track${dayPhase(view.phase) ? '' : ' is-night'}" aria-hidden="true"><svg class="cg-ico phase-ico" style="left:${phasePos(view.tick)}%"><use href="#${dayPhase(view.phase) ? 'cg-sigil-sun' : 'cg-sigil-moon'}"/></svg></span>
      <span class="hud-phase">${PHASE_NAME[view.phase] ?? view.phase}</span>
      <span class="hud-count">场上 ${view.units.filter((u) => u.hp > 0).length}</span>
    </div>
    <div class="controls">${controls}</div>
    <div class="hud-tabs">
      <button type="button" class="cg-btn cg-btn--sm" id="btn-log" aria-pressed="${logOpen}" aria-controls="battle-log">日志</button>
      <button type="button" class="cg-btn cg-btn--sm" id="btn-roster" aria-pressed="${rosterOpen}">名册</button>
    </div>
  </div><div class="hud-warn-slot">${warn}</div>`
}

/** 右侧悬浮抽屉外壳：标题栏（含关闭键）+ 内容。开合只翻 .is-open（见 wireDrawers）。
   headExtra = 标题栏右侧追加的小按钮（如日志抽屉的「复制」）。 */
function drawerHtml(id: string, title: string, inner: string, open: boolean, headExtra = ''): string {
  return `<aside class="battle-drawer battle-drawer--${id}${open ? ' is-open' : ''}">
    <div class="cg-panel drawer-panel">
      <div class="cg-panel__head">
        <span class="cg-panel__title">${title}</span>
        ${headExtra}
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
            kind: def?.kind ?? 'active',
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

/* ---------- 行动队列（左上）：接下来出手的顺序预测 ---------- */

/** 还需几 tick 出手。Gauge 严格越阈（>）触发：所需最小 t≥1 满足 gauge + t·rate > threshold。
    已越阈（>阈值，同 tick 尚未结算的后续行动者）记 0，排在下一 tick 之前；速率为 0 者排最后。 */
function ticksToAct(u: UnitViewLite): number {
  if (u.gaugeRate <= 0) return Number.POSITIVE_INFINITY
  if (u.gauge > u.gaugeThreshold) return 0
  return Math.floor((u.gaugeThreshold - u.gauge) / u.gaugeRate) + 1
}

/** 同 tick 内的出手先后：复刻 scheduling/initiative.ts —— 两侧各自按 (lane,index,id) 升序，
    再按 [0,1,1,0] 交替合并（0 = setup.factions[0]，与 runtime 的 this.factions 同序）。 */
function initiativeOrder(units: readonly UnitViewLite[], f0: FactionId, f1: FactionId): UnitViewLite[] {
  const key = (u: UnitViewLite): [string, number, string] =>
    u.coordinate ? [u.coordinate.lane, u.coordinate.index, u.id] : ['~', Number.MAX_SAFE_INTEGER, u.id]
  const byPos = (a: UnitViewLite, b: UnitViewLite): number => {
    const ka = key(a)
    const kb = key(b)
    if (ka[0] !== kb[0]) return ka[0] < kb[0] ? -1 : 1
    if (ka[1] !== kb[1]) return ka[1] - kb[1]
    return ka[2] < kb[2] ? -1 : ka[2] > kb[2] ? 1 : 0
  }
  const q0 = units.filter((u) => u.faction === f0).sort(byPos)
  const q1 = units.filter((u) => u.faction === f1).sort(byPos)
  const PATTERN = [0, 1, 1, 0] as const
  const out: UnitViewLite[] = []
  let i0 = 0
  let i1 = 0
  let slot = 0
  while (i0 < q0.length || i1 < q1.length) {
    const side = PATTERN[slot % PATTERN.length]
    let pick: UnitViewLite | undefined
    if (side === 0 && i0 < q0.length) pick = q0[i0++]
    else if (side === 1 && i1 < q1.length) pick = q1[i1++]
    else pick = i0 < q0.length ? q0[i0++] : q1[i1++]
    if (pick) out.push(pick)
    slot += 1
  }
  return out
}

/** 行动队列（最多 3 格）：正在行动者（actingId）钉队首，其余为接下来出手的预测。
    队列是 UI 侧前瞻投影，非内核实体——出手即 gauge 清零（execution/commit.ts），故单位
    出手后自动掉出，无需显式「移出」。 */
function actionQueue(s: BattleSession, view: CombatView, actingId: string | null): UnitViewLite[] {
  const alive = view.units.filter((u) => u.hp > 0)
  const buckets = new Map<number, UnitViewLite[]>()
  for (const u of alive) {
    const t = ticksToAct(u)
    const arr = buckets.get(t)
    if (arr) arr.push(u)
    else buckets.set(t, [u])
  }
  const [f0, f1] = [s.setup.factions[0].id, s.setup.factions[1].id]
  const ordered = [...buckets.keys()]
    .sort((a, b) => a - b)
    .flatMap((t) => initiativeOrder(buckets.get(t) as UnitViewLite[], f0, f1))
  const rest = ordered.filter((u) => u.id !== actingId)
  if (actingId) {
    const actor = alive.find((u) => u.id === actingId)
    if (actor) rest.unshift(actor)
  }
  return rest.slice(0, 3)
}

/** 队列行的类名：己方绿框 / 敌方红框（沿用棋盘边线的绿/红语义），正在行动者加 .is-acting 脉冲。 */
function queueRowClass(side: 'own' | 'enemy', acting: boolean): string {
  return `action-queue__row ${side}${acting ? ' is-acting' : ''}`
}

/** 队列行的头像格（无名册元数据的召唤物退 emoji 问号）。行里**只有头像**：
    格子就地 40px，名字顶出去一长条既压棋盘，又是这堆 DOM 里唯一的文本——
    谁是谁看棋盘和信息条即可，这里只回答「接下来轮到谁」。 */
function queueAvatarHtml(meta: UnitMeta | undefined): string {
  return `<span class="action-queue__avatar">${meta ? heroAvatarHtml(meta, '40px') : '❓'}</span>`
}

/** 队列行（不含外壳）：首帧骨架用，之后每 tick 由 patchQueue 增量维护。 */
function actionQueueRows(s: BattleSession, queue: readonly UnitViewLite[], actingId: string | null): string {
  const mine = myFactionOf(s)
  return queue
    .map((u) => `<div class="${queueRowClass(u.faction === mine ? 'own' : 'enemy', u.id === actingId)}" data-unit="${escapeHtml(u.id)}">${queueAvatarHtml(s.unitMeta.get(u.id))}</div>`)
    .join('')
}

/** 行动队列外壳（首帧骨架用；后续增量更新走 patchQueue 只换内部行）。 */
function actionQueueHtml(s: BattleSession, queue: readonly UnitViewLite[], actingId: string | null): string {
  return `<aside class="action-queue" id="action-queue" aria-label="行动队列">${actionQueueRows(s, queue, actingId)}</aside>`
}

/**
 * 身份块两件套：大头像（左列）+ 名称/职业·体质·力敏智行（右列顶部）。
 * 决策条与信息面板共用——面板一律「头像在左，其余全在右」两列（右列是 .actor-side）。
 * 名称/体质这些非实时信息不常显在棋子上，要看就聚到这里。
 */
function actorAvatarHtml(meta: UnitMeta | undefined): string {
  // 大头像不带 emoji 兜底（缺图就留白，不拿 emoji 凑数）；横屏 152px / 竖屏 128px，都略超栏高
  return meta ? `<span class="actor-avatar">${heroAvatarHtml(meta, '152px', false)}</span>` : ''
}

function actorIdHtml(s: BattleSession, name: string, meta: UnitMeta | undefined): string {
  const sub = meta
    ? `${classNameOf(s, meta)} · ${constitutionById(meta.constitutionId)?.name ?? meta.constitutionId} · ${meta.combo.strength}力/${meta.combo.agility}敏/${meta.combo.intelligence}智`
    : ''
  return `<div class="actor-id">
    <div class="actor-name">${escapeHtml(name)}</div>
    ${sub ? `<div class="actor-sub">${meta ? emblemHtml(meta.classId) : ''}${escapeHtml(sub)}</div>` : ''}
  </div>`
}

function decisionBarHtml(s: BattleSession, pending: DecisionRequest, disabled = false): string {
  const meta = s.unitMeta.get(pending.caster)
  return `
  <div class="cg-panel decision">
    ${actorAvatarHtml(meta)}
    <div class="actor-side">
      ${actorIdHtml(s, meta?.name ?? pending.caster, meta)}
      <div class="decision-main">
        <div class="decision-title">点选棋盘上的高亮目标${disabled ? ' · 已提交，等待同步…' : ''}</div>
        <button type="button" class="cg-btn cg-btn--sm cg-btn--block pick-auto" id="btn-auto-pick" ${disabled ? 'disabled' : ''}>交给 AI（自动选择）</button>
      </div>
    </div>
  </div>`
}

/** 格位描述：「1路 · 第2排」——我方/敌方不再写（归属看半场与描边色即知，2026-10-13 裁决） */
function coordText(c: { lane: string; index: number }): string {
  return `${laneLabel(c.lane)} · 第${c.index + 1}排`
}

/**
 * 非操作时机的信息面板：己方单位/空格 → 底部条（与操作栏同一槽位，decision--inspect）；
 * 敌方 → 竖屏顶部条 / 横屏右上浮层。内容为身份 + 实时状态（HP/能量/状态列表），不含技能（在名册抽屉）。
 * 无关闭键：点面板外任意空白处即收起（见 wireDelegated 的空白点击兜底）。
 */
function inspectPanelHtml(s: BattleSession, view: CombatView, sel: Inspect): string {
  if (sel.kind === 'slot') {
    const [faction, lane, indexStr] = sel.coord.split('|')
    const inner = `${actorIdHtml(s, '空位', undefined)}
      <div class="inspect-body"><span class="inspect-stat">${escapeHtml(coordText({ lane, index: Number(indexStr) }))}</span></div>`
    return faction === myFactionOf(s)
      ? `<div class="cg-panel decision decision--inspect"><div class="actor-side">${inner}</div></div>`
      : `<aside class="cg-panel inspect-foe"><div class="actor-side">${inner}</div></aside>`
  }
  const u = view.units.find((x) => x.id === sel.id)
  if (!u) return ''
  const meta = s.unitMeta.get(u.id)
  const own = meta ? meta.side === 'own' : u.faction === myFactionOf(s)
  const chips = u.statuses.map((st) => chipHtml(s, st)).join('')
  // 位置不写（看棋盘即知，2026-10-14 裁决）；空格面板只有格位可写，那里保留
  const stats = [`HP ${u.hp}/${u.hpMax}`, `能量 ${u.energy}`]
  const inner = `${actorAvatarHtml(meta)}
    <div class="actor-side">
      ${actorIdHtml(s, meta?.name ?? u.id, meta)}
      <div class="inspect-body">
        ${stats.map((t) => `<span class="inspect-stat">${t}</span>`).join('')}
        ${chips ? `<span class="inspect-chips">${chips}</span>` : ''}
      </div>
    </div>`
  return own
    ? `<div class="cg-panel decision decision--inspect">${inner}</div>`
    : `<aside class="cg-panel inspect-foe">${inner}</aside>`
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

/** 全场重名清单（按会话缓存：名册在 setup 后不再变）——两军同池生成，重名是常态 */
const dupNameCache = new WeakMap<BattleSession, ReadonlySet<string>>()
function dupNames(s: BattleSession): ReadonlySet<string> {
  let d = dupNameCache.get(s)
  if (!d) {
    const count = new Map<string, number>()
    for (const m of s.unitMeta.values()) count.set(m.name, (count.get(m.name) ?? 0) + 1)
    d = new Set([...count].filter(([, n]) => n > 1).map(([name]) => name))
    dupNameCache.set(s, d)
  }
  return d
}

/** 日志/报告专用名：走名册取名（召唤物没有 meta 回退裸 id）；有重名才补阵营后缀
   （sleepless_1(我)/(敌)），不重名保持裸名 */
function logNameOf(s: BattleSession, id: string): string {
  const meta = s.unitMeta.get(id)
  const name = meta?.name ?? id
  if (!meta || !dupNames(s).has(name)) return name
  return `${name}(${meta.side === 'own' ? '我' : '敌'})`
}

/** clock(tick 序号) → 一天内的钟点「HH:MM」（1 tick = TICK_MINUTES 分钟，一天 TICK_PER_DAY tick） */
function clockTime(tick: number): string {
  const mins = (((tick % TICK_PER_DAY) + TICK_PER_DAY) % TICK_PER_DAY) * TICK_MINUTES
  return `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`
}

function describe(s: BattleSession, e: DomainEvent): string {
  switch (e.type) {
    // tickIndex 就是战场时钟的绝对值：顺手带出相位与钟点，日志行不用回头数 tick
    case 'TickAdvanced': return `— tick ${e.tickIndex} · ${PHASE_NAME[phaseOf(e.tickIndex)] ?? ''} ${clockTime(e.tickIndex)} —`
    case 'GaugeCrossed': return `${logNameOf(s, e.unitId)} 行动条满`
    case 'ActionOpportunityGranted': return `${logNameOf(s, e.opportunity.unitId)} 获得行动机会`
    case 'BehaviorCommitted': return `${logNameOf(s, e.caster)} 出手${e.sourceRef ? `「${sourceNameOf(s, e.sourceRef)}」` : ''}`
    case 'TargetsResolved': return `目标锁定：${e.targets.map((t) => targetText(s, t)).join('、')}`
    case 'EffectApplied': return `「${sourceNameOf(s, e.effectRef.ref)}」作用于 ${targetText(s, e.target)}`
    case 'StatusMounted': return `${e.unitId ? `${logNameOf(s, e.unitId)} ` : ''}挂载状态 ${statusName(s, e.defId)}`
    case 'StatusExpired': return `${e.unitId ? `${logNameOf(s, e.unitId)} ` : ''}状态到期 ${statusName(s, e.defId)}`
    case 'UnitSpawned': return `召唤 ${logNameOf(s, e.unitId)}`
    case 'UnitDied': return `${logNameOf(s, e.unitId)} 阵亡`
    case 'CorpseExpired': return `${logNameOf(s, e.unitId)} 亡骸消散`
    case 'UnitRevived': return `${logNameOf(s, e.unitId)} 复活`
    case 'UnitTranslocated': return `${logNameOf(s, e.unitId)} 被放逐`
    case 'UnitReturned': return `${logNameOf(s, e.unitId)} 回归`
    case 'DomainPlaced': return `界域展开 ${e.defId}`
    case 'DomainCovered': return `界域被压制 ${e.defId}`
    case 'DomainExpired': return `界域消散 ${e.defId}`
    case 'RuleSlotChanged': return `规则槽 ${e.slot} · ${e.field} ${e.mode}`
    case 'RuleTriggered': return `规则触发 · ${e.rule} · ${logNameOf(s, e.unitId)}`
    case 'ZonePlaced': return `区域布下`
    default: return e.type
  }
}

/** 目标描述：有租客写名字 + 格位，空坐标写格位（放逐/区域结算会落在空格上） */
function targetText(s: BattleSession, t: { coord: Coordinate; occupant: UnitId | null }): string {
  const where = coordText(t.coord)
  return t.occupant ? `${logNameOf(s, t.occupant)}(${where})` : `空位(${where})`
}

/** 行为源取名：技能 → 状态 → 行为模板（被动）→ 内置普攻 → 裸 id（与卡面降级同一套顺序） */
function sourceNameOf(s: BattleSession, ref: string): string {
  if (ref === BASIC_ATTACK_ID) return '普攻'
  return s.catalog.skillDefs.get(ref)?.name ?? s.catalog.statusDefs.get(ref)?.name ?? s.catalog.behaviorTemplates.get(ref)?.name ?? ref
}

/**
 * 复制给 AI 排查用的全量文本报告。与屏上日志（倒序、60 行封顶）不同源：
 * 走 drainEvents() 累计全量、按时间正序；开头是两军初始装配 + 种子/数据版本，
 * 事件流里把同一 actionId 的 BehaviorCommitted/TargetsResolved/EffectApplied
 * 折成一段「谁出手 → 用的什么 → 打到谁」，复现问题所需的最小事实都在里面。
 */
function buildLogReport(s: BattleSession): string {
  const view = s.facade.state()
  const ended = s.facade.ended()
  const my = myFactionOf(s)
  const lines: string[] = []
  lines.push('# 战斗日志导出（排查用）')
  lines.push(`导出时间: ${new Date().toLocaleString()}`)
  lines.push(`种子: ${s.setup.seed}`)
  // 初始相位由 setup.clockBase 决定（缺省 0 = 午夜 00:00），种子不参与——要复现只需种子 + 这份装配
  const baseClock = ((s.setup.board.clock.base % TICK_PER_DAY) + TICK_PER_DAY) % TICK_PER_DAY
  lines.push(`初始时刻: clock ${baseClock} · ${PHASE_NAME[phaseOf(baseClock)] ?? ''} ${clockTime(baseClock)}`)
  lines.push(`数据版本: data=${shortHash(dataVersion.dataHash)} lock=${shortHash(dataVersion.lockHash)}${dataVersion.stale ? '（数据已漂移，未验收）' : ''} schema=${dataVersion.schemaVersion} source=${dataVersion.sourceVersion} game=${dataVersion.gameSha}`)
  lines.push(`进度: tick ${view.tick} · ${PHASE_NAME[view.phase] ?? view.phase} · 场上存活 ${view.units.filter((u) => u.hp > 0).length}${ended ? ` · 已结束(${ended.outcome}${ended.winnerFactionId ? `，胜方 ${ended.winnerFactionId}` : ''})` : ''}`)
  lines.push('')
  for (const f of s.setup.factions) {
    lines.push(`## ${f.id === my ? '我方' : '敌方'}（阵营 ${f.id} · ${f.name}）`)
    for (const u of f.units) {
      const meta = u.unitId ? s.unitMeta.get(u.unitId) : undefined
      const name = meta?.name ?? u.unitId ?? u.defId ?? '（未知单位）'
      const cls = meta ? classNameOf(s, meta) : ''
      const con = meta ? constitutionById(meta.constitutionId)?.name ?? meta.constitutionId : ''
      const a = u.attributeSet
      const attrs = `${a.strength}力/${a.agility}敏/${a.intelligence}智${a.rank != null ? `·位格${a.rank}` : ''}`
      const pools = [u.pools?.hp != null ? `HP${u.pools.hp}` : '', u.pools?.energy != null ? `能量${u.pools.energy}` : ''].filter(Boolean).join(' ')
      lines.push(`- ${name}${cls || con ? `（${[cls, con].filter(Boolean).join('·')}）` : ''} ${attrs}${pools ? ` ${pools}` : ''} @${coordText(u.coordinate)}`)
      const act = (u.activeSlots ?? []).map((g) => s.catalog.skillDefs.get(g.skillDefId)?.name ?? g.skillDefId)
      const pas = (u.passiveSlots ?? []).map((g) => s.catalog.behaviorTemplates.get(g.defId)?.name ?? s.catalog.skillDefs.get(g.defId)?.name ?? g.defId)
      const sts = (u.initialStatuses ?? []).map((g) => {
        const defId = (g as { defId?: string }).defId ?? '?'
        const nm = s.catalog.statusDefs.get(defId)?.name ?? defId
        const stacks = typeof g.stacks === 'number' ? g.stacks : 1
        return `${nm}${stacks > 1 ? `×${stacks}` : ''}${g.duration != null ? `(${g.duration}t)` : ''}`
      })
      const mods = (u.initialModifiers ?? []).map((m) => `${m.stat}${m.value > 0 ? '+' : ''}${m.value}`)
      const sub = [
        act.length > 0 ? `主动[${act.join(' / ')}]` : '',
        pas.length > 0 ? `被动[${pas.join(' / ')}]` : '',
        sts.length > 0 ? `初始状态[${sts.join(' / ')}]` : '',
        mods.length > 0 ? `修正[${mods.join(' ')}]` : '',
      ].filter(Boolean).join(' ')
      if (sub) lines.push(`  ${sub}`)
    }
    lines.push('')
  }
  lines.push('## 事件流（正序，同一行为折成一段）')
  // 预扫：actionId → 该行为的 caster / 技能 / 目标 / 逐目标效果（BehaviorCommitted 是主体锚点）
  const acts = new Map<string, { caster: string; source: string; targets: string; effects: string[] }>()
  for (const e of s.facade.drainEvents()) {
    if (e.type === 'BehaviorCommitted') {
      const a = acts.get(e.actionId) ?? { caster: '', source: '', targets: '', effects: [] }
      a.caster = logNameOf(s, e.caster)
      if (e.sourceRef) a.source = sourceNameOf(s, e.sourceRef)
      acts.set(e.actionId, a)
    } else if (e.type === 'TargetsResolved') {
      const a = acts.get(e.actionId) ?? { caster: '', source: '', targets: '', effects: [] }
      a.targets = e.targets.map((t) => targetText(s, t)).join('、')
      acts.set(e.actionId, a)
    } else if (e.type === 'EffectApplied') {
      const a = acts.get(e.actionId) ?? { caster: '', source: '', targets: '', effects: [] }
      a.effects.push(`「${sourceNameOf(s, e.effectRef.ref)}」→ ${targetText(s, e.target)}`)
      acts.set(e.actionId, a)
    }
  }
  const folded = new Set<string>()
  // 逐行带 [tN]：事件本身不含 tick，靠 TickAdvanced  marker 推进当前 tick 计数
  let curTick = baseClock
  for (const e of s.facade.drainEvents()) {
    if (e.type === 'TickAdvanced') {
      curTick = e.tickIndex
      lines.push(describe(s, e))
      continue
    }
    const prefix = `[t${curTick}] `
    const actionId = 'actionId' in e ? e.actionId : null
    if (actionId != null) {
      if (folded.has(actionId)) continue
      folded.add(actionId)
      const a = acts.get(actionId)
      if (!a) { lines.push(prefix + describe(s, e)); continue }
      lines.push(`${prefix}${a.caster || '（未知主体）'} 出手${a.source ? `「${a.source}」` : ''}${a.targets ? ` → ${a.targets}` : ''}`)
      for (const ef of a.effects) lines.push(`    ${ef}`)
      continue
    }
    lines.push(prefix + describe(s, e))
  }
  return lines.join('\n')
}

/** 复制到剪贴板：clipboard API 优先，降级 textarea + execCommand（非安全上下文兜底） */
async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch { /* 走降级 */ }
  const ta = document.createElement('textarea')
  ta.value = text
  ta.style.cssText = 'position:fixed;opacity:0;pointer-events:none'
  document.body.appendChild(ta)
  ta.select()
  let ok = false
  try { ok = document.execCommand('copy') } catch { /* 没救了 */ }
  ta.remove()
  return ok
}
