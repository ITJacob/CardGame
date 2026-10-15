// 目标解析（执行上下文 §四 I 节点 / 共享内核参数 §一）。
// mode 是选靶第一级分流：
//   unit（缺省）= 池为**单位实体**（faction 圈定）；scope 只作池边界，pickCount 决定命中数（指定型）；
//   area        = 池为**坐标区块**（anchor 原点 + scope 几何圈定）；命中区域内全部在位单位（AoE），
//                 pickCount 不参与。**AoE 的判据是 mode=area，不是 pickCount**。
import type { FactionId, LaneId } from '../ids'
import type { Coordinate } from '../battle/types'
import type { ResolvedTarget } from './types'
import type { FactionSelector, SortKey, TargetRequest } from '../shared/types'
import type { Registry } from '../roster/registry'
import type { CombatUnit } from '../roster/unit'

export interface TargetContext {
  units: Registry
  self: CombatUnit
  enemyFaction: FactionId
  /** 有序路 id（升序）——跨路/菱形/链式跳跃的定向依据（战场参数 §二） */
  lanes: readonly LaneId[]
  /** 每路格数 LANE_CAPACITY */
  laneCapacity: number
  /** 未支持项登记（缺省静默） */
  unsupported?(kind: string, detail?: string): void
}

const DEFAULT_SCOPE = 'whole_lane'

// ---------- 候选池（按 faction 圈定单位实体） ----------

function factionPool(selector: FactionSelector, ctx: TargetContext): CombatUnit[] {
  const self = ctx.self
  switch (selector) {
    case 'self':
      return [self]
    case 'enemy':
      return ctx.units.aliveIn(ctx.enemyFaction)
    case 'ally':
    case 'self_or_ally':
      return ctx.units.aliveIn(self.faction)
    case 'none':
      return []
    default:
      // any：跨敌我双方（顺序恒为 我 → 敌，保证确定性）
      return [...ctx.units.aliveIn(self.faction), ...ctx.units.aliveIn(ctx.enemyFaction)]
  }
}

function inPlay(u: CombatUnit): boolean {
  return !u.isDead && !u.detached && u.position != null
}

// ---------- 原点（anchor：几何从哪量起） ----------

function clampIndex(i: number, ctx: TargetContext): number {
  return Math.max(0, Math.min(ctx.laneCapacity - 1, Math.trunc(i)))
}

function fixedCellIndex(anchor: string | undefined, fixedIndex: number | undefined): number | null {
  if (typeof fixedIndex === 'number' && Number.isFinite(fixedIndex)) return fixedIndex
  const m = /^fixed_cell\((\d+)\)$/.exec(anchor ?? '')
  return m ? Number(m[1]) : null
}

function specificUnitId(anchor: string): string | null {
  const m = /^specific_unit\((.+)\)$/.exec(anchor)
  return m ? m[1]! : anchor
}

/**
 * anchor 只回答「从哪量几何」（共享内核参数 §一）。
 * 缺省按 faction 推导：enemy → enemy_front（敌方同路排首 i=0），ally/self → 施法者所在格。
 * 锚点语义未接通（spawned_unit / last_dead_ally / 未知 id）时登记 unsupported 并退回缺省原点。
 */
function originOf(request: TargetRequest, ctx: TargetContext): Coordinate {
  const self = ctx.self
  const own = self.faction
  const other = ctx.enemyFaction
  const lane = self.position?.lane ?? ctx.lanes[0] ?? ''
  const selfCell: Coordinate = self.position ?? { faction: own, lane, index: 0 }
  const enemyFront: Coordinate = { faction: other, lane, index: 0 }
  const derivedDefault = (): Coordinate => (request.faction === 'enemy' ? enemyFront : selfCell)

  const anchor = request.anchor
  const fixed = fixedCellIndex(anchor, request.fixedIndex)
  if (fixed !== null) {
    return { faction: request.faction === 'enemy' ? other : own, lane, index: clampIndex(fixed, ctx) }
  }
  if (!anchor) return derivedDefault()

  switch (anchor) {
    case 'self':
    case 'caster':
      return selfCell
    case 'enemy_front':
      return enemyFront
    case 'ally_front':
      return { faction: own, lane, index: 0 }
    case 'enemy_back':
      return { faction: other, lane, index: ctx.laneCapacity - 1 }
    case 'spawned_unit':
    case 'last_dead_ally':
      ctx.unsupported?.(`anchor:${anchor}`)
      return derivedDefault()
    default: {
      const u = ctx.units.get(specificUnitId(anchor) ?? '')
      if (u?.position) return u.position
      ctx.unsupported?.(`anchor:${anchor}`)
      return derivedDefault()
    }
  }
}

// ---------- 范围（scope：几何枚举，以原点量起） ----------

function seq(from: number, to: number, ctx: TargetContext): number[] {
  const lo = clampIndex(from, ctx)
  const hi = clampIndex(to, ctx)
  const out: number[] = []
  for (let i = lo; i <= hi; i += 1) out.push(i)
  return out
}

