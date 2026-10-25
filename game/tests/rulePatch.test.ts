// DomainDef.rulePatches：压制栈下只读 active 界域；四个 kind + tagNot/singleTarget/shield。
import { describe, expect, it } from 'vitest'
import { createCombat } from '../src/kernel'
import { BASIC_ATTACK_ID } from '../src/kernel/combat/basicAttack'
import { activeDomains } from '../src/kernel/battle/domain'
import type { DomainInstance } from '../src/kernel/battle/types'
import type { RulePatch } from '../src/kernel/catalog/types'
import {
  domainCostDelta, domainEffectBlocked, domainEmpowerMul, domainShieldBlocked, type RuleProfile,
} from '../src/kernel/combat/domainRules'
import { buildCatalog } from '../src/data/catalogBuild'
import type { PathwayFile } from '../src/data/schema.types'
import type { CombatFacade } from '../src/kernel/combat/types'

function dom(
  id: string,
  tier: 'base' | 'hero' | 'overlay',
  priority: number,
  patches: RulePatch[],
  owner = 'A',
): DomainInstance {
  return {
    def: { id, pathwayId: 'warrior', tier, dispelable: true, duration: 10, rulePatches: patches } as never,
    tier,
    grant: { duration: 10, priority, sourceId: id, ownerFaction: owner },
  }
}

const PROFILE: RuleProfile = { tags: [], singleTarget: false, effectTypes: ['damage'] }

describe('RulePatch 纯函数', () => {
  it('active 集合：base + hero + 栈顶 overlay，被压制 overlay 剔除', () => {
    const domains = [
      dom('base', 'base', 1, []),
      dom('hero', 'hero', 2, []),
      dom('low', 'overlay', 3, []),
      dom('top', 'overlay', 4, []),
    ]
    expect(activeDomains(domains).map((d) => d.def.id)).toEqual(['base', 'hero', 'top'])
  })

  it('empower：tag any-of / side / 不同 key 相乘', () => {
    const domains = [dom('d', 'overlay', 1, [
      { kind: 'empower', side: 'ally', tag: ['镜像', '替身'], mul: 2 },
      { kind: 'empower', side: 'ally', tag: ['光'], mul: 1.5 },
    ])]
    expect(domainEmpowerMul(domains, { faction: 'A', tags: ['镜像'], singleTarget: true }, 'damage')).toBe(2)
    expect(domainEmpowerMul(domains, { faction: 'A', tags: ['替身', '光'], singleTarget: true }, 'damage')).toBe(3)
    expect(domainEmpowerMul(domains, { faction: 'B', tags: ['镜像'], singleTarget: true }, 'damage')).toBe(1)
  })

  it('tagNot + singleTarget：反选与单体过滤同时生效', () => {
    const domains = [dom('d', 'overlay', 1, [
      { kind: 'empower', side: 'ally', tagNot: ['镜像', '替身'], singleTarget: true, mul: 0.9 },
    ])]
    expect(domainEmpowerMul(domains, { faction: 'A', tags: [], singleTarget: true }, 'damage')).toBe(0.9)
    expect(domainEmpowerMul(domains, { faction: 'A', tags: ['镜像'], singleTarget: true }, 'damage')).toBe(1)
    expect(domainEmpowerMul(domains, { faction: 'A', tags: [], singleTarget: false }, 'damage')).toBe(1)
  })

  it('同对象冲突按 hero > overlay > base；被压制层不参与', () => {
    const patch: RulePatch = { kind: 'empower', side: 'ally', stat: 'damage', mul: 1.5 }
    const hero: RulePatch = { ...patch, mul: 1.2 }
    expect(domainEmpowerMul([
      dom('base', 'base', 1, [{ ...patch, mul: 1.1 }]),
      dom('overlay', 'overlay', 2, [patch]),
      dom('hero', 'hero', 3, [hero]),
    ], { faction: 'A', tags: [], singleTarget: true }, 'damage')).toBe(1.2)

    expect(domainEmpowerMul([
      dom('low', 'overlay', 1, [{ ...patch, mul: 2 }]),
      dom('top', 'overlay', 2, []),
    ], { faction: 'A', tags: [], singleTarget: true }, 'damage')).toBe(1)
  })

  it('cost_mod：不同过滤面相加，同对象取高层籍', () => {
    const domains = [dom('d', 'overlay', 1, [
      { kind: 'cost_mod', delta: 1 },
      { kind: 'cost_mod', tag: ['法术'], delta: 2 },
    ])]
    expect(domainCostDelta(domains, PROFILE)).toBe(1)
    expect(domainCostDelta(domains, { ...PROFILE, tags: ['法术'] })).toBe(3)

    expect(domainCostDelta([
      dom('overlay', 'overlay', 1, [{ kind: 'cost_mod', delta: 2 }]),
      dom('hero', 'hero', 2, [{ kind: 'cost_mod', delta: 1 }]),
    ], PROFILE)).toBe(1)
  })

  it('seal / disable / shield 判定', () => {
    const domains = [dom('d', 'overlay', 1, [
      { kind: 'seal_effect', effectType: 'translocate' },
      { kind: 'disable_effect', side: 'enemy', tag: ['光'] },
      { kind: 'disable_effect', side: 'both', effectType: 'shield' },
    ])]
    expect(domainEffectBlocked(domains, { faction: 'A', tags: [], singleTarget: false, effectType: 'translocate' })).toBe(true)
    expect(domainEffectBlocked(domains, { faction: 'B', tags: ['光'], singleTarget: false, effectType: 'damage' })).toBe(true)
    expect(domainEffectBlocked(domains, { faction: 'A', tags: ['光'], singleTarget: false, effectType: 'damage' })).toBe(false)
    expect(domainShieldBlocked(domains, 'A')).toBe(true)
  })
})

