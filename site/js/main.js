import { loadAll } from './data.js';
import { initTooltip } from './tooltip.js';
import { renderCards } from './views/cards.js';
import { renderCardDetail } from './views/card.js';
import { renderGlossary } from './views/glossary.js';
import { renderStats } from './views/stats.js';
import { renderStatuses } from './views/status.js';

// 非列表页（卡片列表之外的都算，用于滚动位置还原）。新增页务必登记，
// 否则从详情返回时会被当成列表页而错误还原滚动位置
const NON_LIST_PAGES = new Set(['card', 'glossary', 'stats', 'statuses']);

const view = document.getElementById('view');
const status = document.getElementById('load-status');

// 由 route() 统一接管滚动，避免浏览器的自动恢复在之后异步覆盖
history.scrollRestoration = 'manual';

// 注册 SW 以满足「可安装」判定；不启用离线能力，见 site/sw.js
if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js');

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
  const isList = !NON_LIST_PAGES.has(page);

  // 离开列表页时记下滚动位置，从详情返回时还原
  if (prevPage === 'cards' && !isList) listScrollY = window.scrollY;
  const restoreScroll = isList && prevPage === 'card';

  if (page === 'card' && arg) { setNav('cards'); renderCardDetail(view, decodeURIComponent(arg)); }
  else if (page === 'glossary') { setNav('glossary'); renderGlossary(view); }
  else if (page === 'stats') { setNav('stats'); renderStats(view); }
  else if (page === 'statuses') { setNav('statuses'); renderStatuses(view); }
  else { setNav('cards'); renderCards(view); }

  prevPage = isList ? 'cards' : page;
  window.scrollTo(0, restoreScroll ? listScrollY : 0);
}

// 回到页首：滚过一屏高度才出现。滚动事件用 rAF 合并，passive 不挡滚动；
// route() 里的 scrollTo 也会触发 scroll，所以切页后显隐自动跟上
const TOP_APPEAR_AT = 400;

function initToTop() {
  const btn = document.getElementById('to-top');
  let queued = false;
  const sync = () => {
    queued = false;
    btn.hidden = window.scrollY < TOP_APPEAR_AT;
  };
  window.addEventListener('scroll', () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(sync);
  }, { passive: true });
  btn.addEventListener('click', () => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  });
  sync();
}

async function main() {
  initTooltip();
  initToTop();
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