function laneIdx(lane: LaneId, ctx: TargetContext): number {
  const i = ctx.lanes.indexOf(lane)
  return i >= 0 ? i : 0
}

/** 链式跳跃（chain_n）：自原点沿相邻格向外跳 n 次（BFS 逐环，环内按 路序→格序 破平） */
function chainCells(origin: Coordinate, n: number, ctx: TargetContext): Coordinate[] {
  const key = (c: Coordinate): string => `${c.lane}/${c.index}`
  const neighbors = (c: Coordinate): Coordinate[] => {
    const out: Coordinate[] = []
    if (c.index - 1 >= 0) out.push({ faction: c.faction, lane: c.lane, index: c.index - 1 })
    if (c.index + 1 <= ctx.laneCapacity - 1) out.push({ faction: c.faction, lane: c.lane, index: c.index + 1 })
    for (const l of ctx.lanes) if (l !== c.lane) out.push({ faction: c.faction, lane: l, index: c.index })
    return out.sort((a, b) => laneIdx(a.lane, ctx) - laneIdx(b.lane, ctx) || a.index - b.index)
  }
  const seen = new Set<string>([key(origin)])
  const out: Coordinate[] = [origin]
  let frontier: Coordinate[] = [origin]
  while (out.length <= n && frontier.length > 0) {
    const next: Coordinate[] = []
    for (const c of [...frontier].sort((a, b) => laneIdx(a.lane, ctx) - laneIdx(b.lane, ctx) || a.index - b.index)) {
      for (const nb of neighbors(c)) {
        const k = key(nb)
        if (seen.has(k)) continue
        seen.add(k)
        next.push(nb)
        if (out.length <= n) out.push(nb)
      }
    }
    frontier = next
  }
  return out.slice(0, n + 1)
}

/** scope → 坐标区块。顺序恒为 路序 → 格序（确定性）。 */
function cellsOfScope(origin: Coordinate, scopeRaw: string | undefined, ctx: TargetContext): Coordinate[] {
  const scope = scopeRaw ?? DEFAULT_SCOPE
  const C = ctx.laneCapacity
  const f = origin.faction
  const l = origin.lane
  const i = origin.index
  const at = (lane: LaneId, index: number): Coordinate => ({ faction: f, lane, index })
  const otherLanes = (): LaneId[] => ctx.lanes.filter((x) => x !== l)

  const m = /^([a-z_]+?)(?:_(\d+))?$/.exec(scope) ?? []
  const name = m[1] ?? scope
  const n = m[2] ? Number(m[2]) : 1

  switch (name) {
    case 'none':
      return []
    case 'point':
      return [at(l, i)]
    case 'whole_lane':
      return seq(0, C - 1, ctx).map((k) => at(l, k))
    case 'board':
      // 全场：双方各自的路 × 全部格（occupant 侧再由 faction 过滤）
      return [f, f === ctx.self.faction ? ctx.enemyFaction : ctx.self.faction].flatMap((fa) =>
        ctx.lanes.flatMap((la) => seq(0, C - 1, ctx).map((k) => ({ faction: fa, lane: la, index: k }))),
      )
    case 'cross_lane':
      return otherLanes().map((x) => at(x, i))
    case 'cross_lane_row':
      return otherLanes().flatMap((x) => seq(0, C - 1, ctx).map((k) => at(x, k)))
    case 'front':
      // front=朝中线（index 0 恒为对峙前线）→ 含原点的前 n 格
      return seq(i - n + 1, i, ctx).map((k) => at(l, k))
    case 'behind':
      return seq(i, i + n - 1, ctx).map((k) => at(l, k))
    case 'diamond': {
      const out: Coordinate[] = []
      const li = laneIdx(l, ctx)
      for (let x = 0; x < ctx.lanes.length; x += 1) {
        for (let k = 0; k < C; k += 1) {
          if (Math.abs(x - li) + Math.abs(k - i) <= n) out.push(at(ctx.lanes[x]!, k))
        }
      }
      return out
    }
    case 'chain':
      return chainCells(origin, n, ctx)
    default:
      ctx.unsupported?.(`scope:${scope}`)
      return seq(0, C - 1, ctx).map((k) => at(l, k))
  }
}

// ---------- 排序（同 sort 取值域，统一带确定性破平） ----------

/** 位置破平：格序优先（全场取 front），同格序按路序升序（共享内核参数 §一 board 回退细则） */
function posCompare(a: CombatUnit, b: CombatUnit, lanes: readonly LaneId[]): number {
  const byIndex = indexOf(a) - indexOf(b)
  if (byIndex !== 0) return byIndex
  return lanes.indexOf(a.position?.lane ?? '') - lanes.indexOf(b.position?.lane ?? '')
}

function indexOf(u: CombatUnit): number {
  return u.position?.index ?? Number.MAX_SAFE_INTEGER
}

function tie(a: CombatUnit, b: CombatUnit, lanes: readonly LaneId[]): number {
  return posCompare(a, b, lanes) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)
}

