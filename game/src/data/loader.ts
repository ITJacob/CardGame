// 数据接入层：唯一允许触碰 docs/json 的模块。
// 相对路径 ./docs/json/ 在 dev（base /，由 vite 中间件映射）与
// prod（base /CardGame/，docs/ 与 index.html 同层）下都解析正确。

const DOCS_BASE = './docs/json/'

export interface PathwayEntry {
  id: string
  name: string
  file: string
  cardCount: number
  sourceFile: string
}

export interface Manifest {
  schemaVersion: string
  sourceVersion: string
  pathways: PathwayEntry[]
}

export async function fetchJson<T>(relPath: string): Promise<T> {
  const res = await fetch(DOCS_BASE + relPath)
  if (!res.ok) throw new Error(`${relPath} → HTTP ${res.status}`)
  return (await res.json()) as T
}

export function loadManifest(): Promise<Manifest> {
  return fetchJson<Manifest>('manifest.json')
}
