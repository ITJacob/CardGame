// 统计分析仪表盘（浏览器端现算，口径对齐 docs/tools/build_profession_analysis.py）
// 本页是**二级菜单调度器**：页首 .stat-tabs 五个子页——
//   技能  = 卡面族各组（只统计 docs/json/*.skills.json 的 effects，原 stats 单页内容）
//   状态  = 状态定义面（*.statuses.json 的 statusDefs，渲染逻辑在 views/status.js）
//   召唤物 / 区域 / 界域 = 编目三件套（skills.json 顶层 unitDefs / zoneDefs / domainDefs
//           池 + 卡面用法，渲染逻辑在 views/entities.js）
// 口子页口径分两族：卡面各组只统计卡面 effects；状态子页统计状态定义；编目三页统计顶层三池。
//
// 版面（技能子页）：**一个维度一组**——组标题 → 该维度的全库 bar → 该维度的「途径 × 维度」热图。
// 早先是「前面一堆 bar、末尾一叠热图」，同一个维度要在页面两头看：bar 给全库尺度、
// 热图给途径尺度，问的本来就是同一个问题的两个切面，所以配对摆。组间靠板外的组标题
// 分隔、不套容器面板（同卡片详情页的取向：小字标题 + 留白，不层层套框）
import { DB, statusesReady, onStatusesReady, hookEvents } from '../data.js';
import { zh, escapeHtml } from '../term.js';
import { walkCardEffects } from '../ast.js';
import { barChart, countBy, sortedRows, heatPanel, wireHeatToggle } from '../charts.js';
import { renderStatusStats } from './status.js';
import { renderUnitStats, renderZoneStats, renderDomainStats } from './entities.js';

// 二级菜单。key 同时是 hash 段（#/stats/<key>）与 dispatch 判据；裸 #/stats 落到 skills
const TABS = [
  ['skills', '技能'],
  ['status', '状态'],
  ['units', '召唤物'],
  ['zones', '区域'],
  ['domains', '界域'],
];
const tabsHtml = (active) => `<nav class="stat-tabs">${TABS.map(([k, label]) =>
  `<a href="#/stats/${k}"${k === active ? ' class="active"' : ''}>${label}</a>`).join('')}</nav>`;

export function renderStats(view, sub = 'skills') {
  sub = TABS.some(([k]) => k === sub) ? sub : 'skills';
  view.innerHTML = `<h1 class="page-title">统计分析</h1>${tabsHtml(sub)}<div id="stats-sub"></div>`;
  const box = view.querySelector('#stats-sub');
  if (sub === 'status') return renderStatusSub(view, box);
  if (sub === 'units') return renderUnitStats(box);
  if (sub === 'zones') return renderZoneStats(box);
  if (sub === 'domains') return renderDomainStats(box);
  renderSkillStats(box);
}

// ---- 状态子页：状态定义是首屏之后才拉的数据（见 data.js 的 loadDeferred），
// 就绪前先留加载占位，到位后填进来——等待期间用户可能已经切走，
// 只在自己的占位还挂在文档里时才填（沿用原 stats 单页末尾的注入约定）
function renderStatusSub(view, box) {
  const fill = () => { if (box.isConnected) renderStatusStats(box); };
  if (statusesReady()) return fill();
  box.innerHTML = `<div class="panel"><p class="panel-note muted">正在加载 ${DB.pathways.length} 个途径的状态定义…</p></div>`;
  onStatusesReady(fill);
}