function sortCandidates(list: CombatUnit[], sort: SortKey, lanes: readonly LaneId[]): CombatUnit[] {
  const tiebreak = (a: CombatUnit, b: CombatUnit): number => tie(a, b, lanes)
  const cmp = (a: CombatUnit, b: CombatUnit): number => {
    switch (sort) {
      case 'index_desc':
        return indexOf(b) - indexOf(a) || tiebreak(a, b)
      case 'hp_asc':
        return a.hp - b.hp || tiebreak(a, b)
      case 'hp_desc':
        return b.hp - a.hp || tiebreak(a, b)
      case 'none':
        return tiebreak(a, b)
      default:
        return tiebreak(a, b)
    }
  }
  return [...list].sort(cmp)
}

// ---------- 入口 ----------

/** 缺省目标基准（共享内核参数 §一）：敌方同路最前排 = whole_lane + index_asc + pickCount 1 */
export function resolveCandidates(rawRequest: TargetRequest, ctx: TargetContext): ResolvedTarget[] {
  const request = applyTargetOverride(rawRequest, ctx.self)
  return (request.mode ?? 'unit') === 'area' ? resolveArea(request, ctx) : resolveUnit(request, ctx)
}

/** 消费被作用单位的下一次选靶覆写（层级最高；target_override） */
function applyTargetOverride(request: TargetRequest, self: CombatUnit): TargetRequest {
  const ov = self.pendingTargetOverride
  if (!ov) return request
  self.pendingTargetOverride = null
  return {
    ...request,
    faction: (ov.faction as TargetRequest['faction']) ?? request.faction,
    anchor: ov.anchor ?? request.anchor,
    sort: (ov.sort as TargetRequest['sort']) ?? request.sort,
  }
}

/** unit：指定型——scope 只作池边界，命中数由 pickCount 决定 */
function resolveUnit(request: TargetRequest, ctx: TargetContext): ResolvedTarget[] {
  const pool = factionPool(request.faction, ctx).filter(inPlay)
  const scope = request.scope ?? DEFAULT_SCOPE
  const picked = pickInRegion(pool, request, scope, ctx)
  if (picked.length > 0) return picked
  // 缺省 whole_lane 落空（空路 / 全隐匿）→ 回退全场（共享内核参数 §一）
  if (scope !== DEFAULT_SCOPE) return picked
  return pickInRegion(pool, request, 'board', ctx)
}

function pickInRegion(
  pool: CombatUnit[],
  request: TargetRequest,
  scope: string,
  ctx: TargetContext,
): ResolvedTarget[] {
  const cells = cellsOfScope(originOf(request, ctx), scope, ctx)
  const keys = new Set(cells.map((c) => `${c.lane}/${c.index}`))
  const candidates = pool.filter((u) => {
    const p = u.position
    if (!p || !keys.has(`${p.lane}/${p.index}`)) return false
    if (request.excludeSelf && u.id === ctx.self.id) return false
    return !u.isUntargetable('targeted', ctx.self.faction)
  })
  return sortCandidates(candidates, request.sort ?? 'index_asc', ctx.lanes).map(toResolved)
}

/** area：AoE——anchor 原点 + scope 圈定的坐标区块，命中区域内全部在位单位 */
function resolveArea(request: TargetRequest, ctx: TargetContext): ResolvedTarget[] {
  const origin = originOf(request, ctx)
  const cells = cellsOfScope(origin, request.scope, ctx)
  const byCell = new Map<string, CombatUnit>()
  for (const u of ctx.units.all()) {
    if (!inPlay(u)) continue
    byCell.set(`${u.position!.faction}/${u.position!.lane}/${u.position!.index}`, u)
  }
  const seen = new Set<string>()
  const picked: CombatUnit[] = []
  for (const cell of cells) {
    const u = byCell.get(`${cell.faction}/${cell.lane}/${cell.index}`)
    if (!u || seen.has(u.id)) continue
    if (!matchesFaction(request.faction, u, ctx)) continue
    if (request.excludeSelf && u.id === ctx.self.id) continue
    if (u.isUntargetable('area', ctx.self.faction)) continue
    seen.add(u.id)
    picked.push(u)
  }
  return sortCandidates(picked, request.sort ?? 'index_asc', ctx.lanes).map(toResolved)
}

function matchesFaction(selector: FactionSelector, u: CombatUnit, ctx: TargetContext): boolean {
  switch (selector) {
    case 'self':
      return u.id === ctx.self.id
    case 'enemy':
      return u.faction === ctx.enemyFaction
    case 'ally':
    case 'self_or_ally':
      return u.faction === ctx.self.faction
    case 'none':
      return false
    default:
      return true
  }
}

export function toResolved(u: CombatUnit): ResolvedTarget {
  const coord: Coordinate = u.position ?? { faction: u.faction, lane: '', index: 0 }
  return { coord, occupant: u.id }
}

/** 供测试/调试：某请求在给定上下文下的坐标区块 */
export function scopeCells(request: TargetRequest, ctx: TargetContext): Coordinate[] {
  return cellsOfScope(originOf(request, ctx), request.scope, ctx)
}
