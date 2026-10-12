import { renderMenu } from './views/menu'
import { renderPlaceholder } from './views/placeholder'
import { renderSettings } from './views/settings'
import { renderNewGame } from './views/newgame'
import { renderPrep } from './views/prep'
import { renderBattle } from './views/battle'
import { renderLeaderboard } from './views/leaderboard'
import { renderCards } from './views/cards'
import { renderOnline } from './views/online'

type RenderFn = (host: HTMLElement, arg: string) => void | Promise<void>

const placeholder = (title: string, desc: string): RenderFn => (host) =>
  renderPlaceholder(host, title, desc)

const ROUTES: Record<string, RenderFn> = {
  '': renderMenu,
  new: renderNewGame,
  prep: renderPrep,
  online: renderOnline,
  battle: renderBattle,
  continue: placeholder('继续游戏', '本地存档恢复（P4 落地）'),
  cards: renderCards,
  leaderboard: renderLeaderboard,
  settings: renderSettings,
}

function notFound(host: HTMLElement, arg: string): void {
  renderPlaceholder(host, '页面不存在', `没有匹配的路由：${arg ? `#/${arg}` : location.hash}`)
}

function currentRoute(): { path: string; arg: string } {
  const segs = location.hash.replace(/^#/, '').split('/').filter(Boolean)
  return { path: segs[0] ?? '', arg: segs.slice(1).join('/') }
}

/** 首页标记：秘仪阵（arcane-bg）只在这一条路由启用，非首页 display:none 完全停用。
 *  放在这里而不是特效模块里 —— 路由事实源只有一处，特效不再自己解析 URL。 */
function markMenuRoute(isMenu: boolean): void {
  document.body.classList.toggle('is-menu-route', isMenu)
}

export function initRouter(host: HTMLElement): void {
  const render = (): void => {
    const { path, arg } = currentRoute()
    const view = ROUTES[path] ?? notFound
    markMenuRoute(path === '')
    window.scrollTo(0, 0)
    void view(host, arg)
  }
  window.addEventListener('hashchange', render)
  render()
}
