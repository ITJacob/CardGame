// P7a：内存双工通道上的确定性 lockstep。
// 验收判据（P7_PLAN §六）：两端事件指纹相同，且等于单机用同一决策序列的结果。
import { describe, expect, it } from 'vitest'
import { createCombat, fingerprintOf } from '../../src/kernel'
import type { DecisionInput, DecisionRequest } from '../../src/kernel/execution/types'
import { buildAiVsAiSetup, runToEnd } from '../helpers/fixture'
import { createMemoryMatchPair } from '../../src/meta/match/memoryChannel'
import { MatchRunner } from '../../src/meta/match/runner'
import type { MatchChannel } from '../../src/meta/match/channel'
import type { MemoryMatch } from '../../src/meta/match/memoryChannel'

/** 人类选择的脚本化替身：取候选前 pickCount 个（与 runToEnd 的内置 AI 同策略） */
const pickFirst = (req: DecisionRequest): DecisionInput => req.candidates.slice(0, req.pickCount)

/** 可控 + 可断言的本侧选择器 */
function recorder(seen: string[]): (req: DecisionRequest) => Promise<DecisionInput> {
  return async (req) => {
    seen.push(req.caster)
    return pickFirst(req)
  }
}

/** 建一间房并让 guest 就位，返回开战后的两端通道 */
async function openRoom(dataHash = 'hash-a'): Promise<{ host: MemoryMatch; guest: MemoryMatch }> {
  const pair = createMemoryMatchPair()
  await pair.host.createRoom({ roster: [], seed: 771, dataHash })
  await pair.guest.joinRoom({ code: pair.host.roomId, roster: [], dataHash })
  await pair.host.awaitStart()
  return { host: pair.host, guest: pair.guest }
}

/** 全手动技能的双方对局（每个行动机会都产生一个决策点） */
const makeSetup = () => buildAiVsAiSetup({ seed: 20261010, skills: ['fix_mark'], unitsPerSide: 2 })

