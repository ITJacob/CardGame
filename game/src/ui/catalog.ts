// 浏览器侧 Catalog 单例（懒加载 + 缓存）
import { loadCatalog } from '../data/loader'
import type { Catalog } from '../kernel/catalog/types'

let cache: Promise<Catalog> | null = null

export function getCatalog(): Promise<Catalog> {
  if (!cache) cache = loadCatalog().then((r) => r.catalog)
  return cache
}
