// 选靶第一级：mode = unit（指定型·单位实体）/ area（区块型·AoE）
// 契约来源：共享内核参数 §一「mode / scope / pickCount」、执行上下文 §四 I-1/I-2。
import { describe, expect, it } from 'vitest'
import { createCombat } from '../src/kernel'
import { resolveCandidates, scopeCells } from '../src/kernel/execution/target'
import type { TargetContext } from '../src/kernel/execution/target'
import type { ResolvedTarget } from '../src/kernel/execution/types'
import { Registry } from '../src/kernel/roster/registry'
import type { CombatUnit } from '../src/kernel/roster/unit'
import type { StatusDef } from '../src/kernel/catalog/types'
import type { TargetRequest } from '../src/kernel/shared/types'
import type { CombatFacade } from '../src/kernel/combat/types'
import { buildAiVsAiSetup, makeUnit } from './helpers/fixture'

const LANES = ['lane0', 'lane1']

/** 隐匿（只挡指定型）：scope 缺省 single */
const VEIL: StatusDef = {
  id: 'veil',
  category: ['conceal'],
  dispelable: true,
  duration: 5,
  maxStacks: 1,
  modifiers: { untargetableByTargeted: { direction: 'both', scope: 'single' } } as never,
}

/** 绝对封印：scope: all——两种模式都挡 */
const SEAL: StatusDef = {
  id: 'seal',
  category: ['conceal'],
  dispelable: false,
  duration: 5,
  maxStacks: 1,
  modifiers: { untargetableByTargeted: { direction: 'both', scope: 'all' } } as never,
}

interface Place { id: string; faction: string; lane: string; index: number; status?: StatusDef }

function field(places: Place[]): { registry: Registry; ids: string[] } {
  const registry = new Registry()
  for (const p of places) {
    const u = makeUnit(p.id, p.faction, {}, p.status ? [p.status] : [])
    u.position = { faction: p.faction, lane: p.lane, index: p.index }
    if (p.status) u.statuses.mount(p.status.id, { duration: 5, sourceId: 'test' })
    registry.add(u)
  }
  return { registry, ids: places.map((p) => p.id) }
}

/** 阵型：我方 A0 在 lane0/0；敌方 B0B1B2 在 lane0 三格 + B3 在 lane1/0 */
function scenario(statuses: Record<string, StatusDef> = {}): TargetContext {
  const places: Place[] = [
    { id: 'A0', faction: 'A', lane: 'lane0', index: 0 },
    { id: 'B0', faction: 'B', lane: 'lane0', index: 0 },
    { id: 'B1', faction: 'B', lane: 'lane0', index: 1 },
    { id: 'B2', faction: 'B', lane: 'lane0', index: 2 },
    { id: 'B3', faction: 'B', lane: 'lane1', index: 0 },
  ]
  const { registry } = field(places.map((p) => (statuses[p.id] ? { ...p, status: statuses[p.id]! } : p)))
  return {
    units: registry,
    self: registry.get('A0') as CombatUnit,
    enemyFaction: 'B',
    lanes: LANES,
    laneCapacity: 4,
  }
}

function occ(targets: ResolvedTarget[]): string[] {
  return targets.map((t) => t.occupant ?? '∅')
}

const req = (r: Partial<TargetRequest> & { faction: TargetRequest['faction'] }): TargetRequest => r

