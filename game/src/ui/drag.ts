// 指针拖拽：鼠标与触屏同一条实现。原生 HTML5 DnD 在触屏上根本不触发，而本端有竖屏布局，
// 所以用 pointerdown/move/up + elementFromPoint 手搓一份最小的。只负责
// 「起拖 → 高亮落点 → 松手回调」，命中判定与业务语义由调用方给。
//
// 监听挂在 host 上并做了幂等（WeakMap + AbortController）：视图被反复进入时
// 后一次 enableDrag 会自动摘掉上一次，不会越积越多、也不会让旧闭包拿着旧状态乱动。

const bound = new WeakMap<HTMLElement, AbortController>()

export interface Grab<T> {
  payload: T
  /** 被拖动的那个元素：用来压暗，并作为跟随指针的幽灵的克隆源 */
  source: HTMLElement
}

export interface DragOpts<T> {
  /** pointerdown 命中的元素 → 载荷；返回 null 表示这里不是拖源 */
  grab: (el: HTMLElement) => Grab<T> | null
  /** 指针下的元素 → 合法落点元素（调用方用 closest 归一）；返回 null 表示此处不接受 */
  resolveDrop: (el: HTMLElement, payload: T) => HTMLElement | null
  /** 松手落在落点元素上 */
  drop: (el: HTMLElement, payload: T) => void
  /** 位移超过这个像素数才算拖拽，否则按普通点击处理（默认 6） */
  threshold?: number
}

export function enableDrag<T>(host: HTMLElement, opts: DragOpts<T>): void {
  bound.get(host)?.abort()
  const ac = new AbortController()
  const { signal } = ac
  bound.set(host, ac)

  const threshold = opts.threshold ?? 6
  let held: Grab<T> | null = null
  let ghost: HTMLElement | null = null
  let hover: HTMLElement | null = null
  let startX = 0
  let startY = 0
  let grabDx = 0
  let grabDy = 0
  /** 已越过阈值：这时才算真拖拽，松手要吃掉随之而来的 click */
  let live = false

  // 图片自带原生拖拽，会抢走 pointer 序列
  host.addEventListener('dragstart', (e) => e.preventDefault(), { signal })

  const end = (): void => {
    held?.source.classList.remove('dragging')
    hover?.classList.remove('drop-on')
    ghost?.remove()
    document.body.classList.remove('is-dragging')
    held = null
    ghost = null
    hover = null
    live = false
  }
  signal.addEventListener('abort', end)

  host.addEventListener(
    'pointerdown',
    (e) => {
      if (held || e.button !== 0) return
      const el = e.target as HTMLElement | null
      const got = el ? opts.grab(el) : null
      if (!got) return
      const rect = got.source.getBoundingClientRect()
      held = got
      startX = e.clientX
      startY = e.clientY
      grabDx = e.clientX - rect.left
      grabDy = e.clientY - rect.top
      got.source.setPointerCapture(e.pointerId)
    },
    { signal },
  )

  host.addEventListener(
    'pointermove',
    (e) => {
      if (!held) return
      if (!live) {
        if (Math.hypot(e.clientX - startX, e.clientY - startY) < threshold) return
        live = true
        const rect = held.source.getBoundingClientRect()
        held.source.classList.add('dragging')
        document.body.classList.add('is-dragging')
        ghost = held.source.cloneNode(true) as HTMLElement
        ghost.classList.add('drag-ghost')
        ghost.style.width = `${rect.width}px`
        ghost.style.height = `${rect.height}px`
        document.body.append(ghost)
      }
      ghost!.style.left = `${e.clientX - grabDx}px`
      ghost!.style.top = `${e.clientY - grabDy}px`
      const under = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null
      const raw = under ? opts.resolveDrop(under, held.payload) : null
      const next = raw && raw !== held.source && host.contains(raw) ? raw : null
      if (next !== hover) {
        hover?.classList.remove('drop-on')
        hover = next
        hover?.classList.add('drop-on')
      }
    },
    { signal },
  )

  host.addEventListener(
    'pointerup',
    (e) => {
      if (!held) return
      const target = hover
      const { payload } = held
      const moved = live
      end()
      if (!moved) return // 没过阈值：当点击，交给 click 处理
      swallowClick(e.clientX, e.clientY)
      if (target) opts.drop(target, payload)
    },
    { signal },
  )

  host.addEventListener(
    'pointercancel',
    () => {
      if (held) end()
    },
    { signal },
  )
}

/**
 * 拖完那一下浏览器还会补一个 click（落在 mousedown/mouseup 的共同祖先上），
 * 吃掉它，否则等于又点了一次。
 * 只吃「就是这一下」的那个：位置对得上，且紧随 pointerup 到达——
 * 下一个任务还没等到就撤掉监听，不会误伤用户紧接着的其它点击。
 */
function swallowClick(x: number, y: number): void {
  const disarm = (): void => window.removeEventListener('click', eat, { capture: true })
  const eat = (e: MouseEvent): void => {
    if (Math.abs(e.clientX - x) > 4 || Math.abs(e.clientY - y) > 4) return
    e.stopPropagation()
    e.preventDefault()
    disarm()
  }
  window.addEventListener('click', eat, { capture: true })
  window.setTimeout(disarm, 0)
}
