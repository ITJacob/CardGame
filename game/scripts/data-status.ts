// 增量对账：当前 docs/json 是否偏离 game 端验收基线？偏离则列出精确变更项。
// 运行：npm run data:status（默认告警，退出码 0）；--strict 时漂移即退出 1。
// 需要完整 git 历史（对账时用 git show 重建基线版本的数据）。

import { appendFileSync, existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import {
  readDataIndex, readFromFs, readFromGit, shortHash,
  type DataIndex, type LockFile,
} from './lib/data-index'

const repoRoot = fileURLToPath(new URL('../..', import.meta.url))
const docsDir = join(repoRoot, 'docs', 'json')
const lockPath = join(repoRoot, 'game', 'data.lock.json')
const strict = process.argv.includes('--strict')

const lines: string[] = []
const say = (s = ''): void => {
  console.log(s)
  lines.push(s)
}

if (!existsSync(lockPath)) {
  console.error('缺少 game/data.lock.json —— 先运行 npm run data:pin')
  process.exit(1)
}

const lock = JSON.parse(readFileSync(lockPath, 'utf8')) as LockFile
const cur = readDataIndex(readFromFs(docsDir))

if (cur.dataHash === lock.dataHash) {
  say(`数据未漂移：与验收基线一致（${shortHash(cur.dataHash)}，docsRef ${lock.docsRef.slice(0, 8)}）`)
  flush()
  process.exit(0)
}

say(`数据已漂移：基线 docsRef ${lock.docsRef.slice(0, 8)}（${shortHash(lock.dataHash)}）`)
say(`          当前          （${shortHash(cur.dataHash)}）`)
say()

let old: DataIndex | null = null
try {
  old = readDataIndex(readFromGit(repoRoot, lock.docsRef))
} catch {
  say(`（无法从 git 重建基线版本，仅报哈希级漂移；请确认 fetch-depth 完整）`)
}

if (old) {
  const changedFiles = Object.keys({ ...cur.perFile, ...old.perFile })
    .filter((n) => cur.perFile[n] !== old.perFile[n])
    .sort()
  say(`变更文件 ${changedFiles.length}：`)
  for (const n of changedFiles) say(`  - ${n}`)
  say()

  const KINDS = ['cards', 'statuses', 'zoneDefs', 'domainDefs', 'unitDefs'] as const
  const affected: string[] = []
  for (const kind of KINDS) {
    const a = old.items[kind]
    const b = cur.items[kind]
    const added = Object.keys(b).filter((id) => !(id in a))
    const removed = Object.keys(a).filter((id) => !(id in b))
    const changed = Object.keys(b).filter((id) => id in a && a[id] !== b[id])
    if (added.length + removed.length + changed.length === 0) continue
    say(`${kind.padEnd(11)} +${added.length} / -${removed.length} / ~${changed.length}`)
    for (const id of added) affected.push(`  ${kind} + ${id}`)
    for (const id of removed) affected.push(`  ${kind} - ${id}`)
    for (const id of changed) affected.push(`  ${kind} ~ ${id}`)
  }
  say()
  say(`受影响 Def：${affected.length} 项${affected.length > 40 ? '（列前 40）' : ''}`)
  for (const l of affected.slice(0, 40)) say(l)
}

flush()
process.exit(strict ? 1 : 0)

function flush(): void {
  const summary = process.env.GITHUB_STEP_SUMMARY
  if (summary) {
    try {
      appendFileSync(summary, `### 数据漂移对账\n\n\`\`\`\n${lines.join('\n')}\n\`\`\`\n`, 'utf8')
    } catch {
      /* 忽略 */
    }
  }
}
