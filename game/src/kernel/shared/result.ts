// 结果与错误：内核统一用 Result 表达可失败操作，不抛异常（除不变量违例）。
// 移植自 7e6d01f:src/shared/result.ts，按现 IDL 裁剪 ErrorCode。

export type ErrorCode =
  | 'LANE_FULL'
  | 'INVALID_COORD'
  | 'CROSS_FACTION_RELOCATE'
  | 'UNIT_NOT_PRESENT'
  | 'UNIT_ALREADY_PRESENT'
  | 'NOT_IMPLEMENTED'
  | 'NO_OPPORTUNITY'
  | 'COST_UNPAYABLE'
  | 'INVARIANT'

export interface DomainError {
  code: ErrorCode
  message: string
  detail?: Record<string, unknown>
}

export type Result<T> = { readonly ok: true; readonly value: T } | { readonly ok: false; readonly error: DomainError }

export function ok<T>(value: T): Result<T> {
  return { ok: true, value }
}

export function err<T = never>(code: ErrorCode, message: string, detail?: Record<string, unknown>): Result<T> {
  return { ok: false, error: { code, message, detail } }
}

export function isOk<T>(r: Result<T>): r is { ok: true; value: T } {
  return r.ok
}

export function isErr<T>(r: Result<T>): r is { ok: false; error: DomainError } {
  return !r.ok
}

export function mapResult<T, U>(r: Result<T>, f: (v: T) => U): Result<U> {
  return r.ok ? ok(f(r.value)) : r
}

/** 数值统一收口到两位小数，避免浮点噪声在长战斗里累积（回放可比性）。 */
export function round2(v: number): number {
  return Math.round(v * 100) / 100
}

export class InvariantViolation extends Error {
  constructor(
    readonly code: ErrorCode,
    message: string,
  ) {
    super(message)
    this.name = 'InvariantViolation'
  }
}

export function invariant(cond: unknown, code: ErrorCode, message: string): asserts cond {
  if (!cond) throw new InvariantViolation(code, message)
}
