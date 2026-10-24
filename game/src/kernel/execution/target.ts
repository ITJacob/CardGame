// 目标解析（执行上下文 §四 I 节点 / 共享内核参数 §一）。
// mode 是选靶第一级分流：
//   unit（缺省）= 池为**单位实体**（faction 圈定）；scope 只作池边界，pickCount 决定命中数（指定型）；
//   area        = 池为**坐标区块**（anchor 原点 + scope 几何圈定）；命中区域内全部在位单位（AoE），
//                 pickCount 不参与。**AoE 的判据是 mode=area，不是 pickCount**。
import type { FactionId, LaneId } from '../ids'
import type { Coordinate } from '../battle/types'
import type { ResolvedTarget } from './types'
import type { FactionSelector, TargetRequest, UnitFilter } from '../shared/types'
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
  /** 最近阵亡友军坐标（复活寻址 anchor:last_dead_ally） */
  lastDeadCellFor?(faction: FactionId): Coordinate | null
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

/**
 * 选靶 filter（共享内核参数 §一）：候选池单位过滤。
 * 未接通字段记 unsupported、视为通过（不静默改变候选池）；数据当前使用
 * hasStatus / unitType / isSummon / casterOwned / unitId / isPuppet / isAllyOrMirror。
 */
function matchesUnitFilter(u: CombatUnit, filter: UnitFilter | undefined, ctx: TargetContext): boolean {
  if (!filter) return true
  const self = ctx.self
  if (filter.unitType !== undefined) {
    const types = Array.isArray(filter.unitType) ? filter.unitType : [filter.unitType]
    if (u.unitType == null || !types.includes(u.unitType)) return false
  }
  if (filter.tags?.length) {
    if (!filter.tags.some((t) => u.tags.includes(t))) return false
  }
  if (filter.hasStatus !== undefined) {
    const hs = filter.hasStatus
    if (typeof hs === 'string') {
      if (u.statusStacks(hs) <= 0) return false
    } else if (hs === true) {
      if (u.statuses.all().length === 0) return false
    } else if (hs) {
      if (hs.id && u.statusStacks(hs.id) < (hs.stacksAtLeast ?? 1)) return false
      if (!hs.id && u.statuses.all().length === 0) return false
    }
  }
  if (filter.unitId !== undefined) {
    const ids = Array.isArray(filter.unitId) ? filter.unitId : [filter.unitId]
    if (u.unitDefId == null || !ids.includes(u.unitDefId)) return false
  }
  if (filter.isSummon !== undefined && (u.summonerId != null) !== filter.isSummon) return false
  if (filter.casterOwned !== undefined && (u.summonerId === self.id) !== filter.casterOwned) return false
  if (filter.isPuppet !== undefined && (u.statusStacks('puppet_string') > 0) !== filter.isPuppet) return false
  if (filter.isAllyOrMirror !== undefined) {
    const mirror = u.unitDefId != null && u.unitDefId.includes('mirror')
    if ((u.faction === self.faction || mirror) !== filter.isAllyOrMirror) return false
  }
  if (filter.hpPercent) {
    const pct = (u.hp / Math.max(1, u.hpMax)) * 100
    const bound = filter.hpPercent.n ?? 0
    switch (filter.hpPercent.cmp ?? '<=') {
      case '>': if (!(pct > bound)) return false; break
      case '>=': if (!(pct >= bound)) return false; break
      case '<': if (!(pct < bound)) return false; break
      case '<=': if (!(pct <= bound)) return false; break
      default: if (pct !== bound) return false
    }
  }
  if (filter.gender !== undefined && filter.gender !== 'any' && u.gender !== filter.gender) return false
  const ownRank = u.stat('rank')
  const casterRank = self.stat('rank')
  if (filter.rankBelowCaster !== undefined && (ownRank < casterRank) !== filter.rankBelowCaster) return false
  if (filter.rankAboveCaster !== undefined && (ownRank > casterRank) !== filter.rankAboveCaster) return false
  if (filter.rankMax !== undefined && ownRank > filter.rankMax) return false
  if (filter.rankMin !== undefined && ownRank < filter.rankMin) return false
  if (filter.casterHasSummon !== undefined) {
    const has = ctx.units.all().some((x) => x.summonerId === self.id && !x.isDead)
    if (has !== filter.casterHasSummon) return false
  }
  if (filter.anyOf?.length && !filter.anyOf.some((f) => matchesUnitFilter(u, f, ctx))) return false
  if (filter.hasCategory !== undefined || filter.adjacency !== undefined) {
    ctx.unsupported?.('filter', JSON.stringify(filter))
  }
  return true
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
      ctx.unsupported?.(`anchor:${anchor}`)
      return derivedDefault()
    case 'last_dead_ally': {
      // 有登记通道即算已接通；本场尚无人阵亡时按缺省原点（不记 unsupported）
      if (ctx.lastDeadCellFor) return ctx.lastDeadCellFor(own) ?? derivedDefault()
      ctx.unsupported?.(`anchor:${anchor}`)
      return derivedDefault()
    }
    default: {
      const u = ctx.units.get(specificUnitId(anchor) ?? '')
      if (u?.position) return u.position
      // 具名 anchor 也接受 unitDef 蓝本 id（如 unit_doppelganger：改指分身而不认实例 id）
      const byDef = ctx.units.all().find((x) => x.unitDefId === anchor && x.position != null)
      if (byDef?.position) return byDef.position
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

function sortCandidates(list: CombatUnit[], sort: string, ctx: TargetContext): CombatUnit[] {
  const tiebreak = (a: CombatUnit, b: CombatUnit): number => tie(a, b, ctx.lanes)
  const laneOrd = (u: CombatUnit): number => {
    const i = ctx.lanes.indexOf(u.position?.lane as LaneId)
    return i < 0 ? 0 : i
  }
  const dist = (u: CombatUnit): number => {
    const from = ctx.self.position
    const p = u.position
    if (!from || !p) return Number.MAX_SAFE_INTEGER
    return Math.abs(laneOrd(u) - laneOrd(ctx.self)) + Math.abs(p.index - from.index)
  }
  const hpPct = (u: CombatUnit): number => u.hp / Math.max(1, u.hpMax)
  const cmp = (a: CombatUnit, b: CombatUnit): number => {
    switch (sort) {
      case 'index_desc':
        return indexOf(b) - indexOf(a) || tiebreak(a, b)
      case 'hp_asc':
        return a.hp - b.hp || tiebreak(a, b)
      case 'hp_desc':
        return b.hp - a.hp || tiebreak(a, b)
      case 'distance_asc':
        return dist(a) - dist(b) || tiebreak(a, b)
      case 'hp_pct_asc':
        return hpPct(a) - hpPct(b) || tiebreak(a, b)
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

/** 几何锚点（其余字符串按具名单位 / unitDef 蓝本 id 解释） */
const GEOMETRY_ANCHORS = new Set([
  'self', 'caster', 'enemy_front', 'ally_front', 'enemy_back', 'spawned_unit', 'last_dead_ally',
])

/** 选靶覆写：一次性 pendingTargetOverride 优先；否则读持态 BehaviorModifier（不消费）。 */
function applyTargetOverride(request: TargetRequest, self: CombatUnit): TargetRequest {
  const oneShot = self.pendingTargetOverride
  const ov = oneShot ?? self.activeTargetOverride()
  if (!ov) return request
  if (oneShot) self.pendingTargetOverride = null
  const anchor = ov.anchor
  const sort = (ov.sort as TargetRequest['sort']) ?? request.sort
  const faction = (ov.faction as TargetRequest['faction']) ?? request.faction

  // 打空：下一次攻击指向空坐标（C7 母版——多数「误导/认错目标」状态）
  if (anchor === 'first_empty') return { ...request, faction: 'none' }
  // 打向不分阵营的最近单位
  if (anchor === 'nearest_any') {
    return { ...request, faction: 'any', anchor: 'self', excludeSelf: true, sort: 'distance_asc' as TargetRequest['sort'] }
  }
  // 全场生命百分比最低（不分阵营）
  if (anchor === 'any_lowest_hp') {
    return { ...request, faction: 'any', anchor: 'self', excludeSelf: true, sort: 'hp_pct_asc' as TargetRequest['sort'] }
  }
  // anchor:unit + unitId：改指具名单位（"self" = 持有者自身）
  if (anchor === 'unit' && ov.unitId) {
    return ov.unitId === 'self'
      ? { ...request, faction: 'self', anchor: 'self', sort }
      : { ...request, faction: 'any', anchor: ov.unitId, sort }
  }
  // 具名单位 / unitDef 蓝本 id：跨阵营寻址（如单位分身改指）
  if (anchor && !GEOMETRY_ANCHORS.has(anchor) && !/^fixed_cell\(/.test(anchor)) {
    return { ...request, faction: (ov.faction as TargetRequest['faction']) ?? 'any', anchor, sort }
  }
  return {
    ...request,
    faction,
    anchor: anchor ?? request.anchor,
    sort,
  }
}

/** unit：指定型——scope 只作池边界，命中数由 pickCount 决定 */
function resolveUnit(request: TargetRequest, ctx: TargetContext): ResolvedTarget[] {
  const pool = factionPool(request.faction, ctx).filter(inPlay).filter((u) => matchesUnitFilter(u, request.filter, ctx))
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
  const origin = originOf(request, ctx)
  const cells = cellsOfScope(origin, scope, ctx)
  const keys = new Set(cells.map((c) => `${c.lane}/${c.index}`))
  const candidates = pool.filter((u) => {
    const p = u.position
    if (!p || !keys.has(`${p.lane}/${p.index}`)) return false
    if (request.excludeSelf && u.id === ctx.self.id) return false
    if (request.excludeAnchor && p.faction === origin.faction && p.lane === origin.lane && p.index === origin.index) return false
    return !u.isUntargetable('targeted', ctx.self.faction)
  })
  return sortCandidates(candidates, request.sort ?? 'index_asc', ctx).map(toResolved)
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
    if (request.excludeAnchor && cell.faction === origin.faction && cell.lane === origin.lane && cell.index === origin.index) continue
    const u = byCell.get(`${cell.faction}/${cell.lane}/${cell.index}`)
    if (!u || seen.has(u.id)) continue
    if (!matchesFaction(request.faction, u, ctx)) continue
    if (!matchesUnitFilter(u, request.filter, ctx)) continue
    if (request.excludeSelf && u.id === ctx.self.id) continue
    if (u.isUntargetable('area', ctx.self.faction)) continue
    seen.add(u.id)
    picked.push(u)
  }
  return sortCandidates(picked, request.sort ?? 'index_asc', ctx).map(toResolved)
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
