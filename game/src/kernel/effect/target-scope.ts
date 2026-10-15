// 效果级 target 的求值语境（执行参数 §2.1b 载荷语境 / §2.1c 卡片语境）。
// 语境有两个来源：触发链载荷（主体由触发点决定）、卡片行为（施法者 + 该次选靶命中集合）。
// 无语境（zone / translocate / echo 等路径）时效果沿用外层落点，本模块不参与。
import type { Coordinate } from '../battle/types'
import type { FactionId } from '../ids'
import type { Registry } from '../roster/registry'
import type { CombatUnit } from '../roster/unit'
import type { EffectTarget } from '../shared/types'
import type { OpportunityPayload } from './context'

/** 效果级 `target` 简写的求值语境 */
export interface TargetScope {
  /** `self` / `holder` / `status_holder` 的落点：触发链 = 触发器宿主；卡片 = 施法者 */
  readonly host: CombatUnit
  /** `caster` 的落点（缺省回退 host）：触发链 = 该状态实例的施加者；卡片 = 施法者 */
  readonly caster: CombatUnit | null
  /** `target` / `primary_target` / `same_target` / `secondary_target` 的落点集合。
   *  触发链恒为单元素（该触发点无受害主体时 = [host]）；卡片 = 该次选靶命中的单位，
   *  **可为空**——空集即无落点，效果空转（不退回施法者） */
  readonly targets: readonly CombatUnit[]
  /** `attacker` 的落点（on_take_damage / on_deal_damage 语境） */
  readonly attacker: CombatUnit | null
  /** `killed_unit` 的落点（on_kill / on_death 语境） */
  readonly killed: CombatUnit | null
  /** 群体与几何简写展开的敌方阵营（宿主阵营的对位） */
  readonly enemyFaction: FactionId | null
  readonly opportunity?: OpportunityPayload
}

/** 触发点提供的事件主体；未提供者按「无」处理（简写退回宿主，执行参数 §2.1b 缺省回退） */
export interface TriggerSubjects {
  caster?: CombatUnit | null
  target?: CombatUnit | null
  attacker?: CombatUnit | null
  killed?: CombatUnit | null
}

/** 卡片语境（执行参数 §2.1c）：施法者即宿主，选靶命中集合即 `target`。
 *  卡片语境没有受害方 / 攻击方主体——`attacker` / `killed_unit` 退回施法者。 */
export function cardScope(
  caster: CombatUnit,
  selected: readonly CombatUnit[],
  enemyFaction: FactionId | null,
): TargetScope {
  return { host: caster, caster, targets: selected, attacker: null, killed: null, enemyFaction }
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

/** 以若干原点扩散相邻域（去重，保持 registry 序）；原点本身不含在内。 */
function splashFrom(refs: readonly CombatUnit[], units: Registry): CombatUnit[] {
  const seen = new Set<string>()
  const out: CombatUnit[] = []
  for (const ref of refs) {
    for (const u of adjacentUnits(ref, units)) {
      if (seen.has(u.id)) continue
      seen.add(u.id)
      out.push(u)
    }
  }
  return out
}

/**
 * 语境下的 target 简写展开（共享内核参数 §一：均由 faction + scope 组合展开）。
 * 语境缺失的主体（如无攻击方的 on_tick 遇 attacker）退回宿主——与「效果默认作用在宿主身上」同义。
 */
export function resolveEffectTargets(
  selector: EffectTarget,
  scope: TargetScope,
  units: Registry,
  unsupported?: (kind: string, detail?: string) => void,
): CombatUnit[] {
  const host = scope.host
  const one = (u: CombatUnit | null | undefined): CombatUnit[] => (u && !u.isDead ? [u] : [])
  const selected = (): CombatUnit[] => scope.targets.filter((u) => !u.isDead && !u.detached)
  const allies = (): CombatUnit[] => alive(units.aliveIn(host.faction))
  const enemies = (): CombatUnit[] => (scope.enemyFaction ? alive(units.aliveIn(scope.enemyFaction)) : [])

  switch (selector) {
    // —— 单指：语境主体 ——
    case 'self':
    case 'holder':
    case 'status_holder':
      return one(host)
    case 'caster':
      return one(scope.caster ?? host)
    case 'target':
    case 'primary_target':
    case 'same_target':
    case 'secondary_target':
      return selected()
    case 'attacker':
      return one(scope.attacker ?? host)
    case 'killed_unit':
      return one(scope.killed ?? host)
    // —— 群体 ——
    case 'all_allies':
      return allies()
    case 'allies_except_self':
      return allies().filter((u) => u.id !== host.id)
    case 'all_enemies':
    case 'enemy':
      return enemies()
    case 'all_other_enemies': {
      const except = scope.caster?.id ?? host.id
      return enemies().filter((u) => u.id !== except)
    }
    case 'all_units':
    case 'all':
      return alive(units.all())
    // —— 几何域 ——
    case 'adjacent_enemy':
      return enemies().filter((u) => host.position != null && u.position != null && adjacent(host.position, u.position))
    case 'splash_adjacent':
      return splashFrom(scope.targets, units)
    // —— 战场级锚点：不寻址任何单位（共享内核参数 §一 EffectRef.target 末条）——
    // host 仅作 handler 落点，使 modify_resource(secrecy/order/fate_value) 走到 board 量表分支。
    case 'board':
      return one(host)
    // —— 未接通（splash_behind / occupant_* / one_own_snare_trap / rule_breaker）：登记后按宿主兜底 ——
    default:
      unsupported?.(`target:${selector}`)
      return one(host)
  }
}
