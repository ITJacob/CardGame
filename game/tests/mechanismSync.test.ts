// 数据机制收口后的 game 端同步：modify_resource(swap) 与 BehaviorModifier target_override。
import { describe, expect, it } from 'vitest'
import { handleModifyResource } from '../src/kernel/effect/handlers'
import type { StatusDef } from '../src/kernel/catalog/types'
import type { TargetScope } from '../src/kernel/effect/target-scope'
import { makeUnit } from './helpers/fixture'
import { registryOf, stubContext } from './helpers/context'

describe('机制收口后的 game 端同步', () => {
  it('modify_resource(mode:swap) 按 between 交换两名单位的资源', () => {
    const a = makeUnit('a', 'A')
    const b = makeUnit('b', 'B')
    a.pool('armor').applyDelta(5)
    b.pool('armor').applyDelta(2)
    const scope: TargetScope = {
      host: a, caster: a, targets: [b], secondary: [],
      attacker: null, killed: null, enemyFaction: 'B',
    }
    const ctx = { ...stubContext(registryOf(a, b), a), targetScope: scope }
    handleModifyResource({
      type: 'modify_resource', resource: 'armor', mode: 'swap', between: ['self', 'target'],
    } as never, null, ctx)
    expect(a.pool('armor').current).toBe(2)
    expect(b.pool('armor').current).toBe(5)
  })

  it('持态 BehaviorModifier target_override 可被选靶层读取', () => {
    const def: StatusDef = {
      id: 's', name: 's', category: ['buff'], dispelable: false, duration: null,
      behaviorModifiers: [{ op: 'target_override', anchor: 'first_empty' }],
    }
    const u = makeUnit('u', 'A', {}, [def])
    u.statuses.mount('s', { sourceId: 'x' })
    expect(u.activeTargetOverride()).toEqual({ anchor: 'first_empty', faction: undefined, sort: undefined })
  })
})
