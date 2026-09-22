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
// cellMode: 'count' 格内是原值；'share' 按**行**归一化成百分比（比构成，不比用量——
//   否则 200 次用量的途径会把 30 次的途径整行压到色阶底部）
// orderNote / unit: 窄屏提示语的措辞。**列序就是折叠优先级**，用量型维度按用量降序传
//   （默认措辞「列用量最高的」即此），有序刻度（稀有度、序列）另有顺序，措辞要跟着改，
//   否则「用量最高的 9 列」会与读者看到的列对不上
export function heatPanel({
  title, rows, cols, scopeLabel = '全库', cornerLabel = '行',
  cellMode = 'count', orderNote = '列用量最高的 ', unit = ' 次',
}) {
  // 先把矩阵摊平：两种模式共用一套取值，避免色阶/合计/格内数字各算各的
  const raw = rows.map((r) => cols.map((c) => r.values.get(c.key) || 0));
  const rowSums = raw.map((row) => row.reduce((a, b) => a + b, 0));
  const cells = raw.map((row, i) => (cellMode === 'share' && rowSums[i]
    ? row.map((v) => (v / rowSums[i]) * 100)
    : row));
  // share 模式格内是百分数：一位小数，整数不拖 .0。取整会把 0.4% 的格抹成空白，
  // 而「这条途径碰过这个原语没有」恰恰就在最细的那些格子里
  const fmt = (v) => {
    if (!v) return '';
    if (cellMode !== 'share') return String(v);
    const s = v.toFixed(1);
    return `${s.endsWith('.0') ? s.slice(0, -2) : s}%`;
  };

  // 列按总量降序——折叠取的就是这个顺序的前 9 列
  const colTotal = (j) => cells.reduce((s, row) => s + row[j], 0);
  const totals = cols.map((c, j) => colTotal(j));
  const grand = totals.reduce((a, b) => a + b, 0);
  const shownTotal = totals.slice(0, HEAT_TOP_COLS).reduce((a, b) => a + b, 0);
  const hiddenCols = Math.max(0, cols.length - HEAT_TOP_COLS);
  const hiddenTotal = grand - shownTotal;
  const coverPct = grand ? Math.round((shownTotal / grand) * 100) : 100;
  // share 模式的合计同源算出来的也是份额，再报「合计 1300%」就成了读不通的话，折成占比
  const foldAmount = cellMode === 'share'
    ? `${grand ? Math.round((hiddenTotal / grand) * 100) : 0}%`
    : `${hiddenTotal}${unit}`;

  // 色阶上限在整个矩阵上取，与折叠无关：折的是列不是数据，同一数值在任何视图下颜色一致
  // （按可见列重算上限＝「筛掉一列就换配色」那类误导）。基准值用 Math.max(base, ...) 而不是
  // `|| 1`：cells 为空时展开成 -Infinity，而它是 truthy，兜不住
  const max = Math.max(cellMode === 'share' ? 0.01 : 1, ...cells.flat());

  const head = cols.map((c) => `<th title="${escapeHtml(c.title || c.key)}">${escapeHtml(c.label)}</th>`).join('');
  const body = rows.map((r, i) => {
    const tds = cols.map((c, j) => {
      const v = cells[i][j];
      // 色阶上限压到 0.46：满强度格底约 #425f89，是「浅色文字仍能过 WCAG AA 4.5:1」的
      // 临界点。更高的上限会让最亮几格掉到 2.16:1——恰恰是数值最大、最该看清的格子。
      // 格内数字同时充当该图的表格视图（不靠色阶单独编码）
      const a = v ? 0.10 + 0.36 * (v / max) : 0;
      // share 模式的绝对值不能丢：格内是份额，悬停补上原值
      const tip = cellMode === 'share' ? `${fmt(v)}（${raw[i][j]} 次）` : String(v);
      return `<td style="background:rgba(110,168,254,${a.toFixed(2)})" title="${escapeHtml(r.head)} × ${escapeHtml(c.title || c.key)}: ${escapeHtml(tip)}">${fmt(v)}</td>`;
    }).join('');
    return `<tr><td class="rowhead">${escapeHtml(r.head)}</td>${tds}</tr>`;
  }).join('');

  // 列数 ≤ HEAT_TOP_COLS 时没有可折的列：不给开关（窄屏下勾了没反应的假控件比没有更坏），
  // 提示语也不再说「覆盖全库 100% / 折起的 0 列合计 0 次」这种废话
  const toggle = hiddenCols
    ? `<label class="heat-toggle"><input type="checkbox" class="heat-all">显示全部 ${cols.length} 列</label>` : '';
  const hint = hiddenCols
    ? `窄屏下默认${orderNote}${HEAT_TOP_COLS} 列（覆盖${escapeHtml(scopeLabel)} ${coverPct}%）；折起的 ${hiddenCols} 列合计 ${foldAmount}。`
    : `本表共 ${cols.length} 列，窄屏下也能全部显示。`;

  return `
    <div class="panel heat-panel"><h2>${escapeHtml(title)}</h2>
      ${toggle}
      <div class="heat-hint muted">${hint}</div>
      <div class="heat-wrap"><table class="heat">
        <thead><tr><th>${escapeHtml(cornerLabel)}</th>${head}</tr></thead>
        <tbody>${body}</tbody>
      </table></div>
    </div>`;
}

// 勾选后给**同一面板**的 .heat-wrap 加 .show-all（CSS 里展开态还会把首列钉住，横滑不丢行身份）。
// 统计页一页十几张热图，早先用 view.querySelector 只会绑到第一张——按面板取，且必须遍历：
// 列数 ≤ HEAT_TOP_COLS 的面板根本不输出 .heat-all
export function wireHeatToggle(view) {
  for (const box of view.querySelectorAll('.heat-all')) {
    const panel = box.closest('.heat-panel') || view;
    box.addEventListener('change', () => {
      panel.querySelector('.heat-wrap')?.classList.toggle('show-all', box.checked);
    });
  }
}
