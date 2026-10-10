// 卡面纯函数：边框取档 / 降级目标 / 卡面骨架 / 详情浮层内容。
// 都是拼字符串，不需要 DOM；hydrateArt 的降级链留给 Playwright 实测。
import { describe, expect, it } from 'vitest'
import { cardArtUrl, cardDetailHtml, cardFaceHtml, frameFallbackUrl, frameUrl } from '../src/ui/components/cardFace'
import type { BehaviorTemplate, Catalog, SkillDef } from '../src/kernel/catalog/types'

function fakeCatalog(parts: { skills?: SkillDef[]; templates?: BehaviorTemplate[]; classes?: [string, string][] }): Catalog {
  return {
    skillDefs: new Map((parts.skills ?? []).map((d) => [d.id, d])),
    behaviorTemplates: new Map((parts.templates ?? []).map((d) => [d.id, d])),
    classDefs: new Map((parts.classes ?? []).map(([id, name]) => [id, { id, name }])),
  } as unknown as Catalog
}

describe('frameUrl 稀有度取档', () => {
  it('common/uncommon/rare 走全局三张，与途径无关', () => {
    expect(frameUrl('common')).toBe('./site/assets/frames/frame-common.png')
    expect(frameUrl('uncommon', 'sleepless')).toBe('./site/assets/frames/frame-uncommon.png')
    expect(frameUrl('rare')).toBe('./site/assets/frames/frame-rare.png')
  })

  it('epic/legendary 按途径出图', () => {
    expect(frameUrl('epic', 'sleepless')).toBe('./site/assets/frames/frame-sleepless-epic.png')
    expect(frameUrl('legendary', 'seer')).toBe('./site/assets/frames/frame-seer-legendary.png')
  })

  it('未知稀有度退回 common；epic 缺途径时退回 rare（不留空 src）', () => {
    expect(frameUrl('mythic')).toBe('./site/assets/frames/frame-common.png')
    expect(frameUrl('epic')).toBe('./site/assets/frames/frame-rare.png')
    expect(frameUrl('legendary', '')).toBe('./site/assets/frames/frame-rare.png')
  })
})

describe('frameFallbackUrl 降级目标', () => {
  it('只有 epic/legendary 有第二步目标，其余为 null', () => {
    expect(frameFallbackUrl('epic')).toBe('./site/assets/frames/frame-rare.png')
    expect(frameFallbackUrl('legendary')).toBe('./site/assets/frames/frame-rare.png')
    expect(frameFallbackUrl('common')).toBeNull()
    expect(frameFallbackUrl('uncommon')).toBeNull()
    expect(frameFallbackUrl('rare')).toBeNull()
    expect(frameFallbackUrl('mythic')).toBeNull()
  })
})

