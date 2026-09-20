// 术语解析：枚举 token → 中文名 + 解释（唯一入口）
import { DB } from './data.js';

export function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

const warned = new Set();

export function lookup(cat, key) {
  if (key == null || key === '') return null;
  const g = DB.glossary?.categories?.[cat];
  if (g) {
    const hit = g.terms[key];
    if (hit) return { ...hit, key, cat, catLabel: g.label, source: g.source, missing: false };
    // 模式匹配（如 resist:*）
    for (const p of g.patterns || []) {
      if (p.match.endsWith('*') && key.startsWith(p.match.slice(0, -1))) {
        const rest = key.slice(p.match.length - 1);
        const sub = cat === 'stat' ? DB.glossary?.categories?.element?.terms?.[rest] : null;
        const zh = p.zh.replace('{1}', sub ? sub.zh : rest);
        return { zh, brief: p.brief || '', key, cat, catLabel: g.label, source: g.source, missing: false };
      }
    }
  }
  if (!warned.has(`${cat}:${key}`)) {
    warned.add(`${cat}:${key}`);
    console.warn(`[术语未收录] ${cat}: ${key}`);
  }
  return { zh: key, brief: '', key, cat, catLabel: g?.label || cat, source: g?.source || '', missing: true };
}

// 状态：优先 statuses 文件的 name/note
export function lookupStatus(id) {
  const s = DB.statusMap.get(id);
  if (s) return { zh: s.name || id, brief: s.note || '', key: id, cat: 'status', catLabel: '状态', missing: false };
  if (!warned.has(`status:${id}`)) {
    warned.add(`status:${id}`);
    console.warn(`[状态未定义] ${id}`);
  }
  return { zh: id, brief: '', key: id, cat: 'status', catLabel: '状态', missing: true };
}

export function lookupPathway(id) {
  const p = DB.pathways.find((x) => x.id === id);
  return { zh: p?.name || id, brief: '', key: id, cat: 'pathway', catLabel: '途径', missing: !p };
}

export function lookupAxis(pathwayId, axisId) {
  const ax = DB.axesByPathway.get(pathwayId)?.[axisId];
  if (ax) return { zh: `${ax.symbol || ''}${ax.name}`.trim(), brief: ax.note || '', key: axisId, cat: 'axis', catLabel: '构筑轴', missing: false };
  return { zh: axisId, brief: '', key: axisId, cat: 'axis', catLabel: '构筑轴', missing: true };
}

// 渲染为带 tooltip 的 span；showKey=true 时附英文小字
export function termSpan(cat, key, { showKey = true } = {}) {
  if (key == null || key === '') return '';
  const t = lookup(cat, key);
  const cls = t.missing ? 'term missing' : 'term';
  const keyHtml = showKey && t.zh !== key ? `<span class="tk">${escapeHtml(key)}</span>` : '';
  return `<span class="${cls}" data-cat="${escapeHtml(cat)}" data-key="${escapeHtml(key)}">${escapeHtml(t.zh)}${keyHtml}</span>`;
}

export function statusSpan(id) {
  const t = lookupStatus(id);
  const cls = t.missing ? 'term missing' : 'term';
  return `<span class="${cls}" data-cat="status" data-key="${escapeHtml(id)}">${escapeHtml(t.zh)}<span class="tk">${escapeHtml(id)}</span></span>`;
}

export function axisSpan(pathwayId, axisId) {
  const t = lookupAxis(pathwayId, axisId);
  const cls = t.missing ? 'term missing' : 'term';
  return `<span class="${cls}" data-cat="axis" data-key="${escapeHtml(pathwayId + '/' + axisId)}">${escapeHtml(t.zh)}</span>`;
}

// tooltip 委托：挂一次即可
export function initTooltip() {
  const tip = document.getElementById('tooltip');
  document.addEventListener('mouseover', (e) => {
    const el = e.target.closest?.('.term');
    if (!el) { tip.hidden = true; return; }
    const cat = el.dataset.cat;
    const key = el.dataset.key;
    let t;
    if (cat === 'status') t = lookupStatus(key);
    else if (cat === 'axis') { const [pid, aid] = key.split('/'); t = lookupAxis(pid, aid); }
    else if (cat === 'pathway') t = lookupPathway(key);
    else t = lookup(cat, key);
    tip.innerHTML = `
      <div class="tt-cat">${escapeHtml(t.catLabel || '')}${t.missing ? ' · <span style="color:var(--warn)">未收录</span>' : ''}</div>
      <div class="tt-key">${escapeHtml(t.key)}</div>
      <div class="tt-zh">${escapeHtml(t.zh)}</div>
      ${t.brief ? `<div>${escapeHtml(t.brief)}</div>` : ''}
      ${t.detail ? `<div class="tt-detail">${escapeHtml(t.detail)}</div>` : ''}
      ${t.source ? `<div class="tt-src">出处：${escapeHtml(t.source)}</div>` : ''}`;
    tip.hidden = false;
  });
  document.addEventListener('mousemove', (e) => {
    if (tip.hidden) return;
    const pad = 14;
    let x = e.clientX + pad, y = e.clientY + pad;
    const r = tip.getBoundingClientRect();
    if (x + r.width > innerWidth - 8) x = e.clientX - r.width - pad;
    if (y + r.height > innerHeight - 8) y = e.clientY - r.height - pad;
    tip.style.left = x + 'px';
    tip.style.top = y + 'px';
  });
  document.addEventListener('mouseout', (e) => {
    if (e.target.closest?.('.term')) tip.hidden = true;
  });
}
