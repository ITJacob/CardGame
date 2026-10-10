import { subBarHtml, escapeHtml } from '../components/chrome'
import { dataVersion, shortHash } from '../../data/version'
import { loadProfile, resetProfile, saveProfile } from '../profile'
import { createLocalStorageMatchStore } from '../../meta/matchLog'

const matchStore = createLocalStorageMatchStore()

function row(k: string, v: string): string {
  return `<div class="kv"><span class="k">${escapeHtml(k)}</span><span class="v">${escapeHtml(v)}</span></div>`
}

export function renderSettings(host: HTMLElement): void {
  const v = dataVersion
  const profile = loadProfile()
  const counts = Object.entries(v.counts).map(([k, n]) => `${k} ${n}`).join(' · ') || '—'

  host.innerHTML = `
    ${subBarHtml('设置')}
    <main class="settings">
      <section class="panel">
        <h2>账号</h2>
        <label class="field"><span>用户名</span><input id="inp-name" type="text" maxlength="24" value="${escapeHtml(profile.username)}" /></label>
        <div class="kv"><span class="k">UUID</span><span class="v">${escapeHtml(profile.uuid)}</span></div>
        <div class="kv"><span class="k">解锁职业</span><span class="v">${escapeHtml(profile.unlockedClasses.join('、') || '—')}</span></div>
        <div class="kv"><span class="k">已解锁卡牌</span><span class="v">${profile.unlockedCards.length === 0 ? '全部（未限定）' : String(profile.unlockedCards.length)}</span></div>
        <div class="row-actions">
          <button type="button" class="btn" id="btn-save-name">保存用户名</button>
          <button type="button" class="btn danger" id="btn-reset">重置档案</button>
        </div>
        <p class="hint" id="settings-msg"></p>
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

  const msg = host.querySelector<HTMLParagraphElement>('#settings-msg')
  const say = (text: string, ok = true): void => {
    if (!msg) return
    msg.textContent = text
    msg.className = ok ? 'ok' : 'warn'
  }

  host.querySelector<HTMLButtonElement>('#btn-save-name')?.addEventListener('click', () => {
    const input = host.querySelector<HTMLInputElement>('#inp-name')
    const name = (input?.value ?? '').trim()
    if (name.length === 0) {
      say('用户名不能为空', false)
      return
    }
    saveProfile({ ...loadProfile(), username: name })
    say('用户名已保存')
  })

  host.querySelector<HTMLButtonElement>('#btn-reset')?.addEventListener('click', () => {
    resetProfile()
    matchStore.clear()
    say('档案与战绩已重置')
    renderSettings(host)
  })
}