// ---------- 集成 ----------

const BASE_CARD = {
  sequence: 9, sequenceName: 's9', rarity: 'common', axis: 'a', flagship: false,
  lore: '', flavor: '', describe: '', tentative: false, reach: 'melee',
}

function passive(id: string, effects: unknown[]): Record<string, unknown> {
  return { ...BASE_CARD, id, name: id, kind: 'passive', hook: ['on_battle_start'], effects }
}

function active(
  id: string,
  tags: string[],
  faction: 'enemy' | 'self',
  effects: unknown[],
  energy = 0,
): Record<string, unknown> {
  return {
    ...BASE_CARD, id, name: id, kind: 'active', tags, cost: { energy, cooldown: 0, castTime: null },
    target: {
      selectionMode: 'auto',
      request: {
        mode: 'unit', faction, anchor: faction === 'self' ? 'caster' : 'enemy_front',
        scope: faction === 'self' ? 'point' : 'whole_lane', sort: 'index_asc', pickCount: 1,
      },
    },
    effects,
  }
}

function domDef(id: string, patches: RulePatch[], tier: 'overlay' | 'hero' = 'overlay'): Record<string, unknown> {
  return { id, tier, dispelable: true, duration: 30, durationUnit: 'tick', triggers: [], rulePatches: patches }
}

function path(domainDefs: unknown[], cards: unknown[]): PathwayFile {
  return {
    pathwayId: 'warrior', pathwayName: '战士', sourceFile: 'probe', sourceVersion: 'test',
    cards, domainDefs,
  } as never
}

function setup(p: PathwayFile, opts: {
  aSkills?: string[]; bSkills?: string[]; aPools?: Record<string, number>; bPools?: Record<string, number>
  aGauge?: number; bGauge?: number
} = {}) {
  return {
    seed: 7,
    catalog: buildCatalog([p]).catalog,
    board: { clock: { base: 0 }, domainGrants: [] },
    factions: [
      {
        id: 'A' as const, name: '甲',
        units: [{
          unitId: 'A_u0', pathwayId: 'warrior', coordinate: { faction: 'A' as const, lane: 'lane0' as const, index: 0 },
          attributeSet: { strength: 1, agility: 0, intelligence: 0, rank: 0 },
          gender: 'male' as const, anchor: 0,
          activeSlots: (opts.aSkills ?? []).map((skillDefId) => ({ skillDefId })),
          passiveSlots: [{ defId: 'stack_start' }], initialStatuses: [],
          pools: opts.aPools, gauge: { current: opts.aGauge ?? 0 },
        }],
      },
      {
        id: 'B' as const, name: '乙',
        units: [{
          unitId: 'B_u0', pathwayId: 'warrior', coordinate: { faction: 'B' as const, lane: 'lane0' as const, index: 0 },
          attributeSet: { strength: 10, agility: 0, intelligence: 0, rank: 0 },
          gender: 'male' as const, anchor: 0,
          activeSlots: (opts.bSkills ?? []).map((skillDefId) => ({ skillDefId })),
          passiveSlots: [], initialStatuses: [],
          pools: opts.bPools, gauge: { current: opts.bGauge ?? 0 },
        }],
      },
    ],
    inputs: { decisions: new Map() },
  } as never
}

function hpOf(c: CombatFacade, id: string): number {
  return c.state().units.find((u) => u.id === id)!.hp
}

function reader(c: CombatFacade): () => import('../src/kernel/combat/types').DomainEvent[] {
  let cursor = 0
  return () => {
    const all = c.drainEvents()
    const out = all.slice(cursor)
    cursor = all.length
    return [...out]
  }
}

const STRIKE = { type: 'damage', element: 'physical', value: 10 }
const HEAL = { type: 'heal', value: 5, target: 'self' }

