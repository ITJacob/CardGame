// H4 过滤伤害乘区：damage_mul / damage_taken_mul 的 filter 按本次伤害事件求值。
import { describe, expect, it } from 'vitest'
import { resolveDamage } from '../src/kernel/effect/damage-chain'
import { handleDamage, handleMountStatus } from '../src/kernel/effect/handlers'
import type { StatusDef } from '../src/kernel/catalog/types'
import { makeUnit } from './helpers/fixture'
import { registryOf, stubContext } from './helpers/context'

const def = (id: string, modifiers: unknown): StatusDef => ({
  id,
  name: id,
  category: ['buff'],
  dispelable: true,
  duration: null,
  maxStacks: 1,
  modifiers: modifiers as never,
})

const mount = (unit: ReturnType<typeof makeUnit>, id: string, casterId?: string, extra = {}) => {
  unit.statuses.mount(id, { sourceId: 'test', duration: null, casterId, ...extra })
}

const hit = (raw: number, element: 'physical' | 'holy' | 'fire' | 'ice', attacker: ReturnType<typeof makeUnit>, defender: ReturnType<typeof makeUnit>) =>
  resolveDamage({ raw, element, attacker, defender }).final

describe('H4 过滤伤害乘区', () => {
  it('element：只对匹配元素增伤', () => {
    const amp = def('amp', { damage_mul: { value: 1.5, filter: { element: ['holy'] } } })
    const a = makeUnit('a', 'A', {}, [amp])
    mount(a, 'amp')
    const d = makeUnit('d', 'B')
    expect(hit(10, 'holy', a, d)).toBe(15)
    expect(hit(10, 'physical', a, d)).toBe(10)
  })

  it('sourceUnitType：只对匹配来源类型减伤', () => {
    const ward = def('ward', { damage_taken_mul: { value: 0.5, filter: { sourceUnitType: ['UNDEAD'] } } })
    const d = makeUnit('d', 'B', {}, [ward])
    mount(d, 'ward')
    const undead = makeUnit('u', 'A')
    undead.unitType = 'UNDEAD'
    const spirit = makeUnit('s', 'A')
    spirit.unitType = 'SPIRIT'
    expect(hit(10, 'physical', undead, d)).toBe(5)
    expect(hit(10, 'physical', spirit, d)).toBe(10)
  })

  it('targetHasStatus：目标持有指定状态才增伤', () => {
    const amp = def('amp', { damage_mul: { value: 1.4, filter: { targetHasStatus: ['shield'] } } })
    const shield = def('shield', {})
    const a = makeUnit('a', 'A', {}, [amp])
    mount(a, 'amp')
    const d = makeUnit('d', 'B', {}, [shield])
    mount(d, 'shield')
    expect(hit(10, 'physical', a, d)).toBe(14)
    expect(hit(10, 'physical', a, makeUnit('d2', 'B'))).toBe(10)
  })

  it('statCompare：按位格比较（目标低于持有者）', () => {
    const amp = def('amp', { damage_mul: { value: 1.25, filter: { statCompare: { key: 'rank', cmp: '<' } } } })
    const a = makeUnit('a', 'A', {}, [amp])
    mount(a, 'amp')
    a.modifiers.set('rank', 'h4', 5)
    const low = makeUnit('low', 'B')
    low.modifiers.set('rank', 'h4', 3)
    const high = makeUnit('high', 'B')
    high.modifiers.set('rank', 'h4', 6)
    expect(hit(10, 'physical', a, low)).toBe(12.5)
    expect(hit(10, 'physical', a, high)).toBe(10)
  })

  it('anyOf：任一子过滤器成立即可', () => {
    const amp = def('amp', {
      damage_mul: { value: 1.2, filter: { anyOf: [{ unitType: ['SPIRIT'] }, { isSummon: true }] } },
    })
    const a = makeUnit('a', 'A', {}, [amp])
    mount(a, 'amp')
    const spirit = makeUnit('sp', 'B')
    spirit.unitType = 'SPIRIT'
    const summon = makeUnit('su', 'B')
    summon.summonerId = 'owner'
    expect(hit(10, 'physical', a, spirit)).toBe(12)
    expect(hit(10, 'physical', a, summon)).toBe(12)
    expect(hit(10, 'physical', a, makeUnit('plain', 'B'))).toBe(10)
  })

  it('caster：只对状态施加者的伤害生效', () => {
    const mark = def('mark', { damage_taken_mul: { value: 1.4, filter: { caster: 'status_caster' } } })
    const d = makeUnit('d', 'B', {}, [mark])
    mount(d, 'mark', 'a1')
    expect(hit(10, 'physical', makeUnit('a1', 'A'), d)).toBe(14)
    expect(hit(10, 'physical', makeUnit('a2', 'A'), d)).toBe(10)
  })

  it('recordedTargetOnly：只对记录的目标生效', () => {
    const mark = def('mark', { damage_mul: { value: 1.2, filter: { recordedTargetOnly: true } } })
    const a = makeUnit('a', 'A', {}, [mark])
    mount(a, 'mark', undefined, { binding: { recordedTarget: 'd1' } })
    expect(hit(10, 'physical', a, makeUnit('d1', 'B'))).toBe(12)
    expect(hit(10, 'physical', a, makeUnit('d2', 'B'))).toBe(10)
  })

  it('同状态多条乘区：各自过滤后再取最优', () => {
    const multi = def('multi', [
      { kind: 'damage_mul', value: 1.2, filter: { element: ['holy'] } },
      { kind: 'damage_mul', value: 1.4, filter: { element: ['physical'] } },
    ])
    const a = makeUnit('a', 'A', {}, [multi])
    mount(a, 'multi')
    const d = makeUnit('d', 'B')
    expect(hit(10, 'holy', a, d)).toBe(12)
    expect(hit(10, 'physical', a, d)).toBe(14)
    expect(hit(10, 'fire', a, d)).toBe(10)
  })

  it('gender / gaugeAbove / $variant.element', () => {
    const bully = def('bully', { damage_taken_mul: { value: 1.15, filter: { gender: 'male' } } })
    const md = makeUnit('m', 'B', {}, [bully], 'male')
    mount(md, 'bully')
    const fd = makeUnit('f', 'B', {}, [bully], 'female')
    mount(fd, 'bully')
    expect(hit(10, 'physical', makeUnit('a', 'A'), md)).toBe(11.5)
    expect(hit(10, 'physical', makeUnit('a2', 'A'), fd)).toBe(10)

    const gap = def('gap', { damage_mul: { value: 1.3, filter: { gaugeAbove: 70 } } })
    const a = makeUnit('a3', 'A', {}, [gap])
    mount(a, 'gap')
    const ready = makeUnit('r', 'B')
    ready.gauge.current = ready.gauge.threshold * 0.8
    const notReady = makeUnit('n', 'B')
    notReady.gauge.current = notReady.gauge.threshold * 0.5
    expect(hit(10, 'physical', a, ready)).toBe(13)
    expect(hit(10, 'physical', a, notReady)).toBe(10)

    const law = def('law', { damage_taken_mul: { value: 0.5, filter: { element: ['$variant.element'] } } })
    const fd2 = makeUnit('v', 'B', {}, [law])
    mount(fd2, 'law', undefined, { params: { variant: 'fire' } })
    expect(hit(10, 'fire', makeUnit('a4', 'A'), fd2)).toBe(5)
    expect(hit(10, 'ice', makeUnit('a5', 'A'), fd2)).toBe(10)
  })

  it('casterOwned：召唤者身上的承伤光环只保护自己的单位', () => {
    const aura = def('aura', {
      damage_taken_mul: { value: 0.85, filter: { unitType: ['UNDEAD'], casterOwned: true } },
    })
    const owner = makeUnit('owner', 'A', {}, [aura])
    mount(owner, 'aura', 'owner')
    // 运行时全单位共享同一份 statusDefs；测试夹具按单位建表，故召唤物也要带上光环定义
    const owned = makeUnit('owned', 'A', {}, [aura])
    owned.unitType = 'UNDEAD'
    owned.summonerId = 'owner'
    const foreign = makeUnit('foreign', 'A', {}, [aura])
    foreign.unitType = 'UNDEAD'
    foreign.summonerId = 'other'
    const units = new Map([owner, owned, foreign].map((u) => [u.id, u]))
    const lookup = (id: string) => units.get(id)
    const atk = makeUnit('atk', 'B')
    const r = (d: ReturnType<typeof makeUnit>) =>
      resolveDamage({ raw: 10, element: 'physical', attacker: atk, defender: d, unitById: lookup }).final
    expect(r(owned)).toBe(8.5)
    expect(r(foreign)).toBe(10)
    expect(r(owner)).toBe(10)
  })

  it('handleDamage 把伤害事件传进过滤乘区', () => {
    const amp = def('amp', { damage_mul: { value: 1.5, filter: { element: ['holy'] } } })
    const a = makeUnit('a', 'A', {}, [amp])
    mount(a, 'amp')
    const d = makeUnit('d', 'B')
    const ctx = stubContext(registryOf(a, d), a, [amp])
    handleDamage({ type: 'damage', value: 10, element: 'holy' } as never, d, ctx)
    expect(d.hp).toBe(25)   // 默认 strength 1 → hpMax 40，×1.5 后扣 15
    handleDamage({ type: 'damage', value: 10, element: 'physical' } as never, d, ctx)
    expect(d.hp).toBe(15)
  })

  it('mount_status.binding.recordedTarget 落成实例 id', () => {
    const mark = def('mark', { damage_mul: { value: 1.2, filter: { recordedTargetOnly: true } } })
    const a = makeUnit('a', 'A', {}, [mark])
    const d = makeUnit('d1', 'B')
    const ctx = stubContext(registryOf(a, d), a, [mark])
    // 卡片语境：状态挂在自己身上（target=self），binding 记录的是本次 Action 的目标
    ;(ctx as { targetScope?: unknown }).targetScope = {
      host: a, caster: a, targets: [d], secondary: [], attacker: null, killed: null, enemyFaction: 'B',
    }
    handleMountStatus(
      { type: 'mount_status', statusId: 'mark', binding: { recordedTarget: 'target' } } as never,
      a,
      ctx,
    )
    expect(a.statuses.byDef('mark')[0]?.grant.binding?.recordedTarget).toBe('d1')
  })
})
