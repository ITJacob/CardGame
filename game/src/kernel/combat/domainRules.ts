// DomainDef.rulePatches 的被动读取（战场参数 §1.2 / INV-D6）。
// 只读 active 界域；压制中的 overlay 不参与规则改写。
import type { DomainInstance } from '../battle/types'
import { activeDomains, tierWeight } from '../battle/domain'
import type { RulePatch } from '../catalog/types'
import type { FactionId } from '../ids'

export interface RuleProfile {
  tags: readonly string[]
  singleTarget: boolean
  effectTypes: readonly string[]
}

export interface PatchEntry {
  domain: DomainInstance
  patch: RulePatch
}

function listOf(v: string | string[] | undefined): string[] {
  if (v === undefined) return []
  return Array.isArray(v) ? v : [v]
}

function sideMatches(side: string | undefined, owner: FactionId | undefined, faction: FactionId | undefined): boolean {
  if (side === undefined || side === 'all' || side === 'both') return true
  if (!owner || !faction) return false
  return side === 'ally' ? faction === owner : faction !== owner
}

function filterMatches(patch: RulePatch, profile: Pick<RuleProfile, 'tags' | 'singleTarget'>): boolean {
  if (patch.singleTarget === true && !profile.singleTarget) return false
  const any = listOf(patch.tag)
  if (any.length > 0 && !any.some((t) => profile.tags.includes(t))) return false
  const not = listOf(patch.tagNot)
  if (not.length > 0 && not.some((t) => profile.tags.includes(t))) return false
  return true
}

function typeMatches(patch: RulePatch, profile: Pick<RuleProfile, 'effectTypes'>): boolean {
  return patch.effectType === undefined || profile.effectTypes.includes(patch.effectType)
}

function patchKey(p: RulePatch): string {
  const tag = listOf(p.tag).sort().join(',')
  const tagNot = listOf(p.tagNot).sort().join(',')
  return [p.kind, p.side ?? '', p.stat ?? '', p.effectType ?? '', tag, tagNot, p.singleTarget ? '1' : '0'].join('|')
}

function better(a: PatchEntry, b: PatchEntry): boolean {
  const wa = tierWeight(a.domain.tier)
  const wb = tierWeight(b.domain.tier)
  if (wa !== wb) return wa > wb
  return a.domain.grant.priority > b.domain.grant.priority
}

function bestPerKey(entries: readonly PatchEntry[]): PatchEntry[] {
  const chosen = new Map<string, PatchEntry>()
  for (const e of entries) {
    const key = patchKey(e.patch)
    const cur = chosen.get(key)
    if (!cur || better(e, cur)) chosen.set(key, e)
  }
  return [...chosen.values()]
}

function activePatchEntries(domains: readonly DomainInstance[], kind: string): PatchEntry[] {
  const entries: PatchEntry[] = []
  for (const domain of activeDomains(domains)) {
    for (const patch of domain.def.rulePatches ?? []) {
      if (patch.kind === kind) entries.push({ domain, patch })
    }
  }
  return entries
}

/** seal_effect / disable_effect：该叶子效果是否被现行界域封禁 */
export function domainEffectBlocked(
  domains: readonly DomainInstance[],
  ctx: { faction?: FactionId; tags: readonly string[]; singleTarget: boolean; effectType: string },
): boolean {
  for (const { patch } of activePatchEntries(domains, 'seal_effect')) {
    if (patch.effectType === undefined) continue
    if (patch.effectType === ctx.effectType) return true
  }
  for (const { domain, patch } of activePatchEntries(domains, 'disable_effect')) {
    if (patch.effectType === 'shield') continue
    if (!sideMatches(patch.side, domain.grant.ownerFaction, ctx.faction)) continue
    if (patch.effectType !== undefined && patch.effectType !== ctx.effectType) continue
    if (patch.effectType === undefined && listOf(patch.tag).length === 0 && listOf(patch.tagNot).length === 0) continue
    if (!filterMatches(patch, ctx)) continue
    return true
  }
  return false
}

/** empower：O 节点伤害/治疗乘区，同对象按 hero > overlay > base 取舍 */
export function domainEmpowerMul(
  domains: readonly DomainInstance[],
  ctx: { faction?: FactionId; tags: readonly string[]; singleTarget: boolean },
  stat: 'damage' | 'heal',
): number {
  const entries = activePatchEntries(domains, 'empower').filter(({ domain, patch }) => {
    if ((patch.stat ?? 'damage') !== stat) return false
    if (!sideMatches(patch.side, domain.grant.ownerFaction, ctx.faction)) return false
    return filterMatches(patch, ctx)
  })
  let mul = 1
  for (const { patch } of bestPerKey(entries)) mul *= patch.mul ?? 1
  return mul
}

/** disable_effect + effectType:'shield'：受击方的护盾段是否失效 */
export function domainShieldBlocked(domains: readonly DomainInstance[], faction: FactionId | undefined): boolean {
  for (const { domain, patch } of activePatchEntries(domains, 'disable_effect')) {
    if (patch.effectType !== 'shield') continue
    if (!sideMatches(patch.side, domain.grant.ownerFaction, faction)) continue
    if (!filterMatches(patch, { tags: [], singleTarget: false })) continue
    return true
  }
  return false
}

/** cost_mod：commit 前的能量费用增量，不同过滤面叠加，同对象按层籍取舍 */
export function domainCostDelta(domains: readonly DomainInstance[], profile: RuleProfile): number {
  const entries = activePatchEntries(domains, 'cost_mod').filter(({ patch }) =>
    typeMatches(patch, profile) && filterMatches(patch, profile))
  let delta = 0
  for (const { patch } of bestPerKey(entries)) delta += patch.delta ?? 0
  return delta
}