describe('mode=unit（指定型）：scope 只作池边界，pickCount 定命中数', () => {
  it('缺省 = 敌方同路最前排，不跨路', () => {
    const ctx = scenario()
    expect(occ(resolveCandidates(req({ faction: 'enemy', anchor: 'enemy_front', scope: 'point', pickCount: 1 }), ctx)))
      .toEqual(['B0'])
  })

  it('whole_lane：本路全部敌（不含另一路）', () => {
    const ctx = scenario()
    expect(occ(resolveCandidates(req({ mode: 'unit', faction: 'enemy', anchor: 'enemy_front', scope: 'whole_lane', pickCount: 'all' }), ctx)))
      .toEqual(['B0', 'B1', 'B2'])
  })

  it('excludeAnchor：behind_2 去掉锚点后只剩后 1 格', () => {
    const ctx = scenario()
    expect(occ(resolveCandidates(req({
      mode: 'unit', faction: 'enemy', anchor: 'enemy_front', scope: 'behind_2',
      pickCount: 'all', excludeAnchor: true,
    }), ctx))).toEqual(['B1'])
  })

  it('board：池边界扩大到全场（跨路）', () => {
    const ctx = scenario()
    expect(occ(resolveCandidates(req({ mode: 'unit', faction: 'enemy', anchor: 'enemy_front', scope: 'board', pickCount: 'all' }), ctx)))
      .toEqual(['B0', 'B3', 'B1', 'B2'])
  })

  it('本路无候选 → 回退全场（空路回退）', () => {
    const { registry } = field([
      { id: 'A0', faction: 'A', lane: 'lane0', index: 0 },
      { id: 'B3', faction: 'B', lane: 'lane1', index: 0 },
    ])
    const ctx: TargetContext = {
      units: registry, self: registry.get('A0') as CombatUnit, enemyFaction: 'B', lanes: LANES, laneCapacity: 4,
    }
    expect(occ(resolveCandidates(req({ mode: 'unit', faction: 'enemy', anchor: 'enemy_front', sort: 'index_asc', pickCount: 1 }), ctx)))
      .toEqual(['B3'])
  })

  it('point 单目标本路无候选 → 同样回退全场', () => {
    const { registry } = field([
      { id: 'A0', faction: 'A', lane: 'lane0', index: 0 },
      { id: 'B3', faction: 'B', lane: 'lane1', index: 0 },
    ])
    const ctx: TargetContext = {
      units: registry, self: registry.get('A0') as CombatUnit, enemyFaction: 'B', lanes: LANES, laneCapacity: 4,
    }
    expect(occ(resolveCandidates(req({ mode: 'unit', faction: 'enemy', scope: 'point', pickCount: 1 }), ctx)))
      .toEqual(['B3'])
  })

  it('其他几何 scope 落空不回退（behind_2）', () => {
    const { registry } = field([
      { id: 'A0', faction: 'A', lane: 'lane0', index: 0 },
      { id: 'B3', faction: 'B', lane: 'lane1', index: 0 },
    ])
    const ctx: TargetContext = {
      units: registry, self: registry.get('A0') as CombatUnit, enemyFaction: 'B', lanes: LANES, laneCapacity: 4,
    }
    expect(occ(resolveCandidates(req({ mode: 'unit', faction: 'enemy', scope: 'behind_2', pickCount: 'all' }), ctx)))
      .toEqual([])
  })

  it('anchor enemy_back = 敌方同路最后排', () => {
    const { registry } = field([
      { id: 'A0', faction: 'A', lane: 'lane0', index: 0 },
      { id: 'B0', faction: 'B', lane: 'lane0', index: 0 },
      { id: 'B4', faction: 'B', lane: 'lane0', index: 3 },
    ])
    const ctx: TargetContext = {
      units: registry, self: registry.get('A0') as CombatUnit, enemyFaction: 'B', lanes: LANES, laneCapacity: 4,
    }
    expect(occ(resolveCandidates(req({ mode: 'unit', faction: 'enemy', anchor: 'enemy_back', scope: 'point' }), ctx)))
      .toEqual(['B4'])
  })

  it('anchor self + point：命中同格对位的敌人', () => {
    const ctx = scenario()
    expect(occ(resolveCandidates(req({ mode: 'unit', faction: 'enemy', anchor: 'self', scope: 'point' }), ctx)))
      .toEqual(['B0'])
  })

  it('scope none = 无目标', () => {
    const ctx = scenario()
    expect(resolveCandidates(req({ mode: 'unit', faction: 'enemy', scope: 'none' }), ctx)).toEqual([])
  })
})

