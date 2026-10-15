// 机会括号（INV-S6）行为验证：
//   1. 一次授予产出一对 on_turn_start / on_turn_end（同一 tick 内 start 必在 end 前）
//   2. 括弧挂在「谁获得机会」上，不再按 tickCount % 5 给全体广播（敏捷高者更密）
//   3. 单位已亡的机会不产出括弧（尸体不挂事件）
import { describe, expect, it } from 'vitest'
import { createCombat } from '../src/kernel'
import { buildCatalog } from '../src/data/catalogBuild'
import type { PathwayFile } from '../src/data/schema.types'
import type { CombatFacade, CombatSetup, DomainEvent } from '../src/kernel/combat/types'
import type { StatusGrant } from '../src/kernel/roster/types'

// 探针：passive 卡把 hook 直接编译成触发器，效果 = 挂一个永久标记状态
const PROBE: PathwayFile = {
  pathwayId: 'probe',
  pathwayName: '探针',
  sourceFile: 'probe',
  sourceVersion: 'test',
  cards: [
    {
      id: 'probe_hit', name: '轻击', kind: 'active', sequence: 3, sequenceName: 's3', rarity: 'common',
      axis: 'a', flagship: false, lore: '', flavor: '', describe: '', tentative: false,
      cost: { energy: 0, cooldown: 0, castTime: null }, reach: 'melee',
      target: {
        request: { faction: 'enemy', anchor: 'enemy_front', sort: 'index_asc', pickCount: 1 },
        selectionMode: 'auto',
      },
      effects: [{ type: 'damage', value: 5, element: 'physical' }],
    },
    {
      id: 'probe_smash', name: '重击', kind: 'active', sequence: 2, sequenceName: 's2', rarity: 'common',
      axis: 'a', flagship: false, lore: '', flavor: '', describe: '', tentative: false,
      cost: { energy: 0, cooldown: 0, castTime: null }, reach: 'melee',
      target: {
        request: { faction: 'enemy', anchor: 'enemy_front', sort: 'index_asc', pickCount: 1 },
        selectionMode: 'auto',
      },
      effects: [{ type: 'damage', value: 100, element: 'physical' }],
    },
    {
      id: 'probe_start', name: '探针·始', kind: 'passive', sequence: 1, sequenceName: 's1', rarity: 'common',
      axis: 'a', flagship: false, lore: '', flavor: '', describe: '', tentative: false,
      hook: ['on_turn_start'],
      effects: [{ type: 'mount_status', statusId: 'probe_a', duration: 9999 }],
      statusDefs: [
        { id: 'probe_a', name: '始', category: ['buff'], dispelable: false, duration: 9999, maxStacks: 1, stackPolicy: 'refresh' },
      ],
    },
    {
      id: 'probe_end', name: '探针·终', kind: 'passive', sequence: 1, sequenceName: 's1', rarity: 'common',
      axis: 'a', flagship: false, lore: '', flavor: '', describe: '', tentative: false,
      hook: ['on_turn_end'],
      effects: [{ type: 'mount_status', statusId: 'probe_b', duration: 9999 }],
      statusDefs: [
        { id: 'probe_b', name: '终', category: ['buff'], dispelable: false, duration: 9999, maxStacks: 1, stackPolicy: 'refresh' },
      ],
    },
    // self_turn 时长验证用：自身回合/墙钟两种口径的同形状态，各在 on_turn_start 挂一个标记
    {
      id: 'probe_keep', name: '探针·时长', kind: 'passive', sequence: 1, sequenceName: 's1', rarity: 'common',
      axis: 'a', flagship: false, lore: '', flavor: '', describe: '', tentative: false,
      effects: [],
      statusDefs: [
        {
          id: 'probe_self_st', name: '自身回合计时', category: ['buff'], dispelable: false,
          duration: 2, durationUnit: 'self_turn', maxStacks: 1, stackPolicy: 'refresh',
          triggers: [{ event: 'on_turn_start', effects: [{ type: 'mount_status', statusId: 'probe_c', duration: 9999 }] }],
        },
        {
          id: 'probe_tick_st', name: '墙钟计时', category: ['buff'], dispelable: false,
          duration: 2, maxStacks: 1, stackPolicy: 'refresh',
          triggers: [{ event: 'on_turn_start', effects: [{ type: 'mount_status', statusId: 'probe_c', duration: 9999 }] }],
        },
        { id: 'probe_c', name: '记', category: ['buff'], dispelable: false, duration: 9999, maxStacks: 1, stackPolicy: 'refresh' },
      ],
    },
  ],
}

