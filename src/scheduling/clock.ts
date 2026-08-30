/**
 * BattleClock：一个 tick 就是一个原子步（§6.1）。
 *
 * 顺序纪律：推进（1–7）与授予（8）严格分离——先把世界推进到稳定态，再决定谁行动。
 * 否则会出现"单位 A 行动时，B 的资源还没恢复"这种依赖 tick 内顺序的隐蔽 bug。
 *
 * 1. clock.advance()
 * 2. 所有 Unit 的 Gauge.advance()                 → 可能发 GaugeCrossed
 * 3. 所有 Pool 按 regen 恢复
 * 4. Channel.remaining--                          → 归零者完成结算
 * 5. Cooldown.remaining--
 * 6. StatusInstance.remaining--（到期者 unmount）；
 *    StatProvenance 带时限条目 remaining--（到期者 revertBySource）   ← A21
 * 7. Zone 的 duration 递减（到期者移除）
 * 8. 收集本 tick 内所有 GaugeCrossed → InitiativePolicy 排序 → 依次授予机会
 */

import type { EventBus } from '../shared/events.js';
import type { Unit } from '../roster/unit.js';
import type { Battle } from '../battle/battle.js';
import type { Zone } from '../battle/zone.js';
import type { StatusInstance } from '../roster/status.js';
import type { RevertedEntry } from '../roster/provenance.js';
import type { GaugeAdvanceResult } from '../roster/resources.js';

export interface TickDeps {
  /** 参与推进的单位（顺序已确定）。 */
  readonly units: () => readonly Unit[];
  readonly battle: Battle;
  readonly bus: EventBus;
  readonly onGaugeAdvance: (unit: Unit, result: GaugeAdvanceResult) => void;
  /** 引导倒计时递减后的钩子：归零即完成结算（由执行上下文实现）。 */
  readonly onChannelTick: (unit: Unit) => void;
  /** 状态时长递减前的钩子：用于 on_tick 载荷（DoT / HoT）。 */
  readonly onStatusTick: (unit: Unit) => void;
  readonly onStatusExpired: (unit: Unit, instance: StatusInstance) => void;
  readonly onStatReverted: (unit: Unit, reverted: readonly RevertedEntry[]) => void;
  readonly onZoneExpired: (zone: Zone) => void;
}

export class BattleClock {
  tickIndex = 0;

  /** 执行一次原子推进，返回本 tick 越过阈值的单位（按给定顺序）。 */
  tick(deps: TickDeps): readonly Unit[] {
    // 1. 时钟前进
    this.tickIndex += 1;
    deps.bus.emit({ type: 'TickAdvanced', tickIndex: this.tickIndex });

    const units = deps.units().filter((u) => u.isAlive);

    // 2. Gauge 推进（INV-S1：严格越过阈值）
    const crossed: Unit[] = [];
    for (const unit of units) {
      const result = unit.gauge.advance();
      deps.onGaugeAdvance(unit, result);
      if (result.crossed) crossed.push(unit);
    }

    // 3. 池型资源恢复
    for (const unit of units) {
      for (const pool of unit.pools.values()) {
        if (pool.regen !== 0) pool.regenerate();
      }
    }

    // 4. 引导倒计时
    for (const unit of units) {
      if (!unit.channel) continue;
      unit.channel.remaining -= 1;
      if (unit.channel.remaining <= 0) deps.onChannelTick(unit);
    }

    // 5. 冷却递减
    for (const unit of units) {
      unit.tickCooldowns();
    }

    // 6. 状态与带时限属性修正的倒计时
    for (const unit of units) {
      deps.onStatusTick(unit);
      for (const expired of unit.statuses.tick()) {
        deps.onStatusExpired(unit, expired);
      }
      const reverted = unit.provenance.tick();
      if (reverted.length > 0) {
        unit.invalidateConstraints();
        deps.onStatReverted(unit, reverted);
      }
    }

    // 7. Zone 时长递减
    for (const zone of [...deps.battle.allZones()]) {
      if (zone.remaining === null) continue;
      zone.remaining -= 1;
      if (zone.remaining <= 0) deps.onZoneExpired(zone);
    }

    return crossed;
  }
}
