// 「出手即破 + self_turn 时长」口径验证（不眠者潜匿族）：
//   1. 破隐触发器挂在 on_attack / on_active_skill 上，fire 时机在效果结算**之后**（本轮仍吃潜匿收益）
//   2. 潜匿在持有者出手前一直存在（不是被 tick 磨掉的）
//   3. dispel 用平铺 statusId/count（非 filter.statusId）——引擎只认平铺选择器
import { describe, expect, it } from 'vitest'
import { createCombat } from '../src/kernel'
import { buildCatalog } from '../src/data/catalogBuild'
import type { PathwayFile } from '../src/data/schema.types'
import type { CombatFacade, DomainEvent } from '../src/kernel/combat/types'

// 探针：把 covert_veil 的写法照搬过来——self_turn 时长 + on_attack/on_active_skill 双挂 dispel
const PROBE: PathwayFile = {
  pathwayId: 'probe',
  pathwayName: '探针',
  sourceFile: 'probe',
  sourceVersion: 'test',
  cards: [
    {
      id: 'brk_strike', name: '出击', kind: 'active', sequence: 2, sequenceName: 's2', rarity: 'common',
      axis: 'a', flagship: false, lore: '', flavor: '', describe: '', tentative: false,
      cost: { energy: 0, cooldown: 0, castTime: null }, reach: 'melee',
      target: {
        request: { faction: 'enemy', anchor: 'enemy_front', sort: 'index_asc', pickCount: 1 },
        selectionMode: 'auto',
      },
      effects: [{ type: 'damage', value: 5, element: 'physical' }],
    },
    {
      id: 'brk_veil_card', name: '破隐探针', kind: 'passive', sequence: 1, sequenceName: 's1', rarity: 'common',
      axis: 'a', flagship: false, lore: '', flavor: '', describe: '', tentative: false,
      hook: ['on_battle_start'],
      effects: [{ type: 'mount_status', statusId: 'brk_veil', duration: null, target: 'self' }],
      statusDefs: [
        {
          id: 'brk_veil', name: '潜匿探针', category: ['conceal'], dispelable: true,
          duration: 3, durationUnit: 'self_turn', maxStacks: 1, stackPolicy: 'refresh',
          triggers: [
            {
              event: 'on_attack',
              effects: [
                { type: 'dispel', target: 'self', dispelTarget: 'unit', statusId: 'brk_veil', count: 1 },
                { type: 'mount_status', statusId: 'brk_broke', duration: 9999, target: 'self' },
              ],
            },
            {
              event: 'on_active_skill',
              effects: [
                { type: 'dispel', target: 'self', dispelTarget: 'unit', statusId: 'brk_veil', count: 1 },
                { type: 'mount_status', statusId: 'brk_broke', duration: 9999, target: 'self' },
              ],
            },
          ],
        },
        { id: 'brk_broke', name: '已破隐', category: ['buff'], dispelable: false, duration: 9999, maxStacks: 1, stackPolicy: 'refresh' },
      ],
    },
  ],
}

function buildSetup(seed: number) {
  const catalog = buildCatalog([PROBE]).catalog
  const makeUnits = (faction: 'A' | 'B') => [
    {
      unitId: `${faction}_u0`,
      coordinate: { faction, lane: 'lane0' as const, index: 0 },
      attributeSet: { strength: 1, agility: 0, intelligence: 0, rank: 0 },
      gender: 'male' as const,
      anchor: 0,
      activeSlots: [{ skillDefId: 'brk_strike' }],
      passiveSlots: [{ defId: 'brk_veil_card' }],
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

const indexOfEvent = (events: readonly DomainEvent[], pred: (e: DomainEvent) => boolean): number =>
  events.findIndex(pred)

describe('出手即破 + self_turn 时长（潜匿口径）', () => {
  it('出手前潜匿还在，出手后破除；破隐 fire 在效果结算之后', () => {
    const c = createCombat(buildSetup(5) as never)
    // 敏捷 0 → 首次出手机会在 tick 6；走到 tick 5（出手前）应仍持有潜匿
    for (let i = 0; i < 5; i += 1) c.step()
    expect(hasStatus(c, 'A_u0', 'brk_veil')).toBe(true)
    expect(hasStatus(c, 'A_u0', 'brk_broke')).toBe(false)

    // 走到 tick 6（首次出手）之后
    for (let i = 0; i < 2; i += 1) c.step()
    const events = c.ended()?.events ?? c.drainEvents()

    expect(hasStatus(c, 'A_u0', 'brk_veil')).toBe(false)
    expect(hasStatus(c, 'A_u0', 'brk_broke')).toBe(true)

    // 「结算后破」：本次行动造成伤害的事件，必须排在破隐标记挂载之前
    const damageAt = indexOfEvent(events, (e) => e.type === 'EffectApplied')
    const brokeAt = indexOfEvent(events, (e) => e.type === 'StatusMounted' && e.defId === 'brk_broke')
    expect(damageAt).toBeGreaterThanOrEqual(0)
    expect(brokeAt).toBeGreaterThan(damageAt)
  })

  it('潜匿不因未出手而被 tick 磨掉：3 个自身回合的时长在首次机会只扣 1', () => {
    const c = createCombat(buildSetup(5) as never)
    for (let i = 0; i < 5; i += 1) c.step()
    // tick 5 已过（tick 口径下 3 早就到期），self_turn 口径下仍剩 2
    expect(hasStatus(c, 'A_u0', 'brk_veil')).toBe(true)
    const events = c.drainEvents()
    expect(indexOfEvent(events, (e) => e.type === 'StatusExpired' && e.defId === 'brk_veil')).toBe(-1)
  })
})
