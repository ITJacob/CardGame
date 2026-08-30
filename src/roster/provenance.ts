/**
 * StatProvenance 溯源账本（A6 / §5.4）。
 *
 * 溯源键是 StatusInstanceId（不是状态类型 ID）——同种状态的两个实例
 * 各自记账、各自撤销，互不干扰。
 *
 * 不变量：
 * - INV-P1：每个 sourceId 在单位上全局唯一（是实例 ID，不是类型 ID）。
 * - INV-P2：revertBySource 必须把属性恢复到该来源写入前的值，而非"减去写入量"。
 * - INV-P3：账本条目与 ModifierLayer 的修正条目一一对应，不存在无主修正。
 * - INV-P4：单位离场时 revertAll() 必须被调用（否则修正泄漏到对象池复用时）。
 * - INV-P7：dispel 只作用于 StatusInstance；modify_stat 写入的属性修正不可被驱散，
 *           只按 duration 到期回滚（A21）。
 */

import type { InstanceId } from '../shared/ids.js';
import type { StatKey } from '../shared/enums.js';
import type { ModifierLayer } from './attributes.js';

export interface ProvenanceEntry {
  readonly stat: StatKey;
  readonly sourceId: InstanceId;
  /** 本次写入的增量。 */
  readonly appliedDelta: number;
  /** 写入前该 (stat, sourceId) 槽里的值；null 表示原本不存在。 */
  readonly previousDelta: number | null;
  /** null = 永久；数字 = 剩余 tick（A21：带 duration 者由账本条目自带计时）。 */
  remaining: number | null;
}

export interface RevertedEntry {
  readonly stat: StatKey;
  readonly sourceId: InstanceId;
  readonly reason: string;
}

export class StatProvenance {
  private entries: ProvenanceEntry[] = [];

  constructor(
    private readonly modifiers: ModifierLayer,
    private readonly onStatChanged: (stat: StatKey) => void,
  ) {}

  /** 写入永久修正（A21：不产生 StatusInstance，不可被驱散）。 */
  apply(stat: StatKey, delta: number, sourceId: InstanceId): ProvenanceEntry {
    return this.write(stat, delta, sourceId, null);
  }

  /** 写入带时限修正。计时由本条目自带，tick 递减，到期 revertBySource（§6.1 第 6 步）。 */
  applyTimed(stat: StatKey, delta: number, sourceId: InstanceId, duration: number): ProvenanceEntry {
    return this.write(stat, delta, sourceId, Math.max(0, Math.floor(duration)));
  }

  private write(stat: StatKey, delta: number, sourceId: InstanceId, remaining: number | null): ProvenanceEntry {
    const slotPrevious = this.modifiers.set(stat, sourceId, delta);
    // 同一 (stat, sourceId) 重复写入时，保留**该来源首次写入前**的值作为回滚目标——
    // 否则"撤销这个来源"只能退到上一次写入，会留下痕迹（违反 INV-P2 的语义）。
    const existing = this.entries.find((e) => e.stat === stat && e.sourceId === sourceId);
    const previousDelta = existing ? existing.previousDelta : slotPrevious;
    const entry: ProvenanceEntry = { stat, sourceId, appliedDelta: delta, previousDelta, remaining };
    // 保持 INV-P3：账本条目与修正层一一对应，不存在无主修正。
    this.entries = this.entries.filter((e) => !(e.stat === stat && e.sourceId === sourceId));
    this.entries.push(entry);
    this.onStatChanged(stat);
    return entry;
  }

  /** 按来源回滚全部条目，恢复到"该来源写入前的值"（INV-P2）。 */
  revertBySource(sourceId: InstanceId, reason: string): readonly RevertedEntry[] {
    const mine = this.entries.filter((e) => e.sourceId === sourceId);
    // 逆序回滚，保证同一 (stat, sourceId) 的多次写入按栈式还原。
    const reverted: RevertedEntry[] = [];
    for (let i = mine.length - 1; i >= 0; i -= 1) {
      const e = mine[i] as ProvenanceEntry;
      this.modifiers.restore(e.stat, e.sourceId, e.previousDelta);
      reverted.push({ stat: e.stat, sourceId: e.sourceId, reason });
      this.onStatChanged(e.stat);
    }
    if (mine.length > 0) {
      this.entries = this.entries.filter((e) => e.sourceId !== sourceId);
    }
    return reverted;
  }

  /** 清空本单位全部修正（单位离场时必调，INV-P4）。 */
  revertAll(reason: string): readonly RevertedEntry[] {
    const out: RevertedEntry[] = [];
    for (const sourceId of this.modifiers.sources()) {
      out.push(...this.revertBySource(sourceId, reason));
    }
    this.entries = [];
    return out;
  }

  /**
   * tick 第 6 步：递减带时限条目的 remaining，到期者按来源回滚（A21）。
   * 按来源整组回滚，避免一个来源写了多条属性时只回滚了其中一条。
   */
  tick(): readonly RevertedEntry[] {
    const expiredSources = new Set<InstanceId>();
    for (const e of this.entries) {
      if (e.remaining === null) continue;
      e.remaining -= 1;
      if (e.remaining <= 0) expiredSources.add(e.sourceId);
    }
    if (expiredSources.size === 0) return [];
    const out: RevertedEntry[] = [];
    for (const sourceId of [...expiredSources].sort()) {
      out.push(...this.revertBySource(sourceId, 'duration_expired'));
    }
    return out;
  }

  /** 审计视图：某项属性的全部修正来源。 */
  entriesOf(stat: StatKey): readonly ProvenanceEntry[] {
    return this.entries.filter((e) => e.stat === stat);
  }

  hasSource(sourceId: InstanceId): boolean {
    return this.entries.some((e) => e.sourceId === sourceId);
  }

  get all(): readonly ProvenanceEntry[] {
    return this.entries;
  }
}
