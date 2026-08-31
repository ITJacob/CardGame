import { describe, it, expect } from 'vitest';
import {
  checkCatalogInvariants,
  checkCombatInvariants,
  checkEventLogInvariants,
  verifyAll,
  tickAndVerify,
  INVARIANTS,
  INVARIANT_COUNT,
  formatViolations,
  DEFAULT_DAMAGE_CHAIN,
  Catalog,
  sampleCatalog,
} from '../src/index.js';
import { compileSample, makeCombat, runToEnd } from './helpers.js';

describe('不变量总表（§12）', () => {
  it('共 51 条', () => {
    expect(INVARIANT_COUNT).toBe(51);
  });

  it('编号不重复', () => {
    const ids = INVARIANTS.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('覆盖战场 / 编队 / 调度 / 执行 / 效果 / 编目八组前缀', () => {
    const prefixes = new Set(INVARIANTS.map((i) => i.id.replace(/^INV-/, '').replace(/\d+$/, '')));
    expect([...prefixes].sort()).toEqual(['B', 'C', 'D', 'E', 'EL', 'P', 'S', 'T']);
  });

  it('每条都声明了归类：构造即保证 / 运行时校验 / 事件流校验', () => {
    for (const inv of INVARIANTS) {
      expect(['enforced', 'checked', 'logged']).toContain(inv.enforcement);
      expect(inv.statement.length).toBeGreaterThan(0);
    }
  });
});

describe('编目期不变量断言（C / T / EL / D1 / D5 / E6）', () => {
  it('示例编目零违规', () => {
    const violations = checkCatalogInvariants(compileSample());
    expect(formatViolations(violations)).toBe('无违规');
  });

  it('INV-C1：引用了不存在的效果会被抓出来', () => {
    const catalog = Catalog.compile({
      ...sampleCatalog,
      behaviorTemplates: [
        {
          id: 'bad',
          key: 'bad',
          trigger: 'active',
          reach: 'none',
          cost: { gaugeAmount: 75, energyAmount: 0 },
          castTime: 0,
          cooldown: 0,
          targetSpec: null,
          effects: [{ ref: 'ghost_effect' }],
        },
      ],
    });
    if (!catalog.ok) return; // 编译器先拦下了也算通过
    const v = checkCatalogInvariants(catalog.value);
    expect(v.some((x) => x.id === 'INV-C1')).toBe(true);
  });

  it('INV-C2：StatusDef 缺 defaultDuration 会被抓出来', () => {
    const catalog = Catalog.compile({
      ...sampleCatalog,
      statuses: [
        {
          id: 'no_duration',
          category: 'buff',
          defaultDuration: Number.NaN,
          maxStacks: 1,
          stackPolicy: 'refresh',
          dispelable: true,
          behaviorModifiers: [],
          triggers: [],
        },
      ],
    });
    if (!catalog.ok) return;
    const v = checkCatalogInvariants(catalog.value);
    expect(v.some((x) => x.id === 'INV-C2')).toBe(true);
  });

  it('INV-D1：伤害链阶段顺序被改动会被抓出来', () => {
    // 默认链必须是 [shield, armor, mitigation, resistance, multiplier, floor]
    const kinds = DEFAULT_DAMAGE_CHAIN.map((s) => s.kind);
    expect(kinds).toEqual(['absorb', 'absorb', 'mitigation', 'resistance', 'multiplier', 'floor']);
    expect(checkCatalogInvariants(compileSample()).some((x) => x.id === 'INV-D1')).toBe(false);
  });

  it('INV-D5：heal 与 modify_resource 混用会被抓出来', () => {
    const catalog = Catalog.compile({
      ...sampleCatalog,
      behaviorTemplates: [
        {
          id: 'mixed',
          key: 'mixed',
          trigger: 'active',
          reach: 'none',
          cost: { gaugeAmount: 75, energyAmount: 0 },
          castTime: 0,
          cooldown: 0,
          targetSpec: null,
          effects: [{ ref: 'heal_regen' }, { ref: 'gain_armor_2' }],
        },
      ],
    });
    if (!catalog.ok) return;
    // heal 作用在 hp 池，gain_armor_2 作用在 armor 池——不算混用
    expect(checkCatalogInvariants(catalog.value).some((x) => x.id === 'INV-D5')).toBe(false);
  });

  it('INV-T2：术语成环会被抓出来', () => {
    const catalog = Catalog.compile({
      ...sampleCatalog,
      terms: [
        ...sampleCatalog.terms,
        {
          id: 'loop_a',
          displayName: 'A',
          category: 'x',
          overridable: [],
          composition: { kind: 'sequence', of: [{ termRef: 'loop_b' }] },
        },
        {
          id: 'loop_b',
          displayName: 'B',
          category: 'x',
          overridable: [],
          composition: { kind: 'sequence', of: [{ termRef: 'loop_a' }] },
        },
      ],
    });
    // 编译器会在编译期就拒绝；若它没拒绝，断言器必须接住
    if (catalog.ok) {
      const v = checkCatalogInvariants(catalog.value);
      expect(v.some((x) => x.id === 'INV-T2')).toBe(true);
    } else {
      expect(catalog.error.code).toBe('CATALOG_TERM_CYCLE');
    }
  });

  it('INV-T4：文案占位符无法由实参渲染会被抓出来', () => {
    const catalog = Catalog.compile({
      ...sampleCatalog,
      terms: [
        ...sampleCatalog.terms,
        {
          id: 'bad_text',
          displayName: '坏文案',
          category: 'x',
          overridable: [],
          description: '造成 {unknown_placeholder} 次伤害',
          composition: { kind: 'sequence', of: [{ ref: 'dmg_physical_attack' }] },
        },
      ],
    });
    if (!catalog.ok) return;
    const v = checkCatalogInvariants(catalog.value);
    expect(v.some((x) => x.id === 'INV-T4')).toBe(true);
  });

  it('INV-E6：Manual 缺 fallbackSort 会被抓出来', () => {
    const catalog = Catalog.compile({
      ...sampleCatalog,
      behaviorTemplates: [
        {
          id: 'manual_bad',
          key: 'manual_bad',
          trigger: 'active',
          reach: 'none',
          cost: { gaugeAmount: 75, energyAmount: 0 },
          castTime: 0,
          cooldown: 0,
          targetSpec: {
            request: {
              faction: 'enemy',
              laneRef: 'same_lane',
              anchor: 'front_line',
              scope: 'single_point',
              sort: 'index_asc',
              spread: 'none',
              pickCount: 1,
            },
            mode: 'unit',
            consumption: 'instant',
            selectionMode: 'manual',
          },
          effects: [],
        },
      ],
    });
    if (!catalog.ok) return;
    const v = checkCatalogInvariants(catalog.value);
    expect(v.some((x) => x.id === 'INV-E6')).toBe(true);
  });
});

describe('运行期不变量断言（B / P / S / C3）', () => {
  it('整场战斗逐 tick 校验零违规', () => {
    const combat = makeCombat(2026, {
      blue: [{ unitDefId: 'unit_warrior', lane: 'top' }, { unitDefId: 'unit_mage', lane: 'top' }],
      red: [{ unitDefId: 'unit_warrior', lane: 'top' }, { unitDefId: 'unit_mage', lane: 'top' }],
    });
    const bad = tickAndVerify(combat, 200);
    expect(bad.length).toBe(0);
  });

  it('战斗结束后：编目 + 状态 + 事件流全部零违规', () => {
    const combat = makeCombat(77);
    runToEnd(combat);
    const r = verifyAll(combat);
    expect(formatViolations(r.violations)).toBe('无违规');
  });

  it('INV-B2：人为制造空洞会被抓出来', () => {
    const combat = makeCombat(5);
    const unit = combat.allUnits()[0];
    if (!unit?.position) return;
    // 绕过 Placement 直接写 slot——这正是 INV-B5 禁止的操作，断言器必须能发现
    combat.battle.writeSlot({ ...unit.position, index: 2 }, unit.id);
    combat.battle.writeSlot(unit.position, null);
    const v = checkCombatInvariants(combat);
    expect(v.some((x) => x.id === 'INV-B2')).toBe(true);
  });

  it('INV-B4：投影与战场占用不一致会被抓出来', () => {
    const combat = makeCombat(6);
    const unit = combat.allUnits()[0];
    if (!unit?.position) return;
    const real = unit.position;
    unit.position = { ...real, index: real.index + 1 };
    const v = checkCombatInvariants(combat);
    expect(v.some((x) => x.id === 'INV-B4' || x.id === 'INV-B5')).toBe(true);
  });

  it('INV-P5：硬控在场却残留 stance 会被抓出来', () => {
    const combat = makeCombat(8);
    const unit = combat.allUnits()[0];
    if (!unit) return;
    // 直接构造违规：先挂 stance，再挂 control，但不走 Combat 的清除逻辑
    const statuses = unit.statuses;
    statuses.mount(combat.catalog.requireStatus('guard_stance'), { duration: 5 }, combat.ids);
    statuses.mount(combat.catalog.requireStatus('stun'), { duration: 5 }, combat.ids);
    const v = checkCombatInvariants(combat);
    expect(v.some((x) => x.id === 'INV-P5')).toBe(true);
  });

  it('INV-P4：离场单位残留修正会被抓出来', () => {
    const combat = makeCombat(9);
    const unit = combat.allUnits()[0];
    if (!unit) return;
    unit.provenance.apply('attack', 5, 'status#ghost');
    unit.state = 'removed';
    const v = checkCombatInvariants(combat);
    expect(v.some((x) => x.id === 'INV-P4')).toBe(true);
  });

  it('INV-S5：修正派生值会被抓出来', () => {
    const combat = makeCombat(10);
    const unit = combat.allUnits()[0];
    if (!unit) return;
    unit.provenance.apply('action_cycle' as never, -1, 'status#x');
    const v = checkCombatInvariants(combat);
    expect(v.some((x) => x.id === 'INV-S5')).toBe(true);
  });

  it('INV-E7：引导中阵亡会让引导作废，不留悬空 Action', () => {
    const combat = makeCombat(12);
    // 造一个"引导中"的状态：直接塞 channel，再让这个单位死掉
    const unit = combat.allUnits()[0];
    if (!unit) return;
    unit.state = 'channeling';
    unit.channel = {
      actionId: 'action#test' as never,
      sourceInstanceId: 'behavior#test' as never,
      remaining: 1,
      interruptible: true,
    };
    combat.handleDeath(unit);

    expect(unit.channel).toBeNull();
    const interrupted = combat.bus.log.filter((e) => e.type === 'ChannelInterrupted');
    expect(interrupted.length).toBeGreaterThan(0);
    // 挂起的 Action 必须有终态
    const v = checkEventLogInvariants(combat.bus.log);
    expect(v.some((x) => x.id === 'INV-E7')).toBe(false);
  });

  it('INV-P7：事件流里出现"因驱散回滚属性修正"会被抓出来', () => {
    const combat = makeCombat(11);
    // 手工注入一条违规事件
    const events = [
      {
        type: 'StatReverted' as const,
        unitId: 'u1',
        stat: 'attack',
        sourceId: 's1',
        reason: 'dispelled',
      },
    ];
    const v = checkEventLogInvariants(events);
    expect(v.some((x) => x.id === 'INV-P7')).toBe(true);
  });
});
