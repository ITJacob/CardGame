import { describe, it, expect } from 'vitest';
import { resolveDamage, DEFAULT_DAMAGE_CHAIN, DEFAULT_FORMULAS } from '../src/index.js';
import type { Unit } from '../src/index.js';

/** 造一个满足伤害链输入要求的最小单位替身。 */
function stubUnit(over: {
  armor?: number;
  shield?: number;
  defense?: number;
  resist?: Record<string, number>;
  hp?: number;
  statusMul?: number;
}): Unit {
  const resist = over.resist ?? {};
  return {
    id: 'stub',
    pool: (key: string) => ({
      current: key === 'armor' ? (over.armor ?? 0) : key === 'shield' ? (over.shield ?? 0) : 0,
      absorb: () => 0,
    }),
    get defense() {
      return over.defense ?? 0;
    },
    resistanceOf: (e: string) => resist[e] ?? 0,
    statuses: {
      all: () =>
        over.statusMul === undefined
          ? []
          : [{ defId: 'x', instanceId: 'i1', currentStacks: 1, remaining: 1 }],
    },
    statusDef: () => ({ params: { damage_taken_mul: over.statusMul ?? 1 } }),
  } as unknown as Unit;
}

const base = {
  element: 'physical' as const,
  enterGeneralMultiplier: true,
  bypassArmor: false,
};

describe('DamageChain（§8.2 / INV-D1–D4）', () => {
  it('吸收型阶段先扣护盾再扣护甲', () => {
    const attacker = stubUnit({});
    const defender = stubUnit({ shield: 3, armor: 2 });
    const r = resolveDamage({ ...base, raw: 10, attacker, defender }, DEFAULT_DAMAGE_CHAIN, DEFAULT_FORMULAS);
    expect(r.absorbed).toEqual({ shield: 3, armor: 2 });
    expect(r.final).toBe(5);
  });

  it('bypassArmor 跳过吸收型阶段（DoT 穿透护甲）', () => {
    const defender = stubUnit({ shield: 3, armor: 2 });
    const r = resolveDamage(
      { ...base, raw: 10, attacker: stubUnit({}), defender, bypassArmor: true },
      DEFAULT_DAMAGE_CHAIN,
      DEFAULT_FORMULAS,
    );
    expect(r.absorbed).toEqual({ shield: 0, armor: 0 });
    expect(r.final).toBe(10);
  });

  it('减免型阶段线性加减；防御为负则增伤', () => {
    const up = resolveDamage(
      { ...base, raw: 10, attacker: stubUnit({}), defender: stubUnit({ defense: 4 }) },
      DEFAULT_DAMAGE_CHAIN,
      DEFAULT_FORMULAS,
    );
    expect(up.final).toBe(6);

    const down = resolveDamage(
      { ...base, raw: 10, attacker: stubUnit({}), defender: stubUnit({ defense: -2 }) },
      DEFAULT_DAMAGE_CHAIN,
      DEFAULT_FORMULAS,
    );
    expect(down.final).toBe(12);
  });

  it('A18：抗性走乘区并钳制在 [-50%, +75%]', () => {
    const r30 = resolveDamage(
      { ...base, raw: 100, attacker: stubUnit({}), defender: stubUnit({ resist: { physical: 0.3 } }) },
      DEFAULT_DAMAGE_CHAIN,
      DEFAULT_FORMULAS,
    );
    expect(r30.final).toBeCloseTo(70);

    // 抗性 200% 会被钳到 75%
    const capped = resolveDamage(
      { ...base, raw: 100, attacker: stubUnit({}), defender: stubUnit({ resist: { physical: 2 } }) },
      DEFAULT_DAMAGE_CHAIN,
      DEFAULT_FORMULAS,
    );
    expect(capped.final).toBeCloseTo(25);

    // 负抗 -200% 会被钳到 -50%（最多增伤 50%）
    const negative = resolveDamage(
      { ...base, raw: 100, attacker: stubUnit({}), defender: stubUnit({ resist: { physical: -2 } }) },
      DEFAULT_DAMAGE_CHAIN,
      DEFAULT_FORMULAS,
    );
    expect(negative.final).toBeCloseTo(150);
  });

  it('A14：易伤与抗性在同一乘区加算后统一乘一次', () => {
    // 抗性 30%（delta -0.3）+ 易伤 1.3（delta +0.3）→ bucket = 1 → 不增不减
    const r = resolveDamage(
      {
        ...base,
        raw: 100,
        attacker: stubUnit({}),
        defender: stubUnit({ resist: { physical: 0.3 }, statusMul: 1.3 }),
      },
      DEFAULT_DAMAGE_CHAIN,
      DEFAULT_FORMULAS,
    );
    expect(r.final).toBeCloseTo(100);
  });

  it('INV-D4：状态来源的伤害不进通用乘区，但抗性仍然生效', () => {
    const r = resolveDamage(
      {
        ...base,
        raw: 100,
        attacker: stubUnit({}),
        defender: stubUnit({ resist: { physical: 0.3 }, statusMul: 1.3 }),
        enterGeneralMultiplier: false,
      },
      DEFAULT_DAMAGE_CHAIN,
      DEFAULT_FORMULAS,
    );
    // 只吃抗性 -30%，不吃易伤 +30%
    expect(r.final).toBeCloseTo(70);
  });

  it('INV-D3：伤害链是纯函数，不修改任何状态', () => {
    const defender = stubUnit({ shield: 5, armor: 5 });
    const before = JSON.stringify({ s: defender.shield, a: defender.armor });
    resolveDamage({ ...base, raw: 20, attacker: stubUnit({}), defender }, DEFAULT_DAMAGE_CHAIN, DEFAULT_FORMULAS);
    expect(JSON.stringify({ s: defender.shield, a: defender.armor })).toBe(before);
  });

  it('INV-D2：同样的输入必须得到逐位相同的结果（无随机）', () => {
    const defender = stubUnit({ shield: 1, armor: 1, defense: 1 });
    const a = resolveDamage({ ...base, raw: 13, attacker: stubUnit({}), defender }, DEFAULT_DAMAGE_CHAIN, DEFAULT_FORMULAS);
    const b = resolveDamage({ ...base, raw: 13, attacker: stubUnit({}), defender }, DEFAULT_DAMAGE_CHAIN, DEFAULT_FORMULAS);
    expect(a).toEqual(b);
  });

  it('INV-D1：阶段顺序固定且可见于 breakdown', () => {
    const r = resolveDamage(
      { ...base, raw: 10, attacker: stubUnit({}), defender: stubUnit({ shield: 1 }) },
      DEFAULT_DAMAGE_CHAIN,
      DEFAULT_FORMULAS,
    );
    expect(r.breakdown.map((b) => b.stage)).toEqual([
      'absorb:shield',
      'absorb:armor',
      'mitigation',
      'resistance:physical',
      'multiplier',
      'floor',
    ]);
  });
});
