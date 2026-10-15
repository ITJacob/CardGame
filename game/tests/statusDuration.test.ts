// 时长口径（编队参数 §1.1b duration / 编队上下文 §2.4 挂载伪码）：
//   Def 层：正整数 = 自然到期（按 durationUnit 计）；null 或缺省 = **常驻**（不自然到期，递减跳过）
//   载荷层（Grant / EffectRef）：省略或 null = 未指定 → 回退 Def；正整数 = 覆盖。载荷层不表达常驻。
import { describe, expect, it } from 'vitest'
import { createCombat } from '../src/kernel'
import { buildCatalog } from '../src/data/catalogBuild'
import { handleModifyStatus } from '../src/kernel/effect/handlers2'
import type { PathwayFile } from '../src/data/schema.types'
import type { StatusDef } from '../src/kernel/catalog/types'
import type { CombatFacade } from '../src/kernel/combat/types'
import { makeUnit } from './helpers/fixture'

const DEF_PERM: StatusDef = { id: 'perm', category: ['buff'], dispelable: false, duration: null, maxStacks: 1 }
/** 连 duration 键都不写 = 常驻（形态组 / 跨途径最小副本的写法） */
const DEF_ABSENT: StatusDef = { id: 'absent', category: ['buff'], dispelable: false, maxStacks: 1 } as StatusDef
const DEF_FINITE: StatusDef = { id: 'finite', category: ['buff'], dispelable: true, duration: 3, maxStacks: 1 }

function mount(defs: StatusDef[], defId: string, grant: { duration?: number | null } = {}) {
  const u = makeUnit('u', 'A', {}, defs)
  u.statuses.mount(defId, { ...grant, sourceId: 'test' })
  return u
}

const remainingOf = (u: ReturnType<typeof mount>, defId: string): number | null =>
  u.statuses.byDef(defId)[0]!.remaining

describe('常驻（Def 层 null / 缺省）：不自然到期', () => {
  it('Def 层 duration: null —— 30 tick 后仍在，remaining 恒为 null', () => {
    const u = mount([DEF_PERM], 'perm')
    expect(remainingOf(u, 'perm')).toBeNull()
    for (let i = 0; i < 30; i += 1) expect(u.statuses.tick()).toHaveLength(0)
    expect(u.statuses.has('perm')).toBe(true)
    expect(remainingOf(u, 'perm')).toBeNull()
  })

  it('Def 层缺省 duration —— 同样按常驻处理', () => {
    const u = mount([DEF_ABSENT], 'absent')
    for (let i = 0; i < 30; i += 1) u.statuses.tick()
    expect(u.statuses.has('absent')).toBe(true)
    expect(remainingOf(u, 'absent')).toBeNull()
  })

  it('self_turn 口径同样不递减常驻', () => {
    const u = mount([{ ...DEF_PERM, id: 'perm_st', durationUnit: 'self_turn' }], 'perm_st')
    for (let i = 0; i < 10; i += 1) u.statuses.tickSelfTurn()
    expect(u.statuses.has('perm_st')).toBe(true)
  })
})

describe('载荷层 duration：只在「未指定」与「覆盖」之间取值', () => {
  it('载荷 null = 未指定 → 回退 Def 的有限时长（不是常驻）', () => {
    const u = mount([DEF_FINITE], 'finite', { duration: null })
    expect(remainingOf(u, 'finite')).toBe(3)
    for (let i = 0; i < 3; i += 1) expect(u.statuses.tick()).toHaveLength(i === 2 ? 1 : 0)
    expect(u.statuses.has('finite')).toBe(false)
  })

  it('载荷正整数 = 覆盖 Def 时长', () => {
    const u = mount([DEF_FINITE], 'finite', { duration: 10 })
    expect(remainingOf(u, 'finite')).toBe(10)
    for (let i = 0; i < 9; i += 1) u.statuses.tick()
    expect(u.statuses.has('finite')).toBe(true)
    u.statuses.tick()
    expect(u.statuses.has('finite')).toBe(false)
  })

  it('载荷省略 = 未指定 → 回退 Def', () => {
    expect(remainingOf(mount([DEF_FINITE], 'finite'), 'finite')).toBe(3)
  })
})

describe('重复挂载（stackPolicy = refresh）：常驻恒胜', () => {
  it('有限 → 常驻：续挂后转为常驻', () => {
    const u = mount([DEF_PERM], 'perm', { duration: 5 })
    expect(remainingOf(u, 'perm')).toBe(5)
    u.statuses.mount('perm', { sourceId: 'again' }) // 回退 Def = null
    expect(remainingOf(u, 'perm')).toBeNull()
  })

  it('常驻 → 有限：续挂不把常驻降级', () => {
    const u = mount([DEF_PERM], 'perm')
    u.statuses.mount('perm', { duration: 5, sourceId: 'again' })
    expect(remainingOf(u, 'perm')).toBeNull()
  })
})

