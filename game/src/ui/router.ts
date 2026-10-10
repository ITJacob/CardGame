import { renderMenu } from './views/menu'
import { renderPlaceholder } from './views/placeholder'
import { renderSettings } from './views/settings'

type RenderFn = (host: HTMLElement, arg: string) => void | Promise<void>

const placeholder = (title: string, desc: string): RenderFn => (host) =>
  renderPlaceholder(host, title, desc)

const ROUTES: Record<string, RenderFn> = {
  '': renderMenu,
  new: placeholder('开始新游戏', '英雄生成 · 编队 · 战斗（P4/P5 落地）'),
  continue: placeholder('继续游戏', '本地存档恢复（P4 落地）'),
  cards: placeholder('现有卡池', '解锁职业与卡牌（P4 落地）'),
  leaderboard: placeholder('排行榜', '本地榜单（P6 落地）'),
  settings: renderSettings,
}

function notFound(host: HTMLElement, arg: string): void {
  renderPlaceholder(host, '页面不存在', `没有匹配的路由：${arg ? `#/${arg}` : location.hash}`)
}

function currentRoute(): { path: string; arg: string } {
  const segs = location.hash.replace(/^#/, '').split('/').filter(Boolean)
  return { path: segs[0] ?? '', arg: segs.slice(1).join('/') }
}

export function initRouter(host: HTMLElement): void {
  const render = (): void => {
    const { path, arg } = currentRoute()
    const view = ROUTES[path] ?? notFound
    window.scrollTo(0, 0)
    void view(host, arg)
  }
  window.addEventListener('hashchange', render)
  render()
}
