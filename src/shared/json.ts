/** 参数包里允许出现的值类型。定义态全部由 JSON 承载，保证可快照、可序列化、可回放。 */
export type JsonValue = string | number | boolean | null | JsonValue[] | { readonly [key: string]: JsonValue };

/** 效果 / 状态 / 区域的参数包。 */
export type Params = Readonly<Record<string, JsonValue>>;

export function num(params: Params | undefined, key: string, fallback: number): number {
  const v = params?.[key];
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback;
}

export function str(params: Params | undefined, key: string, fallback: string): string {
  const v = params?.[key];
  return typeof v === 'string' ? v : fallback;
}

export function bool(params: Params | undefined, key: string, fallback: boolean): boolean {
  const v = params?.[key];
  return typeof v === 'boolean' ? v : fallback;
}
