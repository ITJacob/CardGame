// P7 传输端口：lobby（建房/加入/等待）+ channel（决策交换）。
// 实现两套：memoryChannel（单测，两端直连）与 firebaseChannel（Firestore）。
// 内核无感：channel 只搬运 DecisionInput，不碰任何战斗状态（见 P7_PLAN §3.3）。
import type { DecisionInput } from '../../kernel/execution/types'
import type { CreateRoomInput, JoinRoomInput, RoomRef, Side, StartInfo } from './types'

export interface MatchLobby {
  createRoom(input: CreateRoomInput): Promise<RoomRef>
  joinRoom(input: JoinRoomInput): Promise<RoomRef>
  /** 等对手就位（第二次快照触发），返回开战信息；数据版本不一致时抛错 */
  awaitStart(): Promise<StartInfo>
  /**
   * 快速匹配：找一间别人开着的等待房，返回房间码；无则 null。
   * 可选能力（内存通道不实现），UI 用可选调用。
   */
  findWaitingRoom?(): Promise<string | null>
}

export interface MatchChannel {
  readonly side: Side
  readonly roomId: string
  readonly myUid: string
  /** 本侧在 seq 决策点的选择 → 广播落库 */
  publish(seq: number, d: DecisionInput): Promise<void>
  /** 等待对侧在 seq 决策点的选择。★ 绝不本地回退（§3.4 铁律 1） */
  receive(seq: number, timeoutMs?: number): Promise<DecisionInput>
  /** 结束后交换事件指纹（§3.4 铁律 4） */
  publishFingerprint(fp: string): Promise<void>
  /** 等对手指纹；超时返回 null（不判负，只标记未验证） */
  receiveFingerprint(timeoutMs?: number): Promise<string | null>
}

/** 一物两用：UI 拿它建房/加入，runner 拿它交换决策 */
export interface MatchConnection extends MatchLobby, MatchChannel {}

/** 对侧 uid：host 看 guest，guest 看 host */
export function opponentOf(side: Side, info: { hostUid: string; guestUid: string }): string {
  return side === 'host' ? info.guestUid : info.hostUid
}

/**
 * ★ 决策规范形（wire 边界必用）。
 * 内核把传来的 ResolvedTarget 原样写进事件流，而 fingerprintOf 是 JSON.stringify——
 * **键序敏感**。Firestore 返回的 map 键序是字母序（{coord, occupant}），内核本地造的是
 * {occupant, coord}；不归一就会出现「局面相同、指纹不同」的假 desync（实测过）。
 * 故两端的输入都必须先过这里，再喂给 submitDecision。
 */
export function canonicalDecision(d: DecisionInput): DecisionInput {
  return d.map((t) => ({
    coord: { faction: t.coord.faction, lane: t.coord.lane, index: t.coord.index },
    occupant: t.occupant,
  }))
}
