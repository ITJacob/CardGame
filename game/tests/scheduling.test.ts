import { describe, expect, it } from 'vitest'
import { Gauge } from '../src/kernel/roster/resources'
import { resolveInitiative } from '../src/kernel/scheduling/initiative'
import type { ActionOpportunity } from '../src/kernel/scheduling/types'
import type { Coordinate } from '../src/kernel/battle/types'

describe('Gauge 严格越阈', () => {
  it('等于阈值不触发，越过才触发', () => {
    const g = new Gauge('action', 0, 10, 10)
    expect(g.advance().crossed).toBe(false) // 10 > 10 = false
    expect(g.advance().crossed).toBe(true) // 20 > 10 = true
  })

  it('settleOverflow 只留超出部分（keep）', () => {
    const g = new Gauge('action', 0, 30, 10)
    g.advance() // 30, 未越阈
    g.advance() // 60 > 10
    g.settleOverflow()
    expect(g.current).toBe(50)
  })
})

describe('先手合并 [己,敌,敌,己]', () => {
  it('己方/敌方各自按 (lane,index) 排序后交替', () => {
    const pos: Record<string, Coordinate> = {
      A0: { faction: 'A', lane: 'lane0', index: 0 },
      A1: { faction: 'A', lane: 'lane0', index: 1 },
      B0: { faction: 'B', lane: 'lane0', index: 0 },
      B1: { faction: 'B', lane: 'lane0', index: 1 },
    }
    const crossed = ['A1', 'A0', 'B1', 'B0'].map((unitId) => ({ unitId, gaugeKey: 'action' }))
    const opps: ActionOpportunity[] = resolveInitiative(
      crossed,
      ['A', 'B'],
      (id) => (id.startsWith('A') ? 'A' : 'B'),
      { positionOf: (id) => pos[id] ?? null },
      0,
      (unitId, tickIndex) => ({ unitId, tickIndex, consumedBy: null }),
    )
    // 己方序 A0,A1；敌方序 B0,B1；模式 己,敌,敌,己 → A0,B0,B1,A1
    expect(opps.map((o) => o.unitId)).toEqual(['A0', 'B0', 'B1', 'A1'])
  })

  it('一侧耗尽时顺延另一侧', () => {
    const pos: Record<string, Coordinate> = {
      A0: { faction: 'A', lane: 'lane0', index: 0 },
      B0: { faction: 'B', lane: 'lane0', index: 0 },
      B1: { faction: 'B', lane: 'lane0', index: 1 },
    }
    const crossed = ['A0', 'B0', 'B1'].map((unitId) => ({ unitId, gaugeKey: 'action' }))
    const opps = resolveInitiative(crossed, ['A', 'B'], (id) => (id.startsWith('A') ? 'A' : 'B'), {
      positionOf: (id) => pos[id] ?? null,
    }, 0, (unitId, tickIndex) => ({ unitId, tickIndex, consumedBy: null }))
    expect(opps.map((o) => o.unitId)).toEqual(['A0', 'B0', 'B1'])
  })
})