describe('mode=area（区块型）：命中区域内全部在位单位，pickCount 不参与', () => {
  it('whole_lane 取满半场', () => {
    const ctx = scenario()
    expect(occ(resolveCandidates(req({ mode: 'area', faction: 'enemy', anchor: 'enemy_front', scope: 'whole_lane' }), ctx)))
      .toEqual(['B0', 'B1', 'B2'])
  })

  it('whole_lane 本路为空 → 不回落 board（空区域 0 命中）', () => {
    const { registry } = field([
      { id: 'A0', faction: 'A', lane: 'lane0', index: 0 },
      { id: 'B3', faction: 'B', lane: 'lane1', index: 0 },
    ])
    const ctx: TargetContext = {
      units: registry, self: registry.get('A0') as CombatUnit, enemyFaction: 'B', lanes: LANES, laneCapacity: 4,
    }
    expect(occ(resolveCandidates(req({ mode: 'area', faction: 'enemy', scope: 'whole_lane' }), ctx))).toEqual([])
  })

  it('pickCount 显式给了也不截断', () => {
    const ctx = scenario()
    expect(occ(resolveCandidates(req({ mode: 'area', faction: 'enemy', anchor: 'enemy_front', scope: 'whole_lane', pickCount: 1 }), ctx)))
      .toEqual(['B0', 'B1', 'B2'])
  })

  it('board = all_enemies（跨路全场）', () => {
    const ctx = scenario()
    expect(occ(resolveCandidates(req({ mode: 'area', faction: 'enemy', anchor: 'enemy_front', scope: 'board' }), ctx)).sort())
      .toEqual(['B0', 'B1', 'B2', 'B3'])
  })

  it('behind_2 = 锚点起向己方后排 2 格（敌锚点 = 前 2 敌）', () => {
    const ctx = scenario()
    expect(occ(resolveCandidates(req({ mode: 'area', faction: 'enemy', anchor: 'enemy_front', scope: 'behind_2' }), ctx)))
      .toEqual(['B0', 'B1'])
  })

  it('excludeAnchor：area 的 behind_2 排除锚点格', () => {
    const ctx = scenario()
    expect(occ(resolveCandidates(req({
      mode: 'area', faction: 'enemy', anchor: 'enemy_front', scope: 'behind_2', excludeAnchor: true,
    }), ctx))).toEqual(['B1'])
  })

  it('cross_lane / cross_lane_row = 另一路的并排格 / 整条半场', () => {
    const ctx = scenario()
    expect(occ(resolveCandidates(req({ mode: 'area', faction: 'enemy', anchor: 'enemy_front', scope: 'cross_lane' }), ctx)))
      .toEqual(['B3'])
    expect(occ(resolveCandidates(req({ mode: 'area', faction: 'enemy', anchor: 'enemy_front', scope: 'cross_lane_row' }), ctx)))
      .toEqual(['B3'])
  })

  it('diamond_1 = 曼哈顿距离 ≤1 的格', () => {
    const ctx = scenario()
    // 原点 (lane0,0) → 自带 + (lane0,1) + (lane1,0)
    expect(occ(resolveCandidates(req({ mode: 'area', faction: 'enemy', anchor: 'enemy_front', scope: 'diamond_1' }), ctx)))
      .toEqual(['B0', 'B3', 'B1'])
  })

  it('chain_2 = 自原点沿相邻格跳 2 次', () => {
    const ctx = scenario()
    expect(occ(resolveCandidates(req({ mode: 'area', faction: 'enemy', anchor: 'enemy_front', scope: 'chain_2' }), ctx)))
      .toEqual(['B0', 'B3', 'B1'])
  })

  it('scope none = 空区块', () => {
    const ctx = scenario()
    expect(resolveCandidates(req({ mode: 'area', faction: 'enemy', scope: 'none' }), ctx)).toEqual([])
  })

  it('空坐标不进候选池（只收在位单位）', () => {
    const ctx = scenario()
    const cells = scopeCells(req({ mode: 'area', faction: 'enemy', anchor: 'enemy_front', scope: 'whole_lane' }), ctx)
    expect(cells.length).toBe(4) // 半场 4 格，其中 1 格空
    expect(resolveCandidates(req({ mode: 'area', faction: 'enemy', anchor: 'enemy_front', scope: 'whole_lane' }), ctx)).toHaveLength(3)
  })
})

