// 编队：把英雄摆进 2 路 × 4 格，占用恒为前缀无空洞（与内核 Placement 同规）。
import { LANE_CAPACITY, LANE_COUNT } from '../kernel/battle/types'
import type { Coordinate } from '../kernel/battle/types'
import type { Hero } from './herogen'

export interface PlacedHero extends Hero {
  coordinate: Coordinate
}

export const DEFAULT_LANES = ['lane0', 'lane1'] as const

/** 合法格位：lane ∈ 2 路、index ∈ [0,4) */
export function isValidCoordinate(c: Coordinate, lanes: readonly string[] = DEFAULT_LANES): boolean {
  return lanes.includes(c.lane) && c.index >= 0 && c.index < LANE_CAPACITY
}

/** 每路占用是否前缀紧凑（无空洞） */
export function isPrefixPacked(indexes: readonly number[]): boolean {
  const sorted = [...indexes].sort((a, b) => a - b)
  return sorted.every((v, i) => v === i)
}

/** 编队合法性：格位合法、无重复、每路 ≤ 容量、且每路前缀紧凑 */
export function validateFormation(heroes: readonly PlacedHero[], lanes: readonly string[] = DEFAULT_LANES): string[] {
  const errors: string[] = []
  if (heroes.length > LANE_COUNT * LANE_CAPACITY) errors.push(`英雄数 ${heroes.length} 超出战场容量 ${LANE_COUNT * LANE_CAPACITY}`)
  const seen = new Set<string>()
  const byLane = new Map<string, number[]>()
  for (const h of heroes) {
    const key = `${h.coordinate.faction}/${h.coordinate.lane}/${h.coordinate.index}`
    if (seen.has(key)) errors.push(`格位重复：${key}`)
    seen.add(key)
    if (!isValidCoordinate(h.coordinate, lanes)) errors.push(`非法格位：${key}`)
    const arr = byLane.get(h.coordinate.lane) ?? []
    arr.push(h.coordinate.index)
    byLane.set(h.coordinate.lane, arr)
  }
  for (const [lane, idx] of byLane) {
    if (idx.length > LANE_CAPACITY) errors.push(`路 ${lane} 超容（${idx.length}）`)
    if (!isPrefixPacked(idx)) errors.push(`路 ${lane} 出现空洞（占用须为前缀）`)
  }
  return errors
}

/**
 * 自动布局：按给定顺序依次填 lane0 → lane1，每格一位（index0 最前）。
 * 玩家手工调整后仍需过 validateFormation。
 */
export function autoFormation(heroes: readonly Hero[], faction: string, lanes: readonly string[] = DEFAULT_LANES): PlacedHero[] {
  const out: PlacedHero[] = []
  let i = 0
  for (const lane of lanes) {
    for (let index = 0; index < LANE_CAPACITY && i < heroes.length; index += 1) {
      out.push({ ...(heroes[i] as Hero), coordinate: { faction, lane, index } })
      i += 1
    }
  }
  return out
}
