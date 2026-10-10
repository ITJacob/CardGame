// Firestore 实现的传输端口（P7_PLAN §3.1）。规则原文见 P7_PLAN §一。
//
// 数据布局：
//   rooms/{code}                 房间文档（code 即 roomId，6 位随机码）
//   rooms/{code}/moves/{uid}_{seq}  一次决策一条，写后不可改（规则强制）
//
// 铁律 2（§3.4）：dataHash 不符一律拒绝开局，不降级。
import {
  collection, deleteDoc, doc, getDoc, getDocs, limit, onSnapshot, query, setDoc, updateDoc, where,
  type Unsubscribe,
} from 'firebase/firestore'
import type { DecisionInput } from '../../kernel/execution/types'
import { db, ensureUid } from '../firebase'
import type { MatchConnection } from './channel'
import type { CreateRoomInput, JoinRoomInput, MoveDoc, RoomDoc, RoomRef, Side, StartInfo } from './types'

/** 去掉易混字符（0/O、1/I）的 6 位房间码 */
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const CODE_LEN = 6
const AWAIT_OPPONENT_MS = 5 * 60 * 1000
const AWAIT_DECISION_MS = 60 * 1000
const AWAIT_FINGERPRINT_MS = 20 * 1000

function randomCode(): string {
  const buf = new Uint32Array(CODE_LEN)
  crypto.getRandomValues(buf)
  let s = ''
  for (let i = 0; i < CODE_LEN; i += 1) s += CODE_ALPHABET[(buf[i] as number) % CODE_ALPHABET.length]
  return s
}

function sameDecision(a: MoveDoc | undefined, b: MoveDoc): boolean {
  return a !== undefined && a.seq === b.seq && a.uid === b.uid && JSON.stringify(a.decision) === JSON.stringify(b.decision)
}

export class FirebaseMatch implements MatchConnection {
  private uid = ''
  private sideState: Side | null = null
  private roomIdState = ''
  private hostUid = ''
  private guestUid = ''
  private myDataHash = ''
  private unsubs: Unsubscribe[] = []

  get side(): Side {
    if (!this.sideState) throw new Error('尚未建房或加入房间')
    return this.sideState
  }
  get roomId(): string {
    return this.roomIdState
  }
  get myUid(): string {
    return this.uid
  }
  /** 离开房间时释放所有监听 */
  dispose(): void {
    for (const u of this.unsubs) u()
    this.unsubs = []
  }

  /**
   * 放弃仍在等待的房（房主离开等待页时调用）：删除房间文档。
   * 不删的话「快速匹配」会把人配到废弃房间，白等一场（P7_PLAN §七.4）。
   */
  async abandonRoom(): Promise<void> {
    if (this.sideState !== 'host' || !this.roomIdState) return
    try {
      const snap = await getDoc(this.roomRef())
      const data = snap.data() as RoomDoc | undefined
      if (data && data.status === 'waiting' && data.guest === null) await deleteDoc(this.roomRef())
    } catch {
      // 删不掉就算了（离线/无权限），不影响离开本页
    }
    this.dispose()
  }

  private roomRef() {
    return doc(db, 'rooms', this.roomIdState)
  }
  private moveRef(u: string, seq: number) {
    return doc(db, 'rooms', this.roomIdState, 'moves', `${u}_${seq}`)
  }
  private opponentUid(): string {
    return this.sideState === 'host' ? this.guestUid : this.hostUid
  }

