import { describe, it, expect } from 'vitest';
import { ModifierLayer, StatProvenance } from '../src/index.js';
import type { StatKey } from '../src/index.js';

function setup() {
  const modifiers = new ModifierLayer();
  const provenance = new StatProvenance(modifiers, () => {});
  return { modifiers, provenance };
}

describe('StatProvenance（A6 / INV-P1–P4 / INV-P7）', () => {
  it('写入修正后 deltaOf 立即反映', () => {
    const { modifiers, provenance } = setup();
    provenance.apply('attack', 5, 'src#1');
    expect(modifiers.deltaOf('attack')).toBe(5);
  });

  it('INV-P2：撤销恢复到"写入前的值"，而不是"减去写入量"', () => {
    const { modifiers, provenance } = setup();
    // 两个来源都改 attack：先 +5，再 +3
    provenance.apply('attack', 5, 'src#1');
    provenance.apply('attack', 3, 'src#2');
    expect(modifiers.deltaOf('attack')).toBe(8);

    provenance.revertBySource('src#2', 'test');
    expect(modifiers.deltaOf('attack')).toBe(5);

    provenance.revertBySource('src#1', 'test');
    expect(modifiers.deltaOf('attack')).toBe(0);
  });

  it('同源重复写同一属性也能精确回滚（栈式还原）', () => {
    const { modifiers, provenance } = setup();
    provenance.apply('attack', 2, 'src#1');
    provenance.apply('attack', 7, 'src#1'); // 覆盖同槽
    expect(modifiers.deltaOf('attack')).toBe(7);

    provenance.revertBySource('src#1', 'test');
    expect(modifiers.deltaOf('attack')).toBe(0);
  });

  it('A21：带 duration 的修正由账本条目自带计时，到期自动回滚', () => {
    const { modifiers, provenance } = setup();
    provenance.applyTimed('defense', -5, 'src#1', 3);
    expect(modifiers.deltaOf('defense')).toBe(-5);

    expect(provenance.tick()).toHaveLength(0); // 剩 2
    expect(provenance.tick()).toHaveLength(0); // 剩 1
    // 剩 0 → 到期
    const reverted = provenance.tick();
    expect(reverted.length).toBeGreaterThan(0);
    expect(modifiers.deltaOf('defense')).toBe(0);
  });

  it('一个来源写多条属性时，到期整组回滚', () => {
    const { modifiers, provenance } = setup();
    provenance.applyTimed('attack', 3, 'src#1', 1);
    provenance.applyTimed('defense', 2, 'src#1', 1);
    const reverted = provenance.tick();
    expect(reverted.map((r) => r.stat).sort()).toEqual(['attack', 'defense']);
    expect(modifiers.deltaOf('attack')).toBe(0);
    expect(modifiers.deltaOf('defense')).toBe(0);
  });

  it('INV-P4：revertAll 清空本单位全部修正', () => {
    const { modifiers, provenance } = setup();
    provenance.apply('attack', 5, 'src#1');
    provenance.apply('resist:fire', 0.2, 'src#2' as StatKey);
    provenance.revertAll('unit_left');
    expect(provenance.all).toHaveLength(0);
    expect(modifiers.deltaOf('attack')).toBe(0);
    expect(modifiers.deltaOf('resist:fire' as StatKey)).toBe(0);
  });

  it('INV-P3：账本条目与修正层一一对应，不存在无主修正', () => {
    const { modifiers, provenance } = setup();
    provenance.apply('attack', 1, 'src#1');
    provenance.apply('defense', 1, 'src#2');
    expect(provenance.all).toHaveLength(modifiers.entries().length);
  });

  it('entriesOf 提供审计视图', () => {
    const { provenance } = setup();
    provenance.apply('attack', 5, 'src#1');
    provenance.apply('attack', 3, 'src#2');
    expect(provenance.entriesOf('attack')).toHaveLength(2);
  });
});
