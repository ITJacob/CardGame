// 状态修饰袋读取（编队参数 §2.2/§2.4）。
// 真实数据的 `statusDef.modifiers` 有两种形态：
//   ① 映射：{ damage_taken_mul: 0.85, gaugeRateMul: 1.1, untargetableByTargeted: {…} }
//   ② 列表：[{ kind: 'damage_mul', value: 1.2 }, …]
// 数值可为 number 或 { value | mul | ratio }。
import type { ModifierSet, StatusDef } from '../catalog/types'

interface ModifierEntryObj {
  kind?: string
  value?: number
  mul?: number
  ratio?: number
}

/** 取某修饰键的数值（乘数语义）；非数值/不存在返回 null */
export function numericModifier(modifiers: unknown, key: string): number | null {
  if (!modifiers) return null
  if (Array.isArray(modifiers)) {
    for (const raw of modifiers) {
      if (typeof raw === 'string') continue
      const e = raw as ModifierEntryObj
      if (e?.kind !== key) continue
      return firstNumber(e.value, e.mul, e.ratio)
    }
    return null
  }
  if (typeof modifiers === 'object') {
    const v = (modifiers as Record<string, unknown>)[key]
    return asNumber(v)
  }
  return null
}

/** 取某修饰键的原始值（可为对象）；不存在返回 undefined */
export function rawModifier(modifiers: ModifierSet | undefined, key: string): unknown {
  if (!modifiers) return undefined
  if (Array.isArray(modifiers)) {
    for (const raw of modifiers) {
      if (typeof raw === 'string') continue
      const e = raw as ModifierEntryObj
      if (e?.kind === key) return e.value ?? e.mul ?? e.ratio
    }
    return undefined
  }
  return (modifiers as Record<string, unknown>)[key]
}

function firstNumber(...vals: (number | undefined)[]): number | null {
  for (const v of vals) if (typeof v === 'number' && Number.isFinite(v)) return v
  return null
}

function asNumber(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (v && typeof v === 'object') {
    const o = v as ModifierEntryObj
    return firstNumber(o.value, o.mul, o.ratio)
  }
  return null
}

/** 判定某状态定义是否带某修饰键（含对象型） */
export function hasModifier(def: StatusDef | undefined, key: string): boolean {
  return rawModifier(def?.modifiers, key) !== undefined
}
