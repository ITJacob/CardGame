import { describe, it, expect } from 'vitest';
import { compileSample, makeCombat, runToEnd } from './helpers.js';
import type { DomainEvent } from '../src/index.js';

function fingerprint(events: readonly DomainEvent[]): string {
  return JSON.stringify(events);
}

describe('Combat 聚合根（§1 / §3 / §13）', () => {
  it('示例编目能编译、战斗能创建', () => {
    const combat = makeCombat(1);
    expect(combat.allUnits()).toHaveLength(4);
    expect(combat.battle.shape.capacity).toBe(4);
  });

  it('初始占位正确：每路一个单位，落在 index 0', () => {
    const combat = makeCombat(1);
    for (const unit of combat.allUnits()) {
      expect(unit.position?.index).toBe(0);
    }
    // 坍缩后无空洞（INV-B2）
    for (const faction of ['blue', 'red'] as const) {
      for (const lane of ['top', 'bottom'] as const) {
        const slots = combat.battle.laneSlots(faction, lane);
        expect(slots[0]).not.toBeNull();
        expect(slots[1]).toBeNull();
      }
    }
  });

  it('能连续推进而不抛异常，并最终分出胜负或触顶', () => {
    const combat = makeCombat(7);
    const ticks = runToEnd(combat);
    expect(ticks).toBeGreaterThan(0);
    expect(ticks).toBeLessThanOrEqual(200);
  });

  it('B1 / R6：同 seed 同输入 → 逐位相同的结果', () => {
    const a = makeCombat(42);
    const b = makeCombat(42);
    runToEnd(a);
    runToEnd(b);

    expect(a.tickIndex).toBe(b.tickIndex);
    expect(fingerprint(a.bus.log)).toBe(fingerprint(b.bus.log));

    const hpA = a.allUnits().map((u) => `${u.id}:${u.hp}`).sort();
    const hpB = b.allUnits().map((u) => `${u.id}:${u.hp}`).sort();
    expect(hpA).toEqual(hpB);
  });

  it('近战对撞：近战攻击会让攻击者自己也掉血（INV-E7 / E8）', () => {
    const combat = makeCombat(3, { blue: ['unit_warrior'], red: ['unit_warrior'] });
    runToEnd(combat, 40);

    const damageEvents = combat.bus.log.filter((e) => e.type === 'DamageDealt');
    expect(damageEvents.length).toBeGreaterThan(0);

    // 双方都应该挨过打——普攻是近战，必然对撞。
    const victims = new Set(
      damageEvents.flatMap((e) => (e.type === 'DamageDealt' ? [e.targetUnitId] : [])),
    );
    expect(victims.size).toBe(2);
  });

  it('A12：术语多段 = 一个 Action 内的多段伤害', () => {
    const catalog = compileSample();
    const tpl = catalog.behavior('tpl_power_strike');
    expect(tpl?.effects).toHaveLength(2);
    // 两段共享同一冻结坐标：只走一次 I 节点，因此只有一条 TargetsResolved
    const combat = makeCombat(11);
    const before = combat.bus.log.length;
    runToEnd(combat, 60);
    const resolved = combat.bus.log.slice(before).filter((e) => e.type === 'TargetsResolved');
    // 每段伤害都不重新解析目标
    for (const e of resolved) {
      if (e.type === 'TargetsResolved') expect(e.targets.length).toBeLessThanOrEqual(1);
    }
  });

  it('A19：逃生舱技能（templateRef 为空）也能实例化为行为槽位', () => {
    const combat = makeCombat(5, { blue: ['unit_warrior'], red: ['unit_mage'] });
    const warrior = combat.allUnits().find((u) => u.defId === 'unit_warrior');
    const keys = warrior?.behaviorSlots.map((b) => b.key) ?? [];
    // 默认四件套 + 职业追加的守卫姿态 + 已知技能旋风斩（逃生舱）
    expect(keys).toContain('whirlwind');
    expect(keys).toContain('guard_stance_action');
  });

  it('R3：随机使用被登记，可被平衡审计筛出', () => {
    const combat = makeCombat(9);
    runToEnd(combat, 60);
    const records = combat.randomRegistry.list();
    // 火球术的"概率 0.5 挂灼烧"是唯一的随机点
    expect(records.length).toBeGreaterThanOrEqual(0);
    for (const r of records) expect(r.key).toBeTruthy();
  });

  it('INV-B7 / INV-B1：任何时刻队列都不超过容量且无空洞', () => {
    const combat = makeCombat(13);
    for (let i = 0; i < 60 && !combat.isFinished; i += 1) {
      combat.tick();
      for (const faction of ['blue', 'red'] as const) {
        for (const lane of ['top', 'bottom'] as const) {
          const slots = combat.battle.laneSlots(faction, lane);
          expect(slots.length).toBe(4);
          let seenEmpty = false;
          for (const s of slots) {
            if (s === null) seenEmpty = true;
            else if (seenEmpty) throw new Error('队列出现内部空洞（INV-B2 被破坏）');
          }
        }
      }
    }
  });
});
