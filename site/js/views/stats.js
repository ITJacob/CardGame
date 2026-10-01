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
import { DB, statusesReady, onStatusesReady } from '../data.js';
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
  const byHook = countBy(cards.filter((c) => c.hook), (c) => c.hook);
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
  const bump = (m, row, col) => {
    let r = m.get(row);
    if (!r) { r = new Map(); m.set(row, r); }
    r.set(col, (r.get(col) || 0) + 1);
  };
  // 热图的行数据：pathwayId -> Map(维度取值 -> 计数)
  const rarityByPath = new Map(), seqByPath = new Map(), reachByPath = new Map(),
        selByPath = new Map(), hookByPath = new Map(), statByPath = new Map(),
        resByPath = new Map(), elemByPath = new Map(), opByPath = new Map(),
        kindByPath = new Map(), energyByPath = new Map(), cdByPath = new Map(),
        castByPath = new Map(), rankByPath = new Map(), genderByPath = new Map(),
        depthByPath = new Map();
  const byEnergy = new Map(), byCd = new Map(), byCast = new Map(),
        byGender = new Map(), byDepth = new Map(), tagsTotal = new Map();
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
      if (c.cost.cooldown != null) { bump(byCd, 0, c.cost.cooldown); bump(cdByPath, p, c.cost.cooldown); }
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
      // 位格承载（稀疏先行维度）：stat_compare(key=rank) 谓词 + modify_stat(rank)。
      // 位格没有独立卡面字段，承载全埋在效果节点里——零新谓词裁定（rank 走 stat_compare）
      if (n.condition?.kind === 'stat_compare' && n.condition.key === 'rank') {
        bump(rankByPath, p, 'stat_compare 谓词');
      }
      if (n.type === 'modify_stat' && n.stat === 'rank') {
        bump(rankByPath, p, 'modify_stat');
      }
    });
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

  const tagsGroup = group('构件面 · 卡面标签',
    barPanel('卡面标签 Top 20', sortedRows(new Map([...tagsTotal.entries()]
      .sort((a, b) => b[1] - a[1]).slice(0, 20))),
      `<p class="panel-note muted">tags 是自由词表而非封闭枚举：全库共 ${tagsTotal.size} 种
      / ${[...tagsTotal.values()].reduce((a, b) => a + b, 0)} 处（域 rulePatches 的 tag 匹配、
      条件谓词 target_has_tag 都消费它）。此处只列前 20 种，不画热图——长尾词表的热图全是空格。</p>`));

  const statGroup = group('数值面 · 属性（modify_stat）',
    barPanel('modify_stat 属性分布', sortedRows(statCount, (k) => zh('stat', k))),
    heatOf('途径 × modify_stat 属性', statByPath, colsOf(statCount, 'stat')));

  const resGroup = group('数值面 · 资源（modify_resource）',
    barPanel('modify_resource 资源分布', sortedRows(resCount, (k) => zh('resource', k))),
    heatOf('途径 × modify_resource 资源', resByPath, colsOf(resCount, 'resource')));

  const elemGroup = group('数值面 · 伤害元素',
    barPanel('伤害元素分布', sortedRows(elemCount, (k) => zh('element', k))),
    heatOf('途径 × 伤害元素', elemByPath, colsOf(elemCount, 'element')));

  const energyGroup = group('费用面 · 能量（cost.energy）',
    barPanel('能量费用分布（主动卡，有序刻度）', sortedRows(flat(byEnergy), (k) => `${k} 能`, { byKey: true })),
    heatOf('途径 × 能量费用（只算主动卡）', energyByPath, scaleCols(energyByPath, ' 能'),
      { unit: ' 张', orderNote: '数值最小的 ' }));

  const cdGroup = group('费用面 · 冷却（cost.cooldown）',
    barPanel('冷却分布（主动卡，有序刻度）', sortedRows(flat(byCd), (k) => `${k} cd`, { byKey: true }),
      `<p class="panel-note muted">cd 0 = 无冷却（一次性或被动触发类）。</p>`),
    heatOf('途径 × 冷却（只算主动卡）', cdByPath, scaleCols(cdByPath, ' cd'),
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
    = 该组热图各行的合计；跨组不是一回事——属性 / 资源 / 元素 / 算子 / 原语 / 位格按<b>效果节点</b>计，
    稀有度 / 序列 / 卡型 / 费用 / 冷却 / 吟唱 / 性别 / 构筑深度按<b>卡</b>计。每张图的色阶各自独立
    （上限取本图最大值），跨图比颜色没有意义——要比就比格内数字。行序一律是 manifest 途径顺序；
    列序是各自的用量或刻度顺序，悬停表头看原始 key。状态定义口径见「状态」子页，编目三池
    （召唤物 / 区域 / 界域）见各自子页——本页各组均不含它们。</p>
    ${overview}${rarityGroup}${seqGroup}${kindGroup}${depthGroup}${primGroup}${opGroup}${tagsGroup}${statGroup}${resGroup}${elemGroup}${energyGroup}${cdGroup}${castGroup}${rankGroup}${reachGroup}${selGroup}${hookGroup}${genderGroup}`;

  // 窄屏展开全部列；桌面端该开关不显示（CSS 隐藏），勾选状态无副作用
  wireHeatToggle(view);
}
