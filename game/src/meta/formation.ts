// 编队：把英雄摆进 2 路 × 4 格，占用恒为前缀无空洞（与内核 Placement 同规）。
import { LANE_CAPACITY, LANE_COUNT } from '../kernel/battle/types'
import type { Coordinate } from '../kernel/battle/types'
import type { Hero } from './herogen'

export interface PlacedHero extends Hero {
  coordinate: Coordinate
}

export const DEFAULT_LANES = ['lane0', 'lane1'] as const

/** lane id → 中文。DDD 的战场拓扑是「上下两路」，lane0 在上（gridSpec 里 row/col 均为 1）。
 *  未知 lane 原样返回——将来真扩到 3 路时，坏的是显示而不是抛错。 */
const LANE_LABEL: Record<string, string> = { lane0: '上路', lane1: '下路' }

export function laneLabel(lane: string): string {
  return LANE_LABEL[lane] ?? lane
}

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

/** 按路拆成有序表（每路按 index 升序，index 即路内次序）。摆位编辑器的工作形态。 */
export function toLaneLists(heroes: readonly PlacedHero[], lanes: readonly string[] = DEFAULT_LANES): PlacedHero[][] {
  return lanes.map((lane) =>
    heroes
      .filter((h) => h.coordinate.lane === lane)
      .sort((a, b) => a.coordinate.index - b.coordinate.index),
  )
}

/**
 * 每路有序表 → 前缀紧凑的 PlacedHero[]（index 由路内次序重写）。
 * 摆位编辑的唯一出口：空洞在结构上不可能出现；越容量部分被截断（调用方应先行约束）。
 */
export function fromLaneLists(
  lists: readonly (readonly Hero[])[],
  faction: string,
  lanes: readonly string[] = DEFAULT_LANES,
): PlacedHero[] {
  const out: PlacedHero[] = []
  lists.forEach((list, li) => {
    const lane = lanes[li]
    if (!lane) return
    list.slice(0, LANE_CAPACITY).forEach((h, index) => {
      out.push({ ...(h as Hero), coordinate: { faction, lane, index } })
    })
  })
  return out
}

function factionOf(heroes: readonly PlacedHero[]): string {
  return heroes[0]?.coordinate.faction ?? 'A'
}

/**
 * 把英雄 `id` 摆到 `lane` 的第 `index` 位——同路即路内重排，跨路即移入。
 * `index` 夹到 [0, 该路长度]：占用恒为前缀，所以空格只会出现在队尾，
 * 「落到第 n 格」与「排到该路队尾」是同一件事，格子上的空洞和最终落点对得上。
 * 目标路已满（且是跨路搬迁，会挤掉别人）时原样返回，调用方可用 `===` 判断未生效。
 */
export function moveHeroTo(
  heroes: readonly PlacedHero[],
  id: string,
  lane: string,
  index: number,
  lanes: readonly string[] = DEFAULT_LANES,
): PlacedHero[] {
  const lists = toLaneLists(heroes, lanes)
  const fromLi = lists.findIndex((l) => l.some((h) => h.id === id))
  const toLi = lanes.indexOf(lane)
  if (fromLi < 0 || toLi < 0) return heroes as PlacedHero[]
  const src = lists[fromLi] as PlacedHero[]
  const dst = lists[toLi] as PlacedHero[]
  if (fromLi !== toLi && dst.length >= LANE_CAPACITY) return heroes as PlacedHero[]
  const [hero] = src.splice(
    src.findIndex((h) => h.id === id),
    1,
  )
  dst.splice(Math.max(0, Math.min(index, dst.length)), 0, hero as PlacedHero)
  return fromLaneLists(lists, factionOf(heroes), lanes)
}

/** 两名英雄互换格位（路固定，故两路长度都不变）。任一 id 不存在时原样返回。 */
export function swapHeroes(
  heroes: readonly PlacedHero[],
  aId: string,
  bId: string,
  lanes: readonly string[] = DEFAULT_LANES,
): PlacedHero[] {
  if (aId === bId) return heroes as PlacedHero[]
  const lists = toLaneLists(heroes, lanes)
  const find = (id: string): [number, number] | null => {
    for (let li = 0; li < lists.length; li += 1) {
      const i = (lists[li] as PlacedHero[]).findIndex((h) => h.id === id)
      if (i >= 0) return [li, i]
    }
    return null
  }
  const pa = find(aId)
  const pb = find(bId)
  if (!pa || !pb) return heroes as PlacedHero[]
  const laneA = lists[pa[0]] as PlacedHero[]
  const laneB = lists[pb[0]] as PlacedHero[]
  const tmp = laneA[pa[1]] as PlacedHero
  laneA[pa[1]] = laneB[pb[1]] as PlacedHero
  laneB[pb[1]] = tmp
  return fromLaneLists(lists, factionOf(heroes), lanes)
}
