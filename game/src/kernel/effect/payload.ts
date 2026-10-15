// 触发器载荷语境（执行参数 §2.1 触发点 / 共享内核参数 §一 EffectRef.target）。
// 触发器效果上的 target 简写在**载荷语境**下求值：宿主、作用者、受害方、攻击方、被击杀者
// 由触发点决定（见 ddd 执行参数 §2.3 载荷主体表），其余简写按 faction + scope 展开。
import type { Coordinate } from '../battle/types'
import type { FactionId } from '../ids'
import type { Registry } from '../roster/registry'
import type { CombatUnit } from '../roster/unit'
import type { EffectTarget } from '../shared/types'
import type { OpportunityPayload } from './context'

/** 触发点的语境主体：由 fireStatusTriggers 按事件组装 */
export interface TriggerPayload {
  /** 触发器宿主：状态实例 / 被动卡的持有者 */
  readonly host: CombatUnit
  /** 作用者：本次事件中释放效果的单位（状态取溯源 casterId；缺省 = 宿主） */
  readonly caster: CombatUnit | null
  /** 受害 / 受作用方：承伤者（on_take_damage）、打出的目标（on_deal_damage）、
   *  新生单位（on_spawn）、被击杀者（on_death / on_kill）、到期状态的持有者（on_remove） */
  readonly target: CombatUnit | null
  /** 攻击方（on_take_damage / on_deal_damage / on_death / on_kill = 宿主） */
  readonly attacker: CombatUnit | null
  /** 被击杀者（on_kill 的受害者；on_death = 宿主自身） */
  readonly killed: CombatUnit | null
  /** 宿主阵营的敌方（缺省由 registry 推断） */
  readonly enemyFaction: FactionId | null
  readonly opportunity?: OpportunityPayload
}

/** 触发点提供的事件主体；未提供者按「无」处理（简写退回宿主） */
export interface PayloadSubjects {
  caster?: CombatUnit | null
  target?: CombatUnit | null
  attacker?: CombatUnit | null
  killed?: CombatUnit | null
}

function alive(list: readonly CombatUnit[]): CombatUnit[] {
  return list.filter((u) => !u.isDead && !u.detached && u.position != null)
}

/** 相邻（共享内核参数 §一 相邻域）：同阵营 = 同路 index±1 或另一路同格；
 *  跨阵营 = 同路且格序差 ≤1（以对峙中线为基准的镜像对位）。spread 层的精细口径见待办。 */
function adjacent(a: Coordinate, b: Coordinate): boolean {
  if (a.faction === b.faction) {
    return a.lane === b.lane ? Math.abs(a.index - b.index) === 1 : a.index === b.index
  }
  return a.lane === b.lane && Math.abs(a.index - b.index) <= 1
}

function adjacentUnits(ref: CombatUnit, units: Registry): CombatUnit[] {
  const pos = ref.position
  if (!pos) return []
  return alive(units.all()).filter((u) => u.id !== ref.id && u.position != null && adjacent(pos, u.position))
}

/**
 * 载荷语境下的 target 简写展开（共享内核参数 §一：均由 faction + scope 组合展开）。
 * 语境缺失的主体（如无攻击方的 on_tick 遇 attacker）退回宿主——与「效果默认作用在宿主身上」同义。
 */
export function resolvePayloadTargets(
  selector: EffectTarget,
  p: TriggerPayload,
  units: Registry,
  unsupported?: (kind: string, detail?: string) => void,
): CombatUnit[] {
  const host = p.host
  const one = (u: CombatUnit | null | undefined): CombatUnit[] => (u && !u.isDead ? [u] : [])
  const allies = (): CombatUnit[] => alive(units.aliveIn(host.faction))
  const enemies = (): CombatUnit[] => (p.enemyFaction ? alive(units.aliveIn(p.enemyFaction)) : [])

  switch (selector) {
    // —— 单指：语境主体 ——
    case 'self':
    case 'holder':
    case 'status_holder':
      return one(host)
    case 'caster':
      return one(p.caster ?? host)
    case 'target':
    case 'primary_target':
    case 'secondary_target':
    case 'same_target':
      return one(p.target ?? host)
    case 'attacker':
      return one(p.attacker ?? host)
    case 'killed_unit':
      return one(p.killed ?? host)
    // —— 群体 ——
    case 'all_allies':
      return allies()
    case 'allies_except_self':
      return allies().filter((u) => u.id !== host.id)
    case 'all_enemies':
    case 'enemy':
      return enemies()
    case 'all_other_enemies': {
      const except = p.caster?.id ?? host.id
      return enemies().filter((u) => u.id !== except)
    }
    case 'all_units':
    case 'all':
      return alive(units.all())
    // —— 几何域 ——
    case 'adjacent_enemy':
      return enemies().filter((u) => host.position != null && u.position != null && adjacent(host.position, u.position))
    case 'splash_adjacent':
      return adjacentUnits(p.target ?? host, units)
    // —— 未接通（board / occupant_* / one_own_snare_trap / splash_behind）：登记后按宿主兜底 ——
    default:
      unsupported?.(`payload:${selector}`)
      return one(host)
  }
}
