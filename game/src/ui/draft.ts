// 出战草稿：生成后、开战前可编辑的名册（技能槽 + 站位）。
// 补上此前缺失的「跨界面存放点」——名册原先只活在 newgame/online 的局部变量里，无法在整备页与预览页之间共享。
// 会话内存级：刷新即失效（持久化留待「继续游戏」落地）。
import { generateRoster, randomSeed } from '../meta/roster'
import type { Hero } from '../meta/herogen'
import type { PlacedHero } from '../meta/formation'
import type { Profile } from '../meta/progression'
import type { Catalog } from '../kernel/catalog/types'

export type DraftMode = 'offline' | 'online'

export interface RosterDraft {
  mode: DraftMode
  seed: number
  /** 我方名册（可编辑） */
  own: PlacedHero[]
  /** 对手名册（人机时由 AI 生成，不可编辑；在线为空） */
  enemy: PlacedHero[]
}

let current: RosterDraft | null = null

export function setDraft(d: RosterDraft): void {
  current = d
}

export function getDraft(): RosterDraft | null {
  return current
}

export function clearDraft(): void {
  current = null
}

/** 用新的 Hero 字段覆盖我方某英雄（保留其 coordinate） */
export function patchOwnHero(id: string, hero: Hero): void {
  if (!current) return
  current.own = current.own.map((h) => (h.id === id ? { ...hero, coordinate: h.coordinate } : h))
}

/** 整队替换我方名册（摆位编辑的输出） */
export function setOwn(own: PlacedHero[]): void {
  if (!current) return
  current.own = own
}

/** 草稿不存在或来源不符时生成新草稿；否则复用（保证从整备页返回后队伍不丢） */
export function ensureDraft(mode: DraftMode, catalog: Catalog, profile: Profile): RosterDraft {
  if (current && current.mode === mode) return current
  const d = buildDraft(mode, catalog, profile)
  current = d
  return d
}

/** 重新生成整支队伍（人机连对手一起换），替换现有草稿 */
export function rerollDraft(catalog: Catalog, profile: Profile): RosterDraft {
  const d = buildDraft(current?.mode ?? 'offline', catalog, profile)
  current = d
  return d
}

function buildDraft(mode: DraftMode, catalog: Catalog, profile: Profile): RosterDraft {
  const seed = randomSeed()
  const own = generateRoster(catalog, profile, seed, 'A', mode === 'online' ? 'hero' : 'A')
  const enemy = mode === 'offline' ? generateRoster(catalog, profile, (seed + 1) >>> 0, 'B', 'B') : []
  return { mode, seed, own, enemy }
}
