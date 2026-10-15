// 卡片语境下效果级 target 求值（执行参数 §2.1c / 共享内核参数 §一 EffectRef.target 末条）：
// 技能卡自带的 EffectRef.target 以「施法者 + 该次选靶命中集合」为原点展开——
// self = 施法者（不是选靶）、群体简写按施法者阵营展开、splash_adjacent 以选靶为原点扩散。
// 旧行为：节点上的 target 被整个忽略，一律落在选靶上（给敌人回血、友军自伤）。
import { describe, expect, it } from 'vitest'
import { createCombat } from '../src/kernel'
import { buildCatalog } from '../src/data/catalogBuild'
import type { PathwayFile } from '../src/data/schema.types'
import type { CombatFacade } from '../src/kernel/combat/types'

interface Handle extends CombatFacade {
  diagnostic(): { warnings: readonly string[]; unsupported: number; unsupportedKinds: Record<string, number> }
}

const MARK = (id: string, name: string) => ({
  id, name, category: ['buff'], dispelable: false, duration: null, maxStacks: 1,
})

/** 出诊：选靶 1 个敌方前排，效果分五路落点 + 一次 board 量表写入 */
const TRIAGE: PathwayFile = {
  pathwayId: 'probe_card_target',
  pathwayName: '探针·卡片语境',
  sourceFile: 'probe',
  sourceVersion: 'test',
  cards: [
    {
      id: 'probe_triage', name: '分诊', kind: 'active', sequence: 1, sequenceName: 's1', rarity: 'common',
      axis: 'a', flagship: false, lore: '', flavor: '', describe: '', tentative: false,
      cost: { energy: 0, cooldown: 0, castTime: 0 }, reach: 'spell',
      target: { request: { faction: 'enemy', anchor: 'enemy_front', sort: 'index_asc', pickCount: 1 }, selectionMode: 'auto' },
      effects: [
        { type: 'mount_status', statusId: 'probe_on_self', duration: null, target: 'self' },
        { type: 'mount_status', statusId: 'probe_on_enemies', duration: null, target: 'all_enemies' },
        { type: 'mount_status', statusId: 'probe_on_allies', duration: null, target: 'all_allies' },
        { type: 'mount_status', statusId: 'probe_on_ally_excl', duration: null, target: 'allies_except_self' },
        { type: 'mount_status', statusId: 'probe_on_splash', duration: null, target: 'splash_adjacent' },
        { type: 'mount_status', statusId: 'probe_on_selection', duration: null },
        { type: 'modify_resource', resource: 'order', value: -1, mode: 'delta', target: 'board' },
      ],
      statusDefs: [
        MARK('probe_on_self', '自身标记'),
        MARK('probe_on_enemies', '敌方标记'),
        MARK('probe_on_allies', '友军标记'),
        MARK('probe_on_ally_excl', '友军除自身标记'),
        MARK('probe_on_splash', '溅射标记'),
        MARK('probe_on_selection', '选靶标记'),
      ],
    },
  ],
}

type Side = 'A' | 'B'
interface Slot { skills?: string[]; lane?: 'lane0' | 'lane1'; index?: number }

function unit(unitId: string, faction: Side, lane: 'lane0' | 'lane1', index: number, s: Slot = {}) {
  return {
    unitId,
    coordinate: { faction, lane, index },
    attributeSet: { strength: 1, agility: 1, intelligence: 1, rank: 0 },
    gender: 'male' as const,
    anchor: index,
    activeSlots: (s.skills ?? []).map((skillDefId) => ({ skillDefId })),
    passiveSlots: [],
    initialStatuses: [],
  }
}

/**
 * 站位由 Placement 压实（每路无空洞），故 index 只能表达先后、不能留空：
 * 甲 lane0 = u0(位 0，选靶命中) / u1(位 1，与 u0 同路相邻) / u2(位 2，与 u0 相离 2 格)；
 * 乙 u0 = lane0 位 0（施法者，与甲 u0 跨阵营同路同格=镜像对位、算相邻）；乙 u1 = lane1（与甲 u0 异路，不相邻）。
 */
