// 统计分析仪表盘（浏览器端现算，口径对齐 docs/tools/build_profession_analysis.py）
// ⚠️ 本页口径是**卡面**：只统计 docs/json/*.skills.json 的 effects。
// 状态定义（*.statuses.json）的效果另有一页：见 views/status.js
import { DB } from '../data.js';
import { zh } from '../term.js';
import { walkCardEffects } from '../ast.js';
import { barChart, countBy, sortedRows, heatPanel, wireHeatToggle } from '../charts.js';

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

  // 原语 / 算子 / 属性 / 资源 / 元素 + 途径×维度（10 张热图共用这一趟，只为热图再走一遍
  // 829 张卡（每张还重跑一次 walkCardEffects）是白付一次全量遍历）
  const primTotal = new Map();       // type -> count
  const primByPath = new Map();      // pathwayId -> Map(type->count)
  const opTotal = new Map();
  const statCount = new Map();
  const resCount = new Map();
  const elemCount = new Map();
  const bump = (m, row, col) => {
    let r = m.get(row);
    if (!r) { r = new Map(); m.set(row, r); }
    r.set(col, (r.get(col) || 0) + 1);
  };
  // 热图的行数据：pathwayId -> Map(维度取值 -> 计数)
  const rarityByPath = new Map(), seqByPath = new Map(), reachByPath = new Map(),
        selByPath = new Map(), hookByPath = new Map(), statByPath = new Map(),
        resByPath = new Map(), elemByPath = new Map(), opByPath = new Map();
  for (const c of cards) {
    const p = c._pathway;
    bump(rarityByPath, p, c.rarity);
    bump(seqByPath, p, c.sequence);        // key 是 number，列定义同类型，见 seqCols
    // 距离 / 选靶 / 触发点三个维度的口径与上面的条形图逐字一致，别在这里换判据：
    // 选靶用 c.target 判存在（而不是 c.kind === 'active'）——有一张被动卡
    // （skill_prisoner_s6_corpse_handler）带 target，换个判据两张图会差 1，反而像 bug
    if (c.kind === 'active' && c.reach) bump(reachByPath, p, c.reach);
    if (c.target?.selectionMode) bump(selByPath, p, c.target.selectionMode);
    if (c.hook) bump(hookByPath, p, c.hook);
    walkCardEffects(c, (n, kindOf) => {
      if (kindOf === 'op') {
        opTotal.set(n.op, (opTotal.get(n.op) || 0) + 1);
        bump(opByPath, p, n.op);
      } else {
        primTotal.set(n.type, (primTotal.get(n.type) || 0) + 1);
        bump(primByPath, p, n.type);
        if (n.type === 'modify_stat' && n.stat) {
          statCount.set(n.stat, (statCount.get(n.stat) || 0) + 1);
          bump(statByPath, p, n.stat);
        }
        if (n.type === 'modify_resource' && n.resource) {
          resCount.set(n.resource, (resCount.get(n.resource) || 0) + 1);
          bump(resByPath, p, n.resource);
        }
        if (n.type === 'damage' && n.element) {
          elemCount.set(n.element, (elemCount.get(n.element) || 0) + 1);
          bump(elemByPath, p, n.element);
        }
      }
    });
  }

  // 途径×原语热图（列按总用量降序，折叠取前 HEAT_TOP_COLS 列）
  // 存成 {key,label,title} 而不是裸 key 字符串：两张原语热图（绝对用量 + 行内占比）共用，
  // 传裸 key 给 heatPanel 不会报错——列头会渲染成空白、所有格子读 values.get(undefined) 得 0，
  // 于是「折起的 10 列合计 0%」，看上去像数据本来就空
  const primCols = [...primTotal.entries()].sort((a, b) => b[1] - a[1])
    .map(([t]) => ({ key: t, label: zh('primitive', t), title: t }));

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
        DB.rarityOrder.map((r) => ({ label: zh('rarity', r), title: r, value: byRarity.get(r) || 0 })))}</div>
      <div class="panel"><h2>序列位阶分布</h2>${barChart(
        [...Array(10)].map((_, i) => 9 - i).map((s) => ({ label: `序列 ${s}`, value: bySeq.get(s) || 0 })))}</div>
    </div>`;

  const pathwaysBar = `
    <div class="panel"><h2>各途径卡数</h2>${barChart(
      pathways.map((p) => ({ label: p.name, title: p.id, value: p.cardCount })))}</div>`;

  const declared = DB.declaredPrimitives.length;
  const primBars = `
    <div class="stat-grid">
      <div class="panel"><h2>原语用量（卡面）</h2>
        <p class="panel-note muted">本页只算卡面 effects：在用 ${primTotal.size} 条${declared ? ` / schema 声明 ${declared} 条` : ''}。
        状态定义（*.statuses.json）的效果另算，见「状态统计」页。</p>
        ${barChart(sortedRows(primTotal, (k) => zh('primitive', k)))}</div>
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

  // ---- 途径 × 维度 热图组 ----
  // 列：一律现算，只有稀有度 / 序列是**有序刻度**、另有顺序。**列序就是窄屏折叠优先级**
  // （HEAT_TOP_COLS 与 app.css 的 :nth-child(n+11) 硬耦合），所以有序刻度要把最不重要的
  // 那一列排在末尾：序列传 9→0，折掉的正是 序列 0。orderNote 是提示语的措辞，得跟着这个
  // 顺序走——用量型维度的默认措辞「列用量最高的」用在这儿会与读者看到的列对不上
  const colsOf = (m, cat) => sortedRows(m, (k) => zh(cat, k))
    .map((r) => ({ key: r.title, label: r.label, title: r.title }));
  // 行：22 个途径**全在**，这一维一格都没有的途径留空行。行的清单是「途径」而不是
  // 「有数据的途径」——少一行，纵向堆叠的这十几张热图就对不上号了
  const rowsOf = (m) => pathways.map((p) => ({ head: p.name, values: m.get(p.id) || new Map() }));
  const heatOf = (title, m, cols, extra = {}) => heatPanel({
    title, cornerLabel: '途径', scopeLabel: '全库', cols, rows: rowsOf(m), ...extra,
  });

  const seqCols = [...Array(10)].map((_, i) => {
    const s = 9 - i;
    return { key: s, label: `序列 ${s}`, title: `序列 ${s}` };
  });
  const rarityCols = DB.rarityOrder.map((r) => ({ key: r, label: zh('rarity', r), title: r }));

  // 版面：≤5 列的成对并排（.stat-grid 自动折行），6 列以上独占整行——半幅面板里塞宽表
  // 表头就得折成竖排（实测 9 列的元素表在 640px 里已经挤成一团）。顺序按卡池结构 → 目标面
  // → 数值面 → 构件面
  const heatStack = `
    <p class="panel-note muted">下面 11 张热图共用一套读法：行 = ${pathways.length} 个途径，列 = 该维度的
    取值，格 = 计数（只有最后一张「原语 构成」是行内归一化后的 %）。<b>每张图的色阶各自独立</b>（上限取本图
    最大值），跨图比颜色没有意义——要比就比格内数字。属性 / 资源 / 元素 / 算子 / 原语按
    <b>效果节点</b>计数，稀有度 / 序列 / 距离 / 选靶 / 触发点按<b>卡</b>计数，相邻两张图的行合计
    不是一回事。行序一律是 manifest 途径顺序，便于纵向对照；列序是各自的用量或刻度顺序，
    悬停表头看原始 key。</p>
    <div class="heat-stack">
      <div class="stat-grid">
        ${heatOf('途径 × 稀有度', rarityByPath, rarityCols, { unit: ' 张' })}
        ${heatOf('途径 × 算子', opByPath, colsOf(opTotal, 'operator'))}
      </div>
      ${heatOf('途径 × 序列', seqByPath, seqCols, { orderNote: '序列最高的 ', unit: ' 张' })}
      <div class="stat-grid">
        ${heatOf('途径 × 攻击距离（只算主动卡）', reachByPath, colsOf(byReach, 'reach'), { unit: ' 张' })}
        ${heatOf('途径 × 选靶方式（只算有 target 的卡）', selByPath, colsOf(bySel, 'selectionMode'), { unit: ' 张' })}
      </div>
      ${heatOf('途径 × 被动触发点（只算被动卡）', hookByPath, colsOf(byHook, 'triggerEvent'), { unit: ' 张' })}
      ${heatOf('途径 × modify_stat 属性', statByPath, colsOf(statCount, 'stat'))}
      ${heatOf('途径 × modify_resource 资源', resByPath, colsOf(resCount, 'resource'))}
      ${heatOf('途径 × 伤害元素', elemByPath, colsOf(elemCount, 'element'))}
      ${heatOf('途径 × 原语 用量热图（卡面）', primByPath, primCols)}
      ${heatOf('途径 × 原语 构成（每行按该途径自己的原语总量归一化，格内为 %）', primByPath, primCols,
        { cellMode: 'share', orderNote: '按总用量降序的 ' })}
    </div>`;

  view.innerHTML = `<h1 class="page-title">统计分析</h1>${overview}${pathwaysBar}${primBars}${statRes}${heatStack}`;

  // 窄屏展开全部列；桌面端该开关不显示（CSS 隐藏），勾选状态无副作用
  wireHeatToggle(view);
}
