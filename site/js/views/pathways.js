// 22 途径玩家导读：每条途径一句话玩法命题 + 决策点 + 轴 + 代表卡。
// 声明来自 blueprints.json（正源 rounds/<pid>.md）；蓝图缺失时退回卡池的 designNote 与轴表。
import { DB, loadBlueprints } from '../data.js';
import { escapeHtml, axisSpan } from '../term.js';

function truncate(s, n) {
  const t = String(s || '').trim();
  return t.length > n ? `${t.slice(0, n)}…` : t;
}

function rankOf(c) {
  return c.flagship ? 0 : c.role === 'core' ? 1 : 2;
}

function representativeCards(pid, n = 3) {
  const cards = DB.cards.filter((c) => c._pathway === pid);
  return [...cards].sort((a, b) => rankOf(a) - rankOf(b) || b.sequence - a.sequence).slice(0, n);
}

function axisChips(pid) {
  const axes = DB.axesByPathway.get(pid) || {};
  const chips = Object.keys(axes).map((id) => axisSpan(pid, id));
  return chips.length ? `<div class="pway-axis-row">${chips.join('')}</div>` : '';
}

function cardsRow(cards) {
  return `<div class="pway-cards">${cards.map((c) => `
    <a class="pway-card" href="#/card/${encodeURIComponent(c.id)}">${escapeHtml(c.name)}</a>`).join('')}</div>`;
}

function rowHtml(pid, name, prop, variable, cardCount) {
  return `<article class="pway-row" style="--pc: var(--p-${escapeHtml(pid)})">
    <header>
      <h2><a href="#/pathways/${encodeURIComponent(pid)}">${escapeHtml(name)}</a></h2>
      <span class="pway-count">${cardCount} 卡</span>
    </header>
    <p class="pway-statement">${escapeHtml(prop || '（暂无玩法命题）')}</p>
    ${variable ? `<p class="pway-variable"><span>决策</span>${escapeHtml(variable)}</p>` : ''}
    ${axisChips(pid)}
    ${cardsRow(representativeCards(pid))}
  </article>`;
}

export async function renderPathways(view) {
  const shell = (rows) => `
    <h1 class="page-title">22 条途径怎么玩</h1>
    <p class="page-lead">每条途径一个玩法命题。先看它让你做什么决定，再点进卡池看具体卡牌；设计侧的声明与兑现对账在「设计台 → 蓝图对账」。</p>
    <div class="pway-list">${rows}</div>`;
  view.innerHTML = shell(DB.pathways.map((p) =>
    rowHtml(p.id, p.name, truncate(DB.designNotes.get(p.id), 120), '', p.cardCount)).join(''));

  try {
    const bp = await loadBlueprints();
    // 加载期间可能已切页：只回填仍停留在本页的视图
    if (!location.hash.startsWith('#/pathways') || !view.querySelector('.pway-list')) return;
    const byId = new Map((bp.pathways || []).map((p) => [p.id, p]));
    view.innerHTML = shell(DB.pathways.map((p) => {
      const b = byId.get(p.id);
      return rowHtml(
        p.id, p.name,
        truncate(b?.proposition?.statement, 160) || truncate(DB.designNotes.get(p.id), 120),
        truncate(b?.proposition?.variable, 100),
        p.cardCount,
      );
    }).join(''));
  } catch {
    // 蓝图不可用：保留 designNote 版本
  }
}

// ---------- 单途径深页 #/pathways/<pid> ----------

function cardChip(c) {
  return `<a class="pway-card" href="#/card/${encodeURIComponent(c.id)}">${escapeHtml(c.name)}</a>`;
}

