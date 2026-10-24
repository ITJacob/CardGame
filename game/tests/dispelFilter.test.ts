// dispel 选择器：嵌套 filter 优先于平铺字段；unit/domain 分支分流。
import { describe, expect, it, vi } from 'vitest'
import type { EffDispel, StatusDef } from '../src/kernel/catalog/types'
import { handleDispel } from '../src/kernel/effect/handlers2'
import { makeUnit } from './helpers/fixture'
import { registryOf, stubContext } from './helpers/context'

const BUFF: StatusDef = { id: 'buff_a', category: ['buff'], dispelable: true, duration: 5, maxStacks: 1 }
const DEBUFF: StatusDef = { id: 'debuff_a', category: ['debuff'], dispelable: true, duration: 5, maxStacks: 1 }
const LOCKED: StatusDef = { id: 'locked_a', category: ['buff'], dispelable: false, duration: 5, maxStacks: 1 }

function setup() {
  const u = makeUnit('u', 'B', {}, [BUFF, DEBUFF, LOCKED])
  u.statuses.mount('buff_a', { sourceId: 's1' })
  u.statuses.mount('debuff_a', { sourceId: 's2' })
  u.statuses.mount('locked_a', { sourceId: 's3' })
  return { u, ctx: stubContext(registryOf(u), null, [BUFF, DEBUFF, LOCKED]) }
}

describe('dispel 嵌套 filter', () => {
  it('category + count：只清指定类别且不超过数量', () => {
    const { u, ctx } = setup()
    handleDispel({ type: 'dispel', filter: { category: ['buff'], count: 1 } }, u, ctx)
    expect(u.statuses.has('buff_a')).toBe(false)
    expect(u.statuses.has('debuff_a')).toBe(true)
    expect(u.statuses.has('locked_a')).toBe(true)
  })

  it('dispelable:true 只清可驱散状态', () => {
    const { u, ctx } = setup()
    handleDispel({ type: 'dispel', filter: { category: ['buff'], dispelable: true } }, u, ctx)
    expect(u.statuses.has('buff_a')).toBe(false)
    expect(u.statuses.has('locked_a')).toBe(true)
  })

  it('statusId 精确点名', () => {
    const { u, ctx } = setup()
    handleDispel({ type: 'dispel', filter: { statusId: 'debuff_a' } }, u, ctx)
    expect(u.statuses.has('debuff_a')).toBe(false)
    expect(u.statuses.has('buff_a')).toBe(true)
  })

  it('平铺字段仍兼容（无 filter 时）', () => {
    const { u, ctx } = setup()
    handleDispel({ type: 'dispel', category: ['debuff'] }, u, ctx)
    expect(u.statuses.has('debuff_a')).toBe(false)
    expect(u.statuses.has('buff_a')).toBe(true)
  })
})

describe('dispel 分支分流', () => {
  it('unitId → 召唤物销毁分支', () => {
    const u = makeUnit('u', 'B')
    const dispelSummons = vi.fn()
    const ctx = stubContext(registryOf(u), u, [], { dispelSummons })
    handleDispel({ type: 'dispel', dispelTarget: 'unit', filter: { unitId: 'unit_bat', count: 2 } } as EffDispel, u, ctx)
    expect(dispelSummons).toHaveBeenCalledWith(u, { unitId: 'unit_bat', ownOnly: false, count: 2 })
  })

  it('isOwnSummon → 限定归属', () => {
    const u = makeUnit('u', 'B')
    const dispelSummons = vi.fn()
    const ctx = stubContext(registryOf(u), u, [], { dispelSummons })
    handleDispel({ type: 'dispel', filter: { isOwnSummon: true } } as EffDispel, u, ctx)
    expect(dispelSummons).toHaveBeenCalledWith(u, { unitId: undefined, ownOnly: true, count: undefined })
  })

  it('domain + tier → 解除界域', () => {
    const u = makeUnit('u', 'B')
    const dispelDomain = vi.fn()
    const ctx = stubContext(registryOf(u), u, [], { dispelDomain })
    handleDispel({ type: 'dispel', dispelTarget: 'domain', filter: { tier: 'overlay' } } as EffDispel, u, ctx)
    expect(dispelDomain).toHaveBeenCalledWith('overlay', undefined)
  })
})
