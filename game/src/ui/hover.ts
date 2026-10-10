// 卡面详情浮层：停在卡面上满 delay 毫秒才弹，移开即收。
//
// 两个约束决定了实现形状：
// 1) 路由没有卸载钩子、视图每次都整体重写 innerHTML（见 views/battle.ts 的说明），
//    所以浮层不能挂在视图内——它会被下一次重绘连根拔掉。挂 document.body。
// 2) mouseenter/mouseleave 不冒泡，没法委托；用冒泡的 mouseover/mouseout 配 closest 归一。
//
// 挂载照抄 drag.ts 的幂等范式（WeakMap + AbortController）：同一个 host 反复 enable 时
// 后一次会自动摘掉上一次，不会越积越多。

const bound = new WeakMap<HTMLElement, AbortController>()

/** 当前活着的那个绑定（路由复用同一个 host 元素，所以同时最多一个） */
let liveHide: (() => void) | null = null

/** 重绘前手动收起：重绘不产生鼠标事件，浮层不会自己消失 */
export function hideCardPop(): void {
  liveHide?.()
}

export interface HoverCardOpts {
  /** 指针下的元素 → 它所在的卡面；返回 null 表示这里不是卡面 */
  resolve: (el: HTMLElement) => HTMLElement | null
  /** 现构详情 HTML；返回 null 表示这张卡不弹 */
  render: (face: HTMLElement) => string | null
  /** 悬停多久才弹（毫秒，默认 450） */
  delay?: number
}

export function enableHoverCard(host: HTMLElement, opts: HoverCardOpts): void {
  bound.get(host)?.abort()
  const ac = new AbortController()
  const { signal } = ac
  bound.set(host, ac)

  const delay = opts.delay ?? 450
  let timer = 0
  let pop: HTMLElement | null = null
  let current: HTMLElement | null = null

  const hide = (): void => {
    window.clearTimeout(timer)
    timer = 0
    current = null
    if (pop) pop.style.display = 'none'
  }

  const place = (face: HTMLElement): void => {
    if (!pop) return
    const r = face.getBoundingClientRect()
    const pw = pop.offsetWidth
    const ph = pop.offsetHeight
    let left = r.right + 8
    if (left + pw > window.innerWidth - 8) left = r.left - pw - 8 // 右边放不下就翻到左边
    if (left < 8) left = 8
    let top = r.top
    if (top + ph > window.innerHeight - 8) top = window.innerHeight - 8 - ph
    if (top < 8) top = 8
    pop.style.left = `${left}px`
    pop.style.top = `${top}px`
  }

  const show = (face: HTMLElement): void => {
    // 卡面可能已经被重绘替换、或整块被 <details> 折叠（子节点 display:none）——都别弹
    if (!face.isConnected) return
    const html = opts.render(face)
    if (!html) return
    if (!pop || !pop.isConnected) {
      pop = document.createElement('div')
      pop.className = 'card-pop'
      pop.setAttribute('role', 'tooltip')
      pop.style.display = 'none'
      document.body.append(pop)
    }
    pop.innerHTML = html
    pop.style.display = ''
    pop.style.visibility = 'hidden' // 先量尺寸再定位，避免闪一下
    place(face)
    pop.style.visibility = ''
    current = face
  }

  host.addEventListener(
    'mouseover',
    (e) => {
      const el = e.target as HTMLElement | null
      const face = el ? opts.resolve(el) : null
      if (face === current) return
      window.clearTimeout(timer)
      timer = 0
      if (current) hide()
      if (!face) return
      timer = window.setTimeout(() => show(face), delay)
    },
    { signal },
  )

  host.addEventListener(
    'mouseout',
    (e) => {
      const from = e.target as HTMLElement | null
      const face = from ? opts.resolve(from) : null
      // 还在同一张卡面内部挪动（子元素之间）不算离开
      if (face && face === current && face.contains(e.relatedTarget as Node | null)) return
      hide()
    },
    { signal },
  )

  // 拖拽起手要立刻收（否则浮层压在拖影底下）；滚动/缩放位置就过期了，也收
  const onScroll = (): void => hide()
  window.addEventListener('pointerdown', onScroll, { signal, capture: true })
  window.addEventListener('scroll', onScroll, { signal, capture: true })
  window.addEventListener('resize', onScroll, { signal })
  window.addEventListener(
    'keydown',
    (e) => {
      if (e.key === 'Escape') hide()
    },
    { signal },
  )

  signal.addEventListener('abort', () => {
    hide()
    pop?.remove()
    pop = null
    liveHide = null
  })

  liveHide = hide
}
