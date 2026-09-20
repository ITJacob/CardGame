// 悬停浮层：查询 term.js 的词条 / status.js 的状态详情，组装并跟随鼠标定位
import { lookup, lookupStatus, lookupAxis, lookupPathway, escapeHtml } from './term.js';
import { renderStatusDetail } from './status.js';

export function initTooltip() {
  const tip = document.getElementById('tooltip');
  document.addEventListener('mouseover', (e) => {
    const el = e.target.closest?.('.term');
    if (!el) { tip.hidden = true; return; }
    const cat = el.dataset.cat;
    const key = el.dataset.key;
    let t;
    let detail = '';
    if (cat === 'status') { t = lookupStatus(key); detail = renderStatusDetail(key); }
    else if (cat === 'axis') { const [pid, aid] = key.split('/'); t = lookupAxis(pid, aid); }
    else if (cat === 'pathway') t = lookupPathway(key);
    else t = lookup(cat, key);
    tip.innerHTML = `
      <div class="tt-cat">${escapeHtml(t.catLabel || '')}${t.missing ? ' · <span style="color:var(--warn)">未收录</span>' : ''}</div>
      <div class="tt-key">${escapeHtml(t.key)}</div>
      <div class="tt-zh">${escapeHtml(t.zh)}</div>
      ${t.brief ? `<div>${escapeHtml(t.brief)}</div>` : ''}
      ${detail}
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
