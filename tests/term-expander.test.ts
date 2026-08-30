import { describe, it, expect } from 'vitest';
import { Catalog, sampleCatalog, expandTermNodes } from '../src/index.js';
import type { TermDef } from '../src/index.js';

const terms: readonly TermDef[] = [
  {
    id: 'wind_fury',
    displayName: '风怒',
    category: 'attack_shape',
    overridable: ['count'],
    composition: {
      kind: 'repeat',
      count: 2,
      shareTarget: true,
      body: [{ ref: 'dmg', params: { ratio: 1 } }],
    },
  },
  {
    id: 'double_wind',
    displayName: '烈风怒',
    category: 'attack_shape',
    overridable: [],
    composition: { kind: 'sequence', of: [{ termRef: 'wind_fury' }, { termRef: 'wind_fury' }] },
  },
  {
    id: 'cycle_a',
    displayName: 'A',
    category: 'x',
    overridable: [],
    composition: { kind: 'sequence', of: [{ termRef: 'cycle_b' }] },
  },
  {
    id: 'cycle_b',
    displayName: 'B',
    category: 'x',
    overridable: [],
    composition: { kind: 'sequence', of: [{ termRef: 'cycle_a' }] },
  },
];

const lookup = { get: (id: string) => terms.find((t) => t.id === id) };

describe('术语编目期展开（INV-T1）', () => {
  it('Repeat 展开为扁平 EffectRef 序列', () => {
    const r = expandTermNodes([{ termRef: 'wind_fury' }], lookup, 'test');
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value).toHaveLength(2);
  });

  it('每个产出都带有 originTerm 烙印（只读，不参与结算）', () => {
    const r = expandTermNodes([{ termRef: 'wind_fury' }], lookup, 'test');
    if (!r.ok) return;
    for (const e of r.value) expect(e.originTerm).toBe('wind_fury');
  });

  it('嵌套术语的 originTerm 是完整引用路径', () => {
    const r = expandTermNodes([{ termRef: 'double_wind' }], lookup, 'test');
    if (!r.ok) return;
    expect(r.value).toHaveLength(4);
    for (const e of r.value) expect(e.originTerm).toBe('double_wind>wind_fury');
  });

  it('INV-T3：覆写必须在 overridable 白名单内，越界即编目期报错', () => {
    const okRes = expandTermNodes([{ termRef: 'wind_fury', overrides: { count: 3 } }], lookup, 'test');
    expect(okRes.ok).toBe(true);
    if (okRes.ok) expect(okRes.value).toHaveLength(3);

    const bad = expandTermNodes([{ termRef: 'wind_fury', overrides: { ratio: 9 } }], lookup, 'test');
    expect(bad.ok).toBe(false);
    if (!bad.ok) expect(bad.error.code).toBe('CATALOG_TERM_OVERRIDE_NOT_ALLOWED');
  });

  it('INV-T2：术语引用图有环时拒绝展开', () => {
    const r = expandTermNodes([{ termRef: 'cycle_a' }], lookup, 'test');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe('CATALOG_TERM_CYCLE');
  });

  it('If 被编译成带条件的效果：then 挂条件，else 挂取反条件', () => {
    const r = expandTermNodes(
      [
        {
          kind: 'if',
          cond: { kind: 'target_hp_below', ratio: 0.3 },
          then: [{ ref: 'burn' }],
          else: [{ ref: 'chill' }],
        },
      ],
      lookup,
      'test',
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value).toHaveLength(2);
    expect(r.value[0]?.condition).toEqual({ kind: 'target_hp_below', ratio: 0.3 });
    expect(r.value[1]?.condition).toEqual({
      kind: 'not',
      of: { kind: 'target_hp_below', ratio: 0.3 },
    });
  });

  it('Sequence 支持内联的算子节点（嵌套 If）', () => {
    const r = expandTermNodes(
      [
        {
          kind: 'sequence',
          of: [
            { ref: 'dmg' },
            { kind: 'if', cond: { kind: 'always' }, then: [{ ref: 'burn' }] },
          ],
        },
      ],
      lookup,
      'test',
    );
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.map((e) => e.ref)).toEqual(['dmg', 'burn']);
  });
});

describe('Catalog 编译（INV-C1 / INV-C4）', () => {
  it('示例编目能通过全量校验', () => {
    const r = Catalog.compile(sampleCatalog);
    expect(r.ok).toBe(true);
  });

  it('行为模板里的术语在编目期已展开，运行期只见 EffectRef', () => {
    const r = Catalog.compile(sampleCatalog);
    if (!r.ok) return;
    const powerStrike = r.value.behavior('tpl_power_strike');
    expect(powerStrike).toBeDefined();
    // wind_fury 的 count = 2 → 两段伤害
    expect(powerStrike?.effects).toHaveLength(2);
    expect(powerStrike?.effects.every((e) => e.originTerm === 'wind_fury')).toBe(true);
  });

  it('引用了不存在的效果时拒绝编译', () => {
    const r = Catalog.compile({
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
          effects: [{ ref: 'no_such_effect' }],
        },
      ],
    });
    expect(r.ok).toBe(false);
  });

  it('Manual 目标规格缺 fallbackSort 时拒绝编译（INV-E6）', () => {
    const r = Catalog.compile({
      ...sampleCatalog,
      behaviorTemplates: [
        {
          id: 'manual_no_fallback',
          key: 'x',
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
    expect(r.ok).toBe(false);
  });
});