function pagerHtml(pid) {
  const i = DB.pathways.findIndex((p) => p.id === pid);
  const prev = i > 0 ? DB.pathways[i - 1] : null;
  const next = i >= 0 && i < DB.pathways.length - 1 ? DB.pathways[i + 1] : null;
  return `<nav class="pway-pager">
    ${prev ? `<a href="#/pathways/${encodeURIComponent(prev.id)}">← ${escapeHtml(prev.name)}</a>` : '<span></span>'}
    <a href="#/pathways">全部途径</a>
    ${next ? `<a href="#/pathways/${encodeURIComponent(next.id)}">${escapeHtml(next.name)} →</a>` : '<span></span>'}
  </nav>`;
}

export function renderPathwayDetail(view, pid) {
  const p = DB.pathways.find((x) => x.id === pid);
  if (!p) {
    view.innerHTML = `<div class="panel"><h2>未找到途径</h2><p class="mono">${escapeHtml(pid)}</p>
      <p><a href="#/pathways">← 返回 22 途径</a></p></div>`;
    return;
  }
  const axes = DB.axesByPathway.get(pid) || {};
  const cards = DB.cards.filter((c) => c._pathway === pid);
  const sections = Object.entries(axes).map(([aid, ax]) => {
    const list = cards.filter((c) => c.axis === aid)
      .sort((a, b) => rankOf(a) - rankOf(b) || b.sequence - a.sequence);
    return `<section class="pway-axis" data-axis="${escapeHtml(aid)}">
      <header>
        <h2><span class="pway-axis-sym">${escapeHtml(ax.symbol || '')}</span>${escapeHtml(ax.name || aid)}</h2>
        <span class="pway-count">${list.length} 卡</span>
      </header>
      <p class="pway-loop" data-loop hidden></p>
      <div class="pway-cards">${list.map(cardChip).join('')}</div>
    </section>`;
  }).join('');

  view.innerHTML = `
  <a class="cs-back" href="#/pathways">← 全部途径</a>
  <section class="pway-hero" style="--pc: var(--p-${escapeHtml(pid)})">
    <p class="pway-kicker">途径导读 · ${cards.length} 张卡</p>
    <h1>${escapeHtml(p.name)}</h1>
    <p class="pway-statement" data-stmt>${escapeHtml(truncate(DB.designNotes.get(pid), 200) || '（暂无玩法命题）')}</p>
    <p class="pway-variable" data-var hidden><span>决策</span><em data-var-text></em></p>
    <p class="pway-variable" data-cost hidden><span>代价</span><em data-cost-text></em></p>
    <div class="home-cta">
      <a class="home-btn home-btn--primary" href="../">去游戏开一局 →</a>
      <a class="home-btn" href="#/cards?pathway=${encodeURIComponent(pid)}">在卡池里筛选这条途径</a>
    </div>
  </section>
  <div class="pway-axes">${sections}</div>
  ${pagerHtml(pid)}`;

  fillDetail(view, pid);
}

async function fillDetail(view, pid) {
  try {
    const bp = await loadBlueprints();
    if (!view.querySelector('.pway-hero')) return;
    const b = (bp.pathways || []).find((x) => x.id === pid);
    if (!b) return;
    const prop = b.proposition || {};
    if (prop.statement) view.querySelector('[data-stmt]').textContent = prop.statement;
    const setRow = (sel, textSel, text) => {
      if (!text) return;
      const row = view.querySelector(sel);
      row.hidden = false;
      row.querySelector(textSel).textContent = text;
    };
    setRow('[data-var]', '[data-var-text]', prop.variable);
    setRow('[data-cost]', '[data-cost-text]', prop.cost);
    const axisMap = new Map((b.axes || []).map((a) => [a.id, a]));
    view.querySelectorAll('.pway-axis').forEach((el) => {
      const loop = axisMap.get(el.dataset.axis)?.loop;
      const text = loop ? [loop.produce, loop.consume, loop.clear].filter(Boolean).join(' → ') : '';
      if (!text) return;
      const host = el.querySelector('[data-loop]');
      host.textContent = `循环：${text}`;
      host.hidden = false;
    });
  } catch {
    // 蓝图缺失：保留 designNote 与轴/卡列表
  }
}
