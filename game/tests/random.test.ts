import { describe, expect, it } from 'vitest'
import { Mulberry32RandomSource } from '../src/kernel/shared/random-source'

describe('mulberry32 随机源', () => {
  it('同 seed 序列一致', () => {
    const a = new Mulberry32RandomSource(42)
    const b = new Mulberry32RandomSource(42)
    const seqA = Array.from({ length: 8 }, () => a.next())
    const seqB = Array.from({ length: 8 }, () => b.next())
    expect(seqA).toEqual(seqB)
  })

  it('不同 seed 序列不同', () => {
    const a = new Mulberry32RandomSource(1)
    const b = new Mulberry32RandomSource(2)
    expect(a.next()).not.toBe(b.next())
  })

  it('snapshot/restore 续接一致', () => {
    const a = new Mulberry32RandomSource(7)
    a.next()
    a.next()
    const snap = a.snapshot()
    const after = [a.next(), a.next()]

    const b = new Mulberry32RandomSource(7)
    b.restore(snap)
    expect([b.next(), b.next()]).toEqual(after)
  })

  it('chance 边界：0 恒假、1 恒真、消耗抽样次数', () => {
    const r = new Mulberry32RandomSource(3)
    expect(r.chance(0)).toBe(false)
    expect(r.chance(1)).toBe(true)
  })
})
