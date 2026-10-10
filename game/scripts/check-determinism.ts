// 确定性验收：同 seed 两次运行，事件流指纹必须逐位相同。
// 运行：npm run check:determinism（不一致则退出 1）。
import { createCombat, fingerprintOf } from '../src/kernel'
import { buildAiVsAiSetup, runToEnd } from '../tests/helpers/fixture'
import type { CombatFacade } from '../src/kernel/combat/types'

interface Handle extends CombatFacade {
  diagnostic(): { warnings: readonly string[]; unsupported: number }
}

function runOnce(seed: number): { fingerprint: string; ticks: number; events: number; unsupported: number; warnings: string[] } {
  const setup = buildAiVsAiSetup({
    seed,
    unitsPerSide: 3,
    skills: ['fix_strike', 'fix_hex', 'fix_bless', 'fix_crush', 'fix_gamble', 'fix_yank', 'fix_purge', 'fix_siphon', 'fix_summon', 'fix_ward'],
  })
  const combat = createCombat(setup) as Handle
  runToEnd(combat)
  const ended = combat.ended()
  const events = ended?.events ?? combat.drainEvents()
  const diag = combat.diagnostic()
  return {
    fingerprint: fingerprintOf(events),
    ticks: ended?.stats.ticks ?? 0,
    events: events.length,
    unsupported: diag.unsupported,
    warnings: [...diag.warnings],
  }
}

const seeds = [1, 12345, 999983]
let failures = 0
for (const seed of seeds) {
  const a = runOnce(seed)
  const b = runOnce(seed)
  const identical = a.fingerprint === b.fingerprint && JSON.stringify(a) === JSON.stringify(b)
  console.log(
    `seed ${seed}  指纹 ${a.fingerprint}  tick ${a.ticks}  事件 ${a.events}  未支持原语命中 ${a.unsupported}  ${identical ? '✓ 逐位相同' : '✗ 不一致'}`,
  )
  if (!identical) {
    failures += 1
    console.error('  A:', a)
    console.error('  B:', b)
  }
}

if (failures > 0) {
  console.error(`\n${failures} 个 seed 未通过确定性验收`)
  process.exit(1)
}
console.log('\nOK：全部 seed 同 seed 两次运行逐位相同。')
