// H4 过滤伤害乘区：damage_mul / damage_taken_mul 的 filter 按本次伤害事件求值。
import { describe, expect, it } from 'vitest'
import { resolveDamage } from '../src/kernel/effect/damage-chain'
import { handleDamage, handleMountStatus } from '../src/kernel/effect/handlers'
import type { Element } from '../src/kernel/ids'
import type { StatusDef } from '../src/kernel/catalog/types'
import { makeUnit } from './helpers/fixture'
import { registryOf, stubContext } from './helpers/context'

const def = (id: string, modifiers: unknown, extra: Partial<StatusDef> = {}): StatusDef => ({
  id,
  name: id,
  category: ['buff'],
  dispelable: true,
  duration: null,
  maxStacks: 1,
  modifiers: modifiers as never,
  ...extra,
})

const mount = (unit: ReturnType<typeof makeUnit>, id: string, casterId?: string, extra = {}) => {
  unit.statuses.mount(id, { sourceId: 'test', duration: null, casterId, ...extra })
}

const hit = (raw: number, element: Element, attacker: ReturnType<typeof makeUnit>, defender: ReturnType<typeof makeUnit>) =>
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

  it('ally_damage_mul：友军光环按出伤方阵营生效，与自身乘区取最优', () => {
    const aura = def('sun', { ally_damage_mul: { mul: 1.15, filter: { targetHasStatus: ['mark'] } } })
    const own = def('own', { damage_mul: { value: 1.2 } })
    const mark = def('mark', {})
    const auraHolder = makeUnit('ally', 'A', {}, [aura])
    mount(auraHolder, 'sun')
    const a = makeUnit('a', 'A', {}, [aura, own])
    mount(a, 'own')
    const d = makeUnit('d', 'B', {}, [mark])
    mount(d, 'mark')
    const plain = makeUnit('plain', 'A', {}, [aura])
    const allUnits = () => [a, auraHolder, plain, d]
    expect(resolveDamage({ raw: 10, element: 'physical', attacker: a, defender: d, allUnits }).final).toBe(12)
    expect(resolveDamage({ raw: 10, element: 'physical', attacker: plain, defender: d, allUnits }).final).toBe(11.5)
    const d2 = makeUnit('d2', 'B')
    expect(resolveDamage({ raw: 10, element: 'physical', attacker: plain, defender: d2, allUnits }).final).toBe(10)
    // 光环持有者自己也吃光环
    const solo = makeUnit('solo', 'A', {}, [aura])
    mount(solo, 'sun')
    expect(resolveDamage({ raw: 10, element: 'physical', attacker: solo, defender: d, allUnits: () => [solo, d] }).final).toBe(11.5)
  })

  it('dynamic：按自身层数 / 引用他状态层数取值', () => {
    const own = def('dyn', { damage_mul: { dynamic: '1 + 0.1 * stacks' } }, { maxStacks: 5 })
    const a = makeUnit('a', 'A', {}, [own])
    mount(a, 'dyn', undefined, { stacks: 2 })
    expect(hit(10, 'physical', a, makeUnit('d', 'B'))).toBe(12)

    const mad = def('madness', {}, { maxStacks: 10 })
    const twisted = def('twist', { damage_mul: { dynamic: '1 + 0.08 * min(madness.stacks, 5)' } })
    const b = makeUnit('b', 'A', {}, [mad, twisted])
    mount(b, 'madness', undefined, { stacks: 6 })
    mount(b, 'twist')
    expect(hit(10, 'physical', b, makeUnit('d2', 'B'))).toBe(14)
  })

  it('dynamic：perCount 按持有状态计数、perStackOf 按指定状态层数', () => {
    const buff = (id: string) => def(id, {})
    const rule = def('rule', {
      damage_taken_mul: { dynamic: { perCount: { filter: { hasCategory: ['buff'] }, value: 0.1, cap: 0.4 } } },
    }, { category: ['debuff'] })
    const d = makeUnit('d', 'B', {}, [rule, buff('b1'), buff('b2'), buff('b3'), buff('b4'), buff('b5')])
    mount(d, 'rule')
    for (const id of ['b1', 'b2', 'b3']) mount(d, id)
    expect(hit(10, 'physical', makeUnit('a', 'A'), d)).toBe(13)
    for (const id of ['b4', 'b5']) mount(d, id)
    expect(hit(10, 'physical', makeUnit('a2', 'A'), d)).toBe(14)

    const insight = def('insight', {}, { maxStacks: 10 })
    const auth = def('auth', {
      damage_mul: [{ dynamic: { perStackOf: 'insight', value: 0.03, filter: { element: ['mental'] } } }],
    })
    const a = makeUnit('a3', 'A', {}, [insight, auth])
    mount(a, 'insight', undefined, { stacks: 4 })
    mount(a, 'auth')
    expect(hit(10, 'mental', a, makeUnit('d3', 'B'))).toBe(11.2)
    expect(hit(10, 'physical', a, makeUnit('d4', 'B'))).toBe(10)
  })

  it('condition：alive_allies / phase_is / caster_status_exists / field_status_count', () => {
    const mass = def('mass', { damage_mul: { value: 1.2, condition: { metric: 'alive_allies', cmp: '>=', value: 3 } } })
    const a = makeUnit('a', 'A', {}, [mass])
    mount(a, 'mass')
    const d = makeUnit('d', 'B')
    const three = () => [a, makeUnit('a2', 'A'), makeUnit('a3', 'A'), d]
    expect(resolveDamage({ raw: 10, element: 'physical', attacker: a, defender: d, allUnits: three }).final).toBe(12)
    expect(resolveDamage({ raw: 10, element: 'physical', attacker: a, defender: d, allUnits: () => [a, d] }).final).toBe(10)

    const night = def('night', { damage_mul: { value: 1.4, condition: { kind: 'phase_is', phases: ['night'] } } })
    const b = makeUnit('b', 'A', {}, [night])
    mount(b, 'night')
    expect(resolveDamage({ raw: 10, element: 'physical', attacker: b, defender: d, phase: 'night' }).final).toBe(14)
    expect(resolveDamage({ raw: 10, element: 'physical', attacker: b, defender: d, phase: 'day' }).final).toBe(10)

    const dwell = def('dwell', {})
    const sovereign = def('sov', { damage_mul: { value: 1.3, condition: { kind: 'caster_status_exists', id: 'dwell' } } })
    const c = makeUnit('c', 'A', {}, [dwell, sovereign])
    mount(c, 'sov')
    expect(hit(10, 'physical', c, d)).toBe(10)
    mount(c, 'dwell')
    expect(hit(10, 'physical', c, d)).toBe(13)

    const conf = def('conf', {
      damage_taken_mul: { value: 0.9, condition: { kind: 'field_status_count', id: 'unit_doppelganger_alive', cmp: '>=', n: 1 } },
    })
    const e = makeUnit('e', 'B', {}, [conf])
    mount(e, 'conf')
    const clone = makeUnit('clone', 'A')
    clone.unitDefId = 'unit_doppelganger'
    expect(resolveDamage({ raw: 10, element: 'physical', attacker: a, defender: e, allUnits: () => [a, e, clone] }).final).toBe(9)
    expect(resolveDamage({ raw: 10, element: 'physical', attacker: a, defender: e, allUnits: () => [a, e] }).final).toBe(10)
  })

  it('valueFromParams：从状态实例参数取乘数', () => {
    const notarize = def('notarize', { damage_mul: { valueFromParams: 'mul' } })
    const a = makeUnit('a', 'A', {}, [notarize])
    mount(a, 'notarize', undefined, { params: { mul: 1.5 } })
    expect(hit(10, 'physical', a, makeUnit('d', 'B'))).toBe(15)
    const b = makeUnit('b', 'A', {}, [notarize])
    mount(b, 'notarize')
    expect(hit(10, 'physical', b, makeUnit('d2', 'B'))).toBe(10)
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
