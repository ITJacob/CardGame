// 领域模型页：字段 / 概念速查。
//
// 早先这页把 18 篇设计文档整篇渲染出来，表格、散文、裁决记录混在一起——想查一个字段
// 得先滚过几屏别的。现在改成速查：每篇只留一句导语，正文拆成一条条可检索的条目，
// 按文档分组；要读全文的从每篇末尾展开「原文」（首次展开才渲染，不拖累首屏）。
//
// 条目由 md.js 的 parseRef 抽取——「什么算一条」的规则写在那边，这里只管渲染与检索。
// 文档清单仍现读 README 的「文档导航」：加一篇文档只需在 README 里加一行。
// 英文枚举 token 仍关联术语词典（悬停看释义、点击跳词典）。
import { renderMarkdown, parseRef, parseToc } from '../md.js';
import { escapeHtml } from '../term.js';

const BASE = '../docs/ddd/';    // 相对 site/index.html
const README = 'README.md';
const OVERVIEW = '总览';         // README 在导航里的名字

// 说明折几行。超过这个长度的才折——取值列（`enemy / ally / self`）本来就短，
// 折了反而要多点一次
const CLAMP_AT = 90;

let CACHE = null;
// 搜索词与文档筛选跨路由保留：去词典查完词条跳回来，还在原来的筛选上
let query = '';
let docFilter = '';