describe('P7a lockstep（内存通道）', () => {
  it('两端跑同一场：事件指纹逐位相同，且等于单机同决策', async () => {
    const { host, guest } = await openRoom()
    const hostFacade = createCombat(makeSetup())
    const guestFacade = createCombat(makeSetup())

    const hostSeen: string[] = []
    const guestSeen: string[] = []
    const hostRunner = new MatchRunner({ facade: hostFacade, channel: host, myFaction: 'A', chooseLocally: recorder(hostSeen) })
    const guestRunner = new MatchRunner({ facade: guestFacade, channel: guest, myFaction: 'B', chooseLocally: recorder(guestSeen) })
    hostRunner.start()
    guestRunner.start()
    await Promise.all([hostRunner.finished, guestRunner.finished])

    const errors = [hostRunner.lastError, guestRunner.lastError].filter((e) => e !== null)
    expect(errors).toEqual([])

    const hostEnded = hostFacade.ended()
    const guestEnded = guestFacade.ended()
    expect(hostEnded).not.toBeNull()
    expect(guestEnded).not.toBeNull()
    expect(hostEnded!.outcome).toBe(guestEnded!.outcome)

    // 单机基线：同样的 setup、同样的决策策略
    const solo = createCombat(makeSetup())
    runToEnd(solo)

    const hostFp = fingerprintOf(hostEnded!.events)
    expect(hostFp).toBe(fingerprintOf(guestEnded!.events))
    expect(hostFp).toBe(fingerprintOf(solo.ended()!.events))

    // 确实经过了决策点，且双方都各出过手、也都等过对手
    expect(hostRunner.decisionSeq).toBeGreaterThan(0)
    expect(hostRunner.decisionSeq).toBe(guestRunner.decisionSeq)
    expect(hostSeen.length).toBeGreaterThan(0)
    expect(guestSeen.length).toBeGreaterThan(0)
    expect(hostRunner.remoteDecisionCount).toBeGreaterThan(0)
    expect(guestRunner.remoteDecisionCount).toBeGreaterThan(0)
  })

  it('对手决策点绝不本地回退：本侧选择器只见到本侧施法者', async () => {
    const { host, guest } = await openRoom()
    const hostSeen: string[] = []
    const hostFacade = createCombat(makeSetup())
    const guestFacade = createCombat(makeSetup())
    const hostRunner = new MatchRunner({ facade: hostFacade, channel: host, myFaction: 'A', chooseLocally: recorder(hostSeen) })
    const guestRunner = new MatchRunner({ facade: guestFacade, channel: guest, myFaction: 'B', chooseLocally: recorder([]) })
    hostRunner.start()
    guestRunner.start()
    await Promise.all([hostRunner.finished, guestRunner.finished])

    expect(hostSeen.length).toBeGreaterThan(0)
    expect(hostSeen.every((id) => id.startsWith('A_'))).toBe(true)
    expect(hostSeen).not.toContain('B_u0')
    // 本侧决策 + 接收到的对手决策 = 全部决策点
    expect(hostSeen.length + hostRunner.remoteDecisionCount).toBe(hostRunner.decisionSeq)
    expect(hostRunner.remoteDecisionCount).toBeGreaterThan(0)
  })

  it('wire 回来键序不同也不散：决策在边界归一化（实测 Firestore 会换序）', async () => {
    // 现象：内核本地造的 ResolvedTarget 是 {coord, occupant}（target.ts），
    // Firestore 回来后键序变成 {occupant, coord}；fingerprintOf 是 JSON.stringify，键序敏感。
    const pair = createMemoryMatchPair()
    await pair.host.createRoom({ roster: [], seed: 771, dataHash: 'hash-a' })
    await pair.guest.joinRoom({ code: pair.host.roomId, roster: [], dataHash: 'hash-a' })
    await pair.host.awaitStart()

    const reorder = (d: DecisionInput): DecisionInput =>
      d.map((t) => ({ occupant: t.occupant, coord: { faction: t.coord.faction, lane: t.coord.lane, index: t.coord.index } }))
    const onWire = (m: MemoryMatch): MatchChannel => ({
      side: m.side,
      roomId: m.roomId,
      myUid: m.myUid,
      publish: (seq, d) => m.publish(seq, d),
      receive: async (seq, timeoutMs) => reorder(await m.receive(seq, timeoutMs)),
      publishFingerprint: (fp) => m.publishFingerprint(fp),
      receiveFingerprint: (timeoutMs) => m.receiveFingerprint(timeoutMs),
    })

    const hostFacade = createCombat(makeSetup())
    const guestFacade = createCombat(makeSetup())
    const hostRunner = new MatchRunner({ facade: hostFacade, channel: onWire(pair.host), myFaction: 'A', chooseLocally: recorder([]) })
    const guestRunner = new MatchRunner({ facade: guestFacade, channel: onWire(pair.guest), myFaction: 'B', chooseLocally: recorder([]) })
    hostRunner.start()
    guestRunner.start()
    await Promise.all([hostRunner.finished, guestRunner.finished])

    expect(hostRunner.lastError).toBeNull()
    const solo = createCombat(makeSetup())
    runToEnd(solo)
    expect(fingerprintOf(hostFacade.ended()!.events)).toBe(fingerprintOf(guestFacade.ended()!.events))
    expect(fingerprintOf(hostFacade.ended()!.events)).toBe(fingerprintOf(solo.ended()!.events))
  })

  it('数据版本不一致：加入被拒（铁律 2）', async () => {
    const pair = createMemoryMatchPair()
    await pair.host.createRoom({ roster: [], seed: 1, dataHash: 'v1' })
    await expect(pair.guest.joinRoom({ code: pair.host.roomId, roster: [], dataHash: 'v2' })).rejects.toThrow(/数据版本/)
  })

  it('对手数据版本不一致：房主拒绝开战（铁律 2）', async () => {
    const pair = createMemoryMatchPair()
    await pair.host.createRoom({ roster: [], seed: 1, dataHash: 'v1' })
    await pair.guest.joinRoom({ code: pair.host.roomId, roster: [], dataHash: 'v1' })
    // 白盒：模拟对手其实拿着另一版数据
    const room = pair.net.rooms.get(pair.host.roomId)
    if (!room) throw new Error('房间缺失')
    room.doc.guestDataHash = 'v2'
    await expect(pair.host.awaitStart()).rejects.toThrow(/数据版本/)
  })
})
