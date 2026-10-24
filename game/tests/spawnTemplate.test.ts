// spawn.template / unitDef.baseOn / inheritSkills 继承（召唤物参数 §二/§三）：
// 显式比率 + 模板 → 源单位属性 × 比率并快照技能组；baseOn 决定属性来源。
import { describe, expect, it } from 'vitest'
import { createCombat } from '../src/kernel'
import { buildCatalog } from '../src/data/catalogBuild'
import type { PathwayFile } from '../src/data/schema.types'
import type { CombatFacade } from '../src/kernel/combat/types'

const SKILL = (id: string, effects: unknown[], targetFaction: 'enemy' | 'self' = 'enemy') => ({
  id, name: id, kind: 'active' as const, sequence: 9, sequenceName: 's9', rarity: 'common' as const,
  axis: 'a', flagship: false, lore: '', flavor: '', describe: '', tentative: false,
  cost: { energy: 0, cooldown: 0, castTime: null }, reach: 'spell' as const,
  target: {
    selectionMode: 'auto' as const,
    request: { faction: targetFaction, anchor: targetFaction === 'enemy' ? 'enemy_front' : 'caster', pickCount: 1 },
  },
  effects,
})

const SUMMON = {
  id: 'probe_summon_tower', name: '召唤塔', kind: 'summon' as const, sequence: 9, sequenceName: 's9', rarity: 'common' as const,
  axis: 'a', flagship: false, lore: '', flavor: '', describe: '', tentative: false,
  cost: { energy: 0, cooldown: 0, castTime: null }, effects: [],
  summon: { unitId: 'probe_tower', hpRatio: 0.5, atkRatio: 0.5, position: 'tail' as const },
}

const RITES = {
  id: 'probe_rites', name: '役使仪式', kind: 'passive' as const, sequence: 1, sequenceName: 's1', rarity: 'common' as const,
  axis: 'a', flagship: false, lore: '', flavor: '', describe: '', tentative: false,
  cost: { energy: 0, cooldown: 100, castTime: null }, hook: ['on_battle_start'],
  effects: [{ type: 'mount_status', statusId: 'probe_reaper', duration: null, target: 'self' }],
  statusDefs: [
    {
      id: 'probe_reaper', name: '役使者', category: ['buff'], dispelable: false, duration: null, maxStacks: 1,
      triggers: [{
        event: 'on_kill',
        effects: [{ type: 'spawn', template: 'killed_unit', hpRatio: 0.5, atkRatio: 0.5, position: 'tail' }],
      }],
    },
  ],
}

const PATH: PathwayFile = {
  pathwayId: 'probe_tpl',
  pathwayName: '模板探针',
  sourceFile: 'probe',
  sourceVersion: 'test',
  cards: [
    SKILL('probe_copy_call', [{ type: 'spawn', template: 'primary_target', hpRatio: 0.5, atkRatio: 0.5, position: 'tail' }]),
    SKILL('probe_echo_call', [{ type: 'spawn', unitId: 'probe_echo', template: 'primary_target', position: 'tail' }]),
    SKILL('probe_baseline_call', [{ type: 'spawn', unitId: 'probe_baseline', position: 'tail' }], 'self'),
    SKILL('probe_execute', [{ type: 'damage', element: 'physical', value: 999 }]),
    SKILL('probe_b_skill', [{ type: 'mount_status', statusId: 'probe_noop', duration: null, target: 'self' }], 'self'),
    SUMMON,
    RITES,
  ],
  unitDefs: [
    {
      id: 'probe_echo', name: '历史回声', unitType: 'ILLUSION',
      baseOn: 'template_target', hpRatio: 0.35, atkRatio: 0.6,
    },
    {
      id: 'probe_baseline', name: '基线造物', unitType: 'CONSTRUCT',
      baseOn: 'summon_baseline', hpRatio: 0.5, atkRatio: 0.5,
    },
    {
      id: 'probe_tower', name: '召唤塔', unitType: 'CONSTRUCT',
      baseOn: 'template_target',
    },
  ],
} as never

interface Slot { skills?: string[]; passives?: string[]; strength?: number; agility?: number }

