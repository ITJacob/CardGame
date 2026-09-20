// 领域模型页：运行时读 docs/ddd/*.md 现渲染。
//
// 内容是**现读**的，不在这里另存一份：docs/ddd/ 是领域设计正源，站内抄一遍必然漂移。
// 文档清单同样现读 README 的「文档导航」小节——新增一篇文档只需在 README 里加一行。
// 英文枚举 token 交由 md.js 关联术语词典（悬停看释义、点击跳词典）。
import { renderMarkdown, parseToc } from '../md.js';
import { escapeHtml } from '../term.js';

const BASE = '../docs/ddd/';    // 相对 site/index.html
const README = 'README.md';
const OVERVIEW = '总览';         // README 在导航里的名字

let CACHE = null;

async function fetchText(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return r.text();
}

const dirOf = (p) => (p.includes('/') ? p.slice(0, p.lastIndexOf('/')) : '');
const nameOf = (p) => p.replace(/^.*\//, '').replace(/\.md$/, '');

async function load() {
  if (CACHE) return CACHE;
  const readme = await fetchText(BASE + README);
  const groups = parseToc(readme);
  const docs = new Map([[OVERVIEW, { path: README, dir: '', md: readme }]]);
  const entries = groups.flatMap((g) => g.items);
  await Promise.all(entries.map(async (it) => {
    const name = nameOf(it.path);
    if (docs.has(name)) return;
    try {
      docs.set(name, { path: it.path, dir: dirOf(it.path), md: await fetchText(BASE + it.path) });
    } catch (err) {
      // 单篇拉失败不拖垮整页：该章节位置显示错误，其余照常
      docs.set(name, { path: it.path, dir: dirOf(it.path), md: '', error: err.message });
    }
  }));
  CACHE = { groups, docs, names: new Set(docs.keys()) };
  return CACHE;
}

function section(name, doc, docNames) {
  const body = doc.error
    ? `<p class="warn-text">加载失败：${escapeHtml(doc.error)}（${escapeHtml(doc.path)}）</p>`
    : renderMarkdown(doc.md, { dir: doc.dir, docNames, base: BASE });
  return `<section class="panel md" data-doc="${escapeHtml(name)}">
    ${body}
  </section>`;
}

export async function renderDdd(view, jumpTo = '') {
  view.innerHTML = `<h1 class="page-title">领域模型</h1>
    <p class="panel-note muted ddd-loading">加载 docs/ddd/…</p>`;

  let data;
  try {
    data = await load();
  } catch (err) {
    view.innerHTML = `<h1 class="page-title">领域模型</h1>
      <div class="panel"><h2>文档加载失败</h2>
      <p class="warn-text">${escapeHtml(err.message)}</p>
      <p class="muted">领域模型内容现读自 <code>docs/ddd/*.md</code>，需在<b>仓库根目录</b>起服务
      （<code>python -m http.server</code>）后访问，不能用 file:// 直接打开。</p></div>`;
    return;
  }
  // 期间若已切到别的页（本页的加载占位已被替换），就不要再往 view 里写
  if (!view.querySelector('.ddd-loading')) return;

  const nav = [`<a href="#/ddd/${encodeURIComponent(OVERVIEW)}" data-doc="${escapeHtml(OVERVIEW)}">${OVERVIEW}</a>`];
  for (const g of data.groups) {
    nav.push(`<div class="nav-group">${escapeHtml(g.title)}</div>`);
    for (const it of g.items) {
      const name = nameOf(it.path);
      nav.push(`<a href="#/ddd/${encodeURIComponent(name)}" data-doc="${escapeHtml(name)}">${escapeHtml(it.label)}</a>`);
    }
  }
  const sections = [section(OVERVIEW, data.docs.get(OVERVIEW), data.names)];
  for (const g of data.groups) {
    for (const it of g.items) {
      const name = nameOf(it.path);
      sections.push(section(name, data.docs.get(name), data.names));
    }
  }

  view.innerHTML = `<h1 class="page-title">领域模型</h1>
    <p class="panel-note muted">内容现读自 <code>docs/ddd/*.md</code>（领域设计正源），本页只做渲染与词典关联。
    英文 token（如 <code>on_tick</code>、<code>empty_ally_slot</code>）已挂术语词典：悬停看中文释义，点击跳词典对应词条。</p>
    <div class="gloss-layout">
      <div class="gloss-nav panel">${nav.join('')}</div>
      <div id="ddd-body">${sections.join('')}</div>
    </div>`;

  if (jumpTo) {
    view.querySelector(`.gloss-nav a[data-doc="${CSS.escape(jumpTo)}"]`)?.classList.add('active');
    view.querySelector(`section[data-doc="${CSS.escape(jumpTo)}"]`)?.scrollIntoView({ block: 'start' });
  }
}