interface ProbeOptions {
  seed?: number
  perSide?: number
  agility?: { A: number; B: number }
  skills?: string[]
  /** 只给 A 方单位挂的初始状态（self_turn 时长验证用） */
  initialStatuses?: (StatusGrant & { defId: string })[]
}

function buildSetup(opts: ProbeOptions = {}): CombatSetup {
  const catalog = buildCatalog([PROBE]).catalog
  const perSide = opts.perSide ?? 2
  const skills = opts.skills ?? ['probe_hit']
  const makeUnits = (faction: 'A' | 'B') =>
    Array.from({ length: perSide }, (_, i) => ({
      unitId: `${faction}_u${i}`,
      coordinate: { faction, lane: 'lane0', index: i },
      attributeSet: { strength: 1, agility: opts.agility?.[faction] ?? 0, intelligence: 0, rank: 0 },
      gender: 'male' as const,
      anchor: 0,
      activeSlots: skills.map((s) => ({ skillDefId: s })),
      passiveSlots: [{ defId: 'probe_start' }, { defId: 'probe_end' }],
      initialStatuses: faction === 'A' ? (opts.initialStatuses ?? []) : [],
    }))
  return {
    seed: opts.seed ?? 12345,
    catalog,
    board: { clock: { base: 0 }, domainGrants: [] },
    factions: [
      { id: 'A', name: '甲', units: makeUnits('A') },
      { id: 'B', name: '乙', units: makeUnits('B') },
    ],
    inputs: { decisions: new Map() },
  }
}

function runToEnd(facade: CombatFacade, maxSteps = 100000): void {
  let steps = 0
  while (!facade.ended() && steps < maxSteps) {
    steps += 1
    if (facade.step().ended) break
  }
}

interface ProbeHit { tick: number; unitId: string; defId: string }

/** 从事件流抽出探针挂载，按 TickAdvanced 归入所属 tick */
function probeHits(events: readonly DomainEvent[]): ProbeHit[] {
  const out: ProbeHit[] = []
  let tick = 0
  for (const e of events) {
    if (e.type === 'TickAdvanced') tick = e.tickIndex
    else if (e.type === 'StatusMounted' && (e.defId === 'probe_a' || e.defId === 'probe_b')) {
      out.push({ tick, unitId: e.unitId ?? '', defId: e.defId })
    }
  }
  return out
}

const startsOf = (hits: ProbeHit[]) => hits.filter((h) => h.defId === 'probe_a')
const endsOf = (hits: ProbeHit[]) => hits.filter((h) => h.defId === 'probe_b')

