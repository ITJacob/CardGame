// 规则槽 Rules[3]：字段级覆盖、remove/append、全局豁免、no_skill/no_attack 禁令与 rule_breaker。
import { describe, expect, it } from 'vitest'
import { createCombat } from '../src/kernel'
import { BASIC_ATTACK_ID } from '../src/kernel/combat/basicAttack'
import {
  createRuleSlots, expireRules, findRule, isExempt, modifyRule, prohibits, punishNodes, writeRule,
  type RuleSlotMeta,
} from '../src/kernel/combat/ruleSlots'
import { buildCatalog } from '../src/data/catalogBuild'
import type { PathwayFile } from '../src/data/schema.types'
import type { CombatFacade, DomainEvent } from '../src/kernel/combat/types'

function meta(id: string, owner: 'A' | 'B' = 'A'): RuleSlotMeta {
  return { sourceId: id, ownerFaction: owner, casterId: `${owner}_u0` }
}

describe('规则槽纯函数', () => {
  it('write 按 field 覆盖：trigger 与 punish 共存', () => {
    const s = createRuleSlots()
    expect(writeRule(s, 0, 'trigger', { rule: 'no_skill' }, true, meta('t'))).toEqual({ slot: 0, field: 'trigger', mode: 'write' })
    expect(writeRule(s, 0, 'punish', [{ type: 'damage', value: 3 }], true, meta('p'))).toEqual({ slot: 0, field: 'punish', mode: 'write' })
    expect(findRule(s, 0, 'trigger')?.value).toEqual({ rule: 'no_skill' })
    expect(punishNodes(findRule(s, 0, 'punish'))).toHaveLength(1)
  })

  it('overwrite:false 仅在该 field 为空时写入', () => {
    const s = createRuleSlots()
    writeRule(s, 1, 'exemptions', { side: 'self' }, false, meta('e1'))
    expect(writeRule(s, 1, 'exemptions', { side: 'enemy' }, false, meta('e2'))).toBeNull()
    expect(findRule(s, 1, 'exemptions')?.value).toEqual({ side: 'self' })
    expect(writeRule(s, 1, 'scope', { a: 1 }, false, meta('s'))).not.toBeNull()
  })

  it('modify：replace / append / remove；punish 数组 concat、scope 对象并集', () => {
    const s = createRuleSlots()
    writeRule(s, 2, 'punish', [{ type: 'damage', value: 1 }], true, meta('p'))
    modifyRule(s, 2, 'punish', 'append', [{ type: 'damage', value: 2 }], meta('p2'))
    expect(punishNodes(findRule(s, 2, 'punish'))).toEqual([
      { type: 'damage', value: 1 }, { type: 'damage', value: 2 },
    ])
    writeRule(s, 2, 'scope', { physical: 'a' }, true, meta('s'))
    modifyRule(s, 2, 'scope', 'append', { gravity: 'b' }, meta('s2'))
    expect(findRule(s, 2, 'scope')?.value).toEqual([{ physical: 'a' }, { gravity: 'b' }])
    modifyRule(s, 2, 'scope', 'replace', { x: 1 }, meta('s3'))
    expect(findRule(s, 2, 'scope')?.value).toEqual({ x: 1 })
    modifyRule(s, 2, 'scope', 'remove', {}, meta('s4'))
    expect(findRule(s, 2, 'scope')).toBeUndefined()
  })

  it('duration 过期与跨槽全局豁免', () => {
    const s = createRuleSlots()
    writeRule(s, 0, 'trigger', { rule: 'no_skill' }, true, { ...meta('t'), expiresAtTick: 3 })
    expect(expireRules(s, 2)).toEqual([])
    expect(expireRules(s, 3)).toEqual([{ slot: 0, field: 'trigger', mode: 'expire' }])
    writeRule(s, 1, 'exemptions', { side: 'self' }, false, meta('e', 'A'))
    expect(isExempt(s, 'A')).toBe(true)
    expect(isExempt(s, 'B')).toBe(false)
  })

  it('prohibits 仅对无 punish 的 no_skill/no_attack 生效', () => {
    const s = createRuleSlots()
    writeRule(s, 0, 'trigger', { rule: 'no_skill' }, true, meta('t'))
    expect(prohibits(s, 'B', 'skill', 1)).toBe(true)
    writeRule(s, 1, 'exemptions', { side: 'self' }, false, meta('e', 'B'))
    expect(prohibits(s, 'B', 'skill', 1)).toBe(false)
    modifyRule(s, 1, 'exemptions', 'remove', {}, meta('e2', 'B'))
    writeRule(s, 0, 'punish', [{ type: 'damage', value: 1 }], true, meta('p'))
    expect(prohibits(s, 'B', 'skill', 1)).toBe(false)
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

function active(id: string, tags: string[], faction: 'enemy' | 'self', effects: unknown[], energy = 0): Record<string, unknown> {
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

function setup(p: PathwayFile, opts: {
  aSkills?: string[]; bSkills?: string[]; aGauge?: number; bGauge?: number
  aStrength?: number; bStrength?: number; aPools?: Record<string, number>; bPools?: Record<string, number>
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
          attributeSet: { strength: opts.aStrength ?? 1, agility: 0, intelligence: 0, rank: 0 },
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
          attributeSet: { strength: opts.bStrength ?? 1, agility: 0, intelligence: 0, rank: 0 },
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

function reader(c: CombatFacade): () => DomainEvent[] {
  let cursor = 0
  return () => {
    const all = c.drainEvents()
    const out = all.slice(cursor)
    cursor = all.length
    return [...out]
  }
}

function path(cards: unknown[]): PathwayFile {
  return { pathwayId: 'warrior', pathwayName: '战士', sourceFile: 'probe', sourceVersion: 'test', cards, domainDefs: [] } as never
}

const STRIKE = { type: 'damage', element: 'physical', value: 10 }

function rulePassive(opts: {
  slot?: number; trigger: Record<string, unknown>; punish?: unknown[]; exemptSelf?: boolean
}): Record<string, unknown> {
  const slot = opts.slot ?? 0
  const effects: unknown[] = [
    { type: 'write_rule_slot', slot, field: 'trigger', value: opts.trigger },
  ]
  if (opts.punish) effects.push({ type: 'write_rule_slot', slot, field: 'punish', value: opts.punish })
  if (opts.exemptSelf) effects.push({ type: 'write_rule_slot', slot: 1, field: 'exemptions', value: { side: 'self' }, overwrite: false })
  return passive('stack_start', effects)
}

describe('规则槽集成', () => {
  it('no_skill + punish：违约者受罚（rule_breaker 显式目标）', () => {
    const p = path([
      rulePassive({ trigger: { rule: 'no_skill', duration: 30 }, punish: [{ ...STRIKE, value: 3, target: 'rule_breaker' }] }),
      active('rp_strike', ['光'], 'enemy', [STRIKE]),
    ])
    const c = createCombat(setup(p, { bSkills: ['rp_strike'], bGauge: 74, aStrength: 1, bStrength: 1 }))
    c.drainEvents()
    const ev = (() => { c.step(); return c.drainEvents() })()
    expect(ev.some((e) => e.type === 'RuleTriggered' && e.rule === 'no_skill')).toBe(true)
    expect(hpOf(c, 'B_u0')).toBe(37)
  })

  it('全局豁免：规则施法者阵营不挨罚', () => {
    const p = path([
      rulePassive({ trigger: { rule: 'no_skill', duration: 30 }, punish: [{ ...STRIKE, value: 3 }], exemptSelf: true }),
      active('rp_strike', [], 'enemy', [STRIKE]),
    ])
    const c = createCombat(setup(p, { aSkills: ['rp_strike'], aGauge: 74 }))
    c.drainEvents()
    c.step()
    expect(hpOf(c, 'A_u0')).toBe(40)
  })

  it('no_skill 无 punish：技能被禁令过滤，只剩普攻', () => {
    const p = path([
      rulePassive({ trigger: { rule: 'no_skill', duration: 30 } }),
      active('rp_strike', [], 'enemy', [STRIKE]),
    ])
    const c = createCombat(setup(p, { aSkills: ['rp_strike'], aGauge: 74 }))
    const next = reader(c)
    next()
    c.step()
    const commit = next().find((e) => e.type === 'BehaviorCommitted')
    expect(commit && commit.type === 'BehaviorCommitted' ? commit.sourceRef : undefined).toBe(BASIC_ATTACK_ID)
  })

  it('no_attack 无 punish：普攻被过滤，机会空转', () => {
    const p = path([rulePassive({ trigger: { rule: 'no_attack', duration: 30 } })])
    const c = createCombat(setup(p, { aGauge: 74 }))
    const next = reader(c)
    next()
    c.step()
    expect(next().some((e) => e.type === 'BehaviorCommitted')).toBe(false)
  })

  it('on_deal_damage + oath_holder：绑定单位造成伤害时受罚', () => {
    const p = path([
      rulePassive({
        trigger: { trigger: 'on_deal_damage', scope: 'oath_holder', duration: 30 },
        punish: [{ type: 'damage', element: 'holy', value: 2, target: 'rule_breaker' }],
      }),
      active('rp_strike', [], 'enemy', [STRIKE]),
    ])
    const c = createCombat(setup(p, { aSkills: ['rp_strike'], aGauge: 74 }))
    c.drainEvents()
    c.step()
    expect(hpOf(c, 'A_u0')).toBe(38)
    expect(hpOf(c, 'B_u0')).toBe(30)
  })

  it('on_attack + 低血%条件：攻击弱者受罚，攻击强者不受', () => {
    const p = path([
      rulePassive({
        trigger: { trigger: 'on_attack', condition: 'target_hp_percent_lower_than_attacker', duration: 30 },
        punish: [{ type: 'damage', element: 'mental', value: 3 }],
      }),
      active('rp_strike', [], 'enemy', [STRIKE]),
    ])
    const low = createCombat(setup(p, {
      aSkills: ['rp_strike'], aGauge: 74, aStrength: 10, bStrength: 1, bPools: { hp: 20 },
    }))
    low.drainEvents()
    low.step()
    expect(hpOf(low, 'A_u0')).toBe(127)

    const high = createCombat(setup(p, {
      aSkills: ['rp_strike'], aGauge: 74, aStrength: 1, bStrength: 10, aPools: { hp: 20 },
    }))
    high.drainEvents()
    high.step()
    expect(hpOf(high, 'A_u0')).toBe(20)
  })

  it('charges：两次违约后规则失效', () => {
    const p = path([
      rulePassive({
        trigger: { rule: 'no_skill', duration: 30, charges: 2 },
        punish: [{ type: 'damage', element: 'mental', value: 1 }],
      }),
      active('rp_strike', [], 'enemy', [{ ...STRIKE, value: 1 }]),
    ])
    const c = createCombat(setup(p, { bSkills: ['rp_strike'], bGauge: 74, aStrength: 10, bStrength: 10 }))
    const next = reader(c)
    next()
    let triggered = 0
    for (let i = 0; i < 12; i += 1) {
      c.step()
      triggered += next().filter((e) => e.type === 'RuleTriggered').length
    }
    expect(triggered).toBe(2)
  })

  it('remove trigger 后规则失效', () => {
    const p = path([
      passive('stack_start', [
        { type: 'write_rule_slot', slot: 0, field: 'trigger', value: { rule: 'no_skill', duration: 30 } },
        { type: 'write_rule_slot', slot: 0, field: 'punish', value: [{ ...STRIKE, value: 3 }] },
        { type: 'modify_rule_slot', slot: 0, field: 'trigger', mode: 'remove', value: {} },
      ]),
      active('rp_strike', [], 'enemy', [STRIKE]),
    ])
    const c = createCombat(setup(p, { bSkills: ['rp_strike'], bGauge: 74 }))
    const next = reader(c)
    const initial = next()
    expect(initial.some((e) => e.type === 'RuleSlotChanged' && e.mode === 'remove')).toBe(true)
    c.step()
    expect(next().some((e) => e.type === 'RuleTriggered')).toBe(false)
  })
})
