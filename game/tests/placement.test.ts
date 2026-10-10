import { describe, expect, it } from 'vitest'
import { BattlePlacement } from '../src/kernel/battle/placement'
import type { Battle, Faction } from '../src/kernel/battle/types'

function makeBattle(): Battle {
  const lanes = ['lane0', 'lane1']
  const factions: Faction[] = ['A', 'B'].map((id) => ({
    id,
    lanes: new Map(lanes.map((l) => [l, { id: l, slots: Array.from({ length: 4 }, () => ({ occupant: null })) }])),
  }))
  return { factions, zones: [], domains: [], clock: 0, luminance: 0, phase: 'day', lumOverride: null, meters: {} }
}

function makePlacement() {
  const battle = makeBattle()
  const positions = new Map<string, unknown>()
  const p = new BattlePlacement(battle, {
    unitIds: () => ['u1', 'u2', 'u3'],
    setPosition: (id, coord) => positions.set(id, coord),
    onChange: () => {},
  })
  const lane = (f: string, l: string) => battle.factions.find((x) => x.id === f)!.lanes.get(l)!
  return { battle, p, lane }
}

describe('Placement', () => {
  it('insert 后坍缩为前缀无空洞', () => {
    const { p, lane } = makePlacement()
    expect(p.insert('u1', { faction: 'A', lane: 'lane0', index: 2 }).ok).toBe(true)
    // 落 index2 后坍缩 → 挤到 index0
    expect(lane('A', 'lane0').slots[0]!.occupant).toBe('u1')
    expect(lane('A', 'lane0').slots[2]!.occupant).toBeNull()
  })

  it('remove 后前缀保持紧凑', () => {
    const { p, lane } = makePlacement()
    p.insert('u1', { faction: 'A', lane: 'lane0', index: 0 })
    p.insert('u2', { faction: 'A', lane: 'lane0', index: 1 })
    p.remove('u1')
    expect(lane('A', 'lane0').slots[0]!.occupant).toBe('u2')
    expect(lane('A', 'lane0').slots[1]!.occupant).toBeNull()
  })

  it('relocate 禁跨中线', () => {
    const { p } = makePlacement()
    p.insert('u1', { faction: 'A', lane: 'lane0', index: 0 })
    const r = p.relocate('u1', { faction: 'B', lane: 'lane0', index: 0 })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toContain('跨')
  })

  it('relocate 同路为 no-op', () => {
    const { p, lane } = makePlacement()
    p.insert('u1', { faction: 'A', lane: 'lane0', index: 0 })
    const r = p.relocate('u1', { faction: 'A', lane: 'lane0', index: 3 })
    expect(r.ok).toBe(true)
    expect(lane('A', 'lane0').slots[0]!.occupant).toBe('u1')
  })

  it('重复 insert 同一单位被拒', () => {
    const { p } = makePlacement()
    p.insert('u1', { faction: 'A', lane: 'lane0', index: 0 })
    const r = p.insert('u1', { faction: 'A', lane: 'lane1', index: 0 })
    expect(r.ok).toBe(false)
  })
})
