// 技能卡面：竖版卡牌 = 卡图为主体 + site 的边框图层（标识稀有度）+ 常驻信息条。
// 边框走 ./assets/frames/…（卡图派生 webp 在 ./assets/cards/，母版在仓库根 source/，dev 由 Vite
// 中间件把仓库 assets/ 挂到根路径）。边框图是「纯黑底 + 边缘细亮线」，靠 mix-blend-mode:screen
// 叠在卡图上——黑底被吃掉、亮线留下。832 张卡只有 34 张有卡图，所以「无图」是常态而非异常，
// 必须是一张设计过的卡（渐变底 + 稀有度字形），而不是空框。
import { escapeHtml } from './chrome'
import type { Catalog } from '../../kernel/catalog/types'

/** 卡图路径：派生 webp 在仓库根 assets/（部署到 /CardGame/assets/），故相对路径 ./assets/…（英雄立绘同此口径，见 hero.ts 的 heroArtUrl） */
const CARD_ART_BASE = './assets/cards/'

/** 卡图默认源（最大档）：不支持 srcset 时的兜底 */
export function cardArtUrl(cardId: string): string {
  return `${CARD_ART_BASE}${cardId}@800w.webp`
}

/** 三档 srcset（200/400/800w）。派生图由 tools/build_art_variants.py 从母版生成，
 *  浏览器按 sizes 声明的显示宽度 × DPR 自选档，避免小卡面拖下 1152px 大图。 */
export function cardArtSrcset(cardId: string): string {
  return [200, 400, 800].map((w) => `${CARD_ART_BASE}${cardId}@${w}w.webp ${w}w`).join(', ')
}

const FRAME_BASE = './assets/frames/'

/**
 * 稀有度 → 边框图。common/uncommon/rare 是全局三张（盘上已有）；
 * epic/legendary 按途径出图（frame-<途径>-epic.png），44 张尚未产出 → 落到 rare 那张，
 * 由 frameFallbackUrl 提供，避免「传奇」和「稀有」长得一模一样。
 */
export function frameUrl(rarity: string, pathwayId?: string): string {
  if (rarity === 'epic' || rarity === 'legendary') {
    return pathwayId ? `${FRAME_BASE}frame-${pathwayId}-${rarity}.png` : `${FRAME_BASE}frame-rare.png`
  }
  const tier = rarity === 'uncommon' || rarity === 'rare' ? rarity : 'common'
  return `${FRAME_BASE}frame-${tier}.png`
}

/** 主图 404 时的第二跳；null 表示这张已是终态、没有下一跳 */
export function frameFallbackUrl(rarity: string): string | null {
  return rarity === 'epic' || rarity === 'legendary' ? `${FRAME_BASE}frame-rare.png` : null
}

const RARITY_EMOJI: Record<string, string> = {
  common: '▫️',
  uncommon: '🔹',
  rare: '🔷',
  epic: '🟣',
  legendary: '🟡',
}

const RARITY_LABEL: Record<string, string> = {
  common: '普通',
  uncommon: '精良',
  rare: '稀有',
  epic: '史诗',
  legendary: '传说',
}

