// 单位注册表：确定性遍历（按注入顺序），禁止依赖 Map 迭代序。
import type { FactionId, UnitId } from '../ids'
import type { UnitRegistry } from './types'
import type { CombatUnit } from './unit'

export class Registry implements UnitRegistry {
  private readonly order: CombatUnit[] = []
  private readonly byId = new Map<UnitId, CombatUnit>()

  add(unit: CombatUnit): void {
    if (this.byId.has(unit.id)) throw new Error(`单位 id 重复：${unit.id}`)
    this.order.push(unit)
    this.byId.set(unit.id, unit)
  }

  remove(id: UnitId): void {
    const idx = this.order.findIndex((u) => u.id === id)
    if (idx >= 0) this.order.splice(idx, 1)
    this.byId.delete(id)
  }

  get(id: UnitId): CombatUnit | undefined {
    return this.byId.get(id)
  }

  all(): CombatUnit[] {
    return [...this.order]
  }

  of(faction: FactionId): CombatUnit[] {
    return this.order.filter((u) => u.faction === faction)
  }

  alive(): CombatUnit[] {
    return this.order.filter((u) => !u.isDead)
  }

  aliveIn(faction: FactionId): CombatUnit[] {
    return this.order.filter((u) => u.faction === faction && !u.isDead)
  }
}
