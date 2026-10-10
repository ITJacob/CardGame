// P7 在线匹配：wire 类型。数据模型与安全规则见 game/P7_PLAN.md §一/§3.1。
// 原则：wire 上的一切都要 JSON 可序列化——ResolvedTarget 天然满足（见 execution/types.ts）。
import type { DecisionInput } from '../../kernel/execution/types'
import type { PlacedHero } from '../formation'

/** 座位：房主 = 规范阵营 'A'，加入者 = 'B'（§3.2） */
export type Side = 'host' | 'guest'

export type RoomStatus = 'waiting' | 'ready' | 'playing' | 'done' | 'aborted'

/** 一条决策落库（= 一次人工选靶）。docId 必须是 `${uid}_${seq}`（规则强制）。 */
export interface MoveDoc {
  uid: string
  seq: number
  decision: DecisionInput
}

/** rooms/{roomId} 文档形状 */
export interface RoomDoc {
  host: string
  guest: string | null
  status: RoomStatus
  /** 房主选定，双方共用 */
  seed: number
  /** 房主构建的 dataVersion.dataHash；guestDataHash 为加入者自查用 */
  dataHash: string
  guestDataHash?: string | null
  hostRoster: PlacedHero[]
  guestRoster: PlacedHero[] | null
  /** epoch ms */
  createdAt: number
  /** 结束时各端写入的事件指纹：{ [uid]: fingerprint } */
  fingerprints?: Record<string, string>
}

/** 开战所需全部信息（双方各自从房间文档派生，内容逐位一致） */
export interface StartInfo {
  roomId: string
  seed: number
  hostUid: string
  guestUid: string
  hostRoster: PlacedHero[]
  guestRoster: PlacedHero[]
  dataHash: string
}

export interface CreateRoomInput {
  roster: readonly PlacedHero[]
  seed: number
  dataHash: string
}

export interface JoinRoomInput {
  code: string
  roster: readonly PlacedHero[]
  dataHash: string
}

export interface RoomRef {
  roomId: string
  code: string
}
