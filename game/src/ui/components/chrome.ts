// 页面外壳：顶栏 / 子页栏 / 通用按钮。样式全部来自 ui-kit（.cg-nav / .cg-back / .cg-btn），
// 这里只负责拼 HTML 与转义。
import { icon } from './icons'

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => {
    switch (c) {
      case '&': return '&amp;'
      case '<': return '&lt;'
      case '>': return '&gt;'
      case '"': return '&quot;'
      default: return '&#39;'
    }
  })
}

/** 顶栏：主菜单/各页共用。导航项用 #/ 路由 hash */
export function topbarHtml(): string {
  return `
  <header class="cg-nav">
    <a class="cg-nav__brand" href="#/">${icon('cg-sigil-star')}卡牌对战</a>
    <nav class="cg-nav__links">
      <a class="cg-nav__link" href="#/cards">卡池</a>
      <a class="cg-nav__link" href="#/leaderboard">排行榜</a>
      <a class="cg-nav__link" href="#/settings">设置</a>
      <a class="cg-nav__link" href="./site/" target="_blank" rel="noopener">资料库 Wiki ↗</a>
    </nav>
  </header>`
}

/** 子页栏：返回胶囊 + 页名 */
export function subBarHtml(title: string, backHref = '#/'): string {
  return `
  <header class="cg-nav cg-nav--sub">
    <a class="cg-back" href="${escapeHtml(backHref)}">${icon('cg-back')}返回</a>
    <span class="cg-nav__brand sub-title">${escapeHtml(title)}</span>
  </header>`
}

/* 按钮一律直接用 ui-kit 的 .cg-btn 类（primary / ghost / danger、sm / lg / block），
   不另外包一层 helper —— 类名本身就是文档，包一层反而看不出实际渲染成什么。 */
