// 全站搜索：途径 / 卡牌 / 术语词条。纯前端 substring 匹配，结果按「名称命中优先」排序。
import { DB, loadBlueprints } from '../data.js';
import { escapeHtml } from '../term.js';

function truncate(s, n) {
  const t = String(s || '').trim();
  return t.length > n ? `${t.slice(0, n)}…` : t;
}

function includes(hay, q) {
  return String(hay || '').toLowerCase().includes(q);
}

function cleanText(s) {
  return String(s || '').replace(/[*>#`]/g, ' ').replace(/\s+/g, ' ').trim();
}

function scoreOf(name, fields, q) {
  const n = String(name || '').toLowerCase();
  if (n === q) return 0;
  if (n.startsWith(q)) return 1;
  if (n.includes(q)) return 2;
  if (fields.some((f) => includes(f, q))) return 3;
  return -1;
}

function searchPathways(q, bpById) {
  return DB.pathways
    .map((p) => {
      const b = bpById.get(p.id);
      const prop = b?.proposition || {};
      const axisNames = Object.values(b?.axes || {}).map((a) => a.name);
      const text = [prop.statement, prop.variable, prop.cost].filter(Boolean).join(' ');
      return { p, b, s: scoreOf(p.name, [p.id, ...axisNames, text], q) };
    })
    .filter((x) => x.s >= 0)
    .sort((a, b) => a.s - b.s)
    .map((x) => ({ p: x.p, statement: x.b?.proposition?.statement || cleanText(DB.designNotes.get(x.p.id)) }));
}

function searchCards(q) {
  const axes = (pid) => DB.axesByPathway.get(pid) || {};
  return DB.cards
    .map((c) => {
      const ax = axes(c._pathway)[c.axis]?.name || '';
      return { c, s: scoreOf(c.name, [c.describe, c.flavor, c.lore, c.sequenceName, ax, ...(c.tags || [])], q) };
    })
    .filter((x) => x.s >= 0)
    .sort((a, b) => a.s - b.s || a.c.name.localeCompare(b.c.name, 'zh'))
    .slice(0, 40)
    .map((x) => x.c);
}

function searchTerms(q) {
  const cats = DB.glossary?.categories || {};
  const out = [];
  for (const [catKey, cat] of Object.entries(cats)) {
    for (const [key, t] of Object.entries(cat.terms || {})) {
      const s = scoreOf(t.zh || key, [key, t.brief, t.detail], q);
      if (s < 0) continue;
      out.push({ key, t, catKey, catLabel: cat.label || catKey, s });
    }
  }
  return out.sort((a, b) => a.s - b.s || a.key.localeCompare(b.key)).slice(0, 30);
}

export async function renderSearch(view, params) {
  const q = (params?.get('q') || '').trim();
  const gq = document.getElementById('gq');
  if (gq) gq.value = q;

  if (!q) {
    view.innerHTML = `<h1 class="page-title">搜索</h1>
      <p class="page-lead">输入卡名、效果关键词、术语或途径名。也可以按 <span class="mono">/</span> 直接聚焦搜索框。</p>
      <div class="panel">
        <p>试试：<a href="#/search?q=驱散">驱散</a> · <a href="#/search?q=行动条">行动条</a> · <a href="#/search?q=不眠者">不眠者</a> · <a href="#/search?q=读层">读层</a></p>
      </div>`;
    return;
  }

  const lower = q.toLowerCase();
  let bpById = new Map();
  try {
    const bp = await loadBlueprints();
    // 加载期间可能已切到别的页
    if (!location.hash.startsWith('#/search')) return;
    bpById = new Map((bp.pathways || []).map((p) => [p.id, p]));
  } catch {
    // 蓝图缺失：途径只按名称/designNote 匹配
  }
  const pathways = searchPathways(lower, bpById);
  const cards = searchCards(lower);
  const terms = searchTerms(lower);
  const total = pathways.length + cards.length + terms.length;

  const pathwayHtml = pathways.map(({ p, statement }) => `
    <a class="search-row" href="#/pathways/${encodeURIComponent(p.id)}">
      <b>${escapeHtml(p.name)}<span class="search-meta">${p.cardCount} 卡</span></b>
      <span>${escapeHtml(truncate(statement, 120))}</span>
    </a>`).join('');

  const cardHtml = cards.map((c) => `
    <a class="search-row" href="#/card/${encodeURIComponent(c.id)}">
      <b>${escapeHtml(c.name)}<span class="search-meta">${escapeHtml(c._pathwayName)} · ${escapeHtml(c.sequenceName || '')}</span></b>
      <span>${escapeHtml(truncate(c.describe, 110))}</span>
    </a>`).join('');

  const termHtml = terms.map(({ key, t, catKey, catLabel }) => `
    <a class="search-row" href="#/glossary?cat=${encodeURIComponent(catKey)}&q=${encodeURIComponent(key)}">
      <b><span class="mono">${escapeHtml(key)}</span> ${escapeHtml(t.zh || '')}<span class="search-meta">${escapeHtml(catLabel)}</span></b>
      <span>${escapeHtml(truncate(t.brief, 110))}</span>
    </a>`).join('');

  const section = (title, html, n) => (n
    ? `<section class="search-sec"><h2>${title} <span class="muted">${n}</span></h2>${html}</section>`
    : '');

  view.innerHTML = `
    <h1 class="page-title">搜索「${escapeHtml(q)}」</h1>
    <p class="page-lead">共 ${total} 条结果。</p>
    ${total ? '' : '<div class="panel"><p>没有命中。换个关键词，或从 <a href="#/cards">卡池</a> / <a href="#/glossary">术语</a> 里翻。</p></div>'}
    ${section('途径', pathwayHtml, pathways.length)}
    ${section('卡牌', cardHtml, cards.length)}
    ${section('术语', termHtml, terms.length)}`;
}
