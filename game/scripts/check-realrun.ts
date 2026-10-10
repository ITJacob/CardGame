// P3：真实卡池无头对战覆盖扫描——用 docs/json 的真卡建队跑 AI vs AI，
// 逐途径统计「未支持原语 / warning」并验确定性，用来定位接真数据后的缺口。
// 运行：npm run check:realrun -- [--pathway <id|all>] [--units 3] [--skills 4] [--seed 1]
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { buildCatalog } from '../src/data/catalogBuild'
import { statusFileOf } from '../src/data/loader'
import type { Manifest, PathwayFile, StatusFile } from '../src/data/schema.types'
import { createCombat, fingerprintOf } from '../src/kernel'
import type { Catalog } from '../src/kernel/catalog/types'
import type { CombatFacade, CombatSetup } from '../src/kernel/combat/types'
import type { DecisionInput } from '../src/kernel/execution/types'

interface Handle extends CombatFacade {
  diagnostic(): { warnings: readonly string[]; unsupported: number; unsupportedKinds: Record<string, number> }
}

const docsDir = fileURLToPath(new URL('../../docs/json/', import.meta.url))
const read = <T,>(rel: string): T => JSON.parse(readFileSync(docsDir + rel, 'utf8')) as T

function arg(name: string, fallback: string): string {
  const i = process.argv.indexOf(`--${name}`)
  return i >= 0 ? (process.argv[i + 1] ?? fallback) : fallback
}

const pathwayArg = arg('pathway', 'all')
const unitsPerSide = Number(arg('units', '3'))
const skillsPerUnit = Number(arg('skills', '4'))
const seed = Number(arg('seed', '1'))

const manifest = read<Manifest>('manifest.json')
const files = manifest.pathways.map((p) => read<PathwayFile>(p.file))
const statusFiles = manifest.pathways.map((p) => read<StatusFile>(statusFileOf(p.file)))
const common = read<StatusFile>('common.statuses.json')
const catalog: Catalog = buildCatalog(files, {
  globalStatusDefs: [...(common.statusDefs ?? []), ...statusFiles.flatMap((s) => s.statusDefs ?? [])],
}).catalog

function pick<T>(arr: T[], n: number): T[] {
  if (arr.length <= n) return [...arr]
  const step = arr.length / n
  return Array.from({ length: n }, (_, i) => arr[Math.floor(i * step)] as T)
}

function buildSetup(_file: PathwayFile, skills: string[]): CombatSetup {
  const makeUnits = (faction: string): CombatSetup['factions'][number]['units'] =>
    Array.from({ length: unitsPerSide }, (_, i) => ({
      unitId: `${faction}_u${i}`,
      coordinate: { faction, lane: 'lane0', index: i },
      attributeSet: { strength: 1 + (i % 3), agility: 1, intelligence: 2, rank: 0 },
      gender: 'male' as const,
      anchor: 0,
      activeSlots: skills.map((s) => ({ skillDefId: s })),
      initialStatuses: [],
    }))
  return {
    seed,
    catalog,
    board: { clock: { base: 0 }, domainGrants: [] },
    factions: [
      { id: 'A', name: '甲', units: makeUnits('A') },
      { id: 'B', name: '乙', units: makeUnits('B') },
    ],
    inputs: { decisions: new Map() },
  }
}

function runOnce(setup: CombatSetup): { fingerprint: string; ticks: number; events: number; units: number; outcome: string; unsupported: number; kinds: Record<string, number>; warnings: readonly string[] } {
  const combat = createCombat(setup) as Handle
  let steps = 0
  while (!combat.ended() && steps < 200000) {
    steps += 1
    const pending = combat.pendingDecision()
    if (pending) {
      const picks: DecisionInput = pending.candidates.slice(0, pending.pickCount)
      combat.submitDecision(picks)
      continue
    }
    combat.step()
  }
  const ended = combat.ended()
  const diag = combat.diagnostic()
  const events = ended?.events ?? []
  return {
    fingerprint: fingerprintOf(events),
    ticks: ended?.stats.ticks ?? 0,
    events: events.length,
    units: ended?.finalState.units.length ?? 0,
    outcome: ended?.outcome ?? 'UNFINISHED',
    unsupported: diag.unsupported,
    kinds: diag.unsupportedKinds,
    warnings: diag.warnings,
  }
}

const targets = pathwayArg === 'all' ? manifest.pathways : manifest.pathways.filter((p) => p.id === pathwayArg)
if (targets.length === 0) {
  console.error(`未知途径 ${pathwayArg}`)
  process.exit(1)
}

const aggKinds = new Map<string, number>()
const aggWarnings = new Map<string, number>()
let totalUnsupported = 0
let nonDeterministic = 0
let unfinished = 0

console.log(`真实卡池冒烟：${targets.length} 途径 × 2 队 × ${unitsPerSide} 人 × ${skillsPerUnit} 技能  seed=${seed}\n`)
console.log('途径'.padEnd(20) + '结果'.padEnd(10) + 'tick'.padEnd(6) + '事件'.padEnd(7) + '未支持'.padEnd(7) + '确定性')

for (const entry of targets) {
  const file = files.find((f) => f.pathwayId === entry.id) as PathwayFile
  const activeIds = file.cards.filter((c) => c.kind === 'active').map((c) => c.id)
  const skills = pick(activeIds, skillsPerUnit)
  const setup = buildSetup(file, skills)
  const a = runOnce(setup)
  const b = runOnce(setup)
  const deterministic = a.fingerprint === b.fingerprint
  if (!deterministic) nonDeterministic += 1
  if (a.outcome === 'UNFINISHED' || a.outcome === 'draw') unfinished += 1
  totalUnsupported += a.unsupported
  for (const [k, n] of Object.entries(a.kinds)) aggKinds.set(k, (aggKinds.get(k) ?? 0) + n)
  for (const w of a.warnings) {
    const key = w.replace(/\(.*\)/, '').trim()
    aggWarnings.set(key, (aggWarnings.get(key) ?? 0) + 1)
  }
  console.log(
    entry.name.padEnd(20) +
      a.outcome.padEnd(10) +
      String(a.ticks).padEnd(6) +
      String(a.events).padEnd(7) +
      String(a.unsupported).padEnd(7) +
      (deterministic ? '✓' : '✗'),
  )
}

console.log(`\n合计：未支持命中 ${totalUnsupported} · 非确定性 ${nonDeterministic} · 未结束/平局 ${unfinished}`)
const kinds = [...aggKinds.entries()].sort((x, y) => y[1] - x[1])
console.log('\n降级点（未支持 / 未实现分支）：')
if (kinds.length === 0) console.log('  （无）')
else for (const [k, n] of kinds) console.log(`  ${k} × ${n}`)

const warns = [...aggWarnings.entries()].sort((x, y) => y[1] - x[1]).slice(0, 15)
if (warns.length > 0) {
  console.log('\nwarning 聚合（去重后 Top 15）：')
  for (const [w, n] of warns) console.log(`  ${n}× ${w}`)
}
