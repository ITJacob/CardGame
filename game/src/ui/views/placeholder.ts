import { subBarHtml, escapeHtml } from '../components/chrome'

export function renderPlaceholder(host: HTMLElement, title: string, desc: string): void {
  host.innerHTML = `
    ${subBarHtml(title)}
    <main class="placeholder">
      <h1>${escapeHtml(title)}</h1>
      <p>${escapeHtml(desc)}</p>
      <p class="hint">返回 <a href="#/">主菜单</a></p>
    </main>`
}
