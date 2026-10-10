import { topbarHtml } from '../components/chrome'
import { loadManifest } from '../../data/loader'

export function renderMenu(host: HTMLElement): void {
  host.innerHTML = `
    ${topbarHtml()}
    <main class="menu">
      <h1 class="menu-title">卡牌对战</h1>
      <p class="menu-sub">Roguelike 爬塔 · 队伍对战</p>
      <nav class="menu-actions">
        <a class="btn primary" href="#/new">开始新游戏</a>
        <a class="btn" href="#/continue">继续游戏</a>
        <a class="btn" href="#/cards">现有卡池</a>
        <a class="btn" href="#/leaderboard">排行榜</a>
        <a class="btn" href="#/settings">设置</a>
      </nav>
      <p class="menu-status" id="menu-status">正在加载数据索引…</p>
    </main>`

  const status = host.querySelector<HTMLParagraphElement>('#menu-status')
  loadManifest()
    .then((m) => {
      const cards = m.pathways.reduce((n, p) => n + p.cardCount, 0)
      if (!status) return
      status.textContent = `数据源就绪 · ${m.pathways.length} 途径 · ${cards} 卡 · schema ${m.schemaVersion}`
      status.classList.add('ok')
    })
    .catch((err: unknown) => {
      if (!status) return
      status.textContent = `数据索引加载失败：${err instanceof Error ? err.message : String(err)}`
      status.classList.add('err')
    })
}
