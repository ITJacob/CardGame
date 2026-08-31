/**
 * 不变量验证契约的出口。
 *
 * 设计目标：把 §12 的 50 条不变量从"文档条目"变成"可执行的断言"，
 * 并且让每条不变量都能说清楚自己是**构造即保证**还是**运行时校验**——
 * 这样当它真的被破坏时，一眼就知道该去改代码还是改配置。
 */

export * from './types.js';
export * from './catalog-checks.js';
export * from './combat-checks.js';

import type { Catalog } from '../catalog/catalog.js';
import type { Combat } from '../combat/combat.js';
import type { DomainEvent } from '../shared/events.js';
import { checkCatalogInvariants } from './catalog-checks.js';
import { checkCombatInvariants, checkEventLogInvariants } from './combat-checks.js';
import type { InvariantViolationReport } from './types.js';
import { formatViolations } from './types.js';

export interface VerificationResult {
  readonly ok: boolean;
  readonly violations: readonly InvariantViolationReport[];
}

/** 一次性跑完：编目 + 战斗当前状态 + 事件流。 */
export function verifyAll(combat: Combat, expectedCatalog?: Catalog): VerificationResult {
  const catalog = expectedCatalog ?? combat.catalog;
  const violations = [
    ...checkCatalogInvariants(catalog),
    ...checkCombatInvariants(combat, catalog),
    ...checkEventLogInvariants(combat.bus.log, catalog),
  ];
  return { ok: violations.length === 0, violations };
}

/** 断言版本：有违规就抛（测试里最省事的用法）。 */
export function assertInvariants(combat: Combat, expectedCatalog?: Catalog): void {
  const r = verifyAll(combat, expectedCatalog);
  if (!r.ok) {
    throw new Error(`不变量校验失败（${r.violations.length} 项）：\n${formatViolations(r.violations)}`);
  }
}

/**
 * 逐 tick 校验：把断言挂到推进过程上，而不是只在结束时看一眼。
 *
 * 很多不变量（S3 / S4 / B3）是"过程中"成立的，结束状态看不出来；
 * 逐 tick 校验能在违规发生的那一刻就定位到 tick 号。
 */
export function tickAndVerify(
  combat: Combat,
  ticks: number,
  expectedCatalog?: Catalog,
): readonly { readonly tick: number; readonly violations: readonly InvariantViolationReport[] }[] {
  const bad: { tick: number; violations: readonly InvariantViolationReport[] }[] = [];
  for (let i = 0; i < ticks && !combat.isFinished; i += 1) {
    combat.tick();
    const v = [...checkCombatInvariants(combat, expectedCatalog)];
    if (v.length > 0) bad.push({ tick: combat.tickIndex, violations: v });
  }
  return bad;
}

export { checkCatalogInvariants, checkCombatInvariants, checkEventLogInvariants };
export type { InvariantViolationReport };
export { formatViolations };
