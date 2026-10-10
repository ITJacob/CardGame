// 构建时注入的数据版本信息（vite define: __DATA_VERSION__）。
// 用途：设置页展示「本构建基于哪一版 docs/json」；stale=true 表示数据已漂移但未重新验收。

export interface DataVersion {
  /** 验收基线所属提交（game/data.lock.json 的 docsRef） */
  docsRef: string
  docsTag: string | null
  /** 构建时读到的当前数据整体哈希 */
  dataHash: string
  /** lock 中登记的验收基线哈希 */
  lockHash: string
  /** 当前数据 ≠ 验收基线 */
  stale: boolean
  schemaVersion: string
  sourceVersion: string
  counts: Record<string, number>
  verifiedAt: string
  buildTime: string
  gameSha: string
}

export const dataVersion: DataVersion = __DATA_VERSION__

export function shortHash(h: string): string {
  return h.slice(0, 8)
}
