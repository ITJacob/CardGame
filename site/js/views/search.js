// 全站搜索：途径 / 卡牌 / 领域模型小节 / 术语词条。纯前端 substring 匹配，
// 结果按「名称命中优先」排序；ddd 文档按小节命中，复用 ddd 页的加载与拆分。
import { DB, loadBlueprints } from '../data.js';
import { loadDdd } from '../ddd-data.js';
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

// 领域模型按小节命中：标题 / 概述 / 正文都参与匹配，结果落到文档页
function searchDdd(q, data) {
  if (!data) return [];
  const out = [];
  for (const [name, d] of data.docs) {
    if (!d.sections?.length) continue;
    for (const sec of d.sections) {
      const s = scoreOf(sec.heading, [d.label, d.group, sec.ov, sec.body], q);
      if (s < 0) continue;
      out.push({ name, d, sec, s });
    }
  }
  return out
    .sort((a, b) => a.s - b.s || a.d.label.localeCompare(b.d.label, 'zh') || a.sec.heading.localeCompare(b.sec.heading, 'zh'))
    .slice(0, 20);
}

export async function renderSearch(view, params) {
  const q = (params?.get('q') || '').trim();
  const gq = document.getElementById('gq');
  if (gq) gq.value = q;

  if (!q) {
    view.innerHTML = `<h1 class="page-title">搜索</h1>
      <p class="page-lead">输入卡名、效果关键词、术语、途径名或规则文档。也可以按 <span class="mono">/</span> 直接聚焦搜索框。</p>
      <div class="panel">
        <p>试试：<a href="#/search?q=驱散">驱散</a> · <a href="#/search?q=行动条">行动条</a> · <a href="#/search?q=不眠者">不眠者</a> · <a href="#/search?q=不变量">不变量</a></p>
      </div>`;
    return;
  }

  const lower = q.toLowerCase();
  // 两份懒数据并行拉：蓝图失败只降级途径匹配，ddd 失败只少一组结果
  const [bp, ddd] = await Promise.all([
    loadBlueprints().catch(() => null),
    loadDdd().catch(() => null),
  ]);
  // 加载期间可能已切到别的页
  if (!location.hash.startsWith('#/search')) return;
  const bpById = new Map((bp?.pathways || []).map((p) => [p.id, p]));
  const pathways = searchPathways(lower, bpById);
  const cards = searchCards(lower);
  const terms = searchTerms(lower);
  const dddHits = searchDdd(lower, ddd);
  const total = pathways.length + cards.length + terms.length + dddHits.length;

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

  const dddHtml = dddHits.map(({ name, d, sec }) => `
    <a class="search-row" href="#/ddd/${encodeURIComponent(name)}">
      <b>${escapeHtml(sec.heading)}<span class="search-meta">${escapeHtml(d.label)} · ${escapeHtml(d.group || '总览')}</span></b>
      <span>${escapeHtml(truncate(sec.ov || cleanText(sec.body), 120))}</span>
    </a>`).join('');

  const section = (title, html, n) => (n
    ? `<section class="search-sec"><h2>${title} <span class="muted">${n}</span></h2>${html}</section>`
    : '');

  view.innerHTML = `
    <h1 class="page-title">搜索「${escapeHtml(q)}」</h1>
    <p class="page-lead">共 ${total} 条结果。</p>
    ${total ? '' : '<div class="panel"><p>没有命中。换个关键词，或从 <a href="#/cards">卡池</a> / <a href="#/glossary">术语</a> / <a href="#/ddd">领域模型</a> 里翻。</p></div>'}
    ${section('途径', pathwayHtml, pathways.length)}
    ${section('卡牌', cardHtml, cards.length)}
    ${section('术语', termHtml, terms.length)}
    ${section('领域模型', dddHtml, dddHits.length)}`;
}
