/**
 * 冒烟脚本：跑一场完整战斗并把关键过程打印出来。
 *
 * 用途不是"演示功能"，而是回答三个问题：
 *   1. 这套骨架能不能从头跑到分出胜负？
 *   2. 事件流里有没有该有的东西（对撞、术语烙印、状态挂载、区域触发）？
 *   3. 确定性是否成立——同 seed 跑两遍是否逐位相同？
 *
 * 跑法：npm run smoke
 */

import {
  Catalog,
  Combat,
  RotatingDecider,
  sampleCatalog,
  type DomainEvent,
} from '../src/index.js';

const MAX_TICKS = 300;

function buildCombat(seed: number): Combat {
  const catalog = Catalog.compile(sampleCatalog);
  if (!catalog.ok) {
    throw new Error(`编目编译失败：${catalog.error.message}\n${JSON.stringify(catalog.error.details)}`);
  }
  const combat = Combat.create({
    id: `smoke-${seed}`,
    seed,
    catalog: catalog.value,
    // 全部放在同一路：
    // 近战的 laneRef 是 same_lane，分处两路会互相够不着而陷入僵持——
    // 这不是引擎缺陷，而是"分兵"这一战术选择本身带来的后果。
    roster: [
      { unitDefId: 'unit_warrior', faction: 'blue', lane: 'top' },
      { unitDefId: 'unit_mage', faction: 'blue', lane: 'top' },
      { unitDefId: 'unit_warrior', faction: 'red', lane: 'top' },
      { unitDefId: 'unit_mage', faction: 'red', lane: 'top' },
    ],
    maxTicks: MAX_TICKS,
  });
  if (!combat.ok) throw new Error(`战斗创建失败：${combat.error.message}`);
  // 轮换用技能，才能压到编目的各个角落（引导、区域、状态、驱散）。
  combat.value.decider = new RotatingDecider();
  return combat.value;
}

function countByType(events: readonly DomainEvent[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const e of events) m.set(e.type, (m.get(e.type) ?? 0) + 1);
  return m;
}

function run(seed: number): { combat: Combat; ticks: number } {
  const combat = buildCombat(seed);
  let ticks = 0;
  while (ticks < MAX_TICKS && !combat.isFinished) {
    combat.tick();
    ticks += 1;
  }
  return { combat, ticks };
}

function main(): void {
  const { combat, ticks } = run(20260830);

  const finish = combat.bus.log.find((e) => e.type === 'CombatFinished');
  const winner = finish && finish.type === 'CombatFinished' ? finish.winner : null;

  const line = '─'.repeat(56);
  console.log(line);
  console.log('战斗结束');
  console.log(line);
  console.log(`  tick 数        : ${ticks}${ticks >= MAX_TICKS ? '（触到安全阀）' : ''}`);
  console.log(`  胜方           : ${winner ?? '无（同归于尽 / 未分胜负）'}`);
  console.log('');

  console.log('存活单位：');
  for (const unit of combat.allUnits()) {
    const flags: string[] = [];
    for (const s of unit.statuses.all()) flags.push(`${s.defId}(${s.remaining})`);
    console.log(
      `  ${unit.id.padEnd(8)} ${unit.faction.padEnd(5)} ${unit.position?.lane ?? '-'} ` +
        `HP ${String(unit.hp).padStart(3)}/${unit.hpMax}  护甲 ${unit.armor}  护盾 ${unit.shield}` +
        (flags.length > 0 ? `  状态[${flags.join(', ')}]` : ''),
    );
  }
  console.log('');

  const counts = countByType(combat.bus.log);
  console.log('事件流统计：');
  for (const [type, n] of [...counts].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${type.padEnd(30)} ${n}`);
  }
  console.log('');

  // —— 确定性校验（B1 / R6）——
  const a = run(20260830);
  const b = run(20260830);
  const same =
    a.ticks === b.ticks &&
    JSON.stringify(a.combat.bus.log) === JSON.stringify(b.combat.bus.log);
  console.log(`确定性校验（同 seed 跑两遍逐位比对）：${same ? 'PASS' : 'FAIL'}`);

  // —— 随机使用登记（R3）——
  const randomUsage = combat.randomRegistry.list();
  console.log(
    randomUsage.length === 0
      ? '随机使用登记：本场未抽样'
      : `随机使用登记：${randomUsage.map((r) => `${r.key}(${JSON.stringify(r.params)})×${r.samples}`).join(', ')}`,
  );
  console.log(line);
}

main();