describe('RulePatch 集成', () => {
  it('empower：己方伤害 ×1.5', () => {
    const p = path(
      [domDef('dom_x', [{ kind: 'empower', side: 'ally', stat: 'damage', mul: 1.5 }])],
      [passive('stack_start', [{ type: 'domain', op: 'overlay', def: 'dom_x' }]),
        active('rp_strike', ['光'], 'enemy', [STRIKE])],
    )
    const c = createCombat(setup(p, { aSkills: ['rp_strike'], aGauge: 74 }))
    c.drainEvents()
    c.step()
    expect(hpOf(c, 'B_u0')).toBe(115)
  })

  it('empower：己方治疗 ×2', () => {
    const p = path(
      [domDef('dom_x', [{ kind: 'empower', side: 'ally', stat: 'heal', mul: 2 }])],
      [passive('stack_start', [{ type: 'domain', op: 'overlay', def: 'dom_x' }]),
        active('rp_heal', [], 'self', [HEAL], 0)],
    )
    const c = createCombat(setup(p, { aSkills: ['rp_heal'], aGauge: 74, aPools: { hp: 20 } }))
    c.drainEvents()
    c.step()
    expect(hpOf(c, 'A_u0')).toBe(30)
  })

  it('cost_mod：技能费用 +1 影响可用性与实扣', () => {
    const card = active('rp_strike', ['光'], 'enemy', [STRIKE], 2)
    const withPatch = path(
      [domDef('dom_x', [{ kind: 'cost_mod', delta: 1 }])],
      [passive('stack_start', [{ type: 'domain', op: 'overlay', def: 'dom_x' }]), card],
    )
    const plain = path(
      [domDef('dom_x', [])],
      [passive('stack_start', [{ type: 'domain', op: 'overlay', def: 'dom_x' }]), card],
    )

    const blocked = createCombat(setup(withPatch as never, { aSkills: ['rp_strike'], aGauge: 74, aPools: { energy: 2 } }))
    const blockedNext = reader(blocked)
    blockedNext()
    blocked.step()
    const blockedCommit = blockedNext().find((e) => e.type === 'BehaviorCommitted')
    expect(blockedCommit && blockedCommit.type === 'BehaviorCommitted' ? blockedCommit.sourceRef : undefined)
      .toBe(BASIC_ATTACK_ID)

    const ok = createCombat(setup(plain as never, { aSkills: ['rp_strike'], aGauge: 74, aPools: { energy: 2 } }))
    const okNext = reader(ok)
    okNext()
    ok.step()
    const okCommit = okNext().find((e) => e.type === 'BehaviorCommitted')
    expect(okCommit && okCommit.type === 'BehaviorCommitted' ? okCommit.sourceRef : undefined)
      .toBe('rp_strike')
  })

  it('seal_effect(domain)：阻止新界域落地', () => {
    const p = path(
      [domDef('dom_x', [{ kind: 'seal_effect', effectType: 'domain' }]), domDef('dom_second', [])],
      [passive('stack_start', [{ type: 'domain', op: 'overlay', def: 'dom_x' }]),
        active('rp_place', [], 'self', [{ type: 'domain', op: 'overlay', def: 'dom_second' }], 0)],
    )
    const c = createCombat(setup(p, { aSkills: ['rp_place'], aGauge: 74 }))
    const initial = [...c.drainEvents()]
    expect(initial.some((e) => e.type === 'DomainPlaced' && e.defId === 'dom_x')).toBe(true)
    c.step()
    expect(c.drainEvents().some((e) => e.type === 'DomainPlaced' && e.defId === 'dom_second')).toBe(false)
  })

  it('disable_effect(tag)：敌方光/净化技能效果失效', () => {
    const p = path(
      [domDef('dom_x', [{ kind: 'disable_effect', side: 'enemy', tag: ['光'] }])],
      [passive('stack_start', [{ type: 'domain', op: 'overlay', def: 'dom_x' }]),
        active('rp_strike', ['光'], 'enemy', [STRIKE])],
    )
    const c = createCombat(setup(p, { bSkills: ['rp_strike'], bGauge: 74 }))
    c.drainEvents()
    c.step()
    expect(hpOf(c, 'A_u0')).toBe(40)
  })

  it('disable_effect(shield)：护盾不再吸收伤害', () => {
    const p = path(
      [domDef('dom_x', [{ kind: 'disable_effect', side: 'both', effectType: 'shield' }])],
      [passive('stack_start', [{ type: 'domain', op: 'overlay', def: 'dom_x' }]),
        active('rp_strike', ['光'], 'enemy', [STRIKE])],
    )
    const c = createCombat(setup(p, { aSkills: ['rp_strike'], aGauge: 74, bPools: { shield: 20 } }))
    c.drainEvents()
    c.step()
    expect(hpOf(c, 'B_u0')).toBe(120)
  })

  it('被压制的 overlay 补丁不生效', () => {
    const c = createCombat(setup(path(
      [
        domDef('dom_boost', [{ kind: 'empower', side: 'ally', stat: 'damage', mul: 2 }]),
        domDef('dom_plain', []),
      ],
      [passive('stack_start', [
        { type: 'domain', op: 'overlay', def: 'dom_boost' },
        { type: 'domain', op: 'overlay', def: 'dom_plain' },
      ]), active('rp_strike', ['光'], 'enemy', [STRIKE])],
    ) as never, { aSkills: ['rp_strike'], aGauge: 74 }))
    c.drainEvents()
    c.step()
    expect(hpOf(c, 'B_u0')).toBe(120)
  })
})
