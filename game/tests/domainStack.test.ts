// 界域压制栈：active = base/hero + 栈顶 overlay；被压制 overlay 不 fire、不计时。
import { describe, expect, it } from 'vitest'
import { createCombat } from '../src/kernel'
import { buildCatalog } from '../src/data/catalogBuild'
import type { PathwayFile } from '../src/data/schema.types'
import type { CombatFacade, DomainEvent } from '../src/kernel/combat/types'

function passive(id: string, effects: unknown[]): Record<string, unknown> {
  return {
    id, name: id, kind: 'passive', sequence: 9, sequenceName: 's9', rarity: 'common', axis: 'a',
    flagship: false, lore: '', flavor: '', describe: '', tentative: false,
    hook: ['on_battle_start'], effects,
  }
}

function domainDef(id: string, tier: 'overlay' | 'hero', duration: number, damage: number): Record<string, unknown> {
  return {
    id, tier, dispelable: true, duration, durationUnit: 'tick',
    triggers: [{ event: 'on_tick', effects: [{ type: 'damage', element: 'fire', value: damage, target: 'all_enemies' }] }],
  }
}

function setup(path: PathwayFile) {
  return {
    seed: 7,
    catalog: buildCatalog([path]).catalog,
    board: { clock: { base: 0 }, domainGrants: [] },
    factions: [
      {
        id: 'A' as const, name: '甲',
        units: [{
          unitId: 'A_u0', pathwayId: 'warrior', coordinate: { faction: 'A' as const, lane: 'lane0' as const, index: 0 },
          attributeSet: { strength: 0, agility: 0, intelligence: 0, rank: 0 },
          gender: 'male' as const, anchor: 0,
          activeSlots: [], passiveSlots: [{ defId: 'stack_start' }], initialStatuses: [],
        }],
      },
      {
        id: 'B' as const, name: '乙',
        units: [{
          unitId: 'B_u0', pathwayId: 'warrior', coordinate: { faction: 'B' as const, lane: 'lane0' as const, index: 0 },
          attributeSet: { strength: 20, agility: 0, intelligence: 0, rank: 0 },
          gender: 'male' as const, anchor: 0,
          activeSlots: [], passiveSlots: [], initialStatuses: [],
        }],
      },
    ],
    inputs: { decisions: new Map() },
  } as never
}

function hpOf(c: CombatFacade, id: string): number {
  return c.state().units.find((u) => u.id === id)!.hp
}

function reader(c: CombatFacade): () => DomainEvent[] {
  let cursor = 0
  return () => {
    const all = c.drainEvents()
    const out = all.slice(cursor)
    cursor = all.length
    return [...out]
  }
}

const PATH_STACK = {
  pathwayId: 'warrior', pathwayName: '战士', sourceFile: 'probe', sourceVersion: 'test',
  cards: [passive('stack_start', [
    { type: 'domain', op: 'overlay', def: 'dom_a' },
    { type: 'domain', op: 'overlay', def: 'dom_b' },
  ])],
  domainDefs: [domainDef('dom_a', 'overlay', 5, 1), domainDef('dom_b', 'overlay', 2, 10)],
} as never

describe('界域压制栈', () => {
  it('后放压顶：被压制 overlay 不 fire、duration 暂停；栈顶到期后恢复', () => {
    const c = createCombat(setup(PATH_STACK))
    const next = reader(c)
    const step = (): DomainEvent[] => { c.step(); return next() }
    const initial = next()
    expect(initial.some((e) => e.type === 'DomainCovered' && e.defId === 'dom_a')).toBe(true)

    step()
    expect(hpOf(c, 'B_u0')).toBe(220)

    const second = step()
    expect(second.some((e) => e.type === 'DomainExpired' && e.defId === 'dom_b')).toBe(true)
    expect(second.some((e) => e.type === 'DomainExpired' && e.defId === 'dom_a')).toBe(false)
    expect(hpOf(c, 'B_u0')).toBe(219)

    for (let i = 0; i < 4; i += 1) {
      const ev = step()
      expect(ev.some((e) => e.type === 'DomainExpired' && e.defId === 'dom_a')).toBe(false)
    }
    const last = step()
    expect(last.some((e) => e.type === 'DomainExpired' && e.defId === 'dom_a')).toBe(true)
  })

  it('dispel 只移除 active overlay，被压制层随即恢复', () => {
    const path = {
      ...(PATH_STACK as { cards: unknown[]; domainDefs: unknown[] }),
      cards: [passive('stack_start', [
        { type: 'domain', op: 'overlay', def: 'dom_a' },
        { type: 'domain', op: 'overlay', def: 'dom_b' },
        { type: 'dispel', dispelTarget: 'domain', filter: { tier: 'overlay' }, count: 1 },
      ])],
    } as never
    const c = createCombat(setup(path))
    const next = reader(c)
    const initial = next()
    expect(initial.some((e) => e.type === 'DomainExpired' && e.defId === 'dom_b')).toBe(true)
    expect(initial.some((e) => e.type === 'DomainExpired' && e.defId === 'dom_a')).toBe(false)

    c.step()
    const first = next()
    expect(first.some((e) => e.type === 'DomainExpired')).toBe(false)
    expect(hpOf(c, 'B_u0')).toBe(229)
  })

  it('swap：新域成为 base，原 base 降为 overlay 后仍参与结算', () => {
    const path = {
      pathwayId: 'warrior', pathwayName: '战士', sourceFile: 'probe', sourceVersion: 'test',
      cards: [passive('stack_start', [
        { type: 'domain', op: 'swap', def: 'dom_1' },
        { type: 'domain', op: 'swap', def: 'dom_2' },
      ])],
      domainDefs: [domainDef('dom_1', 'overlay', 5, 1), domainDef('dom_2', 'overlay', 5, 10)],
    } as never
    const c = createCombat(setup(path))
    const next = reader(c)
    const initial = next()
    expect(initial.some((e) => e.type === 'DomainPlaced' && e.defId === 'dom_1' && e.tier === 'base')).toBe(true)
    expect(initial.some((e) => e.type === 'DomainPlaced' && e.defId === 'dom_2' && e.tier === 'base')).toBe(true)
    c.step()
    next()
    expect(hpOf(c, 'B_u0')).toBe(219)
  })

  it('hero 不参与压制：与 overlay 同时结算', () => {
    const path = {
      pathwayId: 'warrior', pathwayName: '战士', sourceFile: 'probe', sourceVersion: 'test',
      cards: [passive('stack_start', [
        { type: 'domain', op: 'hero', def: 'dom_hero' },
        { type: 'domain', op: 'overlay', def: 'dom_b' },
      ])],
      domainDefs: [domainDef('dom_hero', 'hero', -1, 1), domainDef('dom_b', 'overlay', 2, 10)],
    } as never
    const c = createCombat(setup(path))
    const next = reader(c)
    const step = (): DomainEvent[] => { c.step(); return next() }
    next()
    step()
    expect(hpOf(c, 'B_u0')).toBe(219)
    const second = step()
    expect(second.some((e) => e.type === 'DomainExpired' && e.defId === 'dom_b')).toBe(true)
    expect(hpOf(c, 'B_u0')).toBe(218)
  })
})
