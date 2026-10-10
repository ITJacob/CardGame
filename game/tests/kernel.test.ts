import { describe, expect, it } from 'vitest'
import { createCombat, fingerprintOf } from '../src/kernel'
import { buildAiVsAiSetup, runToEnd } from './helpers/fixture'
import type { CombatFacade } from '../src/kernel/combat/types'

const SKILLS = ['fix_strike', 'fix_hex', 'fix_bless', 'fix_crush', 'fix_gamble', 'fix_mark']

describe('战斗聚合闭环', () => {
  it('同 seed 两次运行事件流逐位相同', () => {
    const run = (): string => {
      const c = createCombat(buildAiVsAiSetup({ seed: 777, unitsPerSide: 3, skills: SKILLS }))
      runToEnd(c)
      return fingerprintOf(c.ended()?.events ?? c.drainEvents())
    }
    expect(run()).toBe(run())
  })

  it('不同 seed 结果不同（随机点真实驱动）', () => {
    const run = (seed: number): string => {
      const c = createCombat(buildAiVsAiSetup({ seed, unitsPerSide: 3, skills: SKILLS }))
      runToEnd(c)
      return fingerprintOf(c.ended()?.events ?? c.drainEvents())
    }
    expect(run(1)).not.toBe(run(999983))
  })

  it('被动卡生效：装配 fix_passive 后事件流与未装配不同', () => {
    const run = (passives: string[]): string => {
      const c = createCombat(buildAiVsAiSetup({ seed: 9, unitsPerSide: 2, skills: ['fix_strike'], passives }))
      runToEnd(c)
      return fingerprintOf(c.ended()?.events ?? c.drainEvents())
    }
    expect(run(['fix_passive'])).not.toBe(run([]))
  })

  it('战斗会结束并产出结果', () => {
    const c: CombatFacade = createCombat(buildAiVsAiSetup({ seed: 5, unitsPerSide: 2, skills: SKILLS }))
    runToEnd(c)
    const ended = c.ended()
    expect(ended).not.toBeNull()
    expect(['side_a', 'side_b', 'draw', 'aborted']).toContain(ended!.outcome)
    expect(ended!.events.length).toBeGreaterThan(0)
    expect(ended!.stats.ticks).toBeGreaterThan(0)
  })

  it('Manual 目标：内核在决策点挂起，submitDecision 续跑', () => {
    const c: CombatFacade = createCombat(buildAiVsAiSetup({ seed: 31, unitsPerSide: 3, skills: ['fix_mark'] }))
    let sawPending = false
    let guard = 0
    while (!c.ended() && guard++ < 5000) {
      const pending = c.pendingDecision()
      if (pending) {
        sawPending = true
        expect(pending.candidates.length).toBeGreaterThan(0)
        c.submitDecision(pending.candidates.slice(0, pending.pickCount))
        continue
      }
      c.step()
    }
    expect(sawPending).toBe(true)
    expect(c.ended()).not.toBeNull()
  })
})
