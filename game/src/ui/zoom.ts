// 卡面放大视图：点卡面 → 居中放大看大图，在大图上 hover 出详情。
//
// 跟 hover.ts 的浮层同样的约束：路由没有卸载钩子、视图整体重写 innerHTML，所以挂
// document.body，并且自己盯着路由变化——换 hash（切职业/切页）就自动收掉，不必让每个
// 视图都记得关它。
import { hydrateArt } from './components/cardFace'

export interface ZoomOpts {
  /** 放大后的卡面 HTML（尺寸靠 .card-face.zoom 撑） */
  cardHtml: string
  /** 卡面详情 HTML（cardDetailHtml 的产物），hover 时显示 */
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
    if (e.target === el || (e.target as HTMLElement).closest('.zoom-close')) close()
  })
  window.addEventListener('keydown', onKey)
  window.addEventListener('hashchange', close) // 路由一变（切职业/切页）自动收

  onClose = close
}
