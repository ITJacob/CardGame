// 数据版本锚点：把「当前 docs/json」登记为 game 端验收基线。
// 运行：npm run data:pin —— 仅在「验收完当前数据」后运行，不随每次数据改动更新。

import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import {
  countsOf, gitHead, readDataIndex, readFromFs, shortHash, type LockFile,
} from './lib/data-index'

const repoRoot = fileURLToPath(new URL('../..', import.meta.url))
const docsDir = join(repoRoot, 'docs', 'json')
const lockPath = join(repoRoot, 'game', 'data.lock.json')

const idx = readDataIndex(readFromFs(docsDir))

const lock: LockFile = {
  docsRef: gitHead(repoRoot),
  docsTag: null,
  dataHash: idx.dataHash,
  schemaVersion: idx.manifest.schemaVersion,
  sourceVersion: idx.manifest.sourceVersion,
  counts: countsOf(idx.items),
  verifiedAt: new Date().toISOString().slice(0, 10),
  note: 'game 端数据版本锚点；由 npm run data:pin 生成，勿手改',
}

writeFileSync(lockPath, `${JSON.stringify(lock, null, 2)}\n`, 'utf8')

console.log(`已登记数据版本 → game/data.lock.json`)
console.log(`  docsRef ${lock.docsRef.slice(0, 8)}  dataHash ${shortHash(lock.dataHash)}`)
console.log(`  schema ${lock.schemaVersion} / source ${lock.sourceVersion}`)
console.log(`  计数 ${JSON.stringify(lock.counts)}`)
