/**
 * 领域层统一的结果类型。
 *
 * 纪律：核心逻辑层不抛异常来表达"规则拒绝"（队列已满、成本不足、目标非法……），
 * 一律返回 Result。异常只用于表达"程序员写错了"这类不可恢复的缺陷。
 */

export type ErrorCode =
  | 'LANE_FULL'
  | 'INVALID_COORDINATE'
  | 'UNIT_NOT_FOUND'
  | 'UNIT_NOT_ON_FIELD'
  | 'UNIT_ALREADY_PLACED'
  | 'INVARIANT_VIOLATION'
  | 'CATALOG_UNRESOLVED_REF'
  | 'CATALOG_TERM_CYCLE'
  | 'CATALOG_TERM_OVERRIDE_NOT_ALLOWED'
  | 'CATALOG_INVALID_TARGET_SPEC'
  | 'CATALOG_INVALID_STATUS_DEF'
  | 'NO_OPPORTUNITY'
  | 'OPPORTUNITY_CONSUMED'
  | 'BEHAVIOR_NOT_AVAILABLE'
  | 'COST_NOT_PAYABLE'
  | 'TARGET_RESOLUTION_FAILED'
  | 'STALE_CANDIDATE_POOL'
  | 'EFFECT_FAILED'
  | 'ACTION_NOT_PENDING'
  | 'NOT_IMPLEMENTED'
  | 'REPLAY_VERSION_MISMATCH'
  | 'REPLAY_PARSE_FAILED'
  | 'CROSS_FACTION_RELOCATE';

export interface DomainError {
  readonly code: ErrorCode;
  readonly message: string;
  readonly details?: unknown;
}

export type Result<T> = { readonly ok: true; readonly value: T } | { readonly ok: false; readonly error: DomainError };

export function ok<T>(value: T): Result<T> {
  return { ok: true, value };
}

export function err<T = never>(code: ErrorCode, message: string, details?: unknown): Result<T> {
  return { ok: false, error: details === undefined ? { code, message } : { code, message, details } };
}

export function isOk<T>(r: Result<T>): r is { readonly ok: true; readonly value: T } {
  return r.ok;
}

/** 把一组 Result 收敛成单个 Result，短路在第一个失败上。 */
export function collectResults<T>(results: readonly Result<T>[]): Result<readonly T[]> {
  const values: T[] = [];
  for (const r of results) {
    if (!r.ok) return r;
    values.push(r.value);
  }
  return ok(values);
}

/** Result 的函子映射：成功则变换值，失败则原样透传。 */
export function mapResult<T, U>(r: Result<T>, f: (value: T) => U): Result<U> {
  return r.ok ? ok(f(r.value)) : r;
}

/** Result 的单子绑定：用于串联可能失败的步骤。 */
export function flatMapResult<T, U>(r: Result<T>, f: (value: T) => Result<U>): Result<U> {
  return r.ok ? f(r.value) : r;
}

/**
 * 归一到两位小数。
 *
 * 伤害链走乘区后会出现 5 × 1.3 = 6.5 这类结果，浮点累加久了会攒出
 * 2.8000000000000007 这种噪声。统一在此处收口，保证同一个 seed 的
 * 回放不会因为浮点尾数漂移而对不上。
 */
export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export class InvariantViolation extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(`[${code}] ${message}`);
    this.name = 'InvariantViolation';
  }
}

/** 不变量断言。违反即代表实现有缺陷，直接抛（不可恢复）。 */
export function invariant(condition: unknown, code: string, message: string): asserts condition {
  if (!condition) throw new InvariantViolation(code, message);
}
