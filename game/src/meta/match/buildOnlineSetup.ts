// 联机开局：双方名册 → 同一个 CombatSetup。
// ★ 规范顺序（P7_PLAN §3.2）：factions[0] = host = 'A'，factions[1] = guest = 'B'，
//    与「谁在建这场」无关——两份 setup 逐位相同是 lockstep 的前提。
//    故 heroToUnitSetup 收到的 coordinate.faction 一律被覆盖（忽略 PlacedHero 的本地值）。
import type { FactionId } from '../../kernel/ids'
import type { Catalog } from '../../kernel/catalog/types'
import type { CombatSetup, FactionSetup } from '../../kernel/combat/types'
import { heroToUnitSetup } from '../buildSetup'
import type { PlacedHero } from '../formation'

export const HOST_FACTION: FactionId = 'A'
export const GUEST_FACTION: FactionId = 'B'

export interface OnlineSetupOptions {
  seed: number
  catalog: Catalog
  hostRoster: readonly PlacedHero[]
  guestRoster: readonly PlacedHero[]
  /** 起始 clock 基准（缺省 0） */
  clockBase?: number
}

export function buildOnlineCombatSetup(opts: OnlineSetupOptions): CombatSetup {
  // 内核要求 unitId 全局唯一：双方名册若共用 id（历史上同前缀生成过 hero_1）会直接建成非法局面。
  // 及早报错，别等到内核注册表抛「单位 id 重复」。
  const seen = new Set<string>()
  for (const h of [...opts.hostRoster, ...opts.guestRoster]) {
    if (seen.has(h.id)) throw new Error(`双方名册出现重复单位 id：${h.id}（联机前须按座位改名）`)
    seen.add(h.id)
  }
  const faction = (id: FactionId, name: string, heroes: readonly PlacedHero[]): FactionSetup => ({
    id,
    name,
    units: heroes.map((h) => heroToUnitSetup({ ...h, coordinate: { ...h.coordinate, faction: id } })),
  })
  return {
    seed: opts.seed,
    catalog: opts.catalog,
    board: { clock: { base: opts.clockBase ?? 0 }, domainGrants: [] },
    factions: [faction(HOST_FACTION, '房主', opts.hostRoster), faction(GUEST_FACTION, '加入者', opts.guestRoster)],
    inputs: { decisions: new Map() },
  }
}

/** 本侧阵营：房主恒 A、加入者恒 B */
export function factionOfSide(side: 'host' | 'guest'): FactionId {
  return side === 'host' ? HOST_FACTION : GUEST_FACTION
}
