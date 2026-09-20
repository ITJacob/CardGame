// 统计分析仪表盘（浏览器端现算，口径对齐 docs/tools/build_profession_analysis.py）
import { DB } from '../data.js';
import { escapeHtml } from '../term.js';
import { walkCardEffects } from '../ast.js';

function barChart(rows, { max = null } = {}) {
  const m = max ?? Math.max(1, ...rows.map((r) => r.value));
  return rows.map((r) => `
    <div class="bar-row">
      <span class="bar-label" title="${escapeHtml(r.title || r.label)}">${escapeHtml(r.label)}</span>
      <span class="bar-track"><span class="bar-fill" style="width:${(r.value / m) * 100}%"></span></span>
      <span class="bar-val num">${r.value}</span>
    </div>`).join('');
}

function countBy(items, fn) {
  const m = new Map();
  for (const it of items) {
    const k = fn(it);
    if (k == null) continue;
    m.set(k, (m.get(k) || 0) + 1);
  }
  return m;
}

function sortedRows(map, labelFn) {
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => ({ label: labelFn ? labelFn(k) : k, title: k, value: v }));
}

function zh(cat, key) {
  return DB.glossary?.categories?.[cat]?.terms?.[key]?.zh || key;
}

export function renderStats(view) {
  const cards = DB.cards;
  const pathways = DB.pathways;

  // 基础计数
  const byRarity = countBy(cards, (c) => c.rarity);
  const byKind = countBy(cards, (c) => c.kind);
  const bySeq = countBy(cards, (c) => c.sequence);
  const byReach = countBy(cards.filter((c) => c.kind === 'active'), (c) => c.reach);
  const bySel = countBy(cards.filter((c) => c.target), (c) => c.target.selectionMode);
  const byHook = countBy(cards.filter((c) => c.hook), (c) => c.hook);
  const flagshipCount = cards.filter((c) => c.flagship).length;
  const flagCards = cards.filter((c) => c.frameworkFlags?.length);
  const axisCount = pathways.reduce((s, p) => s + Object.keys(DB.axesByPathway.get(p.id) || {}).length, 0);

  // 原语 / 算子 / 属性 / 资源 / 元素
  const primTotal = new Map();       // type -> count
  const primByPath = new Map();      // pathwayId -> Map(type->count)
  const opTotal = new Map();
  const statCount = new Map();
  const resCount = new Map();
  const elemCount = new Map();
  for (const c of cards) {
    if (!primByPath.has(c._pathway)) primByPath.set(c._pathway, new Map());
    const pm = primByPath.get(c._pathway);
    walkCardEffects(c, (n, kindOf) => {
      if (kindOf === 'op') {
        opTotal.set(n.op, (opTotal.get(n.op) || 0) + 1);
      } else {
        primTotal.set(n.type, (primTotal.get(n.type) || 0) + 1);
        pm.set(n.type, (pm.get(n.type) || 0) + 1);
        if (n.type === 'modify_stat' && n.stat) statCount.set(n.stat, (statCount.get(n.stat) || 0) + 1);
        if (n.type === 'modify_resource' && n.resource) resCount.set(n.resource, (resCount.get(n.resource) || 0) + 1);
        if (n.type === 'damage' && n.element) elemCount.set(n.element, (elemCount.get(n.element) || 0) + 1);
      }
    });
  }

  // 途径×原语热图（列按总用量排序）
  const primCols = [...primTotal.entries()].sort((a, b) => b[1] - a[1]).map(([t]) => t);
  const heatMax = Math.max(1, ...[...primByPath.values()].flatMap((m) => [...m.values()]));
  const heatRows = pathways.map((p) => {
    const m = primByPath.get(p.id) || new Map();
    const tds = primCols.map((t) => {
      const v = m.get(t) || 0;
      const a = v ? 0.12 + 0.75 * (v / heatMax) : 0;
      return `<td style="background:rgba(110,168,254,${a.toFixed(2)})" title="${p.name} × ${t}: ${v}">${v || ''}</td>`;
    }).join('');
    return `<tr><td class="rowhead">${escapeHtml(p.name)}</td>${tds}</tr>`;
  }).join('');

  const overview = `
    <div class="stat-grid">
      <div class="panel"><h2>总览</h2><dl class="kv">
        <dt>卡片总数</dt><dd class="num">${cards.length}</dd>
        <dt>途径</dt><dd class="num">${pathways.length}</dd>
        <dt>构筑轴</dt><dd class="num">${axisCount}</dd>
        <dt>主动 / 被动</dt><dd class="num">${byKind.get('active') || 0} / ${byKind.get('passive') || 0}</dd>
        <dt>旗舰卡</dt><dd class="num">${flagshipCount}</dd>
        <dt>带框架缺口</dt><dd class="num">${flagCards.length} 张 / ${flagCards.reduce((s, c) => s + c.frameworkFlags.length, 0)} 条</dd>
        <dt>待拍板数值</dt><dd class="num">${cards.filter((c) => c.tentative).length} 张</dd>
      </dl></div>
      <div class="panel"><h2>稀有度分布</h2>${barChart(
        ['common', 'uncommon', 'rare', 'epic', 'legendary'].map((r) => ({ label: zh('rarity', r), title: r, value: byRarity.get(r) || 0 })))}</div>
      <div class="panel"><h2>序列位阶分布</h2>${barChart(
        [...Array(10)].map((_, i) => 9 - i).map((s) => ({ label: `序列 ${s}`, value: bySeq.get(s) || 0 })))}</div>
    </div>`;

  const pathwaysBar = `
    <div class="panel"><h2>各途径卡数</h2>${barChart(
      pathways.map((p) => ({ label: p.name, title: p.id, value: p.cardCount })))}</div>`;

  const primBars = `
    <div class="stat-grid">
      <div class="panel"><h2>原语用量（全库）</h2>${barChart(sortedRows(primTotal, (k) => zh('primitive', k)))}</div>
      <div class="panel"><h2>算子用量</h2>${barChart(sortedRows(opTotal, (k) => zh('operator', k)))}
        <h3>伤害元素分布</h3>${barChart(sortedRows(elemCount, (k) => zh('element', k)))}</div>
    </div>`;

  const statRes = `
    <div class="stat-grid">
      <div class="panel"><h2>modify_stat 属性分布</h2>${barChart(sortedRows(statCount, (k) => zh('stat', k)))}</div>
      <div class="panel"><h2>modify_resource 资源分布</h2>${barChart(sortedRows(resCount, (k) => zh('resource', k)))}</div>
      <div class="panel"><h2>被动触发点分布</h2>${barChart(sortedRows(byHook, (k) => zh('triggerEvent', k)))}</div>
      <div class="panel"><h2>攻击距离 / 选靶方式</h2>
        <h3>攻击距离（主动卡）</h3>${barChart(sortedRows(byReach, (k) => zh('reach', k)))}
        <h3>选靶方式</h3>${barChart(sortedRows(bySel, (k) => zh('selectionMode', k)))}</div>
    </div>`;

  const heat = `
    <div class="panel"><h2>途径 × 原语 用量热图</h2>
      <div class="heat-wrap"><table class="heat">
        <thead><tr><th>途径</th>${primCols.map((t) => `<th title="${t}">${escapeHtml(zh('primitive', t))}</th>`).join('')}</tr></thead>
        <tbody>${heatRows}</tbody>
      </table></div>
    </div>`;

  view.innerHTML = `<h1 class="page-title">统计分析</h1>${overview}${pathwaysBar}${primBars}${statRes}${heat}`;
}