export interface CardFaceOpts {
  cardId: string
  name: string
  rarity?: string
  /** epic/legendary 的途径边框取档用 */
  pathwayId?: string
  /** 主动 / 被动：决定要不要出 ⚡ 费用（有费用即主动，不再另标角标） */
  kind?: 'active' | 'passive'
  /** 能量消耗，仅主动卡有 */
  cost?: number | null
  /** compact 60×80（名册/技能槽）、full 120×160（卡池）、zoom 放到视口里看大图。
   *  英雄展示台的技能卡不在此列：它按行平分宽度（见 app.css 的 .hs-group__row），尺寸是流的。 */
  size?: 'compact' | 'full' | 'zoom'
  /**
   * 'button' 时卡面本身就是交互元素（卡池档），'figure' 是只读展示（名册 / 技能槽）。
   * 卡池外层不再套面板框——卡面即按钮，状态走右上角角标 + 置灰。
   */
  as?: 'figure' | 'button'
  /** 追加到根元素的属性串（调用方负责转义），如 data-equip、aria-disabled、aria-pressed */
  attrs?: string
  /** 右上角角标（调用方负责转义的 HTML），如未解锁的 🔒、已装备的 ✓ */
  corner?: string
  /** 置灰：未解锁 / 槽位已满。只降透明度，hover 详情照常弹 */
  dim?: boolean
  /**
   * 卡图 srcset 的 sizes 声明（CSS 显示宽度，浏览器 × DPR 选档）。缺省按 size 档估
   * （compact 60 / full 120 / zoom 100vw）；**实渲尺寸偏离默认档的调用方必须显式给**
   * ——sizes 写小了浏览器会选低一档的图放大显示（发虚），宁可略估大。已有实例：
   * 展示台/整备的技能卡实渲 ≤92px（不是 60），卡池页竖屏网格放大到 150–220px。
   */
  sizes?: string
}

/**
 * 生成卡面 HTML；降级（无图 / 无边框）由 hydrateArt 在挂载后落到 class 上。
 *
 * 卡图 lazy、边框不 lazy：实测 Chrome 对 lazy 的边框图（缺文件 → dev server 回 200 HTML）
 * 既不派发 load 也不派发 error，降级链就永远不触发，epic/legendary 卡面变成无边无环。
 * 边框只有 3~5 张、按稀有度共享、每张 ~90KB，直出的代价可以忽略。卡图是 1152×1536 的大图，
 * 必须 lazy。
 */
export function cardFaceHtml(opts: CardFaceOpts): string {
  const {
    cardId, name, rarity = 'common', pathwayId, kind = 'active', cost, size = 'compact',
    as = 'figure', attrs, corner, dim, sizes,
  } = opts
  const emoji = RARITY_EMOJI[rarity] ?? '▫️'
  const fallback = frameFallbackUrl(rarity)
  // 主动必有 ⚡ 费用、被动必无 —— 这一条本身就足以分辨主/被动，不再单挂一个「主/被」角标。
  // kind 仍需保留：它决定要不要出费用，也落在 k-<kind> 类上给样式/测试当锚。
  const costHtml = kind === 'active' && cost != null ? `<span class="ci-cost">⚡${cost}</span>` : ''
  const tag = as === 'button' ? 'button' : 'figure'
  // figcaption 只在 figure 里合法；按钮档换成 div（样式挂类不挂标签，外观不变）
  const infoTag = as === 'button' ? 'div' : 'figcaption'
  const sizeCls = size === 'compact' ? '' : size
  // sizes 声明卡面真实 CSS 显示宽度，浏览器据此 × DPR 选 srcset 档位（调用方可覆盖，见 CardFaceOpts.sizes）
  const artSizes = sizes ?? (size === 'compact' ? '60px' : size === 'full' ? '120px' : '100vw')
  const cls = ['card-face', `r-${escapeHtml(rarity)}`, `k-${kind}`, sizeCls, dim ? 'dim' : '']
    .filter(Boolean)
    .join(' ')
  const extra = [as === 'button' ? 'type="button"' : '', attrs ?? ''].filter(Boolean).join(' ')
  // 角标放在最后：它晚于边框层绘制，不会被 mix-blend-mode:screen 吃掉
  const cornerHtml = corner ? `<span class="card-corner">${corner}</span>` : ''
  return `
  <${tag} ${extra} class="${cls}" data-card="${escapeHtml(cardId)}">
    <div class="card-noart" aria-hidden="true"><span class="noart-glyph">${emoji}</span></div>
    <img class="card-art" src="${cardArtUrl(cardId)}" srcset="${cardArtSrcset(cardId)}" sizes="${artSizes}" alt="" loading="lazy" data-art>
    <img class="card-frame" src="${frameUrl(rarity, pathwayId)}" alt="" aria-hidden="true" data-frame data-frame-fallback="${fallback ?? ''}">
    <${infoTag} class="card-info">
      <span class="ci-name">${escapeHtml(name)}</span>${costHtml}
    </${infoTag}>${cornerHtml}
  </${tag}>`
}

