// 悬停浮层：查询 term.js 的词条 / status.js 的状态详情
// 桌面（有精确指针 + hover）：跟随光标；触屏：点击后居中弹出（.tip-center）
import { lookup, lookupStatus, lookupAxis, lookupPathway, escapeHtml } from './term.js';
import { renderStatusDetail } from './status.js';

function fillTip(tip, el) {
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
}

export function initTooltip() {
  const tip = document.getElementById('tooltip');

  // 触屏分支。用 hover/pointer 能力检测而非 'ontouchstart'（触屏笔记本会误判）
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    document.addEventListener('click', (e) => {
      const el = e.target.closest?.('.term');
      if (!el) {
        // 点浮层内的非术语区域（如长备注）不关闭，否则没法滚动阅读
        if (!tip.contains(e.target)) tip.hidden = true;
        return;
      }
      // 带词典深链的术语（领域模型页的 token）放行：触屏没有「悬停」，拦下点击等于废掉跳转，
      // 而词典条目比浮层更全，跳过去本来就是更好的落点
      if (el.classList.contains('md-tok')) { tip.hidden = true; return; }
      // 捕获阶段拦下：卡片列表的 .card-item 也绑了 click 跳转详情
      e.preventDefault();
      e.stopPropagation();
      fillTip(tip, el);
      tip.classList.add('tip-center');
      tip.hidden = false;
    }, true);
    // 路由重渲染视图后，浮层会带着旧内容留在屏上
    window.addEventListener('hashchange', () => { tip.hidden = true; });
    return;
  }

  document.addEventListener('mouseover', (e) => {
    const el = e.target.closest?.('.term');
    if (!el) { tip.hidden = true; return; }
    fillTip(tip, el);
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
