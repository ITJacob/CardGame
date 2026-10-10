// 全量 22 途径 Catalog 构建校验（node，读仓库 docs/json）。
// 运行：npm run check:catalog —— 有 warning 时以非零码退出。
// 复用浏览器侧同一套 catalogBuild；仅数据来源换成 fs。

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { buildCatalog } from '../src/data/catalogBuild'
import { statusFileOf } from '../src/data/loader'
import type { Manifest, PathwayFile, StatusFile } from '../src/data/schema.types'

const docsDir = fileURLToPath(new URL('../../docs/json/', import.meta.url))
const read = <T,>(rel: string): T => JSON.parse(readFileSync(docsDir + rel, 'utf8')) as T

const manifest = read<Manifest>('manifest.json')
const files = manifest.pathways.map((p) => read<PathwayFile>(p.file))
const statusFiles = manifest.pathways.map((p) => read<StatusFile>(statusFileOf(p.file)))

let common: StatusFile = { statusDefs: [] }
try {
  common = read<StatusFile>('common.statuses.json')
} catch {
  // common.statuses.json 可选
}

const globalStatusDefs = [...(common.statusDefs ?? []), ...statusFiles.flatMap((s) => s.statusDefs ?? [])]
const { report } = buildCatalog(files, { globalStatusDefs })
const c = report.counts

console.log(`途径 ${c.classDefs}  卡 ${c.cards}`)
console.log(`  EffectDef ${c.effectDefs}`)
console.log(`  SkillDef ${c.skillDefs}  BehaviorTemplate ${c.behaviorTemplates}`)
console.log(`  StatusDef ${c.statusDefs}  ZoneDef ${c.zoneDefs}  DomainDef ${c.domainDefs}  UnitDef ${c.unitDefs}`)
console.log(`  全局状态输入 ${globalStatusDefs.length}`)

if (report.warnings.length > 0) {
  console.error(`\n${report.warnings.length} 条 warning：`)
  for (const w of report.warnings.slice(0, 40)) console.error(`  - ${w}`)
  if (report.warnings.length > 40) console.error(`  … 其余 ${report.warnings.length - 40} 条略`)
  process.exit(1)
}

console.log('\nOK：引用全部可解析，无 warning。')
