// spawn 消费 unitDef：基线 hp/atk、hpRatio/atkRatio、element 进普攻、triggers 装配。
import { describe, expect, it } from 'vitest'
import { createCombat } from '../src/kernel'
import { buildCatalog } from '../src/data/catalogBuild'
import type { PathwayFile } from '../src/data/schema.types'
import type { CombatFacade } from '../src/kernel/combat/types'

const CARD = {
  id: 'probe_call', name: '召兽', kind: 'active' as const, sequence: 9, sequenceName: 's9',
  rarity: 'common' as const, axis: 'a', flagship: false, lore: '', flavor: '', describe: '', tentative: false,
  cost: { energy: 0, cooldown: 100, castTime: null },
  reach: 'none' as const,
  target: { selectionMode: 'auto' as const, request: { mode: 'unit' as const, faction: 'self' as const, anchor: 'caster', pickCount: 1 } },
  effects: [],
}

function pathway(opts: { element?: string; hpRatio?: number; atkRatio?: number }): PathwayFile {
  const spawn: Record<string, unknown> = { type: 'spawn', unitId: 'probe_beast', position: 'tail' }
  if (opts.hpRatio !== undefined) spawn.hpRatio = opts.hpRatio
  if (opts.atkRatio !== undefined) spawn.atkRatio = opts.atkRatio
  return {
    pathwayId: 'warrior', pathwayName: '战士', sourceFile: 'probe', sourceVersion: 'test',
    cards: [{ ...CARD, effects: [spawn] } as never],
    unitDefs: [{
      id: 'probe_beast', name: '试验兽', unitType: 'BEAST', base: { hp: 20, atk: 4 },
      ...(opts.element ? { element: opts.element } : {}),
      triggers: [
        {
          event: 'on_attack',
          effects: [{ type: 'mount_status', statusId: 'probe_mark', duration: 10, target: 'self' }],
        },
        {
          event: 'on_spawn',
          effects: [{ type: 'mount_status', statusId: 'probe_spawned', duration: 10, target: 'self' }],
        },
      ],
    }],
  } as never
}

function setup(opts: { element?: string; hpRatio?: number; atkRatio?: number; resistDark?: number }) {
  return {
    seed: 7,
    catalog: buildCatalog([pathway(opts)]).catalog,
    board: { clock: { base: 0 }, domainGrants: [] },
    factions: [
      {
        id: 'A' as const, name: '甲',
        units: [{
          unitId: 'A_u0', pathwayId: 'warrior', coordinate: { faction: 'A' as const, lane: 'lane0' as const, index: 0 },
          attributeSet: { strength: 2, agility: 20, intelligence: 1, rank: 0 },
          gender: 'male' as const, anchor: 0,
          activeSlots: [{ skillDefId: 'probe_call' }], passiveSlots: [], initialStatuses: [],
        }],
      },
      {
        id: 'B' as const, name: '乙',
        units: [{
          unitId: 'B_u0', pathwayId: 'warrior', coordinate: { faction: 'B' as const, lane: 'lane0' as const, index: 0 },
          attributeSet: { strength: 2, agility: 1, intelligence: 1, rank: 0 },
          gender: 'male' as const, anchor: 0,
          activeSlots: [], passiveSlots: [], initialStatuses: [],
          initialModifiers: opts.resistDark ? [{ stat: 'resist:dark', value: opts.resistDark }] : [],
        }],
      },
    ],
    inputs: { decisions: new Map() },
  } as never
}

function summonOf(c: CombatFacade) {
  return c.state().units.find((u) => u.summonerId === 'A_u0')
}

describe('spawn 消费 unitDef', () => {
  it('基线 hp/atk 与 hpRatio/atkRatio', () => {
    const c = createCombat(setup({ hpRatio: 0.5, atkRatio: 0.5 }))
    for (let i = 0; i < 3 && !c.ended(); i += 1) c.step()
    const s = summonOf(c)!
    expect(s.hpMax).toBe(10) // 20 × 0.5
    expect(s.unitType).toBe('BEAST')
  })

  it('unitDef.element 进入普攻结算（暗抗削减暗系普攻）', () => {
    const run = (element?: string) => {
      const c = createCombat(setup({ element, resistDark: 40 }))
      for (let i = 0; i < 14 && !c.ended(); i += 1) c.step()
      return c.state().units.find((u) => u.id === 'B_u0')!.hp
    }
    const dark = run('dark')
    const none = run(undefined)
    expect(dark).toBeGreaterThan(none)
  })

  it('unitDef 的 on_spawn 由召唤物自身 fire（宿主 = 新生单位）', () => {
    const c = createCombat(setup({}))
    for (let i = 0; i < 3 && !c.ended(); i += 1) c.step()
    const s = summonOf(c)!
    expect(s.statuses.some((x) => x.defId === 'probe_spawned')).toBe(true)
  })

  it('unitDef.triggers 在 spawn 时装配（on_attack 自挂状态）', () => {
    const c = createCombat(setup({}))
    let marked = false
    for (let i = 0; i < 20 && !c.ended(); i += 1) {
      c.step()
      const s = summonOf(c)
      if (s?.statuses.some((x) => x.defId === 'probe_mark')) { marked = true; break }
    }
    expect(marked).toBe(true)
  })
})
