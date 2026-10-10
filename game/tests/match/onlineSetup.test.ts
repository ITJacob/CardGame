// P7：联机开局构建（§3.2 阵营规范化）与名册 wire 往返。
import { describe, expect, it } from 'vitest'
import { createCombat, fingerprintOf } from '../../src/kernel'
import { Mulberry32RandomSource } from '../../src/kernel/shared/random-source'
import { CONSTITUTIONS } from '../../src/meta/constitution'
import { generateHeroes, type RosterContext } from '../../src/meta/herogen'
import { autoFormation } from '../../src/meta/formation'
import { buildOnlineCombatSetup } from '../../src/meta/match/buildOnlineSetup'
import { buildFixtureCatalog, runToEnd } from '../helpers/fixture'

const constitutionIds = CONSTITUTIONS.map((c) => c.id)

function ctx(seed: number, classes: string[]): RosterContext {
  return { catalog: buildFixtureCatalog(), random: new Mulberry32RandomSource(seed), unlockedClasses: classes, constitutionIds }
}

/** JSON 往返 = Firestore 上线的序列化（抓不可上线的名册） */
function onWire<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T
}

describe('P7 联机开局构建', () => {
  it('阵营规范化：host 恒 A、guest 恒 B，忽略名册里的本地 faction', () => {
    const catalog = buildFixtureCatalog()
    // 故意给名册一个非法 faction：构建时必须被覆盖
    const hostRoster = autoFormation(generateHeroes(ctx(3, ['fixture']), 5, 'H'), 'X')
    const guestRoster = autoFormation(generateHeroes(ctx(4, ['fixture']), 5, 'G'), 'X')
    const setup = buildOnlineCombatSetup({ seed: 5, catalog, hostRoster, guestRoster })

    expect(setup.factions[0].id).toBe('A')
    expect(setup.factions[1].id).toBe('B')
    expect(setup.factions[0].units.map((u) => u.unitId)).toEqual(hostRoster.map((h) => h.id))
    expect(setup.factions[1].units.map((u) => u.unitId)).toEqual(guestRoster.map((h) => h.id))
    for (const u of setup.factions[0].units) expect(u.coordinate.faction).toBe('A')
    for (const u of setup.factions[1].units) expect(u.coordinate.faction).toBe('B')

    // 与单机 buildCombatSetup('A'/'B') 同构：同样的名册应给出同样的 setup
    expect(JSON.stringify(setup.factions)).toContain('"faction":"A"')
    expect(JSON.stringify(setup.factions)).toContain('"faction":"B"')
  })

  it('双方名册 id 撞车：拒绝构建（内核 unitId 必须全局唯一）', () => {
    const catalog = buildFixtureCatalog()
    const roster = autoFormation(generateHeroes(ctx(9, ['fixture']), 5, 'hero'), 'A')
    expect(() => buildOnlineCombatSetup({ seed: 1, catalog, hostRoster: roster, guestRoster: roster })).toThrow(/重复单位 id/)
  })

  it('名册 JSON 往返无损，且构建结果与事件指纹逐位相同', () => {
    const catalog = buildFixtureCatalog()
    const hostRoster = autoFormation(generateHeroes(ctx(3, ['fixture']), 5, 'H'), 'A')
    const guestRoster = autoFormation(generateHeroes(ctx(4, ['fixture']), 5, 'G'), 'B')
    const wireHost = onWire(hostRoster)
    const wireGuest = onWire(guestRoster)
    expect(wireHost).toEqual(hostRoster)
    expect(wireGuest).toEqual(guestRoster)

    const direct = buildOnlineCombatSetup({ seed: 5, catalog, hostRoster, guestRoster })
    const viaWire = buildOnlineCombatSetup({ seed: 5, catalog, hostRoster: wireHost, guestRoster: wireGuest })
    expect(JSON.stringify(viaWire.factions)).toBe(JSON.stringify(direct.factions))

    const a = createCombat(direct)
    const b = createCombat(viaWire)
    runToEnd(a)
    runToEnd(b)
    expect(fingerprintOf(a.ended()!.events)).toBe(fingerprintOf(b.ended()!.events))
  })
})
