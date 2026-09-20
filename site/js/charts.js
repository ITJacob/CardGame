// 图表共用件：横向条形图 + 热图（卡片页与状态页共用，避免两页各写一份而漂移）
import { escapeHtml } from './term.js';

// 窄屏热图默认列数。**必须与 app.css 的 :nth-child(n+11) 同步**：CSS 把「1 列行头 +
// 9 列数据」写死在选择器里，这里改了而 CSS 没改，折叠就会错位（露出 10 列却提示 9 列）
export const HEAT_TOP_COLS = 9;

export function barChart(rows, { max = null } = {}) {
  const m = max ?? Math.max(1, ...rows.map((r) => r.value));
  // 值为 0 时不给填充条：.bar-fill 的 min-width:1px 会让 0 显示成一像素的假进度
  return rows.map((r) => `
    <div class="bar-row">
      <span class="bar-label" title="${escapeHtml(r.title || r.label)}">${escapeHtml(r.label)}</span>
      <span class="bar-track">${r.value ? `<span class="bar-fill" style="width:${(r.value / m) * 100}%"></span>` : ''}</span>
      <span class="bar-val num">${r.value}</span>
    </div>`).join('');
}

export function countBy(items, fn) {
  const m = new Map();
  for (const it of items) {
    const k = fn(it);
    if (k == null) continue;
    m.set(k, (m.get(k) || 0) + 1);
  }
  return m;
}

// map -> [{label, title, value}] 降序；labelFn 负责把 key 翻成中文
// byKey: 按 key 升序而不是按数量降序——给 duration / maxStacks 这类**有序刻度**用，
// 按数量排会让标签跳成 4、3、5、6、2，读不出趋势
export function sortedRows(map, labelFn, { byKey = false } = {}) {
  const rows = [...map.entries()];
  rows.sort(byKey
    ? (a, b) => (Number(a[0]) - Number(b[0])) || String(a[0]).localeCompare(String(b[0]))
    : (a, b) => b[1] - a[1]);
  return rows.map(([k, v]) => ({ label: labelFn ? labelFn(k) : k, title: k, value: v }));
}

// rows: [{ head, values: Map<colKey, number> }]
// cols: [{ key, label, title }]
// scopeLabel: 提示语里「覆盖全库 X%」的「全库」在这个面上的称呼
// cornerLabel: 左上角那格对行头的称呼（卡面=途径，状态面=分类）
export function heatPanel({ title, rows, cols, scopeLabel = '全库', cornerLabel = '行' }) {
  // 列按总量降序——折叠取的就是这个顺序的前 9 列
  const totals = cols.map((c) => rows.reduce((s, r) => s + (r.values.get(c.key) || 0), 0));
  const grand = totals.reduce((a, b) => a + b, 0);
  const shownTotal = totals.slice(0, HEAT_TOP_COLS).reduce((a, b) => a + b, 0);
  const hiddenCols = Math.max(0, cols.length - HEAT_TOP_COLS);
  const hiddenTotal = grand - shownTotal;
  const coverPct = grand ? Math.round((shownTotal / grand) * 100) : 100;

  // 色阶上限在整个矩阵上取，与折叠无关：折的是列不是数据，同一数值在任何视图下颜色一致
  // （按可见列重算上限＝「筛掉一列就换配色」那类误导）
  const max = Math.max(1, ...rows.flatMap((r) => cols.map((c) => r.values.get(c.key) || 0)));

  const head = cols.map((c) => `<th title="${escapeHtml(c.title || c.key)}">${escapeHtml(c.label)}</th>`).join('');
  const body = rows.map((r) => {
    const tds = cols.map((c) => {
      const v = r.values.get(c.key) || 0;
      // 色阶上限压到 0.46：满强度格底约 #425f89，是「浅色文字仍能过 WCAG AA 4.5:1」的
      // 临界点。更高的上限会让最亮几格掉到 2.16:1——恰恰是数值最大、最该看清的格子。
      // 格内数字同时充当该图的表格视图（不靠色阶单独编码）
      const a = v ? 0.10 + 0.36 * (v / max) : 0;
      return `<td style="background:rgba(110,168,254,${a.toFixed(2)})" title="${escapeHtml(r.head)} × ${escapeHtml(c.title || c.key)}: ${v}">${v || ''}</td>`;
    }).join('');
    return `<tr><td class="rowhead">${escapeHtml(r.head)}</td>${tds}</tr>`;
  }).join('');

  return `
    <div class="panel"><h2>${escapeHtml(title)}</h2>
      <label class="heat-toggle"><input type="checkbox" class="heat-all">显示全部 ${cols.length} 列</label>
      <div class="heat-hint muted">窄屏下默认列用量最高的 ${HEAT_TOP_COLS} 列（覆盖${escapeHtml(scopeLabel)} ${coverPct}%）；
        折起的 ${hiddenCols} 列合计 ${hiddenTotal} 次。</div>
      <div class="heat-wrap"><table class="heat">
        <thead><tr><th>${escapeHtml(cornerLabel)}</th>${head}</tr></thead>
        <tbody>${body}</tbody>
      </table></div>
    </div>`;
}

// 勾选后给 .heat-wrap 加 .show-all（CSS 里展开态还会把首列钉住，横滑不丢行身份）
export function wireHeatToggle(view) {
  const box = view.querySelector('.heat-all');
  box?.addEventListener('change', () => {
    view.querySelector('.heat-wrap')?.classList.toggle('show-all', box.checked);
  });
}
