import { loadAll } from './data.js';
import { initTooltip } from './tooltip.js';
import { renderCards } from './views/cards.js';
import { renderCardDetail } from './views/card.js';
import { renderGlossary } from './views/glossary.js';
import { renderStats } from './views/stats.js';

const view = document.getElementById('view');
const status = document.getElementById('load-status');

// 由 route() 统一接管滚动，避免浏览器的自动恢复在之后异步覆盖
history.scrollRestoration = 'manual';

function setNav(name) {
  document.querySelectorAll('[data-nav]').forEach((a) => {
    a.classList.toggle('active', a.dataset.nav === name);
  });
}

let prevPage = '';
let listScrollY = 0;

function route() {
  const hash = location.hash || '#/cards';
  const [, page, arg] = hash.split('/');
  const isList = page !== 'card' && page !== 'glossary' && page !== 'stats';

  // 离开列表页时记下滚动位置，从详情返回时还原
  if (prevPage === 'cards' && !isList) listScrollY = window.scrollY;
  const restoreScroll = isList && prevPage === 'card';

  if (page === 'card' && arg) { setNav('cards'); renderCardDetail(view, decodeURIComponent(arg)); }
  else if (page === 'glossary') { setNav('glossary'); renderGlossary(view); }
  else if (page === 'stats') { setNav('stats'); renderStats(view); }
  else { setNav('cards'); renderCards(view); }

  prevPage = isList ? 'cards' : page;
  window.scrollTo(0, restoreScroll ? listScrollY : 0);
}

async function main() {
  initTooltip();
  try {
    await loadAll((msg) => { status.textContent = msg; });
    status.textContent = '';
  } catch (err) {
    status.textContent = '加载失败';
    view.innerHTML = `<div class="panel"><h2>数据加载失败</h2>
      <p class="warn-text">${err.message}</p>
      <p class="muted">请在<b>仓库根目录</b>运行 <code>python -m http.server</code> 后访问
      <code>http://localhost:8000/site/</code>（不能用 file:// 直接打开）。</p></div>`;
    return;
  }
  window.addEventListener('hashchange', route);
  route();
}

main();
