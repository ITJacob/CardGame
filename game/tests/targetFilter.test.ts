// 选靶 request.filter：unitType / hasStatus / 召唤归属 / unitId / 位格 / anyOf。
import { describe, expect, it } from 'vitest'
import { resolveCandidates, type TargetContext } from '../src/kernel/execution/target'
import type { StatusDef } from '../src/kernel/catalog/types'
import { makeUnit } from './helpers/fixture'
import { registryOf } from './helpers/context'

const MARKED: StatusDef = { id: 'marked', category: ['debuff'], dispelable: true, duration: 10 }
const PUPPET: StatusDef = { id: 'puppet_string', category: ['control'], dispelable: true, duration: 10, maxStacks: 3 }

function ctxWith(units: ReturnType<typeof makeUnit>[], self: ReturnType<typeof makeUnit>): TargetContext {
  return {
    units: registryOf(self, ...units),
    self,
    enemyFaction: self.faction === 'A' ? 'B' : 'A',
    lanes: ['lane0'],
    laneCapacity: 4,
    unsupported: () => {},
  }
}

function enemy(id: string, index: number) {
  const u = makeUnit(id, 'B', {}, [MARKED, PUPPET])
  u.position = { faction: 'B', lane: 'lane0', index }
  return u
}

function selfUnit() {
  const s = makeUnit('self', 'A')
  s.position = { faction: 'A', lane: 'lane0', index: 0 }
  return s
}

const ids = (list: { occupant?: string | null }[]) => list.map((t) => t.occupant)

