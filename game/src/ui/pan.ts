// 指针平移：鼠标与触屏同一条实现。战场棋盘铺满一屏，内容溢出时靠拖拽平移查看。
// 不用原生滚动条——滚动条的把手与「满屏战场」的观感冲突，且移动端原生滚动会跟
// 战斗里的点选抢指针；这里自己接管指针、直接改 viewport 的 scrollLeft/Top。
//
// 与 drag.ts 同一套幂等范式（WeakMap + AbortController）：视图反复进入时后一次
// enablePan 会自动摘掉上一次，不越积越多、旧闭包也不会拿着旧状态乱动。
//
// 故意**不用 setPointerCapture**：指针捕获会把随后的 mousedown/mouseup/click 一并
// 重定向到 viewport，棋子上「点它选靶」的直接监听就不再触发。改为把 move/up 挂在
// window 上（触屏本就有隐式捕获，鼠标则靠 window 兜住移出元素的情况），点选照常。
// 起手位移过阈值才算平移；真平移的那一下要吃掉尾随 click（同 drag.ts 的 swallowClick）。

const bound = new WeakMap<HTMLElement, AbortController>()

export interface PanOpts {
  /** 平移的滚动容器：需 overflow 隐藏（overflow:hidden 仍可程序化滚动，只是不出滚动条） */
  viewport: HTMLElement
  /** 位移超过这个像素数才算平移，否则按普通点击处理（默认 6） */
  threshold?: number
}

export function enablePan(host: HTMLElement, opts: PanOpts): void {
  bound.get(host)?.abort()
  const ac = new AbortController()
  const { signal } = ac
  bound.set(host, ac)

  const { viewport } = opts
  const threshold = opts.threshold ?? 6
  let active = false
  /** 已越过阈值：这时才算真平移，松手要吃掉随之而来的 click */
  let live = false
  let startX = 0
  let startY = 0
  let startLeft = 0
  let startTop = 0

  const end = (): void => {
    if (!active) return
    active = false
    live = false
    viewport.classList.remove('is-panning')
  }
  signal.addEventListener('abort', end)

  // 图片自带原生拖拽，会抢走 pointer 序列
  viewport.addEventListener('dragstart', (e) => e.preventDefault(), { signal })

  window.addEventListener(
    'pointerdown',
    (e) => {
      if (active || e.button !== 0) return
      const t = e.target as Node | null
      if (!t || !viewport.contains(t)) return // 只认视口内的起手
      active = true
      live = false
      startX = e.clientX
      startY = e.clientY
      startLeft = viewport.scrollLeft
      startTop = viewport.scrollTop
    },
    { signal },
  )

  window.addEventListener(
    'pointermove',
    (e) => {
      if (!active) return
      const dx = e.clientX - startX
      const dy = e.clientY - startY
      if (!live) {
        if (Math.hypot(dx, dy) < threshold) return
        live = true
        viewport.classList.add('is-panning')
      }
      viewport.scrollLeft = startLeft - dx
      viewport.scrollTop = startTop - dy
    },
    { signal },
  )

  window.addEventListener(
    'pointerup',
    (e) => {
      if (!active) return
      const moved = live
      end()
      if (moved) swallowClick(e.clientX, e.clientY) // 平移过：吃掉尾随 click，免得顺带选了靶
    },
    { signal },
  )

  window.addEventListener('pointercancel', () => end(), { signal })
}

/**
 * 平移到松手那一下浏览器还会补一个 click（落在 mousedown/mouseup 的共同祖先上），
 * 吃掉它，否则等于平移完又点了一次靶。只吃「就是这一下」的那个：位置对得上，且紧随
 * pointerup 到达——下一个任务没等到就撤掉监听，不会误伤用户紧接着的其它点击。（同 drag.ts）
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
