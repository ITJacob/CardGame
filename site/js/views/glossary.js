// 术语词典页
import { DB } from '../data.js';
import { escapeHtml } from '../term.js';

let query = '';

function catBlock(catKey, cat) {
  const q = query.trim().toLowerCase();
  const entries = Object.entries(cat.terms).filter(([k, t]) => {
    if (!q) return true;
    return k.toLowerCase().includes(q) || (t.zh || '').includes(q) || (t.brief || '').toLowerCase().includes(q);
  });
  if (!entries.length) return '';
  const rows = entries.map(([k, t]) => `<tr>
    <td class="mono">${escapeHtml(k)}</td>
    <td><b>${escapeHtml(t.zh || k)}</b></td>
    <td>${escapeHtml(t.brief || '')}${t.detail ? `<div class="muted" style="margin-top:2px">${escapeHtml(t.detail)}</div>` : ''}</td>
  </tr>`).join('');
  const patternRows = (cat.patterns || []).map((p) => `<tr>
    <td class="mono">${escapeHtml(p.match)}</td>
    <td><b>${escapeHtml(p.zh)}</b></td>
    <td>${escapeHtml(p.brief || '')} <span class="muted">（模式匹配）</span></td>
  </tr>`).join('');
  return `<div class="panel" id="g-${escapeHtml(catKey)}">
    <h2>${escapeHtml(cat.label)} <span class="muted" style="font-weight:400">（${entries.length}）${cat.source ? ` · 出处：${escapeHtml(cat.source)}` : ''}</span></h2>
    <table class="gloss"><thead><tr><th style="width:220px">key</th><th style="width:140px">中文</th><th>解释</th></tr></thead>
    <tbody>${rows}${patternRows}</tbody></table>
    ${cat.note ? `<div class="muted" style="margin-top:6px">${escapeHtml(cat.note)}</div>` : ''}
  </div>`;
}

export function renderGlossary(view) {
  const cats = DB.glossary?.categories || {};
  const catKeys = Object.keys(cats);
  view.innerHTML = `
    <h1 class="page-title">术语词典 <span class="muted" style="font-size:13px;font-weight:400">v${escapeHtml(DB.glossary.version)} · ${catKeys.length} 类 · 更新于 ${escapeHtml(DB.glossary.updated)}</span></h1>
    <div class="panel filters">
      <label>搜索<input type="search" id="gq" value="${escapeHtml(query)}" placeholder="key / 中文 / 解释"></label>
      <span class="muted">状态与途径的中文名直接来自数据文件（manifest / *.statuses.json），不在本词典重复登记。</span>
    </div>
    <div class="gloss-layout">
      <div class="gloss-nav panel">
        ${catKeys.map((k) => `<a href="javascript:void 0" data-target="g-${escapeHtml(k)}">${escapeHtml(cats[k].label)}</a>`).join('')}
      </div>
      <div id="gloss-body">${catKeys.map((k) => catBlock(k, cats[k])).join('')}</div>
    </div>`;

  view.querySelector('#gq').addEventListener('input', (e) => {
    query = e.target.value;
    view.querySelector('#gloss-body').innerHTML = catKeys.map((k) => catBlock(k, cats[k])).join('');
  });
  view.querySelectorAll('.gloss-nav a').forEach((a) => {
    a.addEventListener('click', () => {
      const el = view.querySelector(`#${CSS.escape(a.dataset.target)}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}
