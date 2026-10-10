import { describe, expect, it } from 'vitest'
import type { EffectOps } from '../src/kernel/effect/context'
import {
  handleAdvanceClock, handleDomain, handleEchoLastSkill, handleGaugeShuffle, handleModifyRuleSlot,
  handleModifySkill, handleRestoreSnapshot, handleSetLuminance, handleSnapshot,
  handleStatusShuffle, handleTargetOverride, handleWriteRuleSlot,
} from '../src/kernel/effect/handlers3'
import { registryOf, stubContext } from './helpers/context'
import { makeUnit } from './helpers/fixture'

/** 记录 ops 调用的桩 */
function recorder(): { calls: string[]; ops: Partial<EffectOps> } {
  const calls: string[] = []
  return {
    calls,
    ops: {
      setLuminance: (v, d) => calls.push(`lum:${v ?? `+${d}`}`),
      advanceClock: (t) => calls.push(`clock:${t}`),
      applyDomain: (op, def) => calls.push(`domain:${op}:${def}`),
      snapshotUnit: (_u, f) => calls.push(`snap:${f.join(',')}`),
      restoreUnit: (_u, f) => calls.push(`restore:${f.join(',')}`),
      echoLastSkill: (_u, p) => calls.push(`echo:${p}`),
      shuffleGauges: (_us, r) => calls.push(`gaugeShuffle:${r}`),
      shuffleStatuses: (_us, c) => calls.push(`statusShuffle:${c}`),
      modifySkillOf: (_u) => calls.push('modifySkill'),
      applyTargetOverride: (_u, s) => calls.push(`targetOverride:${s.anchor}`),
      writeRuleSlot: (n) => calls.push(`writeRule:${(n as { slot?: number }).slot}`),
      modifyRuleSlot: (n) => calls.push(`modifyRule:${(n as { mode?: string }).mode}`),
    },
  }
}

describe('P2b-2 原语 → ops 接线', () => {
  it('set_luminance / advance_clock 打到战场操作', () => {
    const u = makeUnit('u', 'A')
    const r = recorder()
    const ctx = stubContext(registryOf(u), null, [], r.ops)
    handleSetLuminance({ type: 'set_luminance', value: 8 }, null, ctx)
    handleAdvanceClock({ type: 'advance_clock', ticks: 3 }, null, ctx)
    expect(r.calls).toEqual(['lum:8', 'clock:3'])
  })

  it('snapshot / restore_snapshot 字段透传', () => {
    const u = makeUnit('u', 'A')
    const r = recorder()
    const ctx = stubContext(registryOf(u), null, [], r.ops)
    handleSnapshot({ type: 'snapshot', fields: ['hp', 'gauge'] } as never, u, ctx)
    handleRestoreSnapshot({ type: 'restore_snapshot', fields: ['hp'] } as never, u, ctx)
    expect(r.calls).toEqual(['snap:hp,gauge', 'restore:hp'])
  })

  it('domain / echo / shuffle / modify_skill 接线', () => {
    const a = makeUnit('a', 'A')
    const b = makeUnit('b', 'A')
    a.position = { faction: 'A', lane: 'lane0', index: 0 }
    b.position = { faction: 'A', lane: 'lane0', index: 1 }
    const r = recorder()
    const ctx = stubContext(registryOf(a, b), a, [], r.ops)
    handleDomain({ type: 'domain', op: 'overlay', def: 'd1', duration: 5 } as never, null, ctx)
    handleEchoLastSkill({ type: 'echo_last_skill', potency: 0.5 } as never, a, ctx)
    handleGaugeShuffle({ type: 'gauge_shuffle', resource: 'gauge.current' } as never, a, ctx)
    handleModifySkill({ type: 'modify_skill', skillRef: {} } as never, a, ctx)
    expect(r.calls).toEqual(['domain:overlay:d1', 'echo:0.5', 'gaugeShuffle:gauge.current', 'modifySkill'])
  })

  it('target_override / 规则槽 接线', () => {
    const u = makeUnit('u', 'A')
    const r = recorder()
    const ctx = stubContext(registryOf(u), null, [], r.ops)
    handleTargetOverride({ type: 'target_override', anchor: 'taunt_source' } as never, u, ctx)
    handleWriteRuleSlot({ type: 'write_rule_slot', slot: 0, field: 'trigger' } as never, null, ctx)
    handleModifyRuleSlot({ type: 'modify_rule_slot', slot: 1, mode: 'append' } as never, null, ctx)
    expect(r.calls).toEqual(['targetOverride:taunt_source', 'writeRule:0', 'modifyRule:append'])
  })

  it('status_shuffle 接线', () => {
    const a = makeUnit('a', 'A')
    const b = makeUnit('b', 'A')
    a.position = { faction: 'A', lane: 'lane0', index: 0 }
    b.position = { faction: 'A', lane: 'lane0', index: 1 }
    const r = recorder()
    const ctx = stubContext(registryOf(a, b), null, [], r.ops)
    handleStatusShuffle({ type: 'status_shuffle', mode: 'rotate', count: 1 } as never, a, ctx)
    expect(r.calls).toEqual(['statusShuffle:1'])
  })
})
