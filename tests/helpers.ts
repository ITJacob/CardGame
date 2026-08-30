import { Catalog, Combat, sampleCatalog } from '../src/index.js';
import type { Catalog as CatalogType } from '../src/index.js';

/** 编译示例编目（编译失败直接抛，测试里不必重复处理 Result）。 */
export function compileSample(): CatalogType {
  const r = Catalog.compile(sampleCatalog);
  if (!r.ok) throw new Error(`示例编目编译失败：${r.error.message}`);
  return r.value;
}

/** 出场条目：写字符串则按默认分路（第 0 个 top，其余 bottom）。 */
export type RosterEntrySpec = string | { readonly unitDefId: string; readonly lane: string };

export interface RosterSpec {
  readonly blue: readonly RosterEntrySpec[];
  readonly red: readonly RosterEntrySpec[];
}

const DEFAULT_ROSTER: RosterSpec = {
  blue: ['unit_warrior', 'unit_mage'],
  red: ['unit_warrior', 'unit_mage'],
};

export function makeCombat(seed: number, roster: RosterSpec = DEFAULT_ROSTER, maxTicks = 200): Combat {
  const catalog = compileSample();

  const build = (side: readonly RosterEntrySpec[], faction: 'blue' | 'red') =>
    side.map((spec, i) => ({
      unitDefId: typeof spec === 'string' ? spec : spec.unitDefId,
      faction,
      lane: typeof spec === 'string' ? (i === 0 ? 'top' : 'bottom') : spec.lane,
    }));

  const r = Combat.create({
    id: `combat-${seed}`,
    seed,
    catalog,
    roster: [...build(roster.blue, 'blue'), ...build(roster.red, 'red')],
    maxTicks,
  });
  if (!r.ok) throw new Error(`战斗创建失败：${r.error.message}`);
  return r.value;
}

/** 推进到战斗结束（或触到 maxTicks 安全阀），返回实际推进的 tick 数。 */
export function runToEnd(combat: Combat, maxTicks = 200): number {
  let n = 0;
  while (n < maxTicks && !combat.isFinished) {
    combat.tick();
    n += 1;
  }
  return n;
}