describe('选靶 filter', () => {
  it('unitType 过滤', () => {
    const a = enemy('e0', 0); a.unitType = 'UNDEAD'
    const b = enemy('e1', 1); b.unitType = 'BEAST'
    const self = selfUnit()
    const out = resolveCandidates({ faction: 'enemy', filter: { unitType: ['UNDEAD'] }, pickCount: 'all', scope: 'board' }, ctxWith([a, b], self))
    expect(ids(out)).toEqual(['e0'])
  })

  it('hasStatus 过滤（字符串与对象两写法）', () => {
    const a = enemy('e0', 0)
    const b = enemy('e1', 1)
    a.statuses.mount('marked', { sourceId: 's1' })
    a.statuses.byDef('marked')[0]!.currentStacks = 2
    const self = selfUnit()
    const ctx = ctxWith([a, b], self)
    expect(ids(resolveCandidates({ faction: 'enemy', filter: { hasStatus: 'marked' }, pickCount: 'all', scope: 'board' }, ctx))).toEqual(['e0'])
    expect(ids(resolveCandidates({ faction: 'enemy', filter: { hasStatus: { id: 'marked', stacksAtLeast: 2 } }, pickCount: 'all', scope: 'board' }, ctx))).toEqual(['e0'])
    expect(ids(resolveCandidates({ faction: 'enemy', filter: { hasStatus: { id: 'marked', stacksAtLeast: 3 } }, pickCount: 'all', scope: 'board' }, ctx))).toEqual([])
  })

  it('isSummon / casterOwned / unitId', () => {
    const a = enemy('e0', 0); a.summonerId = 'self'; a.unitDefId = 'unit_snare_trap'
    const b = enemy('e1', 1)
    const self = selfUnit()
    const ctx = ctxWith([a, b], self)
    expect(ids(resolveCandidates({ faction: 'enemy', filter: { isSummon: true }, pickCount: 'all', scope: 'board' }, ctx))).toEqual(['e0'])
    expect(ids(resolveCandidates({ faction: 'enemy', filter: { casterOwned: true }, pickCount: 'all', scope: 'board' }, ctx))).toEqual(['e0'])
    expect(ids(resolveCandidates({ faction: 'enemy', filter: { unitId: 'unit_snare_trap' }, pickCount: 'all', scope: 'board' }, ctx))).toEqual(['e0'])
    expect(ids(resolveCandidates({ faction: 'enemy', filter: { unitId: 'unit_other' }, pickCount: 'all', scope: 'board' }, ctx))).toEqual([])
  })

  it('isPuppet 按提线木偶状态过滤', () => {
    const a = enemy('e0', 0)
    const b = enemy('e1', 1)
    b.statuses.mount('puppet_string', { sourceId: 's1' })
    const ctx = ctxWith([a, b], selfUnit())
    expect(ids(resolveCandidates({ faction: 'enemy', filter: { isPuppet: true }, pickCount: 'all', scope: 'board' }, ctx))).toEqual(['e1'])
  })

  it('位格过滤（rankAboveCaster / rankMax）', () => {
    const a = enemy('e0', 0); a.provenance.apply('rank', 3, 'test')
    const b = enemy('e1', 1); b.provenance.apply('rank', 1, 'test')
    const self = selfUnit(); self.provenance.apply('rank', 1, 'test')
    const ctx = ctxWith([a, b], self)
    expect(ids(resolveCandidates({ faction: 'enemy', filter: { rankAboveCaster: true }, pickCount: 'all', scope: 'board' }, ctx))).toEqual(['e0'])
    expect(ids(resolveCandidates({ faction: 'enemy', filter: { rankMax: 1 }, pickCount: 'all', scope: 'board' }, ctx))).toEqual(['e1'])
  })

  it('override first_empty：下一次攻击打空', () => {
    const a = enemy('e0', 0)
    const self = selfUnit()
    self.pendingTargetOverride = { anchor: 'first_empty' }
    const out = resolveCandidates({ faction: 'enemy', pickCount: 'all', scope: 'board' }, ctxWith([a], self))
    expect(out).toEqual([])
  })

  it('override nearest_any：选不分阵营的最近单位', () => {
    const enemyFar = enemy('e0', 3)
    const allyNear = makeUnit('ally1', 'A')
    allyNear.position = { faction: 'A', lane: 'lane0', index: 1 }
    const self = selfUnit()
    self.pendingTargetOverride = { anchor: 'nearest_any' }
    const out = resolveCandidates({ faction: 'enemy', pickCount: 1, scope: 'board' }, ctxWith([enemyFar, allyNear], self))
    expect(out[0]?.occupant).toBe('ally1')
  })

  it('override any_lowest_hp：生命百分比最低者优先（不分阵营）', () => {
    const healthy = enemy('e0', 0)
    const hurt = makeUnit('ally1', 'A')
    hurt.position = { faction: 'A', lane: 'lane0', index: 1 }
    hurt.pool('hp').applyDelta(-(hurt.hpMax - 1))
    const self = selfUnit()
    self.pendingTargetOverride = { anchor: 'any_lowest_hp' }
    const out = resolveCandidates({ faction: 'enemy', pickCount: 'all', scope: 'board' }, ctxWith([healthy, hurt], self))
    expect(out[0]?.occupant).toBe('ally1')
  })

  it('override anchor:unit + unitId:self：改指自身', () => {
    const a = enemy('e0', 0)
    const self = selfUnit()
    self.pendingTargetOverride = { anchor: 'unit', unitId: 'self' }
    const out = resolveCandidates({ faction: 'enemy', pickCount: 1, scope: 'board' }, ctxWith([a], self))
    expect(ids(out)).toEqual(['self'])
  })

  it('具名 anchor 按 unitDef 蓝本寻址（unit_doppelganger）', () => {
    const clone = enemy('e0', 2)
    clone.unitDefId = 'unit_doppelganger'
    const self = selfUnit()
    self.pendingTargetOverride = { anchor: 'unit_doppelganger', faction: 'enemy' }
    const out = resolveCandidates({ faction: 'enemy', pickCount: 1, scope: 'board' }, ctxWith([clone], self))
    expect(ids(out)).toEqual(['e0'])
  })

  it('anyOf 组合', () => {
    const a = enemy('e0', 0); a.unitType = 'UNDEAD'
    const b = enemy('e1', 1); b.unitType = 'BEAST'
    const c = enemy('e2', 2); c.unitType = 'HUMAN'
    const out = resolveCandidates({
      faction: 'enemy',
      filter: { anyOf: [{ unitType: 'UNDEAD' }, { unitType: 'BEAST' }] },
      pickCount: 'all', scope: 'board',
    }, ctxWith([a, b, c], selfUnit()))
    expect(ids(out)).toEqual(['e0', 'e1'])
  })
})
