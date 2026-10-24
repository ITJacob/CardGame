// 领域模型页：按「概述 → 详解」阅读。
//
// 每篇文档按 `##` 小节拆开：小节标题下先给 `> **概述**`（一句话说清这一节解决什么），
// 正文（表格/规则/流程）收进「详解」折叠。首屏只铺概述，想深读再展开，避免整页
// 被表格淹没。概述与详解都由 docs/ddd/*.md 现读，站点不维护第二份内容。
//
// 搜索匹配与小节计数都以「小节」为单位；文档清单仍读 README 的文档导航。
import { renderMarkdown, parseToc } from '../md.js';
import { escapeHtml } from '../term.js';

const BASE = '../docs/ddd/';    // 相对 site/index.html
const README = 'README.md';
const OVERVIEW = '总览';         // README 在导航里的名字

let CACHE = null;
// 搜索词与文档筛选跨路由保留：去词典查完词条跳回来，还在原来的筛选上
let query = '';
let docFilter = '';

const dirOf = (p) => (p.includes('/') ? p.slice(0, p.lastIndexOf('/')) : '');
const nameOf = (p) => p.replace(/^.*\//, '').replace(/\.md$/, '');
const shortLabel = (s) => s.replace(/（[^）]*）\s*$/, '').trim();
const lower = (s) => String(s || '').toLowerCase();

async function fetchText(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return r.text();
}

/** 按 `##` 拆小节；每个 `##` 后的 `> **概述**：…` 即为该节概述，其余为详解正文。 */
function parseSections(md) {
  const lines = String(md).replace(/\r\n?/g, '\n').split('\n');
  const intro = [];
  const sections = [];
  let cur = null;
  for (const line of lines) {
    const h = /^##\s+(.+)$/.exec(line);
    if (h) {
      if (cur) sections.push(cur);
      cur = { heading: h[1].trim(), ov: '', body: [] };
      continue;
    }
    if (!cur) { intro.push(line); continue; }
    const ov = /^>\s*\*\*概述\*\*[：:]\s*(.*)$/.exec(line);
    if (ov && !cur.ov) { cur.ov = ov[1].trim(); continue; }
    cur.body.push(line);
  }
  if (cur) sections.push(cur);
  return {
    intro: intro.join('\n').trim(),
    sections: sections.map((s) => ({
      heading: s.heading,
      ov: s.ov,
      body: s.body.join('\n').trim(),
    })),
  };
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
        d.md = '';
        d.error = err.message;
      }
    }));

  for (const d of docs.values()) {
    if (d.error) { d.intro = ''; d.sections = []; continue; }
    const parsed = parseSections(d.md);
    d.intro = parsed.intro;
    d.sections = parsed.sections;
  }
  const total = [...docs.values()].reduce((n, d) => n + d.sections.length, 0);
  CACHE = { docs, order: [...docs.keys()], total };
  return CACHE;
}

function renderOpts(d) {
  return { dir: d.dir, docNames: new Set(CACHE.docs.keys()), base: BASE };
}

function sectionHtml(d, s, i) {
  const ovHtml = s.ov
    ? `<div class="md ddd-ov">${renderMarkdown(s.ov, renderOpts(d))}</div>` : '';
  const detail = s.body
    ? `<details class="ddd-detail" data-doc="${escapeHtml(d.label)}" data-sec="${i}">
        <summary>详解</summary><div class="md"></div></details>` : '';
  const text = lower(`${s.heading} ${s.ov} ${s.body}`);
  return `<section class="ddd-sec" data-text="${escapeHtml(text)}">
    <h3 class="ddd-sec-h">${escapeHtml(s.heading)}</h3>
    ${ovHtml}${detail}
  </section>`;
}

function docHtml(name, d) {
  if (d.error) {
    return `<section class="panel qr-doc" data-doc="${escapeHtml(name)}">
      <h2 class="qr-doc-title">${escapeHtml(d.label)}</h2>
      <p class="warn-text">加载失败：${escapeHtml(d.error)}（${escapeHtml(d.path)}）</p></section>`;
  }
  if (!d.sections.length) return '';
  const intro = d.intro
    ? `<div class="md qr-intro" data-text="${escapeHtml(lower(d.intro))}">${renderMarkdown(d.intro, renderOpts(d))}</div>` : '';
  return `<section class="panel qr-doc" data-doc="${escapeHtml(name)}">
    <h2 class="qr-doc-title">${escapeHtml(d.label)}<span class="qr-count muted">${d.sections.length} 节</span></h2>
    ${intro}
    <div class="ddd-secs">${d.sections.map((s, i) => sectionHtml(d, s, i)).join('')}</div>
  </section>`;
}

