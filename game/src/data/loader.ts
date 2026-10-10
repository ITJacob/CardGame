// 数据接入层入口：相对路径 ./docs/json/ 在 dev（base /，Vite 中间件映射仓库 docs/）
// 与 prod（base /CardGame/，docs/ 与 index.html 同层）下都解析正确——运行时直读，不拷贝。
//
// 数据面：<途径>.skills.json（卡）+ <途径>.statuses.json（状态）+ common.statuses.json（公共状态）。
// 浏览器用 createHttpSource()；node 校验脚本自行提供 fs 版 CatalogSource（接口一致）。

import type { Catalog } from '../kernel/catalog/types'
import { buildCatalog, type BuildReport } from './catalogBuild'
import type { Manifest, PathwayFile, StatusFile } from './schema.types'

const DOCS_BASE = './docs/json/'

/** <途径>.skills.json → <途径>.statuses.json */
export function statusFileOf(skillsFile: string): string {
  return skillsFile.replace(/\.skills\.json$/, '.statuses.json')
}

export interface CatalogSource {
  manifest(): Promise<Manifest>
  pathway(file: string): Promise<PathwayFile>
  statuses(file: string): Promise<StatusFile>
  commonStatuses?(): Promise<StatusFile>
}

export function createHttpSource(base: string = DOCS_BASE): CatalogSource {
  const get = async <T>(rel: string): Promise<T> => {
    const res = await fetch(base + rel)
    if (!res.ok) throw new Error(`${rel} → HTTP ${res.status}`)
    return (await res.json()) as T
  }
  return {
    manifest: () => get<Manifest>('manifest.json'),
    pathway: (file) => get<PathwayFile>(file),
    statuses: (file) => get<StatusFile>(file),
    commonStatuses: () => get<StatusFile>('common.statuses.json'),
  }
}

export function loadManifest(source: CatalogSource = createHttpSource()): Promise<Manifest> {
  return source.manifest()
}

export interface LoadedCatalog {
  manifest: Manifest
  catalog: Catalog
  report: BuildReport
}

/**
 * 加载并编译 Catalog。
 * @param opts.pathways 只加载指定途径 id（缺省 = manifest 全部）；战斗只加载参战途径
 */
export async function loadCatalog(
  source: CatalogSource = createHttpSource(),
  opts: { pathways?: readonly string[] } = {},
): Promise<LoadedCatalog> {
  const manifest = await source.manifest()
  const wanted = opts.pathways ? new Set(opts.pathways) : null
  const entries = manifest.pathways.filter((p) => !wanted || wanted.has(p.id))

  const [files, statusFiles, common] = await Promise.all([
    Promise.all(entries.map((p) => source.pathway(p.file))),
    Promise.all(entries.map((p) => source.statuses(statusFileOf(p.file)))),
    source.commonStatuses ? source.commonStatuses().catch(() => ({ statusDefs: [] })) : Promise.resolve({ statusDefs: [] }),
  ])

  const globalStatusDefs = [
    ...(common.statusDefs ?? []),
    ...statusFiles.flatMap((s) => s.statusDefs ?? []),
  ]

  const { catalog, report } = buildCatalog(files, { globalStatusDefs })
  return { manifest, catalog, report }
}

export type { Manifest, PathwayEntry, PathwayFile, StatusFile } from './schema.types'