const dirOf = (p) => (p.includes('/') ? p.slice(0, p.lastIndexOf('/')) : '');
const nameOf = (p) => p.replace(/^.*\//, '').replace(/\.md$/, '');
// README 里两篇参数的标签带了补充说明（`源质维度与跨系枢纽（九大源质系 v0.3 …）`），
// 正文和侧栏都用不上，去掉
const shortLabel = (s) => s.replace(/（[^）]*）\s*$/, '').trim();

async function fetchText(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return r.text();
}

async function load() {
  if (CACHE) return CACHE;
  const readme = await fetchText(BASE + README);
  const groups = parseToc(readme);
  const docs = new Map();
  docs.set(OVERVIEW, { label: OVERVIEW, group: '', path: README, dir: '', md: readme });
  for (const g of groups) {
    for (const it of g.items) {
      const name = nameOf(it.path);
      if (docs.has(name)) continue;
      docs.set(name, {
        label: shortLabel(it.label), group: g.title,
        path: it.path, dir: dirOf(it.path), md: null,
      });
    }
  }
  await Promise.all([...docs.values()]
    .filter((d) => d.md === null)
    .map(async (d) => {
      try {
        d.md = await fetchText(BASE + d.path);
      } catch (err) {
        // 单篇拉失败不拖垮整页：那一节位置显示错误，其余照常
        d.md = '';
        d.error = err.message;
      }
    }));

  const docNames = new Set(docs.keys());
  for (const d of docs.values()) {
    if (d.error) { d.intro = ''; d.entries = []; d.skipped = []; continue; }
    const ref = parseRef(d.md, { dir: d.dir, docNames, base: BASE });
    d.intro = ref.intro;
    d.entries = ref.entries;
    d.skipped = ref.skipped;
  }
  CACHE = { docs, order: [...docs.keys()], total: [...docs.values()].reduce((n, d) => n + d.entries.length, 0) };
  return CACHE;
}

// 抽取情况。规则（md.js 的 NAME_COLS 等）是前端硬编码的，文档那边不可能知道；
// 新写一张字段表而首列名没进清单时，它会**静默消失**——不报错、页面上也没有痕迹，
// 只有翻「原文」才发现。把跳过的表列出来，静默就变成可见：跳的是数值表还是漏掉的
// 字段表，人扫一眼就分得出来
function coverageHtml(data) {
  const rows = [];
  let n = 0;
  for (const name of data.order) {
    const d = data.docs.get(name);
    if (!d.skipped?.length) continue;
    n += d.skipped.length;
    rows.push(`<li><b>${escapeHtml(d.label)}</b>${d.skipped.map((s) => `
      <div class="qr-skip"><span class="muted">${escapeHtml(s.sec || '（篇首）')} · 第 ${s.line} 行</span>
      <code>${escapeHtml(s.head)}</code></div>`).join('')}</li>`);
  }
  if (!n) return '';
  return `<details class="panel qr-coverage">
    <summary>抽取情况：共收 ${data.total} 条；另有 ${n} 张表按数据表跳过</summary>
    <p class="muted">速查条目现读自 <code>docs/ddd/*.md</code>，判据（首列算不算字段名）写在
    <code>site/js/md.js</code> 的 <code>NAME_COLS</code>。下面这些表的首列不是字段名，按数值 / 清单表
    跳过了，它们仍在各篇的「原文」里。<b>新写了一张字段表却出现在这里，就是它的首列名还没进 NAME_COLS。</b></p>
    <ul>${rows.join('')}</ul></details>`;
}

function itemHtml(e) {
  const name = e.isCode ? `<code class="qr-name">${e.nameHtml}</code>` : `<b class="qr-name">${e.nameHtml}</b>`;
  const head = [
    name,
    e.zhHtml ? `<span class="qr-zh">${e.zhHtml}</span>` : '',
    e.tag ? `<span class="qr-tag">${escapeHtml(e.tag)}</span>` : '',
  ].join('');
  const fields = e.fields.map((f) => `<dt>${escapeHtml(f.label)}</dt>
      <dd${f.text.length > CLAMP_AT ? ' class="qr-clamp" title="点击展开"' : ''}>${f.html}</dd>`).join('');
  const desc = e.descHtml
    ? `<dt>说明</dt><dd${e.descText.length > CLAMP_AT ? ' class="qr-clamp" title="点击展开"' : ''}>${e.descHtml}</dd>`
    : '';
  const body = fields || desc ? `<dl class="qr-fields">${fields}${desc}</dl>` : '';
  return `<div class="qr-item" data-text="${escapeHtml(e.search)}">
    <div class="qr-item-head">${head}</div>${body}</div>`;
}

function docHtml(name, d) {
  if (d.error) {
    return `<section class="panel qr-doc" data-doc="${escapeHtml(name)}">
      <h2 class="qr-doc-title">${escapeHtml(d.label)}</h2>
      <p class="warn-text">加载失败：${escapeHtml(d.error)}（${escapeHtml(d.path)}）</p></section>`;
  }
  if (!d.entries.length) return '';    // 抽不出条目又不影响别的篇：不占版面
  const list = d.entries.map(itemHtml).join('');
  return `<section class="panel qr-doc" data-doc="${escapeHtml(name)}">
    <h2 class="qr-doc-title">${escapeHtml(d.label)}<span class="qr-count muted">${d.entries.length} 条</span></h2>
    ${d.intro ? `<p class="qr-intro">${d.intro}</p>` : ''}
    <div class="qr-list">${list}</div>
    <details class="qr-raw"><summary>原文</summary><div class="md"></div></details>
  </section>`;
}

// 搜索 / 筛选后重算计数与空组显隐。词条全在 DOM 里，直接切 hidden 比重新渲染快得多，
// 也免去把条目重新拼回字符串
function applyFilter(view) {
  const q = query.trim().toLowerCase();
  let hit = 0;
  let shown = 0;
  view.querySelectorAll('.qr-doc').forEach((sec) => {
    // 侧栏选定某篇时不参与搜索的文档整篇收起，命中数不受影响
    const scope = !docFilter || sec.dataset.doc === docFilter;
    let n = 0;
    sec.querySelectorAll('.qr-item').forEach((it) => {
      const ok = scope && (!q || it.dataset.text.includes(q));
      it.hidden = !ok;
      if (ok) n++;
    });
    sec.hidden = !n;
    if (n) { hit += n; shown++; }
    sec.querySelector('.qr-count').textContent = `${n} 条`;
  });
  const total = CACHE.total;
  view.querySelector('#dq-count').textContent = q || docFilter
    ? `命中 ${hit} 条 · ${shown} 篇`
    : `共 ${total} 条 · ${CACHE.order.length} 篇`;

  // 分组名下面一篇都没剩时一并收起：搜 `anchor` 却还挂着「领域上下文」这个空标题，
  // 会让人以为那一组的内容没加载出来。正文与侧栏的分组名一一对应（同一个循环里生成），
  // 所以按序号回填即可
  const bodyEl = view.querySelector('#ddd-body');
  const bands = [];
  let band = null;
  let seen = 0;
  for (const el of bodyEl.children) {
    if (el.classList.contains('qr-band')) {
      if (band) bands.push([band, seen]);
      band = el;
      seen = 0;
    } else if (el.classList.contains('qr-doc') && !el.hidden) seen++;
  }
  if (band) bands.push([band, seen]);
  const navGroups = [...view.querySelectorAll('.gloss-nav .nav-group')];
  bands.forEach(([el, n], idx) => {
    el.hidden = !n;
    if (navGroups[idx]) navGroups[idx].hidden = !n;
  });

  view.querySelectorAll('.gloss-nav a[data-doc]').forEach((a) => {
    const name = a.dataset.doc;
    const sec = name ? view.querySelector(`.qr-doc[data-doc="${CSS.escape(name)}"]`) : null;
    const n = name
      ? (sec ? sec.querySelectorAll('.qr-item:not([hidden])').length : 0)
      : hit;
    a.querySelector('.qr-count').textContent = n;
    a.classList.toggle('active', name === docFilter);
  });
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

  docFilter = jumpTo;
  const nav = [`<a href="#/ddd" data-doc=""${docFilter ? '' : ' class="active"'}>全部
    <span class="qr-count muted">${data.total}</span></a>`];
  const body = [];
  let curGroup = null;
  for (const name of data.order) {
    const d = data.docs.get(name);
    if (d.group !== curGroup) {
      // 分组名左右两栏各出现一次：侧栏里是导航分组，正文里是阅读时的路标
      if (d.group) {
        const g = escapeHtml(d.group);
        nav.push(`<div class="nav-group">${g}</div>`);
        body.push(`<div class="qr-band">${g}</div>`);
      }
      curGroup = d.group;
    }
    if (!d.entries.length) continue;
    nav.push(`<a href="#/ddd/${encodeURIComponent(name)}" data-doc="${escapeHtml(name)}">${escapeHtml(d.label)}
      <span class="qr-count muted">${d.entries.length}</span></a>`);
    body.push(docHtml(name, d));
  }

  view.innerHTML = `<h1 class="page-title">领域模型</h1>
    <div class="panel filters">
      <label>搜索<input type="search" id="dq" value="${escapeHtml(query)}"
        placeholder="字段 / 概念 / 中文名 / 取值 / 说明"></label>
      <span class="muted" id="dq-count"></span>
      <span class="muted">条目现读自 <code>docs/ddd/*.md</code>（领域设计正源）。说明默认折两行，
      点开看全；每篇末尾可展开原文。英文 token 悬停看释义、点击跳词典。</span>
    </div>
    <div class="gloss-layout">
      <div class="gloss-nav panel">${nav.join('')}</div>
      <div id="ddd-body">${body.join('')}${coverageHtml(data)}</div>
    </div>`;

  const bodyEl = view.querySelector('#ddd-body');

  // 点折起来的说明展开。术语 token 是链接，让跳词典优先
  bodyEl.addEventListener('click', (e) => {
    if (e.target.closest('a')) return;
    e.target.closest('.qr-clamp')?.classList.toggle('open');
  });

  // 「原文」懒渲染：18 篇全文一次铺出来正是这页早先笨重的原因，首次展开时再渲染
  bodyEl.querySelectorAll('details.qr-raw').forEach((el) => {
    el.addEventListener('toggle', () => {
      const box = el.querySelector('.md');
      if (!el.open || box.dataset.rendered) return;
      const d = data.docs.get(el.closest('.qr-doc').dataset.doc);
      box.innerHTML = renderMarkdown(d.md, { dir: d.dir, docNames: new Set(data.docs.keys()), base: BASE });
      box.dataset.rendered = '1';
    });
  });

  view.querySelector('#dq').addEventListener('input', (e) => {
    query = e.target.value;
    applyFilter(view);
  });

  // 按字数挂的折叠标记在宽屏上可能两行就放下了，此时它只有 `光标变成放大镜` 这个
  // 副作用、点了没反应。渲染完量一次真实高度，没被截断的摘掉标记——量的是布局，
  // 所以必须赶在 applyFilter 把一部分条目藏起来之前（隐藏的东西高度是 0）
  bodyEl.querySelectorAll('.qr-clamp').forEach((dd) => {
    if (dd.scrollHeight <= dd.clientHeight + 4) dd.classList.remove('qr-clamp');
  });

  applyFilter(view);
  if (docFilter && data.docs.has(docFilter)) {
    // 深链（含文档内的 `[x](./y.md)` 互链）落到该篇：整页只剩它，比滚过去更好找
    bodyEl.querySelector('.qr-doc:not([hidden])')?.scrollIntoView({ block: 'start' });
  }
}
