// 技能卡面：优先用 web 端已有卡图（site/assets/cards/<cardId>.png），
// 取不到则回退占位符（emoji + 名称 + 稀有度描边）。后期在网页端补图即可自动生效。
import { escapeHtml } from './chrome'

/** 卡图路径：游戏在 /CardGame/，wiki 在 /CardGame/site/，故相对路径 ./site/… */
export function cardArtUrl(cardId: string): string {
  return `./site/assets/cards/${cardId}.png`
}

const RARITY_EMOJI: Record<string, string> = {
  common: '▫️',
  uncommon: '🔹',
  rare: '🔷',
  epic: '🟣',
  legendary: '🟡',
}

/** 生成卡面 HTML；真图加载失败时由 hydrateArt 换成占位 */
export function cardFaceHtml(opts: { cardId: string; name: string; rarity?: string; compact?: boolean }): string {
  const { cardId, name, rarity = 'common', compact = false } = opts
  const emoji = RARITY_EMOJI[rarity] ?? '▫️'
  return `
  <figure class="card-face r-${escapeHtml(rarity)}${compact ? ' compact' : ''}" data-card="${escapeHtml(cardId)}">
    <img class="card-art" src="${cardArtUrl(cardId)}" alt="" loading="lazy" data-art>
    <div class="card-fallback" hidden>
      <span class="card-emoji">${emoji}</span>
      <span class="card-name">${escapeHtml(name)}</span>
    </div>
  </figure>`
}

/** 挂上错误回退：<img> 失败则显示占位块 */
export function hydrateArt(root: HTMLElement): void {
  root.querySelectorAll<HTMLImageElement>('img[data-art]').forEach((img) => {
    const fallback = img.parentElement?.querySelector<HTMLElement>('.card-fallback')
    const showFallback = (): void => {
      img.hidden = true
      if (fallback) fallback.hidden = false
    }
    if (img.complete && img.naturalWidth === 0) showFallback()
    img.addEventListener('error', showFallback, { once: true })
  })
}

/** 体质 → 头像占位 emoji（后期替换为 20 张基础英雄立绘：10 体质 × 性别） */
const CONSTITUTION_EMOJI: Record<string, string> = {
  robust: '💪',
  swift: '🌪️',
  keen: '🧠',
  bulwark: '🛡️',
  sharp: '⚔️',
  fireproof: '🔥',
  antitoxic: '☠️',
  warded: '🧿',
  tenacious: '🫀',
  medium: '🌙',
}

export function avatarEmoji(constitutionId: string, gender?: 'male' | 'female'): string {
  const base = CONSTITUTION_EMOJI[constitutionId] ?? '❓'
  const g = gender === 'male' ? '♂' : gender === 'female' ? '♀' : ''
  return `${base}${g}`
}