function renderSkillStats(view) {
  const cards = DB.cards;
  const pathways = DB.pathways;

  // 基础计数
  const byRarity = countBy(cards, (c) => c.rarity);
  const byKind = countBy(cards, (c) => c.kind);
  const bySeq = countBy(cards, (c) => c.sequence);
  const byReach = countBy(cards.filter((c) => c.kind === 'active'), (c) => c.reach);
  const bySel = countBy(cards.filter((c) => c.target), (c) => c.target.selectionMode);
  // hook 是数组，一张卡可挂多个触发点：逐个事件计数（countBy 一卡只出一键，会漏）。
  // 必须是 Map——下游 sortedRows / colsOf 都走 m.entries()，普通对象会抛 map.entries is not a function
  const byHook = new Map();
  for (const c of cards) for (const h of hookEvents(c)) byHook.set(h, (byHook.get(h) || 0) + 1);
  const flagshipCount = cards.filter((c) => c.flagship).length;
  const openFlags = (c) => (c.frameworkFlags || []).filter((f) => f && f.landed !== true);
  const flagCards = cards.filter((c) => openFlags(c).length);
  const axisCount = pathways.reduce((s, p) => s + Object.keys(DB.axesByPathway.get(p.id) || {}).length, 0);

  // 原语 / 算子 / 属性 / 资源 / 元素 + 途径×维度（10 张热图共用这一趟，只为热图再走一遍
  // 829 张卡（每张还重跑一次 walkCardEffects）是白付一次全量遍历）
  const primTotal = new Map();       // type -> count
  const primByPath = new Map();      // pathwayId -> Map(type->count)
  const opTotal = new Map();
  const statCount = new Map();
  const resCount = new Map();
  const elemCount = new Map();
  const condTotal = new Map();       // condition.kind -> count（含 if 算子分支条件）
  const condByPath = new Map();
  const msModeTotal = new Map();     // modify_stat mode -> count
  const bump = (m, row, col) => {
    let r = m.get(row);
    if (!r) { r = new Map(); m.set(row, r); }
    r.set(col, (r.get(col) || 0) + 1);
  };
  // 热图的行数据：pathwayId -> Map(维度取值 -> 计数)
  const rarityByPath = new Map(), seqByPath = new Map(), reachByPath = new Map(),
        selByPath = new Map(), hookByPath = new Map(), statByPath = new Map(),
        resByPath = new Map(), elemByPath = new Map(), opByPath = new Map(),
        kindByPath = new Map(), energyByPath = new Map(), cooldownByPath = new Map(),
        castByPath = new Map(), rankByPath = new Map(), genderByPath = new Map(),
        depthByPath = new Map(), factionByPath = new Map(), scopeByPath = new Map(),
        sortByPath = new Map(), reqFilterByPath = new Map(),
        cxByPath = new Map(), budgetByPath = new Map();
  const byEnergy = new Map(), byCooldown = new Map(), byCast = new Map(),
        byGender = new Map(), byDepth = new Map(), tagsTotal = new Map(),
        byFaction = new Map(), byScope = new Map(), bySort = new Map(),
        reqFilterTotal = new Map(), byCx = new Map(), byBudget = new Map();
  for (const c of cards) {
    const p = c._pathway;
    bump(rarityByPath, p, c.rarity);
    bump(seqByPath, p, c.sequence);        // key 是 number，列定义同类型，见 seqCols
    bump(kindByPath, p, c.kind);
    // 费用三件套（energy / cooldown / castTime）同住在卡级 cost 对象上，只算主动卡——
    // 全库主动卡 100% 带 cost（被动卡不带也不该带），缺 cost 的主动卡会被这里静默漏掉，
    // 那是数据事故，页面不兜底
    if (c.kind === 'active' && c.cost) {
      if (c.cost.energy != null) { bump(byEnergy, 0, c.cost.energy); bump(energyByPath, p, c.cost.energy); }
      if (c.cost.cooldown != null) { bump(byCooldown, 0, c.cost.cooldown); bump(cooldownByPath, p, c.cost.cooldown); }
      if (c.cost.castTime != null) { bump(byCast, 0, c.cost.castTime); bump(castByPath, p, c.cost.castTime); }
    }
    if (c.gender) { bump(byGender, 0, c.gender); bump(genderByPath, p, c.gender); }
    // 构筑深度特征（复选维度，一张卡可占多项）：升级阶梯 / 变体 / 跨序列共享 / 次要目标
    const depthFeats = [];
    if (c.upgradeLadder) depthFeats.push('带升级阶梯');
    if (c.variants) depthFeats.push('带变体');
    if (c.sharedAcross) depthFeats.push('跨序列共享');
    if (c.secondaryTargets) depthFeats.push('带次要目标');
    for (const f of depthFeats) { bump(byDepth, 0, f); bump(depthByPath, p, f); }
    for (const t of c.tags || []) {
      tagsTotal.set(t, (tagsTotal.get(t) || 0) + 1);
    }
    // 距离 / 选靶 / 触发点三个维度的口径与同组的条形图逐字一致，别在这里换判据：
    // 选靶用 c.target 判存在（而不是 c.kind === 'active'）——有一张被动卡
    // （skill_prisoner_s6_corpse_handler）带 target，换个判据两张图会差 1，反而像 bug
    if (c.kind === 'active' && c.reach) bump(reachByPath, p, c.reach);
    if (c.target?.selectionMode) bump(selByPath, p, c.target.selectionMode);
    // 目标选择三件套（阵营 / 范围 / 排序）+ 选靶过滤键：口径与「选靶方式」组逐字一致——
    // 用 c.target 判存在（全库 570 主动卡全带 target，另有 1 张被动卡带 target）
    const rq = c.target?.request;
    if (rq?.faction) { bump(byFaction, 0, rq.faction); bump(factionByPath, p, rq.faction); }
    // 几何范围（scope）：2026-10-03 §10 几何化——scope 直接表达「取哪片区域」（围绕 anchor
    // 原点划定），缺省 whole_lane（见 schema unitRequest.scope）。与选数 pickCount 正交。
    // 显式带默认：约 511 张请求靠 schema 缺省 whole_lane、本身不落 scope 字段，须补默认才计入
    const sc = rq?.scope || 'whole_lane';
    bump(byScope, 0, sc); bump(scopeByPath, p, sc);
    if (c.target?.fallbackSort) { bump(bySort, 0, c.target.fallbackSort); bump(sortByPath, p, c.target.fallbackSort); }
    for (const k of Object.keys(rq?.filter || {})) {
      reqFilterTotal.set(k, (reqFilterTotal.get(k) || 0) + 1);
      bump(reqFilterByPath, p, k);
    }
    for (const h of hookEvents(c)) bump(hookByPath, p, h);
    // 每卡累计：复杂度（原语节点数）与数值预算（数值伤害加总）在 walk 里攒，走完再分桶
    let cardNodes = 0, cardDmg = 0;
    walkCardEffects(c, (n, kindOf) => {
      if (kindOf === 'op') {
        opTotal.set(n.op, (opTotal.get(n.op) || 0) + 1);
        bump(opByPath, p, n.op);
      } else {
        cardNodes++;
        primTotal.set(n.type, (primTotal.get(n.type) || 0) + 1);
        bump(primByPath, p, n.type);
        if (n.type === 'modify_stat' && n.stat) {
          statCount.set(n.stat, (statCount.get(n.stat) || 0) + 1);
          bump(statByPath, p, n.stat);
          if (n.mode) msModeTotal.set(n.mode, (msModeTotal.get(n.mode) || 0) + 1);
        }
        if (n.type === 'modify_resource' && n.resource) {
          resCount.set(n.resource, (resCount.get(n.resource) || 0) + 1);
          bump(resByPath, p, n.resource);
        }
        if (n.type === 'damage' && n.element) {
          elemCount.set(n.element, (elemCount.get(n.element) || 0) + 1);
          bump(elemByPath, p, n.element);
        }
        // 数值预算分子：数值伤害加总（9999 是即死占位，不参与预算）
        if (n.type === 'damage' && typeof n.value === 'number' && n.value !== 9999) {
          cardDmg += n.value;
        }
      }
      // 条件谓词（原语与 if/repeat 算子节点都带 condition）：「这张卡在什么情况下生效」
      if (n.condition?.kind) {
        condTotal.set(n.condition.kind, (condTotal.get(n.condition.kind) || 0) + 1);
        bump(condByPath, p, n.condition.kind);
      }
      // 位格承载（稀疏先行维度）：stat_compare(key=rank) 谓词 + modify_stat(rank)。
      // 位格没有独立卡面字段，承载全埋在效果节点里——零新谓词裁定（rank 走 stat_compare）
      if (n.condition?.kind === 'stat_compare' && n.condition.key === 'rank') {
        bump(rankByPath, p, 'stat_compare 谓词');
      }
      if (n.type === 'modify_stat' && n.stat === 'rank') {
        bump(rankByPath, p, 'modify_stat');
      }
    });
    // 复杂度分桶：每卡原语节点数（含状态载荷，同一原语多次计数）
    const cxKey = cardNodes <= 1 ? '1' : cardNodes <= 3 ? '2–3' : cardNodes <= 6 ? '4–6' : '7+';
    bump(byCx, 0, cxKey); bump(cxByPath, p, cxKey);
    // 数值预算分桶：只算带数值伤害的主动卡；energy=0 没有费用可比，跳过
    if (c.kind === 'active' && cardDmg > 0 && c.cost && c.cost.energy > 0) {
      const r = cardDmg / c.cost.energy;
      const bKey = r < 1 ? '<1' : r < 2 ? '1–2' : r < 3 ? '2–3' : r < 4 ? '3–4' : '≥4';
      bump(byBudget, 0, bKey); bump(budgetByPath, p, bKey);
    }
  }
  // 有序刻度（费用/冷却/吟唱）的 bar 行数据：上面为走 bump 统一成 行 0 的矩阵，
  // 这里摊平回 取值→计数
  const flat = (m) => m.get(0) || new Map();

  // 途径×原语热图（列按总用量降序，折叠取前 HEAT_TOP_COLS 列）
  // 存成 {key,label,title} 而不是裸 key 字符串：两张原语热图（绝对用量 + 行内占比）共用，
  // 传裸 key 给 heatPanel 不会报错——列头会渲染成空白、所有格子读 values.get(undefined) 得 0，
  // 于是「折起的 10 列合计 0%」，看上去像数据本来就空
  const primCols = [...primTotal.entries()].sort((a, b) => b[1] - a[1])
    .map(([t]) => ({ key: t, label: zh('primitive', t), title: t }));

  // ---- 组装件 ----
  // barChart 只产一串 .bar-row、不带 wrapper 也不带标题（见 charts.js），面板由调用方写
  const barPanel = (title, rows, extraHtml = '') =>
    `<div class="panel"><h2>${title}</h2>${extraHtml}${barChart(rows)}</div>`;

  // 一个维度一组。同组的 bar 与热图**列序同源**（都用 sortedRows / DB.rarityOrder）：
  // bar 从上到下的名次就是热图从左到右的列序，组内一眼能对上。别单独给某一侧换排序——
  // 两侧列序一旦不同，读者会以为「bar 第一项」和「热图第一列」说的是同一个东西
  const group = (title, ...panels) => `
    <section class="stat-group">
      <div class="stat-group-title">${escapeHtml(title)}</div>
      ${panels.join('')}
    </section>`;

  // 组标题是「面 · 维度」：面那一层沿用热图叠原先的读序（卡池结构 → 构件面 → 数值面 →
  // 目标面），维度用短名——面板自己的 h2 已经写了全名（如「modify_stat 属性分布」），
  // 组标题再写一遍就三处重复了
  const overview = group('总览',
    `<div class="panel"><h2>卡池总览</h2><dl class="kv">
      <dt>卡片总数</dt><dd class="num">${cards.length}</dd>
      <dt>途径</dt><dd class="num">${pathways.length}</dd>
      <dt>构筑轴</dt><dd class="num">${axisCount}</dd>
      <dt>主动 / 被动</dt><dd class="num">${byKind.get('active') || 0} / ${byKind.get('passive') || 0}</dd>
      <dt>旗舰卡</dt><dd class="num">${flagshipCount}</dd>
      <dt>带框架缺口</dt><dd class="num">${flagCards.length} 张 / ${flagCards.reduce((s, c) => s + openFlags(c).length, 0)} 条</dd>
      <dt>框架登记（已落地）</dt><dd class="num">${cards.reduce((s, c) => s + (c.frameworkFlags || []).filter((f) => f && f.landed === true).length, 0)} 条</dd>
      <dt>待拍板数值</dt><dd class="num">${cards.filter((c) => c.tentative).length} 张</dd>
    </dl></div>`,
    barPanel('各途径卡数', pathways.map((p) => ({ label: p.name, title: p.id, value: p.cardCount }))));

  // 列：一律现算，只有稀有度 / 序列是**有序刻度**、另有顺序。**列序就是窄屏折叠优先级**
  // （HEAT_TOP_COLS 与 app.css 的 :nth-child(n+11) 硬耦合），所以有序刻度要把最不重要的
  // 那一列排在末尾：序列传 9→0，折掉的正是 序列 0。orderNote 是提示语的措辞，得跟着这个
  // 顺序走——用量型维度的默认措辞「列用量最高的」用在这儿会与读者看到的列对不上
  const colsOf = (m, cat) => sortedRows(m, (k) => zh(cat, k))
    .map((r) => ({ key: r.title, label: r.label, title: r.title }));
  // 行：22 个途径**全在**，这一维一格都没有的途径留空行。行的清单是「途径」而不是
  // 「有数据的途径」——少一行，同一维度内与其他途径、以及相邻热图就对不上号了
  const rowsOf = (m) => pathways.map((p) => ({ head: p.name, values: m.get(p.id) || new Map() }));
  const heatOf = (title, m, cols, extra = {}) => heatPanel({
    title, cornerLabel: '途径', scopeLabel: '全库', cols, rows: rowsOf(m), ...extra,
  });

  const seqCols = [...Array(10)].map((_, i) => {
    const s = 9 - i;
    return { key: s, label: `序列 ${s}`, title: `序列 ${s}` };
  });
  const rarityCols = DB.rarityOrder.map((r) => ({ key: r, label: zh('rarity', r), title: r }));
  // 有序刻度列（费用 / 冷却 / 吟唱）：数值升序，折掉的是大数值端，提示语措辞跟着改。
  // 与状态页 scaleCols 同规则，本地一份是因为列格式（单位后缀）各组不同
  const scaleCols = (m, suffix) => [...new Set([...m.values()].flatMap((r) => [...r.keys()]))]
    .sort((a, b) => a - b)
    .map((k) => ({ key: k, label: `${k}${suffix}`, title: String(k) }));

  const rarityGroup = group('卡池结构 · 稀有度',
    barPanel('稀有度分布', DB.rarityOrder.map((r) => ({ label: zh('rarity', r), title: r, value: byRarity.get(r) || 0 }))),
    heatOf('途径 × 稀有度', rarityByPath, rarityCols, { unit: ' 张' }));

  const seqGroup = group('卡池结构 · 序列',
    barPanel('序列位阶分布', [...Array(10)].map((_, i) => 9 - i).map((s) => ({ label: `序列 ${s}`, value: bySeq.get(s) || 0 }))),
    heatOf('途径 × 序列', seqByPath, seqCols, { orderNote: '序列最高的 ', unit: ' 张' }));

  const kindGroup = group('卡池结构 · 卡型',
    barPanel('主动 / 被动', sortedRows(byKind, (k) => zh('cardKind', k))),
    heatOf('途径 × 卡型', kindByPath, colsOf(byKind, 'cardKind'), { unit: ' 张' }));

  const depthGroup = group('卡池结构 · 构筑深度',
    barPanel('构筑深度特征分布', sortedRows(flat(byDepth)),
      `<p class="panel-note muted">复选维度，一张卡可占多项：跨序列共享（sharedAcross）是同一张卡
      服务多个序列位阶的重复构件；升级阶梯 / 变体是卡内的数值档体系。</p>`),
    heatOf('途径 × 构筑深度特征', depthByPath,
      sortedRows(flat(byDepth)).map((r) => ({ key: r.title, label: r.label, title: r.title })),
      { unit: ' 张' }));

  // 构筑轴是封闭集（22 途径 × 4 = 88），标签带途径前缀消歧；轴的热图列有 88 个，
  // 折叠取前 9 列会碎成误导，所以本组只有 bar——途径内轴构成见 analysis_by_profession 文档
  const axisRows = [];
  for (const p of pathways) {
    const axes = DB.axesByPathway.get(p.id) || {};
    for (const [axId, def] of Object.entries(axes)) {
      const n = cards.filter((c) => c._pathway === p.id && c.axis === axId).length;
      axisRows.push({ label: `${p.name}·${def.name || axId}`, title: axId, value: n });
    }
  }
  axisRows.sort((a, b) => b.value - a.value);
  const axisGroup = group('卡池结构 · 构筑轴',
    barPanel('构筑轴卡数分布', axisRows,
      `<p class="panel-note muted">封闭集：每途径 4 轴、共 ${axisRows.length} 轴，标签 = 途径·轴名。
      不画热图——88 列折到前 9 列就碎了；途径内轴构成视角见
      docs/analysis/analysis_by_profession/ 各篇。</p>`));

  const declared = DB.declaredPrimitives.length;
  const primGroup = group('构件面 · 原语',
    barPanel('原语用量（卡面）', sortedRows(primTotal, (k) => zh('primitive', k)),
      `<p class="panel-note muted">本组只算卡面 effects：在用 ${primTotal.size} 条${declared ? ` / schema 声明 ${declared} 条` : ''}。
      状态定义（*.statuses.json）的效果见页末「状态定义面」一组。</p>`),
    heatOf('途径 × 原语 用量热图（卡面）', primByPath, primCols),
    // 构成跟着用量走：同一张热图的行内归一化版，读法不同（格内是 %）、但维度就是「原语」，
    // 另立一组反而要读者自己把两张对起来
    heatOf('途径 × 原语 构成（每行按该途径自己的原语总量归一化，格内为 %）', primByPath, primCols,
      { cellMode: 'share', orderNote: '按总用量降序的 ' }));

  const opGroup = group('构件面 · 算子',
    barPanel('算子用量', sortedRows(opTotal, (k) => zh('operator', k))),
    heatOf('途径 × 算子', opByPath, colsOf(opTotal, 'operator')));

  const condGrand = [...condTotal.values()].reduce((a, b) => a + b, 0);
  const condGroup = group('构件面 · 条件谓词',
    barPanel('条件谓词分布（condition.kind）', sortedRows(condTotal, (k) => zh('conditionKind', k)),
      `<p class="panel-note muted">效果节点的成立条件（原语自带 condition 与 if/repeat 算子的
      分支条件都算）：全库 ${condGrand} 处。has_status 一家占大半——「持有某状态时强化」
      是最常用的条件形态；chance 概率受随机性治理 R1–R6 约束（只用于非伤害维度、单次抽样）。</p>`),
    heatOf('途径 × 条件谓词', condByPath, colsOf(condTotal, 'conditionKind'), { unit: ' 处' }));

  const cxCols = ['1', '2–3', '4–6', '7+'].map((k) => ({ key: k, label: `${k} 个`, title: k }));
  const primGrand = [...primTotal.values()].reduce((a, b) => a + b, 0);
  const cxGrand = flat(byCx);
  const cxGroup = group('构件面 · 卡面复杂度',
    barPanel('每卡原语节点数分布', cxCols.map((c) => ({ label: c.label, title: c.title, value: cxGrand.get(c.key) || 0 })),
      `<p class="panel-note muted">一张卡 effects 树里的原语节点总数（含状态载荷，同一原语多次
      计数）：全库均值 ${(primGrand / cards.length).toFixed(1)}。这是单卡预算纪律
      （brief §1：≈3 能量 ≈ 6 伤害）的配套检视——7+ 节点的臃肿卡全库只有
      ${cxGrand.get('7+') || 0} 张。</p>`),
    heatOf('途径 × 卡面复杂度', cxByPath, cxCols, { unit: ' 张' }));

  const tagsGroup = group('构件面 · 卡面标签',
    barPanel('卡面标签 Top 20', sortedRows(new Map([...tagsTotal.entries()]
      .sort((a, b) => b[1] - a[1]).slice(0, 20))),
      `<p class="panel-note muted">tags 是自由词表而非封闭枚举：全库共 ${tagsTotal.size} 种
      / ${[...tagsTotal.values()].reduce((a, b) => a + b, 0)} 处（域 rulePatches 的 tag 匹配、
      条件谓词 target_has_tag 都消费它）。此处只列前 20 种，不画热图——长尾词表的热图全是空格。</p>`));

  const statGroup = group('数值面 · 属性（modify_stat）',
    barPanel('modify_stat 属性分布', sortedRows(statCount, (k) => zh('stat', k))),
    barPanel('modify_stat 改写方式（mode）', sortedRows(msModeTotal, (k) => zh('statMode', k)),
      `<p class="panel-note muted">delta 增减是绝对主流；mul 乘算只有 ${msModeTotal.get('mul') || 0} 处——
      属性乘区刻意稀缺，乘区主要由 modify_damage（dealt/taken）承载，防止增伤叠乘失控。</p>`),
    heatOf('途径 × modify_stat 属性', statByPath, colsOf(statCount, 'stat')));

  const resGroup = group('数值面 · 资源（modify_resource）',
    barPanel('modify_resource 资源分布', sortedRows(resCount, (k) => zh('resource', k))),
    heatOf('途径 × modify_resource 资源', resByPath, colsOf(resCount, 'resource')));

  const elemGroup = group('数值面 · 伤害元素',
    barPanel('伤害元素分布', sortedRows(elemCount, (k) => zh('element', k))),
    heatOf('途径 × 伤害元素', elemByPath, colsOf(elemCount, 'element')));

  // 数值预算：伤害费用比，锚点 brief §1「≈3 能量 ≈ 6 伤害」→ 2.0 伤/能为预算线
  const budgetCols = ['<1', '1–2', '2–3', '3–4', '≥4'].map((k) => ({ key: k, label: `${k} 伤/能`, title: k }));
  const budgetGrand = flat(byBudget);
  const budgetCards = [...budgetGrand.values()].reduce((a, b) => a + b, 0);
  const budgetGroup = group('数值面 · 数值预算（伤害/能量）',
    barPanel('伤害费用比分桶（主动卡）', budgetCols.map((c) => ({ label: c.label, title: c.title, value: budgetGrand.get(c.key) || 0 })),
      `<p class="panel-note muted">口径：卡面全部数值伤害节点加总（含多段与分支，剔除 9999 即死
      占位）÷ cost.energy，按商分桶。锚点 brief §1：≈3 能量 ≈ 6 伤害 → 2.0 伤/能是预算线。
      只统计带数值伤害的主动卡（共 ${budgetCards} 张）；持续伤害（mount_status 载荷）、
      非数值伤害（按属性换算的）不计入分子，所以这是保守下界。</p>`),
    heatOf('途径 × 伤害费用比（只算带数值伤害的主动卡）', budgetByPath, budgetCols, { unit: ' 张' }));

  const energyGroup = group('费用面 · 能量（cost.energy）',
    barPanel('能量费用分布（主动卡，有序刻度）', sortedRows(flat(byEnergy), (k) => `${k} 能`, { byKey: true })),
    heatOf('途径 × 能量费用（只算主动卡）', energyByPath, scaleCols(energyByPath, ' 能'),
      { unit: ' 张', orderNote: '数值最小的 ' }));

  const cooldownGroup = group('费用面 · 冷却（cost.cooldown）',
    barPanel('冷却分布（主动卡，有序刻度）', sortedRows(flat(byCooldown), (k) => `${k} tick`, { byKey: true }),
      `<p class="panel-note muted">冷却以 tick 计时（与吟唱同单位）；0 tick = 无冷却（一次性或被动触发类）。</p>`),
    heatOf('途径 × 冷却（只算主动卡）', cooldownByPath, scaleCols(cooldownByPath, ' tick'),
      { unit: ' 张', orderNote: '数值最小的 ' }));

  const castGroup = group('费用面 · 吟唱（cost.castTime）',
    barPanel('吟唱分布（主动卡，有序刻度）', sortedRows(flat(byCast), (k) => (k ? `${k} tick` : '瞬发（0）'), { byKey: true }),
      `<p class="panel-note muted">brief §13：序列 7–5 即时技能默认 0（瞬发）不标；序列 4 以上
      或仪式类必标。可被「免吟唱」免除、被控制打断。</p>`),
    heatOf('途径 × 吟唱（只算主动卡）', castByPath, scaleCols(castByPath, ' tick'),
      { unit: ' 张', orderNote: '数值最小的 ' }));

  // rank 的行数据直接按途径 bump（与其他热图一致），bar 需先摊平成全库计数
  const rankFlat = new Map();
  for (const r of rankByPath.values()) for (const [k, v] of r) rankFlat.set(k, (rankFlat.get(k) || 0) + v);
  const rankGroup = group('数值面 · 位格（rank）',
    barPanel('位格承载分布', sortedRows(rankFlat),
      `<p class="panel-note muted">位格没有独立卡面字段（零新谓词裁定：rank 走 stat_compare），
      承载全埋在效果节点里——当前全库仅 ${[...rankFlat.values()].reduce((a, b) => a + b, 0)} 处，
      是「能力先行」的稀疏维度，等位格体系铺卡后会涨。</p>`),
    heatOf('途径 × 位格承载', rankByPath,
      sortedRows(rankFlat).map((r) => ({ key: r.title, label: r.label, title: r.title }))));

  const reachGroup = group('目标面 · 攻击距离',
    barPanel('攻击距离（主动卡）', sortedRows(byReach, (k) => zh('reach', k))),
    heatOf('途径 × 攻击距离（只算主动卡）', reachByPath, colsOf(byReach, 'reach'), { unit: ' 张' }));

  const selGroup = group('目标面 · 选靶方式',
    barPanel('选靶方式', sortedRows(bySel, (k) => zh('selectionMode', k))),
    heatOf('途径 × 选靶方式（只算有 target 的卡）', selByPath, colsOf(bySel, 'selectionMode'), { unit: ' 张' }));

  const factionGroup = group('目标面 · 目标阵营',
    barPanel('目标阵营（request.faction）', sortedRows(flat(byFaction), (k) => zh('faction', k)),
      `<p class="panel-note muted">口径与「选靶方式」组一致：有 target 即算（含 1 张被动卡）。
      self 占比如此之高，是大量自保/变身类主动卡的选靶写 self。</p>`),
    heatOf('途径 × 目标阵营', factionByPath, colsOf(flat(byFaction), 'faction'), { unit: ' 张' }));

  const scopeGroup = group('目标面 · 几何范围（scope）',
    barPanel('几何范围分布（request.scope）', sortedRows(flat(byScope), (k) => zh('scope', k)),
      `<p class="panel-note muted">2026-10-03 §10 几何化：scope 直接表达<b>取哪片区域</b>
      （围绕 anchor 原点划定），与选数 pickCount 正交，二者是选靶流水线的两个独立层。
      取值域：point / front_n / behind_n / cross_lane / diamond_n / whole_lane / board / none
      （中文见 glossary scope 栏目）。<b>缺省 whole_lane</b>（被施法侧半场 4 格）——约 511 张请求
      不落 scope 字段、靠此缺省，故 bar 里 whole_lane 占比最高是预期。laneRef 维度已并入 scope
      （几何化后无独立的「扫描路线」——「整路 / 全场 / 跨路」本就是 scope 枚举值），旧「扫描路线 /
      范围形状（scope×laneRef）」两组面板已移除。</p>`),
    heatOf('途径 × 几何范围', scopeByPath, colsOf(flat(byScope), 'scope'), { unit: ' 张' }));

  const sortGroup = group('目标面 · 选靶排序',
    barPanel('fallbackSort 分布', sortedRows(flat(bySort), (k) => zh('sortKey', k)),
      `<p class="panel-note muted">auto（自动选靶）卡的选中排序；manual 卡带它时是并列目标的决选序。
      键语义见词典 sortKey 栏目（hp_asc = 最残优先 之类）。</p>`),
    heatOf('途径 × 选靶排序', sortByPath, colsOf(flat(bySort), 'sortKey'), { unit: ' 张' }));

  const reqFilterGroup = group('目标面 · 选靶过滤',
    barPanel('request.filter 过滤键', sortedRows(reqFilterTotal),
      `<p class="panel-note muted">选靶约束的过滤键（自由键名，非封闭枚举）：全库
      ${[...reqFilterTotal.values()].reduce((a, b) => a + b, 0)} 处 / ${reqFilterTotal.size} 种——
      hasStatus / unitType / isSummon / casterOwned 等，是「精确指向某类单位」的结构化承载。
      稀疏，不画热图。</p>`));

  const hookGroup = group('目标面 · 被动触发点',
    barPanel('被动触发点分布', sortedRows(byHook, (k) => zh('triggerEvent', k))),
    heatOf('途径 × 被动触发点（只算被动卡）', hookByPath, colsOf(byHook, 'triggerEvent'), { unit: ' 张' }));

  const genderGroup = group('身份面 · 性别',
    barPanel('卡级 gender 字段分布', sortedRows(flat(byGender), (k) => zh('gender', k)),
      `<p class="panel-note muted">gender_shift / gender_is 谓词当前零使用；卡级字段也仅
      ${[...flat(byGender).values()].reduce((a, b) => a + b, 0)} 张标注——性别机制已登记（v0.3），
      等第一批承载卡。</p>`),
    heatOf('途径 × 性别', genderByPath, colsOf(flat(byGender), 'gender'), { unit: ' 张' }));

  // 导语放在页面顶部而不是某一组里：口径两族、色阶独立这两条对 bar 与热图都成立
  view.innerHTML = `<p class="panel-note muted">本页<b>一个维度一组</b>：组内先全库 bar、再该维度的「途径 × 维度」热图。
    热图共用一套读法——行 = ${pathways.length} 个途径，列 = 该维度的取值，格 = 计数
    （只有「原语 构成」那张是行内归一化后的 %）。同组的 bar 与热图<b>口径相同</b>：bar 各段之和
    = 该组热图各行的合计；跨组不是一回事——属性 / 资源 / 元素 / 算子 / 原语 / 位格 / 条件谓词按<b>效果节点</b>计，
    稀有度 / 序列 / 卡型 / 费用 / 冷却 / 吟唱 / 性别 / 构筑深度 / 卡面复杂度 / 数值预算按<b>卡</b>计。每张图的色阶各自独立
    （上限取本图最大值），跨图比颜色没有意义——要比就比格内数字。行序一律是 manifest 途径顺序；
    列序是各自的用量或刻度顺序，悬停表头看原始 key。状态定义口径见「状态」子页，编目三池
    （召唤物 / 区域 / 界域）见各自子页——本页各组均不含它们。</p>
    ${overview}${rarityGroup}${seqGroup}${kindGroup}${depthGroup}${axisGroup}${primGroup}${opGroup}${condGroup}${cxGroup}${tagsGroup}${statGroup}${resGroup}${elemGroup}${budgetGroup}${energyGroup}${cooldownGroup}${castGroup}${rankGroup}${reachGroup}${selGroup}${factionGroup}${scopeGroup}${sortGroup}${reqFilterGroup}${hookGroup}${genderGroup}`;

  // 窄屏展开全部列；桌面端该开关不显示（CSS 隐藏），勾选状态无副作用
  wireHeatToggle(view);
}
