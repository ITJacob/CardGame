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

/** 点击档没有「等多久」——点下去就弹 */
export type ClickCardOpts = Omit<HoverCardOpts, 'delay'>

/** 浮层外壳。挂 body 不挂视图（视图重绘会连根拔掉）；card-detail 是与放大视图 .zoom-tip 共用的正文样式 */
function createPop(): HTMLElement {
  const el = document.createElement('div')
  el.className = 'card-pop card-detail'
  el.setAttribute('role', 'tooltip')
  el.style.display = 'none'
  document.body.append(el)
  return el
}

/** 贴在卡面右侧；右边放不下就翻到左边，上下夹在视口内 */
function placePop(pop: HTMLElement, face: HTMLElement): void {
  const r = face.getBoundingClientRect()
  const pw = pop.offsetWidth
  const ph = pop.offsetHeight
  let left = r.right + 8
  if (left + pw > window.innerWidth - 8) left = r.left - pw - 8
  if (left < 8) left = 8
  let top = r.top
  if (top + ph > window.innerHeight - 8) top = window.innerHeight - 8 - ph
  if (top < 8) top = 8
  pop.style.left = `${left}px`
  pop.style.top = `${top}px`
}

/** 填内容 + 显示 + 定位。定位前先隐藏，避免量尺寸时闪一下 */
function showPop(pop: HTMLElement, face: HTMLElement, html: string): void {
  pop.innerHTML = html
  pop.style.display = ''
  pop.style.visibility = 'hidden'
  placePop(pop, face)
  pop.style.visibility = ''
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

  const show = (face: HTMLElement): void => {
    // 卡面可能已经被重绘替换、或整块被 <details> 折叠（子节点 display:none）——都别弹
    if (!face.isConnected) return
    const html = opts.render(face)
    if (!html) return
    if (!pop || !pop.isConnected) pop = createPop()
    showPop(pop, face, html)
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

/**
 * 点击档：移动端没有 hover，技能详情改成点一下弹。语义是开合——
 * 点同一张再点收起，点另张换内容，点浮层内部不关（方便划选描述文字），点空白处关。
 *
 * 监听挂在 document 而不是 host：关浮层要靠「点到别处」，而别处往往不在 host 里。
 * 浮层里被点亮的卡面加 .is-open，一眼看出当前弹的是哪张。
 */
export function enableClickCard(host: HTMLElement, opts: ClickCardOpts): void {
  bound.get(host)?.abort()
  const ac = new AbortController()
  const { signal } = ac
  bound.set(host, ac)

  let pop: HTMLElement | null = null
  let current: HTMLElement | null = null

  const hide = (): void => {
    current?.classList.remove('is-open')
    current = null
    if (pop) pop.style.display = 'none'
  }

  const show = (face: HTMLElement): void => {
    if (!face.isConnected) return
    const html = opts.render(face)
    if (!html) return
    if (!pop || !pop.isConnected) pop = createPop()
    showPop(pop, face, html)
    current = face
    face.classList.add('is-open')
  }

  document.addEventListener(
    'click',
    (e) => {
      const t = e.target as HTMLElement | null
      if (!t || pop?.contains(t)) return
      const face = opts.resolve(t)
      if (face && face !== current) {
        hide()
        show(face)
        return
      }
      hide() // 点空白处、或再点同一张：都收
    },
    { signal },
  )

  const onStale = (): void => hide()
  window.addEventListener('scroll', onStale, { signal, capture: true })
  window.addEventListener('resize', onStale, { signal })
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
