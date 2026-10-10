// 事件流指纹（FNV-1a 32 位）+ 序列化。移植自 7e6d01f:src/replay/replay.ts。
// 用于「同 seed 逐位相同」验收：指纹一致即事件流逐位一致。

export function fingerprintOf(events: readonly unknown[]): string {
  const s = JSON.stringify(events)
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return (h >>> 0).toString(16).padStart(8, '0')
}

export function serializeReplay(payload: unknown): string {
  return JSON.stringify(payload)
}
