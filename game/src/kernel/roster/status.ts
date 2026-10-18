// 状态容器 StatusSet：挂载/叠加/到期/卸载的数据面。
// P2a 简化：每个 defId 单实例；层数 clamp(cur+grant.stacks,1,maxStacks) 与 stackPolicy 无关，
// policy 只决定「已存在时」的处置（reject 拒绝 / refresh 续期）。多实例并存（真 stack）留 P2b。

import type { InstanceId } from '../ids'
import type { StatusDef } from '../catalog/types'
import type { StatusGrant, StatusInstance, StatusSet } from './types'

export interface StatusDefLookup {
  statusDef(id: string): StatusDef | undefined
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v))
}

/**
 * 时长口径（编队参数 §1.1b duration）：正整数 = 自然到期；null = 常驻（不自然到期）。
 * 载荷层（Grant）的 duration 省略或 null 一律是「未指定」→ 回退 StatusDef.duration；
 * 只有 Def 层也写 null 才是常驻——载荷层不表达常驻。
 */
function resolveDuration(grant: number | null | undefined, def: number | null | undefined): number | null {
  const raw = grant ?? def
  if (raw === null || raw === undefined) return null
  return Math.max(0, Math.floor(raw))
}

/** refresh 取长者；常驻恒胜（编队上下文 §2.4） */
function longer(a: number | null, b: number | null): number | null {
  if (a === null || b === null) return null
  return Math.max(a, b)
}

export class CombatStatusSet implements StatusSet {
  private instances: StatusInstance[] = []

  constructor(
    private readonly defs: StatusDefLookup,
    private readonly nextId: () => InstanceId,
  ) {}

  mount(defId: string, grant: StatusGrant): StatusInstance | null {
    const def = this.defs.statusDef(defId)
    const maxStacks = Math.max(1, def?.maxStacks ?? 1)
    const duration = resolveDuration(grant.duration, def?.duration)
    const mode = grant.stackMode ?? ((grant.stacks ?? 0) < 0 ? 'consume' : 'add')
    const rawStacks = Math.max(1, Math.floor(Math.abs(grant.stacks ?? 1)))
    const charged = grant.charges ?? def?.charges
    const initialCharges = typeof charged === 'number' && Number.isFinite(charged)
      ? Math.max(0, Math.floor(charged))
      : null
    const existing = this.instances.find((i) => i.defId === defId)

    if (mode === 'consume') {
      if (!existing) return null
      const next = existing.currentStacks - rawStacks
      if (next <= 0) {
        this.unmount(existing.instanceId)
        return null
      }
      existing.currentStacks = next
      return existing
    }

    if (mode === 'override') {
      const next = clamp(rawStacks, 1, maxStacks)
      if (existing) {
        existing.currentStacks = next
        existing.remaining = longer(existing.remaining, duration)
        return existing
      }
      const instance: StatusInstance = {
        instanceId: this.nextId(),
        defId,
        grant: { ...grant, stackMode: undefined },
        remaining: duration,
        currentStacks: next,
        charges: initialCharges,
        maxCharges: initialCharges,
      }
      this.instances.push(instance)
      return instance
    }

    if (existing) {
      // schema 的 stackPolicy 只有 stack/refresh；层数累加与 policy 无关（编队参数 §2.4）
      existing.currentStacks = clamp(existing.currentStacks + rawStacks, 1, maxStacks)
      existing.remaining = longer(existing.remaining, duration)
      return existing
    }

    const instance: StatusInstance = {
      instanceId: this.nextId(),
      defId,
      grant: { ...grant, stackMode: undefined },
      remaining: duration,
      currentStacks: clamp(rawStacks, 1, maxStacks),
      charges: initialCharges,
      maxCharges: initialCharges,
    }
    this.instances.push(instance)
    return instance
  }

  unmount(instanceId: InstanceId): StatusInstance | null {
    const idx = this.instances.findIndex((i) => i.instanceId === instanceId)
    if (idx < 0) return null
    const [removed] = this.instances.splice(idx, 1)
    return removed ?? null
  }

  /** tick 第 6 步：递减 remaining，返回到期卸载者（只动 tick 口径）。 */
  tick(): StatusInstance[] {
    return this.drain((i) => this.unitOf(i) === 'tick')
  }

  /** 机会括号左端：递减 self_turn 口径的 remaining，返回到期卸载者。 */
  tickSelfTurn(): StatusInstance[] {
    return this.drain((i) => this.unitOf(i) === 'self_turn')
  }

  private drain(owned: (i: StatusInstance) => boolean): StatusInstance[] {
    const expired: StatusInstance[] = []
    for (const i of this.instances) {
      if (!owned(i)) continue
      if (i.remaining === null) continue // 常驻不递减（编队参数 §1.1b duration）
      if (i.remaining <= 0) continue
      i.remaining -= 1
      if (i.remaining <= 0) expired.push(i)
    }
    if (expired.length > 0) {
      const gone = new Set(expired.map((i) => i.instanceId))
      this.instances = this.instances.filter((i) => !gone.has(i.instanceId))
    }
    return expired
  }

  /** 时长口径：Grant 覆盖 Def，再缺省 tick（调度参数 §〇点五） */
  private unitOf(i: StatusInstance): 'tick' | 'self_turn' {
    return i.grant.durationUnit ?? this.defs.statusDef(i.defId)?.durationUnit ?? 'tick'
  }

  all(): readonly StatusInstance[] {
    return this.instances
  }

  byDef(defId: string): readonly StatusInstance[] {
    return this.instances.filter((i) => i.defId === defId)
  }

  stacksOf(defId: string): number {
    let n = 0
    for (const i of this.instances) if (i.defId === defId) n += i.currentStacks
    return n
  }

  has(defId: string): boolean {
    return this.instances.some((i) => i.defId === defId)
  }

  clear(): void {
    this.instances = []
  }
}
