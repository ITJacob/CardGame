// 卡面放大视图：点卡面 → 铺满视口放大看大图。详情两种摆法，改动见 styles/app.css 的同名段。
//
// 跟 hover.ts 的浮层同样的约束：路由没有卸载钩子、视图整体重写 innerHTML，所以挂
// document.body，并且自己盯着路由变化——换 hash（切职业/切页）就自动收掉，不必让每个
// 视图都记得关它。
//
// 摆法由视口决定，判据与 CSS 那条媒体查询是同一个字符串（横板够宽 → 详情常驻卡右侧；
// 否则点卡面把详情半透盖在卡上）。点击时现判，不需要盯 resize。
import { hydrateArt } from './components/cardFace'

/** 与 app.css 里「横板」那条媒体查询保持一字不差 */
const WIDE = '(min-width: 1100px) and (orientation: landscape)'

export interface ZoomOpts {
  /** 放大后的卡面 HTML（尺寸靠 .card-face.zoom 撑） */
  cardHtml: string
  /** 卡面详情 HTML（cardDetailHtml 的产物） */
  detailHtml: string
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
  el.innerHTML = `
    <button type="button" class="zoom-close" aria-label="关闭">✕</button>
    <div class="zoom-stage">
      <div class="zoom-face">${opts.cardHtml}</div>
      <div class="zoom-tip card-detail" role="tooltip">${opts.detailHtml}</div>
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
    // 竖版/窄屏：卡面与详情叠在一起，点这一团就是开关详情
    if (!window.matchMedia(WIDE).matches && t.closest('.zoom-stage')) {
      el.classList.toggle('tip-on')
      return
    }
    if (t === el) close()
  })
  window.addEventListener('keydown', onKey)
  window.addEventListener('hashchange', close) // 路由一变（切职业/切页）自动收

  onClose = close
}
