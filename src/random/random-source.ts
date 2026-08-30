/**
 * 随机源治理（B1 / R1–R6）。
 *
 * R2：概率必须走 RandomSource——显式、可注入、可播种；种子在战斗创建时确定并写入战斗记录。
 * R3：登记制——引入概率的效果必须被显式标记，可被平衡审计工具筛出单列。
 * R4：单次抽样——随机源只在生效条件判定处被读取一次，禁止在结算链内部二次抽样。
 * R6：可复现契约——结果 = f(初始状态, 输入序列, seed)。
 */

export interface RandomState {
  readonly seed: number;
  readonly cursor: number;
}

export interface RandomSource {
  readonly seed: number;
  /** 唯一抽样入口，返回 [0, 1)。 */
  next(): number;
  /** [0, maxExclusive) 内的整数。 */
  int(maxExclusive: number): number;
  /** 以概率 p 命中。 */
  chance(p: number): boolean;
  snapshot(): RandomState;
  restore(state: RandomState): void;
}

/**
 * mulberry32：32 位状态的确定性 PRNG。
 *
 * 选它的理由不是统计品质（本系统对随机需求极轻），而是状态只有一个 uint32，
 * 快照 / 恢复 / 序列化都极简，且跨平台整数运算结果稳定。
 */
export class Mulberry32RandomSource implements RandomSource {
  private s: number;
  private cursor = 0;

  constructor(readonly seed: number) {
    // 种子混入一个奇数常量，避免 seed 直接为 0 时退化。
    this.s = (seed ^ 0x9e3779b9) >>> 0;
  }

  next(): number {
    this.cursor += 1;
    this.s = (this.s + 0x6d2b79f5) >>> 0;
    let t = this.s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  int(maxExclusive: number): number {
    if (maxExclusive <= 0) return 0;
    return Math.floor(this.next() * maxExclusive);
  }

  chance(p: number): boolean {
    if (p <= 0) return false;
    if (p >= 1) return true;
    return this.next() < p;
  }

  snapshot(): RandomState {
    return { seed: this.s, cursor: this.cursor };
  }

  restore(state: RandomState): void {
    this.s = state.seed >>> 0;
    this.cursor = state.cursor;
  }
}

export interface RandomUsageRecord {
  /** 触发抽样的效果 / 条件标识（效果 id 或 `cond:xxx`）。 */
  readonly key: string;
  /** 抽样次数。 */
  readonly samples: number;
  /** 命中的参数值（如概率 0.5）。 */
  readonly params: Readonly<Record<string, number | string>>;
}

/**
 * 随机使用登记册（R3）。
 *
 * 平衡审计工具遍历它即可把"哪些地方引入了概率"单列出来逐个评审，
 * 不必去代码里 grep。
 */
export class RandomUsageRegistry {
  private readonly records = new Map<string, RandomUsageRecord & { samples: number }>();

  record(key: string, params: Readonly<Record<string, number | string>>): void {
    const sig = `${key}|${JSON.stringify(params)}`;
    const existing = this.records.get(sig);
    if (existing) {
      this.records.set(sig, { ...existing, samples: existing.samples + 1 });
    } else {
      this.records.set(sig, { key, samples: 1, params });
    }
  }

  list(): readonly RandomUsageRecord[] {
    return [...this.records.values()];
  }
}
