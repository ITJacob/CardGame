// 数据版本锚点的核心工具（node）：稳定哈希 + 逐项索引。
// 与 schema 版本解耦——纯 JSON 结构遍历，因此可用于跨版本对比（旧提交的数据也能索引）。
// 消费方：data-pin / data-status（脚本）、vite.config（构建注入）。

import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Manifest } from '../../src/data/schema.types'

/** 读取数据文件的抽象：rel 相对 docs/json/；不存在返回 null */
export type FileReader = (rel: string) => string | null

/** 键排序后的稳定序列化：免疫键序与格式差异 */
export function stableStringify(v: unknown): string {
  return JSON.stringify(sortKeys(v))
}

function sortKeys(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(sortKeys)
  if (v && typeof v === 'object') {
    const src = v as Record<string, unknown>
    const out: Record<string, unknown> = {}
    for (const k of Object.keys(src).sort()) out[k] = sortKeys(src[k])
    return out
  }
  return v
}

export function sha256(s: string): string {
  return createHash('sha256').update(s, 'utf8').digest('hex')
}

export function readFromFs(docsDir: string): FileReader {
  return (rel) => {
    const p = join(docsDir, rel)
    return existsSync(p) ? readFileSync(p, 'utf8') : null
  }
}

/** 从某个提交读 docs/json/<rel>；用于对账时重建旧版数据 */
export function readFromGit(repoRoot: string, sha: string): FileReader {
  return (rel) => {
    try {
      return execFileSync('git', ['show', `${sha}:docs/json/${rel}`], {
        cwd: repoRoot,
        encoding: 'utf8',
        maxBuffer: 128 * 1024 * 1024,
        stdio: ['ignore', 'pipe', 'ignore'],
      })
    } catch {
      return null
    }
  }
}

export function gitHead(repoRoot: string): string {
  try {
    return execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repoRoot, encoding: 'utf8' }).trim()
  } catch {
    return 'unknown'
  }
}

export interface ItemIndex {
  pathways: number
  cards: Record<string, string>
  statuses: Record<string, string>
  zoneDefs: Record<string, string>
  domainDefs: Record<string, string>
  unitDefs: Record<string, string>
}

export interface DataIndex {
  manifest: Manifest
  dataHash: string
  perFile: Record<string, string>
  items: ItemIndex
}

/** 列出 docs/json 下参与版本的数据文件（依 manifest 枚举） */
export function listDataFiles(manifest: Manifest, read: FileReader): string[] {
  const names = new Set<string>(['manifest.json'])
  if (read('common.statuses.json') != null) names.add('common.statuses.json')
  for (const p of manifest.pathways) {
    names.add(p.file)
    names.add(p.file.replace(/\.skills\.json$/, '.statuses.json'))
  }
  return [...names].sort()
}

function indexById(arr: unknown, into: Record<string, string>): void {
  if (!Array.isArray(arr)) return
  for (const it of arr) {
    if (it && typeof it === 'object' && typeof (it as { id?: unknown }).id === 'string') {
      into[(it as { id: string }).id] = sha256(stableStringify(it))
    }
  }
}

/** 对一组数据文件计算整体哈希、逐文件哈希与逐项索引 */
export function readDataIndex(read: FileReader): DataIndex {
  const manifestRaw = read('manifest.json')
  if (!manifestRaw) throw new Error('manifest.json 不可读')
  const manifest = JSON.parse(manifestRaw) as Manifest
  const names = listDataFiles(manifest, read)

  const perFile: Record<string, string> = {}
  const items: ItemIndex = {
    pathways: manifest.pathways.length,
    cards: {}, statuses: {}, zoneDefs: {}, domainDefs: {}, unitDefs: {},
  }

  for (const name of names) {
    const raw = read(name)
    if (raw == null) {
      perFile[name] = 'MISSING'
      continue
    }
    const parsed = JSON.parse(raw) as Record<string, unknown>
    perFile[name] = sha256(stableStringify(parsed))

    if (name.endsWith('.skills.json')) {
      indexById(parsed.cards, items.cards)
      indexById(parsed.zoneDefs, items.zoneDefs)
      indexById(parsed.domainDefs, items.domainDefs)
      indexById(parsed.unitDefs, items.unitDefs)
    } else if (name.endsWith('.statuses.json')) {
      indexById(parsed.statusDefs, items.statuses)
    }
  }

  const dataHash = sha256(names.map((n) => `${n}:${perFile[n]}`).join('\n'))
  return { manifest, dataHash, perFile, items }
}

export interface LockFile {
  docsRef: string
  docsTag: string | null
  dataHash: string
  schemaVersion: string
  sourceVersion: string
  counts: Record<string, number>
  verifiedAt: string
  note: string
}

export function countsOf(items: ItemIndex): Record<string, number> {
  return {
    pathways: items.pathways,
    cards: Object.keys(items.cards).length,
    statuses: Object.keys(items.statuses).length,
    zoneDefs: Object.keys(items.zoneDefs).length,
    domainDefs: Object.keys(items.domainDefs).length,
    unitDefs: Object.keys(items.unitDefs).length,
  }
}

export function shortHash(h: string): string {
  return h.slice(0, 8)
}
