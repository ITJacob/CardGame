// 22 途径玩家导读：每条途径一句话玩法命题 + 决策点 + 轴 + 代表卡。
// 声明来自 blueprints.json（正源 rounds/<pid>.md）；蓝图缺失时退回卡池的 designNote 与轴表。
import { DB, loadBlueprints } from '../data.js';
import { escapeHtml, axisSpan } from '../term.js';

function truncate(s, n) {
  const t = String(s || '').trim();
  return t.length > n ? `${t.slice(0, n)}…` : t;
}

function representativeCards(pid, n = 3) {
  const cards = DB.cards.filter((c) => c._pathway === pid);
  const rank = (c) => (c.flagship ? 0 : c.role === 'core' ? 1 : 2);
  return [...cards].sort((a, b) => rank(a) - rank(b) || b.sequence - a.sequence).slice(0, n);
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
      <h2><a href="#/cards?pathway=${encodeURIComponent(pid)}">${escapeHtml(name)}</a></h2>
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
