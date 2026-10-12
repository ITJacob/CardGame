// 塔罗符文·秘仪阵 —— DOM 控制器（唯一职责：决定「静态档 / 暂停」两个状态）
//
// 层级与生命周期见 docs/arcane-bg-impl-plan.md；视觉参数见 docs/arcane-bg-spec.md。
// 三条纪律：
//   ① 不使用 rAF、不做逐帧绘制 —— 动画全在 CSS 里（只有 R1/R2 两个运动 group）；
//   ② 路由开关不在本模块：router 是唯一的路由事实源（body.is-menu-route）；
//   ③ 模块顶层不碰 DOM —— game/tests 跑在 vitest 的 node 环境里，纯函数要能单测。

const LOW_CLASS = 'af-low'
const PAUSED_CLASS = 'is-af-paused'

/** 能拿到的那几个「这台设备弱不弱 / 用户想不想省」的信号（非标准字段一律按可能缺失处理） */
export interface ArcaneCapability {
  reducedMotion: boolean
  saveData: boolean
  deviceMemory: number | null
  hardwareConcurrency: number | null
}

/** 降级判定结果 */
export interface ArcaneQuality {
  /** low = 静态档：三层几何照旧显示，但取消全部动画 */
  low: boolean
  reason: string
}

function readNumber(source: object, key: string): number | null {
  const v = (source as Record<string, unknown>)[key]
  return typeof v === 'number' && Number.isFinite(v) ? v : null
}

function readConnection(nav: Navigator): { saveData: boolean } | null {
  // Network Information API：Chrome/Edge 系有，Safari/Firefox 无 → 一律按缺失处理
  const conn = (nav as unknown as { connection?: unknown }).connection
  if (!conn || typeof conn !== 'object') return null
  const saveData = (conn as { saveData?: unknown }).saveData
  return { saveData: saveData === true }
}

function matchReducedMotion(mql: Pick<MediaQueryList, 'matches'> | null): boolean {
  return mql?.matches === true
}

/** 采集信号（可注入，便于 node 环境单测） */
export function readCapability(env: {
  matchMedia?: (query: string) => Pick<MediaQueryList, 'matches'> | null
  navigator?: Navigator
} = {}): ArcaneCapability {
  const mql = env.matchMedia ? env.matchMedia('(prefers-reduced-motion: reduce)') : null
  const nav = env.navigator
  const conn = nav ? readConnection(nav) : null
  return {
    reducedMotion: matchReducedMotion(mql),
    saveData: conn?.saveData === true,
    deviceMemory: nav ? readNumber(nav, 'deviceMemory') : null,
    hardwareConcurrency: nav ? readNumber(nav, 'hardwareConcurrency') : null,
  }
}

/**
 * 降级判定（纯函数）。
 * 策略刻意保守：单一弱信号不足以判 low，避免误伤只缺 API 的正常设备。
 *   - reduce / Save-Data       → low（用户意愿优先）
 *   - deviceMemory ≤ 4 且核数 ≤ 4 → low（两项同时成立）
 *   - 缺 deviceMemory 时核数 ≤ 2 → low
 *   - API 全缺失              → 不降级（按正常档走）
 */
export function decideQuality(cap: ArcaneCapability): ArcaneQuality {
  if (cap.reducedMotion) return { low: true, reason: 'reduced-motion' }
  if (cap.saveData) return { low: true, reason: 'save-data' }
  const cores = cap.hardwareConcurrency
  const mem = cap.deviceMemory
  if (mem != null && cores != null && mem <= 4 && cores <= 4) return { low: true, reason: 'low-device' }
  if (mem == null && cores != null && cores <= 2) return { low: true, reason: 'low-cores' }
  return { low: false, reason: 'normal' }
}

/** 单例：initArcaneField 重复调用也不会挂第二份监听 */
let wired = false

/**
 * 初始化（只在 main.ts 调一次）。
 * 只写两个 body 状态：af-low（静态档）与 is-af-paused（页面隐藏时暂停 CSS 动画）。
 */
export function initArcaneField(): void {
  if (wired) return
  wired = true
  if (typeof document === 'undefined') return

  const cap = readCapability({
    matchMedia: typeof window.matchMedia === 'function' ? window.matchMedia.bind(window) : undefined,
    navigator: typeof navigator === 'undefined' ? undefined : navigator,
  })
  if (decideQuality(cap).low) document.body.classList.add(LOW_CLASS)

  // 隐藏页暂停：display:none 之外的一道保险（切到后台不应继续跑动画）
  const sync = (): void => {
    document.body.classList.toggle(PAUSED_CLASS, document.hidden)
  }
  sync()
  document.addEventListener('visibilitychange', sync)
}
