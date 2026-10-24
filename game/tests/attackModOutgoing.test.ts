// attackMod（H24）与 outgoingDamageParams（H16）：攻击值实时修正、出伤参数门控与破甲。
import { describe, expect, it } from 'vitest'
import { createCombat } from '../src/kernel'
import { buildCatalog } from '../src/data/catalogBuild'
import type { PathwayFile } from '../src/data/schema.types'
import type { StatusDef, WeaponDef } from '../src/kernel/catalog/types'
import { makeUnit } from './helpers/fixture'

const WEAKEN: StatusDef = {
  id: 'weak', category: ['debuff'], dispelable: true, duration: null, maxStacks: 1,
  modifiers: { attackMod: -3 },
}
const SHRINK: StatusDef = {
  id: 'shrink', category: ['debuff'], dispelable: true, duration: null, maxStacks: 1,
  modifiers: { attackMod: 0.5 },
}
const GRAND: StatusDef = {
  id: 'grand', category: ['buff'], dispelable: false, duration: null, maxStacks: 1,
  modifiers: {
    attackMod: { value: 3, condition: { kind: 'has_equipped', side: 'self', slot: 'weapon' } },
    outgoingDamageParams: { filter: { weaponDamage: true }, armorPierceRatio: 0.5 },
  } as never,
}
const BLADE: WeaponDef = { id: 'probe_blade', slot: 'weapon', attack: 2, durability: 5 }

describe('attackMod：按持有状态实时参与攻击值', () => {
  it('平加值（负数）钳到 0', () => {
    const u = makeUnit('u', 'A', { strength: 2 }, [WEAKEN])
    expect(u.attackPower()).toBe(2)
    u.statuses.mount('weak', { sourceId: 't' })
    expect(u.attackPower()).toBe(0)
  })

  it('(0,1) 数值按乘区', () => {
    const u = makeUnit('u', 'A', { strength: 2 }, [SHRINK])
    u.statuses.mount('shrink', { sourceId: 't' })
    expect(u.attackPower()).toBe(1)
  })

  it('{value, condition}：has_equipped 每次求值，武器离槽即失效', () => {
    const u = makeUnit('u', 'A', { strength: 2 }, [GRAND])
    u.statuses.mount('grand', { sourceId: 't' })
    expect(u.attackPower()).toBe(2)
    u.equipWeapon(BLADE, 'w1')
    expect(u.attackPower()).toBe(7) // 2 + 武器 2 + 持械 3
    u.destroyWeapon()
    expect(u.attackPower()).toBe(2)
  })
})

describe('outgoingDamageParams：weaponDamage 门控', () => {
  it('武器在槽时生效，离槽后不生效', () => {
    const u = makeUnit('u', 'A', { strength: 2 }, [GRAND])
    u.statuses.mount('grand', { sourceId: 't' })
    // 无武器：引擎判定 weaponDamage=false，filter 拦下
    expect(u.outgoingDamageParams(false)).toBeNull()
    u.equipWeapon(BLADE, 'w1')
    const p = u.outgoingDamageParams(true)!
    expect(p.armorPierceRatio).toBe(0.5)
    expect(u.outgoingDamageParams(false)).toBeNull()
  })
})

// ---------- 端到端：武器大师持械普攻无视一半护甲 ----------

const CARD_START = {
  id: 'probe_start', name: '开局佩刃', kind: 'passive' as const, sequence: 9, sequenceName: 's9',
  rarity: 'common' as const, axis: 'a', flagship: false, lore: '', flavor: '', describe: '', tentative: false,
  cost: { energy: 0, cooldown: 100, castTime: null }, hook: ['on_battle_start'], effects: [],
  initialEquip: 'probe_blade',
  statusDefs: [
    GRAND,
    {
      id: 'probe_plate', name: '护甲', category: ['buff'], dispelable: false, duration: null, maxStacks: 1,
      triggers: [{
        event: 'on_apply',
        effects: [{ type: 'modify_resource', resource: 'armor', value: 10, mode: 'delta', target: 'self' }],
      }],
    },
  ],
}

function pathway(): PathwayFile {
  return {
    pathwayId: 'warrior', pathwayName: '战士', sourceFile: 'probe', sourceVersion: 'test',
    cards: [
      CARD_START,
      {
        id: 'probe_blade', name: '试刃', kind: 'weapon' as const, sequence: 9, sequenceName: 's9',
        rarity: 'common' as const, axis: 'a', flagship: false, lore: '', flavor: '', describe: '', tentative: false,
        cost: { energy: 0, cooldown: 100, castTime: null }, effects: [],
        weapon: { slot: 'weapon', attack: 2, durability: 5 },
      },
    ],
  } as never
}

function setup(opts: { grand: boolean }) {
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
          activeSlots: [], passiveSlots: [{ defId: 'probe_start' }],
          initialStatuses: opts.grand ? [{ defId: 'grand' }] : [],
        }],
      },
      {
        id: 'B' as const, name: '乙',
        units: [{
          unitId: 'B_u0', pathwayId: 'warrior', coordinate: { faction: 'B' as const, lane: 'lane0' as const, index: 0 },
          attributeSet: { strength: 10, agility: 1, intelligence: 1, rank: 0 },
          gender: 'male' as const, anchor: 0,
          activeSlots: [], passiveSlots: [], initialStatuses: [{ defId: 'probe_plate' }],
        }],
      },
    ],
    inputs: { decisions: new Map() },
  } as never
}

function firstHitHpLoss(grand: boolean): number {
  const c = createCombat(setup({ grand }))
  c.step() // A 敏捷 30，首 tick 即出手
  const b = c.state().units.find((u) => u.id === 'B_u0')!
  return b.hpMax - b.hp
}

describe('出伤参数进入伤害链', () => {
  it('无武器大师：普攻被护甲全额吸收', () => {
    expect(firstHitHpLoss(false)).toBe(0)
  })

  it('武器大师持械：护甲减半后仍有伤害落到生命', () => {
    expect(firstHitHpLoss(true)).toBeGreaterThan(0)
  })
})
