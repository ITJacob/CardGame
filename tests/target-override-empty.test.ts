import { describe, it, expect } from 'vitest';
import {
  Combat,
  makeAction,
  resolveTargets,
  settleAction,
} from '../src/index.js';
import type { ActionId, OpportunityId } from '../src/shared/ids.js';
import { compileSample, makeCombat } from './helpers.js';
import type { Unit } from '../src/index.js';

/**
 * C7 验证：状态提供的 `target_override` 能否指向空坐标（anchor = first_empty），
 * 从而把一次 instant 攻击重定向到空格、必定落空（whiff）。
 *
 * 机制链路（已在引擎中存在，本测试做忠实证明）：
 *   status.behaviorModifiers[target_override] → unit.constraints.targetOverride
 *   → commitBehavior 覆盖 action.targetSpec → I 节点 anchorIndex('first_empty') 解析空格
 *   → M 节点 consumption:'instant' 过滤 occupantId===null → 伤害不打出。
 */

function findUnit(combat: Combat, faction: 'blue' | 'red'): Unit {
  const u = combat.allUnits().find((x) => x.faction === faction);
  if (!u) throw new Error(`未找到 ${faction} 单位`);
  return u;
}

describe('C7 · target_override 指向空坐标（first_empty）', () => {
  it('fool_fate 的状态修饰被正确聚合成 constraints.targetOverride', () => {
    const combat = makeCombat(
      1,
      { blue: [{ unitDefId: 'unit_warrior', lane: 'top' }], red: [{ unitDefId: 'unit_warrior', lane: 'top' }] },
      50,
    );
    const blue = findUnit(combat, 'blue');

    expect(blue.constraints.targetOverride).toBeNull();

    const mounted = combat.mountStatus(blue, 'fool_fate', {}, combat.rootContext(blue.id));
    expect(mounted).not.toBeNull();

    expect(blue.constraints.targetOverride).not.toBeNull();
    expect(blue.constraints.targetOverride?.request.anchor).toBe('first_empty');
    expect(blue.constraints.targetOverride?.request.faction).toBe('enemy');
    expect(blue.constraints.targetOverride?.request.laneRef).toBe('same_lane');
  });

  it('挂 fool_fate 后，攻击解析到空格（occupantId === null）并 instant 落空', () => {
    const combat = makeCombat(
      2,
      { blue: [{ unitDefId: 'unit_warrior', lane: 'top' }], red: [{ unitDefId: 'unit_warrior', lane: 'top' }] },
      50,
    );
    const blue = findUnit(combat, 'blue');
    const red = findUnit(combat, 'red');

    expect(combat.mountStatus(blue, 'fool_fate', {}, combat.rootContext(blue.id))).not.toBeNull();

    const override = blue.constraints.targetOverride;
    expect(override).not.toBeNull();

    const action = makeAction({
      id: combat.ids.next('action') as ActionId,
      sourceRef: 'test:c7',
      sourceInstanceId: blue.id,
      ignition: { kind: 'commit', opportunityId: 'test' as OpportunityId },
      // 这正是 commitBehavior 注入覆盖后的 targetSpec。
      targetSpec: override,
      effects: [{ ref: 'dmg_fireball' }],
      reach: 'melee',
      casterId: blue.id,
      consumption: 'instant',
      castTime: 0,
    });

    const resolved = resolveTargets(combat, action, blue);
    expect(resolved.ok).toBe(true);

    // 解析结果：敌方同路第一个空格。
    expect(action.committedTargets).toHaveLength(1);
    const t = action.committedTargets[0]!;
    expect(t.occupantId).toBeNull();
    expect(t.coord.faction).toBe('red');
    expect(t.coord.lane).toBe('top');
    expect(t.coord.index).toBe(1); // 红方 index0 已被占，空格是 index1

    // instant 消费：空格目标被过滤 → 无伤害打出，红方血量不变。
    const hpBefore = red.hp;
    const settled = settleAction(combat, action);
    expect(settled.ok).toBe(true);
    expect(action.outcomes).toHaveLength(0);
    expect(red.hp).toBe(hpBefore);
  });

  it('对照：不挂 fool_fate 时，同路普攻命中真实单位（occupantId !== null）', () => {
    const combat = makeCombat(
      3,
      { blue: [{ unitDefId: 'unit_warrior', lane: 'top' }], red: [{ unitDefId: 'unit_warrior', lane: 'top' }] },
      50,
    );
    const blue = findUnit(combat, 'blue');
    const red = findUnit(combat, 'red');

    // 默认普攻形态（同 ENEMY_FRONT 的 request 部分，但用 front_line 锚点）。
    const normalSpec = {
      request: { faction: 'enemy' as const, laneRef: 'same_lane' as const, anchor: 'front_line' as const, scope: 'single_point' as const, sort: 'index_asc' as const, spread: 'none' as const, pickCount: 1 },
      mode: 'unit' as const,
      consumption: 'instant' as const,
      selectionMode: 'auto' as const,
    };

    const action = makeAction({
      id: combat.ids.next('action') as ActionId,
      sourceRef: 'test:c7-control',
      sourceInstanceId: blue.id,
      ignition: { kind: 'commit', opportunityId: 'test' as OpportunityId },
      targetSpec: normalSpec,
      effects: [{ ref: 'dmg_fireball' }],
      reach: 'melee',
      casterId: blue.id,
      consumption: 'instant',
      castTime: 0,
    });

    const resolved = resolveTargets(combat, action, blue);
    expect(resolved.ok).toBe(true);
    expect(action.committedTargets).toHaveLength(1);
    expect(action.committedTargets[0]!.occupantId).toBe(red.id);

    const hpBefore = red.hp;
    settleAction(combat, action);
    expect(red.hp).toBeLessThan(hpBefore); // 真实命中，扣血
  });
});

// 确保编目编译在测试模块加载时即失败可见（与 helpers 行为一致）。
compileSample();
