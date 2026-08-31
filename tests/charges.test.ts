import { describe, it, expect } from 'vitest';
import { makeCombat } from './helpers.js';
import type { StatusInstance } from '../src/index.js';

/**
 * C6 次数型状态（charges）：响应式触发 N 次后自动卸载。
 * 不变量：INV-E12（enforced）。
 */
describe('次数型状态 charges（C6 / INV-E12）', () => {
  it('挂载时按 StatusDef.charges 初始化剩余次数', () => {
    const combat = makeCombat(1, { blue: ['unit_warrior'], red: ['unit_warrior'] });
    const target = combat.allUnits().find((u) => u.faction === 'blue')!;

    const inst = combat.mountStatus(target, 'ward_charged', {}, combat.rootContext(target.id));
    expect(inst).not.toBeNull();
    expect((inst as StatusInstance).chargesRemaining).toBe(2);
    expect(target.statuses.has('ward_charged')).toBe(true);
  });

  it('每次响应式触发消耗 1 次，归零后自动卸载', () => {
    const combat = makeCombat(1, { blue: ['unit_warrior'], red: ['unit_warrior'] });
    const target = combat.allUnits().find((u) => u.faction === 'blue')!;

    const inst = combat.mountStatus(target, 'ward_charged', {}, combat.rootContext(target.id))!;
    expect(inst.chargesRemaining).toBe(2);

    // 第 1 次受击：触发自疗，剩余 1，状态仍在
    combat.fireEventTriggers(target, 'on_take_damage', combat.rootContext(target.id));
    expect(inst.chargesRemaining).toBe(1);
    expect(target.statuses.has('ward_charged')).toBe(true);

    // 第 2 次受击：触发自疗后归零，状态卸载
    combat.fireEventTriggers(target, 'on_take_damage', combat.rootContext(target.id));
    expect(target.statuses.has('ward_charged')).toBe(false);
  });

  it('grant.charges 可覆盖初始次数（INV-C2 单点定义）', () => {
    const combat = makeCombat(1, { blue: ['unit_warrior'], red: ['unit_warrior'] });
    const target = combat.allUnits().find((u) => u.faction === 'blue')!;

    const inst = combat.mountStatus(target, 'ward_charged', { charges: 1 }, combat.rootContext(target.id))!;
    expect(inst.chargesRemaining).toBe(1);

    // 仅 1 次触发即卸载
    combat.fireEventTriggers(target, 'on_take_damage', combat.rootContext(target.id));
    expect(target.statuses.has('ward_charged')).toBe(false);
  });

  it('非次数型状态不受 charges 逻辑影响（可无限次触发）', () => {
    const combat = makeCombat(1, { blue: ['unit_warrior'], red: ['unit_warrior'] });
    const target = combat.allUnits().find((u) => u.faction === 'blue')!;

    // vulnerable 是无 charges 的 debuff，可多次触发其 reactive 行为而不消失
    const inst = combat.mountStatus(target, 'vulnerable', {}, combat.rootContext(target.id))!;
    expect(inst.chargesRemaining).toBeUndefined();

    combat.fireEventTriggers(target, 'on_take_damage', combat.rootContext(target.id));
    combat.fireEventTriggers(target, 'on_take_damage', combat.rootContext(target.id));
    expect(target.statuses.has('vulnerable')).toBe(true);
  });
});
