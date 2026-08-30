/**
 * 全局标识类型与确定性 Id 生成器。
 *
 * B1 确定性铁律要求：同 (初始状态, 输入序列, seed) 必须产出逐位相同的结果，
 * 因此 Id 不能依赖 Date.now() / 全局随机，只能来自战斗内的单调计数器。
 */

export type CombatId = string;
export type UnitId = string;
export type InstanceId = string;
export type DefId = string;
export type FactionId = string;
export type LaneId = string;
export type ZoneId = string;
export type ActionId = string;
export type OpportunityId = string;

/**
 * Id 生成器。
 *
 * - `next(prefix)` 产出 `prefix#n`，n 单调递增，战斗内唯一。
 * - `snapshot()` / `restore()` 供快照回滚（Placement 的 applyExternal 失败时要还原计数器）。
 */
export interface IdGenerator {
  next(prefix: string): string;
  readonly counter: number;
  snapshot(): number;
  restore(counter: number): void;
}

export class SequentialIdGenerator implements IdGenerator {
  private n = 0;

  next(prefix: string): string {
    this.n += 1;
    return `${prefix}#${this.n}`;
  }

  get counter(): number {
    return this.n;
  }

  snapshot(): number {
    return this.n;
  }

  restore(counter: number): void {
    this.n = counter;
  }
}
