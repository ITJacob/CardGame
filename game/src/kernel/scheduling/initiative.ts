// 先手裁决（调度上下文 §四）。
// 铁律 INV-S2：己方/敌方各自先按 (lane,index) 升序排序，再按 [己,敌,敌,己] 交替合并——
// 禁止按战场位置分层。一侧耗尽时顺延取另一侧（确定性）。
import type { FactionId, UnitId } from '../ids'
import type { Coordinate } from '../battle/types'
import type { ActionOpportunity, GaugeCrossed } from './types'

const PATTERN: readonly [0 | 1, 0 | 1, 0 | 1, 0 | 1] = [0, 1, 1, 0]

export interface PositionLookup {
  positionOf(id: UnitId): Coordinate | null
}

function sortKey(c: Coordinate | null): [string, number, string] {
  if (!c) return ['~', Number.MAX_SAFE_INTEGER, ''] // 无坐标（detached）排最后
  return [c.lane, c.index, '']
}

function compareByPosition(a: GaugeCrossed, b: GaugeCrossed, pos: PositionLookup): number {
  const ka = sortKey(pos.positionOf(a.unitId))
  const kb = sortKey(pos.positionOf(b.unitId))
  if (ka[0] !== kb[0]) return ka[0] < kb[0] ? -1 : 1
  if (ka[1] !== kb[1]) return ka[1] - kb[1]
  return a.unitId < b.unitId ? -1 : a.unitId > b.unitId ? 1 : 0
}

export function resolveInitiative(
  crossed: readonly GaugeCrossed[],
  factions: readonly [FactionId, FactionId],
  factionOf: (id: UnitId) => FactionId | undefined,
  pos: PositionLookup,
  tickIndex: number,
  newOpportunity: (unitId: UnitId, tickIndex: number) => ActionOpportunity,
): ActionOpportunity[] {
  const queues: [GaugeCrossed[], GaugeCrossed[]] = [[], []]
  for (const c of crossed) {
    const f = factionOf(c.unitId)
    if (f === factions[0]) queues[0].push(c)
    else if (f === factions[1]) queues[1].push(c)
  }
  queues[0].sort((a, b) => compareByPosition(a, b, pos))
  queues[1].sort((a, b) => compareByPosition(a, b, pos))

  const out: ActionOpportunity[] = []
  let i0 = 0
  let i1 = 0
  let slot = 0
  while (i0 < queues[0].length || i1 < queues[1].length) {
    const side = PATTERN[slot % PATTERN.length] as 0 | 1
    let pick: GaugeCrossed | undefined
    if (side === 0 && i0 < queues[0].length) pick = queues[0][i0++]
    else if (side === 1 && i1 < queues[1].length) pick = queues[1][i1++]
    else pick = i0 < queues[0].length ? queues[0][i0++] : queues[1][i1++]
    if (pick) out.push(newOpportunity(pick.unitId, tickIndex))
    slot += 1
  }
  return out
}
