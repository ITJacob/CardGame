// 界域压制栈（战场上下文 §六）：同一时刻 active = 全部 base/hero + 上层栈顶 overlay。
import type { DomainInstance, DomainTier } from './types'

export function tierWeight(tier: DomainTier): number {
  if (tier === 'hero') return 2
  if (tier === 'overlay') return 1
  return 0
}

export function topOverlay(domains: readonly DomainInstance[]): DomainInstance | undefined {
  let top: DomainInstance | undefined
  for (const d of domains) {
    if (d.tier !== 'overlay') continue
    if (!top || d.grant.priority >= top.grant.priority) top = d
  }
  return top
}

export function activeDomains(domains: readonly DomainInstance[]): DomainInstance[] {
  const active = domains.filter((d) => d.tier !== 'overlay')
  const top = topOverlay(domains)
  if (top) active.push(top)
  return active
}
