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

export function topbarHtml(): string {
  return `
  <header class="topbar">
    <a class="brand" href="#/">卡牌对战</a>
    <nav class="topbar-nav">
      <a href="#/cards">卡池</a>
      <a href="#/leaderboard">排行榜</a>
      <a href="#/settings">设置</a>
      <a class="wiki-link" href="./site/" target="_blank" rel="noopener">资料库 Wiki ↗</a>
    </nav>
  </header>`
}

export function subBarHtml(title: string): string {
  return `
  <header class="topbar sub">
    <a class="back" href="#/">← 返回</a>
    <span class="sub-title">${escapeHtml(title)}</span>
  </header>`
}
