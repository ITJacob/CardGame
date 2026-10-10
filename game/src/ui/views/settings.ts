import { subBarHtml, escapeHtml } from '../components/chrome'
import { dataVersion, shortHash } from '../../data/version'

function row(k: string, v: string): string {
  return `<div class="kv"><span class="k">${escapeHtml(k)}</span><span class="v">${escapeHtml(v)}</span></div>`
}

export function renderSettings(host: HTMLElement): void {
  const v = dataVersion
  const counts = Object.entries(v.counts).map(([k, n]) => `${k} ${n}`).join(' · ') || '—'

  host.innerHTML = `
    ${subBarHtml('设置')}
    <main class="settings">
      <section class="panel">
        <h2>账号</h2>
        <p class="hint">UUID 与用户名修改（P6 落地）。</p>
      </section>
      <section class="panel">
        <h2>数据版本</h2>
        ${v.stale
          ? '<p class="warn">⚠ 当前数据已偏离验收基线，尚未重新验收</p>'
          : '<p class="ok">与验收基线一致</p>'}
        ${row('数据提交 docsRef', shortHash(v.docsRef))}
        ${row('当前数据哈希', v.dataHash.slice(0, 12))}
        ${row('验收基线哈希', v.lockHash ? v.lockHash.slice(0, 12) : '—')}
        ${row('验收日期', v.verifiedAt || '—')}
        ${row('schema / source', `${v.schemaVersion} / ${v.sourceVersion}`)}
        ${row('数据计数', counts)}
        ${row('构建时间', v.buildTime)}
        ${row('游戏提交', shortHash(v.gameSha))}
      </section>
    </main>`
}