const roster = {
  A: [unit('A_u0', 'A', 'lane0', 0), unit('A_u1', 'A', 'lane0', 1), unit('A_u2', 'A', 'lane0', 2)],
  B: [unit('B_u0', 'B', 'lane0', 0, { skills: ['probe_triage'] }), unit('B_u1', 'B', 'lane1', 0)],
}

function newCombat(): Handle {
  return createCombat({
    seed: 11,
    catalog: buildCatalog([TRIAGE]).catalog,
    board: { clock: { base: 0 }, domainGrants: [] },
    factions: [
      { id: 'A' as const, name: '甲', units: roster.A },
      { id: 'B' as const, name: '乙', units: roster.B },
    ],
    inputs: { decisions: new Map() },
  } as never) as unknown as Handle
}

const has = (c: CombatFacade, unitId: string, defId: string): boolean => {
  const u = c.state().units.find((x) => x.id === unitId)
  return !!u && u.statuses.some((s) => s.defId === defId)
}

function run(c: CombatFacade, ticks: number): void {
  for (let i = 0; i < ticks && !c.ended(); i += 1) c.step()
}

describe('卡片语境的 target 展开', () => {
  const c = newCombat()
  run(c, 12)

  it('self = 施法者本人，不是选靶（旧行为会把标记挂在被选中的敌人身上）', () => {
    expect(has(c, 'B_u0', 'probe_on_self')).toBe(true)
    expect(has(c, 'A_u0', 'probe_on_self')).toBe(false)
    expect(has(c, 'A_u1', 'probe_on_self')).toBe(false)
  })

  it('all_enemies / all_allies 按施法者阵营展开，不再等于选靶', () => {
    expect(has(c, 'A_u0', 'probe_on_enemies')).toBe(true)
    expect(has(c, 'A_u2', 'probe_on_enemies')).toBe(true) // 未被选中的敌人也吃
    expect(has(c, 'B_u0', 'probe_on_enemies')).toBe(false)
    expect(has(c, 'A_u0', 'probe_on_allies')).toBe(false)
    expect(has(c, 'B_u1', 'probe_on_allies')).toBe(true) // 远处友军也吃
    expect(has(c, 'B_u0', 'probe_on_allies')).toBe(true)
  })

  it('allies_except_self 排除施法者（旧行为会把友军增益打在敌人身上）', () => {
    expect(has(c, 'B_u1', 'probe_on_ally_excl')).toBe(true)
    expect(has(c, 'B_u0', 'probe_on_ally_excl')).toBe(false)
    expect(has(c, 'A_u0', 'probe_on_ally_excl')).toBe(false)
  })

  it('splash_adjacent 以选靶为原点扩散（同路相邻 + 跨阵营镜像对位），原点本身不含在内', () => {
    expect(has(c, 'A_u1', 'probe_on_splash')).toBe(true) // 同阵营同路相邻
    expect(has(c, 'B_u0', 'probe_on_splash')).toBe(true) // 跨阵营同路同格（镜像对位）
    expect(has(c, 'A_u0', 'probe_on_splash')).toBe(false) // 原点不含自身
    expect(has(c, 'A_u2', 'probe_on_splash')).toBe(false) // 同路但相离 2 格
    expect(has(c, 'B_u1', 'probe_on_splash')).toBe(false) // 异路
  })

  it('不带 target 的节点仍落在选靶上（继承语义不变）', () => {
    expect(has(c, 'A_u0', 'probe_on_selection')).toBe(true)
    expect(has(c, 'B_u0', 'probe_on_selection')).toBe(false)
  })

  it('board 锚点不寻址单位、也不计未支持（旧行为会退化成宿主并报 payload:board）', () => {
    const diag = c.diagnostic()
    expect(diag.unsupportedKinds['target:board']).toBeUndefined()
    expect(diag.warnings.filter((w) => w.includes('board'))).toEqual([])
  })
})
