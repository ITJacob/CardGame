/**
 * 事件流 schema 与精确回放（§10.5 / R6）。
 *
 * 可复现契约：战斗结果 = f(初始状态, 输入序列, seed)。三者相同，结果必须**逐位相同**。
 *
 * 这份 bundle 就是那个契约的载体：它足够小（初始状态 + seed + 决策器种类 + 事件流），
 * 又足够完整——拿着它可以在任何一台机器上重跑一遍，用指纹比对判断
 * "这次改动到底有没有改变行为"。
 *
 * 用途有三：
 *   1. 回归测试（改了引擎，跑一遍历史 bundle，指纹变了就说明行为变了）
 *   2. 战报（事件流本身是可读的战斗过程）
 *   3. 平衡验证的数据源（MC 跑批时不必重跑，直接复用 bundle）
 */

import type { DefId, FactionId, LaneId, UnitId } from '../shared/ids.js';
import { ok, err, type Result } from '../shared/result.js';
import type { DomainEvent } from '../shared/events.js';
import type { Catalog } from '../catalog/catalog.js';
import { Combat, FirstAvailableDecider, RotatingDecider, type CombatDecider } from '../combat/combat.js';

export const REPLAY_SCHEMA_VERSION = 1;

export interface ReplayRosterEntry {
  readonly unitDefId: DefId;
  readonly faction: FactionId;
  readonly lane: LaneId;
  readonly id?: UnitId;
}

export type DeciderKind = 'first' | 'rotating';

export interface ReplayBundle {
  readonly version: number;
  readonly combatId: string;
  readonly seed: number;
  readonly roster: readonly ReplayRosterEntry[];
  readonly decider: DeciderKind;
  readonly maxTicks: number;
  readonly eventLog: readonly DomainEvent[];
  /** 事件流的指纹，用于快速比对（不必逐条 diff）。 */
  readonly fingerprint: string;
}

/** FNV-1a 32 位：够快、无依赖、跨平台稳定。 */
export function fingerprintOf(events: readonly DomainEvent[]): string {
  const s = JSON.stringify(events);
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

function deciderOf(kind: DeciderKind): CombatDecider {
  return kind === 'rotating' ? new RotatingDecider() : new FirstAvailableDecider();
}

/** 跑一场战斗并把它封装成可回放的 bundle。 */
export function captureReplay(args: {
  readonly combatId: string;
  readonly seed: number;
  readonly catalog: Catalog;
  readonly roster: readonly ReplayRosterEntry[];
  readonly decider?: DeciderKind;
  readonly maxTicks?: number;
}): Result<ReplayBundle> {
  const decider = args.decider ?? 'first';
  const maxTicks = args.maxTicks ?? 200;

  const created = Combat.create({
    id: args.combatId,
    seed: args.seed,
    catalog: args.catalog,
    roster: args.roster,
    maxTicks,
  });
  if (!created.ok) return created;
  const combat = created.value;
  combat.decider = deciderOf(decider);

  while (!combat.isFinished && combat.tickIndex < maxTicks) combat.tick();

  const eventLog = combat.bus.log;
  return ok({
    version: REPLAY_SCHEMA_VERSION,
    combatId: args.combatId,
    seed: args.seed,
    roster: args.roster,
    decider,
    maxTicks,
    eventLog: [...eventLog],
    fingerprint: fingerprintOf(eventLog),
  });
}

export function serializeReplay(bundle: ReplayBundle): string {
  return JSON.stringify(bundle);
}

export function parseReplay(json: string): Result<ReplayBundle> {
  try {
    const parsed = JSON.parse(json) as ReplayBundle;
    if (parsed.version !== REPLAY_SCHEMA_VERSION) {
      return err('REPLAY_VERSION_MISMATCH', `回放版本 ${parsed.version} 与当前 ${REPLAY_SCHEMA_VERSION} 不符`);
    }
    if (!Array.isArray(parsed.eventLog)) {
      return err('REPLAY_PARSE_FAILED', 'eventLog 字段缺失或不是数组');
    }
    return ok(parsed);
  } catch (e) {
    return err('REPLAY_PARSE_FAILED', e instanceof Error ? e.message : '未知解析错误');
  }
}

export interface ReplayVerification {
  readonly identical: boolean;
  readonly fingerprint: string;
  readonly expectedFingerprint: string;
  /** 前若干条不一致事件的摘要（不超过 20 条，避免刷屏）。 */
  readonly differences: readonly string[];
}

/**
 * 重跑 bundle 并与记录比对。
 *
 * 只推进相同的 tick 数——而不是"跑到结束"——否则在两个引擎版本对
 * 结束条件理解不一致时，会得到一个假阴性。
 */
export function verifyReplay(bundle: ReplayBundle, catalog: Catalog): Result<ReplayVerification> {
  const created = Combat.create({
    id: bundle.combatId,
    seed: bundle.seed,
    catalog,
    roster: bundle.roster,
    maxTicks: bundle.maxTicks,
  });
  if (!created.ok) return created;
  const combat = created.value;
  combat.decider = deciderOf(bundle.decider);

  const expectedTicks = bundle.eventLog.filter((e) => e.type === 'TickAdvanced').length;
  for (let i = 0; i < expectedTicks && !combat.isFinished; i += 1) combat.tick();

  const actual = combat.bus.log;
  const actualFp = fingerprintOf(actual);
  const identical = actualFp === bundle.fingerprint;

  const differences: string[] = [];
  if (!identical) {
    const n = Math.max(actual.length, bundle.eventLog.length);
    for (let i = 0; i < n && differences.length < 20; i += 1) {
      const a = actual[i];
      const b = bundle.eventLog[i];
      if (JSON.stringify(a) !== JSON.stringify(b)) {
        differences.push(`#${i} 期望 ${JSON.stringify(b) ?? '<无>'}，实得 ${JSON.stringify(a) ?? '<无>'}`);
      }
    }
  }

  return ok({
    identical,
    fingerprint: actualFp,
    expectedFingerprint: bundle.fingerprint,
    differences,
  });
}
