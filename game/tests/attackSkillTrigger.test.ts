// 攻击类主动技能同时 fire on_attack；非攻击主动技能不 fire。
import { describe, expect, it } from 'vitest'
import { createCombat } from '../src/kernel'
import { buildCatalog } from '../src/data/catalogBuild'
import type { PathwayFile } from '../src/data/schema.types'
import type { CombatFacade } from '../src/kernel/combat/types'

const BASE = {
  kind: 'active' as const, sequence: 9, sequenceName: 's9', rarity: 'common' as const,
  axis: 'a', flagship: false, lore: '', flavor: '', describe: '', tentative: false,
  cost: { energy: 0, cooldown: 100, castTime: null }, reach: 'spell' as const,
  target: { selectionMode: 'auto' as const, request: { faction: 'enemy' as const, anchor: 'enemy_front', sort: 'index_asc' as const, pickCount: 1 } },
}

function pathway(): PathwayFile {
  return {
    pathwayId: 'warrior', pathwayName: '战士', sourceFile: 'probe', sourceVersion: 'test',
    cards: [
      { ...BASE, id: 'probe_slash', name: '斩击', effects: [{ type: 'damage', element: 'physical', value: 1, target: 'target' }] },
      {
        ...BASE, id: 'probe_ward', name: '守御',
        target: { selectionMode: 'auto' as const, request: { faction: 'self' as const, anchor: 'caster', pickCount: 1 } },
        effects: [{ type: 'mount_status', statusId: 'probe_guard', duration: 10, target: 'self' }],
      },
      {
        id: 'probe_blade', name: '试刃', kind: 'weapon' as const, sequence: 9, sequenceName: 's9',
        rarity: 'common' as const, axis: 'a', flagship: false, lore: '', flavor: '', describe: '', tentative: false,
        cost: { energy: 0, cooldown: 100, castTime: null }, effects: [],
        weapon: {
          slot: 'weapon', attack: 0, durability: 5,
          triggers: [{ event: 'on_attack', effects: [{ type: 'mount_status', statusId: 'probe_on_attack', duration: 10, target: 'self' }] }],
        },
      },
      {
        ...BASE, id: 'probe_start', name: '开局佩刃', kind: 'passive' as const,
        hook: ['on_battle_start'], effects: [], initialEquip: 'probe_blade',
      },
    ],
    statusDefs: [],
  } as never
}

function setup(skillId: string) {
  return {
    seed: 7,
    catalog: buildCatalog([pathway()]).catalog,
    board: { clock: { base: 0 }, domainGrants: [] },
    factions: [
      {
        id: 'A' as const, name: '甲',
        units: [{
          unitId: 'A_u0', pathwayId: 'warrior', coordinate: { faction: 'A' as const, lane: 'lane0' as const, index: 0 },
          attributeSet: { strength: 2, agility: 30, intelligence: 1, rank: 0 },
          gender: 'male' as const, anchor: 0,
          activeSlots: [{ skillDefId: skillId }], passiveSlots: [{ defId: 'probe_start' }], initialStatuses: [],
        }],
      },
      {
        id: 'B' as const, name: '乙',
        units: [{
          unitId: 'B_u0', pathwayId: 'warrior', coordinate: { faction: 'B' as const, lane: 'lane0' as const, index: 0 },
          attributeSet: { strength: 2, agility: 1, intelligence: 1, rank: 0 },
          gender: 'male' as const, anchor: 0,
          activeSlots: [], passiveSlots: [], initialStatuses: [],
        }],
      },
    ],
    inputs: { decisions: new Map() },
  } as never
}

function hasTriggered(c: CombatFacade): boolean {
  const a = c.state().units.find((u) => u.id === 'A_u0')!
  return a.statuses.some((s) => s.defId === 'probe_on_attack')
}

describe('攻击类主动技能 fire on_attack', () => {
  it('带伤害的主动技触发武器 on_attack 触发器', () => {
    const c = createCombat(setup('probe_slash'))
    c.step()
    expect(hasTriggered(c)).toBe(true)
  })

  it('无伤害的主动技不触发 on_attack', () => {
    const c = createCombat(setup('probe_ward'))
    c.step()
    expect(hasTriggered(c)).toBe(false)
  })
})