  async createRoom(input: CreateRoomInput): Promise<RoomRef> {
    this.uid = await ensureUid()
    this.sideState = 'host'
    this.hostUid = this.uid
    this.myDataHash = input.dataHash
    let lastErr: unknown = new Error('建房失败')
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const code = randomCode()
      const payload: RoomDoc = {
        host: this.uid,
        guest: null,
        status: 'waiting',
        seed: input.seed,
        dataHash: input.dataHash,
        guestDataHash: null,
        hostRoster: [...input.roster],
        guestRoster: null,
        createdAt: Date.now(),
      }
      try {
        await setDoc(doc(db, 'rooms', code), payload)
        this.roomIdState = code
        return { roomId: code, code }
      } catch (e: unknown) {
        lastErr = e // 房间码碰撞（文档已存在 → 走 update 被规则拒）则换一个再试
      }
    }
    throw lastErr
  }

  async joinRoom(input: JoinRoomInput): Promise<RoomRef> {
    this.uid = await ensureUid()
    this.sideState = 'guest'
    const code = input.code.trim().toUpperCase()
    const ref = doc(db, 'rooms', code)
    const snap = await getDoc(ref)
    if (!snap.exists()) throw new Error('房间不存在或已解散')
    const data = snap.data() as RoomDoc
    if (data.host === this.uid) throw new Error('这是你自己的房间，把房间码发给对手')
    if (data.guest !== null) throw new Error('房间已满')
    if (data.dataHash !== input.dataHash) throw new Error('双方数据版本不一致，无法开战')
    this.roomIdState = code
    this.myDataHash = input.dataHash
    this.hostUid = data.host
    this.guestUid = this.uid
    await updateDoc(ref, {
      guest: this.uid,
      guestDataHash: input.dataHash,
      guestRoster: [...input.roster],
      status: 'ready',
    })
    return { roomId: code, code }
  }

  async awaitStart(): Promise<StartInfo> {
    if (!this.sideState) throw new Error('尚未建房或加入房间')
    // 房主：等 guest 出现；加入者：房间已是 ready，直接读一次
    const data =
      this.sideState === 'host'
        ? await this.waitForRoom((d) => d.guest !== null, AWAIT_OPPONENT_MS)
        : ((await getDoc(this.roomRef())).data() as RoomDoc | undefined)
    if (!data) throw new Error('房间已解散')
    if (data.guest === null || data.guestRoster === null) throw new Error('对手名册缺失')

    if (data.dataHash !== this.myDataHash) throw new Error('双方数据版本不一致，拒绝开战')
    if (data.guestDataHash !== this.myDataHash) throw new Error('对手数据版本不一致，拒绝开战')

    if (this.sideState === 'host') {
      this.guestUid = data.guest
      await updateDoc(this.roomRef(), { status: 'playing' }).catch(() => undefined)
    }
    return {
      roomId: this.roomIdState,
      seed: data.seed,
      hostUid: data.host,
      guestUid: data.guest,
      hostRoster: data.hostRoster,
      guestRoster: data.guestRoster,
      dataHash: data.dataHash,
    }
  }

  async publish(seq: number, d: DecisionInput): Promise<void> {
    const ref = this.moveRef(this.uid, seq)
    const payload: MoveDoc = { uid: this.uid, seq, decision: d }
    try {
      await setDoc(ref, payload)
    } catch (e: unknown) {
      // 规则禁改：若对侧已收到同一份（重试/双发），读回来一致即视为成功
      const cur = await getDoc(ref).catch(() => null)
      if (!cur?.exists() || !sameDecision(cur.data() as MoveDoc, payload)) throw e
    }
  }

  async receive(seq: number, timeoutMs = AWAIT_DECISION_MS): Promise<DecisionInput> {
    const ref = this.moveRef(this.opponentUid(), seq)
    return await new Promise<DecisionInput>((resolve, reject) => {
      let unsub: Unsubscribe = () => {}
      const timer = setTimeout(() => {
        unsub()
        reject(new Error('等待对手决策超时'))
      }, timeoutMs)
      unsub = onSnapshot(
        ref,
        (snap) => {
          if (!snap.exists()) return
          clearTimeout(timer)
          unsub()
          resolve((snap.data() as MoveDoc).decision)
        },
        (err) => {
          clearTimeout(timer)
          unsub()
          reject(err)
        },
      )
    })
  }

  async publishFingerprint(fp: string): Promise<void> {
    await updateDoc(this.roomRef(), { [`fingerprints.${this.uid}`]: fp })
  }

  async receiveFingerprint(timeoutMs = AWAIT_FINGERPRINT_MS): Promise<string | null> {
    const opp = this.opponentUid()
    if (!opp) return null
    try {
      const data = await this.waitForRoom((d) => d.fingerprints?.[opp] !== undefined, timeoutMs)
      return data.fingerprints?.[opp] ?? null
    } catch {
      return null
    }
  }

  /** 快速匹配：任一别人开着的等待房 */
  async findWaitingRoom(): Promise<string | null> {
    const uid = await ensureUid()
    this.uid = uid
    const snap = await getDocs(query(collection(db, 'rooms'), where('status', '==', 'waiting'), limit(10)))
    for (const d of snap.docs) {
      const data = d.data() as RoomDoc
      if (data.host !== uid && data.guest === null) return d.id
    }
    return null
  }

  private waitForRoom(cond: (d: RoomDoc) => boolean, timeoutMs: number): Promise<RoomDoc> {
    return new Promise<RoomDoc>((resolve, reject) => {
      let unsub: Unsubscribe = () => {}
      const timer = setTimeout(() => {
        unsub()
        reject(new Error('等待超时'))
      }, timeoutMs)
      unsub = onSnapshot(
        this.roomRef(),
        (snap) => {
          const data = snap.data() as RoomDoc | undefined
          if (!data || !cond(data)) return
          clearTimeout(timer)
          unsub()
          resolve(data)
        },
        (err) => {
          clearTimeout(timer)
          unsub()
          reject(err)
        },
      )
      this.unsubs.push(unsub)
    })
  }
}

export function createFirebaseMatch(): FirebaseMatch {
  return new FirebaseMatch()
}
