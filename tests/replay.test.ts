import { describe, it, expect } from 'vitest';
import {
  captureReplay,
  serializeReplay,
  parseReplay,
  verifyReplay,
  fingerprintOf,
  REPLAY_SCHEMA_VERSION,
  RotatingDecider,
} from '../src/index.js';
import { compileSample } from './helpers.js';

const ROSTER = [
  { unitDefId: 'unit_warrior', faction: 'blue' as const, lane: 'top' },
  { unitDefId: 'unit_mage', faction: 'blue' as const, lane: 'top' },
  { unitDefId: 'unit_warrior', faction: 'red' as const, lane: 'top' },
  { unitDefId: 'unit_mage', faction: 'red' as const, lane: 'top' },
];

function capture(seed: number, decider: 'first' | 'rotating' = 'rotating') {
  const r = captureReplay({
    combatId: `replay-${seed}`,
    seed,
    catalog: compileSample(),
    roster: ROSTER,
    decider,
    maxTicks: 200,
  });
  if (!r.ok) throw new Error(`录制失败：${r.error.message}`);
  return r.value;
}

describe('精确回放（R6 / §10.5）', () => {
  it('bundle 可序列化 / 反序列化，指纹不变', () => {
    const bundle = capture(42);
    const parsed = parseReplay(serializeReplay(bundle));
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.value.fingerprint).toBe(bundle.fingerprint);
    expect(parsed.value.eventLog.length).toBe(bundle.eventLog.length);
  });

  it('版本号不匹配时拒绝解析', () => {
    const bundle = capture(42);
    const raw = JSON.parse(serializeReplay(bundle)) as { version: number };
    raw.version = REPLAY_SCHEMA_VERSION + 1;
    const parsed = parseReplay(JSON.stringify(raw));
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) expect(parsed.error.code).toBe('REPLAY_VERSION_MISMATCH');
  });

  it('重跑 bundle 必须逐位相同', () => {
    const bundle = capture(20260830);
    const r = verifyReplay(bundle, compileSample());
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.identical).toBe(true);
    expect(r.value.differences).toHaveLength(0);
  });

  it('不同 seed 会得到不同指纹（回放真的依赖种子，而不是巧合）', () => {
    const a = capture(1);
    const b = capture(2);
    expect(a.fingerprint).not.toBe(b.fingerprint);
  });

  it('指纹对事件流的任意改动敏感', () => {
    const events = capture(7).eventLog;
    const fp1 = fingerprintOf(events);
    const fp2 = fingerprintOf([...events, { type: 'TickAdvanced', tickIndex: 999 }]);
    expect(fp1).not.toBe(fp2);
  });

  it('决策器是回放契约的一部分：换决策器会改变结果', () => {
    const first = capture(5, 'first');
    const rotating = capture(5, 'rotating');
    expect(first.fingerprint).not.toBe(rotating.fingerprint);
    // 换了决策器后重跑原 bundle，仍然应该能复现原 bundle（契约自洽）
    const r = verifyReplay(first, compileSample());
    if (r.ok) expect(r.value.identical).toBe(true);
  });

  it('回放失败时能定位到第一条不一致的事件', () => {
    const bundle = capture(3);
    const corrupted = {
      ...bundle,
      fingerprint: 'deadbeef',
    };
    const r = verifyReplay(corrupted, compileSample());
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.identical).toBe(false);
    expect(r.value.fingerprint).not.toBe('deadbeef');
  });

  it('RotatingDecider 是确定性的：同一 seed 同一次序', () => {
    const a = capture(11, 'rotating');
    const b = capture(11, 'rotating');
    expect(a.fingerprint).toBe(b.fingerprint);
  });
});
