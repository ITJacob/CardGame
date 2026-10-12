// 卡面放大视图：点卡面 → 铺满视口放大看大图。详情两种摆法，改动见 styles/app.css 的同名段。
//
// 跟 hover.ts 的浮层同样的约束：路由没有卸载钩子、视图整体重写 innerHTML，所以挂
// document.body，并且自己盯着路由变化——换 hash（切职业/切页）就自动收掉，不必让每个
// 视图都记得关它。
//
// 摆法由视口决定，判据与 CSS 那条媒体查询是同一个字符串（横板够宽 → 详情常驻卡右侧；
// 否则详情半透盖在卡上、默认盖上，点卡面收起/再点开）。点击时现判，不需要盯 resize。
import { hydrateArt } from './components/cardFace'
import { icon } from './components/icons'

/** 与 app.css 里「横板」那条媒体查询保持一字不差。
 *  横版 = 宽 ≥1100（任意朝向），或竖屏宽 ≥768（pad 竖屏：卡+详情并排放得下，同时显示）；
 *  手机横屏（<1100 的 landscape）仍走叠加模式，卡面更大。 */
const WIDE = '(min-width: 1100px), (min-width: 768px) and (orientation: portrait)'

export interface ZoomOpts {
  /** 放大后的卡面 HTML（尺寸靠 .card-face.zoom 撑） */
  cardHtml: string
  /** 卡面详情 HTML（cardDetailHtml 的产物） */
  detailHtml: string
  /** 卡池页才有：放大视图里的锁定/解锁角标。toggle() 返回切换后的「已解锁」 */
  lock?: { unlocked: boolean; toggle: () => boolean }
}

let onClose: (() => void) | null = null

/** 收掉当前放大视图（没有就什么都不做） */
export function hideCardZoom(): void {
  onClose?.()
}

export function openCardZoom(opts: ZoomOpts): void {
  hideCardZoom() // 同一时刻只留一个

  const el = document.createElement('div')
  el.className = 'card-zoom'
  el.setAttribute('role', 'dialog')
  el.setAttribute('aria-modal', 'true')
  el.tabIndex = -1 // 只为可聚焦（Esc 与读屏进得去），不进 tab 序列
  // 窄屏（含移动端）详情默认盖在卡上：点进来就是「看这张卡」，不该再要第二下才出描述
  if (!window.matchMedia(WIDE).matches) el.classList.add('tip-on')
  // 锁标与 ✕ 并列、不放在 .zoom-stage 里——stage 内的点击全被认成「开关详情」
  const lockHtml = opts.lock
    ? `<button type="button" class="card-lock zoom-lock" aria-pressed="${!opts.lock.unlocked}" aria-label="锁定">
         <span aria-hidden="true">${opts.lock.unlocked ? '🔓' : '🔒'}</span>
       </button>`
    : ''
  el.innerHTML = `
    <button type="button" class="cg-close zoom-close" aria-label="关闭">${icon('cg-close')}</button>
    ${lockHtml}
    <div class="zoom-stage">
      <div class="zoom-face">${opts.cardHtml}</div>
      <div class="zoom-tip cg-scroll card-detail" role="tooltip">${opts.detailHtml}</div>
      <span class="zoom-hint" aria-hidden="true">点卡面看详情</span>
    </div>`
  document.body.append(el)
  document.body.classList.add('zoom-open')
  hydrateArt(el) // 放大视图里的卡图/边框也要走无图与降级那条链
  el.focus({ preventScroll: true })

  const close = (): void => {
    el.remove()
    document.body.classList.remove('zoom-open')
    window.removeEventListener('keydown', onKey)
    window.removeEventListener('hashchange', close)
    onClose = null
  }
  const onKey = (e: KeyboardEvent): void => {
    if (e.key === 'Escape') close()
  }

  // 点背景关（点卡与详情都不关）；✕ 按钮也走这里
  el.addEventListener('click', (e) => {
    const t = e.target as HTMLElement
    if (t.closest('.zoom-close')) return close()
    if (t.closest('.zoom-lock')) {
      const lockBtn = t.closest<HTMLButtonElement>('.zoom-lock')
      if (lockBtn && opts.lock) {
        const unlocked = opts.lock.toggle()
        lockBtn.setAttribute('aria-pressed', String(!unlocked))
        lockBtn.innerHTML = `<span aria-hidden="true">${unlocked ? '🔓' : '🔒'}</span>`
      }
      return
    }
    // 竖版/窄屏：卡面、详情、卡外那条提示叠在一起，点哪都是开关详情
    if (!window.matchMedia(WIDE).matches && t.closest('.zoom-stage, .zoom-hint')) {
      el.classList.toggle('tip-on')
      return
    }
    if (t === el) close()
  })
  window.addEventListener('keydown', onKey)
  window.addEventListener('hashchange', close) // 路由一变（切职业/切页）自动收

  onClose = close
}
