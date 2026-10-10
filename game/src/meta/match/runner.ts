// MatchRunner：lockstep 驱动循环（P7_PLAN §3.3）。
// 内核是「可暂停状态机」——本类只负责在每个决策点问「谁该选」，
// 本侧走人工选择 + publish，对侧只 receive 等待。
//
// ★ 铁律 1（§3.4）：caster 非本侧时绝不本地回退——禁止调 slice(0,pickCount) 或代选。
//   双方 setup 相同 ⇒ 候选数相同 ⇒ 暂停点一致 ⇒ seq 一致。
import type { FactionId, UnitId } from '../../kernel/ids'
import type { CombatRuntimeHandle } from '../../kernel/combat/runtime'
import type { DecisionInput, DecisionRequest } from '../../kernel/execution/types'
import { canonicalDecision, type MatchChannel } from './channel'

export interface MatchRunnerOptions {
  facade: CombatRuntimeHandle
  channel: MatchChannel
  /** 本侧阵营（host='A' / guest='B'，见 buildOnlineSetup） */
  myFaction: FactionId
  /** 本地决策：由 UI 选靶（测试给脚本）。只在 caster 属本侧时调用。 */
  chooseLocally: (req: DecisionRequest) => Promise<DecisionInput>
  /** 状态变化通知（UI 重渲染） */
  onUpdate?: () => void
  /** 每 tick 之间的节拍毫秒：UI 观战用（0 = 尽快，测试用） */
  stepDelayMs?: number
}

export class MatchRunner {
  private readonly opts: MatchRunnerOptions
  private seq = 0
  private loopPromise: Promise<void> | null = null
  private stopped = false
  private paused = false
  private resumeWaiters: (() => void)[] = []
  private waitingFlag = false
  private remoteCount = 0
  private error: unknown = null

  constructor(opts: MatchRunnerOptions) {
    this.opts = opts
  }

  /** 已处理到第几个决策（双方一致） */
  get decisionSeq(): number {
    return this.seq
  }
  /** 正在等对手决策（UI 遮罩） */
  get waiting(): boolean {
    return this.waitingFlag
  }
  /** 本侧从通道接收过多少次对手决策 */
  get remoteDecisionCount(): number {
    return this.remoteCount
  }
  get isPaused(): boolean {
    return this.paused
  }
  get lastError(): unknown {
    return this.error
  }
  /** 循环结束（测试 await 它） */
  get finished(): Promise<void> {
    return this.loopPromise ?? Promise.resolve()
  }

  start(): void {
    if (this.loopPromise) return
    this.loopPromise = this.loop()
      .catch((e: unknown) => {
        this.error = e
      })
      .finally(() => {
        this.opts.onUpdate?.()
      })
  }

  stop(): void {
    this.stopped = true
    this.wake()
  }

  pause(): void {
    if (this.paused) return
    this.paused = true
    this.opts.onUpdate?.()
  }

  resume(): void {
    if (!this.paused) return
    this.paused = false
    this.wake()
    this.opts.onUpdate?.()
  }

  private wake(): void {
    const w = this.resumeWaiters
    this.resumeWaiters = []
    for (const f of w) f()
  }

  private async gate(): Promise<void> {
    while (this.paused && !this.stopped) {
      await new Promise<void>((r) => this.resumeWaiters.push(r))
    }
  }

  private async loop(): Promise<void> {
    const { facade, channel, onUpdate } = this.opts
    const delay = this.opts.stepDelayMs ?? 0
    while (!this.stopped && !facade.ended()) {
      await this.gate()
      if (this.stopped) break

      const req = facade.pendingDecision()
      if (!req) {
        facade.step()
        onUpdate?.()
        if (delay > 0) await new Promise<void>((r) => setTimeout(r, delay))
        continue
      }

      const choice = await this.decide(req)
      if (this.stopped) break
      if (choice.mine) await channel.publish(this.seq, choice.input)
      this.seq += 1
      facade.submitDecision(choice.input)
      onUpdate?.()
    }
    onUpdate?.()
  }

  private async decide(req: DecisionRequest): Promise<{ input: DecisionInput; mine: boolean }> {
    const casterFaction = this.factionOf(req.caster)
    if (casterFaction === undefined) throw new Error(`决策点的施法者不在场上：${req.caster}`)

    if (casterFaction === this.opts.myFaction) {
      // 归一化：本地候选与对侧经 wire 回来的对象键序不同（见 canonicalDecision）
      const input = canonicalDecision(await this.opts.chooseLocally(req))
      return { input, mine: true }
    }

    // ★ 对侧决策：只等待，绝不本地回退
    this.waitingFlag = true
    this.remoteCount += 1
    this.opts.onUpdate?.()
    try {
      const input = canonicalDecision(await this.opts.channel.receive(this.seq))
      return { input, mine: false }
    } finally {
      this.waitingFlag = false
      this.opts.onUpdate?.()
    }
  }

  private factionOf(unitId: UnitId): FactionId | undefined {
    return this.opts.facade.state().units.find((u) => u.id === unitId)?.faction
  }
}