// 搜索 / 筛选后重算计数与空组显隐：小节全在 DOM 里，直接切 hidden。
function applyFilter(view) {
  const q = query.trim().toLowerCase();
  let hit = 0;                     // 全库搜索命中
  let shown = 0;                   // 正文里还剩几篇
  const hits = new Map();          // 篇名 → 该篇命中小节数，侧栏计数用
  const alive = new Set();         // 篇名 → 这篇还留得下东西（含只有导语命中的）
  view.querySelectorAll('.qr-doc').forEach((sec) => {
    const scope = !docFilter || sec.dataset.doc === docFilter;
    let n = 0;
    let h = 0;
    const intro = sec.querySelector('.qr-intro');
    const introHit = !q || (!!intro && intro.dataset.text.includes(q));
    if (intro) intro.hidden = q ? !introHit : false;
    sec.querySelectorAll('.ddd-sec').forEach((el) => {
      const qHit = !q || el.dataset.text.includes(q);
      if (qHit) h++;
      const ok = scope && qHit;
      el.hidden = !ok;
      if (ok) n++;
    });
    if (h || (intro && introHit)) alive.add(sec.dataset.doc);
    sec.hidden = !(n > 0 || (intro && introHit));
    if (!sec.hidden) shown++;
    hit += h;
    hits.set(sec.dataset.doc, h);
    sec.querySelector('.qr-count').textContent = `${n} 节`;
  });
  const total = CACHE.total;
  view.querySelector('#dq-count').textContent = q
    ? `命中 ${hit} 节 · ${shown} 篇`
    : docFilter
      ? `已选「${docFilter}」· ${hits.get(docFilter) ?? 0} 节 / 共 ${total} 节`
      : `共 ${total} 节 · ${CACHE.order.length} 篇`;

  const bodyEl = view.querySelector('#ddd-body');
  let band = null;
  let seen = 0;
  const flushBand = () => { if (band) band.hidden = !seen; };
  for (const el of bodyEl.children) {
    if (el.classList.contains('qr-band')) { flushBand(); band = el; seen = 0; }
    else if (el.classList.contains('qr-doc') && !el.hidden) seen++;
  }
  flushBand();

  let group = null;
  let groupN = 0;
  const flushGroup = () => { if (group) group.hidden = !groupN; };
  view.querySelectorAll('.gloss-nav .nav-group, .gloss-nav a[data-doc]').forEach((el) => {
    if (el.classList.contains('nav-group')) { flushGroup(); group = el; groupN = 0; return; }
    const name = el.dataset.doc;
    const n = name ? (hits.get(name) ?? 0) : hit;
    el.querySelector('.qr-count').textContent = n;
    el.classList.toggle('active', name === docFilter);
    if (name && alive.has(name)) groupN++;
  });
  flushGroup();
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
  if (!view.querySelector('.ddd-loading')) return;

  docFilter = jumpTo;
  const nav = [`<a href="#/ddd" data-doc=""${docFilter ? '' : ' class="active"'}>全部
    <span class="qr-count muted">${data.total}</span></a>`];
  const body = [];
  let curGroup = null;
  for (const name of data.order) {
    const d = data.docs.get(name);
    if (d.group !== curGroup) {
      if (d.group) {
        const g = escapeHtml(d.group);
        nav.push(`<div class="nav-group">${g}</div>`);
        body.push(`<div class="qr-band">${g}</div>`);
      }
      curGroup = d.group;
    }
    if (!d.sections.length) continue;
    nav.push(`<a href="#/ddd/${encodeURIComponent(name)}" data-doc="${escapeHtml(name)}">${escapeHtml(d.label)}
      <span class="qr-count muted">${d.sections.length}</span></a>`);
    body.push(docHtml(name, d));
  }

  view.innerHTML = `<h1 class="page-title">领域模型</h1>
    <div class="panel filters">
      <label>搜索<input type="search" id="dq" value="${escapeHtml(query)}"
        placeholder="小节 / 概述 / 字段 / 取值"></label>
      <span class="muted" id="dq-count"></span>
      <button type="button" id="ddd-toggle-all" class="qr-toggle">展开全部详解</button>
      <span class="muted">每节先给概述；点「详解」看规则、表格与流程。英文 token 悬停看释义、点击跳词典。</span>
    </div>
    <div class="gloss-layout">
      <div class="gloss-nav panel">${nav.join('')}</div>
      <div id="ddd-body">${body.join('')}</div>
    </div>`;

  const bodyEl = view.querySelector('#ddd-body');

  // 「详解」懒渲染：18 篇全文一次铺出来正是这页早先笨重的原因，首次展开时再渲染。
  bodyEl.querySelectorAll('details.ddd-detail').forEach((el) => {
    el.addEventListener('toggle', () => {
      if (!el.open) return;
      const box = el.querySelector('.md');
      if (box.dataset.rendered) return;
      const d = data.docs.get(el.closest('.qr-doc').dataset.doc);
      const s = d?.sections[Number(el.dataset.sec)];
      if (!d || !s) return;
      box.innerHTML = renderMarkdown(s.body, renderOpts(d));
      box.dataset.rendered = '1';
    });
  });

  const allBtn = view.querySelector('#ddd-toggle-all');
  allBtn.addEventListener('click', () => {
    const items = [...bodyEl.querySelectorAll('details.ddd-detail')];
    const anyClosed = items.some((x) => !x.open);
    items.forEach((x) => { x.open = anyClosed; });
    allBtn.textContent = anyClosed ? '收起全部详解' : '展开全部详解';
  });

  view.querySelector('#dq').addEventListener('input', (e) => {
    query = e.target.value;
    applyFilter(view);
  });

  applyFilter(view);
  if (docFilter && data.docs.has(docFilter)) {
    bodyEl.querySelector('.qr-doc:not([hidden])')?.scrollIntoView({ block: 'start' });
  }
}
