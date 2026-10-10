// 调度器：tick 原子推进（8 阶段），推进(1–7) 与授予(8) 严格分离。
// detached 单位跳过第 2–6 步（计时冻结）。P2a 的 Zone/Domain 运行时为 stub。
import type { Phase } from '../ids'
import type { Battle } from '../battle/types'
import type { DomainEvent } from '../combat/types'
import type { Registry } from '../roster/registry'
import type { CombatUnit } from '../roster/unit'
import type { StatusInstance } from '../roster/types'
import { TICK_PER_DAY } from '../battle/types'
import type { GaugeCrossed, Scheduler } from './types'

export interface SchedulerHooks {
  /** 第 6 步：状态 on_tick 效果（在 remaining 递减之前触发） */
  onStatusTickEffect?(unit: CombatUnit): void
  /** 状态到期卸载后，fire on_remove */
  onStatusExpired?(unit: CombatUnit, instance: StatusInstance): void
}

export interface SchedulerDeps {
  battle: Battle
  units: Registry
  emit: (event: DomainEvent) => void
  hooks: SchedulerHooks
}

/** 相位派生（P2a 默认：72 tick 均分 5 段） */
export function phaseOf(clock: number): Phase {
  const seg = Math.floor(((clock % TICK_PER_DAY) + TICK_PER_DAY) % TICK_PER_DAY / 14.4)
  return (['midnight', 'dawn', 'day', 'dusk', 'night'] as const)[Math.min(4, seg)] as Phase
}

const PHASE_LUMINANCE: Record<Phase, number> = { midnight: 1, dawn: 4, day: 8, dusk: 5, night: 2 }

export class CombatScheduler implements Scheduler {
  constructor(private readonly deps: SchedulerDeps) {}

  tick(): GaugeCrossed[] {
    const { battle, units, emit, hooks } = this.deps
    const crossed: GaugeCrossed[] = []

    // 1 clock.advance
    battle.clock = (battle.clock + 1) % TICK_PER_DAY
    battle.phase = phaseOf(battle.clock)
    battle.luminance = PHASE_LUMINANCE[battle.phase]
    emit({ type: 'TickAdvanced', tickIndex: battle.clock })

    for (const unit of units.all()) {
      if (unit.detached) continue
      // 2 Gauge 累积 + 严格越阈
      const g = unit.gauge.advance()
      if (g.crossed) {
        crossed.push({ unitId: unit.id, gaugeKey: unit.gauge.key })
        emit({ type: 'GaugeCrossed', unitId: unit.id, gaugeKey: unit.gauge.key })
      }
    }
    for (const unit of units.all()) {
      if (unit.detached) continue
      // 3 Pool regen
      for (const pool of unit.pools.values()) pool.regenerate()
      // 4 Channel 递减
      if (unit.channel && unit.channel.remaining > 0) unit.channel.remaining -= 1
      // 5 Cooldown 递减
      for (const slot of unit.behaviorSlots) if (slot.cooldownRemaining > 0) slot.cooldownRemaining -= 1
      for (const [k, v] of unit.cooldowns) if (v > 0) unit.cooldowns.set(k, v - 1)
      // 6 状态 on_tick 效果 → 递减 → 到期卸载
      hooks.onStatusTickEffect?.(unit)
      for (const inst of unit.statuses.tick()) {
        unit.provenance.revertBySource(inst.instanceId)
        hooks.onStatusExpired?.(unit, inst)
      }
      unit.provenance.tick()
    }

    // 7 Zone/界域 duration 递减（P2a stub：仅递减 domains）
    for (const d of battle.domains) if (d.grant.duration > 0) d.grant.duration -= 1
    battle.domains = battle.domains.filter((d) => d.grant.duration !== 0)

    // 8 授予交由 runtime 处理
    return crossed
  }
}