describe('「不可被选中」的两种口径（共享内核参数 §四）', () => {
  it('scope: single 的隐匿：挡指定型、不挡 AoE', () => {
    const ctx = scenario({ B1: VEIL })
    expect(occ(resolveCandidates(req({ mode: 'unit', faction: 'enemy', anchor: 'enemy_front', scope: 'point' }), ctx)))
      .toEqual(['B0'])
    expect(occ(resolveCandidates(req({ mode: 'area', faction: 'enemy', anchor: 'enemy_front', scope: 'whole_lane' }), ctx)))
      .toEqual(['B0', 'B1', 'B2'])
  })

  it('隐匿的前排被跳过（指定型取下一个可选中者）', () => {
    const ctx = scenario({ B0: VEIL })
    expect(occ(resolveCandidates(req({ mode: 'unit', faction: 'enemy', anchor: 'enemy_front', scope: 'whole_lane', pickCount: 1 }), ctx)))
      .toEqual(['B1', 'B2'])
  })

  it('scope: all 的绝对封印：两种模式都挡', () => {
    const ctx = scenario({ B1: SEAL })
    expect(occ(resolveCandidates(req({ mode: 'unit', faction: 'enemy', anchor: 'enemy_front', scope: 'point' }), ctx)))
      .toEqual(['B0'])
    expect(occ(resolveCandidates(req({ mode: 'area', faction: 'enemy', anchor: 'enemy_front', scope: 'whole_lane' }), ctx)))
      .toEqual(['B0', 'B2'])
  })

  it('modify_targetability(enemy_targeted)：挡指定型、不挡 AoE；untargetable:false 恢复', () => {
    const { registry } = field([
      { id: 'A0', faction: 'A', lane: 'lane0', index: 0 },
      { id: 'B0', faction: 'B', lane: 'lane0', index: 0 },
      { id: 'B1', faction: 'B', lane: 'lane0', index: 1 },
    ])
    const ctx: TargetContext = {
      units: registry, self: registry.get('A0') as CombatUnit, enemyFaction: 'B', lanes: LANES, laneCapacity: 4,
    }
    const b0 = registry.get('B0') as CombatUnit
    b0.manualUntargetable.push({ untargetable: true, remaining: null, kind: 'targeted', side: 'enemy' })
    expect(occ(resolveCandidates(req({ mode: 'unit', faction: 'enemy', anchor: 'enemy_front', scope: 'whole_lane', pickCount: 1 }), ctx)))
      .toEqual(['B1'])
    expect(occ(resolveCandidates(req({ mode: 'area', faction: 'enemy', anchor: 'enemy_front', scope: 'whole_lane' }), ctx)))
      .toEqual(['B0', 'B1'])
    b0.manualUntargetable.push({ untargetable: false, remaining: null, kind: 'targeted', side: 'enemy' })
    expect(occ(resolveCandidates(req({ mode: 'unit', faction: 'enemy', anchor: 'enemy_front', scope: 'whole_lane', pickCount: 1 }), ctx)))
      .toEqual(['B0', 'B1'])
  })
})

// ---------- 流水线：命中数由 mode/pickCount 定 ----------

function firstTargets(facade: CombatFacade, casterId: string): ResolvedTarget[] {
  for (let guard = 0; guard < 3000 && !facade.ended(); guard += 1) {
    const pending = facade.pendingDecision()
    if (pending) {
      facade.submitDecision(pending.candidates.slice(0, pending.pickCount))
      continue
    }
    facade.step()
    const evs = facade.drainEvents()
    for (let i = 0; i < evs.length; i += 1) {
      const e = evs[i]!
      if (e.type === 'BehaviorCommitted' && e.caster === casterId) {
        const resolved = evs.slice(i).find((x) => x.type === 'TargetsResolved')
        if (resolved && resolved.type === 'TargetsResolved') return [...resolved.targets]
      }
    }
  }
  return []
}

describe('流水线：mode/pickCount 决定实际命中', () => {
  it('area 卡一次落到区内全部在位敌', () => {
    const c = createCombat(buildAiVsAiSetup({ seed: 3, unitsPerSide: 3, skills: ['fix_cone'] }))
    expect(occ(firstTargets(c, 'A_u0'))).toEqual(['B_u0', 'B_u1', 'B_u2'])
  })

  it('unit + pickCount:all 取满候选池', () => {
    const c = createCombat(buildAiVsAiSetup({ seed: 3, unitsPerSide: 3, skills: ['fix_volley'] }))
    expect(occ(firstTargets(c, 'A_u0'))).toEqual(['B_u0', 'B_u1', 'B_u2'])
  })

  it('缺省普攻行为不变：只命中同路最前排 1 个', () => {
    const c = createCombat(buildAiVsAiSetup({ seed: 3, unitsPerSide: 3, skills: ['fix_strike'] }))
    expect(occ(firstTargets(c, 'A_u0'))).toEqual(['B_u0'])
  })
})
