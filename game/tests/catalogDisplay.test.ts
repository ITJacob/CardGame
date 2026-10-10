// 卡面展示字段（describe/sequence/sequenceName/flavor）在编目编译后必须保留：
// 卡面详情浮层靠它们，但战斗只用 effects/triggers——所以是「透传即可」的一类字段，
// 只有一处 `base` 在写，最容易被后续重构无声抹掉，钉一条测试。
import { describe, expect, it } from 'vitest'
import { buildCatalog } from '../src/data/catalogBuild'
import type { PathwayFile } from '../src/data/schema.types'

const FILE: PathwayFile = {
  pathwayId: 'px',
  pathwayName: '展示途径',
  sourceFile: 'px',
  sourceVersion: 'test',
  cards: [
    {
      id: 'px_active',
      name: '主动卡',
      kind: 'active',
      sequence: 12,
      sequenceName: '第十二序列',
      rarity: 'rare',
      axis: 'offense',
      flagship: false,
      lore: '不该进游戏端',
      flavor: '风起于青萍之末。',
      describe: '对一名敌人造成 6 点伤害。',
      tentative: false,
      cost: { energy: 3, cooldown: 5, castTime: null },
      reach: 'melee',
      target: { request: { faction: 'enemy', anchor: 'enemy_front', sort: 'index_asc', pickCount: 1 }, selectionMode: 'auto' },
      effects: [{ type: 'damage', value: 6, element: 'physical' }],
    },
    {
      id: 'px_passive',
      name: '被动卡',
      kind: 'passive',
      sequence: 4,
      sequenceName: '第四序列',
      rarity: 'uncommon',
      axis: 'defense',
      flagship: false,
      lore: '',
      flavor: '常伴身旁。',
      describe: '战斗开始时获得 10 点物理抗性。',
      tentative: false,
      hook: ['on_battle_start'],
      effects: [{ type: 'modify_stat', stat: 'resist:physical', mode: 'delta', value: 10, duration: null, target: 'self' }],
    },
  ],
}

describe('编目编译保留卡面展示字段', () => {
  const { catalog } = buildCatalog([FILE])

  it('主动卡：SkillDef 上四项都在', () => {
    const def = catalog.skillDefs.get('px_active')
    expect(def).toBeDefined()
    expect(def?.describe).toBe('对一名敌人造成 6 点伤害。')
    expect(def?.sequence).toBe(12)
    expect(def?.sequenceName).toBe('第十二序列')
    expect(def?.flavor).toBe('风起于青萍之末。')
  })

  it('被动卡：BehaviorTemplate 上四项都在', () => {
    const tpl = catalog.behaviorTemplates.get('px_passive')
    expect(tpl).toBeDefined()
    expect(tpl?.describe).toBe('战斗开始时获得 10 点物理抗性。')
    expect(tpl?.sequence).toBe(4)
    expect(tpl?.sequenceName).toBe('第四序列')
    expect(tpl?.flavor).toBe('常伴身旁。')
  })

  it('lore 不透传（最长、详情也不显示）', () => {
    expect((catalog.skillDefs.get('px_active') as unknown as Record<string, unknown>).lore).toBeUndefined()
  })
})