describe('modify_status 的时长改写', () => {
  it('addDuration 不改常驻', () => {
    const u = mount([DEF_PERM], 'perm')
    handleModifyStatus(
      { type: 'modify_status', statusId: 'perm', addDuration: 5 } as never,
      u,
      {} as never,
    )
    expect(remainingOf(u, 'perm')).toBeNull()
  })

  it('setDuration 显式值仍可把常驻钉成有限时长', () => {
    const u = mount([DEF_PERM], 'perm')
    handleModifyStatus(
      { type: 'modify_status', statusId: 'perm', setDuration: 7 } as never,
      u,
      {} as never,
    )
    expect(remainingOf(u, 'perm')).toBe(7)
  })

  it('addDuration 对有限时长照旧累加', () => {
    const u = mount([DEF_FINITE], 'finite', { duration: 3 })
    handleModifyStatus(
      { type: 'modify_status', statusId: 'finite', addDuration: 4 } as never,
      u,
      {} as never,
    )
    expect(remainingOf(u, 'finite')).toBe(7)
  })
})

// ---------- 端到端：走 runtime 的 initialStatuses / 效果挂载两条路径 ----------

const PROBE: PathwayFile = {
  pathwayId: 'probe_duration',
  pathwayName: '时长探针',
  sourceFile: 'probe',
  sourceVersion: 'test',
  cards: [
    {
      id: 'dur_strike', name: '打击', kind: 'active', sequence: 2, sequenceName: 's2', rarity: 'common',
      axis: 'a', flagship: false, lore: '', flavor: '', describe: '', tentative: false,
      cost: { energy: 0, cooldown: 0, castTime: null }, reach: 'melee',
      target: {
        request: { faction: 'enemy', anchor: 'enemy_front', sort: 'index_asc', pickCount: 1 },
        selectionMode: 'auto',
      },
      effects: [{ type: 'damage', value: 1, element: 'physical' }],
    },
    {
      id: 'dur_aura', name: '常驻光环探针', kind: 'passive', sequence: 1, sequenceName: 's1', rarity: 'common',
      axis: 'a', flagship: false, lore: '', flavor: '', describe: '', tentative: false,
      hook: ['on_battle_start'],
      effects: [{ type: 'mount_status', statusId: 'probe_perm', duration: null, target: 'self' }],
      statusDefs: [
        { id: 'probe_perm', name: '常驻探针', category: ['buff'], dispelable: false, duration: null, maxStacks: 1 },
        { id: 'probe_absent', name: '缺省时长探针', category: ['buff'], dispelable: false, maxStacks: 1 },
      ],
    },
  ],
}

function probeSetup(seed: number) {
  const catalog = buildCatalog([PROBE]).catalog
  const makeUnits = (faction: 'A' | 'B') => [
    {
      unitId: `${faction}_u0`,
      coordinate: { faction, lane: 'lane0' as const, index: 0 },
      attributeSet: { strength: 1, agility: 0, intelligence: 0, rank: 0 },
      gender: 'male' as const,
      anchor: 0,
      activeSlots: [{ skillDefId: 'dur_strike' }],
      passiveSlots: [{ defId: 'dur_aura' }],
      initialStatuses: [
        { defId: 'probe_perm', sourceId: 'init' },
        { defId: 'probe_absent', sourceId: 'init' },
      ],
    },
  ]
  return {
    seed,
    catalog,
    board: { clock: { base: 0 }, domainGrants: [] },
    factions: [
      { id: 'A' as const, name: '甲', units: makeUnits('A') },
      { id: 'B' as const, name: '乙', units: makeUnits('B') },
    ],
    inputs: { decisions: new Map() },
  }
}

const hasStatus = (c: CombatFacade, unitId: string, defId: string): boolean => {
  const u = c.state().units.find((x) => x.id === unitId)
  return !!u && u.statuses.some((s) => s.defId === defId)
}

describe('端到端：常驻状态在整场战斗里都不掉', () => {
  it('initialStatuses 挂的常驻状态 40 tick 后仍在', () => {
    const c = createCombat(probeSetup(7) as never)
    for (let i = 0; i < 40 && !c.ended(); i += 1) c.step()
    expect(hasStatus(c, 'A_u0', 'probe_perm')).toBe(true)
    expect(hasStatus(c, 'A_u0', 'probe_absent')).toBe(true)
    // 反面对照：同一张卡挂的有限状态（3 tick）早该没了
    expect(c.ended()?.stats.ticks ?? 40).toBeGreaterThanOrEqual(40)
  })

  it('效果载荷 duration: null 挂常驻 def —— 同样不掉', () => {
    const c = createCombat(probeSetup(11) as never)
    c.step()
    expect(hasStatus(c, 'A_u0', 'probe_perm')).toBe(true)
    for (let i = 0; i < 40 && !c.ended(); i += 1) c.step()
    expect(hasStatus(c, 'A_u0', 'probe_perm')).toBe(true)
  })
})