function unit(unitId: string, faction: 'A' | 'B', index: number, s: Slot = {}) {
  return {
    unitId,
    coordinate: { faction, lane: 'lane0' as const, index },
    attributeSet: { strength: s.strength ?? 1, agility: s.agility ?? 1, intelligence: 1, rank: 0 },
    gender: 'male' as const,
    anchor: index,
    activeSlots: (s.skills ?? []).map((skillDefId) => ({ skillDefId })),
    passiveSlots: (s.passives ?? []).map((defId) => ({ defId })),
    initialStatuses: [],
  }
}

function setup(a: Slot, b: Slot) {
  return {
    seed: 7,
    catalog: buildCatalog([PATH]).catalog,
    board: { clock: { base: 0 }, domainGrants: [] },
    factions: [
      { id: 'A' as const, name: '甲', units: [unit('A_u0', 'A', 0, a)] },
      { id: 'B' as const, name: '乙', units: [unit('B_u0', 'B', 0, b)] },
    ],
    inputs: { decisions: new Map() },
  } as never
}

function run(c: CombatFacade, ticks: number): unknown[] {
  const events: unknown[] = []
  for (let i = 0; i < ticks && !c.ended(); i += 1) {
    c.step()
    events.push(...c.drainEvents())
  }
  return events
}

const summonOf = (c: CombatFacade) => c.state().units.find((u) => u.summonerId === 'A_u0')

describe('spawn.template：源单位继承', () => {
  it('primary_target + 显式比率：属性 = 目标 × 比率', () => {
    const c = createCombat(setup({ skills: ['probe_copy_call'], agility: 30 }, { strength: 10 }))
    run(c, 2)
    expect(summonOf(c)!.hpMax).toBe(65) // B hpMax 130 × 0.5
  })

  it('技能组快照复制：召唤物能施放模板源的技能', () => {
    const c = createCombat(setup({ skills: ['probe_copy_call'], agility: 1 }, { skills: ['probe_b_skill'], strength: 10 }))
    const events = run(c, 12)
    const summonIds = new Set(events
      .map((e) => e as { type?: string; unitId?: string })
      .filter((e) => e.type === 'UnitSpawned')
      .map((e) => e.unitId))
    const cast = events.some((e) => {
      const ev = e as { type?: string; caster?: string; sourceRef?: string }
      return ev.type === 'BehaviorCommitted' && ev.sourceRef === 'probe_b_skill' && summonIds.has(ev.caster)
    })
    expect(cast).toBe(true)
  })

  it('killed_unit + 比率：被击杀者属性 × 比率', () => {
    const c = createCombat(setup({ skills: ['probe_execute'], passives: ['probe_rites'], agility: 30 }, { strength: 10 }))
    run(c, 3)
    expect(summonOf(c)!.hpMax).toBe(65) // B hpMax 130 × 0.5
  })
})

describe('unitDef.baseOn：属性来源声明', () => {
  it('template_target：用主目标属性 × 蓝本比率', () => {
    const c = createCombat(setup({ skills: ['probe_echo_call'], agility: 30 }, { strength: 10 }))
    run(c, 2)
    const s = summonOf(c)!
    expect(s.hpMax).toBe(46) // round(130 × 0.35)
    expect(s.unitType).toBe('ILLUSION')
  })

  it('summon 牌打出：合成 spawn 的 target=self，baseOn 取施法者属性', () => {
    const c = createCombat(setup({ skills: ['probe_summon_tower'], strength: 10, agility: 30 }, {}))
    run(c, 2)
    expect(summonOf(c)!.hpMax).toBe(65) // 施法者 hpMax 130 × 0.5
  })

  it('summon_baseline：用 unitType H1 基线 × 蓝本比率', () => {
    const c = createCombat(setup({ skills: ['probe_baseline_call'], agility: 30 }, {}))
    run(c, 2)
    const s = summonOf(c)!
    expect(s.hpMax).toBe(7) // round(CONSTRUCT 14 × 0.5)
    expect(s.unitType).toBe('CONSTRUCT')
  })
})
