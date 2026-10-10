import { describe, expect, it } from 'vitest'
import {
  createMemoryMatchStore, sortRecords, summarize, type MatchRecord,
} from '../src/meta/matchLog'
import { unlockCard, unlockClass, newProfile } from '../src/meta/progression'

function rec(over: Partial<MatchRecord>): MatchRecord {
  return {
    id: Math.random().toString(36),
    at: 1_700_000_000_000,
    seed: 1,
    outcome: 'side_a',
    win: true,
    ticks: 100,
    unitsLostOwn: 0,
    unitsLostEnemy: 3,
    damageDealtOwn: 0,
    damageDealtEnemy: 0,
    heroes: [],
    ...over,
  }
}

describe('P6 战绩与档案', () => {
  it('战绩追加/读取/清空（最新在前）', () => {
    const store = createMemoryMatchStore()
    store.append(rec({ id: 'a' }))
    store.append(rec({ id: 'b' }))
    expect(store.all().map((r) => r.id)).toEqual(['b', 'a'])
    store.clear()
    expect(store.all()).toEqual([])
  })

  it('榜序：胜优先 → 阵亡少 → 用时短', () => {
    const lose = rec({ id: 'lose', win: false, outcome: 'side_b' })
    const winSlow = rec({ id: 'slow', win: true, ticks: 300 })
    const winFast = rec({ id: 'fast', win: true, ticks: 40 })
    const winHurt = rec({ id: 'hurt', win: true, ticks: 10, unitsLostOwn: 2 })
    // 胜者内部：阵亡少优先 → 用时短优先；负者在最后
    expect(sortRecords([lose, winSlow, winFast, winHurt]).map((r) => r.id)).toEqual(['fast', 'slow', 'hurt', 'lose'])
  })

  it('汇总统计', () => {
    const s = summarize([rec({}), rec({ win: false, outcome: 'side_b' }), rec({ win: false, outcome: 'draw' })])
    expect(s).toMatchObject({ matches: 3, wins: 1, losses: 1, draws: 1 })
    expect(s.winRate).toBeCloseTo(1 / 3, 6)
  })

  it('档案：解锁幂等 + 可序列化往返', () => {
    const p = unlockCard(unlockClass(newProfile('sleepless'), 'arbiter'), 'skill_x')
    expect(p.unlockedClasses).toEqual(['sleepless', 'arbiter'])
    expect(p.unlockedCards).toEqual(['skill_x'])
    expect(JSON.parse(JSON.stringify(p))).toEqual(p)
  })
})