describe('cardFaceHtml 骨架', () => {
  const face = (opts: Parameters<typeof cardFaceHtml>[0]): string => cardFaceHtml(opts)

  it('卡图/边框/信息条各一层，且带稀有度与主被类', () => {
    const html = face({ cardId: 'c1', name: '低语', rarity: 'epic', pathwayId: 'sleepless', kind: 'passive' })
    expect(html.match(/data-art/g)).toHaveLength(1)
    expect(html.match(/data-frame/g)).toHaveLength(2) // 一处属性 + 一处 data-frame-fallback
    expect(html.match(/class="card-info"/g)).toHaveLength(1)
    expect(html).toContain('class="card-face r-epic k-passive"')
    expect(html).toContain(`src="${cardArtUrl('c1')}"`)
    expect(html).toContain('./site/assets/frames/frame-rare.png') // epic 的降级目标
  })

  it('信息条只有名字与费用：不再单挂「主/被」角标', () => {
    const active = face({ cardId: 'a', name: 'A', kind: 'active', cost: 2 })
    const passive = face({ cardId: 'b', name: 'B', kind: 'passive' })
    for (const html of [active, passive]) expect(html).not.toContain('ci-kind')
    expect(active).toContain('class="ci-cost"')
    expect(passive).not.toContain('ci-cost')
    // 主/被动靠 ⚡ 的有无分辨，k-<kind> 类只当样式/测试锚
    expect(active).toContain('k-active')
    expect(passive).toContain('k-passive')
  })

  it('主动有费用角标，被动与无费用主动都不出', () => {
    expect(face({ cardId: 'a', name: 'A', kind: 'active', cost: 3 })).toContain('⚡3')
    expect(face({ cardId: 'b', name: 'B', kind: 'active', cost: 0 })).toContain('⚡0')
    expect(face({ cardId: 'c', name: 'C', kind: 'active' })).not.toContain('⚡')
    expect(face({ cardId: 'd', name: 'D', kind: 'passive', cost: 2 })).not.toContain('⚡')
  })

  it('full 档只加一个 full 类，compact 是默认', () => {
    expect(face({ cardId: 'a', name: 'A', size: 'full' })).toContain('card-face r-common k-active full')
    expect(face({ cardId: 'a', name: 'A' })).toContain('card-face r-common k-active"')
  })

  it('名字与 id 都转义，不破结构', () => {
    const html = face({ cardId: 'x"><b', name: '<img>' })
    expect(html).toContain('&lt;img&gt;')
    expect(html).toContain('data-card="x&quot;&gt;&lt;b"')
  })

  it('默认渲染 figure + figcaption（名册 / 技能槽的只读档）', () => {
    const html = face({ cardId: 'a', name: 'A' })
    expect(html).toContain('<figure')
    expect(html).toContain('<figcaption class="card-info">')
    expect(html).not.toContain('<button')
    expect(html).not.toContain('card-corner')
    expect(html).not.toContain(' dim')
  })

  it('as:button 时卡面本身即按钮：type/attrs 落在根上，信息条换 div，不再套外层', () => {
    const html = face({ cardId: 'a', name: 'A', as: 'button', attrs: 'data-equip="active:a" aria-disabled="true"' })
    expect(html).toContain('<button type="button" data-equip="active:a" aria-disabled="true" class="card-face')
    expect(html).toContain('<div class="card-info">')
    expect(html).not.toContain('<figure')
    // 整页只此一个 data-card（不再有外层包裹元素 → 不会一次点击翻两次）
    expect(html.match(/data-card=/g)).toHaveLength(1)
  })

  it('corner 出右上角角标、dim 出置灰类', () => {
    const locked = face({ cardId: 'a', name: 'A', as: 'button', corner: '🔒', dim: true })
    expect(locked).toContain('<span class="card-corner">🔒</span>')
    expect(locked).toContain('class="card-face r-common k-active dim"')
    const on = face({ cardId: 'b', name: 'B', as: 'button', corner: '✓' })
    expect(on).toContain('✓')
    expect(on).not.toContain(' dim')
  })
})

describe('cardDetailHtml 详情浮层', () => {
  const skill: SkillDef = {
    id: 'sk1', sourceCardId: 'sk1', pathwayId: 'sleepless', name: '低语',
    rarity: 'rare', axis: 'offense', describe: '对目标造成 6 点伤害。',
    sequence: 7, sequenceName: '安眠', flavor: '别听。',
    tags: ['direct'],
  } as unknown as SkillDef

  it('主动：描述 + 费用明细 + 序列/途径徽章', () => {
    const cat = fakeCatalog({ skills: [{ ...skill, cost: { energy: 3, cooldown: 5, castTime: null } as SkillDef['cost'] }], classes: [['sleepless', '不眠者']] })
    const html = cardDetailHtml(cat, 'sk1')
    expect(html).toContain('低语')
    expect(html).toContain('对目标造成 6 点伤害。')
    expect(html).toContain('序列7 · 安眠')
    expect(html).toContain('不眠者')
    expect(html).toContain('稀有')
    expect(html).toContain('主动')
    expect(html).toContain('direct')
    expect(html).toContain('别听。')
    expect(html).toContain('<dd>3</dd>')
    expect(html).toContain('<dd>5 tick</dd>')
    expect(html).toContain('<dd>—</dd>') // 吟唱缺省
  })

  it('被动：走 hook 触发点，且标明被动', () => {
    const tpl = {
      id: 'tp1', sourceCardId: 'tp1', pathwayId: 'seer', name: '预感', rarity: 'uncommon',
      axis: 'defense', hook: ['on_tick'], tags: [],
    } as unknown as BehaviorTemplate
    const html = cardDetailHtml(fakeCatalog({ templates: [tpl] }), 'tp1')
    expect(html).toContain('被动')
    expect(html).toContain('on_tick')
    expect(html).toContain('精良')
  })

  it('查不到定义返回 null（不弹浮层）', () => {
    expect(cardDetailHtml(fakeCatalog({}), 'nope')).toBeNull()
  })
})
