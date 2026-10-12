// 秘仪阵的降级判定是纯函数，放在 node 环境里跑（不引 jsdom）：
// 现有 13 个测试文件都在这个环境里，新增模块必须保持顶层无 DOM 副作用。
import { describe, expect, it, vi, afterEach } from 'vitest'
import { decideQuality, readCapability } from '../src/ui/effects/arcane-bg'

function envOf(o: { reduce?: boolean; saveData?: boolean; mem?: number | null; cores?: number | null }) {
  return {
    matchMedia: () => ({ matches: o.reduce === true }),
    navigator: {
      hardwareConcurrency: o.cores ?? undefined,
      deviceMemory: o.mem ?? undefined,
      connection: o.saveData == null ? undefined : { saveData: o.saveData },
    } as unknown as Navigator,
  }
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('arcane-bg 降级判定', () => {
  it('正常桌面档不降级', () => {
    const cap = readCapability(envOf({ reduce: false, saveData: false, mem: 8, cores: 8 }))
    expect(cap).toEqual({ reducedMotion: false, saveData: false, deviceMemory: 8, hardwareConcurrency: 8 })
    expect(decideQuality(cap)).toEqual({ low: false, reason: 'normal' })
  })

  it('reduced-motion → 静态档', () => {
    const cap = readCapability(envOf({ reduce: true, mem: 8, cores: 8 }))
    expect(decideQuality(cap)).toEqual({ low: true, reason: 'reduced-motion' })
  })

  it('Save-Data → 静态档', () => {
    const cap = readCapability(envOf({ reduce: false, saveData: true, mem: 8, cores: 8 }))
    expect(cap.saveData).toBe(true)
    expect(decideQuality(cap)).toEqual({ low: true, reason: 'save-data' })
  })

  it('低内存 + 低核数 → 静态档', () => {
    const cap = readCapability(envOf({ mem: 4, cores: 4 }))
    expect(decideQuality(cap)).toEqual({ low: true, reason: 'low-device' })
  })

  it('只有低内存、核数正常 → 不降级（单一弱信号不足以判 low）', () => {
    const cap = readCapability(envOf({ mem: 2, cores: 12 }))
    expect(decideQuality(cap).low).toBe(false)
  })

  it('缺 deviceMemory 且核数 ≤2 → 静态档', () => {
    const cap = readCapability(envOf({ mem: null, cores: 2 }))
    expect(cap.deviceMemory).toBeNull()
    expect(decideQuality(cap)).toEqual({ low: true, reason: 'low-cores' })
  })

  it('能力 API 全缺失 → 不降级，且不抛错', () => {
    const cap = readCapability({})
    expect(cap).toEqual({ reducedMotion: false, saveData: false, deviceMemory: null, hardwareConcurrency: null })
    expect(decideQuality(cap)).toEqual({ low: false, reason: 'normal' })
  })

  it('没有 window/document 时 readCapability 也能跑（node 环境）', () => {
    expect(typeof window).toBe('undefined')
    expect(() => readCapability()).not.toThrow()
  })
})
