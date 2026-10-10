// P4 闭环验收：解锁档案 → 生成 5 英雄 ×2 → 编队 → 真卡 AI vs AI。
// 运行：npm run check:roster [-- --seed 1 --classes sleepless,arbiter]
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { buildCatalog } from '../src/data/catalogBuild'
import { statusFileOf } from '../src/data/loader'
import type { Manifest, PathwayFile, StatusFile } from '../src/data/schema.types'
import { createCombat, fingerprintOf } from '../src/kernel'
import type { Catalog } from '../src/kernel/catalog/types'
import type { CombatFacade } from '../src/kernel/combat/types'
import type { DecisionInput } from '../src/kernel/execution/types'
import { Mulberry32RandomSource } from '../src/kernel/shared/random-source'
import { CONSTITUTIONS } from '../src/meta/constitution'
import { generateHeroes } from '../src/meta/herogen'
import { autoFormation, validateFormation } from '../src/meta/formation'
import { buildCombatSetup } from '../src/meta/buildSetup'
import { newProfile, unlockClass } from '../src/meta/progression'

interface Handle extends CombatFacade {
  diagnostic(): { warnings: readonly string[]; unsupported: number; unsupportedKinds: Record<string, number> }
}

const docsDir = fileURLToPath(new URL('../../docs/json/', import.meta.url))
const read = <T,>(rel: string): T => JSON.parse(readFileSync(docsDir + rel, 'utf8')) as T
const arg = (n: string, d: string): string => {
  const i = process.argv.indexOf(`--${n}`)
  return i >= 0 ? (process.argv[i + 1] ?? d) : d
}

const seed = Number(arg('seed', '1'))
const classes = arg('classes', 'sleepless,arbiter').split(',').filter(Boolean)

const manifest = read<Manifest>('manifest.json')
const files = manifest.pathways.map((p) => read<PathwayFile>(p.file))
const statusFiles = manifest.pathways.map((p) => read<StatusFile>(statusFileOf(p.file)))
const common = read<StatusFile>('common.statuses.json')
const catalog: Catalog = buildCatalog(files, {
  globalStatusDefs: [...(common.statusDefs ?? []), ...statusFiles.flatMap((s) => s.statusDefs ?? [])],
}).catalog

let profile = newProfile(classes[0] as string)
for (const c of classes.slice(1)) profile = unlockClass(profile, c)

const constitutionIds = CONSTITUTIONS.map((c) => c.id)
const ctx = (s: number) => ({
  catalog,
  random: new Mulberry32RandomSource(s),
  unlockedClasses: profile.unlockedClasses,
  unlockedCards: undefined, // 空 = 该职业全部卡可用
  constitutionIds,
})

const own = autoFormation(generateHeroes(ctx(seed), 5, 'A'), 'A')
const enemy = autoFormation(generateHeroes(ctx(seed + 1), 5, 'B'), 'B')

console.log(`档案 uuid=${profile.uuid.slice(0, 8)}  解锁职业 ${profile.unlockedClasses.join(', ')}`)
console.log(`体质池 ${CONSTITUTIONS.length} 种 · 力敏智组合 ${10} 种\n`)

const show = (label: string, heroes: typeof own): void => {
  console.log(`${label}（${heroes.length} 人）：`)
  for (const h of heroes) {
    const combo = `${h.combo.strength}/${h.combo.agility}/${h.combo.intelligence}`
    console.log(
      `  ${h.id.padEnd(8)} 力敏智 ${combo.padEnd(6)} 体质 ${h.constitutionId.padEnd(10)} 职业 ${h.classId.padEnd(10)}` +
        ` 主动 ${h.activeSkillIds.length} 被动 ${h.passiveSkillIds.length}  @${h.coordinate.lane}#${h.coordinate.index}`,
    )
  }
}
show('我方', own)
show('敌方', enemy)

const errors = [...validateFormation(own), ...validateFormation(enemy)]
console.log(`\n编队校验：${errors.length === 0 ? '合法' : errors.join(' / ')}`)

const combat = createCombat(buildCombatSetup({ seed, catalog, own, enemy })) as Handle
let steps = 0
while (!combat.ended() && steps < 200000) {
  steps += 1
  const pending = combat.pendingDecision()
  if (pending) {
    combat.submitDecision(pending.candidates.slice(0, pending.pickCount) as DecisionInput)
    continue
  }
  combat.step()
}
const ended = combat.ended()
const diag = combat.diagnostic()
console.log(
  `\n对局 ${ended?.outcome ?? 'UNFINISHED'}  tick ${ended?.stats.ticks ?? 0}  事件 ${(ended?.events ?? []).length}  指纹 ${fingerprintOf(ended?.events ?? [])}`,
)
console.log(`未支持原语 ${diag.unsupported}${diag.unsupported > 0 ? `（${JSON.stringify(diag.unsupportedKinds)}）` : ''}`)
