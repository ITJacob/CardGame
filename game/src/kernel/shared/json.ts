// 弱类型参数访问工具。移植自 7e6d01f:src/shared/json.ts。

export type JsonValue = string | number | boolean | null | JsonValue[] | { [k: string]: JsonValue }
export type Params = Record<string, unknown>

export function num(p: Params | undefined, key: string, fallback = 0): number {
  const v = p?.[key]
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback
}

export function str(p: Params | undefined, key: string, fallback = ''): string {
  const v = p?.[key]
  return typeof v === 'string' ? v : fallback
}

export function bool(p: Params | undefined, key: string, fallback = false): boolean {
  const v = p?.[key]
  return typeof v === 'boolean' ? v : fallback
}
