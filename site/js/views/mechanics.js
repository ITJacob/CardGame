// 机制图鉴：状态类别、触发时机、元素、攻击性质与单位类型的玩家向速览。
// 词条来自 glossary.json；状态类别计数读 DB.statusMap（途径状态定义延迟加载，到位后刷新计数）。
import { DB, onStatusesReady } from '../data.js';
import { escapeHtml } from '../term.js';

function termRows(catKey, countOf) {
  const cat = DB.glossary?.categories?.[catKey];
  if (!cat) return '';
  return Object.entries(cat.terms || {}).map(([key, t]) => {
    const n = countOf ? countOf(key) : null;
    return `<a class="mech-term" href="#/glossary?q=${encodeURIComponent(key)}">
      <span class="mech-key mono">${escapeHtml(key)}</span>
      <b>${escapeHtml(t.zh || key)}</b>
      <span class="mech-brief">${escapeHtml(t.brief || '')}</span>
      ${n != null ? `<span class="mech-count">${n}</span>` : ''}
    </a>`;
  }).join('');
}

function categoryCounts() {
  const counts = {};
  for (const s of DB.statusMap.values()) {
    for (const c of s.category || []) counts[c] = (counts[c] || 0) + 1;
  }
  return counts;
}

function unitTypeCounts() {
  const counts = {};
  for (const u of DB.unitDefs) {
    if (u.unitType) counts[u.unitType] = (counts[u.unitType] || 0) + 1;
  }
  return counts;
}

function renderStatusCounts() {
  const host = document.getElementById('mech-status');
  if (!host) return;
  const counts = categoryCounts();
  host.innerHTML = termRows('statusCategory', (k) => counts[k] || 0);
}

export function renderMechanics(view) {
  view.innerHTML = `
  <h1 class="page-title">机制图鉴</h1>
  <p class="page-lead">打牌时最常见的四组概念：状态类别、触发时机、元素与攻击性质。完整取值与字段解释在<a href="#/glossary">术语词典</a>。</p>

  <div class="mech-grid">
    <section class="panel mech-panel">
      <h2>状态类别 <span class="muted">状态定义数</span></h2>
      <div id="mech-status" class="mech-terms"></div>
      <p class="muted mech-note">层数影响强度、时长决定存在、次数是消耗型配额。控制与免疫改变「能不能动」，增益/减益改变「打得动不动」。</p>
    </section>

    <section class="panel mech-panel">
      <h2>触发时机 <span class="muted">被动与状态什么时候结算</span></h2>
      <div class="mech-terms">${termRows('triggerEvent')}</div>
      <p class="muted mech-note">被动卡靠触发点驱动；「机会括号」类的 on_turn_start / on_turn_end 按本单位获得的行动机会结算，而非固定 tick。</p>
    </section>

    <section class="panel mech-panel">
      <h2>元素 <span class="muted">伤害类型</span></h2>
      <div class="mech-terms">${termRows('element')}</div>
      <p class="muted mech-note">水、污秽等风味走状态标签。同元素命中触发共鸣；火×冰、圣×暗对立，命中时削 1 层并令本次伤害 ×0.85。</p>
    </section>

    <section class="panel mech-panel">
      <h2>攻击性质 <span class="muted">决定对撞与拦截</span></h2>
      <div class="mech-terms">${termRows('reach')}</div>
      <p class="muted mech-note">近战贴脸对撞、投掷可被守卫拦截、法术不可拦截但仍会被反击；与站位（2 路 × 4 格）共同决定谁能打到谁。</p>
    </section>

    <section class="panel mech-panel mech-panel--wide">
      <h2>召唤物类型 <span class="muted">蓝本归属数</span></h2>
      <div class="mech-terms">${termRows('unitType', (k) => unitTypeCounts()[k] || 0)}</div>
      <p class="muted mech-note">召唤物是一等单位：占格、有属性、可被攻击，也会受召唤位上限约束。</p>
    </section>
  </div>`;

  renderStatusCounts();
  onStatusesReady(renderStatusCounts);
}