/** 挂上降级：卡图失败 → .no-art；边框失败 → 第二跳 → 再失败就摘层走内描边色环 */
export function hydrateArt(root: HTMLElement): void {
  root.querySelectorAll<HTMLImageElement>('img[data-art]').forEach((img) => {
    const face = img.closest<HTMLElement>('.card-face')
    const fail = (): void => {
      img.hidden = true
      face?.classList.add('no-art')
    }
    if (img.complete && img.naturalWidth === 0) fail()
    img.addEventListener('error', fail, { once: true })
  })
  root.querySelectorAll<HTMLImageElement>('img[data-frame]').forEach((img) => {
    const fail = (): void => {
      const alt = img.dataset.frameFallback
      if (alt) {
        // 第二跳：暂时借用 rare 那张，同时点亮本稀有度的内描边色环，免得与真·稀有混淆
        img.dataset.frameFallback = ''
        img.closest<HTMLElement>('.card-face')?.classList.add('frame-degraded')
        img.src = alt
        return
      }
      const face = img.closest<HTMLElement>('.card-face')
      img.remove()
      face?.classList.add('no-frame')
    }
    if (img.complete && img.naturalWidth === 0) fail()
    // 不加 once：上面那条降级链可能还要再吃一次 error
    img.addEventListener('error', fail)
  })
}

/** 详情浮层内容；查不到定义返回 null（调用方据此不弹） */
export function cardDetailHtml(catalog: Catalog, cardId: string): string | null {
  const def = catalog.skillDefs.get(cardId) ?? catalog.behaviorTemplates.get(cardId)
  if (!def) return null
  const active = catalog.skillDefs.has(cardId)
  const cost = catalog.skillDefs.get(cardId)?.cost
  const hook = catalog.behaviorTemplates.get(cardId)?.hook
  const trig = def.triggers?.map((t) => t.event).filter(Boolean) ?? []
  const events = [...(hook ?? []), ...trig]
  const className = catalog.classDefs.get(def.pathwayId)?.name ?? def.pathwayId

  const meta = [
    RARITY_LABEL[def.rarity] ?? def.rarity,
    active ? '主动' : '被动',
    def.sequence != null ? `序列${def.sequence}${def.sequenceName ? ` · ${def.sequenceName}` : ''}` : '',
    className,
  ].filter(Boolean)

  const badges = meta.map((m) => `<span class="cp-badge">${escapeHtml(m)}</span>`).join('')
  const tags = (def.tags ?? []).map((t) => `<span class="cp-badge">${escapeHtml(t)}</span>`).join('')

  const costRows = cost
    ? `<dl class="cp-kv">
        <dt>能量</dt><dd>${cost.energy}</dd>
        <dt>冷却</dt><dd>${cost.cooldown} tick</dd>
        <dt>吟唱</dt><dd>${cost.castTime == null ? '—' : `${cost.castTime} tick`}</dd>
      </dl>`
    : ''
  const trigRow = events.length
    ? `<dl class="cp-kv"><dt>触发</dt><dd>${escapeHtml(events.join('、'))}</dd></dl>`
    : ''

  return `
  <h4>${escapeHtml(def.name)}</h4>
  <div class="cp-badges">${badges}${tags}</div>
  ${def.describe ? `<p class="cp-desc">${escapeHtml(def.describe)}</p>` : ''}
  ${costRows}
  ${trigRow}
  ${def.flavor ? `<p class="cp-flavor">${escapeHtml(def.flavor)}</p>` : ''}`
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
