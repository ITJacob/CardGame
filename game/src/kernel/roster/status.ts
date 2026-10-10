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

export class CombatStatusSet implements StatusSet {
  private instances: StatusInstance[] = []

  constructor(
    private readonly defs: StatusDefLookup,
    private readonly nextId: () => InstanceId,
  ) {}

  mount(defId: string, grant: StatusGrant): StatusInstance | null {
    const def = this.defs.statusDef(defId)
    const maxStacks = Math.max(1, def?.maxStacks ?? 1)
    const duration = Math.max(0, Math.floor(grant.duration ?? def?.duration ?? 1))
    const addStacks = Math.max(1, Math.floor(grant.stacks ?? 1))

    const existing = this.instances.find((i) => i.defId === defId)
    if (existing) {
      // schema 的 stackPolicy 只有 stack/refresh；层数累加与 policy 无关（编队参数 §2.4）
      existing.currentStacks = clamp(existing.currentStacks + addStacks, 1, maxStacks)
      existing.remaining = Math.max(existing.remaining, duration)
      return existing
    }

    const instance: StatusInstance = {
      instanceId: this.nextId(),
      defId,
      grant,
      remaining: duration,
      currentStacks: clamp(addStacks, 1, maxStacks),
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

  /** tick 第 6 步：递减 remaining，返回到期卸载者。 */
  tick(): StatusInstance[] {
    const expired: StatusInstance[] = []
    for (const i of this.instances) {
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
