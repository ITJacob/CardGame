// 内存双工通道：单测用的「假 Firestore」。两端直连，语义与 firebaseChannel 对齐
// （发布即 JSON 落库、只读对侧文档、指纹写房间字段）。
import type { DecisionInput } from '../../kernel/execution/types'
import type { MatchConnection } from './channel'
import type { CreateRoomInput, JoinRoomInput, MoveDoc, RoomDoc, RoomRef, Side, StartInfo } from './types'

export interface MemRoom {
  id: string
  doc: RoomDoc
  moves: Map<string, MoveDoc>
  listeners: Set<() => void>
}

interface MemNet {
  rooms: Map<string, MemRoom>
  nextCode: number
}

export interface MemoryMatchPair {
  host: MemoryMatch
  guest: MemoryMatch
  /** 仅供测试观察/断言 */
  net: { rooms: Map<string, MemRoom> }
}

/** JSON 往返，模拟 Firestore 的序列化（抓出不可上线的 payload） */
function onWire<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T
}

function waitFor(room: MemRoom, cond: () => boolean, timeoutMs?: number): Promise<void> {
  if (cond()) return Promise.resolve()
  return new Promise<void>((resolve, reject) => {
    let timer: ReturnType<typeof setTimeout> | null = null
    const check = (): void => {
      if (!cond()) return
      cleanup()
      resolve()
    }
    const cleanup = (): void => {
      room.listeners.delete(check)
      if (timer !== null) clearTimeout(timer)
    }
    room.listeners.add(check)
    if (timeoutMs !== undefined && timeoutMs > 0) {
      timer = setTimeout(() => {
        cleanup()
        reject(new Error('等待超时'))
      }, timeoutMs)
      ;(timer as unknown as { unref?: () => void }).unref?.()
    }
  })
}

function notify(room: MemRoom): void {
  for (const l of [...room.listeners]) l()
}

export class MemoryMatch implements MatchConnection {
  readonly side: Side
  readonly myUid: string
  private readonly net: MemNet
  private room: MemRoom | null = null
  private myDataHash = ''

  constructor(side: Side, net: MemNet) {
    this.side = side
    this.myUid = side === 'host' ? 'mem-host' : 'mem-guest'
    this.net = net
  }

  get roomId(): string {
    return this.current.id
  }

  private get current(): MemRoom {
    if (!this.room) throw new Error('还没建房或加入房间')
    return this.room
  }

  async createRoom(input: CreateRoomInput): Promise<RoomRef> {
    if (this.side !== 'host') throw new Error('只有房主可以建房')
    const id = `MEM${++this.net.nextCode}`
    const doc: RoomDoc = {
      host: this.myUid,
      guest: null,
      status: 'waiting',
      seed: input.seed,
      dataHash: input.dataHash,
      guestDataHash: null,
      hostRoster: onWire([...input.roster]),
      guestRoster: null,
      createdAt: 0,
    }
    this.myDataHash = input.dataHash
    const room: MemRoom = { id, doc, moves: new Map(), listeners: new Set() }
    this.net.rooms.set(id, room)
    this.room = room
    return { roomId: id, code: id }
  }

  async joinRoom(input: JoinRoomInput): Promise<RoomRef> {
    if (this.side !== 'guest') throw new Error('房主不需要加入')
    const room = this.net.rooms.get(input.code)
    if (!room) throw new Error('房间不存在')
    if (room.doc.guest !== null) throw new Error('房间已满')
    if (room.doc.host === this.myUid) throw new Error('不能加入自己的房间')
    if (room.doc.dataHash !== input.dataHash) throw new Error('数据版本不一致，无法开战')
    this.myDataHash = input.dataHash
    room.doc.guest = this.myUid
    room.doc.guestDataHash = input.dataHash
    room.doc.guestRoster = onWire([...input.roster])
    room.doc.status = 'ready'
    this.room = room
    notify(room)
    return { roomId: room.id, code: room.id }
  }

  async awaitStart(): Promise<StartInfo> {
    const room = this.current
    if (this.side === 'host') {
      await waitFor(room, () => room.doc.guest !== null)
      if (room.doc.guestDataHash !== this.myDataHash) throw new Error('对手数据版本不一致，拒绝开战')
      room.doc.status = 'playing'
      notify(room)
    }
    const { doc } = room
    if (doc.guest === null || doc.guestRoster === null) throw new Error('对手名册缺失')
    return {
      roomId: room.id,
      seed: doc.seed,
      hostUid: doc.host,
      guestUid: doc.guest,
      hostRoster: doc.hostRoster,
      guestRoster: doc.guestRoster,
      dataHash: doc.dataHash,
    }
  }

  async publish(seq: number, d: DecisionInput): Promise<void> {
    const room = this.current
    const key = `${this.myUid}_${seq}`
    if (room.moves.has(key)) return
    room.moves.set(key, { uid: this.myUid, seq, decision: onWire(d) })
    notify(room)
  }

  async receive(seq: number, timeoutMs?: number): Promise<DecisionInput> {
    const room = this.current
    const uid = this.side === 'host' ? room.doc.guest : room.doc.host
    if (uid === null) throw new Error('对手还没就位')
    const key = `${uid}_${seq}`
    await waitFor(room, () => room.moves.has(key), timeoutMs)
    const move = room.moves.get(key)
    if (!move) throw new Error(`缺少决策 ${key}`)
    return move.decision
  }

  async publishFingerprint(fp: string): Promise<void> {
    const room = this.current
    room.doc.fingerprints = { ...(room.doc.fingerprints ?? {}), [this.myUid]: fp }
    notify(room)
  }

  async receiveFingerprint(timeoutMs?: number): Promise<string | null> {
    const room = this.current
    const uid = this.side === 'host' ? room.doc.guest : room.doc.host
    if (uid === null) return null
    try {
      await waitFor(room, () => room.doc.fingerprints?.[uid] !== undefined, timeoutMs)
    } catch {
      return null
    }
    return room.doc.fingerprints?.[uid] ?? null
  }
}

export function createMemoryMatchPair(): MemoryMatchPair {
  const net: MemNet = { rooms: new Map(), nextCode: 0 }
  return { host: new MemoryMatch('host', net), guest: new MemoryMatch('guest', net), net }
}
