// 排行榜：本地战绩（按 胜负 → 我方阵亡 → 用时 排序）
import { subBarHtml, escapeHtml } from '../components/chrome'
import { icon } from '../components/icons'
import { createLocalStorageMatchStore, sortRecords, summarize } from '../../meta/matchLog'
import { loadProfile } from '../profile'

const store = createLocalStorageMatchStore()

const OUTCOME_TEXT: Record<string, string> = { side_a: '胜', side_b: '负', draw: '平', aborted: '断' }

export function renderLeaderboard(host: HTMLElement): void {
  const profile = loadProfile()
  const records = sortRecords(store.all())
  const sum = summarize(records)
  const rate = Math.round(sum.winRate * 100)

  const rows = records
    .map((r, i) => {
      const date = new Date(r.at).toLocaleString('zh-CN', { hour12: false }).slice(5, 16)
      const heroes = r.heroes.map((h) => escapeHtml(h.classId)).join('、')
      const cls = r.win ? 'win' : r.outcome === 'draw' || r.outcome === 'aborted' ? 'draw' : 'lose'
      return `<tr class="${cls}">
        <td class="rank">${i + 1}</td>
        <td>${escapeHtml(date)}</td>
        <td class="res">${OUTCOME_TEXT[r.outcome] ?? r.outcome}</td>
        <td>${r.ticks}</td>
        <td>${r.unitsLostOwn} : ${r.unitsLostEnemy}</td>
        <td title="${escapeHtml(heroes)}">${escapeHtml(heroes)}</td>
      </tr>`
    })
    .join('')

  host.innerHTML = `
    ${subBarHtml('排行榜')}
    <div class="page-scroll cg-scroll">
    <main class="board-page">
      <section class="cg-panel">
        <div class="cg-panel__head">
          ${icon('cg-sigil-wheel')}
          <div>
            <h2 class="cg-panel__title">排行榜</h2>
            <div class="cg-panel__meta">${escapeHtml(profile.username)}（${escapeHtml(profile.uuid.slice(0, 8))}）· 本地战绩，存于浏览器</div>
          </div>
        </div>
        <div class="cg-panel__body">
          <div class="summary">
            <span>对局 <b>${sum.matches}</b></span>
            <span>胜 <b>${sum.wins}</b></span>
            <span>负 <b>${sum.losses}</b></span>
            <span>平/断 <b>${sum.draws}</b></span>
          </div>
          <div class="cg-progress lb-rate">
            <div class="cg-progress__track"><div class="cg-progress__bar${rate < 50 ? ' cg-progress__bar--warn' : ''}" style="width:${rate}%"></div></div>
            <div class="cg-progress__meta"><span>胜率</span><span>${rate}%（${sum.wins}/${sum.matches}）</span></div>
          </div>
          ${
            records.length === 0
              ? '<p class="hint">还没有对局记录——先去 <a href="#/new">开始新游戏</a>。</p>'
              : `<table class="lb">
                  <thead><tr><th>#</th><th>时间</th><th>结果</th><th>tick</th><th>阵亡(我:敌)</th><th>阵容</th></tr></thead>
                  <tbody>${rows}</tbody>
                </table>`
          }
          ${records.length > 0 ? '<button type="button" class="cg-btn cg-btn--danger cg-btn--block" id="btn-clear-lb">清空战绩</button>' : ''}
        </div>
      </section>
    </main>
    </div>`

  document.getElementById('btn-clear-lb')?.addEventListener('click', () => {
    store.clear()
    renderLeaderboard(host)
  })
}
