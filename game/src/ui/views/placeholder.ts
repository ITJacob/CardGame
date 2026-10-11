import { subBarHtml, escapeHtml } from '../components/chrome'

export function renderPlaceholder(host: HTMLElement, title: string, desc: string): void {
  host.innerHTML = `
    ${subBarHtml(title)}
    <main class="placeholder">
      <article class="cg-card cg-card--static">
        <h1 class="cg-card__title">${escapeHtml(title)}</h1>
        <div class="cg-card__body"><p>${escapeHtml(desc)}</p></div>
        <div class="cg-card__foot"><a class="cg-btn cg-btn--sm" href="#/">返回主菜单</a></div>
      </article>
    </main>`
}