describe('机会括号（INV-S6）', () => {
  it('一次授予产出一对，且同一 tick 内 start 必在 end 前', () => {
    const c = createCombat(buildSetup({ seed: 7, perSide: 2 }))
    runToEnd(c)
    const hits = probeHits(c.ended()?.events ?? c.drainEvents())
    const starts = startsOf(hits)
    const ends = endsOf(hits)
    expect(starts.length).toBeGreaterThan(0)
    expect(starts.length).toBe(ends.length)

    // 同一 tick 内：按单位分组，序列必须是 a,b,a,b,…（左端在前、右端紧随其后的下一次授予之前）
    const byTick = new Map<number, string[]>()
    for (const h of hits) {
      const arr = byTick.get(h.tick) ?? []
      arr.push(h.defId)
      byTick.set(h.tick, arr)
    }
    for (const [tick, defIds] of byTick) {
      const want = defIds.map((_, i) => (i % 2 === 0 ? 'probe_a' : 'probe_b'))
      expect(defIds, `tick ${tick} 的探针序列必须 a,b 成对`).toEqual(want)
    }
  })

  it('括弧挂在「谁获得机会」上：敏捷高者更密，不再每 5 tick 给全体广播', () => {
    const c = createCombat(buildSetup({ seed: 3, perSide: 1, agility: { A: 5, B: 0 } }))
    for (let i = 0; i < 6; i += 1) c.step()
    const hits = startsOf(probeHits(c.ended()?.events ?? c.drainEvents()))
    const ticksOfA = hits.filter((h) => h.unitId === 'A_u0').map((h) => h.tick)
    const ticksOfB = hits.filter((h) => h.unitId === 'B_u0').map((h) => h.tick)

    // 敏捷 5 → gaugeRate 55，阈值 75 → 2 tick 内就出手（旧口径要等到 tick 5）
    expect(ticksOfA[0]).toBe(2)
    expect(ticksOfA.length).toBeGreaterThanOrEqual(3)
    // 敏捷 0 → gaugeRate 15，阈值 75 严格越阈 → 只在 tick 6 出手一次
    expect(ticksOfB).toEqual([6])
    expect(ticksOfA.length).toBeGreaterThan(ticksOfB.length)
  })

  it('单位已亡的机会不产出括弧（尸体不挂事件），存活者的括弧仍成对', () => {
    const c = createCombat(buildSetup({ seed: 11, perSide: 1, skills: ['probe_smash'] }))
    runToEnd(c)
    const events = c.ended()?.events ?? c.drainEvents()
    const hits = probeHits(events)

    const died = events.find((e) => e.type === 'UnitDied')
    expect(died).toBeDefined()
    const deadId = died!.type === 'UnitDied' ? died!.unitId : ''

    expect(startsOf(hits).filter((h) => h.unitId === deadId)).toHaveLength(0)
    expect(endsOf(hits).filter((h) => h.unitId === deadId)).toHaveLength(0)

    const survivor = deadId === 'A_u0' ? 'B_u0' : 'A_u0'
    expect(startsOf(hits).filter((h) => h.unitId === survivor)).toHaveLength(1)
    expect(endsOf(hits).filter((h) => h.unitId === survivor)).toHaveLength(1)
  })
})

describe('self_turn 时长（调度参数 §〇点五）', () => {
  /** 按 TickAdvanced 归位的事件序列，取某单位某类事件发生的 tick */
  const ticksOfEvent = (events: readonly DomainEvent[], type: string, defId: string, unitId?: string): number[] => {
    const out: number[] = []
    let tick = 0
    for (const e of events) {
      if (e.type === 'TickAdvanced') tick = e.tickIndex
      else if (e.type === type && (e as { defId?: string }).defId === defId) {
        const uid = (e as { unitId?: string }).unitId
        if (!unitId || uid === unitId) out.push(tick)
      }
    }
    return out
  }

  // A 方敏捷 0 → 机会在 tick 6、11、16…（gaugeRate 15，阈值 75 严格越阈）
  const run = (defId: string) => {
    const c = createCombat(
      buildSetup({
        seed: 5, perSide: 1, skills: ['probe_hit'],
        initialStatuses: [{ defId, duration: 2, durationUnit: defId === 'probe_self_st' ? 'self_turn' : 'tick', sourceId: '' }],
      }),
    )
    for (let i = 0; i < 12; i += 1) c.step()
    return (c.ended()?.events ?? c.drainEvents())
  }

  it('self_turn 时长只在持有者获得机会时递减（tick 不消耗）', () => {
    const events = run('probe_self_st')
    // 2 个自身回合：第 1 次机会（tick 6）扣到 1 仍在，第 2 次机会（tick 11）扣到 0 卸载
    expect(ticksOfEvent(events, 'StatusExpired', 'probe_self_st')).toEqual([11])
    // 它的 on_turn_start 触发器只在 tick 6 那次机会挂上标记（卸载后不再触发）
    expect(ticksOfEvent(events, 'StatusMounted', 'probe_c')).toEqual([6])
  })

  it('同形状态用 tick 口径则按墙钟递减，机会到来前就已到期', () => {
    const events = run('probe_tick_st')
    expect(ticksOfEvent(events, 'StatusExpired', 'probe_tick_st')).toEqual([2])
    expect(ticksOfEvent(events, 'StatusMounted', 'probe_c')).toEqual([])
  })
})
