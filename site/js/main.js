import { loadAll, loadDeferred } from './data.js';
import { initTooltip } from './tooltip.js';
import { renderCards } from './views/cards.js';
import { renderCardDetail } from './views/card.js';
import { renderGlossary } from './views/glossary.js';
import { renderStats } from './views/stats.js';
import { renderScore } from './views/score.js';
import { renderBlueprint } from './views/blueprint.js';
import { renderDdd } from './views/ddd.js';
import { renderHome } from './views/home.js';
import { renderHow } from './views/how.js';
import { renderPathways, renderPathwayDetail } from './views/pathways.js';
import { renderMechanics } from './views/mechanics.js';
import { renderSearch } from './views/search.js';

// 非列表页（卡片列表之外的都算，用于滚动位置还原）。新增页务必登记，
// 否则从详情返回时会被当成列表页而错误还原滚动位置
const NON_LIST_PAGES = new Set([
  'home', 'how', 'pathways', 'mechanics', 'search',
  'card', 'glossary', 'stats', 'score', 'blueprint', 'ddd',
]);

const view = document.getElementById('view');
const status = document.getElementById('load-status');

// 由 route() 统一接管滚动，避免浏览器的自动恢复在之后异步覆盖
history.scrollRestoration = 'manual';

// 注册 SW：满足「可安装」判定，并把 docs/ 下的数据缓存起来，见 site/sw.js。
// localhost 不注册：本地改完 docs/json 刷新却还是上一版（SWR 先给缓存），
// 调试时会以为改动没生效——数据缓存只在线上要
const LOCAL = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
if ('serviceWorker' in navigator && !LOCAL) navigator.serviceWorker.register('./sw.js');

function setNav(name) {
  document.querySelectorAll('[data-nav]').forEach((a) => {
    a.classList.toggle('active', a.dataset.nav === name);
  });
}

let prevPage = '';
let listScrollY = 0;

function route() {
  // hash 形如 #/page/arg?cat=x&q=y：查询串只给「深链」用（领域模型页的术语 token →
  // 术语词典对应栏目），先把 ? 之后摘掉再拆路径，否则 page 会被查询串污染
  const [path, qs] = (location.hash || '#/').replace(/^#/, '').split('?');
  const [, page, arg] = path.split('/');
  const isList = !NON_LIST_PAGES.has(page);
  // 详情页是整页一张卡的画布：藏顶栏（含加载状态），离开即恢复
  document.body.classList.toggle('page-card', page === 'card' && !!arg);

  // 离开列表页时记下滚动位置，从详情返回时还原
  if (prevPage === 'cards' && !isList) listScrollY = window.scrollY;
  const restoreScroll = isList && prevPage === 'card';

  if (page === 'statuses') {
    // 状态统计已拆成统计分析页的「状态」子页（#/stats/status），旧链接/书签跳过去
    location.replace('#/stats/status');
    return;
  }
  if (page === 'home' || page === '') { setNav('home'); renderHome(view); }
  else if (page === 'how') { setNav('how'); renderHow(view); }
  else if (page === 'pathways') {
    setNav('pathways');
    if (arg) renderPathwayDetail(view, decodeURIComponent(arg));
    else renderPathways(view);
  }
  else if (page === 'mechanics') { setNav('mechanics'); renderMechanics(view); }
  else if (page === 'search') { setNav(''); renderSearch(view, new URLSearchParams(qs || '')); }
  else if (page === 'card' && arg) { setNav('cards'); renderCardDetail(view, decodeURIComponent(arg), qs || ''); }
  else if (page === 'glossary') { setNav('glossary'); renderGlossary(view, new URLSearchParams(qs || '')); }
  else if (page === 'stats') { setNav('stats'); renderStats(view, arg ? decodeURIComponent(arg) : 'skills'); }
  else if (page === 'score') { setNav('score'); renderScore(view, arg ? decodeURIComponent(arg) : ''); }
  else if (page === 'blueprint') { setNav('blueprint'); renderBlueprint(view, arg ? decodeURIComponent(arg) : '', qs || ''); }
  else if (page === 'ddd') { setNav('ddd'); renderDdd(view, arg ? decodeURIComponent(arg) : ''); }
  else { setNav('cards'); renderCards(view, new URLSearchParams(qs || '')); }

  prevPage = isList ? 'cards' : page;
  // 顶栏搜索框：只在搜索页保留关键词，离开即清空，避免看起来像「当前筛选」
  const gq = document.getElementById('gq');
  if (gq && page !== 'search') gq.value = '';
  document.getElementById('nav-design')?.removeAttribute('open');
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

// 顶栏全站搜索：提交跳 #/search?q=；按 / 聚焦（输入框内不劫持）
function initGlobalSearch() {
  const form = document.getElementById('global-search');
  const input = document.getElementById('gq');
  if (!form || !input) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const q = input.value.trim();
    location.hash = q ? `#/search?q=${encodeURIComponent(q)}` : '#/search';
  });
  document.addEventListener('click', (e) => {
    const d = document.getElementById('nav-design');
    if (d?.open && !d.contains(e.target)) d.open = false;
  });
  window.addEventListener('keydown', (e) => {
    if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return;
    const t = e.target;
    if (t instanceof HTMLElement && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
    e.preventDefault();
    input.focus();
  });
}

async function main() {
  initTooltip();
  initToTop();
  initGlobalSearch();
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
  // 首屏画完再补状态定义：卡片列表/卡面 AST/词典都不依赖它，只有统计分析页末的
  // 状态定义面与状态悬停详情要。依赖它的视图自己订阅（见 views/stats.js）
  loadDeferred();
}

main();
